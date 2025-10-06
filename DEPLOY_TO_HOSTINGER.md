# Deploy to Hostinger VPS - Quick Guide
## VPS IP: 72.60.210.231
## Repository: https://github.com/dpicsal/Expense-Tracker-A

---

## Step 1: Connect to Your VPS

```bash
ssh root@72.60.210.231
```

---

## Step 2: Update System & Install Basic Tools

```bash
# Update all packages
sudo apt update && sudo apt upgrade -y

# Install essential tools
sudo apt install -y curl wget git build-essential ufw
```

---

## Step 3: Configure Firewall

```bash
# Allow SSH (CRITICAL - do this first!)
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

---

## Step 4: Install Node.js v20

```bash
# Install Node.js v20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node -v
npm -v
```

---

## Step 5: Install PostgreSQL

```bash
# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Start and enable service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Check status
sudo systemctl status postgresql
```

---

## Step 6: Setup Database

```bash
# Switch to postgres user
sudo -u postgres psql
```

**Inside PostgreSQL prompt, run these commands:**

```sql
-- Set strong password for postgres superuser
ALTER USER postgres WITH ENCRYPTED PASSWORD 'YourStrongPassword123!';

-- Create database
CREATE DATABASE expense_tracker;

-- Create application user
CREATE ROLE expense_app WITH LOGIN PASSWORD 'ExpenseApp2024!';

-- Grant privileges
GRANT CONNECT ON DATABASE expense_tracker TO expense_app;
GRANT ALL PRIVILEGES ON DATABASE expense_tracker TO expense_app;

-- Connect to the database
\c expense_tracker

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO expense_app;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO expense_app;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO expense_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO expense_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO expense_app;

-- Exit
\q
```

```bash
# Configure PostgreSQL to listen on localhost only
sudo nano /etc/postgresql/*/main/postgresql.conf
```

**Find and ensure this line:**
```
listen_addresses = 'localhost'
```

```bash
# Configure authentication
sudo nano /etc/postgresql/*/main/pg_hba.conf
```

**Ensure these lines exist:**
```
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

## Step 7: Install PM2

```bash
# Install PM2 globally
sudo npm install -g pm2

# Verify installation
pm2 -v
```

---

## Step 8: Generate SSL Certificate

```bash
# Create SSL directory
sudo mkdir -p /etc/ssl/expense-tracker
cd /etc/ssl/expense-tracker

# Create OpenSSL config file
sudo nano ip-cert.conf
```

**Paste this content:**

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
CN = 72.60.210.231

[req_ext]
subjectAltName = @alt_names

[v3_req]
keyUsage = keyEncipherment, dataEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
IP.1 = 72.60.210.231
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

## Step 9: Install & Configure Nginx

```bash
# Install Nginx
sudo apt install -y nginx

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

```bash
# Create configuration file
sudo nano /etc/nginx/sites-available/expense-tracker
```

**Paste this configuration:**

```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name 72.60.210.231;
    
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name 72.60.210.231;

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
    
    # Cache static assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2)$ {
        proxy_pass http://localhost:5000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
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

## Step 10: Deploy Application

```bash
# Create app directory
sudo mkdir -p /var/www/expense-tracker
sudo chown -R $USER:$USER /var/www/expense-tracker
cd /var/www/expense-tracker

# Clone repository
git clone https://github.com/dpicsal/Expense-Tracker-A.git .
```

---

## Step 11: Configure Environment Variables

```bash
# Create .env file
nano .env
```

**Paste this content (update passwords as needed):**

```env
NODE_ENV=production
PORT=5000

# Database Configuration
DATABASE_URL=postgresql://expense_app:ExpenseApp2024!@localhost:5432/expense_tracker

# App URL
APP_URL=https://72.60.210.231

# Optional: AI API Keys (add if you want to use AI features)
# GEMINI_API_KEY=your_gemini_api_key_here
# OPENAI_API_KEY=your_openai_api_key_here
```

**Save and exit (Ctrl+X, then Y, then Enter)**

```bash
# Secure the .env file
chmod 600 .env
```

---

## Step 12: Install Dependencies & Build

```bash
# Install all dependencies
npm install

# Build the application
npm run build
```

---

## Step 13: Initialize Database

```bash
# Push database schema
npm run db:push
```

If you see a warning about data loss, use:
```bash
npm run db:push -- --force
```

---

## Step 14: Start with PM2

```bash
# Create logs directory
mkdir -p logs

# Create PM2 ecosystem config
nano ecosystem.config.js
```

**Paste this content:**

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
# Start application with PM2
pm2 start ecosystem.config.js

# Save PM2 process list
pm2 save

# Configure PM2 to start on system boot
pm2 startup

# Run the command that PM2 outputs (it will look like):
# sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u root --hp /root
```

---

## Step 15: Verify Application

```bash
# Check PM2 status
pm2 list

# View logs
pm2 logs expense-tracker

# Check if app is responding
curl http://localhost:5000
```

---

## Step 16: Access Your Application

Open your browser and go to:

**https://72.60.210.231**

**Note:** You'll see a security warning about the self-signed certificate. This is expected. Click:
- "Advanced" → "Proceed to 72.60.210.231 (unsafe)"

Your connection IS encrypted, but the browser can't verify the certificate authority since it's self-signed.

---

## Useful Commands

### PM2 Management
```bash
# View status
pm2 list

# View logs
pm2 logs expense-tracker

# Restart app
pm2 restart expense-tracker

# Stop app
pm2 stop expense-tracker

# Monitor resources
pm2 monit
```

### Update Application
```bash
cd /var/www/expense-tracker
git pull origin main
npm install
npm run build
npm run db:push
pm2 reload expense-tracker
```

### Check Logs
```bash
# App logs
pm2 logs expense-tracker

# Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

### Database Backup
```bash
# Manual backup
pg_dump -U expense_app -h localhost expense_tracker > backup_$(date +%Y%m%d).sql
```

---

## Troubleshooting

### If app won't start:
```bash
pm2 logs expense-tracker --lines 100
pm2 restart expense-tracker
```

### If can't access website:
```bash
sudo systemctl status nginx
sudo nginx -t
sudo systemctl restart nginx
```

### If database connection fails:
```bash
sudo systemctl status postgresql
psql -U expense_app -d expense_tracker -h localhost
```

---

## 🎉 Your app is now live at: https://72.60.210.231

Remember to:
- ✅ Keep your database passwords secure
- ✅ Regularly update your application
- ✅ Set up database backups
- ✅ Monitor logs for any issues
