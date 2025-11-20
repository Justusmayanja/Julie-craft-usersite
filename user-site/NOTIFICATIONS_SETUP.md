# Notifications Table Setup

The notifications feature requires a database table to be created. If you're seeing errors like "Could not find the table 'public.notifications'", you need to run the migration script.

## Quick Setup

1. Open your Supabase Dashboard
2. Go to the SQL Editor
3. Copy and paste the contents of `database-migrations/create-notifications-table.sql`
4. Click "Run" to execute the script

## What This Creates

- **notifications table**: Stores all in-app notifications for admin and customers
- **Indexes**: For efficient querying by user, recipient type, read status, etc.
- **Functions**:
  - `create_notification()`: Creates a new notification
  - `mark_notification_read()`: Marks a single notification as read
  - `mark_all_notifications_read()`: Marks all notifications as read for a user/admin

## After Running the Script

Once the table is created, the notification system will automatically start working:
- Admin will receive notifications for new orders
- Customers will receive notifications for order status changes
- Real-time notification counts will appear in the admin sidebar and navigation

## Verification

After running the script, refresh your admin dashboard. The notification bell should work without errors, and you should see "0" notifications (or the actual count if there are any).

