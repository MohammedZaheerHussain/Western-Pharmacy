/**
 * Email Verification Gate Component
 * Blocks access to the app until email is verified
 */

import { useState, useEffect } from 'react';
import { Mail, RefreshCw, LogOut, CheckCircle, AlertCircle } from 'lucide-react';
import { resendVerificationEmail, refreshSession, signOut, AuthUser } from '../services/auth';

interface EmailVerificationGateProps {
    user: AuthUser;
    onVerified: () => void;
    onLogout: () => void;
}

export function EmailVerificationGate({ user, onVerified, onLogout }: EmailVerificationGateProps) {
    const [sending, setSending] = useState(false);
    const [checking, setChecking] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [countdown, setCountdown] = useState(0);

    // Countdown timer for resend button
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    // Auto-check verification status every 10 seconds
    useEffect(() => {
        const interval = setInterval(async () => {
            await checkVerification(true); // Silent check
        }, 10000);

        return () => clearInterval(interval);
    }, []);

    const handleResendEmail = async () => {
        setSending(true);
        setError('');
        setMessage('');

        try {
            await resendVerificationEmail();
            setMessage('Verification email sent! Check your inbox.');
            setCountdown(60); // 60 second cooldown
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to send email');
        } finally {
            setSending(false);
        }
    };

    const checkVerification = async (silent = false) => {
        if (!silent) setChecking(true);
        setError('');

        try {
            const refreshedUser = await refreshSession();
            if (refreshedUser) {
                // Re-check by getting fresh user data
                const { isEmailVerified } = await import('../services/auth');
                const verified = await isEmailVerified();
                if (verified) {
                    onVerified();
                    return;
                }
            }

            if (!silent) {
                setError('Email not verified yet. Please check your inbox.');
            }
        } catch (err) {
            if (!silent) {
                setError(err instanceof Error ? err.message : 'Failed to check status');
            }
        } finally {
            if (!silent) setChecking(false);
        }
    };

    const handleLogout = async () => {
        await signOut();
        onLogout();
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
            <div className="max-w-md w-full">
                {/* Card */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
                    {/* Icon */}
                    <div className="w-20 h-20 mx-auto mb-6 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
                        <Mail className="w-10 h-10 text-amber-600 dark:text-amber-400" />
                    </div>

                    {/* Title */}
                    <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-gray-100 mb-2">
                        Verify Your Email
                    </h1>
                    <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
                        We've sent a verification link to:
                    </p>

                    {/* Email Display */}
                    <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-3 mb-6 text-center">
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                            {user.email}
                        </span>
                    </div>

                    {/* Instructions */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-3 mb-6">
                        <p className="text-sm text-blue-800 dark:text-blue-300">
                            <strong>Next steps:</strong>
                            <br />1. Check your email inbox (and spam folder)
                            <br />2. Click the verification link
                            <br />3. Come back here and click "I've Verified"
                        </p>
                    </div>

                    {/* Success/Error Messages */}
                    {message && (
                        <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-4 py-3 mb-4 text-green-700 dark:text-green-400">
                            <CheckCircle size={18} />
                            {message}
                        </div>
                    )}

                    {error && (
                        <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3 mb-4 text-red-700 dark:text-red-400">
                            <AlertCircle size={18} />
                            {error}
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="space-y-3">
                        {/* Check Verification */}
                        <button
                            onClick={() => checkVerification(false)}
                            disabled={checking}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-lg font-semibold
                                     hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-200 transition-all
                                     disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {checking ? (
                                <>
                                    <RefreshCw size={18} className="animate-spin" />
                                    Checking...
                                </>
                            ) : (
                                <>
                                    <CheckCircle size={18} />
                                    I've Verified My Email
                                </>
                            )}
                        </button>

                        {/* Resend Email */}
                        <button
                            onClick={handleResendEmail}
                            disabled={sending || countdown > 0}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium
                                     hover:bg-gray-200 dark:hover:bg-gray-600 transition-all
                                     disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {sending ? (
                                <>
                                    <RefreshCw size={18} className="animate-spin" />
                                    Sending...
                                </>
                            ) : countdown > 0 ? (
                                <>Resend Email ({countdown}s)</>
                            ) : (
                                <>
                                    <Mail size={18} />
                                    Resend Verification Email
                                </>
                            )}
                        </button>
                    </div>

                    {/* Divider */}
                    <div className="my-6 border-t border-gray-200 dark:border-gray-700" />

                    {/* Logout */}
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                    >
                        <LogOut size={16} />
                        Sign out and use different account
                    </button>
                </div>

                {/* Auto-check note */}
                <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-4">
                    We'll automatically detect when you verify your email
                </p>
            </div>
        </div>
    );
}
