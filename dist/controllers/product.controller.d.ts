import { Request, Response, NextFunction } from 'express';
export declare const productValidation: {
    create: import("express-validator").ValidationChain[];
    update: import("express-validator").ValidationChain[];
    getById: import("express-validator").ValidationChain[];
    delete: import("express-validator").ValidationChain[];
    list: import("express-validator").ValidationChain[];
};
export declare class ProductController {
    createProduct(req: Request, res: Response, next: NextFunction): Promise<void>;
    getProduct(req: Request, res: Response, next: NextFunction): Promise<void>;
    listProducts(req: Request, res: Response, next: NextFunction): Promise<void>;
    updateProduct(req: Request, res: Response, next: NextFunction): Promise<void>;
    deleteProduct(req: Request, res: Response, next: NextFunction): Promise<void>;
    uploadImages(req: Request, res: Response, next: NextFunction): Promise<void>;
    deleteImage(req: Request, res: Response, next: NextFunction): Promise<void>;
    reorderImages(req: Request, res: Response, next: NextFunction): Promise<void>;
    bulkUpdate(req: Request, res: Response, next: NextFunction): Promise<void>;
    bulkDelete(req: Request, res: Response, next: NextFunction): Promise<void>;
}
export declare const productController: ProductController;
//# sourceMappingURL=product.controller.d.ts.map