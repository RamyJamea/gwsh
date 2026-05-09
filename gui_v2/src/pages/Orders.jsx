import React, { useState, useEffect } from 'react';
import { Search, Clock, Trash2, Edit3, MoreVertical } from 'lucide-react';
import { api } from '../api/api';
import { useApp } from '../context/AppContext';
import './Orders.css';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useApp();

  useEffect(() => {
    if (user?.branch_id) fetchOrders();
  }, [user]);

  const fetchOrders = async () => {
    try {
      const data = await api.get(`/orders/?branch_id=${user.branch_id}`);
      const heldOrders = data.filter(o => o.action === 'create');
      setOrders(heldOrders);
    } catch (err) {
      console.error('Failed to fetch orders', err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.del(`/orders/${id}`);
      fetchOrders();
    } catch (err) {
      alert('Delete failed');
    }
  };

  const filteredOrders = orders.filter(o => o.id.toString().includes(searchQuery));

  return (
    <div className="orders-container">
      <div className="page-header">
        <h1>Held Orders</h1>
        <div className="search-bar glass-panel">
          <Search size={20} className="text-muted" />
          <input 
            type="text" 
            placeholder="Search orders..." 
            className="search-input" 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="orders-grid">
        {filteredOrders.map(order => (
          <div key={order.id} className="order-card glass-panel">
            <div className="order-card-header">
              <span className="order-id">#{order.id}</span>
              <span className="order-time text-muted"><Clock size={14} /> {new Date(order.created_at).toLocaleTimeString()}</span>
            </div>
            <div className="order-card-body">
              <h3 className="order-table">Table {order.table_id || 'Takeaway'}</h3>
              <p className="order-meta text-muted">{order.items?.length || 0} items • ${order.total_amount?.toFixed(2) || '0.00'}</p>
            </div>
            <div className="order-card-actions">
              <button className="btn btn-outline btn-block">Resume Order</button>
              <div className="quick-actions">
                <button className="btn btn-icon btn-ghost text-muted"><Edit3 size={18} /></button>
                <button className="btn btn-icon btn-ghost text-danger" onClick={() => handleDelete(order.id)}><Trash2 size={18} /></button>
              </div>
            </div>
          </div>
        ))}
        {filteredOrders.length === 0 && <p className="text-muted">No held orders found.</p>}
      </div>
    </div>
  );
}
