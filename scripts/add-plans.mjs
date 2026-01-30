/**
 * Script to add missing plans to Supabase
 * Run with: node scripts/add-plans.mjs
 */

import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials from environment
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://pbuqzfrffquziystkvcy.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Error: VITE_SUPABASE_SERVICE_ROLE_KEY environment variable is required');
    console.log('Run with: VITE_SUPABASE_SERVICE_ROLE_KEY=your_key node scripts/add-plans.mjs');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const plans = [
    // Demo plans
    { name: 'demo_3day', display_name: 'Demo (3 Days)', tier: 'basic', features: ['Basic features', '3-day trial'], price_yearly: 0, price_lifetime: 0 },
    { name: 'demo_basic_3day', display_name: 'Demo Basic (3 Days)', tier: 'basic', features: ['Basic features', '3-day trial'], price_yearly: 0, price_lifetime: 0 },
    { name: 'demo_pro_3day', display_name: 'Demo Pro (3 Days)', tier: 'pro', features: ['Pro features', '3-day trial'], price_yearly: 0, price_lifetime: 0 },
    { name: 'demo_premium_3day', display_name: 'Demo Premium (3 Days)', tier: 'premium', features: ['Premium features', '3-day trial'], price_yearly: 0, price_lifetime: 0 },

    // Yearly plans
    { name: 'basic_yearly', display_name: 'Basic (1 Year)', tier: 'basic', features: ['Inventory', 'Billing', 'Basic Reports', 'GST Invoice'], price_yearly: 1000, price_lifetime: 5000 },
    { name: 'pro_yearly', display_name: 'Professional (1 Year)', tier: 'pro', features: ['All Basic features', 'Advanced Reports', 'Purchases', 'Suppliers', 'Barcode', 'WhatsApp'], price_yearly: 2000, price_lifetime: 7000 },
    { name: 'premium_yearly', display_name: 'Premium (1 Year)', tier: 'premium', features: ['All Pro features', 'Multi-User', 'Staff Management', 'Activity Logs', 'Settlement', 'Customer Loyalty'], price_yearly: 3000, price_lifetime: 10000 },

    // Lifetime plans
    { name: 'basic_lifetime', display_name: 'Basic (Lifetime)', tier: 'basic', features: ['Inventory', 'Billing', 'Basic Reports', 'GST Invoice'], price_yearly: 1000, price_lifetime: 5000 },
    { name: 'pro_lifetime', display_name: 'Professional (Lifetime)', tier: 'pro', features: ['All Basic features', 'Advanced Reports', 'Purchases', 'Suppliers', 'Barcode', 'WhatsApp'], price_yearly: 2000, price_lifetime: 7000 },
    { name: 'premium_lifetime', display_name: 'Premium (Lifetime)', tier: 'premium', features: ['All Pro features', 'Multi-User', 'Staff Management', 'Activity Logs', 'Settlement', 'Customer Loyalty'], price_yearly: 3000, price_lifetime: 10000 },
];

async function main() {
    console.log('🚀 Adding plans to Supabase...\n');

    // First, check existing plans
    const { data: existing, error: fetchError } = await supabase
        .from('plans')
        .select('name');

    if (fetchError) {
        console.error('Error fetching existing plans:', fetchError.message);
        process.exit(1);
    }

    const existingNames = new Set(existing?.map(p => p.name) || []);
    console.log('📋 Existing plans:', existingNames.size > 0 ? [...existingNames].join(', ') : 'none');

    // Filter out existing plans
    const newPlans = plans.filter(p => !existingNames.has(p.name));

    if (newPlans.length === 0) {
        console.log('\n✅ All plans already exist!');
        return;
    }

    console.log(`\n📝 Adding ${newPlans.length} new plans...`);

    for (const plan of newPlans) {
        const { error } = await supabase
            .from('plans')
            .insert(plan);

        if (error) {
            console.error(`  ❌ ${plan.name}: ${error.message}`);
        } else {
            console.log(`  ✅ ${plan.name}: added`);
        }
    }

    console.log('\n🎉 Done!');
}

main().catch(console.error);
