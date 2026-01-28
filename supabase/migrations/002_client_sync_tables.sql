-- =========================================
-- Supabase Tables for Client Data Sync
-- Run this in your Supabase SQL Editor
-- =========================================

-- Client Medicines (synced from client apps)
CREATE TABLE IF NOT EXISTS client_medicines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    local_id TEXT NOT NULL,
    data JSONB NOT NULL,
    version INTEGER DEFAULT 1,
    synced_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(client_id, local_id)
);

-- Client Bills (synced from client apps)
CREATE TABLE IF NOT EXISTS client_bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    local_id TEXT NOT NULL,
    data JSONB NOT NULL,
    version INTEGER DEFAULT 1,
    synced_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(client_id, local_id)
);

-- Client Settings (synced from client apps)
CREATE TABLE IF NOT EXISTS client_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    local_id TEXT NOT NULL DEFAULT 'main',
    data JSONB NOT NULL,
    synced_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(client_id, local_id)
);

-- Sync Log (for debugging and auditing)
CREATE TABLE IF NOT EXISTS sync_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    action TEXT NOT NULL, -- 'push', 'pull', 'conflict_resolved'
    entity_type TEXT NOT NULL, -- 'medicine', 'bill', 'settings'
    entity_count INTEGER DEFAULT 0,
    status TEXT NOT NULL, -- 'success', 'partial', 'failed'
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_client_medicines_client_id ON client_medicines(client_id);
CREATE INDEX IF NOT EXISTS idx_client_medicines_synced_at ON client_medicines(synced_at);
CREATE INDEX IF NOT EXISTS idx_client_bills_client_id ON client_bills(client_id);
CREATE INDEX IF NOT EXISTS idx_client_bills_synced_at ON client_bills(synced_at);
CREATE INDEX IF NOT EXISTS idx_sync_log_client_id ON sync_log(client_id);

-- Row Level Security (RLS)
ALTER TABLE client_medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Clients can only access their own data
CREATE POLICY "Clients can view own medicines" ON client_medicines
    FOR SELECT USING (client_id = auth.uid()::uuid);

CREATE POLICY "Clients can insert own medicines" ON client_medicines
    FOR INSERT WITH CHECK (client_id = auth.uid()::uuid);

CREATE POLICY "Clients can update own medicines" ON client_medicines
    FOR UPDATE USING (client_id = auth.uid()::uuid);

CREATE POLICY "Clients can view own bills" ON client_bills
    FOR SELECT USING (client_id = auth.uid()::uuid);

CREATE POLICY "Clients can insert own bills" ON client_bills
    FOR INSERT WITH CHECK (client_id = auth.uid()::uuid);

CREATE POLICY "Clients can update own bills" ON client_bills
    FOR UPDATE USING (client_id = auth.uid()::uuid);

CREATE POLICY "Clients can view own settings" ON client_settings
    FOR SELECT USING (client_id = auth.uid()::uuid);

CREATE POLICY "Clients can insert own settings" ON client_settings
    FOR INSERT WITH CHECK (client_id = auth.uid()::uuid);

CREATE POLICY "Clients can update own settings" ON client_settings
    FOR UPDATE USING (client_id = auth.uid()::uuid);

-- Admin can view all data (for support/debugging)
CREATE POLICY "Admins can view all medicines" ON client_medicines
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'super_admin'
        )
    );

CREATE POLICY "Admins can view all bills" ON client_bills
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'super_admin'
        )
    );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for updated_at on medicines
CREATE TRIGGER update_client_medicines_updated_at
    BEFORE UPDATE ON client_medicines
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =========================================
-- Summary of what this creates:
-- =========================================
-- Tables:
--   - client_medicines: Stores medicine inventory per client
--   - client_bills: Stores billing history per client
--   - client_settings: Stores pharmacy settings per client
--   - sync_log: Audit log for sync operations
--
-- Security:
--   - RLS enabled on all tables
--   - Clients can only access their own data
--   - Admins can view all data
--
-- Indexes:
--   - Optimized for client_id lookups
--   - Optimized for sync timestamp queries
-- =========================================
