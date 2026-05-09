import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import './POS.css';
import { Search, ShoppingCart, Plus, Minus, Trash2 } from 'lucide-react';
import { api } from '../api/api';
import { useApp } from '../context/AppContext';

function ProductCard({ product, onAdd }) {
  const [selectedItemId, setSelectedItemId] = useState(product.items[0]?.id);

  const selectedItem = product.items.find(i => i.id === selectedItemId) || product.items[0];

  const handleSizeClick = (e, itemId) => {
    e.stopPropagation();
    setSelectedItemId(itemId);
  };

  if (!selectedItem) return null;

  return (
    <div className="product-card glass-panel" onClick={() => onAdd(product, selectedItem)}>
      <div className="product-image-placeholder" style={{ backgroundImage: `url(${product.image_url ? 'http://localhost:8000' + product.image_url : ''})`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
      <div className="product-info">
        <h3>{product.name}</h3>
        <p className="price">${Number(selectedItem.price).toFixed(2)}</p>
        
        {product.items.length > 1 && (
          <div className="size-circles" onClick={e => e.stopPropagation()}>
            {product.items.map(item => (
              <button 
                key={item.id}
                className={`size-circle ${selectedItemId === item.id ? 'active' : ''}`}
                onClick={(e) => handleSizeClick(e, item.id)}
                title={item.size_name}
              >
                {item.size_name.charAt(0).toUpperCase()}
              </button>
            ))}
          </div>
        )}
      </div>
      <button className="btn btn-icon add-btn" onClick={(e) => {
        e.stopPropagation();
        onAdd(product, selectedItem);
      }}>
        <Plus size={20} />
      </button>
    </div>
  );
}

export default function POS() {
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [tables, setTables] = useState([]);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const urlTableId = searchParams.get('table_id') || '';
  const [selectedTableId, setSelectedTableId] = useState(urlTableId);

  useEffect(() => {
    setSelectedTableId(urlTableId);
  }, [urlTableId]);

  const { cart, addToCart, removeFromCart, clearCart, user, loading } = useApp();


  const fetchTables = async () => {
    try {
      const availableTables = await api.get(`/tables/branch/${user.branch_id}/available`);
      setTables(availableTables);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!user || !user.branch_id) return;

    Promise.all([
      api.get('/categories/'),
      api.get('/products/'),
      api.get('/sizes/'),
      api.get(`/menu-items/branch/${user.branch_id}`)
    ]).then(([cats, prods, sizes, mItems]) => {
      setCategories([{ id: 'all', name: 'All' }, ...cats]);
      fetchTables();

      const prodMap = {};
      prods.forEach(p => prodMap[p.id] = p);

      const sizeMap = {};
      sizes.forEach(s => sizeMap[s.id] = s);

      const grouped = {};
      mItems.forEach(mi => {
        if (!grouped[mi.product_id]) {
          grouped[mi.product_id] = {
            product_id: mi.product_id,
            name: prodMap[mi.product_id]?.name || `Product ${mi.product_id}`,
            image_url: prodMap[mi.product_id]?.image_url,
            category_id: prodMap[mi.product_id]?.category_id,
            items: []
          };
        }
        grouped[mi.product_id].items.push({
          id: mi.id,
          price: mi.price,
          size_id: mi.size_id,
          size_name: sizeMap[mi.size_id]?.name || 'Regular',
        });
      });
      
      Object.values(grouped).forEach(g => g.items.sort((a, b) => a.size_id - b.size_id));
      setMenuItems(Object.values(grouped));
    }).catch(console.error);
  }, [user]);

  if (loading) return null;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role === 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  const filteredItems = menuItems.filter(p => {
    const matchesSearch = p.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = activeCategory === 'All' || p.category_id === categories.find(c => c.name === activeCategory)?.id;
    return matchesSearch && matchesCat;
  });

  const handleAddProduct = (product, selectedItem) => {
    const cartItem = {
      id: selectedItem.id,
      name: selectedItem.size_name && selectedItem.size_name !== 'Regular' ? `${product.name} (${selectedItem.size_name})` : product.name,
      price: selectedItem.price,
      image_url: product.image_url,
      category_id: product.category_id,
      product_id: product.product_id,
      quantity: 1
    };
    addToCart(cartItem);
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = cartTotal * 0.08;
  const grandTotal = cartTotal + tax;

  const handleCheckout = async (isHold = false) => {
    if (cart.length === 0) return;
    try {
      const orderData = {
        cashier_id: user.id,
        branch_id: user.branch_id || 1,
        table_id: selectedTableId ? parseInt(selectedTableId) : null,
        total_amount: grandTotal,
        payment_method: isHold ? null : "cash",
        items: cart.map(item => ({
          menu_item_id: item.id,
          quantity: item.quantity,
          price_at_time: item.price,
          extras: []
        }))
      };
      await api.post('/orders/', orderData);
      clearCart();
      setSelectedTableId('');
      fetchTables();
      navigate('/tables');
    } catch (err) {
      alert((isHold ? 'Hold' : 'Checkout') + ' failed: ' + err.message);
    }
  };

  return (
    <div className="pos-container">
      <div className="pos-main">
        <div className="pos-header">
          <h2>Point of Sale</h2>
          <div className="search-bar glass-panel">
            <Search size={20} className="text-muted" />
            <input
              type="text"
              placeholder="Search products..."
              className="search-input"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="categories-pills">
          {categories.map(cat => (
            <button
              key={cat.id}
              className={`btn ${activeCategory === cat.name ? 'btn-primary' : 'btn-outline'}`}
              style={{ borderRadius: 'var(--radius-full)' }}
              onClick={() => setActiveCategory(cat.name)}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <div className="product-grid">
          {filteredItems.map(item => (
            <ProductCard key={item.product_id} product={item} onAdd={handleAddProduct} />
          ))}
          {filteredItems.length === 0 && <p className="text-muted">No products found.</p>}
        </div>
      </div>

      <div className="pos-cart glass-panel">
        <div className="cart-header">
          <h3>Current Order</h3>
          {cart.length > 0 && <button className="btn btn-icon btn-ghost text-danger" onClick={clearCart} title="Clear Cart"><Trash2 size={18} /></button>}
        </div>

        <div className="cart-items">
          {cart.length === 0 ? (
            <div className="empty-cart text-muted">
              <ShoppingCart size={48} opacity={0.5} style={{ marginBottom: '1rem' }} />
              <p>Cart is empty</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{item.name}</div>
                  <div className="text-muted" style={{ fontSize: '0.875rem' }}>${Number(item.price).toFixed(2)} x {item.quantity}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button className="btn btn-icon btn-outline" style={{ padding: '0.25rem' }} onClick={() => removeFromCart(item.id)}><Minus size={14} /></button>
                  <span>{item.quantity}</span>
                  <button className="btn btn-icon btn-outline" style={{ padding: '0.25rem' }} onClick={() => addToCart(item)}><Plus size={14} /></button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="cart-summary">
          <div className="table-selection" style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Dining Option</label>
            <select 
              className="search-input glass-panel" 
              style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
              value={selectedTableId}
              onChange={(e) => setSelectedTableId(e.target.value)}
            >
              <option value="">Take Away</option>
              {tables.map(t => (
                <option key={t.id} value={t.id}>Table {t.table_number || t.id}</option>
              ))}
            </select>
          </div>

          <div className="summary-row">
            <span>Subtotal</span>
            <span>${cartTotal.toFixed(2)}</span>
          </div>
          <div className="summary-row">
            <span>Tax (8%)</span>
            <span>${tax.toFixed(2)}</span>
          </div>
          <div className="summary-row total">
            <span>Total</span>
            <span>${grandTotal.toFixed(2)}</span>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
            <button className="btn btn-outline" style={{ flex: 1, padding: '1rem', fontSize: '1.125rem' }} onClick={() => handleCheckout(true)} disabled={cart.length === 0}>
              Hold Order
            </button>
            <button className="btn btn-primary" style={{ flex: 1, padding: '1rem', fontSize: '1.125rem' }} onClick={() => handleCheckout(false)} disabled={cart.length === 0}>
              Checkout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
