/**
 * Customer Lookup Component
 * Search and select customers during billing for loyalty points
 */

import { useState, useEffect, useRef } from 'react';
import { Search, User, Plus, Star, X, Gift } from 'lucide-react';
import {
    Customer,
    TIER_DISPLAY,
    pointsToRupees,
    getMaxRedeemablePoints
} from '../types/customer';
import {
    searchCustomers,
    createCustomer
} from '../services/customerStorage';

interface CustomerLookupProps {
    billTotal: number;
    onCustomerSelect: (customer: Customer | null) => void;
    onPointsRedeem: (points: number) => void;
    selectedCustomer: Customer | null;
    pointsToRedeem: number;
}

export function CustomerLookup({
    billTotal,
    onCustomerSelect,
    onPointsRedeem,
    selectedCustomer,
    pointsToRedeem
}: CustomerLookupProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Customer[]>([]);
    const [showResults, setShowResults] = useState(false);
    const [showNewForm, setShowNewForm] = useState(false);
    const [newName, setNewName] = useState('');
    const [loading, setLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (query.length >= 3) {
            handleSearch();
        } else {
            setResults([]);
        }
    }, [query]);

    const handleSearch = async () => {
        setLoading(true);
        try {
            const found = await searchCustomers(query);
            setResults(found);
            setShowResults(true);
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (customer: Customer) => {
        onCustomerSelect(customer);
        setQuery('');
        setShowResults(false);
    };

    const handleCreateNew = async () => {
        if (!query || !newName.trim()) return;

        setLoading(true);
        try {
            const customer = await createCustomer({
                phone: query,
                name: newName.trim()
            });
            onCustomerSelect(customer);
            setQuery('');
            setNewName('');
            setShowNewForm(false);
        } catch (error) {
            console.error('Failed to create customer:', error);
            alert('Failed to create customer. Phone may already exist.');
        } finally {
            setLoading(false);
        }
    };

    const handleClear = () => {
        onCustomerSelect(null);
        onPointsRedeem(0);
        setQuery('');
    };

    const maxRedeemable = selectedCustomer
        ? getMaxRedeemablePoints(billTotal, selectedCustomer.loyaltyPoints)
        : 0;

    // Selected customer display
    if (selectedCustomer) {
        const tier = TIER_DISPLAY[selectedCustomer.tier];
        return (
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 
                          rounded-lg p-4 border border-indigo-200 dark:border-indigo-800">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-800 rounded-full 
                                      flex items-center justify-center">
                            <User size={20} className="text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <div className="font-semibold text-gray-900 dark:text-gray-100">
                                {selectedCustomer.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                {selectedCustomer.phone}
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={handleClear}
                        className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg 
                                 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Tier & Points */}
                <div className="flex items-center gap-4 mb-3">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${tier.color}`}>
                        {tier.icon} {tier.label}
                    </span>
                    <div className="flex items-center gap-1 text-sm">
                        <Star size={14} className="text-yellow-500" />
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                            {selectedCustomer.loyaltyPoints} points
                        </span>
                        <span className="text-gray-500">
                            (₹{pointsToRupees(selectedCustomer.loyaltyPoints).toFixed(2)})
                        </span>
                    </div>
                </div>

                {/* Redeem Points */}
                {selectedCustomer.loyaltyPoints >= 50 && billTotal > 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                <Gift size={16} className="text-purple-500" />
                                Redeem Points
                            </div>
                            <div className="text-xs text-gray-500">
                                Max: {maxRedeemable} pts (₹{pointsToRupees(maxRedeemable).toFixed(2)})
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="range"
                                min={0}
                                max={maxRedeemable}
                                step={10}
                                value={pointsToRedeem}
                                onChange={(e) => onPointsRedeem(Number(e.target.value))}
                                className="flex-1 accent-purple-500"
                            />
                            <div className="w-24 text-right">
                                <span className="font-semibold text-purple-600 dark:text-purple-400">
                                    -{pointsToRedeem} pts
                                </span>
                                <div className="text-xs text-gray-500">
                                    -₹{pointsToRupees(pointsToRedeem).toFixed(2)}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // Search mode
    return (
        <div className="relative">
            <div className="relative">
                <Search
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => results.length > 0 && setShowResults(true)}
                    placeholder="Customer phone number..."
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 
                             rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                             focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                {loading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                )}
            </div>

            {/* Search Results */}
            {showResults && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 
                              dark:border-gray-700 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                    {results.length > 0 ? (
                        results.map(customer => {
                            const tier = TIER_DISPLAY[customer.tier];
                            return (
                                <button
                                    key={customer.id}
                                    onClick={() => handleSelect(customer)}
                                    className="w-full px-4 py-3 flex items-center justify-between
                                             hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors
                                             border-b border-gray-100 dark:border-gray-700 last:border-0"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full 
                                                      flex items-center justify-center">
                                            <User size={16} className="text-gray-500" />
                                        </div>
                                        <div className="text-left">
                                            <div className="font-medium text-gray-900 dark:text-gray-100">
                                                {customer.name}
                                            </div>
                                            <div className="text-sm text-gray-500">{customer.phone}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-0.5 text-xs rounded-full ${tier.color}`}>
                                            {tier.icon}
                                        </span>
                                        <div className="text-right">
                                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                {customer.loyaltyPoints} pts
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            );
                        })
                    ) : query.length >= 3 && !loading ? (
                        <div className="p-4">
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                                No customer found for "{query}"
                            </p>
                            {!showNewForm ? (
                                <button
                                    onClick={() => setShowNewForm(true)}
                                    className="flex items-center gap-2 w-full px-3 py-2 text-sm
                                             bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400
                                             rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                                >
                                    <Plus size={16} />
                                    Add New Customer
                                </button>
                            ) : (
                                <div className="space-y-2">
                                    <input
                                        type="text"
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        placeholder="Customer name"
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 
                                                 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                        autoFocus
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleCreateNew}
                                            disabled={!newName.trim()}
                                            className="flex-1 px-3 py-2 bg-indigo-600 text-white rounded-lg
                                                     hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium"
                                        >
                                            Create
                                        </button>
                                        <button
                                            onClick={() => setShowNewForm(false)}
                                            className="px-3 py-2 text-gray-500 hover:text-gray-700 text-sm"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : null}
                </div>
            )}

            {/* Click outside to close */}
            {showResults && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowResults(false)}
                />
            )}
        </div>
    );
}

export default CustomerLookup;
