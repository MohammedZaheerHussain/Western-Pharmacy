/**
 * LicenseExpiredOverlay
 * Full-screen blocking overlay shown when license/demo has expired
 * 
 * Does NOT block:
 * - Window close
 * - Print/Export (handled separately)
 * - Copy actions
 * - Contact buttons
 */

import { Lock, Phone, MessageCircle, Mail, RefreshCw } from 'lucide-react';
import {
    SUPPORT_PHONE,
    SUPPORT_EMAIL,
    getLicenseRenewalWhatsAppUrl,
    getLicenseRenewalEmailUrl
} from '../services/licenseGuard';

interface LicenseExpiredOverlayProps {
    isDemoExpired: boolean;
    isLicenseExpired: boolean;
    daysSinceExpiry: number;
    pharmacyName?: string;
    onLogout?: () => void;
}

export function LicenseExpiredOverlay({
    isDemoExpired,
    isLicenseExpired: _isLicenseExpired, // Used implicitly through isDemoExpired negation
    daysSinceExpiry,
    pharmacyName,
    onLogout
}: LicenseExpiredOverlayProps) {
    // Determine message based on expiry type
    const title = isDemoExpired
        ? 'Demo Period Expired'
        : 'License Expired';

    const message = isDemoExpired
        ? 'Your 3-day trial has ended. Purchase a license to continue using Billova Medical Billing.'
        : daysSinceExpiry > 7
            ? `Your license expired ${daysSinceExpiry} days ago. Contact support to renew immediately.`
            : 'Your license has expired. Please renew to continue using all features.';

    return (
        <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
            <div className="max-w-md w-full text-center">
                {/* Logo */}
                <div className="w-20 h-20 mx-auto mb-6 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur">
                    <img src="/billova-logo.png" alt="Billova" className="w-14 h-14 object-contain" />
                </div>

                {/* Lock Icon */}
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center
                    ${isDemoExpired ? 'bg-amber-500/20' : 'bg-red-500/20'}`}>
                    <Lock size={32} className={isDemoExpired ? 'text-amber-400' : 'text-red-400'} />
                </div>

                {/* Title */}
                <h1 className="text-2xl font-bold text-white mb-2">
                    {title}
                </h1>

                {/* Message */}
                <p className="text-gray-400 mb-6">
                    {message}
                </p>

                {/* View-only Notice */}
                <div className="bg-white/5 rounded-lg px-4 py-3 mb-6 border border-white/10">
                    <p className="text-sm text-gray-300">
                        📋 <strong>View-only mode active</strong> — You can still view and export your data.
                    </p>
                </div>

                {/* Contact Options */}
                <div className="bg-white/5 rounded-xl p-6 backdrop-blur border border-white/10 space-y-3">
                    <p className="text-sm text-gray-400 mb-4">Contact us to renew your license:</p>

                    {/* Phone */}
                    <a
                        href={`tel:+91${SUPPORT_PHONE}`}
                        className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-green-600 hover:bg-green-700 
                                   text-white font-medium rounded-lg transition-colors"
                    >
                        <Phone size={18} />
                        +91 {SUPPORT_PHONE}
                    </a>

                    {/* WhatsApp */}
                    <a
                        href={getLicenseRenewalWhatsAppUrl(pharmacyName)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 
                                   text-white font-medium rounded-lg transition-colors"
                    >
                        <MessageCircle size={18} />
                        WhatsApp Us
                    </a>

                    {/* Email */}
                    <a
                        href={getLicenseRenewalEmailUrl(pharmacyName)}
                        className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 
                                   text-white font-medium rounded-lg transition-colors"
                    >
                        <Mail size={18} />
                        {SUPPORT_EMAIL}
                    </a>
                </div>

                {/* Actions */}
                <div className="mt-6 flex gap-3 justify-center">
                    <button
                        onClick={() => window.location.reload()}
                        className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white text-sm transition-colors"
                    >
                        <RefreshCw size={14} />
                        Refresh
                    </button>
                    {onLogout && (
                        <button
                            onClick={onLogout}
                            className="px-4 py-2 text-gray-400 hover:text-white text-sm transition-colors"
                        >
                            Logout
                        </button>
                    )}
                </div>

                {/* Branding */}
                <p className="text-xs text-gray-600 mt-6">
                    Powered by Billova Medical Billing
                </p>
            </div>
        </div>
    );
}

export default LicenseExpiredOverlay;
