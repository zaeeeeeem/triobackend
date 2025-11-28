import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './env';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TRIO E-Commerce API',
      version: '1.0.0',
      description: 'Production-level backend API for TRIO multi-section e-commerce admin panel',
      contact: {
        name: 'TRIO Team',
      },
      license: {
        name: 'MIT',
      },
    },
    servers: [
      {
        url: `${env.SERVER_URL}/api/${env.API_VERSION || 'v1'}`,
        description: 'API Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  example: 'VALIDATION_ERROR',
                },
                message: {
                  type: 'string',
                  example: 'Validation failed',
                },
                details: {
                  type: 'array',
                  items: {
                    type: 'object',
                  },
                },
              },
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            email: {
              type: 'string',
              format: 'email',
            },
            name: {
              type: 'string',
            },
            role: {
              type: 'string',
              enum: ['ADMIN', 'MANAGER', 'VIEWER'],
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Product: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            name: {
              type: 'string',
            },
            description: {
              type: 'string',
              nullable: true,
            },
            sku: {
              type: 'string',
            },
            price: {
              type: 'number',
              format: 'decimal',
            },
            compareAtPrice: {
              type: 'number',
              format: 'decimal',
              nullable: true,
            },
            cost: {
              type: 'number',
              format: 'decimal',
              nullable: true,
            },
            stock: {
              type: 'integer',
            },
            section: {
              type: 'string',
              enum: ['CAFE', 'FLOWERS', 'BOOKS'],
            },
            category: {
              type: 'string',
              nullable: true,
            },
            tags: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
            images: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: {
                    type: 'string',
                    format: 'uuid',
                  },
                  url: {
                    type: 'string',
                    format: 'uri',
                  },
                  altText: {
                    type: 'string',
                    nullable: true,
                  },
                  position: {
                    type: 'integer',
                  },
                },
              },
            },
            isActive: {
              type: 'boolean',
            },
            isFeatured: {
              type: 'boolean',
            },
            weight: {
              type: 'number',
              format: 'decimal',
              nullable: true,
            },
            weightUnit: {
              type: 'string',
              enum: ['KG', 'G', 'LB', 'OZ'],
              nullable: true,
            },
            dimensions: {
              type: 'object',
              nullable: true,
            },
            metadata: {
              type: 'object',
              nullable: true,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        AuthTokens: {
          type: 'object',
          properties: {
            accessToken: {
              type: 'string',
            },
            refreshToken: {
              type: 'string',
            },
            expiresIn: {
              type: 'integer',
              description: 'Access token expiration time in seconds',
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Health',
        description: 'Health check endpoints',
      },
      {
        name: 'Auth',
        description: 'Authentication and authorization endpoints',
      },
      {
        name: 'Products',
        description: 'Product management endpoints',
      },
    ],
  },
  apis: ['./src/routes/*.ts'], // Path to the API routes
};

export const swaggerSpec = swaggerJsdoc(options);
