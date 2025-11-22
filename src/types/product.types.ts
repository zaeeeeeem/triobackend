import { Section, ProductStatus, ProductAvailability } from '@prisma/client';

// =====================================================
// Base Product DTOs
// =====================================================

export interface BaseProductDto {
  sku: string;
  section: Section;
  price: number;
  compareAtPrice?: number;
  costPrice?: number;
  stockQuantity: number;
  trackQuantity?: boolean;
  continueSellingOutOfStock?: boolean;
  status?: ProductStatus;
  tags?: string[];
  collections?: string[];
}

// =====================================================
// Cafe Product Types
// =====================================================

export interface CafeProductAttributes {
  name: string;
  description?: string;
  category: string; // Coffee, Tea, Pastries, etc.
  origin?: string;
  roastLevel?: string; // Light, Medium, Dark
  caffeineContent?: string; // High, Medium, Low, None
  size?: string; // Small, Medium, Large
  temperature?: string; // Hot, Iced, Cold Brew
  allergens?: string[];
  calories?: number;
}

export interface CreateCafeProductDto extends BaseProductDto {
  section: 'CAFE';
  cafeAttributes: CafeProductAttributes;
}

export interface UpdateCafeProductDto extends Partial<Omit<BaseProductDto, 'section'>> {
  cafeAttributes?: Partial<CafeProductAttributes>;
}

// =====================================================
// Flowers Product Types
// =====================================================

export interface FlowersProductAttributes {
  name: string;
  description?: string;
  arrangementType: string; // Bouquet, Vase, Basket, etc.
  occasion?: string; // Wedding, Birthday, Sympathy, etc.
  colors?: string[];
  flowerTypes?: string[];
  size?: string; // Small, Medium, Large, Premium
  seasonality?: string; // Year-round, Spring, Summer, etc.
  careInstructions?: string;
  vaseIncluded?: boolean;
}

export interface CreateFlowersProductDto extends BaseProductDto {
  section: 'FLOWERS';
  flowersAttributes: FlowersProductAttributes;
}

export interface UpdateFlowersProductDto extends Partial<Omit<BaseProductDto, 'section'>> {
  flowersAttributes?: Partial<FlowersProductAttributes>;
}

// =====================================================
// Books Product Types
// =====================================================

export interface BooksProductAttributes {
  title: string;
  description?: string;
  author: string;
  isbn?: string;
  publisher?: string;
  publishDate?: Date | string;
  language?: string;
  pageCount?: number;
  format: string; // Hardcover, Paperback, eBook
  genre: string; // Fiction, Non-Fiction, Biography, etc.
  condition?: string; // New, Like New, Good, Fair
  edition?: string;
  dimensions?: string;
  weight?: number;
}

export interface CreateBooksProductDto extends BaseProductDto {
  section: 'BOOKS';
  booksAttributes: BooksProductAttributes;
}

export interface UpdateBooksProductDto extends Partial<Omit<BaseProductDto, 'section'>> {
  booksAttributes?: Partial<BooksProductAttributes>;
}

// =====================================================
// Union Types
// =====================================================

export type CreateProductDto =
  | CreateCafeProductDto
  | CreateFlowersProductDto
  | CreateBooksProductDto;

export type UpdateProductDto =
  | UpdateCafeProductDto
  | UpdateFlowersProductDto
  | UpdateBooksProductDto;

// =====================================================
// Query Parameters
// =====================================================

export interface ProductQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  section?: Section;
  status?: ProductStatus;
  availability?: ProductAvailability;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  minPrice?: number;
  maxPrice?: number;
  minStock?: number;
  maxStock?: number;
  tags?: string;
  collections?: string;

  // Cafe-specific filters
  cafeCategory?: string;
  caffeineContent?: string;
  origin?: string;

  // Flowers-specific filters
  arrangementType?: string;
  occasion?: string;
  colors?: string;

  // Books-specific filters
  author?: string;
  genre?: string;
  format?: string;
  condition?: string;
  language?: string;
}

// =====================================================
// Response Types
// =====================================================

export interface ProductListResult {
  products: Record<string, unknown>[];
  totalItems: number;
  page: number;
  limit: number;
}
