<div align="center">

# 🏛️ TKA Pusmendik Portal Mirror & CBT Hub
**Infrastruktur Mirroring & Monitoring Real-Time Tes Kemampuan Akademik (TKA) 2026**  
*SMK Negeri 1 Pungging — Bengkel Teknik Komputer & Jaringan (TKJ)*

---

[![Node.js](https://img.shields.io/badge/Node.js-v18+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![Express.js](https://img.shields.io/badge/Express.js-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com)
[![ZeroTier](https://img.shields.io/badge/ZeroTier-SD--WAN-FFB441?style=flat-square&logo=zerotier&logoColor=black)](https://www.zerotier.com)
[![Chart.js](https://img.shields.io/badge/Chart.js-v4.4-FF6384?style=flat-square&logo=chartdotjs&logoColor=white)](https://www.chartjs.org)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)

<br/>

[📖 Gambaran Umum](#-gambaran-umum) •
[✨ Fitur Utama](#-fitur-utama) •
[📐 Arsitektur](#-arsitektur-sistem) •
[🚀 Cara Menjalankan](#-cara-menjalankan) •
[🔐 Akses Admin](#-akses-panel-admin) •
[👨‍💻 Pengembang](#-pengembang)

---

</div>

## 📖 Gambaran Umum

**TKA Pusmendik Portal Mirror** adalah platform web terpadu yang dibangun untuk mendukung persiapan dan kelancaran pelaksanaan **Tes Kemampuan Akademik (TKA) 2026** di **SMK Negeri 1 Pungging**.

Platform ini menggabungkan antarmuka resmi Pusmendik Kemendikdasmen RI dengan sistem **Reverse Proxy Cerdas**, **Visualisasi Data Real-Time**, serta **Pusat Distribusi Berkas Ujian (Exambrowser, VHD Semi-Daring, Client CBT)** berbasis jaringan lokal (LAN) dan ZeroTier SD-WAN.

---

## ✨ Fitur Utama

| Fitur | Deskripsi |
|---|---|
| 🔄 **Live Pusmendik API Proxy** | Mengambil dan melakukan *caching* data endpoint Pusmendik secara otomatis tanpa kendala CORS. |
| 🎯 **Filter Dinamis Wilayah & Jenjang** | Agregasi data instan untuk 4 kartu ringkasan saat memilih Provinsi (Jatim, Jabar, dll.) atau Jenjang (SD, SMP, SMA, SMK). |
| 📊 **Visualisasi Interaktif (Chart.js)** | Grafik garis tren pendaftar harian/kumulatif, grafik batang status moda pelaksanaan, dan diagram donat kesiapan TIK. |
| 📁 **3-in-1 File Source Manager** | Kelola unduhan via: Input Manual, Auto-Detect Google Drive/SFTPGo, atau Pindai Folder Linux Server (`/opt/labserver/storage`). |
| 🌐 **Hybrid Network Routing** | Deteksi otomatis IP lokal (`192.168.8.x`) vs remote SD-WAN ZeroTier (`192.168.195.x`). |
| 🐳 **Dockerized Production** | Siap dideploy dengan Docker Compose lengkap dengan *Health Check* dan *Persistent Volume*. |

---

## 📐 Arsitektur Sistem

```mermaid
graph LR
    subgraph Klien
        A[Siswa / Klien CBT]
        B[Proktor / Teknisi]
    end

    subgraph Jaringan
        LAN[LAN Lab TKJ 192.168.8.x]
        ZT[ZeroTier SD-WAN 192.168.195.x]
    end

    subgraph Docker Container
        EX[Express.js Proxy & API :8085]
        CACHE[(In-Memory Cache)]
    end

    subgraph Server Storage
        STOR[/opt/labserver/storage/TKA]
        SFTP[/srv/sftpgo/data]
    end

    subgraph Cloud
        PUSMENDIK[API Pusmendik Pusat]
    end

    A & B --> LAN & ZT
    LAN & ZT --> EX
    EX <--> CACHE
    EX -->|Proxy Fetch| PUSMENDIK
    EX <--> STOR & SFTP
```

---

## 🚀 Cara Menjalankan

### Opsi 1: Menggunakan Docker Compose (Produksi di Server)

```bash
# 1. Masuk ke direktori proyek di server
cd /opt/labserver/tka-portal

# 2. Jalankan container di background
docker compose up -d --build

# 3. Cek status container
docker compose ps
```

> **Akses Web:**
> - **Lokal Lab:** `http://192.168.8.3:8085`
> - **ZeroTier:** `http://192.168.195.219:8085`

---

### Opsi 2: Menjalankan Secara Lokal (Node.js)

```bash
# 1. Pasang dependensi
npm install

# 2. Jalankan aplikasi
npm start
```

> **Akses Web:** `http://localhost:8085`

---

## 🔐 Akses Panel Admin

Untuk mengelola katalog berkas unduhan, buka URL:  
👉 **`http://<IP-SERVER>:8085/#admin`** *(atau klik ikon gembok di footer)*

<details>
<summary><b>Lihat Kredensial Default & Fitur Panel (Klik untuk membuka)</b></summary>

<br/>

| Parameter | Nilai Default | Keterangan |
|---|---|---|
| **Username** | `servertkj` | Dapat diubah di `.env` / `docker-compose.yml` |
| **Password** | `ServerTkj26#!` | Dapat diubah di `.env` / `docker-compose.yml` |

#### Fitur di dalam Panel Admin:
1. **Tambah Manual:** Daftarkan aplikasi dengan ukuran dan link download direct.
2. **Deteksi Link / Drive:** Tempel link Google Drive untuk otomatis diubah menjadi direct download link.
3. **Pindai Folder Server:** Pilih preset folder server seperti `/opt/labserver/storage/TKA`, `/srv/sftpgo/data`, dll.

</details>

---

## 📂 Struktur Direktori

<details>
<summary><b>Lihat Struktur File Proyek (Klik untuk membuka)</b></summary>

<br/>

```plaintext
├── config.json               # Konfigurasi persisten link unduhan & jaringan
├── docker-compose.yml        # Konfigurasi orkestrasi Docker
├── Dockerfile                # Image build environment Node.js alpine
├── package.json              # Daftar dependensi & npm scripts
├── server.js                 # Backend Express.js, proxy API, & controller
├── public/
│   ├── index.html            # UI Web Portal, Statistik, & Modal Admin
│   ├── app.js                # Logika filter data, Chart.js, & modal handler
│   ├── style.css             # Tema resmi Clean White UI & responsive CSS
│   └── downloads/            # Direktori penyimpanan berkas unduhan lokal
└── README.md                 # Dokumentasi proyek
```

</details>

---

## 👨‍💻 Pengembang

| Profil | Keterangan |
|---|---|
| **Author** | **Sheva Ramdhani** |
| **Instansi** | SMK Negeri 1 Pungging — Teknik Komputer dan Jaringan |
| **LinkedIn** | [linkedin.com/in/sheva-ramdhani](https://www.linkedin.com/in/sheva-ramdhani-6b46a9331) |

---

<div align="center">
  <sub>Copyright © 2026 SMKN 1 Pungging. All Rights Reserved. • Created by <b>Sheva Ramdhani</b></sub>
</div>
