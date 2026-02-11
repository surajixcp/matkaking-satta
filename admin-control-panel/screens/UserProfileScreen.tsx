import React, { useState, useMemo } from 'react';
import {
  ArrowLeft, Wallet, History, FileText, CreditCard,
  HelpCircle, ShieldAlert, CheckCircle2, X, AlertCircle, Trash2,
  TrendingUp, Landmark, MessageSquare, ShieldCheck, UserX,
  Calendar
} from 'lucide-react';
import { UserData, Transaction, Bid, WithdrawalRequest } from '../types';

interface UserProfileScreenProps {
  user: UserData;
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  onUpdateUser: (updated: UserData) => void;
  onBack: () => void;
}

const WalletAdjustModal: React.FC<{
  isOpen: boolean;
  user: UserData;
  onClose: () => void;
  onConfirm: (amount: number) => void;
}> = ({ isOpen, user, onClose, onConfirm }) => {
  const [amount, setAmount] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

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
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}></div>
      <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
              <Wallet size={20} />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Adjust Wallet</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-8 space-y-6">
          <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-inner border border-slate-800">
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Current Balance</p>
            <p className="text-3xl font-black">₹{user.balance.toLocaleString()}</p>
          </div>
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 text-center">Amount (INR)</label>
            <input
              type="number"
              autoFocus
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 px-4 py-5 rounded-2xl text-4xl font-black text-slate-900 focus:ring-4 focus:ring-indigo-500/10 outline-none text-center placeholder:text-slate-200"
              placeholder="0.00"
            />
          </div>
        </div>
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-4">
          <button
            disabled={isProcessing || !amount}
            onClick={() => handleAction('deduct')}
            className="flex-1 bg-white border border-rose-200 text-rose-600 font-black py-4 rounded-2xl hover:bg-rose-50 transition-all active:scale-95 disabled:opacity-50"
          >
            Deduct
          </button>
          <button
            disabled={isProcessing || !amount}
            onClick={() => handleAction('add')}
            className="flex-1 bg-indigo-600 text-white font-black py-4 rounded-2xl hover:bg-indigo-500 shadow-xl shadow-indigo-600/20 transition-all flex items-center justify-center active:scale-95 disabled:opacity-50"
          >
            {isProcessing ? (
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              'Add Funds'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const UserProfileScreen: React.FC<UserProfileScreenProps> = ({ user, transactions, setTransactions, onUpdateUser, onBack }) => {
  const [activeTab, setActiveTab] = useState('wallet');
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);

  // Filter specific user data
  const userTransactions = useMemo(() => transactions.filter(t => t.userId === user.id), [transactions, user.id]);

  // Real Bank Info from user object
  const bankInfo = {
    holder: user.account_holder_name || 'Not provided',
    bank: user.bank_name || 'Not provided',
    account: user.account_number || 'Not provided',
    ifsc: user.ifsc_code || 'Not provided',
    upi: user.upi_id || 'Not provided'
  };

  const tabs = [
    { id: 'wallet', label: 'Wallet History', icon: <Wallet size={16} /> },
    { id: 'bids', label: 'Bid History', icon: <TrendingUp size={16} /> },
    { id: 'withdrawals', label: 'Withdrawals', icon: <CreditCard size={16} /> },
    { id: 'bank', label: 'Bank Info', icon: <Landmark size={16} /> },
    { id: 'support', label: 'Support Tickets', icon: <MessageSquare size={16} /> },
  ];

  const handleDeleteTransaction = (id: string) => {
    if (confirm("Delete this transaction entry? This will only remove the record from history.")) {
      setTransactions(prev => prev.filter(t => t.id !== id));
    }
  };

  const handleToggleStatus = () => {
    const newStatus = user.status === 'active' ? 'blocked' : 'active';
    if (confirm(`Change account status to ${newStatus.toUpperCase()}?`)) {
      onUpdateUser({ ...user, status: newStatus });
    }
  };

  const handleConfirmAdjustment = (amount: number) => {
    const newTxn: Transaction = {
      id: `TXN-${Math.floor(Math.random() * 90000 + 10000)}`,
      user: user.name,
      userId: user.id,
      type: amount > 0 ? 'deposit' : 'withdrawal',
      amount: Math.abs(amount),
      date: new Date().toLocaleString(),
      status: 'success',
      method: 'Admin Panel Direct'
    };

    setTransactions(prev => [newTxn, ...prev]);
    onUpdateUser({ ...user, balance: Math.max(0, user.balance + amount) });
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-4 sm:space-y-6 animate-in fade-in duration-500">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center space-x-2 text-slate-500 hover:text-indigo-600 transition-colors font-bold group px-2"
      >
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-xs sm:text-sm font-black uppercase tracking-widest">Return to List</span>
      </button>

      {/* Main Profile Header Card */}
      <div className="bg-white p-4 sm:p-8 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute -top-10 -right-10 p-20 opacity-5 rotate-12 select-none pointer-events-none">
          <ShieldAlert size={280} />
        </div>

        <div className="flex flex-col lg:flex-row items-center lg:items-center gap-6 sm:gap-10 relative z-10">
          {/* Avatar Area */}
          <div className="shrink-0 relative">
            <div className={`w-24 h-24 sm:w-32 sm:h-32 rounded-[2rem] flex items-center justify-center text-3xl sm:text-5xl font-black text-white shadow-2xl transition-colors duration-500 ${user.status === 'blocked' ? 'bg-slate-400' : 'bg-indigo-600 shadow-indigo-200'}`}>
              {user.name.charAt(0)}
            </div>
            <div className="absolute -bottom-2 -right-2 bg-white p-1.5 rounded-2xl shadow-lg">
              {user.status === 'active' ? (
                <div className="bg-emerald-500 p-2 rounded-xl text-white">
                  <ShieldCheck size={20} />
                </div>
              ) : (
                <div className="bg-rose-500 p-2 rounded-xl text-white">
                  <UserX size={20} />
                </div>
              )}
            </div>
          </div>

          {/* User Details */}
          <div className="flex-1 text-center lg:text-left space-y-2 sm:space-y-4">
            <div>
              <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">{user.name}</h2>
              <div className="flex flex-wrap justify-center lg:justify-start items-center gap-3 sm:gap-6 mt-2">
                <span className={`px-3 py-1 rounded-lg font-black text-[10px] uppercase tracking-widest border ${user.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                  {user.status}
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Calendar size={12} className="text-indigo-400" /> Joined {user.joinedAt}
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Landmark size={12} className="text-indigo-400" /> {user.phone}
                </span>
              </div>
            </div>

            {/* Credit Summaries */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-3 sm:gap-4 mt-4">
              <div className="bg-slate-900 text-white px-5 py-4 rounded-2xl border border-slate-800 flex-1 min-w-[160px] max-w-[200px] shadow-lg shadow-slate-900/10">
                <p className="text-[8px] sm:text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1.5 opacity-80">Available Credits</p>
                <p className="text-xl sm:text-2xl font-black tracking-tight">₹{user.balance.toLocaleString()}</p>
              </div>
              <div className="bg-indigo-50 px-5 py-4 rounded-2xl border border-indigo-100 flex-1 min-w-[160px] max-w-[200px] shadow-lg shadow-indigo-100/10">
                <p className="text-[8px] sm:text-[10px] text-indigo-600 font-black uppercase tracking-widest mb-1.5 opacity-80">Est. Total Winnings</p>
                <p className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">₹{(user.balance * 1.5).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 w-full lg:w-auto mt-4 lg:mt-0">
            <button
              onClick={() => setIsAdjustModalOpen(true)}
              className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-indigo-500 shadow-xl shadow-indigo-600/20 active:scale-95 transition-all w-full lg:w-56"
            >
              Adjust Wallet
            </button>
            <button
              onClick={handleToggleStatus}
              className={`px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all border shadow-lg active:scale-95 w-full lg:w-56 ${user.status === 'active'
                  ? 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100'
                  : 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100 shadow-emerald-600/10'
                }`}
            >
              {user.status === 'active' ? 'Block Access' : 'Restore Access'}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs and Data Section */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden min-h-[500px]">
        {/* Navigation Tabs */}
        <div className="border-b border-slate-100 overflow-x-auto no-scrollbar bg-slate-50/30">
          <div className="flex min-w-max p-2 sm:p-4 gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2.5 px-6 py-3.5 rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all duration-300 ${activeTab === tab.id
                    ? 'bg-white text-indigo-600 shadow-xl shadow-slate-200/50 ring-1 ring-slate-100'
                    : 'text-slate-400 hover:text-slate-900 hover:bg-white/50'
                  }`}
              >
                <span className={`${activeTab === tab.id ? 'scale-110' : ''} transition-transform`}>
                  {React.cloneElement(tab.icon as React.ReactElement<any>, { size: 16 })}
                </span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-8">
          <div className="overflow-x-auto no-scrollbar">
            {activeTab === 'wallet' && (
              <table className="w-full text-left">
                <thead>
                  <tr className="text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                    <th className="px-4 sm:px-6 py-4">Transaction Details</th>
                    <th className="px-4 sm:px-6 py-4">Category</th>
                    <th className="px-4 sm:px-6 py-4 text-right">Points</th>
                    <th className="px-4 sm:px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {userTransactions.length > 0 ? (
                    userTransactions.map((txn) => (
                      <tr key={txn.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-4 sm:px-6 py-4 sm:py-5">
                          <div className="flex flex-col">
                            <span className="text-xs sm:text-sm font-black text-slate-800 tracking-tight">#{txn.id}</span>
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{txn.date}</span>
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 sm:py-5">
                          <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${txn.type === 'deposit' ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'
                            }`}>
                            {txn.type}
                          </span>
                        </td>
                        <td className={`px-4 sm:px-6 py-4 sm:py-5 text-right font-black text-xs sm:text-sm ${txn.type === 'deposit' ? 'text-emerald-600' : 'text-slate-900'}`}>
                          {txn.type === 'deposit' ? '+' : '-'}₹{txn.amount.toLocaleString()}
                        </td>
                        <td className="px-4 sm:px-6 py-4 sm:py-5 text-right">
                          <button
                            onClick={() => handleDeleteTransaction(txn.id)}
                            className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={4} className="px-6 py-24 text-center text-slate-300 font-black uppercase text-xs tracking-widest italic opacity-50">Empty Archive</td></tr>
                  )}
                </tbody>
              </table>
            )}

            {activeTab === 'bank' && (
              <div className="max-w-2xl space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Account Holder</p>
                    <p className="text-sm font-black text-slate-800">{bankInfo.holder}</p>
                  </div>
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Bank Name</p>
                    <p className="text-sm font-black text-slate-800">{bankInfo.bank}</p>
                  </div>
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Account Number</p>
                    <p className="text-sm font-black text-slate-800 font-mono tracking-widest">{bankInfo.account}</p>
                  </div>
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">IFSC Code</p>
                    <p className="text-sm font-black text-slate-800 font-mono">{bankInfo.ifsc}</p>
                  </div>
                </div>
                <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100 border-dashed">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1.5">Default UPI VPA</p>
                      <p className="text-lg font-black text-slate-900">{bankInfo.upi}</p>
                    </div>
                    <CheckCircle2 size={32} className="text-emerald-500" />
                  </div>
                </div>
              </div>
            )}

            {(activeTab === 'bids' || activeTab === 'withdrawals' || activeTab === 'support') && (
              <div className="flex flex-col items-center justify-center py-24 opacity-30 select-none">
                <History size={64} className="text-slate-200 mb-4" />
                <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No detailed records found</p>
                <p className="text-[10px] font-bold text-slate-300 mt-1 uppercase">Updates occur every 15 minutes</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Adjust Modal */}
      <WalletAdjustModal
        isOpen={isAdjustModalOpen}
        user={user}
        onClose={() => setIsAdjustModalOpen(false)}
        onConfirm={handleConfirmAdjustment}
      />
    </div>
  );
};

export default UserProfileScreen;