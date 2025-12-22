import { Request, Response, NextFunction } from 'express';
import { UserRole, Section } from '@prisma/client';
export interface AuthPayload {
    sub: string;
    email: string;
    role: UserRole;
    assignedSection?: Section;
    iat: number;
    exp: number;
}
declare global {
    namespace Express {
        interface Request {
            user?: AuthPayload;
        }
    }
}
export declare const authenticate: (req: Request, _res: Response, next: NextFunction) => void;
export declare const authorize: (...roles: UserRole[]) => (req: Request, _res: Response, next: NextFunction) => void;
export declare const checkSectionAccess: (section: Section) => (req: Request, _res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.d.ts.map