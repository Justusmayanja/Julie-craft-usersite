# Admin Navigation Links Fix

## Issue
Admin sidebar navigation links were pointing to customer site pages instead of admin pages because they were missing the `/admin` prefix.

## Fixed Navigation Links

### Overview Section
- ✅ Dashboard: `/admin` (already correct)
- ✅ Analytics: `/analytics` → `/admin/analytics`

### Commerce Section
- ✅ Products: `/products` → `/admin/products`
- ✅ Orders: `/orders` → `/admin/orders`
- ✅ Categories: `/categories` → `/admin/categories`
- ✅ Inventory: `/inventory` → `/admin/inventory`

### Content Section
- ✅ Pages: `/content/pages` → `/admin/content/pages`
- ✅ Media Library: `/content/media` → `/admin/content/media`
- ✅ Blog & News: `/content/blog` → `/admin/content/blog`
- ✅ Homepage: `/content/homepage` → `/admin/content/homepage`

### Management Section
- ✅ Customers: `/customers` → `/admin/customers`
- ✅ Profile: `/profile` → `/admin/profile`
- ❌ Account: `/account` (removed - not needed in admin)
- ✅ Settings: `/settings` → `/admin/settings`

### Settings Submenu
- ✅ Business Info: `/settings/business` → `/admin/settings/business`
- ✅ Shipping: `/settings/shipping` → `/admin/settings/shipping`
- ✅ Payments: `/settings/payments` → `/admin/settings/payments`
- ✅ Notifications: `/settings/notifications` → `/admin/settings/notifications`
- ✅ Security: `/settings/security` → `/admin/settings/security`
- ✅ Users & Permissions: `/settings/users` → `/admin/settings/users`
- ✅ Appearance: `/settings/appearance` → `/admin/settings/appearance`
- ✅ Integrations: `/settings/integrations` → `/admin/settings/integrations`

## File Modified
- `components/admin/admin-sidebar.tsx`

## Result
All admin navigation links now correctly point to admin pages (`/admin/*`) instead of customer site pages. Clicking any link in the admin sidebar will keep users within the admin interface.

