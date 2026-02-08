import React, { useState, useEffect } from 'react';
import TopNavigation from './components/TopNavigation';
import Dashboard from './components/Dashboard';
import Trade from './components/Trade';
import Portfolio from './components/Portfolio';
import History from './components/History';
import Login from './pages/Login';
import Finance from './components/Finance';
import Settings from './components/Settings';
import UpgradePro from './components/UpgradePro';
import { api } from './api';
import { dbService } from './services/db/dbService';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [notifications, setNotifications] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState(sessionStorage.getItem('userEmail'));
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [error, setError] = useState(null);
  const [menuConfig, setMenuConfig] = useState({
    dashboard: true, trade: true, portfolio: true, history: true, finance: true
  });

  useEffect(() => {
    localStorage.setItem('theme', theme);
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  const fetchProfile = async (email) => {
    try {
      const emailToFetch = email || userEmail;

      // 1. Fetch from Firestore (Primary Source)
      const res = await dbService.getUserByEmail(emailToFetch);

      if (res.success && res.data) {
        setProfile(res.data);
        setError(null);

        // 2. Background Sync: Fetch Notifications & Settings from GAS (if needed)
        fetchNotifications(emailToFetch);
        fetchSettings(emailToFetch);
      } else {
        // Fallback to GAS API if not in Firestore (Migration phase)
        console.warn("User not found in Firestore, trying GAS API...");
        const data = await api.call('getProfile', { email: emailToFetch });
        if (data && !data.error) {
          setProfile(data);
          fetchNotifications(emailToFetch);
          fetchSettings(emailToFetch);
        } else {
          console.error("Profile Error:", res.error || data?.error);
          setError("Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.");
        }
      }
    } catch (e) {
      console.error("Fetch Profile Failed:", e);
      setError("Lỗi kết nối: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async (email) => {
    const res = await api.call('getUserSettings', { email: email || userEmail });
    if (res && res.menu && Object.keys(res.menu).length > 0) {
      setMenuConfig(prev => ({ ...prev, ...res.menu }));
    }
  };

  const updateSettings = async (newMenuConfig) => {
    setMenuConfig(newMenuConfig);
    await api.call('updateUserSettings', { email: userEmail, settings: { menu: newMenuConfig } });
  };

  const fetchNotifications = async (email) => {
    const res = await api.call('getNotifications', { email: email || userEmail }, 'trading', { silent: true });
    if (res && Array.isArray(res)) setNotifications(res);
  };

  const handleMarkRead = async () => {
    if (notifications.some(n => !n.isRead)) {
      await api.call('markNotificationsRead', { email: userEmail });
      fetchNotifications();
    }
  };

  useEffect(() => {
    if (userEmail) {
      fetchProfile(userEmail);
      // Polling notifications every 30s
      const timer = setInterval(() => fetchNotifications(), 30000);
      return () => clearInterval(timer);
    } else {
      setLoading(false);
    }
  }, [userEmail]);

  const handleLogin = (email) => {
    sessionStorage.setItem('userEmail', email);
    setUserEmail(email);
    setLoading(true);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('userEmail');
    setProfile(null);
    setUserEmail(null);
    setError(null);
  };

  if (loading) return (
    <div className="h-screen w-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        {error ? (
          <div className="text-center">
            <div className="text-red-500 font-bold mb-2">{error}</div>
            <button
              onClick={() => { setError(null); handleLogout(); }}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primaryHover"
            >
              Quay lại đăng nhập
            </button>
          </div>
        ) : (
          <>
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-textSecondary font-medium animate-pulse">Đang kết nối hệ thống...</p>
          </>
        )}
      </div>
    </div>
  );

  if (!userEmail || !profile) return (
    <Login onLogin={handleLogin} />
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard profile={profile} refreshProfile={fetchProfile} />;
      case 'trade': return <Trade balance={profile.balance} refreshProfile={fetchProfile} />;
      case 'portfolio': return <Portfolio holdings={profile.holdings} refreshProfile={fetchProfile} />;
      case 'history': return <History profile={profile} refreshProfile={fetchProfile} />;
      case 'finance': return <Finance userEmail={profile.email} isPro={profile.isPro} subStart={profile.subStart} subEnd={profile.subEnd} setActiveTab={setActiveTab} />;
      case 'settings': return <Settings theme={theme} setTheme={setTheme} menuConfig={menuConfig} updateSettings={updateSettings} />;
      case 'upgrade': return <UpgradePro userEmail={profile.email} />;
      default: return <Dashboard profile={profile} />;
    }
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-text-main dark:text-white flex flex-col overflow-x-hidden transition-colors duration-500 font-sans">

      {/* Top Navigation Bar */}
      <TopNavigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        menuConfig={menuConfig}
        userProfile={profile}
        notifications={notifications}
        onMarkRead={handleMarkRead}
      />

      <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto w-full transition-all duration-300">
        {/* Content Area */}
        {renderContent()}
      </main>
    </div>
  );
}

export default App;
