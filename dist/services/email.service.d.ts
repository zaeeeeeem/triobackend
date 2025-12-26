export declare class EmailService {
    private transporter;
    constructor();
    private initializeTransporter;
    private sendEmail;
    sendVerificationEmail(email: string, name: string, token: string): Promise<void>;
    sendPasswordResetEmail(email: string, name: string, token: string): Promise<void>;
    sendWelcomeEmail(email: string, name: string, guestOrdersLinked?: number): Promise<void>;
    sendPasswordChangedEmail(email: string, name: string): Promise<void>;
    sendCustomEmail(to: string, subject: string, html: string): Promise<void>;
}
export declare const emailService: EmailService;
//# sourceMappingURL=email.service.d.ts.map