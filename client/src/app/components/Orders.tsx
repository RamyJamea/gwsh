import React, { useEffect, useMemo, useState } from 'react';
import { Download, Filter, RefreshCw, Search, ShoppingBag, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { historyApi, orderApi, OrderResponse, parseApiDate, branchApi, BranchRead, userApi } from '../api-client';
import { useAuth } from '../auth-context';
import { getCurrency, formatDateTime } from '../currency';

export function Orders() {
  const { user } = useAuth();
  const [branchId, setBranchId] = useState<number>(() => user?.branch_id || Number(localStorage.getItem('activeBranchId')) || 1);
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [branches, setBranches] = useState<BranchRead[]>([]);
  const [cashierMap, setCashierMap] = useState<Map<number, string>>(new Map());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.role === 'admin') {
      branchApi.list()
        .then(setBranches)
        .catch(err => console.error('Failed to load branches:', err));
    }
  }, [user]);

  useEffect(() => {
    userApi.list()
      .then(usersList => {
        const m = new Map<number, string>();
        usersList.forEach(u => m.set(u.id, u.username));
        setCashierMap(m);
      })
      .catch(err => console.error('Failed to load users list for mapping:', err));
  }, []);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const data = await orderApi.list(branchId);
      setOrders(data.sort((a, b) => Number(parseApiDate(b.created_at)) - Number(parseApiDate(a.created_at))));
    } catch (err: any) {
      toast.error(err.message || 'Failed to load orders');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteOrder = async (orderId: number) => {
    if (!window.confirm(`Are you sure you want to delete Order #${orderId} completely? This will erase it from history and release its table.`)) {
      return;
    }
    try {
      await orderApi.delete(orderId);
      toast.success(`Order #${orderId} deleted successfully`);
      loadOrders();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete order');
    }
  };

  const downloadBranchExcel = async () => {
    try {
      const blob = await historyApi.downloadBranchExcel(branchId);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `branch_${branchId}_orders.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success('Excel report downloaded');
    } catch (err: any) {
      toast.error(err.message || 'Failed to download Excel report');
    }
  };

  useEffect(() => {
    loadOrders();
  }, [branchId]);

  const filteredOrders = useMemo(() => orders.filter(order => {
    const searchMatch = !searchTerm || String(order.id).includes(searchTerm.trim());
    const statusMatch = statusFilter === 'All' || order.action === statusFilter;
    return searchMatch && statusMatch;
  }), [orders, searchTerm, statusFilter]);

  const destinationLabel = (order: OrderResponse) => {
    if (order.table_id) return `Table ${order.table_id}`;
    return order.destination || 'External';
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-stone-900 flex items-center gap-3">
            <ShoppingBag className="text-amber-800" />
            Orders & Reports
          </h1>
          <p className="text-stone-500 mt-1">Review backend orders for branch #{branchId}.</p>
        </div>
        <div className="flex items-center gap-3">
          {user?.role === 'admin' && branches.length > 0 && (
            <div className="relative flex items-center bg-white border border-stone-200 rounded-xl px-3 py-2 gap-2">
              <span className="text-sm font-semibold text-stone-500">Location:</span>
              <select
                value={branchId}
                onChange={e => {
                  const newId = Number(e.target.value);
                  setBranchId(newId);
                  localStorage.setItem('activeBranchId', String(newId));
                }}
                className="bg-transparent text-stone-700 font-bold outline-none cursor-pointer text-sm"
              >
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          )}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
            <input
              type="text"
              placeholder="Search order ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-stone-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-700"
            />
          </div>
          <div className="relative flex items-center bg-white border border-stone-200 rounded-xl px-3 py-2 gap-2">
            <Filter size={18} className="text-stone-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-stone-700 font-medium outline-none cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="create">Created</option>
              <option value="update">Updated</option>
              <option value="pay">Paid</option>
              <option value="cancel">Cancelled</option>
            </select>
          </div>
          <button
            onClick={loadOrders}
            className="inline-flex items-center gap-2 px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-semibold transition-colors"
          >
            <RefreshCw size={18} />
            Refresh
          </button>
          <button
            onClick={downloadBranchExcel}
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-800 hover:bg-amber-900 text-white rounded-xl font-semibold transition-colors"
          >
            <Download size={18} />
            Excel
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200">
                <th className="px-6 py-4 font-semibold text-stone-700">Order ID</th>
                <th className="px-6 py-4 font-semibold text-stone-700">Time</th>
                <th className="px-6 py-4 font-semibold text-stone-700">Cashier</th>
                <th className="px-6 py-4 font-semibold text-stone-700">Destination</th>
                <th className="px-6 py-4 font-semibold text-stone-700">Status</th>
                <th className="px-6 py-4 font-semibold text-stone-700">Payment</th>
                <th className="px-6 py-4 font-semibold text-stone-700 text-right">Total ({getCurrency()})</th>
                {user?.role === 'admin' && (
                  <th className="px-6 py-4 font-semibold text-stone-700 text-right">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {isLoading && (
                <tr>
                  <td colSpan={user?.role === 'admin' ? 8 : 7} className="px-6 py-8 text-center text-stone-500">Loading orders...</td>
                </tr>
              )}
              {!isLoading && filteredOrders.map(order => (
                <tr key={order.id} className="hover:bg-stone-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-stone-900">#{order.id}</td>
                  <td className="px-6 py-4 text-stone-500">{formatDateTime(parseApiDate(order.created_at))}</td>
                  <td className="px-6 py-4 font-medium text-amber-700">{cashierMap.get(order.cashier_id) || `User #${order.cashier_id}`}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100 text-stone-700 text-sm font-semibold">
                      {destinationLabel(order)}
                    </span>
                  </td>
                  <td className="px-6 py-4 capitalize text-stone-700">{order.action}</td>
                  <td className="px-6 py-4 capitalize text-stone-700">{order.payment_method || 'Pending'}</td>
                  <td className="px-6 py-4 text-right font-bold text-amber-900">{Number(order.total_amount).toFixed(2)}</td>
                  {user?.role === 'admin' && (
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDeleteOrder(order.id)}
                        className="inline-flex items-center justify-center p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Order Completely"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {!isLoading && filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={user?.role === 'admin' ? 8 : 7} className="px-6 py-8 text-center text-stone-500">
                    No orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
