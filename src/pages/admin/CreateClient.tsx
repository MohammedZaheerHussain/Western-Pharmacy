/**
 * Create Client Page
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
            // Show credentials modal instead of navigating
            setCredentials(result.credentials);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create client');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <button
                onClick={onBack}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 dark:text-gray-400
                         hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors mb-4"
            >
                <ArrowLeft size={18} />
                Back to Clients
            </button>

            <div className="card">
                <h2 className="card-title" style={{ marginBottom: '1.5rem' }}>Add New Client</h2>

                {error && (
                    <div style={{
                        background: '#fee2e2',
                        color: '#991b1b',
                        padding: '0.75rem 1rem',
                        borderRadius: '0.5rem',
                        marginBottom: '1rem'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {/* Basic Info */}
                    <h3 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--gray-500)' }}>
                        PHARMACY DETAILS
                    </h3>
                    <div className="grid-2">
                        <div className="form-group">
                            <label className="form-label">Pharmacy Name *</label>
                            <input
                                type="text"
                                value={form.pharmacy_name}
                                onChange={(e) => handleChange('pharmacy_name', e.target.value)}
                                className="form-input"
                                placeholder="e.g., Weston Pharmacy"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Owner Name</label>
                            <input
                                type="text"
                                value={form.owner_name}
                                onChange={(e) => handleChange('owner_name', e.target.value)}
                                className="form-input"
                                placeholder="Owner's name"
                            />
                        </div>
                    </div>

                    <div className="grid-2">
                        <div className="form-group">
                            <label className="form-label">Email</label>
                            <input
                                type="email"
                                value={form.email}
                                onChange={(e) => handleChange('email', e.target.value)}
                                className="form-input"
                                placeholder="pharmacy@email.com"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Phone</label>
                            <input
                                type="tel"
                                value={form.phone}
                                onChange={(e) => handleChange('phone', e.target.value)}
                                className="form-input"
                                placeholder="9876543210"
                            />
                        </div>
                    </div>

                    {/* Address */}
                    <h3 style={{ fontSize: '0.875rem', fontWeight: '600', margin: '1.5rem 0 1rem', color: 'var(--gray-500)' }}>
                        ADDRESS
                    </h3>
                    <div className="form-group">
                        <label className="form-label">Address</label>
                        <input
                            type="text"
                            value={form.address}
                            onChange={(e) => handleChange('address', e.target.value)}
                            className="form-input"
                            placeholder="Street address"
                        />
                    </div>
                    <div className="grid-3">
                        <div className="form-group">
                            <label className="form-label">City</label>
                            <input
                                type="text"
                                value={form.city}
                                onChange={(e) => handleChange('city', e.target.value)}
                                className="form-input"
                                placeholder="City"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">State</label>
                            <input
                                type="text"
                                value={form.state}
                                onChange={(e) => handleChange('state', e.target.value)}
                                className="form-input"
                                placeholder="State"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Pincode</label>
                            <input
                                type="text"
                                value={form.pincode}
                                onChange={(e) => handleChange('pincode', e.target.value)}
                                className="form-input"
                                placeholder="500001"
                            />
                        </div>
                    </div>

                    {/* Legal */}
                    <h3 style={{ fontSize: '0.875rem', fontWeight: '600', margin: '1.5rem 0 1rem', color: 'var(--gray-500)' }}>
                        LEGAL INFO
                    </h3>
                    <div className="grid-3">
                        <div className="form-group">
                            <label className="form-label">GST Number</label>
                            <input
                                type="text"
                                value={form.gst_number}
                                onChange={(e) => handleChange('gst_number', e.target.value)}
                                className="form-input"
                                placeholder="GST Number"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">DL Number 1</label>
                            <input
                                type="text"
                                value={form.dl_number_1}
                                onChange={(e) => handleChange('dl_number_1', e.target.value)}
                                className="form-input"
                                placeholder="Drug License 1"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">DL Number 2</label>
                            <input
                                type="text"
                                value={form.dl_number_2}
                                onChange={(e) => handleChange('dl_number_2', e.target.value)}
                                className="form-input"
                                placeholder="Drug License 2"
                            />
                        </div>
                    </div>

                    {/* Plan */}
                    <h3 style={{ fontSize: '0.875rem', fontWeight: '600', margin: '1.5rem 0 1rem', color: 'var(--gray-500)' }}>
                        SUBSCRIPTION PLAN
                    </h3>

                    {/* 1 YEAR PLANS */}
                    <p style={{ fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', marginBottom: '0.75rem' }}>
                        📅 1 YEAR PLANS
                    </p>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '1rem',
                        marginBottom: '1.5rem'
                    }}>
                        {/* Basic 1 Year */}
                        <div style={{
                            padding: '1rem',
                            border: form.plan_id === 'basic_yearly' ? '2px solid #2563eb' : '1px solid #e5e7eb',
                            borderRadius: '0.75rem',
                            cursor: 'pointer',
                            background: form.plan_id === 'basic_yearly' ? '#eff6ff' : 'white',
                            transition: 'all 0.2s'
                        }}
                            onClick={() => handleChange('plan_id', 'basic_yearly')}>
                            <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Basic</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#2563eb' }}>₹1,000</div>
                            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>1 Year</div>
                            <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: '0.5rem' }}>
                                200 bills/month
                            </div>
                        </div>

                        {/* Pro 1 Year */}
                        <div style={{
                            padding: '1rem',
                            border: form.plan_id === 'pro_yearly' ? '2px solid #2563eb' : '1px solid #e5e7eb',
                            borderRadius: '0.75rem',
                            cursor: 'pointer',
                            background: form.plan_id === 'pro_yearly' ? '#eff6ff' : 'white',
                            transition: 'all 0.2s'
                        }}
                            onClick={() => handleChange('plan_id', 'pro_yearly')}>
                            <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Professional</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#2563eb' }}>₹2,000</div>
                            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>1 Year</div>
                            <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: '0.5rem' }}>
                                Unlimited + Reports
                            </div>
                        </div>

                        {/* Premium 1 Year */}
                        <div style={{
                            padding: '1rem',
                            border: form.plan_id === 'premium_yearly' ? '2px solid #2563eb' : '1px solid #e5e7eb',
                            borderRadius: '0.75rem',
                            cursor: 'pointer',
                            background: form.plan_id === 'premium_yearly' ? '#eff6ff' : 'white',
                            transition: 'all 0.2s'
                        }}
                            onClick={() => handleChange('plan_id', 'premium_yearly')}>
                            <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Premium</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#2563eb' }}>₹3,000</div>
                            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>1 Year</div>
                            <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: '0.5rem' }}>
                                Everything + Multi-user
                            </div>
                        </div>
                    </div>

                    {/* LIFETIME PLANS */}
                    <p style={{ fontSize: '0.75rem', fontWeight: '600', color: '#10b981', marginBottom: '0.75rem' }}>
                        ♾️ LIFETIME PLANS (One-time payment)
                    </p>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '1rem',
                        marginBottom: '1rem'
                    }}>
                        {/* Basic Lifetime */}
                        <div style={{
                            padding: '1rem',
                            border: form.plan_id === 'basic_lifetime' ? '2px solid #10b981' : '1px solid #e5e7eb',
                            borderRadius: '0.75rem',
                            cursor: 'pointer',
                            background: form.plan_id === 'basic_lifetime' ? '#ecfdf5' : 'white',
                            transition: 'all 0.2s'
                        }}
                            onClick={() => handleChange('plan_id', 'basic_lifetime')}>
                            <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Basic</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#10b981' }}>₹5,000</div>
                            <div style={{ fontSize: '0.875rem', color: '#059669' }}>Lifetime</div>
                            <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: '0.5rem' }}>
                                200 bills/month
                            </div>
                        </div>

                        {/* Pro Lifetime */}
                        <div style={{
                            padding: '1rem',
                            border: form.plan_id === 'pro_lifetime' ? '2px solid #10b981' : '1px solid #e5e7eb',
                            borderRadius: '0.75rem',
                            cursor: 'pointer',
                            background: form.plan_id === 'pro_lifetime' ? '#ecfdf5' : 'white',
                            transition: 'all 0.2s'
                        }}
                            onClick={() => handleChange('plan_id', 'pro_lifetime')}>
                            <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Professional</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#10b981' }}>₹7,000</div>
                            <div style={{ fontSize: '0.875rem', color: '#059669' }}>Lifetime</div>
                            <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: '0.5rem' }}>
                                Unlimited + Reports
                            </div>
                        </div>

                        {/* Premium Lifetime */}
                        <div style={{
                            padding: '1rem',
                            border: form.plan_id === 'premium_lifetime' ? '2px solid #10b981' : '1px solid #e5e7eb',
                            borderRadius: '0.75rem',
                            cursor: 'pointer',
                            background: form.plan_id === 'premium_lifetime' ? '#ecfdf5' : 'white',
                            transition: 'all 0.2s',
                            position: 'relative' as const
                        }}
                            onClick={() => handleChange('plan_id', 'premium_lifetime')}>
                            <div style={{
                                position: 'absolute',
                                top: '-8px',
                                right: '10px',
                                background: '#10b981',
                                color: 'white',
                                fontSize: '0.6rem',
                                padding: '2px 8px',
                                borderRadius: '10px',
                                fontWeight: '600'
                            }}>BEST VALUE</div>
                            <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Premium</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#10b981' }}>₹10,000</div>
                            <div style={{ fontSize: '0.875rem', color: '#059669' }}>Lifetime</div>
                            <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: '0.5rem' }}>
                                Everything + Multi-user
                            </div>
                        </div>
                    </div>

                    {/* Current Selection Display */}
                    <div style={{
                        background: '#f3f4f6',
                        padding: '0.75rem 1rem',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem'
                    }}>
                        <strong>Selected:</strong> {
                            form.plan_id === 'basic_yearly' ? 'Basic (1 Year) - ₹1,000' :
                                form.plan_id === 'pro_yearly' ? 'Professional (1 Year) - ₹2,000' :
                                    form.plan_id === 'premium_yearly' ? 'Premium (1 Year) - ₹3,000' :
                                        form.plan_id === 'basic_lifetime' ? 'Basic (Lifetime) - ₹5,000' :
                                            form.plan_id === 'pro_lifetime' ? 'Professional (Lifetime) - ₹7,000' :
                                                form.plan_id === 'premium_lifetime' ? 'Premium (Lifetime) - ₹10,000' :
                                                    'Click a plan to select'
                        }
                    </div>

                    <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid var(--gray-200)' }}>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading}
                        >
                            <Save size={18} />
                            {loading ? 'Creating...' : 'Create Client'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Credentials Modal */}
            {credentials && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: 'white',
                        borderRadius: '1rem',
                        padding: '2rem',
                        maxWidth: '450px',
                        width: '90%',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
                    }}>
                        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                            <div style={{
                                width: '60px',
                                height: '60px',
                                background: '#10b981',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 1rem'
                            }}>
                                <Key size={28} color="white" />
                            </div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111' }}>
                                Client Created! 🎉
                            </h2>
                            <p style={{ color: '#6b7280', marginTop: '0.5rem' }}>
                                Share these login credentials with the pharmacy
                            </p>
                        </div>

                        <div style={{ background: '#f3f4f6', borderRadius: '0.75rem', padding: '1rem', marginBottom: '1rem' }}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: '600' }}>EMAIL</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                                    <code style={{
                                        flex: 1,
                                        background: 'white',
                                        padding: '0.5rem 0.75rem',
                                        borderRadius: '0.5rem',
                                        fontSize: '0.875rem',
                                        border: '1px solid #e5e7eb'
                                    }}>
                                        {credentials.email}
                                    </code>
                                    <button
                                        onClick={() => handleCopy(credentials.email, 'email')}
                                        style={{
                                            padding: '0.5rem',
                                            background: copied === 'email' ? '#10b981' : '#e5e7eb',
                                            borderRadius: '0.5rem',
                                            border: 'none',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {copied === 'email' ? <Check size={18} color="white" /> : <Copy size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: '600' }}>PASSWORD</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                                    <code style={{
                                        flex: 1,
                                        background: 'white',
                                        padding: '0.5rem 0.75rem',
                                        borderRadius: '0.5rem',
                                        fontSize: '0.875rem',
                                        fontWeight: '600',
                                        color: '#2563eb',
                                        border: '1px solid #e5e7eb'
                                    }}>
                                        {credentials.password}
                                    </code>
                                    <button
                                        onClick={() => handleCopy(credentials.password, 'password')}
                                        style={{
                                            padding: '0.5rem',
                                            background: copied === 'password' ? '#10b981' : '#e5e7eb',
                                            borderRadius: '0.5rem',
                                            border: 'none',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {copied === 'password' ? <Check size={18} color="white" /> : <Copy size={18} />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div style={{
                            background: '#fef3c7',
                            border: '1px solid #f59e0b',
                            borderRadius: '0.5rem',
                            padding: '0.75rem',
                            marginBottom: '1.5rem',
                            fontSize: '0.8rem',
                            color: '#92400e'
                        }}>
                            ⚠️ Save this password! It won't be shown again.
                        </div>

                        <button
                            onClick={onSuccess}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                background: '#2563eb',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.5rem',
                                fontSize: '1rem',
                                fontWeight: '600',
                                cursor: 'pointer'
                            }}
                        >
                            Done - Go to Clients
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
