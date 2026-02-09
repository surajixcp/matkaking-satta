import React, { useState, useMemo, useEffect } from 'react';
import { Filter, Search, Eye, X, Calendar, Hash, User, TrendingUp, Clock, Info, ChevronRight, AlertCircle, Trash2 } from 'lucide-react';
import { Bid } from '../types';
import { bidsService } from '../services/api';

interface BidsScreenProps { }

const BidDetailModal: React.FC<{ bid: Bid | null; onClose: () => void }> = ({ bid, onClose }) => {
  if (!bid) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}></div>
      <div className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600/10 text-indigo-600 rounded-xl flex items-center justify-center">
              <Hash size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Bid Details</h3>
              <p className="text-xs text-slate-500 font-medium font-mono mt-0.5">REF: {bid.id}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-slate-200/50 rounded-lg">
            <X size={20} />
          </button>
        </div>
        <div className="p-8 space-y-8">
          <div className="flex items-center justify-between bg-gradient-to-br from-indigo-50 to-white p-6 rounded-2xl border border-indigo-100">
            <div className="text-center flex-1">
              <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Played Digits</p>
              <p className="text-4xl font-black text-slate-900 font-mono tracking-tighter">{bid.digits}</p>
            </div>
            <div className="h-10 w-[1px] bg-indigo-100 mx-6"></div>
            <div className="text-center flex-1">
              <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Potential Win</p>
              <p className="text-2xl font-black text-emerald-600">₹{(bid.amount * bid.multiplier).toLocaleString()}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-y-6 gap-x-12">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-slate-400"><User size={14} /><span className="text-[10px] font-bold uppercase tracking-wider">User Account</span></div>
              <p className="text-sm font-bold text-slate-800">{bid.userName}</p>
              <p className="text-xs text-slate-500 font-medium">ID: {bid.userId}</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-slate-400"><TrendingUp size={14} /><span className="text-[10px] font-bold uppercase tracking-wider">Investment</span></div>
              <p className="text-sm font-bold text-slate-800">₹{bid.amount.toLocaleString()}</p>
              <p className="text-xs text-slate-500 font-medium">Rate: {bid.multiplier}x</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-slate-400"><Info size={14} /><span className="text-[10px] font-bold uppercase tracking-wider">Game Info</span></div>
              <p className="text-sm font-bold text-slate-800">{bid.gameName}</p>
              <p className="text-xs text-slate-500 font-medium">{bid.marketType} • {bid.session}</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-slate-400"><Clock size={14} /><span className="text-[10px] font-bold uppercase tracking-wider">Time</span></div>
              <p className="text-sm font-bold text-slate-800">{bid.timestamp}</p>
              <p className="text-xs text-slate-500 font-medium">{bid.date}</p>
            </div>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl flex gap-3 items-start border border-slate-100">
            <AlertCircle size={18} className="text-indigo-600 shrink-0" />
            <p className="text-xs leading-relaxed text-slate-500 font-medium">This bid is active. Payout is automatically credited to the user's wallet if the declared result matches the played number.</p>
          </div>
        </div>
        <div className="p-5 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button onClick={onClose} className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-6 py-2 rounded-xl font-bold text-sm shadow-sm transition-all">Close</button>
        </div>
      </div>
    </div>
  );
};

const BidsScreen: React.FC<BidsScreenProps> = () => {
  const [bids, setBids] = useState<Bid[]>([]);
  const [filterGame, setFilterGame] = useState('All Games');
  const [filterType, setFilterType] = useState('All Types');
  const [filterDate, setFilterDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBid, setSelectedBid] = useState<Bid | null>(null);

  useEffect(() => {
    loadBids();
  }, [filterDate]); // Reload if specific date filter is applied from server? Or just load all.

  const loadBids = async () => {
    try {
      const data = await bidsService.getAllBids({ date: filterDate || undefined });
      setBids(data);
    } catch (error) {
      console.error("Failed to load bids", error);
    }
  };

  const gamesList = useMemo(() => Array.from(new Set(bids.map(b => b.gameName))), [bids]);
  const typesList = ['Single Digit', 'Jodi', 'Single Panna', 'Double Panna', 'Triple Panna'];

  const filteredBids = useMemo(() => {
    return bids.filter(bid => {
      const matchesGame = filterGame === 'All Games' || bid.gameName === filterGame;
      const matchesType = filterType === 'All Types' || bid.marketType === filterType;
      // const matchesDate = !filterDate || bid.date === filterDate; // Date filtering done via API now IF filterDate is set
      const matchesSearch = !searchTerm ||
        bid.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bid.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bid.digits.includes(searchTerm);
      return matchesGame && matchesType && matchesSearch;
    });
  }, [filterGame, filterType, searchTerm, bids]);

  const handleDeleteBid = (id: string) => {
    if (confirm("Permanently delete this bid entry? This action is irreversible and should only be used to clear invalid data.")) {
      setBids(prev => prev.filter(b => b.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-end gap-5">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-semibold text-slate-500 mb-1.5 ml-1">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="User, ID or Digits..." className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all placeholder:text-slate-400" />
          </div>
        </div>
        <div className="flex-1 min-w-[160px]">
          <label className="block text-xs font-semibold text-slate-500 mb-1.5 ml-1">Game</label>
          <select value={filterGame} onChange={(e) => setFilterGame(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none cursor-pointer transition-all">
            <option>All Games</option>{gamesList.map(game => <option key={game} value={game}>{game}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[160px]">
          <label className="block text-xs font-semibold text-slate-500 mb-1.5 ml-1">Type</label>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none cursor-pointer transition-all">
            <option>All Types</option>{typesList.map(type => <option key={type} value={type}>{type}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[160px]">
          <label className="block text-xs font-semibold text-slate-500 mb-1.5 ml-1">Date</label>
          <div className="relative"><Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} /><input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all text-slate-600" /></div>
        </div>
        <button onClick={() => { setFilterGame('All Games'); setFilterType('All Types'); setFilterDate(''); setSearchTerm(''); }} className="bg-slate-100 text-slate-600 px-5 py-2 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-200 transition-all active:scale-95 h-[42px]"><Filter size={16} /><span>Reset</span></button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs font-semibold border-b border-slate-100">
                <th className="px-6 py-3">User</th>
                <th className="px-6 py-3">Market Info</th>
                <th className="px-6 py-3">Digits</th>
                <th className="px-6 py-3 text-right">Amnt</th>
                <th className="px-6 py-3 text-right">Pot. Win</th>
                <th className="px-6 py-3 text-right">Opts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {filteredBids.length > 0 ? (
                filteredBids.map((bid) => (
                  <tr key={bid.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-3.5">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800">{bid.userName}</span>
                        <span className="text-[10px] text-slate-400 font-medium">#{bid.userId}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-700">{bid.gameName}</span>
                        <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-wide">{bid.marketType}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 font-mono font-bold text-slate-900 tracking-tight">{bid.digits}</td>
                    <td className="px-6 py-3.5 text-right font-medium text-slate-600">₹{bid.amount.toLocaleString()}</td>
                    <td className="px-6 py-3.5 text-right font-bold text-emerald-600">₹{(bid.amount * bid.multiplier).toLocaleString()}</td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="flex items-center justify-end space-x-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setSelectedBid(bid)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="View Details"><Eye size={16} /></button>
                        <button onClick={() => handleDeleteBid(bid.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-all" title="Delete Bid"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={6} className="px-6 py-24 text-center"><p className="text-sm font-medium text-slate-400">No matching bids found</p></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <BidDetailModal bid={selectedBid} onClose={() => setSelectedBid(null)} />
    </div>
  );
};

export default BidsScreen;