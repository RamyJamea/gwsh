import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { User, Lock, Coffee } from 'lucide-react';
import { useAuth } from '../auth-context';
import { toast } from 'sonner';
import { branchApi, BranchRead } from '../api-client';

export function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [role, setRole] = useState<'cashier'|'admin'>('cashier');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [branches, setBranches] = useState<BranchRead[]>([]);
  const [branchId, setBranchId] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const savedToken = localStorage.getItem('authToken');
    if (!savedToken || role !== 'admin') return;
    branchApi.list()
      .then(data => {
        setBranches(data);
        setBranchId(prev => prev ?? data[0]?.id ?? null);
      })
      .catch(() => {
        setBranches([]);
        setBranchId(null);
      });
  }, [role]);

  const handleRoleChange = (newRole: 'cashier' | 'admin') => {
    setRole(newRole);
    setUsername('');
    setPassword('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      const userProfile = await login(username, password);
      let selectedBranchId = userProfile.branch_id;
      let selectedBranchName = selectedBranchId ? `Branch ${selectedBranchId}` : 'All Branches';
      let availableBranches = branches;
      
      if (userProfile.role === 'admin') {
        try {
          availableBranches = await branchApi.list();
          setBranches(availableBranches);
        } catch {
          availableBranches = branches;
        }
        selectedBranchId = branchId ?? availableBranches[0]?.id ?? null;
        selectedBranchName = availableBranches.find(b => b.id === selectedBranchId)?.name ?? selectedBranchName;
      } else if (selectedBranchId) {
        selectedBranchName = availableBranches.find(b => b.id === selectedBranchId)?.name ?? `Branch ${selectedBranchId}`;
      }
      
      if (selectedBranchId) localStorage.setItem('activeBranchId', String(selectedBranchId));
      localStorage.setItem('activeBranchName', selectedBranchName);
      localStorage.setItem('cashierName', userProfile.username);
      
      toast.success(`Welcome back, ${userProfile.username}!`);
      
      if (userProfile.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/destination-selection');
      }
    } catch (err: any) {
      const msg = err.message || 'Invalid username or password';
      setErrorMsg(msg);
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1739723745132-97df9db49db2?auto=format&fit=crop&q=80&w=1600"
          alt="Cafe Interior"
          className="w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-stone-900/30"></div>
      </div>
      
      <div className="relative z-10 w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 border border-stone-100">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-amber-900 text-amber-50 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <Coffee size={32} />
          </div>
          <h1 className="text-3xl font-bold text-stone-900">Abu Ghoush</h1>
          <p className="text-stone-500 mt-2">Restaurant Management System</p>
        </div>

        <div className="flex bg-stone-100 p-1 rounded-xl mb-6">
          <button 
            type="button"
            onClick={() => handleRoleChange('cashier')}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${role === 'cashier' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
          >
            Cashier
          </button>
          <button 
            type="button"
            onClick={() => handleRoleChange('admin')}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${role === 'admin' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
          >
            Admin
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-sm font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Username</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                <User size={18} />
              </div>
              <input 
                type="text" 
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-stone-200 rounded-xl bg-stone-50 text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-700 focus:border-transparent transition-all"
                placeholder="Enter your username"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                <Lock size={18} />
              </div>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-stone-200 rounded-xl bg-stone-50 text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-700 focus:border-transparent transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          {role === 'admin' && (
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Branch</label>
              <div className="relative">
                <select 
                  value={branchId ?? ''}
                  onChange={(e) => setBranchId(Number(e.target.value))}
                  className="block w-full px-3 py-3 border border-stone-200 rounded-xl bg-stone-50 text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-700 focus:border-transparent transition-all"
                >
                  {branches.length === 0 && <option value="">No branches loaded</option>}
                  {branches.map(branch => (
                    <option key={branch.id} value={branch.id}>{branch.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <button 
            type="submit"
            className="w-full bg-amber-900 hover:bg-amber-950 text-white font-semibold py-3 px-4 rounded-xl shadow-md transition-colors duration-200 flex justify-center items-center"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
