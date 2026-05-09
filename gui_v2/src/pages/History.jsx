import React, { useState, useEffect } from 'react';
import { Search, Download, Filter, FileText } from 'lucide-react';
import { api } from '../api/api';
import './History.css';

export default function History() {
  const [history, setHistory] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await api.get('/orders/?branch_id=1&limit=200');
        const completed = data.filter(o => o.action === 'pay' || o.action === 'cancel');
        setHistory(completed);
      } catch (err) {
        console.error('Failed to fetch history', err);
      }
    };
    fetchHistory();
  }, []);

  const handleDownloadExcel = async () => {
    try {
      const response = await fetch('/api/v1/history/branches/1/export-excel', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) throw new Error('Export failed');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `branch_1_history_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredHistory = history.filter(o => o.id.toString().includes(searchQuery));

  return (
    <div className="history-container">
      <div className="page-header">
        <h1>Order History</h1>
        <div className="header-actions">
          <div className="search-bar glass-panel">
            <Search size={20} className="text-muted" />
            <input 
              type="text" 
              placeholder="Search receipt..." 
              className="search-input" 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="btn btn-outline"><Filter size={16} /> Filter</button>
          <button className="btn btn-primary" onClick={handleDownloadExcel}><Download size={16} /> Export Excel</button>
        </div>
      </div>

      <div className="history-table-container glass-panel">
        <table className="history-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Date</th>
              <th>Total</th>
              <th>Payment Method</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredHistory.map(row => (
              <tr key={row.id}>
                <td className="font-bold">#{row.id}</td>
                <td>{new Date(row.created_at).toLocaleDateString()}</td>
                <td>${row.total_amount?.toFixed(2)}</td>
                <td>{row.payment_method}</td>
                <td>
                  <span className={`status-badge ${row.payment_status?.toLowerCase()}`}>{row.payment_status}</span>
                </td>
                <td className="actions-cell">
                  <button className="btn btn-ghost btn-icon" title="View Receipt"><FileText size={18} /></button>
                </td>
              </tr>
            ))}
            {filteredHistory.length === 0 && (
              <tr><td colSpan="6" className="text-center text-muted" style={{padding: '2rem'}}>No history found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
