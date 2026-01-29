/**
 * Supabase Client for Western Pharmacy
 * Handles authentication with role-based access
 */

import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials from environment
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Only create client if credentials are provided
export const supabase = SUPABASE_URL && SUPABASE_ANON_KEY
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

export type UserRole = 'super_admin' | 'client';

export interface AuthUser {
    id: string;
    email: string;
    role: UserRole;
    pharmacyName?: string;
}

/**
 * Extract role from user metadata
 */
function getUserRole(userMetadata: Record<string, unknown> | undefined): UserRole {
    const role = userMetadata?.role;
    if (role === 'super_admin') return 'super_admin';
    return 'client'; // Default to client
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
        role: getUserRole(data.user.user_metadata),
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
        role: getUserRole(user.user_metadata),
        pharmacyName: user.user_metadata?.pharmacy_name
    };
}

/**
 * Subscribe to auth state changes
 */
export function onAuthStateChange(callback: (user: AuthUser | null) => void) {
    if (!supabase) {
        callback(null);
        return { unsubscribe: () => { } };
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
            callback({
                id: session.user.id,
                email: session.user.email || '',
                role: getUserRole(session.user.user_metadata),
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

/**
 * Check if user is super admin
 */
export function isSuperAdmin(user: AuthUser | null): boolean {
    return user?.role === 'super_admin';
}

/**
 * Check if current user's email is verified
 * Super admins and demo accounts are always considered verified
 */
export async function isEmailVerified(): Promise<boolean> {
    if (!supabase) return true; // No auth = skip verification

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return false;

    // Super admins are always verified
    if (user.user_metadata?.role === 'super_admin') return true;

    // Demo accounts skip verification (they might not have real emails)
    if (user.user_metadata?.is_demo === true) return true;

    // Check email_confirmed_at field
    return !!user.email_confirmed_at;
}

/**
 * Resend verification email to current user
 */
export async function resendVerificationEmail(): Promise<void> {
    if (!supabase) {
        throw new Error('Authentication not configured');
    }

    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.email) {
        throw new Error('No email address found');
    }

    // Use Supabase's resend method
    const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email
    });

    if (error) {
        throw new Error(error.message);
    }
}

/**
 * Refresh current session to check for updated verification status
 */
export async function refreshSession(): Promise<AuthUser | null> {
    if (!supabase) return null;

    const { data: { session }, error } = await supabase.auth.refreshSession();

    if (error || !session?.user) return null;

    return {
        id: session.user.id,
        email: session.user.email || '',
        role: getUserRole(session.user.user_metadata),
        pharmacyName: session.user.user_metadata?.pharmacy_name
    };
}
