# MinIO Setup Guide for TRIO Shopify Server

This guide will help you set up MinIO for local development. MinIO is an S3-compatible object storage server that works exactly like AWS S3 but runs locally on your machine.

## Why MinIO?

- ✅ **S3-Compatible** - Same API as AWS S3
- ✅ **Local Development** - No cloud costs during development
- ✅ **Easy Migration** - Switch to AWS S3 in production without code changes
- ✅ **Fast** - Local storage is much faster than cloud uploads during development
- ✅ **Offline Development** - Works without internet connection

## Prerequisites

- Docker installed on your machine ([Install Docker](https://docs.docker.com/get-docker/))

## Quick Setup (Recommended)

### Option 1: Using Docker Command

```bash
docker run -d \
  --name trio-minio \
  -p 9000:9000 \
  -p 9001:9001 \
  -e MINIO_ROOT_USER=minioadmin \
  -e MINIO_ROOT_PASSWORD=minioadmin \
  -v ~/minio/data:/data \
  minio/minio server /data --console-address ":9001"
```

### Option 2: Using Docker Compose (Better for persistence)

Create a `docker-compose.yml` file in your project root:

```yaml
version: '3.8'

services:
  minio:
    image: minio/minio:latest
    container_name: trio-minio
    ports:
      - "9000:9000"  # API port
      - "9001:9001"  # Console port
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    volumes:
      - minio-data:/data
    command: server /data --console-address ":9001"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 20s
      retries: 3

volumes:
  minio-data:
    driver: local
```

Start MinIO:

```bash
docker-compose up -d
```

## Step-by-Step Setup

### 1. Start MinIO Server

Choose one of the options above and run it. Wait for the container to start.

### 2. Verify MinIO is Running

```bash
# Check if container is running
docker ps | grep trio-minio

# Check logs
docker logs trio-minio
```

You should see output like:
```
API: http://172.17.0.2:9000  http://127.0.0.1:9000
Console: http://172.17.0.2:9001 http://127.0.0.1:9001
```

### 3. Access MinIO Console

Open your browser and go to: [http://localhost:9001](http://localhost:9001)

**Login Credentials:**
- Username: `minioadmin`
- Password: `minioadmin`

### 4. Create Bucket

Once logged in to the MinIO Console:

1. Click on **"Buckets"** in the left sidebar
2. Click **"Create Bucket"** button (top right)
3. Enter bucket name: `trio-media`
4. Click **"Create Bucket"**

### 5. Set Bucket Access Policy (Important!)

To make uploaded images publicly accessible:

1. Go to the **"trio-media"** bucket
2. Click on **"Access"** tab
3. Click **"Edit"** button
4. Select **"Public"** as the access policy
5. Click **"Save"**

Alternatively, you can set the policy via MinIO Client (mc):

```bash
# Install MinIO Client
brew install minio/stable/mc  # macOS
# or download from https://min.io/docs/minio/linux/reference/minio-mc.html

# Configure alias
mc alias set local http://localhost:9000 minioadmin minioadmin

# Set public policy
mc anonymous set download local/trio-media
```

### 6. Verify Environment Variables

Check your `.env` file has these settings:

```env
AWS_S3_REGION=us-east-1
AWS_S3_BUCKET=trio-media
AWS_S3_ACCESS_KEY_ID=minioadmin
AWS_S3_SECRET_ACCESS_KEY=minioadmin
AWS_S3_BASE_PREFIX=app/uploads
AWS_S3_ENDPOINT=http://localhost:9000
AWS_S3_FORCE_PATH_STYLE=true
AWS_S3_PUBLIC_URL=http://localhost:9000/trio-media
```

### 7. Test the Setup

Start your TRIO backend server:

```bash
npm run dev
```

You should see in the logs:
```
S3 Client initialized { region: 'us-east-1', bucket: 'trio-media', endpoint: 'http://localhost:9000' }
```

Test image upload:

```bash
# Login first
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@trio.com","password":"Admin@123"}' \
  | jq -r '.data.accessToken'

# Save the token and upload an image
curl -X POST http://localhost:5000/api/v1/products/PRODUCT_ID/images \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "images=@test-image.jpg"
```

## Common Issues & Solutions

### Issue 1: Cannot connect to MinIO

**Symptom:** Error `connect ECONNREFUSED 127.0.0.1:9000`

**Solution:**
```bash
# Check if MinIO is running
docker ps | grep trio-minio

# If not running, start it
docker start trio-minio

# Or restart it
docker restart trio-minio
```

### Issue 2: Bucket does not exist

**Symptom:** Error `NoSuchBucket: The specified bucket does not exist`

**Solution:**
1. Go to MinIO Console: http://localhost:9001
2. Create bucket named `trio-media` (exact name, lowercase)

### Issue 3: Access Denied

**Symptom:** Error `AccessDenied` when uploading

**Solution:**
```bash
# Set public read access
mc anonymous set download local/trio-media

# Or make entire bucket public
mc anonymous set public local/trio-media
```

### Issue 4: Images uploaded but not accessible

**Symptom:** Images uploaded successfully but 403/404 when accessing URL

**Solution:**
1. Check bucket policy is set to public
2. Verify `AWS_S3_PUBLIC_URL` in `.env` is correct
3. Make sure MinIO container port 9000 is exposed

### Issue 5: Port already in use

**Symptom:** Error `bind: address already in use`

**Solution:**
```bash
# Change ports in docker command
docker run -d \
  --name trio-minio \
  -p 9002:9000 \  # Changed from 9000
  -p 9003:9001 \  # Changed from 9001
  ...

# Update .env
AWS_S3_ENDPOINT=http://localhost:9002
AWS_S3_PUBLIC_URL=http://localhost:9002/trio-media
```

## Managing MinIO

### Stop MinIO

```bash
# Using Docker
docker stop trio-minio

# Using Docker Compose
docker-compose down
```

### Start MinIO

```bash
# Using Docker
docker start trio-minio

# Using Docker Compose
docker-compose up -d
```

### Restart MinIO

```bash
docker restart trio-minio
```

### View Logs

```bash
docker logs trio-minio
docker logs -f trio-minio  # Follow logs
```

### Remove MinIO (Clean Uninstall)

```bash
# Stop and remove container
docker stop trio-minio
docker rm trio-minio

# Remove volume (THIS DELETES ALL DATA!)
docker volume rm trio-minio-data

# Or using Docker Compose
docker-compose down -v
```

## Switching to AWS S3 in Production

When you're ready to deploy to production, simply update your `.env`:

```env
# AWS S3 Configuration (Production)
AWS_S3_REGION=us-east-1
AWS_S3_BUCKET=your-production-bucket
AWS_S3_ACCESS_KEY_ID=YOUR_AWS_ACCESS_KEY
AWS_S3_SECRET_ACCESS_KEY=YOUR_AWS_SECRET_KEY
AWS_S3_BASE_PREFIX=app/uploads
# Remove these for AWS S3:
# AWS_S3_ENDPOINT=
# AWS_S3_FORCE_PATH_STYLE=
# AWS_S3_PUBLIC_URL=
```

**No code changes required!** The application will automatically use AWS S3.

## MinIO Client (mc) Commands

Useful commands for managing MinIO from command line:

```bash
# List all buckets
mc ls local

# List files in bucket
mc ls local/trio-media

# Upload file
mc cp image.jpg local/trio-media/test/image.jpg

# Download file
mc cp local/trio-media/test/image.jpg ./downloaded.jpg

# Remove file
mc rm local/trio-media/test/image.jpg

# Copy entire folder
mc cp --recursive ./folder/ local/trio-media/folder/

# Get bucket size
mc du local/trio-media
```

## Advanced Configuration

### Enable TLS (HTTPS) for MinIO

```bash
# Generate self-signed certificate
mkdir -p ~/.minio/certs
openssl req -new -newkey rsa:4096 -days 365 -nodes -x509 \
  -subj "/CN=localhost" \
  -keyout ~/.minio/certs/private.key \
  -out ~/.minio/certs/public.crt

# Run MinIO with certificates
docker run -d \
  --name trio-minio \
  -p 9000:9000 \
  -p 9001:9001 \
  -v ~/.minio/certs:/root/.minio/certs \
  -e MINIO_ROOT_USER=minioadmin \
  -e MINIO_ROOT_PASSWORD=minioadmin \
  minio/minio server /data --console-address ":9001"

# Update .env
AWS_S3_ENDPOINT=https://localhost:9000
AWS_S3_PUBLIC_URL=https://localhost:9000/trio-media
```

### Persistent Data Location

By default, MinIO data is stored in a Docker volume. To use a specific directory:

```bash
docker run -d \
  --name trio-minio \
  -p 9000:9000 \
  -p 9001:9001 \
  -v ~/Documents/minio-data:/data \  # Your custom path
  minio/minio server /data --console-address ":9001"
```

### Environment Variables

```bash
# Custom access credentials
-e MINIO_ROOT_USER=your-custom-user
-e MINIO_ROOT_PASSWORD=your-secure-password

# Custom region
-e MINIO_REGION_NAME=your-region

# Enable browser access
-e MINIO_BROWSER=on

# Disable browser access
-e MINIO_BROWSER=off
```

## Testing Image Uploads

### 1. Create a test image

```bash
# Create a simple test image (requires ImageMagick)
convert -size 1000x1000 xc:blue test-image.jpg

# Or download a test image
curl -o test-image.jpg https://via.placeholder.com/1000
```

### 2. Upload via API

```bash
# Get access token
TOKEN=$(curl -s -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@trio.com","password":"Admin@123"}' \
  | jq -r '.data.accessToken')

# Create a test product first
PRODUCT=$(curl -s -X POST http://localhost:5000/api/v1/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Test Product",
    "section": "CAFE",
    "price": 100,
    "sku": "TEST-001",
    "stockQuantity": 10,
    "cafeAttributes": {
      "category": "coffee",
      "caffeineContent": "high",
      "sizes": ["Medium"],
      "temperatureOptions": ["hot"],
      "ingredients": ["Coffee"],
      "allergens": [],
      "preparationTime": "5 mins"
    }
  }' | jq -r '.data.product.id')

# Upload image
curl -X POST "http://localhost:5000/api/v1/products/$PRODUCT/images" \
  -H "Authorization: Bearer $TOKEN" \
  -F "images=@test-image.jpg"
```

### 3. Verify in MinIO Console

1. Go to http://localhost:9001
2. Navigate to `trio-media` bucket
3. Browse to `app/uploads/products/`
4. You should see your uploaded images

## Resource Links

- [MinIO Documentation](https://min.io/docs/minio/linux/index.html)
- [MinIO Docker Hub](https://hub.docker.com/r/minio/minio)
- [MinIO Client (mc) Guide](https://min.io/docs/minio/linux/reference/minio-mc.html)
- [AWS SDK for JavaScript S3 Client](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/)

---

**Ready to upload images! 🚀**
