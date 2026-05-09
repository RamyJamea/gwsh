import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Info, XCircle } from 'lucide-react';
import { api } from '../api/api';
import { useApp } from '../context/AppContext';
import './Tables.css';

export default function Tables() {
  const [tables, setTables] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const navigate = useNavigate();
  const { user } = useApp();
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (user?.branch_id) fetchTables();
  }, [user]);

  const fetchTables = async () => {
    try {
      const [tablesData, ordersData] = await Promise.all([
        api.get(`/tables/branch/${user.branch_id}`),
        api.get(`/orders/?branch_id=${user.branch_id}`)
      ]);
      
      const activeOrders = ordersData.filter(o => o.action === 'create' && o.table_id);
      const orderMap = {};
      activeOrders.forEach(o => { orderMap[o.table_id] = o.id; });

      const mappedTables = tablesData.map(t => ({
        ...t,
        status: t.is_available ? 'available' : 'occupied',
        current_order_id: orderMap[t.id] || null
      }));

      setTables(mappedTables);
    } catch (err) {
      console.error('Failed to fetch tables', err);
    }
  };

  const handleCancel = async (orderId) => {
    if (!orderId) return;
    try {
      await api.post(`/orders/${orderId}/cancel`);
      fetchTables();
    } catch (err) {
      alert('Failed to cancel order: ' + err.message);
    }
  };

  const handleOpenTable = (tableId) => {
    navigate(`/pos?table_id=${tableId}`);
  };

  const handleTakeAway = () => {
    navigate('/pos');
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDragStart = (e, tableId) => {
    e.dataTransfer.setData('table_id', tableId);
  };

  const handleDrop = async (e, x, y) => {
    e.preventDefault();
    const tableId = e.dataTransfer.getData('table_id');
    if (!tableId) return;

    try {
      await api.patch(`/tables/${tableId}`, { grid_x: x, grid_y: y });
      fetchTables();
    } catch (err) {
      alert('Failed to move table: ' + err.message);
    }
  };

  const cells = [];
  for (let y = 0; y < 10; y++) {
    for (let x = 0; x < 10; x++) {
      cells.push({ x, y });
    }
  }

  return (
    <div className="tables-container">
      <div className="page-header">
        <h1>Floor Plan</h1>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          {isAdmin && (
            <button 
              className={`btn ${isEditMode ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setIsEditMode(!isEditMode)}
            >
              {isEditMode ? 'Done Editing' : 'Edit Floor Layout'}
            </button>
          )}
          <button className="btn btn-primary" onClick={handleTakeAway}>Take Away (New Order)</button>
          <div className="table-legend">
            <div className="legend-item"><span className="dot available"></span> Available</div>
            <div className="legend-item"><span className="dot occupied"></span> Occupied</div>
          </div>
        </div>
      </div>

      <div className="tables-grid">
        {cells.map(cell => {
          const table = tables.find(t => t.grid_x === cell.x && t.grid_y === cell.y);
          return (
            <div 
              key={`${cell.x}-${cell.y}`} 
              className="grid-cell"
              onDragOver={isEditMode ? handleDragOver : undefined}
              onDrop={isEditMode ? (e) => handleDrop(e, cell.x, cell.y) : undefined}
            >
              {isEditMode && !table && <div className="drop-zone"></div>}
              {table && (
                <div 
                  draggable={isEditMode}
                  onDragStart={(e) => handleDragStart(e, table.id)}
                  className={`table-card glass-panel ${table.status} ${isEditMode ? 'draggable' : ''}`}
                >
                  <div className="table-header">
                    <h2>T{table.table_number || table.id}</h2>
                    <span className="table-capacity text-muted"><Users size={12} /> {table.num_chairs}</span>
                  </div>
                  
                  <div className="table-status-indicator"></div>
                  
                  {table.status === 'occupied' ? (
                    <div className="table-details">
                      <p>Order {table.current_order_id ? `#${table.current_order_id}` : 'Active'}</p>
                    </div>
                  ) : (
                    <div className="table-details empty">
                      <p>Ready</p>
                    </div>
                  )}

                  {!isEditMode && (
                    <div className="table-hover-actions">
                      {table.status === 'occupied' ? (
                        <>
                          <button className="btn btn-primary" onClick={() => handleOpenTable(table.id)}>View Order</button>
                          <button className="btn btn-outline text-danger" style={{borderColor: 'var(--color-danger)'}} onClick={() => handleCancel(table.current_order_id)}>
                            <XCircle size={16} /> Cancel
                          </button>
                        </>
                      ) : (
                        <button className="btn btn-primary" onClick={() => handleOpenTable(table.id)}>Open Table</button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
