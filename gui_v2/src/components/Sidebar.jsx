import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, ListOrdered, Grid, History, Users, Settings, LogOut } from 'lucide-react';
import CashLogo from './CashLogo';
import { useApp } from '../context/AppContext';
import './Sidebar.css';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/pos', icon: ShoppingCart, label: 'POS Terminal' },
  { path: '/orders', icon: ListOrdered, label: 'Held Orders' },
  { path: '/tables', icon: Grid, label: 'Tables' },
  { path: '/history', icon: History, label: 'History' },
  { path: '/management', icon: Settings, label: 'Management' },
];

export default function Sidebar({ collapsed, onToggle }) {
  const { user, logout } = useApp();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredNavItems = navItems.filter(item => {
    if (user?.role === 'admin' && item.path === '/pos') return false;
    if (user?.role === 'cashier' && ['/dashboard', '/pos', '/management'].includes(item.path)) return false;
    return true;
  });

  return (
    <aside className={`sidebar glass-panel ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <CashLogo className="sidebar-logo" />
      </div>
      
      <nav className="sidebar-nav">
        {filteredNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            title={item.label}
          >
            <item.icon size={22} className="nav-icon" />
            <span className="nav-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="btn btn-ghost nav-item" title="Logout" onClick={handleLogout} style={{ width: '100%', justifyContent: collapsed ? 'center' : 'flex-start' }}>
          <LogOut size={22} className="nav-icon text-danger" />
          <span className="nav-label">Logout</span>
        </button>
      </div>
    </aside>
  );
}
