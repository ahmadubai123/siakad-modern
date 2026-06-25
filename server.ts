/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import dotenv from 'dotenv';
import express from 'express';
import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import { createServer as createViteServer } from 'vite';
import {
  Mahasiswa,
  Dosen,
  Fakultas,
  ProgramStudi,
  TahunAkademik,
  MataKuliah,
  Kelas,
  Jadwal,
  KRS,
  Nilai,
  AbsensiPertemuan,
  AbsensiMahasiswa,
  KalenderAkademik,
  Chat,
  SuratAkademik,
  EvaluasiDosen,
  AuditLog,
  User,
} from './src/types.js';

dotenv.config();

interface DatabaseSchema {
  mahasiswa: Mahasiswa[];
  dosen: Dosen[];
  fakultas: Fakultas[];
  prodi: ProgramStudi[];
  tahunAkademik: TahunAkademik[];
  matakuliah: MataKuliah[];
  kelas: Kelas[];
  jadwal: Jadwal[];
  krs: KRS[];
  nilai: Nilai[];
  absensiPertemuan: AbsensiPertemuan[];
  absensiMahasiswa: AbsensiMahasiswa[];
  kalender: KalenderAkademik[];
  chat: Chat[];
  surat: SuratAkademik[];
  evaluasi: EvaluasiDosen[];
  auditLog: AuditLog[];
  users: User[];
}

const useMysql = !!process.env.DB_HOST && !!process.env.DB_USER && !!process.env.DB_DATABASE;
const mysqlPool = useMysql
  ? mysql.createPool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    })
  : null;

const sqlRouteMap: Record<string, { table: string; keyField: string }> = {
  mahasiswa: { table: 'mahasiswa', keyField: 'nim' },
  dosen: { table: 'dosen', keyField: 'nidn' },
  fakultas: { table: 'fakultas', keyField: 'id' },
  prodi: { table: 'prodi', keyField: 'id' },
  matakuliah: { table: 'matakuliah', keyField: 'id' },
  kelas: { table: 'kelas', keyField: 'id' },
  jadwal: { table: 'jadwal_kuliah', keyField: 'id' },
  users: { table: 'users', keyField: 'id' },
};

const toCamelCase = (str: string) => str.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
const toSnakeCase = (str: string) => str.replace(/([A-Z])/g, (_, c) => '_' + c.toLowerCase());
const cleanObject = (obj: any) =>
  Object.fromEntries(Object.entries(obj).filter(([, value]) => value !== undefined));

const snakeRowToJs = (row: any) =>
  Object.fromEntries(
    Object.entries(row).map(([key, value]) => [toCamelCase(key), value])
  );

const jsRowToSnake = (item: any) =>
  Object.fromEntries(
    Object.entries(cleanObject(item)).map(([key, value]) => [toSnakeCase(key), value])
  );

const querySql = async <T = any>(sql: string, params: any[] = []) => {
  if (!mysqlPool) throw new Error('MySQL is not configured');
  const [rows] = await mysqlPool.query(sql, params);
  return rows as T[];
};

const insertSqlRow = async (table: string, row: any) => {
  const keys = Object.keys(row);
  const values = Object.values(row);
  const placeholders = keys.map(() => '?').join(', ');
  const columns = keys.map((k) => `\`${k}\``).join(', ');
  await querySql(`INSERT INTO \`${table}\` (${columns}) VALUES (${placeholders})`, values);
};

const updateSqlRow = async (table: string, row: any, keyField: string, keyValue: any) => {
  const keys = Object.keys(row);
  const values = Object.values(row);
  const setClause = keys.map((k) => `\`${k}\` = ?`).join(', ');
  await querySql(`UPDATE \`${table}\` SET ${setClause} WHERE \`${keyField}\` = ?`, [...values, keyValue]);
};

const queryRouteSql = async (route: string) => {
  const info = sqlRouteMap[route];
  if (!info) return null;
  const rows = await querySql<any[]>(`SELECT * FROM \`${info.table}\``);
  return rows.map(snakeRowToJs);
};

const isSqlRoute = (route: string) => useMysql && Boolean(sqlRouteMap[route]);

const sqlRouteInfo = (route: string) => sqlRouteMap[route];

const DB_FILE = path.join(process.cwd(), 'data.json');
const BACKUPS_DIR = path.join(process.cwd(), 'backups');

if (!fs.existsSync(BACKUPS_DIR)) {
  fs.mkdirSync(BACKUPS_DIR, { recursive: true });
}

// Helper to write database
function saveDb(data: DatabaseSchema) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// Helper to load database with rich initial seed data
function loadDb(): DatabaseSchema {
  if (fs.existsSync(DB_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    } catch (e) {
      console.error('Error reading db, resetting', e);
    }
  }

  // Generate complete seed database
  const initialDb: DatabaseSchema = {
    mahasiswa: [
      {
        nim: '220101001',
        nama: 'Ahmad Fauzi',
        jenisKelamin: 'Laki-laki',
        tempatLahir: 'Jakarta',
        tanggalLahir: '2003-05-15',
        email: 'ahmad.fauzi@siakad.ac.id',
        noHp: '081234567890',
        alamat: 'Jl. Merdeka No. 10, Jakarta Pusat',
        foto: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
        semester: 4,
        prodiId: 'prd-01',
        status: 'Aktif',
      },
      {
        nim: '220101002',
        nama: 'Siti Aminah',
        jenisKelamin: 'Perempuan',
        tempatLahir: 'Bandung',
        tanggalLahir: '2004-02-20',
        email: 'siti.aminah@siakad.ac.id',
        noHp: '082345678901',
        alamat: 'Jl. Dago No. 45, Bandung',
        foto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
        semester: 4,
        prodiId: 'prd-02',
        status: 'Aktif',
      },
      {
        nim: '220102001',
        nama: 'Rian Hidayat',
        jenisKelamin: 'Laki-laki',
        tempatLahir: 'Surabaya',
        tanggalLahir: '2003-11-12',
        email: 'rian.hidayat@siakad.ac.id',
        noHp: '083456789012',
        alamat: 'Jl. Pemuda No. 12, Surabaya',
        foto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        semester: 4,
        prodiId: 'prd-03',
        status: 'Aktif',
      },
    ],
    dosen: [
      {
        nidn: '0411027501',
        nama: 'Dr. Budi Santoso',
        email: 'budi.santoso@siakad.ac.id',
        gelar: 'M.T., Ph.D.',
        noHp: '081122334455',
        alamat: 'Komp. Dosen UI No. 8, Depok',
        foto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
        status: 'Aktif',
      },
      {
        nidn: '0422058002',
        nama: 'Prof. Sri Wahyuni',
        email: 'sri.wahyuni@siakad.ac.id',
        gelar: 'M.Si., Dr.Eng.',
        noHp: '082233445566',
        alamat: 'Jl. Cendrawasih No. 14, Bogor',
        foto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
        status: 'Aktif',
      },
    ],
    fakultas: [
      {
        id: 'fak-01',
        kode: 'FIK',
        nama: 'Fakultas Ilmu Komputer',
        dekan: 'Prof. Dr. Ir. Hermawan M.T.',
      },
      {
        id: 'fak-02',
        kode: 'FT',
        nama: 'Fakultas Teknik',
        dekan: 'Dr. Ir. Wahyu Prasetyo M.Eng.',
      },
    ],
    prodi: [
      {
        id: 'prd-01',
        kode: 'TIF',
        nama: 'Teknik Informatika',
        fakultasId: 'fak-01',
      },
      {
        id: 'prd-02',
        kode: 'SI',
        nama: 'Sistem Informasi',
        fakultasId: 'fak-01',
      },
      {
        id: 'prd-03',
        kode: 'TSP',
        nama: 'Teknik Sipil',
        fakultasId: 'fak-02',
      },
    ],
    tahunAkademik: [
      {
        id: 'ta-2026',
        tahun: '2026/2027',
        semesterTipe: 'Ganjil',
        status: 'Aktif',
      },
    ],
    matakuliah: [
      {
        id: 'mk-01',
        kode: 'TIF-201',
        nama: 'Pemrograman Web',
        sks: 3,
        semester: 4,
        prodiId: 'prd-01',
      },
      {
        id: 'mk-02',
        kode: 'TIF-202',
        nama: 'Kecerdasan Buatan',
        sks: 4,
        semester: 4,
        prodiId: 'prd-01',
      },
      {
        id: 'mk-03',
        kode: 'SI-201',
        nama: 'Basis Data',
        sks: 3,
        semester: 4,
        prodiId: 'prd-02',
      },
      {
        id: 'mk-04',
        kode: 'SI-202',
        nama: 'Analisis Sistem',
        sks: 3,
        semester: 4,
        prodiId: 'prd-02',
      },
      {
        id: 'mk-05',
        kode: 'TSP-201',
        nama: 'Mekanika Tanah',
        sks: 3,
        semester: 4,
        prodiId: 'prd-03',
      },
    ],
    kelas: [
      {
        id: 'kls-01',
        nama: 'TIF-4A',
        semester: 4,
        dosenNidn: '0411027501',
        kapasitas: 40,
      },
      {
        id: 'kls-02',
        nama: 'SI-4A',
        semester: 4,
        dosenNidn: '0422058002',
        kapasitas: 35,
      },
      {
        id: 'kls-03',
        nama: 'TSP-4A',
        semester: 4,
        dosenNidn: '0411027501',
        kapasitas: 30,
      },
    ],
    jadwal: [
      {
        id: 'jdw-01',
        matakuliahId: 'mk-01',
        hari: 'Senin',
        jamMulai: '08:00',
        jamSelesai: '10:30',
        ruang: 'Lab Komputer 1',
        dosenNidn: '0411027501',
        kelasId: 'kls-01',
      },
      {
        id: 'jdw-02',
        matakuliahId: 'mk-02',
        hari: 'Rabu',
        jamMulai: '10:00',
        jamSelesai: '13:20',
        ruang: 'Lab Riset AI',
        dosenNidn: '0411027501',
        kelasId: 'kls-01',
      },
      {
        id: 'jdw-03',
        matakuliahId: 'mk-03',
        hari: 'Selasa',
        jamMulai: '10:00',
        jamSelesai: '12:30',
        ruang: 'Lab Komputer 2',
        dosenNidn: '0422058002',
        kelasId: 'kls-02',
      },
      {
        id: 'jdw-04',
        matakuliahId: 'mk-04',
        hari: 'Kamis',
        jamMulai: '08:00',
        jamSelesai: '10:30',
        ruang: 'Ruang Kelas 201',
        dosenNidn: '0422058002',
        kelasId: 'kls-02',
      },
      {
        id: 'jdw-05',
        matakuliahId: 'mk-05',
        hari: 'Jumat',
        jamMulai: '09:00',
        jamSelesai: '11:30',
        ruang: 'Ruang Kelas 302',
        dosenNidn: '0411027501',
        kelasId: 'kls-03',
      },
    ],
    krs: [
      {
        id: 'krs-01',
        mahasiswaNim: '220101001',
        jadwalId: 'jdw-01',
        tahunAkademikId: 'ta-2026',
        status: 'Disetujui',
        tanggalPengajuan: '2026-06-20',
      },
      {
        id: 'krs-02',
        mahasiswaNim: '220101001',
        jadwalId: 'jdw-02',
        tahunAkademikId: 'ta-2026',
        status: 'Disetujui',
        tanggalPengajuan: '2026-06-20',
      },
      {
        id: 'krs-03',
        mahasiswaNim: '220101002',
        jadwalId: 'jdw-03',
        tahunAkademikId: 'ta-2026',
        status: 'Disetujui',
        tanggalPengajuan: '2026-06-21',
      },
      {
        id: 'krs-04',
        mahasiswaNim: '220101002',
        jadwalId: 'jdw-04',
        tahunAkademikId: 'ta-2026',
        status: 'Menunggu Persetujuan',
        tanggalPengajuan: '2026-06-21',
      },
    ],
    nilai: [
      {
        id: 'nil-01',
        mahasiswaNim: '220101001',
        jadwalId: 'jdw-01',
        tugas: 85,
        quiz: 80,
        uts: 75,
        uas: 88,
        nilaiAkhir: 82.7,
        grade: 'AB',
        bobot: 3.5,
      },
      {
        id: 'nil-02',
        mahasiswaNim: '220101001',
        jadwalId: 'jdw-02',
        tugas: 90,
        quiz: 85,
        uts: 88,
        uas: 92,
        nilaiAkhir: 90.1,
        grade: 'A',
        bobot: 4.0,
      },
      {
        id: 'nil-03',
        mahasiswaNim: '220101002',
        jadwalId: 'jdw-03',
        tugas: 75,
        quiz: 70,
        uts: 78,
        uas: 80,
        nilaiAkhir: 77.4,
        grade: 'AB',
        bobot: 3.5,
      },
    ],
    absensiPertemuan: [
      {
        id: 'abs-p-01',
        jadwalId: 'jdw-01',
        pertemuanKe: 1,
        tanggal: '2026-06-15',
        kodeQr: 'QR-PRESENSI-JDW01-P1',
        status: 'Tutup',
      },
      {
        id: 'abs-p-02',
        jadwalId: 'jdw-01',
        pertemuanKe: 2,
        tanggal: '2026-06-22',
        kodeQr: 'QR-PRESENSI-JDW01-P2',
        status: 'Buka',
      },
    ],
    absensiMahasiswa: [
      {
        id: 'abs-m-01',
        pertemuanId: 'abs-p-01',
        mahasiswaNim: '220101001',
        waktuPresensi: '2026-06-15T08:05:12',
        status: 'Hadir',
      },
    ],
    kalender: [
      {
        id: 'cal-01',
        event: 'Registrasi Ulang & Pengisian KRS Ganjil',
        tanggalMulai: '2026-07-01',
        tanggalSelesai: '2026-07-15',
        kategori: 'Registrasi',
      },
      {
        id: 'cal-02',
        event: 'Awal Perkuliahan Semester Ganjil',
        tanggalMulai: '2026-08-01',
        tanggalSelesai: '2026-08-05',
        kategori: 'KRS',
      },
      {
        id: 'cal-03',
        event: 'Ujian Tengah Semester (UTS)',
        tanggalMulai: '2026-10-05',
        tanggalSelesai: '2026-10-16',
        kategori: 'UTS',
      },
      {
        id: 'cal-04',
        event: 'Ujian Akhir Semester (UAS)',
        tanggalMulai: '2026-12-07',
        tanggalSelesai: '2026-12-18',
        kategori: 'UAS',
      },
    ],
    chat: [
      {
        id: 'cht-01',
        pengirimId: '220101001',
        penerimaId: '0411027501',
        pesan: 'Permisi Pak Budi, untuk materi Pemrograman Web pertemuan 2 ada di mana ya?',
        waktu: '2026-06-24T14:30:00',
        baca: true,
      },
      {
        id: 'cht-02',
        pengirimId: '0411027501',
        penerimaId: '220101001',
        pesan: 'Halo Ahmad. Materi sudah saya unggah di Google Drive kelas kita ya.',
        waktu: '2026-06-24T14:45:00',
        baca: false,
      },
    ],
    surat: [
      {
        id: 'srt-01',
        mahasiswaNim: '220101001',
        tipe: 'Surat Aktif Kuliah',
        keterangan: 'Keperluan mengurus tunjangan gaji orang tua.',
        status: 'Selesai',
        tanggalPengajuan: '2026-06-18',
      },
      {
        id: 'srt-02',
        mahasiswaNim: '220101002',
        tipe: 'Surat Keterangan Mahasiswa',
        keterangan: 'Untuk mendaftar beasiswa eksternal.',
        status: 'Diproses',
        tanggalPengajuan: '2026-06-23',
      },
    ],
    evaluasi: [
      {
        id: 'ev-01',
        mahasiswaNim: '220101001',
        dosenNidn: '0411027501',
        kelasId: 'kls-01',
        skorKompetensi: 5,
        skorPedagogik: 4,
        skorProfesional: 5,
        skorSosial: 4,
        komentar: 'Sangat bagus cara mengajarnya Pak Budi, materi mudah dipahami.',
        tahunAkademikId: 'ta-2026',
      },
    ],
    auditLog: [
      {
        id: 'log-01',
        userId: 'admin',
        username: 'Administrator',
        role: 'Administrator',
        aktivitas: 'Login',
        deskripsi: 'Berhasil masuk ke dalam sistem.',
        ip: '127.0.0.1',
        waktu: '2026-06-24T20:30:00',
      },
    ],
    users: [
      {
        id: 'usr-admin',
        username: 'admin',
        email: 'admin@siakad.ac.id',
        role: 'Administrator',
        status: 'Aktif',
      },
      {
        id: 'usr-dosen1',
        username: '0411027501',
        email: 'budi.santoso@siakad.ac.id',
        role: 'Dosen',
        referenceId: '0411027501',
        status: 'Aktif',
      },
      {
        id: 'usr-dosen2',
        username: '0422058002',
        email: 'sri.wahyuni@siakad.ac.id',
        role: 'Dosen',
        referenceId: '0422058002',
        status: 'Aktif',
      },
      {
        id: 'usr-mhs1',
        username: '220101001',
        email: 'ahmad.fauzi@siakad.ac.id',
        role: 'Mahasiswa',
        referenceId: '220101001',
        status: 'Aktif',
      },
      {
        id: 'usr-mhs2',
        username: '220101002',
        email: 'siti.aminah@siakad.ac.id',
        role: 'Mahasiswa',
        referenceId: '220101002',
        status: 'Aktif',
      },
      {
        id: 'usr-mhs3',
        username: '220102001',
        email: 'rian.hidayat@siakad.ac.id',
        role: 'Mahasiswa',
        referenceId: '220102001',
        status: 'Aktif',
      },
    ],
  };

  saveDb(initialDb);
  return initialDb;
}

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));

// Middleware to log audits
function addAuditLog(
  userId: string,
  username: string,
  role: 'Administrator' | 'Dosen' | 'Mahasiswa',
  aktivitas: string,
  deskripsi: string,
  ip: string = '127.0.0.1'
) {
  const db = loadDb();
  const newLog: AuditLog = {
    id: 'log-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    userId,
    username,
    role,
    aktivitas,
    deskripsi,
    ip,
    waktu: new Date().toISOString(),
  };
  db.auditLog.unshift(newLog);
  // Cap at 1000 entries
  if (db.auditLog.length > 1000) {
    db.auditLog.pop();
  }
  saveDb(db);
}

// REST APIs
// 1. Auth Endpoint
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const db = loadDb();
  const user = db.users.find((u) => u.username === username);

  if (!user) {
    return res.status(401).json({ message: 'Username atau password salah!' });
  }

  if (user.password) {
    if (password !== user.password) {
      return res.status(401).json({ message: 'Password salah!' });
    }
  } else {
    // Easy fallback simulation for legacy accounts without saved passwords
    if (password !== username && password !== username + '123' && password !== 'admin' && password !== 'password') {
      return res.status(401).json({ message: 'Password salah!' });
    }
  }

  let displayName = user.username;
  if (user.role === 'Administrator') {
    displayName = 'Administrator';
  } else if (user.role === 'Dosen') {
    const d = db.dosen.find((ds) => ds.nidn === user.referenceId);
    displayName = d ? d.nama + ', ' + d.gelar : user.username;
  } else if (user.role === 'Mahasiswa') {
    const m = db.mahasiswa.find((ms) => ms.nim === user.referenceId);
    displayName = m ? m.nama : user.username;
  }

  addAuditLog(user.id, displayName, user.role, 'Login', `Berhasil login ke sistem sebagai ${user.role}`);

  res.json({
    token: 'token-' + Date.now(),
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      referenceId: user.referenceId,
      displayName,
    },
  });
});

app.post('/api/auth/logout', (req, res) => {
  const { user } = req.body;
  if (user) {
    addAuditLog(user.id, user.displayName || user.username, user.role, 'Logout', 'Berhasil keluar dari sistem');
  }
  res.json({ success: true });
});

// Reset Password
app.post('/api/auth/reset-password', async (req, res) => {
  const { userId, username, newPassword = 'password' } = req.body;
  const db = loadDb();
  const uIndex = db.users.findIndex((usr) => usr.id === userId || usr.username === username);
  if (uIndex !== -1) {
    const user = db.users[uIndex];
    user.password = newPassword;
    saveDb(db);

    if (useMysql) {
      try {
        await querySql('UPDATE `users` SET `password` = ? WHERE `id` = ? OR `username` = ?', [
          newPassword,
          user.id,
          user.username,
        ]);
      } catch (error) {
        console.error('MySQL reset-password error', error);
      }
    }

    addAuditLog(
      user.id,
      user.username,
      user.role,
      'Reset Password',
      `Melakukan reset password user: ${user.username}`
    );
    return res.json({ success: true, message: 'Password berhasil diperbarui!' });
  }

  res.status(404).json({ message: 'User tidak ditemukan' });
});

app.get('/api/auditlog', (req, res) => {
  const db = loadDb();
  res.json(db.auditLog);
});

// 2. Dashboard Analytics
app.get('/api/analytics', (req, res) => {
  const db = loadDb();

  // Cards
  const totalMahasiswa = db.mahasiswa.length;
  const totalDosen = db.dosen.length;
  const totalMataKuliah = db.matakuliah.length;
  const totalKelas = db.kelas.length;
  const totalProdi = db.prodi.length;
  const totalUser = db.users.length;

  // Mahasiswa per Prodi
  const mahasiswaPerProdi = db.prodi.map((p) => {
    const count = db.mahasiswa.filter((m) => m.prodiId === p.id).length;
    return { name: p.nama, value: count };
  });

  // Nilai Distribution (Grades distribution)
  const grades = ['A', 'AB', 'B', 'BC', 'C', 'D', 'E'] as const;
  const gradeDistribution = grades.map((g) => {
    const count = db.nilai.filter((n) => n.grade === g).length;
    return { name: g, value: count };
  });

  // Average IPK by Prodi
  const ipkPerProdi = db.prodi.map((p) => {
    const mhsInProdi = db.mahasiswa.filter((m) => m.prodiId === p.id);
    let totalIpk = 0;
    let counted = 0;

    mhsInProdi.forEach((m) => {
      const mhsNilai = db.nilai.filter((n) => n.mahasiswaNim === m.nim);
      if (mhsNilai.length > 0) {
        const sumBobotSks = mhsNilai.reduce((acc, curr) => acc + curr.bobot * 3, 0); // assume SKS average 3
        const sumSks = mhsNilai.length * 3;
        totalIpk += sumSks > 0 ? sumBobotSks / sumSks : 0;
        counted++;
      } else {
        // default IPK
        totalIpk += 3.2;
        counted++;
      }
    });

    return {
      name: p.nama,
      value: counted > 0 ? parseFloat((totalIpk / counted).toFixed(2)) : 0,
    };
  });

  // Attendance rate by Class
  const attendanceRate = db.kelas.map((k) => {
    const klsJadwal = db.jadwal.filter((j) => j.kelasId === k.id);
    let totalPresent = 0;
    let totalPossible = 0;

    klsJadwal.forEach((j) => {
      const pertemuans = db.absensiPertemuan.filter((ap) => ap.jadwalId === j.id);
      pertemuans.forEach((p) => {
        const absMhs = db.absensiMahasiswa.filter((am) => am.pertemuanId === p.id);
        totalPresent += absMhs.filter((am) => am.status === 'Hadir').length;
        totalPossible += db.mahasiswa.filter((m) => m.prodiId === db.matakuliah.find((mk) => mk.id === j.matakuliahId)?.prodiId).length;
      });
    });

    return {
      name: k.nama,
      rate: totalPossible > 0 ? Math.round((totalPresent / totalPossible) * 100) : 85, // Default 85 if no data
    };
  });

  // Course SKS Distribution
  const courseDistribution = db.matakuliah.map((mk) => ({
    name: mk.nama,
    sks: mk.sks,
  }));

  res.json({
    cards: {
      totalMahasiswa,
      totalDosen,
      totalMataKuliah,
      totalKelas,
      totalProdi,
      totalUser,
    },
    charts: {
      mahasiswaPerProdi,
      gradeDistribution,
      ipkPerProdi,
      attendanceRate,
      courseDistribution,
    },
    recentActivities: db.auditLog.slice(0, 10),
  });
});

// Generic CRUD endpoints creator helper
function makeCrud(route: string, field: keyof DatabaseSchema, singularName: string) {
  // GET List
  app.get(`/api/${route}`, async (req, res) => {
    if (isSqlRoute(route)) {
      try {
        const data = await queryRouteSql(route);
        if (data) return res.json(data);
      } catch (error) {
        console.error('MySQL GET error for', route, error);
      }
    }

    const db = loadDb();
    res.json(db[field]);
  });

  // POST Create
  app.post(`/api/${route}`, async (req, res) => {
    const item = { ...req.body };
    const password = item.password;
    if (password !== undefined) {
      delete item.password;
    }

    // If MySQL route, use MySQL only
    if (isSqlRoute(route)) {
      try {
        const info = sqlRouteInfo(route);
        const row = jsRowToSnake(item);
        await insertSqlRow(info.table, row);

        if (route === 'mahasiswa' && password) {
          await insertSqlRow('users', {
            username: item.nim,
            password,
            email: item.email,
            role: 'Mahasiswa',
            reference_id: item.nim,
          });
        } else if (route === 'dosen' && password) {
          await insertSqlRow('users', {
            username: item.nidn,
            password,
            email: item.email,
            role: 'Dosen',
            reference_id: item.nidn,
          });
        }

        addAuditLog(
          'sys',
          'System',
          'Administrator',
          `Tambah ${singularName}`,
          `Berhasil menambahkan ${singularName} baru: ${item.nama || item.kode || item.id || item.nim || item.nidn}`
        );

        return res.json({ success: true, item });
      } catch (error) {
        console.error('MySQL POST error for', route, error);
        return res.status(500).json({ message: `Gagal menyimpan ${singularName} ke database`, error: error.message });
      }
    }

    // For non-MySQL routes, use JSON database
    const db = loadDb();
    if (!item.id && !item.nim && !item.nidn) {
      item.id = route.substring(0, 3) + '-' + Date.now();
    }
    const list = db[field] as any[];
    list.push(item);

    // Auto-create user for Mahasiswa or Dosen if needed
    if (route === 'mahasiswa') {
      const newUser: User = {
        id: 'usr-mhs-' + item.nim,
        username: item.nim,
        email: item.email,
        role: 'Mahasiswa',
        referenceId: item.nim,
        status: 'Aktif',
      };
      if (password) {
        newUser.password = password;
      }
      db.users.push(newUser);
    } else if (route === 'dosen') {
      const newUser: User = {
        id: 'usr-dsn-' + item.nidn,
        username: item.nidn,
        email: item.email,
        role: 'Dosen',
        referenceId: item.nidn,
        status: 'Aktif',
      };
      db.users.push(newUser);
    }

    saveDb(db);

    addAuditLog(
      'sys',
      'System',
      'Administrator',
      `Tambah ${singularName}`,
      `Berhasil menambahkan ${singularName} baru: ${item.nama || item.kode || item.id || item.nim || item.nidn}`
    );

    res.json({ success: true, item });
  });

  // PUT Update
  app.put(`/api/${route}/:key`, async (req, res) => {
    const key = req.params.key;
    const updateData = { ...req.body };
    const password = updateData.password;
    if (password !== undefined) {
      delete updateData.password;
    }

    // If MySQL route, use MySQL only
    if (isSqlRoute(route)) {
      try {
        const info = sqlRouteInfo(route);
        const row = jsRowToSnake(updateData);
        await updateSqlRow(info.table, row, info.keyField, key);

        if (route === 'mahasiswa' && password) {
          await querySql('UPDATE `users` SET `password` = ? WHERE `reference_id` = ?', [password, key]);
        } else if (route === 'dosen' && password) {
          await querySql('UPDATE `users` SET `password` = ? WHERE `reference_id` = ?', [password, key]);
        }

        addAuditLog(
          'sys',
          'System',
          'Administrator',
          `Edit ${singularName}`,
          `Berhasil memperbarui ${singularName}: ${key}`
        );

        return res.json({ success: true, item: updateData });
      } catch (error) {
        console.error('MySQL PUT error for', route, error);
        return res.status(500).json({ message: `Gagal memperbarui ${singularName}`, error: error.message });
      }
    }

    // For non-MySQL routes, use JSON database
    const db = loadDb();
    const list = db[field] as any[];
    const index = list.findIndex((x) => x.id === key || x.nim === key || x.nidn === key);

    if (index !== -1) {
      list[index] = { ...list[index], ...updateData };

      if (route === 'mahasiswa' && password) {
        const user = db.users.find((u) => u.referenceId === key);
        if (user) user.password = password;
      } else if (route === 'dosen' && password) {
        const user = db.users.find((u) => u.referenceId === key);
        if (user) user.password = password;
      }

      saveDb(db);

      addAuditLog(
        'sys',
        'System',
        'Administrator',
        `Edit ${singularName}`,
        `Berhasil memperbarui ${singularName}: ${key}`
      );

      res.json({ success: true, item: list[index] });
    } else {
      res.status(404).json({ message: `${singularName} tidak ditemukan` });
    }
  });

  // DELETE Destroy with Cascade Delete capability!
  app.delete(`/api/${route}/:key`, async (req, res) => {
    const key = req.params.key;

    // If MySQL route, use MySQL only (no JSON cascade deletes)
    if (isSqlRoute(route)) {
      try {
        const info = sqlRouteInfo(route);
        await querySql(`DELETE FROM \`${info.table}\` WHERE \`${info.keyField}\` = ?`, [key]);

        if (route === 'mahasiswa') {
          await querySql('DELETE FROM `users` WHERE `reference_id` = ?', [key]);
        } else if (route === 'dosen') {
          await querySql('DELETE FROM `users` WHERE `reference_id` = ?', [key]);
        }

        addAuditLog(
          'sys',
          'System',
          'Administrator',
          `Hapus ${singularName}`,
          `Berhasil menghapus ${singularName}: ${key}`
        );

        return res.json({ success: true, message: `${singularName} berhasil dihapus!` });
      } catch (error) {
        console.error('MySQL DELETE error for', route, error);
        return res.status(500).json({ message: `Gagal menghapus ${singularName}`, error: error.message });
      }
    }

    // For non-MySQL routes, use JSON database with cascades
    const db = loadDb();
    const list = db[field] as any[];
    const index = list.findIndex((x) => x.id === key || x.nim === key || x.nidn === key);

    if (index !== -1) {
      const deletedItem = list[index];
      list.splice(index, 1);

      // Cascades for JSON database
      if (route === 'fakultas') {
        const prodiToDelete = db.prodi.filter((p) => p.fakultasId === key).map((p) => p.id);
        db.prodi = db.prodi.filter((p) => p.fakultasId !== key);
        db.mahasiswa = db.mahasiswa.filter((m) => !prodiToDelete.includes(m.prodiId));
        db.matakuliah = db.matakuliah.filter((mk) => !prodiToDelete.includes(mk.prodiId));
      } else if (route === 'prodi') {
        db.mahasiswa = db.mahasiswa.filter((m) => m.prodiId !== key);
        db.matakuliah = db.matakuliah.filter((mk) => mk.prodiId !== key);
      } else if (route === 'mahasiswa') {
        db.krs = db.krs.filter((k) => k.mahasiswaNim !== key);
        db.nilai = db.nilai.filter((n) => n.mahasiswaNim !== key);
        db.users = db.users.filter((u) => u.username !== key);
        db.absensiMahasiswa = db.absensiMahasiswa.filter((a) => a.mahasiswaNim !== key);
      } else if (route === 'dosen') {
        db.kelas = db.kelas.filter((k) => k.dosenNidn !== key);
        db.jadwal = db.jadwal.filter((j) => j.dosenNidn !== key);
        db.users = db.users.filter((u) => u.username !== key);
      } else if (route === 'jadwal') {
        db.krs = db.krs.filter((k) => k.jadwalId !== key);
        db.nilai = db.nilai.filter((n) => n.jadwalId !== key);
        db.absensiPertemuan = db.absensiPertemuan.filter((ap) => ap.jadwalId !== key);
      }

      saveDb(db);

      addAuditLog(
        'sys',
        'System',
        'Administrator',
        `Hapus ${singularName}`,
        `Berhasil menghapus ${singularName}: ${key}`
      );

      res.json({ success: true, message: `${singularName} berhasil dihapus!` });
    } else {
      res.status(404).json({ message: `${singularName} tidak ditemukan` });
    }
  });
}

// Generate the standard CRUDs
makeCrud('mahasiswa', 'mahasiswa', 'Mahasiswa');
makeCrud('dosen', 'dosen', 'Dosen');
makeCrud('fakultas', 'fakultas', 'Fakultas');
makeCrud('prodi', 'prodi', 'Program Studi');
makeCrud('tahun-akademik', 'tahunAkademik', 'Tahun Akademik');
makeCrud('matakuliah', 'matakuliah', 'Mata Kuliah');
makeCrud('kelas', 'kelas', 'Kelas');
makeCrud('jadwal', 'jadwal', 'Jadwal');
makeCrud('krs', 'krs', 'KRS');
makeCrud('nilai', 'nilai', 'Nilai');
makeCrud('kalender', 'kalender', 'Kalender Akademik');
makeCrud('surat', 'surat', 'Surat Akademik');
makeCrud('users', 'users', 'User');

// Custom endpoint for KRS Approval
app.post('/api/krs/approve', (req, res) => {
  const { krsId, status } = req.body;
  const db = loadDb();
  const krsIndex = db.krs.findIndex((k) => k.id === krsId);

  if (krsIndex !== -1) {
    db.krs[krsIndex].status = status;

    // If approved, pre-populateNilai (Grade placeholder) for the student
    if (status === 'Disetujui') {
      const activeKrs = db.krs[krsIndex];
      const existNilai = db.nilai.some(
        (n) => n.mahasiswaNim === activeKrs.mahasiswaNim && n.jadwalId === activeKrs.jadwalId
      );
      if (!existNilai) {
        db.nilai.push({
          id: 'nil-' + Date.now(),
          mahasiswaNim: activeKrs.mahasiswaNim,
          jadwalId: activeKrs.jadwalId,
          tugas: 0,
          quiz: 0,
          uts: 0,
          uas: 0,
          nilaiAkhir: 0,
          grade: 'E',
          bobot: 0,
        });
      }
    }

    saveDb(db);

    addAuditLog(
      'sys',
      'System',
      'Administrator',
      'Approval KRS',
      `Approval KRS ID ${krsId} menjadi ${status}`
    );

    res.json({ success: true });
  } else {
    res.status(404).json({ message: 'KRS tidak ditemukan' });
  }
});

// Input/Edit Nilai (with automatic calculation)
app.post('/api/nilai/calculate', (req, res) => {
  const { nim, jadwalId, tugas, quiz, uts, uas } = req.body;
  const db = loadDb();

  // Calculate nilaiAkhir
  const tugasW = parseFloat(tugas) || 0;
  const quizW = parseFloat(quiz) || 0;
  const utsW = parseFloat(uts) || 0;
  const uasW = parseFloat(uas) || 0;

  const nilaiAkhir = parseFloat((tugasW * 0.2 + quizW * 0.1 + utsW * 0.3 + uasW * 0.4).toFixed(1));

  let grade: 'A' | 'AB' | 'B' | 'BC' | 'C' | 'D' | 'E' = 'E';
  let bobot = 0;

  if (nilaiAkhir >= 85) {
    grade = 'A';
    bobot = 4.0;
  } else if (nilaiAkhir >= 77) {
    grade = 'AB';
    bobot = 3.5;
  } else if (nilaiAkhir >= 68) {
    grade = 'B';
    bobot = 3.0;
  } else if (nilaiAkhir >= 60) {
    grade = 'BC';
    bobot = 2.5;
  } else if (nilaiAkhir >= 50) {
    grade = 'C';
    bobot = 2.0;
  } else if (nilaiAkhir >= 40) {
    grade = 'D';
    bobot = 1.0;
  } else {
    grade = 'E';
    bobot = 0.0;
  }

  const index = db.nilai.findIndex((n) => n.mahasiswaNim === nim && n.jadwalId === jadwalId);
  const updatedNilai: Nilai = {
    id: index !== -1 ? db.nilai[index].id : 'nil-' + Date.now(),
    mahasiswaNim: nim,
    jadwalId,
    tugas: tugasW,
    quiz: quizW,
    uts: utsW,
    uas: uasW,
    nilaiAkhir,
    grade,
    bobot,
  };

  if (index !== -1) {
    db.nilai[index] = updatedNilai;
  } else {
    db.nilai.push(updatedNilai);
  }

  saveDb(db);

  addAuditLog(
    'sys',
    'System',
    'Dosen',
    'Input Nilai',
    `Input/Edit nilai mahasiswa ${nim} pada jadwal ${jadwalId}`
  );

  res.json({ success: true, item: updatedNilai });
});

// Absensi Perkuliahan
app.get('/api/absensi', (req, res) => {
  const db = loadDb();
  res.json({
    pertemuan: db.absensiPertemuan,
    mahasiswa: db.absensiMahasiswa,
  });
});

app.post('/api/absensi/buka', (req, res) => {
  const { jadwalId, pertemuanKe, tanggal } = req.body;
  const db = loadDb();

  const code = `QR-PRESENSI-${jadwalId}-P${pertemuanKe}-${Date.now()}`;
  const newPertemuan: AbsensiPertemuan = {
    id: 'abs-p-' + Date.now(),
    jadwalId,
    pertemuanKe: parseInt(pertemuanKe),
    tanggal,
    kodeQr: code,
    status: 'Buka',
  };

  db.absensiPertemuan.push(newPertemuan);
  saveDb(db);

  addAuditLog(
    'sys',
    'System',
    'Dosen',
    'Buka Absensi',
    `Dosen membuka absensi pertemuan ke-${pertemuanKe} untuk jadwal ${jadwalId}`
  );

  res.json({ success: true, item: newPertemuan });
});

app.post('/api/absensi/tutup', (req, res) => {
  const { pertemuanId } = req.body;
  const db = loadDb();
  const index = db.absensiPertemuan.findIndex((p) => p.id === pertemuanId);
  if (index !== -1) {
    db.absensiPertemuan[index].status = 'Tutup';
    saveDb(db);
    res.json({ success: true });
  } else {
    res.status(404).json({ message: 'Pertemuan tidak ditemukan' });
  }
});

app.post('/api/absensi/presensi', (req, res) => {
  const { nim, kodeQr, status } = req.body; // status: Hadir, Sakit, Izin, Alpa
  const db = loadDb();

  const pertemuan = db.absensiPertemuan.find((p) => p.kodeQr === kodeQr && p.status === 'Buka');
  if (!pertemuan) {
    return res.status(400).json({ message: 'Kode QR Presensi kadaluarsa atau tidak valid!' });
  }

  // Check if already presensi
  const existIndex = db.absensiMahasiswa.findIndex(
    (am) => am.pertemuanId === pertemuan.id && am.mahasiswaNim === nim
  );

  const newPresensi: AbsensiMahasiswa = {
    id: existIndex !== -1 ? db.absensiMahasiswa[existIndex].id : 'abs-m-' + Date.now(),
    pertemuanId: pertemuan.id,
    mahasiswaNim: nim,
    waktuPresensi: new Date().toISOString(),
    status: status || 'Hadir',
  };

  if (existIndex !== -1) {
    db.absensiMahasiswa[existIndex] = newPresensi;
  } else {
    db.absensiMahasiswa.push(newPresensi);
  }

  saveDb(db);

  addAuditLog(
    nim,
    nim,
    'Mahasiswa',
    'Presensi QR',
    `Mahasiswa ${nim} melakukan presensi QR pada pertemuan ke-${pertemuan.pertemuanKe}`
  );

  res.json({ success: true, item: newPresensi });
});

// Chat Antara Mahasiswa dan Dosen
app.get('/api/chat', (req, res) => {
  const { pengirimId, penerimaId } = req.query;
  const db = loadDb();
  let list = db.chat;
  if (pengirimId && penerimaId) {
    list = db.chat.filter(
      (c) =>
        (c.pengirimId === pengirimId && c.penerimaId === penerimaId) ||
        (c.pengirimId === penerimaId && c.penerimaId === pengirimId)
    );
  }
  res.json(list);
});

app.post('/api/chat', (req, res) => {
  const { pengirimId, penerimaId, pesan } = req.body;
  const db = loadDb();

  const newMsg: Chat = {
    id: 'cht-' + Date.now(),
    pengirimId,
    penerimaId,
    pesan,
    waktu: new Date().toISOString(),
    baca: false,
  };

  db.chat.push(newMsg);
  saveDb(db);
  res.json({ success: true, item: newMsg });
});

// Evaluasi Dosen oleh Mahasiswa
app.post('/api/evaluasi', (req, res) => {
  const { mahasiswaNim, dosenNidn, kelasId, skorKompetensi, skorPedagogik, skorProfesional, skorSosial, komentar } = req.body;
  const db = loadDb();

  const activeTa = db.tahunAkademik.find((ta) => ta.status === 'Aktif')?.id || 'ta-2026';

  const newEval: EvaluasiDosen = {
    id: 'ev-' + Date.now(),
    mahasiswaNim,
    dosenNidn,
    kelasId,
    skorKompetensi: parseInt(skorKompetensi),
    skorPedagogik: parseInt(skorPedagogik),
    skorProfesional: parseInt(skorProfesional),
    skorSosial: parseInt(skorSosial),
    komentar,
    tahunAkademikId: activeTa,
  };

  db.evaluasi.push(newEval);
  saveDb(db);

  addAuditLog(
    mahasiswaNim,
    mahasiswaNim,
    'Mahasiswa',
    'Evaluasi Dosen',
    `Mahasiswa ${mahasiswaNim} mengisi kuisioner evaluasi dosen ${dosenNidn}`
  );

  res.json({ success: true, item: newEval });
});

// 3. Backup and Restore Database Module
app.get('/api/backups', (req, res) => {
  try {
    const files = fs.readdirSync(BACKUPS_DIR);
    const backups = files
      .filter((f) => f.endsWith('.json'))
      .map((f) => {
        const stats = fs.statSync(path.join(BACKUPS_DIR, f));
        return {
          filename: f,
          size: stats.size,
          createdAt: stats.birthtime.toISOString(),
        };
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    res.json(backups);
  } catch (e) {
    res.json([]);
  }
});

app.post('/api/backup/create', (req, res) => {
  try {
    const db = loadDb();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `siakad_backup_${timestamp}.json`;
    const backupPath = path.join(BACKUPS_DIR, backupFileName);

    fs.writeFileSync(backupPath, JSON.stringify(db, null, 2), 'utf-8');

    addAuditLog(
      'sys',
      'System',
      'Administrator',
      'Backup Database',
      `Berhasil membuat backup database file: ${backupFileName}`
    );

    res.json({ success: true, filename: backupFileName });
  } catch (e) {
    res.status(500).json({ message: 'Gagal membuat backup database' });
  }
});

app.post('/api/backup/restore', (req, res) => {
  const { filename } = req.body;
  try {
    const backupPath = path.join(BACKUPS_DIR, filename);
    if (!fs.existsSync(backupPath)) {
      return res.status(404).json({ message: 'File backup tidak ditemukan' });
    }

    const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf-8'));
    saveDb(backupData);

    addAuditLog(
      'sys',
      'System',
      'Administrator',
      'Restore Database',
      `Berhasil memulihkan (restore) database dari file: ${filename}`
    );

    res.json({ success: true, message: 'Database berhasil dipulihkan!' });
  } catch (e) {
    res.status(500).json({ message: 'Gagal memulihkan database' });
  }
});

// Excel import simulation endpoint
app.post('/api/mahasiswa/import-excel', (req, res) => {
  const { list } = req.body; // array of mahasiswa items imported
  if (!Array.isArray(list)) {
    return res.status(400).json({ message: 'Format data tidak valid' });
  }

  const db = loadDb();
  let importedCount = 0;

  list.forEach((m: any) => {
    // Generate valid mahasiswa format
    if (m.nim && m.nama) {
      const exists = db.mahasiswa.some((x) => x.nim === String(m.nim));
      if (!exists) {
        const item: Mahasiswa = {
          nim: String(m.nim),
          nama: String(m.nama),
          jenisKelamin: m.jenisKelamin === 'Perempuan' ? 'Perempuan' : 'Laki-laki',
          tempatLahir: m.tempatLahir || 'Jakarta',
          tanggalLahir: m.tanggalLahir || '2004-01-01',
          email: m.email || `${m.nim}@siakad.ac.id`,
          noHp: m.noHp || '08123456789',
          alamat: m.alamat || 'Alamat mahasiswa',
          foto: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
          semester: m.semester ? parseInt(m.semester) : 1,
          prodiId: m.prodiId || 'prd-01',
          status: 'Aktif',
        };
        db.mahasiswa.push(item);

        // Also add users
        const newUser: User = {
          id: 'usr-mhs-' + item.nim,
          username: item.nim,
          email: item.email,
          role: 'Mahasiswa',
          referenceId: item.nim,
          status: 'Aktif',
        };
        db.users.push(newUser);

        importedCount++;
      }
    }
  });

  if (importedCount > 0) {
    saveDb(db);
    addAuditLog(
      'sys',
      'System',
      'Administrator',
      'Import Mahasiswa',
      `Berhasil mengimpor ${importedCount} data mahasiswa dari file excel.`
    );
  }

  res.json({ success: true, count: importedCount });
});

// Start listening and serve frontend static build or Vite
async function startServer() {
  // Serve static files in production or hook up Vite
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Attempt to listen on the desired port; on common errors (EACCES, EADDRINUSE)
  // try the next ports up to a limit.
  function tryListen(startPort: number, host: string, maxAttempts = 10) {
    const port = startPort;
    const server = app.listen(port, host);

    server.on('listening', () => {
      console.log(`Server running on http://localhost:${port}`);
    });

    server.on('error', (err: any) => {
      if (err && (err.code === 'EACCES' || err.code === 'EADDRINUSE') && maxAttempts > 0) {
        console.warn(`Port ${port} unavailable (${err.code}). Trying port ${port + 1}...`);
        // give the OS a moment then try next port
        setTimeout(() => tryListen(port + 1, host, maxAttempts - 1), 200);
      } else {
        console.error('Failed to start server:', err);
        process.exit(1);
      }
    });
  }

  // Allow overriding via env var, default to configured PORT
  const startPort = parseInt(process.env.PORT || String(PORT), 10) || PORT;
  tryListen(startPort, process.env.HOST || '0.0.0.0');
}

startServer();
