import bcrypt from 'bcryptjs';
import prisma from '../config/database';
import { logger } from '../utils/logger';
import { NotFoundError, UnauthorizedError, ConflictError } from '../utils/errors';
import { emailService } from './email.service';
import { customerAuthService } from './customer-auth.service';
import {
  UpdateCustomerDto,
  UpdateCustomerPreferencesDto,
  CustomerQueryParams,
  CustomerStatistics,
} from '../types/customer.types';
// import { Section } from '@prisma/client';

export class CustomerService {
  /**
   * Get customer by ID
   */
  async getCustomerById(customerId: string) {
    const customer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        deletedAt: null,
      },
      include: {
        addresses: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!customer) {
      throw new NotFoundError('Customer', customerId);
    }

    return this.sanitizeCustomer(customer);
  }

  /**
   * Get customer profile with statistics
   */
  async getCustomerProfile(customerId: string) {
    const customer = await this.getCustomerById(customerId);
    const statistics = await this.calculateStatistics(customerId);

    return {
      customer,
      statistics,
    };
  }

  /**
   * Update customer profile
   */
  async updateCustomer(customerId: string, data: UpdateCustomerDto) {
    // Verify customer exists
    await this.getCustomerById(customerId);

    const customer = await prisma.customer.update({
      where: { id: customerId },
      data: {
        name: data.name,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        location: data.location,
        timezone: data.timezone,
        language: data.language,
        status: data.status,
        tags: data.tags,
        customerType: data.customerType,
        notes: data.notes,
      },
    });

    logger.info(`Customer profile updated: ${customerId}`);

    return this.sanitizeCustomer(customer);
  }

  /**
   * Change customer email (requires verification)
   */
  async changeEmail(customerId: string, newEmail: string, password: string): Promise<void> {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer || !customer.passwordHash) {
      throw new NotFoundError('Customer', customerId);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, customer.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid password');
    }

    // Check if new email already exists
    const existingEmail = await prisma.customer.findUnique({
      where: { email: newEmail },
    });

    if (existingEmail) {
      throw new ConflictError('Email already in use');
    }

    // TODO: Implement email change verification flow
    // For now, update directly
    await prisma.customer.update({
      where: { id: customerId },
      data: {
        email: newEmail,
        emailVerified: false,
      },
    });

    logger.info(`Customer email changed: ${customerId} to ${newEmail}`);
  }

  /**
   * Change customer password
   */
  async changePassword(customerId: string, currentPassword: string, newPassword: string): Promise<void> {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer || !customer.passwordHash) {
      throw new NotFoundError('Customer', customerId);
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, customer.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid current password');
    }

    // Validate new password strength
    await (customerAuthService as any).validatePasswordStrength(newPassword);

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Update password
    await prisma.customer.update({
      where: { id: customerId },
      data: { passwordHash },
    });

    // Invalidate all refresh tokens (force re-login on other devices)
    await prisma.customerRefreshToken.deleteMany({
      where: { customerId },
    });

    // Send confirmation email
    await emailService.sendPasswordChangedEmail(customer.email, customer.name);

    logger.info(`Customer password changed: ${customerId}`);
  }

  /**
   * Update customer preferences
   */
  async updatePreferences(customerId: string, data: UpdateCustomerPreferencesDto) {
    const customer = await prisma.customer.update({
      where: { id: customerId },
      data: {
        marketingConsent: data.marketingConsent,
        smsConsent: data.smsConsent,
        emailPreferences: data.emailPreferences
          ? JSON.stringify(data.emailPreferences)
          : undefined,
      },
    });

    logger.info(`Customer preferences updated: ${customerId}`);

    return this.sanitizeCustomer(customer);
  }

  /**
   * Delete customer account (soft delete)
   */
  async deleteCustomer(customerId: string, password: string): Promise<void> {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer || !customer.passwordHash) {
      throw new NotFoundError('Customer', customerId);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, customer.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid password');
    }

    // Soft delete
    await prisma.customer.update({
      where: { id: customerId },
      data: {
        deletedAt: new Date(),
        status: 'INACTIVE',
      },
    });

    // Revoke all tokens
    await prisma.customerRefreshToken.deleteMany({
      where: { customerId },
    });

    logger.info(`Customer account deleted (soft): ${customerId}`);
  }

  /**
   * Get customer orders
   */
  async getCustomerOrders(customerId: string, params: any = {}) {
    const page = params.page || 1;
    const limit = Math.min(params.limit || 20, 100);
    const skip = (page - 1) * limit;

    const where: any = {
      customerId,
      deletedAt: null,
    };

    if (params.section) {
      where.section = params.section;
    }

    if (params.paymentStatus) {
      where.paymentStatus = params.paymentStatus;
    }

    if (params.fulfillmentStatus) {
      where.fulfillmentStatus = params.fulfillmentStatus;
    }

    if (params.dateFrom || params.dateTo) {
      where.orderDate = {};
      if (params.dateFrom) {
        where.orderDate.gte = new Date(params.dateFrom);
      }
      if (params.dateTo) {
        where.orderDate.lte = new Date(params.dateTo);
      }
    }

    const [orders, totalItems] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: {
            take: 3, // Preview of first 3 items
            select: {
              productName: true,
              quantity: true,
              price: true,
            },
          },
          shippingAddress: true,
        },
        orderBy: { orderDate: 'desc' },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return {
      orders,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalItems / limit),
        totalItems,
      },
    };
  }

  /**
   * Get single order details
   */
  async getOrderById(customerId: string, orderId: string) {
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        customerId,
        deletedAt: null,
      },
      include: {
        items: true,
        shippingAddress: true,
      },
    });

    if (!order) {
      throw new NotFoundError('Order', orderId);
    }

    return order;
  }

  /**
   * Calculate customer statistics
   */
  async calculateStatistics(customerId: string): Promise<CustomerStatistics> {
    const orders = await prisma.order.findMany({
      where: {
        customerId,
        deletedAt: null,
      },
      select: {
        total: true,
        orderDate: true,
        section: true,
        items: {
          select: {
            productId: true,
            productName: true,
          },
        },
      },
      orderBy: { orderDate: 'desc' },
    });

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { createdAt: true },
    });

    if (!customer) {
      throw new NotFoundError('Customer', customerId);
    }

    const totalOrders = orders.length;
    const totalSpent = orders.reduce((sum, order) => sum + Number(order.total), 0);
    const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;
    const lastOrderDate = orders[0]?.orderDate || null;

    // Calculate days since last order
    let daysSinceLastOrder = null;
    if (lastOrderDate) {
      const diffTime = Math.abs(Date.now() - lastOrderDate.getTime());
      daysSinceLastOrder = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    }

    // Calculate order frequency (orders per month)
    const daysSinceFirstOrder = Math.floor(
      (Date.now() - customer.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    const orderFrequency =
      daysSinceFirstOrder > 0 ? (totalOrders / daysSinceFirstOrder) * 30 : 0;

    // Find favorite section
    const sectionCounts: Record<string, number> = {};
    orders.forEach((order) => {
      sectionCounts[order.section] = (sectionCounts[order.section] || 0) + 1;
    });
    const favoriteSection = Object.keys(sectionCounts).reduce(
      (a, b) => (sectionCounts[a] > sectionCounts[b] ? a : b),
      'CAFE'
    ) as 'CAFE' | 'FLOWERS' | 'BOOKS';

    // Find top products
    const productCounts: Record<string, { name: string; count: number }> = {};
    orders.forEach((order) => {
      order.items.forEach((item) => {
        if (!productCounts[item.productId]) {
          productCounts[item.productId] = { name: item.productName, count: 0 };
        }
        productCounts[item.productId].count++;
      });
    });

    const topProducts = Object.entries(productCounts)
      .map(([productId, data]) => ({
        productId,
        productName: data.name,
        purchaseCount: data.count,
      }))
      .sort((a, b) => b.purchaseCount - a.purchaseCount)
      .slice(0, 5);

    // Calculate loyalty tier
    let loyaltyTier: 'bronze' | 'silver' | 'gold' | 'platinum' = 'bronze';
    if (totalSpent >= 50000) loyaltyTier = 'platinum';
    else if (totalSpent >= 25000) loyaltyTier = 'gold';
    else if (totalSpent >= 10000) loyaltyTier = 'silver';

    return {
      customerId,
      totalOrders,
      totalSpent,
      averageOrderValue,
      lastOrderDate,
      daysSinceLastOrder,
      orderFrequency,
      favoriteSection,
      topProducts,
      lifetimeValue: totalSpent,
      loyaltyTier,
      customerSince: customer.createdAt,
      lastUpdated: new Date(),
    };
  }

  /**
   * List all customers (admin)
   */
  async listCustomers(params: CustomerQueryParams) {
    const page = params.page || 1;
    const limit = Math.min(params.limit || 20, 100);
    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
    };

    // Search
    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { email: { contains: params.search, mode: 'insensitive' } },
        { phone: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    // Status filter
    if (params.status) {
      where.status = params.status;
    }

    // Customer type filter
    if (params.customerType) {
      where.customerType = params.customerType;
    }

    // Tags filter
    if (params.tags) {
      where.tags = { hasSome: params.tags.split(',') };
    }

    // Date range filter
    if (params.createdFrom || params.createdTo) {
      where.createdAt = {};
      if (params.createdFrom) {
        where.createdAt.gte = new Date(params.createdFrom);
      }
      if (params.createdTo) {
        where.createdAt.lte = new Date(params.createdTo);
      }
    }

    // Sorting
    const orderBy: any = {};
    const sortBy = params.sortBy || 'createdAt';
    const sortOrder = params.sortOrder || 'desc';
    orderBy[sortBy] = sortOrder;

    const [customers, totalItems] = await Promise.all([
      prisma.customer.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      prisma.customer.count({ where }),
    ]);

    // Calculate statistics
    const [activeCount, inactiveCount, suspendedCount] = await Promise.all([
      prisma.customer.count({ where: { status: 'ACTIVE', deletedAt: null } }),
      prisma.customer.count({ where: { status: 'INACTIVE', deletedAt: null } }),
      prisma.customer.count({ where: { status: 'SUSPENDED', deletedAt: null } }),
    ]);

    const sanitizedCustomers = customers.map((c) => this.sanitizeCustomer(c));

    return {
      customers: sanitizedCustomers,
      totalItems,
      page,
      limit,
      totalPages: Math.ceil(totalItems / limit),
      statistics: {
        totalCustomers: totalItems,
        activeCustomers: activeCount,
        inactiveCustomers: inactiveCount,
        suspendedCustomers: suspendedCount,
        totalOrders: 0, // TODO: Calculate
        totalRevenue: 0, // TODO: Calculate
      },
    };
  }

  /**
   * Create customer (admin)
   */
  async createCustomer(data: any) {
    // Check if email already exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { email: data.email },
    });

    if (existingCustomer) {
      throw new ConflictError('Email already exists');
    }

    const customer = await prisma.customer.create({
      data: {
        email: data.email,
        name: data.name,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        location: data.location,
        status: data.status || 'ACTIVE',
        tags: data.tags || [],
        customerType: data.customerType,
        notes: data.notes,
        registrationSource: 'admin',
      },
    });

    if (data.sendWelcomeEmail) {
      await emailService.sendWelcomeEmail(customer.email, customer.name);
    }

    logger.info(`Customer created by admin: ${customer.id}`);

    return this.sanitizeCustomer(customer);
  }

  // ==================== PRIVATE HELPER METHODS ====================

  /**
   * Sanitize customer object (remove sensitive fields)
   */
  private sanitizeCustomer(customer: any) {
    const {
      passwordHash,
      emailVerificationToken,
      emailVerificationExpiry,
      passwordResetToken,
      passwordResetExpiry,
      ...sanitized
    } = customer;

    return sanitized;
  }
}

export const customerService = new CustomerService();
