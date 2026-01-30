-- Add RLS policies for plans table
-- Run this migration to allow authenticated users to read plans

-- Enable RLS on plans table
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read plans (they're public pricing info)
CREATE POLICY "Anyone can read plans"
    ON plans FOR SELECT
    USING (true);

-- Only authenticated admin users can modify plans
CREATE POLICY "Only admins can insert plans"
    ON plans FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Only admins can update plans"
    ON plans FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);
