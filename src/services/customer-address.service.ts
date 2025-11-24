import prisma from '../config/database';
import { logger } from '../utils/logger';
import { NotFoundError, ValidationError } from '../utils/errors';
import { CreateAddressDto, UpdateAddressDto } from '../types/address.types';

export class CustomerAddressService {
  /**
   * List all addresses for a customer
   */
  async listAddresses(customerId: string) {
    const addresses = await prisma.customerAddress.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
    });

    const defaultShipping = addresses.find((a) => a.isDefault) || null;
    const defaultBilling = addresses.find((a) => a.isDefaultBilling) || null;

    return {
      addresses,
      defaultShipping,
      defaultBilling,
    };
  }

  /**
   * Get address by ID
   */
  async getAddressById(customerId: string, addressId: string) {
    const address = await prisma.customerAddress.findFirst({
      where: {
        id: addressId,
        customerId,
      },
    });

    if (!address) {
      throw new NotFoundError('Address', addressId);
    }

    return address;
  }

  /**
   * Create a new address
   */
  async createAddress(customerId: string, data: CreateAddressDto) {
    // If this is set as default, unset other default addresses
    if (data.isDefault) {
      await prisma.customerAddress.updateMany({
        where: {
          customerId,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }

    // If this is set as default billing, unset other default billing addresses
    if (data.isDefaultBilling) {
      await prisma.customerAddress.updateMany({
        where: {
          customerId,
          isDefaultBilling: true,
        },
        data: {
          isDefaultBilling: false,
        },
      });
    }

    const address = await prisma.customerAddress.create({
      data: {
        customerId,
        firstName: data.firstName,
        lastName: data.lastName,
        company: data.company,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
        country: data.country,
        phone: data.phone,
        isDefault: data.isDefault || false,
        isDefaultBilling: data.isDefaultBilling || false,
        label: data.label,
      },
    });

    logger.info(`Address created for customer ${customerId}: ${address.id}`);

    return address;
  }

  /**
   * Update an address
   */
  async updateAddress(customerId: string, addressId: string, data: UpdateAddressDto) {
    // Verify address belongs to customer
    await this.getAddressById(customerId, addressId);

    // If setting as default, unset other default addresses
    if (data.isDefault === true) {
      await prisma.customerAddress.updateMany({
        where: {
          customerId,
          isDefault: true,
          id: { not: addressId },
        },
        data: {
          isDefault: false,
        },
      });
    }

    // If setting as default billing, unset other default billing addresses
    if (data.isDefaultBilling === true) {
      await prisma.customerAddress.updateMany({
        where: {
          customerId,
          isDefaultBilling: true,
          id: { not: addressId },
        },
        data: {
          isDefaultBilling: false,
        },
      });
    }

    const address = await prisma.customerAddress.update({
      where: { id: addressId },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        company: data.company,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
        country: data.country,
        phone: data.phone,
        isDefault: data.isDefault,
        isDefaultBilling: data.isDefaultBilling,
        label: data.label,
      },
    });

    logger.info(`Address updated: ${addressId}`);

    return address;
  }

  /**
   * Delete an address
   */
  async deleteAddress(customerId: string, addressId: string): Promise<void> {
    // Verify address belongs to customer
    const address = await this.getAddressById(customerId, addressId);

    // Check if this is the only address
    const addressCount = await prisma.customerAddress.count({
      where: { customerId },
    });

    if (addressCount === 1) {
      throw new ValidationError('Cannot delete the only address');
    }

    // If deleting default address, set another address as default
    if (address.isDefault) {
      const nextAddress = await prisma.customerAddress.findFirst({
        where: {
          customerId,
          id: { not: addressId },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (nextAddress) {
        await prisma.customerAddress.update({
          where: { id: nextAddress.id },
          data: { isDefault: true },
        });
      }
    }

    // If deleting default billing address, set another address as default billing
    if (address.isDefaultBilling) {
      const nextAddress = await prisma.customerAddress.findFirst({
        where: {
          customerId,
          id: { not: addressId },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (nextAddress) {
        await prisma.customerAddress.update({
          where: { id: nextAddress.id },
          data: { isDefaultBilling: true },
        });
      }
    }

    await prisma.customerAddress.delete({
      where: { id: addressId },
    });

    logger.info(`Address deleted: ${addressId}`);
  }

  /**
   * Set an address as default (shipping or billing)
   */
  async setDefaultAddress(customerId: string, addressId: string, type: 'shipping' | 'billing' = 'shipping') {
    // Verify address belongs to customer
    await this.getAddressById(customerId, addressId);

    if (type === 'shipping') {
      // Unset current default shipping address
      await prisma.customerAddress.updateMany({
        where: {
          customerId,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });

      // Set new default shipping address
      await prisma.customerAddress.update({
        where: { id: addressId },
        data: { isDefault: true },
      });

      logger.info(`Default shipping address set: ${addressId}`);
    } else {
      // Unset current default billing address
      await prisma.customerAddress.updateMany({
        where: {
          customerId,
          isDefaultBilling: true,
        },
        data: {
          isDefaultBilling: false,
        },
      });

      // Set new default billing address
      await prisma.customerAddress.update({
        where: { id: addressId },
        data: { isDefaultBilling: true },
      });

      logger.info(`Default billing address set: ${addressId}`);
    }
  }
}

export const customerAddressService = new CustomerAddressService();
