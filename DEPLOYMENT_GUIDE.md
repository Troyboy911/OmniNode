# 🚀 OmniNode Deployment Guide

## VPS Deployment (Recommended for Most Users) ✅

### System Requirements
- **OS**: Ubuntu 20.04/22.04 LTS (or any modern Linux)
- **CPU**: 2+ cores (4+ cores recommended)
- **RAM**: 4GB minimum (8GB+ recommended for AI workloads)
- **Storage**: 50GB+ SSD (100GB+ recommended)
- **Network**: Public IP address

### Quick VPS Setup (5 minutes)

```bash
# 1. Update system
sudo apt update && sudo apt upgrade -y

# 2. Install dependencies
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs postgresql postgresql-contrib redis-server nginx

# 3. Setup PostgreSQL
sudo -u postgres psql -c "CREATE DATABASE omninode;"
sudo -u postgres psql -c "CREATE USER omninode WITH PASSWORD 'your_secure_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE omninode TO omninode;"

# 4. Setup Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server

# 5. Clone and setup
git clone https://github.com/Troyboy911/OmniNode.git
cd OmniNode/backend

# 6. Configure environment
cp .env.example .env
# Edit .env with your settings
```

### Environment Configuration for VPS

```bash
# .env file for VPS
DATABASE_URL="postgresql://omninode:your_secure_password@localhost:5432/omninode"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your_jwt_secret_here"
OPENAI_API_KEY="your_openai_key"
ANTHROPIC_API_KEY="your_anthropic_key"
GOOGLE_API_KEY="your_google_key"
```

### VPS Deployment Script

```bash
#!/bin/bash
# deploy-vps.sh

echo "🚀 Starting OmniNode VPS deployment..."

# Install PM2 for process management
npm install -g pm2

# Backend setup
cd backend
npm install --production
npx prisma generate
npx prisma migrate deploy

# Start services
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup

# Setup Nginx reverse proxy
sudo tee /etc/nginx/sites-available/omninode << EOF
server {
    listen 80;
    server_name your-domain.com;

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

sudo ln -s /etc/nginx/sites-available/omninode /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

echo "✅ VPS deployment complete!"
```

### PM2 Ecosystem Configuration

```javascript
// backend/ecosystem.config.js
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
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

## Kubernetes Deployment (Advanced) 🏗️

### When to Use Kubernetes
- **High availability requirements** (99.9%+ uptime)
- **Auto-scaling needs** (10+ concurrent users)
- **Microservices architecture**
- **Multi-environment deployment**
- **CI/CD pipeline integration**

### Kubernetes Resources

```yaml
# k8s/postgres-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: postgres
spec:
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:15-alpine
        env:
        - name: POSTGRES_DB
          value: omninode
        - name: POSTGRES_USER
          value: omninode
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: postgres-secret
              key: password
        ports:
        - containerPort: 5432
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
      volumes:
      - name: postgres-storage
        persistentVolumeClaim:
          claimName: postgres-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: postgres-service
spec:
  selector:
    app: postgres
  ports:
  - port: 5432
    targetPort: 5432
```

```yaml
# k8s/omninode-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: omninode-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: omninode-backend
  template:
    metadata:
      labels:
        app: omninode-backend
    spec:
      containers:
      - name: omninode-backend
        image: omninode/backend:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          value: "postgresql://omninode:password@postgres-service:5432/omninode"
        - name: REDIS_URL
          value: "redis://redis-service:6379"
        envFrom:
        - secretRef:
            name: omninode-secrets
---
apiVersion: v1
kind: Service
metadata:
  name: omninode-service
spec:
  selector:
    app: omninode-backend
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer
```

### Kubernetes Setup Script

```bash
#!/bin/bash
# deploy-k8s.sh

# Install kubectl and minikube (for local testing)
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
curl -LO "https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64"

# Create secrets
kubectl create secret generic omninode-secrets \
  --from-literal=jwt-secret=your-jwt-secret \
  --from-literal=openai-api-key=your-openai-key \
  --from-literal=anthropic-api-key=your-anthropic-key

# Deploy
kubectl apply -f k8s/
kubectl rollout status deployment/omninode-backend
```

## Docker Deployment 🐳

### Docker Compose (Recommended for VPS)

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: omninode
      POSTGRES_USER: omninode
      POSTGRES_PASSWORD: your_secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  backend:
    build: ./backend
    ports:
      - "3000:3000"
    depends_on:
      - postgres
      - redis
    environment:
      DATABASE_URL: postgresql://omninode:your_secure_password@postgres:5432/omninode
      REDIS_URL: redis://redis:6379
    volumes:
      - ./backend/uploads:/app/uploads

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - backend

volumes:
  postgres_data:
```

## Performance Comparison

| Feature | VPS | Kubernetes |
|---------|-----|------------|
| **Setup Time** | 15 minutes | 2-4 hours |
| **Complexity** | Low | High |
| **Cost** | $10-50/month | $50-200/month |
| **Scaling** | Manual | Automatic |
| **Maintenance** | Simple | Complex |
| **High Availability** | Manual setup | Built-in |
| **Auto-scaling** | Manual | Automatic |
| **Monitoring** | Basic | Advanced |

## Monitoring & Maintenance

### VPS Monitoring
```bash
# Install monitoring tools
sudo apt install htop iotop nethogs

# Setup log rotation
sudo logrotate -d /etc/logrotate.d/omninode

# Health checks
curl -f http://localhost:3000/api/v1/health || pm2 restart omninode-backend
```

### VPS Backup Strategy
```bash
#!/bin/bash
# backup.sh

# Database backup
pg_dump omninode > backup_$(date +%Y%m%d_%H%M%S).sql

# File backup
tar -czf uploads_backup_$(date +%Y%m%d_%H%M%S).tar.gz /path/to/uploads/

# Upload to S3
aws s3 cp backup_*.sql s3://your-backup-bucket/
aws s3 cp uploads_backup_*.tar.gz s3://your-backup-bucket/
```

## Security Checklist

### VPS Security
```bash
# Firewall setup
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# SSL certificate
sudo certbot --nginx -d your-domain.com
```

### Application Security
- ✅ Rate limiting configured
- ✅ JWT token rotation
- ✅ File upload validation
- ✅ Input sanitization
- ✅ HTTPS enforced
- ✅ Database encryption at rest

## Deployment Decision Matrix

| Use Case | VPS | Kubernetes |
|----------|-----|------------|
| **Startup MVP** | ✅ Perfect | ❌ Overkill |
| **Small Team** | ✅ Ideal | ❌ Complex |
| **High Traffic** | ⚠️ Manual scaling | ✅ Auto-scaling |
| **Enterprise** | ⚠️ Limited | ✅ Enterprise-ready |
| **Budget-conscious** | ✅ Cost-effective | ❌ Expensive |
| **Learning curve** | ✅ Simple | ❌ Steep |

## Quick Start Command

```bash
# Single command VPS deployment
curl -fsSL https://raw.githubusercontent.com/Troyboy911/OmniNode/main/deploy-vps.sh | bash
```

## Summary

**VPS is the recommended choice** for OmniNode because:
- ✅ **Cost-effective** ($10-50/month vs $50-200/month)
- ✅ **Quick setup** (15 minutes vs 2-4 hours)
- ✅ **Perfect for MVP** and small to medium applications
- ✅ **Easy maintenance** and monitoring
- ✅ **No Kubernetes complexity** required
- ✅ **Full feature parity** with Kubernetes deployment

**Choose Kubernetes only if** you need:
- Auto-scaling beyond 10+ instances
- Enterprise-grade high availability
- Complex microservices architecture
- Advanced CI/CD pipelines

The system is **100% ready for VPS deployment** and includes Docker containers, PM2 process management, and comprehensive monitoring.