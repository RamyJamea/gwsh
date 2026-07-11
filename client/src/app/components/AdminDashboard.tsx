import React, { useEffect, useMemo, useState } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { DollarSign, ShoppingBag, Store, TrendingUp, Utensils } from 'lucide-react';
import { toast } from 'sonner';
import { branchApi, catalogApi, menuApi, orderApi, OrderResponse, parseApiDate, BranchRead } from '../api-client';
import { getCurrency, formatWeekday } from '../currency';

export function AdminDashboard() {
  const [branchId, setBranchId] = useState<number>(() => Number(localStorage.getItem('activeBranchId')) || 1);
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [branches, setBranches] = useState<BranchRead[]>([]);
  const [branchName, setBranchName] = useState(localStorage.getItem('activeBranchName') || `Branch ${branchId}`);
  const [menuCount, setMenuCount] = useState(0);
  const [productCount, setProductCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function loadDashboard() {
      setIsLoading(true);
      try {
        const [branchList, orderRows, menuRows, products] = await Promise.all([
          branchApi.list().catch(() => []),
          orderApi.list(branchId),
          menuApi.listByBranch(branchId).catch(() => []),
          catalogApi.products().catch(() => []),
        ]);
        if (!cancelled) {
          setBranches(branchList);
          const currentBranch = branchList.find(b => b.id === branchId);
          if (currentBranch) {
            setBranchName(currentBranch.name);
            localStorage.setItem('activeBranchName', currentBranch.name);
          } else {
            setBranchName(`Branch ${branchId}`);
          }
          setOrders(orderRows);
          setMenuCount(menuRows.length);
          setProductCount(products.length);
        }
      } catch (err: any) {
        toast.error(err.message || 'Failed to load dashboard');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    loadDashboard();
    return () => {
      cancelled = true;
    };
  }, [branchId]);

  const handleBranchChange = (newId: number) => {
    setBranchId(newId);
    localStorage.setItem('activeBranchId', String(newId));
  };

  const paidOrders = orders.filter(order => order.action === 'pay');
  const activeOrders = orders.filter(order => order.action === 'create' || order.action === 'update');
  const revenue = paidOrders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
  const today = new Date().toDateString();
  const todayOrders = orders.filter(order => parseApiDate(order.created_at).toDateString() === today);
  const todayRevenue = todayOrders
    .filter(order => order.action === 'pay')
    .reduce((sum, order) => sum + Number(order.total_amount || 0), 0);

  const revenueData = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - index));
      return {
        date,
        name: formatWeekday(date),
        sales: 0,
      };
    });
    paidOrders.forEach(order => {
      const orderDate = parseApiDate(order.created_at);
      const day = days.find(row => row.date.toDateString() === orderDate.toDateString());
      if (day) day.sales += Number(order.total_amount || 0);
    });
    return days;
  }, [paidOrders]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <h1 className="text-3xl font-bold text-stone-900">Dashboard Overview</h1>
          <p className="text-stone-500 mt-1">{isLoading ? 'Loading live backend metrics...' : `Live overview for ${branchName}.`}</p>
        </div>
        
        {branches.length > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-stone-500">Active Location:</span>
            <select
              value={branchId}
              onChange={e => handleBranchChange(Number(e.target.value))}
              className="bg-white border border-stone-200 px-4 py-2 rounded-xl text-sm font-bold text-stone-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 cursor-pointer"
            >
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 flex items-center gap-4">
          <div className="w-14 h-14 bg-green-100 text-green-700 rounded-xl flex items-center justify-center">
            <DollarSign size={28} />
          </div>
          <div>
            <p className="text-sm font-medium text-stone-500">Today's Paid Sales</p>
            <p className="text-2xl font-bold text-stone-900">{todayRevenue.toFixed(2)} {getCurrency()}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 flex items-center gap-4">
          <div className="w-14 h-14 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center">
            <TrendingUp size={28} />
          </div>
          <div>
            <p className="text-sm font-medium text-stone-500">Total Paid Sales</p>
            <p className="text-2xl font-bold text-stone-900">{revenue.toFixed(2)} {getCurrency()}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 flex items-center gap-4">
          <div className="w-14 h-14 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center">
            <ShoppingBag size={28} />
          </div>
          <div>
            <p className="text-sm font-medium text-stone-500">Orders Today</p>
            <p className="text-2xl font-bold text-stone-900">{todayOrders.length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 flex items-center gap-4">
          <div className="w-14 h-14 bg-stone-100 text-stone-700 rounded-xl flex items-center justify-center">
            <Utensils size={28} />
          </div>
          <div>
            <p className="text-sm font-medium text-stone-500">Menu Rows</p>
            <p className="text-2xl font-bold text-stone-900">{menuCount}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
          <h2 className="text-lg font-bold text-stone-900 mb-6">Paid Revenue, Last 7 Days</h2>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#b45309" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#b45309" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5e4" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#78716c'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#78716c'}} dx={-10} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Area type="monotone" dataKey="sales" stroke="#b45309" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
          <h2 className="text-lg font-bold text-stone-900 mb-6">Operational Snapshot</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-stone-50 rounded-xl border border-stone-100">
              <span className="font-semibold text-stone-700 flex items-center gap-2"><Store size={18} /> Branch</span>
              <span className="font-bold text-stone-900">{branchName}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-stone-50 rounded-xl border border-stone-100">
              <span className="font-semibold text-stone-700">Active Orders</span>
              <span className="font-bold text-stone-900">{activeOrders.length}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-stone-50 rounded-xl border border-stone-100">
              <span className="font-semibold text-stone-700">Catalog Products</span>
              <span className="font-bold text-stone-900">{productCount}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
