# Email Verification Setup Guide

This guide explains how to set up email verification for user registration.

## Overview

The email verification system allows new users to verify their email addresses before they can fully use their accounts. When a user registers, they receive a verification email with a link to confirm their email address.

## Database Setup

1. Run the migration script to create the `email_verification_tokens` table:

```sql
-- Run this in your Supabase SQL Editor
-- File: database-migrations/create-email-verification-table.sql
```

This creates a table to store verification tokens with expiration times.

## Email Service Configuration

The system uses **Nodemailer** to send verification emails. You need to configure SMTP settings in your environment variables.

### Environment Variables

Add these to your `.env.local` file:

```bash
# SMTP Configuration (for sending emails)
SMTP_HOST=smtp.gmail.com          # Your SMTP server host
SMTP_PORT=587                     # SMTP port (587 for TLS, 465 for SSL)
SMTP_SECURE=false                 # true for SSL (port 465), false for TLS (port 587)
SMTP_USER=your-email@gmail.com    # Your email address
SMTP_PASS=your-app-password       # Your email password or app-specific password

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://yourdomain.com  # Your site URL (for verification links)
NEXT_PUBLIC_SITE_NAME=Julie Crafts            # Your site name (appears in emails)
```

### Gmail Setup Example

If using Gmail:

1. Enable 2-Factor Authentication on your Google account
2. Generate an App Password:
   - Go to Google Account → Security → 2-Step Verification → App passwords
   - Generate a password for "Mail"
   - Use this password as `SMTP_PASS`

3. Configure `.env.local`:
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
```

### Other Email Providers

#### SendGrid
```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

#### Mailgun
```bash
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-mailgun-username
SMTP_PASS=your-mailgun-password
```

#### Outlook/Office 365
```bash
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
```

## How It Works

1. **User Registration**: When a user registers, an account is created but the email is not confirmed.

2. **Verification Token**: A unique token is generated and stored in the `email_verification_tokens` table with a 24-hour expiration.

3. **Email Sent**: A beautifully formatted HTML email is sent to the user with a verification link.

4. **Email Verification**: When the user clicks the link:
   - The token is validated
   - The user's email is confirmed in Supabase Auth
   - The profile is marked as verified
   - The token is marked as used

5. **Account Activation**: After verification, the user can sign in normally.

## Verification Email Template

The verification email includes:
- Branded header with your site name
- Clear call-to-action button
- Fallback text link
- Expiration notice (24 hours)
- Professional styling

## Testing

### Test Email Configuration

You can test your email setup by checking the server logs when a user registers. If email sending fails, you'll see a warning but registration will still succeed (user can request a resend).

### Manual Testing

1. Register a new account
2. Check your email inbox (and spam folder)
3. Click the verification link
4. You should be redirected to the verification success page
5. Try signing in with the new account

## Troubleshooting

### Emails Not Sending

1. **Check SMTP credentials**: Verify all environment variables are set correctly
2. **Check server logs**: Look for email service errors in the console
3. **Test SMTP connection**: The system will log warnings if SMTP is not configured
4. **Check spam folder**: Verification emails might be filtered

### Token Expired

- Tokens expire after 24 hours
- Users need to request a new verification email (resend functionality can be added)

### Verification Link Not Working

- Ensure `NEXT_PUBLIC_SITE_URL` is set correctly
- Check that the verification endpoint is accessible
- Verify the token hasn't been used already

## Security Considerations

- Tokens are cryptographically secure (32-byte random hex)
- Tokens expire after 24 hours
- Tokens are single-use (marked as used after verification)
- Expired tokens are automatically cleaned up
- Email addresses are normalized (lowercase) before storage

## Future Enhancements

- Resend verification email functionality
- Email verification reminder after X days
- Custom email templates per site
- Multiple email provider support
- Email delivery tracking

