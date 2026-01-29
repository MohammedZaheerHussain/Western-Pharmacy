/**
 * Purchase Management Types
 * For Pro and Premium plans - tracks suppliers and purchase orders
 */

/** Supplier/Vendor information */
export interface Supplier {
    id: string;
    name: string;
    gstin?: string;
    contactPerson: string;
    phone: string;
    email?: string;
    address: string;
    city?: string;
    state?: string;
    pincode?: string;
    paymentTerms?: string;      // e.g., "Net 30", "COD"
    notes?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

/** Single item in a purchase order */
export interface PurchaseItem {
    id: string;
    medicineId?: string;        // Link to existing medicine or null for new
    medicineName: string;
    brand?: string;
    batchNumber: string;
    expiryDate: string;
    quantity: number;           // Quantity received (strips)
    freeQuantity: number;       // Free strips (scheme)
    purchasePrice: number;      // Cost per strip
    mrp: number;                // MRP per strip
    discountPercent: number;    // Discount on purchase
    gstRate: number;            // GST rate (5, 12, 18)
    netAmount: number;          // After discount
    gstAmount: number;          // GST on net amount
    totalAmount: number;        // Net + GST
}

/** Purchase order status */
export type PurchaseStatus = 'draft' | 'confirmed' | 'received' | 'cancelled';

/** Payment status for purchase */
export type PaymentStatus = 'pending' | 'partial' | 'paid';

/** Purchase Order / Goods Receipt */
export interface PurchaseOrder {
    id: string;
    poNumber: string;           // Auto-generated PO number
    supplierId: string;
    supplierName: string;
    invoiceNumber?: string;     // Supplier's invoice number
    invoiceDate?: string;       // Supplier's invoice date
    receivedDate: string;       // When goods were received

    items: PurchaseItem[];

    // Totals
    subtotal: number;           // Before tax
    totalDiscount: number;
    taxableValue: number;
    gstAmount: number;
    roundOff: number;
    grandTotal: number;

    // Payment tracking
    paymentStatus: PaymentStatus;
    paidAmount: number;
    balanceAmount: number;

    // Status
    status: PurchaseStatus;

    notes?: string;
    createdAt: string;
    updatedAt: string;
}

/** Payment record for partial payments */
export interface PurchasePayment {
    id: string;
    purchaseOrderId: string;
    amount: number;
    paymentMode: 'cash' | 'upi' | 'bank_transfer' | 'cheque';
    reference?: string;         // Cheque/transaction number
    paymentDate: string;
    notes?: string;
    createdAt: string;
}

/** Summary for dashboard */
export interface PurchaseSummary {
    totalPurchases: number;
    pendingPayments: number;
    suppliersCount: number;
    thisMonthPurchases: number;
    topSuppliers: { name: string; total: number }[];
}

/** Form data for creating/editing supplier */
export interface SupplierFormData {
    name: string;
    gstin?: string;
    contactPerson: string;
    phone: string;
    email?: string;
    address: string;
    city?: string;
    state?: string;
    pincode?: string;
    paymentTerms?: string;
    notes?: string;
}

/** Form data for purchase item entry */
export interface PurchaseItemFormData {
    medicineName: string;
    brand?: string;
    batchNumber: string;
    expiryDate: string;
    quantity: number;
    freeQuantity: number;
    purchasePrice: number;
    mrp: number;
    discountPercent: number;
    gstRate: number;
}

/** Adds purchase price tracking to Batch */
export interface BatchWithPurchase {
    purchasePrice?: number;     // Cost price per strip
    supplierId?: string;        // Which supplier
    purchaseOrderId?: string;   // Which PO
    margin?: number;            // Profit margin %
}
