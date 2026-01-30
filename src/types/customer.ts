/**
 * Customer and Loyalty Types
 * For customer management and loyalty points program
 */

// Customer tier based on total lifetime spend
export type CustomerTier = 'bronze' | 'silver' | 'gold' | 'platinum';

// Tier thresholds (in INR)
export const TIER_THRESHOLDS = {
    bronze: 0,
    silver: 500,
    gold: 2000,
    platinum: 5000
};

// Loyalty configuration
export const LOYALTY_CONFIG = {
    pointsPerRupee: 0.1,      // 1 point per ₹10 spent
    pointValue: 0.1,           // 1 point = ₹0.10
    minRedeemPoints: 50,       // Minimum points to redeem
    maxRedeemPercent: 50       // Max % of bill that can be paid with points
};

/**
 * Customer interface
 */
export interface Customer {
    id: string;
    phone: string;             // Primary identifier (10-digit)
    name: string;
    email?: string;
    address?: string;

    // Loyalty program
    loyaltyPoints: number;     // Current redeemable balance
    totalSpent: number;        // Lifetime spend in INR
    totalPointsEarned: number; // Lifetime points earned
    totalPointsRedeemed: number;

    // Tier (computed from totalSpent)
    tier: CustomerTier;

    // Stats
    totalBills: number;
    lastVisit?: string;        // ISO date of last purchase

    // Multi-branch support
    branchId?: string;         // Home branch (optional)

    createdAt: string;
    updatedAt: string;
}

/**
 * Loyalty transaction record
 */
export interface LoyaltyTransaction {
    id: string;
    customerId: string;
    billId?: string;           // Link to bill if earned/redeemed during purchase

    type: 'earn' | 'redeem' | 'adjustment' | 'expire';
    points: number;            // Positive for earn, negative for redeem
    balanceAfter: number;      // Points balance after this transaction

    description: string;       // e.g., "Earned from Bill #1234"

    // For adjustments
    adjustedBy?: string;       // Staff who made adjustment
    reason?: string;           // Reason for manual adjustment

    createdAt: string;
    branchId?: string;
}

/**
 * Calculate tier from total spend
 */
export function calculateTier(totalSpent: number): CustomerTier {
    if (totalSpent >= TIER_THRESHOLDS.platinum) return 'platinum';
    if (totalSpent >= TIER_THRESHOLDS.gold) return 'gold';
    if (totalSpent >= TIER_THRESHOLDS.silver) return 'silver';
    return 'bronze';
}

/**
 * Calculate points earned from purchase amount
 */
export function calculatePointsEarned(amount: number): number {
    return Math.floor(amount * LOYALTY_CONFIG.pointsPerRupee);
}

/**
 * Calculate rupee value of points
 */
export function pointsToRupees(points: number): number {
    return points * LOYALTY_CONFIG.pointValue;
}

/**
 * Calculate max redeemable points for a bill
 */
export function getMaxRedeemablePoints(billTotal: number, availablePoints: number): number {
    const maxPointsValue = billTotal * (LOYALTY_CONFIG.maxRedeemPercent / 100);
    const maxPointsFromValue = Math.floor(maxPointsValue / LOYALTY_CONFIG.pointValue);
    return Math.min(availablePoints, maxPointsFromValue);
}

/**
 * Get tier display info
 */
export const TIER_DISPLAY: Record<CustomerTier, { label: string; color: string; icon: string }> = {
    bronze: {
        label: 'Bronze',
        color: 'text-orange-700 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/30',
        icon: '🥉'
    },
    silver: {
        label: 'Silver',
        color: 'text-gray-600 bg-gray-200 dark:text-gray-300 dark:bg-gray-700',
        icon: '🥈'
    },
    gold: {
        label: 'Gold',
        color: 'text-yellow-700 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30',
        icon: '🥇'
    },
    platinum: {
        label: 'Platinum',
        color: 'text-purple-700 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/30',
        icon: '💎'
    }
};
