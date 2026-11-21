import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LandingPage from './components/LandingPage/LandingPage';
import LoginPage from './components/LoginPage';
import Navbar from './components/Navbar';
import MobileBottomNav from './components/MobileBottomNav';
import FastPOSView from './components/FastPOS/FastPOSView';
import InventoryMatrixView from './components/InventoryMatrix/InventoryMatrixView';
import AttendanceHandshakeView from './components/AttendanceHandshake/AttendanceHandshakeView';
import SalesmanDashboardView from './components/SalesmanPortal/SalesmanDashboardView';
import RequisitionsView from './components/Requisitions/RequisitionsView';
import MultiBranchReportsView from './components/Reports/MultiBranchReportsView';
import StoreSettingsView from './components/TenantSettings/StoreSettingsView';
import AttendancePolicySettingsModal from './components/TenantSettings/AttendancePolicySettingsModal';
import EcommerceStorefront from './components/EcommerceStorefront/EcommerceStorefront';
import HRMSuiteView from './components/HRM/HRMSuiteView';
import EcommerceOrderDashboardView from './components/EcommerceOrders/EcommerceOrderDashboardView';

// Role-wise dedicated dashboards
import SuperAdminDashboardView from './components/Dashboards/SuperAdminDashboardView';
import OwnerDashboardView from './components/Dashboards/OwnerDashboardView';
import ManagerDashboardView from './components/Dashboards/ManagerDashboardView';
import CashierDashboardView from './components/Dashboards/CashierDashboardView';
import InventoryDashboardView from './components/Dashboards/InventoryDashboardView';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("OmniFlow React ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-slate-900 p-6 text-white text-center">
          <div className="max-w-md rounded-3xl border border-rose-500/30 bg-slate-950 p-6 shadow-2xl">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-400 mb-4 font-bold text-xl">
              ⚠️
            </div>
            <h2 className="text-lg font-black text-rose-400">View Rendering Interrupted</h2>
            <p className="mt-2 text-xs text-slate-300 font-mono bg-slate-900/80 p-2 rounded-lg border border-slate-800 break-all">
              {this.state.error?.message || "An unexpected error occurred in this view."}
            </p>
            {this.state.error?.stack && (
              <pre className="mt-2 text-[10px] text-left text-slate-400 bg-slate-900/60 p-2 rounded-lg max-h-32 overflow-y-auto font-mono whitespace-pre-wrap">
                {this.state.error.stack.slice(0, 300)}
              </pre>
            )}
            <div className="mt-6 flex flex-col gap-2">
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
                className="rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 transition-all active:scale-95 shadow-md shadow-emerald-600/30"
              >
                Reload Dashboard
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem('omniflow_token');
                  window.location.href = '/';
                }}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                Sign out and return to Home
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function MainLayout() {
  const { user, tenant, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  
  // Resolve if visiting storefront via Subdomain, Custom Domain, /store/:slug, or ?store=...
  const resolveStorefront = () => {
    if (typeof window === 'undefined') return { isStore: false, slug: 'vogue' };
    const urlParams = new URLSearchParams(window.location.search);
    const queryStoreSlug = urlParams.get('store') || urlParams.get('slug');
    const pathname = window.location.pathname;

    // 1. Path-based: /store/:slug or /store
    if (pathname.startsWith('/store')) {
      const parts = pathname.split('/').filter(Boolean);
      const pathSlug = parts[1] || queryStoreSlug;
      return { isStore: true, slug: pathSlug || 'vogue' };
    }

    // 2. Query param based: ?store=... or ?view=storefront
    if (queryStoreSlug || urlParams.get('view') === 'storefront') {
      return { isStore: true, slug: queryStoreSlug || 'vogue' };
    }

    // 3. Platform Subdomain: e.g. vogue.omniflow.pos.bd, vogue.localhost
    const hostname = window.location.hostname.toLowerCase();
    const hostParts = hostname.split('.');
    if (hostParts.length >= 2) {
      const sub = hostParts[0];
      const ignored = ['www', 'app', 'admin', 'api', 'localhost', '127', '0', 'seas-paragraphs-roads-athens'];
      if (!ignored.includes(sub)) {
        return { isStore: true, slug: sub };
      }
    }

    // 4. Custom domain: if domain is a custom domain
    const rootDomains = ['localhost', '127.0.0.1', 'trycloudflare.com', 'omniflow.pos.bd', 'pos.bd'];
    const isCustomDomain = !rootDomains.some(rd => hostname.includes(rd));
    if (isCustomDomain && hostname.includes('.')) {
      return { isStore: true, slug: '' };
    }

    return { isStore: false, slug: 'vogue' };
  };

  const initialStore = resolveStorefront();
  const [showStorefront, setShowStorefront] = useState(initialStore.isStore);
  const [storefrontSlug, setStorefrontSlug] = useState(initialStore.slug || 'vogue');

  // Default to showing LandingPage unless explicitly visiting /login or having login query
  const isExplicitLoginUrl = typeof window !== 'undefined' && (
    window.location.pathname === '/login' || 
    window.location.search.includes('view=login')
  );
  const [showLandingPage, setShowLandingPage] = useState(!isExplicitLoginUrl && !initialStore.isStore);

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  // Dynamic Background Color from Tenant UI Settings (SuperAdmin uses sleek Midnight-Slate)
  const appBgColor = isSuperAdmin ? '#030712' : (tenant?.settings?.ui_background_color || '#f8fafc');

  useEffect(() => {
    document.body.style.backgroundColor = appBgColor;
  }, [appBgColor]);

  // Sync with browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const isLogin = window.location.pathname === '/login' || window.location.search.includes('view=login');
      const storeState = resolveStorefront();
      setShowStorefront(storeState.isStore);
      if (storeState.slug) setStorefrontSlug(storeState.slug);
      if (!storeState.isStore) {
        setShowLandingPage(!isLogin);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Auto-redirect to role-wise distinct dashboard on login
  useEffect(() => {
    if (user?.role && !showStorefront) {
      setShowLandingPage(false);
      if (typeof window !== 'undefined' && (window.location.pathname === '/login' || window.location.search.includes('view=login'))) {
        window.history.replaceState({}, '', '/');
      }
    }
  }, [user?.id, user?.role, showStorefront]);

  const navigateToLogin = () => {
    if (user) {
      setShowLandingPage(false);
      if (window.history.pushState) window.history.replaceState({}, '', '/');
      return;
    }
    if (window.history.pushState) {
      window.history.pushState({}, '', '/login');
    }
    setShowLandingPage(false);
  };

  const navigateToLanding = () => {
    if (window.history.pushState) {
      window.history.pushState({}, '', '/');
    }
    setShowLandingPage(true);
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-950 text-emerald-400 font-mono text-xs">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
          <span className="font-bold">Loading OmniFlow POS Engine (Dhaka Timezone)...</span>
        </div>
      </div>
    );
  }

  // 0. If viewing the interactive e-commerce storefront for a tenant
  if (showStorefront) {
    return (
      <EcommerceStorefront
        slug={storefrontSlug || tenant?.slug || 'vogue'}
        onReturnToWorkstation={() => {
          setShowStorefront(false);
          if (window.history.pushState) window.history.replaceState({}, '', '/');
        }}
        user={user}
      />
    );
  }

  // 1. If viewing the public landing page (Default for visitors on localhost / root)
  if (showLandingPage) {
    return (
      <div className="relative">
        {user && (
          <div className="fixed top-20 right-4 z-50 animate-in fade-in">
            <button
              onClick={() => {
                setShowLandingPage(false);
                if (window.history.pushState) window.history.replaceState({}, '', '/');
              }}
              className="rounded-2xl bg-emerald-500 text-slate-950 px-4 py-2 text-xs font-black shadow-2xl hover:bg-emerald-400 active:scale-95 transition-all flex items-center gap-1.5"
            >
              <span>← Return to Workstation ({user.role})</span>
            </button>
          </div>
        )}
        <LandingPage 
          onGoToLogin={navigateToLogin} 
          onExploreDemo={navigateToLogin}
        />
      </div>
    );
  }

  // 2. If user is not logged in and navigated to login
  if (!user) {
    return <LoginPage onGoToLanding={navigateToLanding} />;
  }

  const handleOpenSettings = () => {
    setActiveTab('settings');
  };

  const renderRoleDashboard = () => {
    switch (user?.role) {
      case 'SUPER_ADMIN':
        return (
          <SuperAdminDashboardView 
            activeSubTab={activeTab} 
            onNavigate={setActiveTab} 
            onOpenSettings={handleOpenSettings} 
            onOpenLanding={() => setShowLandingPage(true)}
          />
        );
      case 'STORE_OWNER':
        return (
          <OwnerDashboardView 
            onNavigate={setActiveTab} 
            onOpenSettings={handleOpenSettings} 
          />
        );
      case 'STORE_MANAGER':
        return <ManagerDashboardView onNavigate={setActiveTab} />;
      case 'CASHIER':
        return <CashierDashboardView onNavigate={setActiveTab} />;
      case 'SALESMAN':
        return <SalesmanDashboardView />;
      case 'INVENTORY_CLERK':
        return <InventoryDashboardView onNavigate={setActiveTab} />;
      default:
        return (
          <OwnerDashboardView 
            onNavigate={setActiveTab} 
            onOpenSettings={handleOpenSettings} 
          />
        );
    }
  };

  return (
    <div 
      style={{ backgroundColor: appBgColor }}
      className="min-h-screen text-slate-800 flex flex-col font-sans transition-colors duration-200"
    >
      {/* Top Navbar with Multi-Showroom & Persona Switcher */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        onOpenSettings={handleOpenSettings}
        onOpenLanding={() => setShowLandingPage(true)}
        onOpenStorefront={() => {
          setStorefrontSlug(tenant?.slug || 'vogue');
          setShowStorefront(true);
        }}
      />

      {/* Main Dynamic View Content */}
      <main className="flex-1">
        {user?.role === 'SUPER_ADMIN' ? (
          <SuperAdminDashboardView 
            activeSubTab={activeTab} 
            onNavigate={setActiveTab} 
            onOpenSettings={handleOpenSettings} 
            onOpenLanding={() => setShowLandingPage(true)}
          />
        ) : (
          <>
            {activeTab === 'dashboard' && renderRoleDashboard()}
            {activeTab === 'pos' && <FastPOSView />}
            {activeTab === 'matrix' && <InventoryMatrixView />}
            {activeTab === 'attendance' && <AttendanceHandshakeView />}
            {activeTab === 'hrm' && <HRMSuiteView />}
            {activeTab === 'portal' && <SalesmanDashboardView />}
            {activeTab === 'requisitions' && <RequisitionsView />}
            {activeTab === 'online-orders' && <EcommerceOrderDashboardView />}
            {activeTab === 'reports' && <MultiBranchReportsView />}
            {activeTab === 'settings' && <StoreSettingsView onBack={() => setActiveTab('dashboard')} />}
          </>
        )}
      </main>

      {/* Mobile Native App Bottom Navigation */}
      <MobileBottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Settings Modal fallback if explicitly toggled */}
      {showSettingsModal && (
        <AttendancePolicySettingsModal onClose={() => setShowSettingsModal(false)} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <MainLayout />
      </AuthProvider>
    </ErrorBoundary>
  );
}
