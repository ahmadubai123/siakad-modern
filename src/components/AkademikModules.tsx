/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  FileCheck,
  Check,
  X,
  Plus,
  Percent,
  Calendar,
  Award,
  CheckSquare,
  QrCode,
  Send,
  MessageSquare,
  Mail,
  ClipboardList,
  ChevronDown,
  Printer,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useState, useEffect, FormEvent } from 'react';
import Modal from './Modal.tsx';
import { Mahasiswa, Dosen, MataKuliah, Kelas, Jadwal, KRS, Nilai, AbsensiPertemuan, AbsensiMahasiswa, KalenderAkademik, Chat, SuratAkademik, EvaluasiDosen, ProgramStudi } from '../types.ts';

interface AkademikModulesProps {
  activeView: string;
  currentRole: 'Administrator' | 'Dosen' | 'Mahasiswa';
  currentUser: { displayName: string; email: string; username: string; referenceId?: string };
}

export default function AkademikModules({ activeView, currentRole, currentUser }: AkademikModulesProps) {
  // Lists from DB
  const [mhsList, setMhsList] = useState<Mahasiswa[]>([]);
  const [dosenList, setDosenList] = useState<Dosen[]>([]);
  const [mkList, setMkList] = useState<MataKuliah[]>([]);
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [jadwalList, setJadwalList] = useState<Jadwal[]>([]);
  const [krsList, setKrsList] = useState<KRS[]>([]);
  const [nilaiList, setNilaiList] = useState<Nilai[]>([]);
  const [calList, setCalList] = useState<KalenderAkademik[]>([]);
  const [suratList, setSuratList] = useState<SuratAkademik[]>([]);
  const [prodiList, setProdiList] = useState<ProgramStudi[]>([]);

  // Absensi lists
  const [absPertemuan, setAbsPertemuan] = useState<AbsensiPertemuan[]>([]);
  const [absMhs, setAbsMhs] = useState<AbsensiMahasiswa[]>([]);

  // Local operational states
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // KRS states
  const [selectedJadwalId, setSelectedJadwalId] = useState('');

  // Nilai input states
  const [selectedJadwalNilai, setSelectedJadwalNilai] = useState('');
  const [gradeInputs, setGradeInputs] = useState<{ [nim: string]: { tugas: number; quiz: number; uts: number; uas: number } }>({});

  // Chat states
  const [selectedRecipient, setSelectedRecipient] = useState('');
  const [chats, setChats] = useState<Chat[]>([]);
  const [newChatMsg, setNewChatMsg] = useState('');

  // Absensi operation states
  const [activeOpenAbsJadwal, setActiveOpenAbsJadwal] = useState('');
  const [pertemuanKeInput, setPertemuanKeInput] = useState('1');
  const [tanggalAbsInput, setTanggalAbsInput] = useState(new Date().toISOString().split('T')[0]);
  const [scannedQrCodeInput, setScannedQrCodeInput] = useState('');

  // Surat states
  const [suratModalOpen, setSuratModalOpen] = useState(false);
  const [suratForm, setSuratForm] = useState({ tipe: 'Surat Aktif Kuliah' as any, keterangan: '' });

  // Evaluasi states
  const [selectedEvalDosen, setSelectedEvalDosen] = useState('');
  const [evalSkor, setEvalSkor] = useState({ kompetensi: 5, pedagogik: 5, profesional: 5, sosial: 5 });
  const [evalKomentar, setEvalKomentar] = useState('');

  // Kalender addition modal
  const [calModalOpen, setCalModalOpen] = useState(false);
  const [calForm, setCalForm] = useState<Partial<KalenderAkademik>>({ event: '', kategori: 'UTS', tanggalMulai: '', tanggalSelesai: '' });

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const loadAllData = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/mahasiswa').then((r) => r.json()),
      fetch('/api/dosen').then((r) => r.json()),
      fetch('/api/matakuliah').then((r) => r.json()),
      fetch('/api/kelas').then((r) => r.json()),
      fetch('/api/jadwal').then((r) => r.json()),
      fetch('/api/krs').then((r) => r.json()),
      fetch('/api/nilai').then((r) => r.json()),
      fetch('/api/absensi').then((r) => r.json()),
      fetch('/api/kalender').then((r) => r.json()),
      fetch('/api/surat').then((r) => r.json()),
      fetch('/api/prodi').then((r) => r.json()),
    ])
      .then(([mhs, dsn, mk, kls, jdw, krs, nil, abs, cal, srt, prd]) => {
        setMhsList(mhs);
        setDosenList(dsn);
        setMkList(mk);
        setKelasList(kls);
        setJadwalList(jdw);
        setKrsList(krs);
        setNilaiList(nil);
        setAbsPertemuan(abs.pertemuan || []);
        setAbsMhs(abs.mahasiswa || []);
        setCalList(cal);
        setSuratList(srt);
        setProdiList(prd);
        setLoading(false);
      })
      .catch((e) => {
        console.error('Error loading academic files', e);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadAllData();
  }, [activeView]);

  // Load chat messages
  useEffect(() => {
    if (activeView === 'akademik-chat' && selectedRecipient) {
      fetch(`/api/chat?pengirimId=${currentUser.username}&penerimaId=${selectedRecipient}`)
        .then((r) => r.json())
        .then((data) => setChats(data))
        .catch((e) => console.error(e));
    }
  }, [activeView, selectedRecipient, toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-2">
          <div className="w-10 h-10 border-4 border-red-700 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-slate-500">Memuat modul akademik...</p>
        </div>
      </div>
    );
  }

  // --- WORKFLOW 1: KRS (KARTU RENCANA STUDI) ---
  const handleAmbilKrs = () => {
    if (!selectedJadwalId) return;
    const isAlreadyTaken = krsList.some(
      (k) => k.mahasiswaNim === currentUser.username && k.jadwalId === selectedJadwalId
    );
    if (isAlreadyTaken) {
      showToast('error', 'Mata kuliah / jadwal ini sudah Anda ambil!');
      return;
    }

    // Limit checks: average 24 SKS maximum
    const currentMyKrs = krsList.filter((k) => k.mahasiswaNim === currentUser.username);
    const totalSksTaken = currentMyKrs.reduce((acc, k) => {
      const jdw = jadwalList.find((j) => j.id === k.jadwalId);
      const mk = jdw ? mkList.find((m) => m.id === jdw.matakuliahId) : null;
      return acc + (mk ? mk.sks : 0);
    }, 0);

    const targetJdw = jadwalList.find((j) => j.id === selectedJadwalId);
    const targetMk = targetJdw ? mkList.find((m) => m.id === targetJdw.matakuliahId) : null;
    const addSks = targetMk ? targetMk.sks : 0;

    if (totalSksTaken + addSks > 24) {
      showToast('error', 'Gagal! Batas pengambilan maksimal adalah 24 SKS per semester.');
      return;
    }

    const newKrs: Partial<KRS> = {
      mahasiswaNim: currentUser.username || '',
      jadwalId: selectedJadwalId,
      tahunAkademikId: 'ta-2026',
      status: 'Menunggu Persetujuan',
      tanggalPengajuan: new Date().toISOString().split('T')[0],
    };

    fetch('/api/krs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newKrs),
    })
      .then((r) => r.json())
      .then(() => {
        showToast('success', 'KRS berhasil diajukan! Menunggu persetujuan dosen wali.');
        loadAllData();
      });
  };

  const handleBatalKrs = (krsId: string) => {
    if (window.confirm('Apakah Anda yakin ingin membatalkan/menghapus mata kuliah ini dari KRS Anda?')) {
      fetch(`/api/krs/${krsId}`, { method: 'DELETE' })
        .then((r) => r.json())
        .then(() => {
          showToast('success', 'Mata kuliah berhasil dibatalkan dari KRS.');
          loadAllData();
        });
    }
  };

  const handleApproveKrs = (krsId: string, status: 'Disetujui' | 'Ditolak') => {
    fetch('/api/krs/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ krsId, status }),
    })
      .then((r) => r.json())
      .then(() => {
        showToast('success', `Berhasil melakukan approval KRS menjadi: ${status}`);
        loadAllData();
      });
  };

  // --- WORKFLOW 2: NILAI MAHASISWA ---
  const handleCalculateNilai = (nim: string) => {
    const inputs = gradeInputs[nim];
    if (!inputs) return;

    fetch('/api/nilai/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nim,
        jadwalId: selectedJadwalNilai,
        tugas: inputs.tugas,
        quiz: inputs.quiz,
        uts: inputs.uts,
        uas: inputs.uas,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          showToast('success', `Nilai mahasiswa ${nim} berhasil disimpan!`);
          loadAllData();
        }
      });
  };

  // --- WORKFLOW 3: ABSENSI PERKULIAHAN ---
  const handleBukaAbsensi = (e: FormEvent) => {
    e.preventDefault();
    if (!activeOpenAbsJadwal) return;

    fetch('/api/absensi/buka', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jadwalId: activeOpenAbsJadwal,
        pertemuanKe: pertemuanKeInput,
        tanggal: tanggalAbsInput,
      }),
    })
      .then((r) => r.json())
      .then(() => {
        showToast('success', 'Sesi absensi perkuliahan berhasil dibuka!');
        loadAllData();
      });
  };

  const handleTutupAbsensi = (pertemuanId: string) => {
    fetch('/api/absensi/tutup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pertemuanId }),
    })
      .then((r) => r.json())
      .then(() => {
        showToast('success', 'Sesi absensi perkuliahan berhasil ditutup.');
        loadAllData();
      });
  };

  const handleScanPresensi = (e: FormEvent) => {
    e.preventDefault();
    if (!scannedQrCodeInput) return;

    fetch('/api/absensi/presensi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nim: currentUser.username,
        kodeQr: scannedQrCodeInput,
        status: 'Hadir',
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('Kode QR Absensi tidak valid');
        return res.json();
      })
      .then(() => {
        showToast('success', 'Presensi Anda berhasil dicatat! Selamat berkuliah.');
        setScannedQrCodeInput('');
        loadAllData();
      })
      .catch((err) => showToast('error', err.message || 'Kode QR salah atau sesi ditutup.'));
  };

  // --- WORKFLOW 4: CHAT AKADEMIK ---
  const handleSendChat = (e: FormEvent) => {
    e.preventDefault();
    if (!newChatMsg.trim() || !selectedRecipient) return;

    fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pengirimId: currentUser.username,
        penerimaId: selectedRecipient,
        pesan: newChatMsg,
      }),
    })
      .then((r) => r.json())
      .then(() => {
        setNewChatMsg('');
        showToast('success', 'Pesan terkirim');
      });
  };

  // --- WORKFLOW 5: SURAT AKADEMIK ---
  const handleApplySurat = (e: FormEvent) => {
    e.preventDefault();
    fetch('/api/surat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mahasiswaNim: currentUser.username,
        tipe: suratForm.tipe,
        keterangan: suratForm.keterangan,
        status: 'Menunggu',
        tanggalPengajuan: new Date().toISOString().split('T')[0],
      }),
    })
      .then((r) => r.json())
      .then(() => {
        showToast('success', 'Permohonan surat berhasil diajukan!');
        setSuratModalOpen(false);
        setSuratForm({ tipe: 'Surat Aktif Kuliah', keterangan: '' });
        loadAllData();
      });
  };

  const handleProcessSurat = (suratId: string, status: 'Diproses' | 'Selesai') => {
    fetch(`/api/surat/${suratId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
      .then((r) => r.json())
      .then(() => {
        showToast('success', `Surat berhasil diproses menjadi: ${status}`);
        loadAllData();
      });
  };

  // --- WORKFLOW 6: EVALUASI DOSEN ---
  const handleApplyEvaluasi = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedEvalDosen) {
      showToast('error', 'Silakan pilih dosen terlebih dahulu');
      return;
    }

    fetch('/api/evaluasi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mahasiswaNim: currentUser.username,
        dosenNidn: selectedEvalDosen,
        kelasId: kelasList[0]?.id || 'kls-01',
        skorKompetensi: evalSkor.kompetensi,
        skorPedagogik: evalSkor.pedagogik,
        skorProfesional: evalSkor.profesional,
        skorSosial: evalSkor.sosial,
        komentar: evalKomentar,
      }),
    })
      .then((r) => r.json())
      .then(() => {
        showToast('success', 'Kuisioner evaluasi dosen berhasil dikirim. Terima kasih atas masukan Anda!');
        setSelectedEvalDosen('');
        setEvalKomentar('');
        loadAllData();
      });
  };

  // --- WORKFLOW 7: KALENDER ACAD ADDITION ---
  const handleAddCalendar = (e: FormEvent) => {
    e.preventDefault();
    fetch('/api/kalender', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(calForm),
    })
      .then((r) => r.json())
      .then(() => {
        showToast('success', 'Event akademik berhasil ditambahkan ke kalender!');
        setCalModalOpen(false);
        setCalForm({ event: '', kategori: 'UTS', tanggalMulai: '', tanggalSelesai: '' });
        loadAllData();
      });
  };

  return (
    <div className="space-y-4">
      {toast && (
        <div className={`fixed top-20 right-4 z-50 flex items-center gap-2 p-4 rounded-xl shadow-lg border text-xs font-semibold ${
          toast.type === 'success' ? 'bg-red-50 border-red-200 text-red-900 dark:bg-red-950 dark:border-red-800' : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          <Check className="w-4 h-4" />
          <span>{toast.msg}</span>
        </div>
      )}

      {/* VIEW SECTION 1: KRS WORKFLOW */}
      {activeView === 'akademik-krs' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Kartu Rencana Studi (KRS)</h2>
            <p className="text-xs text-slate-400">Pengisian dan approval rencana studi mahasiswa.</p>
          </div>

          {/* Mahasiswa View: Add and Drop Course */}
          {currentRole === 'Mahasiswa' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Enrollment Form */}
              <div className="lg:col-span-1 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-red-700" />
                  Ambil Mata Kuliah
                </h3>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">Pilih Jadwal Kuliah</label>
                    <select
                      id="krs-select-jadwal"
                      value={selectedJadwalId}
                      onChange={(e) => setSelectedJadwalId(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                    >
                      <option value="">-- Pilih Jadwal & Mata Kuliah --</option>
                      {jadwalList.map((j) => {
                        const mk = mkList.find((m) => m.id === j.matakuliahId);
                        const kls = kelasList.find((k) => k.id === j.kelasId);
                        return mk ? (
                          <option key={j.id} value={j.id}>
                            [{mk.kode}] {mk.nama} ({mk.sks} SKS) - {kls?.nama || j.kelasId} [{j.hari} {j.jamMulai}]
                          </option>
                        ) : null;
                      })}
                    </select>
                  </div>

                  <button
                    id="submit-krs-btn"
                    onClick={handleAmbilKrs}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-red-800 text-white font-bold text-xs hover:bg-red-900 transition-colors shadow-sm"
                  >
                    Tambahkan ke KRS
                  </button>
                </div>
              </div>

              {/* My active KRS */}
              <div className="lg:col-span-2 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3">
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-red-700" />
                  KRS Saya Semester Ini (Max 24 SKS)
                </h3>

                <div className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 font-bold text-slate-500">
                      <tr>
                        <th className="p-3">Kode</th>
                        <th className="p-3">Mata Kuliah</th>
                        <th className="p-3">SKS</th>
                        <th className="p-3">Hari & Jam</th>
                        <th className="p-3">Kelas</th>
                        <th className="p-3">Status Approval</th>
                        <th className="p-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {krsList.filter((k) => k.mahasiswaNim === currentUser.username).length === 0 && (
                        <tr>
                          <td colSpan={7} className="p-6 text-center text-slate-400">
                            Belum ada mata kuliah diambil semester ini.
                          </td>
                        </tr>
                      )}

                      {krsList
                        .filter((k) => k.mahasiswaNim === currentUser.username)
                        .map((k) => {
                          const jdw = jadwalList.find((j) => j.id === k.jadwalId);
                          const mk = jdw ? mkList.find((m) => m.id === jdw.matakuliahId) : null;
                          const kls = jdw ? kelasList.find((c) => c.id === jdw.kelasId) : null;

                          return (
                            <tr key={k.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                              <td className="p-3 font-semibold text-red-800">{mk?.kode}</td>
                              <td className="p-3 font-bold">{mk?.nama}</td>
                              <td className="p-3 font-semibold">{mk?.sks} SKS</td>
                              <td className="p-3">
                                {jdw?.hari}, {jdw?.jamMulai} - {jdw?.jamSelesai}
                              </td>
                              <td className="p-3">{kls?.nama}</td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  k.status === 'Disetujui' ? 'bg-red-50 text-red-900' : 'bg-amber-50 text-amber-700'
                                }`}>{k.status}</span>
                              </td>
                              <td className="p-3 text-right">
                                <button
                                  onClick={() => handleBatalKrs(k.id)}
                                  className="text-rose-600 hover:underline font-bold"
                                >
                                  Batal
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Administrator / Dosen Wali View: Approve KRS */}
          {currentRole === 'Administrator' && (
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-red-700" />
                Antrean Persetujuan KRS Mahasiswa
              </h3>

              <div className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 font-bold text-slate-500">
                    <tr>
                      <th className="p-3">Mahasiswa</th>
                      <th className="p-3">Mata Kuliah</th>
                      <th className="p-3">SKS</th>
                      <th className="p-3">Jadwal / Kelas</th>
                      <th className="p-3">Tgl Diajukan</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Aksi Approval</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {krsList.filter((k) => k.status === 'Menunggu Persetujuan').length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-slate-400">
                          Tidak ada antrean persetujuan KRS saat ini.
                        </td>
                      </tr>
                    )}

                    {krsList
                      .filter((k) => k.status === 'Menunggu Persetujuan')
                      .map((k) => {
                        const mhs = mhsList.find((m) => m.nim === k.mahasiswaNim);
                        const jdw = jadwalList.find((j) => j.id === k.jadwalId);
                        const mk = jdw ? mkList.find((m) => m.id === jdw.matakuliahId) : null;
                        const kls = jdw ? kelasList.find((c) => c.id === jdw.kelasId) : null;

                        return (
                          <tr key={k.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                            <td className="p-3 font-semibold">
                              {mhs?.nama} <span className="text-slate-400 block text-[10px]">NIM: {k.mahasiswaNim}</span>
                            </td>
                            <td className="p-3 font-bold">
                              {mk?.nama} <span className="text-slate-400 block text-[10px] font-mono">[{mk?.kode}]</span>
                            </td>
                            <td className="p-3 font-semibold">{mk?.sks} SKS</td>
                            <td className="p-3">
                              {kls?.nama} ({jdw?.hari}, {jdw?.jamMulai})
                            </td>
                            <td className="p-3">{k.tanggalPengajuan}</td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700">
                                {k.status}
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex justify-end gap-1.5">
                                <button
                                  id="approve-krs-btn"
                                  onClick={() => handleApproveKrs(k.id, 'Disetujui')}
                                  className="px-2.5 py-1 rounded bg-red-800 text-white font-bold text-[10px] hover:bg-red-900"
                                >
                                  Setujui
                                </button>
                                <button
                                  onClick={() => handleApproveKrs(k.id, 'Ditolak')}
                                  className="px-2.5 py-1 rounded bg-rose-600 text-white font-bold text-[10px] hover:bg-rose-700"
                                >
                                  Tolak
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW SECTION 2: INPUT / EDIT NILAI */}
      {activeView === 'akademik-nilai' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Transkrip & Penilaian Mata Kuliah</h2>
            <p className="text-xs text-slate-400">Penginputan nilai UTS, UAS, Tugas, Quiz, serta auto-grade penilaian.</p>
          </div>

          {/* Dosen View: Input components */}
          {currentRole === 'Dosen' && (
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                  Panel Input Nilai Kelas Mengajar
                </h3>
                <select
                  value={selectedJadwalNilai}
                  onChange={(e) => setSelectedJadwalNilai(e.target.value)}
                  className="text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                >
                  <option value="">-- Pilih Mata Kuliah Kelas Anda --</option>
                  {jadwalList
                    .filter((j) => j.dosenNidn === currentUser.referenceId)
                    .map((j) => {
                      const mk = mkList.find((m) => m.id === j.matakuliahId);
                      const kls = kelasList.find((c) => c.id === j.kelasId);
                      return mk ? (
                        <option key={j.id} value={j.id}>
                          {mk.nama} - Kelas {kls?.nama}
                        </option>
                      ) : null;
                    })}
                </select>
              </div>

              {selectedJadwalNilai ? (
                <div className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 font-bold text-slate-500">
                      <tr>
                        <th className="p-3">Mahasiswa</th>
                        <th className="p-3 w-20">Tugas (20%)</th>
                        <th className="p-3 w-20">Quiz (10%)</th>
                        <th className="p-3 w-20">UTS (30%)</th>
                        <th className="p-3 w-20">UAS (40%)</th>
                        <th className="p-3 text-center">Nilai Akhir</th>
                        <th className="p-3 text-center">Grade</th>
                        <th className="p-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {mhsList.map((m) => {
                        const score = nilaiList.find(
                          (n) => n.mahasiswaNim === m.nim && n.jadwalId === selectedJadwalNilai
                        );
                        // Local state init
                        const stateValue = gradeInputs[m.nim] || {
                          tugas: score?.tugas || 0,
                          quiz: score?.quiz || 0,
                          uts: score?.uts || 0,
                          uas: score?.uas || 0,
                        };

                        const handleLocalChange = (field: string, val: number) => {
                          setGradeInputs({
                            ...gradeInputs,
                            [m.nim]: { ...stateValue, [field]: val },
                          });
                        };

                        return (
                          <tr key={m.nim} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                            <td className="p-3">
                              <span className="font-bold block">{m.nama}</span>
                              <span className="text-[10px] text-slate-400">NIM: {m.nim}</span>
                            </td>
                            <td className="p-3">
                              <input
                                type="number"
                                value={stateValue.tugas}
                                onChange={(e) => handleLocalChange('tugas', parseFloat(e.target.value) || 0)}
                                className="w-16 p-1 border rounded text-center"
                              />
                            </td>
                            <td className="p-3">
                              <input
                                type="number"
                                value={stateValue.quiz}
                                onChange={(e) => handleLocalChange('quiz', parseFloat(e.target.value) || 0)}
                                className="w-16 p-1 border rounded text-center"
                              />
                            </td>
                            <td className="p-3">
                              <input
                                type="number"
                                value={stateValue.uts}
                                onChange={(e) => handleLocalChange('uts', parseFloat(e.target.value) || 0)}
                                className="w-16 p-1 border rounded text-center"
                              />
                            </td>
                            <td className="p-3">
                              <input
                                type="number"
                                value={stateValue.uas}
                                onChange={(e) => handleLocalChange('uas', parseFloat(e.target.value) || 0)}
                                className="w-16 p-1 border rounded text-center"
                              />
                            </td>
                            <td className="p-3 text-center font-bold text-red-800">
                              {score ? score.nilaiAkhir : '-'}
                            </td>
                            <td className="p-3 text-center">
                              <span className="px-2 py-0.5 rounded font-extrabold bg-slate-100">
                                {score ? score.grade : '-'}
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              <button
                                onClick={() => handleCalculateNilai(m.nim)}
                                className="px-2.5 py-1.5 rounded-lg bg-red-800 text-white font-bold"
                              >
                                Simpan
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center text-xs text-slate-400 py-6">
                  Silakan pilih mata kuliah yang Anda ajar untuk menginput nilai mahasiswa.
                </p>
              )}
            </div>
          )}

          {/* Mahasiswa View: Personal grade sheet */}
          {currentRole === 'Mahasiswa' && (
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Percent className="w-4 h-4 text-red-700" />
                Daftar Nilai Semester Saya
              </h3>

              <div className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 font-bold text-slate-500">
                    <tr>
                      <th className="p-3">Mata Kuliah</th>
                      <th className="p-3">SKS</th>
                      <th className="p-3 text-center">Tugas (20%)</th>
                      <th className="p-3 text-center">Quiz (10%)</th>
                      <th className="p-3 text-center">UTS (30%)</th>
                      <th className="p-3 text-center">UAS (40%)</th>
                      <th className="p-3 text-center">Nilai Akhir</th>
                      <th className="p-3 text-center">Grade Huruf</th>
                      <th className="p-3 text-center">Bobot Angka</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {nilaiList.filter((n) => n.mahasiswaNim === currentUser.username).length === 0 && (
                      <tr>
                        <td colSpan={9} className="p-6 text-center text-slate-400">
                          Belum ada nilai yang diinput oleh dosen wali semester ini.
                        </td>
                      </tr>
                    )}

                    {nilaiList
                      .filter((n) => n.mahasiswaNim === currentUser.username)
                      .map((n) => {
                        const jdw = jadwalList.find((j) => j.id === n.jadwalId);
                        const mk = jdw ? mkList.find((m) => m.id === jdw.matakuliahId) : null;

                        return (
                          <tr key={n.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                            <td className="p-3 font-bold">{mk?.nama || 'Mata Kuliah'}</td>
                            <td className="p-3 font-semibold">{mk?.sks} SKS</td>
                            <td className="p-3 text-center">{n.tugas}</td>
                            <td className="p-3 text-center">{n.quiz}</td>
                            <td className="p-3 text-center">{n.uts}</td>
                            <td className="p-3 text-center">{n.uas}</td>
                            <td className="p-3 text-center font-extrabold text-red-800 bg-red-50/20">
                              {n.nilaiAkhir}
                            </td>
                            <td className="p-3 text-center font-bold">
                              <span className="px-2.5 py-0.5 rounded bg-red-50 text-red-900">{n.grade}</span>
                            </td>
                            <td className="p-3 text-center font-mono font-bold">{n.bobot.toFixed(2)}</td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW SECTION 3: TRANSKRIP NILAI & QR CARD */}
      {activeView === 'akademik-transkrip' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Transkrip Akademik Kumulatif</h2>
              <p className="text-xs text-slate-400">Data transkrip lengkap, perhitungan IPK otomatis, beserta Kartu QR Mahasiswa.</p>
            </div>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-semibold hover:bg-slate-50 bg-white"
            >
              <Printer className="w-4 h-4" />
              Cetak Transkrip (PDF)
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Student QR Code Kartu Mahasiswa Card */}
            <div className="lg:col-span-1 space-y-4">
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <QrCode className="w-4.5 h-4.5 text-red-700" />
                Kartu Mahasiswa & QR Code Akademik
              </h3>

              {/* High-fidelity Card mock */}
              <div className="relative overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 text-white p-5 shadow-xl space-y-4 flex flex-col justify-between h-80 bg-radial-gradient">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-extrabold text-slate-400 tracking-widest uppercase">UNIVERSITAS SIAKAD</span>
                    <h4 className="text-xs font-bold text-red-700">KARTU TANDA MAHASISWA</h4>
                  </div>
                  <Sparkles className="w-5 h-5 text-red-700 animate-pulse" />
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-red-700">
                    <img
                      src={
                        mhsList.find((m) => m.nim === currentUser.username)?.foto ||
                        'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150'
                      }
                      alt="Student Portrait"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold truncate max-w-40">{currentUser.displayName}</p>
                    <p className="text-xs font-semibold text-slate-400 font-mono">NIM: {currentUser.username}</p>
                    <p className="text-[10px] text-red-600 font-semibold truncate max-w-40">
                      {prodiList[0]?.nama || 'Teknik Informatika'}
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-end border-t border-slate-800 pt-3">
                  <div className="text-[9px] text-slate-500">
                    <p>Masa Berlaku:</p>
                    <p className="font-bold text-slate-300">2024 - 2028</p>
                  </div>
                  {/* Real simulated QR code! */}
                  <div className="p-1 bg-white rounded-lg flex items-center justify-center shadow-lg border border-slate-800">
                    <div className="w-12 h-12 bg-slate-900 rounded-sm flex items-center justify-center text-white text-[9px] font-extrabold text-center leading-none">
                      SIAKAD<br />
                      MHS
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Transkrip Sheet */}
            <div className="lg:col-span-2 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
              <div className="border-b border-dashed pb-3">
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                  TRANSKRIP NILAI AKADEMIK SEMENTARA
                </h3>
                <div className="grid grid-cols-2 gap-4 text-xs mt-2 text-slate-500">
                  <div>
                    <p>Nama: <span className="font-bold text-slate-800 dark:text-white">{currentUser.displayName}</span></p>
                    <p>NIM: <span className="font-bold text-slate-800 dark:text-white">{currentUser.username}</span></p>
                  </div>
                  <div>
                    <p>Semester: <span className="font-bold text-slate-800 dark:text-white">4 (Empat)</span></p>
                    <p>Program Studi: <span className="font-bold text-slate-800 dark:text-white">Teknik Informatika</span></p>
                  </div>
                </div>
              </div>

              {/* Course list */}
              <div className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 font-bold text-slate-500">
                    <tr>
                      <th className="p-3">Kode MK</th>
                      <th className="p-3">Mata Kuliah</th>
                      <th className="p-3 text-center">SKS</th>
                      <th className="p-3 text-center">Nilai Akhir</th>
                      <th className="p-3 text-center">Grade Huruf</th>
                      <th className="p-3 text-center">Bobot</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {nilaiList.filter((n) => n.mahasiswaNim === currentUser.username).length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-slate-400">
                          Belum ada riwayat akademik tercatat.
                        </td>
                      </tr>
                    )}

                    {nilaiList
                      .filter((n) => n.mahasiswaNim === currentUser.username)
                      .map((n) => {
                        const jdw = jadwalList.find((j) => j.id === n.jadwalId);
                        const mk = jdw ? mkList.find((m) => m.id === jdw.matakuliahId) : null;

                        return (
                          <tr key={n.id} className="hover:bg-slate-50/50">
                            <td className="p-3 font-mono font-bold text-red-800">{mk?.kode}</td>
                            <td className="p-3 font-semibold">{mk?.nama}</td>
                            <td className="p-3 text-center font-semibold">{mk?.sks} SKS</td>
                            <td className="p-3 text-center">{n.nilaiAkhir}</td>
                            <td className="p-3 text-center font-bold">
                              <span className="px-2 py-0.5 rounded bg-slate-100">{n.grade}</span>
                            </td>
                            <td className="p-3 text-center font-mono font-bold">{n.bobot.toFixed(2)}</td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>

              {/* IPK and totals calculator */}
              <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 text-xs flex justify-between items-center">
                <div>
                  <p className="text-slate-500 font-semibold">Total SKS Diambil:</p>
                  <p className="text-lg font-bold text-slate-800 dark:text-white">
                    {nilaiList
                      .filter((n) => n.mahasiswaNim === currentUser.username)
                      .reduce((acc, curr) => {
                        const jdw = jadwalList.find((j) => j.id === curr.jadwalId);
                        const mk = jdw ? mkList.find((m) => m.id === jdw.matakuliahId) : null;
                        return acc + (mk ? mk.sks : 3);
                      }, 0)}{' '}
                    SKS
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-slate-500 font-semibold">Indeks Prestasi Kumulatif (IPK):</p>
                  <p className="text-lg font-extrabold text-red-800 dark:text-red-600">
                    {(
                      nilaiList
                        .filter((n) => n.mahasiswaNim === currentUser.username)
                        .reduce((acc, curr) => acc + curr.bobot, 0) /
                        (nilaiList.filter((n) => n.mahasiswaNim === currentUser.username).length || 1) || 3.52
                    ).toFixed(2)}{' '}
                    / 4.00
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW SECTION 4: ABSENSI PERKULIAHAN */}
      {activeView === 'akademik-absensi' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Presensi Kehadiran Perkuliahan</h2>
            <p className="text-xs text-slate-400">Pembukaan absensi pertemuan oleh Dosen dan pengisian presensi QR oleh Mahasiswa.</p>
          </div>

          {/* Dosen View: Open attendance session and see attendee list */}
          {currentRole === 'Dosen' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Form to open attendance */}
              <div className="lg:col-span-1 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-red-700" />
                  Buka Sesi Kehadiran Baru
                </h3>

                <form onSubmit={handleBukaAbsensi} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">Pilih Jadwal Mengajar</label>
                    <select
                      value={activeOpenAbsJadwal}
                      onChange={(e) => setActiveOpenAbsJadwal(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800"
                      required
                    >
                      <option value="">-- Pilih Kelas Mengajar --</option>
                      {jadwalList
                        .filter((j) => j.dosenNidn === currentUser.referenceId)
                        .map((j) => {
                          const mk = mkList.find((m) => m.id === j.matakuliahId);
                          const kls = kelasList.find((c) => c.id === j.kelasId);
                          return mk ? (
                            <option key={j.id} value={j.id}>
                              {mk.nama} - Kelas {kls?.nama}
                            </option>
                          ) : null;
                        })}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500">Pertemuan Ke-</label>
                      <select
                        value={pertemuanKeInput}
                        onChange={(e) => setPertemuanKeInput(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800"
                      >
                        {Array.from({ length: 16 }, (_, i) => (
                          <option key={i + 1} value={i + 1}>
                            Pertemuan {i + 1}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500">Tanggal Sesi</label>
                      <input
                        type="date"
                        value={tanggalAbsInput}
                        onChange={(e) => setTanggalAbsInput(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-red-800 text-white font-bold text-xs hover:bg-red-900 shadow-sm"
                  >
                    Buka Absen QR
                  </button>
                </form>
              </div>

              {/* Active attendance list */}
              <div className="lg:col-span-2 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                  Daftar Pertemuan & Status QR Absensi dibuka
                </h3>

                <div className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 font-bold text-slate-500">
                      <tr>
                        <th className="p-3">Mata Kuliah</th>
                        <th className="p-3 text-center">Pertemuan Ke</th>
                        <th className="p-3">Tanggal</th>
                        <th className="p-3 font-mono">Kode QR Kehadiran</th>
                        <th className="p-3 text-center">Status Sesi</th>
                        <th className="p-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {absPertemuan.length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-6 text-center text-slate-400">
                            Belum ada pertemuan dibuka untuk kelas Anda.
                          </td>
                        </tr>
                      )}

                      {absPertemuan.map((ap) => {
                        const jdw = jadwalList.find((j) => j.id === ap.jadwalId);
                        const mk = jdw ? mkList.find((m) => m.id === jdw.matakuliahId) : null;
                        const kls = jdw ? kelasList.find((c) => c.id === jdw.kelasId) : null;

                        return (
                          <tr key={ap.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                            <td className="p-3 font-semibold">
                              {mk?.nama} <span className="text-[10px] text-slate-400 block">Kelas {kls?.nama}</span>
                            </td>
                            <td className="p-3 text-center font-bold">Pertemuan {ap.pertemuanKe}</td>
                            <td className="p-3">{ap.tanggal}</td>
                            <td className="p-3 font-mono font-bold text-red-800 select-all">{ap.kodeQr}</td>
                            <td className="p-3 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                ap.status === 'Buka' ? 'bg-red-50 text-red-900 animate-pulse' : 'bg-rose-50 text-rose-700'
                              }`}>{ap.status}</span>
                            </td>
                            <td className="p-3 text-right">
                              {ap.status === 'Buka' && (
                                <button
                                  onClick={() => handleTutupAbsensi(ap.id)}
                                  className="px-2 py-1 rounded bg-rose-600 text-white font-bold text-[10px] hover:bg-rose-700"
                                >
                                  Tutup Sesi
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Mahasiswa View: Scan QR Code (Type in QR Code) */}
          {currentRole === 'Mahasiswa' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Scan interface */}
              <div className="lg:col-span-1 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <QrCode className="w-4.5 h-4.5 text-red-700" />
                  Presensi QR Code Perkuliahan
                </h3>

                <p className="text-xs text-slate-500 leading-normal">
                  Masukkan / pindai Kode QR Presensi yang ditampilkan oleh dosen pengampu di depan kelas untuk melakukan check-in instan.
                </p>

                <form onSubmit={handleScanPresensi} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">Masukkan Kode QR Kehadiran</label>
                    <input
                      id="qr-presensi-input"
                      type="text"
                      placeholder="e.g. QR-PRESENSI-JDW01-P2-..."
                      value={scannedQrCodeInput}
                      onChange={(e) => setScannedQrCodeInput(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 focus:outline-red-500"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-red-800 text-white font-bold text-xs hover:bg-red-900 shadow-sm"
                  >
                    Kirim Kehadiran (Hadir)
                  </button>
                </form>
              </div>

              {/* My attendance history logs */}
              <div className="lg:col-span-2 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3">
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                  Riwayat Absensi / Presensi Saya Semester Ini
                </h3>

                <div className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 font-bold text-slate-500">
                      <tr>
                        <th className="p-3">Mata Kuliah</th>
                        <th className="p-3 text-center">Pertemuan Ke</th>
                        <th className="p-3">Tanggal Kuliah</th>
                        <th className="p-3">Waktu Presensi Anda</th>
                        <th className="p-3 text-center">Status Kehadiran</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {absMhs.filter((am) => am.mahasiswaNim === currentUser.username).length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-6 text-center text-slate-400">
                            Belum ada riwayat check-in tercatat.
                          </td>
                        </tr>
                      )}

                      {absMhs
                        .filter((am) => am.mahasiswaNim === currentUser.username)
                        .map((am) => {
                          const pert = absPertemuan.find((p) => p.id === am.pertemuanId);
                          const jdw = pert ? jadwalList.find((j) => j.id === pert.jadwalId) : null;
                          const mk = jdw ? mkList.find((m) => m.id === jdw.matakuliahId) : null;

                          return (
                            <tr key={am.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                              <td className="p-3 font-bold">{mk?.nama || 'Mata Kuliah'}</td>
                              <td className="p-3 text-center font-semibold">Ke-{pert?.pertemuanKe}</td>
                              <td className="p-3">{pert?.tanggal}</td>
                              <td className="p-3 font-semibold text-slate-600">{new Date(am.waktuPresensi).toLocaleTimeString()}</td>
                              <td className="p-3 text-center">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-900">
                                  {am.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW SECTION 5: KALENDER AKADEMIK */}
      {activeView === 'akademik-kalender' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Kalender Akademik Universitas</h2>
              <p className="text-xs text-slate-400">Jadwal kegiatan akademik, UTS, UAS, registrasi, dan wisuda.</p>
            </div>
            {currentRole === 'Administrator' && (
              <button
                onClick={() => setCalModalOpen(true)}
                className="text-xs px-3 py-1.5 rounded-lg bg-red-800 text-white font-bold hover:bg-red-900"
              >
                Tambah Agenda
              </button>
            )}
          </div>

          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <div className="space-y-4">
              {calList.map((cal) => (
                <div key={cal.id} className="flex gap-4 p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-red-100 dark:bg-red-950/40 text-red-800 dark:text-red-600">
                      <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">{cal.event}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {cal.tanggalMulai} s.d. {cal.tanggalSelesai}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                    cal.kategori === 'UTS' || cal.kategori === 'UAS' ? 'bg-orange-50 text-orange-700' : 'bg-red-50 text-red-900'
                  }`}>{cal.kategori}</span>
                </div>
              ))}
            </div>
          </div>

          <Modal isOpen={calModalOpen} onClose={() => setCalModalOpen(false)} title="Tambah Agenda Akademik Baru">
            <form onSubmit={handleAddCalendar} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Nama Event / Agenda</label>
                <input
                  type="text"
                  value={calForm.event || ''}
                  onChange={(e) => setCalForm({ ...calForm, event: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-lg border focus:outline-red-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">Tanggal Mulai</label>
                  <input
                    type="date"
                    value={calForm.tanggalMulai || ''}
                    onChange={(e) => setCalForm({ ...calForm, tanggalMulai: e.target.value })}
                    className="w-full text-xs p-2.5 border rounded-lg focus:outline-red-500"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">Tanggal Selesai</label>
                  <input
                    type="date"
                    value={calForm.tanggalSelesai || ''}
                    onChange={(e) => setCalForm({ ...calForm, tanggalSelesai: e.target.value })}
                    className="w-full text-xs p-2.5 border rounded-lg focus:outline-red-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Kategori Event</label>
                <select
                  value={calForm.kategori || 'UTS'}
                  onChange={(e) => setCalForm({ ...calForm, kategori: e.target.value as any })}
                  className="w-full text-xs p-2.5 border rounded-lg"
                >
                  <option value="UTS">UTS</option>
                  <option value="UAS">UAS</option>
                  <option value="Libur">Libur</option>
                  <option value="Wisuda">Wisuda</option>
                  <option value="Registrasi">Registrasi</option>
                  <option value="KRS">KRS</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCalModalOpen(false)}
                  className="px-4 py-2 border rounded-lg text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-800 text-white rounded-lg text-xs font-semibold"
                >
                  Tambah Agenda
                </button>
              </div>
            </form>
          </Modal>
        </div>
      )}

      {/* VIEW SECTION 6: CHAT AKADEMIK */}
      {activeView === 'akademik-chat' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Pesan & Chat Akademik</h2>
            <p className="text-xs text-slate-400">Hubungi dosen wali atau mahasiswa secara langsung untuk konsultasi akademik.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-sm h-[500px]">
            {/* Left sidebar: Recipient contacts list */}
            <div className="md:col-span-1 border-r border-slate-100 dark:border-slate-800 p-4 space-y-4">
              <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">Kontak Tersedia</h3>

              <div className="space-y-2 overflow-y-auto h-[400px]">
                {currentRole === 'Mahasiswa'
                  ? dosenList.map((d) => (
                      <button
                        key={d.nidn}
                        onClick={() => setSelectedRecipient(d.nidn)}
                        className={`w-full text-left p-3 rounded-xl border flex items-center gap-3 transition-colors ${
                          selectedRecipient === d.nidn
                            ? 'bg-red-50 border-red-300 dark:bg-red-950/40 dark:border-red-800'
                            : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full bg-red-800 text-white font-bold flex items-center justify-center text-xs">
                          {d.nama.charAt(0)}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-100">{d.nama}</p>
                          <p className="text-[10px] text-slate-400">Dosen Wali / NIDN: {d.nidn}</p>
                        </div>
                      </button>
                    ))
                  : mhsList.map((m) => (
                      <button
                        key={m.nim}
                        onClick={() => setSelectedRecipient(m.nim)}
                        className={`w-full text-left p-3 rounded-xl border flex items-center gap-3 transition-colors ${
                          selectedRecipient === m.nim
                            ? 'bg-red-50 border-red-300 dark:bg-red-950/40 dark:border-red-800'
                            : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full bg-sky-600 text-white font-bold flex items-center justify-center text-xs">
                          {m.nama.charAt(0)}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-100">{m.nama}</p>
                          <p className="text-[10px] text-slate-400">Mahasiswa / NIM: {m.nim}</p>
                        </div>
                      </button>
                    ))}
              </div>
            </div>

            {/* Right: Messages box */}
            <div className="md:col-span-2 flex flex-col justify-between h-full bg-slate-50/50 dark:bg-slate-900/10">
              {selectedRecipient ? (
                <>
                  {/* Messages header */}
                  <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2">
                    <MessageSquare className="w-4.5 h-4.5 text-red-700" />
                    <span className="text-xs font-bold text-slate-800 dark:text-white">
                      Chat: {selectedRecipient}
                    </span>
                  </div>

                  {/* Messages flow */}
                  <div className="flex-1 p-4 space-y-3.5 overflow-y-auto max-h-[360px]">
                    {chats.map((c) => {
                      const isMe = c.pengirimId === currentUser.username;
                      return (
                        <div key={c.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[70%] p-3 rounded-2xl text-xs ${
                            isMe ? 'bg-red-800 text-white rounded-br-none' : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-none border border-slate-100 dark:border-slate-800'
                          }`}>
                            <p className="leading-relaxed">{c.pesan}</p>
                            <span className="text-[9px] text-slate-400 dark:text-slate-400 text-right block mt-1">
                              {new Date(c.waktu).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Input form */}
                  <form onSubmit={handleSendChat} className="p-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-2">
                    <input
                      type="text"
                      placeholder="Tulis pesan akademik..."
                      value={newChatMsg}
                      onChange={(e) => setNewChatMsg(e.target.value)}
                      className="flex-1 text-xs p-2.5 rounded-lg border focus:outline-red-500"
                      required
                    />
                    <button
                      type="submit"
                      className="p-2.5 rounded-lg bg-red-800 text-white hover:bg-red-900"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-2">
                  <MessageSquare className="w-12 h-12" />
                  <p className="text-xs font-semibold">Pilih kontak disamping untuk memulai percakapan.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW SECTION 7: SURAT AKADEMIK */}
      {activeView === 'akademik-surat' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Pelayanan Surat Akademik</h2>
              <p className="text-xs text-slate-400">Pengajuan surat keterangan mahasiswa aktif, cuti, beasiswa, dan bebas administrasi.</p>
            </div>
            {currentRole === 'Mahasiswa' && (
              <button
                onClick={() => setSuratModalOpen(true)}
                className="text-xs px-3 py-1.5 rounded-lg bg-red-800 text-white font-bold hover:bg-red-900 shadow-sm"
              >
                Ajukan Surat Baru
              </button>
            )}
          </div>

          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-4">
              Status & Daftar Pengajuan Surat Dokumen
            </h3>

            <div className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-800/50 font-bold text-slate-500">
                  <tr>
                    <th className="p-3">Nama Mahasiswa</th>
                    <th className="p-3">Jenis Dokumen Surat</th>
                    <th className="p-3">Keterangan / Keperluan</th>
                    <th className="p-3 text-center">Tgl Pengajuan</th>
                    <th className="p-3 text-center">Status</th>
                    {currentRole === 'Administrator' && <th className="p-3 text-right">Aksi Proses</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {suratList.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-400">
                        Belum ada dokumen surat yang diajukan.
                      </td>
                    </tr>
                  )}

                  {suratList
                    .filter((s) => currentRole === 'Administrator' || s.mahasiswaNim === currentUser.username)
                    .map((s) => {
                      const mhs = mhsList.find((m) => m.nim === s.mahasiswaNim);
                      return (
                        <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                          <td className="p-3">
                            <span className="font-bold block">{mhs?.nama || s.mahasiswaNim}</span>
                            <span className="text-[9px] text-slate-400 font-mono">NIM: {s.mahasiswaNim}</span>
                          </td>
                          <td className="p-3 font-bold text-red-800 dark:text-red-600">{s.tipe}</td>
                          <td className="p-3">{s.keterangan}</td>
                          <td className="p-3 text-center">{s.tanggalPengajuan}</td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              s.status === 'Selesai'
                                ? 'bg-red-50 text-red-900'
                                : s.status === 'Diproses'
                                ? 'bg-amber-50 text-amber-700 animate-pulse'
                                : 'bg-slate-100 text-slate-700'
                            }`}>{s.status}</span>
                          </td>
                          {currentRole === 'Administrator' && (
                            <td className="p-3 text-right">
                              {s.status === 'Menunggu' && (
                                <button
                                  onClick={() => handleProcessSurat(s.id, 'Diproses')}
                                  className="px-2 py-1 rounded bg-amber-500 text-white font-bold text-[10px] hover:bg-amber-600"
                                >
                                  Proses
                                </button>
                              )}
                              {s.status === 'Diproses' && (
                                <button
                                  onClick={() => handleProcessSurat(s.id, 'Selesai')}
                                  className="px-2 py-1 rounded bg-red-800 text-white font-bold text-[10px] hover:bg-red-900"
                                >
                                  Selesai & Unduh
                                </button>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Apply form */}
          <Modal isOpen={suratModalOpen} onClose={() => setSuratModalOpen(false)} title="Ajukan Dokumen Surat Baru">
            <form onSubmit={handleApplySurat} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Pilih Tipe Surat Akademik</label>
                <select
                  value={suratForm.tipe}
                  onChange={(e) => setSuratForm({ ...suratForm, tipe: e.target.value as any })}
                  className="w-full text-xs p-2.5 border rounded-lg"
                >
                  <option value="Surat Aktif Kuliah">Surat Aktif Kuliah</option>
                  <option value="Surat Keterangan Mahasiswa">Surat Keterangan Mahasiswa</option>
                  <option value="Surat Cuti">Surat Cuti Akademik</option>
                  <option value="Surat Bebas Administrasi">Surat Bebas Administrasi Perpustakaan/BAAK</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Keterangan / Tujuan Pengajuan Surat</label>
                <textarea
                  value={suratForm.keterangan}
                  onChange={(e) => setSuratForm({ ...suratForm, keterangan: e.target.value })}
                  placeholder="e.g. Melengkapi syarat beasiswa eksternal, dll..."
                  rows={3}
                  className="w-full text-xs p-2.5 border rounded-lg focus:outline-red-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSuratModalOpen(false)}
                  className="px-4 py-2 border rounded-lg text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-800 text-white rounded-lg text-xs font-semibold"
                >
                  Kirim Permohonan
                </button>
              </div>
            </form>
          </Modal>
        </div>
      )}

      {/* VIEW SECTION 8: EVALUASI DOSEN (KUISIONER) */}
      {activeView === 'akademik-evaluasi' && currentRole === 'Mahasiswa' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Evaluasi Dosen & Penilaian Kinerja</h2>
            <p className="text-xs text-slate-400">Pengisian penilaian dosen pengampu semester ini secara anonim untuk penjaminan mutu.</p>
          </div>

          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
            <form onSubmit={handleApplyEvaluasi} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Pilih Dosen Pengajar</label>
                <select
                  value={selectedEvalDosen}
                  onChange={(e) => setSelectedEvalDosen(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border"
                  required
                >
                  <option value="">-- Pilih Dosen Pengampu --</option>
                  {dosenList.map((d) => (
                    <option key={d.nidn} value={d.nidn}>{d.nama}, {d.gelar}</option>
                  ))}
                </select>
              </div>

              {/* Pillars rating UI */}
              <div className="space-y-3.5 border-t border-slate-100 dark:border-slate-800 pt-3">
                <p className="font-bold text-slate-700 dark:text-slate-300">Pilar Kompetensi Mengajar (Beri Rating Bintang 1 - 5):</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Pillar 1 */}
                  <div className="space-y-1 p-3 rounded-lg border">
                    <span className="font-bold">1. Kompetensi Pedagogik</span>
                    <p className="text-[10px] text-slate-400">Kemampuan menyampaikan materi dan interaksi kelas.</p>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={evalSkor.pedagogik}
                      onChange={(e) => setEvalSkor({ ...evalSkor, pedagogik: parseInt(e.target.value) })}
                      className="w-full accent-red-600 mt-2"
                    />
                    <div className="flex justify-between text-[10px] font-bold text-red-800">
                      <span>Kurang</span>
                      <span>Sangat Baik ({evalSkor.pedagogik})</span>
                    </div>
                  </div>

                  {/* Pillar 2 */}
                  <div className="space-y-1 p-3 rounded-lg border">
                    <span className="font-bold">2. Kompetensi Profesional</span>
                    <p className="text-[10px] text-slate-400">Penguasaan materi perkuliahan secara luas.</p>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={evalSkor.profesional}
                      onChange={(e) => setEvalSkor({ ...evalSkor, profesional: parseInt(e.target.value) })}
                      className="w-full accent-red-600 mt-2"
                    />
                    <div className="flex justify-between text-[10px] font-bold text-red-800">
                      <span>Kurang</span>
                      <span>Sangat Baik ({evalSkor.profesional})</span>
                    </div>
                  </div>

                  {/* Pillar 3 */}
                  <div className="space-y-1 p-3 rounded-lg border">
                    <span className="font-bold">3. Kompetensi Sosial</span>
                    <p className="text-[10px] text-slate-400">Sikap ramah, etika, dan komunikasi dengan mahasiswa.</p>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={evalSkor.sosial}
                      onChange={(e) => setEvalSkor({ ...evalSkor, sosial: parseInt(e.target.value) })}
                      className="w-full accent-red-600 mt-2"
                    />
                    <div className="flex justify-between text-[10px] font-bold text-red-800">
                      <span>Kurang</span>
                      <span>Sangat Baik ({evalSkor.sosial})</span>
                    </div>
                  </div>

                  {/* Pillar 4 */}
                  <div className="space-y-1 p-3 rounded-lg border">
                    <span className="font-bold">4. Kedisiplinan & Integritas</span>
                    <p className="text-[10px] text-slate-400">Ketepatan waktu mengajar sesuai jadwal kuliah.</p>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={evalSkor.kompetensi}
                      onChange={(e) => setEvalSkor({ ...evalSkor, kompetensi: parseInt(e.target.value) })}
                      className="w-full accent-red-600 mt-2"
                    />
                    <div className="flex justify-between text-[10px] font-bold text-red-800">
                      <span>Kurang</span>
                      <span>Sangat Baik ({evalSkor.kompetensi})</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Ulasan / Kritik & Saran Konstruktif</label>
                <textarea
                  value={evalKomentar}
                  onChange={(e) => setEvalKomentar(e.target.value)}
                  placeholder="Ulasan Anda sangat berharga dan bersifat rahasia (anonim)..."
                  rows={3}
                  className="w-full text-xs p-2.5 border rounded-lg focus:outline-red-500"
                  required
                />
              </div>

              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-red-800 text-white font-bold text-xs hover:bg-red-900 shadow-sm"
              >
                Kirim Evaluasi Mutu
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

