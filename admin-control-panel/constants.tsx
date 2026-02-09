
import React from 'react';
import {
  LayoutDashboard, Users, Store, Trophy, ListChecks,
  Wallet, PieChart, TrendingUp, CreditCard, Bell, Settings, ShieldCheck, LogOut
} from 'lucide-react';
import { Screen } from './types';

export const NAV_ITEMS = [
  { id: Screen.DASHBOARD, label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { id: Screen.USERS, label: 'User Management', icon: <Users size={20} /> },
  { id: Screen.MARKETS, label: 'Markets Control', icon: <Store size={20} /> },
  { id: Screen.RESULTS, label: 'Declare Results', icon: <Trophy size={20} /> },
  { id: Screen.BIDS, label: 'Bids Manager', icon: <TrendingUp size={20} /> },
  { id: Screen.DEPOSITS, label: 'Deposits', icon: <CreditCard size={20} /> },
  { id: Screen.WITHDRAWALS, label: 'Withdrawals', icon: <Wallet size={20} /> },
  { id: Screen.FINANCE, label: 'Finance', icon: <CreditCard size={20} /> },
  { id: Screen.NOTICES, label: 'Notices & Content', icon: <Bell size={20} /> },
  { id: Screen.SETTINGS, label: 'App Settings', icon: <Settings size={20} /> },
  { id: Screen.ROLES, label: 'Admin Roles', icon: <ShieldCheck size={20} /> },
];
