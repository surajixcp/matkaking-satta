
import React from 'react';
import {
  LayoutDashboard, Users, Store, Trophy, ListChecks,
  Wallet, PieChart, TrendingUp, CreditCard, Bell, Settings, ShieldCheck, LogOut, Gift
} from 'lucide-react';
import { Screen } from './types';

export const NAV_ITEMS = [
  { id: Screen.DASHBOARD, label: 'Dashboard', icon: <LayoutDashboard size={20} />, permission: 'user_view' },
  { id: Screen.USERS, label: 'User Management', icon: <Users size={20} />, permission: 'user_view' },
  { id: Screen.MARKETS, label: 'Markets Control', icon: <Store size={20} />, permission: 'market_manage' },
  { id: Screen.RESULTS, label: 'Declare Results', icon: <Trophy size={20} />, permission: 'result_declare' },
  { id: Screen.BIDS, label: 'Bids Manager', icon: <TrendingUp size={20} />, permission: 'result_declare' },
  { id: Screen.DEPOSITS, label: 'Deposits', icon: <CreditCard size={20} />, permission: 'deposit_approve' },
  { id: Screen.WITHDRAWALS, label: 'Withdrawals', icon: <Wallet size={20} />, permission: 'withdraw_approve' },
  { id: Screen.FINANCE, label: 'Finance', icon: <CreditCard size={20} />, permission: 'settings_edit' },
  { id: Screen.REFERRALS, label: 'Referral System', icon: <Gift size={20} />, permission: 'settings_edit' },
  { id: Screen.NOTICES, label: 'Notices & Content', icon: <Bell size={20} />, permission: 'settings_edit' },
  { id: Screen.SETTINGS, label: 'App Settings', icon: <Settings size={20} />, permission: 'settings_edit' },
  { id: Screen.ROLES, label: 'Admin Roles', icon: <ShieldCheck size={20} />, permission: 'rbac_manage' },
  { id: Screen.ADMIN_ACCOUNTS, label: 'Admin Accounts', icon: <Users size={20} />, permission: 'rbac_manage' },
];
