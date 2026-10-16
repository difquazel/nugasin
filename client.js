/* ==========================================================================
   NUGASIN CAMPUS WORKSPACE — INTERACTIVE APP & 4-LAYER CLOUD SYNC ENGINE
   ========================================================================== */

(() => {
  'use strict';

  // Unique client session ID to avoid echoing SSE broadcasts back to self
  const CLIENT_ID = 'client-' + Math.random().toString(36).slice(2, 10);

  // Indonesian Month & Day Names
  const MONTHS_ID = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const MONTHS_SHORT_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const DAYS_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const WEEK_STRIP_LABELS = ['SN', 'SL', 'RB', 'KM', 'JM', 'SB', 'MG'];

  // Helper for formatting YYYY-MM-DD relative to today
  function getOffsetDateStr(offsetDays = 0) {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  function formatDateDisplay(dateStr) {
    if (!dateStr) return '-';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return `${d.getDate()} ${MONTHS_SHORT_ID[d.getMonth()]} ${d.getFullYear()}`;
  }

  function formatSlashDate(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}/${parts[1]}/${parts[0].slice(2)}`;
  }

  function getDaysDiffFromToday(dateStr) {
    if (!dateStr) return 999;
    const todayStr = getOffsetDateStr(0);
    const t0 = new Date(todayStr + 'T00:00:00').getTime();
    const t1 = new Date(dateStr + 'T00:00:00').getTime();
    return Math.round((t1 - t0) / (1000 * 60 * 60 * 24));
  }

  // ==========================================================================
  // WEB AUDIO API SOUND ENGINE (Subtle Pop, Click & Celebration Chime)
  // ==========================================================================
  let soundEnabled = true;
  let audioCtx = null;

  function playSound(type = 'pop') {
    if (!soundEnabled) return;
    try {
      if (!audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;
        audioCtx = new AudioContextClass();
      }
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      const now = audioCtx.currentTime;

      if (type === 'pop') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(420, now);
        osc.frequency.exponentialRampToValueAtTime(680, now + 0.065);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.075);
      } else if (type === 'success') {
        const freqs = [523.25, 659.25, 783.99, 1046.5];
        freqs.forEach((f, idx) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(f, now + idx * 0.055);
          gain.gain.setValueAtTime(0.1, now + idx * 0.055);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.055 + 0.22);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(now + idx * 0.055);
          osc.stop(now + idx * 0.055 + 0.24);
        });
      } else if (type === 'switch') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(340, now);
        osc.frequency.exponentialRampToValueAtTime(480, now + 0.045);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.055);
      }
    } catch (e) {
      // Ignore audio errors on restricted autoplay
    }
  }

  // ==========================================================================
  // DEFAULT INITIAL DATA (Rich Campus Tasks, Notes & Courses)
  // ==========================================================================
  function createDefaultWorkspaceData() {
    return {
      version: 1,
      updatedAt: new Date().toISOString(),
      profile: {
        name: 'Rownok',
        major: 'Semester 5 • Teknik Informatika',
        focusMinutesToday: 95,
        streakDays: 12
      },
      courses: [
        'Desain Antarmuka (UI/UX)',
        'Algoritma & Struktur Data',
        'Basis Data Lanjut',
        'Kecerdasan Buatan (AI)',
        'Rekayasa Perangkat Lunak',
        'Kalkulus & Aljabar'
      ],
      tasks: [
        {
          id: 'task-1',
          title: 'Finalisasi Prototype Mobile App & Usability Testing',
          course: 'Desain Antarmuka (UI/UX)',
          category: 'Tugas Kelompok',
          dueDate: getOffsetDateStr(0),
          dueTime: '19:00',
          priority: 'high',
          status: 'in-progress',
          description: 'Pastikan komponen Bento Card, micro-interaction, dan kalender sudah responsif untuk presentasi.',
          link: 'https://figma.com',
          subtasks: [
            { id: 'st-1', text: 'Susun palet warna Butter Yellow & Pastel Pink', done: true },
            { id: 'st-2', text: 'Buat animasi transisi antar halaman', done: true },
            { id: 'st-3', text: 'Uji coba link penyimpanan cloud', done: false }
          ]
        },
        {
          id: 'task-2',
          title: 'Laporan Praktikum Optimasi Query & Indexing PostgreSQL',
          course: 'Basis Data Lanjut',
          category: 'Praktikum',
          dueDate: getOffsetDateStr(1),
          dueTime: '23:59',
          priority: 'medium',
          status: 'pending',
          description: 'Bandingkan waktu eksekusi EXPLAIN ANALYZE sebelum dan sesudah B-Tree Index.',
          link: '',
          subtasks: [
            { id: 'st-4', text: 'Screenshot hasil benchmark 100.000 baris data', done: true },
            { id: 'st-5', text: 'Tulis analisis kesimpulan di Bab 4 (.pdf)', done: false }
          ]
        },
        {
          id: 'task-3',
          title: 'Kuis Mingguan: Graph Traversal (BFS, DFS & Dijkstra)',
          course: 'Algoritma & Struktur Data',
          category: 'Kuis / Ujian',
          dueDate: getOffsetDateStr(2),
          dueTime: '10:30',
          priority: 'high',
          status: 'pending',
          description: 'Pelajari kompleksitas waktu O(V + E) dan implementasi Priority Queue.',
          link: '',
          subtasks: [
            { id: 'st-6', text: 'Latihan 5 soal shortest path', done: false }
          ]
        },
        {
          id: 'task-4',
          title: 'Implementasi Model Klasifikasi NLP Sentiment Analysis',
          course: 'Kecerdasan Buatan (AI)',
          category: 'Tugas Individu',
          dueDate: getOffsetDateStr(4),
          dueTime: '21:00',
          priority: 'low',
          status: 'pending',
          description: 'Dataset ulasan aplikasi menggunakan TF-IDF dan Logistic Regression / IndoBERT.',
          link: 'https://colab.research.google.com',
          subtasks: [
            { id: 'st-7', text: 'Cleaning & preprocessing dataset', done: true },
            { id: 'st-8', text: 'Evaluasi F1-Score dan Confusion Matrix', done: false }
          ]
        },
        {
          id: 'task-5',
          title: 'Dokumen SRS & Use Case Diagram Sistem Akademik',
          course: 'Rekayasa Perangkat Lunak',
          category: 'Tugas Kelompok',
          dueDate: getOffsetDateStr(-1),
          dueTime: '17:00',
          priority: 'medium',
          status: 'completed',
          description: 'Sudah dikumpulkan ke portal E-Learning kampus tepat waktu.',
          link: '',
          subtasks: [
            { id: 'st-9', text: 'Review Activity Diagram bersama kelompok', done: true },
            { id: 'st-10', text: 'Submit PDF ke ketua kelas', done: true }
          ]
        }
      ],
      notes: [
        {
          id: 'note-1',
          title: 'Prinsip Bento Grid & Micro-Interactions Modern',
          course: 'Desain Antarmuka (UI/UX)',
          date: getOffsetDateStr(0),
          tag: 'Pertemuan 6 • Rangkuman Materi',
          color: 'yellow',
          pinned: true,
          updatedAt: new Date().toISOString(),
          content: `<h2>✨ Prinsip Utama UI Pastel & Bento</h2>
<p>Desain antarmuka modern menggabungkan <b>hierarki visual yang jelas</b> dengan warna pastel hangat agar mata tidak cepat lelah saat mengerjakan tugas berjam-jam.</p>
<div class="note-callout-box">💡 <b>Tips Penting Dosen:</b> Gunakan kontras tinggi (Deep Ink Black <code>#141416</code>) pada tombol aksi utama di atas latar belakang warna pastel seperti <span style="background-color: rgb(247, 223, 131);">Butter Yellow</span> atau <span style="background-color: rgb(243, 185, 223);">Pastel Pink</span>.</div>
<h3>Checklist Komponen Desain:</h3>
<ul>
  <li>✅ Gunakan sudut membulat (<i>border-radius: 26px - 32px</i>) untuk kesan ramah dan organik.</li>
  <li>✅ Berikan umpan balik instan (<i>spring physics animation</i>) saat kartu diklik.</li>
  <li>✅ Pastikan navigasi utama mudah dijangkau ibu jari pada layar HP.</li>
</ul>`
        },
        {
          id: 'note-2',
          title: 'Algoritma Shortest Path: Dijkstra vs Bellman-Ford',
          course: 'Algoritma & Struktur Data',
          date: getOffsetDateStr(-1),
          tag: 'Pertemuan 5 • Persiapan Kuis',
          color: 'pink',
          pinned: true,
          updatedAt: new Date().toISOString(),
          content: `<h2>📐 Perbandingan Algoritma Graf</h2>
<p>Saat mencari jalur terpendek dari satu titik awal (<i>Single-Source Shortest Path</i>), perhatikan apakah graf memiliki bobot negatif:</p>
<ul>
  <li><b>Algoritma Dijkstra:</b> Sangat cepat menggunakan <span style="background-color: rgb(190, 227, 229);">Min-Priority Queue</span> dengan kompleksitas <code>O((V + E) log V)</code>, namun <b>tidak bisa</b> menangani bobot tepi negatif.</li>
  <li><b>Bellman-Ford:</b> Melakukan relaksasi sebanyak <code>V - 1</code> kali. Kompleksitas <code>O(V × E)</code>, mampu mendeteksi <i>negative weight cycle</i>.</li>
</ul>
<pre class="note-code-block">function relax(u, v, weight) {
  if (dist[u] + weight < dist[v]) {
    dist[v] = dist[u] + weight;
    prev[v] = u;
  }
}</pre>`
        },
        {
          id: 'note-3',
          title: 'Indexing, Normalisasi 3NF & Optimasi Transaksi ACID',
          course: 'Basis Data Lanjut',
          date: getOffsetDateStr(-2),
          tag: 'Pertemuan 4 • Catatan Praktikum',
          color: 'lavender',
          pinned: false,
          updatedAt: new Date().toISOString(),
          content: `<h2>🗄️ Kapan Harus Menggunakan Index?</h2>
<p>Index mempercepat operasi <code>SELECT</code> dan <code>JOIN</code> secara drastis, tetapi menambah sedikit overhead saat melakukan <code>INSERT</code>, <code>UPDATE</code>, dan <code>DELETE</code>.</p>
<div class="note-callout-box">📌 Gunakan <b>Composite Index</b> dengan urutan kolom paling selektif di posisi paling kiri (<i>Leftmost Prefix Rule</i>).</div>`
        }
      ]
    };
  }

  // ==========================================================================
  // 4-LAYER CLOUD & PERMALINK PERSISTENCE ENGINE
  // ==========================================================================
  let currentSpaceId = 'kampus-utama';
  let appData = createDefaultWorkspaceData();
  let activeNoteId = null;
  let selectedCalendarDate = getOffsetDateStr(0);
  let currentCalendarMonth = new Date().getMonth();
  let currentCalendarYear = new Date().getFullYear();
  let currentStackFilter = 'priority'; // 'priority' | 'upcoming' | 'pinned-notes'
  let currentTaskStatusFilter = 'all';
  let currentTaskCourseFilter = 'all';
  let currentNoteCourseFilter = 'all';
  let currentNoteSearchQuery = '';
  let tempSubtasks = [];
  let sseConnection = null;

  // Base64 UTF-8 URL-safe encoding/decoding for Smart Link Snapshots (#s=...)
  function encodeStateToUrlHash(stateObj) {
    try {
      const jsonStr = JSON.stringify(stateObj);
      const utf8Bytes = new TextEncoder().encode(jsonStr);
      let binary = '';
      for (let i = 0; i < utf8Bytes.length; i++) {
        binary += String.fromCharCode(utf8Bytes[i]);
      }
      return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    } catch (e) {
      return '';
    }
  }

  function decodeStateFromUrlHash(encodedStr) {
    try {
      let base64 = encodedStr.replace(/-/g, '+').replace(/_/g, '/');
      while (base64.length % 4) base64 += '=';
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const jsonStr = new TextDecoder().decode(bytes);
      return JSON.parse(jsonStr);
    } catch (e) {
      return null;
    }
  }

  // IndexedDB Wrapper for large offline-resilient storage
  const IDB_NAME = 'NugasinCampusCloudDB';
  const IDB_STORE = 'workspaces';

  function openIndexedDB() {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) return resolve(null);
      const req = indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE, { keyPath: 'spaceId' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    });
  }

  async function saveToIndexedDB(spaceId, data) {
    const db = await openIndexedDB();
    if (!db) return;
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(IDB_STORE, 'readwrite');
        tx.objectStore(IDB_STORE).put({ spaceId, data, updatedAt: Date.now() });
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      } catch (e) {
        resolve(false);
      }
    });
  }

  async function loadFromIndexedDB(spaceId) {
    const db = await openIndexedDB();
    if (!db) return null;
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(IDB_STORE, 'readonly');
        const req = tx.objectStore(IDB_STORE).get(spaceId);
        req.onsuccess = () => resolve(req.result ? req.result.data : null);
        req.onerror = () => resolve(null);
      } catch (e) {
        resolve(null);
      }
    });
  }

  // Update Sync Status UI Indicator
  function setSyncIndicator(state, message) {
    const dot = document.getElementById('syncDot');
    const text = document.getElementById('syncStatusText');
    const badge = document.getElementById('currentSpaceBadge');
    if (badge) badge.textContent = `#${currentSpaceId}`;
    if (!dot || !text) return;

    if (state === 'syncing') {
      dot.classList.add('syncing');
      text.textContent = message || 'Menyimpan Online...';
    } else {
      dot.classList.remove('syncing');
      text.textContent = message || 'Tersimpan Online';
    }
  }

  // Build Full Shareable Permanent Link (Includes both ?space=ID and #s=snapshot)
  function getShareablePermanentLink() {
    const url = new URL(window.location.href);
    url.searchParams.set('space', currentSpaceId);
    const encoded = encodeStateToUrlHash(appData);
    if (encoded) {
      url.hash = `s=${encoded}`;
    }
    return url.toString();
  }

  // Save Workspace across all 4 layers (LocalStorage + IndexedDB + URL Permalink + Cloud Server API)
  let cloudSaveTimer = null;
  function saveWorkspace(options = { silent: false }) {
    appData.updatedAt = new Date().toISOString();

    // Layer 1: LocalStorage (Instant synchronous save)
    try {
      localStorage.setItem(`nugasin_ws_${currentSpaceId}`, JSON.stringify(appData));
      localStorage.setItem('nugasin_last_space', currentSpaceId);
    } catch (e) {}

    // Layer 2: IndexedDB
    saveToIndexedDB(currentSpaceId, appData);

    // Layer 3: Smart URL State Update (keeps URL link always up-to-date when bookmarked or refreshed!)
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('space', currentSpaceId);
      const encoded = encodeStateToUrlHash(appData);
      if (encoded && encoded.length < 32000) {
        url.hash = `s=${encoded}`;
      }
      window.history.replaceState(null, '', url.toString());
    } catch (e) {}

    // Update Shareable Link input if modal is open
    const linkInput = document.getElementById('shareableFullLinkInput');
    if (linkInput) {
      linkInput.value = getShareablePermanentLink();
    }

    // Layer 4: Cloud Server API (Debounced network sync)
    setSyncIndicator('syncing', 'Menyimpan ke Cloud...');
    if (cloudSaveTimer) clearTimeout(cloudSaveTimer);
    cloudSaveTimer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/workspace/${encodeURIComponent(currentSpaceId)}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Client-Id': CLIENT_ID
          },
          body: JSON.stringify({
            clientId: CLIENT_ID,
            data: appData
          })
        });
        if (res.ok) {
          setSyncIndicator('online', 'Tersimpan di Cloud ✨');
        } else {
          setSyncIndicator('online', 'Tersimpan di Link & Lokal');
        }
      } catch (err) {
        // Even if hosted on static hosting without Node backend, URL + LocalStorage + IndexedDB are 100% saved
        setSyncIndicator('online', 'Tersimpan di Link ✨');
      }
    }, 280);
  }

  // Subscribe to Server-Sent Events (SSE) for live multi-tab / multi-device sync
  function subscribeToLiveStream(spaceId) {
    if (sseConnection) {
      try { sseConnection.close(); } catch (e) {}
      sseConnection = null;
    }
    try {
      const es = new EventSource(`/api/stream/${encodeURIComponent(spaceId)}`);
      es.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'sync_update' && msg.excludeClientId !== CLIENT_ID && msg.data) {
            appData = msg.data;
            localStorage.setItem(`nugasin_ws_${currentSpaceId}`, JSON.stringify(appData));
            renderAll();
            setSyncIndicator('online', 'Disinkronkan Live 🔄');
          }
        } catch (e) {}
      };
      es.onerror = () => {
        es.close();
      };
      sseConnection = es;
    } catch (e) {}
  }

  // Initial Load Sequence from URL Hash / Cloud API / IndexedDB / LocalStorage
  async function initWorkspaceLoad() {
    const parsedUrl = new URL(window.location.href);
    const spaceParam = parsedUrl.searchParams.get('space');
    const savedLastSpace = localStorage.getItem('nugasin_last_space');

    if (spaceParam) {
      currentSpaceId = spaceParam.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-') || 'kampus-utama';
    } else if (savedLastSpace) {
      currentSpaceId = savedLastSpace;
    }

    // Check if URL has a Smart Permalink Snapshot (#s=...)
    let loadedFromUrlHash = null;
    if (window.location.hash && window.location.hash.startsWith('#s=')) {
      const rawHash = window.location.hash.slice(3);
      loadedFromUrlHash = decodeStateFromUrlHash(rawHash);
    }

    // Check LocalStorage & IndexedDB
    let localData = null;
    try {
      const rawLocal = localStorage.getItem(`nugasin_ws_${currentSpaceId}`);
      if (rawLocal) localData = JSON.parse(rawLocal);
    } catch (e) {}
    if (!localData) {
      localData = await loadFromIndexedDB(currentSpaceId);
    }

    // Check Backend Cloud Server API
    let serverData = null;
    try {
      const res = await fetch(`/api/workspace/${encodeURIComponent(currentSpaceId)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.exists && json.data) {
          serverData = json.data;
        }
      }
    } catch (e) {}

    // Pick the freshest data source!
    const candidates = [serverData, localData, loadedFromUrlHash].filter(Boolean);
    if (candidates.length > 0) {
      candidates.sort((a, b) => {
        const tA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const tB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return tB - tA;
      });
      appData = candidates[0];
    } else {
      appData = createDefaultWorkspaceData();
    }

    // Ensure data integrity
    if (!Array.isArray(appData.tasks)) appData.tasks = [];
    if (!Array.isArray(appData.notes)) appData.notes = [];
    if (!Array.isArray(appData.courses) || appData.courses.length === 0) {
      appData.courses = ['Desain Antarmuka (UI/UX)', 'Algoritma & Struktur Data', 'Basis Data Lanjut'];
    }
    if (!appData.profile) {
      appData.profile = { name: 'Rownok', major: 'Semester 5 • Informatika', focusMinutesToday: 75, streakDays: 12 };
    }

    if (appData.notes.length > 0 && !activeNoteId) {
      activeNoteId = appData.notes[0].id;
    }

    // Save back to ensure all 4 layers (including server & URL hash) are synchronized
    saveWorkspace({ silent: true });
    subscribeToLiveStream(currentSpaceId);
    renderAll();
  }

  // ==========================================================================
  // TOAST NOTIFICATION & CONFETTI CELEBRATION
  // ==========================================================================
  function showToast(message, icon = '✨') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast-item';
    toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(20px)';
      toast.style.transition = 'all 0.25s ease';
      setTimeout(() => toast.remove(), 260);
    }, 2800);
  }

  function triggerConfetti() {
    const canvas = document.getElementById('confettiCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#F7DF83', '#F3B9DF', '#B8CFF6', '#9FAF67', '#BFC3F2', '#F4A2A0', '#141416'];
    const particles = Array.from({ length: 55 }, () => ({
      x: canvas.width / 2 + (Math.random() - 0.5) * 180,
      y: canvas.height / 2 + (Math.random() - 0.5) * 80,
      vx: (Math.random() - 0.5) * 14,
      vy: -Math.random() * 14 - 4,
      size: Math.random() * 8 + 5,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      vRot: (Math.random() - 0.5) * 12
    }));

    let frame = 0;
    function animate() {
      frame++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.42; // gravity
        p.rotation += p.vRot;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.65);
        ctx.restore();
      });

      if (frame < 75) {
        requestAnimationFrame(animate);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    requestAnimationFrame(animate);
  }

  // ==========================================================================
  // VIEW NAVIGATION SWITCHER
  // ==========================================================================
  function switchView(targetViewId) {
    playSound('switch');
    document.querySelectorAll('.app-view').forEach((view) => {
      view.classList.toggle('active-view', view.id === targetViewId);
    });
    document.querySelectorAll('[data-target-view]').forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-target-view') === targetViewId);
    });
    // Close quick FAB menu if open
    const fabMenu = document.getElementById('fabQuickMenu');
    const fabBtn = document.getElementById('dockFabButton');
    if (fabMenu) fabMenu.classList.add('hidden');
    if (fabBtn) fabBtn.classList.remove('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ==========================================================================
  // RENDERING ENGINE: HEADER, DASHBOARD, SAGE CARD, BENTO METRICS
  // ==========================================================================
  function renderHeaderAndProfile() {
    const nameEl = document.getElementById('userNameDisplay');
    const semEl = document.getElementById('greetingSemesterText');
    const avatarEl = document.getElementById('userAvatarImg');
    const todayChip = document.getElementById('heroTodayDate');
    const statusTime = document.getElementById('statusBarTime');

    if (nameEl) nameEl.textContent = `${appData.profile.name || 'Mahasiswa'}!`;
    if (semEl) semEl.textContent = appData.profile.major || 'Semester Aktif • Kampus';
    if (avatarEl) {
      const seed = encodeURIComponent(appData.profile.name || 'Rownok');
      avatarEl.src = `https://api.dicebear.com/7.x/notionists/svg?seed=${seed}&backgroundColor=f7df83,f3b9df,bfc3f2`;
    }

    const now = new Date();
    if (todayChip) {
      todayChip.textContent = `${DAYS_ID[now.getDay()]}, ${now.getDate()} ${MONTHS_SHORT_ID[now.getMonth()]}`;
    }
    if (statusTime) {
      statusTime.textContent = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    }

    // Badge counts
    const pendingTasks = appData.tasks.filter((t) => t.status !== 'completed').length;
    const navTaskBadge = document.getElementById('navTaskCountBadge');
    const navNoteBadge = document.getElementById('navNoteCountBadge');
    const heroNoteCount = document.getElementById('heroNoteCount');

    if (navTaskBadge) navTaskBadge.textContent = pendingTasks;
    if (navNoteBadge) navNoteBadge.textContent = appData.notes.length;
    if (heroNoteCount) heroNoteCount.textContent = appData.notes.length;
  }

  function renderDashboard() {
    const totalTasks = appData.tasks.length;
    const completedTasks = appData.tasks.filter((t) => t.status === 'completed').length;
    const pendingTasks = totalTasks - completedTasks;
    const urgentTasks = appData.tasks.filter((t) => t.status !== 'completed' && getDaysDiffFromToday(t.dueDate) <= 2).length;

    const pct = totalTasks === 0 ? 100 : Math.round((completedTasks / totalTasks) * 100);
    const pctEl = document.getElementById('dashboardProgressPct');
    if (pctEl) pctEl.textContent = `${pct}%`;

    // Circular ring offset (circumference = 2 * PI * 46 ≈ 289)
    const ringCircle = document.getElementById('progressRingCircle');
    if (ringCircle) {
      const circumference = 289;
      const offset = circumference - (pct / 100) * circumference;
      ringCircle.style.strokeDashoffset = String(offset);
    }

    // XP Points calculation (completed tasks * 150 + notes * 80 + focus mins * 5)
    const xpScore = completedTasks * 150 + appData.notes.length * 80 + (appData.profile.focusMinutesToday || 75) * 6;
    const pointsEl = document.getElementById('progressRingPoints');
    if (pointsEl) pointsEl.textContent = String(xpScore);

    // Blush 4-Metric Card
    const elPending = document.getElementById('metricPendingTasks');
    const elCompleted = document.getElementById('metricCompletedTasks');
    const elNotes = document.getElementById('metricTotalNotes');
    const elUrgent = document.getElementById('metricUrgentTasks');
    const blushBar = document.getElementById('blushProgressBar');

    if (elPending) elPending.textContent = String(pendingTasks);
    if (elCompleted) elCompleted.textContent = String(completedTasks);
    if (elNotes) elNotes.textContent = String(appData.notes.length);
    if (elUrgent) elUrgent.textContent = String(urgentTasks);
    if (blushBar) blushBar.style.width = `${pct}%`;

    // Bento 2x2 descriptions
    const bentoTasksDesc = document.getElementById('bentoTasksDesc');
    const bentoNotesDesc = document.getElementById('bentoNotesDesc');
    const bentoCalDesc = document.getElementById('bentoCalendarDesc');
    if (bentoTasksDesc) bentoTasksDesc.textContent = `${pendingTasks} tugas aktif • ${urgentTasks} deadline dekat`;
    if (bentoNotesDesc) bentoNotesDesc.textContent = `${appData.notes.length} catatan kuliah tersimpan online`;
    if (bentoCalDesc) bentoCalDesc.textContent = `Pantau jadwal kuliah & produktivitas harian`;

    // Render Stacked Sage Folder Card
    renderSageStackedCard();
  }

  function renderSageStackedCard() {
    const titleEl = document.getElementById('sageCardTitle');
    const listEl = document.getElementById('sageQuickList');
    if (!listEl) return;

    document.querySelectorAll('.peeking-layer').forEach((btn) => {
      btn.classList.toggle('active-layer', btn.getAttribute('data-stack-filter') === currentStackFilter);
    });

    listEl.innerHTML = '';

    if (currentStackFilter === 'priority') {
      if (titleEl) titleEl.textContent = '⭐ Tugas Prioritas Kampus';
      const priorityTasks = appData.tasks
        .filter((t) => t.status !== 'completed')
        .sort((a, b) => {
          const pOrder = { high: 0, medium: 1, low: 2 };
          return (pOrder[a.priority] ?? 1) - (pOrder[b.priority] ?? 1);
        })
        .slice(0, 3);

      if (priorityTasks.length === 0) {
        listEl.innerHTML = `<div class="sage-pill-row" id="sageEmptyAddTask">
          <div class="sage-row-left">
            <span class="sage-row-icon">🎉</span>
            <div class="sage-row-text">
              <span class="sage-row-title">Semua tugas beres!</span>
              <span class="sage-row-meta">Klik untuk tambah target baru</span>
            </div>
          </div>
          <span class="sage-row-chevron">+</span>
        </div>`;
        return;
      }

      priorityTasks.forEach((task) => {
        const row = document.createElement('div');
        row.className = 'sage-pill-row';
        const icon = task.priority === 'high' ? '🔥' : task.priority === 'medium' ? '⚡' : '📌';
        row.innerHTML = `
          <div class="sage-row-left">
            <span class="sage-row-icon">${icon}</span>
            <div class="sage-row-text">
              <span class="sage-row-title">${escapeHtml(task.title)}</span>
              <span class="sage-row-meta">${escapeHtml(task.course)} • ${formatDateDisplay(task.dueDate)}</span>
            </div>
          </div>
          <span class="sage-row-chevron">›</span>
        `;
        row.addEventListener('click', () => {
          switchView('view-tasks');
          openTaskModal(task.id);
        });
        listEl.appendChild(row);
      });
    } else if (currentStackFilter === 'upcoming') {
      if (titleEl) titleEl.textContent = '⏳ Deadline Terdekat';
      const upcoming = appData.tasks
        .filter((t) => t.status !== 'completed')
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
        .slice(0, 3);

      upcoming.forEach((task) => {
        const diff = getDaysDiffFromToday(task.dueDate);
        const diffLabel = diff < 0 ? 'Terlewat!' : diff === 0 ? 'Hari ini!' : diff === 1 ? 'Besok' : `${diff} hari lagi`;
        const row = document.createElement('div');
        row.className = 'sage-pill-row';
        row.innerHTML = `
          <div class="sage-row-left">
            <span class="sage-row-icon">📅</span>
            <div class="sage-row-text">
              <span class="sage-row-title">${escapeHtml(task.title)}</span>
              <span class="sage-row-meta">${diffLabel} • Pukul ${task.dueTime || '23:59'}</span>
            </div>
          </div>
          <span class="sage-row-chevron">›</span>
        `;
        row.addEventListener('click', () => {
          selectedCalendarDate = task.dueDate;
          switchView('view-calendar');
          renderCalendarView();
        });
        listEl.appendChild(row);
      });
    } else {
      if (titleEl) titleEl.textContent = '📌 Catatan Kuliah Disematkan';
      const notes = appData.notes.slice(0, 3);
      notes.forEach((note) => {
        const row = document.createElement('div');
        row.className = 'sage-pill-row';
        row.innerHTML = `
          <div class="sage-row-left">
            <span class="sage-row-icon">📝</span>
            <div class="sage-row-text">
              <span class="sage-row-title">${escapeHtml(note.title)}</span>
              <span class="sage-row-meta">${escapeHtml(note.course)} • ${escapeHtml(note.tag || '')}</span>
            </div>
          </div>
          <span class="sage-row-chevron">›</span>
        `;
        row.addEventListener('click', () => {
          activeNoteId = note.id;
          switchView('view-notes');
          renderNotesStudio();
        });
        listEl.appendChild(row);
      });
    }
  }

  // ==========================================================================
  // RENDERING ENGINE: VIEW 2 — STICKER MOODBOARD & PAPAN TUGAS
  // ==========================================================================
  function renderTasksView() {
    // 1. Render Playful Geometric Stickers Stage (Top-Middle Reference Screen)
    const stage = document.getElementById('geometricStickersStage');
    if (stage) {
      stage.innerHTML = '';
      const activeTasks = appData.tasks.filter((t) => t.status !== 'completed');
      const stickerTasks = activeTasks.length >= 3 ? activeTasks.slice(0, 3) : appData.tasks.slice(0, 3);

      const shapeClasses = [
        'sticker-square-yellow',
        'sticker-starburst-pink',
        'sticker-circle-blue'
      ];

      stickerTasks.forEach((task, index) => {
        const sticker = document.createElement('div');
        sticker.className = `geo-sticker ${shapeClasses[index % 3]}`;
        sticker.innerHTML = `
          <span class="geo-sticker-course">${escapeHtml(task.course.split(' ')[0])}</span>
          <div class="geo-sticker-title">${escapeHtml(task.title)}</div>
          <span class="geo-sticker-date">${formatSlashDate(task.dueDate)}</span>
        `;
        sticker.addEventListener('click', () => {
          playSound('pop');
          openTaskModal(task.id);
        });
        stage.appendChild(sticker);
      });
    }

    // 2. Populate Course Filter Dropdown
    const courseSelect = document.getElementById('taskCourseFilterSelect');
    if (courseSelect) {
      const prevVal = currentTaskCourseFilter;
      courseSelect.innerHTML = `<option value="all">📚 Semua Mata Kuliah</option>` +
        appData.courses.map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
      courseSelect.value = appData.courses.includes(prevVal) ? prevVal : 'all';
    }

    // 3. Render Filtered Tasks List
    const listContainer = document.getElementById('tasksListContainer');
    if (!listContainer) return;

    let filtered = [...appData.tasks];
    if (currentTaskStatusFilter === 'pending') {
      filtered = filtered.filter((t) => t.status === 'pending');
    } else if (currentTaskStatusFilter === 'in-progress') {
      filtered = filtered.filter((t) => t.status === 'in-progress');
    } else if (currentTaskStatusFilter === 'completed') {
      filtered = filtered.filter((t) => t.status === 'completed');
    } else if (currentTaskStatusFilter === 'urgent') {
      filtered = filtered.filter((t) => t.status !== 'completed' && (t.priority === 'high' || getDaysDiffFromToday(t.dueDate) <= 2));
    }

    if (currentTaskCourseFilter !== 'all') {
      filtered = filtered.filter((t) => t.course === currentTaskCourseFilter);
    }

    // Sort: incomplete first, then by due date
    filtered.sort((a, b) => {
      if (a.status === 'completed' && b.status !== 'completed') return 1;
      if (a.status !== 'completed' && b.status === 'completed') return -1;
      return (a.dueDate || '').localeCompare(b.dueDate || '');
    });

    if (filtered.length === 0) {
      listContainer.innerHTML = `
        <div class="task-item-card" style="align-items:center; text-align:center; padding: 32px;">
          <div style="font-size:2rem;">🌟</div>
          <h4 style="font-weight:800;">Tidak ada tugas pada filter ini</h4>
          <p style="font-size:0.82rem; color:var(--text-secondary);">Klik tombol "+ Tambah Tugas" untuk membuat jadwal tugas baru.</p>
        </div>
      `;
      return;
    }

    listContainer.innerHTML = '';
    filtered.forEach((task) => {
      const isDone = task.status === 'completed';
      const diff = getDaysDiffFromToday(task.dueDate);
      let countdownText = '';
      let isSafe = false;
      if (isDone) {
        countdownText = '✓ Selesai';
        isSafe = true;
      } else if (diff < 0) {
        countdownText = `⚠️ Terlewat ${Math.abs(diff)} hari`;
      } else if (diff === 0) {
        countdownText = `🔥 Hari ini • ${task.dueTime || '23:59'}`;
      } else if (diff === 1) {
        countdownText = `⚡ Besok • ${task.dueTime || '23:59'}`;
      } else {
        countdownText = `🗓️ ${diff} hari lagi (${formatDateDisplay(task.dueDate)})`;
        isSafe = diff > 3;
      }

      const card = document.createElement('article');
      card.className = `task-item-card priority-${task.priority || 'medium'} ${isDone ? 'completed-task' : ''}`;

      const subtasksHtml = Array.isArray(task.subtasks) && task.subtasks.length > 0
        ? `<div class="task-subtasks-wrap">
            ${task.subtasks.map((st) => `
              <div class="subtask-pill-item ${st.done ? 'done' : ''}" data-task-id="${task.id}" data-subtask-id="${st.id}">
                <span>${st.done ? '☑️' : '⬜'}</span>
                <span>${escapeHtml(st.text)}</span>
              </div>
            `).join('')}
          </div>`
        : '';

      const linkBtnHtml = task.link
        ? `<a href="${escapeHtml(task.link)}" target="_blank" rel="noopener noreferrer" class="task-icon-btn" title="Buka Link Lampiran Tugas">🔗</a>`
        : '';

      card.innerHTML = `
        <div class="task-main-row">
          <div class="task-check-and-info">
            <button class="custom-check-btn ${isDone ? 'checked' : ''}" data-toggle-task="${task.id}" title="Tandai Selesai / Belum">
              ${isDone ? '✓' : ''}
            </button>
            <div class="task-info-col">
              <div class="task-badges-top">
                <span class="badge-course">${escapeHtml(task.course)}</span>
                <span class="badge-category">${escapeHtml(task.category || 'Tugas')}</span>
                <span class="badge-countdown ${isSafe ? 'safe' : ''}">${countdownText}</span>
              </div>
              <h4 class="task-title-text">${escapeHtml(task.title)}</h4>
              ${task.description ? `<p class="task-desc-text">${escapeHtml(task.description)}</p>` : ''}
            </div>
          </div>

          <div class="task-actions-col">
            ${linkBtnHtml}
            <button class="task-icon-btn" data-edit-task="${task.id}" title="Edit Tugas">✎</button>
            <button class="task-icon-btn" data-delete-task="${task.id}" title="Hapus Tugas">🗑️</button>
          </div>
        </div>
        ${subtasksHtml}
      `;

      // Event Listeners inside Task Card
      const toggleBtn = card.querySelector(`[data-toggle-task="${task.id}"]`);
      if (toggleBtn) {
        toggleBtn.addEventListener('click', () => toggleTaskCompletion(task.id));
      }

      const editBtn = card.querySelector(`[data-edit-task="${task.id}"]`);
      if (editBtn) {
        editBtn.addEventListener('click', () => openTaskModal(task.id));
      }

      const delBtn = card.querySelector(`[data-delete-task="${task.id}"]`);
      if (delBtn) {
        delBtn.addEventListener('click', () => deleteTask(task.id));
      }

      card.querySelectorAll('.subtask-pill-item').forEach((stEl) => {
        stEl.addEventListener('click', () => {
          const stId = stEl.getAttribute('data-subtask-id');
          toggleSubtask(task.id, stId);
        });
      });

      listContainer.appendChild(card);
    });
  }

  function toggleTaskCompletion(taskId) {
    const task = appData.tasks.find((t) => t.id === taskId);
    if (!task) return;
    if (task.status === 'completed') {
      task.status = 'pending';
      playSound('pop');
      showToast('Tugas dikembalikan ke daftar aktif', '🔄');
    } else {
      task.status = 'completed';
      playSound('success');
      triggerConfetti();
      showToast('Mantap! Tugas selesai dikerjakan 🎉', '✅');
    }
    saveWorkspace();
    renderAll();
  }

  function toggleSubtask(taskId, subtaskId) {
    const task = appData.tasks.find((t) => t.id === taskId);
    if (!task || !Array.isArray(task.subtasks)) return;
    const st = task.subtasks.find((s) => s.id === subtaskId);
    if (!st) return;
    st.done = !st.done;
    playSound('pop');

    // If all subtasks are done and task was pending, set to in-progress
    const allDone = task.subtasks.length > 0 && task.subtasks.every((s) => s.done);
    if (allDone && task.status === 'pending') {
      task.status = 'in-progress';
    }
    saveWorkspace();
    renderAll();
  }

  function deleteTask(taskId) {
    appData.tasks = appData.tasks.filter((t) => t.id !== taskId);
    playSound('pop');
    saveWorkspace();
    renderAll();
    showToast('Tugas telah dihapus', '🗑️');
  }

  // ==========================================================================
  // RENDERING ENGINE: VIEW 3 — KALENDER KAMPUS & PINK AUDIENCE/STUDY FLOW
  // ==========================================================================
  function renderCalendarView() {
    // 1. Update Pink Highlight Header for `selectedCalendarDate`
    const parts = selectedCalendarDate.split('-').map(Number);
    const selDateObj = new Date(parts[0], parts[1] - 1, parts[2]);

    const dayNumEl = document.getElementById('selectedCalDayNum');
    const monthNameEl = document.getElementById('selectedCalMonthName');
    const dayNameEl = document.getElementById('selectedCalDayName');
    const taskCountEl = document.getElementById('selectedCalTaskCount');
    const nextTimeEl = document.getElementById('selectedCalNextTime');

    const tasksOnDate = appData.tasks.filter((t) => t.dueDate === selectedCalendarDate);
    const notesOnDate = appData.notes.filter((n) => n.date === selectedCalendarDate);
    const totalAgenda = tasksOnDate.length + notesOnDate.length;

    if (dayNumEl) dayNumEl.textContent = String(selDateObj.getDate());
    if (monthNameEl) monthNameEl.textContent = MONTHS_ID[selDateObj.getMonth()];
    if (dayNameEl) dayNameEl.textContent = `${DAYS_ID[selDateObj.getDay()]}, ${selDateObj.getFullYear()}`;
    if (taskCountEl) taskCountEl.textContent = `${totalAgenda} Agenda`;
    if (nextTimeEl) {
      if (tasksOnDate.length > 0) {
        nextTimeEl.textContent = `Pukul ${tasksOnDate[0].dueTime || '19:00'}`;
      } else {
        nextTimeEl.textContent = 'Jadwal Kosong ✨';
      }
    }

    // 2. Render Weekly Day Strip (SN SL RB KM JM SB MG around selectedCalendarDate)
    renderWeeklyFlowStrip(selDateObj);

    // 3. Render Monthly Calendar Grid
    const monthTitleEl = document.getElementById('calMonthYearTitle');
    if (monthTitleEl) {
      monthTitleEl.textContent = `${MONTHS_ID[currentCalendarMonth]} ${currentCalendarYear}`;
    }

    const gridEl = document.getElementById('calendarDaysGrid');
    if (!gridEl) return;
    gridEl.innerHTML = '';

    const firstDayOfMonth = new Date(currentCalendarYear, currentCalendarMonth, 1);
    // Convert Sunday=0..Saturday=6 into Monday=0..Sunday=6
    const startWeekday = (firstDayOfMonth.getDay() + 6) % 7;
    const daysInMonth = new Date(currentCalendarYear, currentCalendarMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentCalendarYear, currentCalendarMonth, 0).getDate();
    const todayStr = getOffsetDateStr(0);

    // Previous month trailing cells
    for (let i = startWeekday - 1; i >= 0; i--) {
      const dNum = daysInPrevMonth - i;
      const cell = document.createElement('div');
      cell.className = 'cal-day-cell other-month';
      cell.innerHTML = `<span class="cal-day-num">${dNum}</span>`;
      gridEl.appendChild(cell);
    }

    // Current month cells
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentCalendarYear}-${String(currentCalendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayTasks = appData.tasks.filter((t) => t.dueDate === dateStr);
      const dayNotes = appData.notes.filter((n) => n.date === dateStr);

      const cell = document.createElement('div');
      cell.className = 'cal-day-cell';
      if (dateStr === todayStr) cell.classList.add('is-today');
      if (dateStr === selectedCalendarDate) cell.classList.add('is-selected');

      let dotsHtml = '';
      dayTasks.forEach((t) => {
        if (t.status === 'completed') {
          dotsHtml += `<span class="cal-dot done" title="Selesai: ${escapeHtml(t.title)}"></span>`;
        } else if (t.priority === 'high') {
          dotsHtml += `<span class="cal-dot urgent" title="Mendesak: ${escapeHtml(t.title)}"></span>`;
        } else {
          dotsHtml += `<span class="cal-dot task" title="Tugas: ${escapeHtml(t.title)}"></span>`;
        }
      });
      dayNotes.forEach((n) => {
        dotsHtml += `<span class="cal-dot note" title="Catatan: ${escapeHtml(n.title)}"></span>`;
      });

      cell.innerHTML = `
        <span class="cal-day-num">${day}</span>
        <div class="cal-day-dots">${dotsHtml}</div>
      `;

      cell.addEventListener('click', () => {
        playSound('pop');
        selectedCalendarDate = dateStr;
        renderCalendarView();
      });

      gridEl.appendChild(cell);
    }

    // 4. Render Selected Date Agenda List
    const agendaHeading = document.getElementById('agendaDateHeading');
    const agendaList = document.getElementById('selectedDateAgendaList');
    if (agendaHeading) {
      agendaHeading.textContent = `Agenda & Catatan • ${formatDateDisplay(selectedCalendarDate)}`;
    }
    if (!agendaList) return;

    agendaList.innerHTML = '';
    if (tasksOnDate.length === 0 && notesOnDate.length === 0) {
      agendaList.innerHTML = `
        <div class="sage-pill-row" style="background:#FFFFFF;">
          <div class="sage-row-left">
            <span class="sage-row-icon">✨</span>
            <div class="sage-row-text">
              <span class="sage-row-title">Belum ada deadline atau catatan di tanggal ini</span>
              <span class="sage-row-meta">Klik "+ Tugas" atau "+ Catatan" di atas untuk menambahkan</span>
            </div>
          </div>
        </div>
      `;
      return;
    }

    tasksOnDate.forEach((t) => {
      const item = document.createElement('div');
      item.className = 'sage-pill-row';
      item.style.background = '#FFFFFF';
      item.innerHTML = `
        <div class="sage-row-left">
          <span class="sage-row-icon">${t.status === 'completed' ? '✅' : t.priority === 'high' ? '🔥' : '📋'}</span>
          <div class="sage-row-text">
            <span class="sage-row-title">${escapeHtml(t.title)}</span>
            <span class="sage-row-meta">${escapeHtml(t.course)} • Jam ${t.dueTime || '23:59'}</span>
          </div>
        </div>
        <span class="sage-row-chevron">Edit ›</span>
      `;
      item.addEventListener('click', () => openTaskModal(t.id));
      agendaList.appendChild(item);
    });

    notesOnDate.forEach((n) => {
      const item = document.createElement('div');
      item.className = 'sage-pill-row';
      item.style.background = '#FFFFFF';
      item.innerHTML = `
        <div class="sage-row-left">
          <span class="sage-row-icon">📓</span>
          <div class="sage-row-text">
            <span class="sage-row-title">${escapeHtml(n.title)}</span>
            <span class="sage-row-meta">Catatan ${escapeHtml(n.course)}</span>
          </div>
        </div>
        <span class="sage-row-chevron">Buka ›</span>
      `;
      item.addEventListener('click', () => {
        activeNoteId = n.id;
        switchView('view-notes');
        renderNotesStudio();
      });
      agendaList.appendChild(item);
    });
  }

  // Render the Weekly Strip & SVG Wave + Hatched Bar Chart (Matches Pink Screen Reference)
  function renderWeeklyFlowStrip(centerDateObj) {
    const stripEl = document.getElementById('weekPillsStrip');
    const chartBox = document.getElementById('pinkWaveChartBox');
    if (!stripEl || !chartBox) return;

    // Get Monday of the selected week
    const dayOfWeek = (centerDateObj.getDay() + 6) % 7; // 0=Mon .. 6=Sun
    const monday = new Date(centerDateObj);
    monday.setDate(centerDateObj.getDate() - dayOfWeek);

    stripEl.innerHTML = '';
    const weekDates = [];
    const weekScores = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      weekDates.push(dStr);

      const countTasks = appData.tasks.filter((t) => t.dueDate === dStr).length;
      const countNotes = appData.notes.filter((n) => n.date === dStr).length;
      // Base visual curve + actual task/note weight
      const baseWave = [52, 68, 45, 78, 86, 60, 72][i];
      const score = Math.min(98, baseWave + countTasks * 12 + countNotes * 8);
      weekScores.push(score);

      const pill = document.createElement('button');
      pill.className = 'week-day-pill';
      if (dStr === selectedCalendarDate) {
        pill.classList.add('active-magenta');
      } else if (countTasks > 0) {
        pill.classList.add('active-black');
      }
      pill.innerHTML = `<span>${WEEK_STRIP_LABELS[i]}</span><small style="font-size:0.62rem;opacity:0.8;">${d.getDate()}</small>`;
      pill.addEventListener('click', () => {
        playSound('pop');
        selectedCalendarDate = dStr;
        currentCalendarMonth = d.getMonth();
        currentCalendarYear = d.getFullYear();
        renderCalendarView();
      });
      stripEl.appendChild(pill);
    }

    const activeIdx = Math.max(0, weekDates.indexOf(selectedCalendarDate));
    const activeScore = weekScores[activeIdx] || 73;

    // Build SVG matching the Top-Right Pink "Audience Flow 73%" screen
    const width = 360;
    const height = 195;
    const colWidth = width / 7;
    const points = weekScores.map((s, idx) => ({
      x: Math.round(colWidth * idx + colWidth / 2),
      y: Math.round(145 - (s / 100) * 95)
    }));

    // Smooth cubic bezier path
    let pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cpx1 = p0.x + (p1.x - p0.x) / 2;
      const cpy1 = p0.y;
      const cpx2 = p0.x + (p1.x - p0.x) / 2;
      const cpy2 = p1.y;
      pathD += ` C ${cpx1} ${cpy1}, ${cpx2} ${cpy2}, ${p1.x} ${p1.y}`;
    }

    const activePt = points[activeIdx];
    const hatchedIdx = (activeIdx + 5) % 7 === activeIdx ? 2 : (activeIdx >= 2 ? activeIdx - 2 : activeIdx + 2);
    const hatchedX = points[hatchedIdx].x - 16;

    chartBox.innerHTML = `
      <svg viewBox="0 0 ${width} ${height}" width="100%" height="100%" style="overflow:visible;">
        <defs>
          <pattern id="diagonalHatch" width="6" height="6" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="6" stroke="#7D2960" stroke-width="2.2" />
          </pattern>
        </defs>

        <!-- Vertical Timeline Grid Lines -->
        ${points.map((pt, i) => `
          <line x1="${pt.x}" y1="22" x2="${pt.x}" y2="152" stroke="rgba(20,20,22,0.18)" stroke-width="1" />
          <text x="${pt.x}" y="170" text-anchor="middle" font-size="10" font-weight="700" fill="#141416">
            ${['09:00', '11:00', '13:00', '15:00', '17:00', '19:00', '21:00'][i]}
          </text>
        `).join('')}

        <!-- Diagonal Hatched Bar Column from Reference Image -->
        <rect x="${hatchedX}" y="38" width="32" height="114" rx="4" fill="url(#diagonalHatch)" opacity="0.85" />

        <!-- Dotted Secondary Wave -->
        <path d="${pathD}" fill="none" stroke="rgba(255,255,255,0.75)" stroke-width="2.5" stroke-dasharray="3 4" transform="translate(0, 12)" />

        <!-- Main Smooth Curve -->
        <path d="${pathD}" fill="none" stroke="#C53B96" stroke-width="2.5" />

        <!-- Active Percentage Label & Marker Dot -->
        <text x="${activePt.x}" y="${Math.max(24, activePt.y - 16)}" text-anchor="middle" font-size="22" font-weight="800" fill="#141416">
          ${activeScore}%
        </text>
        <circle cx="${activePt.x}" cy="${activePt.y}" r="5.5" fill="#141416" stroke="#FFFFFF" stroke-width="2" />
        <text x="${activePt.x}" y="190" text-anchor="middle" font-size="14" font-weight="700" fill="#FFFFFF">
          Fokus Optimal
        </text>
      </svg>
    `;
  }

  // ==========================================================================
  // RENDERING ENGINE: VIEW 4 — CATATAN KULIAH STUDIO
  // ==========================================================================
  function renderNotesStudio() {
    // 1. Render Course Filter Chips
    const chipsContainer = document.getElementById('notesCourseChips');
    if (chipsContainer) {
      const allCourses = ['all', ...appData.courses];
      chipsContainer.innerHTML = allCourses.map((c) => {
        const label = c === 'all' ? '📚 Semua' : c;
        const activeClass = currentNoteCourseFilter === c ? 'active' : '';
        return `<button class="course-chip ${activeClass}" data-note-course-chip="${escapeHtml(c)}">${escapeHtml(label)}</button>`;
      }).join('');

      chipsContainer.querySelectorAll('[data-note-course-chip]').forEach((btn) => {
        btn.addEventListener('click', () => {
          currentNoteCourseFilter = btn.getAttribute('data-note-course-chip');
          playSound('pop');
          renderNotesStudio();
        });
      });
    }

    // 2. Filter Notes List
    let filteredNotes = [...appData.notes];
    if (currentNoteCourseFilter !== 'all') {
      filteredNotes = filteredNotes.filter((n) => n.course === currentNoteCourseFilter);
    }
    if (currentNoteSearchQuery.trim()) {
      const q = currentNoteSearchQuery.toLowerCase();
      filteredNotes = filteredNotes.filter((n) =>
        (n.title || '').toLowerCase().includes(q) ||
        (n.course || '').toLowerCase().includes(q) ||
        (n.tag || '').toLowerCase().includes(q) ||
        stripHtml(n.content || '').toLowerCase().includes(q)
      );
    }

    // Sort pinned first, then most recently updated
    filteredNotes.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return (b.updatedAt || '').localeCompare(a.updatedAt || '');
    });

    const listEl = document.getElementById('notesCardsList');
    if (listEl) {
      listEl.innerHTML = '';
      filteredNotes.forEach((note) => {
        const card = document.createElement('div');
        card.className = `note-list-card ${note.id === activeNoteId ? 'active-note' : ''}`;
        card.setAttribute('data-color', note.color || 'cream');
        const snippet = stripHtml(note.content || '').slice(0, 95) || 'Catatan kosong...';
        card.innerHTML = `
          <div class="note-card-meta-top">
            <span>${escapeHtml(note.course)}</span>
            <span>${note.pinned ? '📌 ' : ''}${formatDateDisplay(note.date)}</span>
          </div>
          <div class="note-card-title">${escapeHtml(note.title || 'Tanpa Judul')}</div>
          <div class="note-card-snippet">${escapeHtml(snippet)}</div>
        `;
        card.addEventListener('click', () => {
          activeNoteId = note.id;
          playSound('pop');
          renderNotesStudio();
        });
        listEl.appendChild(card);
      });
    }

    // 3. Populate Active Note Editor
    let activeNote = appData.notes.find((n) => n.id === activeNoteId);
    if (!activeNote && appData.notes.length > 0) {
      activeNote = appData.notes[0];
      activeNoteId = activeNote.id;
    }

    const courseSel = document.getElementById('activeNoteCourseSelect');
    if (courseSel) {
      courseSel.innerHTML = appData.courses.map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
    }

    if (!activeNote) return;

    if (courseSel) courseSel.value = activeNote.course || appData.courses[0];
    const dateInput = document.getElementById('activeNoteDateInput');
    if (dateInput) dateInput.value = activeNote.date || getOffsetDateStr(0);

    const tagInput = document.getElementById('activeNoteTagInput');
    if (tagInput) tagInput.value = activeNote.tag || '';

    const titleInput = document.getElementById('activeNoteTitleInput');
    if (titleInput && document.activeElement !== titleInput) {
      titleInput.value = activeNote.title || '';
    }

    const bodyEditor = document.getElementById('activeNoteBodyEditor');
    if (bodyEditor && document.activeElement !== bodyEditor) {
      bodyEditor.innerHTML = activeNote.content || '';
    }

    const paperCanvas = document.getElementById('notePaperCanvas');
    if (paperCanvas) {
      paperCanvas.setAttribute('data-note-theme', activeNote.color || 'cream');
    }

    document.querySelectorAll('#noteColorPicker .color-swatch').forEach((sw) => {
      sw.classList.toggle('active', sw.getAttribute('data-color') === (activeNote.color || 'cream'));
    });

    const pinBtn = document.getElementById('togglePinNoteBtn');
    if (pinBtn) {
      pinBtn.classList.toggle('pinned', Boolean(activeNote.pinned));
      pinBtn.textContent = activeNote.pinned ? '📌 Disematkan' : '📌 Sematkan';
    }

    updateNoteWordCount();
  }

  function updateNoteWordCount() {
    const bodyEditor = document.getElementById('activeNoteBodyEditor');
    const countEl = document.getElementById('noteWordCount');
    if (!bodyEditor || !countEl) return;
    const text = stripHtml(bodyEditor.innerHTML).trim();
    const words = text ? text.split(/\s+/).length : 0;
    countEl.textContent = `${words} kata`;
  }

  function createNewNote(prefillDate = null) {
    const newNote = {
      id: 'note-' + Date.now(),
      title: 'Catatan Kuliah Baru',
      course: currentNoteCourseFilter !== 'all' ? currentNoteCourseFilter : (appData.courses[0] || 'Umum'),
      date: prefillDate || getOffsetDateStr(0),
      tag: 'Pertemuan Baru • Materi Kuliah',
      color: 'yellow',
      pinned: false,
      updatedAt: new Date().toISOString(),
      content: `<p>Mulai tulis poin penting perkuliahan di sini...</p>`
    };
    appData.notes.unshift(newNote);
    activeNoteId = newNote.id;
    playSound('pop');
    saveWorkspace();
    switchView('view-notes');
    renderAll();
    const titleInput = document.getElementById('activeNoteTitleInput');
    if (titleInput) {
      titleInput.focus();
      titleInput.select();
    }
    showToast('Catatan kuliah baru dibuat ✨', '📝');
  }

  // ==========================================================================
  // TASK MODAL LOGIC (CREATE & EDIT TASK)
  // ==========================================================================
  function openTaskModal(taskId = null, prefillDate = null) {
    const modal = document.getElementById('taskModalBackdrop');
    const titleEl = document.getElementById('taskModalTitle');
    const courseSel = document.getElementById('taskCourseInput');
    if (!modal || !courseSel) return;

    courseSel.innerHTML = appData.courses.map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');

    const existing = taskId ? appData.tasks.find((t) => t.id === taskId) : null;
    document.getElementById('taskFormId').value = existing ? existing.id : '';
    document.getElementById('taskTitleInput').value = existing ? existing.title : '';
    courseSel.value = existing ? existing.course : (appData.courses[0] || '');
    document.getElementById('taskCategoryInput').value = existing ? (existing.category || 'Tugas Individu') : 'Tugas Individu';
    document.getElementById('taskDueDateInput').value = existing ? existing.dueDate : (prefillDate || getOffsetDateStr(1));
    document.getElementById('taskDueTimeInput').value = existing ? (existing.dueTime || '23:59') : '23:59';
    document.getElementById('taskPriorityInput').value = existing ? (existing.priority || 'medium') : 'high';
    document.getElementById('taskDescInput').value = existing ? (existing.description || '') : '';
    document.getElementById('taskLinkInput').value = existing ? (existing.link || '') : '';

    tempSubtasks = existing && Array.isArray(existing.subtasks)
      ? existing.subtasks.map((s) => ({ ...s }))
      : [];

    if (titleEl) {
      titleEl.textContent = existing ? '✎ Edit Tugas Kampus' : '✨ Tambah Tugas Kampus';
    }

    renderTempSubtasksBuilder();
    modal.classList.remove('hidden');
  }

  function renderTempSubtasksBuilder() {
    const container = document.getElementById('subtasksBuilderList');
    if (!container) return;
    container.innerHTML = tempSubtasks.map((st, idx) => `
      <div class="subtask-builder-item">
        <span>• ${escapeHtml(st.text)}</span>
        <button type="button" data-remove-subtask="${idx}" style="color:#EF4444;font-weight:800;">✕</button>
      </div>
    `).join('');

    container.querySelectorAll('[data-remove-subtask]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.getAttribute('data-remove-subtask'));
        tempSubtasks.splice(idx, 1);
        renderTempSubtasksBuilder();
      });
    });
  }

  // ==========================================================================
  // POMODORO TIMER LOGIC
  // ==========================================================================
  let pomoSecondsLeft = 25 * 60;
  let pomoRunning = false;
  let pomoInterval = null;

  function updatePomodoroDisplay() {
    const mins = Math.floor(pomoSecondsLeft / 60);
    const secs = pomoSecondsLeft % 60;
    const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    const digitsEl = document.getElementById('pomoTimeDigits');
    const islandText = document.getElementById('islandStatusText');
    const totalEl = document.getElementById('pomoTodayTotalMins');

    if (digitsEl) digitsEl.textContent = formatted;
    if (islandText) {
      islandText.textContent = pomoRunning ? `⏱️ Fokus ${formatted}` : 'Siap Nugas ✨';
    }
    if (totalEl) {
      totalEl.textContent = String(appData.profile.focusMinutesToday || 75);
    }
  }

  function togglePomodoro() {
    const btn = document.getElementById('pomoToggleBtn');
    if (pomoRunning) {
      pomoRunning = false;
      clearInterval(pomoInterval);
      if (btn) btn.textContent = '▶ Lanjut Fokus';
    } else {
      pomoRunning = true;
      if (btn) btn.textContent = '⏸ Jeda';
      pomoInterval = setInterval(() => {
        if (pomoSecondsLeft > 0) {
          pomoSecondsLeft--;
          updatePomodoroDisplay();
        } else {
          clearInterval(pomoInterval);
          pomoRunning = false;
          appData.profile.focusMinutesToday = (appData.profile.focusMinutesToday || 75) + 25;
          playSound('success');
          triggerConfetti();
          saveWorkspace();
          renderAll();
          updatePomodoroDisplay();
          if (btn) btn.textContent = '▶ Mulai Fokus';
          showToast('Sesi Fokus Pomodoro Selesai! +150 XP 🔥', '🎉');
        }
      }, 1000);
    }
    updatePomodoroDisplay();
  }

  // ==========================================================================
  // UTILITIES
  // ==========================================================================
  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function stripHtml(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html || '';
    return tmp.textContent || tmp.innerText || '';
  }

  function copyShareableLinkToClipboard() {
    const link = getShareablePermanentLink();
    navigator.clipboard.writeText(link).then(() => {
      playSound('success');
      showToast('Link Catatan Online berhasil disalin! Buka di mana saja tidak akan hilang 🔗', '✅');
    }).catch(() => {
      // Fallback
      const input = document.getElementById('shareableFullLinkInput');
      if (input) {
        input.value = link;
        input.select();
        document.execCommand('copy');
        showToast('Link Catatan Online berhasil disalin! 🔗', '✅');
      }
    });
  }

  function renderAll() {
    renderHeaderAndProfile();
    renderDashboard();
    renderTasksView();
    renderCalendarView();
    renderNotesStudio();
    updatePomodoroDisplay();
  }

  // ==========================================================================
  // EVENT LISTENERS BINDING
  // ==========================================================================
  function bindEvents() {
    // View Navigation (Top tabs + Bottom Dock + Bento Cards)
    document.querySelectorAll('[data-target-view]').forEach((btn) => {
      btn.addEventListener('click', () => {
        switchView(btn.getAttribute('data-target-view'));
      });
    });

    document.querySelectorAll('[data-goto-view]').forEach((card) => {
      card.addEventListener('click', () => {
        switchView(card.getAttribute('data-goto-view'));
      });
    });

    // Peeking Stacked Folder Tabs (Pink, Blue, Lavender)
    document.querySelectorAll('.peeking-layer').forEach((layer) => {
      layer.addEventListener('click', () => {
        currentStackFilter = layer.getAttribute('data-stack-filter');
        playSound('pop');
        renderSageStackedCard();
      });
    });

    const cycleStackBtn = document.getElementById('cycleStackTabBtn');
    if (cycleStackBtn) {
      cycleStackBtn.addEventListener('click', () => {
        const order = ['priority', 'upcoming', 'pinned-notes'];
        const nextIdx = (order.indexOf(currentStackFilter) + 1) % order.length;
        currentStackFilter = order[nextIdx];
        playSound('pop');
        renderSageStackedCard();
      });
    }

    // Theme Vibe Selector
    document.querySelectorAll('#vibeSelector .seg-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#vibeSelector .seg-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        document.body.setAttribute('data-theme-vibe', btn.getAttribute('data-vibe'));
        playSound('pop');
      });
    });

    // Phone Frame Preview Mode Toggle
    const frameBtn = document.getElementById('toggleFrameModeBtn');
    if (frameBtn) {
      frameBtn.addEventListener('click', () => {
        document.body.classList.toggle('phone-frame-mode');
        playSound('pop');
        const isPhone = document.body.classList.contains('phone-frame-mode');
        showToast(isPhone ? 'Mode Preview Frame HP Aktif 📱' : 'Mode Workspace Layar Penuh Aktif 💻', '✨');
      });
    }

    // Sound Toggle
    const soundBtn = document.getElementById('toggleSoundBtn');
    if (soundBtn) {
      soundBtn.addEventListener('click', () => {
        soundEnabled = !soundEnabled;
        document.getElementById('soundIcon').textContent = soundEnabled ? '🔊' : '🔇';
        showToast(soundEnabled ? 'Efek suara diaktifkan 🔊' : 'Efek suara dibisukan 🔇');
      });
    }

    // Center Dock FAB + Menu
    const fabBtn = document.getElementById('dockFabButton');
    const fabMenu = document.getElementById('fabQuickMenu');
    if (fabBtn && fabMenu) {
      fabBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        playSound('pop');
        fabMenu.classList.toggle('hidden');
        fabBtn.classList.toggle('active');
      });
    }

    document.getElementById('fabNewTaskBtn')?.addEventListener('click', () => {
      fabMenu?.classList.add('hidden');
      fabBtn?.classList.remove('active');
      openTaskModal();
    });
    document.getElementById('fabNewNoteBtn')?.addEventListener('click', () => {
      fabMenu?.classList.add('hidden');
      fabBtn?.classList.remove('active');
      createNewNote();
    });
    document.getElementById('fabStartPomodoroBtn')?.addEventListener('click', () => {
      fabMenu?.classList.add('hidden');
      fabBtn?.classList.remove('active');
      document.getElementById('pomodoroModalBackdrop')?.classList.remove('hidden');
    });
    document.getElementById('fabCopyCloudLinkBtn')?.addEventListener('click', () => {
      fabMenu?.classList.add('hidden');
      fabBtn?.classList.remove('active');
      copyShareableLinkToClipboard();
    });

    // Hero & Quick Buttons
    document.getElementById('openNewTaskModalHeroBtn')?.addEventListener('click', () => openTaskModal());
    document.getElementById('openNewTaskModalStickerBtn')?.addEventListener('click', () => openTaskModal());
    document.getElementById('addTaskMainBtn')?.addEventListener('click', () => openTaskModal());
    document.getElementById('blushQuickAddTaskBtn')?.addEventListener('click', () => openTaskModal());
    document.getElementById('blushQuickAddNoteBtn')?.addEventListener('click', () => createNewNote());
    document.getElementById('quickAddNoteHeroBtn')?.addEventListener('click', () => createNewNote());
    document.getElementById('openQuickNotesBtn')?.addEventListener('click', () => switchView('view-notes'));
    document.getElementById('createNewNoteBtn')?.addEventListener('click', () => createNewNote());

    // Task Filters
    document.querySelectorAll('#taskStatusFilterGroup .filter-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('#taskStatusFilterGroup .filter-chip').forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');
        currentTaskStatusFilter = chip.getAttribute('data-task-filter');
        playSound('pop');
        renderTasksView();
      });
    });

    document.getElementById('taskCourseFilterSelect')?.addEventListener('change', (e) => {
      currentTaskCourseFilter = e.target.value;
      renderTasksView();
    });

    // Subtask addition inside Task Modal
    const addStBtn = document.getElementById('addSubtaskRowBtn');
    const stInput = document.getElementById('newSubtaskTextInput');
    function addSubtaskFromInput() {
      if (!stInput || !stInput.value.trim()) return;
      tempSubtasks.push({ id: 'st-' + Date.now() + Math.random().toString(36).slice(2, 5), text: stInput.value.trim(), done: false });
      stInput.value = '';
      renderTempSubtasksBuilder();
    }
    addStBtn?.addEventListener('click', addSubtaskFromInput);
    stInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addSubtaskFromInput();
      }
    });

    // Task Form Submit
    document.getElementById('taskForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('taskFormId').value;
      const title = document.getElementById('taskTitleInput').value.trim();
      if (!title) return;

      const payload = {
        id: id || ('task-' + Date.now()),
        title,
        course: document.getElementById('taskCourseInput').value,
        category: document.getElementById('taskCategoryInput').value,
        dueDate: document.getElementById('taskDueDateInput').value,
        dueTime: document.getElementById('taskDueTimeInput').value || '23:59',
        priority: document.getElementById('taskPriorityInput').value,
        description: document.getElementById('taskDescInput').value.trim(),
        link: document.getElementById('taskLinkInput').value.trim(),
        subtasks: tempSubtasks,
        status: 'pending'
      };

      if (id) {
        const idx = appData.tasks.findIndex((t) => t.id === id);
        if (idx !== -1) {
          payload.status = appData.tasks[idx].status;
          appData.tasks[idx] = payload;
        }
        showToast('Tugas berhasil diperbarui ✨');
      } else {
        appData.tasks.unshift(payload);
        showToast('Tugas baru ditambahkan ke kalender & papan! 🚀');
      }

      playSound('success');
      document.getElementById('taskModalBackdrop')?.classList.add('hidden');
      saveWorkspace();
      renderAll();
    });

    // Calendar Controls
    document.getElementById('calPrevMonthBtn')?.addEventListener('click', () => {
      currentCalendarMonth--;
      if (currentCalendarMonth < 0) {
        currentCalendarMonth = 11;
        currentCalendarYear--;
      }
      playSound('pop');
      renderCalendarView();
    });

    document.getElementById('calNextMonthBtn')?.addEventListener('click', () => {
      currentCalendarMonth++;
      if (currentCalendarMonth > 11) {
        currentCalendarMonth = 0;
        currentCalendarYear++;
      }
      playSound('pop');
      renderCalendarView();
    });

    const resetToday = () => {
      const now = new Date();
      currentCalendarMonth = now.getMonth();
      currentCalendarYear = now.getFullYear();
      selectedCalendarDate = getOffsetDateStr(0);
      playSound('pop');
      renderCalendarView();
    };
    document.getElementById('calTodayResetBtn')?.addEventListener('click', resetToday);
    document.getElementById('jumpToTodayBtn')?.addEventListener('click', resetToday);

    document.getElementById('addEventOnSelectedDateBtn')?.addEventListener('click', () => openTaskModal(null, selectedCalendarDate));
    document.getElementById('addTaskForDateBtn')?.addEventListener('click', () => openTaskModal(null, selectedCalendarDate));
    document.getElementById('addNoteForDateBtn')?.addEventListener('click', () => createNewNote(selectedCalendarDate));

    // Notes Editor Auto-Save & Formatting
    const saveActiveNoteChanges = () => {
      const note = appData.notes.find((n) => n.id === activeNoteId);
      if (!note) return;
      note.title = document.getElementById('activeNoteTitleInput').value;
      note.course = document.getElementById('activeNoteCourseSelect').value;
      note.date = document.getElementById('activeNoteDateInput').value;
      note.tag = document.getElementById('activeNoteTagInput').value;
      note.content = document.getElementById('activeNoteBodyEditor').innerHTML;
      note.updatedAt = new Date().toISOString();

      updateNoteWordCount();
      saveWorkspace({ silent: true });

      // Refresh sidebar list snippet without stealing focus
      const activeCardTitle = document.querySelector(`.note-list-card.active-note .note-card-title`);
      const activeCardSnippet = document.querySelector(`.note-list-card.active-note .note-card-snippet`);
      if (activeCardTitle) activeCardTitle.textContent = note.title || 'Tanpa Judul';
      if (activeCardSnippet) activeCardSnippet.textContent = stripHtml(note.content).slice(0, 95);
    };

    ['activeNoteTitleInput', 'activeNoteTagInput', 'activeNoteBodyEditor'].forEach((id) => {
      document.getElementById(id)?.addEventListener('input', saveActiveNoteChanges);
    });
    ['activeNoteCourseSelect', 'activeNoteDateInput'].forEach((id) => {
      document.getElementById(id)?.addEventListener('change', () => {
        saveActiveNoteChanges();
        renderNotesStudio();
      });
    });

    // Note Color Swatches
    document.querySelectorAll('#noteColorPicker .color-swatch').forEach((sw) => {
      sw.addEventListener('click', () => {
        const note = appData.notes.find((n) => n.id === activeNoteId);
        if (!note) return;
        note.color = sw.getAttribute('data-color');
        playSound('pop');
        saveWorkspace();
        renderNotesStudio();
      });
    });

    // Pin / Delete / Share Note
    document.getElementById('togglePinNoteBtn')?.addEventListener('click', () => {
      const note = appData.notes.find((n) => n.id === activeNoteId);
      if (!note) return;
      note.pinned = !note.pinned;
      playSound('pop');
      saveWorkspace();
      renderNotesStudio();
      showToast(note.pinned ? 'Catatan disematkan di atas 📌' : 'Sematan catatan dilepas');
    });

    document.getElementById('deleteActiveNoteBtn')?.addEventListener('click', () => {
      if (appData.notes.length <= 1) {
        showToast('Minimal harus ada 1 catatan kuliah tersimpan', '⚠️');
        return;
      }
      appData.notes = appData.notes.filter((n) => n.id !== activeNoteId);
      activeNoteId = appData.notes[0]?.id || null;
      playSound('pop');
      saveWorkspace();
      renderAll();
      showToast('Catatan dihapus', '🗑️');
    });

    document.getElementById('shareSingleNoteLinkBtn')?.addEventListener('click', copyShareableLinkToClipboard);

    // Rich Formatting Toolbar Buttons
    document.querySelectorAll('.editor-formatting-toolbar [data-cmd]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const cmd = btn.getAttribute('data-cmd');
        document.getElementById('activeNoteBodyEditor')?.focus();
        document.execCommand(cmd, false, null);
        saveActiveNoteChanges();
      });
    });

    document.querySelectorAll('.editor-formatting-toolbar [data-highlight]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const color = btn.getAttribute('data-highlight');
        document.getElementById('activeNoteBodyEditor')?.focus();
        document.execCommand('hiliteColor', false, color);
        saveActiveNoteChanges();
      });
    });

    document.querySelectorAll('.editor-formatting-toolbar [data-custom-fmt]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const type = btn.getAttribute('data-custom-fmt');
        const editor = document.getElementById('activeNoteBodyEditor');
        if (!editor) return;
        editor.focus();
        if (type === 'h2') {
          document.execCommand('formatBlock', false, 'H2');
        } else if (type === 'h3') {
          document.execCommand('formatBlock', false, 'H3');
        } else if (type === 'checklist') {
          document.execCommand('insertHTML', false, `<div>☑️ <b>Item langkah tugas...</b></div>`);
        } else if (type === 'callout') {
          document.execCommand('insertHTML', false, `<div class="note-callout-box">💡 <b>Poin Penting:</b> Tulis ringkasan rumus atau konsep utama di sini...</div><p><br></p>`);
        } else if (type === 'code') {
          document.execCommand('insertHTML', false, `<pre class="note-code-block">// Tulis kode program di sini\nconsole.log("Semangat Nugas!");</pre><p><br></p>`);
        }
        saveActiveNoteChanges();
      });
    });

    // Notes Search Input
    document.getElementById('notesSearchInput')?.addEventListener('input', (e) => {
      currentNoteSearchQuery = e.target.value;
      renderNotesStudio();
    });

    // Cloud Sync & Link Modal
    const openSyncModal = () => {
      const modal = document.getElementById('syncModalBackdrop');
      const linkInput = document.getElementById('shareableFullLinkInput');
      const codeInput = document.getElementById('workspaceCodeInput');
      if (linkInput) linkInput.value = getShareablePermanentLink();
      if (codeInput) codeInput.value = currentSpaceId;
      modal?.classList.remove('hidden');
      playSound('pop');
    };

    document.getElementById('openSyncModalBtn')?.addEventListener('click', openSyncModal);
    document.getElementById('bentoOpenCloudBtn')?.addEventListener('click', openSyncModal);
    document.getElementById('quickCopyLinkBtn')?.addEventListener('click', copyShareableLinkToClipboard);
    document.getElementById('copyFullLinkModalBtn')?.addEventListener('click', copyShareableLinkToClipboard);

    document.getElementById('switchWorkspaceBtn')?.addEventListener('click', async () => {
      const codeInput = document.getElementById('workspaceCodeInput');
      if (!codeInput || !codeInput.value.trim()) return;
      const newSpace = codeInput.value.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-');
      currentSpaceId = newSpace;
      const url = new URL(window.location.href);
      url.searchParams.set('space', currentSpaceId);
      url.hash = '';
      window.history.replaceState(null, '', url.toString());
      await initWorkspaceLoad();
      document.getElementById('syncModalBackdrop')?.classList.add('hidden');
      showToast(`Beralih ke Ruang Kerja #${currentSpaceId} ☁️`);
    });

    // Export & Import JSON Backup
    document.getElementById('exportJsonBtn')?.addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(appData, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `nugasin-backup-${currentSpaceId}-${getOffsetDateStr(0)}.json`;
      a.click();
      showToast('File cadangan (.json) berhasil diunduh ⬇️');
    });

    document.getElementById('importJsonInput')?.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const imported = JSON.parse(String(reader.result));
          if (imported && Array.isArray(imported.tasks) && Array.isArray(imported.notes)) {
            appData = imported;
            saveWorkspace();
            renderAll();
            document.getElementById('syncModalBackdrop')?.classList.add('hidden');
            showToast('Data berhasil dipulihkan dari file! 🎉');
          }
        } catch (err) {
          showToast('Format file JSON tidak valid', '⚠️');
        }
      };
      reader.readAsText(file);
    });

    document.getElementById('resetDemoDataBtn')?.addEventListener('click', () => {
      appData = createDefaultWorkspaceData();
      activeNoteId = appData.notes[0]?.id || null;
      saveWorkspace();
      renderAll();
      document.getElementById('syncModalBackdrop')?.classList.add('hidden');
      showToast('Contoh data awal berhasil dimuat ulang ✨');
    });

    // Pomodoro Modal Controls
    document.getElementById('openPomodoroBtn')?.addEventListener('click', () => {
      document.getElementById('pomodoroModalBackdrop')?.classList.remove('hidden');
      playSound('pop');
    });
    document.getElementById('dynamicIslandPill')?.addEventListener('click', () => {
      document.getElementById('pomodoroModalBackdrop')?.classList.remove('hidden');
      playSound('pop');
    });

    document.querySelectorAll('.pomo-mode-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.pomo-mode-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const mins = Number(btn.getAttribute('data-pomo-mins') || 25);
        const label = btn.getAttribute('data-pomo-label') || 'Fokus Belajar';
        clearInterval(pomoInterval);
        pomoRunning = false;
        pomoSecondsLeft = mins * 60;
        document.getElementById('pomoModeLabel').textContent = label;
        document.getElementById('pomoToggleBtn').textContent = '▶ Mulai Fokus';
        updatePomodoroDisplay();
      });
    });

    document.getElementById('pomoToggleBtn')?.addEventListener('click', togglePomodoro);
    document.getElementById('pomoResetBtn')?.addEventListener('click', () => {
      clearInterval(pomoInterval);
      pomoRunning = false;
      const activeMode = document.querySelector('.pomo-mode-btn.active');
      const mins = Number(activeMode?.getAttribute('data-pomo-mins') || 25);
      pomoSecondsLeft = mins * 60;
      document.getElementById('pomoToggleBtn').textContent = '▶ Mulai Fokus';
      updatePomodoroDisplay();
    });

    // Profile & Courses Modal
    const openProfileModal = () => {
      document.getElementById('profileNameInput').value = appData.profile.name || '';
      document.getElementById('profileMajorInput').value = appData.profile.major || '';
      renderCoursesManagerList();
      document.getElementById('profileModalBackdrop')?.classList.remove('hidden');
      playSound('pop');
    };

    document.getElementById('editProfileBtn')?.addEventListener('click', openProfileModal);
    document.getElementById('quickManageCoursesBtn')?.addEventListener('click', openProfileModal);

    function renderCoursesManagerList() {
      const list = document.getElementById('coursesManageList');
      if (!list) return;
      list.innerHTML = appData.courses.map((c, idx) => `
        <div class="subtask-builder-item">
          <span>📚 ${escapeHtml(c)}</span>
          <button type="button" data-del-course="${idx}" style="color:#EF4444;font-weight:800;">✕</button>
        </div>
      `).join('');

      list.querySelectorAll('[data-del-course]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const idx = Number(btn.getAttribute('data-del-course'));
          if (appData.courses.length <= 1) return;
          appData.courses.splice(idx, 1);
          renderCoursesManagerList();
        });
      });
    }

    document.getElementById('addNewCourseBtn')?.addEventListener('click', () => {
      const inp = document.getElementById('newCourseNameInput');
      if (!inp || !inp.value.trim()) return;
      appData.courses.push(inp.value.trim());
      inp.value = '';
      renderCoursesManagerList();
    });

    document.getElementById('saveProfileBtn')?.addEventListener('click', () => {
      appData.profile.name = document.getElementById('profileNameInput').value.trim() || 'Mahasiswa';
      appData.profile.major = document.getElementById('profileMajorInput').value.trim() || 'Semester Aktif';
      document.getElementById('profileModalBackdrop')?.classList.add('hidden');
      saveWorkspace();
      renderAll();
      showToast('Profil & Mata Kuliah berhasil disimpan! 🎓');
    });

    // Global Search Modal (Ctrl+K)
    const openSearch = () => {
      const modal = document.getElementById('searchModalBackdrop');
      const input = document.getElementById('globalSearchInput');
      modal?.classList.remove('hidden');
      input?.focus();
      renderGlobalSearchResults('');
    };

    document.getElementById('openSearchModalBtn')?.addEventListener('click', openSearch);
    document.getElementById('openNotificationsBtn')?.addEventListener('click', () => {
      switchView('view-tasks');
      showToast('Menampilkan daftar deadline & prioritas tugas 🔔');
    });

    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        openSearch();
      }
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-backdrop').forEach((m) => m.classList.add('hidden'));
        document.getElementById('fabQuickMenu')?.classList.add('hidden');
        document.getElementById('dockFabButton')?.classList.remove('active');
      }
    });

    document.getElementById('globalSearchInput')?.addEventListener('input', (e) => {
      renderGlobalSearchResults(e.target.value);
    });

    // Close Modal Buttons & Backdrop Click
    document.querySelectorAll('[data-close-modal]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-close-modal');
        document.getElementById(target)?.classList.add('hidden');
      });
    });

    document.querySelectorAll('.modal-backdrop').forEach((backdrop) => {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) backdrop.classList.add('hidden');
      });
    });
  }

  function renderGlobalSearchResults(query) {
    const container = document.getElementById('globalSearchResults');
    if (!container) return;
    const q = (query || '').toLowerCase().trim();

    const matchedTasks = appData.tasks.filter((t) =>
      !q || t.title.toLowerCase().includes(q) || t.course.toLowerCase().includes(q)
    ).slice(0, 5);

    const matchedNotes = appData.notes.filter((n) =>
      !q || n.title.toLowerCase().includes(q) || n.course.toLowerCase().includes(q) || stripHtml(n.content).toLowerCase().includes(q)
    ).slice(0, 5);

    container.innerHTML = '';

    matchedTasks.forEach((t) => {
      const row = document.createElement('div');
      row.className = 'sage-pill-row';
      row.innerHTML = `
        <div class="sage-row-left">
          <span class="sage-row-icon">📋</span>
          <div class="sage-row-text">
            <span class="sage-row-title">${escapeHtml(t.title)}</span>
            <span class="sage-row-meta">Tugas • ${escapeHtml(t.course)} • ${formatDateDisplay(t.dueDate)}</span>
          </div>
        </div>
        <span class="sage-row-chevron">Buka ›</span>
      `;
      row.addEventListener('click', () => {
        document.getElementById('searchModalBackdrop')?.classList.add('hidden');
        switchView('view-tasks');
        openTaskModal(t.id);
      });
      container.appendChild(row);
    });

    matchedNotes.forEach((n) => {
      const row = document.createElement('div');
      row.className = 'sage-pill-row';
      row.innerHTML = `
        <div class="sage-row-left">
          <span class="sage-row-icon">📝</span>
          <div class="sage-row-text">
            <span class="sage-row-title">${escapeHtml(n.title)}</span>
            <span class="sage-row-meta">Catatan • ${escapeHtml(n.course)}</span>
          </div>
        </div>
        <span class="sage-row-chevron">Buka ›</span>
      `;
      row.addEventListener('click', () => {
        document.getElementById('searchModalBackdrop')?.classList.add('hidden');
        activeNoteId = n.id;
        switchView('view-notes');
        renderNotesStudio();
      });
      container.appendChild(row);
    });
  }

  // Initialize App on DOMContentLoaded
  document.addEventListener('DOMContentLoaded', () => {
    bindEvents();
    initWorkspaceLoad();
  });
})();
