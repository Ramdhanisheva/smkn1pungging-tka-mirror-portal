<div align="center">

# 🏛️ TKA Pusmendik Portal Mirror & CBT Hub
**Infrastruktur Mirroring & Monitoring Real-Time Tes Kemampuan Akademik (TKA) 2026**  
*SMK Negeri 1 Pungging — Bengkel Teknik Komputer & Jaringan (TKJ)*

---

[![Node.js](https://img.shields.io/badge/Node.js-v18+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![Express.js](https://img.shields.io/badge/Express.js-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com)
[![Chart.js](https://img.shields.io/badge/Chart.js-v4.4-FF6384?style=flat-square&logo=chartdotjs&logoColor=white)](https://www.chartjs.org)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)

</div>

---

## 📖 Deskripsi Proyek

**TKA Pusmendik Portal Mirror** adalah platform web pendukung persiapan dan pelaksanaan **Tes Kemampuan Akademik (TKA) 2026** di **SMK Negeri 1 Pungging**.

Platform ini memfasilitasi peserta didik, proktor, dan teknisi lab dalam memantau perkembangan data pendaftaran TKA secara *real-time* sekaligus menjadi pusat distribusi berkas aplikasi ujian (Exambrowser Proktor & Client, VHD Semi-Daring, Oracle VirtualBox, dan aplikasi pendukung lainnya).

---

## ✨ Fitur Utama

| Fitur | Deskripsi |
|---|---|
| 🔄 **Live Pusmendik API Proxy** | Mengambil data statistik resmi Pusmendik secara *real-time* dengan sistem caching cerdas untuk menjaga performa web tetap cepat dan andal. |
| 🎯 **Filter Dinamis Wilayah & Jenjang** | Rekapitulasi otomatis untuk kartu ringkasan saat memilih Provinsi tertentu atau Jenjang Pendidikan (SD, SMP, SMA, SMK). |
| 📊 **Visualisasi Statistik Interaktif** | Grafik garis tren pendaftar harian/kumulatif, grafik batang moda pelaksanaan, serta diagram donat kesiapan TIK berbasis Chart.js. |
| 📁 **Katalog Berkas Terpusat** | Pusat unduhan aplikasi resmi dan berkas pendukung ujian yang terorganisir untuk mempermudah proktor serta siswa. |
| ⚙️ **Panel Pengelola Sumber Unduhan** | Pengaturan berkas unduhan fleksibel untuk admin (input manual, tautan cloud drive, atau integrasi storage server). |
| 🐳 **Siap Deploy Docker** | Terisolasi dan siap dijalankan di environment produksi menggunakan Docker Compose. |

---

## 🛠️ Tech Stack

- **Backend:** Node.js, Express.js, Axios Proxy
- **Frontend:** HTML5, CSS3, Vanilla JavaScript (ES6+), FontAwesome
- **Data Visualization:** Chart.js
- **Containerization:** Docker & Docker Compose

---

## 🚀 Cara Menjalankan

### Menggunakan Docker Compose (Produksi)
```bash
# Build dan jalankan container
docker compose up -d --build

# Periksa status service
docker compose ps
```

### Menggunakan Node.js (Lokal)
```bash
# Pasang dependensi
npm install

# Jalankan aplikasi
npm start
```

---

## 👨‍💻 Pengembang

* **Author:** **Sheva Ramdhani**
* **Institusi:** SMK Negeri 1 Pungging — Teknik Komputer dan Jaringan (TKJ)
* **LinkedIn:** [linkedin.com/in/sheva-ramdhani](https://www.linkedin.com/in/sheva-ramdhani-6b46a9331)

---

<div align="center">
  <sub>Copyright © 2026 SMKN 1 Pungging. All Rights Reserved. • Created by <b>Sheva Ramdhani</b></sub>
</div>
