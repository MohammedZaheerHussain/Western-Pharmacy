/**
 * Supabase Client for Western Pharmacy (Billing App)
 * Handles client authentication
 */

import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials from environment
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Only create client if credentials are provided
export const supabase = SUPABASE_URL && SUPABASE_ANON_KEY
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

export interface AuthUser {
    id: string;
    email: string;
    pharmacyName?: string;
}

/**
 * Sign in with email and password
 */
export async function signIn(email: string, password: string): Promise<AuthUser> {
    if (!supabase) {
        throw new Error('Authentication not configured');
    }

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        throw new Error(error.message);
    }

    if (!data.user) {
        throw new Error('Login failed');
    }

    return {
        id: data.user.id,
        email: data.user.email || email,
        pharmacyName: data.user.user_metadata?.pharmacy_name
    };
}

/**
 * Sign out current user
 */
export async function signOut(): Promise<void> {
    if (!supabase) return;

    const { error } = await supabase.auth.signOut();
    if (error) {
        throw new Error(error.message);
    }
}

/**
 * Get current authenticated user
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
    if (!supabase) return null;

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    return {
        id: user.id,
        email: user.email || '',
        pharmacyName: user.user_metadata?.pharmacy_name
    };
}

/**
 * Subscribe to auth state changes
 */
export function onAuthStateChange(callback: (user: AuthUser | null) => void) {
    if (!supabase) {
        // If no auth configured, callback with null immediately
        callback(null);
        return { unsubscribe: () => { } };
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
            callback({
                id: session.user.id,
                email: session.user.email || '',
                pharmacyName: session.user.user_metadata?.pharmacy_name
            });
        } else {
            callback(null);
        }
    });

    return { unsubscribe: () => subscription.unsubscribe() };
}

/**
 * Check if authentication is configured
 */
export function isAuthEnabled(): boolean {
    return !!supabase;
}
