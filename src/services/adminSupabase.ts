/**
 * Supabase Client Configuration
 * 
 * IMPORTANT: Replace these with your actual Supabase project credentials
 * Get these from: https://supabase.com/dashboard/project/{your-project}/settings/api
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// TODO: Replace with your actual Supabase URL and anon key
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://YOUR_PROJECT.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_ANON_KEY';
const SUPABASE_SERVICE_ROLE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';

export const supabase = createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Admin client with service role - for creating users without email verification
// WARNING: Only use on server-side or protected admin routes
const supabaseAdmin = SUPABASE_SERVICE_ROLE_KEY
    ? createSupabaseClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })
    : null;

// ============ AUTH ============

export async function signInWithEmail(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });
    if (error) throw error;
    return data;
}

export async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
}

export async function getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

// ============ CLIENTS ============

export interface ClientInput {
    pharmacy_name: string;
    owner_name?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    gst_number?: string;
    dl_number_1?: string;
    dl_number_2?: string;
    plan_id: string;
}

export interface ClientCreateResult {
    client: Record<string, unknown>;
    credentials: {
        email: string;
        password: string;
    };
}

/** Generate a secure random password */
function generatePassword(pharmacyName: string): string {
    // Format: PharmacyName@Year+Random
    const cleanName = pharmacyName.replace(/\s+/g, '').slice(0, 8);
    const year = new Date().getFullYear();
    const random = Math.random().toString(36).slice(-4).toUpperCase();
    return `${cleanName}@${year}${random}`;
}

export async function createPharmacyClient(input: ClientInput, created_by: string): Promise<ClientCreateResult> {
    // Validate email is provided (required for login)
    if (!input.email) {
        throw new Error('Email is required for client login');
    }

    // Generate client ID and password
    const clientId = await generateClientId();
    const password = generatePassword(input.pharmacy_name);

    let userId: string | undefined;

    // Check if this is a demo account
    const isDemoAccount = input.plan_id === 'demo_3day';

    // Step 1: Create auth user for client login
    // Use admin API when available (skips email verification)
    // This is preferred for admin-created accounts as clients get credentials directly
    if (supabaseAdmin) {
        // Use admin API to create user WITHOUT email verification
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: input.email,
            password: password,
            email_confirm: true, // Skip email verification - admin creates account directly
            user_metadata: {
                role: 'client',
                pharmacy_name: input.pharmacy_name,
                is_demo: isDemoAccount,
                plan_type: input.plan_id
            }
        });

        if (authError) {
            throw new Error(`Failed to create login: ${authError.message}`);
        }
        userId = authData.user?.id;
    } else {
        // Fallback: Use regular signUp (requires email verification)
        // This path is only used if service role key is NOT configured
        console.warn('[AdminSupabase] Service role key not configured - using signUp (requires email verification)');
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: input.email,
            password: password,
            options: {
                data: {
                    role: 'client',
                    pharmacy_name: input.pharmacy_name,
                    is_demo: isDemoAccount,
                    plan_type: input.plan_id
                }
            }
        });

        if (authError) {
            throw new Error(`Failed to create login: ${authError.message}`);
        }
        userId = authData.user?.id;
    }

    // Step 2: Lookup plan UUID by name (since input.plan_id is the plan name, not UUID)
    const { data: planData, error: planError } = await supabase
        .from('plans')
        .select('id')
        .eq('name', input.plan_id)
        .single();

    if (planError || !planData) {
        // Cleanup auth user if plan not found
        if (supabaseAdmin && userId) {
            await supabaseAdmin.auth.admin.deleteUser(userId).catch(() => { });
        }
        throw new Error(`Invalid plan: ${input.plan_id}`);
    }

    // Step 3: Create client record in database with actual plan UUID
    const { data, error } = await supabase
        .from('clients')
        .insert({
            pharmacy_name: input.pharmacy_name,
            owner_name: input.owner_name,
            email: input.email,
            phone: input.phone,
            address: input.address,
            city: input.city,
            state: input.state,
            pincode: input.pincode,
            gst_number: input.gst_number,
            dl_number_1: input.dl_number_1,
            dl_number_2: input.dl_number_2,
            plan_id: planData.id, // Use the actual UUID, not the name!
            client_id: clientId,
            user_id: userId,
            created_by,
            status: 'active'
        })
        .select()
        .single();

    if (error) {
        // Cleanup: If client creation fails, try to delete the auth user
        if (supabaseAdmin && userId) {
            await supabaseAdmin.auth.admin.deleteUser(userId).catch(() => { });
        }
        throw new Error(`Failed to create client: ${error.message}`);
    }

    return {
        client: data,
        credentials: {
            email: input.email,
            password: password
        }
    };
}

export async function getAllClients() {
    const { data, error } = await supabase
        .from('clients')
        .select(`
            *,
            plans (*)
        `)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
}

export async function getClientById(id: string) {
    const { data, error } = await supabase
        .from('clients')
        .select(`
            *,
            plans (*),
            licenses (*),
            branding (*)
        `)
        .eq('id', id)
        .single();

    if (error) throw error;
    return data;
}

export async function updateClientStatus(id: string, status: 'active' | 'expired' | 'suspended') {
    const { data, error } = await supabase
        .from('clients')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

async function generateClientId(): Promise<string> {
    // Format: BILLOVA-XXX where XXX is incremental
    const { data } = await supabase
        .from('clients')
        .select('client_id')
        .order('created_at', { ascending: false })
        .limit(1);

    let nextNum = 1;
    if (data && data.length > 0) {
        const lastId = data[0].client_id;
        const match = lastId.match(/BILLOVA-(\d+)/);
        if (match) {
            nextNum = parseInt(match[1], 10) + 1;
        }
    }

    return `BILLOVA-${String(nextNum).padStart(3, '0')}`;
}

// ============ LICENSES ============

export interface LicenseInput {
    client_id: string;
    duration: '6_months' | '1_year' | 'lifetime';
}

export async function createLicense(input: LicenseInput) {
    const licenseKey = generateLicenseKey();
    const now = new Date();
    let expiresAt: string | null = null;

    if (input.duration === '6_months') {
        const expiry = new Date(now);
        expiry.setMonth(expiry.getMonth() + 6);
        expiresAt = expiry.toISOString();
    } else if (input.duration === '1_year') {
        const expiry = new Date(now);
        expiry.setFullYear(expiry.getFullYear() + 1);
        expiresAt = expiry.toISOString();
    }
    // lifetime = null expires_at

    const { data, error } = await supabase
        .from('licenses')
        .insert({
            client_id: input.client_id,
            license_key: licenseKey,
            duration: input.duration,
            starts_at: now.toISOString(),
            expires_at: expiresAt,
            is_active: true
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function getLicensesByClientId(clientId: string) {
    const { data, error } = await supabase
        .from('licenses')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
}

export async function revokeLicense(licenseId: string) {
    const { data, error } = await supabase
        .from('licenses')
        .update({ is_active: false })
        .eq('id', licenseId)
        .select()
        .single();

    if (error) throw error;
    return data;
}

function generateLicenseKey(): string {
    // Format: BM-XXXX-XXXX-XXXX
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars
    const segments = [];

    for (let s = 0; s < 3; s++) {
        let segment = '';
        for (let i = 0; i < 4; i++) {
            segment += chars[Math.floor(Math.random() * chars.length)];
        }
        segments.push(segment);
    }

    return `BM-${segments.join('-')}`;
}

// ============ PLANS ============

export async function getAllPlans() {
    const { data, error } = await supabase
        .from('plans')
        .select('*')
        .order('name');

    if (error) throw error;
    return data;
}

// ============ BRANDING ============

export interface BrandingInput {
    client_id: string;
    app_name: string;
    logo_url?: string;
    primary_color?: string;
    invoice_header?: string;
    invoice_footer?: string;
    tagline?: string;
    watermark?: string;
}

export async function upsertBranding(input: BrandingInput) {
    const { data, error } = await supabase
        .from('branding')
        .upsert({
            ...input,
            updated_at: new Date().toISOString()
        }, {
            onConflict: 'client_id'
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function getBrandingByClientId(clientId: string) {
    const { data, error } = await supabase
        .from('branding')
        .select('*')
        .eq('client_id', clientId)
        .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
    return data;
}

// ============ LICENSE VALIDATION (for desktop app) ============

export async function validateLicense(licenseKey: string) {
    // Get license with client and plan info
    const { data: license, error: licenseError } = await supabase
        .from('licenses')
        .select(`
            *,
            clients (
                *,
                plans (*)
            )
        `)
        .eq('license_key', licenseKey)
        .eq('is_active', true)
        .single();

    if (licenseError || !license) {
        return { valid: false, error: 'Invalid license key' };
    }

    const client = license.clients;
    if (!client || client.status !== 'active') {
        return { valid: false, error: 'Client account is not active' };
    }

    // Check expiry
    if (license.expires_at) {
        const expiryDate = new Date(license.expires_at);
        if (expiryDate < new Date()) {
            return { valid: false, error: 'License has expired', expired: true };
        }
    }

    // Get branding
    const branding = await getBrandingByClientId(client.id);

    // Update last validated timestamp
    await supabase
        .from('licenses')
        .update({ last_validated_at: new Date().toISOString() })
        .eq('id', license.id);

    // Calculate days remaining
    let daysRemaining: number | null = null;
    if (license.expires_at) {
        const expiry = new Date(license.expires_at);
        const now = new Date();
        daysRemaining = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    }

    return {
        valid: true,
        client,
        license,
        branding,
        features: client.plans?.features,
        plan_name: client.plans?.name,
        days_remaining: daysRemaining
    };
}

// ============ STATS ============

export async function getDashboardStats() {
    const [clientsResult, activeResult, expiredResult] = await Promise.all([
        supabase.from('clients').select('id', { count: 'exact', head: true }),
        supabase.from('clients').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('clients').select('id', { count: 'exact', head: true }).eq('status', 'expired')
    ]);

    return {
        total: clientsResult.count || 0,
        active: activeResult.count || 0,
        expired: expiredResult.count || 0
    };
}
