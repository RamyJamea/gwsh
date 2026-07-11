import React, { useEffect, useMemo, useState } from 'react';
import { getCurrency } from '../currency';
import { useNavigate, useSearchParams } from 'react-router';
import { Banknote, Bike, Coffee, CreditCard, LogOut, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { catalogApi, menuApi, orderApi } from '../api-client';
import { useAuth } from '../auth-context';

type UiExtra = {
  id: number;
  extraId: number;
  name: string;
  price: number;
  quantity: number;
};

type UiSize = {
  name: string;
  menuItemId: number;
  sizeId: number;
  price: number;
  extras: UiExtra[];
};

type UiMenuItem = {
  productId: number;
  category: string;
  name: string;
  image?: string;
  sizes: UiSize[];
};

type CartItem = {
  cartId: string;
  menuItemId: number;
  name: string;
  size: string;
  price: number;
  quantity: number;
  extras: UiExtra[];
};

export function Pos() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, logout } = useAuth();

  const destination = searchParams.get('dest') || 'In-House';
  const tableId = searchParams.get('tableId') ? Number(searchParams.get('tableId')) : null;
  const branchId = user?.branch_id || Number(localStorage.getItem('activeBranchId')) || 1;
  const branchName = localStorage.getItem('activeBranchName') || `Branch ${branchId}`;
  const cashier = user?.username || localStorage.getItem('cashierName') || 'Cashier';
  const isExternal = !tableId;
  const isTakeAway = searchParams.get('isTakeAway') === 'true';

  const [menuItems, setMenuItems] = useState<UiMenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<UiMenuItem | null>(null);
  const [selectedSize, setSelectedSize] = useState<UiSize | null>(null);
  const [selectedExtras, setSelectedExtras] = useState<UiExtra[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
  const [amountPaid, setAmountPaid] = useState('');
  const [activeOrderId, setActiveOrderId] = useState<number | null>(null);
  const [originalCart, setOriginalCart] = useState<CartItem[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function loadMenu() {
      setIsLoading(true);
      try {
        const [categoryRows, productRows, sizeRows, menuRows, orderRows] = await Promise.all([
          catalogApi.categories(),
          catalogApi.products(),
          catalogApi.sizes(),
          menuApi.listByBranch(branchId),
          orderApi.list(branchId).catch(() => []),
        ]);
        const detailedRows = await Promise.all(menuRows.map(row => menuApi.get(row.id).catch(() => row)));
        const categoryById = new Map(categoryRows.map(row => [row.id, row.name]));
        const productById = new Map(productRows.map(row => [row.id, row]));
        const sizeById = new Map(sizeRows.map(row => [row.id, row]));
        const grouped = new Map<number, UiMenuItem>();

        detailedRows.forEach(row => {
          const product = row.product || productById.get(row.product_id);
          const size = row.size || sizeById.get(row.size_id);
          if (!product) return;

          const category = categoryById.get(product.category_id || 0) || 'Menu';
          const item = grouped.get(product.id) || {
            productId: product.id,
            category,
            name: product.name,
            image: product.image_url || undefined,
            sizes: [],
          };

          item.sizes.push({
            name: size?.name || 'Regular',
            menuItemId: row.id,
            sizeId: row.size_id,
            price: Number(row.price),
            extras: (row.menu_items_extras || []).map(extra => ({
              id: extra.id,
              extraId: extra.extra_id,
              name: extra.extra?.name || `Extra #${extra.extra_id}`,
              price: Number(extra.price),
              quantity: 0,
            })),
          });
          grouped.set(product.id, item);
        });

        const nextMenu = Array.from(grouped.values()).map(item => ({
          ...item,
          sizes: item.sizes.sort((a, b) => a.price - b.price),
        }));
        const nextCategories = categoryRows
          .map(row => row.name)
          .filter(category => nextMenu.some(item => item.category === category));

        if (!cancelled) {
          setMenuItems(nextMenu);
          setCategories(nextCategories);
          setActiveCategory(current => current || nextCategories[0] || '');

          // Check for active order on this table
          if (tableId) {
            const activeOrderShort = orderRows.find(o => 
              o.table_id === tableId && 
              (o.action === 'create' || o.action === 'update')
            );
            if (activeOrderShort) {
              const activeOrder = await orderApi.get(activeOrderShort.id);
              setActiveOrderId(activeOrder.id);
              
              // Map DB order items to CartItem format
              const loadedCart: CartItem[] = activeOrder.order_items.map(oi => {
                const menuI = oi.menu_item;
                return {
                  cartId: `db-${oi.id}`,
                  menuItemId: oi.menu_item_id,
                  name: menuI?.product?.name || 'Unknown Product',
                  size: menuI?.size?.name || 'Regular',
                  price: Number(oi.price_at_time),
                  quantity: oi.quantity,
                  extras: oi.order_item_extras.map(oie => ({
                    id: oie.menu_item_extra_id,
                    extraId: oie.menu_item_extra_id,
                    name: oie.menu_item_extra?.extra?.name || `Extra #${oie.menu_item_extra_id}`,
                    price: Number(oie.price_at_time),
                    quantity: oie.quantity,
                  })),
                };
              });
              setCart(loadedCart);
              setOriginalCart(loadedCart);
            }
          }
        }
      } catch (err: any) {
        toast.error(err.message || 'Failed to load menu');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadMenu();
    return () => {
      cancelled = true;
    };
  }, [branchId, tableId]);

  const filteredMenu = useMemo(
    () => menuItems.filter(item => item.category === activeCategory),
    [activeCategory, menuItems]
  );

  const cartTotal = useMemo(
    () => cart.reduce((sum, item) => {
      const extrasTotal = item.extras.reduce((extraSum, extra) => extraSum + extra.price * extra.quantity, 0);
      return sum + (item.price + extrasTotal) * item.quantity;
    }, 0),
    [cart]
  );

  const openItem = (item: UiMenuItem) => {
    setSelectedItem(item);
    setSelectedSize(item.sizes[0] || null);
    setSelectedExtras((item.sizes[0]?.extras || []).map(extra => ({ ...extra, quantity: 0 })));
  };

  const chooseSize = (size: UiSize) => {
    setSelectedSize(size);
    setSelectedExtras(size.extras.map(extra => ({ ...extra, quantity: 0 })));
  };

  const updateExtra = (extraId: number, delta: number) => {
    setSelectedExtras(prev => prev.map(extra => (
      extra.id === extraId ? { ...extra, quantity: Math.max(0, extra.quantity + delta) } : extra
    )));
  };

  const addSelectedToCart = () => {
    if (!selectedItem || !selectedSize) return;
    setCart(prev => [
      ...prev,
      {
        cartId: Math.random().toString(36).slice(2),
        menuItemId: selectedSize.menuItemId,
        name: selectedItem.name,
        size: selectedSize.name,
        price: selectedSize.price,
        quantity: 1,
        extras: selectedExtras.filter(extra => extra.quantity > 0),
      },
    ]);
    setSelectedItem(null);
  };

  const updateQuantity = (cartId: string, delta: number) => {
    setCart(prev => prev.map(item => (
      item.cartId === cartId ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
    )));
  };

  const removeFromCart = (cartId: string) => {
    setCart(prev => prev.filter(item => item.cartId !== cartId));
  };

  const syncOrderItems = async (orderId: number) => {
    // 1. Remove deleted items
    const itemsToRemove = originalCart.filter(orig => !cart.some(c => c.cartId === orig.cartId));
    await Promise.all(itemsToRemove.map(item => {
      const itemId = Number(item.cartId.replace('db-', ''));
      return orderApi.removeItem(orderId, itemId);
    }));

    // 2. Update changed quantities
    const itemsToUpdate = cart.filter(c => {
      const orig = originalCart.find(o => o.cartId === c.cartId);
      return orig && orig.quantity !== c.quantity;
    });
    await Promise.all(itemsToUpdate.map(item => {
      const itemId = Number(item.cartId.replace('db-', ''));
      return orderApi.updateItemQuantity(orderId, itemId, { quantity: item.quantity });
    }));

    // 3. Add new items
    const itemsToAdd = cart.filter(c => !c.cartId.startsWith('db-'));
    if (itemsToAdd.length > 0) {
      const payload = itemsToAdd.map(item => ({
        menu_item_id: item.menuItemId,
        quantity: item.quantity,
        price_at_time: item.price,
        extras: item.extras.map(extra => ({
          menu_item_extra_id: extra.id,
          quantity: extra.quantity,
          price_at_time: extra.price,
        })),
      }));
      await orderApi.addItems(orderId, { items: payload });
    }
  };

  const handleHoldOrder = async () => {
    if (cart.length === 0 || isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (activeOrderId) {
        // Sync items for existing order
        await syncOrderItems(activeOrderId);
        toast.success(`Order #${activeOrderId} updated and held`);
      } else {
        // Create new order on hold
        const order = await orderApi.create({
          cashier_id: user?.id || 0,
          branch_id: branchId,
          table_id: tableId,
          destination: isExternal ? destination : null,
          total_amount: cartTotal,
          payment_method: null,
          items: cart.map(item => ({
            menu_item_id: item.menuItemId,
            quantity: item.quantity,
            price_at_time: item.price,
            extras: item.extras.map(extra => ({
              menu_item_extra_id: extra.id,
              quantity: extra.quantity,
              price_at_time: extra.price,
            })),
          })),
        });
        toast.success(`Order #${order.id} placed on hold`);
      }
      setCart([]);
      navigate('/destination-selection');
    } catch (err: any) {
      toast.error(err.message || 'Failed to hold order');
    } finally {
      setIsSubmitting(false);
    }
  };

  const completePayment = async (method: 'cash' | 'card') => {
    if (cart.length === 0 || isSubmitting) return;
    setIsSubmitting(true);
    try {
      let finalOrderId = activeOrderId;
      if (finalOrderId) {
        // Sync items for existing order
        await syncOrderItems(finalOrderId);
      } else {
        // Create new order
        const order = await orderApi.create({
          cashier_id: user?.id || 0,
          branch_id: branchId,
          table_id: tableId,
          destination: isExternal ? destination : null,
          total_amount: cartTotal,
          payment_method: isExternal ? method : null,
          items: cart.map(item => ({
            menu_item_id: item.menuItemId,
            quantity: item.quantity,
            price_at_time: item.price,
            extras: item.extras.map(extra => ({
              menu_item_extra_id: extra.id,
              quantity: extra.quantity,
              price_at_time: extra.price,
            })),
          })),
        });
        finalOrderId = order.id;
      }

      await orderApi.checkout(finalOrderId, { payment_method: method });

      toast.success(`Order #${finalOrderId} completed successfully`);
      setCart([]);
      setShowPayment(false);
      setAmountPaid('');
      navigate('/destination-selection');
    } catch (err: any) {
      toast.error(err.message || 'Failed to complete order');
    } finally {
      setIsSubmitting(false);
    }
  };

  const logoutAndExit = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="flex h-screen bg-[#FDFBF7] font-sans overflow-hidden">
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white px-6 py-4 flex items-center justify-between border-b border-stone-200 shrink-0 shadow-sm z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-900 rounded-xl flex items-center justify-center text-amber-50 shadow-md">
              <Coffee size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-stone-900">Abu Ghoush POS</h1>
              <p className="text-sm text-stone-500">Cashier: {cashier} · {branchName}</p>
            </div>
          </div>
          <button onClick={logoutAndExit} className="flex items-center gap-2 px-4 py-2 text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors font-medium">
            <LogOut size={18} />
            Exit POS
          </button>
        </header>

        {destination === 'Trendyol' && (
          <div className="bg-purple-700 px-6 py-3 flex items-center justify-center gap-2 shadow-md">
            <Bike size={20} className="text-white" />
            <span className="text-white font-bold text-sm uppercase tracking-wide">Trendyol order</span>
          </div>
        )}

        <div className="bg-stone-50 px-6 py-3 border-b border-stone-200 overflow-x-auto no-scrollbar shrink-0">
          <div className="flex gap-3">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-5 py-3 rounded-2xl whitespace-nowrap font-semibold text-sm transition-all shadow-sm ${
                  activeCategory === category
                    ? 'bg-amber-900 text-white'
                    : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="py-12 text-center text-stone-500 font-medium">Loading menu...</div>
          ) : filteredMenu.length === 0 ? (
            <div className="py-12 text-center text-stone-500 font-medium">No menu items available for this branch.</div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredMenu.map(item => {
                const min = item.sizes[0]?.price || 0;
                const max = item.sizes[item.sizes.length - 1]?.price || min;
                return (
                  <button
                    key={item.productId}
                    onClick={() => openItem(item)}
                    className="bg-white border border-stone-200 rounded-2xl overflow-hidden hover:shadow-lg transition-all flex flex-col text-left group h-full"
                  >
                    <div className="h-32 bg-stone-100 w-full relative overflow-hidden">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-stone-300">
                          <Coffee size={32} />
                        </div>
                      )}
                      {(item.sizes.length > 1 || item.sizes.some(size => size.extras.length > 0)) && (
                        <div className="absolute top-2 right-2 bg-stone-900/70 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-md font-medium">
                          Options
                        </div>
                      )}
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <h3 className="font-bold text-stone-900 line-clamp-2 leading-tight">{item.name}</h3>
                      <div className="mt-2 font-bold text-amber-700">
                        {min === max ? `${min} ${getCurrency()}` : `${min} - ${max} ${getCurrency()}`}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="w-96 bg-white border-l border-stone-200 flex flex-col shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)] z-20">
        <div className="p-5 border-b border-stone-200 bg-stone-50">
          <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
            <ShoppingBag size={20} className="text-amber-800" />
            Current Order
          </h2>
          <p className="text-sm text-stone-500 mt-1">{destination}</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-stone-400 gap-3">
              <ShoppingBag size={48} className="opacity-50" />
              <p className="font-medium">Order cart is empty</p>
            </div>
          ) : cart.map(item => {
            const extrasTotal = item.extras.reduce((sum, extra) => sum + extra.price * extra.quantity, 0);
            return (
              <div key={item.cartId} className="bg-stone-50 border border-stone-200 rounded-xl p-3 flex flex-col gap-2 shadow-sm">
                <div className="flex gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-stone-900 truncate">{item.name}</div>
                    <div className="text-sm font-medium text-amber-800">{item.size}</div>
                  </div>
                  <button onClick={() => removeFromCart(item.cartId)} className="text-stone-400 hover:text-red-500 p-1">
                    <Trash2 size={16} />
                  </button>
                </div>
                {item.extras.length > 0 && (
                  <div className="pl-2 border-l-2 border-stone-200 space-y-1 my-1">
                    {item.extras.map(extra => (
                      <div key={extra.id} className="text-xs text-stone-500 flex justify-between">
                        <span>+ {extra.quantity}x {extra.name}</span>
                        <span>{extra.price * extra.quantity} {getCurrency()}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex justify-between items-center mt-1 pt-2 border-t border-stone-200">
                  <div className="text-amber-900 font-bold">{(item.price + extrasTotal) * item.quantity} {getCurrency()}</div>
                  <div className="flex items-center gap-2 bg-white rounded-lg border border-stone-200 px-1 py-1">
                    <button onClick={() => updateQuantity(item.cartId, -1)} className="p-1 text-stone-600 hover:bg-stone-100 rounded-md">
                      <Minus size={14} />
                    </button>
                    <span className="w-6 text-center font-bold text-sm">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.cartId, 1)} className="p-1 text-stone-600 hover:bg-stone-100 rounded-md">
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-stone-100 border-t border-stone-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <span className="text-lg text-stone-600 font-medium">Total</span>
            <span className="text-3xl font-bold text-stone-900">{cartTotal} {getCurrency()}</span>
          </div>
          <div className="flex gap-3">
            {!isTakeAway && (
              <button
                onClick={handleHoldOrder}
                disabled={cart.length === 0 || isSubmitting}
                className="flex-1 py-4 text-stone-700 bg-stone-200 hover:bg-stone-300 disabled:bg-stone-100 disabled:text-stone-400 disabled:cursor-not-allowed rounded-xl font-bold transition-all text-lg shadow-sm border border-stone-300/50 cursor-pointer"
              >
                {isSubmitting ? 'Saving...' : 'Hold Order'}
              </button>
            )}
            <button
              onClick={() => setShowPayment(true)}
              disabled={cart.length === 0}
              className="flex-1 bg-amber-800 hover:bg-amber-900 disabled:bg-stone-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-lg transition-all text-lg cursor-pointer"
            >
              Checkout
            </button>
          </div>
        </div>
      </div>

      {selectedItem && selectedSize && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-full">
            <div className="p-6 border-b border-stone-100">
              <h3 className="text-2xl font-bold text-stone-900">{selectedItem.name}</h3>
            </div>
            <div className="p-6 overflow-y-auto space-y-8">
              <div>
                <h4 className="text-sm font-bold text-stone-500 uppercase tracking-wider mb-4">Choose Size</h4>
                <div className="grid grid-cols-2 gap-3">
                  {selectedItem.sizes.map(size => (
                    <button
                      key={size.menuItemId}
                      onClick={() => chooseSize(size)}
                      className={`flex flex-col p-4 border-2 rounded-xl transition-colors text-left ${
                        selectedSize.menuItemId === size.menuItemId ? 'border-amber-800 bg-amber-50' : 'border-stone-200 hover:border-amber-200'
                      }`}
                    >
                      <span className="font-bold text-lg text-stone-800">{size.name}</span>
                      <span className="font-semibold text-amber-700">{size.price} {getCurrency()}</span>
                    </button>
                  ))}
                </div>
              </div>

              {selectedExtras.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-stone-500 uppercase tracking-wider mb-4">Extras</h4>
                  <div className="space-y-3">
                    {selectedExtras.map(extra => (
                      <div key={extra.id} className="flex items-center justify-between p-4 bg-stone-50 rounded-xl border border-stone-200">
                        <div>
                          <div className="font-semibold text-stone-900">{extra.name}</div>
                          <div className="text-sm text-stone-500">+{extra.price} {getCurrency()}</div>
                        </div>
                        <div className="flex items-center gap-3 bg-white rounded-lg border border-stone-200 p-1 shadow-sm">
                          <button onClick={() => updateExtra(extra.id, -1)} className="p-2 text-stone-600 hover:bg-stone-100 rounded-md">
                            <Minus size={18} />
                          </button>
                          <span className="w-6 text-center font-bold text-lg">{extra.quantity}</span>
                          <button onClick={() => updateExtra(extra.id, 1)} className="p-2 text-stone-600 hover:bg-stone-100 rounded-md">
                            <Plus size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-stone-100 bg-stone-50 flex gap-4 rounded-b-3xl">
              <button onClick={() => setSelectedItem(null)} className="flex-1 py-4 text-stone-600 bg-stone-200 hover:bg-stone-300 rounded-xl font-bold transition-colors text-lg">
                Cancel
              </button>
              <button onClick={addSelectedToCart} className="flex-1 py-4 text-white bg-amber-800 hover:bg-amber-900 rounded-xl font-bold transition-colors text-lg">
                Add to Order
              </button>
            </div>
          </div>
        </div>
      )}

      {showPayment && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl">
            <div className="p-8">
              <h3 className="text-2xl font-bold text-stone-900 mb-6">Payment Checkout</h3>
              <div className="bg-amber-50 rounded-2xl p-6 mb-8 border border-amber-100 flex justify-between items-center">
                <span className="font-bold text-lg text-amber-900">Final Total</span>
                <span className="text-4xl font-black text-amber-900">{cartTotal.toFixed(2)} {getCurrency()}</span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <button onClick={() => setPaymentMethod('cash')} className={`flex flex-col items-center justify-center gap-3 p-6 border-2 rounded-2xl transition-all ${paymentMethod === 'cash' ? 'border-amber-700 bg-amber-50' : 'border-stone-200 hover:border-amber-700'}`}>
                  <Banknote size={40} className="text-amber-700" />
                  <span className="font-bold text-stone-800 text-lg">Cash</span>
                </button>
                <button onClick={() => setPaymentMethod('card')} className={`flex flex-col items-center justify-center gap-3 p-6 border-2 rounded-2xl transition-all ${paymentMethod === 'card' ? 'border-amber-700 bg-amber-50' : 'border-stone-200 hover:border-amber-700'}`}>
                  <CreditCard size={40} className="text-amber-700" />
                  <span className="font-bold text-stone-800 text-lg">Card</span>
                </button>
              </div>

              {paymentMethod === 'cash' && (
                <div className="mb-6">
                  <label className="text-stone-700 font-bold text-lg">Amount Paid</label>
                  <input
                    type="number"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    placeholder="0.00"
                    className="mt-3 w-full text-4xl p-4 border-2 border-stone-200 rounded-xl focus:border-amber-600 focus:outline-none focus:ring-4 focus:ring-amber-600/20 transition-all font-bold text-stone-900"
                    autoFocus
                  />
                  {Number(amountPaid || 0) >= cartTotal && (
                    <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-4 flex justify-between items-center">
                      <span className="text-green-800 font-bold">Change</span>
                      <span className="text-green-700 font-black text-2xl">{(Number(amountPaid || 0) - cartTotal).toFixed(2)} {getCurrency()}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => setShowPayment(false)} className="flex-1 py-4 text-stone-600 bg-stone-200 hover:bg-stone-300 rounded-xl font-bold transition-colors text-lg">
                  Cancel
                </button>
                <button
                  onClick={() => completePayment(paymentMethod)}
                  disabled={isSubmitting || (paymentMethod === 'cash' && Number(amountPaid || 0) < cartTotal)}
                  className="flex-1 bg-amber-700 hover:bg-amber-800 disabled:bg-stone-300 disabled:text-stone-500 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-lg transition-all text-lg"
                >
                  {isSubmitting ? 'Sending...' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
