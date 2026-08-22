# 📘 DOKUMEN PETUNJUK PRODUKSI (PRODUCTION OPERATIONAL GUIDE)
**Aplikasi Data & Katalog Crew Longline**  
**Repository:** `sidean28-stack/crew-data-app`  
**Web Produksi (Live):** [https://sidean28-stack.github.io/crew-data-app/](https://sidean28-stack.github.io/crew-data-app/)

---

## 1. 🌐 RINGKASAN ARSITEKTUR SISTEM

Aplikasi ini menggunakan arsitektur *Serverless Jamstack* yang terintegrasi penuh dengan ekosistem Google:

| Komponen | Teknologi / Lokasi | Deskripsi & Peran |
| :--- | :--- | :--- |
| **Frontend Web** | GitHub Pages (`main` branch) | Halaman antarmuka interaktif (HTML, CSS Glassmorphic, JS Modular). |
| **Backend API** | Google Apps Script (`google_apps_script.gs`) | Menyediakan REST API endpoint JSON untuk registrasi, update, dan filter. |
| **Database utama** | Google Spreadsheet (Crew Master) | Menyimpan seluruh baris data kru, riwayat pekerjaan, dan URL dokumen. |
| **Penyimpanan Berkas** | Google Drive (`Crew_Longline_Uploads_PT_ALINDA`) | Folder otomatis penyimpan foto, paspor, KTP, seaman book, MCU, & sertifikat. |

---

## 2. 🚀 PROSEDUR DEPLOYMENT & RILIS WEB PRODUKSI

### A. Mempublikasikan Perubahan Frontend (Web Pages)
Setiap perubahan pada file frontend (`index.html`, `styles.css`, `i18n.js`, `js/`) dipublikasikan melalui GitHub Pages:

1. **Jalankan Uji Sintaks Lokal:**
   ```bash
   node --check i18n.js
   node --check js/ui-components.js
   node --check js/api.js
   node --check js/admin.js
   node --check js/owner.js
   ```
2. **Jalankan Test Suite Skenario:**
   ```bash
   node test_smart_import_v2_unit.js
   ```
3. **Push Kode ke Branch `main`:**
   ```bash
   git add index.html styles.css i18n.js js/ui-components.js js/api.js js/admin.js js/owner.js PETUNJUK_PRODUKSI.md
   git commit -m "docs: tambahkan petunjuk produksi operasional"
   git push origin main
   ```
4. **Verifikasi Publikasi Live:**
   - Buka URL produksi: [https://sidean28-stack.github.io/crew-data-app/](https://sidean28-stack.github.io/crew-data-app/)
   - Lakukan **Hard Refresh** (`Ctrl + F5` atau `Ctrl + Shift + R`) pada browser.

---

### B. Mempublikasikan Perubahan Backend (`google_apps_script.gs`)
Jika ada perubahan pada file `google_apps_script.gs`:

1. **Gunakan Google Clasp / Editor Apps Script:**
   ```bash
   clasp push
   ```
2. **Buat Deployment Baru (New Version):**
   - Buka project Google Apps Script.
   - Klik **Deploy** ➔ **New deployment** ➔ Pilih jenis **Web App**.
   - Set *Execute as*: `Me (pemilik akun Google)`
   - Set *Who has access*: `Anyone`
3. **Catat Version Deployment:** Pastikan `DEFAULT_GAS_URL` pada [`js/api.js`](file:///g:/crew-data-app-smart-import-v2/crew-data-app-smart-import-v2/js/api.js) selalu merujuk ke URL deployment aktif yang baru.

---

## 3. 🛠️ FITUR UTAMA & CARA PENGGUNAAN HARIAN

### A. Sistem Penyaringan Data Kru (Filter Bar)
Pengguna (Admin & Ship Owner) dapat menggunakan kombinasi filter yang fleksibel:
- **Cari Kata Kunci (Search Input):** Mencari berdasarkan Nama Kru, Nama Mandarin, Kode/ID Kru, No Paspor, Seaman Book, atau No Telepon.
- **Filter Jabatan (`dirFilterRank` / `catFilterRank`):** Menyaring kru berdasarkan posisi (Deckhand, Koki, Mandor, Engine, Operator Holer, Selam, Crew ABK, dll.). Pencocokan bersifat *case-insensitive* & *fuzzy token*.
- **Filter Nama Kapal (`dirFilterVesselName` / `catFilterVesselName`):** Memilih kandidat berdasarkan riwayat atau alokasi nama kapal spesifik.
- **Filter Status Operasional (`dirFilterStatus` / `catFilterStatus`):**
  - `ON_BOAT`: Kru yang sedang berlayar di atas kapal.
  - `SELECTED`: Kru yang telah dipilih oleh Ship Owner.
  - `STAND_BY`: Kru kandidat yang siap ditugaskan.
  - `ON_BOAT & SELECTED`: Gabungan kru aktif / terpilih.

### B. Sistem Multi-Tema Transparan (*Glassmorphism*)
Pengguna dapat memilih tema visual melalui dropdown di header kanan atas:
- 🌌 **Dark Ocean Transparan (Default)**: Efek kaca buram di atas latar laut gelap.
- ☀️ **Light Crystal Transparan**: Efek kaca kristal terang bersih dengan aksen biru.
- 💜 **Cyberpunk Transparan**: Tema gelap transparan beraksen neon violet.
- 🌲 **Emerald Glass Transparan**: Tema gelap transparan beraksen hijau zamrud.
- 🔲 **Slate Transparan**: Tema abu-abu arang *high-contrast*.

Pilihan tema pengguna akan tersimpan secara otomatis di browser (`localStorage`).

---

## 4. 🧹 PANDUAN TROUBLESHOOTING & PEMELIHARAAN PRODUKSI

### A. Penanganan Gambar / Dokumen Terhapus
**Gejala:** Gambar dokumen atau foto kru masih muncul link-nya atau gambarnya pecah (*broken image*).

**Langkah Pembersihan:**
1. **Di Google Sheet Produksi:** Buka Google Sheet master, cari baris kru bersangkutan, lalu hapus/kosongkan teks URL pada kolom dokumen terkait (*URL Paspor*, *URL KTP*, *URL Seaman Book*, *URL MCU*, *URL Cert*, atau *URL Foto Crew*).
2. **Di Google Drive:** Buka folder Google Drive ➔ Masuk ke menu **Trash / Sampah** ➔ Klik **Empty Trash (Kosongkan Sampah)** agar file fisik benar-benar terhapus permanen.
3. **Di Aplikasi Web:** Tekan tombol **Refresh Cloud / Sync Now** atau `Ctrl + F5` pada halaman web untuk memperbarui cache browser.

### B. Penanganan Data Duplikat (Smart Import V2)
Sistem dilengkapi dengan penanganan *Smart Import V2* otomatis saat impor file Excel:
- Pengenalan kru berdasarkan kombinasi **No Paspor**, **Seaman Book**, **NIK/KTP**, atau **Nama + Tanggal Lahir**.
- Data kru lama yang melakukan *Rejoin* tidak akan membuat baris baru, melainkan memperbarui (*update in-place*) baris data yang ada secara non-destruktif.

---

## 5. 🔒 ATURAN HAK AKSES & PRIVASI DATA (SECURITY & COMPLIANCE)

1. **Privasi Kru Terpilih (`ON_BOAT` / `SELECTED`):**
   Kru berstatus `ON_BOAT` atau `SELECTED` **wajib tersembunyi** dari Ship Owner lain. Hanya Admin atau Ship Owner yang memiliki token/tautan One-Time Access Link (OTL) yang cocok yang dapat melihat riwayat dan dokumen kru tersebut.
2. **Kerahasiaan Dokumen:**
   URL file Google Drive harus dinormalisasi melalui pemutar gambar (*image resolver*) aplikasi dan dilarang mengekspos kredensial atau OAuth token pada log konsol.

---
*Dokumen ini dibuat dan dikonfirmasi untuk lingkungan produksi repository `sidean28-stack/crew-data-app`.*
