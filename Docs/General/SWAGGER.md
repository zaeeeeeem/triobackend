# Swagger API Documentation

## Overview

The TRIO E-Commerce API now includes comprehensive Swagger/OpenAPI documentation for all endpoints. This provides an interactive interface to explore and test the API.

## Accessing the Documentation

### Swagger UI (Interactive Documentation)
Once the server is running, visit:
```
http://localhost:5000/api-docs
```

This provides an interactive interface where you can:
- View all available endpoints
- See request/response schemas
- Test endpoints directly from the browser
- Authenticate using JWT tokens

### Swagger JSON Specification
To access the raw OpenAPI specification:
```
http://localhost:5000/api-docs.json
```

## API Endpoints Documented

### Health
- `GET /api/v1/health` - API health check

### Authentication
- `POST /api/v1/auth/register` - Register a new user
- `POST /api/v1/auth/login` - Login and receive tokens
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Logout and invalidate tokens
- `POST /api/v1/auth/change-password` - Change user password

### Products
- `GET /api/v1/products` - List products with filters and pagination
- `POST /api/v1/products` - Create a new product
- `GET /api/v1/products/:id` - Get product by ID
- `PUT /api/v1/products/:id` - Update product
- `DELETE /api/v1/products/:id` - Delete product (soft/hard delete)
- `POST /api/v1/products/:id/images` - Upload product images
- `PUT /api/v1/products/:id/images/reorder` - Reorder product images
- `DELETE /api/v1/products/:id/images/:imageId` - Delete product image
- `PATCH /api/v1/products/bulk` - Bulk update products
- `DELETE /api/v1/products/bulk` - Bulk delete products

## Authentication in Swagger UI

Many endpoints require authentication. To test authenticated endpoints:

1. First, login using the `/api/v1/auth/login` endpoint
2. Copy the `accessToken` from the response
3. Click the "Authorize" button at the top of the Swagger UI
4. Enter: `Bearer YOUR_ACCESS_TOKEN`
5. Click "Authorize"
6. Now you can test authenticated endpoints

## Request Examples

### Register a User
```json
POST /api/v1/auth/register
{
  "email": "admin@trio.com",
  "password": "SecurePass123!",
  "name": "John Doe",
  "role": "ADMIN"
}
```

### Login
```json
POST /api/v1/auth/login
{
  "email": "admin@trio.com",
  "password": "SecurePass123!"
}
```

### Create a Product
```json
POST /api/v1/products
Headers: Authorization: Bearer YOUR_ACCESS_TOKEN
{
  "name": "Espresso Blend Coffee",
  "description": "Rich and smooth espresso blend",
  "sku": "CAFE-ESP-001",
  "price": 15.99,
  "stock": 100,
  "section": "CAFE",
  "category": "Coffee Beans",
  "tags": ["organic", "fair-trade"]
}
```

## Configuration

The Swagger configuration is located at:
- `src/config/swagger.ts` - Main configuration
- Route files contain JSDoc annotations with `@swagger` tags
- `src/app.ts` - CORS is configured to allow Swagger UI requests

To modify the Swagger documentation:
1. Edit the JSDoc comments in route files
2. Update schemas in `src/config/swagger.ts`
3. Restart the development server

### CORS Configuration
The application is configured to allow:
- Frontend origins (from `.env` ALLOWED_ORIGINS)
- Same-origin requests (for Swagger UI to work)
- Requests without origin (Postman, curl, mobile apps)

## Production Considerations

In production, you may want to:
- Protect the `/api-docs` endpoint with authentication
- Disable Swagger UI completely for security
- Only expose the JSON spec for client generation

To disable Swagger in production, add a condition in `src/app.ts`:
```typescript
if (env.NODE_ENV !== 'production') {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}
```

## Benefits

- **Single Source of Truth**: API documentation is maintained alongside code
- **Interactive Testing**: Test endpoints without external tools
- **Client Generation**: Generate client SDKs from the OpenAPI spec
- **Team Collaboration**: Easier for frontend developers to understand the API
- **Validation**: Ensures request/response formats are documented
