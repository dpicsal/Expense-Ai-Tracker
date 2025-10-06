# Hostinger VPS Deployment Guide
Complete step-by-step guide to deploy your Expense Tracker application to Hostinger VPS.

---

## Prerequisites
- Hostinger VPS with root access
- Domain name pointed to your VPS IP (optional but recommended)
- Your application code ready (via Git or local files)

---

## Step 1: Access Your VPS

```bash
ssh root@your-vps-ip-address
# Enter your password when prompted
```

---

## Step 2: Update System & Install Node.js

```bash
# Update system packages
apt update && apt upgrade -y

# Install Node.js (LTS version)
curl -fsSL https://deb.nodesource.com/setup_lts.x | bash -
apt install -y nodejs

# Verify installation
node --version
npm --version
```

---

## Step 3: Install PM2 Process Manager

PM2 keeps your app running and restarts it automatically if it crashes:

```bash
npm install -g pm2

# Verify installation
pm2 --version
```

---

## Step 4: Install Git

```bash
apt install -y git
```

---

## Step 5: Upload Your Application

### Option A: Using Git (Recommended)

```bash
# Navigate to web directory
cd /var/www/

# Clone your repository
git clone https://github.com/your-username/your-repo.git expense-tracker
cd expense-tracker

# Install dependencies
npm install
```

### Option B: Using SCP (from your local machine)

```bash
# From your local machine, upload files to VPS
scp -r /path/to/your/app root@your-vps-ip:/var/www/expense-tracker

# Then SSH into VPS and install dependencies
ssh root@your-vps-ip
cd /var/www/expense-tracker
npm install
```

---

## Step 6: Set Up Environment Variables

Create a `.env` file with your configuration:

```bash
cd /var/www/expense-tracker
nano .env
```

Add these variables (customize with your actual values):

```env
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/expense_tracker
APP_URL=https://yourdomain.com
GEMINI_API_KEY=your_gemini_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
```

**Save and exit:** Press `Ctrl+X`, then `Y`, then `Enter`

---

## Step 7: Set Up PostgreSQL Database

### Option A: Use Existing Neon Database (Easiest)

- Just use your existing DATABASE_URL from Replit
- No database setup needed on VPS
- Update DATABASE_URL in your .env file

### Option B: Install PostgreSQL on VPS

```bash
# Install PostgreSQL
apt install -y postgresql postgresql-contrib

# Start PostgreSQL
systemctl start postgresql
systemctl enable postgresql

# Create database and user
sudo -u postgres psql << EOF
CREATE DATABASE expense_tracker;
CREATE USER expense_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE expense_tracker TO expense_user;
\q
EOF
```

Update your `.env` with local database URL:
```env
DATABASE_URL=postgresql://expense_user:your_secure_password@localhost:5432/expense_tracker
```

---

## Step 8: Build Your Application

```bash
cd /var/www/expense-tracker

# Build the app
npm run build

# Push database schema (creates all tables)
npm run db:push
```

If you get a data-loss warning, use:
```bash
npm run db:push --force
```

---

## Step 9: Start Your App with PM2

```bash
# Start the application
pm2 start npm --name "expense-tracker" -- start

# Save PM2 configuration
pm2 save

# Set PM2 to start on system boot
pm2 startup
# Follow the command it outputs and run it
```

---

## Step 10: Install & Configure Nginx

Nginx will serve your app to the internet:

```bash
# Install Nginx
apt install -y nginx

# Create Nginx configuration
nano /etc/nginx/sites-available/expense-tracker
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
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

**Save and exit:** Press `Ctrl+X`, then `Y`, then `Enter`

Enable the site:

```bash
# Create symbolic link
ln -s /etc/nginx/sites-available/expense-tracker /etc/nginx/sites-enabled/

# Remove default site (optional)
rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
nginx -t

# Restart Nginx
systemctl restart nginx
```

---

## Step 11: Configure Firewall

```bash
# Allow Nginx traffic
ufw allow 'Nginx Full'

# Allow SSH (IMPORTANT - don't lock yourself out!)
ufw allow OpenSSH

# Enable firewall
ufw enable
```

---

## Step 12: Set Up SSL Certificate (HTTPS)

```bash
# Install Certbot
apt install -y certbot python3-certbot-nginx

# Get SSL certificate
certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Follow prompts and enter your email
# Certificate will auto-renew every 90 days
```

---

## Step 13: Configure Telegram Bot Webhook

After deployment:

1. Open your app at `https://yourdomain.com`
2. Go to **Settings** page
3. Configure your Telegram bot token
4. Enable the bot
5. The webhook will automatically use your APP_URL

---

## Step 14: Verify Everything Works

```bash
# Check if app is running
pm2 status

# View app logs
pm2 logs expense-tracker

# Check Nginx status
systemctl status nginx

# Test your app locally
curl http://localhost:5000
```

**Visit your domain:** `https://yourdomain.com`

---

## Managing Your Application

### Restart App After Code Changes

```bash
cd /var/www/expense-tracker
git pull  # if using git
npm install  # if dependencies changed
npm run build
pm2 restart expense-tracker
```

### View Logs

```bash
# View all logs
pm2 logs expense-tracker

# View last 50 lines
pm2 logs expense-tracker --lines 50

# Monitor in real-time
pm2 monit
```

### Stop/Start App

```bash
# Stop app
pm2 stop expense-tracker

# Start app
pm2 start expense-tracker

# Restart app
pm2 restart expense-tracker
```

### Check App Status

```bash
pm2 status
pm2 info expense-tracker
```

---

## Troubleshooting

### App Not Starting?

```bash
# Check logs for errors
pm2 logs expense-tracker --lines 50

# Check if port 5000 is in use
lsof -i :5000

# Restart app
pm2 restart expense-tracker
```

### Database Connection Error?

- Check `DATABASE_URL` in `.env` file
- Make sure database exists: `psql -U postgres -c "\l"`
- Verify user has permissions
- Test connection: `psql "your_database_url"`

### Domain Not Working?

- Make sure DNS is pointed to your VPS IP
- Check Nginx configuration: `nginx -t`
- Check firewall: `ufw status`
- View Nginx error logs: `tail -f /var/log/nginx/error.log`

### SSL Certificate Issues?

```bash
# Renew certificate manually
certbot renew

# Check certificate status
certbot certificates
```

### App Running But Not Accessible?

```bash
# Check if app is listening
netstat -tulpn | grep :5000

# Check Nginx is running
systemctl status nginx

# Check firewall
ufw status
```

---

## Updating Your Application

When you make changes to your code:

```bash
# SSH into VPS
ssh root@your-vps-ip

# Navigate to app directory
cd /var/www/expense-tracker

# Pull latest changes (if using Git)
git pull

# Install any new dependencies
npm install

# Rebuild the app
npm run build

# Update database schema if needed
npm run db:push

# Restart the app
pm2 restart expense-tracker

# Check status
pm2 status
```

---

## Database Backup

### Create Backup

```bash
# If using local PostgreSQL
pg_dump -U expense_user expense_tracker > backup_$(date +%Y%m%d).sql

# If using Neon, export from their dashboard
```

### Restore Backup

```bash
# If using local PostgreSQL
psql -U expense_user expense_tracker < backup_20240101.sql
```

---

## Security Best Practices

1. **Use Strong Passwords**
   - Database passwords
   - VPS root password
   - Consider using SSH keys instead of passwords

2. **Keep System Updated**
   ```bash
   apt update && apt upgrade -y
   ```

3. **Enable Firewall**
   - Only allow necessary ports (80, 443, 22)

4. **Regular Backups**
   - Set up automated database backups
   - Keep backups off-site

5. **Monitor Logs**
   ```bash
   pm2 logs expense-tracker
   tail -f /var/log/nginx/error.log
   ```

---

## Performance Optimization

### Enable Nginx Caching

Add to your Nginx config:

```nginx
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m max_size=1g inactive=60m;

location / {
    proxy_cache my_cache;
    proxy_cache_valid 200 60m;
    # ... rest of proxy settings
}
```

### PM2 Cluster Mode

For better performance with multiple CPU cores:

```bash
pm2 start npm --name "expense-tracker" -i max -- start
```

---

## Useful Commands Reference

```bash
# System
apt update && apt upgrade -y          # Update system
systemctl restart nginx               # Restart Nginx
ufw status                           # Check firewall

# PM2
pm2 list                             # List all apps
pm2 restart expense-tracker          # Restart app
pm2 logs expense-tracker             # View logs
pm2 monit                            # Monitor resources
pm2 stop expense-tracker             # Stop app
pm2 delete expense-tracker           # Remove app from PM2

# Database
psql -U postgres                     # Access PostgreSQL
\l                                   # List databases
\c expense_tracker                   # Connect to database
\dt                                  # List tables

# Nginx
nginx -t                             # Test configuration
systemctl status nginx               # Check status
tail -f /var/log/nginx/error.log    # View error logs

# SSL
certbot renew                        # Renew certificates
certbot certificates                 # List certificates
```

---

## Support & Help

If you encounter issues:

1. Check logs: `pm2 logs expense-tracker`
2. Verify environment variables: `cat .env`
3. Test database connection
4. Check Nginx configuration: `nginx -t`
5. Review firewall settings: `ufw status`

---

## Summary

Your expense tracker app is now deployed on Hostinger VPS with:

✅ Node.js application running with PM2
✅ PostgreSQL database
✅ Nginx reverse proxy
✅ SSL/HTTPS encryption
✅ Automatic restart on server reboot
✅ Telegram bot integration
✅ AI features (Gemini & OpenAI)

**Your app URL:** https://yourdomain.com

All features work exactly as they did on Replit!
