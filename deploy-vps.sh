#!/bin/bash

# OmniNode VPS Deployment Script
# One-command deployment for Ubuntu VPS

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[1;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 OmniNode VPS Deployment${NC}"
echo "================================"

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   echo -e "${RED}❌ Please run as non-root user with sudo privileges${NC}"
   exit 1
fi

# Configuration
DB_PASSWORD=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 64)
DOMAIN=${1:-localhost}

# 1. System Update
echo -e "${YELLOW}📦 Updating system...${NC}"
sudo apt update && sudo apt upgrade -y

# 2. Install Dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs postgresql postgresql-contrib redis-server nginx certbot python3-certbot-nginx

# 3. Setup PostgreSQL
echo -e "${YELLOW}🗄️ Setting up PostgreSQL...${NC}"
sudo systemctl start postgresql
sudo systemctl enable postgresql

sudo -u postgres psql -c "CREATE DATABASE omninode;"
sudo -u postgres psql -c "CREATE USER omninode WITH PASSWORD '$DB_PASSWORD';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE omninode TO omninode;"

# 4. Setup Redis
echo -e "${YELLOW}🔄 Setting up Redis...${NC}"
sudo systemctl start redis-server
sudo systemctl enable redis-server

# 5. Install PM2
echo -e "${YELLOW}⚡ Installing PM2...${NC}"
sudo npm install -g pm2

# 6. Setup Application
echo -e "${YELLOW}📁 Setting up application...${NC}"
git clone https://github.com/Troyboy911/OmniNode.git
cd OmniNode/backend

# Install dependencies
npm install --production
npx prisma generate

# 7. Environment Configuration
echo -e "${YELLOW}⚙️ Configuring environment...${NC}"
cat > .env << EOF
DATABASE_URL="postgresql://omninode:$DB_PASSWORD@localhost:5432/omninode"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="$JWT_SECRET"
OPENAI_API_KEY="your_openai_key_here"
ANTHROPIC_API_KEY="your_anthropic_key_here"
GOOGLE_API_KEY="your_google_key_here"
PORT=3000
NODE_ENV=production
CORS_ORIGIN="http://localhost:3001"
EOF

# 8. Database Migration
echo -e "${YELLOW}🗄️ Running database migrations...${NC}"
npx prisma migrate deploy

# 9. Build Application
echo -e "${YELLOW}🔨 Building application...${NC}"
npm run build

# 10. Start Application
echo -e "${YELLOW}🚀 Starting application...${NC}"
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup

# 11. Setup Nginx
echo -e "${YELLOW}🌐 Setting up Nginx...${NC}"
sudo tee /etc/nginx/sites-available/omninode << EOF
server {
    listen 80;
    server_name $DOMAIN;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/omninode /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# 12. SSL Certificate (if domain provided)
if [ "$DOMAIN" != "localhost" ]; then
    echo -e "${YELLOW}🔒 Setting up SSL certificate...${NC}"
    sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos -m admin@$DOMAIN
fi

# 13. Setup Firewall
echo -e "${YELLOW}🛡️ Setting up firewall...${NC}"
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# 14. Create Service Files
echo -e "${YELLOW}📋 Creating service files...${NC}"
sudo tee /etc/systemd/system/omninode.service << EOF
[Unit]
Description=OmniNode Backend
After=network.target postgresql.service redis.service

[Service]
Type=forking
User=$USER
WorkingDirectory=/home/$USER/OmniNode/backend
ExecStart=/usr/bin/pm2 start ecosystem.config.js --env production
ExecReload=/usr/bin/pm2 reload ecosystem.config.js --env production
ExecStop=/usr/bin/pm2 stop ecosystem.config.js --env production
Restart=always

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable omninode

# 15. Create Monitoring Script
echo -e "${YELLOW}📊 Creating monitoring script...${NC}"
cat > /home/$USER/monitor-omninode.sh << 'EOF'
#!/bin/bash
# OmniNode Health Check

echo "=== OmniNode Health Check ==="
echo "Date: $(date)"

# Check services
echo "PostgreSQL: $(systemctl is-active postgresql)"
echo "Redis: $(systemctl is-active redis-server)"
echo "Nginx: $(systemctl is-active nginx)"
echo "OmniNode: $(systemctl is-active omninode)"

# Check API health
curl -f http://localhost:3000/api/v1/health && echo "API: ✅" || echo "API: ❌"

# Check disk space
echo "Disk Usage:"
df -h / | tail -1

# Check memory
echo "Memory Usage:"
free -h
EOF

chmod +x /home/$USER/monitor-omninode.sh

# 16. Final Steps
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo -e "${BLUE}🎉 Your OmniNode is ready!${NC}"
echo ""
echo -e "${YELLOW}📋 Next steps:${NC}"
echo "1. Edit .env file with your actual API keys"
echo "2. Start the service: sudo systemctl start omninode"
echo "3. Check logs: pm2 logs"
echo "4. Monitor health: ./monitor-omninode.sh"
echo ""
echo -e "${GREEN}🔗 Access URLs:${NC}"
echo "  API: http://$DOMAIN/api/v1/health"
echo "  WebSocket: ws://$DOMAIN"
echo ""
echo -e "${YELLOW}📊 Management commands:${NC}"
echo "  Start: sudo systemctl start omninode"
echo "  Stop: sudo systemctl stop omninode"
echo "  Status: sudo systemctl status omninode"
echo "  Logs: pm2 logs"

# Create ecosystem.config.js
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'omninode-backend',
    script: 'dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
EOF

# Create logs directory
mkdir -p logs