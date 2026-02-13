import React, { useState, useMemo, useEffect } from 'react';
import {
  CheckCircle, XCircle, Clock, Search, Eye, Check, X,
  AlertCircle, Landmark, Banknote, Calendar, Filter,
  ArrowLeft, ChevronRight, Download, Trash2
} from 'lucide-react';
import { WithdrawalRequest } from '../types';
import { walletService } from '../services/api';

interface WithdrawalsScreenProps {
  withdrawals: WithdrawalRequest[];
  setWithdrawals: React.Dispatch<React.SetStateAction<WithdrawalRequest[]>>;
}

const ProcessWithdrawalModal: React.FC<{
  request: WithdrawalRequest | null;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
  readOnly?: boolean;
}> = ({ request, onClose, onApprove, onReject, readOnly = false }) => {
  const [reason, setReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);

  if (!request) return null;

  const handleApprove = async () => {
    setIsProcessing(true);
    await new Promise(r => setTimeout(r, 1200));
    onApprove(request.id);
    setIsProcessing(false);
    onClose();
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;
    setIsProcessing(true);
    await new Promise(r => setTimeout(r, 1200));
    onReject(request.id, reason);
    setIsProcessing(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}></div>
      <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
        <div className="p-3 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shadow ${readOnly ? (request.status === 'approved' ? 'bg-emerald-600' : 'bg-rose-600') : 'bg-indigo-600'} text-white`}>
              {readOnly ? (request.status === 'approved' ? <CheckCircle size={14} /> : <XCircle size={14} />) : <Banknote size={14} />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">{readOnly ? 'Details' : 'Payout'}</h3>
              <p className="text-[10px] text-slate-500 font-medium">#{request.id}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={16} /></button>
        </div>
        <div className="p-4 sm:p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          <div className={`flex justify-between items-center p-3 rounded-xl border ${readOnly ? (request.status === 'approved' ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100') : 'bg-indigo-50 border-indigo-100'}`}>
            <div>
              <p className={`text-[8px] font-black uppercase tracking-widest mb-0.5 ${readOnly ? (request.status === 'approved' ? 'text-emerald-600' : 'text-rose-600') : 'text-indigo-600'}`}>{readOnly ? `Status: ${request.status}` : 'Payable'}</p>
              <p className="text-xl font-black text-slate-900">₹{request.amount.toLocaleString()}</p>
            </div>
            <div className={`px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest ${request.method === 'UPI' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-white'}`}>{request.method}</div>
          </div>
          <div className="space-y-2">
            <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Landmark size={12} /> Beneficiary</h4>
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-2">
              <div className="flex justify-between"><span className="text-[10px] text-slate-500 font-medium">Name</span><span className="text-[10px] font-bold text-slate-800">{request.details.holderName}</span></div>
              {request.method === 'UPI' ? (<div className="flex justify-between"><span className="text-[10px] text-slate-500 font-medium">UPI</span><span className="text-[10px] font-bold text-indigo-600">{request.details.upiId}</span></div>) : (
                <>
                  <div className="flex justify-between"><span className="text-[10px] text-slate-500 font-medium">Bank</span><span className="text-[10px] font-bold text-slate-800">{request.details.bankName}</span></div>
                  <div className="flex justify-between"><span className="text-[10px] text-slate-500 font-medium">A/C No.</span><span className="text-[10px] font-mono font-bold text-slate-800 tracking-tight">{request.details.accountNo}</span></div>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="p-4 bg-slate-50 border-t border-slate-100">
          {readOnly ? (<button onClick={onClose} className="w-full bg-slate-900 text-white px-4 py-2 rounded-lg font-bold text-[10px] uppercase tracking-widest shadow-lg hover:bg-slate-800 transition-all">Close Receipt</button>) : !showRejectForm ? (
            <div className="flex gap-2">
              <button onClick={() => setShowRejectForm(true)} className="flex-1 bg-white border border-slate-200 text-slate-600 px-3 py-2 rounded-lg font-bold text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all">Reject</button>
              <button onClick={handleApprove} disabled={isProcessing} className="flex-[1.5] bg-emerald-600 text-white px-3 py-2 rounded-lg font-bold text-[10px] uppercase tracking-widest shadow-lg hover:bg-emerald-500 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50">{isProcessing ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <CheckCircle size={14} />}<span>Approve</span></button>
            </div>
          ) : (
            <div className="space-y-3">
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter rejection reason..."
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-rose-500"
                rows={3}
                autoFocus
              />
              <div className="flex gap-2">
                <button onClick={() => setShowRejectForm(false)} className="flex-1 bg-slate-200 text-slate-700 px-3 py-2 rounded-lg font-bold text-[10px] uppercase tracking-widest hover:bg-slate-300 transition-all">Back</button>
                <button onClick={handleRejectSubmit} disabled={isProcessing || !reason.trim()} className="flex-[2] bg-rose-600 text-white px-4 py-2 rounded-lg font-bold text-[10px] uppercase tracking-widest shadow-lg hover:bg-rose-500 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50">{isProcessing ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <XCircle size={14} />}<span>Confirm Reject</span></button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const WithdrawalsScreen: React.FC<WithdrawalsScreenProps> = () => {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [processingRequest, setProcessingRequest] = useState<WithdrawalRequest | null>(null);
  const [viewingRequest, setViewingRequest] = useState<WithdrawalRequest | null>(null);

  useEffect(() => {
    loadWithdrawals();
  }, []); // Reload on mount. Can also reload on activeTab change if backend supports filtering strictly

  const loadWithdrawals = async () => {
    try {
      const data = await walletService.getWithdrawals('all');
      setWithdrawals(data);
    } catch (error) {
      console.error("Failed to load withdrawals", error);
    }
  };

  const filteredWithdrawals = useMemo(() => {
    return withdrawals.filter(req => {
      const matchesTab = req.status === activeTab;
      const search = searchTerm.toLowerCase().trim();
      return matchesTab && (!search || req.userName.toLowerCase().includes(search) || req.id.toLowerCase().includes(search));
    });
  }, [activeTab, searchTerm, withdrawals]);

  const handleApprove = async (id: string) => {
    try {
      await walletService.approveWithdrawal(id);
      alert('Withdrawal Approved');
      loadWithdrawals();
    } catch (error: any) {
      console.error("Approval failed", error);
      alert('Failed to approve: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleReject = async (id: string, reason: string) => {
    console.log('[REJECT] Starting rejection for ID:', id, 'Reason:', reason);
    try {
      console.log('[REJECT] Calling API...');
      const response = await walletService.rejectWithdrawal(id, reason);
      console.log('[REJECT] API Response:', response);
      alert('Withdrawal Rejected - Check console for details');
      console.log('[REJECT] Reloading withdrawals...');
      await loadWithdrawals();
      console.log('[REJECT] Reload complete');
    } catch (error: any) {
      console.error("[REJECT] Error caught:", error);
      console.error("[REJECT] Error response:", error.response);
      alert('Failed to reject: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDeleteWithdrawal = (id: string) => {
    if (confirm("Permanently delete this withdrawal request from logs?")) {
      setWithdrawals(prev => prev.filter(w => w.id !== id));
    }
  };

  return (
    <div className="space-y-3 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-2.5 rounded-xl sm:rounded-2xl border border-slate-200">
        <div className="flex bg-slate-100 p-0.5 rounded-lg w-fit overflow-x-auto no-scrollbar">
          {(['pending', 'approved', 'rejected'] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`flex items-center space-x-1.5 px-3 py-1.5 text-[8px] sm:text-sm font-black uppercase tracking-widest rounded-md capitalize transition-all ${activeTab === tab ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
              <span>{tab}</span>
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-[140px] sm:max-w-md ml-auto sm:ml-0">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
          <input type="text" placeholder="Find..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-7 pr-2 py-1.5 text-[9px] sm:text-sm outline-none" />
        </div>
      </div>
      <div className="bg-white rounded-xl sm:rounded-3xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left min-w-[450px]">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[8px] sm:text-[10px] font-black uppercase tracking-widest">
                <th className="px-3 sm:px-6 py-2.5 sm:py-4">Beneficiary</th>
                <th className="px-3 sm:px-6 py-2.5 sm:py-4">Method</th>
                <th className="px-3 sm:px-6 py-2.5 sm:py-4 text-right">Amount</th>
                <th className="px-3 sm:px-6 py-2.5 sm:py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredWithdrawals.length > 0 ? (
                filteredWithdrawals.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-3 sm:px-6 py-2 sm:py-4"><div className="flex items-center space-x-2"><div className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg bg-slate-100 flex items-center justify-center font-black text-slate-400 text-[9px]">{req.userName.charAt(0)}</div><div><p className="text-[10px] sm:text-sm font-bold text-slate-800">{req.userName}</p><p className="text-[7px] text-slate-400 font-bold uppercase tracking-tighter">#{req.id}</p></div></div></td>
                    <td className="px-3 sm:px-6 py-2 sm:py-4"><span className={`text-[7px] sm:text-[10px] font-black px-1.5 py-0.5 rounded ${req.method === 'UPI' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-900 text-white'}`}>{req.method}</span></td>
                    <td className="px-3 sm:px-6 py-2 sm:py-4 text-right font-black text-slate-900 text-[10px] sm:text-base">₹{req.amount.toLocaleString()}</td>
                    <td className="px-3 sm:px-6 py-2 sm:py-4 text-right">
                      <div className="flex items-center justify-end space-x-0.5">
                        {req.status === 'pending' ? (<button onClick={() => setProcessingRequest(req)} className="bg-indigo-600 text-white px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest hover:bg-indigo-500">Pay</button>) : (<button onClick={() => setViewingRequest(req)} className="p-1 text-indigo-600 hover:bg-indigo-50 rounded"><Eye size={14} /></button>)}
                        <button onClick={() => handleDeleteWithdrawal(req.id)} className="p-1 text-rose-500 hover:bg-rose-50 rounded transition-all"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={5} className="px-3 py-24 text-center text-[9px] font-bold text-slate-400 uppercase tracking-widest">Empty</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <ProcessWithdrawalModal request={processingRequest} onClose={() => setProcessingRequest(null)} onApprove={handleApprove} onReject={handleReject} />
      <ProcessWithdrawalModal request={viewingRequest} onClose={() => setViewingRequest(null)} onApprove={() => { }} onReject={() => { }} readOnly />
    </div>
  );
};

export default WithdrawalsScreen;