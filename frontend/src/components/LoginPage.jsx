import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Sparkles, 
  Lock, 
  User, 
  ArrowRight, 
  ShieldCheck, 
  Store, 
  AlertCircle,
  Crown,
  KeyRound,
  BadgeCheck,
  ChevronRight,
  UserCheck,
  Eye,
  EyeOff,
  Clock,
  Zap,
  CheckCircle2,
  Building2,
  Cpu
} from 'lucide-react';
import DotGridBackground from './common/DotGridBackground';
import SpotlightCard from './common/SpotlightCard';
import ShinyText from './common/ShinyText';
import UiverseButton from './common/UiverseButton';

export default function LoginPage({ onGoToLanding }) {
  const { login, quickLogin, error: authError } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const demoAccounts = [
    { 
      title: 'Brand Owner (HQ)', 
      code: 'owner@vogue.com', 
      role: 'STORE_OWNER', 
      desc: 'Multi-branch P&L, inventory matrix & executive reports',
      icon: Crown,
      badge: 'HQ Admin',
      accent: 'border-amber-500/30 bg-amber-500/5 text-amber-600'
    },
    { 
      title: 'Store Manager', 
      code: 'manager.dhanmondi@vogue.com', 
      role: 'STORE_MANAGER', 
      desc: 'Staff handshakes, approvals & stock requisitions',
      icon: ShieldCheck,
      badge: 'Manager',
      accent: 'border-blue-500/30 bg-blue-500/5 text-blue-600'
    },
    { 
      title: 'Cashier Counter', 
      code: 'cashier.dhanmondi@vogue.com', 
      role: 'CASHIER', 
      desc: 'Sub-second POS billing & split payments',
      icon: Store,
      badge: 'Counter',
      accent: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-600'
    },
    { 
      title: 'Senior Sales Staff', 
      code: 'sales.dhanmondi@vogue.com', 
      role: 'SALESMAN', 
      desc: 'Incentive tracking & 2FA biometric attendance',
      icon: UserCheck,
      badge: 'Floor Staff',
      accent: 'border-purple-500/30 bg-purple-500/5 text-purple-600'
    },
  ];

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      setErrorMessage("Please enter your Employee ID, Email or Phone and Password.");
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);
      await login(identifier.trim(), password);
    } catch (err) {
      setErrorMessage(err.message || "Invalid credentials. Please verify your login details.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoClick = async (email) => {
    try {
      setLoading(true);
      setErrorMessage(null);
      await quickLogin(email, 'password123');
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-3 sm:p-6 lg:p-10 font-sans relative overflow-hidden">
      
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-5xl mx-auto rounded-3xl overflow-hidden border border-slate-700/60 bg-slate-950/80 backdrop-blur-2xl shadow-2xl grid grid-cols-1 lg:grid-cols-12 relative z-10">
        
        {/* Left Side: Brand Narrative & Real-Time Retail Telemetry (5 cols on lg) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950/40 p-6 sm:p-8 lg:p-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800 text-white relative">
          
          <div>
            {/* Logo & Version */}
            <div className="flex items-center gap-3 mb-6">
              <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-black text-slate-950 shadow-lg shadow-emerald-500/25">
                <Sparkles className="h-6 w-6 text-slate-950" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-extrabold tracking-tight text-white font-display">
                    OmniFlow POS
                  </h1>
                  <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    2.0 CLOUD
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">Retail Fashion & Apparel ERP</p>
              </div>
            </div>

            <div className="space-y-4 my-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-xs text-slate-300">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>NTP Synchronized · Asia/Dhaka GMT+6</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight font-display">
                Engineered for High-Velocity Showrooms.
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Seamless multi-showroom stock matrices, sub-second split billing (Cash, bKash, Cards), and 2FA biometric staff attendance in a zero-storage private cloud architecture.
              </p>
            </div>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-800/80">
              <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
                <div className="text-lg font-black text-emerald-400 font-mono">&lt; 8ms</div>
                <div className="text-[10px] font-medium text-slate-400 mt-0.5">Counter POS Latency</div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
                <div className="text-lg font-black text-emerald-400 font-mono">100% ACID</div>
                <div className="text-[10px] font-medium text-slate-400 mt-0.5">Isolated Multi-Tenant</div>
              </div>
            </div>
          </div>

          {/* Bottom Trust Badge */}
          <div className="pt-6 mt-6 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Enterprise Encryption</span>
            <span className="font-mono text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> 256-bit SSL
            </span>
          </div>

        </div>

        {/* Right Side: Authentication Form & 1-Click Fast Persona Switching (7 cols on lg) */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-8 lg:p-10 flex flex-col justify-between">
          
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight font-display">
                  Showroom Workstation Login
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Sign in with your Employee ID, Email, or registered Phone.
                </p>
              </div>

              {onGoToLanding && (
                <button
                  type="button"
                  onClick={onGoToLanding}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1"
                >
                  <span>Public View</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Error Message */}
            {(errorMessage || authError) && (
              <div className="mb-4 flex items-center gap-2.5 rounded-2xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-700 animate-in fade-in">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span className="font-medium">{errorMessage || authError}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Employee ID / Email / Phone
                </label>
                <div className="relative group">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. owner@vogue.com or VOGUE-001"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 transition-all duration-200 focus:bg-white focus:border-emerald-600 focus:outline-none focus:ring-4 focus:ring-emerald-500/15"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">Password</label>
                  <span className="text-[10px] text-slate-400 font-mono">Demo: password123</span>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-10 pr-10 py-2.5 text-xs text-slate-900 placeholder-slate-400 transition-all duration-200 focus:bg-white focus:border-emerald-600 focus:outline-none focus:ring-4 focus:ring-emerald-500/15"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/25 transition-all duration-200 active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>{loading ? "Authenticating Session..." : "Sign In to Terminal"}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            {/* 1-Click Fast Persona Switch (Immediate Testing) */}
            <div className="mt-6 border-t border-slate-100 pt-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Instant Test Personas (1-Click)
                </span>
                <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                  Pre-configured
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {demoAccounts.map((d) => {
                  const Icon = d.icon;
                  return (
                    <button
                      key={d.role}
                      type="button"
                      onClick={() => handleDemoClick(d.code)}
                      disabled={loading}
                      className="group relative flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-3 text-left transition-all duration-200 hover:border-emerald-500 hover:bg-emerald-50/30 hover:shadow-sm active:scale-98"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-700 group-hover:border-emerald-500 group-hover:text-emerald-600 transition-all shadow-xs">
                        <Icon className="h-4.5 w-4.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900 group-hover:text-emerald-950 transition-colors truncate">
                            {d.title}
                          </span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${d.accent}`}>
                            {d.badge}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5 leading-snug line-clamp-1">
                          {d.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {onGoToLanding && (
            <div className="mt-6 pt-4 border-t border-slate-100 text-center">
              <button
                type="button"
                onClick={onGoToLanding}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
              >
                ← Back to OmniFlow Public Website & Documentation
              </button>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
