
import React, { useState } from 'react';
import {
  BellRing, Plus, Send, Trash2, X, Save,
  CheckCircle, Clock, Edit2, Megaphone
} from 'lucide-react';
import { Notice } from '../types';

const NoticeModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (notice: Omit<Notice, 'id' | 'date'>) => void;
  editData?: Notice | null;
}> = ({ isOpen, onClose, onSave, editData }) => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [isActive, setIsActive] = useState(true);

  React.useEffect(() => {
    if (editData) {
      setTitle(editData.title);
      setMessage(editData.message);
      setIsActive(editData.active);
    } else {
      setTitle(''); setMessage(''); setIsActive(true);
    }
  }, [editData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;
    onSave({ title, message, active: isActive });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}></div>
      <div className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg"><Megaphone size={20} /></div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">{editData ? 'Edit Announcement' : 'New Notice'}</h3>
              <p className="text-xs text-slate-500 font-medium">Broadcast to all mobile users</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-8 space-y-6">
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Notice Title</label>
              <input autoFocus type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Server Maintenance" className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500/20 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Message Content</label>
              <textarea required rows={4} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type announcement details..." className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-sm font-medium text-slate-600 resize-none outline-none focus:ring-2 focus:ring-indigo-500/20" />
            </div>
            <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isActive ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}>{isActive ? <CheckCircle size={20} /> : <Clock size={20} />}</div>
                <div><p className="text-sm font-bold text-slate-800">Publish Now</p><p className="text-[10px] text-slate-500 font-medium">Visible instantly on app home</p></div>
              </div>
              <button type="button" onClick={() => setIsActive(!isActive)} className={`w-12 h-6 rounded-full relative transition-all duration-300 ${isActive ? 'bg-indigo-600' : 'bg-slate-300'}`}><div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${isActive ? 'left-7' : 'left-1'}`}></div></button>
            </div>
          </div>
          <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all">Cancel</button>
            <button type="submit" className="bg-indigo-600 text-white px-8 py-2.5 rounded-xl font-bold text-sm shadow-lg hover:bg-indigo-500 flex items-center gap-2 transition-all active:scale-95"><Save size={18} /><span>{editData ? 'Update' : 'Post'}</span></button>
          </div>
        </form>
      </div>
    </div>
  );
};

import { noticeService } from '../services/api';

const NoticesScreen: React.FC<{ notices: Notice[], setNotices: React.Dispatch<React.SetStateAction<Notice[]>> }> = ({ notices, setNotices }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAddOrUpdateNotice = async (data: Omit<Notice, 'id' | 'date'>) => {
    setLoading(true);
    try {
      if (editingNotice) {
        const updated = await noticeService.update(editingNotice.id, data);
        setNotices(prev => prev.map(n => n.id === editingNotice.id ? { ...updated, date: new Date(updated.createdAt).toLocaleDateString() } : n));
      } else {
        const newNotice = await noticeService.create(data);
        // Ensure date format matches UI expectation if needed, or rely on API return
        setNotices(prev => [{ ...newNotice, date: new Date(newNotice.createdAt).toLocaleDateString() }, ...prev]);
      }
      setIsModalOpen(false);
      setEditingNotice(null);
    } catch (error) {
      console.error('Failed to save notice', error);
      alert('Failed to save notice');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNotice = async (id: string) => {
    if (confirm('Permanently delete this announcement? It will be removed from all user devices immediately.')) {
      try {
        await noticeService.delete(id);
        setNotices(prev => prev.filter(n => n.id !== id));
      } catch (error) {
        console.error('Failed to delete notice', error);
        alert('Failed to delete notice');
      }
    }
  };

  const handleToggleActive = async (id: string) => {
    const notice = notices.find(n => n.id === id);
    if (!notice) return;

    try {
      const updated = await noticeService.update(id, { active: !notice.active });
      setNotices(prev => prev.map(n => n.id === id ? { ...n, active: updated.active } : n));
    } catch (error) {
      console.error('Failed to toggle notice', error);
      alert('Failed to update status');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div><h3 className="text-2xl font-black text-slate-900 tracking-tight">System Announcements</h3><p className="text-sm text-slate-500 font-medium">Control live content displayed on user applications</p></div>
        <button onClick={() => { setEditingNotice(null); setIsModalOpen(true); }} className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/20 active:scale-95"><Plus size={20} /><span>Post New Notice</span></button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {notices.map((notice) => (
          <div key={notice.id} className={`bg-white p-6 rounded-3xl border transition-all duration-300 group hover:shadow-xl ${notice.active ? 'border-slate-200' : 'border-slate-100 opacity-75 grayscale-[0.5]'}`}>
            <div className="flex items-start justify-between mb-6">
              <div className={`p-3 rounded-2xl shadow-sm ${notice.active ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-400'}`}><BellRing size={24} /></div>
              <button onClick={() => handleToggleActive(notice.id)} className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border transition-all ${notice.active ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>{notice.active ? 'Active' : 'Draft'}</button>
            </div>
            <h4 className="text-lg font-black text-slate-800 mb-2 leading-tight group-hover:text-indigo-600 transition-colors">{notice.title}</h4>
            <p className="text-sm text-slate-500 mb-8 leading-relaxed font-medium line-clamp-3">{notice.message}</p>
            <div className="flex items-center justify-between pt-5 border-t border-slate-50">
              <div className="flex items-center gap-2 text-slate-400"><Clock size={14} /><span className="text-[10px] font-bold uppercase tracking-widest">{notice.date || 'Just now'}</span></div>
              <div className="flex items-center gap-1">
                <button onClick={() => { setEditingNotice(notice); setIsModalOpen(true); }} className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all" title="Edit"><Edit2 size={18} /></button>
                <button onClick={() => handleDeleteNotice(notice.id)} className="p-2.5 text-rose-500 hover:bg-rose-50 rounded-xl transition-all" title="Delete Announcement"><Trash2 size={18} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <NoticeModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingNotice(null); }} onSave={handleAddOrUpdateNotice} editData={editingNotice} />
    </div>
  );
};

export default NoticesScreen;
