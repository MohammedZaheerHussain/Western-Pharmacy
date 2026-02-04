/**
 * PurchaseModal - Shows pricing plans and upgrade options
 * Displayed when users try to access Pro/Premium locked features
 */

import { useState } from 'react';
import { X, Check, Crown, Zap, Star, Phone, Mail } from 'lucide-react';

interface PurchaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    lockedFeature?: string;
    requiredPlan?: 'pro' | 'premium';
}

interface PlanInfo {
    name: string;
    tier: 'basic' | 'pro' | 'premium';
    price: number;
    yearlyPrice: number;
    features: string[];
    icon: React.ReactNode;
    color: string;
    popular?: boolean;
}

const PLANS: PlanInfo[] = [
    {
        name: 'Basic',
        tier: 'basic',
        price: 5000,
        yearlyPrice: 1000,
        icon: <Star className="w-6 h-6" />,
        color: 'from-gray-400 to-gray-600',
        features: [
            'Inventory Management',
            'Basic Billing',
            'GST Invoices',
            '200 Bills/Month',
            'Basic Reports'
        ]
    },
    {
        name: 'Pro',
        tier: 'pro',
        price: 7000,
        yearlyPrice: 2000,
        icon: <Zap className="w-6 h-6" />,
        color: 'from-amber-500 to-orange-500',
        popular: true,
        features: [
            'Everything in Basic',
            'Advanced Reports',
            'Purchase Management',
            'Supplier Management',
            'Barcode Support',
            'WhatsApp Integration',
            'Unlimited Bills'
        ]
    },
    {
        name: 'Premium',
        tier: 'premium',
        price: 10000,
        yearlyPrice: 3000,
        icon: <Crown className="w-6 h-6" />,
        color: 'from-purple-500 to-indigo-600',
        features: [
            'Everything in Pro',
            'Multi-User Access',
            'Staff Management',
            'Activity Logs',
            'Settlement Reports',
            'Priority Support',
            'Custom Branding'
        ]
    }
];

export function PurchaseModal({ isOpen, onClose, lockedFeature, requiredPlan }: PurchaseModalProps) {
    const [selectedPlan, setSelectedPlan] = useState<'pro' | 'premium'>(requiredPlan || 'pro');
    const [priceType, setPriceType] = useState<'yearly' | 'lifetime'>('lifetime');

    if (!isOpen) return null;

    const handleContactSales = () => {
        const phone = '+91-XXXXXXXXXX'; // Replace with actual number
        const message = selectedPlan === 'premium'
            ? `Hi, I'm interested in upgrading to Premium plan for Western Pharmacy`
            : `Hi, I'm interested in upgrading to Pro plan for Western Pharmacy`;
        window.open(`https://wa.me/${phone.replace(/[-\s]/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between z-10">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            Upgrade Your Plan
                        </h2>
                        {lockedFeature && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                <span className="text-amber-500">🔒</span> {lockedFeature} requires {requiredPlan === 'premium' ? 'Premium' : 'Pro'} plan
                            </p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Price Toggle */}
                <div className="px-6 py-4 flex justify-center">
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-1 inline-flex">
                        <button
                            onClick={() => setPriceType('yearly')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${priceType === 'yearly'
                                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                                    : 'text-gray-600 dark:text-gray-400'
                                }`}
                        >
                            Yearly
                        </button>
                        <button
                            onClick={() => setPriceType('lifetime')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${priceType === 'lifetime'
                                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                                    : 'text-gray-600 dark:text-gray-400'
                                }`}
                        >
                            Lifetime <span className="text-xs text-green-500 font-semibold">Save 60%+</span>
                        </button>
                    </div>
                </div>

                {/* Plans Grid */}
                <div className="px-6 pb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {PLANS.map((plan) => {
                        const isSelected = plan.tier === selectedPlan;
                        const isCurrent = plan.tier === 'basic'; // Assuming current is basic
                        const price = priceType === 'yearly' ? plan.yearlyPrice : plan.price;

                        return (
                            <div
                                key={plan.tier}
                                onClick={() => plan.tier !== 'basic' && setSelectedPlan(plan.tier as 'pro' | 'premium')}
                                className={`relative rounded-xl border-2 p-5 cursor-pointer transition-all
                                    ${isSelected
                                        ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/50 dark:bg-amber-900/10'
                                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}
                                    ${plan.tier === 'basic' ? 'opacity-60 cursor-default' : ''}
                                `}
                            >
                                {/* Popular Badge */}
                                {plan.popular && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                        <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                                            Most Popular
                                        </span>
                                    </div>
                                )}

                                {/* Plan Header */}
                                <div className="flex items-center gap-3 mb-4">
                                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${plan.color} flex items-center justify-center text-white`}>
                                        {plan.icon}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 dark:text-white">
                                            {plan.name}
                                        </h3>
                                        {isCurrent && (
                                            <span className="text-xs text-gray-500">Current Plan</span>
                                        )}
                                    </div>
                                </div>

                                {/* Price */}
                                <div className="mb-4">
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-2xl font-bold text-gray-900 dark:text-white">
                                            ₹{price.toLocaleString('en-IN')}
                                        </span>
                                        <span className="text-sm text-gray-500">
                                            /{priceType === 'yearly' ? 'year' : 'lifetime'}
                                        </span>
                                    </div>
                                </div>

                                {/* Features */}
                                <ul className="space-y-2">
                                    {plan.features.map((feature, idx) => (
                                        <li key={idx} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                            <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        );
                    })}
                </div>

                {/* Footer with CTA */}
                <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-sm text-gray-600 dark:text-gray-400 text-center sm:text-left">
                            <p>Need help choosing? Contact us for a free consultation</p>
                            <div className="flex items-center gap-4 mt-1 justify-center sm:justify-start">
                                <a href="tel:+91-XXXXXXXXXX" className="flex items-center gap-1 text-medical-blue hover:underline">
                                    <Phone className="w-3 h-3" /> Call
                                </a>
                                <a href="mailto:support@billova.com" className="flex items-center gap-1 text-medical-blue hover:underline">
                                    <Mail className="w-3 h-3" /> Email
                                </a>
                            </div>
                        </div>

                        <button
                            onClick={handleContactSales}
                            className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white 
                                     rounded-lg font-semibold hover:from-amber-600 hover:to-orange-600 
                                     transition-all shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/30"
                        >
                            Upgrade to {selectedPlan === 'premium' ? 'Premium' : 'Pro'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Global state for purchase modal (simple approach without context)
let purchaseModalRef: {
    open: (feature?: string, plan?: 'pro' | 'premium') => void;
    close: () => void;
} | null = null;

export function setPurchaseModalRef(ref: typeof purchaseModalRef) {
    purchaseModalRef = ref;
}

export function openPurchaseModal(feature?: string, plan?: 'pro' | 'premium') {
    purchaseModalRef?.open(feature, plan);
}

export function closePurchaseModal() {
    purchaseModalRef?.close();
}

export default PurchaseModal;
