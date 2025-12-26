export interface EmailConfig {
    host: string;
    port: number;
    secure: boolean;
    auth: {
        user: string;
        pass: string;
    };
    from: {
        name: string;
        address: string;
    };
}
export declare const emailConfig: EmailConfig;
export declare const emailTemplates: {
    verificationEmail: {
        subject: string;
        getHtml: (name: string, verificationUrl: string) => string;
    };
    passwordResetEmail: {
        subject: string;
        getHtml: (name: string, resetUrl: string) => string;
    };
    welcomeEmail: {
        subject: string;
        getHtml: (name: string, guestOrdersLinked?: number) => string;
    };
    passwordChangedEmail: {
        subject: string;
        getHtml: (name: string) => string;
    };
};
//# sourceMappingURL=email.d.ts.map