import nodemailer, { Transporter } from 'nodemailer';
import { emailConfig, emailTemplates } from '../config/email';
import { logger } from '../utils/logger';
import { env } from '../config/env';

export class EmailService {
  private transporter: Transporter | null = null;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter(): void {
    try {
      // Only initialize if SMTP credentials are provided
      if (!emailConfig.auth.user || !emailConfig.auth.pass) {
        logger.warn('Email service not configured - SMTP credentials missing');
        return;
      }

      this.transporter = nodemailer.createTransport({
        host: emailConfig.host,
        port: emailConfig.port,
        secure: emailConfig.secure,
        auth: {
          user: emailConfig.auth.user,
          pass: emailConfig.auth.pass,
        },
      });

      // Verify connection
      this.transporter.verify((error) => {
        if (error) {
          logger.error('Email service initialization failed:', error);
        } else {
          logger.info('Email service initialized successfully');
        }
      });
    } catch (error) {
      logger.error('Failed to initialize email transporter:', error);
    }
  }

  private async sendEmail(to: string, subject: string, html: string): Promise<void> {
    if (!this.transporter) {
      logger.warn(`Email not sent to ${to} - Email service not configured`);
      return;
    }

    try {
      await this.transporter.sendMail({
        from: `"${emailConfig.from.name}" <${emailConfig.from.address}>`,
        to,
        subject,
        html,
      });

      logger.info(`Email sent successfully to ${to}: ${subject}`);
    } catch (error) {
      logger.error(`Failed to send email to ${to}:`, error);
      throw error;
    }
  }

  async sendVerificationEmail(email: string, name: string, token: string): Promise<void> {
    const verificationUrl = `${env.FRONTEND_URL}/verify-email?token=${token}`;
    const html = emailTemplates.verificationEmail.getHtml(name, verificationUrl);

    await this.sendEmail(email, emailTemplates.verificationEmail.subject, html);
  }

  async sendPasswordResetEmail(email: string, name: string, token: string): Promise<void> {
    const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${token}`;
    const html = emailTemplates.passwordResetEmail.getHtml(name, resetUrl);

    await this.sendEmail(email, emailTemplates.passwordResetEmail.subject, html);
  }

  async sendWelcomeEmail(email: string, name: string, guestOrdersLinked?: number): Promise<void> {
    const html = emailTemplates.welcomeEmail.getHtml(name, guestOrdersLinked);

    await this.sendEmail(email, emailTemplates.welcomeEmail.subject, html);
  }

  async sendPasswordChangedEmail(email: string, name: string): Promise<void> {
    const html = emailTemplates.passwordChangedEmail.getHtml(name);

    await this.sendEmail(email, emailTemplates.passwordChangedEmail.subject, html);
  }

  // Generic method for custom emails
  async sendCustomEmail(to: string, subject: string, html: string): Promise<void> {
    await this.sendEmail(to, subject, html);
  }
}

export const emailService = new EmailService();
