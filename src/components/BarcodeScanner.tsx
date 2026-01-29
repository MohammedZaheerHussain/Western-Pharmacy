/**
 * Barcode Scanner Component
 * Uses device camera to scan EAN/UPC barcodes for quick medicine lookup
 * Pro/Premium feature
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
import { X, Camera, FlashlightOff } from 'lucide-react';

interface BarcodeScannerProps {
    isOpen: boolean;
    onClose: () => void;
    onScan: (barcode: string) => void;
}

export function BarcodeScanner({ isOpen, onClose, onScan }: BarcodeScannerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [error, setError] = useState<string | null>(null);
    const [scanning, setScanning] = useState(false);
    const readerRef = useRef<BrowserMultiFormatReader | null>(null);

    const stopScanning = useCallback(() => {
        if (readerRef.current) {
            readerRef.current.reset();
            readerRef.current = null;
        }
        setScanning(false);
    }, []);

    const startScanning = useCallback(async () => {
        if (!videoRef.current) return;

        try {
            setError(null);
            setScanning(true);

            const reader = new BrowserMultiFormatReader();
            readerRef.current = reader;

            // Get available video devices
            const devices = await reader.listVideoInputDevices();
            if (devices.length === 0) {
                throw new Error('No camera found');
            }

            // Prefer back camera on mobile
            const backCamera = devices.find(d =>
                d.label.toLowerCase().includes('back') ||
                d.label.toLowerCase().includes('rear')
            );
            const deviceId = backCamera?.deviceId || devices[0].deviceId;

            // Start continuous scanning
            await reader.decodeFromVideoDevice(
                deviceId,
                videoRef.current,
                (result, err) => {
                    if (result) {
                        const barcode = result.getText();
                        onScan(barcode);
                        stopScanning();
                        onClose();
                    }
                    if (err && !(err instanceof NotFoundException)) {
                        console.warn('Scan error:', err);
                    }
                }
            );
        } catch (e) {
            console.error('Scanner error:', e);
            setError(e instanceof Error ? e.message : 'Failed to access camera');
            setScanning(false);
        }
    }, [onScan, onClose, stopScanning]);

    useEffect(() => {
        if (isOpen) {
            startScanning();
        } else {
            stopScanning();
        }

        return () => {
            stopScanning();
        };
    }, [isOpen, startScanning, stopScanning]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
            <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                        <Camera className="text-medical-blue" size={20} />
                        <h2 className="font-semibold text-gray-900 dark:text-gray-100">
                            Scan Barcode
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Scanner viewport */}
                <div className="relative aspect-square bg-black">
                    <video
                        ref={videoRef}
                        className="w-full h-full object-cover"
                        playsInline
                        muted
                    />

                    {/* Scanning overlay */}
                    {scanning && (
                        <div className="absolute inset-0 pointer-events-none">
                            {/* Corner brackets */}
                            <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2">
                                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-medical-blue" />
                                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-medical-blue" />
                                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-medical-blue" />
                                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-medical-blue" />
                            </div>

                            {/* Scanning line animation */}
                            <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 overflow-hidden">
                                <div className="absolute top-0 left-0 right-0 h-0.5 bg-red-500 animate-scan" />
                            </div>
                        </div>
                    )}

                    {/* Error state */}
                    {error && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80">
                            <div className="text-center p-4">
                                <FlashlightOff className="mx-auto mb-2 text-red-400" size={48} />
                                <p className="text-white font-medium">{error}</p>
                                <button
                                    onClick={startScanning}
                                    className="mt-3 px-4 py-2 bg-medical-blue text-white rounded-lg"
                                >
                                    Retry
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Instructions */}
                <div className="p-4 text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Position barcode within the frame
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                        Supports EAN-13, EAN-8, UPC-A, UPC-E, Code 128
                    </p>
                </div>
            </div>

            {/* CSS for scanning animation */}
            <style>{`
                @keyframes scan {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(calc(100% * 2 - 2px)); }
                }
                .animate-scan {
                    animation: scan 2s linear infinite;
                }
            `}</style>
        </div>
    );
}

export default BarcodeScanner;
