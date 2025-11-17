export type EnvScope = 'dev' | 'staging' | 'prod';
export type SyncTarget = 'github' | 'cloudflare' | 'airtable' | 'local';

export interface VaultConfig {
  vaultDir?: string;
  password?: string;
  airtableApiKey?: string;
  airtableBaseId?: string;
}

export interface SecretItem {
  key: string;
  encrypted: string;
  iv: string;
  authTag: string;
  updatedAt: string;
  metadata?: Record<string, any>;
}

export interface EncryptedVault {
  secrets: Record<string, SecretItem>;
  updatedAt: string;
  version?: string;
}

export interface SyncResult {
  target: SyncTarget;
  success: boolean;
  synced: number;
  failed: number;
  errors?: string[];
}

export interface VaultStats {
  totalSecrets: number;
  lastUpdated: string;
  environments: EnvScope[];
}
