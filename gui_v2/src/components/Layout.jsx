import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useApp } from '../context/AppContext';
import './Layout.css';

export default function Layout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user, loading } = useApp();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  const isCashier = user?.role === 'cashier';

  return (
    <div className={`app-layout ${isCashier ? 'no-sidebar' : ''}`}>
      <div className="noise-overlay" />
      <div className="ambient-glow glow-1" />
      <div className="ambient-glow glow-2" />
      {!isCashier && <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />}
      <div className="main-content-area">
        <Topbar onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
