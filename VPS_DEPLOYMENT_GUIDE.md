# Secure VPS Deployment Guide - IP Address Only

This guide will help you deploy your expense tracking application on a Hostinger VPS with IP-only access (no domain) and full security hardening.

## Prerequisites

- Hostinger VPS account (minimum plan)
- SSH client (PuTTY for Windows, or Terminal for Mac/Linux)
- Your VPS IP address
- Basic command line knowledge

---

## Part 1: Initial VPS Setup & Security

### Step 1: Connect to Your VPS

```bash
# Connect via SSH
ssh root@YOUR_VPS_IP

# Example:
# ssh root@203.0.113.45
```

### Step 2: Update System & Install Basic Tools

```bash
# Update all packages
sudo apt update && sudo apt upgrade -y

# Install essential tools
sudo apt install -y curl wget git build-essential ufw
```

### Step 3: Configure Firewall (UFW)

```bash
# Allow SSH (CRITICAL - do this first!)
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow PostgreSQL (only from localhost - secure!)
# We'll access it via the app, not directly

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

---

## Part 2: Install Node.js & PostgreSQL

### Step 4: Install Node.js (v20 LTS)

```bash
# Install Node.js v20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node -v
npm -v
```

### Step 5: Install PostgreSQL

```bash
# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Start and enable service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Check status
sudo systemctl status postgresql
```

### Step 6: Secure PostgreSQL

```bash
# Switch to postgres user
sudo -u postgres psql

# Inside PostgreSQL prompt, run:
```

```sql
-- Set strong password for postgres superuser
ALTER USER postgres WITH ENCRYPTED PASSWORD 'YOUR_STRONG_PASSWORD_HERE';

-- Create database for your app
CREATE DATABASE expense_tracker;

-- Create application user with limited privileges
CREATE ROLE expense_app WITH LOGIN PASSWORD 'YOUR_APP_DB_PASSWORD';

-- Grant privileges
GRANT CONNECT ON DATABASE expense_tracker TO expense_app;
GRANT ALL PRIVILEGES ON DATABASE expense_tracker TO expense_app;

-- Exit
\q
```

```bash
# Configure PostgreSQL to listen on localhost only
sudo nano /etc/postgresql/*/main/postgresql.conf
```

Find and set:
```conf
listen_addresses = 'localhost'
```

```bash
# Configure authentication
sudo nano /etc/postgresql/*/main/pg_hba.conf
```

Ensure these lines exist (change `peer` and `trust` to `scram-sha-256`):
```conf
# TYPE  DATABASE        USER            ADDRESS                 METHOD
local   all            postgres                                peer
local   all            all                                     scram-sha-256
host    all            all             127.0.0.1/32            scram-sha-256
host    all            all             ::1/128                 scram-sha-256
```

```bash
# Restart PostgreSQL
sudo systemctl restart postgresql
```

---

## Part 3: Install PM2 Process Manager

```bash
# Install PM2 globally
sudo npm install -g pm2

# Verify installation
pm2 -v
```

---

## Part 4: SSL Certificate Setup (IP Address)

Since you're using IP-only (no domain), we'll create a self-signed SSL certificate.

### Step 7: Generate Self-Signed SSL Certificate

```bash
# Create SSL directory
sudo mkdir -p /etc/ssl/expense-tracker
cd /etc/ssl/expense-tracker

# Create OpenSSL config file
sudo nano ip-cert.conf
```

Paste this content (replace `YOUR_VPS_IP` with your actual IP):

```ini
[req]
default_bits = 2048
distinguished_name = req_distinguished_name
req_extensions = req_ext
x509_extensions = v3_req
prompt = no

[req_distinguished_name]
C = US
ST = YourState
L = YourCity
O = ExpenseTracker
CN = YOUR_VPS_IP

[req_ext]
subjectAltName = @alt_names

[v3_req]
keyUsage = keyEncipherment, dataEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
IP.1 = YOUR_VPS_IP
```

```bash
# Generate certificate (valid for 365 days)
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout server.key \
  -out server.crt \
  -config ip-cert.conf -extensions v3_req

# Set proper permissions
sudo chmod 600 server.key
sudo chmod 644 server.crt
```

---

## Part 5: Install & Configure Nginx

### Step 8: Install Nginx

```bash
# Install Nginx
sudo apt install -y nginx

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Step 9: Configure Nginx as Reverse Proxy

```bash
# Create configuration file
sudo nano /etc/nginx/sites-available/expense-tracker
```

Paste this configuration (replace `YOUR_VPS_IP`):

```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name YOUR_VPS_IP;
    
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name YOUR_VPS_IP;

    # SSL Configuration
    ssl_certificate /etc/ssl/expense-tracker/server.crt;
    ssl_certificate_key /etc/ssl/expense-tracker/server.key;
    
    # SSL Security Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Proxy to Node.js app
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Increase max body size for file uploads
    client_max_body_size 10M;
}
```

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/expense-tracker /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

---

## Part 6: Deploy Your Application

### Step 10: Create Application Directory

```bash
# Create app directory
sudo mkdir -p /var/www/expense-tracker
sudo chown -R $USER:$USER /var/www/expense-tracker
cd /var/www/expense-tracker
```

### Step 11: Upload Your Application

**Option A: Using Git (Recommended)**

```bash
# If you have the code in a Git repository
git clone YOUR_REPOSITORY_URL .

# Example:
# git clone https://github.com/yourusername/expense-tracker.git .
```

**Option B: Using SCP from your local machine**

From your local machine:
```bash
# Zip your project (exclude node_modules)
tar -czf expense-tracker.tar.gz --exclude='node_modules' --exclude='.git' .

# Upload to VPS
scp expense-tracker.tar.gz root@YOUR_VPS_IP:/var/www/expense-tracker/

# On VPS, extract
tar -xzf expense-tracker.tar.gz
rm expense-tracker.tar.gz
```

### Step 12: Configure Environment Variables

```bash
cd /var/www/expense-tracker

# Create .env file
nano .env
```

Add these environment variables:

```env
NODE_ENV=production
PORT=5000

# Database Configuration (use the password you set earlier)
DATABASE_URL=postgresql://expense_app:YOUR_APP_DB_PASSWORD@localhost:5432/expense_tracker

# App URL (your VPS IP)
APP_URL=https://YOUR_VPS_IP

# Optional: AI API Keys (if you want to use AI features)
GEMINI_API_KEY=your_gemini_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
```

**Important:** Replace:
- `YOUR_APP_DB_PASSWORD` with the password you set for the `expense_app` database user
- `YOUR_VPS_IP` with your actual VPS IP address
- API keys if you plan to use Gemini/OpenAI features

### Step 13: Install Dependencies & Build

```bash
# Install all dependencies
npm install

# Build the application
npm run build
```

### Step 14: Initialize Database Schema

```bash
# Push database schema
npm run db:push
```

---

## Part 7: Start Application with PM2

### Step 15: Create PM2 Ecosystem File

```bash
nano ecosystem.config.js
```

Paste this configuration:

```javascript
module.exports = {
  apps: [{
    name: 'expense-tracker',
    script: 'npm',
    args: 'run start',
    cwd: '/var/www/expense-tracker',
    instances: 'max',
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    min_uptime: '10s',
    max_restarts: 10,
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: '/var/www/expense-tracker/logs/err.log',
    out_file: '/var/www/expense-tracker/logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true
  }]
}
```

```bash
# Create logs directory
mkdir -p logs

# Start application with PM2
pm2 start ecosystem.config.js

# Save PM2 process list
pm2 save

# Configure PM2 to start on system boot
pm2 startup

# Run the command that PM2 outputs (it will be something like):
# sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u your_user --hp /home/your_user
```

### Step 16: Verify Application is Running

```bash
# Check PM2 status
pm2 list

# View logs
pm2 logs expense-tracker

# Monitor in real-time
pm2 monit
```

---

## Part 8: Additional Security Hardening

### Step 17: Secure SSH Access

```bash
# Edit SSH config
sudo nano /etc/ssh/sshd_config
```

Recommended settings:
```conf
# Disable root login (after creating a non-root user)
PermitRootLogin no

# Disable password authentication (use SSH keys instead)
PasswordAuthentication no

# Change default SSH port (optional but recommended)
Port 2222
```

```bash
# Restart SSH
sudo systemctl restart sshd
```

**Note:** Before disabling root login, create a non-root user with sudo privileges:

```bash
# Create new user
sudo adduser yourusername

# Add to sudo group
sudo usermod -aG sudo yourusername

# Add to www-data group (for app files)
sudo usermod -aG www-data yourusername
```

### Step 18: Set Up Fail2Ban (Protection Against Brute Force)

```bash
# Install Fail2Ban
sudo apt install -y fail2ban

# Create local configuration
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local

# Edit configuration
sudo nano /etc/fail2ban/jail.local
```

Find and modify:
```conf
[sshd]
enabled = true
port = 22
maxretry = 3
bantime = 3600
```

```bash
# Start and enable Fail2Ban
sudo systemctl start fail2ban
sudo systemctl enable fail2ban

# Check status
sudo fail2ban-client status
```

### Step 19: Automatic Security Updates

```bash
# Install unattended-upgrades
sudo apt install -y unattended-upgrades

# Enable automatic updates
sudo dpkg-reconfigure -plow unattended-upgrades
```

---

## Part 9: Backup Configuration

### Step 20: Set Up Automated Database Backups

```bash
# Create backup directory
sudo mkdir -p /var/backups/expense-tracker
sudo chown $USER:$USER /var/backups/expense-tracker

# Create backup script
nano /home/$USER/backup-db.sh
```

Paste this script:

```bash
#!/bin/bash

# Configuration
DB_NAME="expense_tracker"
DB_USER="expense_app"
BACKUP_DIR="/var/backups/expense-tracker"
DATE=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_FILE="$BACKUP_DIR/backup_$DATE.sql"

# Create backup
export PGPASSWORD='YOUR_APP_DB_PASSWORD'
pg_dump -U $DB_USER -h localhost $DB_NAME > $BACKUP_FILE

# Compress backup
gzip $BACKUP_FILE

# Delete backups older than 7 days
find $BACKUP_DIR -name "backup_*.sql.gz" -type f -mtime +7 -delete

echo "Backup completed: $BACKUP_FILE.gz"
```

```bash
# Make executable
chmod +x /home/$USER/backup-db.sh

# Test backup
./backup-db.sh

# Schedule daily backups with cron
crontab -e
```

Add this line (runs daily at 2 AM):
```cron
0 2 * * * /home/$USER/backup-db.sh >> /var/log/backup-db.log 2>&1
```

---

## Part 10: Accessing Your Application

### Browser Access

1. Open your browser
2. Go to: `https://YOUR_VPS_IP`
3. You'll see a security warning about the self-signed certificate
4. Click "Advanced" → "Proceed to YOUR_VPS_IP (unsafe)" or similar

**Note:** The security warning is expected with self-signed certificates. Your connection IS encrypted, but the browser can't verify the certificate authority.

### To avoid the warning:

You can manually trust the certificate in your browser:
- **Chrome/Edge**: Go to `chrome://settings/certificates` → Import → Trust
- **Firefox**: Click the padlock → "Connection not secure" → "More information" → "View Certificate" → Download and import as trusted

---

## Part 11: Maintenance & Management

### Common PM2 Commands

```bash
# View status
pm2 list

# View logs
pm2 logs expense-tracker

# Restart app
pm2 restart expense-tracker

# Reload app (zero-downtime)
pm2 reload expense-tracker

# Stop app
pm2 stop expense-tracker

# Delete app from PM2
pm2 delete expense-tracker
```

### Update Application

```bash
# SSH into VPS
ssh root@YOUR_VPS_IP

# Navigate to app directory
cd /var/www/expense-tracker

# Pull latest changes (if using Git)
git pull origin main

# Install new dependencies (if any)
npm install

# Rebuild
npm run build

# Push database changes (if any)
npm run db:push

# Reload app with zero downtime
pm2 reload expense-tracker
```

### Monitor Resources

```bash
# Check disk space
df -h

# Check memory usage
free -h

# Check CPU usage
top

# View Nginx access logs
sudo tail -f /var/log/nginx/access.log

# View Nginx error logs
sudo tail -f /var/log/nginx/error.log

# View app logs
pm2 logs expense-tracker
```

---

## Part 12: Troubleshooting

### Application won't start

```bash
# Check PM2 logs
pm2 logs expense-tracker --lines 100

# Check if port 5000 is in use
sudo lsof -i :5000

# Restart the app
pm2 restart expense-tracker
```

### Can't access website

```bash
# Check Nginx status
sudo systemctl status nginx

# Check Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Check firewall
sudo ufw status
```

### Database connection errors

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check if PostgreSQL is listening
sudo netstat -plnt | grep 5432

# Test database connection
psql -U expense_app -d expense_tracker -h localhost
```

### SSL Certificate issues

```bash
# Verify certificate
openssl x509 -in /etc/ssl/expense-tracker/server.crt -text -noout | grep "IP Address"

# Check certificate expiry
openssl x509 -in /etc/ssl/expense-tracker/server.crt -noout -dates

# Regenerate certificate if needed (follow Step 7 again)
```

---

## Security Checklist

- [ ] Firewall (UFW) is enabled and configured
- [ ] PostgreSQL only listens on localhost
- [ ] Strong passwords set for database users
- [ ] Self-signed SSL certificate generated and installed
- [ ] Nginx configured with security headers
- [ ] PM2 configured to restart on crashes
- [ ] PM2 configured to start on system boot
- [ ] SSH hardened (key-based auth, non-standard port)
- [ ] Fail2Ban installed and configured
- [ ] Automatic security updates enabled
- [ ] Database backups scheduled
- [ ] Environment variables properly set in .env
- [ ] .env file permissions restricted (chmod 600)

---

## Performance Optimization

### Enable Nginx Caching

```bash
sudo nano /etc/nginx/sites-available/expense-tracker
```

Add inside the `server` block:

```nginx
# Cache static assets
location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### Enable Gzip Compression

```bash
sudo nano /etc/nginx/nginx.conf
```

Ensure these lines are uncommented:

```nginx
gzip on;
gzip_vary on;
gzip_proxied any;
gzip_comp_level 6;
gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/rss+xml font/truetype font/opentype application/vnd.ms-fontobject image/svg+xml;
```

```bash
# Restart Nginx
sudo systemctl restart nginx
```

---

## Cost Estimate

- **Hostinger VPS**: Starting at $4.99/month (KVM 1 plan)
- **Total Monthly Cost**: ~$5/month

---

## Support & Resources

- PostgreSQL Docs: https://www.postgresql.org/docs/
- PM2 Docs: https://pm2.keymetrics.io/docs/
- Nginx Docs: https://nginx.org/en/docs/
- UFW Guide: https://wiki.ubuntu.com/UncomplicatedFirewall

---

**Your expense tracking application is now deployed securely on your Hostinger VPS with IP-only access!** 🚀

The app is accessible at: `https://YOUR_VPS_IP`
