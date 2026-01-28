/**
 * Create Client Page - With proper Tailwind styling
 */

import { useState } from 'react';
import { ArrowLeft, Save, Copy, Check, Key } from 'lucide-react';
import { createPharmacyClient, getCurrentUser, ClientCreateResult } from '../../services/adminSupabase';

interface CreateClientProps {
    onBack: () => void;
    onSuccess: () => void;
}

export default function CreateClient({ onBack, onSuccess }: CreateClientProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [credentials, setCredentials] = useState<ClientCreateResult['credentials'] | null>(null);
    const [copied, setCopied] = useState<'email' | 'password' | null>(null);

    const [form, setForm] = useState({
        pharmacy_name: '',
        owner_name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        gst_number: '',
        dl_number_1: '',
        dl_number_2: '',
        plan_id: ''
    });

    const handleChange = (field: string, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const handleCopy = async (text: string, type: 'email' | 'password') => {
        await navigator.clipboard.writeText(text);
        setCopied(type);
        setTimeout(() => setCopied(null), 2000);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!form.pharmacy_name.trim()) {
            setError('Pharmacy name is required');
            return;
        }
        if (!form.email.trim()) {
            setError('Email is required for client login');
            return;
        }
        if (!form.plan_id) {
            setError('Please select a plan');
            return;
        }

        setLoading(true);
        try {
            const user = await getCurrentUser();
            if (!user) throw new Error('Not authenticated');

            const result = await createPharmacyClient(form, user.id);
            setCredentials(result.credentials);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create client');
        } finally {
            setLoading(false);
        }
    };

    // Common input styles
    const inputClass = "w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all";
    const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5";

    return (
        <div className="space-y-4">
            <button
                onClick={onBack}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 dark:text-gray-400
                         hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
                <ArrowLeft size={18} />
                Back to Clients
            </button>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">Add New Client</h2>

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-6">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Pharmacy Details */}
                    <div>
                        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
                            Pharmacy Details
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Pharmacy Name *</label>
                                <input
                                    type="text"
                                    value={form.pharmacy_name}
                                    onChange={(e) => handleChange('pharmacy_name', e.target.value)}
                                    className={inputClass}
                                    placeholder="e.g., Weston Pharmacy"
                                    required
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Owner Name</label>
                                <input
                                    type="text"
                                    value={form.owner_name}
                                    onChange={(e) => handleChange('owner_name', e.target.value)}
                                    className={inputClass}
                                    placeholder="Owner's name"
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Email *</label>
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={(e) => handleChange('email', e.target.value)}
                                    className={inputClass}
                                    placeholder="pharmacy@email.com"
                                    required
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Phone</label>
                                <input
                                    type="tel"
                                    value={form.phone}
                                    onChange={(e) => handleChange('phone', e.target.value)}
                                    className={inputClass}
                                    placeholder="9876543210"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Address */}
                    <div>
                        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
                            Address
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className={labelClass}>Street Address</label>
                                <input
                                    type="text"
                                    value={form.address}
                                    onChange={(e) => handleChange('address', e.target.value)}
                                    className={inputClass}
                                    placeholder="Street address"
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className={labelClass}>City</label>
                                    <input
                                        type="text"
                                        value={form.city}
                                        onChange={(e) => handleChange('city', e.target.value)}
                                        className={inputClass}
                                        placeholder="City"
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>State</label>
                                    <input
                                        type="text"
                                        value={form.state}
                                        onChange={(e) => handleChange('state', e.target.value)}
                                        className={inputClass}
                                        placeholder="State"
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Pincode</label>
                                    <input
                                        type="text"
                                        value={form.pincode}
                                        onChange={(e) => handleChange('pincode', e.target.value)}
                                        className={inputClass}
                                        placeholder="500001"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Legal Info */}
                    <div>
                        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
                            Legal Info
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className={labelClass}>GST Number</label>
                                <input
                                    type="text"
                                    value={form.gst_number}
                                    onChange={(e) => handleChange('gst_number', e.target.value)}
                                    className={inputClass}
                                    placeholder="GST Number"
                                />
                            </div>
                            <div>
                                <label className={labelClass}>DL Number 1</label>
                                <input
                                    type="text"
                                    value={form.dl_number_1}
                                    onChange={(e) => handleChange('dl_number_1', e.target.value)}
                                    className={inputClass}
                                    placeholder="Drug License 1"
                                />
                            </div>
                            <div>
                                <label className={labelClass}>DL Number 2</label>
                                <input
                                    type="text"
                                    value={form.dl_number_2}
                                    onChange={(e) => handleChange('dl_number_2', e.target.value)}
                                    className={inputClass}
                                    placeholder="Drug License 2"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Subscription Plans */}
                    <div>
                        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
                            Subscription Plan
                        </h3>

                        {/* Demo Plan - For Client Demos */}
                        <p className="text-xs font-semibold text-orange-500 mb-3">🎯 DEMO (for client presentations)</p>
                        <div className="mb-6">
                            <div
                                onClick={() => handleChange('plan_id', 'demo_3day')}
                                className={`p-4 rounded-xl cursor-pointer transition-all border-2 border-dashed ${form.plan_id === 'demo_3day'
                                        ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/30'
                                        : 'border-orange-300 dark:border-orange-700 hover:border-orange-400 bg-orange-50/50 dark:bg-orange-900/10'
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-semibold text-gray-900 dark:text-gray-100">Demo Account</p>
                                        <p className="text-xl font-bold text-orange-600 dark:text-orange-400">FREE</p>
                                        <p className="text-sm text-orange-600">3 Days Trial</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-500">Perfect for</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Client Demos</p>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-400 mt-2">Full features for 3 days • Auto-expires</p>
                            </div>
                        </div>

                        {/* 1 Year Plans */}
                        <p className="text-xs font-semibold text-gray-500 mb-3">📅 1 YEAR PLANS</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            {[
                                { id: 'basic_yearly', name: 'Basic', price: '₹1,000', desc: '200 bills/month' },
                                { id: 'pro_yearly', name: 'Professional', price: '₹2,000', desc: 'Unlimited + Reports' },
                                { id: 'premium_yearly', name: 'Premium', price: '₹3,000', desc: 'Everything + Multi-user' }
                            ].map(plan => (
                                <div
                                    key={plan.id}
                                    onClick={() => handleChange('plan_id', plan.id)}
                                    className={`p-4 rounded-xl cursor-pointer transition-all ${form.plan_id === plan.id
                                        ? 'border-2 border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                                        : 'border border-gray-200 dark:border-gray-700 hover:border-indigo-300'
                                        }`}
                                >
                                    <p className="font-semibold text-gray-900 dark:text-gray-100">{plan.name}</p>
                                    <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{plan.price}</p>
                                    <p className="text-sm text-gray-500">1 Year</p>
                                    <p className="text-xs text-gray-400 mt-1">{plan.desc}</p>
                                </div>
                            ))}
                        </div>

                        {/* Lifetime Plans */}
                        <p className="text-xs font-semibold text-green-600 mb-3">♾️ LIFETIME PLANS</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            {[
                                { id: 'basic_lifetime', name: 'Basic', price: '₹5,000', desc: '200 bills/month' },
                                { id: 'pro_lifetime', name: 'Professional', price: '₹7,000', desc: 'Unlimited + Reports' },
                                { id: 'premium_lifetime', name: 'Premium', price: '₹10,000', desc: 'Everything + Multi-user', best: true }
                            ].map(plan => (
                                <div
                                    key={plan.id}
                                    onClick={() => handleChange('plan_id', plan.id)}
                                    className={`p-4 rounded-xl cursor-pointer transition-all relative ${form.plan_id === plan.id
                                        ? 'border-2 border-green-500 bg-green-50 dark:bg-green-900/30'
                                        : 'border border-gray-200 dark:border-gray-700 hover:border-green-300'
                                        }`}
                                >
                                    {plan.best && (
                                        <span className="absolute -top-2 right-3 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                                            BEST VALUE
                                        </span>
                                    )}
                                    <p className="font-semibold text-gray-900 dark:text-gray-100">{plan.name}</p>
                                    <p className="text-xl font-bold text-green-600 dark:text-green-400">{plan.price}</p>
                                    <p className="text-sm text-green-600">Lifetime</p>
                                    <p className="text-xs text-gray-400 mt-1">{plan.desc}</p>
                                </div>
                            ))}
                        </div>

                        {/* Selection Display */}
                        <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-3 text-sm">
                            <strong>Selected:</strong>{' '}
                            {form.plan_id === 'demo_3day' ? '🎯 Demo (3 Days) - FREE' :
                                form.plan_id === 'basic_yearly' ? 'Basic (1 Year) - ₹1,000' :
                                    form.plan_id === 'pro_yearly' ? 'Professional (1 Year) - ₹2,000' :
                                        form.plan_id === 'premium_yearly' ? 'Premium (1 Year) - ₹3,000' :
                                            form.plan_id === 'basic_lifetime' ? 'Basic (Lifetime) - ₹5,000' :
                                                form.plan_id === 'pro_lifetime' ? 'Professional (Lifetime) - ₹7,000' :
                                                    form.plan_id === 'premium_lifetime' ? 'Premium (Lifetime) - ₹10,000' :
                                                        'Click a plan to select'}
                        </div>
                    </div>

                    {/* Submit */}
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold
                                     hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-200 transition-all
                                     disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Save size={18} />
                            {loading ? 'Creating...' : 'Create Client'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Credentials Modal */}
            {credentials && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Key size={28} className="text-white" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                                Client Created! 🎉
                            </h2>
                            <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
                                Share these login credentials with the pharmacy
                            </p>
                        </div>

                        <div className="bg-gray-100 dark:bg-gray-700 rounded-xl p-4 mb-4 space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">EMAIL</label>
                                <div className="flex items-center gap-2 mt-1">
                                    <code className="flex-1 bg-white dark:bg-gray-600 px-3 py-2 rounded-lg text-sm border border-gray-200 dark:border-gray-500">
                                        {credentials.email}
                                    </code>
                                    <button
                                        onClick={() => handleCopy(credentials.email, 'email')}
                                        className={`p-2 rounded-lg transition-colors ${copied === 'email' ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-gray-600'
                                            }`}
                                    >
                                        {copied === 'email' ? <Check size={18} /> : <Copy size={18} />}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">PASSWORD</label>
                                <div className="flex items-center gap-2 mt-1">
                                    <code className="flex-1 bg-white dark:bg-gray-600 px-3 py-2 rounded-lg text-sm font-bold text-indigo-600 dark:text-indigo-400 border border-gray-200 dark:border-gray-500">
                                        {credentials.password}
                                    </code>
                                    <button
                                        onClick={() => handleCopy(credentials.password, 'password')}
                                        className={`p-2 rounded-lg transition-colors ${copied === 'password' ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-gray-600'
                                            }`}
                                    >
                                        {copied === 'password' ? <Check size={18} /> : <Copy size={18} />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg px-4 py-3 mb-4 text-sm text-yellow-800 dark:text-yellow-300">
                            ⚠️ Save this password! It won't be shown again.
                        </div>

                        <button
                            onClick={onSuccess}
                            className="w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                        >
                            Done - Go to Clients
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
