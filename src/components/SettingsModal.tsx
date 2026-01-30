// Settings Modal with GST, Printer, and Shop Details settings
import { useState, useEffect, useRef } from 'react';
import { X, Settings, Percent, Printer, Store, Download, Upload, LogOut, Database, AlertCircle, CheckCircle } from 'lucide-react';

// Paper size presets with dimensions in mm
export type PaperSize = 'thermal-58mm' | 'thermal-80mm' | 'a4' | 'a5' | 'letter' | 'custom';

export const PAPER_SIZES: { value: PaperSize; label: string; width: number; description: string }[] = [
    { value: 'thermal-58mm', label: '58mm Thermal', width: 58, description: 'Small thermal printer (58mm roll)' },
    { value: 'thermal-80mm', label: '80mm Thermal', width: 80, description: 'Standard POS thermal printer' },
    { value: 'a4', label: 'A4', width: 210, description: 'Standard A4 paper (210 × 297mm)' },
    { value: 'a5', label: 'A5', width: 148, description: 'Half A4 size (148 × 210mm)' },
    { value: 'letter', label: 'Letter', width: 216, description: 'US Letter (8.5 × 11 in)' },
    { value: 'custom', label: 'Custom', width: 80, description: 'Set custom width' },
];

export interface PrinterSettings {
    paperSize: PaperSize;
    customWidth: number; // mm, used when paperSize is 'custom'
    fontSize: 'small' | 'medium' | 'large';
    showLogo: boolean;
    autoPrint: boolean; // Auto-print on bill confirm
}

export interface ShopDetails {
    name: string;
    address1: string;
    address2: string;
    city: string;
    state: string;
    pincode: string;
    phone1: string;
    phone2: string;
    gstNumber: string;
    dlNumber1: string; // Drug License Number 1
    dlNumber2: string; // Drug License Number 2
    email: string;
    tagline: string; // e.g., "Wish you a speedy recovery"
    heroText: string; // Header text on receipt (e.g., "INVOICE / RECEIPT")
    footerText: string; // Footer branding text
    logoUrl: string; // Base64 or URL of logo
}

export interface PharmacySettings {
    gstEnabled: boolean;
    gstPercentage: number;
    printer: PrinterSettings;
    shop: ShopDetails;
}

const DEFAULT_SHOP: ShopDetails = {
    name: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    pincode: '',
    phone1: '',
    phone2: '',
    gstNumber: '',
    dlNumber1: '',
    dlNumber2: '',
    email: '',
    tagline: 'Thank you for your purchase!',
    heroText: 'INVOICE / RECEIPT',
    footerText: 'Powered by Billova Medical Billing',
    logoUrl: '',
};

const DEFAULT_PRINTER: PrinterSettings = {
    paperSize: 'thermal-80mm',
    customWidth: 80,
    fontSize: 'medium',
    showLogo: true,
    autoPrint: false,
};

const DEFAULT_SETTINGS: PharmacySettings = {
    gstEnabled: false,
    gstPercentage: 18, // Default GST rate in India
    printer: DEFAULT_PRINTER,
    shop: DEFAULT_SHOP,
};

const SETTINGS_KEY = 'pharmacy-settings';
const SETTINGS_INITIALIZED_KEY = 'pharmacy-settings-initialized';

/** Load settings from localStorage */
export function loadSettings(): PharmacySettings {
    try {
        const stored = localStorage.getItem(SETTINGS_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            return {
                ...DEFAULT_SETTINGS,
                ...parsed,
                printer: { ...DEFAULT_PRINTER, ...parsed.printer },
                shop: { ...DEFAULT_SHOP, ...parsed.shop }
            };
        }
    } catch (e) {
        console.error('Failed to load settings:', e);
    }
    return DEFAULT_SETTINGS;
}

/** Initialize settings with user's pharmacy data (called once on first login) */
export function initializeSettingsFromUserMetadata(pharmacyName?: string): PharmacySettings {
    // Check if already initialized
    const isInitialized = localStorage.getItem(SETTINGS_INITIALIZED_KEY);
    const currentSettings = loadSettings();

    if (isInitialized) {
        return currentSettings; // Already set up, don't override
    }

    // First time - pre-fill with admin-provided pharmacy name
    if (pharmacyName) {
        const initializedSettings: PharmacySettings = {
            ...currentSettings,
            shop: {
                ...currentSettings.shop,
                name: pharmacyName
            }
        };

        // Save and mark as initialized
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(initializedSettings));
        localStorage.setItem(SETTINGS_INITIALIZED_KEY, 'true');

        return initializedSettings;
    }

    return currentSettings;
}

import { syncService } from '../services/syncService';

/** Save settings to localStorage */
export function saveSettings(settings: PharmacySettings): void {
    try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));

        // Queue settings sync
        // Use 'main' as localId for singleton settings
        syncService.queueSync('settings', 'main', 'update', settings)
            .catch(e => console.warn('[Settings] Failed to queue sync:', e));

    } catch (e) {
        console.error('Failed to save settings:', e);
    }
}

/** Get paper width in mm for a given paper size */
export function getPaperWidth(settings: PharmacySettings): number {
    if (settings.printer.paperSize === 'custom') {
        return settings.printer.customWidth;
    }
    return PAPER_SIZES.find(p => p.value === settings.printer.paperSize)?.width || 80;
}



interface SettingsModalProps {
    isOpen: boolean;
    settings: PharmacySettings;
    onClose: () => void;
    onSave: (settings: PharmacySettings) => void;
    // Data management
    onExportCSV?: () => void;
    onImportCSV?: (medicines: any[]) => Promise<void>;
    parseCSV?: (content: string) => {
        valid: any[];
        invalid: { row: number; data: Record<string, string>; errors: string[] }[];
    };
    onLogout?: () => void;
    isAuthEnabled?: boolean;
}

export function SettingsModal({ isOpen, settings, onClose, onSave, onExportCSV, onImportCSV, parseCSV, onLogout, isAuthEnabled }: SettingsModalProps) {
    const [localSettings, setLocalSettings] = useState<PharmacySettings>(settings);
    const [activeTab, setActiveTab] = useState<'shop' | 'tax' | 'printer' | 'data'>('shop');

    // Import state
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [importPreview, setImportPreview] = useState<{ valid: any[]; invalid: any[] } | null>(null);
    const [importing, setImporting] = useState(false);
    const [importError, setImportError] = useState<string | null>(null);
    const [importSuccess, setImportSuccess] = useState(false);

    // Sync with external settings when modal opens
    useEffect(() => {
        if (isOpen) {
            setLocalSettings(settings);
        }
    }, [isOpen, settings]);

    if (!isOpen) return null;

    const handleSave = () => {
        onSave(localSettings);
        saveSettings(localSettings);
        onClose();
    };

    const handleToggleGST = () => {
        setLocalSettings(prev => ({ ...prev, gstEnabled: !prev.gstEnabled }));
    };

    const updatePrinter = (updates: Partial<PrinterSettings>) => {
        setLocalSettings(prev => ({
            ...prev,
            printer: { ...prev.printer, ...updates }
        }));
    };

    const updateShop = (updates: Partial<ShopDetails>) => {
        setLocalSettings(prev => ({
            ...prev,
            shop: { ...prev.shop, ...updates }
        }));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                        <Settings className="text-medical-blue" size={20} />
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Settings</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200 dark:border-gray-700">
                    <button
                        onClick={() => setActiveTab('shop')}
                        className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'shop'
                            ? 'text-medical-blue border-b-2 border-medical-blue bg-blue-50/50 dark:bg-blue-900/20'
                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                            }`}
                    >
                        <Store size={16} className="inline mr-2" />
                        Shop Details
                    </button>
                    <button
                        onClick={() => setActiveTab('tax')}
                        className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'tax'
                            ? 'text-medical-blue border-b-2 border-medical-blue bg-blue-50/50 dark:bg-blue-900/20'
                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                            }`}
                    >
                        <Percent size={16} className="inline mr-2" />
                        Tax (GST)
                    </button>
                    <button
                        onClick={() => setActiveTab('printer')}
                        className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'printer'
                            ? 'text-medical-blue border-b-2 border-medical-blue bg-blue-50/50 dark:bg-blue-900/20'
                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                            }`}
                    >
                        <Printer size={16} className="inline mr-2" />
                        Printer
                    </button>
                    <button
                        onClick={() => setActiveTab('data')}
                        className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'data'
                            ? 'text-medical-blue border-b-2 border-medical-blue bg-blue-50/50 dark:bg-blue-900/20'
                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                            }`}
                    >
                        <Database size={16} className="inline mr-2" />
                        Data
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                    {/* Shop Details Tab */}
                    {activeTab === 'shop' && (
                        <div className="space-y-5">
                            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                                Shop / Pharmacy Details
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                These details will appear on printed bills and receipts.
                            </p>

                            {/* Shop Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Shop / Pharmacy Name *
                                </label>
                                <input
                                    type="text"
                                    value={localSettings.shop.name}
                                    onChange={(e) => updateShop({ name: e.target.value })}
                                    placeholder="e.g., Weston Pharmacy"
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600
                                             bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                                             focus:border-medical-blue focus:ring-2 focus:ring-medical-blue/20"
                                />
                            </div>

                            {/* Address */}
                            <div className="grid grid-cols-1 gap-3">
                                <input
                                    type="text"
                                    value={localSettings.shop.address1}
                                    onChange={(e) => updateShop({ address1: e.target.value })}
                                    placeholder="Address Line 1 (Street, Building)"
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600
                                             bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                                             focus:border-medical-blue focus:ring-2 focus:ring-medical-blue/20"
                                />
                                <input
                                    type="text"
                                    value={localSettings.shop.address2}
                                    onChange={(e) => updateShop({ address2: e.target.value })}
                                    placeholder="Address Line 2 (Area, Landmark)"
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600
                                             bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                                             focus:border-medical-blue focus:ring-2 focus:ring-medical-blue/20"
                                />
                                <div className="grid grid-cols-3 gap-3">
                                    <input
                                        type="text"
                                        value={localSettings.shop.city}
                                        onChange={(e) => updateShop({ city: e.target.value })}
                                        placeholder="City"
                                        className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600
                                                 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                                                 focus:border-medical-blue focus:ring-2 focus:ring-medical-blue/20"
                                    />
                                    <input
                                        type="text"
                                        value={localSettings.shop.state}
                                        onChange={(e) => updateShop({ state: e.target.value })}
                                        placeholder="State"
                                        className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600
                                                 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                                                 focus:border-medical-blue focus:ring-2 focus:ring-medical-blue/20"
                                    />
                                    <input
                                        type="text"
                                        value={localSettings.shop.pincode}
                                        onChange={(e) => updateShop({ pincode: e.target.value })}
                                        placeholder="PIN Code"
                                        className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600
                                                 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                                                 focus:border-medical-blue focus:ring-2 focus:ring-medical-blue/20"
                                    />
                                </div>
                            </div>

                            {/* Phone Numbers */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Phone 1
                                    </label>
                                    <input
                                        type="tel"
                                        value={localSettings.shop.phone1}
                                        onChange={(e) => updateShop({ phone1: e.target.value })}
                                        placeholder="Primary Phone"
                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600
                                                 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                                                 focus:border-medical-blue focus:ring-2 focus:ring-medical-blue/20"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Phone 2 (Optional)
                                    </label>
                                    <input
                                        type="tel"
                                        value={localSettings.shop.phone2}
                                        onChange={(e) => updateShop({ phone2: e.target.value })}
                                        placeholder="Secondary Phone"
                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600
                                                 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                                                 focus:border-medical-blue focus:ring-2 focus:ring-medical-blue/20"
                                    />
                                </div>
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Email (Optional)
                                </label>
                                <input
                                    type="email"
                                    value={localSettings.shop.email}
                                    onChange={(e) => updateShop({ email: e.target.value })}
                                    placeholder="shop@example.com"
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600
                                             bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                                             focus:border-medical-blue focus:ring-2 focus:ring-medical-blue/20"
                                />
                            </div>

                            {/* License Numbers */}
                            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                    License & Tax Numbers
                                </h4>
                                <div className="grid grid-cols-1 gap-3">
                                    <div>
                                        <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                                            GST Number
                                        </label>
                                        <input
                                            type="text"
                                            value={localSettings.shop.gstNumber}
                                            onChange={(e) => updateShop({ gstNumber: e.target.value.toUpperCase() })}
                                            placeholder="e.g., 29XXXXX1234X1Z5"
                                            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600
                                                     bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 uppercase
                                                     focus:border-medical-blue focus:ring-2 focus:ring-medical-blue/20"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                                                Drug License No. 1
                                            </label>
                                            <input
                                                type="text"
                                                value={localSettings.shop.dlNumber1}
                                                onChange={(e) => updateShop({ dlNumber1: e.target.value.toUpperCase() })}
                                                placeholder="e.g., TN-TNJ-12345"
                                                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600
                                                         bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 uppercase
                                                         focus:border-medical-blue focus:ring-2 focus:ring-medical-blue/20"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                                                Drug License No. 2
                                            </label>
                                            <input
                                                type="text"
                                                value={localSettings.shop.dlNumber2}
                                                onChange={(e) => updateShop({ dlNumber2: e.target.value.toUpperCase() })}
                                                placeholder="e.g., TN-TNJ-67890"
                                                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600
                                                         bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 uppercase
                                                         focus:border-medical-blue focus:ring-2 focus:ring-medical-blue/20"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Tagline */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Footer Message / Tagline
                                </label>
                                <input
                                    type="text"
                                    value={localSettings.shop.tagline}
                                    onChange={(e) => updateShop({ tagline: e.target.value })}
                                    placeholder="e.g., Thank you for your purchase!"
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600
                                             bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                                             focus:border-medical-blue focus:ring-2 focus:ring-medical-blue/20"
                                />
                            </div>

                            {/* Receipt Customization */}
                            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                    Receipt Branding
                                </h4>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                                            Hero Text (Receipt Header)
                                        </label>
                                        <input
                                            type="text"
                                            value={localSettings.shop.heroText || ''}
                                            onChange={(e) => updateShop({ heroText: e.target.value })}
                                            placeholder="e.g., INVOICE / RECEIPT"
                                            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600
                                                     bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                                                     focus:border-medical-blue focus:ring-2 focus:ring-medical-blue/20"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                                            Footer Branding Text
                                        </label>
                                        <input
                                            type="text"
                                            value={localSettings.shop.footerText || ''}
                                            onChange={(e) => updateShop({ footerText: e.target.value })}
                                            placeholder="e.g., Powered by Billova Medical Billing"
                                            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600
                                                     bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                                                     focus:border-medical-blue focus:ring-2 focus:ring-medical-blue/20"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                                            Logo URL (Optional)
                                        </label>
                                        <input
                                            type="text"
                                            value={localSettings.shop.logoUrl || ''}
                                            onChange={(e) => updateShop({ logoUrl: e.target.value })}
                                            placeholder="https://example.com/logo.png or leave blank"
                                            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600
                                                     bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                                                     focus:border-medical-blue focus:ring-2 focus:ring-medical-blue/20"
                                        />
                                        <p className="text-xs text-gray-400 mt-1">
                                            Enter a URL to display a logo on receipts
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tax Tab */}
                    {activeTab === 'tax' && (
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                                Tax Settings
                            </h3>

                            {/* GST Toggle */}
                            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                        <Percent className="text-green-600 dark:text-green-400" size={18} />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-gray-100">GST on Bills</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Apply GST to all billing transactions
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleToggleGST}
                                    className={`relative w-12 h-6 rounded-full transition-colors ${localSettings.gstEnabled
                                        ? 'bg-green-500'
                                        : 'bg-gray-300 dark:bg-gray-600'
                                        }`}
                                >
                                    <span
                                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${localSettings.gstEnabled ? 'translate-x-6' : 'translate-x-0'
                                            }`}
                                    />
                                </button>
                            </div>

                            {/* GST Percentage */}
                            {localSettings.gstEnabled && (
                                <div className="flex items-center gap-4 pl-4">
                                    <label className="text-sm text-gray-600 dark:text-gray-400">
                                        GST Rate:
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            step="0.5"
                                            value={localSettings.gstPercentage}
                                            onChange={(e) => setLocalSettings(prev => ({
                                                ...prev,
                                                gstPercentage: parseFloat(e.target.value) || 0
                                            }))}
                                            className="w-20 px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-600 
                                                     rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                                                     focus:border-medical-blue focus:ring-1 focus:ring-medical-blue/20"
                                        />
                                        <span className="text-sm text-gray-500 dark:text-gray-400">%</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Printer Tab */}
                    {activeTab === 'printer' && (
                        <div className="space-y-5">
                            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                                Printer Configuration
                            </h3>

                            {/* Paper Size */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Paper Size / Printer Type
                                </label>
                                <select
                                    value={localSettings.printer.paperSize}
                                    onChange={(e) => updatePrinter({ paperSize: e.target.value as PaperSize })}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600
                                             bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                                             focus:border-medical-blue focus:ring-2 focus:ring-medical-blue/20"
                                >
                                    {PAPER_SIZES.map(size => (
                                        <option key={size.value} value={size.value}>
                                            {size.label} - {size.description}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Custom Width */}
                            {localSettings.printer.paperSize === 'custom' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Custom Paper Width (mm)
                                    </label>
                                    <input
                                        type="number"
                                        min="40"
                                        max="300"
                                        value={localSettings.printer.customWidth}
                                        onChange={(e) => updatePrinter({ customWidth: parseInt(e.target.value) || 80 })}
                                        className="w-32 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600
                                                 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                                                 focus:border-medical-blue focus:ring-2 focus:ring-medical-blue/20"
                                    />
                                </div>
                            )}

                            {/* Font Size */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Receipt Font Size
                                </label>
                                <div className="flex gap-2">
                                    {(['small', 'medium', 'large'] as const).map(size => (
                                        <button
                                            key={size}
                                            onClick={() => updatePrinter({ fontSize: size })}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${localSettings.printer.fontSize === size
                                                ? 'bg-medical-blue text-white'
                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                                }`}
                                        >
                                            {size.charAt(0).toUpperCase() + size.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Show Logo Toggle */}
                            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-gray-100">Show Header on Receipt</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Print shop details at top of receipt
                                    </p>
                                </div>
                                <button
                                    onClick={() => updatePrinter({ showLogo: !localSettings.printer.showLogo })}
                                    className={`relative w-12 h-6 rounded-full transition-colors ${localSettings.printer.showLogo
                                        ? 'bg-green-500'
                                        : 'bg-gray-300 dark:bg-gray-600'
                                        }`}
                                >
                                    <span
                                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${localSettings.printer.showLogo ? 'translate-x-6' : 'translate-x-0'
                                            }`}
                                    />
                                </button>
                            </div>

                            {/* Auto Print Toggle */}
                            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-gray-100">Auto Print</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Automatically print when bill is confirmed
                                    </p>
                                </div>
                                <button
                                    onClick={() => updatePrinter({ autoPrint: !localSettings.printer.autoPrint })}
                                    className={`relative w-12 h-6 rounded-full transition-colors ${localSettings.printer.autoPrint
                                        ? 'bg-green-500'
                                        : 'bg-gray-300 dark:bg-gray-600'
                                        }`}
                                >
                                    <span
                                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${localSettings.printer.autoPrint ? 'translate-x-6' : 'translate-x-0'
                                            }`}
                                    />
                                </button>
                            </div>

                            {/* Printer Info */}
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-700 dark:text-blue-300">
                                <p className="font-medium mb-1">🖨️ Supported Printers:</p>
                                <ul className="list-disc list-inside text-xs space-y-0.5">
                                    <li>Thermal POS printers (58mm, 80mm)</li>
                                    <li>Standard inkjet/laser (A4, A5, Letter)</li>
                                    <li>Any browser-supported printer</li>
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* Data Tab - Import/Export & Logout */}
                    {activeTab === 'data' && (
                        <div className="space-y-6">
                            {/* Import/Export Section */}
                            <div>
                                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3">
                                    Data Management
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                                    Import or export your medicine inventory data as CSV files.
                                </p>

                                <div className="space-y-3">
                                    {/* Export Button */}
                                    {onExportCSV && (
                                        <button
                                            onClick={onExportCSV}
                                            className="w-full flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 
                                                     hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors
                                                     border border-green-200 dark:border-green-800"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                                                    <Download className="text-green-600 dark:text-green-400" size={20} />
                                                </div>
                                                <div className="text-left">
                                                    <p className="font-medium text-green-800 dark:text-green-300">Export Inventory</p>
                                                    <p className="text-xs text-green-600 dark:text-green-400">
                                                        Download all medicines as CSV file
                                                    </p>
                                                </div>
                                            </div>
                                            <Download className="text-green-600 dark:text-green-400" size={18} />
                                        </button>
                                    )}

                                    {/* Import Section */}
                                    {parseCSV && onImportCSV && (
                                        <div>
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                accept=".csv"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (!file) return;
                                                    setImportError(null);
                                                    setImportSuccess(false);
                                                    const reader = new FileReader();
                                                    reader.onload = (ev) => {
                                                        const content = ev.target?.result as string;
                                                        try {
                                                            const result = parseCSV(content);
                                                            setImportPreview(result);
                                                        } catch (err) {
                                                            setImportError(err instanceof Error ? err.message : 'Failed to parse CSV');
                                                        }
                                                    };
                                                    reader.readAsText(file);
                                                }}
                                                className="hidden"
                                            />

                                            {!importPreview ? (
                                                <button
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="w-full flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 
                                                             hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors
                                                             border border-blue-200 dark:border-blue-800"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                                                            <Upload className="text-blue-600 dark:text-blue-400" size={20} />
                                                        </div>
                                                        <div className="text-left">
                                                            <p className="font-medium text-blue-800 dark:text-blue-300">Import Inventory</p>
                                                            <p className="text-xs text-blue-600 dark:text-blue-400">
                                                                Upload CSV file to add medicines
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <Upload className="text-blue-600 dark:text-blue-400" size={18} />
                                                </button>
                                            ) : (
                                                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <h4 className="font-medium text-gray-900 dark:text-gray-100">Import Preview</h4>
                                                        <button
                                                            onClick={() => {
                                                                setImportPreview(null);
                                                                setImportError(null);
                                                                if (fileInputRef.current) fileInputRef.current.value = '';
                                                            }}
                                                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                                        >
                                                            <X size={18} />
                                                        </button>
                                                    </div>
                                                    <div className="flex items-center gap-4 mb-3">
                                                        <span className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                                                            <CheckCircle size={14} /> {importPreview.valid.length} valid
                                                        </span>
                                                        {importPreview.invalid.length > 0 && (
                                                            <span className="flex items-center gap-1 text-sm text-red-600 dark:text-red-400">
                                                                <AlertCircle size={14} /> {importPreview.invalid.length} errors
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={async () => {
                                                                if (importPreview.valid.length === 0) return;
                                                                setImporting(true);
                                                                try {
                                                                    await onImportCSV(importPreview.valid);
                                                                    setImportSuccess(true);
                                                                    setImportPreview(null);
                                                                    if (fileInputRef.current) fileInputRef.current.value = '';
                                                                } catch (err) {
                                                                    setImportError(err instanceof Error ? err.message : 'Import failed');
                                                                } finally {
                                                                    setImporting(false);
                                                                }
                                                            }}
                                                            disabled={importing || importPreview.valid.length === 0}
                                                            className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700
                                                                     disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
                                                        >
                                                            {importing ? 'Importing...' : `Import ${importPreview.valid.length} Items`}
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setImportPreview(null);
                                                                if (fileInputRef.current) fileInputRef.current.value = '';
                                                            }}
                                                            className="py-2 px-4 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300
                                                                     rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 text-sm"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {importError && (
                                                <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 
                                                              rounded-lg flex items-center gap-2 text-red-700 dark:text-red-300 text-sm">
                                                    <AlertCircle size={16} />
                                                    {importError}
                                                </div>
                                            )}

                                            {importSuccess && (
                                                <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 
                                                              rounded-lg flex items-center gap-2 text-green-700 dark:text-green-300 text-sm">
                                                    <CheckCircle size={16} />
                                                    Medicines imported successfully!
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Logout Section */}
                            {isAuthEnabled && onLogout && (
                                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3">
                                        Account
                                    </h3>
                                    <button
                                        onClick={() => {
                                            onLogout();
                                            onClose();
                                        }}
                                        className="w-full flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 
                                                 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors
                                                 border border-red-200 dark:border-red-800"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-lg">
                                                <LogOut className="text-red-600 dark:text-red-400" size={20} />
                                            </div>
                                            <div className="text-left">
                                                <p className="font-medium text-red-800 dark:text-red-300">Logout</p>
                                                <p className="text-xs text-red-600 dark:text-red-400">
                                                    Sign out of your account
                                                </p>
                                            </div>
                                        </div>
                                        <LogOut className="text-red-600 dark:text-red-400" size={18} />
                                    </button>
                                </div>
                            )}

                            {/* Contact Support */}
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-700 dark:text-blue-300">
                                <p className="font-medium mb-1">📧 Need Help?</p>
                                <p className="text-xs">
                                    Contact us at <a href="mailto:billovamedical@gmail.com" className="underline font-medium">billovamedical@gmail.com</a>
                                </p>
                                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                    Queries resolved in 2-3 business days
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 
                                 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-medical-blue text-white rounded-lg hover:bg-medical-blue-dark 
                                 transition-colors font-medium"
                    >
                        Save Settings
                    </button>
                </div>
            </div>
        </div>
    );
}
