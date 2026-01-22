// LocationModal - Shows medicine location prominently when "Locate" is clicked

import { Medicine } from '../types/medicine';
import { X, MapPin } from 'lucide-react';
import { useEffect } from 'react';
import { formatLocation } from '../hooks/useMedicines';

interface LocationModalProps {
    medicine: Medicine | null;
    onClose: () => void;
}

export function LocationModal({ medicine, onClose }: LocationModalProps) {
    // Handle Escape key
    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === 'Escape' && medicine) {
                onClose();
            }
        }
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [medicine, onClose]);

    if (!medicine) return null;

    return (
        <div
            className="modal-backdrop"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className="modal-content bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                        <MapPin className="text-medical-blue" size={20} />
                        <h2 className="text-lg font-semibold text-gray-900">Location</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 
                       rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="px-6 py-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">{medicine.name}</h3>

                    <div className="space-y-3">
                        <LocationItem label="Rack" value={medicine.location.rack} highlight />
                        <LocationItem label="Shelf" value={medicine.location.shelf} highlight />
                        {medicine.location.drawer && (
                            <LocationItem label="Drawer" value={medicine.location.drawer} />
                        )}
                    </div>

                    <div className="mt-6 p-4 bg-medical-blue-light rounded-xl text-center">
                        <span className="text-medical-blue font-medium text-lg">
                            {formatLocation(medicine.location)}
                        </span>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
                    <button
                        onClick={onClose}
                        className="w-full px-4 py-2 bg-medical-blue text-white rounded-lg 
                       hover:bg-medical-blue-dark transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

function LocationItem({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
    return (
        <div className="flex justify-between items-center">
            <span className="text-gray-500">{label}</span>
            <span className={`text-xl font-bold ${highlight ? 'text-medical-blue' : 'text-gray-700'}`}>
                {value}
            </span>
        </div>
    );
}
