import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router';
import { LayoutDashboard, Package, Store, LogOut, Coffee, ShoppingBag, Users, Activity, Layers } from 'lucide-react';

export function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Orders & Reports', path: '/admin/orders', icon: ShoppingBag },
    { label: 'Catalog Management', path: '/admin/catalog', icon: Layers },
    { label: 'Menu Management', path: '/admin/menu', icon: Package },
    { label: 'Branches', path: '/admin/branches', icon: Store },
    { label: 'User Management', path: '/admin/users', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-stone-900 text-stone-50 flex flex-col shadow-xl">
        <div className="p-6 flex items-center gap-3 border-b border-stone-800">
          <div className="w-10 h-10 bg-amber-700 rounded-lg flex items-center justify-center">
            <Coffee size={24} className="text-amber-50" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">Abu Ghoush</h1>
            <p className="text-xs text-stone-400">Admin Portal</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  isActive 
                    ? 'bg-amber-700 text-white font-medium' 
                    : 'text-stone-300 hover:bg-stone-800 hover:text-white'
                }`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>

        <div className="p-4 border-t border-stone-800">
          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-stone-400 hover:bg-stone-800 hover:text-white transition-colors"
          >
            <LogOut size={20} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}