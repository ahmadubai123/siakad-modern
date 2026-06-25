/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Sun, Moon, Bell, Menu, GraduationCap, ChevronDown, LogOut, User, RefreshCw } from 'lucide-react';
import { useState } from 'react';

interface NavbarProps {
  currentRole: 'Administrator' | 'Dosen' | 'Mahasiswa';
  onChangeRole: (role: 'Administrator' | 'Dosen' | 'Mahasiswa') => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  currentUser: { displayName: string; email: string; username: string };
  onLogout: () => void;
  onOpenProfile: () => void;
}

export default function Navbar({
  currentRole,
  onChangeRole,
  darkMode,
  onToggleDarkMode,
  sidebarOpen,
  onToggleSidebar,
  currentUser,
  onLogout,
  onOpenProfile,
}: NavbarProps) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const notifications = [
    { id: 1, text: 'Nilai Pemrograman Web telah diinput oleh Dr. Budi', time: '5 menit yang lalu', unread: true },
    { id: 2, text: 'Jadwal Basis Data dipindahkan ke Ruang Lab-2', time: '1 jam yang lalu', unread: true },
    { id: 3, text: 'Pengisian KRS Semester Ganjil 2026/2027 telah dibuka', time: '1 hari yang lalu', unread: false },
    { id: 4, text: 'Pengajuan surat Aktif Kuliah Anda telah disetujui', time: '2 hari yang lalu', unread: false },
  ];

  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <nav className="sticky top-0 z-40 flex items-center justify-between w-full h-16 px-4 border-b bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 transition-colors">
      {/* Left section: Logo and Toggle */}
      <div className="flex items-center gap-3">
        <button
          id="toggle-sidebar-btn"
          onClick={onToggleSidebar}
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 lg:ml-2">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-600 text-white shadow-md">
            <GraduationCap className="w-5 h-5" />
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-800 dark:text-white hidden sm:inline-block">
            SIAKAD<span className="text-blue-600">Modern</span>
          </span>
        </div>

        {/* Semester Badge */}
        <span className="hidden md:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/30 ml-4">
          Ganjil 2026/2027 — Aktif
        </span>
      </div>

      {/* Right section: Actions and User profile */}
      <div className="flex items-center gap-2">
        {/* Quick Role Switcher (Simulated Spatie Authorizations) */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <RefreshCw className="w-3.5 h-3.5 text-slate-500 animate-spin-slow" />
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 hidden lg:inline">Role:</span>
          <select
            id="role-switcher"
            value={currentRole}
            onChange={(e) => onChangeRole(e.target.value as any)}
            className="text-xs font-semibold bg-transparent text-slate-800 dark:text-slate-100 focus:outline-none cursor-pointer"
          >
            <option value="Administrator" className="bg-white dark:bg-slate-800">Admin</option>
            <option value="Dosen" className="bg-white dark:bg-slate-800">Dosen</option>
            <option value="Mahasiswa" className="bg-white dark:bg-slate-800">Mahasiswa</option>
          </select>
        </div>

        {/* Dark Mode Toggle */}
        <button
          id="dark-mode-btn"
          onClick={onToggleDarkMode}
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Toggle Tema"
        >
          {darkMode ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            id="notif-bell-btn"
            onClick={() => {
              setNotifOpen(!notifOpen);
              setProfileOpen(false);
            }}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 relative transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 text-[10px] font-bold text-white bg-rose-500 rounded-full flex items-center justify-center animate-bounce">
                {unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl z-50">
              <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="font-semibold text-sm text-slate-800 dark:text-slate-100">Notifikasi</span>
                <span className="text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">Tandai dibaca</span>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-3 border-b border-slate-50 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer ${
                      n.unread ? 'bg-blue-50/20 dark:bg-blue-950/10' : ''
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full mt-1.5 ${n.unread ? 'bg-blue-500' : 'bg-transparent'}`} />
                      <div>
                        <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-normal">{n.text}</p>
                        <span className="text-[10px] text-slate-400 mt-1 block">{n.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            id="profile-dropdown-btn"
            onClick={() => {
              setProfileOpen(!profileOpen);
              setNotifOpen(false);
            }}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold text-sm shadow">
              {currentUser.displayName ? currentUser.displayName.charAt(0) : 'U'}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 leading-tight">
                {currentUser.displayName}
              </p>
              <p className="text-[10px] text-slate-400 leading-none">{currentRole}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 hidden md:block" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl z-50">
              <div className="p-3 border-b border-slate-100 dark:border-slate-800">
                <p className="text-xs text-slate-400">Masuk sebagai</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{currentUser.displayName}</p>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">{currentUser.email}</p>
              </div>
              <div className="p-1">
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    onOpenProfile();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-left"
                >
                  <User className="w-4 h-4" />
                  Profil Saya
                </button>
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    onLogout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg text-left"
                >
                  <LogOut className="w-4 h-4" />
                  Keluar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
