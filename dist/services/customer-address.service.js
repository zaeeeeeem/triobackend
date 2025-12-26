"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.customerAddressService = exports.CustomerAddressService = void 0;
const database_1 = __importDefault(require("../config/database"));
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
class CustomerAddressService {
    /**
     * List all addresses for a customer
     */
    async listAddresses(customerId) {
        const addresses = await database_1.default.customerAddress.findMany({
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
    async getAddressById(customerId, addressId) {
        const address = await database_1.default.customerAddress.findFirst({
            where: {
                id: addressId,
                customerId,
            },
        });
        if (!address) {
            throw new errors_1.NotFoundError('Address', addressId);
        }
        return address;
    }
    /**
     * Create a new address
     */
    async createAddress(customerId, data) {
        // If this is set as default, unset other default addresses
        if (data.isDefault) {
            await database_1.default.customerAddress.updateMany({
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
            await database_1.default.customerAddress.updateMany({
                where: {
                    customerId,
                    isDefaultBilling: true,
                },
                data: {
                    isDefaultBilling: false,
                },
            });
        }
        const address = await database_1.default.customerAddress.create({
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
        logger_1.logger.info(`Address created for customer ${customerId}: ${address.id}`);
        return address;
    }
    /**
     * Update an address
     */
    async updateAddress(customerId, addressId, data) {
        // Verify address belongs to customer
        await this.getAddressById(customerId, addressId);
        // If setting as default, unset other default addresses
        if (data.isDefault === true) {
            await database_1.default.customerAddress.updateMany({
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
            await database_1.default.customerAddress.updateMany({
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
        const address = await database_1.default.customerAddress.update({
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
        logger_1.logger.info(`Address updated: ${addressId}`);
        return address;
    }
    /**
     * Delete an address
     */
    async deleteAddress(customerId, addressId) {
        // Verify address belongs to customer
        const address = await this.getAddressById(customerId, addressId);
        // Check if this is the only address
        const addressCount = await database_1.default.customerAddress.count({
            where: { customerId },
        });
        if (addressCount === 1) {
            throw new errors_1.ValidationError('Cannot delete the only address');
        }
        // If deleting default address, set another address as default
        if (address.isDefault) {
            const nextAddress = await database_1.default.customerAddress.findFirst({
                where: {
                    customerId,
                    id: { not: addressId },
                },
                orderBy: { createdAt: 'desc' },
            });
            if (nextAddress) {
                await database_1.default.customerAddress.update({
                    where: { id: nextAddress.id },
                    data: { isDefault: true },
                });
            }
        }
        // If deleting default billing address, set another address as default billing
        if (address.isDefaultBilling) {
            const nextAddress = await database_1.default.customerAddress.findFirst({
                where: {
                    customerId,
                    id: { not: addressId },
                },
                orderBy: { createdAt: 'desc' },
            });
            if (nextAddress) {
                await database_1.default.customerAddress.update({
                    where: { id: nextAddress.id },
                    data: { isDefaultBilling: true },
                });
            }
        }
        await database_1.default.customerAddress.delete({
            where: { id: addressId },
        });
        logger_1.logger.info(`Address deleted: ${addressId}`);
    }
    /**
     * Set an address as default (shipping or billing)
     */
    async setDefaultAddress(customerId, addressId, type = 'shipping') {
        // Verify address belongs to customer
        await this.getAddressById(customerId, addressId);
        if (type === 'shipping') {
            // Unset current default shipping address
            await database_1.default.customerAddress.updateMany({
                where: {
                    customerId,
                    isDefault: true,
                },
                data: {
                    isDefault: false,
                },
            });
            // Set new default shipping address
            await database_1.default.customerAddress.update({
                where: { id: addressId },
                data: { isDefault: true },
            });
            logger_1.logger.info(`Default shipping address set: ${addressId}`);
        }
        else {
            // Unset current default billing address
            await database_1.default.customerAddress.updateMany({
                where: {
                    customerId,
                    isDefaultBilling: true,
                },
                data: {
                    isDefaultBilling: false,
                },
            });
            // Set new default billing address
            await database_1.default.customerAddress.update({
                where: { id: addressId },
                data: { isDefaultBilling: true },
            });
            logger_1.logger.info(`Default billing address set: ${addressId}`);
        }
    }
}
exports.CustomerAddressService = CustomerAddressService;
exports.customerAddressService = new CustomerAddressService();
//# sourceMappingURL=customer-address.service.js.map