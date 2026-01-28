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

    if (loading) {
        return <div className="card"><p>Loading...</p></div>;
    }

    if (!client) {
        return <div className="card"><p>Client not found</p></div>;
    }

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

            {/* Header */}
            <div className="card">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                            {client.pharmacy_name}
                        </h1>
                        <code style={{
                            background: 'var(--gray-100)',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '0.25rem',
                            fontSize: '0.875rem'
                        }}>
                            {client.client_id}
                        </code>
                    </div>
                    <div className="flex gap-2 items-center">
                        <span className={`badge badge-${client.status === 'active' ? 'success' : 'danger'}`}>
                            {client.status}
                        </span>
                        <span className="badge badge-primary">
                            {client.plans?.display_name}
                        </span>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-4" style={{ marginTop: '1rem' }}>
                {(['info', 'licenses', 'branding'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`btn ${activeTab === tab ? 'btn-primary' : 'btn-secondary'}`}
                    >
                        {tab === 'info' && 'Info'}
                        {tab === 'licenses' && <><Key size={16} /> Licenses</>}
                        {tab === 'branding' && <><Palette size={16} /> Branding</>}
                    </button>
                ))}
            </div>

            {/* Info Tab */}
            {activeTab === 'info' && (
                <div className="card">
                    <h3 className="card-title mb-4">Client Information</h3>
                    <div className="grid-2" style={{ gap: '1.5rem' }}>
                        <div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginBottom: '0.25rem' }}>Owner</p>
                            <p>{client.owner_name || '-'}</p>
                        </div>
                        <div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginBottom: '0.25rem' }}>Phone</p>
                            <p>{client.phone || '-'}</p>
                        </div>
                        <div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginBottom: '0.25rem' }}>Email</p>
                            <p>{client.email || '-'}</p>
                        </div>
                        <div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginBottom: '0.25rem' }}>City</p>
                            <p>{client.city || '-'}</p>
                        </div>
                        <div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginBottom: '0.25rem' }}>GST Number</p>
                            <p>{client.gst_number || '-'}</p>
                        </div>
                        <div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginBottom: '0.25rem' }}>DL Numbers</p>
                            <p>{client.dl_number_1 || '-'} / {client.dl_number_2 || '-'}</p>
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
