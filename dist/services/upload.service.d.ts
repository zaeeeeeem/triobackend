export interface ImageUploadResult {
    original: string;
    medium: string;
    thumbnail: string;
}
export declare class UploadService {
    private readonly allowedFormats;
    private readonly minDimension;
    private readonly bucket;
    private readonly basePrefix;
    uploadProductImages(productId: string, files: Express.Multer.File[]): Promise<unknown[]>;
    deleteProductImage(imageId: string): Promise<void>;
    reorderProductImages(productId: string, imageIds: string[]): Promise<void>;
    private validateFile;
    private processAndUploadImage;
    private uploadToS3;
    private deleteFromS3;
    private withSignedUrls;
    private reorderImages;
}
export declare const uploadService: UploadService;
//# sourceMappingURL=upload.service.d.ts.map