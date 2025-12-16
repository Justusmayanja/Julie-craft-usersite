-- =====================================================
-- CONTACT MESSAGES TABLE MIGRATION
-- =====================================================
-- Run this script in your Supabase SQL Editor to create
-- the contact_messages table for storing contact form submissions
-- =====================================================

CREATE TABLE IF NOT EXISTS contact_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    subject VARCHAR(255) DEFAULT 'General Inquiry',
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied', 'archived')),
    admin_notes TEXT,
    replied_at TIMESTAMP WITH TIME ZONE,
    replied_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_contact_messages_email ON contact_messages(email);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_messages_new ON contact_messages(status) WHERE status = 'new';

-- Enable Row Level Security (RLS)
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can view contact messages
CREATE POLICY "Admins can view all contact messages"
    ON contact_messages
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.role = 'admin' OR profiles.role = 'super_admin' OR profiles.is_admin = true)
        )
    );

-- Policy: Anyone can insert contact messages (for public contact form)
CREATE POLICY "Anyone can insert contact messages"
    ON contact_messages
    FOR INSERT
    WITH CHECK (true);

-- Policy: Only admins can update contact messages
CREATE POLICY "Admins can update contact messages"
    ON contact_messages
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.role = 'admin' OR profiles.role = 'super_admin' OR profiles.is_admin = true)
        )
    );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_contact_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_contact_messages_timestamp
    BEFORE UPDATE ON contact_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_contact_messages_updated_at();
