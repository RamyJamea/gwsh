import React, { useState, useEffect } from 'react';
import { Settings, Users, Store, Package, Download, ChevronLeft, Trash2, Plus, X } from 'lucide-react';
import { api } from '../api/api';
import './Management.css';

export default function Management() {
  const [activeTab, setActiveTab] = useState(null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({});

  const categories = [
    { id: 'users', name: 'User Access', icon: Users, desc: 'Cashiers, admins, roles', endpoint: '/users/' },
    { id: 'branches', name: 'Branches', icon: Store, desc: 'Manage locations', endpoint: '/branches/' },
    { id: 'categories', name: 'Categories', icon: Package, desc: 'Product categories', endpoint: '/categories/' },
    { id: 'products', name: 'Products', icon: Package, desc: 'Menu items', endpoint: '/products/' },
  ];

  const loadData = async (endpoint) => {
    setLoading(true);
    try {
      const res = await api.get(endpoint);
      setData(res);
    } catch (err) {
      alert('Error loading data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleManage = (cat) => {
    setActiveTab(cat);
    loadData(cat.endpoint);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      await api.del(`${activeTab.endpoint}${id}`);
      loadData(activeTab.endpoint);
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  };

  const openModal = () => {
    setFormData(activeTab.id === 'users' ? { role: 'cashier' } : {});
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    let payload = { ...formData };
    
    if (payload.branch_id) payload.branch_id = parseInt(payload.branch_id);
    if (payload.category_id) payload.category_id = parseInt(payload.category_id);
    
    try {
      await api.post(activeTab.endpoint, payload);
      setIsModalOpen(false);
      loadData(activeTab.endpoint);
    } catch (err) {
      alert('Create failed: ' + err.message);
    }
  };

  const renderModalForm = () => {
    if (!activeTab) return null;
    
    if (activeTab.id === 'branches' || activeTab.id === 'categories') {
      return (
        <div className="form-group">
          <label>Name</label>
          <input className="input" autoFocus type="text" required value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
        </div>
      );
    }
    if (activeTab.id === 'users') {
      return (
        <>
          <div className="form-group">
            <label>Username</label>
            <input className="input" autoFocus type="text" required value={formData.username || ''} onChange={e => setFormData({...formData, username: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Role</label>
            <select className="input" required value={formData.role || 'cashier'} onChange={e => setFormData({...formData, role: e.target.value})}>
              <option value="cashier">Cashier</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="form-group">
            <label>Password</label>
            <input className="input" type="password" required value={formData.password || ''} onChange={e => setFormData({...formData, password: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Branch ID</label>
            <input className="input" type="number" required value={formData.branch_id || ''} onChange={e => setFormData({...formData, branch_id: e.target.value})} />
          </div>
        </>
      );
    }
    if (activeTab.id === 'products') {
      return (
        <>
          <div className="form-group">
            <label>Name</label>
            <input className="input" autoFocus type="text" required value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Category ID</label>
            <input className="input" type="number" required value={formData.category_id || ''} onChange={e => setFormData({...formData, category_id: e.target.value})} />
          </div>
        </>
      );
    }
    return null;
  };

  return (
    <div className="management-container">
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {activeTab && (
          <button className="btn btn-icon btn-ghost" onClick={() => setActiveTab(null)}>
            <ChevronLeft size={24} />
          </button>
        )}
        <h1>{activeTab ? activeTab.name : 'Management'}</h1>
        
        {!activeTab ? (
          <button className="btn btn-outline" style={{ marginLeft: 'auto' }}>
            <Download size={16} /> Backup Database
          </button>
        ) : (
          <button className="btn btn-primary" style={{ marginLeft: 'auto' }} onClick={openModal}>
            <Plus size={16} /> Add {activeTab.name}
          </button>
        )}
      </div>

      {!activeTab ? (
        <div className="settings-grid">
          {categories.map(cat => (
            <div key={cat.id} className="setting-card glass-panel">
              <div className="setting-icon-wrapper">
                <cat.icon size={24} />
              </div>
              <div className="setting-info">
                <h2>{cat.name}</h2>
                <p className="text-muted">{cat.desc}</p>
              </div>
              <button className="btn btn-primary" style={{ marginTop: 'auto' }} onClick={() => handleManage(cat)}>
                Manage
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: '1rem', borderRadius: 'var(--radius-lg)' }}>
          {loading ? (
            <p>Loading...</p>
          ) : data.length === 0 ? (
            <p className="text-muted">No {activeTab.name.toLowerCase()} found.</p>
          ) : (
            <table className="data-table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <th style={{ padding: '0.75rem' }}>ID</th>
                  <th style={{ padding: '0.75rem' }}>Name/Info</th>
                  <th style={{ padding: '0.75rem', width: '100px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '0.75rem' }}>{item.id}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <strong>{item.name || item.username}</strong>
                      {item.role && <span className="badge badge-info" style={{ marginLeft: '8px', padding: '2px 6px', background: 'var(--color-bg-elevated)', borderRadius: '4px', fontSize: '0.75rem' }}>{item.role}</span>}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <button className="btn btn-icon btn-ghost text-danger" onClick={() => handleDelete(item.id)}>
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ background: 'var(--color-bg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Add {activeTab.name}</h2>
              <button className="btn btn-icon btn-ghost" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleModalSubmit}>
              {renderModalForm()}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '2rem' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
