/**
 * License Guard Service
 * Business logic enforcement for license expiry
 * 
 * CRITICAL: This is the second layer of protection.
 * UI layer blocks user actions, this layer blocks business logic.
 */

export interface LicenseStatus {
    // Separate flags for analytics/diagnostics
    isDemoExpired: boolean;
    isLicenseExpired: boolean;

    // Combined for convenience
    isExpired: boolean;

    // Grace period (paid plans only)
    isGracePeriod: boolean;
    graceDaysRemaining: number;

    // Computed permissions
    canWrite: boolean;

    // Expiry info
    expiryDate: Date | null;
    daysSinceExpiry: number;
}

// Contact info constants
export const SUPPORT_PHONE = '9789399389';
export const SUPPORT_WHATSAPP = '919789399389';
export const SUPPORT_EMAIL = 'billovamedical@gmail.com';

// Grace period for paid plans (demo has no grace)
export const PAID_GRACE_DAYS = 7;

/**
 * Assert that the license allows write operations
 * Throws error if license is expired and not in grace period
 * 
 * Call this in every write operation:
 * - createBill()
 * - addMedicine(), updateMedicine(), deleteMedicine()
 * - createPurchase()
 * - updateSettings()
 */
export function assertLicenseActive(license: LicenseStatus): void {
    if (license.isExpired && !license.isGracePeriod) {
        throw new LicenseExpiredError(
            'Your license has expired. Contact support to renew.',
            license.isDemoExpired ? 'demo' : 'paid'
        );
    }
}

/**
 * Check if write operations are allowed (non-throwing version)
 */
export function canPerformWriteOperation(license: LicenseStatus): boolean {
    return license.canWrite;
}

/**
 * Custom error class for license expiry
 */
export class LicenseExpiredError extends Error {
    public readonly type: 'demo' | 'paid';
    public readonly code = 'LICENSE_READ_ONLY';

    constructor(message: string, type: 'demo' | 'paid') {
        super(message);
        this.name = 'LicenseExpiredError';
        this.type = type;
    }
}

/**
 * Calculate license status from settings/auth
 */
export function calculateLicenseStatus(
    isDemo: boolean,
    demoExpiresAt: string | null,
    licenseExpiresAt: string | null
): LicenseStatus {
    const now = new Date();

    // Demo expiry check
    const demoExpiry = demoExpiresAt ? new Date(demoExpiresAt) : null;
    const isDemoExpired = isDemo && demoExpiry ? now > demoExpiry : false;

    // Paid license expiry check
    const licenseExpiry = licenseExpiresAt ? new Date(licenseExpiresAt) : null;
    const isLicenseExpired = !isDemo && licenseExpiry ? now > licenseExpiry : false;

    // Combined expiry
    const isExpired = isDemoExpired || isLicenseExpired;

    // Grace period calculation (only for paid, not demo)
    let isGracePeriod = false;
    let graceDaysRemaining = 0;

    if (isLicenseExpired && licenseExpiry) {
        const daysSinceExpiry = Math.floor(
            (now.getTime() - licenseExpiry.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysSinceExpiry <= PAID_GRACE_DAYS) {
            isGracePeriod = true;
            graceDaysRemaining = PAID_GRACE_DAYS - daysSinceExpiry;
        }
    }

    // Days since expiry
    const expiryDate = isDemo ? demoExpiry : licenseExpiry;
    const daysSinceExpiry = expiryDate && now > expiryDate
        ? Math.floor((now.getTime() - expiryDate.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

    return {
        isDemoExpired,
        isLicenseExpired,
        isExpired,
        isGracePeriod,
        graceDaysRemaining,
        canWrite: !isExpired || isGracePeriod,
        expiryDate,
        daysSinceExpiry
    };
}

/**
 * Get days remaining until expiry (for countdown)
 */
export function getDaysUntilExpiry(expiryDate: string | null): number {
    if (!expiryDate) return Infinity;

    const expiry = new Date(expiryDate);
    const now = new Date();

    if (now > expiry) return 0;

    return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Format WhatsApp message for license renewal
 */
export function getLicenseRenewalWhatsAppUrl(pharmacyName?: string): string {
    const message = pharmacyName
        ? `Hi, I need to renew the Billova Medical license for ${pharmacyName}`
        : 'Hi, I need to renew my Billova Medical license';

    return `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(message)}`;
}

/**
 * Format email for license renewal
 */
export function getLicenseRenewalEmailUrl(pharmacyName?: string): string {
    const subject = 'License Renewal Request - Billova Medical';
    const body = pharmacyName
        ? `Hi,\n\nI need to renew the license for ${pharmacyName}.\n\nThank you.`
        : 'Hi,\n\nI need to renew my Billova Medical license.\n\nThank you.';

    return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
