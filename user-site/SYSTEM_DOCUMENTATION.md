# Julie Crafts E-Commerce System - Complete Documentation

## Table of Contents

1. [System Overview](#system-overview)
2. [Key Features](#key-features)
3. [System Architecture](#system-architecture)
4. [User Guide](#user-guide)
5. [Admin Guide](#admin-guide)
6. [Technical Specifications](#technical-specifications)
7. [Deployment & Setup](#deployment--setup)
8. [Security & Authentication](#security--authentication)
9. [API Documentation](#api-documentation)
10. [Maintenance & Support](#maintenance--support)

---

## System Overview

The Julie Crafts E-Commerce System is a comprehensive, modern web application designed for managing and selling handcrafted products online. Built with Next.js 15 and TypeScript, the system provides a seamless shopping experience for customers while offering powerful administrative tools for business management.

### Core Capabilities

- **Customer-Facing Website**: Beautiful, responsive e-commerce storefront
- **Admin Dashboard**: Comprehensive management interface for products, orders, inventory, and customers
- **Order Management**: Complete order processing workflow from cart to delivery
- **Inventory Management**: Real-time stock tracking with automated alerts
- **Customer Management**: User accounts, profiles, and order history
- **Content Management**: Blog posts, pages, and homepage customization
- **Analytics & Reporting**: Business insights and performance metrics

---

## Key Features

### Customer Features

#### Shopping Experience
- **Product Browsing**: Browse products by category with advanced filtering
- **Product Search**: Search products by name, description, or tags
- **Product Details**: Detailed product pages with images, descriptions, and specifications
- **Shopping Cart**: Persistent cart that saves across sessions
- **Guest Checkout**: Place orders without creating an account
- **User Accounts**: Register and manage personal accounts
- **Order Tracking**: Track order status and view order history
- **Wishlist**: Save favorite products for later
- **Product Reviews**: View and submit product reviews (if enabled)

#### User Account Features
- **Profile Management**: Update personal information, profile picture
- **Order History**: View all past orders with details
- **Address Book**: Save shipping addresses for faster checkout
- **Notifications**: Receive order updates and promotional notifications
- **Password Management**: Change password and reset forgotten passwords

### Admin Features

#### Dashboard & Analytics
- **Overview Dashboard**: Key metrics, recent orders, and quick actions
- **Sales Analytics**: Revenue trends, product performance, customer insights
- **KPI Tracking**: Monitor key performance indicators
- **Real-time Updates**: Live order notifications and alerts

#### Product Management
- **Product CRUD**: Create, edit, and delete products
- **Bulk Operations**: Import/export products, bulk status updates
- **Image Management**: Upload multiple product images
- **Inventory Tracking**: Real-time stock levels and movements
- **Low Stock Alerts**: Automated notifications for low inventory
- **Product Categories**: Organize products into categories
- **SEO Management**: Meta titles, descriptions, and keywords

#### Order Management
- **Order Processing**: View, process, and update order status
- **Bulk Order Updates**: Update multiple orders simultaneously
- **Order Details**: Complete order information with customer details
- **Shipping Management**: Track shipments and update tracking numbers
- **Payment Status**: Monitor and update payment status
- **Order History**: Complete order archive with search and filters

#### Inventory Management
- **Stock Tracking**: Real-time inventory levels
- **Stock Movements**: Audit trail of all inventory changes
- **Stock Adjustments**: Manual stock corrections
- **Reorder Alerts**: Automated low stock notifications
- **ABC Classification**: Product categorization by sales volume
- **Stock Returns**: Handle product returns and restocking

#### Customer Management
- **Customer Database**: View all registered customers
- **Customer Profiles**: Detailed customer information and history
- **Order History**: View all orders for specific customers
- **Customer Communication**: Send notifications and emails
- **Customer Segmentation**: Filter customers by status, activity, etc.

#### Content Management
- **Blog Management**: Create and manage blog posts
- **Page Builder**: Create custom pages (About, Contact, etc.)
- **Homepage Sections**: Customize homepage content and layout
- **Media Library**: Upload and manage images and media files
- **Site Settings**: Configure site-wide settings and preferences

#### Settings & Configuration
- **Business Settings**: Company information, contact details
- **Payment Settings**: Configure payment methods and gateways
- **Shipping Settings**: Shipping zones, rates, and methods
- **Email Settings**: SMTP configuration for transactional emails
- **Security Settings**: Password policies, session management
- **Appearance Settings**: Theme customization, logo, colors

#### Notifications
- **Order Notifications**: Real-time alerts for new orders
- **Inventory Alerts**: Low stock and reorder notifications
- **System Notifications**: Important system updates and messages
- **Email Notifications**: Automated email notifications

---

## System Architecture

### Technology Stack

#### Frontend
- **Framework**: Next.js 15 (React 19)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI, shadcn/ui
- **State Management**: React Context API
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts

#### Backend
- **Runtime**: Node.js
- **API**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth + JWT
- **File Storage**: Supabase Storage
- **Email**: Nodemailer (SMTP)

#### Infrastructure
- **Deployment**: Vercel (recommended) or Netlify
- **Database Hosting**: Supabase Cloud
- **CDN**: Vercel Edge Network
- **Analytics**: Vercel Analytics

### Database Schema

#### Core Tables
- **products**: Product catalog with inventory data
- **categories**: Product categorization
- **orders**: Order information
- **order_items**: Individual items in orders
- **profiles**: User profile information
- **user_carts**: Shopping cart data
- **notifications**: System notifications
- **stock_movements**: Inventory audit trail
- **blog_posts**: Blog content
- **site_pages**: Custom pages
- **site_settings**: Site configuration

### System Flow

#### Order Processing Flow
1. Customer adds products to cart
2. System checks stock availability
3. Products are reserved (prevents overselling)
4. Customer proceeds to checkout
5. Order is created atomically (database transaction)
6. Inventory is deducted automatically
7. Order notifications are sent
8. Admin processes and ships order
9. Customer receives tracking information

#### Authentication Flow
1. User registers with email and password
2. Supabase creates auth user
3. Database trigger creates profile
4. JWT token is generated
5. Token stored in localStorage
6. Token validated on each request
7. Role-based access control enforced

---

## User Guide

### Getting Started

#### Creating an Account
1. Navigate to the registration page
2. Fill in your details:
   - First Name (required)
   - Last Name (required)
   - Email Address (required)
   - Phone Number (optional)
   - Password (min 6 characters, must include uppercase, lowercase, and number)
3. Click "Create Account"
4. Verify your email (if email verification is enabled)
5. You're ready to shop!

#### Browsing Products
- **By Category**: Click on category links in the navigation
- **Search**: Use the search bar to find specific products
- **Filters**: Use category and price filters to narrow results
- **Featured Products**: View featured products on the homepage

#### Shopping Cart
- **Add to Cart**: Click "Add to Cart" on any product page
- **View Cart**: Click the cart icon in the navigation
- **Update Quantity**: Change quantities in the cart
- **Remove Items**: Click remove to delete items
- **Checkout**: Click "Proceed to Checkout" when ready

#### Placing an Order
1. Review your cart items
2. Enter shipping information
3. Review order total
4. Click "Place Order"
5. Receive order confirmation with order number
6. Track your order status in your account

#### Managing Your Account
- **Profile**: Update your name, email, phone, and profile picture
- **Orders**: View order history and track current orders
- **Addresses**: Save shipping addresses for faster checkout
- **Notifications**: View and manage notifications
- **Password**: Change your password anytime

### Guest Checkout
- You can place orders without creating an account
- Enter your email to receive order updates
- Order tracking available via order number

---

## Admin Guide

### Accessing the Admin Dashboard

1. Navigate to `/admin` or `/login`
2. Log in with admin credentials
3. You'll be redirected to the admin dashboard

### Dashboard Overview

The dashboard provides:
- **Key Metrics**: Total orders, revenue, customers
- **Recent Orders**: Latest orders requiring attention
- **Quick Actions**: Common tasks and shortcuts
- **Charts**: Visual representation of sales trends

### Managing Products

#### Adding a New Product
1. Navigate to **Products** → **Add New**
2. Fill in product details:
   - Name, description, price
   - Category, SKU, stock quantity
   - Images (upload multiple)
   - SEO information
3. Set product status (Active/Inactive)
4. Click "Save Product"

#### Editing Products
1. Go to **Products** page
2. Click "Edit" on any product
3. Update information as needed
4. Save changes

#### Managing Inventory
- **View Stock Levels**: See current stock for all products
- **Adjust Stock**: Manually correct inventory counts
- **Low Stock Alerts**: System automatically alerts when stock is low
- **Stock Movements**: View complete audit trail

### Managing Orders

#### Processing Orders
1. Navigate to **Orders**
2. View order list with filters
3. Click on an order to view details
4. Update order status:
   - Pending → Processing → Shipped → Delivered
5. Add tracking number when shipping
6. Update payment status as needed

#### Bulk Operations
- Select multiple orders
- Update status for all selected
- Export order data
- Print shipping labels

### Managing Customers

1. Navigate to **Customers**
2. View customer list with search and filters
3. Click on customer to view:
   - Profile information
   - Order history
   - Account status
4. Update customer information if needed
5. Block/unblock customers if necessary

### Content Management

#### Blog Posts
1. Go to **Content** → **Blog**
2. Create new post or edit existing
3. Add title, content, featured image
4. Set publish date and status
5. Save and publish

#### Custom Pages
1. Navigate to **Content** → **Pages**
2. Create new page (About, Contact, etc.)
3. Add content using the editor
4. Set page slug and meta information
5. Publish page

#### Homepage Customization
1. Go to **Content** → **Homepage**
2. Edit homepage sections
3. Upload images, update text
4. Reorder sections
5. Save changes

### Analytics & Reports

#### Viewing Analytics
1. Navigate to **Analytics**
2. View key metrics:
   - Sales trends
   - Product performance
   - Customer insights
   - Revenue reports
3. Filter by date range
4. Export reports if needed

### Settings Configuration

#### Business Settings
- Company name and information
- Contact details
- Business hours
- Tax information

#### Payment Settings
- Configure payment gateways
- Set up payment methods
- Payment processing settings

#### Shipping Settings
- Shipping zones
- Shipping rates
- Delivery methods
- Shipping rules

#### Email Settings
- SMTP configuration
- Email templates
- Notification preferences

---

## Technical Specifications

### System Requirements

#### Server Requirements
- Node.js 18+ or 20+
- npm or yarn package manager
- Modern web server (Vercel, Netlify, or similar)

#### Database Requirements
- PostgreSQL 12+ (via Supabase)
- Required database extensions:
  - uuid-ossp
  - pgcrypto

#### Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JWT_SECRET=your_jwt_secret
```

### Performance Specifications

- **Page Load Time**: < 2 seconds (optimized)
- **API Response Time**: < 500ms average
- **Database Queries**: Optimized with indexes
- **Image Optimization**: Automatic image optimization via Next.js
- **Caching**: Static page generation and API caching

### Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

### Security Features

- **HTTPS**: All connections encrypted
- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: bcrypt with 12 salt rounds
- **SQL Injection Protection**: Parameterized queries
- **XSS Protection**: Input sanitization
- **CSRF Protection**: Token validation
- **Rate Limiting**: API rate limiting (recommended)
- **Row Level Security**: Database-level access control

---

## Deployment & Setup

### Initial Setup

#### 1. Prerequisites
- Node.js installed
- Supabase account
- Deployment platform account (Vercel recommended)

#### 2. Database Setup
1. Create Supabase project
2. Run database migration scripts
3. Set up database functions
4. Configure Row Level Security policies

#### 3. Environment Configuration
1. Create `.env.local` file:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JWT_SECRET=your_secure_jwt_secret
```

#### 4. Install Dependencies
```bash
npm install
```

#### 5. Build and Test
```bash
npm run build
npm start
```

### Deployment to Vercel

1. **Connect Repository**
   - Push code to GitHub/GitLab
   - Import project in Vercel

2. **Configure Environment Variables**
   - Add all required environment variables in Vercel dashboard
   - Set variables for production, preview, and development

3. **Deploy**
   - Vercel automatically deploys on push
   - Or deploy manually from dashboard

4. **Verify Deployment**
   - Check site is accessible
   - Test key functionality
   - Verify database connection

### Post-Deployment Checklist

- [ ] Environment variables configured
- [ ] Database connection verified
- [ ] Admin account created
- [ ] Test order placed
- [ ] Email notifications working
- [ ] SSL certificate active
- [ ] Analytics configured
- [ ] Backup strategy in place

---

## Security & Authentication

### Authentication System

#### User Authentication
- **Registration**: Email and password with validation
- **Login**: Secure login with JWT tokens
- **Password Reset**: Secure password reset flow
- **Email Verification**: Optional email verification
- **Session Management**: Token-based sessions with expiration

#### Admin Authentication
- **Role-Based Access**: Admin and super_admin roles
- **Protected Routes**: Middleware protects admin routes
- **Token Validation**: Every request validated
- **Session Timeout**: Automatic logout after inactivity

### Security Best Practices

1. **Password Requirements**
   - Minimum 6 characters
   - Must include uppercase, lowercase, and number
   - Stored as bcrypt hash

2. **Token Security**
   - JWT tokens with expiration
   - Stored in httpOnly cookies (recommended)
   - Automatic token refresh

3. **Database Security**
   - Row Level Security enabled
   - Parameterized queries only
   - No direct database access from frontend

4. **API Security**
   - Authentication required for protected endpoints
   - Input validation on all endpoints
   - Rate limiting recommended

---

## API Documentation

### Authentication Endpoints

#### Register User
```
POST /api/auth/supabase-register
Body: {
  email: string,
  password: string,
  full_name: string,
  phone?: string
}
```

#### Login
```
POST /api/auth/supabase-login
Body: {
  email: string,
  password: string
}
```

#### Verify Token
```
GET /api/auth/verify
Headers: {
  Authorization: Bearer <token>
}
```

### Product Endpoints

#### Get Products
```
GET /api/products
Query Params:
  - category?: string
  - featured?: boolean
  - limit?: number
  - offset?: number
  - search?: string
```

#### Get Product by ID
```
GET /api/products/[id]
```

### Order Endpoints

#### Create Order
```
POST /api/orders
Headers: {
  Authorization: Bearer <token>
}
Body: {
  customer_email: string,
  customer_name: string,
  shipping_address: object,
  items: array,
  subtotal: number,
  total_amount: number
}
```

#### Get User Orders
```
GET /api/orders/user
Headers: {
  Authorization: Bearer <token>
}
```

### Admin Endpoints

#### Get Dashboard Stats
```
GET /api/admin/dashboard
Headers: {
  Authorization: Bearer <admin_token>
}
```

#### Get Orders
```
GET /api/admin/orders
Headers: {
  Authorization: Bearer <admin_token>
}
Query Params:
  - status?: string
  - date_from?: string
  - date_to?: string
```

### Inventory Endpoints

#### Check Stock Availability
```
POST /api/inventory/check
Body: {
  items: [{ product_id: string, quantity: number }]
}
```

#### Reserve Products
```
POST /api/inventory/reserve
Body: {
  items: array,
  session_id: string
}
```

---

## Maintenance & Support

### Regular Maintenance Tasks

#### Daily
- Monitor order notifications
- Check for low stock alerts
- Review new customer registrations

#### Weekly
- Review analytics and reports
- Check system performance
- Review and respond to customer inquiries

#### Monthly
- Database backup verification
- Security updates
- Performance optimization review
- Content updates

### Backup Strategy

#### Database Backups
- Supabase automatic daily backups
- Manual backup before major updates
- Test restore procedures quarterly

#### Code Backups
- Version control (Git)
- Regular commits
- Tagged releases

### Troubleshooting

#### Common Issues

**Products Not Loading**
- Check database connection
- Verify environment variables
- Check Supabase project status

**Orders Not Processing**
- Verify database functions are installed
- Check order creation logs
- Verify inventory levels

**Authentication Issues**
- Check JWT secret configuration
- Verify Supabase auth settings
- Check token expiration

**Email Not Sending**
- Verify SMTP configuration
- Check email service status
- Review email logs

### Support Resources

- **Documentation**: This document
- **Database Schema**: See DATABASE_SCHEMA.md
- **API Documentation**: See above
- **Setup Instructions**: See SETUP_INSTRUCTIONS.md
- **Deployment Guide**: See DEPLOYMENT_SETUP.md

### Getting Help

1. Check this documentation
2. Review error logs
3. Check Supabase dashboard
4. Review deployment platform logs
5. Contact technical support if needed

---

## Appendix

### Database Functions

The system uses several PostgreSQL functions:

- **create_order_atomic**: Atomic order creation with inventory deduction
- **get_user_with_profile**: Retrieve user with profile data
- **check_stock_availability**: Validate stock before operations

### File Structure

```
user-site/
├── app/                    # Next.js app directory
│   ├── admin/             # Admin pages
│   ├── api/                # API routes
│   └── [pages]/           # Public pages
├── components/             # React components
├── contexts/               # React contexts
├── lib/                    # Utility functions
├── hooks/                  # Custom React hooks
├── database/               # Database scripts
└── public/                 # Static assets
```

### Key Technologies

- **Next.js 15**: React framework with server-side rendering
- **TypeScript**: Type-safe JavaScript
- **Supabase**: Backend-as-a-Service (database, auth, storage)
- **Tailwind CSS**: Utility-first CSS framework
- **React Hook Form**: Form management
- **Zod**: Schema validation

---

## Conclusion

The Julie Crafts E-Commerce System is a comprehensive, production-ready solution for managing an online craft business. With its modern architecture, robust features, and user-friendly interface, it provides everything needed to run a successful e-commerce operation.

For additional support or questions, please refer to the technical documentation or contact your development team.

---

**Document Version**: 1.0  
**Last Updated**: 2024  
**System Version**: 0.1.0

