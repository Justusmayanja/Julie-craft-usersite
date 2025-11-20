-- =====================================================
-- NOTIFICATIONS TABLE
-- =====================================================
-- Stores in-app notifications for both admin and customers
-- related to order status changes and other events

CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID, -- NULL for admin notifications, user_id for customer notifications
    recipient_type VARCHAR(20) NOT NULL CHECK (recipient_type IN ('admin', 'customer')),
    notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN (
        'order_placed',
        'order_processing',
        'order_shipped',
        'order_delivered',
        'order_cancelled',
        'payment_received',
        'payment_failed',
        'order_updated',
        'tracking_updated'
    )),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    order_number VARCHAR(100),
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'::jsonb, -- Store additional data like tracking number, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_type ON notifications(recipient_type);
CREATE INDEX IF NOT EXISTS idx_notifications_order_id ON notifications(order_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_admin_unread ON notifications(recipient_type, is_read) WHERE recipient_type = 'admin' AND is_read = FALSE;

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
    p_recipient_type VARCHAR,
    p_notification_type VARCHAR,
    p_title VARCHAR,
    p_message TEXT,
    p_order_id UUID DEFAULT NULL,
    p_order_number VARCHAR DEFAULT NULL,
    p_user_id UUID DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
    v_notification_id UUID;
BEGIN
    INSERT INTO notifications (
        recipient_type,
        notification_type,
        title,
        message,
        order_id,
        order_number,
        user_id,
        metadata,
        created_at,
        updated_at
    ) VALUES (
        p_recipient_type,
        p_notification_type,
        p_title,
        p_message,
        p_order_id,
        p_order_number,
        p_user_id,
        p_metadata,
        NOW(),
        NOW()
    )
    RETURNING id INTO v_notification_id;
    
    RETURN v_notification_id;
END;
$$;

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(
    p_notification_id UUID,
    p_user_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE notifications
    SET 
        is_read = TRUE,
        read_at = NOW(),
        updated_at = NOW()
    WHERE id = p_notification_id
        AND (p_user_id IS NULL OR user_id = p_user_id OR recipient_type = 'admin');
    
    RETURN FOUND;
END;
$$;

-- Function to mark all notifications as read for a user
CREATE OR REPLACE FUNCTION mark_all_notifications_read(
    p_user_id UUID DEFAULT NULL,
    p_recipient_type VARCHAR DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    UPDATE notifications
    SET 
        is_read = TRUE,
        read_at = NOW(),
        updated_at = NOW()
    WHERE 
        is_read = FALSE
        AND (
            (p_user_id IS NOT NULL AND user_id = p_user_id)
            OR (p_recipient_type = 'admin' AND recipient_type = 'admin' AND user_id IS NULL)
        );
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$;

