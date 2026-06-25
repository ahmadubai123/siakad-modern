/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Users,
  GraduationCap,
  Building,
  BookOpen,
  UserCheck,
  TrendingUp,
  Activity,
  Calendar,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import { useEffect, useState, FormEvent } from 'react';

interface DashboardHomeProps {
  currentRole: 'Administrator' | 'Dosen' | 'Mahasiswa';
  currentUser: { displayName: string; email: string; username: string; referenceId?: string };
}

export default function DashboardHome({ currentRole, currentUser }: DashboardHomeProps) {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState<any[]>([
    {
      id: 1,
      title: 'Pengisian KRS Ganjil 2026/2027',
      content: 'Bagi seluruh mahasiswa diharap segera melengkapi pengisian KRS paling lambat tanggal 15 Juli 2026. Persetujuan KRS dilakukan oleh dosen wali.',
      date: '2026-06-24',
      author: 'Akademik Pusat',
    },
    {
      id: 2,
      title: 'Pelaksanaan UTS Semester Genap',
      content: 'Ujian Tengah Semester akan diselenggarakan secara luring pada tanggal 5 Oktober - 16 Oktober 2026. Jadwal lengkap per kelas dapat diunduh di menu Kalender Akademik.',
      date: '2026-06-20',
      author: 'BAAK',
    },
  ]);

  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [showAnnounceForm, setShowAnnounceForm] = useState(false);

  useEffect(() => {
    fetch('/api/analytics')
      .then((res) => res.json())
      .then((data) => {
        setAnalytics(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching analytics', err);
        setLoading(false);
      });
  }, []);

  const handleAddAnnouncement = (e: FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newContent) return;
    const announce = {
      id: Date.now(),
      title: newTitle,
      content: newContent,
      date: new Date().toISOString().split('T')[0],
      author: currentUser.displayName,
    };
    setAnnouncements([announce, ...announcements]);
    setNewTitle('');
    setNewContent('');
    setShowAnnounceForm(false);
  };

  if (loading || !analytics) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-2">
          <div className="w-10 h-10 border-4 border-red-800 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-slate-500">Memuat analisis dashboard...</p>
        </div>
      </div>
    );
  }

  const { cards, charts, recentActivities } = analytics;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-800 to-red-700 p-6 sm:p-8 text-white shadow-lg">
        <div className="relative z-10 space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-md text-white">
            <Activity className="w-3.5 h-3.5 animate-pulse" />
            Sistem Informasi Akademik Terintegrasi
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Selamat Datang, {currentUser.displayName}!
          </h1>
          <p className="text-sm sm:text-base text-red-200 max-w-2xl font-light">
            Anda login sebagai <span className="font-bold text-white underline">{currentRole}</span>. Kelola dan pantau seluruh data akademik Universitas melalui dashboard terpusat ini.
          </p>
        </div>
        {/* Abstract background circles */}
        <div className="absolute right-0 bottom-0 top-0 w-1/2 opacity-15 hidden md:block">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <circle cx="80" cy="50" r="30" fill="white" />
            <circle cx="40" cy="80" r="20" fill="white" />
          </svg>
        </div>
      </div>

      {/* Counters Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Card Mahasiswa */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-600">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Mahasiswa</p>
            <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{cards.totalMahasiswa}</p>
          </div>
        </div>

        {/* Card Dosen */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-600">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Dosen</p>
            <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{cards.totalDosen}</p>
          </div>
        </div>

        {/* Card Fakultas */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
          <div className="p-3 rounded-lg bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Fakultas</p>
            <p className="text-xl font-bold text-slate-800 dark:text-slate-100">2</p>
          </div>
        </div>

        {/* Card Prodi */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 text-indigo-600 dark:text-red-600">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Prodi</p>
            <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{cards.totalProdi}</p>
          </div>
        </div>

        {/* Card MK */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
          <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Mata Kuliah</p>
            <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{cards.totalMataKuliah}</p>
          </div>
        </div>

        {/* Card User */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Sistem User</p>
            <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{cards.totalUser}</p>
          </div>
        </div>
      </div>

      {/* Main Charts Block */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Chart 1: Mahasiswa per Prodi */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-red-700" />
              Grafik Distribusi Mahasiswa per Program Studi
            </h3>
          </div>
          {/* Custom SVG Bar Chart */}
          <div className="h-64 flex flex-col justify-between">
            <div className="flex-1 flex items-end gap-6 px-4">
              {charts.mahasiswaPerProdi.map((item: any, idx: number) => {
                const maxVal = Math.max(...charts.mahasiswaPerProdi.map((x: any) => x.value), 1);
                const heightPct = (item.value / maxVal) * 80 + 10; // min height 10%
                const barColors = ['bg-red-800', 'bg-red-700', 'bg-red-400', 'bg-red-300'];
                const color = barColors[idx % barColors.length];

                return (
                  <div key={item.name} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer">
                    <div className="relative w-full flex items-end justify-center h-44 bg-slate-50 dark:bg-slate-800/50 rounded-lg overflow-hidden">
                      {/* Tooltip on hover */}
                      <div className="absolute top-2 px-1.5 py-0.5 rounded-md bg-slate-800 text-white text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                        {item.value} Mahasiswa
                      </div>
                      <div
                        style={{ height: `${heightPct}%` }}
                        className={`w-full ${color} rounded-t-md group-hover:brightness-95 transition-all duration-500 shadow-xs flex items-center justify-center`}
                      >
                        <span className="text-[10px] font-bold text-white mb-1">{item.value}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 text-center truncate w-full">
                      {item.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Chart 2: Grade Distribution */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
          <div className="flex flex-col gap-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-red-700" />
                Grafik Nilai Akademik (Distribusi Grade SKS)
              </h3>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-full sm:max-w-xl leading-relaxed">
              Persentase dihitung dari total SKS saat ini. Label setiap bar ditempatkan dengan rapi agar laporan tetap bersih dan mudah dibaca.
            </p>
          </div>
          {/* Horizontal Progress Bars */}
          <div className="flex flex-col gap-3 px-1">
            {(() => {
              const totalSKS = Math.max(
                charts.gradeDistribution.reduce((s: number, g: any) => s + (g.value || 0), 0),
                0
              );

              return charts.gradeDistribution.map((grade: any, index: number) => {
                const pct = totalSKS > 0 ? Math.round((grade.value / totalSKS) * 100) : 0;
                const displayPct = pct; // use actual percentage
                const barColors = ['bg-red-800', 'bg-red-700', 'bg-red-300', 'bg-red-400', 'bg-amber-500', 'bg-orange-500', 'bg-rose-500'];
                const color = barColors[index % barColors.length];

                return (
                  <div key={grade.name} className="space-y-1">
                    <div className="flex justify-between items-center text-xs font-semibold text-slate-600 dark:text-slate-400">
                      <span className="flex flex-1 items-center gap-2 overflow-hidden">
                        <span className="min-w-[70px] truncate">Grade {grade.name}</span>
                        <span className="text-[11px] text-slate-400 truncate">{grade.value} SKS</span>
                      </span>
                      <span className="ml-2 min-w-[32px] text-right text-[12px] font-bold text-slate-700 dark:text-slate-200">{displayPct}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${displayPct}%` }}
                        className={`h-full ${color} rounded-full transition-all duration-500`}
                      />
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>

        {/* Chart 3: Rata-rata IPK per Prodi */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-red-700" />
              Dashboard Analitis: Rata-Rata IPK Tertinggi per Prodi
            </h3>
          </div>
          {/* Horizontal Column Display */}
          <div className="h-64 flex flex-col justify-center space-y-4 px-2">
            {charts.ipkPerProdi.map((item: any, idx: number) => {
              const scorePct = (item.value / 4.0) * 100;
              return (
                <div key={item.name} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{item.name}</span>
                    <span className="font-bold text-red-800 dark:text-red-600 bg-red-50 dark:bg-red-950/30 px-2 py-0.5 rounded-md">
                      {item.value} / 4.00
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-4 rounded-lg overflow-hidden flex">
                    <div
                      style={{ width: `${scorePct}%` }}
                      className="bg-gradient-to-r from-red-700 to-red-600 h-full rounded-l-lg"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 4: Kehadiran Kuliah per Kelas */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-red-700" />
              Tingkat Presensi / Kehadiran Mahasiswa per Kelas (%)
            </h3>
          </div>
          {/* Mini Gauge Representation */}
          <div className="h-64 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 items-center">
            {charts.attendanceRate.map((item: any) => (
              <div key={item.name} className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-2">
                <div className="relative flex items-center justify-center w-20 h-20">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="40"
                      cy="40"
                      r="32"
                      strokeWidth="6"
                      stroke="currentColor"
                      className="text-slate-100 dark:text-slate-800"
                      fill="transparent"
                    />
                    <circle
                      cx="40"
                      cy="40"
                      r="32"
                      strokeWidth="6"
                      strokeDasharray={2 * Math.PI * 32}
                      strokeDashoffset={2 * Math.PI * 32 * (1 - item.rate / 100)}
                      strokeLinecap="round"
                      stroke="currentColor"
                      className="text-teal-500"
                      fill="transparent"
                    />
                  </svg>
                  <span className="absolute text-sm font-extrabold text-slate-800 dark:text-white">
                    {item.rate}%
                  </span>
                </div>
                <div className="text-center">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{item.name}</p>
                  <p className="text-[10px] text-slate-400">Rata-rata Presensi</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Grid: Announcements & Audit logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Announcement Section */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Calendar className="w-4.5 h-4.5 text-red-700" />
                Pengumuman Kampus Terbaru
              </h3>
              {currentRole === 'Administrator' && (
                <button
                  onClick={() => setShowAnnounceForm(!showAnnounceForm)}
                  className="text-xs px-2.5 py-1 rounded-md bg-red-800 text-white font-semibold hover:bg-red-900 transition-colors"
                >
                  {showAnnounceForm ? 'Batal' : 'Tambah Pengumuman'}
                </button>
              )}
            </div>

            {/* Admin Form to Add Announcement */}
            {showAnnounceForm && (
              <form onSubmit={handleAddAnnouncement} className="mb-4 p-3 border border-red-100 dark:border-red-900/30 rounded-xl bg-red-50/20 dark:bg-red-950/10 space-y-2">
                <input
                  type="text"
                  placeholder="Judul pengumuman"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-red-500"
                  required
                />
                <textarea
                  placeholder="Isi pengumuman..."
                  rows={3}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-red-500"
                  required
                />
                <button
                  type="submit"
                  className="text-xs px-3 py-1.5 bg-red-800 text-white rounded-lg font-bold hover:bg-red-900"
                >
                  Publikasi
                </button>
              </form>
            )}

            <div className="space-y-3.5 max-h-80 overflow-y-auto">
              {announcements.map((announce) => (
                <div key={announce.id} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">{announce.title}</h4>
                    <span className="text-[10px] text-slate-400">{announce.date}</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-normal mb-2">{announce.content}</p>
                  <span className="text-[10px] font-semibold text-red-800 dark:text-red-600">Oleh: {announce.author}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Audit Logs / Activity logs */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 mb-4">
            <Activity className="w-4.5 h-4.5 text-red-700" />
            Audit Log: Aktivitas Sistem Terbaru
          </h3>
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {recentActivities.map((log: any) => (
              <div key={log.id} className="flex gap-3 text-xs border-b border-slate-50 dark:border-slate-800/60 pb-3 last:border-0 last:pb-0">
                <div className="mt-0.5 p-1 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center h-fit">
                  <AlertCircle className="w-4 h-4 text-slate-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700 dark:text-slate-200">{log.username} ({log.role})</span>
                    <span className="text-[10px] text-slate-400">{new Date(log.waktu).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 mt-0.5">
                    <span className="font-semibold text-red-800 dark:text-red-600 mr-1">[{log.aktivitas}]</span>
                    {log.deskripsi}
                  </p>
                  <span className="text-[9px] text-slate-400 block mt-0.5">IP: {log.ip}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

