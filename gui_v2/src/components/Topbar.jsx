import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, User, MapPin, Moon, Sun, LogOut } from 'lucide-react';
import { useApp } from '../context/AppContext';
import './Topbar.css';

export default function Topbar({ onToggleSidebar }) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const { user, logout } = useApp();
  const navigate = useNavigate();
  const isCashier = user?.role === 'cashier';

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <header className="topbar glass-panel">
      <div className="topbar-left">
        {!isCashier && (
          <button className="btn btn-ghost btn-icon" onClick={onToggleSidebar}>
            <Menu size={20} />
          </button>
        )}
        

      </div>
      
      <div className="topbar-right">
        <button className="btn btn-ghost btn-icon" onClick={() => setIsDarkMode(!isDarkMode)} title="Toggle Theme">
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <button className="btn btn-outline" style={{ borderRadius: 'var(--radius-full)' }}>
          Detailed Menu
        </button>
        <div className="user-pill">
          <div className="user-avatar">
            <User size={16} />
          </div>
          <span className="user-name" style={{ textTransform: 'capitalize' }}>
            {user ? `${user.username} (${user.role})` : 'Guest'}
          </span>
        </div>
        {isCashier && (
          <button className="btn btn-ghost btn-icon text-danger" onClick={() => { logout(); navigate('/login'); }} title="Logout">
            <LogOut size={20} />
          </button>
        )}
      </div>
    </header>
  );
}
