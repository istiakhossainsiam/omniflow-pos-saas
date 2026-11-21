import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  QrCode, 
  KeyRound, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ShieldCheck, 
  RefreshCw, 
  UserCheck,
  Calendar,
  AlertCircle,
  Camera,
  ScanLine
} from 'lucide-react';
import { attendanceApi, tenantApi } from '../../services/api';
import BarcodeScannerModal from '../FastPOS/BarcodeScannerModal';

export default function AttendanceHandshakeView() {
  const { user, selectedBranch } = useAuth();
  
  const [policy, setPolicy] = useState(null);
  const [myStatus, setMyStatus] = useState(null);
  const [records, setRecords] = useState([]);
  
  const [managerSession, setManagerSession] = useState(null);
  const [sessionTimeLeft, setSessionTimeLeft] = useState(60);

  const [enteredPin, setEnteredPin] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);
  const [showScannerModal, setShowScannerModal] = useState(false);

  const isManagerOrOwner = ['STORE_OWNER', 'SUPER_ADMIN', 'STORE_MANAGER'].includes(user?.role);

  useEffect(() => {
    loadAttendanceData();
  }, [selectedBranch]);

  useEffect(() => {
    let interval = null;
    if (managerSession && sessionTimeLeft > 0) {
      interval = setInterval(() => {
        setSessionTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (sessionTimeLeft <= 0 && isManagerOrOwner) {
      handleGenerateManagerSession();
    }
    return () => clearInterval(interval);
  }, [managerSession, sessionTimeLeft]);

  const loadAttendanceData = async () => {
    try {
      const [pol, status, recs] = await Promise.all([
        tenantApi.getAttendancePolicy(),
        attendanceApi.getStatus(),
        attendanceApi.listRecords({ branch_id: selectedBranch?.id })
      ]);
      setPolicy(pol);
      setMyStatus(status);
      setRecords(recs);

      if (isManagerOrOwner) {
        handleGenerateManagerSession();
      }
    } catch (err) {
      console.error("Failed to load attendance:", err);
    }
  };

  const handleGenerateManagerSession = async () => {
    try {
      const sess = await attendanceApi.generateManagerSession();
      setManagerSession(sess);
      setSessionTimeLeft(90);
    } catch (err) {
      console.warn("Could not generate manager session:", err);
    }
  };

  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSalesmanCheckIn = async (pinValue = '') => {
    try {
      setIsSubmitting(true);
      const res = await attendanceApi.checkIn({
        branch_id: selectedBranch?.id,
        manager_pin: pinValue || enteredPin.trim() || null,
        device_info: navigator.userAgent
      });
      showToast(res.message);
      setEnteredPin('');
      loadAttendanceData();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handle1ClickManagerVerify = async (recordId) => {
    try {
      await attendanceApi.verifyQueue(recordId);
      showToast("Check-in verified!");
      loadAttendanceData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-6 py-4 pb-24 md:pb-8">
      
      {/* Toast */}
      {notification && (
        <div className={`fixed top-16 sm:top-20 right-4 z-50 flex items-center gap-2 rounded-2xl px-4 py-3 text-xs font-bold text-white shadow-2xl animate-in slide-in-from-top-4 ${
          notification.type === 'error' ? 'bg-rose-600' : 'bg-emerald-600'
        }`}>
          {notification.type === 'error' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-emerald-600" />
            <h2 className="text-xl font-black text-slate-900">Secure 2FA Attendance & Handshake Engine</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Store Shift: <strong className="text-slate-800">{policy?.shift_start_time || '09:30'}</strong> • Grace Period: <strong className="text-emerald-700">{policy?.grace_period_minutes || 15} mins</strong> • Handshake: <strong className="text-emerald-700">{policy?.require_manager_handshake ? 'Required' : 'Self-Verified'}</strong>
          </p>
        </div>

        <span className="rounded-full bg-slate-100 border border-slate-200 px-3 py-1 text-xs font-mono font-semibold text-slate-700 self-end sm:self-auto">
          {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
      </div>

      {/* Top Action Grid */}
      <div className="mt-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left: Salesman Check-In Card (5 cols) */}
        <div className="lg:col-span-6 xl:col-span-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-emerald-600" />
              <h3 className="font-bold text-slate-900 text-base">My Check-In Status</h3>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-700">{user?.employee_code}</span>
          </div>

          {/* Status Display */}
          <div className="mt-4 rounded-2xl bg-slate-50 border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Today's Status:</span>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-black ${
                myStatus?.status === 'ON_TIME'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : myStatus?.status === 'LATE'
                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                    : myStatus?.status === 'PENDING_VERIFICATION'
                      ? 'bg-cyan-100 text-cyan-800 border border-cyan-200 animate-pulse'
                      : 'bg-slate-200 text-slate-700'
              }`}>
                {myStatus?.status || 'NOT_CHECKED_IN'}
              </span>
            </div>

            {myStatus?.check_in_time && (
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs border-t border-slate-200/80 pt-3">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Check-In Time:</span>
                  <div className="font-mono font-bold text-slate-800">
                    {new Date(myStatus.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Late Minutes:</span>
                  <div className={`font-mono font-bold ${myStatus.late_minutes > 0 ? 'text-amber-600' : 'text-emerald-700'}`}>
                    {myStatus.late_minutes > 0 ? `+${myStatus.late_minutes} mins late` : 'On Time'}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Check-In Action Form */}
          {!myStatus?.has_checked_in ? (
            <div className="mt-4 space-y-3">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <KeyRound className="h-3.5 w-3.5 text-emerald-600" />
                <span>Store Manager 6-Digit PIN Handshake:</span>
              </label>

              <div className="flex gap-2">
                <input
                  type="password"
                  maxLength={6}
                  placeholder="e.g. 1234 or OTP"
                  value={enteredPin}
                  onChange={(e) => setEnteredPin(e.target.value)}
                  className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-center text-sm font-mono tracking-widest text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                />
                <button
                  onClick={() => handleSalesmanCheckIn()}
                  disabled={isSubmitting}
                  className="rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 active:scale-95 transition-all"
                >
                  {isSubmitting ? 'Verifying...' : 'Check-In'}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  onClick={() => setShowScannerModal(true)}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 text-white p-2.5 text-xs font-bold hover:bg-black transition-all shadow-sm active:scale-95"
                >
                  <ScanLine className="h-4 w-4 text-emerald-400" />
                  <span>Scan Manager QR</span>
                </button>

                {managerSession && (
                  <button
                    onClick={() => handleSalesmanCheckIn(managerSession.quick_pin)}
                    className="rounded-xl bg-emerald-50 border border-emerald-200 p-2.5 text-center text-[11px] font-bold text-emerald-800 hover:bg-emerald-100 transition-colors"
                  >
                    ⚡ Code ({managerSession.quick_pin})
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-2xl bg-emerald-50 border border-emerald-200 p-3 text-center text-xs font-bold text-emerald-800">
              ✓ Marked present for today's showroom shift.
            </div>
          )}

        </div>

        {/* Right: Manager Dynamic 60s Rotating QR / PIN Station */}
        <div className="lg:col-span-6 xl:col-span-7 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-emerald-600" />
              <div>
                <h3 className="font-bold text-slate-900 text-base">Manager Handshake Terminal</h3>
                <span className="text-[11px] text-slate-500">{selectedBranch?.name || 'Showroom Counter'}</span>
              </div>
            </div>

            <button
              onClick={handleGenerateManagerSession}
              className="flex items-center gap-1 rounded-xl bg-slate-100 px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200 shadow-sm"
            >
              <RefreshCw className="h-3.5 w-3.5 text-emerald-600" />
              <span>Refresh OTP</span>
            </button>
          </div>

          {managerSession ? (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              
              {/* Dynamic QR Code */}
              <div className="flex flex-col items-center justify-center rounded-2xl bg-slate-50 border border-slate-200 p-3 shadow-inner">
                <img 
                  src={managerSession.qr_code_base64} 
                  alt="Dynamic Attendance QR" 
                  className="h-36 w-36 object-contain"
                />
                <div className="mt-1 text-[10px] font-bold text-slate-700 font-mono">
                  Scan with Staff Mobile
                </div>
              </div>

              {/* Quick PIN & Timer */}
              <div className="space-y-3">
                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3.5 text-center">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dynamic 6-Digit Handshake PIN</div>
                  <div className="text-3xl font-black text-emerald-700 font-mono tracking-widest mt-1">
                    {managerSession.quick_pin}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1 font-medium">
                    Expires in <strong className="text-amber-600">{sessionTimeLeft}s</strong> (Auto-rotates)
                  </div>
                </div>

                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-emerald-600 h-1.5 rounded-full transition-all duration-1000"
                    style={{ width: `${(sessionTimeLeft / 90) * 100}%` }}
                  />
                </div>

                <div className="text-[11px] text-slate-500 text-center">
                  Show this QR code or PIN to your sales team at shift start.
                </div>
              </div>

            </div>
          ) : (
            <div className="py-12 text-center text-xs text-slate-400">
              Only Store Managers and Admins generate live handshake stations.
            </div>
          )}
        </div>

      </div>

      {/* Attendance Log Table */}
      <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-emerald-600" />
            <h3 className="font-bold text-slate-900 text-base">Showroom Attendance Ledger ({records.length})</h3>
          </div>
        </div>

        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase">
                <th className="py-2.5 px-3">Employee</th>
                <th className="py-2.5 px-3">Code</th>
                <th className="py-2.5 px-3">Showroom</th>
                <th className="py-2.5 px-3">Check-In Time</th>
                <th className="py-2.5 px-3">Late Mins</th>
                <th className="py-2.5 px-3">Handshake Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">No attendance entries recorded yet today.</td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 font-bold text-slate-900">{r.employee_name}</td>
                    <td className="py-3 px-3 font-mono text-slate-500">{r.employee_code}</td>
                    <td className="py-3 px-3 text-slate-700">{r.branch_name}</td>
                    <td className="py-3 px-3 font-mono text-slate-800 font-bold">
                      {r.check_in_time ? new Date(r.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`font-bold ${r.late_minutes > 0 ? 'text-amber-600 font-mono' : 'text-emerald-700'}`}>
                        {r.late_minutes > 0 ? `+${r.late_minutes}m` : '0m'}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        r.is_verified_by_manager 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-cyan-100 text-cyan-800'
                      }`}>
                        {r.is_verified_by_manager ? 'Handshake Verified' : 'Pending Verification'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      {!r.is_verified_by_manager && isManagerOrOwner && (
                        <button
                          onClick={() => handle1ClickManagerVerify(r.id)}
                          className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-700 shadow-sm"
                        >
                          Verify 1-Click
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showScannerModal && (
        <BarcodeScannerModal
          onScanSuccess={(code) => {
            setShowScannerModal(false);
            handleSalesmanCheckIn(code);
          }}
          onClose={() => setShowScannerModal(false)}
        />
      )}

    </div>
  );
}
