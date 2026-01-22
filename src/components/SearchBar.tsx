// SearchBar component with real-time search
// Keyboard shortcut: "/" focuses search

import { useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

export function SearchBar({ value, onChange, placeholder }: SearchBarProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    // Keyboard shortcut: "/" to focus search
    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
                e.preventDefault();
                inputRef.current?.focus();
            }
        }

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <div className="relative w-full">
            <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                size={22}
            />
            <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder || "Search medicine by name, brand, salt, or rack..."}
                className="w-full pl-12 pr-12 py-4 text-lg rounded-xl border border-gray-200 
                   bg-white shadow-sm focus:border-medical-blue focus:ring-2 
                   focus:ring-medical-blue/20 transition-all placeholder:text-gray-400"
                aria-label="Search medicines"
            />
            {value && (
                <button
                    onClick={() => onChange('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full
                     text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                    aria-label="Clear search"
                >
                    <X size={20} />
                </button>
            )}
            <span className="absolute right-12 top-1/2 -translate-y-1/2 text-xs text-gray-400 
                       bg-gray-100 px-1.5 py-0.5 rounded hidden sm:block">
                /
            </span>
        </div>
    );
}
