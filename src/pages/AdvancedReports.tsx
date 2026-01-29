/**
 * Advanced Reports Page - Charts and Analytics
 * Pro/Premium feature
 */

import { useState, useEffect } from 'react';
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import {
    TrendingUp,
    TrendingDown,
    Package,
    AlertTriangle,
    RefreshCw,
    DollarSign,
    PieChartIcon
} from 'lucide-react';
import { getAllMedicines, getAllBills } from '../services/storage';
import { Medicine } from '../types/medicine';
import { PharmacySettings } from '../components/SettingsModal';

interface AdvancedReportsProps {
    settings: PharmacySettings;
    formatCurrency: (amount: number) => string;
}

interface CategorySales {
    name: string;
    value: number;
    color: string;
}

interface DailySales {
    date: string;
    sales: number;
    bills: number;
}

interface ProfitData {
    name: string;
    cost: number;
    revenue: number;
    profit: number;
    margin: number;
}

interface DeadStock {
    medicine: Medicine;
    daysSinceLastSale: number;
    stockValue: number;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

export function AdvancedReports({ settings, formatCurrency }: AdvancedReportsProps) {
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter'>('month');

    // Data states
    const [categorySales, setCategorySales] = useState<CategorySales[]>([]);
    const [dailySales, setDailySales] = useState<DailySales[]>([]);
    const [profitData, setProfitData] = useState<ProfitData[]>([]);
    const [deadStock, setDeadStock] = useState<DeadStock[]>([]);
    const [stockValue, setStockValue] = useState(0);
    const [totalProfit, setTotalProfit] = useState(0);
    const [avgMargin, setAvgMargin] = useState(0);

    // Load data
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const [medicines, bills] = await Promise.all([
                    getAllMedicines(),
                    getAllBills()
                ]);

                // Calculate date range
                const now = new Date();
                const startDate = new Date();
                if (dateRange === 'week') startDate.setDate(now.getDate() - 7);
                else if (dateRange === 'month') startDate.setDate(now.getDate() - 30);
                else startDate.setDate(now.getDate() - 90);

                const filteredBills = bills.filter(b => new Date(b.createdAt) >= startDate);

                // Category-wise sales
                const categoryMap = new Map<string, number>();
                filteredBills.forEach(bill => {
                    bill.items.forEach(item => {
                        const med = medicines.find(m => m.id === item.medicineId);
                        if (med) {
                            const current = categoryMap.get(med.category) || 0;
                            categoryMap.set(med.category, current + item.total);
                        }
                    });
                });

                const catSales: CategorySales[] = Array.from(categoryMap.entries())
                    .map(([name, value], idx) => ({
                        name,
                        value: Math.round(value),
                        color: COLORS[idx % COLORS.length]
                    }))
                    .sort((a, b) => b.value - a.value);
                setCategorySales(catSales);

                // Daily sales trend
                const dailyMap = new Map<string, { sales: number; bills: number }>();
                const days = dateRange === 'week' ? 7 : dateRange === 'month' ? 30 : 90;

                for (let i = days - 1; i >= 0; i--) {
                    const d = new Date();
                    d.setDate(d.getDate() - i);
                    const key = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
                    dailyMap.set(key, { sales: 0, bills: 0 });
                }

                filteredBills.forEach(bill => {
                    const d = new Date(bill.createdAt);
                    const key = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
                    const existing = dailyMap.get(key);
                    if (existing) {
                        dailyMap.set(key, {
                            sales: existing.sales + bill.grandTotal,
                            bills: existing.bills + 1
                        });
                    }
                });

                setDailySales(Array.from(dailyMap.entries()).map(([date, data]) => ({
                    date,
                    sales: Math.round(data.sales),
                    bills: data.bills
                })));

                // Profit analysis (requires purchase price in batches)
                const profitByMed = new Map<string, { name: string; cost: number; revenue: number }>();

                filteredBills.forEach(bill => {
                    bill.items.forEach(item => {
                        const med = medicines.find(m => m.id === item.medicineId);
                        if (med) {
                            const existing = profitByMed.get(med.id) || { name: med.name, cost: 0, revenue: 0 };
                            const purchasePrice = med.batches?.[0]?.purchasePrice || (med.unitPrice * 0.7); // Estimate 30% margin
                            const costForItem = purchasePrice * (item.stripQty * med.tabletsPerStrip + item.looseQty) / med.tabletsPerStrip;

                            profitByMed.set(med.id, {
                                name: med.name,
                                cost: existing.cost + costForItem,
                                revenue: existing.revenue + item.total
                            });
                        }
                    });
                });

                const profitArray: ProfitData[] = Array.from(profitByMed.values())
                    .map(p => ({
                        name: p.name.substring(0, 20),
                        cost: Math.round(p.cost),
                        revenue: Math.round(p.revenue),
                        profit: Math.round(p.revenue - p.cost),
                        margin: p.revenue > 0 ? Math.round(((p.revenue - p.cost) / p.revenue) * 100) : 0
                    }))
                    .sort((a, b) => b.profit - a.profit)
                    .slice(0, 10);
                setProfitData(profitArray);

                // Total profit calculation
                const totProfit = profitArray.reduce((sum, p) => sum + p.profit, 0);
                const totRevenue = profitArray.reduce((sum, p) => sum + p.revenue, 0);
                setTotalProfit(totProfit);
                setAvgMargin(totRevenue > 0 ? Math.round((totProfit / totRevenue) * 100) : 0);

                // Dead stock (no sales in 30+ days)
                const soldMedicineIds = new Set<string>();
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

                bills.filter(b => new Date(b.createdAt) >= thirtyDaysAgo).forEach(bill => {
                    bill.items.forEach(item => soldMedicineIds.add(item.medicineId));
                });

                const deadStockList: DeadStock[] = medicines
                    .filter(m => m.quantity > 0 && !soldMedicineIds.has(m.id))
                    .map(m => {
                        // Find last sale
                        let lastSaleDate: Date | null = null;
                        for (const bill of bills) {
                            if (bill.items.some(i => i.medicineId === m.id)) {
                                const billDate = new Date(bill.createdAt);
                                if (!lastSaleDate || billDate > lastSaleDate) {
                                    lastSaleDate = billDate;
                                }
                            }
                        }

                        const daysSince = lastSaleDate
                            ? Math.floor((now.getTime() - lastSaleDate.getTime()) / (1000 * 60 * 60 * 24))
                            : 999;

                        return {
                            medicine: m,
                            daysSinceLastSale: daysSince,
                            stockValue: m.quantity * m.unitPrice / m.tabletsPerStrip
                        };
                    })
                    .sort((a, b) => b.daysSinceLastSale - a.daysSinceLastSale)
                    .slice(0, 10);
                setDeadStock(deadStockList);

                // Stock valuation
                const totalValue = medicines.reduce((sum, m) => {
                    return sum + (m.quantity * m.unitPrice / m.tabletsPerStrip);
                }, 0);
                setStockValue(totalValue);

            } catch (e) {
                console.error('Failed to load advanced reports:', e);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [dateRange]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <RefreshCw className="animate-spin text-medical-blue" size={24} />
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        Advanced Analytics
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {settings.shop.name || 'Your Pharmacy'} - Detailed Insights
                    </p>
                </div>

                <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-1">
                    {(['week', 'month', 'quarter'] as const).map(range => (
                        <button
                            key={range}
                            onClick={() => setDateRange(range)}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${dateRange === range
                                ? 'bg-medical-blue text-white'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                        >
                            {range === 'week' ? '7 Days' : range === 'month' ? '30 Days' : '90 Days'}
                        </button>
                    ))}
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-4 text-white">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-green-100 text-sm">Total Profit</span>
                        <TrendingUp size={20} className="text-green-200" />
                    </div>
                    <p className="text-2xl font-bold">{formatCurrency(totalProfit)}</p>
                    <p className="text-green-200 text-xs mt-1">{avgMargin}% avg margin</p>
                </div>

                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-4 text-white">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-blue-100 text-sm">Stock Value</span>
                        <Package size={20} className="text-blue-200" />
                    </div>
                    <p className="text-2xl font-bold">{formatCurrency(stockValue)}</p>
                    <p className="text-blue-200 text-xs mt-1">Current inventory</p>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl p-4 text-white">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-purple-100 text-sm">Categories</span>
                        <PieChartIcon size={20} className="text-purple-200" />
                    </div>
                    <p className="text-2xl font-bold">{categorySales.length}</p>
                    <p className="text-purple-200 text-xs mt-1">With sales this period</p>
                </div>

                <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl p-4 text-white">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-amber-100 text-sm">Dead Stock</span>
                        <AlertTriangle size={20} className="text-amber-200" />
                    </div>
                    <p className="text-2xl font-bold">{deadStock.length}</p>
                    <p className="text-amber-200 text-xs mt-1">No sales in 30+ days</p>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Sales Trend */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                    <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                        <TrendingUp size={18} />
                        Sales Trend
                    </h2>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={dailySales.slice(-14)}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#6B7280" />
                                <YAxis tick={{ fontSize: 11 }} stroke="#6B7280" />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1F2937',
                                        border: 'none',
                                        borderRadius: '8px',
                                        color: '#F3F4F6'
                                    }}
                                    formatter={(value) => value !== undefined ? [formatCurrency(value as number), 'Sales'] : ['N/A', 'Sales']}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="sales"
                                    stroke="#3B82F6"
                                    strokeWidth={2}
                                    dot={{ fill: '#3B82F6', strokeWidth: 2 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Category Breakdown */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                    <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                        <PieChartIcon size={18} />
                        Sales by Category
                    </h2>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={categorySales}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                                    labelLine={false}
                                >
                                    {categorySales.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value) => value !== undefined ? formatCurrency(value as number) : 'N/A'}
                                    contentStyle={{
                                        backgroundColor: '#1F2937',
                                        border: 'none',
                                        borderRadius: '8px',
                                        color: '#F3F4F6'
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Profit Analysis */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                    <DollarSign size={18} />
                    Profit by Medicine (Top 10)
                </h2>
                <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={profitData} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                            <XAxis type="number" tick={{ fontSize: 11 }} stroke="#6B7280" />
                            <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={120} stroke="#6B7280" />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#1F2937',
                                    border: 'none',
                                    borderRadius: '8px',
                                    color: '#F3F4F6'
                                }}
                                formatter={(value, name) => {
                                    if (value === undefined) return ['N/A', name];
                                    return [
                                        name === 'margin' ? `${value}%` : formatCurrency(value as number),
                                        String(name).charAt(0).toUpperCase() + String(name).slice(1)
                                    ];
                                }}
                            />
                            <Legend />
                            <Bar dataKey="revenue" fill="#3B82F6" name="Revenue" />
                            <Bar dataKey="profit" fill="#10B981" name="Profit" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Dead Stock Table */}
            {deadStock.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                        <h2 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                            <TrendingDown size={18} className="text-red-500" />
                            Dead Stock (No Sales in 30+ Days)
                        </h2>
                        <span className="text-xs text-gray-500">
                            Total: {formatCurrency(deadStock.reduce((s, d) => s + d.stockValue, 0))}
                        </span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-700/50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Medicine</th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Qty</th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Value</th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Days Since Sale</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {deadStock.map(ds => (
                                    <tr key={ds.medicine.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                        <td className="px-4 py-2">
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-gray-100">
                                                    {ds.medicine.name}
                                                </p>
                                                <p className="text-xs text-gray-500">{ds.medicine.brand}</p>
                                            </div>
                                        </td>
                                        <td className="px-4 py-2 text-right text-gray-600 dark:text-gray-400">
                                            {ds.medicine.quantity}
                                        </td>
                                        <td className="px-4 py-2 text-right font-medium text-gray-900 dark:text-gray-100">
                                            {formatCurrency(ds.stockValue)}
                                        </td>
                                        <td className="px-4 py-2 text-right">
                                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${ds.daysSinceLastSale > 60
                                                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                                                }`}>
                                                {ds.daysSinceLastSale > 365 ? '365+' : ds.daysSinceLastSale} days
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdvancedReports;
