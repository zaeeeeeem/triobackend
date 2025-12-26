export interface CustomerAddress {
    id: string;
    customerId: string;
    firstName: string;
    lastName: string;
    company?: string | null;
    addressLine1: string;
    addressLine2?: string | null;
    city: string;
    state?: string | null;
    postalCode: string;
    country: string;
    phone?: string | null;
    isDefault: boolean;
    isDefaultBilling: boolean;
    label?: string | null;
    createdAt: Date;
    updatedAt: Date;
}
export interface CreateAddressDto {
    firstName: string;
    lastName: string;
    company?: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
    phone?: string;
    isDefault?: boolean;
    isDefaultBilling?: boolean;
    label?: string;
}
export interface UpdateAddressDto {
    firstName?: string;
    lastName?: string;
    company?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    phone?: string;
    isDefault?: boolean;
    isDefaultBilling?: boolean;
    label?: string;
}
export interface SetDefaultAddressDto {
    type?: 'shipping' | 'billing';
}
export interface AddressListResponse {
    addresses: CustomerAddress[];
    defaultShipping?: CustomerAddress | null;
    defaultBilling?: CustomerAddress | null;
}
export interface AddressResponse {
    address: CustomerAddress;
    message?: string;
}
export interface AddressValidationRules {
    firstNameMin: number;
    firstNameMax: number;
    lastNameMin: number;
    lastNameMax: number;
    addressLine1Max: number;
    addressLine2Max: number;
    cityMax: number;
    stateMax: number;
    postalCodePattern?: RegExp;
    countryCodePattern: RegExp;
}
export interface CountryAddressRules {
    country: string;
    postalCodePattern: RegExp;
    postalCodeFormat: string;
    stateRequired: boolean;
    states?: string[];
}
export interface FormattedAddress {
    singleLine: string;
    multiLine: string[];
    fullName: string;
    googleMapsUrl?: string;
}
//# sourceMappingURL=address.types.d.ts.map