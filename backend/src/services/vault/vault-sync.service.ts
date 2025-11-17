import { execSync } from 'child_process';
import Airtable from 'airtable';
import { logger } from '../../config/logger';
import { VaultService } from './vault.service';
import { EnvScope, SyncResult, SyncTarget } from './types';

export class VaultSyncService {
  constructor(private vaultService: VaultService) {}

  /**
   * Sync secrets to multiple targets
   */
  async syncSecrets(
    targets: SyncTarget[],
    env: EnvScope = 'dev'
  ): Promise<SyncResult[]> {
    const results: SyncResult[] = [];

    for (const target of targets) {
      try {
        let result: SyncResult;
        
        switch (target) {
          case 'github':
            result = await this.syncToGitHub(env);
            break;
          case 'cloudflare':
            result = await this.syncToCloudflare(env);
            break;
          case 'airtable':
            result = await this.syncToAirtable(env);
            break;
          case 'local':
            result = await this.syncToLocal(env);
            break;
          default:
            result = {
              target,
              success: false,
              synced: 0,
              failed: 0,
              errors: [`Unknown target: ${target}`],
            };
        }
        
        results.push(result);
      } catch (error) {
        results.push({
          target,
          success: false,
          synced: 0,
          failed: 0,
          errors: [error.message],
        });
      }
    }

    return results;
  }

  /**
   * Sync to GitHub Actions secrets
   */
  private async syncToGitHub(env: EnvScope): Promise<SyncResult> {
    const secrets = await this.vaultService.getAllSecrets(env);
    const githubToken = process.env.GITHUB_TOKEN || secrets.GITHUB_TOKEN;
    
    if (!githubToken) {
      return {
        target: 'github',
        success: false,
        synced: 0,
        failed: 0,
        errors: ['GITHUB_TOKEN not found'],
      };
    }

    let synced = 0;
    let failed = 0;
    const errors: string[] = [];

    // Get repo info from git remote
    let repoFullName: string;
    try {
      const remoteUrl = execSync('git config --get remote.origin.url', {
        encoding: 'utf-8',
      }).trim();
      
      // Parse GitHub repo from URL
      const match = remoteUrl.match(/github\.com[:/](.+?)(?:\.git)?$/);
      if (match) {
        repoFullName = match[1];
      } else {
        throw new Error('Could not parse GitHub repo from remote URL');
      }
    } catch (error) {
      return {
        target: 'github',
        success: false,
        synced: 0,
        failed: 0,
        errors: ['Could not determine GitHub repository'],
      };
    }

    // Map environment scope to GitHub environment name
    const envMap: Record<EnvScope, string> = {
      dev: 'development',
      staging: 'staging',
      prod: 'production',
    };
    const githubEnv = envMap[env];

    for (const [key, value] of Object.entries(secrets)) {
      // Skip internal vault keys
      if (key === 'ENCRYPTION_MASTER_KEY' || key === 'GITHUB_TOKEN') {
        continue;
      }

      try {
        // Use gh CLI to set secret
        const command = `gh secret set ${key} --env ${githubEnv} --body "${value.replace(/"/g, '\\"')}" --repo ${repoFullName}`;
        execSync(command, {
          stdio: 'pipe',
          env: { ...process.env, GH_TOKEN: githubToken },
        });
        synced++;
        logger.debug('Synced secret to GitHub', { key, env: githubEnv });
      } catch (error) {
        failed++;
        errors.push(`${key}: ${error.message}`);
        logger.error('Failed to sync secret to GitHub', { key, error: error.message });
      }
    }

    return {
      target: 'github',
      success: failed === 0,
      synced,
      failed,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * Sync to Cloudflare Workers secrets
   */
  private async syncToCloudflare(env: EnvScope): Promise<SyncResult> {
    const secrets = await this.vaultService.getAllSecrets(env);
    
    let synced = 0;
    let failed = 0;
    const errors: string[] = [];

    // Cloudflare environment mapping
    const cfEnvMap: Record<EnvScope, string> = {
      dev: 'development',
      staging: 'staging',
      prod: 'production',
    };
    const cfEnv = cfEnvMap[env];

    for (const [key, value] of Object.entries(secrets)) {
      // Skip keys not needed in Workers
      if (key === 'ENCRYPTION_MASTER_KEY') {
        continue;
      }

      try {
        // Use wrangler CLI to set secret
        const command = `wrangler secret put ${key} --env ${cfEnv}`;
        execSync(command, {
          input: value,
          stdio: ['pipe', 'pipe', 'pipe'],
        });
        synced++;
        logger.debug('Synced secret to Cloudflare', { key, env: cfEnv });
      } catch (error) {
        failed++;
        errors.push(`${key}: ${error.message}`);
        logger.error('Failed to sync secret to Cloudflare', { key, error: error.message });
      }
    }

    return {
      target: 'cloudflare',
      success: failed === 0,
      synced,
      failed,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * Sync to Airtable (encrypted backup)
   */
  private async syncToAirtable(env: EnvScope): Promise<SyncResult> {
    const secrets = await this.vaultService.getAllSecrets(env);
    const apiKey = process.env.AIRTABLE_API_KEY || secrets.AIRTABLE_API_KEY;
    const baseId = process.env.AIRTABLE_BASE_ID || secrets.AIRTABLE_BASE_ID;
    
    if (!apiKey || !baseId) {
      return {
        target: 'airtable',
        success: false,
        synced: 0,
        failed: 0,
        errors: ['AIRTABLE_API_KEY or AIRTABLE_BASE_ID not found'],
      };
    }

    const airtable = new Airtable({ apiKey }).base(baseId);
    let synced = 0;
    let failed = 0;
    const errors: string[] = [];

    try {
      // Get existing records
      const existing = await airtable('Secrets')
        .select({ filterByFormula: `{Environment} = '${env}'` })
        .all();

      const existingMap = new Map(
        existing.map(r => [r.get('Key') as string, r.id])
      );

      for (const [key, value] of Object.entries(secrets)) {
        try {
          const recordId = existingMap.get(key);
          const fields = {
            Key: key,
            Value: value, // Still encrypted from vault
            Environment: env,
            UpdatedAt: new Date().toISOString(),
          };

          if (recordId) {
            await airtable('Secrets').update(recordId, fields);
          } else {
            await airtable('Secrets').create(fields);
          }
          
          synced++;
          logger.debug('Synced secret to Airtable', { key, env });
        } catch (error) {
          failed++;
          errors.push(`${key}: ${error.message}`);
          logger.error('Failed to sync secret to Airtable', { key, error: error.message });
        }
      }
    } catch (error) {
      return {
        target: 'airtable',
        success: false,
        synced: 0,
        failed: 0,
        errors: [error.message],
      };
    }

    return {
      target: 'airtable',
      success: failed === 0,
      synced,
      failed,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * Export to local .env file
   */
  private async syncToLocal(env: EnvScope): Promise<SyncResult> {
    try {
      const envContent = await this.vaultService.exportToEnv(env);
      const fs = await import('fs/promises');
      const path = await import('path');
      
      const envFile = path.join(process.cwd(), `.env.${env}`);
      await fs.writeFile(envFile, envContent, { mode: 0o600 });
      
      const secretCount = envContent.split('\n').length;
      
      logger.info('Exported secrets to local env file', { file: envFile, count: secretCount });
      
      return {
        target: 'local',
        success: true,
        synced: secretCount,
        failed: 0,
      };
    } catch (error) {
      return {
        target: 'local',
        success: false,
        synced: 0,
        failed: 0,
        errors: [error.message],
      };
    }
  }
}
