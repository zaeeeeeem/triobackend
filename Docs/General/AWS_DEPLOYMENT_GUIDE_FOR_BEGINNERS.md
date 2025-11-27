# AWS Deployment Guide for Beginners - TRIO Shopify Server

> **Complete step-by-step guide to deploy the TRIO backend on AWS for testing purposes**
>
> This guide is designed for people with little to no AWS/server experience. Every step is explained in detail.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [What You'll Need](#what-youll-need)
3. [Cost Estimate](#cost-estimate)
4. [Architecture Overview](#architecture-overview)
5. [Step-by-Step Deployment](#step-by-step-deployment)
6. [Common Errors and Solutions](#common-errors-and-solutions)
7. [Testing Your Deployment](#testing-your-deployment)
8. [Maintenance and Monitoring](#maintenance-and-monitoring)
9. [Cleanup Instructions](#cleanup-instructions)

---

## Overview

### What We're Deploying

We're deploying the TRIO Shopify Server backend which includes:
- **Node.js/Express API** - Your backend application
- **PostgreSQL Database** - Stores all data
- **Redis** - Caching layer (via Docker)
- **MinIO** - File storage for product images (via Docker)

### Deployment Strategy

We'll use a **cost-effective single-server approach** perfect for testing:
- **1 EC2 Instance** - Runs everything (app, database, Redis, MinIO)
- **Docker** - For Redis and MinIO containers
- **PM2** - To keep the Node.js app running
- **Nginx** - As a reverse proxy (optional but recommended)

---

## What You'll Need

### 1. AWS Account
- Go to [aws.amazon.com](https://aws.amazon.com)
- Click "Create an AWS Account"
- You'll need:
  - Email address
  - Credit/debit card (won't be charged if you stay in free tier)
  - Phone number for verification

### 2. Local Computer Requirements
- Terminal/Command Prompt access
- SSH client (built-in on Mac/Linux, use PuTTY on Windows)
- Text editor (VS Code, Sublime, etc.)

### 3. Your Codebase
- TRIO Shopify Server code (the current project)
- `.env` file with your credentials

---

## Cost Estimate

### Free Tier (First 12 Months)
If you're within AWS Free Tier:
- **EC2 t2.micro:** FREE (750 hours/month)
- **Storage (30GB):** FREE
- **Data Transfer (15GB):** FREE

**Total: $0/month** ✅

### After Free Tier or Larger Instance
If you need t3.medium for better performance:
- **EC2 t3.medium:** ~$30/month
- **Storage (30GB):** ~$3/month
- **Data Transfer:** ~$1-5/month

**Total: ~$35-40/month**

### This Guide Uses: t2.micro (FREE) for testing ✅

---

## Architecture Overview

```
Internet
   ↓
AWS EC2 Instance (t2.micro)
   ├─ Node.js App (Port 5000)
   ├─ PostgreSQL (Port 5432)
   ├─ Docker Container: Redis (Port 6379)
   ├─ Docker Container: MinIO (Port 9000, 9001)
   └─ Nginx (Port 80) → Node.js (Optional)
```

**Why all on one server?**
- **Cost-effective** - Free tier eligible
- **Simple** - Easier to manage for testing
- **Fast setup** - Less configuration needed
- **Easy troubleshooting** - Everything in one place

---

## Step-by-Step Deployment

## Phase 1: AWS Setup (20 minutes)

### Step 1.1: Create EC2 Instance

**What is EC2?** EC2 is a virtual computer in the cloud that you can rent from AWS.

1. **Login to AWS Console**
   - Go to [console.aws.amazon.com](https://console.aws.amazon.com)
   - Sign in with your credentials

2. **Navigate to EC2**
   - In the search bar at top, type "EC2"
   - Click "EC2" - Virtual Servers in the Cloud

3. **Launch Instance**
   - Click orange "Launch Instance" button
   - You'll see a form to configure your server

4. **Configure Instance**

   **Name:**
   ```
   trio-backend-testing
   ```

   **Application and OS Image (AMI):**
   - Select "Ubuntu Server 22.04 LTS"
   - 64-bit (x86)
   - **Why Ubuntu?** Most beginner-friendly Linux, great community support

   **Instance Type:**
   - Select "t2.micro" (Free tier eligible)
   - 1 vCPU, 1 GB RAM
   - **Note:** This is sufficient for testing, but may be slow with many users

   **Key Pair (Login):**
   - Click "Create new key pair"
   - Name: `trio-backend-key`
   - Key pair type: RSA
   - Private key format: `.pem` (Mac/Linux) or `.ppk` (Windows with PuTTY)
   - Click "Create key pair"
   - **IMPORTANT:** File will download - keep it safe! You can't download it again.
   - Move it to a safe location like `~/.ssh/` on Mac/Linux

   **Network Settings:**
   - Click "Edit"
   - Auto-assign public IP: **Enable**
   - Firewall (Security Groups): **Create security group**
   - Security group name: `trio-backend-sg`
   - Description: `Security group for TRIO backend`

   **Add these rules:**

   | Type | Protocol | Port | Source | Description |
   |------|----------|------|--------|-------------|
   | SSH | TCP | 22 | My IP | SSH access |
   | HTTP | TCP | 80 | Anywhere (0.0.0.0/0) | Web traffic |
   | HTTPS | TCP | 443 | Anywhere (0.0.0.0/0) | Secure web traffic |
   | Custom TCP | TCP | 5000 | Anywhere (0.0.0.0/0) | Node.js API |
   | Custom TCP | TCP | 9000 | Anywhere (0.0.0.0/0) | MinIO |
   | Custom TCP | TCP | 9001 | Anywhere (0.0.0.0/0) | MinIO Console |

   **Configure Storage:**
   - Size: 30 GB (free tier eligible)
   - Volume type: gp3 (General Purpose SSD)

5. **Review and Launch**
   - Review all settings
   - Click "Launch Instance".
   - Wait 2-3 minutes for instance to start

6. **Get Your Server IP**
   - Go to EC2 Dashboard → Instances
   - Click on your instance
   - Copy the "Public IPv4 address" (e.g., `3.145.67.89`)
   - Save this IP - you'll need it throughout the guide

---

### Step 1.2: Connect to Your Server

**On Mac/Linux:**

1. **Set Key Permissions**
   ```bash
   chmod 400 ~/.ssh/trio-backend-key.pem
   ```

2. **Connect via SSH**
   ```bash
   ssh -i ~/.ssh/trio-backend-key.pem ubuntu@YOUR_SERVER_IP
   ```
   Replace `YOUR_SERVER_IP` with the IP you copied

3. **First Connection**
   - You'll see: "Are you sure you want to continue connecting?"
   - Type `yes` and press Enter

**On Windows:**

1. **Using PowerShell (Windows 10+):**
   ```powershell
   ssh -i C:\path\to\trio-backend-key.pem ubuntu@YOUR_SERVER_IP
   ```

2. **Using PuTTY:**
   - Download PuTTY from [putty.org](https://www.putty.org/)
   - Convert `.pem` to `.ppk` using PuTTYgen (included with PuTTY)
   - Open PuTTY
   - Host: `ubuntu@YOUR_SERVER_IP`
   - Connection → SSH → Auth: Browse for your `.ppk` file
   - Click "Open"

**You should now see:**
```
Welcome to Ubuntu 22.04 LTS
ubuntu@ip-xxx-xxx-xxx-xxx:~$
```

Congratulations! You're connected to your server! 🎉

---

## Phase 2: Server Setup (30 minutes)

### Step 2.1: Update System

**What does this do?** Updates all software on the server to latest secure versions.

```bash
sudo apt update && sudo apt upgrade -y
```

This takes 3-5 minutes. You'll see lots of text scrolling.

---

### Step 2.2: Install Node.js

**What is Node.js?** Runtime environment to run your backend code.

```bash
# Install Node.js 20 (LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version   # Should show v20.x.x
npm --version    # Should show 10.x.x
```

---

### Step 2.3: Install PostgreSQL

**What is PostgreSQL?** Database where all your data is stored.

```bash
# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verify it's running
sudo systemctl status postgresql
```

Press `q` to exit the status view.

**Create Database and User:**

```bash
# Switch to postgres user
sudo -u postgres psql

# You'll see: postgres=#
# Run these commands one by one:
```

```sql
-- Create database
CREATE DATABASE trio_db;

-- Create user with password
CREATE USER trio_user WITH ENCRYPTED PASSWORD 'your_secure_password_here';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE trio_db TO trio_user;

-- Grant schema privileges (important!)
\c trio_db
GRANT ALL ON SCHEMA public TO trio_user;

-- Exit
\q
```

**Test Connection:**
```bash
psql -h localhost -U trio_user -d trio_db -W
```
Enter password when prompted. If you see `trio_db=>`, it worked! Type `\q` to exit.

---

### Step 2.4: Install Docker

**What is Docker?** Software to run isolated containers (like Redis and MinIO).

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add ubuntu user to docker group (so you don't need sudo)
sudo usermod -aG docker ubuntu

# Logout and login again for group changes
exit
```

**Reconnect to server:**
```bash
ssh -i ~/.ssh/trio-backend-key.pem ubuntu@YOUR_SERVER_IP
```

**Verify Docker:**
```bash
docker --version   # Should show Docker version 20+
docker ps          # Should show empty list (no containers yet)
```

---

### Step 2.5: Install Docker Compose

**What is Docker Compose?** Tool to manage multiple Docker containers easily.

```bash
# Install Docker Compose
sudo apt install -y docker-compose

# Verify
docker-compose --version
```

---

### Step 2.6: Install PM2

**What is PM2?** Process manager that keeps your Node.js app running 24/7.

```bash
# Install PM2 globally
sudo npm install -g pm2

# Verify
pm2 --version
```

---

### Step 2.7: Install Git

```bash
# Install Git
sudo apt install -y git

# Verify
git --version
```

---

## Phase 3: Deploy Application (30 minutes)

### Step 3.1: Upload Your Code

**Option A: Using Git (Recommended)**

If your code is on GitHub/GitLab:

```bash
# Clone your repository
cd ~
git clone https://github.com/YOUR_USERNAME/TRIO-Shopify-Server.git
cd TRIO-Shopify-Server
```

**Option B: Upload via SCP (From Your Local Machine)**

If code is only on your computer:

**On your local machine** (not on server):

```bash
# Navigate to your project folder
cd /path/to/TRIO-Shopify-Server

# Upload to server
scp -i ~/.ssh/trio-backend-key.pem -r ./ ubuntu@YOUR_SERVER_IP:~/TRIO-Shopify-Server/
```

Then SSH back into server:
```bash
ssh -i ~/.ssh/trio-backend-key.pem ubuntu@YOUR_SERVER_IP
cd ~/TRIO-Shopify-Server
```

---

### Step 3.2: Install Dependencies

```bash
# Install Node.js packages
npm install

# This takes 2-3 minutes
# You'll see lots of packages being installed
```

---

### Step 3.3: Setup Docker Containers

Create a Docker Compose file for Redis and MinIO:

```bash
# Create docker-compose.yml
nano docker-compose.yml
```

**Paste this content:**

```yaml
version: '3.8'

services:
  # Redis Cache
  trio-redis:
    image: redis:7-alpine
    container_name: trio-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    command: redis-server --appendonly yes
    networks:
      - trio-network

  # MinIO Object Storage
  trio-minio:
    image: minio/minio:latest
    container_name: trio-minio
    restart: unless-stopped
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin123
    volumes:
      - minio-data:/data
    command: server /data --console-address ":9001"
    networks:
      - trio-network

volumes:
  redis-data:
  minio-data:

networks:
  trio-network:
    driver: bridge
```

**Save and exit:**
- Press `Ctrl + X`
- Press `Y`
- Press `Enter`

**Start containers:**

```bash
# Start Redis and MinIO
docker-compose up -d

# Verify they're running
docker ps

# You should see two containers running
```

**Setup MinIO Bucket:**

1. **Access MinIO Console:**
   - Open browser: `http://YOUR_SERVER_IP:9001`
   - Username: `minioadmin`
   - Password: `minioadmin123`

2. **Create Bucket:**
   - Click "Buckets" in left menu
   - Click "Create Bucket"
   - Bucket Name: `trio-media`
   - Click "Create Bucket"

3. **Set Bucket Public (for testing):**
   - Click on `trio-media` bucket
   - Go to "Access" tab
   - Access Policy: Select "Public"
   - Click "Save"

---

### Step 3.4: Configure Environment Variables

```bash
# Create .env file
nano .env
```

**Paste this and update the values:**

```env
# =====================================================
# SERVER CONFIGURATION
# =====================================================
NODE_ENV=production
PORT=5000
API_VERSION=v1

# =====================================================
# DATABASE CONFIGURATION
# =====================================================
DATABASE_URL="postgresql://trio_user:your_secure_password_here@localhost:5432/trio_db?schema=public"

# =====================================================
# JWT AUTHENTICATION
# =====================================================
# Generate secure secrets (see below)
JWT_SECRET=YOUR_GENERATED_SECRET_HERE
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=YOUR_GENERATED_REFRESH_SECRET_HERE
JWT_REFRESH_EXPIRES_IN=7d

# Customer JWT (different from admin)
CUSTOMER_JWT_SECRET=YOUR_GENERATED_CUSTOMER_SECRET_HERE
CUSTOMER_JWT_REFRESH_SECRET=YOUR_GENERATED_CUSTOMER_REFRESH_SECRET_HERE
CUSTOMER_JWT_ACCESS_EXPIRES_IN=24h
CUSTOMER_JWT_REFRESH_EXPIRES_IN=30d

# =====================================================
# REDIS CACHE
# =====================================================
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# =====================================================
# MinIO (Image Upload)
# =====================================================
AWS_S3_REGION=us-east-1
AWS_S3_BUCKET=trio-media
AWS_S3_ACCESS_KEY_ID=minioadmin
AWS_S3_SECRET_ACCESS_KEY=minioadmin123
AWS_S3_BASE_PREFIX=app/uploads
AWS_S3_ENDPOINT=http://YOUR_SERVER_IP:9000
AWS_S3_FORCE_PATH_STYLE=true
AWS_S3_PUBLIC_URL=http://YOUR_SERVER_IP:9000/trio-media

# =====================================================
# CORS CONFIGURATION
# =====================================================
# Add your frontend URL
ALLOWED_ORIGINS=http://YOUR_SERVER_IP:3000,http://localhost:3000

# =====================================================
# RATE LIMITING
# =====================================================
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# =====================================================
# FILE UPLOAD CONFIGURATION
# =====================================================
MAX_FILE_SIZE=5242880
MAX_FILES_PER_PRODUCT=10

# =====================================================
# PAGINATION
# =====================================================
DEFAULT_PAGE_SIZE=20
MAX_PAGE_SIZE=100

# =====================================================
# Email Service (Use your Gmail or other SMTP)
# =====================================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password-here

# Email Sender Info
EMAIL_FROM_NAME=TRIO Shopify
EMAIL_FROM_ADDRESS=noreply@trio.com

# Frontend URL (for email links)
FRONTEND_URL=http://YOUR_SERVER_IP:3000
```

**Important Updates:**

1. **Replace `YOUR_SERVER_IP`** with your actual EC2 IP
2. **Replace database password** with the one you set earlier
3. **Generate secure JWT secrets:**

```bash
# Generate secrets (run each command separately)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# Copy output and paste as JWT_SECRET

node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# Copy output and paste as JWT_REFRESH_SECRET

node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# Copy output and paste as CUSTOMER_JWT_SECRET

node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# Copy output and paste as CUSTOMER_JWT_REFRESH_SECRET
```

4. **Update email settings** with your SMTP credentials

**Save and exit:** `Ctrl + X`, `Y`, `Enter`

---

### Step 3.5: Build and Setup Database

```bash
# Build TypeScript code
npm run build

# Generate Prisma Client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate deploy

# If above command fails, try:
npx prisma migrate deploy
```

**Common Error:** "Environment variable not found: DATABASE_URL"
- **Solution:** Make sure `.env` file is in the project root
- **Check:** `cat .env | grep DATABASE_URL`

---

### Step 3.6: Start Application with PM2

```bash
# Start app with PM2
pm2 start npm --name "trio-backend" -- start

# Setup PM2 to start on server reboot
pm2 startup
# Copy and run the command it gives you (starts with sudo)

pm2 save

# Check app status
pm2 status

# View logs
pm2 logs trio-backend

# Press Ctrl+C to stop viewing logs
```

---

## Phase 4: Testing (15 minutes)

### Step 4.1: Test Health Endpoint

```bash
# Test from server
curl http://localhost:5000/api/v1/health

# Should return:
# {"success":true,"data":{"status":"healthy",...}}
```

**Test from your browser:**
- Open: `http://YOUR_SERVER_IP:5000/api/v1/health`
- Should see JSON response

---

### Step 4.2: Test API Documentation

**Open Swagger UI:**
- URL: `http://YOUR_SERVER_IP:5000/api-docs`
- You should see interactive API documentation

---

### Step 4.3: Test User Registration

```bash
# From your local machine or server
curl -X POST http://YOUR_SERVER_IP:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "Admin123!@#",
    "name": "Test Admin",
    "role": "ADMIN"
  }'

# Should return user object and tokens
```

---

### Step 4.4: Test Image Upload

1. **Login to get token** (use the registration response token)
2. **Upload test image:**

```bash
curl -X POST http://YOUR_SERVER_IP:5000/api/v1/products/PRODUCT_ID/images \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "images=@/path/to/test-image.jpg"
```

3. **Check MinIO:**
   - Open: `http://YOUR_SERVER_IP:9001`
   - Navigate to `trio-media` bucket
   - You should see uploaded images

---

## Common Errors and Solutions

### Error 1: "Cannot connect to database"

**Symptoms:**
```
Error: P1001: Can't reach database server
```

**Solutions:**

1. **Check PostgreSQL is running:**
```bash
sudo systemctl status postgresql
```

2. **Restart PostgreSQL:**
```bash
sudo systemctl restart postgresql
```

3. **Verify database exists:**
```bash
sudo -u postgres psql -l
# Should list trio_db
```

4. **Test connection:**
```bash
psql -h localhost -U trio_user -d trio_db -W
```

5. **Check DATABASE_URL format:**
```env
DATABASE_URL="postgresql://username:password@localhost:5432/database?schema=public"
```

---

### Error 2: "Redis connection failed"

**Symptoms:**
```
Error: connect ECONNREFUSED 127.0.0.1:6379
```

**Solutions:**

1. **Check Redis container:**
```bash
docker ps | grep redis
```

2. **Restart Redis:**
```bash
docker-compose restart trio-redis
```

3. **View Redis logs:**
```bash
docker logs trio-redis
```

4. **Test Redis connection:**
```bash
docker exec -it trio-redis redis-cli ping
# Should return: PONG
```

---

### Error 3: "MinIO not accessible"

**Symptoms:**
- Can't access `http://YOUR_SERVER_IP:9000`
- Image upload fails

**Solutions:**

1. **Check MinIO container:**
```bash
docker ps | grep minio
```

2. **Restart MinIO:**
```bash
docker-compose restart trio-minio
```

3. **View MinIO logs:**
```bash
docker logs trio-minio
```

4. **Check security group:**
- Go to EC2 → Security Groups
- Ensure ports 9000 and 9001 are open

5. **Verify endpoint in .env:**
```env
AWS_S3_ENDPOINT=http://YOUR_SERVER_IP:9000
```

---

### Error 4: "App crashed or not responding"

**Symptoms:**
- PM2 shows "errored" status
- Can't access API endpoints

**Solutions:**

1. **Check PM2 status:**
```bash
pm2 status
```

2. **View error logs:**
```bash
pm2 logs trio-backend --lines 100
```

3. **Restart app:**
```bash
pm2 restart trio-backend
```

4. **Check if port is in use:**
```bash
sudo lsof -i :5000
```

5. **Rebuild and restart:**
```bash
npm run build
pm2 restart trio-backend
```

---

### Error 5: "Permission denied" errors

**Symptoms:**
```
EACCES: permission denied
```

**Solutions:**

1. **Fix folder permissions:**
```bash
sudo chown -R ubuntu:ubuntu ~/TRIO-Shopify-Server
```

2. **Fix npm permissions:**
```bash
sudo chown -R ubuntu:ubuntu ~/.npm
```

3. **Fix log permissions:**
```bash
sudo chown -R ubuntu:ubuntu ~/TRIO-Shopify-Server/logs
```

---

### Error 6: "Out of memory"

**Symptoms:**
- App crashes randomly
- Server becomes unresponsive

**Solutions:**

1. **Check memory usage:**
```bash
free -h
```

2. **Add swap space (virtual memory):**
```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

3. **Restart services:**
```bash
docker-compose restart
pm2 restart all
```

---

### Error 7: "Module not found"

**Symptoms:**
```
Error: Cannot find module 'xyz'
```

**Solutions:**

1. **Reinstall dependencies:**
```bash
rm -rf node_modules package-lock.json
npm install
```

2. **Rebuild:**
```bash
npm run build
```

3. **Check Node version:**
```bash
node --version  # Should be 20+
```

---

### Error 8: "Port already in use"

**Symptoms:**
```
Error: listen EADDRINUSE: address already in use :::5000
```

**Solutions:**

1. **Find process using port:**
```bash
sudo lsof -i :5000
```

2. **Kill process:**
```bash
sudo kill -9 PID_NUMBER
```

3. **Or change port in .env:**
```env
PORT=5001
```

---

### Error 9: "Cannot access from browser"

**Symptoms:**
- curl works on server, but can't access from browser
- Connection timeout

**Solutions:**

1. **Check security group:**
   - EC2 → Security Groups → Select your SG
   - Inbound rules must have port 5000 open to 0.0.0.0/0

2. **Check if app is listening on all interfaces:**
```typescript
// In src/server.ts or src/app.ts
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on 0.0.0.0:${PORT}`);
});
```

3. **Test with public IP:**
```bash
curl http://YOUR_SERVER_IP:5000/api/v1/health
```

---

## Maintenance and Monitoring

### Daily Checks

**Check app status:**
```bash
pm2 status
```

**Check logs:**
```bash
# Last 50 lines
pm2 logs trio-backend --lines 50

# Follow logs in real-time
pm2 logs trio-backend
```

**Check disk space:**
```bash
df -h
```

**Check memory:**
```bash
free -h
```

---

### Weekly Maintenance

**Update system packages:**
```bash
sudo apt update && sudo apt upgrade -y
```

**Update Docker images:**
```bash
cd ~/TRIO-Shopify-Server
docker-compose pull
docker-compose up -d
```

**Clean Docker:**
```bash
docker system prune -a -f
```

**Backup database:**
```bash
# Create backup
sudo -u postgres pg_dump trio_db > ~/backup_$(date +%Y%m%d).sql

# To restore later:
sudo -u postgres psql trio_db < ~/backup_YYYYMMDD.sql
```

---

### Useful PM2 Commands

```bash
# View status
pm2 status

# Restart app
pm2 restart trio-backend

# Stop app
pm2 stop trio-backend

# View logs
pm2 logs

# View logs for specific app
pm2 logs trio-backend

# Clear logs
pm2 flush

# Monitor resources
pm2 monit

# List all processes
pm2 list

# Delete app from PM2
pm2 delete trio-backend

# Start multiple instances (if you upgrade server)
pm2 start npm --name "trio-backend" -i 2 -- start
```

---

### Monitoring with PM2 Plus (Optional)

**Free monitoring dashboard:**

```bash
# Register for PM2 Plus (free tier)
pm2 plus

# Follow the prompts to create account
# You'll get a web dashboard to monitor your app
```

---

## Scaling Up (Future)

When your app needs more resources:

### Option 1: Upgrade Instance Type

1. Stop instance
2. Actions → Instance Settings → Change Instance Type
3. Select t3.small or t3.medium
4. Start instance

### Option 2: Separate Services

Move to separate servers:
- **EC2 Instance 1:** Node.js app only
- **RDS:** PostgreSQL (managed database)
- **ElastiCache:** Redis (managed cache)
- **S3:** Replace MinIO with AWS S3

---

## Cleanup Instructions

**To avoid charges, delete resources when done testing:**

### Stop Everything

```bash
# On server
pm2 stop all
docker-compose down
```

### Delete EC2 Instance

1. Go to EC2 Console
2. Select your instance
3. Instance State → Terminate Instance
4. Confirm

### Delete Security Group (After instance deleted)

1. EC2 → Security Groups
2. Select `trio-backend-sg`
3. Actions → Delete Security Groups

---

## Security Hardening (Production)

Before going to production, implement these:

### 1. Change Default Passwords

```bash
# Change MinIO credentials
# In docker-compose.yml:
MINIO_ROOT_USER: strong_username
MINIO_ROOT_PASSWORD: very_strong_password_here
```

### 2. Setup Firewall

```bash
# Install UFW
sudo apt install -y ufw

# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow your app port
sudo ufw allow 5000/tcp

# Enable firewall
sudo ufw enable
```

### 3. Setup SSL/HTTPS

```bash
# Install Certbot
sudo apt install -y certbot

# Get certificate (need domain name)
sudo certbot certonly --standalone -d yourdomain.com
```

### 4. Setup Nginx Reverse Proxy

```bash
# Install Nginx
sudo apt install -y nginx

# Configure Nginx
sudo nano /etc/nginx/sites-available/trio-backend
```

**Nginx config:**
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/trio-backend /etc/nginx/sites-enabled/

# Test config
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### 5. Automated Backups

```bash
# Create backup script
nano ~/backup.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=~/backups

mkdir -p $BACKUP_DIR

# Backup database
sudo -u postgres pg_dump trio_db > $BACKUP_DIR/db_$DATE.sql

# Backup MinIO data
docker exec trio-minio mc mirror /data $BACKUP_DIR/minio_$DATE

# Keep only last 7 days
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete

echo "Backup completed: $DATE"
```

```bash
# Make executable
chmod +x ~/backup.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add line:
0 2 * * * ~/backup.sh
```

---

## Useful Resources

### Documentation Links
- [AWS EC2 Documentation](https://docs.aws.amazon.com/ec2/)
- [Docker Documentation](https://docs.docker.com/)
- [PM2 Documentation](https://pm2.keymetrics.io/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

### Community Support
- [Stack Overflow](https://stackoverflow.com/)
- [AWS Forums](https://forums.aws.amazon.com/)
- [Docker Forums](https://forums.docker.com/)

---

## Quick Reference Commands

### SSH Connection
```bash
ssh -i ~/.ssh/trio-backend-key.pem ubuntu@YOUR_SERVER_IP
```

### View Logs
```bash
pm2 logs trio-backend
docker logs trio-redis
docker logs trio-minio
```

### Restart Services
```bash
pm2 restart trio-backend
docker-compose restart
sudo systemctl restart postgresql
```

### Check Status
```bash
pm2 status
docker ps
sudo systemctl status postgresql
```

### Update Code
```bash
cd ~/TRIO-Shopify-Server
git pull
npm install
npm run build
pm2 restart trio-backend
```

---

## Troubleshooting Checklist

If something isn't working, check in this order:

1. ✅ Is EC2 instance running?
2. ✅ Can you SSH into server?
3. ✅ Is PostgreSQL running? `sudo systemctl status postgresql`
4. ✅ Are Docker containers running? `docker ps`
5. ✅ Is PM2 app running? `pm2 status`
6. ✅ Check app logs: `pm2 logs`
7. ✅ Check security group has correct ports open
8. ✅ Is .env file configured correctly? `cat .env`
9. ✅ Can you access health endpoint? `curl localhost:5000/api/v1/health`
10. ✅ Test from browser: `http://YOUR_SERVER_IP:5000/api/v1/health`

---

## Support

If you encounter issues not covered in this guide:

1. Check the error logs first: `pm2 logs trio-backend --lines 100`
2. Search for the error message on Google/Stack Overflow
3. Check the [Common Errors](#common-errors-and-solutions) section
4. Review the official documentation for the specific service

---

## Conclusion

You've successfully deployed the TRIO Shopify Server on AWS! 🎉

**What you've accomplished:**
- ✅ Created and configured an AWS EC2 instance
- ✅ Installed all required software (Node.js, PostgreSQL, Docker)
- ✅ Deployed the backend application
- ✅ Setup Docker containers for Redis and MinIO
- ✅ Configured the application with PM2
- ✅ Tested all major functionality

**Next steps:**
- Test all API endpoints thoroughly
- Setup your frontend to connect to this backend
- Monitor logs and performance
- Consider security hardening for production

**Remember:**
- Save your EC2 IP address
- Keep your `.pem` key file safe
- Monitor costs in AWS Billing Dashboard
- Backup your database regularly

---

**Last Updated:** 2025-01-25

**Guide Version:** 1.0

**For:** TRIO Shopify Server Testing Deployment
