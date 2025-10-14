#!/usr/bin/env node

const { enhancedAIOrchestrator } = require('../backend/src/services/ai/enhanced-orchestrator');

async function checkAIHealth() {
  console.log('🔍 Checking AI Provider Health...');
  
  const providers = ['openai', 'anthropic', 'ollama'];
  const healthReport = {
    timestamp: new Date().toISOString(),
    providers: {},
    summary: {
      total: providers.length,
      healthy: 0,
      unhealthy: 0,
      notConfigured: 0
    }
  };

  for (const provider of providers) {
    try {
      const health = await enhancedAIOrchestrator.checkProviderHealth(provider);
      healthReport.providers[provider] = health;
      
      if (health.status === 'healthy') {
        healthReport.summary.healthy++;
        console.log(`✅ ${provider.toUpperCase()}: Healthy (${health.latency}ms)`);
      } else if (health.status === 'not_configured') {
        healthReport.summary.notConfigured++;
        console.log(`⚠️  ${provider.toUpperCase()}: Not configured`);
      } else {
        healthReport.summary.unhealthy++;
        console.log(`❌ ${provider.toUpperCase()}: Unhealthy - ${health.error}`);
      }
    } catch (error) {
      healthReport.providers[provider] = { status: 'error', error: error.message };
      healthReport.summary.unhealthy++;
      console.log(`❌ ${provider.toUpperCase()}: Error - ${error.message}`);
    }
  }

  console.log('\n📊 Health Summary:');
  console.log(`Total Providers: ${healthReport.summary.total}`);
  console.log(`Healthy: ${healthReport.summary.healthy}`);
  console.log(`Unhealthy: ${healthReport.summary.unhealthy}`);
  console.log(`Not Configured: ${healthReport.summary.notConfigured}`);

  // Save health report
  const fs = require('fs');
  const path = require('path');
  const reportPath = path.join(__dirname, '../ai-health-report.json');
  
  fs.writeFileSync(reportPath, JSON.stringify(healthReport, null, 2));
  console.log(`\n💾 Health report saved to: ${reportPath}`);

  // Exit with appropriate code
  process.exit(healthReport.summary.unhealthy > 0 ? 1 : 0);
}

if (require.main === module) {
  checkAIHealth().catch(console.error);
}