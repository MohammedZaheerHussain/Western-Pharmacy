/**
 * Feature Access Hook
 * Controls access to Pro/Premium features based on user plan
 */

import { useMemo } from 'react';
import { PharmacySettings } from '../components/SettingsModal';

export type UserPlan = 'demo' | 'basic' | 'pro' | 'premium';

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
}

/** Get current user plan from settings/auth */
function getCurrentPlan(_settings: PharmacySettings): UserPlan {
    // In a full implementation, this would check Supabase auth
    // For now, we'll use a setting or default to 'pro' for development
    // @ts-expect-error - plan may not exist in settings type yet
    const plan = _settings?.plan as UserPlan | undefined;
    return plan || 'pro'; // Default to pro for development
}

/** Get plan display name */
function getPlanDisplayName(plan: UserPlan): string {
    switch (plan) {
        case 'demo': return 'Demo';
        case 'basic': return 'Basic';
        case 'pro': return 'Pro';
        case 'premium': return 'Premium';
        default: return 'Unknown';
    }
}

/** Hook to check feature access based on user plan */
export function useFeatureAccess(settings: PharmacySettings): FeatureAccess {
    const plan = getCurrentPlan(settings);

    return useMemo(() => {
        const isPro = plan === 'pro' || plan === 'premium';
        const isPremium = plan === 'premium';
        const isDemo = plan === 'demo';

        return {
            // Basic features - all plans
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

            // Limits
            monthlyBillLimit: isDemo ? Infinity : (plan === 'basic' ? 200 : Infinity),
            isUnlimitedBills: plan !== 'basic',

            // Plan info
            currentPlan: plan,
            planDisplayName: getPlanDisplayName(plan)
        };
    }, [plan]);
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

export default useFeatureAccess;
