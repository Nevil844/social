# 🚀 Production Deployment Guide

This guide walks you through deploying the Social Virtual Workspace to AWS EC2.

## 📋 Prerequisites

1. **AWS EC2 Instance** (Ubuntu 20.04+ recommended)
2. **Google Cloud Console** account for OAuth
3. **Domain name** (optional but recommended)

## 🛠️ EC2 Setup

### 1. Launch EC2 Instance

- **Instance Type**: t3.micro or larger
- **OS**: Ubuntu 20.04 LTS
- **Storage**: 20GB+ 
- **Security Group**: Open ports 22 (SSH), 80 (HTTP), 443 (HTTPS), 3001 (App)

### 2. Connect to EC2

```bash
ssh -i your-key.pem ubuntu@your-ec2-ip
```

### 3. Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Git
sudo apt install git -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Restart session (or logout/login)
newgrp docker
```

## 🔐 Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Go to **Credentials** > **Create Credentials** > **OAuth 2.0 Client ID**
5. Add authorized redirect URIs:
   - `http://your-ec2-ip:3001/auth/google/callback`
   - `https://your-domain.com:3001/auth/google/callback` (if using domain)
6. Save the **Client ID** and **Client Secret**

## 📦 Deploy Application

### 1. Clone Repository

```bash
git clone https://github.com/Nevil844/social.git
cd social
```

### 2. Configure Environment

```bash
# Copy environment template
cp server/env.production.template server/.env

# Edit environment file
nano server/.env
```

**Required environment variables:**
```bash
NODE_ENV=production
PORT=3001
DOMAIN=your-ec2-ip-or-domain.com
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
SESSION_SECRET=your-super-secret-session-key-change-this
JWT_SECRET=your-jwt-secret-key-for-token-signing
```

### 3. Run Deployment Script

```bash
# Make script executable
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

## 🎯 Post-Deployment

### Access Your Application

- **Main App**: `http://your-ec2-ip:3001`
- **Health Check**: `http://your-ec2-ip:3001/health`
- **Active Users**: `http://your-ec2-ip:3001/api/who-is-online`

### Monitor Application

```bash
# View logs
docker-compose logs -f

# Check container status
docker-compose ps

# View server logs in real-time
docker-compose exec social tail -f logs/server.log

# Check who's logged in
docker-compose exec social npm run who
```

## 🔧 Management Commands

```bash
# Restart application
docker-compose restart

# Stop application
docker-compose down

# Update application
git pull
docker-compose up --build -d

# View active users
curl http://localhost:3001/api/who-is-online

# Backup logs
cp -r server/logs/ backup-$(date +%Y%m%d)/
```

## 🌐 Domain Setup (Optional)

### 1. Point Domain to EC2

- Create A record: `your-domain.com` → `your-ec2-ip`
- Create A record: `*.your-domain.com` → `your-ec2-ip`

### 2. Update Environment

```bash
# Edit .env file
nano server/.env

# Change DOMAIN to your domain
DOMAIN=your-domain.com
```

### 3. Setup SSL (Recommended)

```bash
# Install Certbot
sudo apt install certbot -y

# Get SSL certificate
sudo certbot certonly --standalone -d your-domain.com

# Configure reverse proxy (nginx example)
sudo apt install nginx -y
```

Example nginx config (`/etc/nginx/sites-available/social`):
```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name your-domain.com;
    
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🛡️ Security Recommendations

1. **Firewall**: Configure UFW firewall
```bash
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 3001
sudo ufw enable
```

2. **Auto-updates**: Enable automatic security updates
```bash
sudo apt install unattended-upgrades -y
sudo dpkg-reconfigure unattended-upgrades
```

3. **Log Rotation**: Setup log rotation for application logs
```bash
sudo nano /etc/logrotate.d/social-app
```

## 🚨 Troubleshooting

### Application won't start
```bash
# Check logs
docker-compose logs

# Check environment file
cat server/.env

# Verify Docker
docker ps -a
```

### Can't access from browser
```bash
# Check if port is open
sudo netstat -tlnp | grep 3001

# Check security group settings in AWS console
# Ensure port 3001 is open for 0.0.0.0/0
```

### OAuth not working
```bash
# Verify redirect URLs in Google Console
# Check DOMAIN in .env file
# Ensure CORS is configured correctly
```

## 📊 Monitoring & Logs

### View User Activity
```bash
# Who's currently online
curl http://localhost:3001/api/who-is-online

# Recent login history  
docker-compose exec social npm run recent

# Real-time user logs
docker-compose exec social tail -f logs/users.log
```

### Application Health
```bash
# Health check
curl http://localhost:3001/health

# Container status
docker-compose ps

# Resource usage
docker stats
```

---

## 🎉 Success!

Your Social Virtual Workspace is now running in production! 

- **Main App**: `https://your-domain.com` or `http://your-ec2-ip:3001`
- **User Monitoring**: `http://your-domain.com/api/who-is-online`
- **Logs**: Real-time logging to `server/logs/`

Happy collaborating! 🚀 