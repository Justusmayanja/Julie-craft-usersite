# Archive Functionality Implementation

## Overview

Archive functionality has been added to the admin system to help manage large datasets by moving old or inactive records out of the main view while preserving them for historical reference.

## What Has Been Archived

### 1. Orders
- **Archive Status**: `is_archived` boolean field
- **Archive Timestamp**: `archived_at` timestamp field
- **Default Behavior**: Archived orders are excluded from default queries
- **Filter**: "Archived" option added to status filter
- **Bulk Actions**: Archive/Unarchive orders in bulk

### 2. Products
- **Archive Status**: `is_archived` boolean field
- **Archive Timestamp**: `archived_at` timestamp field
- **Note**: Products also have `status` field (active/inactive/draft), archiving is separate

### 3. Customers (Profiles) ✅
- **Archive Status**: `is_archived` boolean field
- **Archive Timestamp**: `archived_at` timestamp field
- **Default Behavior**: Archived customers are excluded from default queries
- **Filter**: "Archived" option added to status filter
- **Bulk Actions**: Archive/Unarchive customers in bulk

### 4. Blog Posts
- **Archive Status**: `is_archived` boolean field
- **Archive Timestamp**: `archived_at` timestamp field

### 5. Notifications
- **Archive Status**: `is_archived` boolean field
- **Archive Timestamp**: `archived_at` timestamp field

## Database Migration

Run the migration script to add archive fields:

```sql
-- Run this in Supabase SQL Editor
-- File: database-migrations/ADD_ARCHIVE_FUNCTIONALITY.sql
```

The migration adds:
- `is_archived` boolean column (default: false)
- `archived_at` timestamp column
- Indexes for better query performance
- Helper functions for automatic archiving

## Usage

### Archiving Customers

1. **Via Status Filter**:
   - Select "Archived" from the status filter dropdown
   - View all archived customers

2. **Via Bulk Actions**:
   - Select one or more customers using checkboxes
   - Choose "Archive Customers" or "Unarchive Customers" from bulk actions
   - Click "Apply"

3. **Individual Archive**:
   - Open customer details
   - Update `is_archived` to `true` (via API)

### Archiving Orders

1. **Via Status Filter**:
   - Select "Archived" from the status filter dropdown
   - View all archived orders

2. **Via Bulk Actions**:
   - Select one or more orders
   - Choose "Archive Orders" from bulk actions
   - Click "Apply"

3. **Individual Archive**:
   - Open order details
   - Update `is_archived` to `true` (via API)

### Unarchiving Orders

1. **Via Bulk Actions**:
   - Filter to show archived orders
   - Select orders to unarchive
   - Choose "Unarchive Orders" from bulk actions
   - Click "Apply"

### Automatic Archiving

The system includes helper functions for automatic archiving:

```sql
-- Archive orders delivered more than 90 days ago
SELECT archive_old_orders();

-- Archive notifications older than 30 days
SELECT archive_old_notifications();
```

These can be scheduled via cron jobs or database triggers.

## API Changes

### Orders API

**GET /api/orders**
- New query parameter: `include_archived=true` to include archived orders
- Status filter: `status=archived` to show only archived orders
- Default: Archived orders are excluded

**PUT /api/orders/[id]**
- New field: `is_archived` (boolean)
- Automatically sets `archived_at` when archiving
- Clears `archived_at` when unarchiving

**POST /api/orders/bulk**
- New field: `is_archived` in updates object
- Supports bulk archive/unarchive operations

### Customers API

**GET /api/customers**
- New query parameter: `include_archived=true` to include archived customers
- Status filter: `status=archived` to show only archived customers
- Default: Archived customers are excluded

**PUT /api/customers/[id]**
- New field: `is_archived` (boolean)
- Automatically sets `archived_at` when archiving
- Clears `archived_at` when unarchiving

## Best Practices

1. **When to Archive**:
   - Orders: After 90 days of delivery
   - Products: Discontinued items
   - Customers: Inactive for extended period
   - Notifications: After 30 days
   - Blog Posts: Old content no longer relevant

2. **Archive vs Delete**:
   - Archive: Preserves data for historical reference
   - Delete: Permanently removes data (use with caution)

3. **Performance**:
   - Archived records are excluded from default queries
   - Use archive filters when you need to view archived items
   - Consider archiving old data regularly to maintain performance

## Future Enhancements

- [ ] Add archive functionality to Products admin page
- [x] Add archive functionality to Customers admin page ✅
- [ ] Add archive functionality to Blog posts admin page
- [ ] Add scheduled automatic archiving
- [ ] Add archive restore functionality
- [ ] Add archive export functionality

## Notes

- Archiving does not delete data, it only marks records as archived
- Archived records can be restored by setting `is_archived = false`
- Archive timestamps help track when items were archived
- The system maintains referential integrity even for archived records

