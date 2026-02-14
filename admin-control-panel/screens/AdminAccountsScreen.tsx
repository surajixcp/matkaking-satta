
import React, { useState, useEffect } from 'react';
import {
    Users, Plus, Search, Shield, Phone, Key,
    ToggleLeft, ToggleRight, Trash2, X, CheckCircle2,
    AlertCircle, ChevronRight, UserPlus, MoreVertical
} from 'lucide-react';
import { rbacService } from '../services/api';
import { Role } from '../types';

interface AdminAccount {
    id: number;
    full_name: string;
    phone: string;
    role_id: number;
    status: 'active' | 'blocked';
    role?: { name: string };
    createdAt: string;
}

const AdminAccountsScreen: React.FC = () => {
    const [admins, setAdmins] = useState<AdminAccount[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Form State
    const [formMode, setFormMode] = useState<'create' | 'reset-pin'>('create');
    const [selectedAdminId, setSelectedAdminId] = useState<number | null>(null);
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [pin, setPin] = useState('');
    const [roleId, setRoleId] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [adminsData, rolesData] = await Promise.all([
                rbacService.getAdminAccounts(),
                rbacService.getRoles()
            ]);
            setAdmins(adminsData);
            setRoles(rolesData);
        } catch (error) {
            console.error("Failed to fetch admin accounts", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleStatus = async (admin: AdminAccount) => {
        const newStatus = admin.status === 'active' ? 'blocked' : 'active';
        try {
            await rbacService.updateAdminStatus(admin.id.toString(), newStatus);
            setAdmins(prev => prev.map(a => a.id === admin.id ? { ...a, status: newStatus } : a));
        } catch (error) {
            alert("Failed to update status");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (formMode === 'create') {
                const newAdmin = await rbacService.createAdminAccount({
                    full_name: fullName,
                    phone,
                    pin,
                    role_id: parseInt(roleId)
                });
                setAdmins(prev => [...prev, newAdmin]);
                alert("Admin account created successfully");
            } else {
                await rbacService.resetAdminPin(selectedAdminId!.toString(), pin);
                alert("PIN reset successfully");
            }
            setIsModalOpen(false);
            resetForm();
        } catch (error: any) {
            alert(error.response?.data?.error || "Operation failed");
        }
    };

    const resetForm = () => {
        setFullName('');
        setPhone('');
        setPin('');
        setRoleId('');
        setSelectedAdminId(null);
    };

    const filteredAdmins = admins.filter(a =>
        a.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.phone.includes(searchQuery) ||
        a.role?.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <Shield className="text-indigo-600" /> Administrative Accounts
                    </h2>
                    <p className="text-slate-500 text-sm font-medium">Manage system access for staff and moderators</p>
                </div>
                <button
                    onClick={() => { setFormMode('create'); resetForm(); setIsModalOpen(true); }}
                    className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-xl shadow-indigo-600/20 hover:bg-indigo-500 transition-all flex items-center justify-center gap-2"
                >
                    <UserPlus size={18} />
                    <span>Create New Admin</span>
                </button>
            </div>

            {/* Stats & Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by name, phone or role..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white border border-slate-200 pl-12 pr-4 py-3.5 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm"
                    />
                </div>
                <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-black uppercase">
                        {admins.length} Total
                    </div>
                    <div className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-black uppercase">
                        {admins.filter(a => a.status === 'active').length} Active
                    </div>
                </div>
            </div>

            {/* Admins Grid/Table */}
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Administrator</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Role & Permissions</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredAdmins.map((admin) => (
                                <tr key={admin.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 font-black text-xl border border-slate-200 group-hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:border-indigo-100 transition-all shadow-sm">
                                                {admin.full_name?.charAt(0) || 'A'}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 leading-tight">{admin.full_name || 'Admin'}</p>
                                                <p className="text-sm text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
                                                    <Phone size={12} className="text-slate-400" /> {admin.phone}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex flex-col gap-1">
                                            <span className="inline-flex items-center px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold w-fit border border-indigo-100/50">
                                                {admin.role?.name || 'No Role'}
                                            </span>
                                            <span className="text-[10px] text-slate-400 font-medium ml-1">
                                                Joined {new Date(admin.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <button
                                            onClick={() => handleToggleStatus(admin)}
                                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${admin.status === 'active'
                                                    ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                                    : 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                                                }`}
                                        >
                                            {admin.status === 'active' ? (
                                                <>
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                                    <span>Active</span>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                                                    <span>Blocked</span>
                                                </>
                                            )}
                                        </button>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => { setFormMode('reset-pin'); setSelectedAdminId(admin.id); setIsModalOpen(true); }}
                                                className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                                title="Reset PIN"
                                            >
                                                <Key size={18} />
                                            </button>
                                            <button className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredAdmins.length === 0 && (
                        <div className="px-8 py-20 text-center">
                            <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-4 border border-slate-100">
                                <Users size={32} className="text-slate-200" />
                            </div>
                            <p className="text-slate-400 font-black uppercase text-xs tracking-widest italic opacity-50">No administrators found</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal: Create/Reset PIN */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in" onClick={() => setIsModalOpen(false)}></div>
                    <div className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
                        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 leading-tight">
                                    {formMode === 'create' ? 'Register Administrator' : 'Reset Safety PIN'}
                                </h3>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">
                                    {formMode === 'create' ? 'Establish new system credentials' : 'Force credential update'}
                                </p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 text-slate-400 hover:text-slate-900 rounded-xl shadow-sm transition-all focus:ring-2 focus:ring-slate-100">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="p-8 space-y-5">
                                {formMode === 'create' && (
                                    <>
                                        <div>
                                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Full Identity</label>
                                            <div className="relative">
                                                <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                                <input
                                                    type="text"
                                                    required
                                                    value={fullName}
                                                    onChange={(e) => setFullName(e.target.value)}
                                                    className="w-full bg-slate-50 border border-slate-200 pl-11 pr-4 py-3.5 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold"
                                                    placeholder="Staff Name"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Contact Phone (10-Digit)</label>
                                            <div className="relative">
                                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                                <input
                                                    type="tel"
                                                    required
                                                    maxLength={10}
                                                    value={phone}
                                                    onChange={(e) => setPhone(e.target.value)}
                                                    className="w-full bg-slate-50 border border-slate-200 pl-11 pr-4 py-3.5 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold"
                                                    placeholder="9999999999"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Assigned Role</label>
                                            <select
                                                required
                                                value={roleId}
                                                onChange={(e) => setRoleId(e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-200 px-4 py-3.5 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold appearance-none"
                                            >
                                                <option value="">Select Responsibilities...</option>
                                                {roles.map(role => (
                                                    <option key={role.id} value={role.id}>{role.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </>
                                )}
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                                        {formMode === 'create' ? 'Initial PIN' : 'New Strategic PIN'}
                                    </label>
                                    <div className="relative">
                                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                        <input
                                            type="password"
                                            required
                                            value={pin}
                                            onChange={(e) => setPin(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 pl-11 pr-4 py-3.5 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold"
                                            placeholder="Secure Numeric PIN"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="p-8 bg-slate-50 border-t border-slate-100 flex flex-col gap-3">
                                <button
                                    type="submit"
                                    className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-indigo-600/20 hover:bg-indigo-500 transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest"
                                >
                                    {formMode === 'create' ? <UserPlus size={18} /> : <Key size={18} />}
                                    <span>{formMode === 'create' ? 'Authorize Account' : 'Confirm New PIN'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminAccountsScreen;
