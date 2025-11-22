# TRIO Shopify Server - Complete Setup Guide
## From Zero to Running Server (Step-by-Step)

This guide assumes you're starting fresh with minimal setup. Every step is explained in detail.

---

## 📋 Table of Contents

1. [Prerequisites Installation](#step-1-install-prerequisites)
2. [Database Setup (PostgreSQL)](#step-2-setup-postgresql)
3. [Redis Setup](#step-3-setup-redis)
4. [MinIO Setup (Image Storage)](#step-4-setup-minio)
5. [Project Setup](#step-5-setup-the-project)
6. [Environment Configuration](#step-6-configure-environment-variables)
7. [Database Migration](#step-7-database-setup)
8. [Start the Server](#step-8-start-the-server)
9. [Testing](#step-9-test-the-api)
10. [Troubleshooting](#troubleshooting)

---

## Step 1: Install Prerequisites

### 1.1 Install Node.js (Required)

**Why?** Node.js runs the backend server.

#### For macOS:

```bash
# Install Homebrew first (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js
brew install node@20
```

#### For Windows:

1. Download Node.js installer from: https://nodejs.org/
2. Choose **LTS version 20.x**
3. Run the installer
4. Keep all default settings
5. Click "Install"

#### For Linux (Ubuntu/Debian):

```bash
# Update package list
sudo apt update

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### Verify Installation:

```bash
node --version
# Should show: v20.x.x

npm --version
# Should show: 10.x.x
```

---

### 1.2 Install Docker (Required for MinIO and optional for PostgreSQL/Redis)

**Why?** Docker makes it easy to run PostgreSQL, Redis, and MinIO without complex setup.

#### For macOS:

1. Download **Docker Desktop for Mac**: https://www.docker.com/products/docker-desktop/
2. Open the downloaded `.dmg` file
3. Drag Docker to Applications folder
4. Open Docker from Applications
5. Wait for Docker to start (you'll see a whale icon in menu bar)

#### For Windows:

1. Download **Docker Desktop for Windows**: https://www.docker.com/products/docker-desktop/
2. Run the installer
3. Enable WSL 2 if prompted
4. Restart computer if required
5. Launch Docker Desktop
6. Wait for Docker to start

#### For Linux (Ubuntu/Debian):

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add your user to docker group (to run without sudo)
sudo usermod -aG docker $USER

# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Log out and log back in for group changes to take effect
```

#### Verify Installation:

```bash
docker --version
# Should show: Docker version 24.x.x or higher

docker ps
# Should show: Empty list (no containers running yet)
```

---

## Step 2: Setup PostgreSQL

**What is it?** PostgreSQL is the database where all your data is stored.

### Option A: Using Docker (Recommended - Easiest)

#### 2.1 Create PostgreSQL Container

```bash
# Run this command in your terminal
docker run -d \
  --name trio-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=trio_db \
  -p 5432:5432 \
  -v trio-postgres-data:/var/lib/postgresql/data \
  postgres:15-alpine
```

**What this does:**
- Creates a PostgreSQL container named `trio-postgres`
- Sets username: `postgres`
- Sets password: `postgres`
- Creates database: `trio_db`
- Makes it accessible on port `5432`
- Stores data in `trio-postgres-data` volume (persists even if container stops)

#### 2.2 Verify PostgreSQL is Running

```bash
# Check if container is running
docker ps | grep trio-postgres

# You should see output like:
# CONTAINER ID   IMAGE              STATUS          PORTS
# abc123...      postgres:15-alpine Up 2 minutes    0.0.0.0:5432->5432/tcp
```

#### 2.3 Test Database Connection

```bash
# Connect to PostgreSQL
docker exec -it trio-postgres psql -U postgres -d trio_db

# You should see:
# trio_db=#

# Type this to exit:
\q
```

✅ **PostgreSQL is ready!**

---

### Option B: Install PostgreSQL Directly (Alternative)

<details>
<summary>Click here if you prefer not to use Docker</summary>

#### For macOS:

```bash
# Install PostgreSQL
brew install postgresql@15

# Start PostgreSQL
brew services start postgresql@15

# Create database
createdb trio_db
```

#### For Windows:

1. Download installer from: https://www.postgresql.org/download/windows/
2. Run installer, keep all defaults
3. Remember the password you set for `postgres` user
4. Open pgAdmin (installed with PostgreSQL)
5. Right-click "Databases" → Create → Database
6. Name: `trio_db`, click Save

#### For Linux:

```bash
# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database
sudo -u postgres createdb trio_db
```

</details>

---

## Step 3: Setup Redis

**What is it?** Redis is used for caching to make the API faster.

### Option A: Using Docker (Recommended - Easiest)

```bash
# Run this command
docker run -d \
  --name trio-redis \
  -p 6379:6379 \
  redis:7-alpine
```

**What this does:**
- Creates a Redis container named `trio-redis`
- Makes it accessible on port `6379`
- Uses Alpine Linux for small size

#### Verify Redis is Running

```bash
# Check container
docker ps | grep trio-redis

# Test connection
docker exec -it trio-redis redis-cli ping
# Should return: PONG
```

✅ **Redis is ready!**

---

### Option B: Install Redis Directly (Alternative)

<details>
<summary>Click here if you prefer not to use Docker</summary>

#### For macOS:

```bash
# Install Redis
brew install redis

# Start Redis
brew services start redis

# Test
redis-cli ping
# Should return: PONG
```

#### For Windows:

Redis doesn't officially support Windows. Use Docker option above or install via WSL.

#### For Linux:

```bash
# Install Redis
sudo apt install redis-server

# Start Redis
sudo systemctl start redis
sudo systemctl enable redis

# Test
redis-cli ping
```

</details>

---

## Step 4: Setup MinIO

**What is it?** MinIO is S3-compatible object storage for images. Works exactly like AWS S3 but runs locally.

### 4.1 Start MinIO Container

```bash
# Run this command
docker run -d \
  --name trio-minio \
  -p 9000:9000 \
  -p 9001:9001 \
  -e MINIO_ROOT_USER=minioadmin \
  -e MINIO_ROOT_PASSWORD=minioadmin \
  -v trio-minio-data:/data \
  minio/minio server /data --console-address ":9001"
```

**What this does:**
- Creates MinIO container named `trio-minio`
- Port `9000`: API endpoint
- Port `9001`: Web Console
- Username: `minioadmin`
- Password: `minioadmin`
- Stores files in `trio-minio-data` volume

### 4.2 Verify MinIO is Running

```bash
# Check container
docker ps | grep trio-minio

# You should see it running
```

### 4.3 Access MinIO Console

1. **Open browser** and go to: http://localhost:9001
2. **Login** with:
   - Username: `minioadmin`
   - Password: `minioadmin`
3. You should see the MinIO dashboard

### 4.4 Create Storage Bucket

1. In MinIO Console, click **"Buckets"** (left sidebar)
2. Click **"Create Bucket"** button (top right)
3. Enter bucket name: `trio-media` (exactly this name!)
4. Click **"Create Bucket"**
5. Click on the `trio-media` bucket you just created
6. Go to **"Access"** tab
7. Click **"Edit"**
8. Select **"Public"** access
9. Click **"Save"**

✅ **MinIO is ready with a public bucket!**

---

## Step 5: Setup the Project

### 5.1 Navigate to Project Directory

```bash
# Open terminal and go to your project folder
cd "/Users/zaeemulhassan/Projects/TRIO - Shopify Server"
```

### 5.2 Install Dependencies

```bash
# This will install all required npm packages
npm install
```

**What this does:**
- Installs Express.js, Prisma, AWS SDK, and all other dependencies
- May take 2-5 minutes depending on your internet speed
- Creates `node_modules` folder

**Wait for it to complete.** You should see:

```
added 500+ packages in 2m
```

✅ **Dependencies installed!**

---

## Step 6: Configure Environment Variables

### 6.1 Verify .env File Exists

```bash
# Check if .env file exists
ls -la .env

# If it exists, you should see:
# -rw-r--r--  1 user  staff  1234 Nov 20 10:00 .env
```

✅ **Good! The .env file already exists with correct configuration.**

### 6.2 Verify Environment Variables

The `.env` file should already have:

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/trio_db?schema=public"

# JWT Secrets (already generated)
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
JWT_REFRESH_SECRET=z9y8x7w6v5u4t3s2r1q0p9o8n7m6l5k4j3i2h1g0f9e8d7c6b5a4z3y2x1w0v9u8

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# MinIO
AWS_S3_BUCKET=trio-media
AWS_S3_ACCESS_KEY_ID=minioadmin
AWS_S3_SECRET_ACCESS_KEY=minioadmin
AWS_S3_ENDPOINT=http://localhost:9000
AWS_S3_PUBLIC_URL=http://localhost:9000/trio-media
```

**If using different credentials, update these values in your .env file.**

---

## Step 7: Database Setup

### 7.1 Generate Prisma Client

```bash
npm run prisma:generate
```

**What this does:**
- Generates TypeScript types from your database schema
- Creates Prisma Client for database queries

You should see:
```
✔ Generated Prisma Client to ./node_modules/@prisma/client
```

### 7.2 Run Database Migrations

```bash
npm run prisma:migrate
```

**What this does:**
- Creates all tables in PostgreSQL database
- Sets up relationships, indexes, and constraints

**You'll be prompted:** "Enter a name for the new migration:"
- Type: `init`
- Press Enter

You should see:
```
✔ Your database is now in sync with your schema.
```

### 7.3 Seed the Database (Add Sample Data)

```bash
npm run prisma:seed
```

**What this does:**
- Creates 3 default users (admin, manager, staff)
- Adds sample products for Cafe, Flowers, and Books
- Adds sample customers

You should see:
```
🌱 Starting database seeding...
✓ Cleaned existing data
✓ Created users
✓ Created sample products
✓ Created sample customers

🎉 Database seeding completed successfully!

Default Users:
--------------------
Admin:
  Email: admin@trio.com
  Password: Admin@123

Manager (Cafe Section):
  Email: manager@trio.com
  Password: Manager@123

Staff:
  Email: staff@trio.com
  Password: Staff@123
--------------------
```

✅ **Database is ready with sample data!**

---

## Step 8: Start the Server

### 8.1 Start Development Server

```bash
npm run dev
```

**What this does:**
- Starts the backend server on port 5000
- Enables hot-reload (auto-restart on file changes)
- Connects to PostgreSQL, Redis, and MinIO

You should see:
```
╔══════════════════════════════════════════════╗
║   TRIO SHOPIFY SERVER                        ║
║   Environment: development                   ║
║   Port: 5000                                 ║
║   API Version: v1                            ║
╚══════════════════════════════════════════════╝

S3 Client initialized { region: 'us-east-1', bucket: 'trio-media', endpoint: 'http://localhost:9000' }
✓ Database connected successfully
✓ Redis connected successfully
✓ Server is ready and listening on port 5000
```

✅ **Server is running!**

**Keep this terminal window open.** The server needs to stay running.

---

## Step 9: Test the API

Open a **NEW terminal window** (keep the server running in the first one).

### 9.1 Test Health Check

```bash
curl http://localhost:5000/api/v1/health
```

**Expected Response:**
```json
{
  "success": true,
  "message": "TRIO API is running",
  "timestamp": "2025-11-20T10:00:00.000Z",
  "version": "v1"
}
```

✅ **Server is responding!**

### 9.2 Test Login

```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@trio.com",
    "password": "Admin@123"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "email": "admin@trio.com",
      "role": "ADMIN"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

✅ **Authentication works!**

### 9.3 Test Get Products

First, save your token:

```bash
# For macOS/Linux:
TOKEN=$(curl -s -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@trio.com","password":"Admin@123"}' \
  | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

echo $TOKEN
```

```bash
# For Windows PowerShell:
$response = Invoke-RestMethod -Uri "http://localhost:5000/api/v1/auth/login" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"email":"admin@trio.com","password":"Admin@123"}'
$TOKEN = $response.data.accessToken
echo $TOKEN
```

Now test getting products:

```bash
# macOS/Linux:
curl http://localhost:5000/api/v1/products \
  -H "Authorization: Bearer $TOKEN"

# Windows PowerShell:
Invoke-RestMethod -Uri "http://localhost:5000/api/v1/products" -Headers @{"Authorization"="Bearer $TOKEN"}
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "...",
        "name": "Cappuccino",
        "section": "CAFE",
        "price": 350,
        ...
      }
    ],
    "pagination": {
      "page": 1,
      "totalItems": 7
    }
  }
}
```

✅ **Products API works!**

### 9.4 Test Image Upload

Create a test image first:

```bash
# macOS/Linux (requires ImageMagick):
brew install imagemagick  # macOS only
convert -size 1000x1000 xc:blue test-image.jpg

# Or download a test image:
curl -o test-image.jpg https://via.placeholder.com/1000

# Windows: Download any image and rename it to test-image.jpg
```

Get a product ID:

```bash
# macOS/Linux:
PRODUCT_ID=$(curl -s http://localhost:5000/api/v1/products \
  -H "Authorization: Bearer $TOKEN" \
  | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

echo "Product ID: $PRODUCT_ID"
```

Upload the image:

```bash
# macOS/Linux:
curl -X POST "http://localhost:5000/api/v1/products/$PRODUCT_ID/images" \
  -H "Authorization: Bearer $TOKEN" \
  -F "images=@test-image.jpg"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "images": [
      {
        "id": "...",
        "originalUrl": "http://localhost:9000/trio-media/app/uploads/products/.../original-xxx.webp",
        "mediumUrl": "http://localhost:9000/trio-media/app/uploads/products/.../medium-xxx.webp",
        "thumbnailUrl": "http://localhost:9000/trio-media/app/uploads/products/.../thumb-xxx.webp"
      }
    ]
  },
  "message": "1 images uploaded successfully"
}
```

**Verify in MinIO:**
1. Go to http://localhost:9001
2. Click on `trio-media` bucket
3. Navigate to `app/uploads/products/`
4. You should see your uploaded images!

**Access the image:**
Copy one of the URLs from the response and paste it in your browser. The image should display.

✅ **Image upload works!**

---

## 🎉 Success! Everything is Working!

Your TRIO Shopify Server is now fully set up and running with:

✅ Node.js and dependencies installed
✅ PostgreSQL database running with tables and sample data
✅ Redis cache running
✅ MinIO object storage running with public bucket
✅ Backend server running on port 5000
✅ All APIs tested and working
✅ Image upload tested and working

---

## Quick Reference Commands

### Starting Everything

```bash
# 1. Start PostgreSQL (if using Docker)
docker start trio-postgres

# 2. Start Redis (if using Docker)
docker start trio-redis

# 3. Start MinIO (if using Docker)
docker start trio-minio

# 4. Start Backend Server
cd "/Users/zaeemulhassan/Projects/TRIO - Shopify Server"
npm run dev
```

### Stopping Everything

```bash
# Stop backend server: Press Ctrl+C in the terminal where it's running

# Stop containers (if using Docker)
docker stop trio-postgres trio-redis trio-minio
```

### Checking Status

```bash
# Check if containers are running
docker ps

# Check if server is running
curl http://localhost:5000/api/v1/health
```

### View Logs

```bash
# Backend server logs: Check the terminal where npm run dev is running

# PostgreSQL logs
docker logs trio-postgres

# Redis logs
docker logs trio-redis

# MinIO logs
docker logs trio-minio
```

---

## Troubleshooting

### Problem: "npm: command not found"

**Solution:**
- Node.js is not installed properly
- Go back to [Step 1.1](#11-install-nodejs-required)
- After installation, close and reopen terminal

---

### Problem: "docker: command not found"

**Solution:**
- Docker is not installed
- Go back to [Step 1.2](#12-install-docker-required-for-minio-and-optional-for-postgresqlredis)
- Make sure Docker Desktop is running (check system tray/menu bar)

---

### Problem: "Error: connect ECONNREFUSED 127.0.0.1:5432"

**Solution:**
- PostgreSQL is not running

```bash
# Check if container exists
docker ps -a | grep trio-postgres

# If it exists but stopped, start it
docker start trio-postgres

# If it doesn't exist, run the docker run command from Step 2.1
```

---

### Problem: "Error: connect ECONNREFUSED 127.0.0.1:6379"

**Solution:**
- Redis is not running

```bash
# Start Redis container
docker start trio-redis

# Or if it doesn't exist, run the docker run command from Step 3
```

---

### Problem: "S3 connection error" or "MinIO not accessible"

**Solution:**
- MinIO is not running

```bash
# Check if MinIO is running
docker ps | grep trio-minio

# Start MinIO
docker start trio-minio

# Check logs for errors
docker logs trio-minio

# Verify you can access the console
# Open browser: http://localhost:9001
```

---

### Problem: "Bucket does not exist"

**Solution:**
- The `trio-media` bucket was not created

1. Go to http://localhost:9001
2. Login: `minioadmin` / `minioadmin`
3. Create bucket named `trio-media`
4. Set it to public access

---

### Problem: "Error: Missing required environment variable: DATABASE_URL"

**Solution:**
- `.env` file is missing or incorrect

```bash
# Check if .env file exists
ls -la .env

# If missing, copy from example
cp .env.example .env

# Edit .env and set DATABASE_URL:
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/trio_db?schema=public"
```

---

### Problem: "Port 5000 is already in use"

**Solution:**
- Another application is using port 5000

**Option 1: Change port**
```bash
# Edit .env file
PORT=5001

# Restart server
```

**Option 2: Kill process on port 5000**
```bash
# macOS/Linux
lsof -ti:5000 | xargs kill -9

# Windows PowerShell
Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process
```

---

### Problem: "Prisma Client validation failed"

**Solution:**
- Prisma Client needs to be regenerated

```bash
npm run prisma:generate
```

---

### Problem: "Table does not exist"

**Solution:**
- Database migrations were not run

```bash
# Run migrations
npm run prisma:migrate

# Seed data
npm run prisma:seed
```

---

### Problem: "Cannot upload images"

**Check these things:**

1. **Is MinIO running?**
   ```bash
   docker ps | grep trio-minio
   ```

2. **Does the bucket exist?**
   - Go to http://localhost:9001
   - Check if `trio-media` bucket exists

3. **Is the bucket public?**
   - Click on bucket
   - Go to "Access" tab
   - Should be set to "Public"

4. **Check environment variables:**
   ```bash
   # In .env file, verify:
   AWS_S3_BUCKET=trio-media
   AWS_S3_ENDPOINT=http://localhost:9000
   AWS_S3_PUBLIC_URL=http://localhost:9000/trio-media
   ```

5. **Restart server after .env changes**

---

### Problem: Need to reset everything

**Solution: Complete clean restart**

```bash
# 1. Stop all containers
docker stop trio-postgres trio-redis trio-minio

# 2. Remove containers (CAUTION: This deletes data!)
docker rm trio-postgres trio-redis trio-minio

# 3. Remove volumes (CAUTION: This deletes all stored data!)
docker volume rm trio-postgres-data trio-minio-data

# 4. Start fresh - go back to Step 2
```

---

## Next Steps

Now that everything is working:

1. **Explore the API:**
   - See [API_QUICK_REFERENCE.md](API_QUICK_REFERENCE.md) for all endpoints
   - See [README.md](README.md) for detailed documentation

2. **Try Prisma Studio:**
   ```bash
   npm run prisma:studio
   ```
   - Opens at http://localhost:5555
   - Visual database editor

3. **Build your frontend:**
   - Use the API endpoints to build your admin panel
   - Example: `http://localhost:5000/api/v1/products`

4. **Add more products:**
   - Use POST `/api/v1/products` endpoint
   - Upload images for products
   - Test different sections (CAFE, FLOWERS, BOOKS)

---

## Getting Help

If you're still stuck:

1. **Check server logs:**
   - Look at the terminal where `npm run dev` is running
   - Errors are usually shown there

2. **Check Docker logs:**
   ```bash
   docker logs trio-postgres
   docker logs trio-redis
   docker logs trio-minio
   ```

3. **Verify all services:**
   ```bash
   # Should show 3 containers running
   docker ps | grep trio
   ```

4. **Test each service individually:**
   ```bash
   # PostgreSQL
   docker exec -it trio-postgres psql -U postgres -d trio_db -c "SELECT 1;"

   # Redis
   docker exec -it trio-redis redis-cli ping

   # MinIO
   curl http://localhost:9000/minio/health/live
   ```

---

**You're all set! Happy coding! 🚀**
