/**
 * WhatsApp Receipt Service
 * Send bill receipts via WhatsApp
 */

export interface WhatsAppConfig {
    businessPhone?: string;     // For Business API
    defaultMessage?: string;    // Custom message template
}

/**
 * Format receipt as WhatsApp message text
 */
export function formatReceiptMessage(
    billNumber: string,
    date: string,
    items: { name: string; quantity: number; amount: number }[],
    subtotal: number,
    discount: number,
    tax: number,
    grandTotal: number,
    pharmacyName: string,
    pharmacyPhone?: string
): string {
    const lines: string[] = [];

    // Header
    lines.push(`🧾 *${pharmacyName}*`);
    lines.push(`Receipt #${billNumber}`);
    lines.push(`📅 ${new Date(date).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    })}`);
    lines.push('');
    lines.push('━━━━━━━━━━━━━━━━━━');

    // Items
    items.forEach(item => {
        const qtyStr = item.quantity > 1 ? ` x${item.quantity}` : '';
        lines.push(`${item.name}${qtyStr}`);
        lines.push(`   ₹${item.amount.toFixed(2)}`);
    });

    lines.push('━━━━━━━━━━━━━━━━━━');

    // Totals
    if (subtotal !== grandTotal) {
        lines.push(`Subtotal: ₹${subtotal.toFixed(2)}`);
    }
    if (discount > 0) {
        lines.push(`Discount: -₹${discount.toFixed(2)}`);
    }
    if (tax > 0) {
        lines.push(`Tax: ₹${tax.toFixed(2)}`);
    }
    lines.push(`*Total: ₹${grandTotal.toFixed(2)}*`);
    lines.push('');

    // Footer
    lines.push('Thank you for your purchase! 🙏');
    if (pharmacyPhone) {
        lines.push(`📞 ${pharmacyPhone}`);
    }

    return lines.join('\n');
}

/**
 * Generate WhatsApp URL for sending receipt
 * Uses wa.me links which work on both mobile and web
 */
export function generateWhatsAppUrl(
    phoneNumber: string,
    message: string
): string {
    // Clean phone number - remove spaces, dashes, etc.
    let cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');

    // Add country code if not present (default to India)
    if (!cleanPhone.startsWith('+')) {
        if (cleanPhone.startsWith('91')) {
            cleanPhone = '+' + cleanPhone;
        } else if (cleanPhone.length === 10) {
            cleanPhone = '+91' + cleanPhone;
        }
    }

    // Remove the + for wa.me URL
    cleanPhone = cleanPhone.replace('+', '');

    // Encode the message
    const encodedMessage = encodeURIComponent(message);

    return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}

/**
 * Open WhatsApp with pre-filled receipt message
 */
export function sendReceiptViaWhatsApp(
    customerPhone: string,
    billNumber: string,
    date: string,
    items: { name: string; quantity: number; amount: number }[],
    subtotal: number,
    discount: number,
    tax: number,
    grandTotal: number,
    pharmacyName: string,
    pharmacyPhone?: string
): void {
    const message = formatReceiptMessage(
        billNumber,
        date,
        items,
        subtotal,
        discount,
        tax,
        grandTotal,
        pharmacyName,
        pharmacyPhone
    );

    const url = generateWhatsAppUrl(customerPhone, message);

    // Open in new tab/window
    window.open(url, '_blank');
}

/**
 * Validate phone number for WhatsApp
 */
export function isValidWhatsAppNumber(phone: string): boolean {
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');

    // Indian numbers: 10 digits or 12 digits (with 91)
    if (digits.length === 10) return true;
    if (digits.length === 12 && digits.startsWith('91')) return true;

    // International numbers: varies, but at least 10 digits
    if (digits.length >= 10 && digits.length <= 15) return true;

    return false;
}

/**
 * Format phone number for display
 */
export function formatPhoneDisplay(phone: string): string {
    const digits = phone.replace(/\D/g, '');

    if (digits.length === 10) {
        // Indian format: XXXXX XXXXX
        return `${digits.slice(0, 5)} ${digits.slice(5)}`;
    }

    if (digits.length === 12 && digits.startsWith('91')) {
        // With country code: +91 XXXXX XXXXX
        return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
    }

    return phone;
}

/**
 * Generate PDF download link text for WhatsApp
 */
export function generatePdfMessage(
    billNumber: string,
    pdfUrl: string,
    pharmacyName: string
): string {
    return `🧾 Your receipt from *${pharmacyName}*\n\nReceipt #${billNumber}\n\n📄 Download PDF: ${pdfUrl}\n\nThank you for your purchase! 🙏`;
}
