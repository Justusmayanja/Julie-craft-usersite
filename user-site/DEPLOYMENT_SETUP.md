# Deployment Setup Guide

## 🚀 Fixing Database Connection in Production

The issue you're experiencing is that your Supabase environment variables are not configured in your deployment environment. Here's how to fix it:

### **Step 1: Get Your Supabase Credentials**

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **API**
3. Copy the following values:
   - **Project URL** (e.g., `https://your-project-id.supabase.co`)
   - **Anon/Public Key** (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)
   - **Service Role Key** (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

### **Step 2: Configure Environment Variables**

#### **For Vercel Deployment:**

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

#### **For Netlify Deployment:**

1. Go to your Netlify site dashboard
2. Navigate to **Site settings** → **Environment variables**
3. Add the same variables as above

#### **For Other Platforms:**

Add these environment variables to your deployment platform:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### **Step 3: Local Development Setup**

Create a `.env.local` file in your project root with:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### **Step 4: Redeploy**

After adding the environment variables:
1. **Redeploy** your application
2. The database connection should now work in production

### **Step 5: Verify Database Connection**

You can verify the connection is working by:

1. **Check Network Tab**: Open browser dev tools and check if API calls to `/api/products` return data from database
2. **Check Console**: Look for "Supabase not configured" messages
3. **Test Features**: Try adding products to cart and placing orders

### **Troubleshooting**

#### **If products still don't load:**

1. **Check Environment Variables**: Ensure they're correctly set in your deployment platform
2. **Check Supabase Project**: Ensure your Supabase project is active and accessible
3. **Check Database Tables**: Ensure you have `products` and `categories` tables in Supabase
4. **Check API Logs**: Look at your deployment platform's function logs for errors

#### **Common Issues:**

- **Wrong URL**: Make sure the Supabase URL is correct and doesn't have trailing slashes
- **Wrong Keys**: Ensure you're using the correct anon key and service role key
- **Missing Tables**: Make sure your Supabase database has the required tables
- **RLS Policies**: Check if Row Level Security is blocking access

### **Database Tables Required**

Make sure your Supabase database has these tables:

```sql
-- Products table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  cost_price DECIMAL(10,2),
  sku VARCHAR(100),
  status VARCHAR(20) DEFAULT 'active',
  featured BOOLEAN DEFAULT false,
  stock_quantity INTEGER DEFAULT 0,
  category_id UUID,
  featured_image VARCHAR(500),
  images JSONB,
  tags JSONB,
  dimensions JSONB,
  seo_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categories table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  slug VARCHAR(255) UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **Testing the Fix**

After setting up the environment variables:

1. **Redeploy** your application
2. **Visit** your deployed site
3. **Check** if products load from the database (not fallback data)
4. **Test** adding products to cart and checkout functionality

The products should now load from your Supabase database instead of the static fallback data.
