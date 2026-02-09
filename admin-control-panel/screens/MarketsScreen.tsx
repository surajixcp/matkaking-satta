import React, { useState, useMemo } from 'react';
import { Plus, Edit2, Power, Trash2, X, Clock, AlertCircle, Save, PowerOff } from 'lucide-react';
import { Market } from '../types';
import { marketService } from '../services/api';

interface MarketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (market: Partial<Market>) => void;
  editData: Market | null;
  marketType: 'starline' | 'jackpot';
}

const MarketModal: React.FC<MarketModalProps> = ({ isOpen, onClose, onSave, editData, marketType }) => {
  const [formData, setFormData] = useState<Partial<Market>>({
    name: '',
    openTime: '09:00',
    closeTime: '22:00',
    status: 'Open',
    type: marketType
  });

  React.useEffect(() => {
    if (editData) setFormData(editData);
    else setFormData({ name: '', openTime: '09:00', closeTime: '22:00', status: 'Open', type: marketType });
  }, [editData, marketType, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}></div>
      <div className="relative bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in zoom-in duration-200 transform scale-100">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">
            {editData ? 'Configure Market' : 'Create New Market'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors bg-slate-50 hover:bg-slate-100 p-1.5 rounded-lg"><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Market Name</label>
              <input type="text" required autoFocus value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. SUPER KALYAN" className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm font-semibold text-slate-800 placeholder:font-normal" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Open Time</label>
                <div className="relative">
                  <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="time" value={formData.openTime} onChange={(e) => setFormData({ ...formData, openTime: e.target.value })} className="w-full bg-slate-50 border border-slate-200 pl-9 pr-3 py-2 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-indigo-500/20 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Close Time</label>
                <div className="relative">
                  <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="time" value={formData.closeTime} onChange={(e) => setFormData({ ...formData, closeTime: e.target.value })} className="w-full bg-slate-50 border border-slate-200 pl-9 pr-3 py-2 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-indigo-500/20 outline-none" />
                </div>
              </div>
            </div>
          </div>
          <div className="p-5 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 transition-colors">Cancel</button>
            <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold text-xs shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition-all active:scale-95">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const MarketsScreen: React.FC<{ markets: Market[], setMarkets: React.Dispatch<React.SetStateAction<Market[]>> }> = ({ markets, setMarkets }) => {
  const [activeMarketType, setActiveMarketType] = useState<'starline' | 'jackpot'>('starline');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMarket, setEditingMarket] = useState<Market | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const filteredMarkets = useMemo(() => markets.filter(m => m.type === activeMarketType), [markets, activeMarketType]);

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const h = parseInt(hours, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
  };

  const handleSaveMarket = async (data: Partial<Market>) => {
    // ... (keep handleSaveMarket implementation)
    setIsLoading(true);
    try {
      if (editingMarket) {
        const updated = await marketService.updateMarket(editingMarket.id, data);
        setMarkets(prev => prev.map(m => m.id === editingMarket.id ? updated : m));
      } else {
        const newMarket = await marketService.createMarket({ ...data, type: activeMarketType });
        setMarkets(prev => [...prev, newMarket]);
      }
      setIsModalOpen(false);
      setEditingMarket(null);
    } catch (error) {
      console.error("Failed to save market", error);
      alert("Failed to save market");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMarket = async (id: string) => {
    // ... (keep handleDeleteMarket implementation)
    if (window.confirm("Are you sure you want to delete this market configuration?")) {
      try {
        await marketService.deleteMarket(id);
        setMarkets(prev => prev.filter(m => m.id !== id));
      } catch (error) {
        console.error("Failed to delete market", error);
        alert("Failed to delete market");
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        {/* ... (keep existing JSX) */}
        <div className="flex bg-slate-100 p-1 rounded-xl">
          {(['starline', 'jackpot'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveMarketType(t)}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all capitalize ${activeMarketType === t ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >{t}</button>
          ))}
        </div>
        <button onClick={() => { setEditingMarket(null); setIsModalOpen(true); }} className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-500 text-xs shadow-lg shadow-indigo-600/20 transition-all active:scale-95">
          <Plus size={14} /> <span>New Market</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs font-semibold border-b border-slate-100">
                <th className="px-6 py-3">Market Name</th>
                <th className="px-6 py-3">Timings</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {filteredMarkets.length > 0 ? (
                filteredMarkets.map((market) => (
                  <tr key={market.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-3.5">
                      <p className="font-bold text-slate-800">{market.name}</p>
                      <p className="text-[10px] text-slate-400 font-medium">ID: {market.id}</p>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2 text-xs font-medium">
                        <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md border border-emerald-100">{formatTime(market.openTime)}</span>
                        <span className="text-slate-300">→</span>
                        <span className="bg-rose-50 text-rose-700 px-2 py-0.5 rounded-md border border-rose-100">{formatTime(market.closeTime)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="flex items-center justify-end space-x-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setEditingMarket(market); setIsModalOpen(true); }} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Edit2 size={16} /></button>
                        <button onClick={() => handleDeleteMarket(market.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={3} className="px-6 py-12 text-center text-sm font-medium text-slate-400">No active markets found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <MarketModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingMarket(null); }} onSave={handleSaveMarket} editData={editingMarket} marketType={activeMarketType} />
    </div>
  );
};

export default MarketsScreen;