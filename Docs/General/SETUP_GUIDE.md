# TRIO Shopify Server - Complete Setup Guide

This guide will walk you through setting up the TRIO Shopify Server from scratch.

## Prerequisites Checklist

Before you begin, ensure you have the following installed:

- [ ] Node.js 20+ ([Download](https://nodejs.org/))
- [ ] PostgreSQL 15+ ([Download](https://www.postgresql.org/download/))
- [ ] Redis 6+ ([Download](https://redis.io/download))
- [ ] Git ([Download](https://git-scm.com/downloads))
- [ ] Cloudinary Account ([Sign up](https://cloudinary.com/))

## Step 1: Clone and Install

```bash
# Clone the repository
cd "TRIO - Shopify Server"

# Install dependencies
npm install
```

## Step 2: PostgreSQL Setup

### Option A: Using PostgreSQL GUI (pgAdmin)

1. Open pgAdmin
2. Right-click on "Databases" → Create → Database
3. Name: `trio_db`
4. Owner: postgres (or your username)
5. Click "Save"

### Option B: Using Terminal

```bash
# Login to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE trio_db;

# Exit
\q
```

### Verify Connection

```bash
psql -U postgres -d trio_db -c "SELECT version();"
```

## Step 3: Redis Setup

### macOS (using Homebrew)

```bash
# Install Redis
brew install redis

# Start Redis
brew services start redis

# Verify
redis-cli ping
# Should return: PONG
```

### Windows

1. Download Redis from [GitHub Releases](https://github.com/tporadowski/redis/releases)
2. Install and run `redis-server.exe`
3. Test: `redis-cli ping`

### Linux

```bash
# Install
sudo apt-get install redis-server

# Start
sudo systemctl start redis

# Verify
redis-cli ping
```

## Step 4: Cloudinary Setup

1. Go to [cloudinary.com](https://cloudinary.com/) and sign up
2. Navigate to Dashboard
3. Copy your credentials:
   - Cloud Name
   - API Key
   - API Secret

## Step 5: Environment Configuration

Create a [.env](.env) file:

```bash
cp .env.example .env
```

Edit the [.env](.env) file with your credentials:

```env
# Server
NODE_ENV=development
PORT=5000
API_VERSION=v1

# Database (Update with your credentials)
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/trio_db?schema=public"

# JWT Secrets (Generate secure random strings)
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-super-secret-refresh-token-key-also-32-chars
JWT_REFRESH_EXPIRES_IN=7d

# Redis (Default local setup)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Cloudinary (From Step 4)
CLOUDINARY_CLOUD_NAME=your-cloud-name-here
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=your-api-secret-here

# CORS (Your frontend URL)
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload
MAX_FILE_SIZE=5242880
MAX_FILES_PER_PRODUCT=10

# Pagination
DEFAULT_PAGE_SIZE=20
MAX_PAGE_SIZE=100
```

### Generate Secure JWT Secrets

Run this in Node.js:

```javascript
// In Node.js REPL (type `node` in terminal)
require('crypto').randomBytes(32).toString('hex')
// Copy the output for JWT_SECRET

require('crypto').randomBytes(32).toString('hex')
// Copy the output for JWT_REFRESH_SECRET
```

Or use this one-liner:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Step 6: Database Migration

```bash
# Generate Prisma Client
npm run prisma:generate

# Create database tables
npm run prisma:migrate

# Seed sample data
npm run prisma:seed
```

### Expected Output

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

## Step 7: Start the Server

### Development Mode

```bash
npm run dev
```

Expected output:

```
╔══════════════════════════════════════════════╗
║   TRIO SHOPIFY SERVER                        ║
║   Environment: development                   ║
║   Port: 5000                                 ║
║   API Version: v1                            ║
╚══════════════════════════════════════════════╝

✓ Database connected successfully
✓ Redis connected successfully
✓ Server is ready and listening on port 5000
```

## Step 8: Test the API

### 1. Health Check

```bash
curl http://localhost:5000/api/v1/health
```

Expected response:

```json
{
  "success": true,
  "message": "TRIO API is running",
  "timestamp": "2025-11-20T10:00:00.000Z",
  "version": "v1"
}
```

### 2. Login

```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@trio.com",
    "password": "Admin@123"
  }'
```

Save the `accessToken` from the response.

### 3. Get Products

```bash
curl http://localhost:5000/api/v1/products \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Step 9: View Database (Optional)

```bash
npm run prisma:studio
```

This opens Prisma Studio at `http://localhost:5555` where you can view and edit database records.

## Common Issues & Solutions

### Issue: "Cannot connect to database"

**Solution:**

1. Check PostgreSQL is running:

```bash
# macOS
brew services list | grep postgresql

# Linux
sudo systemctl status postgresql

# Windows
# Check Services app for PostgreSQL
```

2. Verify DATABASE_URL in [.env](.env)
3. Test connection:

```bash
psql -U postgres -d trio_db
```

### Issue: "Redis connection failed"

**Solution:**

1. Start Redis:

```bash
# macOS
brew services start redis

# Linux
sudo systemctl start redis

# Windows
# Run redis-server.exe
```

2. Test:

```bash
redis-cli ping
```

### Issue: "Cloudinary upload failed"

**Solution:**

1. Verify credentials in [.env](.env)
2. Test credentials:

```bash
curl -u YOUR_API_KEY:YOUR_API_SECRET \
  https://api.cloudinary.com/v1_1/YOUR_CLOUD_NAME/resources/image
```

### Issue: "Port 5000 already in use"

**Solution:**

Change PORT in [.env](.env):

```env
PORT=5001
```

Or kill the process using port 5000:

```bash
# macOS/Linux
lsof -ti:5000 | xargs kill -9

# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

## Production Deployment

### Build for Production

```bash
npm run build
```

### Start Production Server

```bash
NODE_ENV=production npm start
```

### Environment Variables for Production

Update [.env](.env):

```env
NODE_ENV=production
DATABASE_URL="your-production-database-url"
ALLOWED_ORIGINS=https://yourdomain.com
```

### Recommended Hosting Options

- **Backend:** Railway, Heroku, AWS EC2, DigitalOcean
- **Database:** Supabase, Railway, AWS RDS, DigitalOcean Managed DB
- **Redis:** Upstash, Redis Cloud, AWS ElastiCache
- **File Storage:** Cloudinary (already configured)

## Next Steps

1. ✅ Review the [README.md](README.md) for API documentation
2. ✅ Check [API Docs](./API%20Docs/) folder for detailed endpoint specs
3. ✅ Test all endpoints using Postman or cURL
4. ✅ Integrate with your frontend application
5. ✅ Configure your production environment

## Scripts Reference

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build TypeScript to JavaScript |
| `npm start` | Start production server |
| `npm run prisma:generate` | Generate Prisma Client |
| `npm run prisma:migrate` | Run database migrations |
| `npm run prisma:studio` | Open Prisma Studio |
| `npm run prisma:seed` | Seed database with sample data |
| `npm run lint` | Lint code with ESLint |
| `npm run format` | Format code with Prettier |

## Support

If you encounter any issues:

1. Check this guide thoroughly
2. Review error messages in the terminal
3. Check the logs in [logs/](./logs/) directory
4. Verify all environment variables
5. Contact the development team

---

**Ready to build amazing e-commerce experiences! 🚀**
