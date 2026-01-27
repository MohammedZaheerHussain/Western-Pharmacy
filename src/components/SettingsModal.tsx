// Settings Modal with GST toggle and Printer settings
import { useState, useEffect } from 'react';
import { X, Settings, Percent, Printer } from 'lucide-react';

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

export interface PharmacySettings {
    gstEnabled: boolean;
    gstPercentage: number;
    printer: PrinterSettings;
}

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
};

const SETTINGS_KEY = 'pharmacy-settings';

/** Load settings from localStorage */
export function loadSettings(): PharmacySettings {
    try {
        const stored = localStorage.getItem(SETTINGS_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            return {
                ...DEFAULT_SETTINGS,
                ...parsed,
                printer: { ...DEFAULT_PRINTER, ...parsed.printer }
            };
        }
    } catch (e) {
        console.error('Failed to load settings:', e);
    }
    return DEFAULT_SETTINGS;
}

/** Save settings to localStorage */
export function saveSettings(settings: PharmacySettings): void {
    try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
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
}

export function SettingsModal({ isOpen, settings, onClose, onSave }: SettingsModalProps) {
    const [localSettings, setLocalSettings] = useState<PharmacySettings>(settings);
    const [activeTab, setActiveTab] = useState<'tax' | 'printer'>('tax');

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

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
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
                </div>

                {/* Content */}
                <div className="p-6 space-y-6 max-h-96 overflow-y-auto">
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
                                    <p className="font-medium text-gray-900 dark:text-gray-100">Show Logo on Receipt</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Print pharmacy name/logo at top
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
