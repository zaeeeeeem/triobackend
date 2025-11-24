# Email Service Setup Guide

This guide provides comprehensive instructions for setting up email functionality in the TRIO Shopify Server application.

## Table of Contents

1. [Overview](#overview)
2. [Email Features](#email-features)
3. [Environment Variables](#environment-variables)
4. [Setup Options](#setup-options)
   - [Option 1: Gmail SMTP](#option-1-gmail-smtp-recommended-for-development)
   - [Option 2: Custom SMTP Server](#option-2-custom-smtp-server)
   - [Option 3: SendGrid](#option-3-sendgrid-recommended-for-production)
   - [Option 4: AWS SES](#option-4-aws-ses)
5. [Testing Email Functionality](#testing-email-functionality)
6. [Troubleshooting](#troubleshooting)
7. [Email Templates](#email-templates)
8. [Production Best Practices](#production-best-practices)

---

## Overview

The TRIO application uses **Nodemailer** for email delivery. The email service handles:

- Email verification for new customer accounts
- Password reset emails
- Welcome emails after verification
- Password change notifications
- Order confirmations (future feature)

All email functionality is centralized in:
- **Configuration**: `src/config/email.ts`
- **Service**: `src/services/email.service.ts`

---

## Email Features

The following emails are automatically sent by the system:

### 1. Email Verification
- **Trigger**: Customer registers a new account
- **Purpose**: Verify email ownership
- **Expiry**: 24 hours
- **Template**: Includes verification link to frontend

### 2. Password Reset
- **Trigger**: Customer requests password reset
- **Purpose**: Allow secure password recovery
- **Expiry**: 1 hour
- **Template**: Includes reset link to frontend

### 3. Welcome Email
- **Trigger**: Customer verifies their email
- **Purpose**: Welcome message with account benefits
- **Special**: Includes count of linked guest orders if applicable

### 4. Password Changed
- **Trigger**: Customer changes password
- **Purpose**: Security notification
- **Note**: Sent even if customer doesn't request it (for security)

---

## Environment Variables

Add these variables to your `.env` file:

```env
# Email Service Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Email Sender Info
EMAIL_FROM_NAME=TRIO Shopify
EMAIL_FROM_ADDRESS=noreply@trio.com

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:3000

# Optional: Customer JWT Secret (if different from admin)
CUSTOMER_JWT_SECRET=your-customer-jwt-secret
```

### Variable Descriptions

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `SMTP_HOST` | Yes | SMTP server hostname | `smtp.gmail.com` |
| `SMTP_PORT` | Yes | SMTP server port | `587` |
| `SMTP_SECURE` | No | Use TLS/SSL | `false` |
| `SMTP_USER` | Yes | SMTP authentication username | - |
| `SMTP_PASS` | Yes | SMTP authentication password | - |
| `EMAIL_FROM_NAME` | No | Sender name displayed in emails | `TRIO Shopify` |
| `EMAIL_FROM_ADDRESS` | No | Sender email address | `noreply@trio.com` |
| `FRONTEND_URL` | Yes | Your frontend application URL | `http://localhost:3000` |

---

## Setup Options

### Option 1: Gmail SMTP (Recommended for Development)

**Best for**: Development, testing, small-scale production

#### Step-by-Step Setup

1. **Enable 2-Factor Authentication on your Gmail account**
   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Enable 2-Step Verification

2. **Generate an App Password**
   - Visit [App Passwords](https://myaccount.google.com/apppasswords)
   - Select "Mail" and "Other (Custom name)"
   - Name it "TRIO Shopify Server"
   - Click "Generate"
   - **Copy the 16-character password** (you won't see it again!)

3. **Update your `.env` file**

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx  # The 16-character app password (with or without spaces)

EMAIL_FROM_NAME=TRIO Shopify
EMAIL_FROM_ADDRESS=your-email@gmail.com

FRONTEND_URL=http://localhost:3000
```

4. **Restart your server**

```bash
npm run dev
```

#### Gmail Limitations

- **Daily sending limit**: 500 emails/day (2000/day for Google Workspace)
- **Rate limit**: ~100 emails/hour
- **Best for**: Development and small-scale production

⚠️ **Important**: Never commit your app password to version control!

---

### Option 2: Custom SMTP Server

**Best for**: Organizations with their own mail server

#### Configuration

```env
SMTP_HOST=mail.yourcompany.com
SMTP_PORT=587                    # or 465 for SSL
SMTP_SECURE=false                # true if using port 465
SMTP_USER=noreply@yourcompany.com
SMTP_PASS=your-smtp-password

EMAIL_FROM_NAME=TRIO Shopify
EMAIL_FROM_ADDRESS=noreply@yourcompany.com

FRONTEND_URL=https://yourfrontend.com
```

#### Common SMTP Ports

- **587**: STARTTLS (recommended, set `SMTP_SECURE=false`)
- **465**: SSL/TLS (set `SMTP_SECURE=true`)
- **25**: Unencrypted (not recommended for production)

#### Testing SMTP Connection

```bash
# Install telnet (if not installed)
telnet mail.yourcompany.com 587

# If connection succeeds, you'll see:
# Connected to mail.yourcompany.com
```

---

### Option 3: SendGrid (Recommended for Production)

**Best for**: Production environments, high email volume

#### Why SendGrid?

✅ **99%+ delivery rate**
✅ **100 emails/day on free tier**
✅ **Detailed analytics and tracking**
✅ **Dedicated IP options**
✅ **Excellent reputation management**

#### Step-by-Step Setup

1. **Create a SendGrid Account**
   - Go to [SendGrid](https://sendgrid.com/)
   - Sign up for a free account
   - Verify your email address

2. **Create an API Key**
   - Navigate to **Settings** → **API Keys**
   - Click "Create API Key"
   - Name: `TRIO Production`
   - Permissions: Select "Full Access" (or "Mail Send" only)
   - Click "Create & View"
   - **Copy the API key** (shown only once!)

3. **Domain Authentication (Highly Recommended)**
   - Navigate to **Settings** → **Sender Authentication**
   - Click "Authenticate Your Domain"
   - Follow the DNS setup instructions
   - Add the provided DNS records to your domain

4. **Update your `.env` file**

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey                # Literally the word "apikey"
SMTP_PASS=SG.xxxxxxxxxxxx      # Your SendGrid API key

EMAIL_FROM_NAME=TRIO Shopify
EMAIL_FROM_ADDRESS=noreply@yourdomain.com  # Must match authenticated domain

FRONTEND_URL=https://yourfrontend.com
```

5. **Test the Configuration**

```bash
npm run dev
```

#### SendGrid Best Practices

- ✅ Always authenticate your domain for better deliverability
- ✅ Use a dedicated sending domain (e.g., `mail.yourdomain.com`)
- ✅ Monitor your sender reputation in the SendGrid dashboard
- ✅ Set up click/open tracking (optional)
- ❌ Never send marketing emails without opt-in consent

---

### Option 4: AWS SES

**Best for**: AWS-hosted applications, cost-effective at scale

#### Why AWS SES?

✅ **$0.10 per 1,000 emails** (very cost-effective)
✅ **High deliverability**
✅ **Seamless AWS integration**
✅ **62,000 free emails/month** (if hosted on EC2)

#### Step-by-Step Setup

1. **Create AWS Account** (if you don't have one)
   - Go to [AWS Console](https://console.aws.amazon.com/)

2. **Verify Your Domain or Email**
   - Navigate to **SES** → **Verified Identities**
   - Click "Create Identity"
   - Choose "Domain" (recommended) or "Email address"
   - Follow the verification steps

3. **Request Production Access**
   - By default, SES is in "Sandbox Mode" (can only send to verified emails)
   - Navigate to **SES** → **Account Dashboard**
   - Click "Request production access"
   - Fill out the form with your use case

4. **Create SMTP Credentials**
   - Navigate to **SES** → **SMTP Settings**
   - Click "Create SMTP Credentials"
   - Follow the wizard to generate credentials
   - **Download and save the credentials**

5. **Update your `.env` file**

```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com  # Change region as needed
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=AKIAIOSFODNN7EXAMPLE    # Your SMTP username
SMTP_PASS=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY  # Your SMTP password

EMAIL_FROM_NAME=TRIO Shopify
EMAIL_FROM_ADDRESS=noreply@yourdomain.com  # Must be verified

FRONTEND_URL=https://yourfrontend.com
```

#### AWS SES Best Practices

- ✅ Use the SES region closest to your server
- ✅ Set up SNS for bounce/complaint notifications
- ✅ Monitor your sending statistics in the SES dashboard
- ✅ Implement a bounce handling strategy
- ❌ Don't exceed your sending rate limits

#### Available AWS SES Regions

| Region | SMTP Endpoint |
|--------|---------------|
| US East (N. Virginia) | `email-smtp.us-east-1.amazonaws.com` |
| US West (Oregon) | `email-smtp.us-west-2.amazonaws.com` |
| EU (Ireland) | `email-smtp.eu-west-1.amazonaws.com` |
| Asia Pacific (Mumbai) | `email-smtp.ap-south-1.amazonaws.com` |
| Asia Pacific (Sydney) | `email-smtp.ap-southeast-2.amazonaws.com` |

---

## Testing Email Functionality

### 1. Test Email Service Initialization

The email service initializes automatically when the server starts. Check logs:

```bash
npm run dev

# Look for:
# [INFO] Email service initialized successfully
```

### 2. Test Customer Registration

Use curl or Postman to register a new customer:

```bash
curl -X POST http://localhost:5000/api/v1/customer-auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@1234",
    "name": "Test User"
  }'
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Registration successful. Please check your email to verify your account.",
  "data": {
    "customer": { ... },
    "tokens": { ... }
  }
}
```

**Check your email inbox** for the verification email.

### 3. Test Password Reset

```bash
curl -X POST http://localhost:5000/api/v1/customer-auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
  }'
```

### 4. Test Email Verification

Click the link in the verification email or test with curl:

```bash
curl -X GET "http://localhost:5000/api/v1/customer-auth/verify-email?token=YOUR_TOKEN"
```

---

## Troubleshooting

### Issue 1: "Invalid login" error with Gmail

**Cause**: App password not generated or 2FA not enabled

**Solution**:
1. Enable 2-Factor Authentication on your Gmail account
2. Generate a new App Password
3. Use the 16-character app password (not your regular password)

---

### Issue 2: Emails not being sent (no errors)

**Cause**: Email service not initialized or SMTP credentials invalid

**Solution**:
1. Check server logs for initialization errors
2. Verify all SMTP environment variables are set
3. Test SMTP connection manually:

```bash
# Install telnet
telnet smtp.gmail.com 587

# Should connect successfully
```

---

### Issue 3: Emails going to spam

**Cause**: Poor sender reputation or missing authentication

**Solution**:
1. **Domain Authentication**: Set up SPF, DKIM, and DMARC records
2. **Use a custom domain**: Don't send from Gmail in production
3. **Warm up your sending domain**: Start with low volume
4. **Monitor bounce rates**: Keep under 5%
5. **Use SendGrid or AWS SES**: They manage reputation for you

**Example SPF Record:**

```
v=spf1 include:sendgrid.net ~all
```

**Example DMARC Record:**

```
v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com
```

---

### Issue 4: "Connection timeout" error

**Cause**: Firewall blocking SMTP ports or wrong SMTP host

**Solution**:
1. Check if port 587 is open:
   ```bash
   nc -zv smtp.gmail.com 587
   ```
2. Try alternative port (465 with `SMTP_SECURE=true`)
3. Check firewall settings
4. If on AWS EC2, ensure security group allows outbound on port 587

---

### Issue 5: "EAUTH" authentication error

**Cause**: Invalid credentials

**Solution**:
1. Verify `SMTP_USER` and `SMTP_PASS` are correct
2. For Gmail, ensure you're using an App Password, not your regular password
3. For SendGrid, ensure `SMTP_USER=apikey` (literally the word "apikey")
4. Check for extra spaces in `.env` file

---

### Issue 6: Email links not working

**Cause**: `FRONTEND_URL` misconfigured

**Solution**:
1. Verify `FRONTEND_URL` in `.env` matches your frontend URL
2. For development: `http://localhost:3000`
3. For production: `https://yourfrontend.com`
4. Ensure no trailing slash

---

## Email Templates

All email templates are defined in `src/config/email.ts`. They include:

### Template Structure

```typescript
{
  subject: string,
  getHtml: (name: string, url: string) => string,
}
```

### Customizing Templates

To customize email templates:

1. Open `src/config/email.ts`
2. Locate the template you want to edit (e.g., `verificationEmail`)
3. Modify the HTML or subject
4. Restart the server

**Example: Changing the verification email subject**

```typescript
verificationEmail: {
  subject: 'Welcome to TRIO! Verify Your Email', // Changed from default
  getHtml: (name: string, verificationUrl: string) => `...`,
}
```

### Email Template Best Practices

✅ **Use inline CSS** (email clients don't support external stylesheets)
✅ **Test on multiple email clients** (Gmail, Outlook, Apple Mail)
✅ **Keep it simple** (complex layouts break in some clients)
✅ **Include plain text version** (better deliverability)
✅ **Make CTAs prominent** (large buttons, contrasting colors)
✅ **Include unsubscribe link** (for marketing emails)

---

## Production Best Practices

### 1. Use a Dedicated Email Service

❌ **Don't use Gmail in production**
✅ **Use SendGrid, AWS SES, or similar services**

**Reasons:**
- Better deliverability
- Higher sending limits
- Professional sender reputation
- Detailed analytics

---

### 2. Implement Email Queuing

For high-volume applications, use a queue (e.g., Bull, BullMQ) to handle email sending asynchronously.

**Benefits:**
- Non-blocking API responses
- Retry failed sends
- Rate limit management
- Better error handling

**Example with Bull:**

```typescript
import Queue from 'bull';

const emailQueue = new Queue('emails', process.env.REDIS_URL);

emailQueue.process(async (job) => {
  const { to, subject, html } = job.data;
  await emailService.sendEmail(to, subject, html);
});

// In your service
await emailQueue.add({ to, subject, html });
```

---

### 3. Monitor Email Deliverability

Track these metrics:

- **Bounce rate**: Should be < 5%
- **Complaint rate**: Should be < 0.1%
- **Open rate**: Varies by industry (20-30% typical)
- **Click-through rate**: Varies by email type

**Tools:**
- SendGrid Dashboard
- AWS SES Dashboard
- Google Postmaster Tools
- Mail-Tester (test spam score)

---

### 4. Implement Email Preferences

Allow customers to control which emails they receive:

```typescript
// Already implemented in the API
PATCH /api/v1/customers/preferences
{
  "emailPreferences": {
    "newsletter": false,
    "orderUpdates": true,
    "promotions": false
  }
}
```

---

### 5. Set Up Bounce/Complaint Handling

Configure webhooks to handle:

- **Hard bounces**: Remove invalid email addresses
- **Soft bounces**: Retry after delay
- **Complaints**: Unsubscribe immediately

**SendGrid Webhook Example:**

```typescript
router.post('/webhooks/sendgrid', async (req, res) => {
  const events = req.body;

  for (const event of events) {
    if (event.event === 'bounce') {
      // Mark email as invalid
      await prisma.customer.update({
        where: { email: event.email },
        data: { emailInvalid: true },
      });
    }
  }

  res.status(200).send('OK');
});
```

---

### 6. Use Environment-Specific Configuration

```typescript
// src/config/email.ts
export const getEmailConfig = (): EmailConfig => {
  if (env.NODE_ENV === 'production') {
    return {
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    };
  } else {
    // Use Ethereal for testing (https://ethereal.email/)
    return {
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: 'test@ethereal.email',
        pass: 'test-password',
      },
    };
  }
};
```

---

### 7. Implement Rate Limiting

Prevent abuse by rate limiting email requests:

```typescript
import rateLimit from 'express-rate-limit';

const emailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many email requests, please try again later',
});

router.post('/forgot-password', emailLimiter, ...);
router.post('/resend-verification', emailLimiter, ...);
```

---

### 8. Log All Email Activity

```typescript
await prisma.emailLog.create({
  data: {
    to: email,
    subject: subject,
    template: 'verification',
    status: 'sent',
    sentAt: new Date(),
  },
});
```

---

## Security Considerations

### 1. Never Expose SMTP Credentials

❌ **Don't commit `.env` to version control**
❌ **Don't log SMTP passwords**
❌ **Don't include credentials in error messages**

### 2. Validate Email Addresses

The API already validates email format, but also:

- Check for disposable email domains
- Verify MX records exist
- Use email verification services (e.g., ZeroBounce)

### 3. Implement Token Expiry

✅ **Email verification tokens**: 24 hours
✅ **Password reset tokens**: 1 hour

Already implemented in `src/services/customer-auth.service.ts`.

### 4. Use HTTPS for All Email Links

Ensure `FRONTEND_URL` uses HTTPS in production:

```env
FRONTEND_URL=https://yourfrontend.com
```

---

## Conclusion

Your email service is now fully configured! 🎉

### Quick Start Checklist

- [ ] Add SMTP configuration to `.env`
- [ ] Choose email provider (Gmail, SendGrid, AWS SES, etc.)
- [ ] Test customer registration
- [ ] Verify email delivery
- [ ] Test password reset flow
- [ ] Configure domain authentication (production)
- [ ] Set up bounce/complaint handling (production)
- [ ] Monitor email deliverability

### Need Help?

- **Nodemailer Documentation**: https://nodemailer.com/
- **SendGrid Documentation**: https://docs.sendgrid.com/
- **AWS SES Documentation**: https://docs.aws.amazon.com/ses/

---

**Last Updated**: November 2024
**Version**: 1.0.0
