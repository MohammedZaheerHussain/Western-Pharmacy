/**
 * MedicineAutocomplete - Auto-complete component for medicine entry
 * Searches from pre-loaded medicine database and allows selection
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, Database, Check } from 'lucide-react';
import { searchMedicineDatabase, MedicineTemplate, getMedicineDatabaseCount } from '../data/medicineDatabase';

interface MedicineAutocompleteProps {
    value: string;
    onChange: (value: string) => void;
    onSelect: (medicine: MedicineTemplate) => void;
    placeholder?: string;
    disabled?: boolean;
}

export function MedicineAutocomplete({
    value,
    onChange,
    onSelect,
    placeholder = 'Search medicine name...',
    disabled = false
}: MedicineAutocompleteProps) {
    const [suggestions, setSuggestions] = useState<MedicineTemplate[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Search medicines on input change
    useEffect(() => {
        if (value.length >= 2) {
            const results = searchMedicineDatabase(value, 8);
            setSuggestions(results);
            setIsOpen(results.length > 0);
            setActiveIndex(-1);
        } else {
            setSuggestions([]);
            setIsOpen(false);
        }
    }, [value]);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Handle keyboard navigation
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (!isOpen) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setActiveIndex(prev => Math.min(prev + 1, suggestions.length - 1));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setActiveIndex(prev => Math.max(prev - 1, -1));
                break;
            case 'Enter':
                e.preventDefault();
                if (activeIndex >= 0 && suggestions[activeIndex]) {
                    handleSelect(suggestions[activeIndex]);
                }
                break;
            case 'Escape':
                setIsOpen(false);
                break;
        }
    }, [isOpen, suggestions, activeIndex]);

    // Handle selection
    const handleSelect = useCallback((medicine: MedicineTemplate) => {
        onSelect(medicine);
        onChange(medicine.name);
        setIsOpen(false);
        inputRef.current?.blur();
    }, [onSelect, onChange]);

    const medicineCount = getMedicineDatabaseCount();

    return (
        <div ref={wrapperRef} className="relative">
            {/* Input Field */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                    ref={inputRef}
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => value.length >= 2 && suggestions.length > 0 && setIsOpen(true)}
                    placeholder={placeholder}
                    disabled={disabled}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                             focus:border-medical-blue focus:ring-2 focus:ring-medical-blue/20
                             disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
                    autoComplete="off"
                />
                {/* Database indicator */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-gray-400">
                    <Database size={12} />
                    <span className="hidden sm:inline">{medicineCount}+</span>
                </div>
            </div>

            {/* Suggestions Dropdown */}
            {isOpen && suggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 
                              dark:border-gray-700 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                    <div className="p-2 border-b border-gray-100 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <Database size={12} />
                        Select from database or type your own
                    </div>
                    {suggestions.map((medicine, index) => (
                        <button
                            key={`${medicine.name}-${medicine.brand}-${index}`}
                            onClick={() => handleSelect(medicine)}
                            onMouseEnter={() => setActiveIndex(index)}
                            className={`w-full px-3 py-2 text-left flex items-start gap-3 transition-colors ${index === activeIndex
                                    ? 'bg-medical-blue/10 dark:bg-medical-blue/20'
                                    : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                }`}
                        >
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
                                        {medicine.name}
                                    </span>
                                    <span className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 
                                                   text-gray-600 dark:text-gray-400 rounded">
                                        {medicine.category}
                                    </span>
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                    {medicine.brand} • {medicine.salt}
                                </div>
                                {medicine.suggestedPrice && (
                                    <div className="text-xs text-green-600 dark:text-green-400 mt-0.5">
                                        MRP ~₹{medicine.suggestedPrice}
                                    </div>
                                )}
                            </div>
                            {index === activeIndex && (
                                <Check size={16} className="text-medical-blue flex-shrink-0 mt-1" />
                            )}
                        </button>
                    ))}
                </div>
            )}

            {/* No results hint */}
            {isOpen && value.length >= 2 && suggestions.length === 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 
                              dark:border-gray-700 rounded-lg shadow-lg p-3 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        No matches found. You can still add this medicine manually.
                    </p>
                </div>
            )}
        </div>
    );
}
