import { S3Client } from '@aws-sdk/client-s3';
export declare const s3Client: S3Client;
export declare const getPublicUrl: (key: string) => string;
export declare const getSignedUrlForKey: (key: string, expiresIn?: number) => Promise<string>;
export default s3Client;
//# sourceMappingURL=s3.d.ts.map