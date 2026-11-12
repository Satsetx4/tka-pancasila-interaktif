# Roadmap tka-pancasila-interaktif

## Fase 1 - Stabilisasi PWA dan konten 7 Bab
- [ ] Verifikasi offline service worker memuat bab1-bab7.json + materi.json tanpa jaringan (uji mode pesawat Android)
- [ ] Audit 245 soal: tiap Bab 35 soal, 6 tipe ter-render benar di Latihan
- [ ] Perbaiki auto-scroll atas saat next/prev di Materi dan Latihan di semua ukuran HP
- [ ] Sinkronkan kunci dan pembahasan tiap jawaban dengan modul sumber
- [ ] Uji install banner + ikon PWA di Chrome Android sampai Add-to-Home-Screen lolos

## Fase 2 - Monetisasi voucher dan admin
- [ ] Uji end-to-end voucher Individu (1 device Rp20k) vs Share (3 device Rp40k)
- [ ] Audit panel admin: filter paket, hapus manual/bulk voucher inactive, copy list vertikal untuk WA
- [ ] Tambahkan rekap voucher terjual/kadaluarsa per Bab
- [ ] Kunci route admin dari indeks/search agar tidak bocor ke siswa

## Fase 3 - Gamifikasi dan retensi
- [ ] Seimbangkan XP + streak + badge per Bab agar 7 badge tuntas tanpa grind berlebih
- [ ] Tambahkan layar Hasil: ringkasan per Bab, tombol ulangi soal salah saja
- [ ] Tambahkan mute persisten + light-mode kontras di HP low-end
- [ ] Optimasi bundle Vite agar TTI di bawah 3 detik di Android RAM 3GB

## Fase 4 - Rilis domain dan operasional
- [ ] Validasi domain primer + redirect Vercel
- [ ] Checklist rilis: build, smoke test 7 Bab + voucher + PWA, deploy prod
- [ ] Backup bab JSON + materi berversi sebelum tiap update soal
