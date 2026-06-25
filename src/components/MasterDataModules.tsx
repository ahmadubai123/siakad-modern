/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Download,
  Upload,
  ArrowUpDown,
  Check,
  AlertTriangle,
  FileSpreadsheet,
  FileText,
} from 'lucide-react';
import { useState, useEffect, FormEvent } from 'react';
import Modal from './Modal.tsx';
import { Mahasiswa, Dosen, Fakultas, ProgramStudi, TahunAkademik, MataKuliah, Kelas, Jadwal } from '../types.ts';

interface MasterDataModulesProps {
  activeView: string;
  onRefreshAll: () => void;
}

export default function MasterDataModules({ activeView, onRefreshAll }: MasterDataModulesProps) {
  // Master lists
  const [mhsList, setMhsList] = useState<Mahasiswa[]>([]);
  const [dosenList, setDosenList] = useState<Dosen[]>([]);
  const [fakultasList, setFakultasList] = useState<Fakultas[]>([]);
  const [prodiList, setProdiList] = useState<ProgramStudi[]>([]);
  const [mkList, setMkList] = useState<MataKuliah[]>([]);
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [jadwalList, setJadwalList] = useState<Jadwal[]>([]);
  const [taList, setTaList] = useState<TahunAkademik[]>([]);

  // Search, filter, sorting, pagination
  const [search, setSearch] = useState('');
  const [filterKey, setFilterKey] = useState('');
  const [sortField, setSortField] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modals state
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // Input states for various forms
  const [mhsForm, setMhsForm] = useState<Partial<Mahasiswa> & { password?: string }>({});
  const [dosenForm, setDosenForm] = useState<Partial<Dosen>>({});
  const [fakultasForm, setFakultasForm] = useState<Partial<Fakultas>>({});
  const [prodiForm, setProdiForm] = useState<Partial<ProgramStudi>>({});
  const [mkForm, setMkForm] = useState<Partial<MataKuliah>>({});
  const [kelasForm, setKelasForm] = useState<Partial<Kelas>>({});
  const [jadwalForm, setJadwalForm] = useState<Partial<Jadwal>>({});
  const [taForm, setTaForm] = useState<Partial<TahunAkademik>>({});

  // Excel simulation state
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Fetch functions
  const fetchData = (route: string, setter: (data: any) => void) => {
    fetch(`/api/${route}`)
      .then((res) => res.json())
      .then((data) => setter(data))
      .catch((e) => console.error(`Error loading ${route}`, e));
  };

  const reloadAll = () => {
    fetchData('mahasiswa', setMhsList);
    fetchData('dosen', setDosenList);
    fetchData('fakultas', setFakultasList);
    fetchData('prodi', setProdiList);
    fetchData('matakuliah', setMkList);
    fetchData('kelas', setKelasList);
    fetchData('jadwal', setJadwalList);
    fetchData('tahun-akademik', setTaList);
    if (onRefreshAll) onRefreshAll();
  };

  useEffect(() => {
    reloadAll();
    setSearch('');
    setFilterKey('');
    setCurrentPage(1);
  }, [activeView]);

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  // Sorting helper
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Generic submit handler with Laravel-like validations
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const errors: { [key: string]: string } = {};

    let endpoint = '';
    let bodyData: any = {};
    let uniqueKey = '';

    if (activeView === 'master-mahasiswa') {
      endpoint = 'mahasiswa';
      bodyData = mhsForm;
      uniqueKey = mhsForm.nim || '';
      if (!bodyData.nim) errors.nim = 'NIM wajib diisi';
      if (!bodyData.nama) errors.nama = 'Nama lengkap wajib diisi';
      if (!bodyData.email) errors.email = 'Email wajib diisi';
      if (!bodyData.password && !editItem) errors.password = 'Password wajib diisi';
    } else if (activeView === 'master-dosen') {
      endpoint = 'dosen';
      bodyData = dosenForm;
      uniqueKey = dosenForm.nidn || '';
      if (!bodyData.nidn) errors.nidn = 'NIDN wajib diisi';
      if (!bodyData.nama) errors.nama = 'Nama lengkap wajib diisi';
      if (!bodyData.email) errors.email = 'Email wajib diisi';
    } else if (activeView === 'master-fakultas') {
      endpoint = 'fakultas';
      bodyData = fakultasForm;
      uniqueKey = editItem ? editItem.id : '';
      if (!bodyData.kode) errors.kode = 'Kode fakultas wajib diisi';
      if (!bodyData.nama) errors.nama = 'Nama fakultas wajib diisi';
    } else if (activeView === 'master-prodi') {
      endpoint = 'prodi';
      bodyData = prodiForm;
      uniqueKey = editItem ? editItem.id : '';
      if (!bodyData.kode) errors.kode = 'Kode program studi wajib diisi';
      if (!bodyData.nama) errors.nama = 'Nama program studi wajib diisi';
      if (!bodyData.fakultasId) errors.fakultasId = 'Fakultas wajib dipilih';
    } else if (activeView === 'master-matakuliah') {
      endpoint = 'matakuliah';
      bodyData = mkForm;
      uniqueKey = editItem ? editItem.id : '';
      if (!bodyData.kode) errors.kode = 'Kode MK wajib diisi';
      if (!bodyData.nama) errors.nama = 'Nama MK wajib diisi';
      if (!bodyData.sks) errors.sks = 'SKS wajib diisi';
      if (!bodyData.prodiId) errors.prodiId = 'Program studi wajib diisi';
    } else if (activeView === 'master-kelas') {
      endpoint = 'kelas';
      bodyData = kelasForm;
      uniqueKey = editItem ? editItem.id : '';
      if (!bodyData.nama) errors.nama = 'Nama kelas wajib diisi';
      if (!bodyData.dosenNidn) errors.dosenNidn = 'Dosen pengajar wajib dipilih';
    } else if (activeView === 'master-jadwal') {
      endpoint = 'jadwal';
      bodyData = jadwalForm;
      uniqueKey = editItem ? editItem.id : '';
      if (!bodyData.matakuliahId) errors.matakuliahId = 'Mata kuliah wajib dipilih';
      if (!bodyData.hari) errors.hari = 'Hari kuliah wajib diisi';
      if (!bodyData.jamMulai) errors.jamMulai = 'Jam mulai wajib diisi';
      if (!bodyData.jamSelesai) errors.jamSelesai = 'Jam selesai wajib diisi';
      if (!bodyData.kelasId) errors.kelasId = 'Kelas wajib dipilih';
    } else if (activeView === 'master-tahun-akademik') {
      endpoint = 'tahun-akademik';
      bodyData = taForm;
      uniqueKey = editItem ? editItem.id : '';
      if (!bodyData.tahun) errors.tahun = 'Tahun akademik wajib diisi';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    if (bodyData.password === '') {
      delete bodyData.password;
    }

    const method = editItem ? 'PUT' : 'POST';
    const url = editItem ? `/api/${endpoint}/${uniqueKey}` : `/api/${endpoint}`;

    fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyData),
    })
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success) {
          showToast('success', editItem ? 'Data berhasil diperbarui!' : 'Data baru berhasil ditambahkan!');
          setModalOpen(false);
          setEditItem(null);
          reloadAll();
        } else {
          showToast('error', resData.message || 'Gagal memproses data.');
        }
      })
      .catch((err) => {
        console.error('Error submitting form', err);
        showToast('error', 'Terjadi kesalahan pada server');
      });
  };

  const handleDelete = (id: string, name: string) => {
    let endpoint = '';
    if (activeView === 'master-mahasiswa') endpoint = 'mahasiswa';
    else if (activeView === 'master-dosen') endpoint = 'dosen';
    else if (activeView === 'master-fakultas') endpoint = 'fakultas';
    else if (activeView === 'master-prodi') endpoint = 'prodi';
    else if (activeView === 'master-matakuliah') endpoint = 'matakuliah';
    else if (activeView === 'master-kelas') endpoint = 'kelas';
    else if (activeView === 'master-jadwal') endpoint = 'jadwal';
    else if (activeView === 'master-tahun-akademik') endpoint = 'tahun-akademik';

    if (window.confirm(`Apakah Anda yakin ingin menghapus "${name}"? Tindakan ini akan menghapus seluruh data relasi (Cascade delete)!`)) {
      fetch(`/api/${endpoint}/${id}`, { method: 'DELETE' })
        .then((res) => res.json())
        .then((resData) => {
          if (resData.success) {
            showToast('success', 'Data berhasil dihapus!');
            reloadAll();
          } else {
            showToast('error', resData.message || 'Gagal menghapus data.');
          }
        })
        .catch((err) => {
          console.error(err);
          showToast('error', 'Terjadi kesalahan sistem.');
        });
    }
  };

  const handleOpenAdd = () => {
    setEditItem(null);
    setFormErrors({});
    if (activeView === 'master-mahasiswa') {
      setMhsForm({
        nim: '',
        nama: '',
        jenisKelamin: 'Laki-laki',
        tempatLahir: '',
        tanggalLahir: '',
        email: '',
        noHp: '',
        alamat: '',
        foto: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
        semester: 1,
        prodiId: prodiList[0]?.id || '',
        status: 'Aktif',
      });
    } else if (activeView === 'master-dosen') {
      setDosenForm({
        nidn: '',
        nama: '',
        email: '',
        gelar: '',
        noHp: '',
        alamat: '',
        foto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
        status: 'Aktif',
      });
    } else if (activeView === 'master-fakultas') {
      setFakultasForm({ kode: '', nama: '', dekan: '' });
    } else if (activeView === 'master-prodi') {
      // Reset form but keep faculty selected if available
      setProdiForm({ 
        kode: '', 
        nama: '', 
        fakultasId: fakultasList.length > 0 ? fakultasList[0].id : '' 
      });
    } else if (activeView === 'master-matakuliah') {
      setMkForm({ kode: '', nama: '', sks: 3, semester: 1, prodiId: prodiList[0]?.id || '' });
    } else if (activeView === 'master-kelas') {
      setKelasForm({ nama: '', semester: 1, dosenNidn: dosenList[0]?.nidn || '', kapasitas: 30 });
    } else if (activeView === 'master-jadwal') {
      setJadwalForm({
        matakuliahId: mkList[0]?.id || '',
        hari: 'Senin',
        jamMulai: '08:00',
        jamSelesai: '10:30',
        ruang: 'Kelas 101',
        dosenNidn: dosenList[0]?.nidn || '',
        kelasId: kelasList[0]?.id || '',
      });
    } else if (activeView === 'master-tahun-akademik') {
      setTaForm({ tahun: '2026/2027', semesterTipe: 'Ganjil', status: 'Tidak Aktif' });
    }
    setModalOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setEditItem(item);
    setFormErrors({});
    if (activeView === 'master-mahasiswa') setMhsForm(item);
    else if (activeView === 'master-dosen') setDosenForm(item);
    else if (activeView === 'master-fakultas') setFakultasForm(item);
    else if (activeView === 'master-prodi') setProdiForm(item);
    else if (activeView === 'master-matakuliah') setMkForm(item);
    else if (activeView === 'master-kelas') setKelasForm(item);
    else if (activeView === 'master-jadwal') setJadwalForm(item);
    else if (activeView === 'master-tahun-akademik') setTaForm(item);
    setModalOpen(true);
  };

  // Simulate Excel Import
  const handleExcelImportSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!importText.trim()) return;

    // Parse simple CSV rows
    const lines = importText.trim().split('\n');
    const list: any[] = [];

    lines.forEach((line) => {
      const parts = line.split(',');
      if (parts.length >= 2) {
        list.push({
          nim: parts[0]?.trim(),
          nama: parts[1]?.trim(),
          jenisKelamin: parts[2]?.trim() || 'Laki-laki',
          email: parts[3]?.trim(),
          semester: parts[4]?.trim() || '1',
          prodiId: prodiList[0]?.id || 'prd-01',
        });
      }
    });

    fetch('/api/mahasiswa/import-excel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ list }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.count > 0) {
          showToast('success', `Berhasil mengimpor ${data.count} Mahasiswa!`);
          setImportOpen(false);
          setImportText('');
          reloadAll();
        } else {
          showToast('error', 'Gagal mengimpor. NIM mungkin sudah ada atau format salah.');
        }
      })
      .catch(() => showToast('error', 'Gagal mengimpor file'));
  };

  // Excel / CSV Export helper
  const handleExportExcel = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    if (activeView === 'master-mahasiswa') {
      csvContent += 'NIM,Nama,Jenis Kelamin,Email,Semester,Status\n';
      mhsList.forEach((m) => {
        csvContent += `${m.nim},"${m.nama}",${m.jenisKelamin},${m.email},${m.semester},${m.status}\n`;
      });
    } else if (activeView === 'master-dosen') {
      csvContent += 'NIDN,Nama,Email,Gelar,Status\n';
      dosenList.forEach((d) => {
        csvContent += `${d.nidn},"${d.nama}",${d.email},"${d.gelar}",${d.status}\n`;
      });
    } else if (activeView === 'master-fakultas') {
      csvContent += 'Kode,Nama,Dekan\n';
      fakultasList.forEach((f) => {
        csvContent += `${f.kode},"${f.nama}","${f.dekan}"\n`;
      });
    } else {
      // General fallbacks
      csvContent += 'ID,Name\n';
      mhsList.slice(0, 10).forEach((item) => {
        csvContent += `${item.nim},"${item.nama}"\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `siakad_export_${activeView}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('success', 'Berhasil mengekspor data ke Excel!');
  };

  // PDF Print Trigger
  const handleExportPDF = () => {
    window.print();
  };

  // Dynamic lists switching
  let currentList: any[] = [];
  let currentTitle = '';

  if (activeView === 'master-mahasiswa') {
    currentList = mhsList;
    currentTitle = 'Daftar Mahasiswa';
  } else if (activeView === 'master-dosen') {
    currentList = dosenList;
    currentTitle = 'Daftar Dosen';
  } else if (activeView === 'master-fakultas') {
    currentList = fakultasList;
    currentTitle = 'Daftar Fakultas';
  } else if (activeView === 'master-prodi') {
    currentList = prodiList;
    currentTitle = 'Daftar Program Studi';
  } else if (activeView === 'master-matakuliah') {
    currentList = mkList;
    currentTitle = 'Daftar Mata Kuliah';
  } else if (activeView === 'master-kelas') {
    currentList = kelasList;
    currentTitle = 'Daftar Kelas';
  } else if (activeView === 'master-jadwal') {
    currentList = jadwalList;
    currentTitle = 'Daftar Jadwal Kuliah';
  } else if (activeView === 'master-tahun-akademik') {
    currentList = taList;
    currentTitle = 'Tahun Akademik';
  }

  // Filter and Search Logic
  let filtered = currentList.filter((item) => {
    const text = JSON.stringify(item).toLowerCase();
    const matchesSearch = text.includes(search.toLowerCase());

    let matchesFilter = true;
    if (filterKey) {
      if (activeView === 'master-mahasiswa') {
        matchesFilter = item.prodiId === filterKey;
      } else if (activeView === 'master-prodi') {
        matchesFilter = item.fakultasId === filterKey;
      } else if (activeView === 'master-matakuliah') {
        matchesFilter = item.prodiId === filterKey;
      }
    }

    return matchesSearch && matchesFilter;
  });

  // Sorting logic
  if (sortField) {
    filtered = [...filtered].sort((a, b) => {
      const valA = a[sortField] || '';
      const valB = b[sortField] || '';
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      }
      return sortOrder === 'asc'
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
  }

  // Pagination logic
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-4">
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed top-20 right-4 z-50 flex items-center gap-2 p-4 rounded-xl shadow-lg border text-xs font-semibold ${
          toast.type === 'success' ? 'bg-red-50 border-red-200 text-red-900 dark:bg-red-950 dark:border-red-800 dark:text-red-400' : 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950 dark:border-rose-800 dark:text-rose-300'
        }`}>
          <Check className="w-4 h-4" />
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Header and top buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{currentTitle}</h2>
          <p className="text-xs text-slate-400">Master Data / {currentTitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {activeView === 'master-mahasiswa' && (
            <button
              onClick={() => setImportOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 text-xs font-semibold"
            >
              <Upload className="w-4 h-4" />
              <span>Import Excel</span>
            </button>
          )}

          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 text-xs font-semibold"
          >
            <Download className="w-4 h-4" />
            <span>Excel</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 text-xs font-semibold"
          >
            <FileText className="w-4 h-4" />
            <span>Cetak / PDF</span>
          </button>

          <button
            id="add-master-btn"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-800 text-white font-semibold hover:bg-red-900 text-xs shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Data</span>
          </button>
        </div>
      </div>

      {/* Search, Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari kata kunci..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-red-500"
          />
        </div>

        {/* Dynamic Filters */}
        {activeView === 'master-mahasiswa' && (
          <select
            value={filterKey}
            onChange={(e) => setFilterKey(e.target.value)}
            className="text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-red-500"
          >
            <option value="">Semua Program Studi</option>
            {prodiList.map((p) => (
              <option key={p.id} value={p.id}>{p.nama}</option>
            ))}
          </select>
        )}

        {activeView === 'master-prodi' && (
          <select
            value={filterKey}
            onChange={(e) => setFilterKey(e.target.value)}
            className="text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-red-500"
          >
            <option value="">Semua Fakultas</option>
            {fakultasList.map((f) => (
              <option key={f.id} value={f.id}>{f.nama}</option>
            ))}
          </select>
        )}

        {activeView === 'master-matakuliah' && (
          <select
            value={filterKey}
            onChange={(e) => setFilterKey(e.target.value)}
            className="text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-red-500"
          >
            <option value="">Semua Program Studi</option>
            {prodiList.map((p) => (
              <option key={p.id} value={p.id}>{p.nama}</option>
            ))}
          </select>
        )}
      </div>

      {/* Main Table render */}
      <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 text-xs font-bold border-b border-slate-100 dark:border-slate-800">
              {activeView === 'master-mahasiswa' && (
                <tr>
                  <th className="px-4 py-3"><div onClick={() => handleSort('nim')} className="flex items-center gap-1 cursor-pointer select-none">NIM <ArrowUpDown className="w-3.5 h-3.5" /></div></th>
                  <th className="px-4 py-3"><div onClick={() => handleSort('nama')} className="flex items-center gap-1 cursor-pointer select-none">Nama <ArrowUpDown className="w-3.5 h-3.5" /></div></th>
                  <th className="px-4 py-3">Jenis Kelamin</th>
                  <th className="px-4 py-3">Prodi</th>
                  <th className="px-4 py-3">Semester</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              )}

              {activeView === 'master-dosen' && (
                <tr>
                  <th className="px-4 py-3"><div onClick={() => handleSort('nidn')} className="flex items-center gap-1 cursor-pointer select-none">NIDN <ArrowUpDown className="w-3.5 h-3.5" /></div></th>
                  <th className="px-4 py-3"><div onClick={() => handleSort('nama')} className="flex items-center gap-1 cursor-pointer select-none">Nama <ArrowUpDown className="w-3.5 h-3.5" /></div></th>
                  <th className="px-4 py-3">Gelar</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">No HP</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              )}

              {activeView === 'master-fakultas' && (
                <tr>
                  <th className="px-4 py-3">Kode</th>
                  <th className="px-4 py-3">Nama Fakultas</th>
                  <th className="px-4 py-3">Dekan</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              )}

              {activeView === 'master-prodi' && (
                <tr>
                  <th className="px-4 py-3">Kode</th>
                  <th className="px-4 py-3">Nama Program Studi</th>
                  <th className="px-4 py-3">Fakultas</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              )}

              {activeView === 'master-matakuliah' && (
                <tr>
                  <th className="px-4 py-3">Kode MK</th>
                  <th className="px-4 py-3">Nama Mata Kuliah</th>
                  <th className="px-4 py-3">SKS</th>
                  <th className="px-4 py-3">Semester</th>
                  <th className="px-4 py-3">Program Studi</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              )}

              {activeView === 'master-kelas' && (
                <tr>
                  <th className="px-4 py-3">Nama Kelas</th>
                  <th className="px-4 py-3">Semester</th>
                  <th className="px-4 py-3">Dosen Pengajar</th>
                  <th className="px-4 py-3">Kapasitas</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              )}

              {activeView === 'master-jadwal' && (
                <tr>
                  <th className="px-4 py-3">Mata Kuliah</th>
                  <th className="px-4 py-3">Kelas</th>
                  <th className="px-4 py-3">Hari & Jam</th>
                  <th className="px-4 py-3">Ruangan</th>
                  <th className="px-4 py-3">Dosen</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              )}

              {activeView === 'master-tahun-akademik' && (
                <tr>
                  <th className="px-4 py-3">Tahun Akademik</th>
                  <th className="px-4 py-3">Semester</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              )}
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs text-slate-700 dark:text-slate-300">
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                    Tidak ada data ditemukan.
                  </td>
                </tr>
              )}

              {activeView === 'master-mahasiswa' &&
                paginated.map((m: Mahasiswa) => (
                  <tr key={m.nim} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-semibold text-red-800 dark:text-red-600">{m.nim}</td>
                    <td className="px-4 py-3 font-semibold">{m.nama}</td>
                    <td className="px-4 py-3">{m.jenisKelamin}</td>
                    <td className="px-4 py-3">{prodiList.find((p) => p.id === m.prodiId)?.nama || m.prodiId}</td>
                    <td className="px-4 py-3 text-center">{m.semester}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        m.status === 'Aktif' ? 'bg-red-50 text-red-900 dark:bg-red-950/40 dark:text-red-600' : 'bg-amber-50 text-amber-700'
                      }`}>{m.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button onClick={() => handleOpenEdit(m)} className="p-1 rounded-md text-slate-400 hover:text-red-800 hover:bg-slate-100 dark:hover:bg-slate-800"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDelete(m.nim, m.nama)} className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}

              {activeView === 'master-dosen' &&
                paginated.map((d: Dosen) => (
                  <tr key={d.nidn} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-semibold text-red-800 dark:text-red-600">{d.nidn}</td>
                    <td className="px-4 py-3 font-semibold">{d.nama}</td>
                    <td className="px-4 py-3">{d.gelar}</td>
                    <td className="px-4 py-3">{d.email}</td>
                    <td className="px-4 py-3">{d.noHp}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-900 dark:bg-red-950/40 dark:text-red-600">{d.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button onClick={() => handleOpenEdit(d)} className="p-1 rounded-md text-slate-400 hover:text-red-800 hover:bg-slate-100 dark:hover:bg-slate-800"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDelete(d.nidn, d.nama)} className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}

              {activeView === 'master-fakultas' &&
                paginated.map((f: Fakultas) => (
                  <tr key={f.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-semibold text-red-800 dark:text-red-600">{f.kode}</td>
                    <td className="px-4 py-3 font-semibold">{f.nama}</td>
                    <td className="px-4 py-3">{f.dekan}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button onClick={() => handleOpenEdit(f)} className="p-1 rounded-md text-slate-400 hover:text-red-800 hover:bg-slate-100 dark:hover:bg-slate-800"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDelete(f.id, f.nama)} className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}

              {activeView === 'master-prodi' &&
                paginated.map((p: ProgramStudi) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-semibold text-red-800 dark:text-red-600">{p.kode}</td>
                    <td className="px-4 py-3 font-semibold">{p.nama}</td>
                    <td className="px-4 py-3">{fakultasList.find((f) => f.id === p.fakultasId)?.nama || p.fakultasId}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button onClick={() => handleOpenEdit(p)} className="p-1 rounded-md text-slate-400 hover:text-red-800 hover:bg-slate-100 dark:hover:bg-slate-800"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDelete(p.id, p.nama)} className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}

              {activeView === 'master-matakuliah' &&
                paginated.map((mk: MataKuliah) => (
                  <tr key={mk.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-semibold text-red-800 dark:text-red-600">{mk.kode}</td>
                    <td className="px-4 py-3 font-semibold">{mk.nama}</td>
                    <td className="px-4 py-3 font-bold text-center">{mk.sks} SKS</td>
                    <td className="px-4 py-3 text-center">Semester {mk.semester}</td>
                    <td className="px-4 py-3">{prodiList.find((p) => p.id === mk.prodiId)?.nama || mk.prodiId}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button onClick={() => handleOpenEdit(mk)} className="p-1 rounded-md text-slate-400 hover:text-red-800 hover:bg-slate-100 dark:hover:bg-slate-800"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDelete(mk.id, mk.nama)} className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}

              {activeView === 'master-kelas' &&
                paginated.map((k: Kelas) => (
                  <tr key={k.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-semibold text-red-800 dark:text-red-600">{k.nama}</td>
                    <td className="px-4 py-3 text-center">{k.semester}</td>
                    <td className="px-4 py-3 font-semibold">{dosenList.find((d) => d.nidn === k.dosenNidn)?.nama || k.dosenNidn}</td>
                    <td className="px-4 py-3 font-semibold">{k.kapasitas} Mahasiswa</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button onClick={() => handleOpenEdit(k)} className="p-1 rounded-md text-slate-400 hover:text-red-800 hover:bg-slate-100 dark:hover:bg-slate-800"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDelete(k.id, k.nama)} className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}

              {activeView === 'master-jadwal' &&
                paginated.map((j: Jadwal) => (
                  <tr key={j.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-semibold text-red-800 dark:text-red-600">
                      {mkList.find((mk) => mk.id === j.matakuliahId)?.nama || j.matakuliahId}
                    </td>
                    <td className="px-4 py-3">{kelasList.find((k) => k.id === j.kelasId)?.nama || j.kelasId}</td>
                    <td className="px-4 py-3 font-semibold">{j.hari}, {j.jamMulai} - {j.jamSelesai}</td>
                    <td className="px-4 py-3">{j.ruang}</td>
                    <td className="px-4 py-3 font-semibold">{dosenList.find((d) => d.nidn === j.dosenNidn)?.nama || j.dosenNidn}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button onClick={() => handleOpenEdit(j)} className="p-1 rounded-md text-slate-400 hover:text-red-800 hover:bg-slate-100 dark:hover:bg-slate-800"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDelete(j.id, 'Jadwal MK')} className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}

              {activeView === 'master-tahun-akademik' &&
                paginated.map((ta: TahunAkademik) => (
                  <tr key={ta.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-semibold text-red-800 dark:text-red-600">{ta.tahun}</td>
                    <td className="px-4 py-3 font-bold">{ta.semesterTipe}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        ta.status === 'Aktif' ? 'bg-red-50 text-red-900 dark:bg-red-950/40 dark:text-red-600' : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                      }`}>{ta.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button onClick={() => handleOpenEdit(ta)} className="p-1 rounded-md text-slate-400 hover:text-red-800 hover:bg-slate-100 dark:hover:bg-slate-800"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDelete(ta.id, ta.tahun)} className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Section */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
            <span>Menampilkan {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filtered.length)} dari {filtered.length} baris</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 disabled:opacity-50"
              >
                Sebelumnya
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`px-2.5 py-1 rounded-md font-bold ${
                    currentPage === i + 1
                      ? 'bg-red-800 text-white'
                      : 'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 disabled:opacity-50"
              >
                Berikutnya
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Reusable modal for all forms */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Edit Data' : 'Tambah Data Baru'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Form fields based on activeView */}
          {activeView === 'master-mahasiswa' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">NIM *</label>
                <input
                  type="text"
                  value={mhsForm.nim || ''}
                  onChange={(e) => setMhsForm({ ...mhsForm, nim: e.target.value })}
                  disabled={!!editItem}
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-red-500"
                />
                {formErrors.nim && <p className="text-[10px] text-rose-500 font-semibold">{formErrors.nim}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Nama Lengkap *</label>
                <input
                  type="text"
                  value={mhsForm.nama || ''}
                  onChange={(e) => setMhsForm({ ...mhsForm, nama: e.target.value })}
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-red-500"
                />
                {formErrors.nama && <p className="text-[10px] text-rose-500 font-semibold">{formErrors.nama}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Jenis Kelamin</label>
                <select
                  value={mhsForm.jenisKelamin || 'Laki-laki'}
                  onChange={(e) => setMhsForm({ ...mhsForm, jenisKelamin: e.target.value as any })}
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-red-500"
                >
                  <option value="Laki-laki">Laki-laki</option>
                  <option value="Perempuan">Perempuan</option>
                </select>
              </div>
                <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Program Studi</label>
                <select
                  value={mhsForm.prodiId || ''}
                  onChange={(e) => setMhsForm({ ...mhsForm, prodiId: e.target.value })}
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-red-500 relative z-50"
                >
                  <option value="">-- Pilih Program Studi --</option>
                  {prodiList && prodiList.length > 0 ? (
                    prodiList.map((p) => (
                      <option key={p.id} value={p.id}>{p.nama}</option>
                    ))
                  ) : (
                    <option disabled>Tidak ada Program Studi</option>
                  )}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Email *</label>
                <input
                  type="email"
                  value={mhsForm.email || ''}
                  onChange={(e) => setMhsForm({ ...mhsForm, email: e.target.value })}
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-red-500"
                />
                {formErrors.email && <p className="text-[10px] text-rose-500 font-semibold">{formErrors.email}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Password {editItem ? '(kosongkan untuk tidak mengubah)' : '*'}</label>
                <input
                  type="password"
                  value={mhsForm.password || ''}
                  onChange={(e) => setMhsForm({ ...mhsForm, password: e.target.value })}
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-red-500"
                  placeholder={editItem ? 'Isi jika ingin mengubah password' : 'Masukkan password akun mahasiswa'}
                />
                {formErrors.password && <p className="text-[10px] text-rose-500 font-semibold">{formErrors.password}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">No HP</label>
                <input
                  type="text"
                  value={mhsForm.noHp || ''}
                  onChange={(e) => setMhsForm({ ...mhsForm, noHp: e.target.value })}
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-red-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Semester</label>
                <input
                  type="number"
                  value={mhsForm.semester || 1}
                  onChange={(e) => setMhsForm({ ...mhsForm, semester: parseInt(e.target.value) })}
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-red-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Status</label>
                <select
                  value={mhsForm.status || 'Aktif'}
                  onChange={(e) => setMhsForm({ ...mhsForm, status: e.target.value as any })}
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-red-500"
                >
                  <option value="Aktif">Aktif</option>
                  <option value="Cuti">Cuti</option>
                  <option value="Drop Out">Drop Out</option>
                  <option value="Lulus">Lulus</option>
                </select>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-bold text-slate-500">Alamat</label>
                <textarea
                  value={mhsForm.alamat || ''}
                  onChange={(e) => setMhsForm({ ...mhsForm, alamat: e.target.value })}
                  rows={2}
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-red-500"
                />
              </div>
            </div>
          )}

          {activeView === 'master-dosen' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">NIDN *</label>
                <input
                  type="text"
                  value={dosenForm.nidn || ''}
                  onChange={(e) => setDosenForm({ ...dosenForm, nidn: e.target.value })}
                  disabled={!!editItem}
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-red-500"
                />
                {formErrors.nidn && <p className="text-[10px] text-rose-500 font-semibold">{formErrors.nidn}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Nama Lengkap *</label>
                <input
                  type="text"
                  value={dosenForm.nama || ''}
                  onChange={(e) => setDosenForm({ ...dosenForm, nama: e.target.value })}
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-red-500"
                />
                {formErrors.nama && <p className="text-[10px] text-rose-500 font-semibold">{formErrors.nama}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Gelar Akademik</label>
                <input
                  type="text"
                  placeholder="e.g. M.T., Ph.D."
                  value={dosenForm.gelar || ''}
                  onChange={(e) => setDosenForm({ ...dosenForm, gelar: e.target.value })}
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-red-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Email *</label>
                <input
                  type="email"
                  value={dosenForm.email || ''}
                  onChange={(e) => setDosenForm({ ...dosenForm, email: e.target.value })}
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-red-500"
                />
                {formErrors.email && <p className="text-[10px] text-rose-500 font-semibold">{formErrors.email}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">No HP</label>
                <input
                  type="text"
                  value={dosenForm.noHp || ''}
                  onChange={(e) => setDosenForm({ ...dosenForm, noHp: e.target.value })}
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-red-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Status</label>
                <select
                  value={dosenForm.status || 'Aktif'}
                  onChange={(e) => setDosenForm({ ...dosenForm, status: e.target.value as any })}
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-red-500"
                >
                  <option value="Aktif">Aktif</option>
                  <option value="Cuti">Cuti</option>
                </select>
              </div>
            </div>
          )}

          {activeView === 'master-fakultas' && (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Kode Fakultas *</label>
                <input
                  type="text"
                  placeholder="e.g. FIK"
                  value={fakultasForm.kode || ''}
                  onChange={(e) => setFakultasForm({ ...fakultasForm, kode: e.target.value })}
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-red-500"
                />
                {formErrors.kode && <p className="text-[10px] text-rose-500 font-semibold">{formErrors.kode}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Nama Fakultas *</label>
                <input
                  type="text"
                  value={fakultasForm.nama || ''}
                  onChange={(e) => setFakultasForm({ ...fakultasForm, nama: e.target.value })}
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-red-500"
                />
                {formErrors.nama && <p className="text-[10px] text-rose-500 font-semibold">{formErrors.nama}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Nama Dekan</label>
                <input
                  type="text"
                  value={fakultasForm.dekan || ''}
                  onChange={(e) => setFakultasForm({ ...fakultasForm, dekan: e.target.value })}
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-red-500"
                />
              </div>
            </div>
          )}

          {activeView === 'master-prodi' && (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Kode Program Studi *</label>
                <input
                  type="text"
                  placeholder="e.g. TIF"
                  value={prodiForm.kode || ''}
                  onChange={(e) => setProdiForm({ ...prodiForm, kode: e.target.value })}
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-red-500"
                />
                {formErrors.kode && <p className="text-[10px] text-rose-500 font-semibold">{formErrors.kode}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Nama Program Studi *</label>
                <input
                  type="text"
                  value={prodiForm.nama || ''}
                  onChange={(e) => setProdiForm({ ...prodiForm, nama: e.target.value })}
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-red-500"
                />
                {formErrors.nama && <p className="text-[10px] text-rose-500 font-semibold">{formErrors.nama}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Fakultas Induk *</label>
                <select
                  value={prodiForm.fakultasId || ''}
                  onChange={(e) => {
                    setProdiForm({ ...prodiForm, fakultasId: e.target.value });
                    if (formErrors.fakultasId) {
                      setFormErrors({ ...formErrors, fakultasId: '' });
                    }
                  }}
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-red-500 relative z-50"
                >
                  <option value="">-- Pilih Fakultas --</option>
                  {fakultasList.map((f) => (
                    <option key={f.id} value={f.id}>{f.nama}</option>
                  ))}
                </select>
                {formErrors.fakultasId && <p className="text-[10px] text-rose-500 font-semibold">{formErrors.fakultasId}</p>}
              </div>
            </div>
          )}

          {activeView === 'master-matakuliah' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Kode MK *</label>
                <input
                  type="text"
                  placeholder="e.g. TIF-201"
                  value={mkForm.kode || ''}
                  onChange={(e) => setMkForm({ ...mkForm, kode: e.target.value })}
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-red-500"
                />
                {formErrors.kode && <p className="text-[10px] text-rose-500 font-semibold">{formErrors.kode}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Nama Mata Kuliah *</label>
                <input
                  type="text"
                  value={mkForm.nama || ''}
                  onChange={(e) => setMkForm({ ...mkForm, nama: e.target.value })}
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-red-500"
                />
                {formErrors.nama && <p className="text-[10px] text-rose-500 font-semibold">{formErrors.nama}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">SKS *</label>
                <input
                  type="number"
                  value={mkForm.sks || 3}
                  onChange={(e) => setMkForm({ ...mkForm, sks: parseInt(e.target.value) })}
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-red-500"
                />
                {formErrors.sks && <p className="text-[10px] text-rose-500 font-semibold">{formErrors.sks}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Semester Ditawarkan</label>
                <input
                  type="number"
                  value={mkForm.semester || 1}
                  onChange={(e) => setMkForm({ ...mkForm, semester: parseInt(e.target.value) })}
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-red-500"
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-bold text-slate-500">Program Studi *</label>
                <select
                  value={mkForm.prodiId || ''}
                  onChange={(e) => setMkForm({ ...mkForm, prodiId: e.target.value })}
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-red-500 relative z-50"
                >
                  {prodiList.map((p) => (
                    <option key={p.id} value={p.id}>{p.nama}</option>
                  ))}
                </select>
                {formErrors.prodiId && <p className="text-[10px] text-rose-500 font-semibold">{formErrors.prodiId}</p>}
              </div>
            </div>
          )}

          {activeView === 'master-kelas' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Nama Kelas *</label>
                <input
                  type="text"
                  placeholder="e.g. TIF-4A"
                  value={kelasForm.nama || ''}
                  onChange={(e) => setKelasForm({ ...kelasForm, nama: e.target.value })}
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-red-500"
                />
                {formErrors.nama && <p className="text-[10px] text-rose-500 font-semibold">{formErrors.nama}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Semester</label>
                <input
                  type="number"
                  value={kelasForm.semester || 1}
                  onChange={(e) => setKelasForm({ ...kelasForm, semester: parseInt(e.target.value) })}
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-red-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Kapasitas</label>
                <input
                  type="number"
                  value={kelasForm.kapasitas || 30}
                  onChange={(e) => setKelasForm({ ...kelasForm, kapasitas: parseInt(e.target.value) })}
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-red-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Dosen Pengajar *</label>
                <select
                  value={kelasForm.dosenNidn || ''}
                  onChange={(e) => setKelasForm({ ...kelasForm, dosenNidn: e.target.value })}
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-red-500 relative z-50"
                >
                  {dosenList.map((d) => (
                    <option key={d.nidn} value={d.nidn}>{d.nama}</option>
                  ))}
                </select>
                {formErrors.dosenNidn && <p className="text-[10px] text-rose-500 font-semibold">{formErrors.dosenNidn}</p>}
              </div>
            </div>
          )}

          {activeView === 'master-jadwal' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Mata Kuliah *</label>
                <select
                  value={jadwalForm.matakuliahId || ''}
                  onChange={(e) => setJadwalForm({ ...jadwalForm, matakuliahId: e.target.value })}
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-red-500 relative z-50"
                >
                  {mkList.map((mk) => (
                    <option key={mk.id} value={mk.id}>{mk.nama}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Kelas *</label>
                <select
                  value={jadwalForm.kelasId || ''}
                  onChange={(e) => setJadwalForm({ ...jadwalForm, kelasId: e.target.value })}
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-red-500 relative z-50"
                >
                  {kelasList.map((k) => (
                    <option key={k.id} value={k.id}>{k.nama}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Hari Kuliah *</label>
                <select
                  value={jadwalForm.hari || 'Senin'}
                  onChange={(e) => setJadwalForm({ ...jadwalForm, hari: e.target.value as any })}
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-red-500 relative z-50"
                >
                  <option value="Senin">Senin</option>
                  <option value="Selasa">Selasa</option>
                  <option value="Rabu">Rabu</option>
                  <option value="Kamis">Kamis</option>
                  <option value="Jumat">Jumat</option>
                  <option value="Sabtu">Sabtu</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Ruangan</label>
                <input
                  type="text"
                  placeholder="e.g. Lab Komputer 1"
                  value={jadwalForm.ruang || ''}
                  onChange={(e) => setJadwalForm({ ...jadwalForm, ruang: e.target.value })}
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-red-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Jam Mulai *</label>
                <input
                  type="text"
                  placeholder="e.g. 08:00"
                  value={jadwalForm.jamMulai || ''}
                  onChange={(e) => setJadwalForm({ ...jadwalForm, jamMulai: e.target.value })}
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-red-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Jam Selesai *</label>
                <input
                  type="text"
                  placeholder="e.g. 10:30"
                  value={jadwalForm.jamSelesai || ''}
                  onChange={(e) => setJadwalForm({ ...jadwalForm, jamSelesai: e.target.value })}
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-red-500"
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-bold text-slate-500">Dosen Pengampu *</label>
                <select
                  value={jadwalForm.dosenNidn || ''}
                  onChange={(e) => setJadwalForm({ ...jadwalForm, dosenNidn: e.target.value })}
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-red-500 relative z-50"
                >
                  {dosenList.map((d) => (
                    <option key={d.nidn} value={d.nidn}>{d.nama}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {activeView === 'master-tahun-akademik' && (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Tahun Akademik *</label>
                <input
                  type="text"
                  placeholder="e.g. 2026/2027"
                  value={taForm.tahun || ''}
                  onChange={(e) => setTaForm({ ...taForm, tahun: e.target.value })}
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-red-500"
                />
                {formErrors.tahun && <p className="text-[10px] text-rose-500 font-semibold">{formErrors.tahun}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Tipe Semester</label>
                <select
                  value={taForm.semesterTipe || 'Ganjil'}
                  onChange={(e) => setTaForm({ ...taForm, semesterTipe: e.target.value as any })}
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-red-500"
                >
                  <option value="Ganjil">Ganjil</option>
                  <option value="Genap">Genap</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Status</label>
                <select
                  value={taForm.status || 'Tidak Aktif'}
                  onChange={(e) => setTaForm({ ...taForm, status: e.target.value as any })}
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-red-500"
                >
                  <option value="Aktif">Aktif</option>
                  <option value="Tidak Aktif">Tidak Aktif</option>
                </select>
              </div>
            </div>
          )}

          {/* Footer Action buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-red-800 text-white text-xs font-semibold hover:bg-red-900 shadow-sm transition-colors animate-pulse-slow"
            >
              Simpan Perubahan
            </button>
          </div>
        </form>
      </Modal>

      {/* Excel Import Simulation Modal */}
      <Modal isOpen={importOpen} onClose={() => setImportOpen(false)} title="Simulasi Import Excel (CSV)">
        <form onSubmit={handleExcelImportSubmit} className="space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-[11px] leading-relaxed flex gap-2">
            <AlertTriangle className="w-5 h-5 shrink-0 text-amber-500" />
            <div>
              <p className="font-bold">Panduan Format Pengunggahan CSV:</p>
              <p>Masukkan baris data dipisahkan koma dengan urutan berikut:</p>
              <p className="font-mono mt-1 font-bold">NIM, Nama, Jenis Kelamin, Email, Semester</p>
              <p className="font-mono mt-0.5 text-slate-600 bg-amber-100/50 p-1 rounded-md">
                220101999, Dian Eka, Perempuan, dian@siakad.ac.id, 2
              </p>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500">Salin & Tempel Data Spreadsheet Disini</label>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="Masukkan baris-baris data..."
              rows={6}
              className="w-full text-xs font-mono p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-red-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setImportOpen(false)}
              className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-red-800 text-white text-xs font-semibold hover:bg-red-900 shadow-sm"
            >
              Impor Sekarang
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

