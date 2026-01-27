// Settings Modal with GST toggle and other pharmacy settings
import { useState, useEffect } from 'react';
import { X, Settings, Percent } from 'lucide-react';

export interface PharmacySettings {
    gstEnabled: boolean;
    gstPercentage: number;
}

const DEFAULT_SETTINGS: PharmacySettings = {
    gstEnabled: false,
    gstPercentage: 18, // Default GST rate in India
};

const SETTINGS_KEY = 'pharmacy-settings';

/** Load settings from localStorage */
export function loadSettings(): PharmacySettings {
    try {
        const stored = localStorage.getItem(SETTINGS_KEY);
        if (stored) {
            return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
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

interface SettingsModalProps {
    isOpen: boolean;
    settings: PharmacySettings;
    onClose: () => void;
    onSave: (settings: PharmacySettings) => void;
}

export function SettingsModal({ isOpen, settings, onClose, onSave }: SettingsModalProps) {
    const [localSettings, setLocalSettings] = useState<PharmacySettings>(settings);

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

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
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

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* GST Section */}
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

                        {/* GST Percentage - show only when enabled */}
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
