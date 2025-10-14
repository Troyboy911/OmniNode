#!/usr/bin/env node

const { performance } = require('perf_hooks');
const { enhancedAIOrchestrator } = require('../backend/src/services/ai/enhanced-orchestrator');

const TEST_PROMPTS = [
  "What is the capital of France?",
  "Explain quantum computing in simple terms",
  "Write a haiku about artificial intelligence",
  "What are the benefits of renewable energy?",
  "How does machine learning work?"
];

const TEST_PROVIDERS = ['openai', 'anthropic', 'ollama'];
const TEST_MODELS = {
  openai: ['gpt-3.5-turbo', 'gpt-4'],
  anthropic: ['claude-3-sonnet-20240229', 'claude-3-haiku-20240307'],
  ollama: ['llama2', 'mistral']
};

async function benchmarkProvider(provider, model, prompt) {
  const startTime = performance.now();
  
  try {
    const response = await enhancedAIOrchestrator.generateResponse({
      prompt,
      model,
      provider,
      maxTokens: 150
    });
    
    const endTime = performance.now();
    const latency = endTime - startTime;
    
    return {
      provider,
      model,
      prompt: prompt.substring(0, 50) + '...',
      latency,
      tokens: response.tokens.total,
      success: true,
      response: response.content.substring(0, 100) + '...'
    };
  } catch (error) {
    const endTime = performance.now();
    const latency = endTime - startTime;
    
    return {
      provider,
      model,
      prompt: prompt.substring(0, 50) + '...',
      latency,
      tokens: 0,
      success: false,
      error: error.message
    };
  }
}

async function runBenchmarks() {
  console.log('🏃 Starting AI Performance Benchmarks...\n');
  
  const results = [];
  const totalTests = TEST_PROVIDERS.length * Object.values(TEST_MODELS).flat().length * TEST_PROMPTS.length;
  let completedTests = 0;
  
  for (const provider of TEST_PROVIDERS) {
    const models = TEST_MODELS[provider] || [];
    
    for (const model of models) {
      for (const prompt of TEST_PROMPTS) {
        console.log(`Testing ${provider} - ${model}: "${prompt.substring(0, 30)}..."`);
        
        const result = await benchmarkProvider(provider, model, prompt);
        results.push(result);
        
        completedTests++;
        const progress = Math.round((completedTests / totalTests) * 100);
        console.log(`Progress: ${progress}% (${completedTests}/${totalTests})\n`);
      }
    }
  }
  
  // Generate summary report
  const summary = generateSummaryReport(results);
  console.log('\n📊 Benchmark Summary:');
  console.log(summary);
  
  // Save detailed results
  saveResults(results, summary);
}

function generateSummaryReport(results) {
  const providerStats = {};
  
  results.forEach(result => {
    if (!providerStats[result.provider]) {
      providerStats[result.provider] = {
        total: 0,
        successful: 0,
        avgLatency: 0,
        avgTokens: 0,
        models: {}
      };
    }
    
    const stats = providerStats[result.provider];
    stats.total++;
    
    if (result.success) {
      stats.successful++;
      stats.avgLatency += result.latency;
      stats.avgTokens += result.tokens;
    }
    
    if (!stats.models[result.model]) {
      stats.models[result.model] = {
        total: 0,
        successful: 0,
        avgLatency: 0
      };
    }
    
    const modelStats = stats.models[result.model];
    modelStats.total++;
    if (result.success) {
      modelStats.successful++;
      modelStats.avgLatency += result.latency;
    }
  });
  
  // Calculate averages
  Object.keys(providerStats).forEach(provider => {
    const stats = providerStats[provider];
    if (stats.successful > 0) {
      stats.avgLatency = Math.round(stats.avgLatency / stats.successful);
      stats.avgTokens = Math.round(stats.avgTokens / stats.successful);
    }
    
    Object.keys(stats.models).forEach(model => {
      const modelStats = stats.models[model];
      if (modelStats.successful > 0) {
        modelStats.avgLatency = Math.round(modelStats.avgLatency / modelStats.successful);
      }
    });
  });
  
  let summary = '';
  Object.keys(providerStats).forEach(provider => {
    const stats = providerStats[provider];
    summary += `\n${provider.toUpperCase()}:\n`;
    summary += `  Success Rate: ${Math.round((stats.successful / stats.total) * 100)}%\n`;
    summary += `  Avg Latency: ${stats.avgLatency}ms\n`;
    summary += `  Avg Tokens: ${stats.avgTokens}\n`;
    
    Object.keys(stats.models).forEach(model => {
      const modelStats = stats.models[model];
      summary += `  ${model}: ${Math.round((modelStats.successful / modelStats.total) * 100)}% success, ${modelStats.avgLatency}ms avg\n`;
    });
  });
  
  return summary;
}

function saveResults(results, summary) {
  const fs = require('fs');
  const path = require('path');
  
  const report = {
    timestamp: new Date().toISOString(),
    summary,
    results,
    statistics: {
      totalTests: results.length,
      successfulTests: results.filter(r => r.success).length,
      failedTests: results.filter(r => !r.success).length,
      avgLatency: Math.round(results.filter(r => r.success).reduce((sum, r) => sum + r.latency, 0) / results.filter(r => r.success).length),
      avgTokens: Math.round(results.filter(r => r.success).reduce((sum, r) => sum + r.tokens, 0) / results.filter(r => r.success).length)
    }
  };
  
  const reportPath = path.join(__dirname, '../benchmark-results/ai-benchmark-report.json');
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`\n💾 Detailed benchmark results saved to: ${reportPath}`);
}

if (require.main === module) {
  runBenchmarks().catch(console.error);
}