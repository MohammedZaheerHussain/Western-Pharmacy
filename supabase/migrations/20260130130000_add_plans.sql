-- Create plans table if it doesn't exist
CREATE TABLE IF NOT EXISTS plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    tier TEXT NOT NULL CHECK (tier IN ('basic', 'pro', 'premium')),
    features JSONB DEFAULT '[]',
    price_yearly INTEGER DEFAULT 0,
    price_lifetime INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on name for fast lookups
CREATE INDEX IF NOT EXISTS plans_name_idx ON plans(name);

-- Demo plans
INSERT INTO plans (name, display_name, tier, features, price_yearly, price_lifetime)
VALUES 
    ('demo_3day', 'Demo (3 Days)', 'basic', '["Basic features", "3-day trial"]', 0, 0),
    ('demo_basic_3day', 'Demo Basic (3 Days)', 'basic', '["Basic features", "3-day trial"]', 0, 0),
    ('demo_pro_3day', 'Demo Pro (3 Days)', 'pro', '["Pro features", "3-day trial"]', 0, 0),
    ('demo_premium_3day', 'Demo Premium (3 Days)', 'premium', '["Premium features", "3-day trial"]', 0, 0)
ON CONFLICT (name) DO NOTHING;

-- Yearly plans
INSERT INTO plans (name, display_name, tier, features, price_yearly, price_lifetime)
VALUES 
    ('basic_yearly', 'Basic (1 Year)', 'basic', '["Inventory", "Billing", "Basic Reports", "GST Invoice"]', 1000, 5000),
    ('pro_yearly', 'Professional (1 Year)', 'pro', '["All Basic features", "Advanced Reports", "Purchases", "Suppliers", "Barcode", "WhatsApp"]', 2000, 7000),
    ('premium_yearly', 'Premium (1 Year)', 'premium', '["All Pro features", "Multi-User", "Staff Management", "Activity Logs", "Settlement", "Customer Loyalty"]', 3000, 10000)
ON CONFLICT (name) DO NOTHING;

-- Lifetime plans
INSERT INTO plans (name, display_name, tier, features, price_yearly, price_lifetime)
VALUES 
    ('basic_lifetime', 'Basic (Lifetime)', 'basic', '["Inventory", "Billing", "Basic Reports", "GST Invoice"]', 1000, 5000),
    ('pro_lifetime', 'Professional (Lifetime)', 'pro', '["All Basic features", "Advanced Reports", "Purchases", "Suppliers", "Barcode", "WhatsApp"]', 2000, 7000),
    ('premium_lifetime', 'Premium (Lifetime)', 'premium', '["All Pro features", "Multi-User", "Staff Management", "Activity Logs", "Settlement", "Customer Loyalty"]', 3000, 10000)
ON CONFLICT (name) DO NOTHING;
