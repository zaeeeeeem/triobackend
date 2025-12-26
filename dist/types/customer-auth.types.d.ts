import { Customer } from './customer.types';
export interface RegisterCustomerDto {
    email: string;
    password: string;
    name: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    marketingConsent?: boolean;
    smsConsent?: boolean;
}
export interface LoginCustomerDto {
    email: string;
    password: string;
}
export interface RefreshTokenDto {
    refreshToken: string;
}
export interface ForgotPasswordDto {
    email: string;
}
export interface ResetPasswordDto {
    token: string;
    newPassword: string;
}
export interface VerifyEmailDto {
    token: string;
}
export interface ChangePasswordDto {
    currentPassword: string;
    newPassword: string;
}
export interface ChangeEmailDto {
    newEmail: string;
    password: string;
}
export interface GuestTokenDto {
    deviceId?: string;
}
export interface CustomerJwtPayload {
    sub: string;
    email: string;
    type: 'customer';
    name: string;
    status: string;
    emailVerified: boolean;
    iat?: number;
    exp?: number;
}
export interface GuestJwtPayload {
    sub: string;
    type: 'guest';
    deviceId?: string;
    iat?: number;
    exp?: number;
}
export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}
export interface CustomerAuthResponse {
    customer: Omit<Customer, 'passwordHash' | 'emailVerificationToken' | 'passwordResetToken'>;
    tokens: AuthTokens;
    guestOrdersLinked?: number;
}
export interface RegisterResponse extends CustomerAuthResponse {
    message?: string;
}
export interface LoginResponse extends CustomerAuthResponse {
    message?: string;
}
export interface RefreshTokenResponse {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}
export interface GuestTokenResponse {
    guestToken: string;
    expiresIn: number;
}
export interface PasswordRequirements {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumber: boolean;
    requireSpecialChar: boolean;
}
export interface EmailVerificationPayload {
    email: string;
    customerId: string;
    token: string;
    expiresAt: Date;
}
export interface PasswordResetPayload {
    email: string;
    customerId: string;
    token: string;
    expiresAt: Date;
}
export interface ActiveSession {
    id: string;
    createdAt: Date;
    expiresAt: Date;
    userAgent?: string;
    ipAddress?: string;
}
export interface ActiveSessionsResponse {
    sessions: ActiveSession[];
    currentSessionId?: string;
}
//# sourceMappingURL=customer-auth.types.d.ts.map