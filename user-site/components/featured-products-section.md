# Featured Products Section

## Overview
A modern, highly-converting Featured Products section for the homepage that showcases 4-8 featured products with premium design and excellent UX.

## Features

### Design & Layout
- **Responsive Grid**: 
  - Mobile: 1 column
  - Tablet (sm): 2 columns
  - Desktop (lg): 3 columns
  - Large Desktop (xl): 4 columns
- **Modern Styling**:
  - Rounded corners (`rounded-2xl`)
  - Soft shadows with hover effects
  - Smooth transitions and micro-interactions
  - Clean borders and spacing

### Product Card Features
1. **Product Image**:
   - Next.js Image optimization
   - Square aspect ratio (1:1)
   - Hover zoom effect (scale-105)
   - Alternate image on hover (if available)
   - Lazy loading enabled

2. **Product Information**:
   - Bold product name (1-line truncation)
   - Short description (2-line truncation)
   - Prominent price display
   - Discount price with percentage badge
   - Optional star rating

3. **Badges & Indicators**:
   - Discount percentage badge
   - "Featured" badge
   - "Best Seller" badge (for high-selling products)
   - "Only X left" for low stock items
   - "Out of Stock" badge

4. **Interactive Elements**:
   - Full-width "Add to Cart" button
   - Quick view button (appears on hover)
   - Wishlist button (appears on hover)
   - Entire card links to product page

5. **Accessibility**:
   - Proper alt text for images
   - ARIA labels for buttons
   - Keyboard navigation support
   - Focus-visible styles

## Components

### `FeaturedProductsSection`
Main component that fetches and displays featured products.

**Props:**
- `limit?: number` - Maximum number of products to display (default: 8)
- `showViewAll?: boolean` - Show "View All Products" button (default: true)
- `className?: string` - Additional CSS classes

**Usage:**
```tsx
<FeaturedProductsSection limit={6} showViewAll={true} />
```

### `ProductCard`
Reusable product card component.

**Props:**
- `id: string` - Product ID
- `name: string` - Product name
- `price: number` - Original price
- `sale_price?: number | null` - Sale price (if on discount)
- `description?: string | null` - Product description
- `image?: string | null` - Primary product image
- `images?: string[] | null` - Array of product images
- `featured_image?: string | null` - Featured image URL
- `category?: string | null` - Product category
- `stock_quantity: number` - Available stock
- `featured?: boolean` - Is featured product
- `slug?: string | null` - Product slug for URL
- `rating?: number | null` - Product rating (0-5)
- `total_sold?: number | null` - Total units sold
- `className?: string` - Additional CSS classes

## Utility Functions

### Price Formatting (`lib/utils/format-price.ts`)
- `formatPrice(price, currency)` - Format with currency symbol
- `formatPriceNumber(price)` - Format number only
- `calculateDiscount(originalPrice, salePrice)` - Calculate discount percentage

### Text Utilities (`lib/utils/truncate-text.ts`)
- `truncateText(text, maxLength)` - Truncate to character length
- `truncateLines(text, lines)` - Truncate to approximate line count

## Performance Optimizations

1. **Image Optimization**:
   - Next.js Image component with responsive sizes
   - Lazy loading for below-the-fold images
   - Proper aspect ratios to prevent layout shift

2. **Code Splitting**:
   - Dynamic imports in homepage
   - Component-level code splitting

3. **State Management**:
   - Efficient loading states
   - Error handling with fallbacks

## SEO Considerations

- Semantic HTML structure
- Proper heading hierarchy
- Alt text for all images
- Descriptive link text

## Future Enhancements

1. **Quick View Modal**: Show product details in a modal without navigation
2. **Wishlist Integration**: Connect to user wishlist system
3. **Product Comparison**: Allow comparing multiple products
4. **Recently Viewed**: Track and show recently viewed products
5. **Personalization**: Show products based on user preferences
6. **A/B Testing**: Test different layouts and CTAs
7. **Analytics**: Track product views and clicks
8. **Skeleton Loading**: More detailed loading states
9. **Infinite Scroll**: Load more products on scroll
10. **Filter/Sort**: Add filtering and sorting options

## Conversion Optimization Tips

1. **Clear CTAs**: Prominent "Add to Cart" buttons
2. **Social Proof**: Show ratings and "Best Seller" badges
3. **Urgency**: Display "Only X left" for low stock
4. **Visual Appeal**: High-quality images with hover effects
5. **Trust Signals**: Featured badges and ratings
6. **Easy Navigation**: Quick view and direct product links
7. **Mobile Optimization**: Touch-friendly buttons and spacing

