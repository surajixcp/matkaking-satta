import React, { useState, useMemo, useEffect } from 'react';
import { depositService, walletService } from '../services/api';
import * as XLSX from 'xlsx';
import {
  Download, Calendar, Search, ArrowUpRight, ArrowDownRight,
  Wallet, Banknote, Filter, CheckCircle, Clock, XCircle,
  TrendingUp, CreditCard, ChevronDown, Landmark, Trash2
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts';
import { Transaction } from '../types';



const CHART_DATA = [
  { name: 'Mar 18', deposits: 4000, withdrawals: 2400 },
  { name: 'Mar 19', deposits: 3000, withdrawals: 1398 },
  { name: 'Mar 20', deposits: 2000, withdrawals: 9800 },
  { name: 'Mar 21', deposits: 2780, withdrawals: 3908 },
  { name: 'Mar 22', deposits: 1890, withdrawals: 4800 },
  { name: 'Mar 23', deposits: 2390, withdrawals: 3800 },
  { name: 'Mar 24', deposits: 3490, withdrawals: 4300 },
];

const FinanceScreen: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'deposits' | 'withdrawals' | 'pnl'>('deposits');
  const [searchTerm, setSearchTerm] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
      const [depositsData, withdrawalsData] = await Promise.all([
        depositService.getDeposits('all'),
        walletService.getWithdrawals('all')
      ]);

      const formattedDeposits: Transaction[] = depositsData.map((d: any) => ({
        id: d.id,
        user: d.userName,
        userId: d.userId,
        type: 'deposit',
        amount: d.amount,
        date: d.requestDate,
        status: d.status === 'approved' ? 'success' : d.status === 'rejected' ? 'failed' : 'pending',
        method: d.utr ? `UPI/${d.utr}` : 'Details'
      }));

      const formattedWithdrawals: Transaction[] = withdrawalsData.map((w: any) => ({
        id: w.id,
        user: w.userName,
        userId: w.userId,
        type: 'withdrawal',
        amount: w.amount,
        date: w.requestedAt,
        status: w.status === 'approved' ? 'success' : w.status === 'rejected' ? 'failed' : 'pending',
        method: 'UPI'
      }));

      const allTransactions = [...formattedDeposits, ...formattedWithdrawals].sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      setTransactions(allTransactions);
    } catch (error) {
      console.error("Failed to fetch finance data", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(txn => {
      const typeMatch = activeTab === 'pnl' ? true : txn.type === activeTab.slice(0, -1);
      const search = searchTerm.toLowerCase();
      const searchMatch = !search ||
        txn.user.toLowerCase().includes(search) ||
        txn.id.toLowerCase().includes(search) ||
        txn.method.toLowerCase().includes(search);

      const txnDate = new Date(txn.date);
      const start = new Date(startDate);
      const end = new Date(endDate);
      // Set end date to end of day
      end.setHours(23, 59, 59, 999);

      const dateMatch = txnDate >= start && txnDate <= end;

      return typeMatch && searchMatch && dateMatch;
    });
  }, [activeTab, searchTerm, transactions, startDate, endDate]);

  const stats = useMemo(() => {
    const successTxns = transactions.filter(t => t.status === 'success');
    const totalDeposits = successTxns.filter(t => t.type === 'deposit').reduce((acc, curr) => acc + curr.amount, 0);
    const totalWithdrawals = successTxns.filter(t => t.type === 'withdrawal').reduce((acc, curr) => acc + curr.amount, 0);
    return {
      deposits: totalDeposits,
      withdrawals: totalWithdrawals,
      profit: totalDeposits - totalWithdrawals
    };
  }, [transactions]);

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      try {
        const dataToExport = filteredTransactions.map(t => ({
          'Transaction ID': t.id,
          'User Name': t.user,
          'User ID': t.userId,
          'Type': t.type,
          'Amount': t.amount,
          'Date': new Date(t.date).toLocaleString(),
          'Status': t.status,
          'Method': t.method
        }));

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Finance Report");

        // Generate filename with date range
        const fileName = `Finance_Report_${startDate}_to_${endDate}.xlsx`;

        XLSX.writeFile(wb, fileName);
        alert('Report exported successfully!');
      } catch (error) {
        console.error("Export failed:", error);
        alert("Failed to export data.");
      } finally {
        setIsExporting(false);
      }
    }, 500);
  };

  const handleDeleteTransaction = (id: string) => {
    if (confirm("Permanently delete this transaction log? This will not affect user wallet balance, only the administrative audit history.")) {
      setTransactions(prev => prev.filter(t => t.id !== id));
      // TODO: Call API to delete transaction if supported
    }
  };

  const renderPNLReport = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <ArrowUpRight size={24} />
            </div>
            {/* <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">+12% vs last month</span> */}
          </div>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Total Inflow (Deposits)</p>
          <h3 className="text-3xl font-black text-slate-900 mt-2">₹{stats.deposits.toLocaleString()}</h3>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
              <ArrowDownRight size={24} />
            </div>
            {/* <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-lg">+4% vs last month</span> */}
          </div>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Total Outflow (Withdrawals)</p>
          <h3 className="text-3xl font-black text-slate-900 mt-2">₹{stats.withdrawals.toLocaleString()}</h3>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-indigo-200 shadow-lg shadow-indigo-100 ring-2 ring-indigo-50">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-200">
              <TrendingUp size={24} />
            </div>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">Net Profit</span>
          </div>
          <p className="text-sm font-bold text-indigo-600 uppercase tracking-widest">Net Revenue (P&L)</p>
          <h3 className="text-3xl font-black text-slate-900 mt-2">₹{stats.profit.toLocaleString()}</h3>
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h4 className="text-xl font-bold text-slate-900">Financial Growth Overview</h4>
            <p className="text-sm text-slate-500 font-medium">Monitoring revenue streams over the last 7 days</p>
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-indigo-600"></div>
              <span className="text-xs font-bold text-slate-500 uppercase">Deposits</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-slate-300"></div>
              <span className="text-xs font-bold text-slate-500 uppercase">Withdrawals</span>
            </div>
          </div>
        </div>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={CHART_DATA}>
              <defs>
                <linearGradient id="colorDeposits" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} />
              <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
              <Area type="monotone" dataKey="deposits" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorDeposits)" />
              <Area type="monotone" dataKey="withdrawals" stroke="#cbd5e1" strokeWidth={2} fillOpacity={0} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="flex bg-slate-200 p-1 rounded-2xl w-fit">
            <button onClick={() => setActiveTab('deposits')} className={`px-6 py-2.5 text-sm font-bold rounded-xl transition-all ${activeTab === 'deposits' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>Deposits</button>
            <button onClick={() => setActiveTab('withdrawals')} className={`px-6 py-2.5 text-sm font-bold rounded-xl transition-all ${activeTab === 'withdrawals' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>Withdrawals</button>
            <button onClick={() => setActiveTab('pnl')} className={`px-6 py-2.5 text-sm font-bold rounded-xl transition-all ${activeTab === 'pnl' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>P&L Report</button>
          </div>
          <div className="hidden md:flex items-center bg-white border border-slate-200 rounded-2xl px-4 py-2 text-slate-500 text-sm font-bold gap-3 hover:bg-slate-50 transition-colors">
            <Calendar size={18} className="text-indigo-600" />
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent border-none focus:ring-0 text-slate-600 font-medium text-xs p-0 cursor-pointer"
              />
              <span className="text-slate-400">-</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent border-none focus:ring-0 text-slate-600 font-medium text-xs p-0 cursor-pointer"
              />
            </div>
            {/* <ChevronDown size={14} /> */}
          </div>
        </div>
        <button onClick={handleExport} disabled={isExporting} className="flex items-center justify-center gap-2 bg-slate-900 text-white px-8 py-3 rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 active:scale-95 disabled:opacity-70">
          {isExporting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Download size={18} />}
          <span>{isExporting ? 'Generating...' : 'Export Data'}</span>
        </button>
      </div>

      {activeTab === 'pnl' ? renderPNLReport() : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px] animate-in slide-in-from-bottom-2 duration-500">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center"><Filter size={20} /></div>
              <div><h3 className="text-lg font-bold text-slate-900 capitalize">{activeTab} Ledger</h3><p className="text-xs text-slate-500 font-medium">Viewing all processed {activeTab}</p></div>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input type="text" placeholder={`Search ${activeTab}...`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-2.5 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/80 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                  <th className="px-6 py-4">Transaction ID</th>
                  <th className="px-6 py-4">User Details</th>
                  <th className="px-6 py-4">Payment Method</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((txn) => (
                    <tr key={txn.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4 font-mono font-bold text-xs text-slate-400 group-hover:text-indigo-600 transition-colors">#{txn.id}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col"><span className="text-sm font-bold text-slate-800">{txn.user}</span><span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">ID: {txn.userId}</span></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg ${txn.method.includes('Bank') ? 'bg-slate-100' : 'bg-indigo-50'} text-indigo-600`}>{txn.method.includes('Bank') ? <Landmark size={14} /> : <CreditCard size={14} />}</div>
                          <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">{txn.method}</span>
                        </div>
                      </td>
                      <td className={`px-6 py-4 text-right font-black text-sm ${txn.type === 'deposit' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {txn.type === 'deposit' ? '+' : '-'}₹{txn.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${txn.status === 'success' ? 'bg-emerald-100 text-emerald-700' : txn.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                          {txn.status === 'success' && <CheckCircle size={10} />}{txn.status === 'pending' && <Clock size={10} />}{txn.status === 'failed' && <XCircle size={10} />}{txn.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => handleDeleteTransaction(txn.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"><Trash2 size={18} /></button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-32 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-6 text-slate-200"><Banknote size={40} /></div>
                        <h4 className="text-xl font-bold text-slate-800 mb-2">No Transactions Found</h4>
                        <p className="text-sm text-slate-500">Try adjusting your search or switching filters.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceScreen;