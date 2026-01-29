/**
 * GST Service - Tax Calculation and Validation
 * Handles GST compliance for Indian pharmacy billing
 */

import {
    GSTConfig,
    GSTINValidation,
    ItemTaxDetails,
    TaxSummary,
    GSTBillItem,
    GSTInvoice,
    INDIAN_STATES,
    DEFAULT_HSN_MEDICINES
} from '../types/tax';
import { Bill, BillItem } from '../types/medicine';

/**
 * Validate GSTIN format and checksum
 * GSTIN Format: 2 State + 10 PAN + 1 Entity + 1 Z + 1 Checksum
 */
export function validateGSTIN(gstin: string): GSTINValidation {
    if (!gstin) {
        return { valid: false, error: 'GSTIN is required' };
    }

    const cleanGstin = gstin.toUpperCase().trim();

    // Check length
    if (cleanGstin.length !== 15) {
        return { valid: false, error: 'GSTIN must be 15 characters' };
    }

    // Check format with regex
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!gstinRegex.test(cleanGstin)) {
        return { valid: false, error: 'Invalid GSTIN format' };
    }

    // Extract state code
    const stateCode = cleanGstin.substring(0, 2);
    const state = INDIAN_STATES.find(s => s.code === stateCode);

    if (!state) {
        return { valid: false, error: 'Invalid state code in GSTIN' };
    }

    // Validate checksum (Luhn algorithm variant)
    const checksumValid = validateGSTINChecksum(cleanGstin);

    return {
        valid: checksumValid,
        stateCode: stateCode,
        stateName: state.name,
        checksum: checksumValid,
        error: checksumValid ? undefined : 'Invalid checksum'
    };
}

/**
 * GSTIN Checksum validation using weighted sum
 */
function validateGSTINChecksum(gstin: string): boolean {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let sum = 0;

    for (let i = 0; i < 14; i++) {
        const char = gstin[i];
        let value = chars.indexOf(char);
        if (value === -1) value = parseInt(char, 10);

        const factor = (i % 2 === 0) ? 1 : 2;
        const product = value * factor;
        sum += Math.floor(product / 36) + (product % 36);
    }

    const remainder = sum % 36;
    const checkDigit = (36 - remainder) % 36;
    const expectedChar = checkDigit < 10 ? String(checkDigit) : chars[checkDigit - 10];

    return gstin[14] === expectedChar;
}

/**
 * Calculate tax details for a single item
 */
export function calculateItemTax(
    taxableValue: number,
    taxRate: number,
    isInterState: boolean
): ItemTaxDetails {
    const halfRate = taxRate / 2;

    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;

    if (isInterState) {
        // Inter-state: Only IGST
        igstAmount = (taxableValue * taxRate) / 100;
    } else {
        // Intra-state: CGST + SGST (half each)
        cgstAmount = (taxableValue * halfRate) / 100;
        sgstAmount = (taxableValue * halfRate) / 100;
    }

    const totalTax = cgstAmount + sgstAmount + igstAmount;

    return {
        hsn: DEFAULT_HSN_MEDICINES,
        taxableValue: roundToTwo(taxableValue),
        taxRate,
        cgstRate: isInterState ? 0 : halfRate,
        cgstAmount: roundToTwo(cgstAmount),
        sgstRate: isInterState ? 0 : halfRate,
        sgstAmount: roundToTwo(sgstAmount),
        igstRate: isInterState ? taxRate : 0,
        igstAmount: roundToTwo(igstAmount),
        totalWithTax: roundToTwo(taxableValue + totalTax)
    };
}

/**
 * Calculate tax summary for entire invoice
 */
export function calculateTaxSummary(
    items: GSTBillItem[]
): TaxSummary {
    let taxableValue = 0;
    let cgstTotal = 0;
    let sgstTotal = 0;
    let igstTotal = 0;

    // Group by tax rate
    const rateMap = new Map<number, { taxable: number; cgst: number; sgst: number; igst: number }>();

    items.forEach(item => {
        const { taxDetails, taxRate } = item;

        taxableValue += taxDetails.taxableValue;
        cgstTotal += taxDetails.cgstAmount;
        sgstTotal += taxDetails.sgstAmount;
        igstTotal += taxDetails.igstAmount;

        // Accumulate by rate
        const existing = rateMap.get(taxRate) || { taxable: 0, cgst: 0, sgst: 0, igst: 0 };
        rateMap.set(taxRate, {
            taxable: existing.taxable + taxDetails.taxableValue,
            cgst: existing.cgst + taxDetails.cgstAmount,
            sgst: existing.sgst + taxDetails.sgstAmount,
            igst: existing.igst + taxDetails.igstAmount
        });
    });

    const totalTax = cgstTotal + sgstTotal + igstTotal;

    // Convert map to array
    const rateWiseTax = Array.from(rateMap.entries()).map(([rate, values]) => ({
        rate,
        taxableValue: roundToTwo(values.taxable),
        cgst: roundToTwo(values.cgst),
        sgst: roundToTwo(values.sgst),
        igst: roundToTwo(values.igst)
    }));

    return {
        taxableValue: roundToTwo(taxableValue),
        cgstTotal: roundToTwo(cgstTotal),
        sgstTotal: roundToTwo(sgstTotal),
        igstTotal: roundToTwo(igstTotal),
        totalTax: roundToTwo(totalTax),
        grandTotal: roundToTwo(taxableValue + totalTax),
        rateWiseTax
    };
}

/**
 * Convert bill items to GST bill items with tax calculation
 */
export function convertToGSTItems(
    items: BillItem[],
    defaultTaxRate: number,
    isInterState: boolean,
    medicineHSNMap?: Map<string, { hsn: string; taxRate: number }>
): GSTBillItem[] {
    return items.map(item => {
        // Get HSN and rate from medicine data or use defaults
        const medicineData = medicineHSNMap?.get(item.medicineId);
        const hsn = medicineData?.hsn || DEFAULT_HSN_MEDICINES;
        const taxRate = medicineData?.taxRate || defaultTaxRate;

        // For medicines, the price is usually MRP (inclusive of tax)
        // We need to calculate taxable value from MRP
        const taxableValue = calculateTaxableFromMRP(item.total, taxRate);
        const taxDetails = calculateItemTax(taxableValue, taxRate, isInterState);

        // Override HSN
        taxDetails.hsn = hsn;

        return {
            ...item,
            hsn,
            taxRate,
            taxDetails
        };
    });
}

/**
 * Calculate taxable value from MRP (inclusive price)
 * MRP = Taxable + Tax = Taxable * (1 + rate/100)
 * Taxable = MRP / (1 + rate/100)
 */
export function calculateTaxableFromMRP(mrp: number, taxRate: number): number {
    return roundToTwo(mrp / (1 + taxRate / 100));
}

/**
 * Create GST invoice from regular bill
 */
export function createGSTInvoice(
    bill: Bill,
    gstConfig: GSTConfig,
    buyerStateCode?: string,
    buyerGstin?: string
): GSTInvoice {
    const isInterState = buyerStateCode ? buyerStateCode !== gstConfig.stateCode : false;
    const placeOfSupply = buyerStateCode || gstConfig.stateCode;
    const placeOfSupplyName = INDIAN_STATES.find(s => s.code === placeOfSupply)?.name || gstConfig.stateName;

    // Convert items
    const gstItems = convertToGSTItems(bill.items, gstConfig.defaultTaxRate, isInterState);

    // Calculate tax summary
    const taxSummary = calculateTaxSummary(gstItems);

    // Calculate round off (round to nearest rupee)
    const exactTotal = taxSummary.grandTotal - bill.discountAmount;
    const roundedTotal = Math.round(exactTotal);
    const roundOff = roundToTwo(roundedTotal - exactTotal);

    return {
        ...bill,
        seller: {
            gstin: gstConfig.gstin,
            legalName: gstConfig.legalName,
            tradeName: gstConfig.tradeName,
            address: gstConfig.address,
            stateCode: gstConfig.stateCode,
            stateName: gstConfig.stateName
        },
        buyer: bill.customerName ? {
            name: bill.customerName,
            gstin: buyerGstin,
            stateCode: buyerStateCode,
            stateName: placeOfSupplyName
        } : undefined,
        invoiceType: buyerGstin ? 'B2B' : 'B2C',
        isInterState,
        placeOfSupply: `${placeOfSupply} - ${placeOfSupplyName}`,
        reverseCharge: false,
        items: gstItems,
        taxSummary,
        roundOff,
        amountInWords: numberToWords(roundedTotal)
    };
}

/**
 * Format GST invoice number
 * Format: FY/TYPE/SERIES/NUMBER
 */
export function formatGSTInvoiceNumber(
    billNumber: string,
    date: Date,
    prefix?: string
): string {
    const fy = getFiscalYear(date);
    const invoicePrefix = prefix || 'INV';
    return `${fy}/${invoicePrefix}/${billNumber}`;
}

/**
 * Get fiscal year string (e.g., "24-25" for 2024-25)
 */
function getFiscalYear(date: Date): string {
    const year = date.getFullYear();
    const month = date.getMonth(); // 0-indexed

    if (month >= 3) { // April onwards
        return `${year % 100}-${(year + 1) % 100}`;
    } else {
        return `${(year - 1) % 100}-${year % 100}`;
    }
}

/**
 * Round to 2 decimal places
 */
function roundToTwo(num: number): number {
    return Math.round(num * 100) / 100;
}

/**
 * Convert number to words (Indian numbering system)
 */
export function numberToWords(num: number): string {
    if (num === 0) return 'Zero Rupees Only';

    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
        'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
        'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    function convertLessThanThousand(n: number): string {
        if (n === 0) return '';
        if (n < 20) return ones[n];
        if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
        return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convertLessThanThousand(n % 100) : '');
    }

    const crore = Math.floor(num / 10000000);
    const lakh = Math.floor((num % 10000000) / 100000);
    const thousand = Math.floor((num % 100000) / 1000);
    const rest = num % 1000;

    let result = '';
    if (crore) result += convertLessThanThousand(crore) + ' Crore ';
    if (lakh) result += convertLessThanThousand(lakh) + ' Lakh ';
    if (thousand) result += convertLessThanThousand(thousand) + ' Thousand ';
    if (rest) result += convertLessThanThousand(rest);

    return result.trim() + ' Rupees Only';
}

/**
 * Generate GST return data (GSTR-1 format)
 */
export function generateGSTR1Data(invoices: GSTInvoice[], period: { month: number; year: number }) {
    const b2c = invoices.filter(inv => inv.invoiceType === 'B2C');
    const b2b = invoices.filter(inv => inv.invoiceType === 'B2B');

    return {
        period: `${period.month.toString().padStart(2, '0')}${period.year}`,
        b2b: b2b.map(inv => ({
            ctin: inv.buyer?.gstin,
            inv: [{
                inum: inv.billNumber,
                idt: inv.createdAt.split('T')[0],
                val: inv.taxSummary.grandTotal,
                pos: inv.placeOfSupply.substring(0, 2),
                rchrg: inv.reverseCharge ? 'Y' : 'N',
                itms: inv.taxSummary.rateWiseTax.map(tax => ({
                    rt: tax.rate,
                    txval: tax.taxableValue,
                    iamt: tax.igst,
                    camt: tax.cgst,
                    samt: tax.sgst
                }))
            }]
        })),
        b2cs: groupB2CByRate(b2c)
    };
}

function groupB2CByRate(invoices: GSTInvoice[]) {
    const grouped = new Map<number, { taxable: number; cgst: number; sgst: number; igst: number }>();

    invoices.forEach(inv => {
        inv.taxSummary.rateWiseTax.forEach(tax => {
            const existing = grouped.get(tax.rate) || { taxable: 0, cgst: 0, sgst: 0, igst: 0 };
            grouped.set(tax.rate, {
                taxable: existing.taxable + tax.taxableValue,
                cgst: existing.cgst + tax.cgst,
                sgst: existing.sgst + tax.sgst,
                igst: existing.igst + tax.igst
            });
        });
    });

    return Array.from(grouped.entries()).map(([rate, values]) => ({
        rt: rate,
        typ: 'OE',
        txval: values.taxable,
        iamt: values.igst,
        camt: values.cgst,
        samt: values.sgst
    }));
}
