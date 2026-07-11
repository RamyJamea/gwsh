import React, { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Store, TrendingUp, Plus, Edit2, Trash2, Loader2, RefreshCw, Coffee, Armchair } from 'lucide-react';
import { toast } from 'sonner';
import { branchApi, orderApi, tableApi, TableRead } from '../api-client';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { getCurrency } from '../currency';

type BranchMetric = {
  id: number;
  name: string;
  orders: number;
  paidOrders: number;
  revenue: number;
};

export function BranchMonitoring() {
  const [metrics, setMetrics] = useState<BranchMetric[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Branch creation / edit states
  const [isAddBranchOpen, setIsAddBranchOpen] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  
  const [isEditBranchOpen, setIsEditBranchOpen] = useState(false);
  const [editingBranchId, setEditingBranchId] = useState<number | null>(null);
  const [editingBranchName, setEditingBranchName] = useState('');

  // Manage Tables states
  const [isManageTablesOpen, setIsManageTablesOpen] = useState(false);
  const [selectedBranchForTables, setSelectedBranchForTables] = useState<{ id: number; name: string } | null>(null);
  const [branchTables, setBranchTables] = useState<TableRead[]>([]);
  const [isTablesLoading, setIsTablesLoading] = useState(false);
  const [newTableChairs, setNewTableChairs] = useState(4);

  const handleOpenManageTables = async (branchId: number, branchName: string) => {
    setSelectedBranchForTables({ id: branchId, name: branchName });
    setIsManageTablesOpen(true);
    setIsTablesLoading(true);
    try {
      const tables = await tableApi.listByBranch(branchId);
      setBranchTables(tables.sort((a, b) => a.id - b.id));
    } catch (err: any) {
      toast.error(err.message || 'Failed to load branch tables');
    } finally {
      setIsTablesLoading(false);
    }
  };

  const handleAddTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBranchForTables) return;
    if (newTableChairs <= 0) {
      toast.error('Number of chairs must be greater than 0');
      return;
    }
    try {
      const newTable = await tableApi.create({
        branch_id: selectedBranchForTables.id,
        num_chairs: newTableChairs,
        is_available: true
      });
      setBranchTables(prev => [...prev, newTable].sort((a, b) => a.id - b.id));
      toast.success(`Table ${newTable.id} added successfully`);
      setNewTableChairs(4); // reset
    } catch (err: any) {
      toast.error(err.message || 'Failed to add table');
    }
  };

  const handleDeleteTable = async (tableId: number) => {
    if (!window.confirm(`Are you sure you want to delete Table ${tableId}?`)) {
      return;
    }
    try {
      await tableApi.delete(tableId);
      setBranchTables(prev => prev.filter(t => t.id !== tableId));
      toast.success(`Table ${tableId} deleted successfully`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete table');
    }
  };

  const loadBranches = async () => {
    setIsLoading(true);
    try {
      const branches = await branchApi.list();
      const rows = await Promise.all(branches.map(async branch => {
        const orders = await orderApi.list(branch.id).catch(() => []);
        const paidOrders = orders.filter(order => order.action === 'pay');
        return {
          id: branch.id,
          name: branch.name,
          orders: orders.length,
          paidOrders: paidOrders.length,
          revenue: paidOrders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0),
        };
      }));
      setMetrics(rows);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load branches');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBranches();
  }, []);

  // Create branch handler
  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranchName.trim()) {
      toast.error('Please enter a branch name');
      return;
    }

    try {
      const created = await branchApi.create({ name: newBranchName.trim() });
      const newMetric: BranchMetric = {
        id: created.id,
        name: created.name,
        orders: 0,
        paidOrders: 0,
        revenue: 0,
      };
      setMetrics(prev => [...prev, newMetric]);
      setIsAddBranchOpen(false);
      setNewBranchName('');
      toast.success('Branch created successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to create branch');
    }
  };

  // Edit branch handlers
  const handleStartEditBranch = (id: number, currentName: string) => {
    setEditingBranchId(id);
    setEditingBranchName(currentName);
    setIsEditBranchOpen(true);
  };

  const handleUpdateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBranchId || !editingBranchName.trim()) {
      toast.error('Please enter a branch name');
      return;
    }

    try {
      const updated = await branchApi.update(editingBranchId, { name: editingBranchName.trim() });
      setMetrics(prev => prev.map(m => m.id === editingBranchId ? { ...m, name: updated.name } : m));
      setIsEditBranchOpen(false);
      setEditingBranchId(null);
      setEditingBranchName('');
      toast.success('Branch renamed successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to rename branch');
    }
  };

  // Delete branch handler
  const handleDeleteBranch = async (id: number) => {
    if (!window.confirm('WARNING: Deleting this branch will delete all associated restaurant tables, branch menu items, and historical orders. Are you sure you want to delete this branch?')) {
      return;
    }

    try {
      await branchApi.delete(id);
      setMetrics(prev => prev.filter(m => m.id !== id));
      toast.success('Branch deleted successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete branch');
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <h1 className="text-3xl font-bold text-stone-900 flex items-center gap-3">
            <Store className="text-amber-800" />
            Branch Monitoring & Management
          </h1>
          <p className="text-stone-500 mt-1">Compare live backend order performance across locations and manage branches.</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={loadBranches} variant="outline" className="flex items-center gap-2 font-semibold border-stone-200">
            <RefreshCw size={16} />
            Sync Data
          </Button>
          <Button onClick={() => setIsAddBranchOpen(true)} className="bg-amber-700 hover:bg-amber-800 text-white gap-2 font-semibold">
            <Plus size={18} />
            Add Branch
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-4 text-stone-500 bg-white rounded-2xl border border-stone-200 shadow-xs">
          <Loader2 className="animate-spin text-amber-800" size={36} />
          <span className="font-medium">Loading branch metrics...</span>
        </div>
      ) : metrics.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl shadow-sm border border-stone-200 text-center text-stone-500">
          No branches found. Click "Add Branch" to create one.
        </div>
      ) : (
        <>
          {/* Branch Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {metrics.map(branch => (
              <div key={branch.id} className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-bl-full -z-0"></div>
                
                {/* Management actions (visible on hover) */}
                <div className="absolute top-4 right-4 z-20 flex gap-1 md:opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleStartEditBranch(branch.id, branch.name)}
                    className="p-1.5 text-stone-500 hover:bg-stone-100 bg-white rounded-lg border border-stone-200 shadow-xs transition-colors inline-flex"
                    title="Rename Branch"
                  >
                    <Edit2 size={15} />
                  </button>
                  <button 
                    onClick={() => handleDeleteBranch(branch.id)}
                    className="p-1.5 text-red-500 hover:bg-red-50 bg-white rounded-lg border border-stone-200 shadow-xs transition-colors inline-flex"
                    title="Delete Branch"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                <div className="relative z-10">
                  <h2 className="text-xl font-bold text-stone-900 mb-4 flex items-center gap-2 pr-16">
                    <Store size={20} className="text-amber-700" />
                    {branch.name}
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-stone-500 mb-1">Paid Revenue</p>
                      <p className="text-2xl font-bold text-stone-900">{branch.revenue.toFixed(2)} {getCurrency()}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-stone-500 mb-1">Total Orders</p>
                      <p className="text-2xl font-bold text-stone-900">{branch.orders}</p>
                    </div>
                  </div>
                  <div className="mt-6 pt-4 border-t border-stone-100 flex justify-between items-center">
                    <div className="flex items-center gap-2 text-green-600 text-sm font-semibold">
                      <TrendingUp size={16} />
                      {branch.paidOrders} paid orders
                    </div>
                    <Button 
                      onClick={() => handleOpenManageTables(branch.id, branch.name)}
                      variant="outline" 
                      size="sm"
                      className="text-stone-700 border-stone-200 hover:bg-stone-50 flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                    >
                      <Coffee size={14} />
                      Manage Tables
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Revenue Chart */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
            <h2 className="text-lg font-bold text-stone-900 mb-6">Revenue And Order Comparison</h2>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5e4" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#78716c'}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#78716c'}} dx={-10} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                  <Bar dataKey="revenue" name={`Revenue (${getCurrency()})`} fill="#b45309" radius={[4, 4, 0, 0]} barSize={24} />
                  <Bar dataKey="orders" name="Orders Count" fill="#d6d3d1" radius={[4, 4, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {/* ================= ADD BRANCH DIALOG ================= */}
      <Dialog open={isAddBranchOpen} onOpenChange={setIsAddBranchOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-bold text-stone-900 text-xl">Add New Branch</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateBranch} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="branch-name">Branch Name</Label>
              <Input 
                id="branch-name"
                value={newBranchName}
                onChange={e => setNewBranchName(e.target.value)}
                placeholder="e.g. Heliopolis Branch"
              />
            </div>
            <DialogFooter className="pt-4 border-t border-stone-100">
              <Button type="button" variant="outline" onClick={() => setIsAddBranchOpen(false)} className="font-semibold">
                Cancel
              </Button>
              <Button type="submit" className="bg-amber-700 hover:bg-amber-800 text-white font-semibold">
                Create Branch
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ================= EDIT BRANCH DIALOG ================= */}
      <Dialog open={isEditBranchOpen} onOpenChange={setIsEditBranchOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-bold text-stone-900 text-xl">Rename Branch</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateBranch} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-branch-name">Branch Name</Label>
              <Input 
                id="edit-branch-name"
                value={editingBranchName}
                onChange={e => setEditingBranchName(e.target.value)}
              />
            </div>
            <DialogFooter className="pt-4 border-t border-stone-100">
              <Button type="button" variant="outline" onClick={() => setIsEditBranchOpen(false)} className="font-semibold">
                Cancel
              </Button>
              <Button type="submit" className="bg-amber-700 hover:bg-amber-800 text-white font-semibold">
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ================= MANAGE TABLES DIALOG ================= */}
      <Dialog open={isManageTablesOpen} onOpenChange={setIsManageTablesOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-4 border-b border-stone-100">
            <DialogTitle className="font-bold text-stone-900 text-xl flex items-center gap-2">
              <Coffee className="text-amber-800" size={24} />
              Tables for {selectedBranchForTables?.name}
            </DialogTitle>
          </DialogHeader>

          {/* Add Table Form */}
          <div className="p-6 pb-4 bg-stone-50/50 border-b border-stone-100">
            <h3 className="text-sm font-bold text-stone-800 mb-3 flex items-center gap-1.5">
              <Plus size={16} className="text-amber-700" /> Add New Table
            </h3>
            <form onSubmit={handleAddTable} className="flex items-end gap-4">
              <div className="space-y-1.5 flex-1">
                <Label htmlFor="num-chairs" className="text-xs font-bold text-stone-500 uppercase tracking-wider">Number of Chairs</Label>
                <Input 
                  id="num-chairs"
                  type="number"
                  min={1}
                  max={20}
                  value={newTableChairs}
                  onChange={e => setNewTableChairs(Number(e.target.value))}
                  placeholder="e.g. 4"
                  className="bg-white border-stone-200"
                  required
                />
              </div>
              <Button type="submit" className="bg-amber-700 hover:bg-amber-800 text-white font-bold h-10 px-5 gap-1.5 shadow-sm">
                <Plus size={16} /> Add Table
              </Button>
            </form>
          </div>

          {/* Tables List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <h3 className="text-sm font-bold text-stone-800 flex items-center gap-1.5">
              <Coffee size={16} className="text-amber-700" /> Existing Tables ({branchTables.length})
            </h3>
            
            {isTablesLoading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3 text-stone-500">
                <Loader2 className="animate-spin text-amber-800" size={28} />
                <span className="text-sm font-medium">Loading tables...</span>
              </div>
            ) : branchTables.length === 0 ? (
              <div className="py-12 text-center text-stone-500 text-sm font-medium border border-dashed border-stone-200 rounded-xl">
                No tables found in this branch. Use the form above to add one.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {branchTables.map(table => (
                  <div key={table.id} className="flex items-center justify-between p-3.5 bg-white border border-stone-200 rounded-xl shadow-xs transition-all hover:border-stone-300">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-stone-50 text-stone-700 rounded-lg flex items-center justify-center border border-stone-100">
                        <span className="font-extrabold text-stone-900 text-sm">{table.id}</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-stone-900">Table #{table.id}</p>
                        <p className="text-xs text-stone-500 font-medium flex items-center gap-1">
                          <Armchair size={12} className="text-stone-400" /> {table.num_chairs} Chairs
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        table.is_available 
                          ? 'bg-green-50 text-green-700 border border-green-100' 
                          : 'bg-red-50 text-red-700 border border-red-100'
                      }`}>
                        {table.is_available ? 'Available' : 'Occupied'}
                      </span>
                      <button 
                        type="button"
                        onClick={() => handleDeleteTable(table.id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-100 transition-colors inline-flex cursor-pointer"
                        title="Delete Table"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="p-4 border-t border-stone-100 bg-stone-50">
            <Button type="button" variant="outline" onClick={() => setIsManageTablesOpen(false)} className="w-full sm:w-auto font-semibold border-stone-200">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
