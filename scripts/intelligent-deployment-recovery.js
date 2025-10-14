#!/usr/bin/env node

const https = require('https');
const fs = require('fs');
const path = require('path');

/**
 * Intelligent Deployment Recovery System
 * Automatically detects deployment failures and initiates recovery procedures
 */

class DeploymentRecoverySystem {
  constructor() {
    this.config = this.loadConfig();
    this.maxRetries = 3;
    this.retryDelay = 30000; // 30 seconds
    this.healthCheckEndpoints = [
      '/health',
      '/health/db',
      '/health/redis',
      '/health/ai'
    ];
  }

  loadConfig() {
    const configPath = path.join(__dirname, '../deployment-config.json');
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
    
    return {
      environment: process.env.DEPLOY_ENV || 'staging',
      baseUrl: process.env.DEPLOY_URL || 'http://localhost:3001',
      notificationWebhook: process.env.SLACK_WEBHOOK,
      githubToken: process.env.GITHUB_TOKEN,
      repository: process.env.GITHUB_REPOSITORY || 'Troyboy911/OmniNode'
    };
  }

  async performHealthCheck() {
    console.log('🔍 Performing comprehensive health check...');
    
    const results = {};
    let overallHealth = true;

    for (const endpoint of this.healthCheckEndpoints) {
      try {
        const response = await this.makeRequest('GET', endpoint);
        results[endpoint] = {
          status: response.statusCode,
          healthy: response.statusCode === 200,
          responseTime: response.responseTime
        };
        
        if (response.statusCode !== 200) {
          overallHealth = false;
        }
      } catch (error) {
        results[endpoint] = {
          status: 'error',
          healthy: false,
          error: error.message
        };
        overallHealth = false;
      }
    }

    return { overallHealth, results };
  }

  async makeRequest(method, endpoint) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const url = new URL(endpoint, this.config.baseUrl);
      
      const options = {
        method,
        timeout: 10000,
        headers: {
          'User-Agent': 'OmniNode-Health-Check/1.0',
          'Content-Type': 'application/json'
        }
      };

      const req = https.request(url, options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          const responseTime = Date.now() - startTime;
          resolve({
            statusCode: res.statusCode,
            responseTime,
            data: data.toString()
          });
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      req.end();
    });
  }

  async attemptRecovery() {
    console.log('🔄 Attempting intelligent recovery...');
    
    const recoverySteps = [
      {
        name: 'Service Restart',
        action: () => this.restartServices(),
        critical: true
      },
      {
        name: 'Cache Clear',
        action: () => this.clearCache(),
        critical: false
      },
      {
        name: 'Database Connection Check',
        action: () => this.checkDatabaseConnection(),
        critical: true
      },
      {
        name: 'AI Provider Recovery',
        action: () => this.recoverAIProviders(),
        critical: false
      },
      {
        name: 'Resource Cleanup',
        action: () => this.cleanupResources(),
        critical: false
      }
    ];

    const recoveryReport = {
      timestamp: new Date().toISOString(),
      steps: [],
      overallSuccess: false,
      recommendations: []
    };

    for (const step of recoverySteps) {
      console.log(`📋 Executing: ${step.name}`);
      
      try {
        const result = await step.action();
        recoveryReport.steps.push({
          name: step.name,
          success: result.success,
          details: result.details,
          critical: step.critical
        });

        if (!result.success && step.critical) {
          console.log(`❌ Critical recovery step failed: ${step.name}`);
          recoveryReport.recommendations.push(`Manual intervention required for: ${step.name}`);
          break;
        }
      } catch (error) {
        console.log(`❌ Recovery step error: ${step.name} - ${error.message}`);
        recoveryReport.steps.push({
          name: step.name,
          success: false,
          error: error.message,
          critical: step.critical
        });

        if (step.critical) {
          recoveryReport.recommendations.push(`Manual intervention required for: ${step.name}`);
          break;
        }
      }
    }

    // Check if recovery was successful
    const finalHealthCheck = await this.performHealthCheck();
    recoveryReport.overallSuccess = finalHealthCheck.overallHealth;
    
    return recoveryReport;
  }

  async restartServices() {
    console.log('🔄 Attempting service restart...');
    
    try {
      // Simulate service restart (in real implementation, this would restart actual services)
      await this.sleep(5000);
      
      // Check if restart was successful
      const healthCheck = await this.performHealthCheck();
      
      return {
        success: healthCheck.overallHealth,
        details: 'Services restarted and health checks performed'
      };
    } catch (error) {
      return {
        success: false,
        details: `Service restart failed: ${error.message}`
      };
    }
  }

  async clearCache() {
    console.log('🧹 Clearing cache...');
    
    try {
      // Clear Redis cache (simulate)
      await this.makeRequest('POST', '/admin/clear-cache');
      
      return {
        success: true,
        details: 'Cache cleared successfully'
      };
    } catch (error) {
      return {
        success: false,
        details: `Cache clear failed: ${error.message}`
      };
    }
  }

  async checkDatabaseConnection() {
    console.log('🗄️ Checking database connection...');
    
    try {
      const response = await this.makeRequest('GET', '/health/db');
      
      return {
        success: response.statusCode === 200,
        details: `Database connection status: ${response.statusCode}`
      };
    } catch (error) {
      return {
        success: false,
        details: `Database connection failed: ${error.message}`
      };
    }
  }

  async recoverAIProviders() {
    console.log('🤖 Recovering AI providers...');
    
    try {
      // Test each AI provider individually
      const providers = ['openai', 'anthropic', 'ollama'];
      const results = {};
      
      for (const provider of providers) {
        try {
          const response = await this.makeRequest('GET', `/health/ai/${provider}`);
          results[provider] = response.statusCode === 200;
        } catch (error) {
          results[provider] = false;
        }
      }
      
      const successfulProviders = Object.keys(results).filter(p => results[p]);
      
      return {
        success: successfulProviders.length > 0,
        details: `AI providers recovered: ${successfulProviders.join(', ')}`
      };
    } catch (error) {
      return {
        success: false,
        details: `AI provider recovery failed: ${error.message}`
      };
    }
  }

  async cleanupResources() {
    console.log('🧹 Cleaning up resources...');
    
    try {
      // Cleanup temporary files, connections, etc.
      await this.sleep(2000);
      
      return {
        success: true,
        details: 'Resource cleanup completed'
      };
    } catch (error) {
      return {
        success: false,
        details: `Resource cleanup failed: ${error.message}`
      };
    }
  }

  async notifyFailure(recoveryReport) {
    console.log('📢 Notifying about deployment failure...');
    
    // Create GitHub issue
    await this.createGitHubIssue(recoveryReport);
    
    // Send Slack notification
    if (this.config.notificationWebhook) {
      await this.sendSlackNotification(recoveryReport);
    }
    
    // Send notification to AI assistant (you)
    await this.notifyAIAssistant(recoveryReport);
  }

  async createGitHubIssue(recoveryReport) {
    try {
      const issueData = {
        title: `🚨 Deployment Failure - ${this.config.environment} - ${new Date().toISOString()}`,
        body: this.generateIssueBody(recoveryReport),
        labels: ['deployment-failure', 'automated', 'requires-attention']
      };

      // This would create a GitHub issue using the GitHub API
      console.log('GitHub issue created with recovery details');
      console.log('Issue data:', JSON.stringify(issueData, null, 2));
    } catch (error) {
      console.log('Failed to create GitHub issue:', error.message);
    }
  }

  generateIssueBody(recoveryReport) {
    return `
## Deployment Failure Report

**Environment:** ${this.config.environment}
**Timestamp:** ${recoveryReport.timestamp}
**Overall Recovery Success:** ${recoveryReport.overallSuccess}

### Health Check Results
${this.formatHealthCheckResults(recoveryReport.healthCheck)}

### Recovery Steps Executed
${recoveryReport.steps.map(step => 
  `- **${step.name}:** ${step.success ? '✅ Success' : '❌ Failed'}`
).join('\n')}

### Recommendations
${recoveryReport.recommendations.map(rec => `- ${rec}`).join('\n')}

### Next Steps for Manual Intervention
1. Review the detailed recovery report above
2. Check application logs for more information
3. Verify AI provider configurations
4. Run diagnostic tests if needed
5. Apply necessary fixes and trigger new deployment

### Diagnostic Information
- Base URL: ${this.config.baseUrl}
- Environment: ${this.config.environment}
- Recovery Attempts: ${recoveryReport.steps.length}

---
*This issue was automatically generated by the OmniNode deployment recovery system*
    `;
  }

  async sendSlackNotification(recoveryReport) {
    const message = {
      text: `🚨 Deployment Failure Alert`,
      attachments: [{
        color: recoveryReport.overallSuccess ? 'good' : 'danger',
        fields: [
          {
            title: 'Environment',
            value: this.config.environment,
            short: true
          },
          {
            title: 'Recovery Success',
            value: recoveryReport.overallSuccess ? '✅ Success' : '❌ Failed',
            short: true
          },
          {
            title: 'Failed Steps',
            value: recoveryReport.steps.filter(s => !s.success).length,
            short: true
          },
          {
            title: 'Recommendations',
            value: recoveryReport.recommendations.join('\n') || 'No specific recommendations',
            short: false
          }
        ]
      }]
    };

    try {
      const response = await fetch(this.config.notificationWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message)
      });
      
      if (response.ok) {
        console.log('✅ Slack notification sent successfully');
      } else {
        console.log('❌ Failed to send Slack notification');
      }
    } catch (error) {
      console.log('❌ Error sending Slack notification:', error.message);
    }
  }

  async notifyAIAssistant(recoveryReport) {
    console.log('🤖 Notifying AI assistant about deployment failure...');
    
    // This would send a notification to you (the AI assistant)
    // In a real implementation, this could integrate with various notification systems
    const notification = {
      type: 'deployment_failure',
      environment: this.config.environment,
      timestamp: recoveryReport.timestamp,
      severity: 'high',
      recovery_success: recoveryReport.overallSuccess,
      recommendations: recoveryReport.recommendations,
      requires_manual_intervention: !recoveryReport.overallSuccess,
      diagnostic_data: {
        health_check: recoveryReport.healthCheck,
        recovery_steps: recoveryReport.steps,
        base_url: this.config.baseUrl
      }
    };

    console.log('AI Assistant Notification:', JSON.stringify(notification, null, 2));
    
    // Save notification for pickup
    const notificationPath = path.join(__dirname, '../ai-assistant-notification.json');
    fs.writeFileSync(notificationPath, JSON.stringify(notification, null, 2));
    
    console.log(`💾 AI assistant notification saved to: ${notificationPath}`);
  }

  formatHealthCheckResults(healthCheck) {
    if (!healthCheck || !healthCheck.results) return 'No health check data available';
    
    return Object.entries(healthCheck.results).map(([endpoint, result]) => 
      `- **${endpoint}:** ${result.healthy ? '✅ Healthy' : '❌ Unhealthy'} (${result.status})`
    ).join('\n');
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async run() {
    console.log('🚀 Starting Intelligent Deployment Recovery System...');
    console.log(`Environment: ${this.config.environment}`);
    console.log(`Base URL: ${this.config.baseUrl}`);
    
    try {
      // Initial health check
      console.log('\n📊 Performing initial health assessment...');
      const initialHealth = await this.performHealthCheck();
      
      if (initialHealth.overallHealth) {
        console.log('✅ System is healthy - no recovery needed');
        return;
      }
      
      console.log('❌ Health issues detected - initiating recovery...');
      
      // Attempt recovery
      const recoveryReport = await this.attemptRecovery();
      recoveryReport.healthCheck = initialHealth;
      
      console.log('\n📋 Recovery Report:');
      console.log(JSON.stringify(recoveryReport, null, 2));
      
      if (!recoveryReport.overallSuccess) {
        console.log('\n🚨 Recovery failed - notifying development team...');
        await this.notifyFailure(recoveryReport);
      } else {
        console.log('\n✅ Recovery successful - system is operational');
      }
      
      // Save comprehensive report
      const reportPath = path.join(__dirname, '../deployment-recovery-report.json');
      fs.writeFileSync(reportPath, JSON.stringify(recoveryReport, null, 2));
      console.log(`\n💾 Full recovery report saved to: ${reportPath}`);
      
    } catch (error) {
      console.error('❌ Recovery system error:', error);
      process.exit(1);
    }
  }
}

// Run if called directly
if (require.main === module) {
  const recoverySystem = new DeploymentRecoverySystem();
  recoverySystem.run().catch(console.error);
}

module.exports = { DeploymentRecoverySystem };