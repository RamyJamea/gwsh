import React, { useEffect, useMemo, useState } from 'react';
import { Image as ImageIcon, Plus, RefreshCw, Trash2, Utensils, Settings, Coffee } from 'lucide-react';
import { toast } from 'sonner';
import { branchApi, BranchRead, catalogApi, CategoryResponse, MenuItemRead, menuApi, ProductResponse, SizeResponse, ExtraResponse, MenuItemExtraRead } from '../api-client';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { getCurrency } from '../currency';

export function MenuManagement() {
  const [branches, setBranches] = useState<BranchRead[]>([]);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [sizes, setSizes] = useState<SizeResponse[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItemRead[]>([]);
  const [branchId, setBranchId] = useState(Number(localStorage.getItem('activeBranchId')) || 1);
  const [isLoading, setIsLoading] = useState(true);
  const [newItem, setNewItem] = useState({ product_id: '', size_id: '', price: '' });

  // Extras management states
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItemRead | null>(null);
  const [isExtrasDialogOpen, setIsExtrasDialogOpen] = useState(false);
  const [menuItemExtras, setMenuItemExtras] = useState<MenuItemExtraRead[]>([]);
  const [catalogExtras, setCatalogExtras] = useState<ExtraResponse[]>([]);
  const [selectedExtraId, setSelectedExtraId] = useState('');
  const [extraPrice, setExtraPrice] = useState('');
  const [isExtrasLoading, setIsExtrasLoading] = useState(false);

  const categoryById = useMemo(() => new Map(categories.map(category => [category.id, category.name])), [categories]);
  const productById = useMemo(() => new Map(products.map(product => [product.id, product])), [products]);
  const sizeById = useMemo(() => new Map(sizes.map(size => [size.id, size.name])), [sizes]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [branchRows, categoryRows, productRows, sizeRows, menuRows, catalogExtraRows] = await Promise.all([
        branchApi.list().catch(() => []),
        catalogApi.categories(),
        catalogApi.products(),
        catalogApi.sizes(),
        menuApi.listByBranch(branchId),
        catalogApi.extras().catch(() => []),
      ]);
      setBranches(branchRows);
      setCategories(categoryRows);
      setProducts(productRows);
      setSizes(sizeRows);
      setMenuItems(menuRows);
      setCatalogExtras(catalogExtraRows);
      setNewItem(prev => ({
        ...prev,
        product_id: prev.product_id || String(productRows[0]?.id || ''),
        size_id: prev.size_id || String(sizeRows[0]?.id || ''),
      }));
    } catch (err: any) {
      toast.error(err.message || 'Failed to load menu');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [branchId]);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newItem.product_id || !newItem.size_id || !newItem.price) {
      toast.error('Choose product, size, and price');
      return;
    }
    try {
      const created = await menuApi.create({
        branch_id: branchId,
        product_id: Number(newItem.product_id),
        size_id: Number(newItem.size_id),
        price: Number(newItem.price),
        extras: [],
      });
      setMenuItems(prev => [...prev, created]);
      setNewItem(prev => ({ ...prev, price: '' }));
      toast.success('Menu item added');
    } catch (err: any) {
      toast.error(err.message || 'Failed to add menu item');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this menu item?')) return;
    try {
      await menuApi.delete(id);
      setMenuItems(prev => prev.filter(item => item.id !== id));
      toast.success('Menu item deleted');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete menu item');
    }
  };

  const handleOpenExtras = async (item: MenuItemRead) => {
    setSelectedMenuItem(item);
    setIsExtrasDialogOpen(true);
    setIsExtrasLoading(true);
    try {
      const detailed = await menuApi.get(item.id);
      setMenuItemExtras(detailed.menu_items_extras || []);
      if (catalogExtras.length > 0) {
        setSelectedExtraId(String(catalogExtras[0].id));
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to load extras for menu item');
    } finally {
      setIsExtrasLoading(false);
    }
  };

  const handleAddExtraToItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMenuItem || !selectedExtraId || !extraPrice) {
      toast.error('Please choose an extra and input price');
      return;
    }
    const extraId = Number(selectedExtraId);
    const priceVal = Number(extraPrice);
    if (priceVal < 0) {
      toast.error('Price cannot be negative');
      return;
    }
    
    if (menuItemExtras.some(ex => ex.extra_id === extraId)) {
      toast.error('This extra is already added to the menu item');
      return;
    }

    try {
      const payloadExtras = [
        ...menuItemExtras.map(ex => ({ extra_id: ex.extra_id, price: Number(ex.price) })),
        { extra_id: extraId, price: priceVal }
      ];
      
      await menuApi.update(selectedMenuItem.id, { extras: payloadExtras });
      
      const detailed = await menuApi.get(selectedMenuItem.id);
      setMenuItemExtras(detailed.menu_items_extras || []);
      setExtraPrice('');
      toast.success('Extra added successfully');
      
      // Update menuItems list so it reflects the change in the UI if needed
      setMenuItems(prev => prev.map(m => m.id === selectedMenuItem.id ? { ...m, menu_items_extras: detailed.menu_items_extras } : m));
    } catch (err: any) {
      toast.error(err.message || 'Failed to add extra');
    }
  };

  const handleDeleteExtraFromItem = async (extraId: number) => {
    if (!selectedMenuItem) return;
    try {
      const payloadExtras = menuItemExtras
        .filter(ex => ex.extra_id !== extraId)
        .map(ex => ({ extra_id: ex.extra_id, price: Number(ex.price) }));
      
      await menuApi.update(selectedMenuItem.id, { extras: payloadExtras });
      
      const detailed = await menuApi.get(selectedMenuItem.id);
      setMenuItemExtras(detailed.menu_items_extras || []);
      toast.success('Extra removed successfully');

      // Update menuItems list
      setMenuItems(prev => prev.map(m => m.id === selectedMenuItem.id ? { ...m, menu_items_extras: detailed.menu_items_extras } : m));
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove extra');
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-stone-900 flex items-center gap-3">
            <Utensils className="text-amber-800" />
            Menu Management
          </h1>
          <p className="text-stone-500 mt-1">Manage backend menu rows by branch, product, size, and price.</p>
        </div>
        <div className="flex gap-3">
          <select
            value={branchId}
            onChange={(event) => setBranchId(Number(event.target.value))}
            className="px-4 py-2 border border-stone-200 rounded-xl bg-white text-stone-800 font-medium"
          >
            {branches.length === 0 && <option value={branchId}>Branch #{branchId}</option>}
            {branches.map(branch => (
              <option key={branch.id} value={branch.id}>{branch.name}</option>
            ))}
          </select>
          <button onClick={loadData} className="inline-flex items-center gap-2 px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-semibold transition-colors">
            <RefreshCw size={18} />
            Refresh
          </button>
        </div>
      </div>

      <form onSubmit={handleCreate} className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm grid grid-cols-1 md:grid-cols-[1fr_1fr_160px_auto] gap-3 items-end">
        <div>
          <label className="block text-sm font-semibold text-stone-700 mb-2">Product</label>
          <select value={newItem.product_id} onChange={e => setNewItem({ ...newItem, product_id: e.target.value })} className="w-full px-4 py-2 border border-stone-200 rounded-xl bg-stone-50">
            {products.map(product => (
              <option key={product.id} value={product.id}>{product.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-stone-700 mb-2">Size</label>
          <select value={newItem.size_id} onChange={e => setNewItem({ ...newItem, size_id: e.target.value })} className="w-full px-4 py-2 border border-stone-200 rounded-xl bg-stone-50">
            {sizes.map(size => (
              <option key={size.id} value={size.id}>{size.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-stone-700 mb-2">Price</label>
          <input type="number" min="0" step="0.01" value={newItem.price} onChange={e => setNewItem({ ...newItem, price: e.target.value })} className="w-full px-4 py-2 border border-stone-200 rounded-xl bg-stone-50" />
        </div>
        <button type="submit" className="inline-flex items-center justify-center gap-2 bg-amber-800 hover:bg-amber-900 text-white px-5 py-2 rounded-xl font-semibold transition-colors">
          <Plus size={18} />
          Add
        </button>
      </form>

      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200">
                <th className="px-6 py-4 font-semibold text-stone-700">Product</th>
                <th className="px-6 py-4 font-semibold text-stone-700">Category</th>
                <th className="px-6 py-4 font-semibold text-stone-700">Size</th>
                <th className="px-6 py-4 font-semibold text-stone-700">Extras</th>
                <th className="px-6 py-4 font-semibold text-stone-700 text-right">Price</th>
                <th className="px-6 py-4 font-semibold text-stone-700 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {isLoading && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-stone-500">Loading menu...</td>
                </tr>
              )}
              {!isLoading && menuItems.map(item => {
                const product = item.product || productById.get(item.product_id);
                return (
                  <tr key={item.id} className="hover:bg-stone-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-stone-100 border border-stone-200 flex-shrink-0">
                          {product?.image_url ? (
                            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-stone-300">
                              <ImageIcon size={22} />
                            </div>
                          )}
                        </div>
                        <span className="font-bold text-stone-900">{product?.name || `Product #${item.product_id}`}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-stone-600">{categoryById.get(product?.category_id || 0) || 'Uncategorized'}</td>
                    <td className="px-6 py-4 text-stone-700">{item.size?.name || sizeById.get(item.size_id) || `Size #${item.size_id}`}</td>
                    <td className="px-6 py-4 text-stone-700">
                      <div className="flex items-center gap-2 flex-wrap">
                        {item.menu_items_extras && item.menu_items_extras.length > 0 ? (
                          item.menu_items_extras.map(ex => (
                            <span key={ex.id} className="inline-flex text-xs bg-amber-50 text-amber-800 border border-amber-200/50 px-2 py-0.5 rounded-full font-medium">
                              {ex.extra?.name || `Extra #${ex.extra_id}`} (+{Number(ex.price).toFixed(2)} {getCurrency()})
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-stone-400 italic">No extras</span>
                        )}
                        <button 
                          onClick={() => handleOpenExtras(item)} 
                          className="inline-flex items-center gap-1 text-xs text-amber-700 hover:text-amber-800 font-bold bg-amber-50 hover:bg-amber-100/80 px-2 py-1 rounded-md border border-amber-200/50 cursor-pointer transition-colors"
                        >
                          <Settings size={12} />
                          Manage
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-amber-900">{Number(item.price).toFixed(2)} {getCurrency()}</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleDelete(item.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {!isLoading && menuItems.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-stone-500">No menu items found for this branch.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= MANAGE EXTRAS DIALOG ================= */}
      <Dialog open={isExtrasDialogOpen} onOpenChange={setIsExtrasDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-bold text-stone-900 text-xl flex items-center gap-2">
              <Settings className="text-amber-800" size={24} />
              Manage Extras
            </DialogTitle>
            {selectedMenuItem && (
              <p className="text-xs text-stone-500 font-medium">
                Product: {selectedMenuItem.product?.name || `Product #${selectedMenuItem.product_id}`} ({selectedMenuItem.size?.name || `Size #${selectedMenuItem.size_id}`})
              </p>
            )}
          </DialogHeader>

          {isExtrasLoading ? (
            <div className="py-8 text-center text-stone-500 font-medium flex flex-col items-center gap-2">
              <span className="w-8 h-8 border-4 border-amber-800 border-t-transparent rounded-full animate-spin"></span>
              Loading extras...
            </div>
          ) : (
            <div className="space-y-6 py-2">
              {/* Add Extra Form */}
              <form onSubmit={handleAddExtraToItem} className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-3">
                <h3 className="font-bold text-stone-800 text-sm">Add Extra to Product</h3>
                <div className="grid grid-cols-2 gap-3 items-end">
                  <div className="space-y-1">
                    <Label htmlFor="dialog-extra-select" className="text-xs">Select Extra</Label>
                    <select
                      id="dialog-extra-select"
                      value={selectedExtraId}
                      onChange={e => setSelectedExtraId(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 border border-stone-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-700"
                    >
                      {catalogExtras.map(ex => (
                        <option key={ex.id} value={ex.id}>{ex.name}</option>
                      ))}
                      {catalogExtras.length === 0 && <option value="">No extras available</option>}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="dialog-extra-price" className="text-xs font-semibold text-stone-700">Price ({getCurrency()})</Label>
                    <Input
                      id="dialog-extra-price"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={extraPrice}
                      onChange={e => setExtraPrice(e.target.value)}
                      className="h-8 text-xs py-1"
                    />
                  </div>
                </div>
                <Button type="submit" disabled={!selectedExtraId || !extraPrice} className="w-full bg-amber-700 hover:bg-amber-800 text-white font-semibold text-xs h-8">
                  <Plus size={14} className="mr-1" /> Add Extra Option
                </Button>
              </form>

              {/* Extras List Table */}
              <div className="space-y-2">
                <h3 className="font-bold text-stone-800 text-sm">Active Extras</h3>
                <div className="max-h-60 overflow-y-auto border border-stone-200 rounded-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-stone-50 border-b border-stone-200">
                        <th className="px-4 py-2 font-semibold text-stone-600">Name</th>
                        <th className="px-4 py-2 font-semibold text-stone-600 text-right">Price</th>
                        <th className="px-4 py-2 font-semibold text-stone-600 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200">
                      {menuItemExtras.map(ex => (
                        <tr key={ex.id} className="hover:bg-stone-50/50">
                          <td className="px-4 py-2.5 font-bold text-stone-800">
                            {ex.extra?.name || `Extra #${ex.extra_id}`}
                          </td>
                          <td className="px-4 py-2.5 text-right font-semibold text-amber-900">
                            {Number(ex.price).toFixed(2)} {getCurrency()}
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <button
                              type="button"
                              onClick={() => handleDeleteExtraFromItem(ex.extra_id)}
                              className="p-1 text-red-500 hover:bg-red-50 rounded cursor-pointer"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {menuItemExtras.length === 0 && (
                        <tr>
                          <td colSpan={3} className="px-4 py-6 text-center text-stone-400">
                            No extras configured for this product.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="border-t border-stone-100 pt-4">
            <Button type="button" onClick={() => setIsExtrasDialogOpen(false)} className="font-semibold text-xs h-8">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
