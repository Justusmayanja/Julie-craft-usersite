import nodemailer from 'nodemailer'

// Email configuration from environment variables
const emailConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
}

// Create reusable transporter
const createTransporter = () => {
  // If SMTP credentials are not provided, return null (emails won't be sent)
  if (!emailConfig.auth.user || !emailConfig.auth.pass) {
    console.warn('SMTP credentials not configured. Email sending is disabled.')
    return null
  }

  return nodemailer.createTransport({
    host: emailConfig.host,
    port: emailConfig.port,
    secure: emailConfig.secure,
    auth: emailConfig.auth,
  })
}

// Generate HTML email template for verification code
const generateVerificationEmailHTML = (name: string, verificationCode: string, siteName: string = 'Julie Crafts') => {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
    (process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : 'http://localhost:3000')
  const verificationUrl = `${baseUrl}/verify-email`
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email - ${siteName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5; padding: 20px;">
        <tr>
            <td align="center">
                <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <!-- Header with gradient -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                                ${siteName}
                            </h1>
                        </td>
                    </tr>
                    
                    <!-- Main Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 24px; font-weight: 600;">
                                Welcome, ${name}! 👋
                            </h2>
                            
                            <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                                Thank you for creating an account with ${siteName}. To complete your registration and start shopping, please verify your email address using the verification code below.
                            </p>
                            
                            <!-- Verification Code Display -->
                            <table role="presentation" style="width: 100%; margin: 30px 0;">
                                <tr>
                                    <td align="center">
                                        <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 2px solid #f59e0b; border-radius: 12px; padding: 30px; margin: 20px 0;">
                                            <p style="margin: 0 0 15px 0; color: #92400e; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
                                                Your Verification Code
                                            </p>
                                            <div style="font-size: 48px; font-weight: 700; color: #f59e0b; letter-spacing: 8px; font-family: 'Courier New', monospace; text-align: center;">
                                                ${verificationCode}
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="margin: 20px 0 0 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                                Enter this code on the verification page to complete your registration:
                            </p>
                            
                            <!-- Verification Link Button -->
                            <table role="presentation" style="width: 100%; margin: 30px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="${verificationUrl}" 
                                           style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(245, 158, 11, 0.3);">
                                            Go to Verification Page
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <div style="margin: 30px 0; padding: 20px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 6px;">
                                <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
                                    <strong>⏰ Important:</strong> This verification code will expire in 24 hours. If you didn't create an account with ${siteName}, please ignore this email.
                                </p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center;">
                            <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                                Need help? Contact us at 
                                <a href="mailto:${process.env.SMTP_USER || 'support@juliecrafts.ug'}" style="color: #f59e0b; text-decoration: none;">
                                    ${process.env.SMTP_USER || 'support@juliecrafts.ug'}
                                </a>
                            </p>
                            <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                                © ${new Date().getFullYear()} ${siteName}. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
  `
}

// Send verification email with code
export async function sendVerificationEmail(
  to: string,
  name: string,
  verificationCode: string
): Promise<boolean> {
  try {
    const transporter = createTransporter()
    if (!transporter) {
      console.error('Email transporter not configured')
      return false
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
      (process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : 'http://localhost:3000')
    
    const verificationUrl = `${baseUrl}/verify-email`
    const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'Julie Crafts'

    const mailOptions = {
      from: `"${siteName}" <${emailConfig.auth.user}>`,
      to: to,
      subject: `Verify Your Email - ${siteName}`,
      html: generateVerificationEmailHTML(name, verificationCode, siteName),
      text: `Welcome to ${siteName}, ${name}!\n\nYour verification code is: ${verificationCode}\n\nEnter this code on the verification page: ${verificationUrl}\n\nThis code will expire in 24 hours.\n\nIf you didn't create an account, please ignore this email.`,
    }

    const info = await transporter.sendMail(mailOptions)
    console.log('Verification email sent:', info.messageId)
    return true
  } catch (error) {
    console.error('Error sending verification email:', error)
    return false
  }
}

// Generate HTML email template for password reset code
const generatePasswordResetEmailHTML = (name: string, resetCode: string, siteName: string = 'Julie Crafts') => {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
    (process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : 'http://localhost:3000')
  const resetUrl = `${baseUrl}/reset-password`
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password - ${siteName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5; padding: 20px;">
        <tr>
            <td align="center">
                <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <!-- Header with gradient -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                                ${siteName}
                            </h1>
                        </td>
                    </tr>
                    
                    <!-- Main Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 24px; font-weight: 600;">
                                Password Reset Request 🔐
                            </h2>
                            
                            <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                                Hello ${name}, we received a request to reset your password. Use the code below to verify your identity and reset your password.
                            </p>
                            
                            <!-- Reset Code Display -->
                            <table role="presentation" style="width: 100%; margin: 30px 0;">
                                <tr>
                                    <td align="center">
                                        <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 2px solid #f59e0b; border-radius: 12px; padding: 30px; margin: 20px 0;">
                                            <p style="margin: 0 0 15px 0; color: #92400e; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
                                                Your Password Reset Code
                                            </p>
                                            <div style="font-size: 48px; font-weight: 700; color: #f59e0b; letter-spacing: 8px; font-family: 'Courier New', monospace; text-align: center;">
                                                ${resetCode}
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="margin: 20px 0 0 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                                Enter this code on the password reset page to change your password:
                            </p>
                            
                            <!-- Reset Link Button -->
                            <table role="presentation" style="width: 100%; margin: 30px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="${resetUrl}" 
                                           style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(245, 158, 11, 0.3);">
                                            Go to Reset Password Page
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <div style="margin: 30px 0; padding: 20px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 6px;">
                                <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
                                    <strong>⏰ Important:</strong> This reset code will expire in 1 hour. If you didn't request a password reset, please ignore this email and your password will remain unchanged.
                                </p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center;">
                            <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                                Need help? Contact us at 
                                <a href="mailto:${process.env.SMTP_USER || 'support@juliecrafts.ug'}" style="color: #f59e0b; text-decoration: none;">
                                    ${process.env.SMTP_USER || 'support@juliecrafts.ug'}
                                </a>
                            </p>
                            <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                                © ${new Date().getFullYear()} ${siteName}. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
  `
}

// Send password reset email with code
export async function sendPasswordResetEmail(
  to: string,
  name: string,
  resetCode: string
): Promise<boolean> {
  try {
    const transporter = createTransporter()
    if (!transporter) {
      console.error('Email transporter not configured')
      return false
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
      (process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : 'http://localhost:3000')
    
    const resetUrl = `${baseUrl}/reset-password`
    const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'Julie Crafts'

    const mailOptions = {
      from: `"${siteName}" <${emailConfig.auth.user}>`,
      to: to,
      subject: `Reset Your Password - ${siteName}`,
      html: generatePasswordResetEmailHTML(name, resetCode, siteName),
      text: `Hello ${name},\n\nWe received a request to reset your password. Your reset code is: ${resetCode}\n\nEnter this code on the password reset page: ${resetUrl}\n\nThis code will expire in 1 hour.\n\nIf you didn't request a password reset, please ignore this email and your password will remain unchanged.`,
    }

    const info = await transporter.sendMail(mailOptions)
    console.log('Password reset email sent:', info.messageId)
    return true
  } catch (error) {
    console.error('Error sending password reset email:', error)
    return false
  }
}

// Generate HTML email template for new order notification
const generateNewOrderEmailHTML = (
  orderNumber: string,
  customerName: string,
  customerEmail: string,
  totalAmount: number,
  currency: string,
  orderItems: Array<{ product_name: string; quantity: number; price: number }>,
  siteName: string = 'Julie Crafts'
): string => {
  const itemsList = orderItems.map(item => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${item.product_name}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">${currency} ${item.price.toLocaleString()}</td>
    </tr>
  `).join('')

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Order Notification</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f3f4f6; padding: 20px;">
    <tr>
      <td align="center">
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px 20px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: bold;">New Order Received!</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 30px 20px;">
              <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                Hello Admin,
              </p>
              <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                A new order has been placed on ${siteName}. Please review and process it as soon as possible.
              </p>
              
              <!-- Order Details -->
              <div style="background-color: #f9fafb; border-radius: 6px; padding: 20px; margin: 20px 0;">
                <h2 style="margin: 0 0 15px 0; color: #111827; font-size: 18px; font-weight: 600;">Order Details</h2>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 40%;">Order Number:</td>
                    <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600;">${orderNumber}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Customer Name:</td>
                    <td style="padding: 8px 0; color: #111827; font-size: 14px;">${customerName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Customer Email:</td>
                    <td style="padding: 8px 0; color: #111827; font-size: 14px;">${customerEmail}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Total Amount:</td>
                    <td style="padding: 8px 0; color: #111827; font-size: 16px; font-weight: 600; color: #f59e0b;">${currency} ${totalAmount.toLocaleString()}</td>
                  </tr>
                </table>
              </div>
              
              <!-- Order Items -->
              <div style="margin: 20px 0;">
                <h3 style="margin: 0 0 15px 0; color: #111827; font-size: 16px; font-weight: 600;">Order Items</h3>
                <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden;">
                  <thead>
                    <tr style="background-color: #f9fafb;">
                      <th style="padding: 12px; text-align: left; color: #374151; font-size: 14px; font-weight: 600; border-bottom: 2px solid #e5e7eb;">Product</th>
                      <th style="padding: 12px; text-align: center; color: #374151; font-size: 14px; font-weight: 600; border-bottom: 2px solid #e5e7eb;">Quantity</th>
                      <th style="padding: 12px; text-align: right; color: #374151; font-size: 14px; font-weight: 600; border-bottom: 2px solid #e5e7eb;">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${itemsList}
                  </tbody>
                </table>
              </div>
              
              <!-- Action Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/admin/orders/${orderNumber}" 
                       style="display: inline-block; padding: 12px 24px; background-color: #f59e0b; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                      View Order in Admin Panel
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                This is an automated notification. Please log in to the admin panel to process this order.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #6b7280; font-size: 12px;">
                © ${new Date().getFullYear()} ${siteName}. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `
}

// Send new order notification email to admin
export async function sendNewOrderNotificationEmail(
  adminEmail: string,
  orderNumber: string,
  customerName: string,
  customerEmail: string,
  totalAmount: number,
  currency: string,
  orderItems: Array<{ product_name: string; quantity: number; price: number }>
): Promise<boolean> {
  try {
    const transporter = createTransporter()
    if (!transporter) {
      console.error('Email transporter not configured')
      return false
    }

    const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'Julie Crafts'
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
      (process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : 'http://localhost:3000')

    // Generate text version
    const textVersion = `New Order Notification - ${siteName}

Hello Admin,

A new order has been placed on ${siteName}. Please review and process it as soon as possible.

Order Details:
- Order Number: ${orderNumber}
- Customer Name: ${customerName}
- Customer Email: ${customerEmail}
- Total Amount: ${currency} ${totalAmount.toLocaleString()}

Order Items:
${orderItems.map(item => `- ${item.product_name} (Qty: ${item.quantity}) - ${currency} ${item.price.toLocaleString()}`).join('\n')}

View order in admin panel: ${baseUrl}/admin/orders/${orderNumber}

This is an automated notification. Please log in to the admin panel to process this order.`

    const mailOptions = {
      from: `"${siteName}" <${emailConfig.auth.user}>`,
      to: adminEmail,
      subject: `New Order #${orderNumber} - ${siteName}`,
      html: generateNewOrderEmailHTML(orderNumber, customerName, customerEmail, totalAmount, currency, orderItems, siteName),
      text: textVersion,
    }

    const info = await transporter.sendMail(mailOptions)
    console.log('New order notification email sent to admin:', info.messageId)
    return true
  } catch (error) {
    console.error('Error sending new order notification email:', error)
    return false
  }
}

// Test email configuration
export async function testEmailConfiguration(): Promise<boolean> {
  try {
    const transporter = createTransporter()
    if (!transporter) {
      return false
    }

    await transporter.verify()
    console.log('Email server is ready to send messages')
    return true
  } catch (error) {
    console.error('Email configuration test failed:', error)
    return false
  }
}

