# Admin KPI Components

## Overview

This directory contains the real-time KPI (Key Performance Indicator) dashboard components for the admin panel.

## Components

### `HeaderSummary`
Main component that displays 6 KPI cards in a responsive grid:
- Total Sales (Today / This Month)
- Total Orders
- Average Order Value (AOV)
- Returning Customers %
- Pending Orders
- Low Stock Items

### `KpiCard`
Reusable card component for displaying individual KPIs with:
- Title and icon
- Formatted numeric value
- Trend indicator (up/down)
- Percentage change vs previous period
- Sparkline chart
- Smooth animations

### `Sparkline`
Minimal sparkline chart component using Recharts for trend visualization.

## Hooks

### `useKpiData`
Real-time data hook that:
- Fetches KPI metrics from Supabase
- Sets up real-time subscriptions for orders and products tables
- Falls back to polling if subscriptions are unavailable
- Calculates trends and sparkline data
- Handles errors gracefully with mock data fallback

## Usage

```tsx
import { HeaderSummary } from "@/components/admin/header-summary"

export default function AdminDashboard() {
  return (
    <div>
      <HeaderSummary />
      {/* Other dashboard content */}
    </div>
  )
}
```

## Real-time Updates

The KPI data updates automatically via:
1. **Supabase Subscriptions**: Real-time updates when orders/products change
2. **Polling Fallback**: 30-second polling interval if subscriptions fail
3. **Manual Refresh**: Call `refresh()` from the hook

## Database Schema Requirements

The components expect the following tables and fields:

### `orders` table
- `id` (uuid)
- `total_amount` (numeric)
- `status` (text: 'pending', 'processing', 'delivered', etc.)
- `created_at` (timestamp)
- `user_id` (uuid, foreign key to profiles)

### `products` table
- `id` (uuid)
- `stock_quantity` (integer)

### `profiles` table
- `id` (uuid)
- `is_admin` (boolean)

## Schema Recommendations

For optimal performance, consider adding:

1. **Indexes**:
   ```sql
   CREATE INDEX idx_orders_created_at ON orders(created_at);
   CREATE INDEX idx_orders_status ON orders(status);
   CREATE INDEX idx_orders_user_id ON orders(user_id);
   CREATE INDEX idx_products_stock_quantity ON products(stock_quantity);
   ```

2. **Materialized Views** (optional, for better performance):
   ```sql
   CREATE MATERIALIZED VIEW daily_sales_summary AS
   SELECT 
     DATE(created_at) as sale_date,
     SUM(total_amount) as total_sales,
     COUNT(*) as order_count
   FROM orders
   WHERE status = 'delivered'
   GROUP BY DATE(created_at);
   ```

3. **Computed Columns** (if supported):
   - Consider adding a `is_returning_customer` flag to profiles
   - Consider adding a `last_order_date` to profiles for faster queries

## Performance Notes

- Real-time subscriptions are lightweight and efficient
- Polling interval is configurable (default: 30 seconds)
- Sparkline data is calculated for the last 7 days
- All calculations are done client-side for flexibility

## Error Handling

- Network errors: Falls back to mock data (zeros)
- Database errors: Shows error message in UI
- Missing data: Displays "0" or "N/A" gracefully
- Loading states: Skeleton loaders during initial fetch

