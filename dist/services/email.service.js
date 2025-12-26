"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailService = exports.EmailService = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const email_1 = require("../config/email");
const logger_1 = require("../utils/logger");
const env_1 = require("../config/env");
class EmailService {
    transporter = null;
    constructor() {
        this.initializeTransporter();
    }
    initializeTransporter() {
        try {
            // Only initialize if SMTP credentials are provided
            if (!email_1.emailConfig.auth.user || !email_1.emailConfig.auth.pass) {
                logger_1.logger.warn('Email service not configured - SMTP credentials missing');
                return;
            }
            this.transporter = nodemailer_1.default.createTransport({
                host: email_1.emailConfig.host,
                port: email_1.emailConfig.port,
                secure: email_1.emailConfig.secure,
                auth: {
                    user: email_1.emailConfig.auth.user,
                    pass: email_1.emailConfig.auth.pass,
                },
            });
            // Verify connection
            this.transporter.verify((error) => {
                if (error) {
                    logger_1.logger.error('Email service initialization failed:', error);
                }
                else {
                    logger_1.logger.info('Email service initialized successfully');
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to initialize email transporter:', error);
        }
    }
    async sendEmail(to, subject, html) {
        if (!this.transporter) {
            logger_1.logger.warn(`Email not sent to ${to} - Email service not configured`);
            return;
        }
        try {
            await this.transporter.sendMail({
                from: `"${email_1.emailConfig.from.name}" <${email_1.emailConfig.from.address}>`,
                to,
                subject,
                html,
            });
            logger_1.logger.info(`Email sent successfully to ${to}: ${subject}`);
        }
        catch (error) {
            logger_1.logger.error(`Failed to send email to ${to}:`, error);
            throw error;
        }
    }
    async sendVerificationEmail(email, name, token) {
        const verificationUrl = `${env_1.env.FRONTEND_URL}/verify-email?token=${token}`;
        const html = email_1.emailTemplates.verificationEmail.getHtml(name, verificationUrl);
        await this.sendEmail(email, email_1.emailTemplates.verificationEmail.subject, html);
    }
    async sendPasswordResetEmail(email, name, token) {
        const resetUrl = `${env_1.env.FRONTEND_URL}/reset-password?token=${token}`;
        const html = email_1.emailTemplates.passwordResetEmail.getHtml(name, resetUrl);
        await this.sendEmail(email, email_1.emailTemplates.passwordResetEmail.subject, html);
    }
    async sendWelcomeEmail(email, name, guestOrdersLinked) {
        const html = email_1.emailTemplates.welcomeEmail.getHtml(name, guestOrdersLinked);
        await this.sendEmail(email, email_1.emailTemplates.welcomeEmail.subject, html);
    }
    async sendPasswordChangedEmail(email, name) {
        const html = email_1.emailTemplates.passwordChangedEmail.getHtml(name);
        await this.sendEmail(email, email_1.emailTemplates.passwordChangedEmail.subject, html);
    }
    // Generic method for custom emails
    async sendCustomEmail(to, subject, html) {
        await this.sendEmail(to, subject, html);
    }
}
exports.EmailService = EmailService;
exports.emailService = new EmailService();
//# sourceMappingURL=email.service.js.map