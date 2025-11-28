-- =====================================================
-- CHAT SUPPORT TABLES
-- =====================================================
-- Run this script in your Supabase SQL Editor to create
-- the chat support tables for customer service
-- =====================================================

-- =====================================================
-- CHAT CONVERSATIONS TABLE
-- =====================================================
-- Stores chat conversations between customers and support staff
CREATE TABLE IF NOT EXISTS chat_conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    customer_name VARCHAR(255),
    customer_email VARCHAR(255),
    customer_phone VARCHAR(50),
    subject VARCHAR(255),
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'active', 'waiting', 'resolved', 'closed')),
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    assigned_to UUID REFERENCES auth.users(id), -- Support staff/admin
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_message_by UUID REFERENCES auth.users(id),
    unread_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb, -- Store additional data like order_id, product_id, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- CHAT MESSAGES TABLE
-- =====================================================
-- Stores individual messages within conversations
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES auth.users(id), -- NULL for system messages
    sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('customer', 'admin', 'system')),
    sender_name VARCHAR(255),
    message TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
    attachments JSONB DEFAULT '[]'::jsonb, -- Array of file URLs/metadata
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    is_edited BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================
-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_chat_conversations_user_id ON chat_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_status ON chat_conversations(status);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_assigned_to ON chat_conversations(assigned_to);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_last_message_at ON chat_conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_status_user ON chat_conversations(status, user_id);

CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_is_read ON chat_messages(is_read);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_created ON chat_messages(conversation_id, created_at DESC);

-- =====================================================
-- FUNCTIONS
-- =====================================================
-- Function to update conversation's last_message_at and unread_count
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE chat_conversations
    SET 
        last_message_at = NEW.created_at,
        last_message_by = NEW.sender_id,
        unread_count = CASE 
            WHEN NEW.sender_type = 'customer' AND assigned_to IS NOT NULL THEN unread_count + 1
            WHEN NEW.sender_type = 'admin' AND user_id IS NOT NULL THEN unread_count + 1
            ELSE unread_count
        END,
        status = CASE 
            WHEN status = 'closed' THEN 'open'
            WHEN status = 'resolved' THEN 'active'
            ELSE status
        END,
        updated_at = NOW()
    WHERE id = NEW.conversation_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update conversation when a message is inserted
CREATE TRIGGER trigger_update_conversation_on_message
    AFTER INSERT ON chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_on_message();

-- Function to mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_as_read(
    p_conversation_id UUID,
    p_user_id UUID
)
RETURNS void AS $$
BEGIN
    UPDATE chat_messages
    SET is_read = TRUE, read_at = NOW()
    WHERE conversation_id = p_conversation_id
        AND sender_id != p_user_id
        AND is_read = FALSE;
    
    UPDATE chat_conversations
    SET unread_count = 0
    WHERE id = p_conversation_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================
-- Enable RLS
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Policies for chat_conversations
-- Customers can view their own conversations
CREATE POLICY "Customers can view own conversations"
    ON chat_conversations FOR SELECT
    USING (auth.uid() = user_id);

-- Admins can view all conversations
CREATE POLICY "Admins can view all conversations"
    ON chat_conversations FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_admin = TRUE
        )
    );

-- Customers can create their own conversations
CREATE POLICY "Customers can create own conversations"
    ON chat_conversations FOR INSERT
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Admins can update conversations
CREATE POLICY "Admins can update conversations"
    ON chat_conversations FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_admin = TRUE
        )
    );

-- Policies for chat_messages
-- Users can view messages in their conversations
CREATE POLICY "Users can view messages in own conversations"
    ON chat_messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM chat_conversations
            WHERE chat_conversations.id = chat_messages.conversation_id
            AND (
                chat_conversations.user_id = auth.uid()
                OR chat_conversations.assigned_to = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM profiles
                    WHERE profiles.id = auth.uid()
                    AND profiles.is_admin = TRUE
                )
            )
        )
    );

-- Users can insert messages in their conversations
CREATE POLICY "Users can insert messages in own conversations"
    ON chat_messages FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM chat_conversations
            WHERE chat_conversations.id = chat_messages.conversation_id
            AND (
                chat_conversations.user_id = auth.uid()
                OR chat_conversations.assigned_to = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM profiles
                    WHERE profiles.id = auth.uid()
                    AND profiles.is_admin = TRUE
                )
            )
        )
    );

-- Users can update their own messages
CREATE POLICY "Users can update own messages"
    ON chat_messages FOR UPDATE
    USING (sender_id = auth.uid());

