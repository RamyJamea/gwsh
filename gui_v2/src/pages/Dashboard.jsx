import React from 'react';
import { TrendingUp, Users, DollarSign, ShoppingBag } from 'lucide-react';
import './Dashboard.css';

export default function Dashboard() {
  const stats = [
    { label: 'Total Revenue', value: '$12,426', icon: DollarSign, trend: '+14%' },
    { label: 'Active Orders', value: '42', icon: ShoppingBag, trend: '+5%' },
    { label: 'Total Customers', value: '1,240', icon: Users, trend: '+18%' },
    { label: 'Avg. Order Value', value: '$36.50', icon: TrendingUp, trend: '+2%' },
  ];

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p className="text-muted">Welcome back. Here's what's happening today.</p>
      </div>

      <div className="stats-grid">
        {stats.map((stat, idx) => (
          <div key={idx} className="stat-card glass-panel">
            <div className="stat-icon">
              <stat.icon size={24} />
            </div>
            <div className="stat-info">
              <h3>{stat.label}</h3>
              <p>{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-content">
        <div className="chart-card glass-panel">
          <h3>Revenue Overview</h3>
          <div style={{ height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-md)' }}>
            <p className="text-muted">Chart visualization goes here</p>
          </div>
        </div>
        
        <div className="recent-activity glass-panel">
          <h3>Recent Activity</h3>
          <div className="activity-list">
            <div className="activity-item">
              <div className="activity-icon" style={{ padding: '0.5rem', borderRadius: '50%', background: 'var(--color-bg-subtle)' }}>
                <ShoppingBag size={16} />
              </div>
              <div className="activity-info">
                <p>Order #1042 completed</p>
                <span>2 minutes ago</span>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-icon" style={{ padding: '0.5rem', borderRadius: '50%', background: 'var(--color-bg-subtle)' }}>
                <Users size={16} />
              </div>
              <div className="activity-info">
                <p>New customer registered</p>
                <span>15 minutes ago</span>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-icon" style={{ padding: '0.5rem', borderRadius: '50%', background: 'var(--color-bg-subtle)' }}>
                <DollarSign size={16} />
              </div>
              <div className="activity-info">
                <p>Daily settlement</p>
                <span>1 hour ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
