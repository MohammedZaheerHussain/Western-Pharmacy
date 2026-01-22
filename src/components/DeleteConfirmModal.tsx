// DeleteConfirmModal - Simple confirmation dialog for delete actions

import { AlertTriangle, X } from 'lucide-react';
import { useEffect } from 'react';

interface DeleteConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    itemCount?: number;
    onConfirm: () => void;
    onCancel: () => void;
    loading?: boolean;
}

export function DeleteConfirmModal({
    isOpen,
    title,
    message,
    itemCount,
    onConfirm,
    onCancel,
    loading
}: DeleteConfirmModalProps) {
    // Handle Escape key
    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === 'Escape' && isOpen) {
                onCancel();
            }
        }
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onCancel]);

    if (!isOpen) return null;

    return (
        <div
            className="modal-backdrop"
            onClick={(e) => e.target === e.currentTarget && onCancel()}
        >
            <div className="modal-content bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 rounded-full">
                            <AlertTriangle className="text-red-600" size={20} />
                        </div>
                        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
                    </div>
                    <button
                        onClick={onCancel}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 
                       rounded-lg transition-colors"
                        aria-label="Close"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="px-6 py-4">
                    <p className="text-gray-600">{message}</p>
                    {itemCount && itemCount > 1 && (
                        <p className="mt-2 text-sm font-medium text-red-600">
                            This will delete {itemCount} items permanently.
                        </p>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700
                       transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Deleting...' : 'Delete'}
                    </button>
                </div>
            </div>
        </div>
    );
}
