/**
 * Client Detail Page - View and manage individual client
 */

import { useEffect, useState } from 'react';
import { ArrowLeft, Key, Copy, Check, Palette, Clock } from 'lucide-react';
import {
    getClientById,
    createLicense,
    getLicensesByClientId,
    upsertBranding,
    getBrandingByClientId
} from '../../services/adminSupabase';

interface License {
    id: string;
    license_key: string;
    duration: string;
    starts_at: string;
    expires_at: string | null;
    is_active: boolean;
    created_at: string;
}

interface ClientData {
    id: string;
    client_id: string;
    pharmacy_name: string;
    owner_name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    gst_number: string;
    dl_number_1: string;
    dl_number_2: string;
    status: string;
    created_at: string;
    plans?: {
        name: string;
        display_name: string;
    };
}

interface Branding {
    app_name: string;
    logo_url: string;
    primary_color: string;
    invoice_header: string;
    invoice_footer: string;
    tagline: string;
}

interface ClientDetailProps {
    clientId: string;
    onBack: () => void;
}

export default function ClientDetail({ clientId, onBack }: ClientDetailProps) {

    const [client, setClient] = useState<ClientData | null>(null);
    const [licenses, setLicenses] = useState<License[]>([]);
    const [branding, setBranding] = useState<Branding>({
        app_name: '',
        logo_url: '',
        primary_color: '#2563eb',
        invoice_header: '',
        invoice_footer: '',
        tagline: ''
    });
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [generatingLicense, setGeneratingLicense] = useState(false);
    const [savingBranding, setSavingBranding] = useState(false);
    const [licenseDuration, setLicenseDuration] = useState<'6_months' | '1_year' | 'lifetime'>('1_year');
    const [activeTab, setActiveTab] = useState<'info' | 'licenses' | 'branding'>('info');

    useEffect(() => {
        if (clientId) {
            loadClient();
            loadLicenses();
            loadBranding();
        }
    }, [clientId]);

    const loadClient = async () => {
        try {
            const data = await getClientById(clientId);
            setClient(data);
            if (data && !branding.app_name) {
                setBranding(prev => ({ ...prev, app_name: data.pharmacy_name }));
            }
        } catch (error) {
            console.error('Failed to load client:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadLicenses = async () => {
        try {
            const data = await getLicensesByClientId(clientId);
            setLicenses(data || []);
        } catch (error) {
            console.error('Failed to load licenses:', error);
        }
    };

    const loadBranding = async () => {
        try {
            const data = await getBrandingByClientId(clientId);
            if (data) {
                setBranding({
                    app_name: data.app_name || '',
                    logo_url: data.logo_url || '',
                    primary_color: data.primary_color || '#2563eb',
                    invoice_header: data.invoice_header || '',
                    invoice_footer: data.invoice_footer || '',
                    tagline: data.tagline || ''
                });
            }
        } catch (error) {
            console.error('Failed to load branding:', error);
        }
    };

    const handleGenerateLicense = async () => {
        if (!clientId) return;
        setGeneratingLicense(true);
        try {
            await createLicense({ client_id: clientId, duration: licenseDuration });
            await loadLicenses();
        } catch (error) {
            console.error('Failed to generate license:', error);
        } finally {
            setGeneratingLicense(false);
        }
    };

    const handleSaveBranding = async () => {
        if (!clientId) return;
        setSavingBranding(true);
        try {
            await upsertBranding({ client_id: clientId, ...branding });
        } catch (error) {
            console.error('Failed to save branding:', error);
        } finally {
            setSavingBranding(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'Lifetime';
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const getDurationLabel = (duration: string) => {
        switch (duration) {
            case '6_months': return '6 Months';
            case '1_year': return '1 Year';
            case 'lifetime': return 'Lifetime';
            default: return duration;
        }
    };

    const getDaysRemaining = (expiresAt: string | null): { days: number | null; label: string; color: string } => {
        if (!expiresAt) {
            return { days: null, label: '∞ Lifetime', color: 'text-green-600 dark:text-green-400' };
        }

        const now = new Date();
        const expires = new Date(expiresAt);
        const diffTime = expires.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return { days: diffDays, label: 'Expired', color: 'text-red-600 dark:text-red-400' };
        } else if (diffDays <= 7) {
            return { days: diffDays, label: `${diffDays} days left`, color: 'text-red-600 dark:text-red-400' };
        } else if (diffDays <= 30) {
            return { days: diffDays, label: `${diffDays} days left`, color: 'text-yellow-600 dark:text-yellow-400' };
        } else {
            return { days: diffDays, label: `${diffDays} days left`, color: 'text-green-600 dark:text-green-400' };
        }
    };

    if (loading) {
        return <div className="card"><p>Loading...</p></div>;
    }

    if (!client) {
        return <div className="card"><p>Client not found</p></div>;
    }

    return (
        <div className="space-y-6">
            <button
                onClick={onBack}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 dark:text-gray-400
                         hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
                <ArrowLeft size={18} />
                Back to Clients
            </button>

            {/* Header Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                            {client.pharmacy_name}
                        </h1>
                        <div className="flex items-center gap-3">
                            <code className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm font-mono text-gray-600 dark:text-gray-300">
                                {client.client_id}
                            </code>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${client.status === 'active'
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                }`}>
                                {client.status}
                            </span>
                        </div>
                    </div>

                    {/* Plan & Upgrade Section */}
                    <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-3">
                            <span className="px-3 py-1.5 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 text-sm font-semibold rounded-lg">
                                {client.plans?.display_name || 'No Plan'}
                            </span>
                            <button
                                onClick={() => setActiveTab('licenses')}
                                className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-semibold rounded-lg 
                                         hover:from-green-600 hover:to-emerald-700 transition-all shadow-sm"
                            >
                                ⬆️ Upgrade Plan
                            </button>
                        </div>
                        {/* Days Remaining */}
                        {licenses.length > 0 && (() => {
                            const activeLicense = licenses.find(l => l.is_active);
                            if (activeLicense) {
                                const remaining = getDaysRemaining(activeLicense.expires_at);
                                return (
                                    <div className={`text-sm font-medium ${remaining.color}`}>
                                        <Clock size={14} className="inline mr-1" />
                                        {remaining.label}
                                    </div>
                                );
                            }
                            return null;
                        })()}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
                {(['info', 'licenses', 'branding'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab
                            ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                            }`}
                    >
                        {tab === 'info' && 'Info'}
                        {tab === 'licenses' && <><Key size={16} /> Licenses</>}
                        {tab === 'branding' && <><Palette size={16} /> Branding</>}
                    </button>
                ))}
            </div>

            {/* Info Tab */}
            {activeTab === 'info' && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">Client Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Owner</p>
                            <p className="text-gray-900 dark:text-gray-100 font-medium">{client.owner_name || '-'}</p>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Phone</p>
                            <p className="text-gray-900 dark:text-gray-100 font-medium">{client.phone || '-'}</p>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Email</p>
                            <p className="text-gray-900 dark:text-gray-100 font-medium">{client.email || '-'}</p>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">City</p>
                            <p className="text-gray-900 dark:text-gray-100 font-medium">{client.city || '-'}</p>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">GST Number</p>
                            <p className="text-gray-900 dark:text-gray-100 font-medium">{client.gst_number || '-'}</p>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">DL Numbers</p>
                            <p className="text-gray-900 dark:text-gray-100 font-medium">{client.dl_number_1 || '-'} / {client.dl_number_2 || '-'}</p>
                        </div>
                        <div className="md:col-span-2 lg:col-span-3">
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Address</p>
                            <p className="text-gray-900 dark:text-gray-100 font-medium">
                                {[client.address, client.city, client.state, client.pincode].filter(Boolean).join(', ') || '-'}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Licenses Tab */}
            {activeTab === 'licenses' && (
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Licenses</h3>
                        <div className="flex gap-2 items-center">
                            <select
                                value={licenseDuration}
                                onChange={(e) => setLicenseDuration(e.target.value as typeof licenseDuration)}
                                className="form-select"
                                style={{ width: 'auto' }}
                            >
                                <option value="6_months">6 Months</option>
                                <option value="1_year">1 Year</option>
                                <option value="lifetime">Lifetime</option>
                            </select>
                            <button
                                onClick={handleGenerateLicense}
                                className="btn btn-primary"
                                disabled={generatingLicense}
                            >
                                <Key size={16} />
                                {generatingLicense ? 'Generating...' : 'Generate License'}
                            </button>
                        </div>
                    </div>

                    {licenses.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray-500)' }}>
                            <Key size={32} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                            <p>No licenses yet. Generate one above.</p>
                        </div>
                    ) : (
                        <div style={{ marginTop: '1rem' }}>
                            {licenses.map(license => (
                                <div
                                    key={license.id}
                                    style={{
                                        border: '1px solid var(--gray-200)',
                                        borderRadius: '0.5rem',
                                        padding: '1rem',
                                        marginBottom: '0.75rem'
                                    }}
                                >
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <div className="license-key" style={{ marginBottom: '0.5rem' }}>
                                                {license.license_key}
                                            </div>
                                            <div className="flex gap-4" style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                                                <span className="flex items-center gap-1">
                                                    <Clock size={12} />
                                                    {getDurationLabel(license.duration)}
                                                </span>
                                                <span>
                                                    Expires: {formatDate(license.expires_at)}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 items-center">
                                            <span className={`badge ${license.is_active ? 'badge-success' : 'badge-danger'}`}>
                                                {license.is_active ? 'Active' : 'Revoked'}
                                            </span>
                                            <button
                                                onClick={() => copyToClipboard(license.license_key)}
                                                className="btn btn-secondary"
                                                style={{ padding: '0.375rem 0.625rem' }}
                                            >
                                                {copied ? <Check size={16} /> : <Copy size={16} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Branding Tab */}
            {activeTab === 'branding' && (
                <div className="card">
                    <h3 className="card-title mb-4">Branding Configuration</h3>

                    <div className="grid-2">
                        <div className="form-group">
                            <label className="form-label">App Display Name</label>
                            <input
                                type="text"
                                value={branding.app_name}
                                onChange={(e) => setBranding(prev => ({ ...prev, app_name: e.target.value }))}
                                className="form-input"
                                placeholder="Pharmacy name shown in app"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Primary Color</label>
                            <div className="color-picker-wrapper">
                                <input
                                    type="color"
                                    value={branding.primary_color}
                                    onChange={(e) => setBranding(prev => ({ ...prev, primary_color: e.target.value }))}
                                    className="color-picker"
                                />
                                <span className="color-value">{branding.primary_color}</span>
                            </div>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Logo URL</label>
                        <input
                            type="url"
                            value={branding.logo_url}
                            onChange={(e) => setBranding(prev => ({ ...prev, logo_url: e.target.value }))}
                            className="form-input"
                            placeholder="https://example.com/logo.png"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Invoice Header</label>
                        <input
                            type="text"
                            value={branding.invoice_header}
                            onChange={(e) => setBranding(prev => ({ ...prev, invoice_header: e.target.value }))}
                            className="form-input"
                            placeholder="Text shown at top of invoice"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Invoice Footer / Tagline</label>
                        <input
                            type="text"
                            value={branding.invoice_footer}
                            onChange={(e) => setBranding(prev => ({ ...prev, invoice_footer: e.target.value }))}
                            className="form-input"
                            placeholder="e.g., Thank you for your visit!"
                        />
                    </div>

                    <div style={{ marginTop: '1.5rem' }}>
                        <button
                            onClick={handleSaveBranding}
                            className="btn btn-primary"
                            disabled={savingBranding}
                        >
                            {savingBranding ? 'Saving...' : 'Save Branding'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
