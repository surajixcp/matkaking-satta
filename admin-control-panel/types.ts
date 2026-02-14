export enum Screen {
  LOGIN = 'login',
  DASHBOARD = 'dashboard',
  USERS = 'users',
  USER_PROFILE = 'user_profile',
  MARKETS = 'markets',
  RESULTS = 'results',
  BIDS = 'bids',
  WITHDRAWALS = 'withdrawals',
  FINANCE = 'finance',
  NOTICES = 'notices',
  SETTINGS = 'settings',
  ROLES = 'roles',
  DEPOSITS = 'deposits',
  REFERRALS = 'referrals',
  ADMIN_ACCOUNTS = 'admin_accounts'
}

export interface ReferralSetting {
  id: number;
  bonus_amount: string;
  min_deposit_amount: string;
  is_enabled: boolean;
}

export interface UserData {
  id: string;
  name: string;
  phone: string;
  balance: number;
  status: 'active' | 'blocked';
  joinedAt: string;
  bank_name?: string;
  account_number?: string;
  ifsc_code?: string;
  account_holder_name?: string;
  upi_id?: string;
}

export interface Market {
  id: string;
  name: string;
  openTime: string;
  closeTime: string;
  status: 'Open' | 'Closed' | 'Suspended';
  type: 'starline' | 'jackpot';
}

export interface Transaction {
  id: string;
  user: string;
  userId: string;
  type: 'deposit' | 'withdrawal' | 'bet';
  amount: number;
  date: string;
  status: 'success' | 'pending' | 'failed';
  method: string;
}

export interface Notice {
  id: string;
  title: string;
  message: string;
  date: string;
  active: boolean;
}

export interface DeclaredResult {
  id: string;
  game: string;
  session: 'Open' | 'Close';
  panna: string;
  single: string;
  declaredBy: string;
  timestamp: string;
}

export interface Role {
  id: number;
  name: string;
  description: string;
  permissions: Record<string, boolean>;
  admins?: { count: number }[]; // From the group join
}

export interface WithdrawalRequest {
  id: string;
  userName: string;
  userId: string;
  amount: number;
  method: 'UPI' | 'Bank Transfer';
  details: {
    upiId?: string;
    bankName?: string;
    accountNo?: string;
    ifsc?: string;
    holderName: string;
  };
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  processedAt?: string;
}

export interface Bid {
  id: string;
  userName: string;
  userId: string;
  gameName: string;
  marketType: string;
  session: 'OPEN' | 'CLOSE';
  digits: string;
  amount: number;
  multiplier: number;
  timestamp: string;
  date: string;
}