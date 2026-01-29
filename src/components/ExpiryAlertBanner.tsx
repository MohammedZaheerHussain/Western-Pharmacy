/**
 * Expiry Alert Banner - Shows at top of app when medicines are expiring
 * Displays count and quick access to expiry report
 */

import { useState, useEffect } from 'react';
import { AlertTriangle, X, ChevronRight } from 'lucide-react';
import { getAllMedicines } from '../services/storage';
import { Medicine } from '../types/medicine';

interface ExpiryAlertBannerProps {
    onViewReport: () => void;
}

export function ExpiryAlertBanner({ onViewReport }: ExpiryAlertBannerProps) {
    const [alerts, setAlerts] = useState<{ critical: number; warning: number; caution: number }>({
        critical: 0,
        warning: 0,
        caution: 0
    });
    const [dismissed, setDismissed] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkExpiry = async () => {
            try {
                const medicines = await getAllMedicines();
                const now = new Date();
                now.setHours(0, 0, 0, 0);

                let critical = 0;
                let warning = 0;
                let caution = 0;

                medicines.forEach((med: Medicine) => {
                    if (med.quantity === 0) return; // Skip out of stock

                    const expiry = new Date(med.expiryDate);
                    const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

                    if (diffDays <= 30) critical++;
                    else if (diffDays <= 60) warning++;
                    else if (diffDays <= 90) caution++;
                });

                setAlerts({ critical, warning, caution });
            } catch (e) {
                console.error('Failed to check expiry:', e);
            } finally {
                setLoading(false);
            }
        };

        checkExpiry();

        // Check every 5 minutes
        const interval = setInterval(checkExpiry, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    // Don't show if dismissed or no alerts
    const total = alerts.critical + alerts.warning + alerts.caution;
    if (dismissed || loading || total === 0) return null;

    // Determine severity for styling
    const severity = alerts.critical > 0 ? 'critical' : alerts.warning > 0 ? 'warning' : 'caution';

    const severityStyles = {
        critical: 'bg-red-600 text-white',
        warning: 'bg-orange-500 text-white',
        caution: 'bg-yellow-500 text-yellow-900'
    };

    return (
        <div className={`${severityStyles[severity]} px-4 py-2 flex items-center justify-between`}>
            <div className="flex items-center gap-3">
                <AlertTriangle size={18} className="flex-shrink-0" />
                <span className="text-sm font-medium">
                    {alerts.critical > 0 && (
                        <span className="font-bold">{alerts.critical} medicines expiring within 30 days!</span>
                    )}
                    {alerts.critical === 0 && alerts.warning > 0 && (
                        <span>{alerts.warning} medicines expiring within 60 days</span>
                    )}
                    {alerts.critical === 0 && alerts.warning === 0 && (
                        <span>{alerts.caution} medicines expiring within 90 days</span>
                    )}
                </span>
            </div>

            <div className="flex items-center gap-2">
                <button
                    onClick={onViewReport}
                    className="flex items-center gap-1 px-3 py-1 bg-white/20 hover:bg-white/30 
                             rounded text-sm font-medium transition-colors"
                >
                    View Report
                    <ChevronRight size={14} />
                </button>
                <button
                    onClick={() => setDismissed(true)}
                    className="p-1 hover:bg-white/20 rounded transition-colors"
                    aria-label="Dismiss"
                >
                    <X size={16} />
                </button>
            </div>
        </div>
    );
}

export default ExpiryAlertBanner;
