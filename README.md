# 📅 Project Scheduling

> **Project Akhir Semester 2** — Aplikasi web manajemen dan penjadwalan proyek berbasis Node.js, Express, dan Prisma ORM dengan database MySQL.

![Node.js](https://img.shields.io/badge/Node.js-22+-339933?style=flat-square&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-5.x-000000?style=flat-square&logo=express&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-7.x-2D3748?style=flat-square&logo=prisma&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-Latest-003545?style=flat-square&logo=maysql&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-49%25-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![CSS](https://img.shields.io/badge/CSS-30.6%25-1572B6?style=flat-square&logo=css3&logoColor=white)
![HTML](https://img.shields.io/badge/HTML-20.2%25-E34F26?style=flat-square&logo=html5&logoColor=white)

---

## 📖 Deskripsi

**Project Scheduling** adalah aplikasi web full-stack yang dirancang untuk membantu tim atau organisasi dalam **mengelola, menjadwalkan, dan memonitor proyek** secara terpusat. Aplikasi ini dibangun sebagai tugas akhir semester 2 dengan pendekatan arsitektur **MVC (Model-View-Controller)** menggunakan teknologi modern berbasis JavaScript.

Dengan antarmuka berbasis web yang responsif, pengguna dapat:
- Membuat dan mengelola data proyek
- Mengatur jadwal dan penugasan tim
- Memantau status dan progres pekerjaan
- Mengelola file/dokumen terkait proyek

---

## 🗂️ Struktur Proyek

```
project_scedulling/
│
├── 📁 config/              # Konfigurasi aplikasi (database, environment)
├── 📁 controllers/         # Logic handler untuk setiap request HTTP
├── 📁 page/                # Halaman HTML untuk tampilan antarmuka
├── 📁 prisma/              # Skema database & migrasi Prisma ORM
│   ├── schema.prisma       # Definisi model/tabel database
│   ├── migrations/         # Riwayat migrasi database
│   └── seed.js             # Data awal (seeder) database
├── 📁 public/              # Aset statis (CSS, gambar, JavaScript client-side)
├── 📁 routes/              # Definisi routing/endpoint API
├── .gitignore
├── package.json            # Dependensi & skrip NPM
├── prisma.config.ts        # Konfigurasi Prisma (adapter, datasource, migrasi)
├── script.js               # Script utilitas tambahan
└── server.js               # Entry point — inisialisasi server Express
```

---

## ⚙️ Cara Kerja

### Alur Arsitektur MVC

```
Browser / Client
      │
      ▼
  [ server.js ]          ← Entry point, inisialisasi Express & middleware
      │
      ▼
  [ routes/ ]            ← Menentukan URL endpoint (GET, POST, PUT, DELETE)
      │
      ▼
  [ controllers/ ]       ← Memproses request, memanggil Prisma, mengirim response
      │
      ▼
  [ Prisma ORM ]         ← Query ke database melalui model yang sudah didefinisikan
      │
      ▼
  [ MySQL ]              ← Penyimpanan data permanen
```

### Penjelasan Tiap Komponen

| Komponen | Fungsi |
|---|---|
| `server.js` | Titik masuk aplikasi. Menginisialisasi Express, mendaftarkan middleware (JSON parser, static files), dan menghubungkan semua routes. |
| `routes/` | Mendefinisikan semua URL endpoint dan menghubungkannya ke fungsi controller yang sesuai. |
| `controllers/` | Berisi logika bisnis utama — memvalidasi input, berinteraksi dengan database via Prisma, dan mengembalikan response ke client. |
| `prisma/schema.prisma` | Mendefinisikan struktur tabel database menggunakan bahasa deklaratif Prisma Schema Language (PSL). |
| `config/` | Menyimpan konfigurasi seperti koneksi database, environment variables, dan pengaturan aplikasi lainnya. |
| `page/` | File HTML yang di-serve ke browser sebagai antarmuka pengguna. |
| `public/` | Aset statis: stylesheet CSS, gambar, dan script JavaScript sisi klien. |
| `prisma.config.ts` | Konfigurasi Prisma — menghubungkan adapter MySQL, menentukan path schema, migrasi, dan seed. |

### Stack Teknologi

```
┌─────────────────────────────────────────────┐
│             FRONTEND (Browser)              │
│   HTML + CSS + Vanilla JavaScript           │
├─────────────────────────────────────────────┤
│             BACKEND (Node.js)               │
│   Express.js v5  ─  REST API Server         │
│   Multer          ─  Upload File Handling   │
├─────────────────────────────────────────────┤
│             ORM & DATABASE                  │
│   Prisma v7      ─  ORM & Query Builder     │
│   MySQL          ─  Relational Database     │
└─────────────────────────────────────────────┘
```

---

## 🚀 Panduan Penggunaan

### Prasyarat

Pastikan sudah terinstal di komputer kamu:

- [Node.js](https://nodejs.org/) versi **18+** (disarankan v22+)
- [MySQL](https://mysql.org/)
- npm (sudah termasuk dengan Node.js)

### 1. Clone Repository

```bash
git clone https://github.com/resan751/project_scedulling.git
cd project_scedulling
```

### 2. Install Dependensi

```bash
npm install
```

Dependensi yang akan diinstal:

| Package | Versi | Fungsi |
|---|---|---|
| `express` | ^5.2.1 | Web framework |
| `@prisma/client` | ^7.8.0 | Prisma ORM client |
| `@prisma/adapter-mysql` | ^7.8.0 | Adapter koneksi MySQL |
| `dotenv` | ^17.4.2 | Manajemen environment variables |
| `multer` | ^2.1.1 | Middleware upload file |
| `prisma` *(dev)* | ^7.8.0 | CLI Prisma untuk migrasi & generate |

### 3. Konfigurasi Environment

Buat file `.env` di root direktori proyek:

```env
DATABASE_URL="mysql://username:password@localhost:3306/nama_database"
```

Sesuaikan `username`, `password`, dan `nama_database` dengan konfigurasi MySQL kamu.

### 4. Setup Database

```bash
# Jalankan migrasi untuk membuat tabel-tabel di database
npx prisma migrate dev

# (Opsional) Isi database dengan data awal
npx prisma db seed

# Generate Prisma Client
npx prisma generate
```

### 5. Jalankan Aplikasi

**Mode Development** (dengan auto-reload saat file berubah):

```bash
npm run dev
```

**Mode Production**:

```bash
node server.js
```

Aplikasi akan berjalan di: **`http://localhost:3000`** *(atau port yang dikonfigurasi)*

---

## 🛠️ Skrip NPM

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Menjalankan server dengan `--watch` (auto-restart saat ada perubahan file) |
| `npx prisma studio` | Membuka GUI Prisma Studio untuk inspect/edit data database |
| `npx prisma migrate dev` | Membuat & menerapkan migrasi baru ke database |
| `npx prisma db seed` | Mengisi database dengan data seeder |
| `npx prisma generate` | Meng-generate ulang Prisma Client |

---

## 🗄️ Database

Proyek ini menggunakan **MySQL** sebagai database relasional yang dikelola melalui **Prisma ORM**. Skema database didefinisikan di `prisma/schema.prisma`.

```
📄 prisma/
├── schema.prisma    ← Definisi model (tabel, kolom, relasi)
├── migrations/      ← Riwayat perubahan skema database
└── seed.js          ← Script pengisian data awal
```

Untuk melihat dan mengelola data secara visual, gunakan Prisma Studio:

```bash
npx prisma studio
```

---

## 📁 Upload File

Aplikasi menggunakan **Multer** untuk menangani upload file. File yang diupload disimpan di direktori `public/` dan dapat diakses sebagai aset statis melalui browser.

---

## 👥 Kontributor

| Kontributor | GitHub |
|---|---|
| Rio Belly Saputra | [@resan751](https://github.com/resan751) |
| Ridho Romadhani | [@ridhosapen](https://github.com/ridhosapen) |
| Mochammad Rehan Pratama | [@rehanpratama](https://github.com/Rehanpratama) |
| Muhammad Khoir Luqman | [@khoirluqman07](https://github.com/khoirluqman07/) |
| Muhammad Rizki Alfareza | [@alfareza26](https://github.com/Alfareza26) |
| Salma Nurul Qolbi | [@salma](https://github.com/salmanurulqolbi13-arch) |

---

## 📄 Lisensi

Proyek ini dibuat untuk keperluan akademik — **Project Akhir Semester 2**.

---

*Dibuat sepenuh hati menggunakan Node.js, Express, dan Prisma ORM*
