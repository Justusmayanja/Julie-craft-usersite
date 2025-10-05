# Backend Integration Setup Guide

This guide explains how to set up the backend integration between the user-site and the admin system (craft-web).

## Overview

The user-site now fetches product data dynamically from the admin system's Supabase database instead of using hardcoded data. This allows products added by admins to automatically appear on the user-facing website.

## Architecture

```
Admin System (craft-web) → Supabase Database → API Routes → Frontend Components
```

## Setup Instructions

### 1. Environment Configuration

Create a `.env.local` file in the user-site directory with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### 2. Database Setup

The admin system should already have the database schema set up. If not, run the schema from:
`craft-web/admin/database/complete-schema.sql`

### 3. API Endpoints

The following API endpoints have been created:

- `GET /api/products` - Fetch products with filtering and pagination
- `GET /api/categories` - Fetch active categories

### 4. Frontend Integration

The following components have been updated to use dynamic data:

- `ProductCatalog` - Main products page
- `FeaturedProducts` - Homepage featured products section

Both components include fallback to hardcoded data if the API fails.

## Features

### Product API Features

- ✅ Fetch active products only
- ✅ Search functionality
- ✅ Category filtering
- ✅ Price range filtering
- ✅ Sorting options
- ✅ Pagination
- ✅ Featured products filtering
- ✅ Stock level filtering

### Frontend Features

- ✅ Loading states with skeleton UI
- ✅ Error handling with fallback data
- ✅ Real-time filtering and sorting
- ✅ Responsive design
- ✅ Cart integration

## Data Transformation

Products from the admin database are transformed to match the frontend interface:

```typescript
// Admin Product → Frontend Product
{
  id: string → number (UUID converted to number)
  name: string → string
  price: number → number
  images: string[] → image: string (first image or featured_image)
  category: Category → category: string (slugified name)
  // ... additional transformations
}
```

## Error Handling

The system includes comprehensive error handling:

1. **API Failures**: Falls back to hardcoded data
2. **Network Issues**: Shows cached data with warning
3. **Invalid Data**: Graceful degradation
4. **Loading States**: Skeleton UI during data fetching

## Testing

To test the integration:

1. Ensure the admin system has products in the database
2. Start the user-site development server
3. Check that products load from the API
4. Test filtering, searching, and sorting
5. Verify fallback behavior by temporarily breaking the API

## Troubleshooting

### Common Issues

1. **Products not loading**: Check environment variables and database connection
2. **CORS errors**: Ensure Supabase is configured for your domain
3. **Authentication errors**: Verify service role key is correct
4. **Missing products**: Check that products have `status = 'active'` in database

### Debug Mode

Enable debug logging by adding to your environment:
```env
NEXT_PUBLIC_DEBUG=true
```

## Security Considerations

- API endpoints use service role key for database access
- Only active products are exposed to public API
- Row Level Security (RLS) policies protect admin data
- No sensitive admin information is exposed to frontend

## Performance Optimizations

- API responses are cached with Next.js revalidation
- Images are optimized with Next.js Image component
- Database queries are optimized with proper indexing
- Pagination prevents large data loads
