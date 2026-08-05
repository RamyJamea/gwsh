import React, { useEffect, useMemo, useState } from 'react';
import { Search, Shield, ShieldOff, UserCircle, UserPlus, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { branchApi, BranchRead, userApi, UserResponse, parseApiDate } from '../api-client';
import { formatDateOnly } from '../currency';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

export function UserManagement() {
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [branches, setBranches] = useState<BranchRead[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserResponse | null>(null);
  const [editFormData, setEditFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'cashier' as 'admin' | 'cashier',
    branch_id: '' as string,
  });
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    role: 'cashier' as 'admin' | 'cashier',
    branch_id: '' as string,
  });

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const [userRows, branchRows] = await Promise.all([
        userApi.list(),
        branchApi.list().catch(() => []),
      ]);
      setUsers(userRows);
      setBranches(branchRows);
      setNewUser(prev => ({ ...prev, branch_id: prev.branch_id || String(branchRows[0]?.id || '') }));
    } catch (err: any) {
      toast.error(err.message || 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const branchNameById = useMemo(
    () => new Map(branches.map(branch => [branch.id, branch.name])),
    [branches]
  );

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.username || !newUser.email || !newUser.password) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      const created = await userApi.create({
        username: newUser.username,
        email: newUser.email,
        password: newUser.password,
        role: newUser.role,
        is_active: true,
        branch_id: newUser.role === 'admin' ? null : Number(newUser.branch_id),
      });
      setUsers(prev => [...prev, created]);
      toast.success('User added successfully');
      setIsAddUserOpen(false);
      setNewUser({ username: '', email: '', password: '', role: 'cashier', branch_id: String(branches[0]?.id || '') });
    } catch (err: any) {
      toast.error(err.message || 'Failed to add user');
    }
  };

  const handleOpenEdit = (user: UserResponse) => {
    setEditingUser(user);
    setEditFormData({
      username: user.username,
      email: user.email,
      password: '',
      role: user.role,
      branch_id: user.branch_id ? String(user.branch_id) : '',
    });
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    if (!editFormData.username || !editFormData.email) {
      toast.error('Username and Email are required');
      return;
    }

    try {
      const payload: any = {
        username: editFormData.username,
        email: editFormData.email,
        role: editFormData.role,
        branch_id: editFormData.role === 'admin' ? null : (editFormData.branch_id ? Number(editFormData.branch_id) : null),
      };
      if (editFormData.password.trim().length >= 8) {
        payload.password = editFormData.password.trim();
      }

      const updated = await userApi.update(editingUser.username, payload);
      setUsers(prev => prev.map(row => row.username === editingUser.username ? updated : row));
      toast.success('User updated successfully');
      setEditingUser(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update user');
    }
  };

  const handleToggleStatus = async (user: UserResponse) => {
    const nextActive = !user.is_active;
    if (!nextActive && !window.confirm(`Deactivate ${user.username}? They will no longer be able to log in.`)) {
      return;
    }

    try {
      const updated = await userApi.update(user.username, { is_active: nextActive });
      setUsers(prev => prev.map(row => row.username === user.username ? updated : row));
      toast.success(`${user.username} is now ${nextActive ? 'active' : 'inactive'}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update user');
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-stone-900">User Management</h1>
          <p className="text-stone-500 mt-1">Manage employee access and roles.</p>
        </div>
        <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
          <DialogTrigger asChild>
            <Button className="bg-amber-700 hover:bg-amber-800 text-white gap-2">
              <UserPlus size={18} />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Employee</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddUser} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Username</Label>
                <Input value={newUser.username} onChange={e => setNewUser({ ...newUser, username: e.target.value })} placeholder="cashier_ahmed" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} placeholder="cashier@example.com" />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input type="password" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} placeholder="At least 8 characters" />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={newUser.role} onValueChange={(val: 'admin' | 'cashier') => setNewUser({ ...newUser, role: val })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cashier">Cashier</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {newUser.role === 'cashier' && (
                <div className="space-y-2">
                  <Label>Assigned Branch</Label>
                  <Select value={newUser.branch_id} onValueChange={(val) => setNewUser({ ...newUser, branch_id: val })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map(branch => (
                        <SelectItem key={branch.id} value={String(branch.id)}>{branch.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddUserOpen(false)}>Cancel</Button>
                <Button type="submit" className="bg-amber-700 hover:bg-amber-800 text-white">Create User</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={!!editingUser} onOpenChange={open => !open && setEditingUser(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Employee Details</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditUser} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Username</Label>
                <Input value={editFormData.username} onChange={e => setEditFormData({ ...editFormData, username: e.target.value })} placeholder="username" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={editFormData.email} onChange={e => setEditFormData({ ...editFormData, email: e.target.value })} placeholder="email@example.com" />
              </div>
              <div className="space-y-2">
                <Label>Password (leave blank to keep unchanged)</Label>
                <Input type="password" value={editFormData.password} onChange={e => setEditFormData({ ...editFormData, password: e.target.value })} placeholder="At least 8 characters" />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={editFormData.role} onValueChange={(val: 'admin' | 'cashier') => setEditFormData({ ...editFormData, role: val })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cashier">Cashier</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {editFormData.role === 'cashier' && (
                <div className="space-y-2">
                  <Label>Assigned Branch</Label>
                  <Select value={editFormData.branch_id} onValueChange={(val) => setEditFormData({ ...editFormData, branch_id: val })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map(branch => (
                        <SelectItem key={branch.id} value={String(branch.id)}>{branch.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditingUser(null)}>Cancel</Button>
                <Button type="submit" className="bg-amber-700 hover:bg-amber-800 text-white">Save Changes</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
        <div className="p-4 border-b border-stone-100 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
            <Input placeholder="Search users..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-100">
                <th className="p-4 font-semibold text-stone-600 text-sm">User</th>
                <th className="p-4 font-semibold text-stone-600 text-sm">Role</th>
                <th className="p-4 font-semibold text-stone-600 text-sm">Branch</th>
                <th className="p-4 font-semibold text-stone-600 text-sm">Status</th>
                <th className="p-4 font-semibold text-stone-600 text-sm">Created Date</th>
                <th className="p-4 font-semibold text-stone-600 text-sm text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {isLoading && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-stone-500">Loading users...</td>
                </tr>
              )}
              {!isLoading && filteredUsers.map(user => (
                <tr key={user.username} className="hover:bg-stone-50/50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-500">
                        <UserCircle size={20} />
                      </div>
                      <div>
                        <div className="font-medium text-stone-900">{user.username}</div>
                        <div className="text-xs text-stone-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <Badge variant="outline" className={user.role === 'admin' ? 'border-amber-200 text-amber-700 bg-amber-50' : 'border-stone-200 text-stone-600 bg-stone-50'}>
                      {user.role}
                    </Badge>
                  </td>
                  <td className="p-4 text-stone-700 font-medium">
                    {user.branch_id ? branchNameById.get(user.branch_id) || `Branch ${user.branch_id}` : 'All'}
                  </td>
                  <td className="p-4">
                    <Badge variant={user.is_active ? 'default' : 'secondary'} className={user.is_active ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="p-4 text-stone-500 text-sm">{formatDateOnly(parseApiDate(user.created_at))}</td>
                  <td className="p-4 text-right space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEdit(user)}
                      className="text-stone-700 hover:bg-stone-50"
                      title="Edit User Details"
                    >
                      <Edit size={16} className="mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleStatus(user)}
                      className={user.is_active ? 'text-red-600 hover:text-red-700 hover:bg-red-50' : 'text-green-600 hover:text-green-700 hover:bg-green-50'}
                      title={user.is_active ? 'Deactivate User' : 'Activate User'}
                    >
                      {user.is_active ? <ShieldOff size={16} className="mr-2" /> : <Shield size={16} className="mr-2" />}
                      {user.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                  </td>
                </tr>
              ))}
              {!isLoading && filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-stone-500">No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
