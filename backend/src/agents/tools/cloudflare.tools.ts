import { execSync } from 'child_process';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { ToolExecutionContext, ToolResult } from './types';

export class CloudflareTools {
  static async deployWorker(params: any, context: ToolExecutionContext): Promise<ToolResult> {
    const start = Date.now();
    const { name, script, env = 'production', secrets = {} } = params;
    const tempDir = join(context.sandboxPath, 'cf-deploy', name);

    try {
      // Create temp directory
      if (!existsSync(tempDir)) {
        mkdirSync(tempDir, { recursive: true });
      }

      // Write worker script
      const scriptPath = join(tempDir, 'index.js');
      writeFileSync(scriptPath, script);

      // Write wrangler.toml
      const wranglerConfig = `
name = "${name}"
main = "index.js"
compatibility_date = "2024-01-01"
account_id = "${context.secrets.CLOUDFLARE_ACCOUNT_ID || ''}"

[env.${env}]
name = "${name}-${env}"
`;
      writeFileSync(join(tempDir, 'wrangler.toml'), wranglerConfig);

      // Set secrets if provided
      for (const [key, value] of Object.entries(secrets)) {
        try {
          execSync(`wrangler secret put ${key} --env ${env}`, {
            cwd: tempDir,
            input: value as string,
            env: {
              ...process.env,
              CLOUDFLARE_API_TOKEN: context.secrets.CLOUDFLARE_API_TOKEN,
            },
            stdio: ['pipe', 'pipe', 'pipe'],
          });
        } catch (err) {
          console.error(`Failed to set secret ${key}:`, err.message);
        }
      }

      // Deploy
      const deployOutput = execSync(`wrangler deploy --env ${env}`, {
        cwd: tempDir,
        encoding: 'utf-8',
        env: {
          ...process.env,
          CLOUDFLARE_API_TOKEN: context.secrets.CLOUDFLARE_API_TOKEN,
        },
      });

      // Parse deployment URL from output
      const urlMatch = deployOutput.match(/https:\/\/[^\s]+/);
      const url = urlMatch ? urlMatch[0] : null;

      return {
        success: true,
        data: {
          name,
          env,
          url,
          deployOutput: deployOutput.split('\n').slice(-5).join('\n'),
        },
        logs: [deployOutput],
        timestamp: new Date().toISOString(),
        duration: Date.now() - start,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        logs: [error.stderr || error.message],
        timestamp: new Date().toISOString(),
        duration: Date.now() - start,
      };
    }
  }

  static async kvWrite(params: any, context: ToolExecutionContext): Promise<ToolResult> {
    const start = Date.now();
    const { namespace, key, value } = params;

    try {
      execSync(
        `wrangler kv:key put --namespace-id=${namespace} "${key}" "${value}"`,
        {
          env: {
            ...process.env,
            CLOUDFLARE_API_TOKEN: context.secrets.CLOUDFLARE_API_TOKEN,
          },
          encoding: 'utf-8',
        }
      );

      return {
        success: true,
        data: { namespace, key },
        timestamp: new Date().toISOString(),
        duration: Date.now() - start,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
        duration: Date.now() - start,
      };
    }
  }
}
