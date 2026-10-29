# SignalMap

Dashboard web untuk demo klasifikasi dan visualisasi kualitas sinyal seluler di Gedung Teknik Elektro Universitas Nusa Cendana.

## Menjalankan

```powershell
npm install --cache .npm-cache
npm run dev
```

Buka alamat lokal yang ditampilkan Vite (umumnya `http://localhost:5173`). Untuk membuat versi produksi, gunakan `npm run build`.

## Memasukkan data survei

Tekan **Unggah data survei** dan pilih CSV UTF-8. Header yang didukung:

```text
timestamp,provider,rsrp,rsrq,checkpoint_id,lantai,zona,x,y,kategori
```

Pemisah koma maupun titik-koma didukung. `x,y` harus menggunakan sistem koordinat denah: X 0–1000 dan Y 0–800, titik (0,0) di pojok kiri atas. Jika `x,y` kosong, aplikasi memakai posisi checkpoint contoh sebagai cadangan.

## Catatan metodologi

Nilai RSRP/RSRQ dipakai untuk detail dan membuat label aktual. Kategori prediksi yang divisualisasikan heatmap harus berasal dari model yang menggunakan hanya fitur kontekstual (checkpoint/koordinat, lantai, zona LOS/NLOS), tanpa RSRP sebagai input. Data demo menggunakan fungsi prediksi kontekstual di `predictFromContext`; ganti fungsi tersebut atau masukkan kolom `predicted` dari hasil inferensi model final sebelum sidang.
