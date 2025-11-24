import { env } from './env';

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

export const emailConfig: EmailConfig = {
  host: env.SMTP_HOST || 'smtp.gmail.com',
  port: env.SMTP_PORT || 587,
  secure: env.SMTP_SECURE || false,
  auth: {
    user: env.SMTP_USER || '',
    pass: env.SMTP_PASS || '',
  },
  from: {
    name: env.EMAIL_FROM_NAME || 'TRIO Shopify',
    address: env.EMAIL_FROM_ADDRESS || 'noreply@trio.com',
  },
};

export const emailTemplates = {
  verificationEmail: {
    subject: 'Verify Your Email - TRIO',
    getHtml: (name: string, verificationUrl: string) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .button { display: inline-block; padding: 12px 24px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to TRIO!</h1>
            </div>
            <div class="content">
              <h2>Hi ${name},</h2>
              <p>Thank you for registering with TRIO. Please verify your email address to complete your registration.</p>
              <p>Click the button below to verify your email:</p>
              <a href="${verificationUrl}" class="button">Verify Email</a>
              <p>Or copy and paste this link into your browser:</p>
              <p>${verificationUrl}</p>
              <p><strong>This link expires in 24 hours.</strong></p>
              <p>If you didn't create an account with TRIO, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} TRIO. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  },
  passwordResetEmail: {
    subject: 'Reset Your Password - TRIO',
    getHtml: (name: string, resetUrl: string) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #FF5722; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .button { display: inline-block; padding: 12px 24px; background-color: #FF5722; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <h2>Hi ${name},</h2>
              <p>We received a request to reset your password. Click the button below to create a new password:</p>
              <a href="${resetUrl}" class="button">Reset Password</a>
              <p>Or copy and paste this link into your browser:</p>
              <p>${resetUrl}</p>
              <p><strong>This link expires in 1 hour.</strong></p>
              <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} TRIO. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  },
  welcomeEmail: {
    subject: 'Welcome to TRIO!',
    getHtml: (name: string, guestOrdersLinked?: number) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #2196F3; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
            .highlight { background-color: #FFF9C4; padding: 10px; border-radius: 4px; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to TRIO!</h1>
            </div>
            <div class="content">
              <h2>Hi ${name},</h2>
              <p>Your account has been successfully created and verified!</p>
              ${guestOrdersLinked ? `
                <div class="highlight">
                  <p><strong>Great news!</strong> We found ${guestOrdersLinked} previous order${guestOrdersLinked > 1 ? 's' : ''} and linked ${guestOrdersLinked > 1 ? 'them' : 'it'} to your account. You can now view your complete order history!</p>
                </div>
              ` : ''}
              <p>You can now:</p>
              <ul>
                <li>Track your orders</li>
                <li>Save addresses for faster checkout</li>
                <li>View your order history</li>
                <li>Manage your profile and preferences</li>
              </ul>
              <p>Thank you for choosing TRIO!</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} TRIO. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  },
  passwordChangedEmail: {
    subject: 'Your Password Has Been Changed - TRIO',
    getHtml: (name: string) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #607D8B; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
            .warning { background-color: #FFEBEE; padding: 10px; border-left: 4px solid #F44336; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Changed</h1>
            </div>
            <div class="content">
              <h2>Hi ${name},</h2>
              <p>This is a confirmation that your password has been successfully changed.</p>
              <div class="warning">
                <p><strong>Security Notice:</strong> If you didn't make this change, please contact our support team immediately.</p>
              </div>
              <p>For your security, you have been logged out of all devices and will need to log in again with your new password.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} TRIO. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  },
};
