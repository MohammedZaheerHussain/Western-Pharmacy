/**
 * Branch Selector Component
 * Dropdown to switch between pharmacy branches (multi-location)
 */

import { useState, useEffect, useRef } from 'react';
import { Building2, ChevronDown, Check, Plus } from 'lucide-react';
import { Branch } from '../types/user';
import {
    getAllBranches,
    getCurrentBranch,
    setCurrentBranchId,
    createBranch
} from '../services/branchStorage';

interface BranchSelectorProps {
    onBranchChange?: (branch: Branch) => void;
    compact?: boolean;
}

export function BranchSelector({ onBranchChange, compact = false }: BranchSelectorProps) {
    const [branches, setBranches] = useState<Branch[]>([]);
    const [currentBranch, setCurrentBranch] = useState<Branch | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newBranch, setNewBranch] = useState({ name: '', code: '', address: '', city: '', phone: '' });
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadBranches();
    }, []);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const loadBranches = async () => {
        const all = await getAllBranches();
        setBranches(all);

        const current = await getCurrentBranch();
        if (current) {
            setCurrentBranch(current);
        } else if (all.length === 0) {
            // Auto-create default branch if none exist
            const defaultBranch = await createBranch({
                name: 'Main Store',
                code: 'MAIN',
                address: '',
                city: '',
                phone: '',
                isActive: true,
                isDefault: true
            });
            setBranches([defaultBranch]);
            setCurrentBranch(defaultBranch);
            setCurrentBranchId(defaultBranch.id);
        }
    };

    const handleSelect = (branch: Branch) => {
        setCurrentBranch(branch);
        setCurrentBranchId(branch.id);
        setIsOpen(false);
        onBranchChange?.(branch);
    };

    const handleAddBranch = async () => {
        if (!newBranch.name || !newBranch.code) return;

        try {
            const created = await createBranch({
                ...newBranch,
                isActive: true
            });
            setBranches([...branches, created]);
            setShowAddForm(false);
            setNewBranch({ name: '', code: '', address: '', city: '', phone: '' });
            handleSelect(created);
        } catch (error) {
            console.error('Failed to create branch:', error);
            alert('Failed to create branch. Code may already exist.');
        }
    };

    // If single branch, show simpler display
    if (branches.length <= 1 && !showAddForm) {
        return (
            <div className={`flex items-center gap-2 text-sm ${compact ? '' : 'px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg'}`}>
                <Building2 size={16} className="text-gray-500" />
                <span className="text-gray-700 dark:text-gray-300">
                    {currentBranch?.name || 'Main Store'}
                </span>
            </div>
        );
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 ${compact
                        ? 'text-sm'
                        : 'px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 dark:hover:border-gray-600'
                    } transition-colors`}
            >
                <Building2 size={16} className="text-indigo-500" />
                <span className="font-medium text-gray-900 dark:text-gray-100">
                    {currentBranch?.name || 'Select Branch'}
                </span>
                <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                    {currentBranch?.code}
                </span>
                <ChevronDown size={16} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-800 
                              border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                    <div className="p-2 border-b border-gray-100 dark:border-gray-700">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                            Switch Branch
                        </p>
                    </div>

                    <div className="max-h-48 overflow-y-auto">
                        {branches.map(branch => (
                            <button
                                key={branch.id}
                                onClick={() => handleSelect(branch)}
                                className={`w-full px-3 py-2 flex items-center justify-between
                                          hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors
                                          ${currentBranch?.id === branch.id ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}
                            >
                                <div className="flex items-center gap-2">
                                    <Building2 size={14} className="text-gray-400" />
                                    <div className="text-left">
                                        <div className="font-medium text-gray-900 dark:text-gray-100">
                                            {branch.name}
                                        </div>
                                        <div className="text-xs text-gray-500">{branch.city || branch.code}</div>
                                    </div>
                                </div>
                                {currentBranch?.id === branch.id && (
                                    <Check size={16} className="text-indigo-500" />
                                )}
                            </button>
                        ))}
                    </div>

                    <div className="border-t border-gray-100 dark:border-gray-700 p-2">
                        {!showAddForm ? (
                            <button
                                onClick={() => setShowAddForm(true)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm
                                         text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 
                                         dark:hover:bg-indigo-900/20 rounded-lg"
                            >
                                <Plus size={16} />
                                Add New Branch
                            </button>
                        ) : (
                            <div className="space-y-2 p-2">
                                <input
                                    type="text"
                                    value={newBranch.name}
                                    onChange={(e) => setNewBranch({ ...newBranch, name: e.target.value })}
                                    placeholder="Branch Name"
                                    className="w-full px-2 py-1 text-sm border rounded"
                                    autoFocus
                                />
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newBranch.code}
                                        onChange={(e) => setNewBranch({ ...newBranch, code: e.target.value.toUpperCase() })}
                                        placeholder="Code"
                                        maxLength={6}
                                        className="w-20 px-2 py-1 text-sm border rounded uppercase"
                                    />
                                    <input
                                        type="text"
                                        value={newBranch.city}
                                        onChange={(e) => setNewBranch({ ...newBranch, city: e.target.value })}
                                        placeholder="City"
                                        className="flex-1 px-2 py-1 text-sm border rounded"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleAddBranch}
                                        className="flex-1 px-2 py-1 text-sm bg-indigo-600 text-white rounded"
                                    >
                                        Add
                                    </button>
                                    <button
                                        onClick={() => setShowAddForm(false)}
                                        className="px-2 py-1 text-sm text-gray-500"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default BranchSelector;
