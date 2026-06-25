/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Mahasiswa {
  nim: string;
  nama: string;
  jenisKelamin: 'Laki-laki' | 'Perempuan';
  tempatLahir: string;
  tanggalLahir: string;
  email: string;
  noHp: string;
  alamat: string;
  foto: string;
  semester: number;
  prodiId: string;
  status: 'Aktif' | 'Cuti' | 'Drop Out' | 'Lulus';
}

export interface Dosen {
  nidn: string;
  nama: string;
  email: string;
  gelar: string;
  noHp: string;
  alamat: string;
  foto: string;
  status: 'Aktif' | 'Cuti';
}

export interface Fakultas {
  id: string;
  kode: string;
  nama: string;
  dekan: string;
}

export interface ProgramStudi {
  id: string;
  kode: string;
  nama: string;
  fakultasId: string;
}

export interface TahunAkademik {
  id: string;
  tahun: string; // e.g., "2026/2027"
  semesterTipe: 'Ganjil' | 'Genap';
  status: 'Aktif' | 'Tidak Aktif';
}

export interface MataKuliah {
  id: string;
  kode: string;
  nama: string;
  sks: number;
  semester: number;
  prodiId: string;
}

export interface Kelas {
  id: string;
  nama: string;
  semester: number;
  dosenNidn: string;
  kapasitas: number;
}

export interface Jadwal {
  id: string;
  matakuliahId: string;
  hari: 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu';
  jamMulai: string; // e.g., "08:00"
  jamSelesai: string; // e.g., "10:30"
  ruang: string;
  dosenNidn: string;
  kelasId: string;
}

export interface KRS {
  id: string;
  mahasiswaNim: string;
  jadwalId: string;
  tahunAkademikId: string;
  status: 'Draft' | 'Menunggu Persetujuan' | 'Disetujui' | 'Ditolak';
  tanggalPengajuan: string;
}

export interface Nilai {
  id: string;
  mahasiswaNim: string;
  jadwalId: string;
  tugas: number;
  quiz: number;
  uts: number;
  uas: number;
  nilaiAkhir: number;
  grade: 'A' | 'AB' | 'B' | 'BC' | 'C' | 'D' | 'E';
  bobot: number;
}

export interface AbsensiPertemuan {
  id: string;
  jadwalId: string;
  pertemuanKe: number; // 1-16
  tanggal: string;
  kodeQr: string;
  status: 'Buka' | 'Tutup';
}

export interface AbsensiMahasiswa {
  id: string;
  pertemuanId: string;
  mahasiswaNim: string;
  waktuPresensi: string;
  status: 'Hadir' | 'Sakit' | 'Izin' | 'Alpa';
}

export interface KalenderAkademik {
  id: string;
  event: string;
  tanggalMulai: string;
  tanggalSelesai: string;
  kategori: 'UTS' | 'UAS' | 'Libur' | 'Wisuda' | 'Registrasi' | 'KRS';
}

export interface Chat {
  id: string;
  pengirimId: string; // NIM, NIDN, atau admin_id
  penerimaId: string;
  pesan: string;
  waktu: string;
  baca: boolean;
}

export interface SuratAkademik {
  id: string;
  mahasiswaNim: string;
  tipe: 'Surat Aktif Kuliah' | 'Surat Keterangan Mahasiswa' | 'Surat Cuti' | 'Surat Bebas Administrasi';
  keterangan: string;
  status: 'Menunggu' | 'Diproses' | 'Selesai';
  tanggalPengajuan: string;
}

export interface EvaluasiDosen {
  id: string;
  mahasiswaNim: string;
  dosenNidn: string;
  kelasId: string;
  skorKompetensi: number; // 1-5
  skorPedagogik: number;  // 1-5
  skorProfesional: number; // 1-5
  skorSosial: number;      // 1-5
  komentar: string;
  tahunAkademikId: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  username: string;
  role: 'Administrator' | 'Dosen' | 'Mahasiswa';
  aktivitas: string;
  deskripsi: string;
  ip: string;
  waktu: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'Administrator' | 'Dosen' | 'Mahasiswa';
  referenceId?: string; // nim atau nidn jika role Mahasiswa atau Dosen
  password?: string;
  status: 'Aktif' | 'Nonaktif';
}
