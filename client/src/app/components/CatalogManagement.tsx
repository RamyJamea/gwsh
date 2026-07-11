import React, { useEffect, useMemo, useState } from 'react';
import { 
  Image as ImageIcon, 
  Plus, 
  RefreshCw, 
  Trash2, 
  Edit2, 
  Search, 
  Layers, 
  UploadCloud, 
  Loader2, 
  Check, 
  X, 
  Save 
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  catalogApi, 
  uploadApi, 
  CategoryResponse, 
  ProductResponse, 
  SizeResponse, 
  ExtraResponse 
} from '../api-client';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';

type TabType = 'products' | 'categories' | 'sizes' | 'extras';

export function CatalogManagement() {
  const [activeTab, setActiveTab] = useState<TabType>('products');
  const [isLoading, setIsLoading] = useState(true);

  // Data states
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [sizes, setSizes] = useState<SizeResponse[]>([]);
  const [extras, setExtras] = useState<ExtraResponse[]>([]);

  // Search and filter states
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('all');

  // Product Create/Edit states
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isEditProductOpen, setIsEditProductOpen] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [newProduct, setNewProduct] = useState({
    name: '',
    category_id: '',
    image_url: '',
  });

  const [editingProduct, setEditingProduct] = useState<ProductResponse | null>(null);
  const [editProductForm, setEditProductForm] = useState({
    name: '',
    category_id: '',
    image_url: '',
  });

  // Category inline edit states
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');

  // Size inline edit states
  const [newSizeName, setNewSizeName] = useState('');
  const [editingSizeId, setEditingSizeId] = useState<number | null>(null);
  const [editingSizeName, setEditingSizeName] = useState('');

  // Extra inline edit states
  const [newExtraName, setNewExtraName] = useState('');
  const [editingExtraId, setEditingExtraId] = useState<number | null>(null);
  const [editingExtraName, setEditingExtraName] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [categoryRows, productRows, sizeRows, extraRows] = await Promise.all([
        catalogApi.categories(),
        catalogApi.products(),
        catalogApi.sizes(),
        catalogApi.extras().catch(() => []), // Safeguard in case extras endpoint fails or returns empty
      ]);
      setCategories(categoryRows);
      setProducts(productRows);
      setSizes(sizeRows);
      setExtras(extraRows);

      if (categoryRows.length > 0) {
        setNewProduct(prev => ({ ...prev, category_id: String(categoryRows[0].id) }));
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to load catalog data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const categoryMap = useMemo(() => new Map(categories.map(c => [c.id, c.name])), [categories]);

  // Image Upload helper
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be smaller than 5MB');
      return;
    }

    setUploadingImage(true);
    try {
      const response = await uploadApi.image(file);
      if (isEdit) {
        setEditProductForm(prev => ({ ...prev, image_url: response.url }));
      } else {
        setNewProduct(prev => ({ ...prev, image_url: response.url }));
      }
      toast.success('Image uploaded successfully');
    } catch (err: any) {
      toast.error(err.message || 'Image upload failed');
    } finally {
      setUploadingImage(false);
    }
  };

  // ----- Product CRUD -----
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(productSearch.toLowerCase());
      const matchesCategory = productCategoryFilter === 'all' || String(product.category_id) === productCategoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [products, productSearch, productCategoryFilter]);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name.trim() || !newProduct.category_id) {
      toast.error('Please enter product name and choose a category');
      return;
    }

    try {
      const created = await catalogApi.createProduct({
        name: newProduct.name.trim(),
        category_id: Number(newProduct.category_id),
        image_url: newProduct.image_url.trim() || null,
      });
      setProducts(prev => [...prev, created]);
      setNewProduct(prev => ({
        ...prev,
        name: '',
        image_url: '',
      }));
      setIsAddProductOpen(false);
      toast.success('Product created successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to create product');
    }
  };

  const handleStartEditProduct = (product: ProductResponse) => {
    setEditingProduct(product);
    setEditProductForm({
      name: product.name,
      category_id: String(product.category_id || ''),
      image_url: product.image_url || '',
    });
    setIsEditProductOpen(true);
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    if (!editProductForm.name.trim() || !editProductForm.category_id) {
      toast.error('Please fill name and category');
      return;
    }

    try {
      const updated = await catalogApi.updateProduct(editingProduct.id, {
        name: editProductForm.name.trim(),
        category_id: Number(editProductForm.category_id),
        image_url: editProductForm.image_url.trim() || null,
      });

      setProducts(prev => prev.map(p => p.id === editingProduct.id ? updated : p));
      setIsEditProductOpen(false);
      setEditingProduct(null);
      toast.success('Product updated successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update product');
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!window.confirm('WARNING: Deleting this product will remove it from all branch menus. Are you sure you want to delete this product?')) {
      return;
    }

    try {
      await catalogApi.deleteProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
      toast.success('Product deleted successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete product');
    }
  };

  // ----- Category CRUD -----
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    try {
      const created = await catalogApi.createCategory({ name: newCategoryName.trim() });
      setCategories(prev => [...prev, created]);
      setNewCategoryName('');
      toast.success('Category created successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to create category');
    }
  };

  const handleUpdateCategory = async (id: number) => {
    if (!editingCategoryName.trim()) return;

    try {
      const updated = await catalogApi.updateCategory(id, { name: editingCategoryName.trim() });
      setCategories(prev => prev.map(c => c.id === id ? updated : c));
      setEditingCategoryId(null);
      setEditingCategoryName('');
      toast.success('Category updated successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update category');
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!window.confirm('CRITICAL WARNING: Deleting this category will delete ALL products inside it, and cascade to delete all associated branch menu items. Are you sure you want to delete this category?')) {
      return;
    }

    try {
      await catalogApi.deleteCategory(id);
      setCategories(prev => prev.filter(c => c.id !== id));
      // Cascade update products local state
      setProducts(prev => prev.filter(p => p.category_id !== id));
      toast.success('Category and all its products deleted successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete category');
    }
  };

  // ----- Size CRUD -----
  const handleCreateSize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSizeName.trim()) return;

    try {
      const created = await catalogApi.createSize({ name: newSizeName.trim() });
      setSizes(prev => [...prev, created]);
      setNewSizeName('');
      toast.success('Size created successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to create size');
    }
  };

  const handleUpdateSize = async (id: number) => {
    if (!editingSizeName.trim()) return;

    try {
      const updated = await catalogApi.updateSize(id, { name: editingSizeName.trim() });
      setSizes(prev => prev.map(s => s.id === id ? updated : s));
      setEditingSizeId(null);
      setEditingSizeName('');
      toast.success('Size updated successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update size');
    }
  };

  const handleDeleteSize = async (id: number) => {
    if (!window.confirm('WARNING: Deleting this size will cascade to delete all branch menu items mapped to this size. Are you sure you want to delete this size?')) {
      return;
    }

    try {
      await catalogApi.deleteSize(id);
      setSizes(prev => prev.filter(s => s.id !== id));
      toast.success('Size deleted successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete size');
    }
  };

  // ----- Extra CRUD -----
  const handleCreateExtra = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExtraName.trim()) return;

    try {
      const created = await catalogApi.createExtra({ name: newExtraName.trim() });
      setExtras(prev => [...prev, created]);
      setNewExtraName('');
      toast.success('Extra created successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to create extra');
    }
  };

  const handleUpdateExtra = async (id: number) => {
    if (!editingExtraName.trim()) return;

    try {
      const updated = await catalogApi.updateExtra(id, { name: editingExtraName.trim() });
      setExtras(prev => prev.map(ex => ex.id === id ? updated : ex));
      setEditingExtraId(null);
      setEditingExtraName('');
      toast.success('Extra updated successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update extra');
    }
  };

  const handleDeleteExtra = async (id: number) => {
    if (!window.confirm('WARNING: Deleting this extra will remove it from all branch menu items. Are you sure you want to delete this extra?')) {
      return;
    }

    try {
      await catalogApi.deleteExtra(id);
      setExtras(prev => prev.filter(ex => ex.id !== id));
      toast.success('Extra deleted successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete extra');
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <h1 className="text-3xl font-bold text-stone-900 flex items-center gap-3">
            <Layers className="text-amber-800" />
            Catalog Management
          </h1>
          <p className="text-stone-500 mt-1">Manage global Products, Categories, Sizes, and Extras for the menu catalog.</p>
        </div>
        <Button onClick={loadData} variant="outline" className="flex items-center gap-2 font-semibold border-stone-200">
          <RefreshCw size={16} />
          Sync Data
        </Button>
      </div>

      {/* Tabs Selector */}
      <div className="flex gap-2 p-1 bg-stone-100 rounded-xl max-w-lg">
        {(['products', 'categories', 'sizes', 'extras'] as TabType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 px-3 text-sm font-semibold rounded-lg capitalize transition-all ${
              activeTab === tab 
                ? 'bg-amber-700 text-white shadow-sm' 
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="py-20 flex flex-col items-center justify-center gap-4 text-stone-500">
          <Loader2 className="animate-spin text-amber-800" size={36} />
          <span className="font-medium">Loading catalog data...</span>
        </div>
      )}

      {/* Tab Content */}
      {!isLoading && (
        <div className="space-y-6">
          
          {/* ================= PRODUCTS TAB ================= */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              {/* Product Filters & Add Button */}
              <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center bg-white p-4 border border-stone-200 rounded-2xl shadow-sm">
                <div className="flex flex-1 flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400" size={18} />
                    <Input 
                      placeholder="Search products..." 
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <select
                    value={productCategoryFilter}
                    onChange={(e) => setProductCategoryFilter(e.target.value)}
                    className="px-4 py-2 border border-stone-200 rounded-xl bg-white text-stone-800 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-amber-700"
                  >
                    <option value="all">All Categories</option>
                    {categories.map(c => (
                      <option key={c.id} value={String(c.id)}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <Button onClick={() => setIsAddProductOpen(true)} className="bg-amber-700 hover:bg-amber-800 text-white gap-2 font-semibold">
                  <Plus size={18} />
                  Add Product
                </Button>
              </div>

              {/* Products List Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredProducts.map(product => (
                  <div key={product.id} className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                    <div className="aspect-square bg-stone-50 relative flex items-center justify-center border-b border-stone-100 overflow-hidden">
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-stone-300">
                          <ImageIcon size={48} />
                          <span className="text-xs text-stone-400 font-medium">No Image</span>
                        </div>
                      )}
                      <div className="absolute top-3 right-3 bg-stone-900/70 backdrop-blur-xs text-white text-xs px-2.5 py-1 rounded-full font-semibold">
                        {categoryMap.get(product.category_id || 0) || 'Uncategorized'}
                      </div>
                    </div>
                    <div className="p-5 flex flex-col gap-4 flex-1 justify-between">
                      <div>
                        <h3 className="font-bold text-stone-900 text-lg leading-snug">{product.name}</h3>
                        <p className="text-xs text-stone-400 mt-1">ID: #{product.id}</p>
                      </div>
                      <div className="flex gap-2 pt-2 border-t border-stone-100">
                        <Button 
                          onClick={() => handleStartEditProduct(product)}
                          variant="outline" 
                          size="sm" 
                          className="flex-1 gap-1.5 font-semibold text-stone-700"
                        >
                          <Edit2 size={14} />
                          Edit
                        </Button>
                        <Button 
                          onClick={() => handleDeleteProduct(product.id)}
                          variant="ghost" 
                          size="sm" 
                          className="text-red-500 hover:bg-red-50 hover:text-red-600 gap-1.5 font-semibold"
                        >
                          <Trash2 size={14} />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                {filteredProducts.length === 0 && (
                  <div className="col-span-full py-12 text-center text-stone-500 bg-white border border-stone-200 rounded-2xl">
                    No products found. Add a product to get started.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================= CATEGORIES TAB ================= */}
          {activeTab === 'categories' && (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-8 items-start">
              {/* Category creation card */}
              <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm space-y-4">
                <h2 className="font-bold text-stone-800 text-lg">Add New Category</h2>
                <form onSubmit={handleCreateCategory} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="cat-name">Category Name</Label>
                    <Input 
                      id="cat-name"
                      placeholder="e.g. Hot Drinks" 
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                    />
                  </div>
                  <Button type="submit" className="w-full bg-amber-700 hover:bg-amber-800 text-white font-semibold">
                    <Plus size={16} className="mr-1" /> Create Category
                  </Button>
                </form>
              </div>

              {/* Categories Table */}
              <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-stone-50 border-b border-stone-200">
                        <th className="px-6 py-4 font-semibold text-stone-700">ID</th>
                        <th className="px-6 py-4 font-semibold text-stone-700">Name</th>
                        <th className="px-6 py-4 font-semibold text-stone-700 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200">
                      {categories.map((cat) => (
                        <tr key={cat.id} className="hover:bg-stone-50/50 transition-colors">
                          <td className="px-6 py-4 text-stone-500 font-medium">#{cat.id}</td>
                          <td className="px-6 py-4">
                            {editingCategoryId === cat.id ? (
                              <div className="flex items-center gap-2 max-w-xs">
                                <Input 
                                  value={editingCategoryName}
                                  onChange={(e) => setEditingCategoryName(e.target.value)}
                                  className="h-8 py-1"
                                />
                                <button 
                                  onClick={() => handleUpdateCategory(cat.id)}
                                  className="p-1 text-green-600 hover:bg-green-50 rounded"
                                >
                                  <Check size={16} />
                                </button>
                                <button 
                                  onClick={() => setEditingCategoryId(null)}
                                  className="p-1 text-stone-400 hover:bg-stone-100 rounded"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            ) : (
                              <span className="font-bold text-stone-900">{cat.name}</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right space-x-2">
                            {editingCategoryId !== cat.id && (
                              <>
                                <button 
                                  onClick={() => {
                                    setEditingCategoryId(cat.id);
                                    setEditingCategoryName(cat.name);
                                  }}
                                  className="p-1.5 text-stone-500 hover:bg-stone-100 rounded-lg transition-colors inline-flex"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button 
                                  onClick={() => handleDeleteCategory(cat.id)}
                                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors inline-flex"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                      {categories.length === 0 && (
                        <tr>
                          <td colSpan={3} className="px-6 py-8 text-center text-stone-400">No categories found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================= SIZES TAB ================= */}
          {activeTab === 'sizes' && (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-8 items-start">
              {/* Size creation card */}
              <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm space-y-4">
                <h2 className="font-bold text-stone-800 text-lg">Add New Size</h2>
                <form onSubmit={handleCreateSize} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="size-name">Size Name</Label>
                    <Input 
                      id="size-name"
                      placeholder="e.g. Regular, Large" 
                      value={newSizeName}
                      onChange={(e) => setNewSizeName(e.target.value)}
                    />
                  </div>
                  <Button type="submit" className="w-full bg-amber-700 hover:bg-amber-800 text-white font-semibold">
                    <Plus size={16} className="mr-1" /> Create Size
                  </Button>
                </form>
              </div>

              {/* Sizes Table */}
              <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-stone-50 border-b border-stone-200">
                        <th className="px-6 py-4 font-semibold text-stone-700">ID</th>
                        <th className="px-6 py-4 font-semibold text-stone-700">Size Name</th>
                        <th className="px-6 py-4 font-semibold text-stone-700 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200">
                      {sizes.map((sz) => (
                        <tr key={sz.id} className="hover:bg-stone-50/50 transition-colors">
                          <td className="px-6 py-4 text-stone-500 font-medium">#{sz.id}</td>
                          <td className="px-6 py-4">
                            {editingSizeId === sz.id ? (
                              <div className="flex items-center gap-2 max-w-xs">
                                <Input 
                                  value={editingSizeName}
                                  onChange={(e) => setEditingSizeName(e.target.value)}
                                  className="h-8 py-1"
                                />
                                <button 
                                  onClick={() => handleUpdateSize(sz.id)}
                                  className="p-1 text-green-600 hover:bg-green-50 rounded"
                                >
                                  <Check size={16} />
                                </button>
                                <button 
                                  onClick={() => setEditingSizeId(null)}
                                  className="p-1 text-stone-400 hover:bg-stone-100 rounded"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            ) : (
                              <span className="font-bold text-stone-900">{sz.name}</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right space-x-2">
                            {editingSizeId !== sz.id && (
                              <>
                                <button 
                                  onClick={() => {
                                    setEditingSizeId(sz.id);
                                    setEditingSizeName(sz.name);
                                  }}
                                  className="p-1.5 text-stone-500 hover:bg-stone-100 rounded-lg transition-colors inline-flex"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button 
                                  onClick={() => handleDeleteSize(sz.id)}
                                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors inline-flex"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                      {sizes.length === 0 && (
                        <tr>
                          <td colSpan={3} className="px-6 py-8 text-center text-stone-400">No sizes found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================= EXTRAS TAB ================= */}
          {activeTab === 'extras' && (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-8 items-start">
              {/* Extra creation card */}
              <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm space-y-4">
                <h2 className="font-bold text-stone-800 text-lg">Add New Extra Option</h2>
                <form onSubmit={handleCreateExtra} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="extra-name">Extra Name</Label>
                    <Input 
                      id="extra-name"
                      placeholder="e.g. Milk, Extra Cheese" 
                      value={newExtraName}
                      onChange={(e) => setNewExtraName(e.target.value)}
                    />
                  </div>
                  <Button type="submit" className="w-full bg-amber-700 hover:bg-amber-800 text-white font-semibold">
                    <Plus size={16} className="mr-1" /> Create Extra
                  </Button>
                </form>
              </div>

              {/* Extras Table */}
              <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-stone-50 border-b border-stone-200">
                        <th className="px-6 py-4 font-semibold text-stone-700">ID</th>
                        <th className="px-6 py-4 font-semibold text-stone-700">Extra Name</th>
                        <th className="px-6 py-4 font-semibold text-stone-700 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200">
                      {extras.map((ex) => (
                        <tr key={ex.id} className="hover:bg-stone-50/50 transition-colors">
                          <td className="px-6 py-4 text-stone-500 font-medium">#{ex.id}</td>
                          <td className="px-6 py-4">
                            {editingExtraId === ex.id ? (
                              <div className="flex items-center gap-2 max-w-xs">
                                <Input 
                                  value={editingExtraName}
                                  onChange={(e) => setEditingExtraName(e.target.value)}
                                  className="h-8 py-1"
                                />
                                <button 
                                  onClick={() => handleUpdateExtra(ex.id)}
                                  className="p-1 text-green-600 hover:bg-green-50 rounded"
                                >
                                  <Check size={16} />
                                </button>
                                <button 
                                  onClick={() => setEditingExtraId(null)}
                                  className="p-1 text-stone-400 hover:bg-stone-100 rounded"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            ) : (
                              <span className="font-bold text-stone-900">{ex.name}</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right space-x-2">
                            {editingExtraId !== ex.id && (
                              <>
                                <button 
                                  onClick={() => {
                                    setEditingExtraId(ex.id);
                                    setEditingExtraName(ex.name);
                                  }}
                                  className="p-1.5 text-stone-500 hover:bg-stone-100 rounded-lg transition-colors inline-flex"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button 
                                  onClick={() => handleDeleteExtra(ex.id)}
                                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors inline-flex"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                      {extras.length === 0 && (
                        <tr>
                          <td colSpan={3} className="px-6 py-8 text-center text-stone-400">No extras found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ================= ADD PRODUCT DIALOG ================= */}
      <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-bold text-stone-900 text-xl">Add New Product</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateProduct} className="space-y-5 py-2">
            
            {/* Image Upload Area */}
            <div className="space-y-2">
              <Label className="text-sm font-bold text-stone-700">Product Image</Label>
              <input 
                type="file" 
                accept="image/*"
                className="hidden" 
                id="product-image-add" 
                onChange={(e) => handleImageUpload(e, false)}
              />
              <label 
                htmlFor="product-image-add" 
                className="cursor-pointer flex flex-col items-center justify-center border-2 border-dashed border-stone-200 hover:border-amber-700 rounded-2xl p-6 transition-all hover:bg-amber-50/20"
              >
                {uploadingImage ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="animate-spin text-amber-800" size={28} />
                    <span className="text-sm font-semibold text-stone-600">Uploading to server...</span>
                  </div>
                ) : newProduct.image_url ? (
                  <div className="relative group w-32 h-32 rounded-xl overflow-hidden border border-stone-200">
                    <img src={newProduct.image_url} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <UploadCloud size={20} className="text-white" />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-stone-400 hover:text-amber-800 text-center">
                    <UploadCloud size={32} />
                    <span className="text-sm font-bold text-stone-700">Upload product image</span>
                    <span className="text-xs text-stone-400">Supports PNG, JPG, WEBP</span>
                  </div>
                )}
              </label>
              {newProduct.image_url && (
                <div className="flex items-center gap-2">
                  <Input 
                    placeholder="Or enter image URL" 
                    value={newProduct.image_url}
                    onChange={(e) => setNewProduct({ ...newProduct, image_url: e.target.value })}
                    className="text-xs h-8"
                  />
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setNewProduct({ ...newProduct, image_url: '' })}
                    className="text-red-500 hover:text-red-600"
                  >
                    Clear
                  </Button>
                </div>
              )}
            </div>

            {/* Product Name */}
            <div className="space-y-1.5">
              <Label htmlFor="new-prod-name">Product Name</Label>
              <Input 
                id="new-prod-name"
                value={newProduct.name}
                onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
                placeholder="e.g. Turkish Coffee"
              />
            </div>

            {/* Product Category */}
            <div className="space-y-1.5">
              <Label htmlFor="new-prod-cat">Category</Label>
              <select 
                id="new-prod-cat"
                value={newProduct.category_id}
                onChange={e => setNewProduct({ ...newProduct, category_id: e.target.value })}
                className="w-full px-3 py-2 border border-stone-200 rounded-xl bg-stone-50 text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-700"
              >
                {categories.map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>

            <DialogFooter className="pt-4 border-t border-stone-100">
              <Button type="button" variant="outline" onClick={() => setIsAddProductOpen(false)} className="font-semibold">
                Cancel
              </Button>
              <Button type="submit" className="bg-amber-700 hover:bg-amber-800 text-white font-semibold">
                Add Product
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ================= EDIT PRODUCT DIALOG ================= */}
      <Dialog open={isEditProductOpen} onOpenChange={setIsEditProductOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-bold text-stone-900 text-xl">Edit Product</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateProduct} className="space-y-5 py-2">
            
            {/* Image Upload Area for Edit */}
            <div className="space-y-2">
              <Label className="text-sm font-bold text-stone-700">Product Image</Label>
              <input 
                type="file" 
                accept="image/*"
                className="hidden" 
                id="product-image-edit" 
                onChange={(e) => handleImageUpload(e, true)}
              />
              <label 
                htmlFor="product-image-edit" 
                className="cursor-pointer flex flex-col items-center justify-center border-2 border-dashed border-stone-200 hover:border-amber-700 rounded-2xl p-6 transition-all hover:bg-amber-50/20"
              >
                {uploadingImage ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="animate-spin text-amber-800" size={28} />
                    <span className="text-sm font-semibold text-stone-600">Uploading to server...</span>
                  </div>
                ) : editProductForm.image_url ? (
                  <div className="relative group w-32 h-32 rounded-xl overflow-hidden border border-stone-200">
                    <img src={editProductForm.image_url} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <UploadCloud size={20} className="text-white" />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-stone-400 hover:text-amber-800 text-center">
                    <UploadCloud size={32} />
                    <span className="text-sm font-bold text-stone-700">Upload new image</span>
                    <span className="text-xs text-stone-400">Supports PNG, JPG, WEBP</span>
                  </div>
                )}
              </label>
              <div className="flex items-center gap-2">
                <Input 
                  placeholder="Or enter image URL" 
                  value={editProductForm.image_url}
                  onChange={(e) => setEditProductForm({ ...editProductForm, image_url: e.target.value })}
                  className="text-xs h-8"
                />
                {editProductForm.image_url && (
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setEditProductForm({ ...editProductForm, image_url: '' })}
                    className="text-red-500 hover:text-red-600"
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>

            {/* Product Name */}
            <div className="space-y-1.5">
              <Label htmlFor="edit-prod-name">Product Name</Label>
              <Input 
                id="edit-prod-name"
                value={editProductForm.name}
                onChange={e => setEditProductForm({ ...editProductForm, name: e.target.value })}
              />
            </div>

            {/* Product Category */}
            <div className="space-y-1.5">
              <Label htmlFor="edit-prod-cat">Category</Label>
              <select 
                id="edit-prod-cat"
                value={editProductForm.category_id}
                onChange={e => setEditProductForm({ ...editProductForm, category_id: e.target.value })}
                className="w-full px-3 py-2 border border-stone-200 rounded-xl bg-stone-50 text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-700"
              >
                {categories.map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>

            <DialogFooter className="pt-4 border-t border-stone-100">
              <Button type="button" variant="outline" onClick={() => setIsEditProductOpen(false)} className="font-semibold">
                Cancel
              </Button>
              <Button type="submit" className="bg-amber-700 hover:bg-amber-800 text-white font-semibold">
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
