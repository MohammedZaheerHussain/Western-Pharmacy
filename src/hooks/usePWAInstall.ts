/**
 * usePWAInstall - Hook for managing PWA installation
 * Captures beforeinstallprompt event and provides install functionality
 */

import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    readonly userChoice: Promise<{
        outcome: 'accepted' | 'dismissed';
        platform: string;
    }>;
    prompt(): Promise<void>;
}

interface UsePWAInstallReturn {
    /** Whether the app can be installed (prompt available) */
    canInstall: boolean;
    /** Whether the app is running in standalone/installed mode */
    isInstalled: boolean;
    /** Trigger the install prompt */
    promptInstall: () => Promise<boolean>;
    /** Whether install was just completed (for showing success toast) */
    justInstalled: boolean;
    /** Clear the justInstalled flag */
    clearJustInstalled: () => void;
}

/**
 * Hook to manage PWA installation state and prompt
 */
export function usePWAInstall(): UsePWAInstallReturn {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isInstalled, setIsInstalled] = useState(false);
    const [justInstalled, setJustInstalled] = useState(false);

    // Check if running in standalone mode (already installed)
    useEffect(() => {
        const checkInstalled = () => {
            // Check display-mode: standalone
            const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
            // iOS Safari standalone mode
            const isIOSStandalone = (navigator as any).standalone === true;
            // Check if launched from home screen (Chrome)
            const isLaunchedFromHomeScreen = document.referrer.includes('android-app://');

            setIsInstalled(isStandalone || isIOSStandalone || isLaunchedFromHomeScreen);
        };

        checkInstalled();

        // Listen for display mode changes
        const mediaQuery = window.matchMedia('(display-mode: standalone)');
        const handleChange = (e: MediaQueryListEvent) => {
            setIsInstalled(e.matches);
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    // Capture the beforeinstallprompt event
    useEffect(() => {
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
        };

        const handleAppInstalled = () => {
            setDeferredPrompt(null);
            setIsInstalled(true);
            setJustInstalled(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    /**
     * Trigger the install prompt
     * @returns true if user accepted, false if dismissed
     */
    const promptInstall = useCallback(async (): Promise<boolean> => {
        if (!deferredPrompt) {
            console.warn('Install prompt not available');
            return false;
        }

        try {
            await deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;

            if (outcome === 'accepted') {
                setDeferredPrompt(null);
                return true;
            }
            return false;
        } catch (err) {
            console.error('Install prompt error:', err);
            return false;
        }
    }, [deferredPrompt]);

    const clearJustInstalled = useCallback(() => {
        setJustInstalled(false);
    }, []);

    return {
        canInstall: deferredPrompt !== null && !isInstalled,
        isInstalled,
        promptInstall,
        justInstalled,
        clearJustInstalled
    };
}
