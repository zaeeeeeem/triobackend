import prisma from '../config/database';
import { logger } from '../utils/logger';
import {
  NotFoundError,
  ValidationError,
} from '../utils/errors';
import {
  CreateOrderDto,
  CreateOrderItemDto,
  UpdateOrderDto,
  OrderQueryParams,
  OrderResponse,
  OrderListResponse,
  OrderStatsBySection,
  CalculatedOrderPricing,
  ValidatedOrderItem,
} from '../types/order.types';
import { PaymentStatus, FulfillmentStatus, Section } from '@prisma/client';

/**
 * Order Service
 *
 * CRITICAL SECURITY:
 * - ALL prices are calculated server-side
 * - NEVER trust client-provided prices
 * - Always fetch current prices from database
 * - Validate inventory before creating orders
 * - Use transactions for data consistency
 */
export class OrderService {
  // Constants
  private readonly TAX_RATE = 0.18; // 18% GST for Pakistan
  private readonly DEFAULT_CURRENCY = 'PKR';
  private readonly MAX_ITEMS_PER_ORDER = 100;
  private readonly DEFAULT_PAGE = 1;
  private readonly DEFAULT_LIMIT = 20;
  private readonly MAX_LIMIT = 100;

  /**
   * Generate unique order number
   * Format: #1001, #1002, etc.
   */
  private async generateOrderNumber(): Promise<string> {
    const lastOrder = await prisma.order.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { orderNumber: true },
    });

    let nextNumber = 1001; // Starting number
    if (lastOrder && lastOrder.orderNumber) {
      const lastNumber = parseInt(lastOrder.orderNumber.replace('#', ''));
      nextNumber = lastNumber + 1;
    }

    return `#${nextNumber}`;
  }

  /**
   * Validate and fetch products with current prices from database
   *
   * SECURITY CRITICAL:
   * - Fetches prices from DB (NEVER trusts client)
   * - Validates inventory availability
   * - Prevents overselling
   * - Supports mixed-category orders (CAFE + FLOWERS + BOOKS in one order)
   */
  private async validateAndFetchProducts(
    items: CreateOrderItemDto[]
  ): Promise<ValidatedOrderItem[]> {
    if (items.length === 0) {
      throw new ValidationError('At least one product is required');
    }

    if (items.length > this.MAX_ITEMS_PER_ORDER) {
      throw new ValidationError(
        `Maximum ${this.MAX_ITEMS_PER_ORDER} items allowed per order`
      );
    }

    const validatedItems: ValidatedOrderItem[] = [];

    for (const item of items) {
      // Fetch product from database
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        select: {
          id: true,
          sku: true,
          price: true,
          stockQuantity: true,
          section: true,
          deletedAt: true,
          cafeProduct: {
            select: { name: true }
          },
          flowersProduct: {
            select: { name: true }
          },
          booksProduct: {
            select: { title: true }
          },
        },
      });

      if (!product) {
        throw new NotFoundError(`Product not found: ${item.productId}`);
      }

      // Get product name from section-specific table
      const productName = product.cafeProduct?.name || product.flowersProduct?.name || product.booksProduct?.title || 'Unknown Product';

      if (product.deletedAt) {
        throw new ValidationError(`Product is no longer available: ${productName}`);
      }

      // Check inventory availability
      if (product.stockQuantity < item.quantity) {
        throw new ValidationError(
          `Insufficient stock for "${productName}". ` +
          `Only ${product.stockQuantity} unit(s) available.`
        );
      }

      // Prevent unreasonably large orders (potential attack)
      if (item.quantity > 1000) {
        throw new ValidationError(
          `Quantity for "${productName}" exceeds maximum allowed (1000)`
        );
      }

      // Get price (from database, NOT from request)
      let itemPrice = Number(product.price);

      // TODO: If product has variants, fetch variant price
      // if (item.variantId) {
      //   const variant = await prisma.productVariant.findUnique({
      //     where: { id: item.variantId },
      //   });
      //   if (variant && variant.productId === product.id) {
      //     itemPrice = Number(variant.price);
      //   } else {
      //     throw new ValidationError('Invalid variant for product');
      //   }
      // }

      // Calculate line total
      const lineTotal = itemPrice * item.quantity;

      validatedItems.push({
        productId: product.id,
        productName: productName,
        sku: product.sku,
        variantId: item.variantId,
        quantity: item.quantity,
        price: itemPrice, // From database
        total: lineTotal, // Calculated
        section: product.section,
      });
    }

    return validatedItems;
  }

  /**
   * Calculate tax (18% GST for Pakistan)
   * Applied to taxable amount (subtotal - discount)
   */
  private calculateTax(subtotal: number, discount: number): number {
    const taxableAmount = subtotal - discount;
    const taxAmount = taxableAmount * this.TAX_RATE;
    return Math.round(taxAmount * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Validate shipping cost
   * For now, accepts the provided cost
   * TODO: Integrate with shipping API or validate against rate table
   */
  private async validateShippingCost(
    providedCost: number = 0,
    _section: Section,
    _city?: string
  ): Promise<number> {
    // Option A: Fixed rates per section
    // const shippingRates = {
    //   CAFE: 0,      // Free delivery
    //   FLOWERS: 200, // Rs 200
    //   BOOKS: 150,   // Rs 150
    // };
    // return shippingRates[section];

    // Option B: Accept provided cost (validated by frontend)
    // TODO: Add validation against shipping API
    if (providedCost < 0) {
      throw new ValidationError('Shipping cost cannot be negative');
    }

    return providedCost;
  }

  /**
   * Calculate complete order pricing
   */
  private calculateOrderPricing(
    items: ValidatedOrderItem[],
    discountAmount: number = 0,
    shippingCost: number = 0
  ): CalculatedOrderPricing {
    // Calculate subtotal
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);

    // Calculate tax on taxable amount
    const tax = this.calculateTax(subtotal, discountAmount);

    // Calculate total
    const total = subtotal - discountAmount + tax + shippingCost;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      discount: Math.round(discountAmount * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      shippingCost: Math.round(shippingCost * 100) / 100,
      total: Math.round(total * 100) / 100,
    };
  }

  /**
   * Format price for display
   */
  private formatPrice(amount: number, currency: string = this.DEFAULT_CURRENCY): string {
    return `${currency} ${amount.toLocaleString('en-PK', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;
  }

  /**
   * Reserve inventory for order items
   * Decrements stockQuantity to prevent overselling
   */
  private async reserveInventory(
    items: ValidatedOrderItem[],
    transaction: any
  ): Promise<void> {
    for (const item of items) {
      await transaction.product.update({
        where: { id: item.productId },
        data: {
          stockQuantity: {
            decrement: item.quantity,
          },
        },
      });

      logger.info(
        `Reserved ${item.quantity} unit(s) of product ${item.productId}`
      );
    }
  }

  /**
   * Update customer order statistics
   * Increments totalOrders, totalSpent, and recalculates averageOrderValue
   */
  private async updateCustomerStats(
    customerId: string,
    orderTotal: number,
    transaction: any
  ): Promise<void> {
    const customer = await transaction.customer.findUnique({
      where: { id: customerId },
      select: { totalOrders: true, totalSpent: true },
    });

    if (!customer) {
      logger.warn(`Customer ${customerId} not found for stats update`);
      return;
    }

    const newTotalOrders = customer.totalOrders + 1;
    const newTotalSpent = Number(customer.totalSpent) + orderTotal;
    const newAverageOrderValue = newTotalSpent / newTotalOrders;

    await transaction.customer.update({
      where: { id: customerId },
      data: {
        totalOrders: newTotalOrders,
        totalSpent: newTotalSpent,
        averageOrderValue: newAverageOrderValue,
        lastOrderDate: new Date(),
      },
    });

    logger.info(`Updated stats for customer ${customerId}`);
  }

  /**
   * Validate payment status transition
   */
  private validatePaymentStatusTransition(
    currentStatus: PaymentStatus,
    newStatus: PaymentStatus
  ): void {
    const allowedTransitions: Record<PaymentStatus, PaymentStatus[]> = {
      PENDING: ['PAID', 'FAILED'],
      PAID: ['REFUNDED'],
      FAILED: ['PENDING'],
      REFUNDED: [], // Cannot change from refunded
    };

    const allowed = allowedTransitions[currentStatus];

    if (!allowed || !allowed.includes(newStatus)) {
      throw new ValidationError(
        `Cannot change payment status from ${currentStatus} to ${newStatus}`
      );
    }
  }

  /**
   * Validate fulfillment status transition
   */
  private validateFulfillmentStatusTransition(
    currentStatus: FulfillmentStatus,
    newStatus: FulfillmentStatus
  ): void {
    const allowedTransitions: Record<FulfillmentStatus, FulfillmentStatus[]> = {
      UNFULFILLED: ['FULFILLED', 'PARTIAL', 'SCHEDULED'],
      FULFILLED: ['UNFULFILLED'], // Can revert
      PARTIAL: ['FULFILLED', 'UNFULFILLED'],
      SCHEDULED: ['FULFILLED', 'UNFULFILLED', 'PARTIAL'],
    };

    const allowed = allowedTransitions[currentStatus];

    if (!allowed || !allowed.includes(newStatus)) {
      throw new ValidationError(
        `Cannot change fulfillment status from ${currentStatus} to ${newStatus}`
      );
    }
  }

  /**
   * Transform database order to response format
   */
  private transformOrderToResponse(order: any): OrderResponse {
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      customer: {
        id: order.customerId || undefined,
        name: order.customerName,
        email: order.customerEmail,
        phone: order.customerPhone || undefined,
      },
      date: order.orderDate,
      section: order.section,
      paymentStatus: order.paymentStatus,
      fulfillmentStatus: order.fulfillmentStatus,
      items: order.items?.map((item: any) => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        variantId: item.variantId || undefined,
        quantity: item.quantity,
        price: Number(item.price),
        total: Number(item.total),
      })) || [],
      itemsCount: order.items?.length || 0,
      subtotal: Number(order.subtotal),
      tax: Number(order.tax),
      discount: Number(order.discount),
      shippingCost: Number(order.shippingCost),
      total: Number(order.total),
      totalFormatted: this.formatPrice(Number(order.total), order.currency),
      currency: order.currency,
      shippingAddress: order.shippingAddress
        ? {
            fullName: order.shippingAddress.fullName,
            phone: order.shippingAddress.phone,
            email: order.shippingAddress.email || undefined,
            address: order.shippingAddress.address,
            city: order.shippingAddress.city,
            state: order.shippingAddress.state,
            postalCode: order.shippingAddress.postalCode,
            country: order.shippingAddress.country,
          }
        : undefined,
      notes: order.notes || undefined,
      tags: order.tags || [],
      paymentMethod: order.paymentMethod || undefined,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      createdBy: order.createdBy || undefined,
      guestOrder: order.guestOrder,
    };
  }

  /**
   * Create a new order
   *
   * CRITICAL SECURITY:
   * - All prices calculated server-side from database
   * - Inventory validated before creation
   * - Uses database transaction for consistency
   * - Guest orders supported
   */
  async createOrder(
    data: CreateOrderDto,
    createdBy: string
  ): Promise<OrderResponse> {
    try {
      // 1. Generate order number
      const orderNumber = await this.generateOrderNumber();

      // 2. Validate and fetch products with DB prices
      const validatedItems = await this.validateAndFetchProducts(
        data.items
      );

      // Determine order section (use first item's section for mixed orders)
      const orderSection = data.section || validatedItems[0].section;

      // 3. Apply discount code if provided
      let discountAmount = 0;
      // let discountCodeData = null;
      if (data.discountCode) {
        // TODO: Implement discount service integration
        // const discountCalc = await discountService.applyDiscount(
        //   data.discountCode,
        //   subtotal,
        //   customerId
        // );
        // discountAmount = discountCalc.appliedAmount;
        // discountCodeData = discountCalc;
        logger.warn('Discount code provided but discount service not yet implemented');
      }

      // 4. Validate shipping cost
      const shippingCost = await this.validateShippingCost(
        0, // TODO: Accept from request when shipping is implemented
        orderSection,
        data.shippingAddress?.city
      );

      // 5. Calculate order pricing
      const pricing = this.calculateOrderPricing(
        validatedItems,
        discountAmount,
        shippingCost
      );

      // 6. Find or prepare customer data
      let customerId: string | undefined;
      const isGuest = !data.customer.email.includes('@') ? false : true; // Simple check

      if (!isGuest) {
        // Try to find existing customer by email
        const existingCustomer = await prisma.customer.findUnique({
          where: { email: data.customer.email },
        });

        customerId = existingCustomer?.id;
      }

      // 7. Create order in transaction
      const order = await prisma.$transaction(async (tx) => {
        // Create order
        const createdOrder = await tx.order.create({
          data: {
            orderNumber,
            customerId: customerId || null,
            customerEmail: data.customer.email,
            customerName: data.customer.name,
            customerPhone: data.customer.phone || null,
            guestOrder: !customerId,
            guestToken: !customerId ? `guest-${Date.now()}` : null,
            section: orderSection,
            paymentStatus: data.paymentStatus || PaymentStatus.PENDING,
            fulfillmentStatus: data.fulfillmentStatus || FulfillmentStatus.UNFULFILLED,
            subtotal: pricing.subtotal,
            tax: pricing.tax,
            discount: pricing.discount,
            shippingCost: pricing.shippingCost,
            total: pricing.total,
            currency: this.DEFAULT_CURRENCY,
            paymentMethod: data.paymentMethod || null,
            notes: data.notes || null,
            tags: data.tags || [],
            orderDate: new Date(),
            createdBy,
          },
          include: {
            items: true,
            shippingAddress: true,
          },
        });

        // Create order items
        await tx.orderItem.createMany({
          data: validatedItems.map((item) => ({
            orderId: createdOrder.id,
            productId: item.productId,
            productName: item.productName,
            sku: item.sku,
            variantId: item.variantId || null,
            quantity: item.quantity,
            price: item.price,
            total: item.total,
          })),
        });

        // Create shipping address if provided
        if (data.shippingAddress) {
          await tx.shippingAddress.create({
            data: {
              orderId: createdOrder.id,
              fullName: data.shippingAddress.fullName,
              phone: data.shippingAddress.phone,
              email: data.shippingAddress.email || null,
              address: data.shippingAddress.address,
              city: data.shippingAddress.city,
              state: data.shippingAddress.state,
              postalCode: data.shippingAddress.postalCode,
              country: data.shippingAddress.country || 'Pakistan',
            },
          });
        }

        // Reserve inventory
        await this.reserveInventory(validatedItems, tx);

        // Update customer statistics if customer exists
        if (customerId) {
          await this.updateCustomerStats(customerId, pricing.total, tx);
        }

        // Fetch complete order with relations
        const completeOrder = await tx.order.findUnique({
          where: { id: createdOrder.id },
          include: {
            items: true,
            shippingAddress: true,
          },
        });

        return completeOrder!;
      });

      logger.info(`Order created: ${orderNumber} (${order.id})`);

      return this.transformOrderToResponse(order);
    } catch (error) {
      logger.error('Error creating order:', error);
      throw error;
    }
  }

  /**
   * Get order by ID
   */
  async getOrderById(orderId: string): Promise<OrderResponse> {
    const order = await prisma.order.findUnique({
      where: { id: orderId, deletedAt: null },
      include: {
        items: true,
        shippingAddress: true,
      },
    });

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    return this.transformOrderToResponse(order);
  }

  /**
   * Get order by order number
   */
  async getOrderByNumber(orderNumber: string): Promise<OrderResponse> {
    const order = await prisma.order.findFirst({
      where: { orderNumber, deletedAt: null },
      include: {
        items: true,
        shippingAddress: true,
      },
    });

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    return this.transformOrderToResponse(order);
  }

  /**
   * List orders with filtering, pagination, and search
   */
  async listOrders(params: OrderQueryParams): Promise<OrderListResponse> {
    const page = params.page || this.DEFAULT_PAGE;
    const limit = Math.min(params.limit || this.DEFAULT_LIMIT, this.MAX_LIMIT);
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      deletedAt: null,
    };

    if (params.search) {
      where.OR = [
        { orderNumber: { contains: params.search, mode: 'insensitive' } },
        { customerName: { contains: params.search, mode: 'insensitive' } },
        { customerEmail: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    if (params.section) {
      where.section = params.section;
    }

    if (params.paymentStatus) {
      where.paymentStatus = params.paymentStatus;
    }

    if (params.fulfillmentStatus) {
      where.fulfillmentStatus = params.fulfillmentStatus;
    }

    if (params.customerId) {
      where.customerId = params.customerId;
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

    // Build orderBy clause
    const orderBy: any = {};
    const sortBy = params.sortBy || 'orderDate';
    const sortOrder = params.sortOrder || 'desc';
    orderBy[sortBy] = sortOrder;

    // Fetch orders and total count
    const [orders, totalOrders] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: true,
          shippingAddress: true,
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    const totalPages = Math.ceil(totalOrders / limit);

    return {
      orders: orders.map((order) => this.transformOrderToResponse(order)),
      pagination: {
        page,
        limit,
        totalPages,
        totalOrders,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      },
    };
  }

  /**
   * Update order
   */
  async updateOrder(
    orderId: string,
    data: UpdateOrderDto
  ): Promise<OrderResponse> {
    // Check if order exists
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId, deletedAt: null },
    });

    if (!existingOrder) {
      throw new NotFoundError('Order not found');
    }

    // Validate status transitions if provided
    if (data.paymentStatus) {
      this.validatePaymentStatusTransition(
        existingOrder.paymentStatus,
        data.paymentStatus
      );
    }

    if (data.fulfillmentStatus) {
      this.validateFulfillmentStatusTransition(
        existingOrder.fulfillmentStatus,
        data.fulfillmentStatus
      );
    }

    // Update order
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: data.paymentStatus,
        fulfillmentStatus: data.fulfillmentStatus,
        notes: data.notes,
        tags: data.tags,
        paymentMethod: data.paymentMethod,
      },
      include: {
        items: true,
        shippingAddress: true,
      },
    });

    logger.info(`Order updated: ${updatedOrder.orderNumber}`);

    return this.transformOrderToResponse(updatedOrder);
  }

  /**
   * Update payment status only
   */
  async updatePaymentStatus(
    orderId: string,
    newStatus: PaymentStatus
  ): Promise<OrderResponse> {
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId, deletedAt: null },
    });

    if (!existingOrder) {
      throw new NotFoundError('Order not found');
    }

    // Validate transition
    this.validatePaymentStatusTransition(
      existingOrder.paymentStatus,
      newStatus
    );

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { paymentStatus: newStatus },
      include: {
        items: true,
        shippingAddress: true,
      },
    });

    logger.info(
      `Payment status updated for ${updatedOrder.orderNumber}: ${newStatus}`
    );

    return this.transformOrderToResponse(updatedOrder);
  }

  /**
   * Update fulfillment status only
   */
  async updateFulfillmentStatus(
    orderId: string,
    newStatus: FulfillmentStatus
  ): Promise<OrderResponse> {
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId, deletedAt: null },
    });

    if (!existingOrder) {
      throw new NotFoundError('Order not found');
    }

    // Validate transition
    this.validateFulfillmentStatusTransition(
      existingOrder.fulfillmentStatus,
      newStatus
    );

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { fulfillmentStatus: newStatus },
      include: {
        items: true,
        shippingAddress: true,
      },
    });

    logger.info(
      `Fulfillment status updated for ${updatedOrder.orderNumber}: ${newStatus}`
    );

    return this.transformOrderToResponse(updatedOrder);
  }

  /**
   * Delete order (soft delete by default)
   */
  async deleteOrder(orderId: string, hard: boolean = false): Promise<void> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    // Business rule: Cannot delete paid orders
    if (order.paymentStatus === PaymentStatus.PAID) {
      throw new ValidationError(
        'Cannot delete paid orders. Please refund the order first.'
      );
    }

    // Business rule: Cannot delete fulfilled orders
    if (
      order.fulfillmentStatus === FulfillmentStatus.FULFILLED
    ) {
      throw new ValidationError(
        'Cannot delete orders that have been shipped or delivered'
      );
    }

    if (hard) {
      // Hard delete (admin only)
      await prisma.order.delete({
        where: { id: orderId },
      });
      logger.warn(`Order hard deleted: ${order.orderNumber}`);
    } else {
      // Soft delete
      await prisma.order.update({
        where: { id: orderId },
        data: { deletedAt: new Date() },
      });
      logger.info(`Order soft deleted: ${order.orderNumber}`);
    }
  }

  /**
   * Duplicate order
   * Creates a new order with same items and customer
   */
  async duplicateOrder(orderId: string, createdBy: string): Promise<OrderResponse> {
    const originalOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        shippingAddress: true,
      },
    });

    if (!originalOrder) {
      throw new NotFoundError('Order not found');
    }

    // Create new order with same data
    const duplicateData: CreateOrderDto = {
      customer: {
        name: originalOrder.customerName,
        email: originalOrder.customerEmail,
        phone: originalOrder.customerPhone || undefined,
      },
      section: originalOrder.section,
      items: originalOrder.items.map((item) => ({
        productId: item.productId,
        variantId: item.variantId || undefined,
        quantity: item.quantity,
      })),
      shippingAddress: originalOrder.shippingAddress
        ? {
            fullName: originalOrder.shippingAddress.fullName,
            phone: originalOrder.shippingAddress.phone,
            email: originalOrder.shippingAddress.email || undefined,
            address: originalOrder.shippingAddress.address,
            city: originalOrder.shippingAddress.city,
            state: originalOrder.shippingAddress.state,
            postalCode: originalOrder.shippingAddress.postalCode,
            country: originalOrder.shippingAddress.country,
          }
        : undefined,
      notes: originalOrder.notes ? `Duplicate of ${originalOrder.orderNumber}` : undefined,
      tags: originalOrder.tags,
      paymentMethod: originalOrder.paymentMethod || undefined,
    };

    const newOrder = await this.createOrder(duplicateData, createdBy);

    logger.info(
      `Order duplicated: ${originalOrder.orderNumber} → ${newOrder.orderNumber}`
    );

    return newOrder;
  }

  /**
   * Get order statistics
   */
  async getOrderStats(params: {
    dateFrom?: Date;
    dateTo?: Date;
    section?: Section;
  }): Promise<OrderStatsBySection> {
    const where: any = {
      deletedAt: null,
    };

    if (params.section) {
      where.section = params.section;
    }

    if (params.dateFrom || params.dateTo) {
      where.orderDate = {};
      if (params.dateFrom) {
        where.orderDate.gte = params.dateFrom;
      }
      if (params.dateTo) {
        where.orderDate.lte = params.dateTo;
      }
    }

    // Fetch all orders matching criteria
    const orders = await prisma.order.findMany({
      where,
      select: {
        total: true,
        paymentStatus: true,
        fulfillmentStatus: true,
        section: true,
      },
    });

    // Calculate overview stats
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total), 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Calculate payment status breakdown
    const paymentStatus: Record<PaymentStatus, number> = {
      PENDING: 0,
      PAID: 0,
      FAILED: 0,
      REFUNDED: 0,
    };

    orders.forEach((order) => {
      paymentStatus[order.paymentStatus]++;
    });

    // Calculate fulfillment status breakdown
    const fulfillmentStatus: Record<FulfillmentStatus, number> = {
      UNFULFILLED: 0,
      FULFILLED: 0,
      PARTIAL: 0,
      SCHEDULED: 0,
    };

    orders.forEach((order) => {
      fulfillmentStatus[order.fulfillmentStatus]++;
    });

    // Calculate by section
    const bySection: Record<Section, { orders: number; revenue: number }> = {
      CAFE: { orders: 0, revenue: 0 },
      FLOWERS: { orders: 0, revenue: 0 },
      BOOKS: { orders: 0, revenue: 0 },
    };

    orders.forEach((order) => {
      bySection[order.section].orders++;
      bySection[order.section].revenue += Number(order.total);
    });

    return {
      overview: {
        totalOrders,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        averageOrderValue: Math.round(averageOrderValue * 100) / 100,
      },
      paymentStatus,
      fulfillmentStatus,
      bySection,
    };
  }

  /**
   * Export orders to CSV
   */
  async exportOrdersToCsv(params: OrderQueryParams): Promise<string> {
    // Use listOrders to get filtered orders
    const { orders } = await this.listOrders({
      ...params,
      limit: 10000, // Max export limit
    });

    // CSV headers
    const headers = [
      'Order Number',
      'Customer Name',
      'Customer Email',
      'Date',
      'Section',
      'Payment Status',
      'Fulfillment Status',
      'Items Count',
      'Total',
    ];

    // CSV rows
    const rows = orders.map((order) => [
      order.orderNumber,
      order.customer.name,
      order.customer.email,
      order.date.toISOString().split('T')[0], // Date only
      order.section,
      order.paymentStatus,
      order.fulfillmentStatus,
      order.itemsCount.toString(),
      order.total.toFixed(2),
    ]);

    // Build CSV string
    const csvLines = [headers, ...rows];
    const csv = csvLines.map((row) => row.join(',')).join('\n');

    return csv;
  }
}

// Export singleton instance
export const orderService = new OrderService();
