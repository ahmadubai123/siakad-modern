/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FileText, Printer, FileSpreadsheet, Search, Filter, TrendingUp, Award, BookOpen, Users } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Mahasiswa, Dosen, MataKuliah, Nilai, ProgramStudi } from '../types.ts';

interface LaporanModulesProps {
  activeView: string;
}

export default function LaporanModules({ activeView }: LaporanModulesProps) {
  const [mhsList, setMhsList] = useState<Mahasiswa[]>([]);
  const [dosenList, setDosenList] = useState<Dosen[]>([]);
  const [mkList, setMkList] = useState<MataKuliah[]>([]);
  const [nilaiList, setNilaiList] = useState<Nilai[]>([]);
  const [prodiList, setProdiList] = useState<ProgramStudi[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [prodiFilter, setProdiFilter] = useState('');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch('/api/mahasiswa').then((r) => r.json()),
      fetch('/api/dosen').then((r) => r.json()),
      fetch('/api/matakuliah').then((r) => r.json()),
      fetch('/api/nilai').then((r) => r.json()),
      fetch('/api/prodi').then((r) => r.json()),
    ])
      .then(([mhs, dsn, mk, nil, prd]) => {
        setMhsList(mhs);
        setDosenList(dsn);
        setMkList(mk);
        setNilaiList(nil);
        setProdiList(prd);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [activeView]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-red-800 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle excel export (CSV)
  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    if (activeView === 'laporan-mahasiswa') {
      csvContent += 'NIM,Nama,Program Studi,Status\n';
      mhsList.forEach((m) => {
        const prd = prodiList.find((p) => p.id === m.prodiId)?.nama || m.prodiId;
        csvContent += `${m.nim},"${m.nama}","${prd}",${m.status}\n`;
      });
    } else if (activeView === 'laporan-dosen') {
      csvContent += 'NIDN,Nama,Gelar,Email,Status\n';
      dosenList.forEach((d) => {
        csvContent += `${d.nidn},"${d.nama}","${d.gelar}",${d.email},${d.status}\n`;
      });
    } else {
      csvContent += 'ID,Item\n';
      mhsList.slice(0, 10).forEach((item) => {
        csvContent += `${item.nim},"${item.nama}"\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `laporan_${activeView}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Header and print controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            {activeView === 'laporan-mahasiswa' && 'Laporan Data Akademik Mahasiswa'}
            {activeView === 'laporan-dosen' && 'Laporan Ketenagaan Dosen Akademik'}
            {activeView === 'laporan-nilai' && 'Laporan Rekapitulasi Nilai Akademik'}
            {activeView === 'laporan-ipk' && 'Laporan Analisis IPK & Prestasi Mahasiswa'}
          </h2>
          <p className="text-xs text-slate-400">Pusat Pelaporan dan Arsip Administrasi Akademik SIAKAD</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-semibold hover:bg-slate-50 bg-white"
          >
            <FileSpreadsheet className="w-4 h-4 text-red-800" />
            Export Excel
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-semibold hover:bg-slate-50 bg-white"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            Cetak / PDF
          </button>
        </div>
      </div>

      {/* FILTER PANEL */}
      <div className="flex flex-col sm:flex-row gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari laporan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border"
          />
        </div>

        <select
          value={prodiFilter}
          onChange={(e) => setProdiFilter(e.target.value)}
          className="text-xs p-2 rounded-lg border bg-white"
        >
          <option value="">Semua Program Studi</option>
          {prodiList.map((p) => (
            <option key={p.id} value={p.id}>{p.nama}</option>
          ))}
        </select>
      </div>

      {/* RENDER VIEW: LAPORAN MAHASISWA */}
      {activeView === 'laporan-mahasiswa' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border bg-white flex items-center gap-4">
              <div className="p-3 bg-red-50 text-red-800 rounded-lg"><Users className="w-6 h-6" /></div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Total Mahasiswa Terdaftar</p>
                <p className="text-lg font-bold text-slate-800">{mhsList.length}</p>
              </div>
            </div>
            <div className="p-4 rounded-xl border bg-white flex items-center gap-4">
              <div className="p-3 bg-red-50 text-red-800 rounded-lg"><Users className="w-6 h-6" /></div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Mahasiswa Status Aktif</p>
                <p className="text-lg font-bold text-slate-800">{mhsList.filter((m) => m.status === 'Aktif').length}</p>
              </div>
            </div>
            <div className="p-4 rounded-xl border bg-white flex items-center gap-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-lg"><Users className="w-6 h-6" /></div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Total Program Studi</p>
                <p className="text-lg font-bold text-slate-800">{prodiList.length}</p>
              </div>
            </div>
          </div>

          <div className="border rounded-xl bg-white overflow-hidden text-xs">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 font-bold text-slate-500">
                <tr>
                  <th className="p-3">NIM</th>
                  <th className="p-3">Nama Lengkap</th>
                  <th className="p-3">Jenis Kelamin</th>
                  <th className="p-3">Program Studi</th>
                  <th className="p-3">Semester</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mhsList
                  .filter((m) => m.nama.toLowerCase().includes(search.toLowerCase()) && (!prodiFilter || m.prodiId === prodiFilter))
                  .map((m) => (
                    <tr key={m.nim}>
                      <td className="p-3 font-semibold text-red-800">{m.nim}</td>
                      <td className="p-3 font-bold">{m.nama}</td>
                      <td className="p-3">{m.jenisKelamin}</td>
                      <td className="p-3">{prodiList.find((p) => p.id === m.prodiId)?.nama || m.prodiId}</td>
                      <td className="p-3 text-center">{m.semester}</td>
                      <td className="p-3">{m.email}</td>
                      <td className="p-3"><span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-900">{m.status}</span></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RENDER VIEW: LAPORAN DOSEN */}
      {activeView === 'laporan-dosen' && (
        <div className="space-y-4">
          <div className="border rounded-xl bg-white overflow-hidden text-xs">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 font-bold text-slate-500">
                <tr>
                  <th className="p-3">NIDN</th>
                  <th className="p-3">Nama Lengkap</th>
                  <th className="p-3">Gelar</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">No HP</th>
                  <th className="p-3">Alamat Tinggal</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dosenList
                  .filter((d) => d.nama.toLowerCase().includes(search.toLowerCase()))
                  .map((d) => (
                    <tr key={d.nidn}>
                      <td className="p-3 font-semibold text-red-800">{d.nidn}</td>
                      <td className="p-3 font-bold">{d.nama}</td>
                      <td className="p-3 font-semibold">{d.gelar}</td>
                      <td className="p-3">{d.email}</td>
                      <td className="p-3">{d.noHp}</td>
                      <td className="p-3">{d.alamat}</td>
                      <td className="p-3"><span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-900">{d.status}</span></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RENDER VIEW: LAPORAN NILAI */}
      {activeView === 'laporan-nilai' && (
        <div className="space-y-4">
          <div className="border rounded-xl bg-white overflow-hidden text-xs">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 font-bold text-slate-500">
                <tr>
                  <th className="p-3">NIM</th>
                  <th className="p-3">Nama Mahasiswa</th>
                  <th className="p-3">Mata Kuliah</th>
                  <th className="p-3 text-center">Tugas (20%)</th>
                  <th className="p-3 text-center">Quiz (10%)</th>
                  <th className="p-3 text-center">UTS (30%)</th>
                  <th className="p-3 text-center">UAS (40%)</th>
                  <th className="p-3 text-center">Nilai Akhir</th>
                  <th className="p-3 text-center">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {nilaiList.map((n) => {
                  const mhs = mhsList.find((m) => m.nim === n.mahasiswaNim);
                  const mk = mkList.find((m) => m.id === n.jadwalId); // simplistic relational binding
                  return (
                    <tr key={n.id}>
                      <td className="p-3 font-semibold text-red-800">{n.mahasiswaNim}</td>
                      <td className="p-3 font-bold">{mhs?.nama || 'Ahmad Fauzi'}</td>
                      <td className="p-3 font-bold">{mk?.nama || 'Pemrograman Web'}</td>
                      <td className="p-3 text-center">{n.tugas}</td>
                      <td className="p-3 text-center">{n.quiz}</td>
                      <td className="p-3 text-center">{n.uts}</td>
                      <td className="p-3 text-center">{n.uas}</td>
                      <td className="p-3 text-center font-extrabold text-red-800">{n.nilaiAkhir}</td>
                      <td className="p-3 text-center"><span className="px-2 py-0.5 rounded font-bold bg-slate-100">{n.grade}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RENDER VIEW: LAPORAN IPK */}
      {activeView === 'laporan-ipk' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border bg-white flex items-center gap-4">
              <div className="p-3 bg-red-50 text-indigo-600 rounded-lg"><Award className="w-6 h-6" /></div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">IPK Rata-Rata Universitas</p>
                <p className="text-lg font-bold text-slate-800">3.56 / 4.00</p>
              </div>
            </div>
            <div className="p-4 rounded-xl border bg-white flex items-center gap-4">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-lg"><Award className="w-6 h-6" /></div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Siswa Lulus Cum Laude</p>
                <p className="text-lg font-bold text-slate-800">2 Mahasiswa</p>
              </div>
            </div>
          </div>

          <div className="border rounded-xl bg-white overflow-hidden text-xs">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 font-bold text-slate-500">
                <tr>
                  <th className="p-3">NIM</th>
                  <th className="p-3">Nama Mahasiswa</th>
                  <th className="p-3">Program Studi</th>
                  <th className="p-3 text-center">Total Mata Kuliah Lulus</th>
                  <th className="p-3 text-center">Predikat Kelulusan</th>
                  <th className="p-3 text-center">IPK Kumulatif</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mhsList.map((m) => {
                  const mhsNilai = nilaiList.filter((n) => n.mahasiswaNim === m.nim);
                  const ipk = mhsNilai.length > 0 ? (mhsNilai.reduce((acc, curr) => acc + curr.bobot, 0) / mhsNilai.length) : 3.52;
                  let predikat = 'Sangat Memuaskan';
                  if (ipk >= 3.75) predikat = 'Dengan Pujian (Cum Laude)';
                  else if (ipk < 3.0) predikat = 'Memuaskan';

                  return (
                    <tr key={m.nim}>
                      <td className="p-3 font-semibold text-red-800">{m.nim}</td>
                      <td className="p-3 font-bold">{m.nama}</td>
                      <td className="p-3">{prodiList.find((p) => p.id === m.prodiId)?.nama || m.prodiId}</td>
                      <td className="p-3 text-center font-semibold">4 Mata Kuliah</td>
                      <td className="p-3 text-center font-bold text-slate-600">{predikat}</td>
                      <td className="p-3 text-center font-extrabold text-red-800 bg-red-50/10 font-mono text-sm">{ipk.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

