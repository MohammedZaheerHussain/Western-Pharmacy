/**
 * Tax Types for GST Compliance
 * Supports CGST/SGST (intra-state) and IGST (inter-state)
 */

import { Bill, BillItem } from './medicine';

// Indian State Codes for GST
export const INDIAN_STATES: { code: string; name: string }[] = [
    { code: '01', name: 'Jammu & Kashmir' },
    { code: '02', name: 'Himachal Pradesh' },
    { code: '03', name: 'Punjab' },
    { code: '04', name: 'Chandigarh' },
    { code: '05', name: 'Uttarakhand' },
    { code: '06', name: 'Haryana' },
    { code: '07', name: 'Delhi' },
    { code: '08', name: 'Rajasthan' },
    { code: '09', name: 'Uttar Pradesh' },
    { code: '10', name: 'Bihar' },
    { code: '11', name: 'Sikkim' },
    { code: '12', name: 'Arunachal Pradesh' },
    { code: '13', name: 'Nagaland' },
    { code: '14', name: 'Manipur' },
    { code: '15', name: 'Mizoram' },
    { code: '16', name: 'Tripura' },
    { code: '17', name: 'Meghalaya' },
    { code: '18', name: 'Assam' },
    { code: '19', name: 'West Bengal' },
    { code: '20', name: 'Jharkhand' },
    { code: '21', name: 'Odisha' },
    { code: '22', name: 'Chhattisgarh' },
    { code: '23', name: 'Madhya Pradesh' },
    { code: '24', name: 'Gujarat' },
    { code: '26', name: 'Dadra & Nagar Haveli and Daman & Diu' },
    { code: '27', name: 'Maharashtra' },
    { code: '28', name: 'Andhra Pradesh (Old)' },
    { code: '29', name: 'Karnataka' },
    { code: '30', name: 'Goa' },
    { code: '31', name: 'Lakshadweep' },
    { code: '32', name: 'Kerala' },
    { code: '33', name: 'Tamil Nadu' },
    { code: '34', name: 'Puducherry' },
    { code: '35', name: 'Andaman & Nicobar Islands' },
    { code: '36', name: 'Telangana' },
    { code: '37', name: 'Andhra Pradesh' },
    { code: '38', name: 'Ladakh' },
];

// Common GST rates for medicines
export const GST_RATES = [
    { value: 0, label: 'Nil (0%)' },
    { value: 5, label: '5%' },
    { value: 12, label: '12%' },
    { value: 18, label: '18%' },
] as const;

// Default HSN code for medicines
export const DEFAULT_HSN_MEDICINES = '3004'; // Medicaments for therapeutic/prophylactic use

/** GST Configuration stored in settings */
export interface GSTConfig {
    enabled: boolean;
    gstin: string;              // 15-char GSTIN
    legalName: string;          // Registered business name
    tradeName?: string;         // Trade name (optional)
    stateCode: string;          // 2-digit state code
    stateName: string;          // State name
    defaultTaxRate: number;     // Default GST rate (5, 12, or 18)
    address: string;            // Registered address
    pincode: string;            // PIN code
}

/** Tax breakdown for a single item */
export interface ItemTaxDetails {
    hsn: string;
    taxableValue: number;       // Pre-tax amount
    taxRate: number;            // GST rate %
    cgstRate: number;           // Half of GST rate
    cgstAmount: number;
    sgstRate: number;           // Half of GST rate
    sgstAmount: number;
    igstRate: number;           // Full GST rate (for inter-state)
    igstAmount: number;
    totalWithTax: number;
}

/** Invoice-level tax summary */
export interface TaxSummary {
    taxableValue: number;       // Total pre-tax amount
    cgstTotal: number;
    sgstTotal: number;
    igstTotal: number;
    totalTax: number;
    grandTotal: number;
    // Breakdown by rate
    rateWiseTax: {
        rate: number;
        taxableValue: number;
        cgst: number;
        sgst: number;
        igst: number;
    }[];
}

/** Bill item with GST details */
export interface GSTBillItem extends BillItem {
    hsn: string;
    taxRate: number;
    taxDetails: ItemTaxDetails;
}

/** GST-compliant invoice extending Bill */
export interface GSTInvoice extends Omit<Bill, 'items'> {
    // Seller (Your pharmacy)
    seller: {
        gstin: string;
        legalName: string;
        tradeName?: string;
        address: string;
        stateCode: string;
        stateName: string;
    };

    // Buyer (Customer) - optional for B2C, required for B2B
    buyer?: {
        name: string;
        gstin?: string;         // Required for B2B (> ₹2.5L)
        address?: string;
        stateCode?: string;
        stateName?: string;
    };

    // Invoice details
    invoiceType: 'B2C' | 'B2B';
    isInterState: boolean;      // Determines CGST+SGST vs IGST
    placeOfSupply: string;      // State code where supply happens
    reverseCharge: boolean;     // Usually false for retail

    // Items with tax
    items: GSTBillItem[];

    // Tax summary
    taxSummary: TaxSummary;

    // Amounts
    roundOff: number;           // Round off amount (can be negative)
    amountInWords: string;      // Grand total in words
}

/** GSTIN validation result */
export interface GSTINValidation {
    valid: boolean;
    stateCode?: string;
    stateName?: string;
    checksum?: boolean;
    error?: string;
}
