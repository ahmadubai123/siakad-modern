# Panduan Menghubungkan Aplikasi ke Database MySQL (XAMPP / phpMyAdmin)

Aplikasi ini dirancang dengan struktur full-stack modern (**React + Express**). Di lingkungan server cloud (AI Studio Preview), aplikasi menggunakan database berbasis JSON (`data.json`) untuk kenyamanan penggunaan langsung secara online.

Namun, Anda dapat dengan sangat mudah menghubungkannya ke **MySQL lokal (XAMPP)** ketika Anda mengekspor/mengunduh aplikasi ini ke komputer lokal Anda.

---

## 📌 Langkah 1: Persiapan di XAMPP (phpMyAdmin)
1. Buka **XAMPP Control Panel** di komputer Anda.
2. Jalankan service **Apache** dan **MySQL**.
3. Buka browser dan pergi ke **http://localhost/phpmyadmin**.
4. Buat database baru dengan nama: **`dbsiakad_kampus`**.
5. Klik tab **Import** pada database baru tersebut.
6. Pilih file **`siakad_db.sql`** yang telah kami buat di direktori root proyek ini, kemudian klik **Go** / **Kirim**.
7. Sekarang semua tabel (mahasiswa, dosen, kelas, jadwal, fakultas, prodi, dan users) beserta dummy data siap digunakan!

---

## 📌 Langkah 2: Mengonfigurasi Koneksi Database di Node.js/Express
Untuk menghubungkan server Node.js ke database MySQL lokal Anda, ikuti langkah-langkah berikut setelah mengekspor kode:

### 1. Install Library MySQL Driver
Buka terminal proyek Anda dan jalankan perintah:
```bash
npm install mysql2
```

### 2. Atur Environment Variables (.env)
Buat file bernama `.env` di direktori root aplikasi (atau edit file yang sudah ada) dan tambahkan konfigurasi database Anda:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=dbsiakad_kampus
DB_PORT=3306
```
*(Catatan: Kosongkan `DB_PASSWORD` jika Anda menggunakan konfigurasi default bawaan XAMPP).*

### 3. Implementasi Kode Koneksi di `server.ts`
Anda bisa menambahkan kode koneksi MySQL di `server.ts` dengan menggunakan library `mysql2`. Berikut adalah pola integrasi yang direkomendasikan:

```typescript
import mysql from 'mysql2/promise';

// Lazy-loaded database connection pool
let pool: mysql.Pool | null = null;

export function getDb() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'dbsiakad_kampus',
      port: Number(process.env.DB_PORT) || 3306,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
  }
  return pool;
}

// Contoh Endpoint API Login yang mengambil data dari tabel 'users' di XAMPP MySQL:
/*
app.post('/api/login', async (req, res) => {
  const { username, password, role } = req.body;
  try {
    const db = getDb();
    const [rows]: any = await db.execute(
      'SELECT * FROM users WHERE username = ? AND role = ?', 
      [username, role]
    );
    
    if (rows.length === 0) {
      return res.status(401).json({ message: 'User tidak ditemukan!' });
    }
    
    const user = rows[0];
    if (user.password !== password) {
      return res.status(401).json({ message: 'Password salah!' });
    }
    
    return res.json({
      username: user.username,
      displayName: user.display_name,
      email: user.email,
      role: user.role,
      referenceId: user.reference_id
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Database error!' });
  }
});
*/
```

---

## 💡 Mengapa Cloud Preview tidak langsung terhubung ke XAMPP?
Karena XAMPP berjalan di komputer lokal Anda (`localhost`), server cloud internet di Google Cloud Run tidak memiliki izin atau jalur jaringan fisik untuk langsung menjangkau harddisk/komputer lokal Anda. 

Oleh karena itu, sistem cloud menggunakan fallback simulasi database JSON yang beroperasi secara real-time dengan data yang persis sama. Saat Anda mengunduh source code aplikasi ini via menu **Settings > Export as ZIP**, Anda tinggal mengimpor file **`siakad_db.sql`** ke XAMPP Anda dan semua akan bekerja secara luring di laptop Anda!
