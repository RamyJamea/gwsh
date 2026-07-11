import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { LogOut, Coffee, DollarSign, ShoppingBag } from 'lucide-react';
import { useAuth } from '../auth-context';
import { getCurrency } from '../currency';
import { tableApi, TableRead, orderApi, parseApiDate } from '../api-client';
import { toast } from 'sonner';

export function TableSelection() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const storedBranchId = Number(localStorage.getItem('activeBranchId'));
  const branchId = user?.branch_id || storedBranchId || 1;
  const branch = localStorage.getItem('activeBranchName') || `Branch ${branchId}`;

  const [tables, setTables] = useState<TableRead[]>([]);
  const [todayPaidSales, setTodayPaidSales] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    tableApi.listByBranch(branchId)
      .then(data => {
        // Sort tables by ID for consistent display order
        setTables(data.sort((a, b) => a.id - b.id));
        setIsLoading(false);
      })
      .catch(err => {
        console.error(err);
        toast.error(err.message || 'Failed to load tables');
        setIsLoading(false);
      });

    orderApi.list(branchId)
      .then(orders => {
        const today = new Date().toDateString();
        const todayRevenue = orders
          .filter(order => parseApiDate(order.created_at).toDateString() === today)
          .filter(order => order.action === 'pay')
          .reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
        setTodayPaidSales(todayRevenue);
      })
      .catch(err => {
        console.error('Failed to load orders for today sales:', err);
      });
  }, [branchId]);

  const handleSelectTable = (table: TableRead) => {
    navigate(`/pos?dest=Table&tableId=${table.id}`);
  };

  const handleSelectTakeAway = () => {
    navigate(`/pos?dest=Take Away&isTakeAway=true`);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] p-8 font-sans flex flex-col items-center">
      <div className="w-full max-w-5xl">
        <header className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-3xl font-bold text-stone-900">Order Destination</h1>
            <p className="text-stone-500 mt-1">{branch} - Select where this order is going</p>
          </div>
          
          <div className="flex items-center gap-6">
            {todayPaidSales !== null && (
              <div className="bg-white px-5 py-2.5 rounded-2xl shadow-sm border border-stone-200 flex items-center gap-3 transition-all hover:shadow-md">
                <div className="w-10 h-10 bg-green-50 text-green-700 rounded-xl flex items-center justify-center">
                  <DollarSign size={20} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Today's Paid Sales</p>
                  <p className="text-lg font-extrabold text-stone-900">{todayPaidSales.toFixed(2)} {getCurrency()}</p>
                </div>
              </div>
            )}

            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-stone-600 bg-stone-200 hover:bg-stone-300 rounded-lg transition-colors font-medium cursor-pointer"
            >
              <LogOut size={18} />
              Log Out
            </button>
          </div>
        </header>

        <div className="space-y-12">
          {/* Take Away */}
          <section>
            <h2 className="text-xl font-bold text-stone-800 mb-6 flex items-center gap-2">
              <ShoppingBag className="text-stone-500" />
              Take Away / Direct Order
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <button 
                onClick={handleSelectTakeAway}
                className="bg-amber-50/50 hover:bg-amber-50 border border-amber-200 p-8 rounded-2xl flex flex-col items-center justify-center gap-4 transition-all shadow-sm hover:shadow-md group cursor-pointer"
              >
                <ShoppingBag size={48} className="text-amber-800 group-hover:scale-105 transition-transform duration-300" />
                <div className="text-center">
                  <span className="font-extrabold text-amber-900 text-lg block">Take Away</span>
                  <span className="text-xs text-amber-700/70 font-semibold block mt-1">Direct checkout (Hold disabled)</span>
                </div>
              </button>
            </div>
          </section>

          {/* Tables */}
          <section>
            <h2 className="text-xl font-bold text-stone-800 mb-6 flex items-center gap-2">
              <Coffee className="text-stone-500" />
              In-House Tables
            </h2>
            {isLoading ? (
              <div className="text-center py-12 text-stone-500 font-medium">Loading tables...</div>
            ) : tables.length === 0 ? (
              <div className="text-center py-12 text-stone-500 font-medium">No tables found for this branch.</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
                {tables.map(table => (
                  <button
                    key={table.id}
                    onClick={() => handleSelectTable(table)}
                    className={`relative p-6 rounded-2xl border-2 flex flex-col items-center justify-center gap-3 transition-all shadow-sm hover:shadow-md cursor-pointer ${
                      table.is_available 
                        ? 'bg-white border-stone-200 hover:border-amber-600' 
                        : 'bg-amber-50/50 border-amber-300 hover:border-amber-600 hover:bg-amber-50/80'
                    }`}
                  >
                    <div className={`absolute top-3 right-3 w-3 h-3 rounded-full ${
                      table.is_available ? 'bg-green-500' : 'bg-amber-500 animate-pulse'
                    }`} />
                    <span className="text-3xl font-black text-stone-800">Table</span>
                    <span className={`text-sm font-semibold ${table.is_available ? 'text-green-600' : 'text-amber-700'}`}>
                      {table.is_available ? 'Available' : 'Occupied (Hold)'}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
