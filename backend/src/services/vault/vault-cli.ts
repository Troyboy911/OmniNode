#!/usr/bin/env node

import { program } from 'commander';
import { createInterface } from 'readline';
import { VaultService } from './vault.service';
import { VaultSyncService } from './vault-sync.service';
import { EnvScope, SyncTarget } from './types';
import { logger } from '../../config/logger';

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

function prompt(question: string): Promise<string> {
  return new Promise(resolve => {
    rl.question(question, answer => {
      resolve(answer);
    });
  });
}

function getPassword(): string {
  return process.env.VAULT_PASSWORD || process.env.ENCRYPTION_MASTER_KEY || '';
}

async function initVault() {
  console.log('🔐 Initializing OmniNode Secrets Vault\n');
  
  const password = await prompt('Enter master password (leave empty for env var): ');
  const finalPassword = password || getPassword();
  
  if (!finalPassword) {
    console.error('❌ Password required. Set VAULT_PASSWORD or provide interactively.');
    process.exit(1);
  }

  const vault = new VaultService({ password: finalPassword });
  const masterKey = await vault.initializeMasterKey();
  
  console.log('\n✅ Vault initialized successfully');
  console.log(`📝 Master key: ${masterKey.substring(0, 16)}...`);
  console.log('⚠️  Store this key securely and set ENCRYPTION_MASTER_KEY env var\n');
  
  rl.close();
}

async function importSecrets() {
  const options = program.opts();
  const envFile = options.file || '.env';
  const env: EnvScope = options.env || 'dev';
  const password = options.password || getPassword();

  if (!password) {
    console.error('❌ Password required');
    process.exit(1);
  }

  const vault = new VaultService({ password });
  await vault.loadMasterKey();

  console.log(`📥 Importing secrets from ${envFile} into ${env} environment...`);
  
  const count = await vault.importFromEnv(envFile, env);
  
  console.log(`✅ Imported ${count} secrets\n`);
  rl.close();
}

async function setSecret() {
  const options = program.opts();
  const key = options.key;
  const value = options.value;
  const env: EnvScope = options.env || 'dev';
  const password = options.password || getPassword();

  if (!key || !value) {
    console.error('❌ Key and value required');
    process.exit(1);
  }

  if (!password) {
    console.error('❌ Password required');
    process.exit(1);
  }

  const vault = new VaultService({ password });
  await vault.loadMasterKey();
  await vault.setSecret(key, value, env);

  console.log(`✅ Secret ${key} set in ${env} environment\n`);
  rl.close();
}

async function getSecret() {
  const options = program.opts();
  const key = options.key;
  const env: EnvScope = options.env || 'dev';
  const password = options.password || getPassword();

  if (!key) {
    console.error('❌ Key required');
    process.exit(1);
  }

  if (!password) {
    console.error('❌ Password required');
    process.exit(1);
  }

  const vault = new VaultService({ password });
  await vault.loadMasterKey();
  const value = await vault.getSecret(key, env);

  if (value) {
    console.log(value);
  } else {
    console.error(`❌ Secret ${key} not found in ${env} environment`);
    process.exit(1);
  }

  rl.close();
}

async function listSecrets() {
  const options = program.opts();
  const env: EnvScope = options.env || 'dev';
  const password = options.password || getPassword();

  if (!password) {
    console.error('❌ Password required');
    process.exit(1);
  }

  const vault = new VaultService({ password });
  await vault.loadMasterKey();
  const keys = await vault.listSecrets(env);

  console.log(`\n📋 Secrets in ${env} environment:\n`);
  keys.forEach((key, i) => {
    console.log(`  ${i + 1}. ${key}`);
  });
  console.log(`\n✅ Total: ${keys.length} secrets\n`);
  
  rl.close();
}

async function syncSecrets() {
  const options = program.opts();
  const targetsStr = options.targets || 'local';
  const targets = targetsStr.split(',') as SyncTarget[];
  const env: EnvScope = options.env || 'dev';
  const password = options.password || getPassword();

  if (!password) {
    console.error('❌ Password required');
    process.exit(1);
  }

  const vault = new VaultService({ password });
  await vault.loadMasterKey();
  
  const syncService = new VaultSyncService(vault);

  console.log(`🔄 Syncing secrets to: ${targets.join(', ')} [${env}]\n`);
  
  const results = await syncService.syncSecrets(targets, env);

  for (const result of results) {
    const icon = result.success ? '✅' : '❌';
    console.log(`${icon} ${result.target}: ${result.synced} synced, ${result.failed} failed`);
    
    if (result.errors && result.errors.length > 0) {
      result.errors.forEach(err => console.log(`   ⚠️  ${err}`));
    }
  }

  console.log('\n🎯 Sync complete\n');
  rl.close();
}

async function rotateSecrets() {
  const options = program.opts();
  const env: EnvScope = options.env || 'dev';
  const password = options.password || getPassword();

  if (!password) {
    console.error('❌ Password required');
    process.exit(1);
  }

  const confirm = await prompt(`⚠️  This will re-encrypt all secrets in ${env}. Continue? (yes/no): `);
  
  if (confirm.toLowerCase() !== 'yes') {
    console.log('❌ Rotation cancelled');
    rl.close();
    return;
  }

  const vault = new VaultService({ password });
  await vault.loadMasterKey();

  console.log(`🔄 Rotating secrets in ${env} environment...`);
  
  await vault.rotateSecrets(env);

  console.log(`✅ Secrets rotated successfully\n`);
  rl.close();
}

// CLI Program
program
  .name('vault')
  .description('OmniNode Secrets Vault - Military-grade credential management')
  .version('1.0.0');

program
  .command('setup')
  .description('Initialize vault with master key')
  .action(initVault);

program
  .command('import')
  .description('Import secrets from .env file')
  .option('-f, --file <path>', 'Path to .env file', '.env')
  .option('-e, --env <env>', 'Environment scope', 'dev')
  .option('-p, --password <password>', 'Master password')
  .action(importSecrets);

program
  .command('set')
  .description('Set a secret')
  .option('-k, --key <key>', 'Secret key')
  .option('-v, --value <value>', 'Secret value')
  .option('-e, --env <env>', 'Environment scope', 'dev')
  .option('-p, --password <password>', 'Master password')
  .action(setSecret);

program
  .command('get')
  .description('Get a secret value')
  .option('-k, --key <key>', 'Secret key')
  .option('-e, --env <env>', 'Environment scope', 'dev')
  .option('-p, --password <password>', 'Master password')
  .action(getSecret);

program
  .command('list')
  .description('List all secret keys')
  .option('-e, --env <env>', 'Environment scope', 'dev')
  .option('-p, --password <password>', 'Master password')
  .action(listSecrets);

program
  .command('sync')
  .description('Sync secrets to external targets')
  .option('-t, --targets <targets>', 'Comma-separated targets: github,cloudflare,airtable,local', 'local')
  .option('-e, --env <env>', 'Environment scope', 'dev')
  .option('-p, --password <password>', 'Master password')
  .action(syncSecrets);

program
  .command('rotate')
  .description('Rotate all secrets (re-encrypt with new master key)')
  .option('-e, --env <env>', 'Environment scope', 'dev')
  .option('-p, --password <password>', 'Master password')
  .action(rotateSecrets);

// Parse CLI arguments
program.parse(process.argv);
