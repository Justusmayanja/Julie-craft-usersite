# Categories Section - Documentation

## Overview
The modernized Categories Section component provides a clean, responsive grid layout for displaying product categories on the homepage.

## Components

### 1. `CategoriesSection`
Main component that fetches and displays categories in a responsive grid.

**Features:**
- Fetches categories from `/api/categories`
- Filters only active categories
- Sorts by `sort_order`
- Intersection Observer for fade-in animations
- Loading, error, and empty states
- Fully accessible with ARIA labels

### 2. `CategoryCard`
Reusable card component for individual categories.

**Features:**
- Fixed 4:5 aspect ratio for images
- Image optimization with Next.js Image
- Hover animations (scale, shadow, translate)
- Gradient overlay on hover
- Fallback icon when no image
- Accessible link with proper ARIA labels
- Responsive text truncation

## Responsive Breakpoints

- **Mobile (≤ 480px)**: 1 column
- **Tablet (≥ 768px)**: 2 columns
- **Desktop (≥ 1024px)**: 3 columns
- **Large Desktop (≥ 1280px)**: 4 columns

## SEO Recommendations

### 1. Add Structured Data
Add JSON-LD structured data to help search engines understand your categories:

```json
{
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "name": "Shop by Category",
  "description": "Browse our handmade craft categories",
  "mainEntity": {
    "@type": "ItemList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Category Name",
        "url": "https://yoursite.com/categories/category-slug"
      }
    ]
  }
}
```

### 2. Meta Tags
Add category-specific meta tags in the page head:
- `og:title` - Category section title
- `og:description` - Category section description
- `og:image` - Featured category image

### 3. Semantic HTML
The component uses semantic HTML:
- `<section>` with `aria-label`
- `<article>` for each card
- `<header>` for section header
- Proper heading hierarchy (h2 → h3)

## UX Improvements

### 1. Performance
- ✅ Lazy loading images
- ✅ Intersection Observer for animations
- ✅ Optimized image sizes with responsive breakpoints
- ✅ Dynamic imports for code splitting

### 2. Accessibility
- ✅ Keyboard navigation support
- ✅ Focus states with ring indicators
- ✅ ARIA labels for screen readers
- ✅ Semantic HTML structure
- ✅ Alt text for all images

### 3. Visual Feedback
- ✅ Hover animations (scale, shadow, translate)
- ✅ Smooth transitions (300-500ms)
- ✅ Loading skeletons
- ✅ Error and empty states

## Future Enhancements

1. **Category Count Badge**: Show number of products per category
2. **Featured Categories**: Highlight certain categories
3. **Category Filtering**: Add search/filter functionality
4. **Infinite Scroll**: Load more categories on scroll
5. **Category Preview**: Show top 3 products on hover
6. **Analytics**: Track category clicks and interactions

## Usage

```tsx
import { CategoriesSection } from "@/components/categories-section"

export default function HomePage() {
  return (
    <>
      <Hero />
      <FeaturedProducts />
      <CategoriesSection />
      <BlogCarousel />
    </>
  )
}
```

## Customization

### Change Grid Columns
Modify the grid classes in `categories-section.tsx`:
```tsx
className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
```

### Change Aspect Ratio
Modify the aspect ratio in `category-card.tsx`:
```tsx
<div className="relative w-full aspect-[4/5] ...">
  // Change to aspect-square for square images
</div>
```

### Adjust Animation Speed
Modify transition durations:
```tsx
className="transition-all duration-300" // Change 300 to desired ms
```

