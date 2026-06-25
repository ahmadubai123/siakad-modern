/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  LayoutDashboard,
  Database,
  GraduationCap,
  Award,
  BookOpen,
  Calendar,
  FileCheck,
  Percent,
  CheckSquare,
  Users,
  Settings,
  History,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Mail,
  User,
  LogOut,
  MessageSquare,
  MapPin,
  Building,
  Bookmark,
  Clock,
} from 'lucide-react';
import { useState } from 'react';

interface SidebarProps {
  currentRole: 'Administrator' | 'Dosen' | 'Mahasiswa';
  activeView: string;
  onSetView: (view: string) => void;
  sidebarOpen: boolean;
  onLogout: () => void;
  pendingKrsCount: number;
  pendingSuratCount: number;
}

export default function Sidebar({
  currentRole,
  activeView,
  onSetView,
  sidebarOpen,
  onLogout,
  pendingKrsCount,
  pendingSuratCount,
}: SidebarProps) {
  // Collapsible sections state
  const [openSection, setOpenSection] = useState<{ [key: string]: boolean }>({
    master: true,
    akademik: true,
    laporan: false,
    pengaturan: false,
  });

  const toggleSection = (section: string) => {
    setOpenSection((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const menuClass = (view: string) => {
    const isSelected = activeView === view;
    return `w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-md transition-all ${
      isSelected
        ? 'bg-blue-600 text-white shadow-sm font-semibold'
        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
    }`;
  };

  const folderClass = () => {
    return 'w-full flex items-center justify-between px-3 py-2 text-[10px] uppercase font-bold text-gray-500 hover:text-gray-300 transition-colors tracking-wider';
  };

  return (
    <aside
      className={`fixed top-0 bottom-0 left-0 z-30 w-64 bg-[#343a40] text-gray-300 border-r border-gray-700 transition-transform lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } flex flex-col justify-between`}
    >
      {/* Brand Header */}
      <div className="p-4 border-b-2 border-gray-200 flex items-center gap-3 bg-white shrink-0 shadow-lg">
        <img
          src="/images/logo.png"
          alt="Logo Universitas"
          className="h-8 w-8 object-contain"
        />
        <span className="text-blue-600 font-bold text-lg uppercase tracking-tight">SIAKAD v2.0</span>
      </div>

      {/* User Card */}
      <div className="p-4 flex items-center gap-3 border-b border-gray-700 mb-2 shrink-0 bg-[#343a40]">
        <div className="w-10 h-10 rounded-full bg-gray-600 overflow-hidden flex items-center justify-center text-white font-bold text-sm shrink-0 border border-gray-500">
          {currentRole[0]}
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-gray-200 text-sm font-medium truncate">{currentRole === 'Administrator' ? 'Super Admin' : currentRole}</span>
          <span className="text-green-400 text-[10px] flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-400"></span> Online
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {/* Dashboard */}
        <button
          id="menu-dashboard"
          onClick={() => onSetView('dashboard')}
          className={menuClass('dashboard')}
        >
          <div className="flex items-center gap-2.5">
            <LayoutDashboard className="w-4.5 h-4.5" />
            <span>Dashboard</span>
          </div>
        </button>

        {/* MASTER DATA (ADMIN ONLY) */}
        {currentRole === 'Administrator' && (
          <div>
            <button onClick={() => toggleSection('master')} className={folderClass()}>
              <div className="flex items-center gap-2">
                <Database className="w-3.5 h-3.5" />
                <span>DATA MASTER</span>
              </div>
              {openSection.master ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
            {openSection.master && (
              <div className="pl-3 mt-1 space-y-1">
                <button
                  id="menu-mhs"
                  onClick={() => onSetView('master-mahasiswa')}
                  className={menuClass('master-mahasiswa')}
                >
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>Mahasiswa</span>
                  </div>
                </button>
                <button
                  id="menu-dosen"
                  onClick={() => onSetView('master-dosen')}
                  className={menuClass('master-dosen')}
                >
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>Dosen</span>
                  </div>
                </button>
                <button
                  onClick={() => onSetView('master-fakultas')}
                  className={menuClass('master-fakultas')}
                >
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4" />
                    <span>Fakultas</span>
                  </div>
                </button>
                <button
                  onClick={() => onSetView('master-prodi')}
                  className={menuClass('master-prodi')}
                >
                  <div className="flex items-center gap-2">
                    <Bookmark className="w-4 h-4" />
                    <span>Program Studi</span>
                  </div>
                </button>
                <button
                  onClick={() => onSetView('master-matakuliah')}
                  className={menuClass('master-matakuliah')}
                >
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    <span>Mata Kuliah</span>
                  </div>
                </button>
                <button
                  onClick={() => onSetView('master-semester')}
                  className={menuClass('master-semester')}
                >
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>Semester</span>
                  </div>
                </button>
                <button
                  onClick={() => onSetView('master-tahun-akademik')}
                  className={menuClass('master-tahun-akademik')}
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>Tahun Akademik</span>
                  </div>
                </button>
                <button
                  onClick={() => onSetView('master-kelas')}
                  className={menuClass('master-kelas')}
                >
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4" />
                    <span>Kelas</span>
                  </div>
                </button>
                <button
                  onClick={() => onSetView('master-jadwal')}
                  className={menuClass('master-jadwal')}
                >
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>Jadwal</span>
                  </div>
                </button>
              </div>
            )}
          </div>
        )}

        {/* AKADEMIK (ROLE SPECIFIC FILTERING) */}
        <div>
          <button onClick={() => toggleSection('akademik')} className={folderClass()}>
            <div className="flex items-center gap-2">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>AKADEMIK</span>
            </div>
            {openSection.akademik ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
          {openSection.akademik && (
            <div className="pl-3 mt-1 space-y-1">
              {/* KRS (Visible to Admin & Mhs) */}
              {(currentRole === 'Administrator' || currentRole === 'Mahasiswa') && (
                <button
                  id="menu-krs"
                  onClick={() => onSetView('akademik-krs')}
                  className={menuClass('akademik-krs')}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <FileCheck className="w-4 h-4" />
                      <span>KRS</span>
                    </div>
                    {currentRole === 'Administrator' && pendingKrsCount > 0 && (
                      <span className="px-1.5 py-0.5 text-[10px] bg-rose-500 text-white rounded-full font-bold">
                        {pendingKrsCount}
                      </span>
                    )}
                  </div>
                </button>
              )}

              {/* Nilai (Visible to Admin, Dosen, Mhs) */}
              <button
                id="menu-nilai"
                onClick={() => onSetView('akademik-nilai')}
                className={menuClass('akademik-nilai')}
              >
                <div className="flex items-center gap-2">
                  <Percent className="w-4 h-4" />
                  <span>Nilai Mahasiswa</span>
                </div>
              </button>

              {/* Transkrip & IPK (Visible to Mhs & Admin) */}
              {(currentRole === 'Administrator' || currentRole === 'Mahasiswa') && (
                <button
                  onClick={() => onSetView('akademik-transkrip')}
                  className={menuClass('akademik-transkrip')}
                >
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4" />
                    <span>Transkrip Nilai</span>
                  </div>
                </button>
              )}

              {/* Absensi & QR Code (Visible to Mhs & Dosen) */}
              {(currentRole === 'Dosen' || currentRole === 'Mahasiswa') && (
                <button
                  onClick={() => onSetView('akademik-absensi')}
                  className={menuClass('akademik-absensi')}
                >
                  <div className="flex items-center gap-2">
                    <CheckSquare className="w-4 h-4" />
                    <span>Absensi Perkuliahan</span>
                  </div>
                </button>
              )}

              {/* Kalender Akademik (All Roles) */}
              <button
                onClick={() => onSetView('akademik-kalender')}
                className={menuClass('akademik-kalender')}
              >
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Kalender Akademik</span>
                </div>
              </button>

              {/* Chat Mahasiswa-Dosen (All Roles) */}
              <button
                onClick={() => onSetView('akademik-chat')}
                className={menuClass('akademik-chat')}
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  <span>Chat Akademik</span>
                </div>
              </button>

              {/* Surat Akademik (Mhs & Admin) */}
              {(currentRole === 'Administrator' || currentRole === 'Mahasiswa') && (
                <button
                  onClick={() => onSetView('akademik-surat')}
                  className={menuClass('akademik-surat')}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      <span>Surat Akademik</span>
                    </div>
                    {currentRole === 'Administrator' && pendingSuratCount > 0 && (
                      <span className="px-1.5 py-0.5 text-[10px] bg-amber-500 text-white rounded-full font-bold">
                        {pendingSuratCount}
                      </span>
                    )}
                  </div>
                </button>
              )}

              {/* Evaluasi Dosen (Mhs Only) */}
              {currentRole === 'Mahasiswa' && (
                <button
                  onClick={() => onSetView('akademik-evaluasi')}
                  className={menuClass('akademik-evaluasi')}
                >
                  <div className="flex items-center gap-2">
                    <ClipboardList className="w-4 h-4" />
                    <span>Evaluasi Dosen</span>
                  </div>
                </button>
              )}
            </div>
          )}
        </div>

        {/* LAPORAN (ADMIN ONLY) */}
        {currentRole === 'Administrator' && (
          <div>
            <button onClick={() => toggleSection('laporan')} className={folderClass()}>
              <div className="flex items-center gap-2">
                <FileCheck className="w-3.5 h-3.5" />
                <span>LAPORAN</span>
              </div>
              {openSection.laporan ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
            {openSection.laporan && (
              <div className="pl-3 mt-1 space-y-1">
                <button
                  onClick={() => onSetView('laporan-mahasiswa')}
                  className={menuClass('laporan-mahasiswa')}
                >
                  <span>Laporan Mahasiswa</span>
                </button>
                <button
                  onClick={() => onSetView('laporan-dosen')}
                  className={menuClass('laporan-dosen')}
                >
                  <span>Laporan Dosen</span>
                </button>
                <button
                  onClick={() => onSetView('laporan-nilai')}
                  className={menuClass('laporan-nilai')}
                >
                  <span>Laporan Nilai</span>
                </button>
                <button
                  onClick={() => onSetView('laporan-ipk')}
                  className={menuClass('laporan-ipk')}
                >
                  <span>Laporan IPK & Prestasi</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* PENGATURAN (ALL ROLES, ROLE RESTRICTED INSIDE) */}
        <div>
          <button onClick={() => toggleSection('pengaturan')} className={folderClass()}>
            <div className="flex items-center gap-2">
              <Settings className="w-3.5 h-3.5" />
              <span>PENGATURAN</span>
            </div>
            {openSection.pengaturan ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
          {openSection.pengaturan && (
            <div className="pl-3 mt-1 space-y-1">
              <button
                onClick={() => onSetView('pengaturan-profil')}
                className={menuClass('pengaturan-profil')}
              >
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>Profil Saya</span>
                </div>
              </button>

              {currentRole === 'Administrator' && (
                <>
                  <button
                    onClick={() => onSetView('pengaturan-user')}
                    className={menuClass('pengaturan-user')}
                  >
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>Manajemen User</span>
                    </div>
                  </button>
                  <button
                    onClick={() => onSetView('pengaturan-role')}
                    className={menuClass('pengaturan-role')}
                  >
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Role & Permission</span>
                    </div>
                  </button>
                  <button
                    onClick={() => onSetView('pengaturan-backup')}
                    className={menuClass('pengaturan-backup')}
                  >
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4" />
                      <span>Backup Database</span>
                    </div>
                  </button>
                  <button
                    onClick={() => onSetView('pengaturan-audit')}
                    className={menuClass('pengaturan-audit')}
                  >
                    <div className="flex items-center gap-2">
                      <History className="w-4 h-4" />
                      <span>Audit Log</span>
                    </div>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer Profile summary */}
      <div className="p-3 border-t border-gray-700 bg-[#2f353a]">
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold text-red-400 hover:bg-gray-700 rounded-md border border-gray-700 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Keluar Sistem</span>
        </button>
      </div>
    </aside>
  );
}
