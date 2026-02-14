import React, { useMemo } from 'react';
import {
  Users, TrendingUp, DollarSign, Clock,
  ArrowUpRight, ArrowDownRight, ExternalLink
} from 'lucide-react';
import {
  XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar
} from 'recharts';
import { Screen, UserData, Transaction } from '../types';
import { authService } from '../services/api';

interface DashboardProps {
  data: {
    stats: {
      totalUsers: number;
      marketBids: number;
      dailyRevenue: number;
      payoutRequests: number;
    };
    charts: {
      name: string;
      users: number;
      revenue: number;
    }[];
    recentActivity: any[];
  } | null;
  onNavigate: (screen: Screen) => void;
}

const StatCard = ({ title, value, icon, trend, trendValue, color, onClick }: any) => (
  <div
    onClick={onClick}
    className={`bg-white p-5 rounded-2xl border border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all hover:-translate-y-1 flex flex-col relative overflow-hidden group ${onClick ? 'cursor-pointer' : ''}`}
  >
    <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
      {React.cloneElement(icon as React.ReactElement<any>, { size: 64 })}
    </div>
    <div className="flex items-center justify-between mb-4">
      <div className={`p-2.5 rounded-xl shadow-sm ${color}`}>
        {React.cloneElement(icon as React.ReactElement<any>, { size: 20 })}
      </div>
      <div className={`flex items-center text-xs font-bold px-2 py-0.5 rounded-lg ${trend === 'up' ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'}`}>
        {trend === 'up' ? <ArrowUpRight size={14} className="mr-0.5" /> : <ArrowDownRight size={14} className="mr-0.5" />}
        <span>{trendValue}%</span>
      </div>
    </div>
    <div>
      <p className="text-sm text-slate-500 font-medium mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-slate-900 tracking-tight leading-none">{value}</h3>
    </div>
  </div>
);

const DashboardScreen: React.FC<DashboardProps> = ({ data, onNavigate }) => {
  const adminData = authService.getAdminData();
  const isSuper = adminData?.role === 'Super Admin';
  const perms = adminData?.permissions || {};

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const { stats, charts, recentActivity } = data;

  const canViewUsers = isSuper || perms['user_view'];
  const canManageMarkets = isSuper || perms['market_manage'] || perms['result_declare'];
  const canViewFinance = isSuper || perms['withdraw_approve'] || perms['deposit_approve'] || perms['settings_edit'];

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {canViewUsers && (
          <StatCard
            title="Total Users"
            value={stats.totalUsers.toLocaleString()}
            icon={<Users className="text-indigo-600" />}
            trend="up"
            trendValue="14.2"
            color="bg-indigo-50"
            onClick={() => onNavigate(Screen.USERS)}
          />
        )}
        {canManageMarkets && (
          <StatCard
            title="Market Bids"
            value={stats.marketBids.toLocaleString()}
            icon={<TrendingUp className="text-amber-600" />}
            trend="up"
            trendValue="6.5"
            color="bg-amber-50"
            onClick={() => onNavigate(Screen.BIDS)}
          />
        )}
        {canViewFinance && (
          <StatCard
            title="Daily Revenue"
            value={`₹${stats.dailyRevenue.toLocaleString()}`}
            icon={<DollarSign className="text-emerald-600" />}
            trend="down"
            trendValue="1.4"
            color="bg-emerald-50"
            onClick={() => onNavigate(Screen.FINANCE)}
          />
        )}
        {canViewFinance && (
          <StatCard
            title="Payout Requests"
            value={stats.payoutRequests}
            icon={<Clock className="text-rose-600" />}
            trend="up"
            trendValue="9.8"
            color="bg-rose-50"
            onClick={() => onNavigate(Screen.WITHDRAWALS)}
          />
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="text-lg font-bold text-slate-800 tracking-tight">Revenue Performance</h4>
              <p className="text-sm text-slate-400 font-medium">Weekly inflow visualization</p>
            </div>
            <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all" onClick={() => onNavigate(Screen.FINANCE)}>
              <ExternalLink size={18} />
            </button>
          </div>
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: '12px' }} />
                <Area type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="text-lg font-bold text-slate-800 tracking-tight">User Acquisition</h4>
              <p className="text-sm text-slate-400 font-medium">Daily account registration rate</p>
            </div>
            <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all" onClick={() => onNavigate(Screen.USERS)}>
              <ExternalLink size={18} />
            </button>
          </div>
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: '12px' }} />
                <Bar dataKey="users" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {canViewFinance && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h4 className="text-base font-bold text-slate-800 tracking-tight">Audit Trail Log</h4>
              <p className="text-xs text-slate-500 mt-0.5">Live monitoring feed</p>
            </div>
            <button
              onClick={() => onNavigate(Screen.FINANCE)}
              className="text-xs font-bold text-indigo-600 bg-indigo-50 px-4 py-2 rounded-lg hover:bg-indigo-100 transition-colors"
            >
              view all
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 text-slate-500 text-[11px] font-semibold border-b border-slate-100">
                  <th className="px-6 py-3">User Account</th>
                  <th className="px-6 py-3">Activity</th>
                  <th className="px-6 py-3 text-right">Points</th>
                  <th className="px-6 py-3 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentActivity.map((txn: any) => (
                  <tr key={txn.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-bold ring-1 ring-slate-200/50">
                          {txn.user.charAt(0)}
                        </div>
                        <div>
                          <span className="text-sm font-semibold text-slate-700 block leading-tight group-hover:text-indigo-600 transition-colors">{txn.user}</span>
                          <span className="text-[10px] text-slate-400 font-medium">#{txn.id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide border ${txn.type === 'deposit' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-slate-50 text-slate-500 border-slate-100'
                        }`}>{txn.type}</span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <span className={`text-sm font-bold ${txn.type === 'withdrawal' || txn.type === 'withdraw' ? 'text-rose-600' : txn.type === 'deposit' ? 'text-emerald-600' : 'text-slate-900'}`}>
                        {txn.type === 'withdrawal' || txn.type === 'withdraw' ? '-' : '+'}₹{txn.amount.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <span className="text-xs font-medium text-slate-400">{new Date(txn.date).toLocaleString()}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardScreen;