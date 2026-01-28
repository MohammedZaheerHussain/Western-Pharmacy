// BackupModal - Full data backup and restore functionality

import { useState, useRef, useEffect } from 'react';
import { X, Download, Upload, AlertTriangle, CheckCircle, HardDrive, Clock, Shield } from 'lucide-react';
import * as storage from '../services/storage';

interface BackupModalProps {
    isOpen: boolean;
    onClose: () => void;
    onBackupComplete?: () => void;
    onRestoreComplete?: () => void;
}

export function BackupModal({ isOpen, onClose, onBackupComplete, onRestoreComplete }: BackupModalProps) {
    const [tab, setTab] = useState<'backup' | 'restore'>('backup');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [lastBackupInfo, setLastBackupInfo] = useState<{ date: Date | null; daysSince: number | null }>({ date: null, daysSince: null });
    const [restorePreview, setRestorePreview] = useState<storage.BackupData | null>(null);
    const [restoreOptions, setRestoreOptions] = useState({ clearExisting: false });
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setLastBackupInfo(storage.getLastBackupInfo());
            setMessage(null);
            setRestorePreview(null);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleBackup = async () => {
        setLoading(true);
        setMessage(null);
        try {
            await storage.downloadBackup('Western Pharmacy');
            setMessage({ type: 'success', text: 'Backup downloaded successfully! Keep this file safe.' });
            setLastBackupInfo(storage.getLastBackupInfo());
            onBackupComplete?.();
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to create backup: ' + (err as Error).message });
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        setMessage(null);

        try {
            const content = await file.text();
            const result = storage.parseBackupFile(content);

            if (!result.valid || !result.data) {
                setMessage({ type: 'error', text: result.error || 'Invalid backup file' });
                return;
            }

            setRestorePreview(result.data);
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to read file: ' + (err as Error).message });
        } finally {
            setLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleRestore = async () => {
        if (!restorePreview) return;

        setLoading(true);
        setMessage(null);

        try {
            const result = await storage.restoreFromBackup(restorePreview, {
                clearExisting: restoreOptions.clearExisting,
                mergeMode: 'skip'
            });

            setMessage({
                type: 'success',
                text: `Restored ${result.medicinesRestored} medicines and ${result.billsRestored} bills successfully!`
            });
            setRestorePreview(null);
            onRestoreComplete?.();
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to restore: ' + (err as Error).message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal-content bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden mx-4">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700">
                    <div className="flex items-center gap-3">
                        <Shield className="text-white" size={24} />
                        <h2 className="text-xl font-semibold text-white">Data Backup</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200">
                    <button
                        onClick={() => { setTab('backup'); setMessage(null); setRestorePreview(null); }}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${tab === 'backup'
                                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <Download className="inline mr-2" size={16} />
                        Create Backup
                    </button>
                    <button
                        onClick={() => { setTab('restore'); setMessage(null); }}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${tab === 'restore'
                                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <Upload className="inline mr-2" size={16} />
                        Restore Backup
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Message */}
                    {message && (
                        <div className={`flex items-center gap-2 p-3 rounded-lg mb-4 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                            }`}>
                            {message.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
                            <span className="text-sm">{message.text}</span>
                        </div>
                    )}

                    {tab === 'backup' ? (
                        <div className="space-y-4">
                            {/* Last backup info */}
                            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                                <Clock className="text-gray-400" size={20} />
                                <div>
                                    <p className="text-sm font-medium text-gray-700">Last Backup</p>
                                    <p className="text-sm text-gray-500">
                                        {lastBackupInfo.date
                                            ? `${lastBackupInfo.date.toLocaleDateString('en-IN')} (${lastBackupInfo.daysSince} days ago)`
                                            : 'Never backed up'
                                        }
                                    </p>
                                </div>
                            </div>

                            {/* Warning if no backup */}
                            {!lastBackupInfo.date && (
                                <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                                    <AlertTriangle className="text-amber-500 flex-shrink-0" size={20} />
                                    <div>
                                        <p className="text-sm font-medium text-amber-800">No backup found!</p>
                                        <p className="text-sm text-amber-600 mt-1">
                                            Your data is only stored in this browser. If browser data is cleared, you will lose everything.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Backup info */}
                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                                <h4 className="font-medium text-blue-900 mb-2">What's included:</h4>
                                <ul className="text-sm text-blue-700 space-y-1">
                                    <li>✓ All medicines and inventory</li>
                                    <li>✓ All bills and transactions</li>
                                    <li>✓ Audit history</li>
                                    <li>✓ Bill counter settings</li>
                                </ul>
                            </div>

                            {/* Backup button */}
                            <button
                                onClick={handleBackup}
                                disabled={loading}
                                className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium 
                                         hover:bg-blue-700 transition-colors disabled:opacity-50 
                                         flex items-center justify-center gap-2"
                            >
                                <HardDrive size={18} />
                                {loading ? 'Creating Backup...' : 'Download Full Backup'}
                            </button>

                            <p className="text-xs text-gray-500 text-center">
                                Backup file will be saved to your Downloads folder
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* File input */}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".json"
                                onChange={handleFileSelect}
                                className="hidden"
                            />

                            {!restorePreview ? (
                                <>
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="border-2 border-dashed border-gray-300 rounded-xl p-8 
                                                 text-center cursor-pointer hover:border-blue-400 
                                                 hover:bg-blue-50 transition-all"
                                    >
                                        <Upload className="mx-auto text-gray-400 mb-3" size={32} />
                                        <p className="text-sm font-medium text-gray-700">
                                            Click to select backup file
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Only .json backup files are supported
                                        </p>
                                    </div>

                                    <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                                        <AlertTriangle className="text-amber-500 flex-shrink-0" size={20} />
                                        <p className="text-sm text-amber-700">
                                            Restoring will add data from the backup file. Use "Clear existing" option if you want to replace all data.
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    {/* Preview */}
                                    <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                                        <h4 className="font-medium text-green-800 mb-2">Backup File Preview</h4>
                                        <div className="text-sm text-green-700 space-y-1">
                                            <p>📅 Created: {new Date(restorePreview.exportedAt).toLocaleString('en-IN')}</p>
                                            <p>💊 Medicines: {restorePreview.medicines.length}</p>
                                            <p>🧾 Bills: {restorePreview.bills.length}</p>
                                        </div>
                                    </div>

                                    {/* Options */}
                                    <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={restoreOptions.clearExisting}
                                            onChange={(e) => setRestoreOptions({ ...restoreOptions, clearExisting: e.target.checked })}
                                            className="w-4 h-4 text-blue-600"
                                        />
                                        <div>
                                            <p className="text-sm font-medium text-gray-700">Clear existing data</p>
                                            <p className="text-xs text-gray-500">Replace all current data with backup</p>
                                        </div>
                                    </label>

                                    {restoreOptions.clearExisting && (
                                        <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                                            <AlertTriangle className="text-red-500 flex-shrink-0" size={18} />
                                            <p className="text-sm text-red-700">
                                                <strong>Warning:</strong> All your current data will be deleted and replaced with the backup!
                                            </p>
                                        </div>
                                    )}

                                    {/* Buttons */}
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setRestorePreview(null)}
                                            className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl 
                                                     font-medium hover:bg-gray-50 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleRestore}
                                            disabled={loading}
                                            className="flex-1 py-3 bg-green-600 text-white rounded-xl font-medium 
                                                     hover:bg-green-700 transition-colors disabled:opacity-50"
                                        >
                                            {loading ? 'Restoring...' : 'Restore Now'}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
