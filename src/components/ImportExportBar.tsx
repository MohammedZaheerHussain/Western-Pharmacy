// ImportExportBar - CSV import and export functionality

import { useRef, useState } from 'react';
import { Download, Upload, X, AlertCircle, CheckCircle } from 'lucide-react';
import { Medicine } from '../types/medicine';

interface ImportExportBarProps {
    onExport: () => void;
    onImport: (medicines: Omit<Medicine, 'id' | 'createdAt' | 'updatedAt' | 'auditHistory'>[]) => Promise<void>;
    parseCSV: (content: string) => {
        valid: Omit<Medicine, 'id' | 'createdAt' | 'updatedAt' | 'auditHistory'>[];
        invalid: { row: number; data: Record<string, string>; errors: string[] }[];
    };
}

export function ImportExportBar({ onExport, onImport, parseCSV }: ImportExportBarProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [showPreview, setShowPreview] = useState(false);
    const [parsedData, setParsedData] = useState<ReturnType<typeof parseCSV> | null>(null);
    const [importing, setImporting] = useState(false);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const content = await file.text();
        const parsed = parseCSV(content);
        setParsedData(parsed);
        setShowPreview(true);

        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleImport = async () => {
        if (!parsedData || parsedData.valid.length === 0) return;

        setImporting(true);
        try {
            await onImport(parsedData.valid);
            setShowPreview(false);
            setParsedData(null);
        } catch (err) {
            console.error('Import failed:', err);
        } finally {
            setImporting(false);
        }
    };

    const handleCancel = () => {
        setShowPreview(false);
        setParsedData(null);
    };

    return (
        <>
            <div className="flex items-center gap-2">
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="hidden"
                    aria-label="Import CSV file"
                />

                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 
                     hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                >
                    <Upload size={16} />
                    <span className="hidden sm:inline">Import CSV</span>
                </button>

                <button
                    onClick={onExport}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 
                     hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                >
                    <Download size={16} />
                    <span className="hidden sm:inline">Export CSV</span>
                </button>
            </div>

            {/* Import Preview Modal */}
            {showPreview && parsedData && (
                <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && handleCancel()}>
                    <div className="modal-content bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] 
                         overflow-hidden flex flex-col mx-4">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-900">Import Preview</h2>
                            <button
                                onClick={handleCancel}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 
                           rounded-lg transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                            {/* Summary */}
                            <div className="flex gap-4">
                                <div className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg">
                                    <CheckCircle size={16} />
                                    <span className="text-sm font-medium">{parsedData.valid.length} valid rows</span>
                                </div>
                                {parsedData.invalid.length > 0 && (
                                    <div className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-700 rounded-lg">
                                        <AlertCircle size={16} />
                                        <span className="text-sm font-medium">{parsedData.invalid.length} invalid rows</span>
                                    </div>
                                )}
                            </div>

                            {/* Valid Rows Preview */}
                            {parsedData.valid.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-medium text-gray-700 mb-2">
                                        Medicines to Import ({parsedData.valid.length})
                                    </h3>
                                    <div className="bg-gray-50 rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-100 sticky top-0">
                                                <tr>
                                                    <th className="px-3 py-2 text-left text-gray-600">Name</th>
                                                    <th className="px-3 py-2 text-left text-gray-600">Brand</th>
                                                    <th className="px-3 py-2 text-left text-gray-600">Qty</th>
                                                    <th className="px-3 py-2 text-left text-gray-600">Location</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {parsedData.valid.slice(0, 10).map((med, idx) => (
                                                    <tr key={idx} className="border-t border-gray-200">
                                                        <td className="px-3 py-2 text-gray-900">{med.name}</td>
                                                        <td className="px-3 py-2 text-gray-600">{med.brand}</td>
                                                        <td className="px-3 py-2 text-gray-600">{med.quantity}</td>
                                                        <td className="px-3 py-2 text-gray-600">
                                                            {med.location.rack}/{med.location.shelf}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        {parsedData.valid.length > 10 && (
                                            <p className="px-3 py-2 text-sm text-gray-500 bg-gray-100">
                                                ...and {parsedData.valid.length - 10} more
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Invalid Rows */}
                            {parsedData.invalid.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-medium text-red-700 mb-2">
                                        Invalid Rows (will be skipped)
                                    </h3>
                                    <div className="bg-red-50 rounded-lg p-3 max-h-32 overflow-y-auto space-y-2">
                                        {parsedData.invalid.map((item, idx) => (
                                            <div key={idx} className="text-sm">
                                                <span className="font-medium text-red-800">Row {item.row}:</span>
                                                <span className="text-red-600 ml-2">{item.errors.join(', ')}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
                            <button
                                onClick={handleCancel}
                                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                                disabled={importing}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleImport}
                                disabled={importing || parsedData.valid.length === 0}
                                className="px-6 py-2 bg-medical-blue text-white rounded-lg hover:bg-medical-blue-dark
                           transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {importing ? 'Importing...' : `Import ${parsedData.valid.length} Medicines`}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
