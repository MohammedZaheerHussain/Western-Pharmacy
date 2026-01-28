/**
 * LoginPage - Client login for Western Pharmacy billing app
 */

import { useState } from 'react';
import { Pill, LogIn, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { signIn } from '../services/auth';

interface LoginPageProps {
    onLogin: () => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!email.trim() || !password.trim()) {
            setError('Please enter email and password');
            return;
        }

        setLoading(true);
        try {
            await signIn(email, password);
            onLogin();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 
                      flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo/Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 
                                  bg-white rounded-2xl shadow-lg mb-4">
                        <Pill className="text-blue-600" size={32} />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">
                        Billova Medical Billing
                    </h1>
                    <p className="text-blue-200">
                        Sign in to access your pharmacy dashboard
                    </p>
                </div>

                {/* Login Form */}
                <div className="bg-white rounded-2xl shadow-2xl p-8">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Error Message */}
                        {error && (
                            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 
                                          rounded-lg text-red-700 text-sm">
                                <AlertCircle size={18} />
                                {error}
                            </div>
                        )}

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg 
                                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                                         transition-all text-gray-900"
                                placeholder="pharmacy@example.com"
                                autoComplete="email"
                                autoFocus
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg 
                                             focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                                             transition-all text-gray-900 pr-12"
                                    placeholder="Enter your password"
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 
                                             p-1 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold
                                     hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 
                                     transition-all disabled:opacity-50 disabled:cursor-not-allowed
                                     flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent 
                                                  rounded-full animate-spin" />
                                    Signing in...
                                </>
                            ) : (
                                <>
                                    <LogIn size={20} />
                                    Sign In
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Footer */}
                <p className="text-center text-blue-200 text-sm mt-6">
                    Contact your pharmacy admin if you forgot your password
                </p>

                {/* Powered By */}
                <p className="text-center text-blue-300/50 text-xs mt-4">
                    Powered by Billova Medical
                </p>
            </div>
        </div>
    );
}
