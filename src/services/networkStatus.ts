// Network status detection service
// Provides online/offline detection and network event handling

type NetworkStatusCallback = (isOnline: boolean) => void;

class NetworkStatusService {
    private listeners: Set<NetworkStatusCallback> = new Set();
    private _isOnline: boolean = navigator.onLine;

    constructor() {
        // Listen for online/offline events
        window.addEventListener('online', () => this.handleStatusChange(true));
        window.addEventListener('offline', () => this.handleStatusChange(false));
    }

    /** Current online status */
    get isOnline(): boolean {
        return this._isOnline;
    }

    /** Subscribe to network status changes */
    subscribe(callback: NetworkStatusCallback): () => void {
        this.listeners.add(callback);
        // Immediately call with current status
        callback(this._isOnline);

        // Return unsubscribe function
        return () => {
            this.listeners.delete(callback);
        };
    }

    /** Handle status change and notify listeners */
    private handleStatusChange(isOnline: boolean): void {
        if (this._isOnline !== isOnline) {
            this._isOnline = isOnline;
            console.log(`[NetworkStatus] Status changed: ${isOnline ? 'ONLINE' : 'OFFLINE'}`);
            this.listeners.forEach(callback => callback(isOnline));
        }
    }

    /** Manually check network status (useful for verifying actual connectivity) */
    async checkConnectivity(): Promise<boolean> {
        if (!navigator.onLine) {
            this._isOnline = false;
            return false;
        }

        try {
            // Try to fetch a small resource to verify actual connectivity
            const response = await fetch('/favicon.ico', {
                method: 'HEAD',
                cache: 'no-store',
                signal: AbortSignal.timeout(5000)
            });
            this._isOnline = response.ok;
            return response.ok;
        } catch {
            // If fetch fails, try the Supabase health check
            try {
                const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
                if (supabaseUrl) {
                    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
                        method: 'HEAD',
                        cache: 'no-store',
                        signal: AbortSignal.timeout(5000)
                    });
                    this._isOnline = response.ok || response.status === 401; // 401 means reachable but needs auth
                    return this._isOnline;
                }
            } catch {
                // Supabase also unreachable
            }
            this._isOnline = false;
            return false;
        }
    }
}

// Singleton instance
export const networkStatus = new NetworkStatusService();

// React hook for network status
import { useState, useEffect } from 'react';

export function useNetworkStatus(): boolean {
    const [isOnline, setIsOnline] = useState(networkStatus.isOnline);

    useEffect(() => {
        const unsubscribe = networkStatus.subscribe(setIsOnline);
        return unsubscribe;
    }, []);

    return isOnline;
}
