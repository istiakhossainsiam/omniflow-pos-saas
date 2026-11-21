import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi, tenantApi } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize from LocalStorage / Load Profile
  useEffect(() => {
    async function initAuth() {
      const token = localStorage.getItem('omniflow_token');
      if (token) {
        try {
          const profile = await authApi.getProfile();
          setUser(profile);
          
          // Load Tenant info & branches
          const tenantInfo = await tenantApi.getCurrent();
          setTenant(tenantInfo);
          setBranches(tenantInfo.branches || []);

          // Set default branch
          if (profile.branch_id) {
            const currentB = (tenantInfo.branches || []).find(b => b.id === profile.branch_id);
            setSelectedBranch(currentB || tenantInfo.branches?.[0] || null);
          } else {
            setSelectedBranch(tenantInfo.branches?.[0] || null);
          }
        } catch (err) {
          console.error("Auto load profile failed:", err);
          localStorage.removeItem('omniflow_token');
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    }
    initAuth();
  }, []);

  const login = async (emailOrCode, password) => {
    try {
      setError(null);
      const res = await authApi.login({ email_or_code: emailOrCode, password });
      localStorage.setItem('omniflow_token', res.access_token);
      setUser(res.user);

      // Load Tenant & Branches
      const tenantInfo = await tenantApi.getCurrent();
      setTenant(tenantInfo);
      setBranches(tenantInfo.branches || []);
      
      const currentB = (tenantInfo.branches || []).find(b => b.id === res.user.branch_id);
      setSelectedBranch(currentB || tenantInfo.branches?.[0] || null);

      return res;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const quickLogin = async (email, password = 'password123') => {
    try {
      return await login(email, password);
    } catch (err) {
      console.warn("Quick login fallback error:", err);
    }
  };

  // Apply live theme color to root DOM element
  useEffect(() => {
    const theme = tenant?.settings?.theme_color || 'emerald';
    document.documentElement.setAttribute('data-theme', theme);
  }, [tenant?.settings?.theme_color]);

  const switchBranch = async (branchId) => {
    try {
      const b = branches.find(item => item.id === branchId);
      if (b) {
        setSelectedBranch({ ...b });
      }
      if (user?.role === 'STORE_OWNER' || user?.role === 'SUPER_ADMIN') {
        const res = await authApi.switchBranch(branchId);
        localStorage.setItem('omniflow_token', res.access_token);
        setUser(res.user);
      } else if (user) {
        setUser({ ...user, branch_id: branchId });
      }
    } catch (err) {
      console.error("Failed to switch branch:", err);
    }
  };

  const logout = () => {
    localStorage.removeItem('omniflow_token');
    setUser(null);
  };

  const refreshTenant = async () => {
    try {
      const tenantInfo = await tenantApi.getCurrent();
      setTenant(tenantInfo);
      setBranches(tenantInfo.branches || []);
    } catch (err) {
      console.error("Failed to refresh tenant:", err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        tenant,
        branches,
        selectedBranch,
        loading,
        error,
        login,
        logout,
        quickLogin,
        switchBranch,
        refreshTenant
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
