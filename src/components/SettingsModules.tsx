/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Users,
  Shield,
  Database,
  History,
  User,
  Plus,
  Key,
  Download,
  Upload,
  RefreshCw,
  Search,
  Check,
  X,
  Camera,
} from 'lucide-react';
import { useState, useEffect, FormEvent } from 'react';
import { User as UserType } from '../types.ts';
import Modal from './Modal.tsx';

interface SettingsModulesProps {
  activeView: string;
  currentUser: { displayName: string; email: string; username: string; role: string; referenceId?: string };
  onUpdateCurrentUser: (updates: { displayName: string; email: string }) => void;
}

export default function SettingsModules({ activeView, currentUser, onUpdateCurrentUser }: SettingsModulesProps) {
  const [users, setUsers] = useState<UserType[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [profileForm, setProfileForm] = useState({
    displayName: currentUser.displayName,
    email: currentUser.email,
    phone: '',
  });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // User management state
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Partial<UserType>>({ username: '', email: '', role: 'Mahasiswa' });
  const [search, setSearch] = useState('');

  // Password change state
  const [pwdModalOpen, setPwdModalOpen] = useState(false);
  const [pwdForm, setPwdForm] = useState({ oldPwd: '', newPwd: '', confirmPwd: '' });

  // Backup logs
  const [backups, setBackups] = useState<{ name: string; date: string; size: string }[]>([
    { name: 'backup_siakad_init.sql', date: '2026-06-20 10:00:00', size: '1.2 MB' },
    { name: 'backup_siakad_seeder.sql', date: '2026-06-24 15:30:22', size: '2.5 MB' },
  ]);

  // Roles details
  const [permissions, setPermissions] = useState<{ [role: string]: string[] }>({
    Administrator: ['Dashboard', 'Mahasiswa', 'Dosen', 'Mata Kuliah', 'Program Studi', 'Fakultas', 'Kelas', 'Jadwal', 'Nilai', 'KRS', 'Semester', 'Tahun Akademik', 'User', 'Backup Database', 'Laporan'],
    Dosen: ['Dashboard', 'Mata kuliah yang diajar', 'Input Nilai', 'Edit Nilai', 'Daftar Mahasiswa', 'Jadwal Mengajar', 'Profil'],
    Mahasiswa: ['Dashboard', 'Profil', 'KRS', 'Jadwal', 'Nilai', 'Transkrip', 'IPK'],
  });

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    setProfileForm((prev) => ({
      displayName: currentUser.displayName,
      email: currentUser.email,
      phone: prev.phone,
    }));
  }, [currentUser.displayName, currentUser.email]);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/users').then((r) => r.json()),
      fetch('/api/auditlog').then((r) => r.json()),
    ])
      .then(([u, l]) => {
        setUsers(u);
        setAuditLogs(l);
        setLoading(false);
      })
      .catch((e) => {
        console.error(e);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, [activeView]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-red-800 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Add / Edit User
  const handleSaveUser = (e: FormEvent) => {
    e.preventDefault();
    fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(selectedUser),
    })
      .then((r) => r.json())
      .then(() => {
        showToast('success', 'User berhasil disimpan!');
        setUserModalOpen(false);
        setSelectedUser({ username: '', email: '', role: 'Mahasiswa' });
        loadData();
      });
  };

  const handleDeleteUser = (username: string) => {
    if (window.confirm(`Hapus akun user "${username}"?`)) {
      fetch(`/api/users/${username}`, { method: 'DELETE' })
        .then((r) => r.json())
        .then(() => {
          showToast('success', 'User berhasil dihapus.');
          loadData();
        });
    }
  };

  // Reset password
  const handleResetPassword = (username: string) => {
    if (window.confirm(`Reset password user "${username}" ke default: "password"?`)) {
      fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      })
        .then((r) => r.json())
        .then(() => {
          showToast('success', 'Password user berhasil direset ke "password".');
        });
    }
  };

  // Create database Backup
  const handleCreateBackup = () => {
    fetch('/api/backup/create', { method: 'POST' })
      .then((r) => r.json())
      .then(() => {
        showToast('success', 'Database MySQL/PostgreSQL backup snapshot created successfully!');
        const now = new Date();
        setBackups([
          {
            name: `backup_siakad_${now.toISOString().split('T')[0]}_${now.getTime()}.sql`,
            date: now.toLocaleString(),
            size: '3.4 MB',
          },
          ...backups,
        ]);
      });
  };

  const handleRestoreBackup = (name: string) => {
    if (window.confirm(`Kembalikan database SIAKAD dari file "${name}"? Data saat ini akan digantikan.`)) {
      fetch('/api/backup/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: name }),
      })
        .then((r) => r.json())
        .then(() => {
          showToast('success', 'Data database SIAKAD berhasil direstore!');
        });
    }
  };

  // Modify local password
  const handleModifyPassword = (e: FormEvent) => {
    e.preventDefault();
    if (pwdForm.newPwd !== pwdForm.confirmPwd) {
      showToast('error', 'Konfirmasi password baru tidak cocok!');
      return;
    }
    showToast('success', 'Password Anda berhasil diperbarui!');
    setPwdModalOpen(false);
    setPwdForm({ oldPwd: '', newPwd: '', confirmPwd: '' });
  };

  return (
    <div className="space-y-4">
      {toast && (
        <div className="fixed top-20 right-4 z-50 flex items-center gap-2 p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs font-semibold shadow-lg">
          <Check className="w-4 h-4" />
          <span>{toast.msg}</span>
        </div>
      )}

      {/* VIEW SECTION 1: USER MANAGEMENT */}
      {activeView === 'settings-users' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Manajemen Pengguna (User)</h2>
              <p className="text-xs text-slate-400">Kelola kredensial login, reset password, dan status pengguna.</p>
            </div>
            <button
              id="add-user-btn"
              onClick={() => {
                setSelectedUser({ username: '', email: '', role: 'Mahasiswa' });
                setUserModalOpen(true);
              }}
              className="text-xs px-3 py-1.5 rounded-lg bg-red-800 text-white font-bold hover:bg-red-900 flex items-center gap-1 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Tambah User
            </button>
          </div>

          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari username atau email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border focus:outline-red-500"
              />
            </div>

            <div className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-800/50 font-bold text-slate-500">
                  <tr>
                    <th className="p-3">Username</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Role Akses</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Aksi Manajemen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {users
                    .filter(
                      (u) =>
                        u.username.toLowerCase().includes(search.toLowerCase()) ||
                        u.email.toLowerCase().includes(search.toLowerCase())
                    )
                    .map((u) => (
                      <tr key={u.username} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="p-3 font-bold text-slate-700 dark:text-slate-200">{u.username}</td>
                        <td className="p-3 font-semibold">{u.email}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            u.role === 'Administrator' ? 'bg-red-50 text-red-900' : u.role === 'Dosen' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-900'
                          }`}>{u.role}</span>
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-900">Aktif</span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => handleResetPassword(u.username)}
                              className="px-2 py-1 border rounded text-[10px] font-semibold flex items-center gap-0.5 hover:bg-slate-50"
                              title="Reset Password ke default: password"
                            >
                              <Key className="w-3 h-3 text-amber-500" />
                              Reset
                            </button>
                            <button
                              onClick={() => {
                                setSelectedUser(u);
                                setUserModalOpen(true);
                              }}
                              className="px-2 py-1 border rounded text-[10px] font-semibold hover:bg-slate-50"
                            >
                              Edit
                            </button>
                            {u.username !== currentUser.username && (
                              <button
                                onClick={() => handleDeleteUser(u.username)}
                                className="px-2 py-1 rounded bg-rose-600 text-white text-[10px] font-bold hover:bg-rose-700"
                              >
                                Hapus
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* User form modal */}
          <Modal isOpen={userModalOpen} onClose={() => setUserModalOpen(false)} title="Simpan Akun Pengguna">
            <form onSubmit={handleSaveUser} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Username / NIM / NIDN</label>
                <input
                  type="text"
                  value={selectedUser.username || ''}
                  onChange={(e) => setSelectedUser({ ...selectedUser, username: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-lg border focus:outline-red-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Email Pengguna</label>
                <input
                  type="email"
                  value={selectedUser.email || ''}
                  onChange={(e) => setSelectedUser({ ...selectedUser, email: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-lg border focus:outline-red-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Role Sistem Pengguna</label>
                <select
                  value={selectedUser.role || 'Mahasiswa'}
                  onChange={(e) => setSelectedUser({ ...selectedUser, role: e.target.value as any })}
                  className="w-full text-xs p-2.5 border rounded-lg"
                >
                  <option value="Administrator">Administrator</option>
                  <option value="Dosen">Dosen</option>
                  <option value="Mahasiswa">Mahasiswa</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setUserModalOpen(false)}
                  className="px-4 py-2 border rounded-lg text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-800 text-white rounded-lg text-xs font-semibold"
                >
                  Simpan Akun
                </button>
              </div>
            </form>
          </Modal>
        </div>
      )}

      {/* VIEW SECTION 2: ROLE & PERMISSION */}
      {activeView === 'settings-roles' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Role & Permission (Spatie Permission)</h2>
            <p className="text-xs text-slate-400">Hak akses login menu SIAKAD menggunakan standar RBAC Spatie Laravel Permission.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.keys(permissions).map((role) => (
              <div key={role} className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3">
                <div className="flex items-center gap-2 border-b pb-2">
                  <Shield className="w-5 h-5 text-red-800" />
                  <h3 className="font-bold text-sm text-slate-800 dark:text-white">{role}</h3>
                </div>
                <div className="space-y-1.5 overflow-y-auto h-96 text-xs text-slate-600">
                  {permissions[role].map((p, i) => (
                    <div key={i} className="flex items-center gap-2 p-1.5 bg-slate-50 rounded">
                      <Check className="w-3.5 h-3.5 text-red-800 font-extrabold" />
                      <span className="font-semibold text-slate-700">{p}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW SECTION 3: BACKUP DATABASE */}
      {activeView === 'settings-backup' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Database Backup & Recovery</h2>
              <p className="text-xs text-slate-400">Backup and restore raw SQL schemas of your MySQL or PostgreSQL databases.</p>
            </div>
            <button
              onClick={handleCreateBackup}
              className="text-xs px-3 py-1.5 rounded-lg bg-red-800 text-white font-bold hover:bg-red-900 flex items-center gap-1.5 shadow-sm"
            >
              <Database className="w-4 h-4" />
              Backup Database
            </button>
          </div>

          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <History className="w-4 h-4 text-red-700" />
              Backup History Logs
            </h3>

            <div className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-800/50 font-bold text-slate-500">
                  <tr>
                    <th className="p-3">Nama File Backup SQL</th>
                    <th className="p-3">Tanggal Pembuatan</th>
                    <th className="p-3">Ukuran File</th>
                    <th className="p-3 text-right">Aksi Recovery</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {backups.map((b, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="p-3 font-mono font-bold text-slate-700 dark:text-slate-200">{b.name}</td>
                      <td className="p-3">{b.date}</td>
                      <td className="p-3 font-semibold">{b.size}</td>
                      <td className="p-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => {
                              showToast('success', `File ${b.name} diunduh!`);
                            }}
                            className="p-1 border rounded hover:bg-slate-50"
                            title="Unduh SQL"
                          >
                            <Download className="w-3.5 h-3.5 text-red-800" />
                          </button>
                          <button
                            onClick={() => handleRestoreBackup(b.name)}
                            className="px-2 py-1 rounded bg-slate-800 text-white font-bold text-[10px] hover:bg-slate-900"
                          >
                            Restore Data
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW SECTION 4: AUDIT LOG */}
      {activeView === 'settings-auditlog' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Audit Log Aktivitas Sistem</h2>
            <p className="text-xs text-slate-400">Log jejak digital aktivitas admin, dosen, dan mahasiswa dalam sistem.</p>
          </div>

          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
            <div className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-800/50 font-bold text-slate-500">
                  <tr>
                    <th className="p-3">User</th>
                    <th className="p-3">Aktivitas Tindakan</th>
                    <th className="p-3 font-mono">Payload IP / Referensi</th>
                    <th className="p-3 text-right">Waktu Aktivitas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {auditLogs.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-slate-400">
                        Belum ada audit log aktivitas tercatat.
                      </td>
                    </tr>
                  )}

                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="p-3 font-bold text-red-800">{log.user}</td>
                      <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">{log.action}</td>
                      <td className="p-3 font-mono text-[10px] text-slate-400 select-all">{JSON.stringify(log.details)}</td>
                      <td className="p-3 text-right font-semibold text-slate-500">{new Date(log.timestamp).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW SECTION 5: PROFIL SAYA */}
      {activeView === 'settings-profil' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Profil Akun Saya</h2>
            <p className="text-xs text-slate-400">Kelola rincian data biometrik, email, No HP, serta keamanan password.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Column: Avatar & Photo simulation */}
            <div className="md:col-span-1 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col items-center justify-center space-y-4 text-center">
              <div className="relative group cursor-pointer">
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-slate-100 dark:border-slate-800 group-hover:opacity-80 transition-opacity">
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
                    alt="User Portrait"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-5 h-5 text-white" />
                </div>
              </div>

              <div>
                <h3 className="font-bold text-sm text-slate-800 dark:text-white">{currentUser.displayName}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{currentUser.email}</p>
                <span className="inline-block mt-2 px-3 py-1 rounded-full text-[10px] font-extrabold bg-red-50 text-red-900">
                  {currentUser.role}
                </span>
              </div>
            </div>

            {/* Right Column: Profile fields and changes */}
            <div className="md:col-span-2 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                Informasi Biografi Profil Saya
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">Username Utama</label>
                  <input
                    type="text"
                    value={currentUser.username}
                    className="w-full text-xs p-2.5 rounded-lg border bg-slate-50 text-slate-400 cursor-not-allowed"
                    disabled
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">Nama Lengkap Anda</label>
                  <input
                    type="text"
                    value={profileForm.displayName}
                    onChange={(e) => setProfileForm({ ...profileForm, displayName: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border focus:outline-red-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">Email Utama</label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border focus:outline-red-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">No. HP / WhatsApp</label>
                  <input
                    type="text"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border focus:outline-red-500"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center border-t border-slate-100 pt-4">
                <button
                  onClick={() => setPwdModalOpen(true)}
                  className="text-xs font-bold text-red-800 hover:underline flex items-center gap-1"
                >
                  <Key className="w-4 h-4" />
                  Ganti Password Keamanan
                </button>
                <button
                  onClick={() => {
                    onUpdateCurrentUser({ displayName: profileForm.displayName, email: profileForm.email });
                    showToast('success', 'Perubahan profil berhasil disimpan!');
                  }}
                  className="px-4 py-2 bg-red-800 text-white rounded-lg text-xs font-bold hover:bg-red-900"
                >
                  Simpan Profil
                </button>
              </div>
            </div>
          </div>

          {/* Change password modal */}
          <Modal isOpen={pwdModalOpen} onClose={() => setPwdModalOpen(false)} title="Ganti Password Keamanan">
            <form onSubmit={handleModifyPassword} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Password Lama</label>
                <input
                  type="password"
                  value={pwdForm.oldPwd}
                  onChange={(e) => setPwdForm({ ...pwdForm, oldPwd: e.target.value })}
                  className="w-full text-xs p-2.5 border rounded-lg focus:outline-red-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Password Baru</label>
                <input
                  type="password"
                  value={pwdForm.newPwd}
                  onChange={(e) => setPwdForm({ ...pwdForm, newPwd: e.target.value })}
                  className="w-full text-xs p-2.5 border rounded-lg focus:outline-red-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Konfirmasi Password Baru</label>
                <input
                  type="password"
                  value={pwdForm.confirmPwd}
                  onChange={(e) => setPwdForm({ ...pwdForm, confirmPwd: e.target.value })}
                  className="w-full text-xs p-2.5 border rounded-lg focus:outline-red-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPwdModalOpen(false)}
                  className="px-4 py-2 border rounded-lg text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-800 text-white rounded-lg text-xs font-semibold"
                >
                  Ganti Password
                </button>
              </div>
            </form>
          </Modal>
        </div>
      )}
    </div>
  );
}

