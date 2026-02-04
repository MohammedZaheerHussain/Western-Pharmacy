/**
 * ExpiryWarningBanner
 * Non-blocking warning banner shown when demo is about to expire
 * or paid license is in grace period
 * 
 * Rules:
 * - Cannot be permanently dismissed
 * - Reappears once per day
 * - Shows countdown and contact info
 */

import { useState, useEffect } from 'react';
import { AlertTriangle, X, Phone, MessageCircle } from 'lucide-react';
import { SUPPORT_PHONE, getLicenseRenewalWhatsAppUrl } from '../services/licenseGuard';

interface ExpiryWarningBannerProps {
    daysRemaining: number;
    isGracePeriod: boolean;
    isDemo: boolean;
    pharmacyName?: string;
}

const DISMISS_KEY = 'billova_expiry_banner_dismissed';

export function ExpiryWarningBanner({
    daysRemaining,
    isGracePeriod,
    isDemo,
    pharmacyName
}: ExpiryWarningBannerProps) {
    const [dismissed, setDismissed] = useState(false);

    // Check if already dismissed today
    useEffect(() => {
        const dismissedDate = localStorage.getItem(DISMISS_KEY);
        if (dismissedDate) {
            const today = new Date().toDateString();
            if (dismissedDate === today) {
                setDismissed(true);
            } else {
                // Reset for new day
                localStorage.removeItem(DISMISS_KEY);
            }
        }
    }, []);

    const handleDismiss = () => {
        setDismissed(true);
        localStorage.setItem(DISMISS_KEY, new Date().toDateString());
    };

    // Don't show if dismissed or not applicable
    if (dismissed) return null;

    // Determine urgency and colors
    const isUrgent = daysRemaining <= 1 || isGracePeriod;
    const bgClass = isUrgent
        ? 'bg-red-600'
        : daysRemaining <= 3
            ? 'bg-amber-500'
            : 'bg-blue-600';

    // Message
    const getMessage = () => {
        if (isGracePeriod) {
            return `⚠️ License expired! Grace period ends in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}. Renew now to avoid lockout.`;
        }
        if (daysRemaining === 0) {
            return `🔒 Your ${isDemo ? 'demo' : 'license'} expires today! Contact us to continue.`;
        }
        if (daysRemaining === 1) {
            return `⏰ Only 1 day left in your ${isDemo ? 'trial' : 'license'}! Renew now.`;
        }
        return `📅 ${daysRemaining} days left in your ${isDemo ? 'trial' : 'license'}. Contact us to upgrade.`;
    };

    return (
        <div className={`${bgClass} text-white px-4 py-2 flex items-center justify-between gap-4 relative z-50`}>
            <div className="flex items-center gap-3 flex-1 min-w-0">
                <AlertTriangle size={18} className="flex-shrink-0" />
                <span className="text-sm font-medium truncate">
                    {getMessage()}
                </span>
            </div>

            {/* Contact buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
                <a
                    href={`tel:+91${SUPPORT_PHONE}`}
                    className="flex items-center gap-1 px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-xs font-medium transition-colors"
                >
                    <Phone size={12} />
                    Call
                </a>
                <a
                    href={getLicenseRenewalWhatsAppUrl(pharmacyName)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-xs font-medium transition-colors"
                >
                    <MessageCircle size={12} />
                    WhatsApp
                </a>
                <button
                    onClick={handleDismiss}
                    className="p-1 hover:bg-white/20 rounded transition-colors ml-2"
                    title="Dismiss for today (will return tomorrow)"
                >
                    <X size={16} />
                </button>
            </div>
        </div>
    );
}

export default ExpiryWarningBanner;
