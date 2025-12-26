import { Request, Response, NextFunction } from 'express';
export declare const authValidation: {
    register: import("express-validator").ValidationChain[];
    login: import("express-validator").ValidationChain[];
    refresh: import("express-validator").ValidationChain[];
    changePassword: import("express-validator").ValidationChain[];
};
export declare class AuthController {
    register(req: Request, res: Response, next: NextFunction): Promise<void>;
    login(req: Request, res: Response, next: NextFunction): Promise<void>;
    refresh(req: Request, res: Response, next: NextFunction): Promise<void>;
    logout(req: Request, res: Response, next: NextFunction): Promise<void>;
    logoutAll(req: Request, res: Response, next: NextFunction): Promise<void>;
    getActiveSessions(req: Request, res: Response, next: NextFunction): Promise<void>;
    changePassword(req: Request, res: Response, next: NextFunction): Promise<void>;
}
export declare const authController: AuthController;
//# sourceMappingURL=auth.controller.d.ts.map