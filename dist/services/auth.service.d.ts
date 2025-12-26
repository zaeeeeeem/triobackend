import { UserRole, Section } from '@prisma/client';
export declare class AuthService {
    register(data: {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        role?: UserRole;
        assignedSection?: Section;
    }): Promise<{
        email: string;
        role: import(".prisma/client").$Enums.UserRole;
        assignedSection: import(".prisma/client").$Enums.Section | null;
        id: string;
        firstName: string;
        lastName: string;
        isActive: boolean;
        createdAt: Date;
    }>;
    login(email: string, password: string): Promise<{
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            role: import(".prisma/client").$Enums.UserRole;
            assignedSection: import(".prisma/client").$Enums.Section | null;
        };
        accessToken: string;
        refreshToken: string;
    }>;
    refreshAccessToken(refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    logout(refreshToken: string): Promise<void>;
    logoutAll(userId: string): Promise<void>;
    getActiveSessions(userId: string): Promise<{
        id: string;
        createdAt: Date;
        expiresAt: Date;
    }[]>;
    changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void>;
    private generateAccessToken;
    private generateRefreshToken;
    private calculateTokenExpiration;
}
export declare const authService: AuthService;
//# sourceMappingURL=auth.service.d.ts.map