/**
 * InstallButton - Desktop PWA install prompt button
 * Shows when app can be installed, hides when running in standalone mode
 */

import { Download, Check } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useEffect } from 'react';

interface InstallButtonProps {
    /** Callback when install completes successfully */
    onInstallSuccess?: () => void;
}

/**
 * Install button for desktop PWA installation
 * Automatically hides when:
 * - App is already installed (standalone mode)
 * - Install prompt is not available (unsupported browser)
 */
export function InstallButton({ onInstallSuccess }: InstallButtonProps) {
    const { canInstall, isInstalled, promptInstall, justInstalled, clearJustInstalled } = usePWAInstall();

    // Show success toast when just installed
    useEffect(() => {
        if (justInstalled) {
            onInstallSuccess?.();
            // Auto-clear after 5 seconds
            const timeout = setTimeout(clearJustInstalled, 5000);
            return () => clearTimeout(timeout);
        }
    }, [justInstalled, onInstallSuccess, clearJustInstalled]);

    // Don't render if installed or can't install
    if (isInstalled || !canInstall) {
        return null;
    }

    const handleInstall = async () => {
        await promptInstall();
    };

    return (
        <button
            onClick={handleInstall}
            className="flex items-center gap-2 px-3 py-2 bg-medical-blue text-white rounded-lg 
                     hover:bg-medical-blue-dark transition-colors font-medium text-sm
                     shadow-sm hover:shadow-md"
            title="Install Westorn Pharmacy as desktop app"
            aria-label="Install app for desktop"
        >
            <Download size={18} />
            <span className="hidden sm:inline">Install App</span>
        </button>
    );
}

/**
 * Install success toast notification
 */
export function InstallSuccessToast({ show, onClose }: { show: boolean; onClose: () => void }) {
    useEffect(() => {
        if (show) {
            const timeout = setTimeout(onClose, 5000);
            return () => clearTimeout(timeout);
        }
    }, [show, onClose]);

    if (!show) return null;

    return (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg 
                      flex items-center gap-3 animate-slide-up z-50">
            <Check size={20} />
            <div>
                <p className="font-medium">App installed!</p>
                <p className="text-sm text-green-100">You can now launch from desktop</p>
            </div>
            <button
                onClick={onClose}
                className="ml-2 p-1 hover:bg-green-700 rounded transition-colors"
                aria-label="Dismiss"
            >
                ×
            </button>
        </div>
    );
}
