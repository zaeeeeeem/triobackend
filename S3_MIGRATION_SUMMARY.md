# S3/MinIO Migration Summary

## ✅ Migration Complete!

The TRIO Shopify Server has been successfully migrated from Cloudinary to AWS S3 / MinIO for file storage.

## What Changed

### 1. Dependencies Updated

**Removed:**
- ❌ `cloudinary` package

**Added:**
- ✅ `@aws-sdk/client-s3` - AWS SDK v3 S3 Client
- ✅ `@aws-sdk/lib-storage` - Multi-part upload support
- ✅ `uuid` - Unique filename generation

### 2. Configuration Files

**Removed:**
- ❌ `src/config/cloudinary.ts`

**Added:**
- ✅ `src/config/s3.ts` - S3 client configuration with MinIO support

**Updated:**
- ✅ `src/config/env.ts` - S3 environment variables
- ✅ `.env` - S3 credentials and configuration
- ✅ `.env.example` - S3 example configuration

### 3. Service Layer

**Updated:**
- ✅ `src/services/upload.service.ts` - Complete rewrite for S3
  - Uses AWS SDK v3 for uploads
  - Supports both MinIO (local) and AWS S3 (production)
  - Maintains same API interface (no controller changes needed!)

### 4. Upload Functionality

**Features:**
- ✅ Upload to S3/MinIO
- ✅ Generate 3 image sizes (original, medium, thumbnail)
- ✅ WebP conversion for optimization
- ✅ Public URL generation
- ✅ Delete from S3/MinIO
- ✅ Unique filename generation with UUID

**Storage Path:**
```
bucket-name/
  └── app/uploads/
      └── products/
          └── {productId}/
              ├── original-{uuid}-{timestamp}.webp
              ├── medium-{uuid}-{timestamp}.webp
              └── thumb-{uuid}-{timestamp}.webp
```

### 5. Documentation

**Added:**
- ✅ `MINIO_SETUP_GUIDE.md` - Complete MinIO setup guide
- ✅ `S3_MIGRATION_SUMMARY.md` - This file

**Updated:**
- ✅ `README.md` - Updated prerequisites and setup steps
- ✅ `SETUP_GUIDE.md` - MinIO setup instructions
- ✅ `package.json` - New dependencies

## Environment Variables

### For Local Development (MinIO)

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

### For Production (AWS S3)

```env
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

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Start MinIO

```bash
docker run -d \
  --name trio-minio \
  -p 9000:9000 \
  -p 9001:9001 \
  -e MINIO_ROOT_USER=minioadmin \
  -e MINIO_ROOT_PASSWORD=minioadmin \
  minio/minio server /data --console-address ":9001"
```

### 3. Create Bucket

1. Open http://localhost:9001
2. Login with `minioadmin` / `minioadmin`
3. Create bucket: `trio-media`
4. Set bucket to public

### 4. Start Server

```bash
npm run dev
```

You should see:
```
S3 Client initialized { region: 'us-east-1', bucket: 'trio-media', endpoint: 'http://localhost:9000' }
```

## Code Changes

### No API Changes!

The upload API endpoints remain exactly the same:

```bash
# Upload images (unchanged)
POST /api/v1/products/:id/images

# Delete image (unchanged)
DELETE /api/v1/products/:id/images/:imageId

# Reorder images (unchanged)
PUT /api/v1/products/:id/images/reorder
```

### Internal Changes Only

The change is completely transparent to the API consumers. The `UploadService` class maintains the same interface:

```typescript
// Interface unchanged
interface UploadService {
  uploadProductImages(productId: string, files: File[]): Promise<Image[]>
  deleteProductImage(imageId: string): Promise<void>
  reorderProductImages(productId: string, imageIds: string[]): Promise<void>
}

// Implementation changed from Cloudinary to S3
// But the interface is the same!
```

## Benefits of This Migration

### 1. Cost Savings

- **Local Development:** Free (MinIO)
- **Production:** S3 costs less than Cloudinary for high volume
- **No vendor lock-in:** Easy to switch providers

### 2. Performance

- **Local:** Much faster uploads during development
- **Production:** S3 is highly optimized and globally distributed
- **CloudFront:** Easy to add CDN on top of S3

### 3. Flexibility

- **S3-compatible:** Works with MinIO, AWS S3, DigitalOcean Spaces, etc.
- **Full control:** You own the storage
- **Scalability:** S3 scales automatically

### 4. Development Experience

- **Offline:** Works without internet (MinIO)
- **Fast:** No network latency during local dev
- **Consistent:** Same API in dev and production

## Migration Checklist

- [x] Replace Cloudinary dependency with AWS SDK
- [x] Update environment variables
- [x] Create S3 configuration
- [x] Rewrite upload service for S3
- [x] Remove Cloudinary config file
- [x] Test image upload
- [x] Test image deletion
- [x] Update documentation
- [x] Add MinIO setup guide

## Testing

### Test Image Upload

```bash
# 1. Login
TOKEN=$(curl -s -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@trio.com","password":"Admin@123"}' \
  | jq -r '.data.accessToken')

# 2. Get product ID or create one
PRODUCT_ID="your-product-id"

# 3. Upload image
curl -X POST "http://localhost:5000/api/v1/products/$PRODUCT_ID/images" \
  -H "Authorization: Bearer $TOKEN" \
  -F "images=@test-image.jpg"
```

### Verify Upload

1. Check response - you should get 3 URLs:
   ```json
   {
     "original": "http://localhost:9000/trio-media/app/uploads/products/.../original-xxx.webp",
     "medium": "http://localhost:9000/trio-media/app/uploads/products/.../medium-xxx.webp",
     "thumbnail": "http://localhost:9000/trio-media/app/uploads/products/.../thumb-xxx.webp"
   }
   ```

2. Check MinIO Console:
   - Go to http://localhost:9001
   - Navigate to `trio-media` bucket
   - Browse to `app/uploads/products/`
   - Verify 3 images are there

3. Access URLs:
   - Copy any URL from response
   - Paste in browser
   - Image should display

## Troubleshooting

### Images not uploading

**Check:**
1. MinIO is running: `docker ps | grep trio-minio`
2. Bucket exists in MinIO Console
3. Environment variables in `.env` are correct
4. Server logs for errors

### Images uploading but not accessible

**Check:**
1. Bucket policy is set to public
2. `AWS_S3_PUBLIC_URL` is correct
3. MinIO port 9000 is accessible

### Connection refused errors

**Solution:**
```bash
# Restart MinIO
docker restart trio-minio

# Check logs
docker logs trio-minio
```

## Production Deployment

### AWS S3 Setup

1. **Create S3 Bucket:**
   ```bash
   aws s3 mb s3://your-bucket-name
   ```

2. **Set Public Read Policy:**
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [{
       "Sid": "PublicReadGetObject",
       "Effect": "Allow",
       "Principal": "*",
       "Action": "s3:GetObject",
       "Resource": "arn:aws:s3:::your-bucket-name/*"
     }]
   }
   ```

3. **Create IAM User:**
   - Create user with S3 access
   - Save Access Key and Secret Key

4. **Update Production `.env`:**
   ```env
   AWS_S3_REGION=us-east-1
   AWS_S3_BUCKET=your-bucket-name
   AWS_S3_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
   AWS_S3_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
   AWS_S3_BASE_PREFIX=app/uploads
   # Remove MinIO-specific vars
   ```

5. **Optional: Add CloudFront CDN**
   - Create CloudFront distribution
   - Point to S3 bucket
   - Use CloudFront URL as `AWS_S3_PUBLIC_URL`

## Support

For questions or issues:
- See `MINIO_SETUP_GUIDE.md` for MinIO setup
- See `README.md` for general setup
- Check server logs for errors

---

**Migration completed successfully! 🎉**

*Now using AWS S3 / MinIO for scalable, cost-effective file storage.*
