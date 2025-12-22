import { CreateAddressDto, UpdateAddressDto } from '../types/address.types';
export declare class CustomerAddressService {
    /**
     * List all addresses for a customer
     */
    listAddresses(customerId: string): Promise<{
        addresses: {
            id: string;
            firstName: string;
            lastName: string;
            createdAt: Date;
            updatedAt: Date;
            customerId: string;
            phone: string | null;
            city: string;
            state: string | null;
            postalCode: string;
            country: string;
            company: string | null;
            addressLine1: string;
            addressLine2: string | null;
            isDefault: boolean;
            isDefaultBilling: boolean;
            label: string | null;
        }[];
        defaultShipping: {
            id: string;
            firstName: string;
            lastName: string;
            createdAt: Date;
            updatedAt: Date;
            customerId: string;
            phone: string | null;
            city: string;
            state: string | null;
            postalCode: string;
            country: string;
            company: string | null;
            addressLine1: string;
            addressLine2: string | null;
            isDefault: boolean;
            isDefaultBilling: boolean;
            label: string | null;
        } | null;
        defaultBilling: {
            id: string;
            firstName: string;
            lastName: string;
            createdAt: Date;
            updatedAt: Date;
            customerId: string;
            phone: string | null;
            city: string;
            state: string | null;
            postalCode: string;
            country: string;
            company: string | null;
            addressLine1: string;
            addressLine2: string | null;
            isDefault: boolean;
            isDefaultBilling: boolean;
            label: string | null;
        } | null;
    }>;
    /**
     * Get address by ID
     */
    getAddressById(customerId: string, addressId: string): Promise<{
        id: string;
        firstName: string;
        lastName: string;
        createdAt: Date;
        updatedAt: Date;
        customerId: string;
        phone: string | null;
        city: string;
        state: string | null;
        postalCode: string;
        country: string;
        company: string | null;
        addressLine1: string;
        addressLine2: string | null;
        isDefault: boolean;
        isDefaultBilling: boolean;
        label: string | null;
    }>;
    /**
     * Create a new address
     */
    createAddress(customerId: string, data: CreateAddressDto): Promise<{
        id: string;
        firstName: string;
        lastName: string;
        createdAt: Date;
        updatedAt: Date;
        customerId: string;
        phone: string | null;
        city: string;
        state: string | null;
        postalCode: string;
        country: string;
        company: string | null;
        addressLine1: string;
        addressLine2: string | null;
        isDefault: boolean;
        isDefaultBilling: boolean;
        label: string | null;
    }>;
    /**
     * Update an address
     */
    updateAddress(customerId: string, addressId: string, data: UpdateAddressDto): Promise<{
        id: string;
        firstName: string;
        lastName: string;
        createdAt: Date;
        updatedAt: Date;
        customerId: string;
        phone: string | null;
        city: string;
        state: string | null;
        postalCode: string;
        country: string;
        company: string | null;
        addressLine1: string;
        addressLine2: string | null;
        isDefault: boolean;
        isDefaultBilling: boolean;
        label: string | null;
    }>;
    /**
     * Delete an address
     */
    deleteAddress(customerId: string, addressId: string): Promise<void>;
    /**
     * Set an address as default (shipping or billing)
     */
    setDefaultAddress(customerId: string, addressId: string, type?: 'shipping' | 'billing'): Promise<void>;
}
export declare const customerAddressService: CustomerAddressService;
//# sourceMappingURL=customer-address.service.d.ts.map