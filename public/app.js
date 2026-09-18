/**
 * Clean White Official Theme JavaScript for TKA 2026 - SMKN 1 Pungging
 * Complete Live Pusmendik API Mirror with Sub-tabs, Dynamic Provinsi & Jenjang Filters, Bar & Donut Charts
 */

let allDownloads = [];
let chartHarianInstance = null;
let chartKumulatifInstance = null;
let chartBarPelaksanaInstance = null;
let donutInstances = {};
let activeCategory = 'all';
let activeChartTab = 'pendaftar'; // 'pendaftar' or 'capes'
let activeBarTab = 'status';       // 'status' or 'moda'
let lastPesertaData = null;
let lastChartData = null;

document.addEventListener('DOMContentLoaded', () => {
  initScrollSpy();
  loadConfigAndDownloads();
  loadProvinsiOptions();
  loadStatistikData();
  checkModalAuth();
  
  if (window.location.hash === '#admin') {
    openAdminModal();
  }

  window.addEventListener('hashchange', () => {
    if (window.location.hash === '#admin') {
      openAdminModal();
    }
  });
});

// ----------------------------------------------------
// 1. SCROLL SPY & SMOOTH NAVIGATION
// ----------------------------------------------------
function initScrollSpy() {
  const navLinks = document.querySelectorAll('.main-nav .nav-link');
  const sections = document.querySelectorAll('section[id]');

  window.addEventListener('scroll', () => {
    let current = '';
    const scrollPos = window.pageYOffset + 100;

    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;
      if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  });

  const navToggle = document.getElementById('navToggle');
  const mainNav = document.getElementById('mainNav');
  if (navToggle && mainNav) {
    navToggle.addEventListener('click', () => {
      mainNav.classList.toggle('show');
    });
    
    navLinks.forEach(l => {
      l.addEventListener('click', () => mainNav.classList.remove('show'));
    });
  }
}

// ----------------------------------------------------
// 2. LOAD DOWNLOADS & FILTER
// ----------------------------------------------------
async function loadConfigAndDownloads() {
  try {
    const res = await fetch('/api/config');
    const data = await res.json();
    allDownloads = data.downloads || [];
    updateCategoryCounts();
    renderDownloadItems();
  } catch (err) {
    console.warn('Gagal memuat daftar unduhan:', err);
  }
}

function updateCategoryCounts() {
  const total = allDownloads.length;
  const utama = allDownloads.filter(d => d.category === 'utama').length;
  const server = allDownloads.filter(d => d.category === 'server').length;
  const pendukung = allDownloads.filter(d => d.category === 'pendukung').length;

  const countAll = document.getElementById('countAll');
  const countUtama = document.getElementById('countUtama');
  const countServer = document.getElementById('countServer');
  const countPendukung = document.getElementById('countPendukung');

  if (countAll) countAll.textContent = `(${total})`;
  if (countUtama) countUtama.textContent = `(${utama})`;
  if (countServer) countServer.textContent = `(${server})`;
  if (countPendukung) countPendukung.textContent = `(${pendukung})`;
}

function renderDownloadItems() {
  const container = document.getElementById('downloadsListContainer');
  if (!container) return;

  const query = (document.getElementById('searchDownloadInput')?.value || '').toLowerCase().trim();

  let filtered = allDownloads;

  if (activeCategory !== 'all') {
    filtered = filtered.filter(d => d.category === activeCategory);
  }

  if (query) {
    filtered = filtered.filter(d => 
      (d.name && d.name.toLowerCase().includes(query)) ||
      (d.filename && d.filename.toLowerCase().includes(query)) ||
      (d.description && d.description.toLowerCase().includes(query))
    );
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="white-card text-center" style="padding: 30px;">
        <i class="fa-solid fa-folder-open" style="font-size: 2rem; color: #cbd5e1; margin-bottom: 10px;"></i>
        <p class="text-muted">Tidak ditemukan berkas yang sesuai.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(item => {
    let icon = 'fa-file-lines';
    let iconClass = 'is-file';
    const fn = (item.filename || '').toLowerCase();
    
    if (fn.endsWith('.exe') || fn.endsWith('.msi')) {
      icon = 'fa-window-maximize';
      iconClass = 'is-exe';
    } else if (fn.endsWith('.apk')) {
      icon = 'fa-android';
      iconClass = 'is-apk';
    } else if (fn.endsWith('.rar') || fn.endsWith('.zip') || fn.endsWith('.7z') || fn.endsWith('.tar') || fn.endsWith('.gz') || fn.endsWith('.tar.gz')) {
      icon = 'fa-file-zipper';
      iconClass = 'is-rar';
    } else if (fn.endsWith('.vhd') || fn.endsWith('.vhdx') || fn.endsWith('.ova') || fn.endsWith('.ovf') || fn.endsWith('.iso') || fn.endsWith('.img')) {
      icon = 'fa-server';
      iconClass = 'is-vhd';
    } else if (fn.endsWith('.pdf')) {
      icon = 'fa-file-pdf';
      iconClass = 'is-pdf';
    } else if (fn.endsWith('.doc') || fn.endsWith('.docx')) {
      icon = 'fa-file-word';
      iconClass = 'is-doc';
    } else if (fn.endsWith('.xls') || fn.endsWith('.xlsx') || fn.endsWith('.csv')) {
      icon = 'fa-file-excel';
      iconClass = 'is-xls';
    }

    const catLabel = item.category === 'utama' 
      ? 'Aplikasi Utama TKA' 
      : (item.category === 'server' ? 'Server Semi-Daring' : 'Aplikasi Pendukung');

    return `
      <div class="download-item-card">
        <div class="dl-item-left">
          <div class="dl-file-icon ${iconClass}">
            <i class="fa-solid ${icon}"></i>
          </div>
          <div class="dl-item-details">
            <h4>${item.name}</h4>
            <div class="dl-item-meta">
              <span><i class="fa-regular fa-folder"></i> ${catLabel}</span>
              <span><i class="fa-solid fa-hard-drive"></i> ${item.size}</span>
              <span><i class="fa-regular fa-file"></i> ${item.filename}</span>
            </div>
          </div>
        </div>
        <div>
          <a href="${item.downloadUrl || '#'}" class="btn-download-action" download target="_blank">
            <i class="fa-solid fa-download"></i> Unduh
          </a>
        </div>
      </div>
    `;
  }).join('');
}

function handleSearchDownloads() {
  renderDownloadItems();
}

function filterCategoryBySidebar(cat, elem) {
  activeCategory = cat;
  document.querySelectorAll('.cat-list a').forEach(a => a.classList.remove('active'));
  if (elem) elem.classList.add('active');
  renderDownloadItems();
}

function goToDownloadCategory(cat) {
  activeCategory = cat;
  document.querySelectorAll('.cat-list a').forEach(a => {
    if (a.getAttribute('data-cat') === cat) {
      a.classList.add('active');
    } else {
      a.classList.remove('active');
    }
  });
  renderDownloadItems();
  const unduhanSection = document.getElementById('unduhan');
  if (unduhanSection) {
    unduhanSection.scrollIntoView({ behavior: 'smooth' });
  }
}

// ----------------------------------------------------
// 3. LOAD STATISTIK & DYNAMIC PROVINSI DARI PUSMENDIK
// ----------------------------------------------------
async function loadProvinsiOptions() {
  const select = document.getElementById('filterWilayahSelect');
  if (!select) return;

  try {
    const res = await fetch('/api/v1/provinsi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    const json = await res.json();
    if (json && json.rows && Array.isArray(json.rows)) {
      select.innerHTML = json.rows.map(r => `
        <option value="${r.key}" ${r.key === 'X' ? 'selected' : ''}>${r.value}</option>
      `).join('');
    }
  } catch (err) {
    console.warn('Gagal load list provinsi:', err);
  }
}

let lastWilayahData = null;

async function loadStatistikData() {
  const selWilayah = document.getElementById('filterWilayahSelect')?.value || 'X';
  const selJenjang = document.getElementById('filterJenjangSelect')?.value || '';

  const payload = {
    kd_prop: selWilayah,
    kd_jenjang: selJenjang
  };

  try {
    // 1. Wilayah (Tabel Rekap Provinsi) - fetch first so summary cards can use it
    const wilRes = await fetch('/api/v1/statistik/wilayah', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const wilData = await wilRes.json();
    if (wilData) {
      lastWilayahData = wilData;
      renderWilayahTable(wilData, selWilayah);
    }

    // 2. Peserta & Summary & Line Charts
    const pesertaRes = await fetch('/api/v1/statistik/peserta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const pesertaData = await pesertaRes.json();
    if (pesertaData) {
      lastPesertaData = pesertaData;
      updateSummaryCards(pesertaData, wilData, selWilayah, selJenjang);
      renderRekapPesertaTable(pesertaData, selJenjang);
      renderMainCharts();
    }

    // 3. Jenjang Table (Status & Moda Pelaksanaan)
    const jenjangRes = await fetch('/api/v1/statistik/jenjang', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const jenjangData = await jenjangRes.json();
    if (jenjangData) {
      renderStatusModaTables(jenjangData, selJenjang);
    }

    // 4. Bar Chart Pelaksana per Wilayah
    const chartRes = await fetch('/api/v1/chart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const chartData = await chartRes.json();
    if (chartData) {
      lastChartData = chartData;
      renderHorizontalBarChart();
    }

    // 5. Pie / Donut
    const pieRes = await fetch('/api/v1/pie', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const pieData = await pieRes.json();
    if (pieData) {
      renderDonuts(pieData);
    }
  } catch (err) {
    console.error('Error load statistik:', err);
  }
}

function parseNum(val) {
  if (!val) return 0;
  if (typeof val === 'number') return val;
  const clean = val.toString().replace(/\./g, '').replace(/,/g, '').trim();
  return parseInt(clean, 10) || 0;
}

function formatID(num) {
  return Number(num || 0).toLocaleString('id-ID');
}

function updateSummaryCards(pesertaData, wilData, selWilayah, selJenjang) {
  const sat = document.getElementById('statSatuan');
  const cal = document.getElementById('statCalon');
  const len = document.getElementById('statLengkap');
  const bel = document.getElementById('statBelum');

  let vSat = 35626;
  let vCal = 4149786;
  let vLen = 3219785;
  let vBel = 930001;

  // Case A: A specific Provinsi is selected (not 'X' and not '')
  if (selWilayah && selWilayah !== 'X' && selWilayah !== '' && wilData && Array.isArray(wilData.rekap)) {
    const pRow = wilData.rekap.find(r => r.kd_prop === selWilayah);
    if (pRow) {
      vSat = parseNum(pRow.jm_sek_daftar) || parseNum(pRow.jm_sekolah);
      vCal = parseNum(pRow.jm_pes_t);
      vLen = parseNum(pRow.jm_daftar_t);
      vBel = Math.max(0, vCal - vLen);

      // If a specific jenjang is also selected, apply jenjang ratio to province
      if (selJenjang && pesertaData && Array.isArray(pesertaData.rekap)) {
        const jRows = pesertaData.rekap.filter(r => r.nm_jenjang && r.nm_jenjang.toUpperCase().includes(selJenjang.toUpperCase()));
        if (jRows.length > 0) {
          const sumJenjangCal = jRows.reduce((acc, r) => acc + parseNum(r.jm_pes_t), 0);
          const ratio = sumJenjangCal / 4149786;
          vSat = Math.round(vSat * Math.max(0.1, ratio));
          vCal = Math.round(vCal * ratio);
          vLen = Math.round(vLen * ratio);
          vBel = Math.max(0, vCal - vLen);
        }
      }
    }
  }
  // Case B: Nasional, but a specific Jenjang is selected (SMK, SMA, SMP, SD, Paket, SLB)
  else if (selJenjang && pesertaData && Array.isArray(pesertaData.rekap)) {
    const target = selJenjang.toUpperCase();
    const matched = pesertaData.rekap.filter(r => {
      const nm = (r.nm_jenjang || '').toUpperCase();
      const kel = (r.nm_kelompok || '').toUpperCase();
      return nm.includes(target) || kel.includes(target);
    });

    if (matched.length > 0) {
      vSat = matched.reduce((acc, r) => acc + parseNum(r.jm_sek_daftar), 0);
      vCal = matched.reduce((acc, r) => acc + parseNum(r.jm_pes_t), 0);
      vLen = matched.reduce((acc, r) => acc + parseNum(r.jm_daftar_t), 0);
      vBel = matched.reduce((acc, r) => acc + (parseNum(r.jm_tidak) || Math.max(0, parseNum(r.jm_pes_t) - parseNum(r.jm_daftar_t))), 0);
    }
  }
  // Case C: Grand Total (Nasional & Semua Jenjang)
  else if (pesertaData && pesertaData.total) {
    vSat = parseNum(pesertaData.total.jm_sek_daftar) || 35626;
    vCal = parseNum(pesertaData.total.jm_pes_t) || 4149786;
    vLen = parseNum(pesertaData.total.jm_daftar_t) || 3219785;
    vBel = parseNum(pesertaData.total.jm_tidak) || 930001;
  }

  if (sat) sat.textContent = formatID(vSat);
  if (cal) cal.textContent = formatID(vCal);
  if (len) len.textContent = formatID(vLen);
  if (bel) bel.textContent = formatID(vBel);
}

function switchChartTab(tab) {
  activeChartTab = tab;
  
  const btnCapes = document.getElementById('btnTabCapes');
  const btnPendaftar = document.getElementById('btnTabPendaftar');
  const titleHarian = document.getElementById('titleChartHarian');
  const titleKumulatif = document.getElementById('titleChartKumulatif');

  if (tab === 'capes') {
    if (btnCapes) btnCapes.classList.add('active');
    if (btnPendaftar) btnPendaftar.classList.remove('active');
    if (titleHarian) titleHarian.textContent = 'Grafik Calon Peserta Harian';
    if (titleKumulatif) titleKumulatif.textContent = 'Grafik Calon Peserta Harian (Kumulatif)';
  } else {
    if (btnPendaftar) btnPendaftar.classList.add('active');
    if (btnCapes) btnCapes.classList.remove('active');
    if (titleHarian) titleHarian.textContent = 'Grafik Pendaftar Harian';
    if (titleKumulatif) titleKumulatif.textContent = 'Grafik Pendaftar Harian (Kumulatif)';
  }

  renderMainCharts();
}

function renderMainCharts() {
  if (!lastPesertaData) return;

  const data = lastPesertaData;
  let labels = [];
  let harianData = [];
  let kumulatifData = [];

  if (activeChartTab === 'capes' && data.capes && data.capes.label) {
    labels = data.capes.label;
    harianData = (data.capes.data || []).map(Number);
    kumulatifData = (data.capes.kumulatif || []).map(Number);
  } else if (data.tanggal && data.tanggal.label) {
    labels = data.tanggal.label;
    harianData = (data.tanggal.data || []).map(Number);
    kumulatifData = (data.tanggal.kumulatif || []).map(Number);
  }

  const ctxHarian = document.getElementById('chartHarian');
  if (ctxHarian) {
    if (chartHarianInstance) chartHarianInstance.destroy();
    chartHarianInstance = new Chart(ctxHarian, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: activeChartTab === 'capes' ? 'Calon Peserta' : 'Pendaftar',
          data: harianData,
          borderColor: '#2196F3',
          backgroundColor: 'rgba(33, 150, 243, 0.08)',
          fill: false,
          tension: 0.35,
          pointRadius: 3,
          pointBackgroundColor: '#2196F3'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { color: '#f1f5f9' } },
          x: { 
            grid: { display: false },
            ticks: {
              maxRotation: 45,
              minRotation: 45,
              font: { size: 10 }
            }
          }
        }
      }
    });
  }

  const ctxKumulatif = document.getElementById('chartKumulatif');
  if (ctxKumulatif) {
    if (chartKumulatifInstance) chartKumulatifInstance.destroy();
    chartKumulatifInstance = new Chart(ctxKumulatif, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Total Kumulatif',
          data: kumulatifData,
          borderColor: '#27AE60',
          backgroundColor: 'rgba(39, 174, 96, 0.08)',
          fill: false,
          tension: 0.35,
          pointRadius: 3,
          pointBackgroundColor: '#27AE60'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { color: '#f1f5f9' } },
          x: { 
            grid: { display: false },
            ticks: {
              maxRotation: 45,
              minRotation: 45,
              font: { size: 10 }
            }
          }
        }
      }
    });
  }
}

function renderRekapPesertaTable(data, selJenjang = '') {
  const tbody = document.getElementById('tbodyRekapPeserta');
  if (!tbody) return;

  const list = data.rekap || [];
  if (Array.isArray(list) && list.length > 0) {
    const target = (selJenjang || '').toUpperCase();
    tbody.innerHTML = list.map((row, idx) => {
      const nm = (row.nm_jenjang || '').toUpperCase();
      const kel = (row.nm_kelompok || '').toUpperCase();
      const isMatch = target && (nm.includes(target) || kel.includes(target));
      const rowStyle = isMatch ? 'background: rgba(33, 150, 243, 0.12); font-weight:600;' : '';
      const badge = isMatch ? '<span style="background:#2196F3; color:#fff; font-size:10px; padding:2px 6px; border-radius:4px; margin-left:6px;">Dipilih</span>' : '';

      return `
        <tr style="${rowStyle}">
          <td class="text-center">${idx + 1}</td>
          <td><strong>${row.nm_jenjang || '-'}</strong>${badge}</td>
          <td class="text-right">${row.jm_sek_impor || '0'}</td>
          <td class="text-right">${row.jm_sek_daftar || '0'}</td>
          <td class="text-right">${row.sek_ps || '0%'}</td>
          <td class="text-right">${row.jm_pes_l || '0'}</td>
          <td class="text-right">${row.jm_pes_p || '0'}</td>
          <td class="text-right" style="font-weight:600;">${row.jm_pes_t || '0'}</td>
          <td class="text-right">${row.jm_daftar_l || '0'}</td>
          <td class="text-right">${row.jm_daftar_p || '0'}</td>
          <td class="text-right" style="color:#27AE60; font-weight:600;">${row.jm_daftar_t || '0'}</td>
          <td class="text-right"><strong>${row.daftar_ps || '0%'}</strong></td>
        </tr>
      `;
    }).join('');

    if (data.total) {
      tbody.innerHTML += `
        <tr style="background:#f1f5f9; font-weight:700;">
          <td colspan="2" class="text-center">TOTAL NASIONAL</td>
          <td class="text-right">${data.total.jm_sek_impor || '-'}</td>
          <td class="text-right">${data.total.jm_sek_daftar || '-'}</td>
          <td class="text-right">-</td>
          <td class="text-right">${data.total.jm_pes_l || '-'}</td>
          <td class="text-right">${data.total.jm_pes_p || '-'}</td>
          <td class="text-right">${data.total.jm_pes_t || '-'}</td>
          <td class="text-right">${data.total.jm_daftar_l || '-'}</td>
          <td class="text-right">${data.total.jm_daftar_p || '-'}</td>
          <td class="text-right" style="color:#27AE60;">${data.total.jm_daftar_t || '-'}</td>
          <td class="text-right">-</td>
        </tr>
      `;
    }
  }
}

function switchBarChart(type) {
  activeBarTab = type;
  const btnStatus = document.getElementById('btnBarStatus');
  const btnModa = document.getElementById('btnBarModa');

  if (type === 'status') {
    if (btnStatus) btnStatus.classList.add('active');
    if (btnModa) btnModa.classList.remove('active');
  } else {
    if (btnModa) btnModa.classList.add('active');
    if (btnStatus) btnStatus.classList.remove('active');
  }

  renderHorizontalBarChart();
}

function renderHorizontalBarChart() {
  if (!lastChartData || !lastChartData.charts) return;

  const ctx = document.getElementById('chartBarPelaksana');
  if (!ctx) return;

  if (chartBarPelaksanaInstance) chartBarPelaksanaInstance.destroy();

  const labels = lastChartData.wilayah || [];
  const chartObj = lastChartData.charts[activeBarTab] || {};

  const dataset1Label = activeBarTab === 'status' ? 'Mandiri' : 'Online';
  const dataset2Label = activeBarTab === 'status' ? 'Menumpang' : 'Semi Online';
  const dataset3Label = 'Belum Ditentukan';

  chartBarPelaksanaInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels.slice(0, 10), // Top 10 provinces
      datasets: [
        {
          label: dataset1Label,
          data: (chartObj.jm_1 || []).slice(0, 10),
          backgroundColor: '#0abb87'
        },
        {
          label: dataset2Label,
          data: (chartObj.jm_2 || []).slice(0, 10),
          backgroundColor: '#5d78ff'
        },
        {
          label: dataset3Label,
          data: (chartObj.jm_3 || []).slice(0, 10),
          backgroundColor: '#ffb822'
        }
      ]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          align: 'center',
          labels: {
            boxWidth: 14,
            boxHeight: 10,
            padding: 18,
            font: { family: 'Poppins', size: 12, weight: '500' },
            color: '#475569'
          }
        }
      },
      scales: {
        x: { stacked: true, grid: { color: '#f1f5f9' } },
        y: { stacked: true, grid: { display: false } }
      }
    }
  });
}

function renderStatusModaTables(jenjangData, selJenjang = '') {
  if (!jenjangData.success) return;

  // 1. Update summary badges
  if (jenjangData.total && jenjangData.persen) {
    const t = jenjangData.total;
    const p = jenjangData.persen;
    
    const b1 = document.getElementById('badgeStatusMandiri');
    const b2 = document.getElementById('badgeStatusNumpang');
    const b3 = document.getElementById('badgeStatusBelum');
    const b4 = document.getElementById('badgeModaOnline');
    const b5 = document.getElementById('badgeModaSemi');
    const b6 = document.getElementById('badgeModaBelum');

    if (b1) b1.textContent = `${t.jm_mandiri} (${p.jm_mandiri}%) Mandiri`;
    if (b2) b2.textContent = `${t.jm_menumpang} (${p.jm_menumpang}%) Menumpang`;
    if (b3) b3.textContent = `${t.jm_blm_ditetapkan} (${p.jm_blm_ditetapkan}%) Belum`;
    if (b4) b4.textContent = `${t.jm_online} (${p.jm_online}%) Online`;
    if (b5) b5.textContent = `${t.jm_semi} (${p.jm_semi}%) Semi Online`;
    if (b6) b6.textContent = `${t.jm_blm_moda} (${p.jm_blm_moda}%) Belum`;
  }

  const target = (selJenjang || '').toUpperCase();

  // 2. Render Status Table
  const tbodyStatus = document.getElementById('tbodyStatusJenjang');
  if (tbodyStatus && jenjangData.rekap) {
    tbodyStatus.innerHTML = jenjangData.rekap.map((row, idx) => {
      const nm = (row.nm_jenjang || '').toUpperCase();
      const isMatch = target && nm.includes(target);
      const rowStyle = isMatch ? 'background: rgba(33, 150, 243, 0.12); font-weight:600;' : '';
      const badge = isMatch ? '<span style="background:#2196F3; color:#fff; font-size:10px; padding:2px 6px; border-radius:4px; margin-left:6px;">Dipilih</span>' : '';

      return `
        <tr style="${rowStyle}">
          <td class="text-center">${idx + 1}</td>
          <td><strong>${row.nm_jenjang}</strong>${badge}</td>
          <td class="text-right">${row.jm_mandiri}</td>
          <td class="text-right">${row.jm_menumpang}</td>
          <td class="text-right">${row.jm_blm_ditetapkan}</td>
          <td class="text-right">${row.jm_tik || '-'}</td>
          <td class="text-right">${row.jm_kesiapan_valid || '-'}</td>
        </tr>
      `;
    }).join('');
  }

  // 3. Render Moda Table
  const tbodyModa = document.getElementById('tbodyModaJenjang');
  if (tbodyModa && jenjangData.rekap) {
    tbodyModa.innerHTML = jenjangData.rekap.map((row, idx) => {
      const nm = (row.nm_jenjang || '').toUpperCase();
      const isMatch = target && nm.includes(target);
      const rowStyle = isMatch ? 'background: rgba(33, 150, 243, 0.12); font-weight:600;' : '';
      const badge = isMatch ? '<span style="background:#2196F3; color:#fff; font-size:10px; padding:2px 6px; border-radius:4px; margin-left:6px;">Dipilih</span>' : '';

      return `
        <tr style="${rowStyle}">
          <td class="text-center">${idx + 1}</td>
          <td><strong>${row.nm_jenjang}</strong>${badge}</td>
          <td class="text-right">${row.jm_online}</td>
          <td class="text-right">${row.jm_semi}</td>
          <td class="text-right">${row.jm_blm_moda}</td>
        </tr>
      `;
    }).join('');
  }
}

function renderDonuts(pieData) {
  const configs = [
    { id: 'donutSMK', idx: 3, def: [98.5, 1.5] },
    { id: 'donutSMA', idx: 2, def: [98.2, 1.8] },
    { id: 'donutSMP', idx: 1, def: [81, 19] },
    { id: 'donutSD',  idx: 0, def: [75, 25] }
  ];

  configs.forEach(cfg => {
    const ctx = document.getElementById(cfg.id);
    if (!ctx) return;

    if (donutInstances[cfg.id]) donutInstances[cfg.id].destroy();

    let values = cfg.def;
    if (pieData.charts && pieData.charts.status && pieData.charts.status[cfg.idx]) {
      const arr = pieData.charts.status[cfg.idx].data || [];
      const v0 = Number(arr[0]) || 0;
      const v1 = Number(arr[1]) || 0;
      if (v0 > 0 || v1 > 0) {
        values = [v0, v1];
      }
    }

    donutInstances[cfg.id] = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Mandiri', 'Menumpang'],
        datasets: [{
          data: values,
          backgroundColor: ['#27ae60', '#f5b041'],
          borderWidth: 2,
          borderColor: '#ffffff',
          hoverOffset: 3
        }]
      },
      options: {
        cutout: '72%',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function(context) {
                return ` ${context.label}: ${context.raw}`;
              }
            }
          }
        }
      }
    });
  });
}

function renderWilayahTable(data, selWilayah = 'X') {
  const tbody = document.getElementById('tbodyWilayah');
  if (!tbody) return;

  const list = data.rekap || [];
  if (Array.isArray(list) && list.length > 0) {
    tbody.innerHTML = list.map((row, idx) => {
      const isMatch = selWilayah && selWilayah !== 'X' && row.kd_prop === selWilayah;
      const rowStyle = isMatch ? 'background: rgba(33, 150, 243, 0.12); font-weight:600;' : '';
      const badge = isMatch ? '<span style="background:#2196F3; color:#fff; font-size:10px; padding:2px 6px; border-radius:4px; margin-left:6px;">Dipilih</span>' : '';

      return `
        <tr style="${rowStyle}">
          <td class="text-center">${row.no || (idx + 1)}</td>
          <td><strong><a href="javascript:;" onclick="filterByWilayah('${row.kd_prop}')" style="${isMatch ? 'color:#0284c7; font-weight:700;' : ''}">${row.title || 'Wilayah'}</a></strong>${badge}</td>
          <td class="text-right">${row.jm_sekolah || '-'}</td>
          <td class="text-right">${row.jm_pes_t || '-'}</td>
          <td class="text-right">${row.jm_daftar_t || '-'}</td>
          <td class="text-right"><span style="color:#2196F3; font-weight:600;">${row.daftar_ps || '0%'}</span></td>
          <td class="text-right">${row.jm_mandiri || '-'}</td>
          <td class="text-right">${row.jm_menumpang || '-'}</td>
          <td class="text-right">${row.jm_blm_ditetapkan || '-'}</td>
          <td class="text-right">${row.jm_online || '-'}</td>
          <td class="text-right">${row.jm_semi || '-'}</td>
          <td class="text-right">${row.jm_blm_moda || '-'}</td>
          <td class="text-right">${row.jm_tik || '-'}</td>
          <td class="text-right">${row.jm_kesiapan_valid || '-'}</td>
        </tr>
      `;
    }).join('');
  }
}

function filterByWilayah(kd_prop) {
  const sel = document.getElementById('filterWilayahSelect');
  if (sel) {
    sel.value = kd_prop;
    applyFilters();
  }
}

function applyFilters() {
  loadStatistikData();
}

function handleMockLogin(e) {
  if (e) e.preventDefault();
  const user = document.getElementById('loginUser').value;
  alert(`[Proktor CBT]: Berhasil masuk sebagai ${user || 'Proktor'}. Menghubungkan ke sistem TKA...`);
}

// ----------------------------------------------------
// 4. ADMIN MODAL & AUTO-DETECT
// ----------------------------------------------------
function openAdminModal() {
  document.getElementById('adminModal').classList.add('show');
  checkModalAuth();
}

function closeAdminModal() {
  document.getElementById('adminModal').classList.remove('show');
}

function checkModalAuth() {
  const token = localStorage.getItem('tka_admin_token');
  const loginView = document.getElementById('modalAdminLogin');
  const managerView = document.getElementById('modalAdminManager');

  if (token) {
    if (loginView) loginView.style.display = 'none';
    if (managerView) managerView.style.display = 'block';
    renderModalAdminTable();
  } else {
    if (loginView) loginView.style.display = 'block';
    if (managerView) managerView.style.display = 'none';
  }
}

async function handleModalLogin() {
  const u = document.getElementById('mAdminUser').value;
  const p = document.getElementById('mAdminPass').value;

  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: u, password: p })
    });
    const data = await res.json();
    if (data.success) {
      localStorage.setItem('tka_admin_token', data.token);
      checkModalAuth();
    } else {
      alert('Login Gagal: ' + (data.message || 'Kredensial salah'));
    }
  } catch (err) {
    alert('Error login: ' + err.message);
  }
}

function handleModalLogout() {
  localStorage.removeItem('tka_admin_token');
  checkModalAuth();
}

function switchAdminTab(tab) {
  const btnManual = document.getElementById('btnAdminTabManual');
  const btnLink = document.getElementById('btnAdminTabLink');
  const btnServer = document.getElementById('btnAdminTabServer');
  
  const panelManual = document.getElementById('adminPanelTabManual');
  const panelLink = document.getElementById('adminPanelTabLink');
  const panelServer = document.getElementById('adminPanelTabServer');

  // Reset all
  [btnManual, btnLink, btnServer].forEach(b => { if (b) b.classList.remove('active'); });
  [panelManual, panelLink, panelServer].forEach(p => { if (p) p.style.display = 'none'; });

  if (tab === 'manual') {
    if (btnManual) btnManual.classList.add('active');
    if (panelManual) panelManual.style.display = 'block';
  } else if (tab === 'link') {
    if (btnLink) btnLink.classList.add('active');
    if (panelLink) panelLink.style.display = 'block';
  } else if (tab === 'server') {
    if (btnServer) btnServer.classList.add('active');
    if (panelServer) panelServer.style.display = 'block';
    loadServerFiles();
  }
}

async function saveManualDownload() {
  const name = document.getElementById('manualName').value.trim();
  const category = document.getElementById('manualCat').value;
  const size = document.getElementById('manualSize').value.trim() || '~ MB';
  const filename = document.getElementById('manualFilename').value.trim() || `${name}.exe`;
  const shareUrl = document.getElementById('manualUrl').value.trim();

  if (!name || !shareUrl) {
    alert('Nama aplikasi/berkas dan URL unduhan wajib diisi.');
    return;
  }

  const payload = {
    id: `app-${Date.now()}`,
    name,
    category,
    size,
    filename,
    shareUrl,
    required: category === 'utama'
  };

  try {
    const res = await fetch('/api/admin/downloads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (json.success) {
      alert('✅ Berkas berhasil ditambahkan secara manual ke web portal!');
      document.getElementById('manualName').value = '';
      document.getElementById('manualSize').value = '';
      document.getElementById('manualFilename').value = '';
      document.getElementById('manualUrl').value = '';
      await loadConfigAndDownloads();
      renderModalAdminTable();
    } else {
      alert('Gagal: ' + json.message);
    }
  } catch (e) {
    alert('Error: ' + e.message);
  }
}

function setPresetDir(dir, btnElem) {
  const input = document.getElementById('mCustomServerDir');
  if (input) {
    input.value = dir;
  }

  // Update active state on all preset buttons
  document.querySelectorAll('.btn-preset-dir').forEach(btn => btn.classList.remove('active'));
  if (btnElem) {
    btnElem.classList.add('active');
  } else {
    document.querySelectorAll('.btn-preset-dir').forEach(btn => {
      if (btn.getAttribute('onclick')?.includes(dir)) {
        btn.classList.add('active');
      }
    });
  }

  loadServerFiles();
}

async function loadServerFiles() {
  const tbody = document.getElementById('tbodyServerFiles');
  if (!tbody) return;
  
  const customDir = (document.getElementById('mCustomServerDir')?.value || '').trim();
  tbody.innerHTML = `<tr><td colspan="3" class="text-center" style="padding:14px;"><i class="fa-solid fa-spinner fa-spin"></i> Memindai folder <code>${customDir || 'server'}</code>...</td></tr>`;

  try {
    const url = customDir ? `/api/admin/server-files?dir=${encodeURIComponent(customDir)}` : '/api/admin/server-files';
    const res = await fetch(url);
    const json = await res.json();
    if (json.success && json.files) {
      if (json.files.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" class="text-center text-muted" style="padding:16px;">Folder <code>${json.directory}</code> kosong atau belum ada berkas di dalamnya.</td></tr>`;
        return;
      }

      tbody.innerHTML = json.files.map(f => {
        const cleanPath = (f.fullPath || f.filename).replace(/\\/g, '\\\\');
        return `
          <tr>
            <td>
              <strong style="color:#1e293b; display:block;">${f.filename}</strong>
              <small style="color:#64748b; font-size:0.7rem;">${f.fullPath || f.filename}</small>
            </td>
            <td><span style="color:#0284c7; font-weight:600;">${f.size}</span></td>
            <td>
              <button type="button" class="btn-download-action" style="padding:4px 10px; font-size:0.75rem;" onclick="selectServerFile('${cleanPath}', '${f.filename}', '${f.size}', '${f.downloadUrl}')">
                <i class="fa-solid fa-plus"></i> Pasang
              </button>
            </td>
          </tr>
        `;
      }).join('');
    } else {
      tbody.innerHTML = `<tr><td colspan="3" class="text-center text-danger" style="padding:16px;">⚠️ ${json.message || 'Gagal membaca direktori server'}</td></tr>`;
    }
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="3" class="text-center text-danger" style="padding:16px;">Error: ${e.message}</td></tr>`;
  }
}

function selectServerFile(fullPath, filename, size, downloadUrl) {
  document.getElementById('mDetectUrl').value = fullPath || filename;
  
  let suggestedName = (filename || '').replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
  let suggestedCat = 'pendukung';
  const lower = (filename || '').toLowerCase();
  if (lower.includes('exambrowser') || lower.includes('exam')) {
    suggestedCat = 'utama';
    suggestedName = lower.includes('admin') ? 'Exambrowser Admin / Proktor Browser' : (lower.includes('32') ? 'Exambrowser Client 32-Bit (Windows)' : 'Exambrowser Client 64-Bit (Windows)');
  } else if (lower.includes('vhd') || lower.includes('server')) {
    suggestedCat = 'server';
    suggestedName = 'Virtual Hard Disk (VHD) TKA 2026';
  }

  document.getElementById('mFormName').value = suggestedName;
  document.getElementById('mFormCat').value = suggestedCat;
  document.getElementById('mFormSize').value = size || '~ MB';
  document.getElementById('mFormFilename').value = filename;
  document.getElementById('mFormUrl').value = downloadUrl || `/downloads/${filename}`;
  document.getElementById('mDetectSummary').textContent = `Berkas Server "${filename}" (${size}) siap dipasang!`;
  document.getElementById('mDetectResultForm').style.display = 'block';
  document.getElementById('mDetectResultForm').scrollIntoView({ behavior: 'smooth' });
}

async function modalDetectFile() {
  const url = document.getElementById('mDetectUrl').value.trim();
  if (!url) {
    alert('Silakan masukkan link file terlebih dahulu.');
    return;
  }

  try {
    const res = await fetch('/api/admin/detect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetUrl: url })
    });
    const json = await res.json();
    if (json.success && json.detected) {
      const d = json.detected;
      document.getElementById('mFormName').value = d.suggestedName || '';
      document.getElementById('mFormCat').value = d.suggestedCategory || 'pendukung';
      document.getElementById('mFormSize').value = d.fileSize || '~ MB';
      document.getElementById('mFormFilename').value = d.filename || '';
      document.getElementById('mFormUrl').value = d.shareUrl || url;
      
      document.getElementById('mDetectSummary').textContent = `File "${d.filename}" (${d.fileSize}) terdeteksi sebagai ${d.suggestedCategory.toUpperCase()}!`;
      document.getElementById('mDetectResultForm').style.display = 'block';
    } else {
      alert(json.message || 'Gagal deteksi file.');
    }
  } catch (e) {
    alert('Error deteksi: ' + e.message);
  }
}

async function modalSaveDownload() {
  const name = document.getElementById('mFormName').value.trim();
  const category = document.getElementById('mFormCat').value;
  const size = document.getElementById('mFormSize').value.trim();
  const filename = document.getElementById('mFormFilename').value.trim();
  const shareUrl = document.getElementById('mFormUrl').value.trim();

  if (!name || !shareUrl) {
    alert('Nama dan URL file wajib diisi.');
    return;
  }

  const payload = {
    id: `app-${Date.now()}`,
    name,
    category,
    size,
    filename,
    shareUrl,
    required: category === 'utama'
  };

  try {
    const res = await fetch('/api/admin/downloads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (json.success) {
      alert('✅ Berkas berhasil disimpan dan langsung aktif di web!');
      document.getElementById('mDetectResultForm').style.display = 'none';
      document.getElementById('mDetectUrl').value = '';
      await loadConfigAndDownloads();
      renderModalAdminTable();
    }
  } catch (e) {
    alert('Error menyimpan: ' + e.message);
  }
}

function renderModalAdminTable() {
  const tbody = document.getElementById('mAdminTableBody');
  if (!tbody) return;

  tbody.innerHTML = allDownloads.map((item, idx) => `
    <tr>
      <td><strong>${item.name}</strong></td>
      <td>${item.category}</td>
      <td>${item.size}</td>
      <td class="text-center">
        <button class="btn-download-action" style="padding:2px 8px; color:#e74c3c;" onclick="modalDeleteDownload('${item.id}')"><i class="fa-solid fa-trash"></i></button>
      </td>
    </tr>
  `).join('');
}

async function modalDeleteDownload(id) {
  if (!confirm('Hapus berkas ini dari web?')) return;
  try {
    const res = await fetch(`/api/admin/downloads/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (json.success) {
      await loadConfigAndDownloads();
      renderModalAdminTable();
    }
  } catch (e) {
    alert('Error delete: ' + e.message);
  }
}
