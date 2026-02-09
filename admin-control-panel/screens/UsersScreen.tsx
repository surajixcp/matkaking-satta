import React, { useState, useMemo } from 'react';
import {
  Search, UserX, Wallet, X,
  ChevronUp, ChevronDown, Trash2,
  CheckCircle2, Plus, Eye
} from 'lucide-react';
import { UserData, Transaction } from '../types';

interface AdjustModalProps {
  user: UserData | null;
  onClose: () => void;
  onConfirm: (amount: number) => void;
}

type SortKey = 'name' | 'phone' | 'balance' | 'joinedAt';
type SortDirection = 'asc' | 'desc' | null;

const WalletAdjustModal: React.FC<AdjustModalProps> = ({ user, onClose, onConfirm }) => {
  const [amount, setAmount] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!user) return null;

  const handleAction = (type: 'add' | 'deduct') => {
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) return;
    setIsProcessing(true);
    setTimeout(() => {
      onConfirm(type === 'add' ? val : -val);
      setIsProcessing(false);
      setAmount('');
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in duration-200 my-auto">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-3 text-indigo-600">
            <Wallet size={20} />
            <h3 className="text-lg font-black tracking-tight uppercase">Adjust Balance</h3>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 transition-colors"><X size={20} /></button>
        </div>
        <div className="p-10 space-y-8">
          <div className="text-center">
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Target Account</p>
            <p className="text-xl font-black text-slate-900 uppercase tracking-tight">{user.name}</p>
          </div>
          <input type="number" autoFocus value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-6 rounded-2xl text-4xl font-black text-slate-900 outline-none text-center focus:ring-4 focus:ring-indigo-500/5 transition-all placeholder:text-slate-200" placeholder="0.00" />
        </div>
        <div className="p-6 bg-slate-50/80 border-t border-slate-100 flex flex-col sm:flex-row gap-4">
          <button onClick={() => handleAction('deduct')} className="w-full sm:flex-1 bg-white border border-rose-200 text-rose-600 font-black py-4 rounded-xl hover:bg-rose-50 text-[10px] uppercase tracking-widest transition-all">Deduct</button>
          <button onClick={() => handleAction('add')} className="w-full sm:flex-1 bg-indigo-600 text-white font-black py-4 rounded-xl shadow-xl shadow-indigo-600/10 hover:bg-indigo-500 text-[10px] uppercase tracking-widest flex items-center justify-center transition-all">
            {isProcessing ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Add Credits'}
          </button>
        </div>
      </div>
    </div>
  );
};

interface UsersScreenProps {
  users: UserData[];
  setUsers: React.Dispatch<React.SetStateAction<UserData[]>>;
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  onViewUser: (id: string) => void;
}

const UsersScreen: React.FC<UsersScreenProps> = ({ users, setUsers, setTransactions, onViewUser }) => {
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [adjustingUser, setAdjustingUser] = useState<UserData | null>(null);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      if (sortDirection === 'asc') setSortDirection('desc');
      else { setSortKey(null); setSortDirection(null); }
    } else { setSortKey(key); setSortDirection('asc'); }
  };

  const filteredAndSortedUsers = useMemo(() => {
    let result = users.filter(user => {
      const matchesTab = activeTab === 'all' || user.status === activeTab;
      const search = searchTerm.toLowerCase().trim();
      return matchesTab && (!search || user.name.toLowerCase().includes(search) || user.id.toLowerCase().includes(search) || user.phone.includes(search));
    });

    if (sortKey && sortDirection) {
      result = [...result].sort((a, b) => {
        let valA: any = a[sortKey];
        let valB: any = b[sortKey];
        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [users, activeTab, searchTerm, sortKey, sortDirection]);

  const paginatedUsers = filteredAndSortedUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredAndSortedUsers.length / itemsPerPage);

  const toggleSelectAllPage = () => {
    const pageIds = paginatedUsers.map(u => u.id);
    const allOnPageSelected = pageIds.every(id => selectedIds.has(id));
    const next = new Set(selectedIds);
    if (allOnPageSelected) pageIds.forEach(id => next.delete(id));
    else pageIds.forEach(id => next.add(id));
    setSelectedIds(next);
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleBulkBlock = () => {
    if (confirm(`Block ${selectedIds.size} accounts?`)) {
      setUsers(prev => prev.map(u => selectedIds.has(u.id) ? { ...u, status: 'blocked' } : u));
      setSelectedIds(new Set());
    }
  };

  const handleBulkDelete = () => {
    if (confirm(`DANGER: Delete ${selectedIds.size} accounts?`)) {
      setUsers(prev => prev.filter(u => !selectedIds.has(u.id)));
      setSelectedIds(new Set());
    }
  };

  const handleToggleBlock = (id: string, currentStatus: string) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, status: currentStatus === 'active' ? 'blocked' : 'active' } : u));
  };

  const handleDeleteUser = (id: string) => {
    if (confirm("Permanently delete this user?")) {
      setUsers(prev => prev.filter(u => u.id !== id));
      if (selectedIds.has(id)) {
        const next = new Set(selectedIds);
        next.delete(id);
        setSelectedIds(next);
      }
    }
  };

  const confirmAdjustment = (amount: number) => {
    if (!adjustingUser) return;
    const newTxn: Transaction = {
      id: `ADM-${Math.floor(Math.random() * 90000 + 10000)}`,
      user: adjustingUser.name,
      userId: adjustingUser.id,
      type: amount > 0 ? 'deposit' : 'withdrawal',
      amount: Math.abs(amount),
      date: new Date().toLocaleString(),
      status: 'success',
      method: 'Admin Direct'
    };
    setTransactions(prev => [newTxn, ...prev]);
    setUsers(prev => prev.map(u => u.id === adjustingUser.id ? { ...u, balance: Math.max(0, u.balance + amount) } : u));
    setAdjustingUser(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight uppercase sm:normal-case">User Database</h2>
          <p className="text-sm font-medium text-slate-500 mt-1">Manage player profiles and wallet health</p>
        </div>

      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex bg-slate-200/60 p-1 rounded-2xl shadow-inner backdrop-blur-sm">
          {['all', 'active', 'blocked'].map((tab) => (
            <button key={tab} onClick={() => { setActiveTab(tab); setCurrentPage(1); }} className={`px-6 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === tab ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
              {tab}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-md ml-auto sm:ml-0">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input type="text" value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} placeholder="Search players by name, ID or phone..." className="w-full bg-white border border-slate-200 pl-12 pr-4 py-3 rounded-2xl focus:ring-4 focus:ring-indigo-500/5 border-transparent focus:border-indigo-500/20 outline-none transition-all text-sm font-bold tracking-tight" />
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden relative min-h-[500px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[700px]">
            <thead>
              <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                <th className="px-8 py-5 w-12 text-center">
                  <input type="checkbox" onChange={toggleSelectAllPage} checked={paginatedUsers.length > 0 && paginatedUsers.every(u => selectedIds.has(u.id))} className="w-4 h-4 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500 transition-all cursor-pointer" />
                </th>
                <th className="px-4 py-5 cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => handleSort('name')}>
                  <div className="flex items-center gap-2">Player Account {sortKey === 'name' && (sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}</div>
                </th>
                <th className="px-4 py-5">Phone Number</th>
                <th className="px-4 py-5 cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => handleSort('balance')}>
                  <div className="flex items-center gap-2">Wallet Credits {sortKey === 'balance' && (sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}</div>
                </th>
                <th className="px-4 py-5">Status</th>
                <th className="px-8 py-5 text-right">Operation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedUsers.length > 0 ? (
                paginatedUsers.map((user) => (
                  <tr key={user.id} className={`hover:bg-slate-50/50 transition-all ${selectedIds.has(user.id) ? 'bg-indigo-50/30' : ''} ${user.status === 'blocked' ? 'opacity-60 grayscale-[0.2]' : ''}`}>
                    <td className="px-8 py-4 text-center">
                      <input type="checkbox" checked={selectedIds.has(user.id)} onChange={() => toggleSelect(user.id)} className="w-4 h-4 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500 transition-all cursor-pointer" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-4">
                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm shadow-sm ring-1 ${user.status === 'blocked' ? 'bg-slate-100 text-slate-400 ring-slate-200' : 'bg-indigo-600 text-white ring-indigo-500'}`} onClick={() => onViewUser(user.id)}>
                          {user.name.charAt(0)}
                        </div>
                        <div className="truncate">
                          <p className="text-sm font-black text-slate-800 tracking-tight leading-none hover:text-indigo-600 cursor-pointer" onClick={() => onViewUser(user.id)}>{user.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1.5">{user.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-xs font-bold text-slate-500 font-mono">{user.phone}</td>
                    <td className="px-4 py-4 text-sm font-black text-slate-900 font-mono tracking-tighter">₹{user.balance.toLocaleString()}</td>
                    <td className="px-4 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${user.status === 'blocked' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {user.status === 'active' ? 'Active' : 'Blocked'}
                      </span>
                    </td>
                    <td className="px-8 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button onClick={() => onViewUser(user.id)} className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-xl transition-all" title="View Profile"><Eye size={18} /></button>
                        <button onClick={() => setAdjustingUser(user)} className="p-2 text-amber-500 hover:bg-amber-50 rounded-xl transition-all" title="Adjust Wallet"><Wallet size={18} /></button>
                        <button onClick={() => handleToggleBlock(user.id, user.status)} className={`p-2 rounded-xl transition-all ${user.status === 'active' ? 'text-rose-400 hover:bg-rose-50' : 'text-emerald-400 hover:bg-emerald-50'}`} title={user.status === 'active' ? 'Block Account' : 'Enable Account'}>{user.status === 'active' ? <UserX size={18} /> : <CheckCircle2 size={18} />}</button>
                        <button onClick={() => handleDeleteUser(user.id)} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all" title="Erase Data"><Trash2 size={18} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-8 py-12 text-center text-slate-400">
                    <p className="text-sm font-bold">No users found matching your criteria.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {selectedIds.size > 0 && (
          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] bg-[#0f172a] text-white px-8 py-4 rounded-3xl shadow-2xl flex items-center gap-10 animate-in slide-in-from-bottom-5 border border-white/10 max-w-[90%] sm:max-w-fit">
            <div className="flex flex-col border-r border-slate-700 pr-10">
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 leading-none">Batch Actions</span>
              <span className="text-xl font-black leading-none mt-2">{selectedIds.size} Accounts</span>
            </div>
            <div className="flex gap-8">
              <button onClick={handleBulkBlock} className="text-amber-400 font-bold text-xs uppercase tracking-widest flex flex-col items-center gap-1.5 hover:text-amber-300 transition-colors"><UserX size={20} /> <span>Block</span></button>
              <button onClick={handleBulkDelete} className="text-rose-400 font-bold text-xs uppercase tracking-widest flex flex-col items-center gap-1.5 hover:text-rose-300 transition-colors"><Trash2 size={20} /> <span>Delete</span></button>
              <button onClick={() => setSelectedIds(new Set())} className="text-slate-400 font-bold text-xs uppercase tracking-widest flex flex-col items-center gap-1.5 hover:text-white transition-colors"><X size={20} /> <span>Cancel</span></button>
            </div>
          </div>
        )}

        <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Showing Page {currentPage} of {totalPages || 1}</p>
          <div className="flex gap-2">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(c => c - 1)} className="px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-black uppercase tracking-widest shadow-sm disabled:opacity-30 hover:bg-slate-50 transition-colors">Previous</button>
            <button disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(c => c + 1)} className="px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-black uppercase tracking-widest shadow-sm disabled:opacity-30 hover:bg-slate-50 transition-colors">Next</button>
          </div>
        </div>
      </div>


      <WalletAdjustModal user={adjustingUser} onClose={() => setAdjustingUser(null)} onConfirm={confirmAdjustment} />
    </div>
  );
};

export default UsersScreen;