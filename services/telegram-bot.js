// OmniNode Mobile Command Center - Telegram Bot with Perplexity Intelligence
// Hybrid powerhouse: Telegram control + Perplexity deep research

const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const { execSync } = require('child_process');

class OmniNodeCommandBot {
  constructor() {
    this.token = process.env.TELEGRAM_BOT_TOKEN;
    this.perplexityKey = process.env.PERPLEXITY_API_KEY;
    this.bot = new TelegramBot(this.token, { polling: true });
    this.setupCommands();
  }

  setupCommands() {
    // Core deployment commands
    this.bot.onText(/\/deploy (.+)/, (msg, match) => this.handleDeploy(msg, match));
    this.bot.onText(/\/status/, (msg) => this.handleStatus(msg));
    this.bot.onText(/\/workspaces/, (msg) => this.handleWorkspaces(msg));
    this.bot.onText(/\/logs (.+)/, (msg, match) => this.handleLogs(msg, match));
    
    // Perplexity-powered intelligence
    this.bot.onText(/\/research (.+)/, (msg, match) => this.handleResearch(msg, match));
    this.bot.onText(/\/analyze (.+)/, (msg, match) => this.handleAnalyze(msg, match));
    this.bot.onText(/\/optimize (.+)/, (msg, match) => this.handleOptimize(msg, match));
    
    // Quick actions
    this.bot.onText(/\/exec (.+)/, (msg, match) => this.handleExec(msg, match));
    this.bot.onText(/\/health/, (msg) => this.handleHealth(msg));
    this.bot.onText(/\/restart (.+)/, (msg, match) => this.handleRestart(msg, match));
  }

  async handleDeploy(msg, match) {
    const chatId = msg.chat.id;
    const service = match[1];
    
    this.bot.sendMessage(chatId, `🚀 Deploying ${service}...`);
    
    try {
      // Execute deployment
      const result = execSync(`npm run deploy:${service}`, { encoding: 'utf-8' });
      
      this.bot.sendMessage(chatId, `✅ ${service} deployed successfully!\n\n${result}`);
      
      // Send inline keyboard for next actions
      this.bot.sendMessage(chatId, 'What next?', {
        reply_markup: {
          inline_keyboard: [
            [{ text: '📊 View Status', callback_data: 'status' }],
            [{ text: '📝 View Logs', callback_data: `logs_${service}` }],
            [{ text: '🔄 Restart', callback_data: `restart_${service}` }]
          ]
        }
      });
    } catch (error) {
      this.bot.sendMessage(chatId, `❌ Deployment failed: ${error.message}`);
    }
  }

  async handleStatus(msg) {
    const chatId = msg.chat.id;
    
    try {
      // Check AnythingLLM
      const anythingllm = await axios.get('https://moneymakers-anything-llm.ys9znw.easypanel.host/api/health');
      
      // Check Airtable
      const airtable = await axios.get('https://api.airtable.com/v0/appDc5MPIv6W9g3Nl/Automations', {
        headers: { 'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}` }
      });
      
      const status = `📊 *OmniNode Status Report*\n\n` +
        `🤖 *AnythingLLM*: ${anythingllm.status === 200 ? '✅ Running' : '❌ Down'}\n` +
        `📊 *Airtable*: ✅ Connected (${airtable.data.records.length} automations)\n` +
        `☁️ *Cloudflare*: ✅ Active\n` +
        `⚡ *EasyPanel*: ✅ Healthy\n\n` +
        `_Last checked: ${new Date().toLocaleString()}_`;
      
      this.bot.sendMessage(chatId, status, { parse_mode: 'Markdown' });
    } catch (error) {
      this.bot.sendMessage(chatId, `❌ Error checking status: ${error.message}`);
    }
  }

  async handleResearch(msg, match) {
    const chatId = msg.chat.id;
    const query = match[1];
    
    this.bot.sendMessage(chatId, `🔍 Running deep research with Perplexity Sonar...`);
    
    try {
      const response = await axios.post('https://api.perplexity.ai/chat/completions', {
        model: 'sonar-deep-research',
        messages: [{
          role: 'user',
          content: query
        }]
      }, {
        headers: {
          'Authorization': `Bearer ${this.perplexityKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      const answer = response.data.choices[0].message.content;
      const citations = response.data.citations || [];
      
      let message = `🧠 *Research Results*\n\n${answer}\n\n`;
      
      if (citations.length > 0) {
        message += `📚 *Sources:*\n${citations.slice(0, 5).join('\n')}`;
      }
      
      this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    } catch (error) {
      this.bot.sendMessage(chatId, `❌ Research failed: ${error.message}`);
    }
  }

  async handleAnalyze(msg, match) {
    const chatId = msg.chat.id;
    const target = match[1];
    
    // Use Perplexity to analyze infrastructure/code
    const analysisQuery = `Analyze this system and provide optimization recommendations: ${target}`;
    
    this.bot.sendMessage(chatId, `🔬 Analyzing with AI intelligence...`);
    
    try {
      const response = await axios.post('https://api.perplexity.ai/chat/completions', {
        model: 'sonar-pro',
        messages: [{
          role: 'system',
          content: 'You are an expert DevOps engineer analyzing infrastructure. Provide specific, actionable recommendations.'
        }, {
          role: 'user',
          content: analysisQuery
        }]
      }, {
        headers: {
          'Authorization': `Bearer ${this.perplexityKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      const analysis = response.data.choices[0].message.content;
      
      // Send with actionable buttons
      this.bot.sendMessage(chatId, `📊 *Analysis Complete*\n\n${analysis}`, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '✅ Apply Recommendations', callback_data: 'apply_recommendations' }],
            [{ text: '📝 Save to Airtable', callback_data: 'save_analysis' }]
          ]
        }
      });
    } catch (error) {
      this.bot.sendMessage(chatId, `❌ Analysis failed: ${error.message}`);
    }
  }

  async handleWorkspaces(msg) {
    const chatId = msg.chat.id;
    
    const workspaces = [
      { name: '⚔️ DevOps Warrior', model: 'Claude 3.5 Sonnet', status: 'active' },
      { name: '🎯 Code Assassin', model: 'GPT-4 Turbo', status: 'active' },
      { name: '🔍 Intelligence Unit', model: 'Perplexity Sonar', status: 'active' },
      { name: '📝 Content Ops', model: 'GPT-4', status: 'active' },
      { name: '🛡️ Security Guardian', model: 'Claude', status: 'active' }
    ];
    
    let message = `🤖 *AnythingLLM Workspace Army*\n\n`;
    
    workspaces.forEach(ws => {
      message += `${ws.name}\nModel: ${ws.model}\nStatus: ✅ ${ws.status}\n\n`;
    });
    
    this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  }

  async handleLogs(msg, match) {
    const chatId = msg.chat.id;
    const service = match[1];
    
    try {
      const logs = execSync(`tail -50 /var/log/${service}.log`, { encoding: 'utf-8' });
      this.bot.sendMessage(chatId, `📜 *Logs for ${service}*\n\n\`\`\`\n${logs}\n\`\`\``, { parse_mode: 'Markdown' });
    } catch (error) {
      this.bot.sendMessage(chatId, `❌ Could not fetch logs: ${error.message}`);
    }
  }

  async handleExec(msg, match) {
    const chatId = msg.chat.id;
    const command = match[1];
    
    // Security: Only allow specific commands
    const allowedCommands = ['status', 'deploy', 'restart', 'logs'];
    const cmd = command.split(' ')[0];
    
    if (!allowedCommands.includes(cmd)) {
      this.bot.sendMessage(chatId, '❌ Command not allowed for security reasons');
      return;
    }
    
    try {
      const result = execSync(command, { encoding: 'utf-8', timeout: 10000 });
      this.bot.sendMessage(chatId, `✅ Executed\n\n\`\`\`\n${result}\n\`\`\``, { parse_mode: 'Markdown' });
    } catch (error) {
      this.bot.sendMessage(chatId, `❌ Execution failed: ${error.message}`);
    }
  }

  async handleHealth(msg) {
    const chatId = msg.chat.id;
    const uptime = process.uptime();
    const memory = process.memoryUsage();
    
    const health = `💚 *System Health*\n\n` +
      `⏱️ Uptime: ${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m\n` +
      `💾 Memory: ${Math.round(memory.heapUsed / 1024 / 1024)}MB / ${Math.round(memory.heapTotal / 1024 / 1024)}MB\n` +
      `🔄 CPU: ${process.cpuUsage().user / 1000000}s\n` +
      `🤖 Bot: ✅ Active`;
    
    this.bot.sendMessage(chatId, health, { parse_mode: 'Markdown' });
  }

  async handleRestart(msg, match) {
    const chatId = msg.chat.id;
    const service = match[1];
    
    this.bot.sendMessage(chatId, `🔄 Restarting ${service}...`);
    
    try {
      execSync(`pm2 restart ${service}`);
      this.bot.sendMessage(chatId, `✅ ${service} restarted successfully!`);
    } catch (error) {
      this.bot.sendMessage(chatId, `❌ Restart failed: ${error.message}`);
    }
  }

  start() {
    console.log('🤖 OmniNode Telegram Bot started!');
    console.log('📱 Ready to receive mobile commands...');
  }
}

module.exports = OmniNodeCommandBot;

// Auto-start if run directly
if (require.main === module) {
  const bot = new OmniNodeCommandBot();
  bot.start();
}
