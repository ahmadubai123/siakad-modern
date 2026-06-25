/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, FormEvent } from 'react';
import Navbar from './components/Navbar.tsx';
import Sidebar from './components/Sidebar.tsx';
import DashboardHome from './components/DashboardHome.tsx';
import MasterDataModules from './components/MasterDataModules.tsx';
import AkademikModules from './components/AkademikModules.tsx';
import LaporanModules from './components/LaporanModules.tsx';
import SettingsModules from './components/SettingsModules.tsx';
import { LogIn, Key, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';

export default function App() {
  // Authentication & session management states
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Default to false to showcase the login page
  const [currentUser, setCurrentUser] = useState({
    username: 'admin',
    displayName: 'Administrator Utama',
    email: 'admin@siakad.ac.id',
    role: 'Administrator' as 'Administrator' | 'Dosen' | 'Mahasiswa',
    referenceId: 'adm-01',
  });

  const [activeView, setActiveView] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(false);

  // Login form states
  const [usernameInput, setUsernameInput] = useState('admin');
  const [passwordInput, setPasswordInput] = useState('admin');
  const [roleInput, setRoleInput] = useState<'Administrator' | 'Dosen' | 'Mahasiswa'>('Administrator');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Theme support
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Handler for login role select to auto-populate credentials
  const handleRoleChangeInLogin = (role: 'Administrator' | 'Dosen' | 'Mahasiswa') => {
    setRoleInput(role);
    if (role === 'Administrator') {
      setUsernameInput('admin');
      setPasswordInput('admin');
    } else if (role === 'Dosen') {
      setUsernameInput('0411027501');
      setPasswordInput('password');
    } else if (role === 'Mahasiswa') {
      setUsernameInput('220101001');
      setPasswordInput('password');
    }
  };

  // Sync role switcher from Navbar to currentUser object
  const handleRoleSwitch = (newRole: 'Administrator' | 'Dosen' | 'Mahasiswa') => {
    let displayName = 'Administrator Utama';
    let email = 'admin@siakad.ac.id';
    let referenceId = 'adm-01';
    let username = 'admin';

    if (newRole === 'Dosen') {
      displayName = 'Dr. Budi Santoso, M.T., Ph.D.';
      email = 'budi.santoso@siakad.ac.id';
      referenceId = '0411027501';
      username = '0411027501';
    } else if (newRole === 'Mahasiswa') {
      displayName = 'Ahmad Fauzi';
      email = 'ahmad.fauzi@siakad.ac.id';
      referenceId = '220101001';
      username = '220101001';
    }

    setCurrentUser({
      username,
      displayName,
      email,
      role: newRole,
      referenceId,
    });
    // Return to dashboard on role change to avoid view mismatch
    setActiveView('dashboard');
  };

  // Perform backend API login
  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: usernameInput,
        password: passwordInput,
        role: roleInput,
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('Username atau password salah');
        return res.json();
      })
      .then((data) => {
        setIsAuthenticated(true);
        setCurrentUser({
          username: data.user.username,
          displayName: data.user.displayName,
          email: data.user.email,
          role: data.user.role,
          referenceId: data.user.referenceId,
        });
        setActiveView('dashboard');
        setLoginLoading(false);
      })
      .catch((err) => {
        setLoginError(err.message || 'Koneksi ke sistem SIAKAD gagal.');
        setLoginLoading(false);
      });
  };

  const handleLogout = () => {
    fetch('/api/auth/logout', { method: 'POST' })
      .then(() => {
        setIsAuthenticated(false);
        setUsernameInput('');
        setPasswordInput('');
      })
      .catch((e) => console.error(e));
  };

  // Login page layout
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f6f9] dark:bg-slate-950 p-4 font-sans selection:bg-blue-500 selection:text-white transition-colors duration-300">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <img
                src="/images/logo.png"
                alt="Logo Universitas"
                className="h-24 w-24 object-contain"
              />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100">SIAKAD UNIVERSITAS BINA BANGSA</h1>
            <p className="text-xs text-slate-400">Sistem Informasi Akademik Berbasis Cloud & Real-time</p>
          </div>

          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-xl space-y-6">
            <h2 className="text-sm font-bold uppercase text-slate-400 tracking-wider text-center">Masuk ke SIAKAD</h2>

            {loginError && (
              <div className="flex items-center gap-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900 p-3 text-xs font-bold text-rose-800 dark:text-rose-400">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Username / NIM / NIDN</label>
                <input
                  id="login-username"
                  type="text"
                  placeholder="e.g. admin atau 220102030"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-4 py-3 text-slate-800 dark:text-slate-100 focus:outline-blue-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Password Kredensial</label>
                <input
                  id="login-password"
                  type="password"
                  placeholder="••••••••"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-4 py-3 text-slate-800 dark:text-slate-100 focus:outline-blue-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Pilih Role Akses Utama</label>
                <select
                  id="login-role"
                  value={roleInput}
                  onChange={(e) => handleRoleChangeInLogin(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-4 py-3 text-slate-800 dark:text-slate-100 focus:outline-blue-500"
                >
                  <option value="Administrator" className="bg-white dark:bg-slate-800">Administrator (admin)</option>
                  <option value="Dosen" className="bg-white dark:bg-slate-800">Dosen Wali (0411027501)</option>
                  <option value="Mahasiswa" className="bg-white dark:bg-slate-800">Mahasiswa Aktif (220101001)</option>
                </select>
                <p className="text-[10px] text-slate-400 mt-1">Username & password otomatis terisi ketika role dipilih, atau Anda dapat mengetik manual.</p>
              </div>

              <button
                id="login-submit-btn"
                type="submit"
                disabled={loginLoading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-white font-black hover:bg-blue-700 transition-colors duration-200 shadow-md shadow-blue-500/10"
              >
                {loginLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Masuk Aplikasi</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated Dashboard & Sidebar/Navbar layouts
  return (
    <div className="min-h-screen bg-[#f4f6f9] dark:bg-slate-950 font-sans text-slate-600 dark:text-slate-300 selection:bg-blue-500 selection:text-white transition-colors duration-300 flex">
      {/* Dynamic Role-Based Sidebar */}
      <Sidebar
        activeView={activeView}
        onSetView={setActiveView}
        currentRole={currentUser.role}
        sidebarOpen={true}
        onLogout={handleLogout}
        pendingKrsCount={0}
        pendingSuratCount={0}
      />

      {/* Main Page Container */}
      <div className="flex-1 flex flex-col min-w-0 md:pl-64">
        {/* Dynamic Top Navbar */}
        <Navbar
          currentRole={currentUser.role}
          onChangeRole={handleRoleSwitch}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode(!darkMode)}
          sidebarOpen={true}
          onToggleSidebar={() => {}}
          currentUser={currentUser}
          onLogout={handleLogout}
          onOpenProfile={() => setActiveView('settings-profil')}
        />

        {/* Dynamic Sub-Module Body router */}
        <main className="flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto space-y-6">
          {activeView === 'dashboard' && (
            <DashboardHome currentRole={currentUser.role} currentUser={currentUser} />
          )}

          {activeView.startsWith('master-') && (
            <MasterDataModules activeView={activeView} onRefreshAll={() => {}} />
          )}

          {activeView.startsWith('akademik-') && (
            <AkademikModules
              activeView={activeView}
              currentRole={currentUser.role}
              currentUser={currentUser}
            />
          )}

          {activeView.startsWith('laporan-') && (
            <LaporanModules activeView={activeView} />
          )}

          {activeView.startsWith('settings-') && (
            <SettingsModules
              activeView={activeView}
              currentUser={currentUser}
              onUpdateCurrentUser={(updates) => setCurrentUser((prev) => ({ ...prev, ...updates }))}
            />
          )}
        </main>
      </div>
    </div>
  );
}
