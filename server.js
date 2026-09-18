const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8085;
const CONFIG_PATH = path.join(__dirname, 'config.json');
const DOWNLOADS_DIR = path.join(__dirname, 'public', 'downloads');

// Ensure downloads directory exists
if (!fs.existsSync(DOWNLOADS_DIR)) {
  fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });
}

// Helper to read config
function getAppConfig() {
  try {
    const raw = fs.readFileSync(CONFIG_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    return {
      school: { name: 'SMKN 1 PUNGGING' },
      network: { localIp: '192.168.8.3', zeroTierIp: '192.168.195.219', sftpgoPort: '8081', tkaMirrorPort: '8085' },
      sftpgo: { localBaseUrl: 'http://192.168.8.3:8081/web/client/pubshares', downloads: [] },
      tkaApi: { baseUrl: 'https://tka.kemendikdasmen.go.id', cacheDurationSeconds: 1800 }
    };
  }
}

// Helper to save config
function saveAppConfig(newConfig) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(newConfig, null, 2), 'utf8');
}

let config = getAppConfig();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/downloads', express.static(DOWNLOADS_DIR));

// Healthcheck endpoint for Docker
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), uptime: process.uptime() });
});

// In-memory cache for API responses
const apiCache = {};

// Fallback sample snapshot data
const fallbackData = {
  peserta: {
    total: { jm_sek_daftar: "1.250", jm_pes_t: "18.400", jm_daftar_t: "15.900", jm_tidak: "2.500" },
    tanggal: {
      label: ["01/09", "03/09", "05/09", "07/09", "09/09", "11/09", "13/09", "15/09"],
      data: [180, 220, 340, 410, 260, 520, 480, 700],
      kumulatif: [180, 400, 740, 1150, 1410, 1930, 2410, 3110]
    },
    rekap: [
      { nm_jenjang: "SD/MI", jm_sek_daftar: 420, jm_pes_t: 5100, jm_daftar_t: 4700, jm_tidak: 400, daftar_ps: "92%" },
      { nm_jenjang: "SMP/MTs", jm_sek_daftar: 310, jm_pes_t: 4800, jm_daftar_t: 4300, jm_tidak: 500, daftar_ps: "90%" },
      { nm_jenjang: "SMA/MA", jm_sek_daftar: 260, jm_pes_t: 4600, jm_daftar_t: 3900, jm_tidak: 700, daftar_ps: "85%" },
      { nm_jenjang: "SMK", jm_sek_daftar: 230, jm_pes_t: 3400, jm_daftar_t: 2700, jm_tidak: 700, daftar_ps: "79%" },
      { nm_jenjang: "Paket A/B/C", jm_sek_daftar: 30, jm_pes_t: 500, jm_daftar_t: 300, jm_tidak: 200, daftar_ps: "60%" }
    ]
  },
  chart: {
    labels: ["01/09", "03/09", "05/09", "07/09", "09/09", "11/09", "13/09", "15/09"],
    harian: [180, 220, 340, 410, 260, 520, 480, 700],
    kumulatif: [180, 400, 740, 1150, 1410, 1930, 2410, 3110]
  },
  pie: {
    charts: {
      status: [
        { title: "SD/MI", data: [74, 21, 5] },
        { title: "SMP/MTs", data: [81, 16, 3] },
        { title: "SMA/MA", data: [81, 15, 4] },
        { title: "SMK", data: [74, 22, 4] }
      ]
    }
  },
  wilayah: {
    rekap: [
      { no: 1, title: "Jawa Timur", jm_sek_daftar: 205, jm_pes_t: 3410, jm_daftar_t: 2980, daftar_ps: "87%" },
      { no: 2, title: "Jawa Barat", jm_sek_daftar: 210, jm_pes_t: 3640, jm_daftar_t: 3100, daftar_ps: "85%" },
      { no: 3, title: "Jawa Tengah", jm_sek_daftar: 180, jm_pes_t: 3020, jm_daftar_t: 2650, daftar_ps: "88%" },
      { no: 4, title: "DKI Jakarta", jm_sek_daftar: 95, jm_pes_t: 1680, jm_daftar_t: 1520, daftar_ps: "90%" },
      { no: 5, title: "Sumatera Utara", jm_sek_daftar: 90, jm_pes_t: 1240, jm_daftar_t: 1010, daftar_ps: "81%" }
    ]
  }
};

// Helper proxy function to query TKA Pusmendik
async function fetchTkaApi(endpoint, fallbackKey, reqBody = {}) {
  const cacheKey = endpoint + JSON.stringify(reqBody);
  const now = Date.now();
  const ttlMs = (config.tkaApi?.cacheDurationSeconds || 1800) * 1000;

  if (apiCache[cacheKey] && (now - apiCache[cacheKey].timestamp < ttlMs)) {
    return { data: apiCache[cacheKey].data, source: 'cache' };
  }

  try {
    const targetUrl = `${config.tkaApi?.baseUrl || 'https://tka.kemendikdasmen.go.id'}${endpoint}`;
    const response = await axios.post(targetUrl, reqBody, {
      timeout: 6000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });

    if (response.data && typeof response.data === 'object') {
      apiCache[cacheKey] = { data: response.data, timestamp: now };
      return { data: response.data, source: 'live' };
    }
  } catch (err) {
    console.warn(`[Proxy Warning] Gagal fetch ${endpoint}: ${err.message}. Menggunakan data snapshot.`);
  }

  const fallback = fallbackData[fallbackKey] || {};
  return { data: fallback, source: 'fallback' };
}

// ----------------------------------------------------
// PUBLIC API ROUTES
// ----------------------------------------------------

// 1. App Configuration & Downloads
app.get('/api/config', (req, res) => {
  config = getAppConfig();
  const clientHost = req.get('host') || '';
  const isZeroTier = clientHost.includes('192.168.195.') || req.ip.includes('192.168.195.');
  
  const sftpBase = isZeroTier 
    ? config.sftpgo.zeroTierBaseUrl 
    : config.sftpgo.localBaseUrl;

  const downloadsWithUrls = (config.sftpgo.downloads || []).map(item => {
    let finalUrl = item.shareUrl;
    if (!finalUrl || finalUrl === '#') {
      if (item.filename && fs.existsSync(path.join(DOWNLOADS_DIR, item.filename))) {
        finalUrl = `/downloads/${item.filename}`;
      } else {
        finalUrl = `${sftpBase}/${item.sftpShareCode || item.id}`;
      }
    }
    return {
      ...item,
      downloadUrl: finalUrl
    };
  });

  res.json({
    school: config.school,
    network: config.network,
    sftpgoBase: sftpBase,
    downloads: downloadsWithUrls,
    isZeroTier: isZeroTier
  });
});

// 2. TKA Statistik API Proxies
app.all(['/api/v1/statistik/peserta', '/api/statistik/peserta'], async (req, res) => {
  const result = await fetchTkaApi('/api/v1/statistik/peserta', 'peserta', req.body);
  res.json(result.data);
});

app.all(['/api/v1/chart', '/api/statistik/chart'], async (req, res) => {
  const result = await fetchTkaApi('/api/v1/chart', 'chart', req.body);
  res.json(result.data);
});

app.all(['/api/v1/statistik/jenjang', '/api/statistik/jenjang'], async (req, res) => {
  const result = await fetchTkaApi('/api/v1/statistik/jenjang', 'jenjang', req.body);
  res.json(result.data);
});

app.all(['/api/v1/pie', '/api/statistik/pie'], async (req, res) => {
  const result = await fetchTkaApi('/api/v1/pie', 'pie', req.body);
  res.json(result.data);
});

app.all(['/api/v1/provinsi', '/api/provinsi'], async (req, res) => {
  const result = await fetchTkaApi('/api/v1/provinsi', 'provinsi', req.body);
  res.json(result.data);
});

app.all(['/api/v1/statistik/wilayah', '/api/statistik/wilayah'], async (req, res) => {
  const result = await fetchTkaApi('/api/v1/statistik/wilayah', 'wilayah', req.body);
  res.json(result.data);
});

// ----------------------------------------------------
// ADMIN API ROUTES (DYNAMIC SOURCE & DETECT APK/FILE)
// ----------------------------------------------------

// Simple Admin Auth Check
const ADMIN_USER = process.env.ADMIN_USER || 'servertkj';
const ADMIN_PASS = process.env.ADMIN_PASS || 'ServerTkj26#!';

// Direct /admin route redirect
app.get(['/admin', '/login'], (req, res) => {
  res.redirect('/#admin');
});

app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    res.json({ success: true, token: 'token-adm-tkj-2026', user: username });
  } else {
    res.status(401).json({ success: false, message: 'Username atau Password salah!' });
  }
});

// Detect File / APK from Google Drive, URL, or Local Linux Server Directory
app.post('/api/admin/detect', async (req, res) => {
  const { targetUrl } = req.body;
  if (!targetUrl || typeof targetUrl !== 'string') {
    return res.status(400).json({ success: false, message: 'URL atau Path file wajib diisi.' });
  }

  const cleanUrl = targetUrl.trim();
  let filename = path.basename(cleanUrl.split('?')[0]);
  let ext = path.extname(filename).toLowerCase();
  let fileSizeHuman = 'Cloud Link';
  let isReachable = true;
  let finalDownloadUrl = cleanUrl;
  let isGoogleDrive = false;

  // --- A. GOOGLE DRIVE LINK DETECTION & CONVERSION ---
  if (cleanUrl.includes('drive.google.com') || cleanUrl.includes('docs.google.com')) {
    isGoogleDrive = true;
    fileSizeHuman = 'Google Drive Cloud';

    // 1. File ID match
    let fileId = null;
    const fileIdMatch = cleanUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
                        cleanUrl.match(/id=([a-zA-Z0-9_-]+)/) ||
                        cleanUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (fileIdMatch && fileIdMatch[1]) {
      fileId = fileIdMatch[1];
      finalDownloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
      if (!filename || filename === 'view' || filename === 'sharing') {
        filename = `Berkas_TKA_${fileId.substring(0, 6)}`;
      }
    }

    // 2. Folder link match
    const folderMatch = cleanUrl.match(/\/folders\/([a-zA-Z0-9_-]+)/);
    if (folderMatch) {
      finalDownloadUrl = cleanUrl;
      filename = 'Folder_Google_Drive_TKA';
      fileSizeHuman = 'Google Drive Folder';
    }
  }

  // --- B. LOCAL LINUX SERVER DIRECTORY DETECTION ---
  let localFoundPath = null;
  const possiblePaths = [
    cleanUrl,
    path.join(DOWNLOADS_DIR, path.basename(cleanUrl)),
    path.join('/opt/labserver/downloads', path.basename(cleanUrl)),
    path.join(__dirname, cleanUrl)
  ];

  for (const p of possiblePaths) {
    if (typeof p === 'string' && fs.existsSync(p) && fs.statSync(p).isFile()) {
      localFoundPath = p;
      break;
    }
  }

  if (localFoundPath) {
    const stats = fs.statSync(localFoundPath);
    filename = path.basename(localFoundPath);
    ext = path.extname(filename).toLowerCase();
    const mb = (stats.size / (1024 * 1024)).toFixed(1);
    fileSizeHuman = stats.size > 1024 * 1024 * 1024 
      ? (stats.size / (1024 * 1024 * 1024)).toFixed(2) + ' GB'
      : (mb + ' MB');
    finalDownloadUrl = `/downloads/${filename}`;
  } 
  // --- C. HTTP / HTTPS HEAD CHECK ---
  else if (!isGoogleDrive && (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://'))) {
    try {
      const headRes = await axios.head(cleanUrl, { timeout: 4000 });
      const cl = headRes.headers['content-length'];
      if (cl) {
        const bytes = parseInt(cl, 10);
        fileSizeHuman = bytes > 1024 * 1024 * 1024 
          ? (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB'
          : ((bytes / (1024 * 1024)).toFixed(1) + ' MB');
      }
      const cd = headRes.headers['content-disposition'];
      if (cd && cd.includes('filename=')) {
        const match = cd.match(/filename="?([^";]+)"?/);
        if (match && match[1]) {
          filename = match[1];
          ext = path.extname(filename).toLowerCase();
        }
      }
    } catch (e) {
      fileSizeHuman = '~ Terhubung ke Cloud/SFTP';
    }
  }

  // Smart Category & Name suggestions
  let suggestedName = filename.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
  let suggestedCategory = 'pendukung';
  let suggestedBadge = 'Aplikasi';
  let isRequired = false;

  const lowerName = filename.toLowerCase();
  if (lowerName.includes('exambrowser') || lowerName.includes('exam')) {
    suggestedCategory = 'utama';
    if (lowerName.includes('admin') || lowerName.includes('proktor')) {
      suggestedName = 'Exambrowser Admin / Proktor Browser';
      suggestedBadge = 'Khusus Proktor';
    } else if (lowerName.includes('32') || lowerName.includes('x86')) {
      suggestedName = 'Exambrowser Client 32-Bit (Windows)';
      suggestedBadge = 'Alternatif (x86)';
      isRequired = true;
    } else {
      suggestedName = 'Exambrowser Client 64-Bit (Windows)';
      suggestedBadge = 'Wajib - Peserta (x64)';
      isRequired = true;
    }
  } else if (lowerName.includes('vhd') || lowerName.includes('virtual') || lowerName.includes('server')) {
    suggestedCategory = 'server';
    suggestedName = suggestedName || 'Virtual Hard Disk (VHD) TKA 2026';
    suggestedBadge = 'Semi-Daring Lab';
  } else if (lowerName.includes('virtualbox')) {
    suggestedCategory = 'pendukung';
    suggestedName = 'Oracle VM VirtualBox 7.x';
    suggestedBadge = 'Server Engine';
  } else if (lowerName.includes('anydesk')) {
    suggestedCategory = 'pendukung';
    suggestedName = 'AnyDesk Remote Lab Support';
    suggestedBadge = 'Remote Support';
  } else if (lowerName.includes('winrar') || lowerName.includes('7z')) {
    suggestedCategory = 'pendukung';
    suggestedName = 'WinRAR / 7-Zip Ekstraktor';
    suggestedBadge = 'Ekstraktor';
  } else if (lowerName.includes('pdf') || lowerName.includes('pos') || lowerName.includes('juknis')) {
    suggestedCategory = 'pendukung';
    suggestedName = suggestedName || 'Dokumen POS & Juknis TKA 2026';
    suggestedBadge = 'Dokumen Resmi';
  }

  res.json({
    success: true,
    detected: {
      isReachable,
      isGoogleDrive,
      isLocalServer: !!localFoundPath,
      filename: filename || 'berkas_tka',
      extension: ext || '',
      fileSize: fileSizeHuman,
      suggestedName: suggestedName,
      suggestedCategory: suggestedCategory,
      suggestedBadge: suggestedBadge,
      required: isRequired,
      version: 'v26.0628',
      shareUrl: finalDownloadUrl
    }
  });
});

// List all files physically present in custom Linux/Windows server folder
app.get('/api/admin/server-files', (req, res) => {
  try {
    let customDir = req.query.dir ? req.query.dir.replace(/[#"']+$/, '').trim() : DOWNLOADS_DIR;
    
    // Resolve path if relative
    let targetDir = customDir;
    if (!path.isAbsolute(targetDir)) {
      targetDir = path.resolve(__dirname, targetDir);
    }

    if (!fs.existsSync(targetDir)) {
      return res.json({
        success: false,
        directory: customDir,
        message: `Direktori "${customDir}" tidak ditemukan di sistem server. Silakan periksa kembali path direktori.`,
        files: []
      });
    }

    const stat = fs.statSync(targetDir);
    if (!stat.isDirectory()) {
      return res.json({
        success: false,
        directory: customDir,
        message: `Path "${customDir}" bukan merupakan folder/direktori.`,
        files: []
      });
    }

    const items = fs.readdirSync(targetDir);
    const files = [];

    items.forEach(file => {
      const fullPath = path.join(targetDir, file);
      try {
        if (fs.existsSync(fullPath)) {
          const stats = fs.statSync(fullPath);
          if (stats.isFile()) {
            const mb = (stats.size / (1024 * 1024)).toFixed(1);
            const sizeHuman = stats.size > 1024 * 1024 * 1024 
              ? (stats.size / (1024 * 1024 * 1024)).toFixed(2) + ' GB'
              : (mb + ' MB');
            
            // If it's inside default DOWNLOADS_DIR, use /downloads/file, otherwise /api/download-file
            const isDefaultDownloads = path.resolve(targetDir) === path.resolve(DOWNLOADS_DIR);
            const downloadUrl = isDefaultDownloads 
              ? `/downloads/${encodeURIComponent(file)}`
              : `/api/download-file?path=${encodeURIComponent(fullPath)}`;

            files.push({
              filename: file,
              fullPath: fullPath,
              size: sizeHuman,
              sizeBytes: stats.size,
              mtime: stats.mtime,
              downloadUrl: downloadUrl
            });
          }
        }
      } catch (e) {}
    });

    res.json({
      success: true,
      directory: customDir,
      resolvedDirectory: targetDir,
      files
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal membaca direktori server: ' + err.message });
  }
});

// Generic Stream Downloader for Custom Server Directories
app.get('/api/download-file', (req, res) => {
  const filePath = req.query.path;
  if (!filePath || !fs.existsSync(filePath)) {
    return res.status(404).send('Berkas tidak ditemukan pada direktori server.');
  }
  res.download(filePath, path.basename(filePath));
});

// Save or Update Download Item
app.post('/api/admin/downloads', (req, res) => {
  const item = req.body;
  if (!item || !item.name || !item.shareUrl) {
    return res.status(400).json({ success: false, message: 'Nama aplikasi dan Link share wajib diisi.' });
  }

  config = getAppConfig();
  if (!config.sftpgo.downloads) {
    config.sftpgo.downloads = [];
  }

  const existingIndex = config.sftpgo.downloads.findIndex(d => d.id === item.id);
  const newItem = {
    id: item.id || `app-${Date.now()}`,
    name: item.name,
    category: item.category || 'pendukung',
    required: !!item.required,
    badge: item.badge || 'Aplikasi',
    version: item.version || 'v26.1',
    size: item.size || '~ MB',
    filename: item.filename || 'installer.exe',
    shareUrl: item.shareUrl,
    description: item.description || `Unduh ${item.name} untuk pelaksanaan ujian TKA.`
  };

  if (existingIndex >= 0) {
    config.sftpgo.downloads[existingIndex] = newItem;
  } else {
    config.sftpgo.downloads.push(newItem);
  }

  saveAppConfig(config);
  res.json({ success: true, message: 'Berkas unduhan berhasil disimpan dan ditambahkan ke web!', item: newItem });
});

// Delete Download Item
app.delete('/api/admin/downloads/:id', (req, res) => {
  const { id } = req.params;
  config = getAppConfig();
  if (config.sftpgo && config.sftpgo.downloads) {
    config.sftpgo.downloads = config.sftpgo.downloads.filter(d => d.id !== id);
    saveAppConfig(config);
  }
  res.json({ success: true, message: 'Berkas unduhan berhasil dihapus dari web.' });
});

// 3. Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    server: 'servertkj - SMKN 1 Pungging',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// 4. Fallback SPA route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`  TKA Mirror Portal SMKN 1 Pungging (With Admin Panel)`);
  console.log(`  Running on http://0.0.0.0:${PORT}`);
  console.log(`=======================================================`);
});
