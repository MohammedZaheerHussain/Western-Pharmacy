-- =====================================================
-- CLIENT DATA SYNC TABLES - RUN IN SUPABASE SQL EDITOR
-- =====================================================
-- URL: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql
--
-- This migration creates tables for storing pharmacy client data
-- Each pharmacy's data is isolated by their user ID (client_id)
-- 
-- IMPORTANT: This is an ADDITIVE migration - it will NOT affect
-- any existing data. It only creates new tables if they don't exist.
-- =====================================================

-- 1. Client Medicines Table
-- Stores medicine inventory for each pharmacy
CREATE TABLE IF NOT EXISTS client_medicines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    local_id TEXT NOT NULL,
    data JSONB NOT NULL,
    synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(client_id, local_id)
);

-- 2. Client Bills Table
-- Stores billing history for each pharmacy
CREATE TABLE IF NOT EXISTS client_bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    local_id TEXT NOT NULL,
    data JSONB NOT NULL,
    synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(client_id, local_id)
);

-- 3. Client Settings Table (optional)
-- Stores app settings for each pharmacy
CREATE TABLE IF NOT EXISTS client_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    local_id TEXT NOT NULL,
    data JSONB NOT NULL,
    synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(client_id, local_id)
);

-- =====================================================
-- ROW LEVEL SECURITY - CRITICAL FOR DATA ISOLATION
-- Each pharmacy can ONLY see/modify their own data
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE client_medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_settings ENABLE ROW LEVEL SECURITY;

-- Medicines: Users can only access their own medicines
DROP POLICY IF EXISTS "Users can view own medicines" ON client_medicines;
CREATE POLICY "Users can view own medicines" ON client_medicines
    FOR SELECT USING (auth.uid() = client_id);

DROP POLICY IF EXISTS "Users can insert own medicines" ON client_medicines;
CREATE POLICY "Users can insert own medicines" ON client_medicines
    FOR INSERT WITH CHECK (auth.uid() = client_id);

DROP POLICY IF EXISTS "Users can update own medicines" ON client_medicines;
CREATE POLICY "Users can update own medicines" ON client_medicines
    FOR UPDATE USING (auth.uid() = client_id);

-- Bills: Users can only access their own bills
DROP POLICY IF EXISTS "Users can view own bills" ON client_bills;
CREATE POLICY "Users can view own bills" ON client_bills
    FOR SELECT USING (auth.uid() = client_id);

DROP POLICY IF EXISTS "Users can insert own bills" ON client_bills;
CREATE POLICY "Users can insert own bills" ON client_bills
    FOR INSERT WITH CHECK (auth.uid() = client_id);

DROP POLICY IF EXISTS "Users can update own bills" ON client_bills;
CREATE POLICY "Users can update own bills" ON client_bills
    FOR UPDATE USING (auth.uid() = client_id);

-- Settings: Users can only access their own settings
DROP POLICY IF EXISTS "Users can view own settings" ON client_settings;
CREATE POLICY "Users can view own settings" ON client_settings
    FOR SELECT USING (auth.uid() = client_id);

DROP POLICY IF EXISTS "Users can insert own settings" ON client_settings;
CREATE POLICY "Users can insert own settings" ON client_settings
    FOR INSERT WITH CHECK (auth.uid() = client_id);

DROP POLICY IF EXISTS "Users can update own settings" ON client_settings;
CREATE POLICY "Users can update own settings" ON client_settings
    FOR UPDATE USING (auth.uid() = client_id);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_client_medicines_client_id ON client_medicines(client_id);
CREATE INDEX IF NOT EXISTS idx_client_medicines_local_id ON client_medicines(client_id, local_id);
CREATE INDEX IF NOT EXISTS idx_client_bills_client_id ON client_bills(client_id);
CREATE INDEX IF NOT EXISTS idx_client_bills_local_id ON client_bills(client_id, local_id);
CREATE INDEX IF NOT EXISTS idx_client_settings_client_id ON client_settings(client_id);

-- =====================================================
-- VERIFY TABLES CREATED
-- =====================================================

SELECT 'client_medicines' as table_name, count(*) as row_count FROM client_medicines
UNION ALL
SELECT 'client_bills', count(*) FROM client_bills
UNION ALL
SELECT 'client_settings', count(*) FROM client_settings;
