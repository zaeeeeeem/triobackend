// =====================================================
// Customer Address Model Types
// =====================================================

export interface CustomerAddress {
  id: string;
  customerId: string;

  // Address Details
  firstName: string;
  lastName: string;
  company?: string | null;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state?: string | null; // State/Province
  postalCode: string;
  country: string; // ISO country code

  // Contact
  phone?: string | null;

  // Flags
  isDefault: boolean; // Default shipping address
  isDefaultBilling: boolean; // Default billing address

  // Metadata
  label?: string | null; // "Home", "Office", etc.
  createdAt: Date;
  updatedAt: Date;
}

// =====================================================
// DTOs (Data Transfer Objects)
// =====================================================

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
  type?: 'shipping' | 'billing'; // Default: 'shipping'
}

// =====================================================
// Response Types
// =====================================================

export interface AddressListResponse {
  addresses: CustomerAddress[];
  defaultShipping?: CustomerAddress | null;
  defaultBilling?: CustomerAddress | null;
}

export interface AddressResponse {
  address: CustomerAddress;
  message?: string;
}

// =====================================================
// Validation Types
// =====================================================

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

// Country-specific validation
export interface CountryAddressRules {
  country: string;
  postalCodePattern: RegExp;
  postalCodeFormat: string; // Description for users
  stateRequired: boolean;
  states?: string[]; // List of valid states/provinces
}

// =====================================================
// Utility Types
// =====================================================

export interface FormattedAddress {
  singleLine: string;
  multiLine: string[];
  fullName: string;
  googleMapsUrl?: string;
}
