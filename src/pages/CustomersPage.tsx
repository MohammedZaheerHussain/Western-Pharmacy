/**
 * Customers Page
 * Customer management and loyalty program administration
 */

import { useState, useEffect } from 'react';
import {
    Users, Search, Plus, Edit2, Star, Gift, Phone,
    ChevronDown, ChevronUp, X
} from 'lucide-react';
import {
    Customer,
    TIER_DISPLAY,
    pointsToRupees,
    LOYALTY_CONFIG
} from '../types/customer';
import {
    getAllCustomers,
    createCustomer,
    updateCustomer,
    getLoyaltyTransactions,
    createLoyaltyTransaction
} from '../services/customerStorage';
import { LoyaltyTransaction } from '../types/customer';

export function CustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null);
    const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([]);

    // Form state
    const [formData, setFormData] = useState({
        phone: '',
        name: '',
        email: '',
        address: ''
    });

    // Points adjustment
    const [adjustPoints, setAdjustPoints] = useState({ show: false, points: 0, reason: '' });

    useEffect(() => {
        loadCustomers();
    }, []);

    const loadCustomers = async () => {
        setLoading(true);
        try {
            const data = await getAllCustomers();
            setCustomers(data.sort((a, b) => b.totalSpent - a.totalSpent));
        } catch (error) {
            console.error('Failed to load customers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (editingCustomer) {
                await updateCustomer(editingCustomer.id, formData);
            } else {
                await createCustomer(formData);
            }
            setShowForm(false);
            setEditingCustomer(null);
            setFormData({ phone: '', name: '', email: '', address: '' });
            loadCustomers();
        } catch (error) {
            console.error('Failed to save customer:', error);
            alert('Failed to save customer. Phone may already exist.');
        }
    };

    const handleEdit = (customer: Customer) => {
        setEditingCustomer(customer);
        setFormData({
            phone: customer.phone,
            name: customer.name,
            email: customer.email || '',
            address: customer.address || ''
        });
        setShowForm(true);
    };

    const handleExpand = async (customerId: string) => {
        if (expandedCustomer === customerId) {
            setExpandedCustomer(null);
            return;
        }
        setExpandedCustomer(customerId);
        const txs = await getLoyaltyTransactions(customerId);
        setTransactions(txs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    };

    const handleAdjustPoints = async (customer: Customer) => {
        if (!adjustPoints.points || !adjustPoints.reason) return;

        try {
            const newBalance = customer.loyaltyPoints + adjustPoints.points;
            await updateCustomer(customer.id, { loyaltyPoints: newBalance });
            await createLoyaltyTransaction({
                customerId: customer.id,
                type: 'adjustment',
                points: adjustPoints.points,
                balanceAfter: newBalance,
                description: adjustPoints.reason,
                adjustedBy: 'Admin'
            });

            setAdjustPoints({ show: false, points: 0, reason: '' });
            loadCustomers();
        } catch (error) {
            console.error('Failed to adjust points:', error);
        }
    };

    // Filter customers
    const filtered = customers.filter(c => {
        if (!search) return true;
        const q = search.toLowerCase();
        return c.phone.includes(q) || c.name.toLowerCase().includes(q);
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <Users className="text-indigo-500" />
                        Customers & Loyalty
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Manage customers and loyalty points program
                    </p>
                </div>
                <button
                    onClick={() => {
                        setShowForm(true);
                        setEditingCustomer(null);
                        setFormData({ phone: '', name: '', email: '', address: '' });
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg
                             hover:bg-indigo-700 transition-colors font-medium"
                >
                    <Plus size={18} />
                    Add Customer
                </button>
            </div>

            {/* Loyalty Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {customers.length}
                    </div>
                    <div className="text-sm text-gray-500">Total Customers</div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                    <div className="text-2xl font-bold text-yellow-600">
                        {customers.filter(c => c.tier === 'gold' || c.tier === 'platinum').length}
                    </div>
                    <div className="text-sm text-gray-500">Premium Members</div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                    <div className="text-2xl font-bold text-purple-600">
                        {customers.reduce((sum, c) => sum + c.loyaltyPoints, 0).toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">Total Points Outstanding</div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                    <div className="text-2xl font-bold text-green-600">
                        ₹{customers.reduce((sum, c) => sum + c.totalSpent, 0).toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">Lifetime Value</div>
                </div>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name or phone..."
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 
                             rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
            </div>

            {/* Customer List */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-gray-500">Loading...</div>
                ) : filtered.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                        {search ? 'No customers found' : 'No customers yet'}
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {filtered.map(customer => {
                            const tier = TIER_DISPLAY[customer.tier];
                            const isExpanded = expandedCustomer === customer.id;

                            return (
                                <div key={customer.id}>
                                    <div className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 
                                                              dark:from-indigo-900/30 dark:to-purple-900/30 
                                                              rounded-full flex items-center justify-center">
                                                    <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                                                        {customer.name.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                                                            {customer.name}
                                                        </span>
                                                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${tier.color}`}>
                                                            {tier.icon} {tier.label}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                                                        <span className="flex items-center gap-1">
                                                            <Phone size={12} />
                                                            {customer.phone}
                                                        </span>
                                                        <span>
                                                            {customer.totalBills} orders
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-6">
                                                <div className="text-right">
                                                    <div className="flex items-center gap-1 text-lg font-semibold text-purple-600 dark:text-purple-400">
                                                        <Star size={16} />
                                                        {customer.loyaltyPoints.toLocaleString()}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        ≈ ₹{pointsToRupees(customer.loyaltyPoints).toFixed(0)}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-semibold text-gray-900 dark:text-gray-100">
                                                        ₹{customer.totalSpent.toLocaleString()}
                                                    </div>
                                                    <div className="text-xs text-gray-500">total spent</div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleEdit(customer)}
                                                        className="p-2 text-gray-400 hover:text-indigo-500 
                                                                 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleExpand(customer.id)}
                                                        className="p-2 text-gray-400 hover:text-gray-600 
                                                                 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                                                    >
                                                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expanded Details */}
                                    {isExpanded && (
                                        <div className="px-4 pb-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700">
                                            <div className="pt-4 grid md:grid-cols-2 gap-4">
                                                {/* Info */}
                                                <div className="space-y-2">
                                                    <h4 className="font-medium text-gray-700 dark:text-gray-300">Details</h4>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                                        Email: {customer.email || 'Not provided'}
                                                    </p>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                                        Address: {customer.address || 'Not provided'}
                                                    </p>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                                        Member since: {new Date(customer.createdAt).toLocaleDateString()}
                                                    </p>

                                                    {/* Adjust Points Button */}
                                                    <button
                                                        onClick={() => setAdjustPoints({
                                                            show: true,
                                                            points: 0,
                                                            reason: ''
                                                        })}
                                                        className="mt-2 flex items-center gap-2 px-3 py-1.5 text-sm
                                                                 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400
                                                                 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50"
                                                    >
                                                        <Gift size={14} />
                                                        Adjust Points
                                                    </button>

                                                    {/* Adjust Points Form */}
                                                    {adjustPoints.show && (
                                                        <div className="mt-2 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <input
                                                                    type="number"
                                                                    value={adjustPoints.points}
                                                                    onChange={(e) => setAdjustPoints({
                                                                        ...adjustPoints,
                                                                        points: parseInt(e.target.value) || 0
                                                                    })}
                                                                    placeholder="+/- points"
                                                                    className="w-24 px-2 py-1 text-sm border rounded"
                                                                />
                                                                <input
                                                                    type="text"
                                                                    value={adjustPoints.reason}
                                                                    onChange={(e) => setAdjustPoints({
                                                                        ...adjustPoints,
                                                                        reason: e.target.value
                                                                    })}
                                                                    placeholder="Reason"
                                                                    className="flex-1 px-2 py-1 text-sm border rounded"
                                                                />
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => handleAdjustPoints(customer)}
                                                                    className="px-3 py-1 text-sm bg-purple-600 text-white rounded"
                                                                >
                                                                    Apply
                                                                </button>
                                                                <button
                                                                    onClick={() => setAdjustPoints({ show: false, points: 0, reason: '' })}
                                                                    className="px-3 py-1 text-sm text-gray-500"
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Recent Transactions */}
                                                <div>
                                                    <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                        Recent Transactions
                                                    </h4>
                                                    {transactions.length === 0 ? (
                                                        <p className="text-sm text-gray-500">No transactions yet</p>
                                                    ) : (
                                                        <div className="space-y-2 max-h-40 overflow-y-auto">
                                                            {transactions.slice(0, 5).map(tx => (
                                                                <div
                                                                    key={tx.id}
                                                                    className="flex items-center justify-between text-sm 
                                                                             p-2 bg-white dark:bg-gray-800 rounded border
                                                                             border-gray-100 dark:border-gray-700"
                                                                >
                                                                    <div>
                                                                        <span className={tx.points >= 0 ? 'text-green-600' : 'text-red-600'}>
                                                                            {tx.points >= 0 ? '+' : ''}{tx.points}
                                                                        </span>
                                                                        <span className="text-gray-400 ml-2">
                                                                            {tx.description}
                                                                        </span>
                                                                    </div>
                                                                    <span className="text-xs text-gray-400">
                                                                        {new Date(tx.createdAt).toLocaleDateString()}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Loyalty Rules */}
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 
                          p-4 rounded-xl border border-purple-200 dark:border-purple-800">
                <h3 className="font-semibold text-purple-800 dark:text-purple-300 mb-2">Loyalty Program Rules</h3>
                <div className="grid md:grid-cols-3 gap-4 text-sm text-purple-700 dark:text-purple-300">
                    <div>
                        <span className="font-medium">Earn: </span>
                        1 point per ₹{(1 / LOYALTY_CONFIG.pointsPerRupee).toFixed(0)} spent
                    </div>
                    <div>
                        <span className="font-medium">Redeem: </span>
                        1 point = ₹{LOYALTY_CONFIG.pointValue.toFixed(2)}
                    </div>
                    <div>
                        <span className="font-medium">Min Redeem: </span>
                        {LOYALTY_CONFIG.minRedeemPoints} points
                    </div>
                </div>
            </div>

            {/* Add/Edit Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                                {editingCustomer ? 'Edit Customer' : 'Add Customer'}
                            </h2>
                            <button
                                onClick={() => setShowForm(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Phone Number *
                                </label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="10-digit phone"
                                    required
                                    pattern="[0-9]{10}"
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 
                                             rounded-lg bg-white dark:bg-gray-700"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Name *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 
                                             rounded-lg bg-white dark:bg-gray-700"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 
                                             rounded-lg bg-white dark:bg-gray-700"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Address
                                </label>
                                <textarea
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    rows={2}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 
                                             rounded-lg bg-white dark:bg-gray-700"
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 
                                             rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg 
                                             hover:bg-indigo-700 font-medium"
                                >
                                    {editingCustomer ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CustomersPage;
