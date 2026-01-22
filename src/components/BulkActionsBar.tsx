// BulkActionsBar - Shows actions when items are selected

import { MedicineLocation } from '../types/medicine';
import { Trash2, MapPin, X } from 'lucide-react';
import { useState } from 'react';

interface BulkActionsBarProps {
    selectedCount: number;
    onDelete: () => void;
    onUpdateLocation: (location: MedicineLocation) => void;
    onClear: () => void;
}

export function BulkActionsBar({
    selectedCount,
    onDelete,
    onUpdateLocation,
    onClear
}: BulkActionsBarProps) {
    const [showLocationForm, setShowLocationForm] = useState(false);
    const [location, setLocation] = useState<MedicineLocation>({ rack: '', shelf: '', drawer: '' });

    if (selectedCount === 0) return null;

    const handleLocationSubmit = () => {
        if (location.rack && location.shelf) {
            onUpdateLocation(location);
            setShowLocationForm(false);
            setLocation({ rack: '', shelf: '', drawer: '' });
        }
    };

    return (
        <div className="sticky bottom-4 z-30">
            <div className="bg-gray-900 text-white rounded-xl shadow-2xl px-4 py-3 flex items-center gap-4 mx-auto max-w-fit">
                <span className="text-sm font-medium">
                    {selectedCount} selected
                </span>

                <div className="h-6 w-px bg-gray-700" />

                {showLocationForm ? (
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            placeholder="Rack"
                            value={location.rack}
                            onChange={(e) => setLocation(prev => ({ ...prev, rack: e.target.value }))}
                            className="w-16 px-2 py-1 text-sm bg-gray-800 border border-gray-700 rounded text-white
                         placeholder:text-gray-500 focus:border-medical-blue focus:ring-0"
                        />
                        <input
                            type="text"
                            placeholder="Shelf"
                            value={location.shelf}
                            onChange={(e) => setLocation(prev => ({ ...prev, shelf: e.target.value }))}
                            className="w-16 px-2 py-1 text-sm bg-gray-800 border border-gray-700 rounded text-white
                         placeholder:text-gray-500 focus:border-medical-blue focus:ring-0"
                        />
                        <input
                            type="text"
                            placeholder="Drawer"
                            value={location.drawer || ''}
                            onChange={(e) => setLocation(prev => ({ ...prev, drawer: e.target.value }))}
                            className="w-16 px-2 py-1 text-sm bg-gray-800 border border-gray-700 rounded text-white
                         placeholder:text-gray-500 focus:border-medical-blue focus:ring-0"
                        />
                        <button
                            onClick={handleLocationSubmit}
                            disabled={!location.rack || !location.shelf}
                            className="px-3 py-1 text-sm bg-medical-blue hover:bg-medical-blue-dark rounded
                         disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Apply
                        </button>
                        <button
                            onClick={() => setShowLocationForm(false)}
                            className="p-1 text-gray-400 hover:text-white transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>
                ) : (
                    <>
                        <button
                            onClick={() => setShowLocationForm(true)}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 
                         rounded-lg transition-colors"
                        >
                            <MapPin size={16} />
                            <span>Update Location</span>
                        </button>

                        <button
                            onClick={onDelete}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-red-600 hover:bg-red-700 
                         rounded-lg transition-colors"
                        >
                            <Trash2 size={16} />
                            <span>Delete</span>
                        </button>
                    </>
                )}

                <div className="h-6 w-px bg-gray-700" />

                <button
                    onClick={onClear}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                    Clear
                </button>
            </div>
        </div>
    );
}
