# TRIO Shopify Server 🚀

Production-ready backend API for TRIO multi-section e-commerce admin panel.

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Getting Started](#getting-started)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [API Endpoints](#api-endpoints)

## 🎯 Overview

TRIO is a comprehensive admin panel for managing a multi-section e-commerce business:

- **☕ Cafe** - Coffee, tea, pastries, and food items
- **🌸 Flowers** - Bouquets, arrangements, and floral products
- **📚 Books** - Physical and digital books

This backend provides robust APIs for product management, order processing, inventory tracking, and more.

## 🛠 Tech Stack

- **Runtime:** Node.js 20+
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** PostgreSQL 15+
- **ORM:** Prisma
- **Cache:** Redis
- **File Storage:** AWS S3 / MinIO (S3-compatible)
- **Authentication:** JWT
- **Validation:** Express Validator
- **Image Processing:** Sharp

## ✨ Features

### Core Features

- ✅ **Authentication & Authorization** - JWT-based auth with role-based access control
- ✅ **Product Management** - Full CRUD for multi-section products with variants
- ✅ **Image Upload** - Cloudinary integration with automatic image optimization
- ✅ **Inventory Tracking** - Real-time stock management with low-stock alerts
- ✅ **Order Management** - Complete order lifecycle management
- ✅ **Caching** - Redis caching for improved performance
- ✅ **Rate Limiting** - Protection against abuse
- ✅ **Error Handling** - Comprehensive error handling with detailed responses
- ✅ **Validation** - Input validation on all endpoints
- ✅ **Logging** - Winston-based logging system

### Security Features

- 🔒 Helmet.js for security headers
- 🔒 CORS configuration
- 🔒 Password hashing with bcrypt
- 🔒 JWT token authentication
- 🔒 Role-based access control (RBAC)
- 🔒 Rate limiting on all endpoints
- 🔒 Input validation and sanitization

## 🚀 Getting Started

### Prerequisites

- Node.js 20 or higher
- PostgreSQL 15 or higher
- Redis 6 or higher
- Docker (for MinIO local development)
- AWS S3 bucket (for production) or MinIO (for local development)

### Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd trio-shopify-server
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

```bash
cp .env.example .env
```

Edit [.env](.env) and fill in your configuration:

```env
NODE_ENV=development
PORT=5000
DATABASE_URL="postgresql://username:password@localhost:5432/trio_db"
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
REDIS_HOST=localhost
REDIS_PORT=6379
```

4. **Start MinIO (for image uploads)**

```bash
# Using Docker
docker run -d \
  --name trio-minio \
  -p 9000:9000 \
  -p 9001:9001 \
  -e MINIO_ROOT_USER=minioadmin \
  -e MINIO_ROOT_PASSWORD=minioadmin \
  minio/minio server /data --console-address ":9001"

# Access MinIO Console at http://localhost:9001
# Create bucket named "trio-media" and set it to public
# See MINIO_SETUP_GUIDE.md for detailed instructions
```

5. **Set up the database**

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed the database (optional)
npm run prisma:seed
```

6. **Start the development server**

```bash
npm run dev
```

The server will start at `http://localhost:5000`

## 📚 API Documentation

### Base URL

```
http://localhost:5000/api/v1
```

### Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Response Format

All API responses follow this format:

**Success Response:**
```json
{
  "success": true,
  "data": { },
  "message": "Operation successful"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "details": {}
  }
}
```

**Paginated Response:**
```json
{
  "success": true,
  "data": {
    "items": [],
    "pagination": {
      "page": 1,
      "limit": 20,
      "totalPages": 5,
      "totalItems": 100,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

## 📁 Project Structure

```
trio-shopify-server/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts               # Database seeding script
├── src/
│   ├── config/               # Configuration files
│   │   ├── database.ts       # Prisma client
│   │   ├── redis.ts          # Redis client
│   │   ├── cloudinary.ts     # Cloudinary config
│   │   └── env.ts            # Environment variables
│   ├── controllers/          # Route controllers
│   │   ├── auth.controller.ts
│   │   └── product.controller.ts
│   ├── middleware/           # Express middleware
│   │   ├── auth.ts           # Authentication
│   │   ├── errorHandler.ts   # Error handling
│   │   ├── rateLimiter.ts    # Rate limiting
│   │   └── validation.ts     # Validation
│   ├── routes/               # API routes
│   │   ├── auth.routes.ts
│   │   ├── product.routes.ts
│   │   └── index.ts
│   ├── services/             # Business logic
│   │   ├── auth.service.ts
│   │   ├── product.service.ts
│   │   └── upload.service.ts
│   ├── utils/                # Utility functions
│   │   ├── apiResponse.ts    # Response handlers
│   │   ├── errors.ts         # Custom errors
│   │   └── logger.ts         # Winston logger
│   ├── app.ts                # Express app setup
│   └── server.ts             # Server entry point
├── .env.example              # Environment template
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

## 🌍 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `development` / `production` |
| `PORT` | Server port | `5000` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/db` |
| `JWT_SECRET` | JWT signing secret | `your-secret-key` |
| `JWT_EXPIRES_IN` | Access token expiry | `15m` |
| `JWT_REFRESH_SECRET` | Refresh token secret | `your-refresh-secret` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiry | `7d` |
| `REDIS_HOST` | Redis host | `localhost` |
| `REDIS_PORT` | Redis port | `6379` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | `your-cloud` |
| `CLOUDINARY_API_KEY` | Cloudinary API key | `123456789` |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | `your-secret` |
| `ALLOWED_ORIGINS` | CORS origins (comma-separated) | `http://localhost:3000` |

## 🗄 Database Setup

### Prerequisites

1. Install PostgreSQL 15+
2. Create a database:

```sql
CREATE DATABASE trio_db;
```

### Run Migrations

```bash
# Generate Prisma client
npm run prisma:generate

# Create migration
npm run prisma:migrate

# View database in Prisma Studio
npm run prisma:studio
```

### Seed Database

```bash
npm run prisma:seed
```

This will create:
- 1 Admin user (email: `admin@trio.com`, password: `Admin@123`)
- 1 Manager user (email: `manager@trio.com`, password: `Manager@123`)
- 1 Staff user (email: `staff@trio.com`, password: `Staff@123`)
- Sample products for each section

## 🏃 Running the Application

### Development

```bash
npm run dev
```

### Production

```bash
# Build TypeScript
npm run build

# Start production server
npm start
```

### Other Commands

```bash
# Lint code
npm run lint

# Format code
npm run format

# Run Prisma Studio
npm run prisma:studio
```

## 🔌 API Endpoints

### Authentication

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/v1/auth/register` | Register new user | Public |
| POST | `/api/v1/auth/login` | User login | Public |
| POST | `/api/v1/auth/refresh` | Refresh access token | Public |
| POST | `/api/v1/auth/logout` | User logout | Private |
| POST | `/api/v1/auth/change-password` | Change password | Private |

### Products

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/v1/products` | List products | Private |
| POST | `/api/v1/products` | Create product | Admin/Manager |
| GET | `/api/v1/products/:id` | Get product by ID | Private |
| PUT | `/api/v1/products/:id` | Update product | Admin/Manager |
| DELETE | `/api/v1/products/:id` | Delete product | Admin |
| POST | `/api/v1/products/:id/images` | Upload images | Admin/Manager |
| DELETE | `/api/v1/products/:id/images/:imageId` | Delete image | Admin/Manager |
| PUT | `/api/v1/products/:id/images/reorder` | Reorder images | Admin/Manager |
| PATCH | `/api/v1/products/bulk` | Bulk update | Admin |
| DELETE | `/api/v1/products/bulk` | Bulk delete | Admin |

### Example: Create Product

```bash
curl -X POST http://localhost:5000/api/v1/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Cappuccino",
    "description": "Classic Italian coffee",
    "section": "CAFE",
    "price": 350,
    "sku": "CAF-CAP-001",
    "stockQuantity": 100,
    "status": "ACTIVE",
    "cafeAttributes": {
      "category": "coffee",
      "caffeineContent": "high",
      "sizes": ["Small", "Medium", "Large"],
      "temperatureOptions": ["hot", "iced"],
      "ingredients": ["Espresso", "Milk", "Foam"],
      "allergens": ["Dairy"],
      "calories": 120,
      "preparationTime": "5 mins"
    }
  }'
```

### Example: List Products with Filters

```bash
curl "http://localhost:5000/api/v1/products?section=CAFE&category=coffee&minPrice=300&maxPrice=500&page=1&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Example: Upload Images

```bash
curl -X POST http://localhost:5000/api/v1/products/PRODUCT_ID/images \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "images=@image1.jpg" \
  -F "images=@image2.jpg"
```

## 🔐 User Roles

- **ADMIN** - Full access to all features
- **MANAGER** - Section-specific access (can only manage assigned section)
- **STAFF** - Read-only access

## 🎯 Key Features Implementation

### Product Management

- ✅ Multi-section support (Cafe, Flowers, Books)
- ✅ Section-specific attributes stored as JSONB
- ✅ Advanced filtering and search
- ✅ Product variants support
- ✅ Image management with Cloudinary
- ✅ Bulk operations
- ✅ Soft delete with restore capability

### Authentication

- ✅ JWT access tokens (15 min expiry)
- ✅ Refresh tokens (7 day expiry)
- ✅ Role-based access control
- ✅ Section-based authorization for managers
- ✅ Password hashing with bcrypt

### Caching

- ✅ Redis caching for product lists
- ✅ Automatic cache invalidation
- ✅ 5-minute TTL for product listings

### Image Upload

- ✅ Automatic image optimization
- ✅ Multiple size generation (original, medium, thumbnail)
- ✅ WebP conversion for better performance
- ✅ Maximum 10 images per product
- ✅ 5MB file size limit

## 📊 Performance Optimizations

- Database indexing on frequently queried fields
- Redis caching for list endpoints
- Efficient pagination with Prisma
- Image optimization with Sharp
- Rate limiting to prevent abuse
- Connection pooling

## 🐛 Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `VALIDATION_ERROR` | 400 | Input validation failed |
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `DUPLICATE_ENTRY` | 409 | Unique constraint violation |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_SERVER_ERROR` | 500 | Server error |

## 📝 License

MIT

## 👥 Support

For questions or issues:
- Check the API documentation in `/API Docs/`
- Review this README
- Contact the development team

---

**Built with ❤️ by the TRIO Team**
