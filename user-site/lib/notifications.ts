import { supabaseAdmin, isSupabaseConfigured } from './supabase'

export interface NotificationData {
  recipient_type: 'admin' | 'customer'
  notification_type: 'order_placed' | 'order_processing' | 'order_shipped' | 'order_delivered' | 'order_cancelled' | 'payment_received' | 'payment_failed' | 'order_updated' | 'tracking_updated'
  title: string
  message: string
  order_id?: string
  order_number?: string
  user_id?: string
  metadata?: Record<string, any>
}

/**
 * Create a notification in the database
 */
export async function createNotification(data: NotificationData): Promise<string | null> {
  if (!isSupabaseConfigured || !supabaseAdmin) {
    console.log('Database not configured, skipping notification creation')
    return null
  }

  try {
    const { data: notificationId, error } = await supabaseAdmin.rpc('create_notification', {
      p_recipient_type: data.recipient_type,
      p_notification_type: data.notification_type,
      p_title: data.title,
      p_message: data.message,
      p_order_id: data.order_id || null,
      p_order_number: data.order_number || null,
      p_user_id: data.user_id || null,
      p_metadata: data.metadata || {}
    })

    if (error) {
      console.error('Error creating notification:', error)
      return null
    }

    return notificationId
  } catch (error) {
    console.error('Exception creating notification:', error)
    return null
  }
}

/**
 * Create notifications for order status changes
 */
export async function createOrderNotifications(
  order: {
    id: string
    order_number: string
    customer_name: string
    customer_email: string
    status: string
    payment_status?: string
    tracking_number?: string
    customer_id?: string
    user_id?: string
  },
  previousStatus?: string
): Promise<void> {
  const notifications: NotificationData[] = []

  // Determine user_id for customer notifications
  const userId = order.user_id || order.customer_id || undefined

  // Order placed - notify admin
  if (!previousStatus || previousStatus === 'pending') {
    notifications.push({
      recipient_type: 'admin',
      notification_type: 'order_placed',
      title: 'New Order Received',
      message: `New order #${order.order_number} from ${order.customer_name} (${order.customer_email})`,
      order_id: order.id,
      order_number: order.order_number,
      metadata: {
        customer_name: order.customer_name,
        customer_email: order.customer_email
      }
    })

    // Also notify customer if they have a user account
    if (userId) {
      notifications.push({
        recipient_type: 'customer',
        notification_type: 'order_placed',
        title: 'Order Confirmed',
        message: `Your order #${order.order_number} has been received and is being processed.`,
        order_id: order.id,
        order_number: order.order_number,
        user_id: userId
      })
    }
  }

  // Status change notifications
  if (previousStatus && previousStatus !== order.status) {
    switch (order.status) {
      case 'processing':
        notifications.push({
          recipient_type: 'admin',
          notification_type: 'order_processing',
          title: 'Order Processing',
          message: `Order #${order.order_number} is now being processed.`,
          order_id: order.id,
          order_number: order.order_number
        })

        if (userId) {
          notifications.push({
            recipient_type: 'customer',
            notification_type: 'order_processing',
            title: 'Order Processing',
            message: `Your order #${order.order_number} is now being processed.`,
            order_id: order.id,
            order_number: order.order_number,
            user_id: userId
          })
        }
        break

      case 'shipped':
        notifications.push({
          recipient_type: 'admin',
          notification_type: 'order_shipped',
          title: 'Order Shipped',
          message: `Order #${order.order_number} has been shipped.`,
          order_id: order.id,
          order_number: order.order_number,
          metadata: {
            tracking_number: order.tracking_number
          }
        })

        if (userId) {
          notifications.push({
            recipient_type: 'customer',
            notification_type: 'order_shipped',
            title: 'Order Shipped!',
            message: `Your order #${order.order_number} has been shipped${order.tracking_number ? `. Tracking: ${order.tracking_number}` : ''}.`,
            order_id: order.id,
            order_number: order.order_number,
            user_id: userId,
            metadata: {
              tracking_number: order.tracking_number
            }
          })
        }
        break

      case 'delivered':
        notifications.push({
          recipient_type: 'admin',
          notification_type: 'order_delivered',
          title: 'Order Delivered',
          message: `Order #${order.order_number} has been delivered.`,
          order_id: order.id,
          order_number: order.order_number
        })

        if (userId) {
          notifications.push({
            recipient_type: 'customer',
            notification_type: 'order_delivered',
            title: 'Order Delivered!',
            message: `Your order #${order.order_number} has been delivered. Thank you for your purchase!`,
            order_id: order.id,
            order_number: order.order_number,
            user_id: userId
          })
        }
        break

      case 'cancelled':
        notifications.push({
          recipient_type: 'admin',
          notification_type: 'order_cancelled',
          title: 'Order Cancelled',
          message: `Order #${order.order_number} has been cancelled.`,
          order_id: order.id,
          order_number: order.order_number
        })

        if (userId) {
          notifications.push({
            recipient_type: 'customer',
            notification_type: 'order_cancelled',
            title: 'Order Cancelled',
            message: `Your order #${order.order_number} has been cancelled.`,
            order_id: order.id,
            order_number: order.order_number,
            user_id: userId
          })
        }
        break
    }
  }

  // Payment status change notifications
  if (order.payment_status === 'paid' && previousStatus !== 'paid') {
    notifications.push({
      recipient_type: 'admin',
      notification_type: 'payment_received',
      title: 'Payment Received',
      message: `Payment received for order #${order.order_number} from ${order.customer_name}.`,
      order_id: order.id,
      order_number: order.order_number,
      metadata: {
        customer_name: order.customer_name
      }
    })

    if (userId) {
      notifications.push({
        recipient_type: 'customer',
        notification_type: 'payment_received',
        title: 'Payment Confirmed',
        message: `Payment for order #${order.order_number} has been confirmed.`,
        order_id: order.id,
        order_number: order.order_number,
        user_id: userId
      })
    }
  }

  // Tracking number update
  if (order.tracking_number && previousStatus === 'shipped') {
    if (userId) {
      notifications.push({
        recipient_type: 'customer',
        notification_type: 'tracking_updated',
        title: 'Tracking Updated',
        message: `Tracking information for order #${order.order_number}: ${order.tracking_number}`,
        order_id: order.id,
        order_number: order.order_number,
        user_id: userId,
        metadata: {
          tracking_number: order.tracking_number
        }
      })
    }
  }

  // Create all notifications
  await Promise.all(notifications.map(notif => createNotification(notif)))
}

