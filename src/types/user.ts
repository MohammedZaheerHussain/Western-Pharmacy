/**
 * User and Role Types for Multi-user Support
 * Premium feature for role-based access control
 */

export type UserRole = 'owner' | 'manager' | 'pharmacist' | 'cashier';

export interface StaffMember {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    pin?: string;           // 4-digit PIN for quick switch
    phone?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    lastLogin?: string;
}

export interface RolePermissions {
    // Inventory
    canViewInventory: boolean;
    canAddMedicine: boolean;
    canEditMedicine: boolean;
    canDeleteMedicine: boolean;
    canImportExport: boolean;

    // Billing
    canCreateBill: boolean;
    canEditBill: boolean;
    canVoidBill: boolean;
    canApplyDiscount: boolean;
    maxDiscountPercent: number;

    // Reports
    canViewBasicReports: boolean;
    canViewAdvancedReports: boolean;
    canExportReports: boolean;

    // Purchases
    canManageSuppliers: boolean;
    canCreatePurchase: boolean;
    canApprovePurchase: boolean;

    // Settings
    canAccessSettings: boolean;
    canManageStaff: boolean;
    canViewActivityLogs: boolean;

    // Settlement
    canPerformSettlement: boolean;
}

/** Role permission definitions */
export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
    owner: {
        canViewInventory: true,
        canAddMedicine: true,
        canEditMedicine: true,
        canDeleteMedicine: true,
        canImportExport: true,
        canCreateBill: true,
        canEditBill: true,
        canVoidBill: true,
        canApplyDiscount: true,
        maxDiscountPercent: 100,
        canViewBasicReports: true,
        canViewAdvancedReports: true,
        canExportReports: true,
        canManageSuppliers: true,
        canCreatePurchase: true,
        canApprovePurchase: true,
        canAccessSettings: true,
        canManageStaff: true,
        canViewActivityLogs: true,
        canPerformSettlement: true
    },
    manager: {
        canViewInventory: true,
        canAddMedicine: true,
        canEditMedicine: true,
        canDeleteMedicine: true,
        canImportExport: true,
        canCreateBill: true,
        canEditBill: true,
        canVoidBill: true,
        canApplyDiscount: true,
        maxDiscountPercent: 20,
        canViewBasicReports: true,
        canViewAdvancedReports: true,
        canExportReports: true,
        canManageSuppliers: true,
        canCreatePurchase: true,
        canApprovePurchase: false,
        canAccessSettings: false,
        canManageStaff: false,
        canViewActivityLogs: true,
        canPerformSettlement: true
    },
    pharmacist: {
        canViewInventory: true,
        canAddMedicine: true,
        canEditMedicine: true,
        canDeleteMedicine: false,
        canImportExport: false,
        canCreateBill: true,
        canEditBill: false,
        canVoidBill: false,
        canApplyDiscount: true,
        maxDiscountPercent: 10,
        canViewBasicReports: true,
        canViewAdvancedReports: false,
        canExportReports: false,
        canManageSuppliers: false,
        canCreatePurchase: false,
        canApprovePurchase: false,
        canAccessSettings: false,
        canManageStaff: false,
        canViewActivityLogs: false,
        canPerformSettlement: false
    },
    cashier: {
        canViewInventory: true,
        canAddMedicine: false,
        canEditMedicine: false,
        canDeleteMedicine: false,
        canImportExport: false,
        canCreateBill: true,
        canEditBill: false,
        canVoidBill: false,
        canApplyDiscount: true,
        maxDiscountPercent: 5,
        canViewBasicReports: false,
        canViewAdvancedReports: false,
        canExportReports: false,
        canManageSuppliers: false,
        canCreatePurchase: false,
        canApprovePurchase: false,
        canAccessSettings: false,
        canManageStaff: false,
        canViewActivityLogs: false,
        canPerformSettlement: false
    }
};

/** Get display info for role */
export const ROLE_DISPLAY: Record<UserRole, { label: string; color: string; description: string }> = {
    owner: {
        label: 'Owner',
        color: 'text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/30',
        description: 'Full access to all features and settings'
    },
    manager: {
        label: 'Manager',
        color: 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30',
        description: 'All operations except settings and user management'
    },
    pharmacist: {
        label: 'Pharmacist',
        color: 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30',
        description: 'Billing and inventory management'
    },
    cashier: {
        label: 'Cashier',
        color: 'text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/30',
        description: 'Billing only with limited discounts'
    }
};

/** Activity log entry */
export interface ActivityLogEntry {
    id: string;
    timestamp: string;
    userId: string;
    userName: string;
    userRole: UserRole;
    action: ActivityAction;
    entity: string;         // 'medicine', 'bill', 'supplier', etc.
    entityId?: string;
    entityName?: string;
    details?: string;       // Human-readable description
    changes?: {             // For updates
        field: string;
        oldValue: unknown;
        newValue: unknown;
    }[];
    ipAddress?: string;
}

export type ActivityAction =
    | 'login'
    | 'logout'
    | 'create'
    | 'update'
    | 'delete'
    | 'view'
    | 'export'
    | 'import'
    | 'bill_create'
    | 'bill_void'
    | 'bill_edit'
    | 'discount_apply'
    | 'settlement_complete'
    | 'settings_change'
    | 'staff_add'
    | 'staff_remove'
    | 'role_change';

/** End of Day Settlement */
export interface Settlement {
    id: string;
    date: string;           // YYYY-MM-DD
    performedBy: string;    // User ID
    performedByName: string;

    // Cash summary
    openingCash: number;
    expectedCash: number;   // Calculated from bills
    actualCash: number;     // Manual entry
    difference: number;     // actual - expected

    // Sales summary
    totalBills: number;
    totalSales: number;
    totalDiscount: number;
    totalTax: number;

    // Payment breakdown
    cashSales: number;
    cardSales: number;
    upiSales: number;
    creditSales: number;

    // Notes
    notes?: string;
    status: 'pending' | 'completed' | 'reviewed';
    reviewedBy?: string;

    createdAt: string;
    updatedAt: string;
}
