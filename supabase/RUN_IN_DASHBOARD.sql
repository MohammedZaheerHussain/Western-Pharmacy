-- Run this SQL in your Supabase Dashboard SQL Editor
-- URL: https://supabase.com/dashboard/project/kztprknzpjlkvbfuabgt/sql

-- Step 1: Create plans table
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

-- Step 2: Enable RLS
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

-- Step 3: Allow anyone to read plans
DROP POLICY IF EXISTS "Anyone can read plans" ON plans;
CREATE POLICY "Anyone can read plans" ON plans FOR SELECT USING (true);

-- Step 4: Insert all plans
INSERT INTO plans (name, display_name, tier, features, price_yearly, price_lifetime) VALUES 
('demo_3day', 'Demo (3 Days)', 'basic', '["Basic features"]', 0, 0),
('demo_basic_3day', 'Demo Basic', 'basic', '["Basic features"]', 0, 0),
('demo_pro_3day', 'Demo Pro', 'pro', '["Pro features"]', 0, 0),
('demo_premium_3day', 'Demo Premium', 'premium', '["Premium features"]', 0, 0),
('basic_yearly', 'Basic (1 Year)', 'basic', '["Inventory", "Billing"]', 1000, 5000),
('pro_yearly', 'Pro (1 Year)', 'pro', '["All Basic + Reports"]', 2000, 7000),
('premium_yearly', 'Premium (1 Year)', 'premium', '["All features"]', 3000, 10000),
('basic_lifetime', 'Basic Lifetime', 'basic', '["Inventory", "Billing"]', 1000, 5000),
('pro_lifetime', 'Pro Lifetime', 'pro', '["All Basic + Reports"]', 2000, 7000),
('premium_lifetime', 'Premium Lifetime', 'premium', '["All features"]', 3000, 10000)
ON CONFLICT (name) DO NOTHING;

-- Step 5: Verify
SELECT * FROM plans;
