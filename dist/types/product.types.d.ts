import { Section, ProductStatus, ProductAvailability } from '@prisma/client';
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
export interface CafeProductAttributes {
    name: string;
    description?: string;
    category: string;
    origin?: string;
    roastLevel?: string;
    caffeineContent?: string;
    size?: string;
    temperature?: string;
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
export interface FlowersProductAttributes {
    name: string;
    description?: string;
    arrangementType: string;
    occasion?: string;
    colors?: string[];
    flowerTypes?: string[];
    size?: string;
    seasonality?: string;
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
export interface BooksProductAttributes {
    title: string;
    description?: string;
    author: string;
    isbn?: string;
    publisher?: string;
    publishDate?: Date | string;
    language?: string;
    pageCount?: number;
    format: string;
    genre: string[];
    condition?: string;
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
export type CreateProductDto = CreateCafeProductDto | CreateFlowersProductDto | CreateBooksProductDto;
export type UpdateProductDto = UpdateCafeProductDto | UpdateFlowersProductDto | UpdateBooksProductDto;
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
    cafeCategory?: string;
    caffeineContent?: string;
    origin?: string;
    arrangementType?: string;
    occasion?: string;
    colors?: string;
    seasonality?: string;
    author?: string;
    genre?: string;
    format?: string;
    condition?: string;
    language?: string;
    mostDiscounted?: boolean;
}
export interface ProductListResult {
    products: Record<string, unknown>[];
    totalItems: number;
    page: number;
    limit: number;
}
//# sourceMappingURL=product.types.d.ts.map