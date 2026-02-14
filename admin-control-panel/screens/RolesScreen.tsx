import React, { useState, useMemo, useEffect } from 'react';
import {
  ShieldCheck, Plus, Edit2, Lock, Trash2, CheckSquare,
  Square, Info, Save, X, AlertCircle, Search, Copy, RefreshCcw
} from 'lucide-react';
import { Role } from '../types';
import { rbacService } from '../services/api';

const PERMISSION_GROUPS = [
  {
    module: 'User Management',
    permissions: [
      { label: 'View Users', key: 'user_view' },
      { label: 'Edit User Info/Status', key: 'user_edit' },
      { label: 'Delete Users', key: 'user_delete' },
    ]
  },
  {
    module: 'Market & Games',
    permissions: [
      { label: 'Manage Markets', key: 'market_manage' },
      { label: 'Declare Results', key: 'result_declare' },
    ]
  },
  {
    module: 'Financials',
    permissions: [
      { label: 'Approve Withdrawals', key: 'withdraw_approve' },
      { label: 'Approve Deposits', key: 'deposit_approve' },
    ]
  },
  {
    module: 'System & RBAC',
    permissions: [
      { label: 'Edit System Settings', key: 'settings_edit' },
      { label: 'Manage Roles & Admins', key: 'rbac_manage' },
    ]
  },
];

const RolesScreen: React.FC<{ roles: Role[], setRoles: React.Dispatch<React.SetStateAction<Role[]>> }> = ({ roles, setRoles }) => {
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(roles[0]?.id || null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [roleNameInput, setRoleNameInput] = useState('');
  const [roleDescInput, setRoleDescInput] = useState('');
  const [permissionSearch, setPermissionSearch] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    setIsLoading(true);
    try {
      const data = await rbacService.getRoles();
      setRoles(data);
      if (data.length > 0 && !selectedRoleId) {
        setSelectedRoleId(data[0].id);
      }
    } catch (error) {
      console.error("Failed to fetch roles", error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedRole = useMemo(() => roles.find(r => r.id === selectedRoleId), [roles, selectedRoleId]);

  const handleTogglePermission = (permissionKey: string) => {
    setRoles(prev => prev.map(role => {
      if (role.id === selectedRoleId) {
        const permissions = { ...role.permissions };
        if (permissions[permissionKey]) {
          delete permissions[permissionKey];
        } else {
          permissions[permissionKey] = true;
        }
        return { ...role, permissions };
      }
      return role;
    }));
  };

  const handleToggleGroup = (groupPermissionKeys: string[]) => {
    if (!selectedRole) return;
    const allSelected = groupPermissionKeys.every(k => selectedRole.permissions[k]);
    setRoles(prev => prev.map(role => {
      if (role.id === selectedRoleId) {
        const permissions = { ...role.permissions };
        groupPermissionKeys.forEach(k => {
          if (allSelected) {
            delete permissions[k];
          } else {
            permissions[k] = true;
          }
        });
        return { ...role, permissions };
      }
      return role;
    }));
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleNameInput.trim()) return;

    try {
      if (modalMode === 'create') {
        const newRole = await rbacService.createRole({
          name: roleNameInput,
          description: roleDescInput,
          permissions: {}
        });
        setRoles(prev => [...prev, newRole]);
        setSelectedRoleId(newRole.id);
      } else {
        const updatedRole = await rbacService.updateRole(selectedRoleId!.toString(), {
          name: roleNameInput,
          description: roleDescInput
        });
        setRoles(prev => prev.map(r => r.id === selectedRoleId ? updatedRole : r));
      }
      setIsModalOpen(false); setRoleNameInput(''); setRoleDescInput('');
    } catch (error) {
      alert("Failed to save role");
    }
  };

  const handleDeleteRole = async (id: number) => {
    if (confirm("Permanently delete this admin role?")) {
      try {
        await rbacService.deleteRole(id.toString());
        const remaining = roles.filter(r => r.id !== id);
        setRoles(remaining);
        if (selectedRoleId === id) setSelectedRoleId(remaining[0]?.id || null);
      } catch (error: any) {
        alert(error.response?.data?.error || "Failed to delete role");
      }
    }
  };

  const handleDuplicateRole = async (role: Role) => {
    try {
      const duplicated = await rbacService.createRole({
        name: `${role.name} (Copy)`,
        description: role.description,
        permissions: role.permissions
      });
      setRoles(prev => [...prev, duplicated]);
      setSelectedRoleId(duplicated.id);
    } catch (error) {
      alert("Failed to duplicate role");
    }
  };

  const handleSavePermissions = async () => {
    if (!selectedRole) return;
    setIsSaving(true);
    try {
      await rbacService.updateRole(selectedRole.id.toString(), {
        permissions: selectedRole.permissions
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (error) {
      alert("Failed to save permissions");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredPermissionGroups = useMemo(() => {
    if (!permissionSearch.trim()) return PERMISSION_GROUPS;
    const search = permissionSearch.toLowerCase();
    return PERMISSION_GROUPS.map(group => ({
      ...group,
      permissions: group.permissions.filter(p =>
        p.label.toLowerCase().includes(search) || p.key.toLowerCase().includes(search)
      )
    })).filter(group => group.permissions.length > 0);
  }, [permissionSearch]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
      <div className="xl:col-span-1 space-y-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2"><ShieldCheck size={20} className="text-indigo-600" /><h3 className="text-lg font-bold text-slate-900">Admin Roles</h3></div>
          <button onClick={() => { setModalMode('create'); setRoleNameInput(''); setRoleDescInput(''); setIsModalOpen(true); }} className="p-2 text-indigo-600 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors shadow-sm"><Plus size={20} /></button>
        </div>
        <div className="space-y-3">
          {roles.map((role) => (
            <div key={role.id} onClick={() => setSelectedRoleId(role.id)} className={`p-4 rounded-2xl border transition-all cursor-pointer relative group ${selectedRoleId === role.id ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl' : 'bg-white border-slate-200 text-slate-800 hover:border-indigo-300'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[10px] font-bold uppercase tracking-widest ${selectedRoleId === role.id ? 'text-indigo-200' : 'text-slate-400'}`}>
                  {(role as any).admins?.[0]?.count || 0} Admins Assigned
                </span>
                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={(e) => { e.stopPropagation(); handleDuplicateRole(role); }} className={`p-1.5 rounded-md ${selectedRoleId === role.id ? 'hover:bg-indigo-500' : 'hover:bg-slate-100'}`}><Copy size={14} /></button>
                  <button onClick={(e) => { e.stopPropagation(); setModalMode('edit'); setRoleNameInput(role.name); setRoleDescInput(role.description); setIsModalOpen(true); }} className={`p-1.5 rounded-md ${selectedRoleId === role.id ? 'hover:bg-indigo-500' : 'hover:bg-slate-100'}`}><Edit2 size={14} /></button>
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteRole(role.id); }} className={`p-1.5 rounded-md ${selectedRoleId === role.id ? 'hover:bg-rose-500 text-rose-100' : 'hover:bg-rose-50 text-rose-500'}`}><Trash2 size={14} /></button>
                </div>
              </div>
              <h4 className="font-bold text-lg mb-1">{role.name}</h4>
              <p className={`text-xs ${selectedRoleId === role.id ? 'text-indigo-100' : 'text-slate-500'} line-clamp-1`}>{role.description}</p>
            </div>
          ))}
          {roles.length === 0 && <p className="text-center text-slate-400 text-sm py-8">No roles found</p>}
        </div>
      </div>
      <div className="xl:col-span-3">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[600px]">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between bg-slate-50/50 gap-4">
            <div className="flex items-center gap-3"><div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg"><Lock size={20} /></div><div><h3 className="text-lg font-bold text-slate-900">Manage Permissions</h3><p className="text-xs text-slate-500 font-medium">Configuring: <span className="text-indigo-600 font-bold">{selectedRole?.name}</span></p></div></div>
            <div className="flex items-center gap-2"><div className="relative w-full sm:w-64"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} /><input type="text" placeholder="Filter..." value={permissionSearch} onChange={(e) => setPermissionSearch(e.target.value)} className="w-full bg-white border border-slate-200 pl-10 pr-4 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/10" /></div><button onClick={handleSavePermissions} disabled={isSaving} className={`${saveSuccess ? 'bg-emerald-600' : 'bg-indigo-600'} text-white px-8 py-2.5 rounded-xl font-bold text-sm shadow-lg hover:opacity-90 transition-all flex items-center gap-2`}>{isSaving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : saveSuccess ? <><CheckSquare size={16} /><span>Saved!</span></> : <><Save size={16} /><span>Save</span></>}</button></div>
          </div>
          <div className="p-8 flex-1 overflow-y-auto max-h-[70vh]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {filteredPermissionGroups.map((group, i) => {
                const isAllSelected = group.permissions.every(p => selectedRole?.permissions[p.key]);
                return (
                  <div key={i} className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex items-center justify-between cursor-pointer group/header" onClick={() => handleToggleGroup(group.permissions.map(p => p.key))}><h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest border-l-4 border-indigo-600 pl-3">{group.module}</h4><div className="text-xs font-bold text-slate-400">{isAllSelected ? 'Deselect All' : 'Select All'}</div></div>
                    <div className="space-y-1.5 pl-4 border-l border-slate-100 ml-1">
                      {group.permissions.map((perm, pi) => {
                        const isChecked = selectedRole?.permissions[perm.key];
                        return (
                          <label key={pi} className={`flex items-center p-3 rounded-xl transition-all cursor-pointer ${isChecked ? 'bg-indigo-50/50' : 'hover:bg-slate-50'}`}><input type="checkbox" checked={isChecked} onChange={() => handleTogglePermission(perm.key)} className="sr-only" /><div className={`mr-4 ${isChecked ? 'text-indigo-600' : 'text-slate-300'}`}>{isChecked ? <CheckSquare size={22} fill="currentColor" className="text-indigo-600 fill-white" /> : <Square size={22} />}</div><span className="text-sm font-semibold">{perm.label}</span></label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-center gap-6 text-xs text-slate-500 font-medium"><div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-indigo-500"></div><span>Real-time sync</span></div><button onClick={() => window.location.reload()} className="text-rose-500 hover:text-rose-600 flex items-center gap-1.5"><RefreshCcw size={14} /><span>Reset</span></button></div>
        </div>
      </div>
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50"><h3 className="text-lg font-bold text-slate-900">{modalMode === 'create' ? 'Create New Role' : 'Edit Role'}</h3><button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button></div>
            <form onSubmit={handleSaveRole}>
              <div className="p-6 space-y-4">
                <div><label className="block text-sm font-bold text-slate-700 mb-2">Role Name</label><input type="text" autoFocus required value={roleNameInput} onChange={(e) => setRoleNameInput(e.target.value)} className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20" /></div>
                <div><label className="block text-sm font-bold text-slate-700 mb-2">Description</label><textarea value={roleDescInput} onChange={(e) => setRoleDescInput(e.target.value)} rows={3} className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20" /></div>
              </div>
              <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3"><button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 text-sm font-bold text-slate-600">Cancel</button><button type="submit" className="bg-indigo-600 text-white px-8 py-2.5 rounded-xl font-bold text-sm shadow-lg hover:bg-indigo-500 transition-all active:scale-95">{modalMode === 'create' ? 'Create Role' : 'Update Role'}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RolesScreen;
