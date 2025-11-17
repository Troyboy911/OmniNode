import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { logger } from '../../config/logger';
import { VaultConfig, SecretItem, EncryptedVault, EnvScope } from './types';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const SALT_LENGTH = 32;
const AUTH_TAG_LENGTH = 16;

export class VaultService {
  private vaultDir: string;
  private masterKey: Buffer | null = null;

  constructor(private config: VaultConfig) {
    this.vaultDir = config.vaultDir || join(process.cwd(), '.vault');
    this.ensureVaultDir();
  }

  private ensureVaultDir(): void {
    if (!existsSync(this.vaultDir)) {
      mkdirSync(this.vaultDir, { recursive: true, mode: 0o700 });
      logger.info('Vault directory created', { path: this.vaultDir });
    }
  }

  /**
   * Initialize vault with new master key
   */
  async initializeMasterKey(): Promise<string> {
    const masterKeyRaw = randomBytes(KEY_LENGTH);
    const masterKeyHex = masterKeyRaw.toString('hex');
    
    // Store encrypted master key with password
    if (this.config.password) {
      const salt = randomBytes(SALT_LENGTH);
      const key = scryptSync(this.config.password, salt, KEY_LENGTH);
      const iv = randomBytes(IV_LENGTH);
      const cipher = createCipheriv(ALGORITHM, key, iv);
      
      let encrypted = cipher.update(masterKeyRaw);
      encrypted = Buffer.concat([encrypted, cipher.final()]);
      const authTag = cipher.getAuthTag();
      
      const masterKeyFile = {
        salt: salt.toString('hex'),
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex'),
        encrypted: encrypted.toString('hex'),
        algorithm: ALGORITHM,
        createdAt: new Date().toISOString(),
      };
      
      const masterKeyPath = join(this.vaultDir, 'master.key');
      writeFileSync(masterKeyPath, JSON.stringify(masterKeyFile, null, 2), { mode: 0o600 });
      logger.info('Master key initialized and encrypted');
    }
    
    this.masterKey = masterKeyRaw;
    return masterKeyHex;
  }

  /**
   * Load master key from encrypted file
   */
  async loadMasterKey(): Promise<void> {
    if (!this.config.password) {
      throw new Error('Password required to load master key');
    }

    const masterKeyPath = join(this.vaultDir, 'master.key');
    if (!existsSync(masterKeyPath)) {
      throw new Error('Master key not found. Run vault:setup first.');
    }

    const masterKeyFile = JSON.parse(readFileSync(masterKeyPath, 'utf-8'));
    const salt = Buffer.from(masterKeyFile.salt, 'hex');
    const iv = Buffer.from(masterKeyFile.iv, 'hex');
    const authTag = Buffer.from(masterKeyFile.authTag, 'hex');
    const encrypted = Buffer.from(masterKeyFile.encrypted, 'hex');

    const key = scryptSync(this.config.password, salt, KEY_LENGTH);
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    this.masterKey = decrypted;
    logger.info('Master key loaded successfully');
  }

  /**
   * Encrypt a secret value
   */
  private encrypt(value: string): { encrypted: string; iv: string; authTag: string } {
    if (!this.masterKey) {
      throw new Error('Master key not loaded');
    }

    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, this.masterKey, iv);

    let encrypted = cipher.update(value, 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    const authTag = cipher.getAuthTag();

    return {
      encrypted: encrypted.toString('hex'),
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
    };
  }

  /**
   * Decrypt a secret value
   */
  private decrypt(encrypted: string, iv: string, authTag: string): string {
    if (!this.masterKey) {
      throw new Error('Master key not loaded');
    }

    const decipher = createDecipheriv(
      ALGORITHM,
      this.masterKey,
      Buffer.from(iv, 'hex')
    );
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));

    let decrypted = decipher.update(Buffer.from(encrypted, 'hex'));
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString('utf8');
  }

  /**
   * Get vault file path for environment
   */
  private getVaultPath(env: EnvScope): string {
    return join(this.vaultDir, `${env}.vault.json`);
  }

  /**
   * Set a secret
   */
  async setSecret(key: string, value: string, env: EnvScope = 'dev'): Promise<void> {
    const encrypted = this.encrypt(value);
    const vaultPath = this.getVaultPath(env);

    let vault: EncryptedVault = { secrets: {}, updatedAt: new Date().toISOString() };
    if (existsSync(vaultPath)) {
      vault = JSON.parse(readFileSync(vaultPath, 'utf-8'));
    }

    vault.secrets[key] = {
      key,
      encrypted: encrypted.encrypted,
      iv: encrypted.iv,
      authTag: encrypted.authTag,
      updatedAt: new Date().toISOString(),
    };
    vault.updatedAt = new Date().toISOString();

    writeFileSync(vaultPath, JSON.stringify(vault, null, 2), { mode: 0o600 });
    logger.info('Secret stored', { key, env, redacted: true });
  }

  /**
   * Get a secret
   */
  async getSecret(key: string, env: EnvScope = 'dev'): Promise<string | null> {
    const vaultPath = this.getVaultPath(env);
    if (!existsSync(vaultPath)) {
      return null;
    }

    const vault: EncryptedVault = JSON.parse(readFileSync(vaultPath, 'utf-8'));
    const secret = vault.secrets[key];

    if (!secret) {
      return null;
    }

    const decrypted = this.decrypt(secret.encrypted, secret.iv, secret.authTag);
    return decrypted;
  }

  /**
   * List all secret keys (not values) in an environment
   */
  async listSecrets(env: EnvScope = 'dev'): Promise<string[]> {
    const vaultPath = this.getVaultPath(env);
    if (!existsSync(vaultPath)) {
      return [];
    }

    const vault: EncryptedVault = JSON.parse(readFileSync(vaultPath, 'utf-8'));
    return Object.keys(vault.secrets);
  }

  /**
   * Get all secrets decrypted
   */
  async getAllSecrets(env: EnvScope = 'dev'): Promise<Record<string, string>> {
    const vaultPath = this.getVaultPath(env);
    if (!existsSync(vaultPath)) {
      return {};
    }

    const vault: EncryptedVault = JSON.parse(readFileSync(vaultPath, 'utf-8'));
    const secrets: Record<string, string> = {};

    for (const [key, secret] of Object.entries(vault.secrets)) {
      secrets[key] = this.decrypt(secret.encrypted, secret.iv, secret.authTag);
    }

    return secrets;
  }

  /**
   * Import secrets from .env file
   */
  async importFromEnv(envPath: string, env: EnvScope = 'dev'): Promise<number> {
    if (!existsSync(envPath)) {
      throw new Error(`Env file not found: ${envPath}`);
    }

    const envContent = readFileSync(envPath, 'utf-8');
    const lines = envContent.split('\n');
    let imported = 0;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const match = trimmed.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (match) {
        const [, key, value] = match;
        // Remove quotes if present
        const cleanValue = value.replace(/^["']|["']$/g, '');
        await this.setSecret(key, cleanValue, env);
        imported++;
      }
    }

    logger.info('Secrets imported from env file', { count: imported, env });
    return imported;
  }

  /**
   * Rotate all secrets (re-encrypt with new master key)
   */
  async rotateSecrets(env: EnvScope = 'dev'): Promise<void> {
    const secrets = await this.getAllSecrets(env);
    
    // Generate new master key
    await this.initializeMasterKey();
    
    // Re-encrypt all secrets
    for (const [key, value] of Object.entries(secrets)) {
      await this.setSecret(key, value, env);
    }

    logger.info('Secrets rotated', { count: Object.keys(secrets).length, env });
  }

  /**
   * Delete a secret
   */
  async deleteSecret(key: string, env: EnvScope = 'dev'): Promise<boolean> {
    const vaultPath = this.getVaultPath(env);
    if (!existsSync(vaultPath)) {
      return false;
    }

    const vault: EncryptedVault = JSON.parse(readFileSync(vaultPath, 'utf-8'));
    if (!vault.secrets[key]) {
      return false;
    }

    delete vault.secrets[key];
    vault.updatedAt = new Date().toISOString();

    writeFileSync(vaultPath, JSON.stringify(vault, null, 2), { mode: 0o600 });
    logger.info('Secret deleted', { key, env });
    return true;
  }

  /**
   * Export secrets to .env format (DANGEROUS - use carefully)
   */
  async exportToEnv(env: EnvScope = 'dev'): Promise<string> {
    const secrets = await this.getAllSecrets(env);
    const lines: string[] = [];

    for (const [key, value] of Object.entries(secrets)) {
      // Escape quotes and newlines
      const escaped = value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
      lines.push(`${key}="${escaped}"`);
    }

    return lines.join('\n');
  }
}
