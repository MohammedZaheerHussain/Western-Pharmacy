/**
 * Feature Access Hook
 * Controls access to Pro/Premium features based on user plan
 * Also enforces license expiry and view-only mode
 */

import { useMemo } from 'react';
import { PharmacySettings } from '../components/SettingsModal';
import { openPurchaseModal } from '../components/PurchaseModal';
import { calculateLicenseStatus } from '../services/licenseGuard';

export type UserPlan = 'demo' | 'demo_basic' | 'demo_pro' | 'demo_premium' | 'basic' | 'pro' | 'premium';

interface FeatureAccess {
    // Basic features (all plans)
    canAccessInventory: boolean;
    canAccessBilling: boolean;
    canAccessBasicReports: boolean;
    canAccessGSTInvoice: boolean;

    // Pro features
    canAccessAdvancedReports: boolean;
    canAccessPurchases: boolean;
    canAccessSuppliers: boolean;
    canAccessBarcode: boolean;
    canAccessWhatsApp: boolean;

    // Premium features
    canAccessMultiUser: boolean;
    canAccessStaffManagement: boolean;
    canAccessActivityLogs: boolean;
    canAccessSettlement: boolean;

    // Limits
    monthlyBillLimit: number;
    isUnlimitedBills: boolean;

    // Plan info
    currentPlan: UserPlan;
    planDisplayName: string;
    isDemo: boolean;
    effectiveTier: 'basic' | 'pro' | 'premium';

    // License expiry (separate flags for analytics)
    isDemoExpired: boolean;
    isLicenseExpired: boolean;
    isExpired: boolean;          // Combined: demo OR license expired
    isGracePeriod: boolean;      // Paid plans only, 7 days after expiry
    graceDaysRemaining: number;
    daysRemaining: number;       // Days until expiry (0 if expired)
    expiryDate: Date | null;

    // Write permissions (blocked when expired and not in grace)
    canWrite: boolean;
    canCreateBill: boolean;
    canEditInventory: boolean;
    canCreatePurchase: boolean;
    canEditSettings: boolean;
    canExport: boolean;          // Always true - view-only allows export
    canViewData: boolean;        // Always true
}

/** Get current user plan from settings/auth */
function getCurrentPlan(_settings: PharmacySettings): UserPlan {
    // The plan_type comes from user_metadata (e.g., 'premium_lifetime', 'pro_yearly', 'demo_3day')
    // @ts-expect-error - planType may not exist in settings type yet
    const planType = _settings?.planType as string | undefined;

    // @ts-expect-error - isDemo may not exist in settings type yet
    const isDemo = _settings?.isDemo as boolean | undefined;

    if (!planType) {
        // If no plan type, default to pro for development/backwards compatibility
        return 'pro';
    }

    // Parse the plan_type string to extract the tier
    // Format: {tier}_{duration} or demo_{tier}_{duration} or demo_{duration}
    const planLower = planType.toLowerCase();

    // Check if it's a demo plan
    if (planLower.startsWith('demo') || isDemo) {
        // Parse demo plans: demo_3day, demo_basic_3day, demo_pro_3day, demo_premium_3day
        if (planLower.includes('premium')) return 'demo_premium';
        if (planLower.includes('pro')) return 'demo_pro';
        if (planLower.includes('basic')) return 'demo_basic';
        return 'demo'; // Default demo (gets all features)
    }

    // Parse real plans: premium_lifetime, pro_yearly, basic_yearly, etc.
    if (planLower.includes('premium')) return 'premium';
    if (planLower.includes('pro')) return 'pro';
    if (planLower.includes('basic')) return 'basic';

    // Fallback to pro
    return 'pro';
}

/** Get plan display name */
function getPlanDisplayName(plan: UserPlan): string {
    switch (plan) {
        case 'demo': return 'Demo';
        case 'demo_basic': return 'Demo Basic';
        case 'demo_pro': return 'Demo Pro';
        case 'demo_premium': return 'Demo Premium';
        case 'basic': return 'Basic';
        case 'pro': return 'Pro';
        case 'premium': return 'Premium';
        default: return 'Unknown';
    }
}

/** Get effective tier (what features the plan has access to) */
function getEffectiveTier(plan: UserPlan): 'basic' | 'pro' | 'premium' {
    switch (plan) {
        case 'demo': return 'premium'; // Legacy demo gets all features
        case 'demo_basic': return 'basic';
        case 'demo_pro': return 'pro';
        case 'demo_premium': return 'premium';
        case 'basic': return 'basic';
        case 'pro': return 'pro';
        case 'premium': return 'premium';
        default: return 'basic';
    }
}

/** Check if plan is a demo plan */
function isDemoPlan(plan: UserPlan): boolean {
    return plan === 'demo' || plan.startsWith('demo_');
}

/** Hook to check feature access based on user plan */
export function useFeatureAccess(settings: PharmacySettings): FeatureAccess {
    const plan = getCurrentPlan(settings);

    return useMemo(() => {
        const tier = getEffectiveTier(plan);
        const isDemo = isDemoPlan(plan);
        const isPro = tier === 'pro' || tier === 'premium';
        const isPremium = tier === 'premium';

        // Get license status from centralized service
        const licenseStatus = calculateLicenseStatus(
            isDemo,
            settings?.demoExpiresAt || null,
            // @ts-expect-error - licenseExpiresAt may not exist in settings type yet
            settings?.licenseExpiresAt || null
        );

        // Calculate days remaining until expiry (for countdown)
        const daysRemaining = licenseStatus.expiryDate
            ? Math.max(0, Math.ceil((licenseStatus.expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
            : Infinity;

        return {
            // Basic features - all plans (VIEW access always allowed)
            canAccessInventory: true,
            canAccessBilling: true,
            canAccessBasicReports: true,
            canAccessGSTInvoice: true,

            // Pro features
            canAccessAdvancedReports: isPro,
            canAccessPurchases: isPro,
            canAccessSuppliers: isPro,
            canAccessBarcode: isPro,
            canAccessWhatsApp: isPro,

            // Premium features
            canAccessMultiUser: isPremium,
            canAccessStaffManagement: isPremium,
            canAccessActivityLogs: isPremium,
            canAccessSettlement: isPremium,

            // Limits - demos get unlimited for trial experience
            monthlyBillLimit: isDemo ? Infinity : (tier === 'basic' ? 200 : Infinity),
            isUnlimitedBills: isDemo || tier !== 'basic',

            // Plan info
            currentPlan: plan,
            planDisplayName: getPlanDisplayName(plan),
            isDemo,
            effectiveTier: tier,

            // License expiry (separate flags for analytics/diagnostics)
            isDemoExpired: licenseStatus.isDemoExpired,
            isLicenseExpired: licenseStatus.isLicenseExpired,
            isExpired: licenseStatus.isExpired,
            isGracePeriod: licenseStatus.isGracePeriod,
            graceDaysRemaining: licenseStatus.graceDaysRemaining,
            daysRemaining,
            expiryDate: licenseStatus.expiryDate,

            // Write permissions (blocked when expired and not in grace)
            canWrite: licenseStatus.canWrite,
            canCreateBill: licenseStatus.canWrite,
            canEditInventory: licenseStatus.canWrite,
            canCreatePurchase: licenseStatus.canWrite && isPro,
            canEditSettings: licenseStatus.canWrite,
            canExport: true,      // Always allowed - view-only mode still permits export
            canViewData: true     // Always allowed
        };
    }, [plan, settings?.demoExpiresAt]);
}

/** Component to show upgrade prompt when accessing locked feature */
export function UpgradePrompt({ feature, requiredPlan }: { feature: string; requiredPlan: 'pro' | 'premium' }) {
    return (
        <div className="text-center py-12 px-4">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 
                          flex items-center justify-center">
                <span className="text-2xl">🔒</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {feature} is a {requiredPlan === 'premium' ? 'Premium' : 'Pro'} Feature
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                Upgrade your plan to unlock {feature} and other powerful features for your pharmacy.
            </p>
            <button
                onClick={() => {
                    // In production, this would open the admin portal or payment page
                    window.open('https://billova.com/pricing', '_blank');
                }}
                className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white 
                         rounded-lg font-medium hover:from-amber-600 hover:to-orange-600 transition-colors"
            >
                Upgrade to {requiredPlan === 'premium' ? 'Premium' : 'Pro'}
            </button>
        </div>
    );
}

/**
 * FeatureGate - Wraps content and shows it OR shows locked overlay
 * Use this to wrap entire feature sections/pages
 */
interface FeatureGateProps {
    children: React.ReactNode;
    hasAccess: boolean;
    feature: string;
    requiredPlan: 'pro' | 'premium';
    /** If true, shows children with overlay instead of replacing with prompt */
    showPreview?: boolean;
}

export function FeatureGate({ children, hasAccess, feature, requiredPlan, showPreview = false }: FeatureGateProps) {
    if (hasAccess) {
        return <>{children}</>;
    }

    if (showPreview) {
        return (
            <div className="relative">
                {/* Blurred/dimmed preview of the feature */}
                <div className="opacity-30 pointer-events-none blur-[2px] select-none">
                    {children}
                </div>
                {/* Overlay with upgrade prompt */}
                <div className="absolute inset-0 flex items-center justify-center bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm">
                    <div className="text-center p-6 max-w-sm">
                        <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 
                                      flex items-center justify-center shadow-lg">
                            <span className="text-xl">🔒</span>
                        </div>
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                            {requiredPlan === 'premium' ? 'Premium' : 'Pro'} Feature
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            {feature} requires {requiredPlan === 'premium' ? 'Premium' : 'Pro'} plan
                        </p>
                        <button
                            onClick={() => window.open('https://billova.com/pricing', '_blank')}
                            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white 
                                     rounded-lg text-sm font-medium hover:from-amber-600 hover:to-orange-600 transition-colors"
                        >
                            Upgrade Now
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return <UpgradePrompt feature={feature} requiredPlan={requiredPlan} />;
}

/**
 * LockedFeatureOverlay - Shows a small lock badge on a feature card/button
 * Use for navigation items, sidebar menu items, etc.
 */
interface LockedFeatureOverlayProps {
    children: React.ReactNode;
    isLocked: boolean;
    requiredPlan: 'pro' | 'premium';
    onClick?: () => void;
}

export function LockedFeatureOverlay({ children, isLocked, requiredPlan, onClick }: LockedFeatureOverlayProps) {
    if (!isLocked) {
        return <>{children}</>;
    }

    const handleClick = () => {
        if (onClick) {
            onClick();
        } else {
            // Open purchase modal instead of alert
            openPurchaseModal(undefined, requiredPlan);
        }
    };

    return (
        <div className="relative cursor-pointer" onClick={handleClick}>
            {/* Slightly dimmed content */}
            <div className="opacity-60">
                {children}
            </div>
            {/* Lock badge */}
            <div className="absolute top-0 right-0 -mt-1 -mr-1">
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium
                    ${requiredPlan === 'premium'
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'
                    }`}>
                    🔒 {requiredPlan === 'premium' ? 'Premium' : 'Pro'}
                </span>
            </div>
        </div>
    );
}

/**
 * LockedMenuItem - A menu/nav item that shows as locked for restricted features
 * Shows the feature name but with a lock indicator
 */
interface LockedMenuItemProps {
    icon: React.ReactNode;
    label: string;
    isLocked: boolean;
    requiredPlan: 'pro' | 'premium';
    onClick: () => void;
    className?: string;
}

export function LockedMenuItem({ icon, label, isLocked, requiredPlan, onClick, className = '' }: LockedMenuItemProps) {
    const handleClick = () => {
        if (isLocked) {
            // Open purchase modal with feature context
            openPurchaseModal(label, requiredPlan);
        } else {
            onClick();
        }
    };

    return (
        <button
            onClick={handleClick}
            className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg transition-colors
                ${isLocked
                    ? 'opacity-60 hover:bg-gray-100 dark:hover:bg-gray-800'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                } ${className}`}
        >
            <span className={isLocked ? 'opacity-50' : ''}>{icon}</span>
            <span className="flex-1 text-left">{label}</span>
            {isLocked && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium
                    ${requiredPlan === 'premium'
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'
                    }`}>
                    🔒 {requiredPlan === 'premium' ? 'Premium' : 'Pro'}
                </span>
            )}
        </button>
    );
}

/** Helper to determine which plan is required for a feature */
export function getRequiredPlan(featureKey: keyof FeatureAccess): 'basic' | 'pro' | 'premium' {
    const proFeatures = [
        'canAccessAdvancedReports',
        'canAccessPurchases',
        'canAccessSuppliers',
        'canAccessBarcode',
        'canAccessWhatsApp'
    ];
    const premiumFeatures = [
        'canAccessMultiUser',
        'canAccessStaffManagement',
        'canAccessActivityLogs',
        'canAccessSettlement'
    ];

    if (premiumFeatures.includes(featureKey)) return 'premium';
    if (proFeatures.includes(featureKey)) return 'pro';
    return 'basic';
}

export default useFeatureAccess;

