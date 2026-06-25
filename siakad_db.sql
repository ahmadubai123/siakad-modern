-- SQL Dump untuk Impor ke XAMPP phpMyAdmin / MySQL
-- Nama Database: dbsiakad_kampus

SET FOREIGN_KEY_CHECKS=0;
DROP TABLE IF EXISTS `jadwal_kuliah`;
DROP TABLE IF EXISTS `kelas`;
DROP TABLE IF EXISTS `matakuliah`;
DROP TABLE IF EXISTS `prodi`;
DROP TABLE IF EXISTS `fakultas`;
DROP TABLE IF EXISTS `mahasiswa`;
DROP TABLE IF EXISTS `dosen`;
DROP TABLE IF EXISTS `users`;
SET FOREIGN_KEY_CHECKS=1;

-- 1. Tabel Users (Untuk Autentikasi Multirole: Admin, Dosen, Mahasiswa)
CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `display_name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `role` ENUM('Administrator', 'Dosen', 'Mahasiswa') NOT NULL,
  `reference_id` VARCHAR(50) DEFAULT NULL, -- NIM untuk Mahasiswa, NIDN untuk Dosen, NULL untuk Admin
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Tabel Fakultas
CREATE TABLE `fakultas` (
  `id` VARCHAR(50) PRIMARY KEY,
  `kode` VARCHAR(20) NOT NULL UNIQUE,
  `nama` VARCHAR(100) NOT NULL,
  `dekan` VARCHAR(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Tabel Program Studi (Prodi)
CREATE TABLE `prodi` (
  `id` VARCHAR(50) PRIMARY KEY,
  `kode` VARCHAR(20) NOT NULL UNIQUE,
  `nama` VARCHAR(100) NOT NULL,
  `fakultas_id` VARCHAR(50) NOT NULL,
  FOREIGN KEY (`fakultas_id`) REFERENCES `fakultas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Tabel Dosen
CREATE TABLE `dosen` (
  `nidn` VARCHAR(50) PRIMARY KEY,
  `nama` VARCHAR(100) NOT NULL,
  `gelar` VARCHAR(50) DEFAULT NULL,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `no_hp` VARCHAR(20) DEFAULT NULL,
  `status` ENUM('Aktif', 'Cuti', 'Tugas Belajar', 'Non-Aktif') DEFAULT 'Aktif'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Tabel Mahasiswa
CREATE TABLE `mahasiswa` (
  `nim` VARCHAR(50) PRIMARY KEY,
  `nama` VARCHAR(100) NOT NULL,
  `jenis_kelamin` ENUM('Laki-laki', 'Perempuan') NOT NULL,
  `prodi_id` VARCHAR(50) NOT NULL,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `no_hp` VARCHAR(20) DEFAULT NULL,
  `alamat` TEXT DEFAULT NULL,
  `semester` INT DEFAULT 1,
  `status` ENUM('Aktif', 'Cuti', 'Lulus', 'Drop Out', 'Non-Aktif') DEFAULT 'Aktif',
  FOREIGN KEY (`prodi_id`) REFERENCES `prodi` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Tabel Matakuliah
CREATE TABLE `matakuliah` (
  `id` VARCHAR(50) PRIMARY KEY,
  `kode` VARCHAR(20) NOT NULL UNIQUE,
  `nama` VARCHAR(100) NOT NULL,
  `sks` INT NOT NULL,
  `semester` INT NOT NULL,
  `prodi_id` VARCHAR(50) NOT NULL,
  FOREIGN KEY (`prodi_id`) REFERENCES `prodi` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Tabel Kelas
CREATE TABLE `kelas` (
  `id` VARCHAR(50) PRIMARY KEY,
  `nama` VARCHAR(50) NOT NULL,
  `semester` INT NOT NULL,
  `kapasitas` INT DEFAULT 30,
  `dosen_nidn` VARCHAR(50) NOT NULL,
  FOREIGN KEY (`dosen_nidn`) REFERENCES `dosen` (`nidn`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. Tabel Jadwal Kuliah
CREATE TABLE `jadwal_kuliah` (
  `id` VARCHAR(50) PRIMARY KEY,
  `matakuliah_id` VARCHAR(50) NOT NULL,
  `kelas_id` VARCHAR(50) NOT NULL,
  `hari` ENUM('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu') NOT NULL,
  `ruang` VARCHAR(50) NOT NULL,
  `jam_mulai` VARCHAR(10) NOT NULL,
  `jam_selesai` VARCHAR(10) NOT NULL,
  `dosen_nidn` VARCHAR(50) NOT NULL,
  FOREIGN KEY (`matakuliah_id`) REFERENCES `matakuliah` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`kelas_id`) REFERENCES `kelas` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`dosen_nidn`) REFERENCES `dosen` (`nidn`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ========================================================
-- DATA SEEDER AWAL (DUMMY DATA UNTUK MEMULAI KAMPUS)
-- ========================================================

-- Seed Users (Password: admin / password)
INSERT INTO `users` (`username`, `password`, `display_name`, `email`, `role`, `reference_id`) VALUES
('admin', 'admin', 'Administrator Utama', 'admin@siakad.ac.id', 'Administrator', NULL),
('0411027501', 'password', 'Dr. Budi Santoso, M.T., Ph.D.', 'budi.santoso@siakad.ac.id', 'Dosen', '0411027501'),
('220101001', 'password', 'Ahmad Fauzi', 'ahmad.fauzi@siakad.ac.id', 'Mahasiswa', '220101001');

-- Seed Fakultas
INSERT INTO `fakultas` (`id`, `kode`, `nama`, `dekan`) VALUES
('fak-01', 'FTI', 'Fakultas Teknologi Informasi', 'Prof. Dr. Anton Wibowo, M.Sc.'),
('fak-02', 'FEB', 'Fakultas Ekonomi dan Bisnis', 'Dr. Rina Maryana, S.E., M.Si.');

-- Seed Prodi
INSERT INTO `prodi` (`id`, `kode`, `nama`, `fakultas_id`) VALUES
('prd-01', 'TIF', 'Teknik Informatika', 'fak-01'),
('prd-02', 'SI', 'Sistem Informasi', 'fak-01'),
('prd-03', 'AKT', 'Akuntansi', 'fak-02');

-- Seed Dosen
INSERT INTO `dosen` (`nidn`, `nama`, `gelar`, `email`, `no_hp`, `status`) VALUES
('0411027501', 'Dr. Budi Santoso', 'M.T., Ph.D.', 'budi.santoso@siakad.ac.id', '081234567890', 'Aktif'),
('0412038002', 'Larasati Putri', 'S.Kom., M.T.', 'larasati@siakad.ac.id', '081298765432', 'Aktif');

-- Seed Mahasiswa
INSERT INTO `mahasiswa` (`nim`, `nama`, `jenis_kelamin`, `prodi_id`, `email`, `no_hp`, `alamat`, `semester`, `status`) VALUES
('220101001', 'Ahmad Fauzi', 'Laki-laki', 'prd-01', 'ahmad.fauzi@siakad.ac.id', '085712345678', 'Jl. Merdeka No. 45, Jakarta', 4, 'Aktif'),
('220101002', 'Siti Aminah', 'Perempuan', 'prd-01', 'siti@siakad.ac.id', '085787654321', 'Jl. Mawar No. 12, Bandung', 4, 'Aktif');

-- Seed Matakuliah
INSERT INTO `matakuliah` (`id`, `kode`, `nama`, `sks`, `semester`, `prodi_id`) VALUES
('mk-01', 'TIF-201', 'Pemrograman Web Lanjut', 3, 4, 'prd-01'),
('mk-02', 'TIF-202', 'Basis Data', 4, 2, 'prd-01'),
('mk-03', 'TIF-301', 'Kecerdasan Buatan', 3, 6, 'prd-01');

-- Seed Kelas
INSERT INTO `kelas` (`id`, `nama`, `semester`, `kapasitas`, `dosen_nidn`) VALUES
('kls-01', 'TIF-4A', 4, 30, '0411027501'),
('kls-02', 'TIF-2B', 2, 35, '0412038002');

-- Seed Jadwal
INSERT INTO `jadwal_kuliah` (`id`, `matakuliah_id`, `kelas_id`, `hari`, `ruang`, `jam_mulai`, `jam_selesai`, `dosen_nidn`) VALUES
('jdw-01', 'mk-01', 'kls-01', 'Senin', 'Lab Komputer 1', '08:00', '10:30', '0411027501'),
('jdw-02', 'mk-02', 'kls-02', 'Rabu', 'Ruang Kelas 302', '10:45', '13:15', '0412038002');
