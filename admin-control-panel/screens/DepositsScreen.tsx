import React, { useState, useEffect } from 'react';
import { Search, CheckCircle, XCircle, Clock, FileText, Filter, RefreshCw, AlertCircle, Eye, ExternalLink } from 'lucide-react';
import { depositService } from '../services/api';

const DepositsScreen: React.FC = () => {
    const [deposits, setDeposits] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('pending');
    const [searchTerm, setSearchTerm] = useState('');
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [selectedDepositForReject, setSelectedDepositForReject] = useState<string | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    useEffect(() => {
        fetchDeposits();
    }, [statusFilter]);

    const fetchDeposits = async () => {
        try {
            setLoading(true);
            const data = await depositService.getDeposits(statusFilter === 'all' ? undefined : statusFilter);
            setDeposits(data);
        } catch (error) {
            console.error("Failed to fetch deposits", error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id: string) => {
        if (!confirm('Are you sure you want to approve this deposit? Wallet balance will be credited immediately.')) return;

        try {
            setProcessingId(id);
            await depositService.approveDeposit(id);
            fetchDeposits(); // Refresh list
        } catch (error) {
            alert('Failed to approve deposit');
            console.error(error);
        } finally {
            setProcessingId(null);
        }
    };

    const openRejectModal = (id: string) => {
        setSelectedDepositForReject(id);
        setRejectReason('');
        setRejectModalOpen(true);
    };

    const handleReject = async () => {
        if (!selectedDepositForReject || !rejectReason.trim()) return;

        try {
            setProcessingId(selectedDepositForReject);
            await depositService.rejectDeposit(selectedDepositForReject, rejectReason);
            setRejectModalOpen(false);
            fetchDeposits();
        } catch (error) {
            alert('Failed to reject deposit');
            console.error(error);
        } finally {
            setProcessingId(null);
            setSelectedDepositForReject(null);
        }
    };

    const filteredDeposits = deposits.filter(d =>
        d.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.utr.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Deposits</h1>
                    <p className="text-slate-500 text-sm mt-1">Manage user deposit requests manual payment verification</p>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                    <button
                        onClick={fetchDeposits}
                        className="p-2.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all border border-slate-200 hover:border-indigo-200"
                        title="Refresh"
                    >
                        <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
                    </button>
                </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-5">
                <div className="flex flex-col md:flex-row gap-4 justify-between">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search by User or UTR..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                        />
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                        {['pending', 'approved', 'rejected', 'all'].map(status => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`px-4 py-2 rounded-xl text-sm font-bold capitalize whitespace-nowrap transition-all ${statusFilter === status
                                    ? 'bg-slate-900 text-white shadow-md transform scale-105'
                                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                                    }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4">Amount</th>
                                <th className="px-6 py-4">Payment Info</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredDeposits.length > 0 ? (
                                filteredDeposits.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-900">{item.userName}</div>
                                            <div className="text-xs text-slate-500 font-mono mt-0.5">ID: {item.userId}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-bold text-emerald-600 text-lg">₹{item.amount.toLocaleString()}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">UTR</span>
                                                    <span className="font-mono text-slate-700 font-bold bg-slate-100 px-1.5 py-0.5 rounded text-xs select-all">
                                                        {item.utr}
                                                    </span>
                                                </div>
                                                {item.screenshotUrl && (
                                                    <button
                                                        onClick={() => setPreviewImage(item.screenshotUrl)}
                                                        className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium bg-transparent border-none p-0 cursor-pointer"
                                                    >
                                                        <Eye size={12} /> View Screenshot
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${item.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                                                item.status === 'rejected' ? 'bg-rose-100 text-rose-700' :
                                                    'bg-amber-100 text-amber-700'
                                                }`}>
                                                {item.status === 'approved' && <CheckCircle size={12} />}
                                                {item.status === 'rejected' && <XCircle size={12} />}
                                                {item.status === 'pending' && <Clock size={12} />}
                                                {item.status}
                                            </span>
                                            {item.adminRemark && (
                                                <div className="text-[10px] text-rose-500 mt-1 max-w-[150px] leading-tight">
                                                    Reason: {item.adminRemark}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            {item.requestDate}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {item.status === 'pending' && (
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => handleApprove(item.id)}
                                                        disabled={processingId === item.id}
                                                        className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm shadow-emerald-200 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1"
                                                    >
                                                        <CheckCircle size={14} /> Approve
                                                    </button>
                                                    <button
                                                        onClick={() => openRejectModal(item.id)}
                                                        disabled={processingId === item.id}
                                                        className="bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1"
                                                    >
                                                        <XCircle size={14} /> Reject
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                        <div className="flex flex-col items-center gap-3">
                                            <FileText size={32} className="opacity-20" />
                                            <span className="font-medium">No deposits found</span>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {rejectModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
                        <div className="p-6">
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Reject Deposit</h3>
                            <p className="text-sm text-slate-500 mb-4">Please provide a reason for rejecting this deposit request.</p>

                            <textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="Enter rejection reason (e.g., Invalid UTR, Payment not received)..."
                                className="w-full h-32 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none text-sm resize-none"
                            />
                        </div>
                        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                            <button
                                onClick={() => setRejectModalOpen(false)}
                                className="px-4 py-2 text-slate-600 font-bold text-sm hover:bg-slate-200 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReject}
                                disabled={!rejectReason.trim() || !!processingId}
                                className="px-6 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm rounded-lg shadow-sm shadow-rose-200 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {processingId ? 'Rejecting...' : 'Confirm Rejection'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {previewImage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm" onClick={() => setPreviewImage(null)}>
                    <div className="relative bg-transparent max-w-4xl max-h-[90vh] flex flex-col items-center" onClick={e => e.stopPropagation()}>
                        <img
                            src={previewImage}
                            alt="Deposit Screenshot"
                            className="max-w-full max-h-[85vh] rounded-lg shadow-2xl object-contain bg-white"
                        />
                        <button
                            onClick={() => setPreviewImage(null)}
                            className="mt-4 px-6 py-2 bg-white text-slate-900 font-bold rounded-full shadow-lg hover:bg-slate-100 transition-all flex items-center gap-2"
                        >
                            <XCircle size={20} /> Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DepositsScreen;
