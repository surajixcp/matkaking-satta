
import React, { useState } from 'react';
import { Screen, UserData, Transaction, Market, Notice, DeclaredResult, Role, WithdrawalRequest, Bid } from './types';
import LoginScreen from './screens/LoginScreen';
import DashboardScreen from './screens/DashboardScreen';
import UsersScreen from './screens/UsersScreen';
import MarketsScreen from './screens/MarketsScreen';
import ResultsScreen from './screens/ResultsScreen';
import BidsScreen from './screens/BidsScreen';
import DepositsScreen from './screens/DepositsScreen';
import WithdrawalsScreen from './screens/WithdrawalsScreen';
import FinanceScreen from './screens/FinanceScreen';
import NoticesScreen from './screens/NoticesScreen';
import SettingsScreen from './screens/SettingsScreen';
import RolesScreen from './screens/RolesScreen';
import UserProfileScreen from './screens/UserProfileScreen';
import ReferralScreen from './screens/ReferralScreen';
import AdminAccountsScreen from './screens/AdminAccountsScreen';
import Layout from './components/Layout';
import { authService, dashboardService, userService, marketService, resultService, noticeService } from './services/api';
import { useEffect } from 'react';
// Initial Data
const INITIAL_NOTICES: Notice[] = [];
const INITIAL_RESULTS: DeclaredResult[] = [];
const INITIAL_ROLES: Role[] = [];
const INITIAL_WITHDRAWALS: WithdrawalRequest[] = [];
const INITIAL_BIDS: Bid[] = [];

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>(Screen.DASHBOARD);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Global Shared States
  const [users, setUsers] = useState<UserData[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [notices, setNotices] = useState<Notice[]>(INITIAL_NOTICES); // Notices still static for now
  const [results, setResults] = useState<DeclaredResult[]>(INITIAL_RESULTS); // Results still static for now
  const [roles, setRoles] = useState<Role[]>(INITIAL_ROLES);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>(INITIAL_WITHDRAWALS);
  const [bids, setBids] = useState<Bid[]>(INITIAL_BIDS);
  const [dashboardData, setDashboardData] = useState<any>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Check for existing authentication on mount
  useEffect(() => {
    const checkAuth = () => {
      const isAuthenticated = authService.isAuthenticated();
      setIsLoggedIn(isAuthenticated);
      if (isAuthenticated) {
        setCurrentScreen(Screen.DASHBOARD);
      } else {
        setCurrentScreen(Screen.LOGIN);
      }
      setIsCheckingAuth(false);
    };

    checkAuth();
  }, []);

  // Fetch Data on Load
  useEffect(() => {
    if (isLoggedIn) {
      fetchInitialData();
    }
  }, [isLoggedIn]);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [marketData, userData, statsData, noticesData] = await Promise.all([
        marketService.getMarkets(),
        userService.getUsers(1, 100),
        dashboardService.getStats(),
        noticeService.getAll()
      ]);

      if (marketData) setMarkets(marketData);
      if (userData && userData.users) setUsers(userData.users);
      if (statsData) setDashboardData(statsData);
      if (noticesData) setNotices(noticesData);

      // TODO: Fetch Bids, Transactions, Withdrawals, Results once API endpoints exist

    } catch (error) {
      console.error("Error fetching initial data", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = () => {
    setIsLoggedIn(true);
    setCurrentScreen(Screen.DASHBOARD);
  };

  const handleLogout = () => {
    authService.logout();
    setIsLoggedIn(false);
    setCurrentScreen(Screen.LOGIN);
  };

  const navigateToUser = (id: string) => {
    setSelectedUserId(id);
    setCurrentScreen(Screen.USER_PROFILE);
  };

  // Show loading spinner while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="w-12 h-12 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case Screen.DASHBOARD:
        return <DashboardScreen data={dashboardData} onNavigate={setCurrentScreen} />;
      case Screen.USERS:
        return <UsersScreen
          users={users}
          setUsers={setUsers}
          setTransactions={setTransactions}
          onViewUser={navigateToUser}
        />;
      case Screen.USER_PROFILE:
        const selectedUser = users.find(u => u.id === selectedUserId);
        return <UserProfileScreen
          user={selectedUser || users[0]}
          transactions={transactions}
          setTransactions={setTransactions}
          onUpdateUser={(updated) => setUsers(prev => prev.map(u => u.id === updated.id ? updated : u))}
          onBack={() => setCurrentScreen(Screen.USERS)}
        />;
      case Screen.MARKETS:
        return <MarketsScreen markets={markets} setMarkets={setMarkets} />;
      case Screen.RESULTS:
        return <ResultsScreen history={results} setHistory={setResults} />;
      case Screen.BIDS:
        return <BidsScreen bids={bids} setBids={setBids} />;
      case Screen.DEPOSITS:
        return <DepositsScreen />;
      case Screen.WITHDRAWALS:
        return <WithdrawalsScreen withdrawals={withdrawals} setWithdrawals={setWithdrawals} />;
      case Screen.FINANCE:
        return <FinanceScreen />;
      case Screen.NOTICES:
        return <NoticesScreen notices={notices} setNotices={setNotices} />;
      case Screen.SETTINGS:
        return <SettingsScreen />;
      case Screen.ROLES:
        return <RolesScreen roles={roles} setRoles={setRoles} />;
      case Screen.REFERRALS:
        return <ReferralScreen />;
      case Screen.ADMIN_ACCOUNTS:
        return <AdminAccountsScreen />;
      default:
        return <DashboardScreen users={users} transactions={transactions} onNavigate={setCurrentScreen} />;
    }
  };

  return (
    <Layout activeScreen={currentScreen} onNavigate={setCurrentScreen} onLogout={handleLogout}>
      {renderScreen()}
    </Layout>
  );
};

export default App;
