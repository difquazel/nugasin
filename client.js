/* ==========================================================================
   NUGASIN CAMPUS WORKSPACE — GOOGLE AUTH, FIRESTORE CLOUD & REAL-TIME SYNC
   Made by Maurence
   ========================================================================== */

(() => {
  'use strict';

  // SSR / Node.js Serverless Safety Guard (prevents `document is not defined`)
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  const CLIENT_ID = 'client-' + Math.random().toString(36).slice(2, 10);
  const STORAGE_PREFIX = 'nugasin_v2_ws_';
  const LAST_SPACE_KEY = 'nugasin_v2_last_space';
  const RUNTIME_FIREBASE_CFG_KEY = 'nugasin_firebase_config';
  const PRE_CLOUD_BACKUP_KEY = 'nugasin_pre_cloud_backup_latest';
  const MIGRATED_UID_PREFIX = 'nugasin_migrated_uid_';

  // Indonesian Month & Day Names
  const MONTHS_ID = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const MONTHS_SHORT_ID = ['Jan', 'Feb', 'Mar', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  // Fix exact 12-month short array:
  const MONTHS_SHORT_FIXED = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const DAYS_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const WEEK_STRIP_LABELS = ['SN', 'SL', 'RB', 'KM', 'JM', 'SB', 'MG'];

  // ==========================================================================
  // BUILT-IN AVATAR PRESETS (3 COWOK & 3 CEWEK — Instant SVG Data URIs)
  // ==========================================================================
  function svgToDataUri(svgString) {
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svgString.trim());
  }

  const PRESET_AVATARS = [
    {
      id: 'boy-1',
      gender: 'boy',
      label: 'Cowok 1',
      url: svgToDataUri(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
          <rect width="120" height="120" rx="24" fill="#F7DF83"/>
          <circle cx="60" cy="112" r="38" fill="#141416"/>
          <path d="M46 82 h28 v16 h-28 z" fill="#F5CBA7"/>
          <circle cx="60" cy="56" r="26" fill="#FAD7B8"/>
          <path d="M32 50 C32 26, 88 26, 88 50 C88 38, 72 34, 60 35 C46 36, 35 42, 32 50 Z" fill="#1C1C21"/>
          <path d="M36 38 Q60 20 84 38 Q75 26 58 27 Q42 28 36 38 Z" fill="#2A2A32"/>
          <circle cx="50" cy="56" r="3.2" fill="#141416"/>
          <circle cx="70" cy="56" r="3.2" fill="#141416"/>
          <rect x="41" y="49" width="17" height="13" rx="4" fill="none" stroke="#141416" stroke-width="2.4"/>
          <rect x="62" y="49" width="17" height="13" rx="4" fill="none" stroke="#141416" stroke-width="2.4"/>
          <line x1="58" y1="55" x2="62" y2="55" stroke="#141416" stroke-width="2.4"/>
          <path d="M53 68 Q60 74 67 68" fill="none" stroke="#141416" stroke-width="2.6" stroke-linecap="round"/>
        </svg>
      `)
    },
    {
      id: 'boy-2',
      gender: 'boy',
      label: 'Cowok 2',
      url: svgToDataUri(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
          <rect width="120" height="120" rx="24" fill="#B8CFF6"/>
          <circle cx="60" cy="112" r="38" fill="#2B4C7E"/>
          <path d="M48 82 h24 v14 h-24 z" fill="#F1C29B"/>
          <circle cx="60" cy="56" r="25" fill="#F7CFA8"/>
          <path d="M33 52 C33 24, 87 24, 87 52 C82 36, 65 34, 52 38 C42 40, 36 45, 33 52 Z" fill="#3B281E"/>
          <circle cx="50" cy="56" r="3.2" fill="#141416"/>
          <circle cx="70" cy="56" r="3.2" fill="#141416"/>
          <path d="M46 47 Q50 44 54 47" fill="none" stroke="#3B281E" stroke-width="2.4" stroke-linecap="round"/>
          <path d="M66 47 Q70 44 74 47" fill="none" stroke="#3B281E" stroke-width="2.4" stroke-linecap="round"/>
          <path d="M52 67 Q60 74 68 67" fill="none" stroke="#141416" stroke-width="2.6" stroke-linecap="round"/>
        </svg>
      `)
    },
    {
      id: 'boy-3',
      gender: 'boy',
      label: 'Cowok 3',
      url: svgToDataUri(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
          <rect width="120" height="120" rx="24" fill="#BEE3E5"/>
          <circle cx="60" cy="112" r="38" fill="#6461A6"/>
          <path d="M47 82 h26 v15 h-26 z" fill="#E8B892"/>
          <circle cx="60" cy="56" r="25" fill="#F3C6A2"/>
          <path d="M34 48 C34 22, 86 22, 86 48 C80 34, 40 34, 34 48 Z" fill="#141416"/>
          <circle cx="44" cy="34" r="8" fill="#141416"/>
          <circle cx="60" cy="30" r="9" fill="#141416"/>
          <circle cx="75" cy="34" r="8" fill="#141416"/>
          <circle cx="50" cy="56" r="3.2" fill="#141416"/>
          <circle cx="70" cy="56" r="3.2" fill="#141416"/>
          <path d="M53 67 Q60 72 67 67" fill="none" stroke="#141416" stroke-width="2.6" stroke-linecap="round"/>
        </svg>
      `)
    },
    {
      id: 'girl-1',
      gender: 'girl',
      label: 'Cewek 1',
      url: svgToDataUri(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
          <rect width="120" height="120" rx="24" fill="#F3B9DF"/>
          <path d="M28 55 C28 24, 92 24, 92 55 L96 96 L24 96 Z" fill="#231B20"/>
          <circle cx="60" cy="114" r="37" fill="#C94A9E"/>
          <path d="M48 80 h24 v16 h-24 z" fill="#FAD7B8"/>
          <circle cx="60" cy="56" r="24" fill="#FFE0C4"/>
          <path d="M34 50 Q48 32 60 42 Q72 32 86 50 C84 32, 36 32, 34 50 Z" fill="#231B20"/>
          <circle cx="50" cy="56" r="3.2" fill="#141416"/>
          <circle cx="70" cy="56" r="3.2" fill="#141416"/>
          <circle cx="44" cy="62" r="4" fill="#F48FB1" opacity="0.55"/>
          <circle cx="76" cy="62" r="4" fill="#F48FB1" opacity="0.55"/>
          <path d="M54 67 Q60 72 66 67" fill="none" stroke="#141416" stroke-width="2.4" stroke-linecap="round"/>
          <circle cx="80" cy="42" r="4.5" fill="#F7DF83"/>
        </svg>
      `)
    },
    {
      id: 'girl-2',
      gender: 'girl',
      label: 'Cewek 2',
      url: svgToDataUri(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
          <rect width="120" height="120" rx="24" fill="#CBC9F7"/>
          <path d="M28 60 C28 24, 92 24, 92 60 L96 108 L24 108 Z" fill="#6461A6"/>
          <circle cx="60" cy="114" r="38" fill="#141416"/>
          <circle cx="60" cy="57" r="22" fill="#FFE0C4"/>
          <path d="M38 48 Q60 34 82 48 C78 32, 42 32, 38 48 Z" fill="#4A478A"/>
          <circle cx="51" cy="56" r="3" fill="#141416"/>
          <circle cx="69" cy="56" r="3" fill="#141416"/>
          <circle cx="45" cy="62" r="3.8" fill="#F48FB1" opacity="0.5"/>
          <circle cx="75" cy="62" r="3.8" fill="#F48FB1" opacity="0.5"/>
          <path d="M54 66 Q60 71 66 66" fill="none" stroke="#141416" stroke-width="2.4" stroke-linecap="round"/>
        </svg>
      `)
    },
    {
      id: 'girl-3',
      gender: 'girl',
      label: 'Cewek 3',
      url: svgToDataUri(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
          <rect width="120" height="120" rx="24" fill="#F2D6C1"/>
          <circle cx="60" cy="22" r="14" fill="#4A2C20"/>
          <path d="M32 56 C32 28, 88 28, 88 56 L90 92 L30 92 Z" fill="#4A2C20"/>
          <circle cx="60" cy="114" r="37" fill="#9FAF67"/>
          <path d="M48 80 h24 v16 h-24 z" fill="#F7CFA8"/>
          <circle cx="60" cy="57" r="24" fill="#FFE0C4"/>
          <path d="M35 50 Q60 34 85 50 C82 32, 38 32, 35 50 Z" fill="#4A2C20"/>
          <circle cx="50" cy="56" r="3.2" fill="#141416"/>
          <circle cx="70" cy="56" r="3.2" fill="#141416"/>
          <circle cx="44" cy="62" r="4" fill="#F4A2A0" opacity="0.6"/>
          <circle cx="76" cy="62" r="4" fill="#F4A2A0" opacity="0.6"/>
          <path d="M53 67 Q60 73 67 67" fill="none" stroke="#141416" stroke-width="2.4" stroke-linecap="round"/>
        </svg>
      `)
    }
  ];

  // ==========================================================================
  // DATE & FORMATTING HELPERS
  // ==========================================================================
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
    return `${d.getDate()} ${MONTHS_SHORT_FIXED[d.getMonth()]} ${d.getFullYear()}`;
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
  // WEB AUDIO API SOUND ENGINE
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
    } catch (e) {}
  }

  // ==========================================================================
  // CLEAN EMPTY INITIAL DATA (0 Tasks, 0 Notes, Requires Onboarding)
  // ==========================================================================
  const APPEARANCE_CACHE_KEY = 'nugasin_appearance_cache';
  const PENDING_COMPLETIONS_PREFIX = 'nugasin_pending_completions_';
  const WEEKLY_REWARD_XP = 500;
  const WEEKLY_GOAL_TASKS = 5;
  const THEME_PRICE_XP = 3000;

  const THEME_CATALOG = [
    {
      id: 'default',
      name: 'Nugasin Pastel Bento',
      emoji: '✨',
      priceXp: 0,
      isDefault: true,
      swatches: ['#F7DF83', '#9FAF67', '#F3B9DF', '#BFC3F2'],
      description: 'Tema klasik Nugasin dengan warna Butter Yellow, Sage Olive, dan Blush Pastel yang hangat.',
      bannerLabel: '✨ Nugasin Default Theme'
    },
    {
      id: 'christmas',
      name: 'Christmas Wonderland',
      emoji: '🎄',
      priceXp: 3000,
      isDefault: false,
      swatches: ['#991B1B', '#166534', '#FDE68A', '#FECDD3'],
      description: 'Suasana Natal hangat bersama Santa Claus, Rusa Kutub (Reindeer), pohon cemara, dan salju lembut.',
      bannerLabel: '🎄 Christmas Theme • Santa & Reindeer'
    },
    {
      id: 'nature',
      name: 'Peaceful Nature Forest',
      emoji: '🌿',
      priceXp: 3000,
      isDefault: false,
      swatches: ['#3F6212', '#84CC16', '#BBF7D0', '#FDE68A'],
      description: 'Hutan hijau yang tenang bersama karakter Berang-berang (Otter) lucu, burung kecil, dan dedaunan.',
      bannerLabel: '🌿 Nature Theme • Cozy Otter & Forest Birds'
    },
    {
      id: 'antarctica',
      name: 'Antarctica Polar Ice',
      emoji: '🐧',
      priceXp: 3000,
      isDefault: false,
      swatches: ['#0284C7', '#BAE6FD', '#E0E7FF', '#4F46E5'],
      description: 'Dunia es Antartika yang sejuk bersama karakter Penguin menggemaskan, gunung es, dan butiran salju.',
      bannerLabel: '🐧 Antarctica Theme • Playful Penguins & Icebergs'
    }
  ];

  function createDefaultEconomyState() {
    return {
      walletVersion: 0,
      xpBalance: 0,
      lifetimeEarnedXp: 0,
      lifetimeSpentXp: 0,
      purchasedThemes: ['default'],
      activeTheme: 'default',
      rewardedWeeks: {},
      transactions: []
    };
  }

  function createEmptyWorkspaceData() {
    return {
      version: 2,
      updatedAt: new Date().toISOString(),
      updatedAtMs: 0,
      profile: {
        onboarded: false,
        name: '',
        major: '',
        campus: '',
        avatarUrl: PRESET_AVATARS[0].url,
        focusMinutesToday: 0,
        streakDays: 0,
        themeVibe: 'default',
        activeTheme: 'default',
        colorMode: 'system',
        animationsEnabled: true
      },
      courses: [],
      tasks: [],
      notes: []
    };
  }

  function hasMeaningfulData(dataObj) {
    if (!dataObj) return false;
    const hasTasks = Array.isArray(dataObj.tasks) && dataObj.tasks.length > 0;
    const hasNotes = Array.isArray(dataObj.notes) && dataObj.notes.length > 0;
    const hasCourses = Array.isArray(dataObj.courses) && dataObj.courses.length > 0;
    const hasProfile = Boolean(dataObj.profile && dataObj.profile.onboarded && dataObj.profile.name);
    return hasTasks || hasNotes || hasCourses || hasProfile;
  }

  // ==========================================================================
  // IMAGE UPLOAD RESIZER (Crops & Resizes Custom Photo to 200x200 Data URL)
  // ==========================================================================
  function processUploadedAvatarFile(file) {
    return new Promise((resolve, reject) => {
      if (!file || !file.type.startsWith('image/')) {
        reject(new Error('Bukan file gambar'));
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const size = 200;
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');

          const minSide = Math.min(img.width, img.height);
          const sx = (img.width - minSide) / 2;
          const sy = (img.height - minSide) / 2;
          ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);

          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          resolve(dataUrl);
        };
        img.onerror = () => reject(new Error('Gagal memuat gambar'));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error('Gagal membaca file'));
      reader.readAsDataURL(file);
    });
  }

  // ==========================================================================
  // APPLICATION STATE & FIREBASE CLOUD STATE
  // ==========================================================================
  let currentSpaceId = 'ruang-kuliah';
  let appData = createEmptyWorkspaceData();
  let economyState = createDefaultEconomyState();
  let activeNoteId = null;
  let selectedCalendarDate = getOffsetDateStr(0);
  let currentCalendarMonth = new Date().getMonth();
  let currentCalendarYear = new Date().getFullYear();
  let currentStackFilter = 'priority';
  let currentTaskStatusFilter = 'all';
  let currentTaskCourseFilter = 'all';
  let currentNoteCourseFilter = 'all';
  let currentNoteSearchQuery = '';
  let tempSubtasks = [];
  let sseConnection = null;
  let pendingPurchaseThemeId = null;
  let isClaimingWeeklyReward = false;
  let isPurchasingTheme = false;

  // Avatar selection states
  let selectedOnboardingAvatar = PRESET_AVATARS[0].url;
  let selectedProfileModalAvatar = PRESET_AVATARS[0].url;
  let currentAvatarGenderFilter = 'all';

  // Firebase Auth & Firestore state
  let firebaseApp = null;
  let firebaseAuth = null;
  let firestoreDb = null;
  let firebaseReady = false;
  let currentUser = null;
  let authResolved = false;
  let firestoreUnsubscribers = [];
  let isMigrationModalOpen = false;
  let cloudWalletLoaded = false;
  let accountEpoch = 0;
  let pendingCompletions = new Set();
  let completionFlushEpoch = null;
  let completionFlushPromise = null;
  let economySyncError = '';
  let economySyncErrorCode = '';
  let weeklyProgress = null;
  let weeklyProgressUnsubscribe = null;
  let subscribedWeekKey = null;
  let serverTimeAnchor = null;
  let cloudTasksLoaded = false;

  // Granular Cloud Sync Tracking
  let pendingWriteCount = 0;
  let hasFirestorePendingWrites = false;
  let lastSyncError = null;
  const noteDebounceTimers = new Map();
  const pendingNotePayloads = new Map();
  let preferencesDebounceTimer = null;

  // ==========================================================================
  // ASIA/JAKARTA (UTC+7) WEEKLY WINDOW & ISO WEEK CALCULATOR
  // ==========================================================================
  function estimatedServerTime() {
    return serverTimeAnchor
      ? serverTimeAnchor.serverMs + performance.now() - serverTimeAnchor.localMs
      : Date.now();
  }

  function getJakartaWeekInfo(nowMs = estimatedServerTime()) {
    const JAKARTA_OFFSET_MS = 7 * 60 * 60 * 1000;
    const jakartaDate = new Date(nowMs + JAKARTA_OFFSET_MS);

    const year = jakartaDate.getUTCFullYear();
    const month = jakartaDate.getUTCMonth();
    const date = jakartaDate.getUTCDate();
    const dayOfWeek = jakartaDate.getUTCDay(); // 0 = Sun, 1 = Mon, ... 6 = Sat
    const diffToMonday = (dayOfWeek + 6) % 7;

    const mondayJakartaMidnightUtcMs = Date.UTC(year, month, date - diffToMonday, 0, 0, 0, 0);
    const sundayJakartaEndUtcMs =
      mondayJakartaMidnightUtcMs + 7 * 24 * 60 * 60 * 1000 - 1;

    const weekStartUtcMs = mondayJakartaMidnightUtcMs - JAKARTA_OFFSET_MS;
    const weekEndUtcMs = sundayJakartaEndUtcMs - JAKARTA_OFFSET_MS;

    const thursdayJakarta = new Date(mondayJakartaMidnightUtcMs + 3 * 24 * 60 * 60 * 1000);
    const isoYear = thursdayJakarta.getUTCFullYear();
    const jan4 = Date.UTC(isoYear, 0, 4);
    const jan4Day = (new Date(jan4).getUTCDay() + 6) % 7;
    const week1Monday = jan4 - jan4Day * 24 * 60 * 60 * 1000;
    const weekNumber = Math.floor(
      1 + Math.round((mondayJakartaMidnightUtcMs - week1Monday) / (7 * 24 * 60 * 60 * 1000))
    );

    const legacyWeekKey = `${isoYear}-W${String(weekNumber).padStart(2, '0')}`;
    const weekKey = new Date(mondayJakartaMidnightUtcMs).toISOString().slice(0, 10);
    const monDate = new Date(mondayJakartaMidnightUtcMs);
    const sunDate = new Date(sundayJakartaEndUtcMs);
    const periodLabel = `Senin ${monDate.getUTCDate()} ${MONTHS_SHORT_FIXED[monDate.getUTCMonth()]} – Minggu ${sunDate.getUTCDate()} ${MONTHS_SHORT_FIXED[sunDate.getUTCMonth()]}`;

    return {
      weekKey,
      legacyWeekKey,
      weekStartUtcMs,
      weekEndUtcMs,
      periodLabel
    };
  }

  // ==========================================================================
  // DARK MODE, CUSTOM THEME SCENE & PARTICLE ENGINE
  // ==========================================================================
  function saveAppearanceCache() {
    try {
      const cache = {
        colorMode: appData.profile?.colorMode || 'system',
        activeTheme: appData.profile?.activeTheme || 'default',
        animationsEnabled: appData.profile?.animationsEnabled !== false
      };
      localStorage.setItem(APPEARANCE_CACHE_KEY, JSON.stringify(cache));
    } catch (e) {}
  }

  function resolveEffectiveColorMode(prefMode) {
    if (prefMode === 'dark') return 'dark';
    if (prefMode === 'light') return 'light';
    const isSystemDark =
      window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    return isSystemDark ? 'dark' : 'light';
  }

  function getThemeIllustrationSvg(themeId) {
    if (themeId === 'christmas') {
      // Santa Claus, Reindeer, Christmas Trees, Snow & Warm Festive Accents
      return `
        <svg viewBox="0 0 680 90" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <!-- Twinkling Stars & Snowflakes -->
          <g class="svg-anim-twinkle" fill="#FEF08A">
            <circle cx="45" cy="18" r="2.5"/>
            <circle cx="195" cy="14" r="3"/>
            <circle cx="340" cy="20" r="2.2"/>
            <circle cx="510" cy="15" r="2.8"/>
            <circle cx="630" cy="22" r="2.4"/>
          </g>
          <!-- Snowy Hills -->
          <path d="M0 80 Q140 62 310 78 T680 76 L680 95 L0 95 Z" fill="rgba(255,255,255,0.22)"/>
          <!-- Pine Trees Left & Right -->
          <g transform="translate(22, 18)">
            <polygon points="22,6 4,46 40,46" fill="#15803D"/>
            <polygon points="22,20 2,62 42,62" fill="#166534"/>
            <rect x="18" y="62" width="8" height="10" fill="#78350F"/>
            <circle cx="22" cy="6" r="4" fill="#FACC15" class="svg-anim-twinkle"/>
            <circle cx="15" cy="36" r="2.5" fill="#EF4444"/>
            <circle cx="28" cy="48" r="2.5" fill="#FDE047"/>
          </g>
          <g transform="translate(590, 22)">
            <polygon points="20,6 4,44 36,44" fill="#15803D"/>
            <polygon points="20,18 2,58 38,58" fill="#14532D"/>
            <rect x="16" y="58" width="8" height="10" fill="#78350F"/>
            <circle cx="20" cy="6" r="3.5" fill="#FACC15" class="svg-anim-twinkle"/>
          </g>
          <!-- Cute Santa Claus Character -->
          <g transform="translate(110, 12)" class="svg-anim-bob">
            <!-- Body -->
            <ellipse cx="32" cy="56" rx="22" ry="18" fill="#DC2626"/>
            <rect x="10" y="52" width="44" height="6" rx="3" fill="#141416"/>
            <rect x="27" y="50" width="10" height="10" rx="2" fill="#FACC15"/>
            <!-- Head & Beard -->
            <circle cx="32" cy="30" r="14" fill="#FDE2E4"/>
            <path d="M18 32 Q32 54 46 32 Q46 48 32 50 Q18 48 18 32 Z" fill="#FFFFFF"/>
            <!-- Eyes & Rosy Nose -->
            <circle cx="27" cy="27" r="2" fill="#141416"/>
            <circle cx="37" cy="27" r="2" fill="#141416"/>
            <circle cx="32" cy="31" r="3" fill="#EF4444"/>
            <!-- Santa Hat -->
            <path d="M16 24 Q32 4 50 22 Z" fill="#DC2626"/>
            <rect x="15" y="21" width="34" height="6" rx="3" fill="#FFFFFF"/>
            <circle cx="51" cy="20" r="5" fill="#FFFFFF"/>
            <!-- Waving Arm -->
            <g class="svg-anim-wave">
              <path d="M50 46 Q62 34 58 26" stroke="#DC2626" stroke-width="7" stroke-linecap="round" fill="none"/>
              <circle cx="58" cy="25" r="4.5" fill="#15803D"/>
            </g>
          </g>
          <!-- Cute Reindeer Character -->
          <g transform="translate(235, 16)" class="svg-anim-bob">
            <!-- Antlers -->
            <path d="M18 18 L12 6 M15 12 L8 12" stroke="#FEF08A" stroke-width="3" stroke-linecap="round"/>
            <path d="M38 18 L44 6 M41 12 L48 12" stroke="#FEF08A" stroke-width="3" stroke-linecap="round"/>
            <!-- Body & Head -->
            <ellipse cx="28" cy="54" rx="18" ry="14" fill="#B45309"/>
            <circle cx="28" cy="30" r="14" fill="#D97706"/>
            <!-- Collar with Gold Bell -->
            <path d="M15 41 Q28 47 41 41" stroke="#DC2626" stroke-width="4" stroke-linecap="round" fill="none"/>
            <circle cx="28" cy="45" r="4" fill="#FACC15"/>
            <!-- Eyes & Shiny Red Nose -->
            <circle cx="23" cy="27" r="2.2" fill="#141416"/>
            <circle cx="33" cy="27" r="2.2" fill="#141416"/>
            <circle cx="28" cy="33" r="4" fill="#EF4444" class="svg-anim-twinkle"/>
          </g>
          <!-- Festive Gift Boxes -->
          <g transform="translate(390, 40)">
            <rect x="0" y="12" width="26" height="24" rx="4" fill="#FACC15"/>
            <rect x="11" y="12" width="4" height="24" fill="#DC2626"/>
            <rect x="0" y="22" width="26" height="4" fill="#DC2626"/>
            <rect x="34" y="16" width="22" height="20" rx="4" fill="#38BDF8"/>
            <rect x="43" y="16" width="4" height="20" fill="#FEF08A"/>
          </g>
        </svg>
      `;
    }

    if (themeId === 'nature') {
      // Cute Otter, Flying Birds, Forest Trees, Leaves & Flowers
      return `
        <svg viewBox="0 0 680 90" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <!-- Soft Rolling Forest Hills -->
          <path d="M0 78 Q170 58 350 74 T680 72 L680 95 L0 95 Z" fill="rgba(22, 101, 52, 0.14)"/>
          <!-- Pond Ripple for Otter -->
          <ellipse cx="165" cy="74" rx="58" ry="11" fill="rgba(56, 189, 248, 0.32)"/>
          <!-- Forest Trees & Flowers -->
          <g transform="translate(24, 14)">
            <rect x="19" y="46" width="8" height="22" rx="2" fill="#78350F"/>
            <circle cx="23" cy="32" r="20" fill="#15803D"/>
            <circle cx="12" cy="40" r="14" fill="#16A34A"/>
            <circle cx="34" cy="40" r="14" fill="#22C55E"/>
          </g>
          <!-- Cute Otter Character -->
          <g transform="translate(132, 18)" class="svg-anim-bob">
            <!-- Ears -->
            <circle cx="16" cy="18" r="5" fill="#78350F"/>
            <circle cx="44" cy="18" r="5" fill="#78350F"/>
            <!-- Body & Belly -->
            <ellipse cx="30" cy="50" rx="20" ry="17" fill="#92400E"/>
            <ellipse cx="30" cy="52" rx="13" ry="12" fill="#FDE68A"/>
            <!-- Head & Cheeks -->
            <circle cx="30" cy="28" r="16" fill="#92400E"/>
            <ellipse cx="25" cy="31" rx="6" ry="4.5" fill="#FEF3C7"/>
            <ellipse cx="35" cy="31" rx="6" ry="4.5" fill="#FEF3C7"/>
            <!-- Eyes & Cute Nose -->
            <circle cx="24" cy="24" r="2.3" fill="#141416"/>
            <circle cx="36" cy="24" r="2.3" fill="#141416"/>
            <polygon points="30,27 26,30 34,30" fill="#141416"/>
            <!-- Otter holding a little green leaf -->
            <g class="svg-anim-wave">
              <path d="M46 42 Q58 30 52 20" stroke="#15803D" stroke-width="2.5" fill="none"/>
              <ellipse cx="54" cy="20" rx="7" ry="4" transform="rotate(-25 54 20)" fill="#22C55E"/>
            </g>
          </g>
          <!-- Gentle Flying Forest Birds -->
          <g transform="translate(275, 16)" class="svg-anim-glide">
            <ellipse cx="18" cy="18" rx="11" ry="8" fill="#0284C7"/>
            <circle cx="26" cy="14" r="6" fill="#38BDF8"/>
            <polygon points="32,14 38,12 33,17" fill="#F59E0B"/>
            <circle cx="28" cy="13" r="1.5" fill="#141416"/>
            <path d="M12 14 Q6 4 18 10" fill="#7DD3FC"/>
          </g>
          <g transform="translate(355, 26)" class="svg-anim-glide">
            <ellipse cx="14" cy="14" rx="9" ry="6.5" fill="#F59E0B"/>
            <circle cx="21" cy="11" r="5" fill="#FBBF24"/>
            <polygon points="26,11 31,9 27,13" fill="#EA580C"/>
            <circle cx="22" cy="10" r="1.3" fill="#141416"/>
          </g>
          <!-- Blooming Wildflowers -->
          <g transform="translate(470, 48)">
            <line x1="12" y1="14" x2="12" y2="30" stroke="#15803D" stroke-width="2.5"/>
            <circle cx="12" cy="12" r="7" fill="#F472B6"/>
            <circle cx="12" cy="12" r="3" fill="#FACC15"/>
            <line x1="36" y1="18" x2="36" y2="30" stroke="#15803D" stroke-width="2.5"/>
            <circle cx="36" cy="16" r="6" fill="#FBBF24"/>
            <circle cx="36" cy="16" r="2.5" fill="#78350F"/>
          </g>
        </svg>
      `;
    }

    if (themeId === 'antarctica') {
      // Cute Penguins, Icebergs, Snow & Polar Light Blue Accents
      return `
        <svg viewBox="0 0 680 90" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <!-- Distant Polar Icebergs -->
          <polygon points="15,82 55,22 98,82" fill="rgba(255,255,255,0.75)"/>
          <polygon points="55,22 98,82 74,82" fill="rgba(186,230,253,0.85)"/>
          <polygon points="480,82 530,26 585,82" fill="rgba(255,255,255,0.78)"/>
          <polygon points="555,82 595,38 635,82" fill="rgba(125,211,252,0.65)"/>
          <!-- Ice Floe Surface -->
          <path d="M0 78 Q180 68 360 76 T680 74 L680 95 L0 95 Z" fill="rgba(255,255,255,0.55)"/>
          <!-- Penguin 1 (With Cozy Winter Scarf) -->
          <g transform="translate(145, 16)" class="svg-anim-waddle">
            <ellipse cx="26" cy="42" rx="18" ry="24" fill="#1E293B"/>
            <ellipse cx="26" cy="45" rx="12" ry="18" fill="#FFFFFF"/>
            <!-- Feet -->
            <ellipse cx="18" cy="65" rx="6" ry="3" fill="#F97316"/>
            <ellipse cx="34" cy="65" rx="6" ry="3" fill="#F97316"/>
            <!-- Eyes & Beak -->
            <circle cx="20" cy="26" r="2.3" fill="#141416"/>
            <circle cx="32" cy="26" r="2.3" fill="#141416"/>
            <circle cx="17" cy="29" r="2.5" fill="#F472B6" opacity="0.65"/>
            <circle cx="35" cy="29" r="2.5" fill="#F472B6" opacity="0.65"/>
            <polygon points="26,28 21,33 31,33" fill="#F59E0B"/>
            <!-- Cozy Scarf -->
            <path d="M12 36 Q26 42 40 36" stroke="#EF4444" stroke-width="5" stroke-linecap="round" fill="none"/>
            <rect x="31" y="36" width="5" height="12" rx="2" fill="#EF4444"/>
          </g>
          <!-- Penguin 2 (Baby Penguin Waving) -->
          <g transform="translate(230, 26)" class="svg-anim-bob">
            <ellipse cx="22" cy="34" rx="15" ry="19" fill="#334155"/>
            <ellipse cx="22" cy="37" rx="10" ry="14" fill="#FFFFFF"/>
            <ellipse cx="16" cy="52" rx="5" ry="2.5" fill="#F97316"/>
            <ellipse cx="28" cy="52" rx="5" ry="2.5" fill="#F97316"/>
            <circle cx="17" cy="22" r="2" fill="#141416"/>
            <circle cx="27" cy="22" r="2" fill="#141416"/>
            <polygon points="22,24 18,28 26,28" fill="#F59E0B"/>
            <!-- earmuffs -->
            <path d="M10 20 Q22 8 34 20" stroke="#38BDF8" stroke-width="2.5" fill="none"/>
            <circle cx="9" cy="21" r="4" fill="#38BDF8"/>
            <circle cx="35" cy="21" r="4" fill="#38BDF8"/>
          </g>
          <!-- Sparkling Snow Crystals -->
          <g class="svg-anim-twinkle" fill="#FFFFFF">
            <circle cx="330" cy="22" r="3"/>
            <circle cx="390" cy="36" r="2.5"/>
            <circle cx="440" cy="18" r="3.2"/>
          </g>
        </svg>
      `;
    }

    // Default theme mini preview art
    return `
      <svg viewBox="0 0 680 90" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="20" y="18" width="90" height="54" rx="16" fill="#F7DF83"/>
        <rect x="125" y="18" width="90" height="54" rx="16" fill="#9FAF67"/>
        <rect x="230" y="18" width="90" height="54" rx="16" fill="#F3B9DF"/>
        <rect x="335" y="18" width="90" height="54" rx="16" fill="#BFC3F2"/>
      </svg>
    `;
  }

  function renderThemeAmbientParticles(activeTheme, animationsEnabled) {
    const layer = document.getElementById('themeParticlesLayer');
    if (!layer) return;

    const prefersReducedMotion =
      window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!animationsEnabled || prefersReducedMotion || activeTheme === 'default') {
      layer.innerHTML = '';
      return;
    }

    const symbols =
      activeTheme === 'christmas'
        ? ['❄️', '❅', '✨', '❅']
        : activeTheme === 'nature'
          ? ['🍃', '🌿', '🌸', '🍃']
          : ['❄️', '❅', '🧊', '❅'];

    const count = 12;
    let html = '';
    for (let i = 0; i < count; i++) {
      const sym = symbols[i % symbols.length];
      const leftPct = Math.round((i / count) * 96 + (i % 3) * 2);
      const duration = 9 + (i % 5) * 2.2;
      const delay = (i * 0.9).toFixed(1);
      const fontSize = (0.78 + (i % 3) * 0.16).toFixed(2);
      html += `<span class="theme-particle" style="left:${leftPct}%; animation-duration:${duration}s; animation-delay:-${delay}s; font-size:${fontSize}rem;">${sym}</span>`;
    }
    layer.innerHTML = html;
  }

  function applyAppearanceAndTheme() {
    const root = document.documentElement;
    const prefColorMode = appData.profile?.colorMode || 'system';
    const effectiveMode = resolveEffectiveColorMode(prefColorMode);

    // Verify theme ownership before equipping a non-default theme
    const ownedThemes = Array.isArray(economyState.purchasedThemes)
      ? economyState.purchasedThemes
      : ['default'];
    let activeTheme = appData.profile?.activeTheme || economyState.activeTheme || 'default';
    if (activeTheme !== 'default' && !ownedThemes.includes(activeTheme)) {
      activeTheme = 'default';
    }

    const animationsEnabled = appData.profile?.animationsEnabled !== false;

    root.setAttribute('data-color-mode', effectiveMode);
    root.style.colorScheme = effectiveMode;
    const metaColor = document.getElementById('metaThemeColor');
    if (metaColor) metaColor.content = effectiveMode === 'dark' ? '#0F1117' : '#F7DF83';
    root.setAttribute('data-color-mode-pref', prefColorMode);
    root.setAttribute('data-active-theme', activeTheme);
    root.setAttribute('data-animations', animationsEnabled ? 'on' : 'off');

    if (appData.profile?.themeVibe) {
      document.body.setAttribute('data-theme-vibe', appData.profile.themeVibe);
    }

    saveAppearanceCache();

    // Update Top Bar & Theme Shop Light/Dark/System buttons
    document.querySelectorAll('[data-color-mode-btn]').forEach((btn) => {
      const m = btn.getAttribute('data-color-mode-btn');
      btn.classList.toggle('active', m === prefColorMode);
      btn.setAttribute('aria-pressed', String(m === prefColorMode));
    });

    // Update animations checkbox in Theme Shop
    const animToggle = document.getElementById('toggleThemeAnimationsInput');
    if (animToggle) {
      animToggle.checked = animationsEnabled;
    }

    // Update Decorative Theme Stage Banner
    const stageBanner = document.getElementById('themeStageBanner');
    const stageArt = document.getElementById('themeStageArt');
    const stageLabel = document.getElementById('themeStageLabel');

    if (stageBanner && stageArt && stageLabel) {
      if (activeTheme === 'default') {
        stageBanner.classList.add('hidden');
        stageArt.innerHTML = '';
      } else {
        const themeMeta = THEME_CATALOG.find((t) => t.id === activeTheme) || THEME_CATALOG[0];
        stageBanner.classList.remove('hidden');
        stageArt.innerHTML = getThemeIllustrationSvg(activeTheme);
        stageLabel.textContent = themeMeta.bannerLabel;
      }
    }

    renderThemeAmbientParticles(activeTheme, animationsEnabled);
  }

  // Listen for OS system dark/light preference changes in real time
  if (window.matchMedia) {
    const darkMq = window.matchMedia('(prefers-color-scheme: dark)');
    if (typeof darkMq.addEventListener === 'function') {
      darkMq.addEventListener('change', () => {
        if ((appData.profile?.colorMode || 'system') === 'system') {
          applyAppearanceAndTheme();
        }
      });
    }
  }

  // ==========================================================================
  // SYNCHRONIZATION STATUS INDICATOR (Accurate Real-Time State)
  // ==========================================================================
  function refreshSyncStatusUI() {
    const dot = document.getElementById('syncDot');
    const text = document.getElementById('syncStatusText');
    const badge = document.getElementById('currentSpaceBadge');
    const noteBadge = document.getElementById('noteAutosaveBadge');
    const popoverSyncStatus = document.getElementById('popoverSyncStatus');

    const isOnline = navigator.onLine !== false;

    if (badge) {
      if (currentUser) {
        const shortMail = (currentUser.email || 'Google').split('@')[0];
        badge.textContent = `☁️ ${shortMail}`;
      } else {
        badge.textContent = `#${currentSpaceId}`;
      }
    }

    if (!dot || !text) return;
    dot.classList.remove('saved', 'syncing', 'offline', 'error');

    let statusLabel = 'Local Mode';
    let dotClass = 'saved';

    if (currentUser && firestoreDb) {
      if (lastSyncError) {
        statusLabel = 'Sync Failed';
        dotClass = 'error';
      } else if (!isOnline) {
        statusLabel = (pendingWriteCount > 0 || hasFirestorePendingWrites)
          ? 'Offline — Changes Pending'
          : 'Offline — Cached';
        dotClass = 'offline';
      } else if (pendingWriteCount > 0 || hasFirestorePendingWrites) {
        statusLabel = 'Syncing';
        dotClass = 'syncing';
      } else {
        statusLabel = 'Saved to Cloud';
        dotClass = 'saved';
      }
    } else {
      if (!isOnline) {
        statusLabel = 'Offline — Local';
        dotClass = 'offline';
      } else if (pendingWriteCount > 0) {
        statusLabel = 'Syncing';
        dotClass = 'syncing';
      } else {
        statusLabel = 'Local Mode';
        dotClass = 'saved';
      }
    }

    dot.classList.add(dotClass);
    text.textContent = statusLabel;

    if (noteBadge) {
      if (dotClass === 'syncing') {
        noteBadge.textContent = '⏳ Syncing...';
      } else if (dotClass === 'offline') {
        noteBadge.textContent = '📴 Offline — Changes Pending';
      } else if (dotClass === 'error') {
        noteBadge.textContent = '⚠️ Sync Failed';
      } else if (currentUser) {
        noteBadge.textContent = '✓ Saved to Cloud';
      } else {
        noteBadge.textContent = '✓ Tersimpan Lokal';
      }
    }

    if (popoverSyncStatus) {
      if (dotClass === 'error') {
        popoverSyncStatus.textContent = `⚠️ ${statusLabel}`;
      } else if (dotClass === 'offline') {
        popoverSyncStatus.textContent = `📴 ${statusLabel}`;
      } else if (dotClass === 'syncing') {
        popoverSyncStatus.textContent = `🔄 ${statusLabel}...`;
      } else {
        popoverSyncStatus.textContent = `✓ ${statusLabel} (Real-time)`;
      }
    }
  }

  window.addEventListener('online', () => {
    lastSyncError = null;
    refreshSyncStatusUI();
    if (currentUser) {
      flushAllPendingCloudWrites();
      setTimeout(() => flushPendingTaskCompletions(), 800);
      showToast('Koneksi internet kembali! Menyinkronkan ke Cloud ☁️', '🌐');
    }
  });

  window.addEventListener('offline', () => {
    refreshSyncStatusUI();
    renderWeeklyProductivityWidget();
    renderThemeShopAndWallet();
    showToast('Kamu sedang offline. Perubahan disimpan di perangkat & akan disinkronkan saat online 📴', '💾');
  });

  // ==========================================================================
  // LOCAL PERSISTENCE (LocalStorage + IndexedDB + URL Hash Backup)
  // ==========================================================================
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

  const IDB_NAME = 'NugasinCampusCloudDB_v2';
  const IDB_STORE = 'workspaces';

  function openIndexedDB() {
    return new Promise((resolve) => {
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

  function getShareablePermanentLink() {
    const url = new URL(window.location.href);
    url.searchParams.set('space', currentSpaceId);
    const encoded = encodeStateToUrlHash(appData);
    if (encoded) {
      url.hash = `s=${encoded}`;
    }
    return url.toString();
  }

  function saveLocalMirror() {
    appData.updatedAt = new Date().toISOString();
    appData.updatedAtMs = Date.now();
    const storageKey = currentUser ? `${STORAGE_PREFIX}uid_${currentUser.uid}` : `${STORAGE_PREFIX}${currentSpaceId}`;
    try {
      localStorage.setItem(storageKey, JSON.stringify(appData));
      if (!currentUser) {
        localStorage.setItem(LAST_SPACE_KEY, currentSpaceId);
      }
    } catch (e) {}

    saveToIndexedDB(currentUser ? `uid_${currentUser.uid}` : currentSpaceId, appData);

    try {
      const url = new URL(window.location.href);
      url.searchParams.set('space', currentSpaceId);
      const encoded = encodeStateToUrlHash(appData);
      if (currentUser) url.hash = '';
      else if (encoded && encoded.length < 48000) {
        url.hash = `s=${encoded}`;
      }
      window.history.replaceState(null, '', url.toString());
    } catch (e) {}

    const linkInput = document.getElementById('shareableFullLinkInput');
    if (linkInput) {
      linkInput.value = getShareablePermanentLink();
    }
  }

  let localServerSaveTimer = null;
  function saveWorkspace(options = { syncPreferences: true }) {
    saveLocalMirror();

    if (currentUser && firestoreDb) {
      if (options.syncPreferences) {
        scheduleFirestorePreferencesSave();
      }
      refreshSyncStatusUI();
      return;
    }

    // Fallback local dev API sync when not signed in with Google
    if (!localServerSaveTimer) pendingWriteCount++;
    refreshSyncStatusUI();
    if (localServerSaveTimer) clearTimeout(localServerSaveTimer);
    const localPayload = JSON.parse(JSON.stringify(appData));
    const localSpaceId = currentSpaceId;
    localServerSaveTimer = setTimeout(async () => {
      localServerSaveTimer = null;
      if (currentUser) return;
      try {
        await fetch(`/api/workspace/${encodeURIComponent(localSpaceId)}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Client-Id': CLIENT_ID
          },
          body: JSON.stringify({
            clientId: CLIENT_ID,
            data: localPayload
          })
        });
      } catch (err) {
        // Ignore in static mode
      } finally {
        pendingWriteCount = Math.max(0, pendingWriteCount - 1);
        refreshSyncStatusUI();
      }
    }, 260);
  }

  // ==========================================================================
  // FIREBASE CONFIGURATION, INITIALIZATION & AUTHENTICATION
  // ==========================================================================
  function isValidFirebaseConfig(cfg) {
    return Boolean(
      cfg &&
      typeof cfg.apiKey === 'string' && cfg.apiKey.trim().length > 5 &&
      typeof cfg.authDomain === 'string' && cfg.authDomain.trim().length > 3 &&
      typeof cfg.projectId === 'string' && cfg.projectId.trim().length > 2
    );
  }

  async function resolveFirebaseConfig() {
    // 1. Try Server / Vercel Environment Endpoint (/api/firebase-config)
    try {
      const res = await fetch('/api/firebase-config', { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json && json.configured && isValidFirebaseConfig(json.config)) {
          return json.config;
        }
      }
    } catch (e) {}

    // 2. Try window.__NUGASIN_FIREBASE_CONFIG__ if injected
    if (window.__NUGASIN_FIREBASE_CONFIG__ && isValidFirebaseConfig(window.__NUGASIN_FIREBASE_CONFIG__)) {
      return window.__NUGASIN_FIREBASE_CONFIG__;
    }

    // 3. Try Runtime LocalStorage Config (entered via UI modal for testing)
    try {
      const raw = localStorage.getItem(RUNTIME_FIREBASE_CFG_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (isValidFirebaseConfig(parsed)) {
          return parsed;
        }
      }
    } catch (e) {}

    return null;
  }

  async function initFirebaseSdk() {
    if (typeof window.firebase === 'undefined') {
      return false;
    }

    const config = await resolveFirebaseConfig();
    if (!config) {
      firebaseReady = false;
      authResolved = true;
      updateAuthUI();
      refreshSyncStatusUI();
      return false;
    }

    try {
      if (!firebase.apps || firebase.apps.length === 0) {
        firebaseApp = firebase.initializeApp(config);
      } else {
        firebaseApp = firebase.app();
      }

      firebaseAuth = firebase.auth();
      firestoreDb = firebase.firestore();

      // Enable persistent login sessions
      try {
        await firebaseAuth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
      } catch (e) {}

      // Enable offline IndexedDB persistence for Firestore
      try {
        await firestoreDb.enablePersistence({ synchronizeTabs: true });
      } catch (err) {
        // err.code === 'failed-precondition' or 'unimplemented' is handled gracefully
      }

      firebaseReady = true;

      // Handle Redirect Auth result if returning from mobile Google redirect
      try {
        const redirectResult = await firebaseAuth.getRedirectResult();
        if (redirectResult && redirectResult.user) {
          playSound('success');
          showToast(`Berhasil login sebagai ${redirectResult.user.displayName || redirectResult.user.email} 🎉`, '☁️');
        }
      } catch (redirectErr) {
        handleAuthError(redirectErr);
      }

      // Listen for authentication state transitions
      firebaseAuth.onAuthStateChanged(async (user) => {
        authResolved = true;
        await handleAuthStateTransition(user);
      });

      return true;
    } catch (err) {
      console.error('Firebase initialization error:', err);
      firebaseReady = false;
      authResolved = true;
      updateAuthUI();
      refreshSyncStatusUI();
      return false;
    }
  }

  function handleAuthError(err) {
    if (!err) return;
    const code = err.code || '';
    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
      showToast('Login Google dibatalkan.', 'ℹ️');
      return;
    }
    if (code === 'auth/network-request-failed') {
      showToast('Gagal terhubung ke jaringan. Periksa koneksi internetmu.', '⚠️');
      return;
    }
    if (code === 'auth/unauthorized-domain') {
      showToast('Domain ini belum ditambahkan ke Authorized Domains di Firebase Console (Authentication → Settings).', '⚠️');
      return;
    }
    showToast(`Gagal masuk dengan Google: ${err.message || 'Terjadi kesalahan'}`, '⚠️');
  }

  async function triggerGoogleSignIn(forceAccountSelection = true) {
    if (!firebaseReady || !firebaseAuth) {
      // Try re-initializing in case config was just added
      const ok = await initFirebaseSdk();
      if (!ok) {
        const syncModal = document.getElementById('syncModalBackdrop');
        const detailsBox = document.getElementById('firebaseConfigDetailsBox');
        syncModal?.classList.remove('hidden');
        if (detailsBox) detailsBox.open = true;
        showToast('Konfigurasi Firebase belum diatur. Masukkan Firebase Config atau atur di Vercel Environment Variables.', '⚙️');
        return;
      }
    }

    const provider = new firebase.auth.GoogleAuthProvider();
    if (forceAccountSelection) {
      provider.setCustomParameters({ prompt: 'select_account' });
    }

    try {
      const result = await firebaseAuth.signInWithPopup(provider);
      if (result && result.user) {
        playSound('success');
        showToast(`Selamat datang, ${result.user.displayName || result.user.email}! ☁️`, '🎉');
      }
    } catch (err) {
      if (
        err &&
        (err.code === 'auth/popup-blocked' ||
          err.code === 'auth/operation-not-supported-in-this-environment')
      ) {
        try {
          await firebaseAuth.signInWithRedirect(provider);
        } catch (redirErr) {
          handleAuthError(redirErr);
        }
      } else {
        handleAuthError(err);
      }
    }
  }

  async function triggerGoogleSignOut() {
    if (!firebaseAuth) return;
    try {
      // Flush any in-flight edits before signing out
      if (navigator.onLine !== false) await flushAllPendingCloudWrites();
      cleanupFirestoreListeners();

      await firebaseAuth.signOut();
      currentUser = null;
      lastSyncError = null;
      pendingWriteCount = 0;
      hasFirestorePendingWrites = false;

      document.getElementById('accountMenuPopover')?.classList.add('hidden');
      document.getElementById('syncModalBackdrop')?.classList.add('hidden');

      // Important Security Requirement: Never leave private cloud user data visible after logout.
      // Reload purely local workspace state (or clean empty state if none).
      await loadPureLocalWorkspace();
      updateAuthUI();
      refreshSyncStatusUI();
      renderAll();
      showToast('Berhasil keluar dari akun Google. Data cloud telah diamankan 🔒', '👋');
    } catch (err) {
      showToast('Gagal keluar dari akun Google', '⚠️');
    }
  }

  // Wallets and ownership are loaded only from authenticated server responses / Firestore.
  // Old local XP ledgers are deliberately ignored; they cannot be promoted into cloud funds.
  function loadLocalEconomyState() {
    economyState = createDefaultEconomyState();
  }

  function saveLocalEconomyState() {}

  function persistPendingCompletions() {
    if (!currentUser) return;
    try {
      localStorage.setItem(PENDING_COMPLETIONS_PREFIX + currentUser.uid, JSON.stringify([...pendingCompletions]));
    } catch (e) {}
  }

  function queueTaskCompletion(taskId) {
    if (!currentUser) return;
    pendingCompletions.add(String(taskId));
    persistPendingCompletions();
  }

  async function postEconomyOperation(path, payload, user, epoch) {
    if (!user || navigator.onLine === false) throw new Error('Hubungkan internet dan masuk dengan Google untuk memverifikasi XP.');
    const token = await user.getIdToken();
    if (epoch !== accountEpoch || currentUser?.uid !== user.uid) throw new Error('ACCOUNT_CHANGED');
    const response = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify(payload),
      ...(typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function'
        ? { signal: AbortSignal.timeout(20000) } : {})
    });
    const data = await response.json().catch(() => ({ ok: false, code: 'SERVER_UNAVAILABLE', error: 'Layanan XP belum merespons. Penyelesaian tugas akan dicoba lagi.' }));
    if (epoch !== accountEpoch || currentUser?.uid !== user.uid) throw new Error('ACCOUNT_CHANGED');
    if (!response.ok || !data.ok) {
      const error = new Error(data.error || 'Server XP belum tersedia. Coba lagi setelah tersambung.');
      error.code = data.code;
      error.status = response.status;
      throw error;
    }
    return data;
  }

  function reportEconomySyncError(error, notify = false) {
    const code = error.code || (error.name === 'TimeoutError' ? 'REQUEST_TIMEOUT' : 'VERIFICATION_FAILED');
    const isNewError = code !== economySyncErrorCode;
    economySyncErrorCode = code;
    economySyncError = code === 'SERVER_NOT_CONFIGURED'
      ? 'Layanan XP belum aktif. Tugas selesai tetap tersimpan dan menunggu verifikasi server.'
      : error.message || 'Verifikasi XP tertunda. Penyelesaian tugasmu tetap tersimpan.';
    renderWeeklyProductivityWidget();
    renderThemeShopAndWallet();
    if (notify && isNewError) showToast(economySyncError, '⏳');
  }

  function acceptServerWallet(data) {
    const version = Number.isSafeInteger(data.walletVersion) ? data.walletVersion : 0;
    if (version < economyState.walletVersion) return;
    economyState.walletVersion = version;
    for (const [clientField, serverField] of [
      ['xpBalance', 'xpBalance'], ['lifetimeEarnedXp', 'lifetimeXpEarned'], ['lifetimeSpentXp', 'totalXpSpent']
    ]) {
      const value = data[serverField] ?? data[clientField];
      if (Number.isSafeInteger(value) && value >= 0) economyState[clientField] = value;
    }
    if (Array.isArray(data.purchasedThemes)) economyState.purchasedThemes = [...new Set(['default', ...data.purchasedThemes])];
  }

  function applyServerEconomy(data) {
    if (!data || !currentUser) return;
    if (Number.isFinite(data.serverNowMs)) serverTimeAnchor = { serverMs: data.serverNowMs, localMs: performance.now() };
    acceptServerWallet(data);
    cloudWalletLoaded = true;
    if (!pendingCompletions.size || data.taskId) {
      economySyncError = '';
      economySyncErrorCode = '';
    }
    if (data.weekKey) {
      const existing = weeklyProgress?.weekKey === data.weekKey ? weeklyProgress : null;
      weeklyProgress = { weekKey: data.weekKey, completedCount: Math.max(Number(existing?.completedCount || 0), Number(data.completedCount || 0)), rewarded: existing?.rewarded || data.rewarded === true };
      if (data.rewarded) economyState.rewardedWeeks[data.weekKey] = { weekKey: data.weekKey, xpAwarded: WEEKLY_REWARD_XP };
    }
    if (data.xpAwarded === WEEKLY_REWARD_XP) showWeeklyGoalCelebration(data.weekKey, data.xpBalance);
    subscribeToCurrentWeek();
    applyAppearanceAndTheme();
    renderWeeklyProductivityWidget();
    renderThemeShopAndWallet();
  }

  function flushPendingTaskCompletions() {
    const user = currentUser;
    const epoch = accountEpoch;
    if (completionFlushEpoch === epoch && completionFlushPromise) return completionFlushPromise;
    if (!user || !firestoreDb || !cloudTasksLoaded || navigator.onLine === false) return Promise.resolve();
    completionFlushEpoch = epoch;
    // All callers await the same drain, including a manual retry during a snapshot update.
    completionFlushPromise = Promise.resolve().then(async () => {
      try {
        for (const taskId of pendingCompletions) {
          if (epoch !== accountEpoch) return;
          const task = appData.tasks.find((item) => String(item.id) === taskId);
          if (!task || (task.status !== 'completed' && task.xpRewarded !== true && !task.rewardedWeekKey)) {
            pendingCompletions.delete(taskId);
            persistPendingCompletions();
            continue;
          }
          try {
            const data = await postEconomyOperation('/api/complete-task', { taskId }, user, epoch);
            pendingCompletions.delete(taskId);
            persistPendingCompletions();
            applyServerEconomy(data);
          } catch (error) {
            if (epoch !== accountEpoch) return;
            if (error.code === 'TASK_NOT_COMPLETED' && appData.tasks.find((item) => String(item.id) === taskId)?.status !== 'completed') {
              pendingCompletions.delete(taskId);
              persistPendingCompletions();
              continue;
            }
            reportEconomySyncError(error, true);
            // An individual stale cloud task must not hold up other valid completions.
            if (['TASK_NOT_FOUND', 'TASK_NOT_COMPLETED', 'INVALID_TASK'].includes(error.code)) continue;
            break;
          }
        }
      } finally {
        if (completionFlushEpoch === epoch) {
          completionFlushEpoch = null;
          completionFlushPromise = null;
        }
        if (epoch === accountEpoch) {
          renderWeeklyProductivityWidget();
          renderThemeShopAndWallet();
        }
      }
    });
    return completionFlushPromise;
  }

  function subscribeToCurrentWeek() {
    if (!currentUser || !firestoreDb) return;
    const weekKey = getJakartaWeekInfo().weekKey;
    if (subscribedWeekKey === weekKey) return;
    if (weeklyProgressUnsubscribe) weeklyProgressUnsubscribe();
    subscribedWeekKey = weekKey;
    weeklyProgress = null;
    const epoch = accountEpoch;
    weeklyProgressUnsubscribe = getUserDocRef().collection('weeks').doc(weekKey).onSnapshot((snapshot) => {
      if (epoch !== accountEpoch) return;
      const data = snapshot.exists ? snapshot.data() : {};
      const existing = weeklyProgress?.weekKey === weekKey ? weeklyProgress : null;
      weeklyProgress = {
        ...data, weekKey,
        completedCount: Math.max(Number(existing?.completedCount || 0), Number(data.completedCount || 0)),
        rewarded: existing?.rewarded || data.rewarded === true
      };
      renderWeeklyProductivityWidget();
    }, (error) => {
      if (epoch !== accountEpoch) return;
      economySyncError = error.message;
      renderWeeklyProductivityWidget();
    });
    renderWeeklyProductivityWidget();
  }

  function updateAuthUI() {
    const topSignInBtn = document.getElementById('topGoogleSignInBtn');
    const topAccountWrap = document.getElementById('topAccountMenuWrap');
    const topAvatar = document.getElementById('topAuthAvatarImg') || document.getElementById('topAccountAvatarImg');
    const topName = document.getElementById('topAuthUserName') || document.getElementById('topAccountNameText');

    const popAvatar = document.getElementById('popoverAuthAvatarImg') || document.getElementById('popoverAccountAvatarImg');
    const popName = document.getElementById('popoverAuthName') || document.getElementById('popoverAccountName');
    const popEmail = document.getElementById('popoverAuthEmail') || document.getElementById('popoverAccountEmail');

    const modalSignInBtn = document.getElementById('modalGoogleSignInBtn') || document.getElementById('syncModalGoogleSignInBtn');
    const modalSignOutBtn = document.getElementById('modalGoogleSignOutBtn') || document.getElementById('syncModalSignOutBtn');
    const syncHeroTitle = document.getElementById('syncModalAuthTitle') || document.getElementById('syncModalHeroTitle');
    const syncHeroDesc = document.getElementById('syncModalAuthDesc') || document.getElementById('syncModalHeroDesc');
    const cfgStatusLabel = document.getElementById('firebaseConfigStatusLabel');

    const onboardingGoogleBtn = document.getElementById('onboardingGoogleSignInBtn');
    const onboardingSignedInPill = document.getElementById('onboardingSignedInPill');
    const restoreBackupBtn = document.getElementById('restorePreMigrationBackupBtn');

    if (cfgStatusLabel) {
      cfgStatusLabel.textContent = firebaseReady ? '✓ Terkonfigurasi' : 'Belum Dikonfigurasi';
    }

    if (restoreBackupBtn) {
      const hasBackup = Boolean(localStorage.getItem(PRE_CLOUD_BACKUP_KEY));
      restoreBackupBtn.classList.toggle('hidden', !hasBackup);
    }

    if (currentUser) {
      const dispName = currentUser.displayName || appData.profile.name || 'Mahasiswa';
      const dispEmail = currentUser.email || '';
      const dispPhoto = currentUser.photoURL || appData.profile.avatarUrl || PRESET_AVATARS[0].url;

      topSignInBtn?.classList.add('hidden');
      topAccountWrap?.classList.remove('hidden');
      if (topAvatar) topAvatar.src = dispPhoto;
      if (topName) topName.textContent = dispName.split(' ')[0];

      if (popAvatar) popAvatar.src = dispPhoto;
      if (popName) popName.textContent = dispName;
      if (popEmail) popEmail.textContent = dispEmail;

      modalSignInBtn?.classList.add('hidden');
      modalSignOutBtn?.classList.remove('hidden');
      if (syncHeroTitle) syncHeroTitle.textContent = `Terhubung sebagai ${dispName} ✨`;
      if (syncHeroDesc) {
        syncHeroDesc.textContent = `Semua catatan, tugas, jadwal, tema, dan progres XP milik ${dispEmail} disinkronkan otomatis secara real-time di semua perangkat.`;
      }

      onboardingGoogleBtn?.classList.add('hidden');
      if (onboardingSignedInPill) {
        onboardingSignedInPill.classList.remove('hidden');
        onboardingSignedInPill.textContent = `✓ Terhubung dengan Google (${dispEmail})`;
      }
    } else {
      topSignInBtn?.classList.remove('hidden');
      topAccountWrap?.classList.add('hidden');
      document.getElementById('accountMenuPopover')?.classList.add('hidden');

      modalSignInBtn?.classList.remove('hidden');
      modalSignOutBtn?.classList.add('hidden');
      if (syncHeroTitle) syncHeroTitle.textContent = 'Sinkronisasi Otomatis Antar Perangkat';
      if (syncHeroDesc) {
        syncHeroDesc.textContent = 'Login dengan akun Google untuk menyimpan dan menyinkronkan catatan, tugas, tema, serta XP kuliahmu secara real-time di semua perangkat.';
      }

      onboardingGoogleBtn?.classList.remove('hidden');
      onboardingSignedInPill?.classList.add('hidden');
    }
  }

  // ==========================================================================
  // FIRESTORE REAL-TIME DATABASE & GRANULAR SYNCHRONIZATION ENGINE
  // ==========================================================================
  function getUserDocRef(uid = currentUser?.uid) {
    if (!firestoreDb || !uid) return null;
    return firestoreDb.collection('users').doc(uid);
  }

  function getPreferencesDocRef(uid = currentUser?.uid) {
    const userRef = getUserDocRef(uid);
    return userRef ? userRef.collection('settings').doc('preferences') : null;
  }

  function getWalletDocRef(uid = currentUser?.uid) {
    const userRef = getUserDocRef(uid);
    return userRef ? userRef.collection('economy').doc('wallet') : null;
  }

  function getRewardsColRef(uid = currentUser?.uid) {
    const userRef = getUserDocRef(uid);
    return userRef ? userRef.collection('rewards') : null;
  }

  function getTransactionsColRef(uid = currentUser?.uid) {
    const userRef = getUserDocRef(uid);
    return userRef ? userRef.collection('xpTransactions') : null;
  }

  function getTasksColRef(uid = currentUser?.uid) {
    const userRef = getUserDocRef(uid);
    return userRef ? userRef.collection('tasks') : null;
  }

  function getNotesColRef(uid = currentUser?.uid) {
    const userRef = getUserDocRef(uid);
    return userRef ? userRef.collection('notes') : null;
  }

  function cleanupFirestoreListeners() {
    if (weeklyProgressUnsubscribe) weeklyProgressUnsubscribe();
    weeklyProgressUnsubscribe = null;
    subscribedWeekKey = null;
    firestoreUnsubscribers.forEach((unsub) => {
      try {
        if (typeof unsub === 'function') unsub();
      } catch (e) {}
    });
    firestoreUnsubscribers = [];
  }

  function buildValidatedProfilePayload(profileSource) {
    const p = profileSource || appData.profile || {};
    const desiredTheme = String(p.activeTheme || 'default');
    const ownedInCloud = Array.isArray(economyState.purchasedThemes)
      ? economyState.purchasedThemes
      : ['default'];
    // Only send non-default activeTheme to Firestore if it is verified in economy/wallet
    const safeTheme =
      desiredTheme === 'default' || !cloudWalletLoaded || ownedInCloud.includes(desiredTheme)
        ? desiredTheme
        : 'default';

    return {
      onboarded: Boolean(p.onboarded),
      name: String(p.name || ''),
      major: String(p.major || ''),
      campus: String(p.campus || ''),
      avatarUrl: String(p.avatarUrl || PRESET_AVATARS[0].url),
      focusMinutesToday: Math.max(0, Math.floor(Number(p.focusMinutesToday || 0))),
      streakDays: Math.max(0, Math.floor(Number(p.streakDays || 0))),
      themeVibe: ['default', 'candy', 'matcha', 'pastel-bento', 'butter-pop', 'pink-flow'].includes(p.themeVibe) ? p.themeVibe : 'default',
      activeTheme: ['default', 'christmas', 'nature', 'antarctica'].includes(safeTheme) ? safeTheme : 'default',
      colorMode: ['light', 'dark', 'system'].includes(p.colorMode) ? p.colorMode : 'system',
      animationsEnabled: p.animationsEnabled !== false
    };
  }

  function scheduleFirestorePreferencesSave() {
    if (!currentUser || !firestoreDb) return;
    const prefRef = getPreferencesDocRef();
    if (!prefRef) return;

    const epoch = accountEpoch;
    const profilePayload = buildValidatedProfilePayload(appData.profile);
    const coursesPayload = [...appData.courses];
    if (!preferencesDebounceTimer) pendingWriteCount++;
    refreshSyncStatusUI();

    if (preferencesDebounceTimer) clearTimeout(preferencesDebounceTimer);
    preferencesDebounceTimer = setTimeout(async () => {
      preferencesDebounceTimer = null;
      if (epoch !== accountEpoch) return;
      try {
        const nowMs = Date.now();
        await prefRef.set(
          {
            profile: profilePayload,
            courses: coursesPayload,
            updatedAt: new Date(nowMs).toISOString(),
            updatedAtMs: nowMs,
            lastModifiedBy: CLIENT_ID
          },
          { merge: true }
        );
        lastSyncError = null;
      } catch (err) {
        console.error('Error saving preferences to Firestore:', err);
        lastSyncError = err.message || 'Write failed';
      } finally {
        pendingWriteCount = Math.max(0, pendingWriteCount - 1);
        refreshSyncStatusUI();
      }
    }, 320);
  }

  async function saveTaskToFirestore(task) {
    const epoch = accountEpoch;
    saveLocalMirror();
    if (!currentUser || !firestoreDb) {
      saveWorkspace({ syncPreferences: false });
      return;
    }

    const tasksCol = getTasksColRef();
    if (!tasksCol || !task || !task.id) return;

    const nowMs = Date.now();
    task.updatedAt = new Date(nowMs).toISOString();
    task.updatedAtMs = nowMs;

    pendingWriteCount++;
    refreshSyncStatusUI();

    try {
      const completedAtVal =
        task.status === 'completed'
          ? Math.max(1, Math.floor(Number(task.completedAtMs || nowMs)))
          : null;

      await tasksCol.doc(String(task.id)).set(
        {
          id: String(task.id),
          title: String(task.title || ''),
          course: String(task.course || 'Umum'),
          category: String(task.category || 'Tugas Individu'),
          dueDate: String(task.dueDate || getOffsetDateStr(0)),
          dueTime: String(task.dueTime || '23:59'),
          priority: ['high', 'medium', 'low'].includes(task.priority) ? task.priority : 'medium',
          status: ['pending', 'in-progress', 'completed'].includes(task.status) ? task.status : 'pending',
          description: String(task.description || ''),
          link: String(task.link || ''),
          subtasks: Array.isArray(task.subtasks) ? task.subtasks : [],
          completedAtMs: completedAtVal,
          createdAt: String(task.createdAt || task.updatedAt),
          updatedAt: task.updatedAt,
          updatedAtMs: nowMs,
          lastModifiedBy: CLIENT_ID
        },
        { merge: true }
      );
      lastSyncError = null;
      if (epoch !== accountEpoch) return false;
      if (task.status === 'completed' && pendingCompletions.has(String(task.id))) {
        await flushPendingTaskCompletions();
      }
      return true;
    } catch (err) {
      console.error('Error saving task to Firestore:', err);
      lastSyncError = err.message || 'Task sync failed';
      return false;
    } finally {
      pendingWriteCount = Math.max(0, pendingWriteCount - 1);
      refreshSyncStatusUI();
    }
  }

  async function deleteTaskFromFirestore(taskId) {
    saveLocalMirror();
    if (!currentUser || !firestoreDb) {
      saveWorkspace({ syncPreferences: false });
      return;
    }

    const tasksCol = getTasksColRef();
    if (!tasksCol || !taskId) return;

    pendingWriteCount++;
    refreshSyncStatusUI();

    try {
      await tasksCol.doc(String(taskId)).delete();
      lastSyncError = null;
    } catch (err) {
      console.error('Error deleting task from Firestore:', err);
      lastSyncError = err.message || 'Task delete failed';
    } finally {
      pendingWriteCount = Math.max(0, pendingWriteCount - 1);
      refreshSyncStatusUI();
    }
  }

  function scheduleNoteSaveToFirestore(note, immediate = false) {
    if (!note || !note.id) return;
    const nowMs = Date.now();
    note.updatedAt = new Date(nowMs).toISOString();
    note.updatedAtMs = nowMs;

    saveLocalMirror();

    if (!currentUser || !firestoreDb) {
      saveWorkspace({ syncPreferences: false });
      return;
    }

    const noteId = String(note.id);
    const scheduledNotesCol = getNotesColRef();
    const epoch = accountEpoch;
    const payload = {
      id: noteId,
      title: String(note.title || ''),
      course: String(note.course || ''),
      date: String(note.date || getOffsetDateStr(0)),
      tag: String(note.tag || ''),
      color: ['cream', 'yellow', 'pink', 'blue', 'lavender', 'sage'].includes(note.color) ? note.color : 'cream',
      pinned: Boolean(note.pinned),
      content: String(note.content || ''),
      createdAt: String(note.createdAt || note.updatedAt),
      updatedAt: note.updatedAt,
      updatedAtMs: nowMs,
      lastModifiedBy: CLIENT_ID
    };

    pendingNotePayloads.set(noteId, payload);

    if (noteDebounceTimers.has(noteId)) {
      clearTimeout(noteDebounceTimers.get(noteId));
      noteDebounceTimers.delete(noteId);
    } else {
      pendingWriteCount++;
      refreshSyncStatusUI();
    }

    const executeWrite = async () => {
      if (epoch !== accountEpoch) return;
      noteDebounceTimers.delete(noteId);
      const latestPayload = pendingNotePayloads.get(noteId);
      pendingNotePayloads.delete(noteId);
      if (!latestPayload) {
        pendingWriteCount = Math.max(0, pendingWriteCount - 1);
        refreshSyncStatusUI();
        return;
      }

      try {
        const notesCol = scheduledNotesCol;
        if (notesCol) {
          await notesCol.doc(noteId).set(latestPayload, { merge: true });
          lastSyncError = null;
        }
      } catch (err) {
        console.error('Error saving note to Firestore:', err);
        lastSyncError = err.message || 'Note sync failed';
      } finally {
        pendingWriteCount = Math.max(0, pendingWriteCount - 1);
        refreshSyncStatusUI();
      }
    };

    if (immediate) {
      executeWrite();
    } else {
      const timer = setTimeout(executeWrite, 420);
      noteDebounceTimers.set(noteId, timer);
    }
  }

  async function deleteNoteFromFirestore(noteId) {
    if (noteDebounceTimers.has(noteId)) {
      clearTimeout(noteDebounceTimers.get(noteId));
      noteDebounceTimers.delete(noteId);
      pendingNotePayloads.delete(noteId);
      pendingWriteCount = Math.max(0, pendingWriteCount - 1);
    }

    saveLocalMirror();
    if (!currentUser || !firestoreDb) {
      saveWorkspace({ syncPreferences: false });
      return;
    }

    const notesCol = getNotesColRef();
    if (!notesCol || !noteId) return;

    pendingWriteCount++;
    refreshSyncStatusUI();

    try {
      await notesCol.doc(String(noteId)).delete();
      lastSyncError = null;
    } catch (err) {
      console.error('Error deleting note from Firestore:', err);
      lastSyncError = err.message || 'Note delete failed';
    } finally {
      pendingWriteCount = Math.max(0, pendingWriteCount - 1);
      refreshSyncStatusUI();
    }
  }

  async function flushAllPendingCloudWrites() {
    if (!currentUser || !firestoreDb) return;
    const promises = [];

    if (preferencesDebounceTimer) {
      clearTimeout(preferencesDebounceTimer);
      preferencesDebounceTimer = null;
      const prefRef = getPreferencesDocRef();
      if (prefRef) {
        const nowMs = Date.now();
        promises.push(
          prefRef
            .set(
              {
                profile: buildValidatedProfilePayload(appData.profile),
                courses: Array.isArray(appData.courses) ? appData.courses : [],
                updatedAt: new Date(nowMs).toISOString(),
                updatedAtMs: nowMs,
                lastModifiedBy: CLIENT_ID
              },
              { merge: true }
            )
            .catch(() => {})
            .finally(() => {
              pendingWriteCount = Math.max(0, pendingWriteCount - 1);
            })
        );
      }
    }

    const notesCol = getNotesColRef();
    for (const [noteId, timer] of noteDebounceTimers.entries()) {
      clearTimeout(timer);
      noteDebounceTimers.delete(noteId);
      const payload = pendingNotePayloads.get(noteId);
      pendingNotePayloads.delete(noteId);
      if (payload && notesCol) {
        promises.push(
          notesCol
            .doc(noteId)
            .set(payload, { merge: true })
            .catch(() => {})
            .finally(() => {
              pendingWriteCount = Math.max(0, pendingWriteCount - 1);
            })
        );
      }
    }

    if (promises.length > 0) {
      await Promise.all(promises);
      refreshSyncStatusUI();
    }
  }

  window.addEventListener('beforeunload', () => {
    flushAllPendingCloudWrites();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flushAllPendingCloudWrites();
    }
  });

  // ==========================================================================
  // FIRST-LOGIN LOCAL DATA MIGRATION & REAL-TIME LISTENERS
  // ==========================================================================
  async function fetchCloudAccountSnapshot(uid) {
    const prefRef = getPreferencesDocRef(uid);
    const tasksCol = getTasksColRef(uid);
    const notesCol = getNotesColRef(uid);

    const [prefSnap, tasksSnap, notesSnap, walletSnap] = await Promise.all([
      prefRef.get(),
      tasksCol.get(),
      notesCol.get(),
      getWalletDocRef(uid).get()
    ]);

    const prefData = prefSnap.exists ? prefSnap.data() : null;
    const tasks = [];
    tasksSnap.forEach((doc) => {
      const d = doc.data();
      if (d && d.id) tasks.push(d);
    });
    const notes = [];
    notesSnap.forEach((doc) => {
      const d = doc.data();
      if (d && d.id) notes.push(d);
    });

    return {
      exists: Boolean(prefSnap.exists || tasks.length > 0 || notes.length > 0),
      profile: prefData?.profile || null,
      courses: Array.isArray(prefData?.courses) ? prefData.courses : [],
      tasks,
      notes,
      wallet: walletSnap.exists ? walletSnap.data() : {}
    };
  }

  async function uploadWorkspaceToFirestoreBatch(uid, workspaceObj) {
    if (!firestoreDb || !uid) return;
    const nowMs = Date.now();
    const batch = firestoreDb.batch();

    const prefRef = getPreferencesDocRef(uid);
    batch.set(
      prefRef,
      {
        profile: buildValidatedProfilePayload({
          onboarded: Boolean(workspaceObj.profile?.onboarded),
          name: String(workspaceObj.profile?.name || currentUser?.displayName || ''),
          major: String(workspaceObj.profile?.major || ''),
          campus: String(workspaceObj.profile?.campus || ''),
          avatarUrl: String(workspaceObj.profile?.avatarUrl || currentUser?.photoURL || PRESET_AVATARS[0].url),
          focusMinutesToday: Number(workspaceObj.profile?.focusMinutesToday || 0),
          streakDays: Number(workspaceObj.profile?.streakDays || 0),
          themeVibe: String(workspaceObj.profile?.themeVibe || 'default'),
          activeTheme: String(workspaceObj.profile?.activeTheme || 'default'),
          colorMode: String(workspaceObj.profile?.colorMode || 'system'),
          animationsEnabled: workspaceObj.profile?.animationsEnabled !== false
        }),
        courses: Array.isArray(workspaceObj.courses) ? workspaceObj.courses : [],
        updatedAt: new Date(nowMs).toISOString(),
        updatedAtMs: nowMs,
        lastModifiedBy: CLIENT_ID
      },
      { merge: true }
    );

    const tasksCol = getTasksColRef(uid);
    (workspaceObj.tasks || []).forEach((t) => {
      if (!t || !t.id) return;
      const tMs = t.updatedAtMs || (t.updatedAt ? new Date(t.updatedAt).getTime() : nowMs);
      const completedAtVal =
        t.status === 'completed'
          ? Math.max(1, Math.floor(Number(t.completedAtMs || tMs)))
          : null;
      batch.set(
        tasksCol.doc(String(t.id)),
        {
          id: String(t.id),
          title: String(t.title || ''),
          course: String(t.course || 'Umum'),
          category: String(t.category || 'Tugas Individu'),
          dueDate: String(t.dueDate || getOffsetDateStr(0)),
          dueTime: String(t.dueTime || '23:59'),
          priority: ['high', 'medium', 'low'].includes(t.priority) ? t.priority : 'medium',
          status: ['pending', 'in-progress', 'completed'].includes(t.status) ? t.status : 'pending',
          description: String(t.description || ''),
          link: String(t.link || ''),
          subtasks: Array.isArray(t.subtasks) ? t.subtasks : [],
          completedAtMs: completedAtVal,
          createdAt: String(t.createdAt || new Date(tMs).toISOString()),
          updatedAt: new Date(tMs).toISOString(),
          updatedAtMs: tMs,
          lastModifiedBy: CLIENT_ID
        },
        { merge: true }
      );
    });

    const notesCol = getNotesColRef(uid);
    (workspaceObj.notes || []).forEach((n) => {
      if (!n || !n.id) return;
      const nMs = n.updatedAtMs || (n.updatedAt ? new Date(n.updatedAt).getTime() : nowMs);
      batch.set(
        notesCol.doc(String(n.id)),
        {
          id: String(n.id),
          title: String(n.title || ''),
          course: String(n.course || ''),
          date: String(n.date || getOffsetDateStr(0)),
          tag: String(n.tag || ''),
          color: ['cream', 'yellow', 'pink', 'blue', 'lavender', 'sage'].includes(n.color) ? n.color : 'cream',
          pinned: Boolean(n.pinned),
          content: String(n.content || ''),
          createdAt: String(n.createdAt || new Date(nMs).toISOString()),
          updatedAt: new Date(nMs).toISOString(),
          updatedAtMs: nMs,
          lastModifiedBy: CLIENT_ID
        },
        { merge: true }
      );
    });

    await batch.commit();
  }

  function mergeLocalAndCloudData(localObj, cloudObj) {
    const mergedCourses = Array.from(
      new Set([...(cloudObj.courses || []), ...(localObj.courses || [])])
    );

    const taskMap = new Map();
    (cloudObj.tasks || []).forEach((t) => {
      if (t && t.id) taskMap.set(String(t.id), t);
    });
    (localObj.tasks || []).forEach((localTask) => {
      if (!localTask || !localTask.id) return;
      const existing = taskMap.get(String(localTask.id));
      if (!existing) {
        taskMap.set(String(localTask.id), localTask);
      } else {
        // Never overwrite a cloud task that has already been xpRewarded
        if (existing.xpRewarded === true) {
          taskMap.set(String(localTask.id), existing);
          return;
        }
        const localTime = localTask.updatedAtMs || (localTask.updatedAt ? new Date(localTask.updatedAt).getTime() : 0);
        const cloudTime = existing.updatedAtMs || (existing.updatedAt ? new Date(existing.updatedAt).getTime() : 0);
        if (localTime >= cloudTime) {
          taskMap.set(String(localTask.id), localTask);
        }
      }
    });

    const noteMap = new Map();
    (cloudObj.notes || []).forEach((n) => {
      if (n && n.id) noteMap.set(String(n.id), n);
    });
    (localObj.notes || []).forEach((localNote) => {
      if (!localNote || !localNote.id) return;
      const existing = noteMap.get(String(localNote.id));
      if (!existing) {
        noteMap.set(String(localNote.id), localNote);
      } else {
        const localTime = localNote.updatedAtMs || (localNote.updatedAt ? new Date(localNote.updatedAt).getTime() : 0);
        const cloudTime = existing.updatedAtMs || (existing.updatedAt ? new Date(existing.updatedAt).getTime() : 0);
        if (localTime >= cloudTime) {
          noteMap.set(String(localNote.id), localNote);
        }
      }
    });

    const cloudProfile = cloudObj.profile || {};
    const localProfile = localObj.profile || {};
    const mergedProfile = {
      onboarded: Boolean(cloudProfile.onboarded || localProfile.onboarded),
      name: cloudProfile.name || localProfile.name || currentUser?.displayName || '',
      major: cloudProfile.major || localProfile.major || '',
      campus: cloudProfile.campus || localProfile.campus || '',
      avatarUrl: cloudProfile.avatarUrl || localProfile.avatarUrl || currentUser?.photoURL || PRESET_AVATARS[0].url,
      focusMinutesToday: Math.max(Number(cloudProfile.focusMinutesToday || 0), Number(localProfile.focusMinutesToday || 0)),
      streakDays: Math.max(Number(cloudProfile.streakDays || 0), Number(localProfile.streakDays || 0)),
      themeVibe: cloudProfile.themeVibe || localProfile.themeVibe || 'default',
      activeTheme: cloudProfile.activeTheme || localProfile.activeTheme || 'default',
      colorMode: cloudProfile.colorMode || localProfile.colorMode || 'system',
      animationsEnabled: cloudProfile.animationsEnabled !== undefined
        ? cloudProfile.animationsEnabled
        : (localProfile.animationsEnabled !== false)
    };

    return {
      version: 2,
      updatedAt: new Date().toISOString(),
      updatedAtMs: Date.now(),
      profile: mergedProfile,
      courses: mergedCourses,
      tasks: Array.from(taskMap.values()),
      notes: Array.from(noteMap.values())
    };
  }

  function savePreMigrationBackup(localSnapshot) {
    try {
      if (hasMeaningfulData(localSnapshot)) {
        const serialized = JSON.stringify(localSnapshot);
        localStorage.setItem(PRE_CLOUD_BACKUP_KEY, serialized);
        if (currentUser?.uid) {
          localStorage.setItem(`nugasin_pre_cloud_backup_${currentUser.uid}`, serialized);
        }
      }
    } catch (e) {}
  }

  function promptLocalDataMigration(localSnapshot, cloudSnapshot) {
    return new Promise((resolve) => {
      const modal = document.getElementById('migrationModalBackdrop');
      const localStatsEl = document.getElementById('migrationLocalSummary') || document.getElementById('migrationLocalStatsText');
      const localProfileEl = document.getElementById('migrationLocalProfileInfo') || document.getElementById('migrationLocalProfileText');
      const cloudStatsEl = document.getElementById('migrationCloudSummary') || document.getElementById('migrationCloudStatsText');
      const cloudProfileEl = document.getElementById('migrationCloudAccountType') || document.getElementById('migrationCloudProfileText');
      const progressBox = document.getElementById('migrationProgressBox');

      if (!modal) {
        resolve('merge');
        return;
      }

      const lTasks = (localSnapshot.tasks || []).length;
      const lNotes = (localSnapshot.notes || []).length;
      const cTasks = (cloudSnapshot.tasks || []).length;
      const cNotes = (cloudSnapshot.notes || []).length;

      if (localStatsEl) localStatsEl.textContent = `${lTasks} Tugas • ${lNotes} Catatan`;
      if (localProfileEl) {
        localProfileEl.textContent = localSnapshot.profile?.name
          ? `Profil: ${localSnapshot.profile.name} (${localSnapshot.profile.campus || 'Kampus'})`
          : 'Data tersimpan di perangkat ini';
      }

      if (cloudStatsEl) cloudStatsEl.textContent = `${cTasks} Tugas • ${cNotes} Catatan`;
      if (cloudProfileEl) {
        cloudProfileEl.textContent = cloudSnapshot.exists
          ? `Akun: ${currentUser?.email || 'Google Cloud'}`
          : 'Akun Cloud Baru (Belum ada data)';
      }

      progressBox?.classList.add('hidden');
      isMigrationModalOpen = true;
      modal.classList.remove('hidden');

      const mergeBtn = document.getElementById('migrationMergeBtn');
      const useCloudBtn = document.getElementById('migrationUseCloudBtn');
      const cancelBtn = document.getElementById('migrationCancelBtn');

      const cleanupModal = (choice) => {
        mergeBtn?.removeEventListener('click', onMerge);
        useCloudBtn?.removeEventListener('click', onUseCloud);
        cancelBtn?.removeEventListener('click', onCancel);
        isMigrationModalOpen = false;
        modal.classList.add('hidden');
        resolve(choice);
      };

      const onMerge = () => cleanupModal('merge');
      const onUseCloud = () => cleanupModal('use-cloud');
      const onCancel = () => cleanupModal('cancel');

      mergeBtn?.addEventListener('click', onMerge);
      useCloudBtn?.addEventListener('click', onUseCloud);
      cancelBtn?.addEventListener('click', onCancel);
    });
  }

  function startFirestoreRealtimeSubscriptions(uid) {
    cleanupFirestoreListeners();
    const epoch = accountEpoch;

    const prefRef = getPreferencesDocRef(uid);
    const walletRef = getWalletDocRef(uid);
    const rewardsCol = getRewardsColRef(uid);
    const txCol = getTransactionsColRef(uid);
    const tasksCol = getTasksColRef(uid);
    const notesCol = getNotesColRef(uid);

    if (!prefRef || !tasksCol || !notesCol) return;

    // 1. Preferences / Profile / Courses / Appearance real-time listener
    const unsubPref = prefRef.onSnapshot(
      { includeMetadataChanges: true },
      (docSnap) => {
        if (epoch !== accountEpoch) return;
        hasFirestorePendingWrites = docSnap.metadata.hasPendingWrites;
        if (docSnap.exists) {
          const data = docSnap.data();
          if (data && data.profile) {
            appData.profile = {
              ...appData.profile,
              ...data.profile
            };
          }
          if (data && Array.isArray(data.courses)) {
            appData.courses = data.courses;
          }
          saveLocalMirror();
          applyAppearanceAndTheme();
          checkAndShowOnboarding();
          renderHeaderAndProfile();
          renderDashboard();
          renderThemeShopAndWallet();
        }
        refreshSyncStatusUI();
      },
      (err) => {
        if (epoch !== accountEpoch) return;
        console.error('Preferences listener error:', err);
        lastSyncError = err.message;
        refreshSyncStatusUI();
      }
    );

    // 2. Economy Wallet real-time listener (Server-managed XP balance & purchased themes)
    const unsubWallet = walletRef.onSnapshot(
      (docSnap) => {
        if (epoch !== accountEpoch) return;
        cloudWalletLoaded = true;
        if (docSnap.exists) {
          const w = docSnap.data() || {};
          acceptServerWallet(w);
          applyAppearanceAndTheme();
          renderWeeklyProductivityWidget();
          renderThemeShopAndWallet();
        } else if (economyState.walletVersion === 0) {
          economyState = createDefaultEconomyState();
          applyAppearanceAndTheme();
          renderWeeklyProductivityWidget();
          renderThemeShopAndWallet();
        }
      },
      (error) => { if (epoch === accountEpoch) { economySyncError = error.message; renderThemeShopAndWallet(); } }
    );

    // 3. Weekly Rewards Collection real-time listener
    const unsubRewards = rewardsCol.onSnapshot(
      (querySnap) => {
        if (epoch !== accountEpoch) return;
        economyState.rewardedWeeks = {};
        querySnap.forEach((doc) => {
          const d = doc.data();
          if (d && d.weekKey) {
            economyState.rewardedWeeks[d.weekKey] = d;
          } else {
            economyState.rewardedWeeks[doc.id] = d || { claimed: true };
          }
        });
        saveLocalEconomyState();
        renderWeeklyProductivityWidget();
      },
      () => {}
    );

    // 4. XP Transactions Collection real-time listener
    const unsubTx = txCol.onSnapshot(
      (querySnap) => {
        if (epoch !== accountEpoch) return;
        const txs = [];
        querySnap.forEach((doc) => {
          const d = doc.data();
          if (d) txs.push(d);
        });
        {
          txs.sort((a, b) => Number(b.createdAtMs || 0) - Number(a.createdAtMs || 0));
          economyState.transactions = txs;
          saveLocalEconomyState();
          renderThemeShopAndWallet();
        }
      },
      () => {}
    );

    // 5. Tasks Collection real-time listener
    const unsubTasks = tasksCol.onSnapshot(
      { includeMetadataChanges: true },
      (querySnap) => {
        if (epoch !== accountEpoch) return;
        hasFirestorePendingWrites = querySnap.metadata.hasPendingWrites;
        const loadedTasks = [];
        querySnap.forEach((doc) => {
          const d = doc.data();
          if (d && d.id) {
            loadedTasks.push(d);
          }
        });
        appData.tasks = loadedTasks;
        if (!querySnap.metadata.hasPendingWrites && !querySnap.metadata.fromCache) {
          cloudTasksLoaded = true;
          flushPendingTaskCompletions();
        }
        saveLocalMirror();
        renderHeaderAndProfile();
        renderDashboard();
        renderTasksView();
        renderCalendarView();
        renderWeeklyProductivityWidget();
        refreshSyncStatusUI();
      },
      (err) => {
        if (epoch !== accountEpoch) return;
        console.error('Tasks listener error:', err);
        lastSyncError = err.message;
        refreshSyncStatusUI();
      }
    );

    // 6. Notes Collection real-time listener
    const unsubNotes = notesCol.onSnapshot(
      { includeMetadataChanges: true },
      (querySnap) => {
        if (epoch !== accountEpoch) return;
        hasFirestorePendingWrites = querySnap.metadata.hasPendingWrites;
        const incomingNotesMap = new Map();
        querySnap.forEach((doc) => {
          const d = doc.data();
          if (d && d.id) {
            incomingNotesMap.set(String(d.id), d);
          }
        });

        const mergedNotes = [];
        incomingNotesMap.forEach((cloudNote, noteId) => {
          if (pendingNotePayloads.has(noteId)) {
            mergedNotes.push(pendingNotePayloads.get(noteId));
          } else {
            mergedNotes.push(cloudNote);
          }
        });

        appData.notes = mergedNotes;
        if (!activeNoteId && appData.notes.length > 0) {
          activeNoteId = appData.notes[0].id;
        } else if (activeNoteId && !appData.notes.some((n) => n.id === activeNoteId)) {
          activeNoteId = appData.notes[0]?.id || null;
        }

        saveLocalMirror();
        renderHeaderAndProfile();
        renderDashboard();
        renderCalendarView();
        renderNotesStudio();
        refreshSyncStatusUI();
      },
      (err) => {
        if (epoch !== accountEpoch) return;
        console.error('Notes listener error:', err);
        lastSyncError = err.message;
        refreshSyncStatusUI();
      }
    );

    subscribeToCurrentWeek();
    firestoreUnsubscribers.push(unsubPref, unsubWallet, unsubRewards, unsubTx, unsubTasks, unsubNotes);
  }

  async function handleAuthStateTransition(user) {
    const previousUid = currentUser?.uid;
    const epoch = ++accountEpoch;
    cleanupFirestoreListeners();
    if (sseConnection) { sseConnection.close(); sseConnection = null; }
    if (localServerSaveTimer) clearTimeout(localServerSaveTimer);
    localServerSaveTimer = null;
    if (preferencesDebounceTimer) clearTimeout(preferencesDebounceTimer);
    preferencesDebounceTimer = null;
    noteDebounceTimers.forEach((timer) => clearTimeout(timer));
    noteDebounceTimers.clear();
    pendingNotePayloads.clear();
    pendingWriteCount = 0;
    hasFirestorePendingWrites = false;
    lastSyncError = null;
    isPurchasingTheme = false;
    isClaimingWeeklyReward = false;
    pendingPurchaseThemeId = null;
    weeklyProgress = null;
    cloudTasksLoaded = false;
    serverTimeAnchor = null;
    economySyncError = '';
    economySyncErrorCode = '';
    document.getElementById('purchaseConfirmModalBackdrop')?.classList.add('hidden');
    document.getElementById('weeklyGoalCelebrationBanner')?.classList.add('hidden');
    currentUser = user || null;
    pendingCompletions = new Set();
    if (currentUser) {
      try {
        const queue = JSON.parse(localStorage.getItem(PENDING_COMPLETIONS_PREFIX + currentUser.uid) || '[]');
        if (Array.isArray(queue)) pendingCompletions = new Set(queue.filter((id) => typeof id === 'string').slice(0, 5000));
      } catch (error) {}
    }
    if (previousUid && previousUid !== currentUser?.uid) {
      appData = createEmptyWorkspaceData();
      activeNoteId = null;
    }
    cloudWalletLoaded = false;
    loadLocalEconomyState();
    updateAuthUI();
    refreshSyncStatusUI();

    if (!currentUser) {
      if (previousUid) await loadPureLocalWorkspace();
      if (epoch !== accountEpoch) return;
      subscribeToLiveStream(currentSpaceId);
      applyAppearanceAndTheme();
      renderAll();
      return;
    }
    renderAll();

    const onbName = document.getElementById('onboardingNameInput');
    if (onbName && !onbName.value.trim() && currentUser.displayName) {
      onbName.value = currentUser.displayName;
    }
    if (currentUser.photoURL && selectedOnboardingAvatar === PRESET_AVATARS[0].url) {
      selectedOnboardingAvatar = currentUser.photoURL;
      const previewImg = document.getElementById('onboardingAvatarPreview');
      if (previewImg) previewImg.src = selectedOnboardingAvatar;
    }

    const uid = currentUser.uid;
    const localSnapshot = JSON.parse(JSON.stringify(appData));
    const localHasItems =
      (localSnapshot.tasks && localSnapshot.tasks.length > 0) ||
      (localSnapshot.notes && localSnapshot.notes.length > 0);
    const alreadyMigratedForUid = localStorage.getItem(`${MIGRATED_UID_PREFIX}${uid}`) === 'true';

    try {
      pendingWriteCount++;
      refreshSyncStatusUI();
      const cloudSnapshot = await fetchCloudAccountSnapshot(uid);
      if (epoch !== accountEpoch) return;
      acceptServerWallet(cloudSnapshot.wallet);
      cloudWalletLoaded = true;
      pendingWriteCount = Math.max(0, pendingWriteCount - 1);

      savePreMigrationBackup(localSnapshot);
      updateAuthUI();

      if (localHasItems && !alreadyMigratedForUid) {
        const choice = await promptLocalDataMigration(localSnapshot, cloudSnapshot);
        if (epoch !== accountEpoch) return;

        if (choice === 'cancel') {
          await firebaseAuth.signOut();
          currentUser = null;
          appData = localSnapshot;
          updateAuthUI();
          refreshSyncStatusUI();
          renderAll();
          showToast('Tetap menggunakan data lokal di perangkat ini 💾', 'ℹ️');
          return;
        }

        if (choice === 'merge') {
          const merged = mergeLocalAndCloudData(localSnapshot, cloudSnapshot);
          appData = merged;
          pendingWriteCount++;
          refreshSyncStatusUI();
          await uploadWorkspaceToFirestoreBatch(uid, merged);
          pendingWriteCount = Math.max(0, pendingWriteCount - 1);
          localStorage.setItem(`${MIGRATED_UID_PREFIX}${uid}`, 'true');
          showToast('Data lokal & Google Cloud berhasil digabungkan! ☁️✨', '🎉');
        } else if (choice === 'use-cloud') {
          localStorage.setItem(`${MIGRATED_UID_PREFIX}${uid}`, 'true');
          if (!cloudSnapshot.exists && localSnapshot.profile?.onboarded) {
            await uploadWorkspaceToFirestoreBatch(uid, {
              ...createEmptyWorkspaceData(),
              profile: localSnapshot.profile
            });
          }
          showToast('Menggunakan data dari Google Cloud. Cadangan lokal tetap tersimpan aman ☁️', '✅');
        }
      } else if (!cloudSnapshot.exists && hasMeaningfulData(localSnapshot)) {
        await uploadWorkspaceToFirestoreBatch(uid, localSnapshot);
        localStorage.setItem(`${MIGRATED_UID_PREFIX}${uid}`, 'true');
      } else if (cloudSnapshot.exists) {
        if (cloudSnapshot.profile) {
          appData.profile = { ...appData.profile, ...cloudSnapshot.profile };
        }
        appData.courses = cloudSnapshot.courses || [];
        appData.tasks = cloudSnapshot.tasks || [];
        appData.notes = cloudSnapshot.notes || [];
        activeNoteId = appData.notes[0]?.id || null;
      }
    } catch (err) {
      pendingWriteCount = Math.max(0, pendingWriteCount - 1);
      console.error('Cloud migration/fetch error:', err);
      lastSyncError = err.message || 'Gagal memuat Cloud';
    }

    if (epoch !== accountEpoch) return;
    startFirestoreRealtimeSubscriptions(uid);
    applyAppearanceAndTheme();
    checkAndShowOnboarding();
    renderAll();
    refreshSyncStatusUI();
    evaluateAndClaimWeeklyRewardIfEligible();
  }

  // ==========================================================================
  // INITIAL LOCAL WORKSPACE LOAD
  // ==========================================================================
  function subscribeToLiveStream(spaceId) {
    if (sseConnection) {
      try { sseConnection.close(); } catch (e) {}
      sseConnection = null;
    }
    try {
      const es = new EventSource(`/api/stream/${encodeURIComponent(spaceId)}`);
      es.onmessage = (event) => {
        if (currentUser) return;
        if (currentUser) return;
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'sync_update' && msg.excludeClientId !== CLIENT_ID && msg.data) {
            appData = msg.data;
            ensureValidAppDataShape();
            localStorage.setItem(`${STORAGE_PREFIX}${currentSpaceId}`, JSON.stringify(appData));
            renderAll();
          }
        } catch (e) {}
      };
      es.onerror = () => {
        es.close();
      };
      sseConnection = es;
    } catch (e) {}
  }

  async function loadPureLocalWorkspace() {
    let localData = null;
    try {
      const rawLocal = localStorage.getItem(`${STORAGE_PREFIX}${currentSpaceId}`);
      if (rawLocal) localData = JSON.parse(rawLocal);
    } catch (e) {}
    if (!localData) {
      localData = await loadFromIndexedDB(currentSpaceId);
    }
    appData = (localData && localData.version === 2) ? localData : createEmptyWorkspaceData();
    ensureValidAppDataShape();
    loadLocalEconomyState();
    activeNoteId = appData.notes[0]?.id || null;
    applyAppearanceAndTheme();
    checkAndShowOnboarding();
  }

  function ensureValidAppDataShape() {
    if (!Array.isArray(appData.tasks)) appData.tasks = [];
    if (!Array.isArray(appData.notes)) appData.notes = [];
    if (!Array.isArray(appData.courses)) appData.courses = [];
    if (!appData.profile) {
      appData.profile = {
        onboarded: false,
        name: '',
        major: '',
        campus: '',
        avatarUrl: PRESET_AVATARS[0].url,
        focusMinutesToday: 0,
        streakDays: 0,
        themeVibe: 'default',
        activeTheme: 'default',
        colorMode: 'system',
        animationsEnabled: true
      };
    } else {
      if (!appData.profile.activeTheme) appData.profile.activeTheme = 'default';
      if (!appData.profile.colorMode) appData.profile.colorMode = 'system';
      try {
        const cache = JSON.parse(localStorage.getItem(APPEARANCE_CACHE_KEY) || 'null');
        if (cache && !currentUser) {
          if (['light', 'dark', 'system'].includes(cache.colorMode)) appData.profile.colorMode = cache.colorMode;
          if (typeof cache.animationsEnabled === 'boolean') appData.profile.animationsEnabled = cache.animationsEnabled;
        }
      } catch (error) {}
      if (appData.profile.animationsEnabled === undefined) appData.profile.animationsEnabled = true;
    }
  }

  async function initWorkspaceLoad() {
    const parsedUrl = new URL(window.location.href);
    const spaceParam = parsedUrl.searchParams.get('space');
    const savedLastSpace = localStorage.getItem(LAST_SPACE_KEY);

    if (spaceParam) {
      currentSpaceId = spaceParam.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-') || 'ruang-kuliah';
    } else if (savedLastSpace) {
      currentSpaceId = savedLastSpace;
    }

    let loadedFromUrlHash = null;
    if (window.location.hash && window.location.hash.startsWith('#s=')) {
      const rawHash = window.location.hash.slice(3);
      loadedFromUrlHash = decodeStateFromUrlHash(rawHash);
    }

    let localData = null;
    try {
      const rawLocal = localStorage.getItem(`${STORAGE_PREFIX}${currentSpaceId}`);
      if (rawLocal) localData = JSON.parse(rawLocal);
    } catch (e) {}
    if (!localData) {
      localData = await loadFromIndexedDB(currentSpaceId);
    }

    let serverData = null;
    try {
      const res = await fetch(`/api/workspace/${encodeURIComponent(currentSpaceId)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.exists && json.data && json.data.version === 2) {
          serverData = json.data;
        }
      }
    } catch (e) {}

    const candidates = [serverData, localData, loadedFromUrlHash].filter(
      (item) => item && item.version === 2
    );

    if (candidates.length > 0) {
      candidates.sort((a, b) => {
        const tA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const tB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return tB - tA;
      });
      appData = candidates[0];
    } else {
      appData = createEmptyWorkspaceData();
    }

    ensureValidAppDataShape();
    loadLocalEconomyState();
    activeNoteId = appData.notes[0]?.id || null;

    applyAppearanceAndTheme();
    checkAndShowOnboarding();
    subscribeToLiveStream(currentSpaceId);
    renderAll();
    refreshSyncStatusUI();

    await initFirebaseSdk();
  }

  // ==========================================================================
  // ONBOARDING WELCOME SCREEN & AVATAR PICKER LOGIC
  // ==========================================================================
  function checkAndShowOnboarding() {
    const overlay = document.getElementById('onboardingOverlay');
    if (!overlay) return;

    const isProfileComplete = Boolean(
      appData.profile &&
      appData.profile.onboarded &&
      appData.profile.name &&
      appData.profile.major &&
      appData.profile.campus
    );

    if (isProfileComplete) {
      overlay.classList.add('hidden');
    } else {
      selectedOnboardingAvatar = appData.profile?.avatarUrl || currentUser?.photoURL || PRESET_AVATARS[0].url;
      const previewImg = document.getElementById('onboardingAvatarPreview');
      if (previewImg) previewImg.src = selectedOnboardingAvatar;
      renderOnboardingPresetGrid();
      overlay.classList.remove('hidden');
    }
  }

  function renderOnboardingPresetGrid() {
    const grid = document.getElementById('onboardingPresetGrid');
    if (!grid) return;

    const filtered = currentAvatarGenderFilter === 'all'
      ? PRESET_AVATARS
      : PRESET_AVATARS.filter((a) => a.gender === currentAvatarGenderFilter);

    grid.innerHTML = filtered.map((av) => {
      const isSelected = selectedOnboardingAvatar === av.url;
      const genderBadge = av.gender === 'boy' ? '👦 Cowok' : '👧 Cewek';
      return `
        <button type="button" class="preset-avatar-item ${isSelected ? 'selected' : ''}" data-preset-url="${escapeHtml(av.url)}" title="Pilih ${escapeHtml(av.label)}">
          <img src="${escapeHtml(av.url)}" alt="${escapeHtml(av.label)}" />
          <span class="preset-gender-tag">${genderBadge}</span>
        </button>
      `;
    }).join('');

    grid.querySelectorAll('[data-preset-url]').forEach((btn) => {
      btn.addEventListener('click', () => {
        selectedOnboardingAvatar = btn.getAttribute('data-preset-url');
        const previewImg = document.getElementById('onboardingAvatarPreview');
        if (previewImg) previewImg.src = selectedOnboardingAvatar;
        playSound('pop');
        renderOnboardingPresetGrid();
      });
    });
  }

  function renderProfileModalPresetGrid() {
    const grid = document.getElementById('profileModalPresetGrid');
    if (!grid) return;

    grid.innerHTML = PRESET_AVATARS.map((av) => {
      const isSelected = selectedProfileModalAvatar === av.url;
      const genderBadge = av.gender === 'boy' ? '👦 Cowok' : '👧 Cewek';
      return `
        <button type="button" class="preset-avatar-item ${isSelected ? 'selected' : ''}" data-profile-preset-url="${escapeHtml(av.url)}" title="Pilih ${escapeHtml(av.label)}">
          <img src="${escapeHtml(av.url)}" alt="${escapeHtml(av.label)}" />
          <span class="preset-gender-tag">${genderBadge}</span>
        </button>
      `;
    }).join('');

    grid.querySelectorAll('[data-profile-preset-url]').forEach((btn) => {
      btn.addEventListener('click', () => {
        selectedProfileModalAvatar = btn.getAttribute('data-profile-preset-url');
        const previewImg = document.getElementById('profileModalAvatarPreview');
        if (previewImg) previewImg.src = selectedProfileModalAvatar;
        playSound('pop');
        renderProfileModalPresetGrid();
      });
    });
  }

  function ensureCourseRegistered(courseName) {
    const clean = String(courseName || '').trim();
    if (!clean) return 'Umum';
    if (!appData.courses.includes(clean)) {
      appData.courses.push(clean);
      if (currentUser && firestoreDb) {
        scheduleFirestorePreferencesSave();
      }
    }
    return clean;
  }

  function renderCoursesDatalist() {
    const datalist = document.getElementById('coursesDatalist');
    if (!datalist) return;
    datalist.innerHTML = appData.courses
      .map((c) => `<option value="${escapeHtml(c)}"></option>`)
      .join('');
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
    }, 3000);
  }

  function triggerConfetti() {
    if (appData.profile?.animationsEnabled === false || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
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
        p.vy += 0.42;
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
    flushAllPendingCloudWrites();
    playSound('switch');
    document.querySelectorAll('.app-view').forEach((view) => {
      view.classList.toggle('active-view', view.id === targetViewId);
    });
    document.querySelectorAll('[data-target-view]').forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-target-view') === targetViewId);
    });
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

    const displayName = appData.profile.name || currentUser?.displayName || 'Teman';
    const majorText = appData.profile.major || 'Jurusan';
    const campusText = appData.profile.campus || 'Kampus';

    if (nameEl) nameEl.textContent = `${displayName}!`;
    if (semEl) semEl.textContent = `${majorText} • ${campusText}`;
    if (avatarEl) {
      avatarEl.src = appData.profile.avatarUrl || currentUser?.photoURL || PRESET_AVATARS[0].url;
    }

    const now = new Date();
    if (todayChip) {
      todayChip.textContent = `${DAYS_ID[now.getDay()]}, ${now.getDate()} ${MONTHS_SHORT_FIXED[now.getMonth()]}`;
    }
    if (statusTime) {
      statusTime.textContent = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    }

    const pendingTasks = appData.tasks.filter((t) => t.status !== 'completed').length;
    const navTaskBadge = document.getElementById('navTaskCountBadge');
    const navNoteBadge = document.getElementById('navNoteCountBadge');
    const heroNoteCount = document.getElementById('heroNoteCount');

    if (navTaskBadge) navTaskBadge.textContent = pendingTasks;
    if (navNoteBadge) navNoteBadge.textContent = appData.notes.length;
    if (heroNoteCount) heroNoteCount.textContent = appData.notes.length;

    renderCoursesDatalist();
    updateAuthUI();
  }

  function renderDashboard() {
    const totalTasks = appData.tasks.length;
    const completedTasks = appData.tasks.filter((t) => t.status === 'completed').length;
    const pendingTasks = totalTasks - completedTasks;
    const urgentTasks = appData.tasks.filter((t) => t.status !== 'completed' && getDaysDiffFromToday(t.dueDate) <= 2).length;

    const pct = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
    const pctEl = document.getElementById('dashboardProgressPct');
    if (pctEl) pctEl.textContent = `${Math.round(getQualifyingWeeklyTasksInfo().completedCount / WEEKLY_GOAL_TASKS * 100)}%`;

    const ringCircle = document.getElementById('progressRingCircle');
    if (ringCircle) {
      const circumference = 289;
      const offset = circumference - (getQualifyingWeeklyTasksInfo().completedCount / WEEKLY_GOAL_TASKS) * circumference;
      ringCircle.style.strokeDashoffset = String(offset);
    }

    const xpScore = economyState.xpBalance;
    const pointsEl = document.getElementById('progressRingPoints');
    if (pointsEl) pointsEl.textContent = String(xpScore);

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

    const bentoTasksDesc = document.getElementById('bentoTasksDesc');
    const bentoNotesDesc = document.getElementById('bentoNotesDesc');
    const bentoCalDesc = document.getElementById('bentoCalendarDesc');
    const bentoCloudDesc = document.getElementById('bentoCloudDesc');

    if (bentoTasksDesc) bentoTasksDesc.textContent = `${pendingTasks} tugas aktif • ${urgentTasks} deadline dekat`;
    if (bentoNotesDesc) bentoNotesDesc.textContent = `${appData.notes.length} catatan kuliah tersimpan online`;
    if (bentoCalDesc) bentoCalDesc.textContent = `Pantau jadwal kuliah & produktivitas harian`;
    if (bentoCloudDesc) {
      bentoCloudDesc.textContent = currentUser
        ? `Tersinkron ke ${currentUser.email}`
        : `Login Google untuk sinkronisasi otomatis`;
    }

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
        const emptyRow = document.createElement('div');
        emptyRow.className = 'sage-pill-row';
        emptyRow.innerHTML = `
          <div class="sage-row-left">
            <span class="sage-row-icon">✨</span>
            <div class="sage-row-text">
              <span class="sage-row-title">Belum ada tugas aktif</span>
              <span class="sage-row-meta">Klik untuk membuat tugas pertamamu</span>
            </div>
          </div>
          <span class="sage-row-chevron">+</span>
        `;
        emptyRow.addEventListener('click', () => openTaskModal());
        listEl.appendChild(emptyRow);
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
        .sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''))
        .slice(0, 3);

      if (upcoming.length === 0) {
        const emptyRow = document.createElement('div');
        emptyRow.className = 'sage-pill-row';
        emptyRow.innerHTML = `
          <div class="sage-row-left">
            <span class="sage-row-icon">📅</span>
            <div class="sage-row-text">
              <span class="sage-row-title">Belum ada jadwal deadline</span>
              <span class="sage-row-meta">Klik untuk tambah jadwal tugas baru</span>
            </div>
          </div>
          <span class="sage-row-chevron">+</span>
        `;
        emptyRow.addEventListener('click', () => openTaskModal());
        listEl.appendChild(emptyRow);
        return;
      }

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
      if (titleEl) titleEl.textContent = '📌 Catatan Kuliah Tersimpan';
      const notes = appData.notes.slice(0, 3);
      if (notes.length === 0) {
        const emptyRow = document.createElement('div');
        emptyRow.className = 'sage-pill-row';
        emptyRow.innerHTML = `
          <div class="sage-row-left">
            <span class="sage-row-icon">📝</span>
            <div class="sage-row-text">
              <span class="sage-row-title">Belum ada catatan kuliah</span>
              <span class="sage-row-meta">Klik untuk mulai menulis catatan baru</span>
            </div>
          </div>
          <span class="sage-row-chevron">+</span>
        `;
        emptyRow.addEventListener('click', () => createNewNote());
        listEl.appendChild(emptyRow);
        return;
      }

      notes.forEach((note) => {
        const row = document.createElement('div');
        row.className = 'sage-pill-row';
        row.innerHTML = `
          <div class="sage-row-left">
            <span class="sage-row-icon">📝</span>
            <div class="sage-row-text">
              <span class="sage-row-title">${escapeHtml(note.title || 'Catatan Tanpa Judul')}</span>
              <span class="sage-row-meta">${escapeHtml(note.course)} • ${escapeHtml(note.tag || 'Catatan')}</span>
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
    const stage = document.getElementById('geometricStickersStage');
    if (stage) {
      stage.innerHTML = '';
      const activeTasks = appData.tasks.filter((t) => t.status !== 'completed');
      const stickerTasks = activeTasks.length > 0 ? activeTasks.slice(0, 3) : appData.tasks.slice(0, 3);

      const shapeClasses = [
        'sticker-square-yellow',
        'sticker-starburst-pink',
        'sticker-circle-blue'
      ];

      if (stickerTasks.length === 0) {
        const emptyStickers = [
          { badge: 'Prioritas 1', title: '+ Buat Tugas', sub: 'Klik di sini' },
          { badge: 'Target', title: '+ Kuis / Ujian', sub: 'Klik di sini' },
          { badge: 'Kampus', title: '+ Proyek Baru', sub: 'Klik di sini' }
        ];
        emptyStickers.forEach((item, index) => {
          const sticker = document.createElement('div');
          sticker.className = `geo-sticker ${shapeClasses[index % 3]}`;
          sticker.innerHTML = `
            <span class="geo-sticker-course">${item.badge}</span>
            <div class="geo-sticker-title">${item.title}</div>
            <span class="geo-sticker-date">${item.sub}</span>
          `;
          sticker.addEventListener('click', () => {
            playSound('pop');
            openTaskModal();
          });
          stage.appendChild(sticker);
        });
      } else {
        stickerTasks.forEach((task, index) => {
          const sticker = document.createElement('div');
          sticker.className = `geo-sticker ${shapeClasses[index % 3]}`;
          sticker.innerHTML = `
            <span class="geo-sticker-course">${escapeHtml((task.course || 'Tugas').split(' ')[0])}</span>
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
    }

    const courseSelect = document.getElementById('taskCourseFilterSelect');
    if (courseSelect) {
      const prevVal = currentTaskCourseFilter;
      courseSelect.innerHTML = `<option value="all">📚 Semua Mata Kuliah</option>` +
        appData.courses.map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
      courseSelect.value = appData.courses.includes(prevVal) ? prevVal : 'all';
    }

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

    filtered.sort((a, b) => {
      if (a.status === 'completed' && b.status !== 'completed') return 1;
      if (a.status !== 'completed' && b.status === 'completed') return -1;
      return (a.dueDate || '').localeCompare(b.dueDate || '');
    });

    if (filtered.length === 0) {
      listContainer.innerHTML = `
        <div class="task-item-card" style="align-items:center; text-align:center; padding: 36px 20px;">
          <div style="font-size:2.2rem;">📋</div>
          <h4 style="font-weight:800; font-size:1.05rem;">Daftar Tugas Masih Kosong</h4>
          <p style="font-size:0.84rem; color:var(--text-secondary); max-width:340px;">Klik tombol <strong>"+ Tambah Tugas"</strong> untuk mulai mencatat tugas harian, PR, atau jadwal ujian kampusmu.</p>
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
                <span class="badge-course">${escapeHtml(task.course || 'Umum')}</span>
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

      card.querySelector(`[data-toggle-task="${task.id}"]`)?.addEventListener('click', () => toggleTaskCompletion(task.id));
      card.querySelector(`[data-edit-task="${task.id}"]`)?.addEventListener('click', () => openTaskModal(task.id));
      card.querySelector(`[data-delete-task="${task.id}"]`)?.addEventListener('click', () => deleteTask(task.id));

      card.querySelectorAll('.subtask-pill-item').forEach((stEl) => {
        stEl.addEventListener('click', () => {
          toggleSubtask(task.id, stEl.getAttribute('data-subtask-id'));
        });
      });

      listContainer.appendChild(card);
    });
  }

  async function toggleTaskCompletion(taskId) {
    const task = appData.tasks.find((t) => t.id === taskId);
    if (!task) return;
    if (task.status === 'completed') {
      task.status = 'pending';
      pendingCompletions.delete(String(task.id));
      persistPendingCompletions();
      task.completedAtMs = null;
      playSound('pop');
      showToast('Tugas dikembalikan ke daftar aktif', '🔄');
      await saveTaskToFirestore(task);
      renderAll();
    } else {
      const nowMs = Date.now();
      task.status = 'completed';
      queueTaskCompletion(task.id);
      task.completedAtMs = nowMs;
      playSound('success');
      triggerConfetti();
      showToast('Mantap! Tugas selesai dikerjakan 🎉', '✅');
      await saveTaskToFirestore(task);
      renderAll();
      await evaluateAndClaimWeeklyRewardIfEligible();
    }
  }

  function toggleSubtask(taskId, subtaskId) {
    const task = appData.tasks.find((t) => t.id === taskId);
    if (!task || !Array.isArray(task.subtasks)) return;
    const st = task.subtasks.find((s) => s.id === subtaskId);
    if (!st) return;
    st.done = !st.done;
    playSound('pop');

    const allDone = task.subtasks.length > 0 && task.subtasks.every((s) => s.done);
    if (allDone && task.status === 'pending') {
      task.status = 'in-progress';
    }
    saveTaskToFirestore(task);
    renderAll();
  }

  function deleteTask(taskId) {
    const target = appData.tasks.find((t) => t.id === taskId);
    if (!target) return;
    if ((target.xpRewarded === true || target.rewardedWeekKey) && currentUser) {
      // Preserve a receipt for legacy rewarded tasks before allowing ID recycling.
      queueTaskCompletion(taskId);
      const epoch = accountEpoch;
      flushPendingTaskCompletions().then(() => {
        if (epoch !== accountEpoch) return;
        if (!pendingCompletions.has(String(taskId))) {
          target.xpRewarded = false;
          target.rewardedWeekKey = null;
          deleteTask(taskId);
        } else showToast('Hubungkan internet untuk mengamankan riwayat tugas ini sebelum menghapusnya.', 'ℹ️');
      });
      return;
    }
    pendingCompletions.delete(String(taskId));
    persistPendingCompletions();
    appData.tasks = appData.tasks.filter((t) => t.id !== taskId);
    playSound('pop');
    deleteTaskFromFirestore(taskId);
    renderAll();
    showToast('Tugas telah dihapus', '🗑️');
  }

  // ==========================================================================
  // WEEKLY XP REWARD EVALUATOR, CELEBRATION & THEME SHOP / WALLET ENGINE
  // ==========================================================================
  function getQualifyingWeeklyTasksInfo(nowMs = estimatedServerTime()) {
    const weekInfo = getJakartaWeekInfo(nowMs);
    const progress = weeklyProgress?.weekKey === weekInfo.weekKey ? weeklyProgress : null;
    const isAlreadyClaimed = Boolean(progress?.rewarded || economyState.rewardedWeeks[weekInfo.weekKey] || economyState.rewardedWeeks[weekInfo.legacyWeekKey]);
    return {
      ...weekInfo,
      isAlreadyClaimed,
      completedCount: isAlreadyClaimed ? WEEKLY_GOAL_TASKS : Math.min(WEEKLY_GOAL_TASKS, Math.max(0, Number(progress?.completedCount || 0)))
    };
  }

  function showWeeklyGoalCelebration(weekKey, newBalance) {
    const banner = document.getElementById('weeklyGoalCelebrationBanner');
    const titleEl = banner?.querySelector('.celebration-text strong');
    const descEl = banner?.querySelector('.celebration-text span');
    if (titleEl) {
      titleEl.textContent = 'Weekly Goal Completed! 🎉 You earned +500 XP!';
    }
    if (descEl) {
      descEl.textContent = `5 tugas minggu ini (${weekKey}) tuntas! Saldo XP kamu sekarang ${Number(newBalance || economyState.xpBalance).toLocaleString('id-ID')} XP.`;
    }
    if (banner) {
      banner.classList.remove('hidden');
      setTimeout(() => {
        banner.classList.add('hidden');
      }, 7500);
    }
    playSound('success');
    triggerConfetti();
    showToast('Weekly Goal Completed! 🎉 You earned +500 XP!', '🏆');
  }

  async function evaluateAndClaimWeeklyRewardIfEligible() {
    if (isClaimingWeeklyReward || !currentUser || navigator.onLine === false) return;
    const user = currentUser;
    const epoch = accountEpoch;
    isClaimingWeeklyReward = true;
    try {
      const data = await postEconomyOperation('/api/claim-weekly-reward', {}, user, epoch);
      applyServerEconomy(data);
    } catch (error) {
      if (epoch === accountEpoch) {
        reportEconomySyncError(error);
      }
    } finally {
      if (epoch === accountEpoch) {
        isClaimingWeeklyReward = false;
        renderWeeklyProductivityWidget();
      }
    }
  }

  function renderWeeklyProductivityWidget() {
    const info = getQualifyingWeeklyTasksInfo();
    const xpBal = Math.max(0, Number(economyState.xpBalance || 0));
    const formattedBal = `${xpBal.toLocaleString('id-ID')} XP`;
    const weeklyPct = document.getElementById('dashboardProgressPct');
    if (weeklyPct) weeklyPct.textContent = `${Math.round(info.completedCount / WEEKLY_GOAL_TASKS * 100)}%`;
    const pendingLabel = document.getElementById('weeklyPendingVerificationText');
    if (pendingLabel) {
      pendingLabel.textContent = pendingCompletions.size
        ? `${pendingCompletions.size} tugas selesai menunggu verifikasi`
        : 'Hanya penyelesaian yang sudah diverifikasi server yang dihitung.';
    }
    const syncNotice = document.getElementById('weeklyXpSyncNotice');
    if (syncNotice) {
      syncNotice.textContent = economySyncError;
      syncNotice.classList.toggle('hidden', !currentUser || !economySyncError);
    }
    const ringBalance = document.getElementById('progressRingPoints');
    if (ringBalance) ringBalance.textContent = xpBal.toLocaleString('id-ID');
    const ring = document.getElementById('progressRingCircle');
    if (ring) ring.style.strokeDashoffset = String(289 * (1 - info.completedCount / WEEKLY_GOAL_TASKS));
    const walletCount = document.getElementById('walletWeeklyCountBadge');
    if (walletCount) walletCount.textContent = `${info.completedCount} / 5 Tasks`;
    const walletDescription = document.getElementById('walletWeeklyDesc');
    if (walletDescription) walletDescription.textContent = `${info.periodLabel} (Asia/Jakarta). 5 tugas terverifikasi = +500 XP, sekali per minggu. Setiap tugas hanya dihitung sekali sepanjang waktu.`;
    ['claimWeeklyRewardBtn', 'walletClaimWeeklyBtn'].forEach((id) => {
      const button = document.getElementById(id);
      if (button) {
        button.disabled = !currentUser || navigator.onLine === false || isClaimingWeeklyReward;
        button.textContent = info.isAlreadyClaimed ? '✓ +500 XP diterima' : '↻ Periksa progres XP';
      }
    });

    const topBarXp = document.getElementById('topXpBalanceText');
    if (topBarXp) topBarXp.textContent = formattedBal;

    const widgetXp = document.getElementById('weeklyWidgetXpBalance');
    if (widgetXp) widgetXp.textContent = formattedBal;

    const periodEl = document.getElementById('weeklyCycleBadge');
    if (periodEl) {
      periodEl.textContent = `${info.weekKey} · WIB`;
      periodEl.title = info.periodLabel + ' (Asia/Jakarta)';
    }

    const titleEl = document.getElementById('weeklyTasksCountText');
    if (titleEl) {
      titleEl.textContent = `${info.completedCount} / ${WEEKLY_GOAL_TASKS} Tasks Completed`;
    }

    const badgeEl = document.getElementById('weeklyRewardAmountBadge');
    if (badgeEl) {
      badgeEl.textContent = info.isAlreadyClaimed
        ? '✓ Claimed: +500 XP'
        : `Reward: +${WEEKLY_REWARD_XP} XP`;
    }

    const fillEl = document.getElementById('weeklyTasksProgressBar');
    if (fillEl) {
      const pct = Math.min(100, Math.round((info.completedCount / WEEKLY_GOAL_TASKS) * 100));
      fillEl.style.width = `${pct}%`;
    }
    const track = document.getElementById('weeklyTasksProgressTrack');
    track?.setAttribute('aria-valuenow', String(info.completedCount));
    track?.setAttribute('aria-valuetext', `${info.completedCount} dari 5 tugas terverifikasi`);

    const dotsWrap = document.getElementById('weeklyStepDots');
    if (dotsWrap) {
      const dots = dotsWrap.querySelectorAll('.weekly-step-dot');
      dots.forEach((dot, idx) => {
        const done = idx < info.completedCount;
        dot.classList.toggle('completed', done);
        dot.textContent = done ? '✓' : String(idx + 1);
      });
    }

    const hintEl = document.getElementById('weeklyRewardStatusText');
    if (hintEl) {
      if (!currentUser) {
        hintEl.textContent = 'Masuk dengan Google untuk mendapatkan XP dan menyinkronkan progres mingguan.';
        hintEl.classList.remove('claimed');
      } else if (navigator.onLine === false) {
        hintEl.textContent = 'Offline — tugas tetap tersimpan. XP diverifikasi server saat tersambung kembali (mengikuti minggu verifikasi WIB).';
        hintEl.classList.remove('claimed');
      } else if (economySyncError) {
        hintEl.textContent = economySyncErrorCode === 'SERVER_NOT_CONFIGURED'
          ? '⏳ Layanan XP belum aktif'
          : '⏳ Verifikasi XP tertunda';
        hintEl.classList.remove('claimed');
      } else if (pendingCompletions.size > 0) {
        hintEl.textContent = `${pendingCompletions.size} penyelesaian menunggu verifikasi server. Progres menampilkan tugas terverifikasi.`;
        hintEl.classList.remove('claimed');
      } else if (info.isAlreadyClaimed) {
        hintEl.textContent = `🎉 Target minggu ini (${info.weekKey}) selesai! +500 XP sudah masuk ke XP Wallet.`;
        hintEl.classList.add('claimed');
      } else {
        const remaining = Math.max(0, WEEKLY_GOAL_TASKS - info.completedCount);
        hintEl.textContent =
          remaining === 0
            ? 'Memverifikasi klaim hadiah +500 XP...'
            : `Selesaikan ${remaining} tugas lagi minggu ini untuk klaim +500 XP!`;
        hintEl.classList.remove('claimed');
      }
    }
  }

  function renderThemeShopAndWallet() {
    const xpBal = Math.max(0, Number(economyState.xpBalance || 0));
    const lifetimeEarned = Math.max(0, Number(economyState.lifetimeEarnedXp || 0));
    const lifetimeSpent = Math.max(0, Number(economyState.lifetimeSpentXp || 0));
    const ownedThemes = Array.isArray(economyState.purchasedThemes)
      ? Array.from(new Set(['default', ...economyState.purchasedThemes]))
      : ['default'];
    const activeTheme = appData.profile?.activeTheme || 'default';
    const ownedCount = document.getElementById('walletOwnedThemesCount');
    if (ownedCount) ownedCount.textContent = String(THEME_CATALOG.filter((theme) => ownedThemes.includes(theme.id)).length);
    const notice = document.getElementById('economySyncNotice');
    if (notice) {
      notice.textContent = !currentUser
        ? 'Masuk dengan Google untuk mendapatkan XP dan membeli tema permanen.'
        : navigator.onLine === false
          ? 'Offline. Saldo terakhir ditampilkan; pembelian dan verifikasi XP memerlukan internet.'
          : economySyncError || (!cloudWalletLoaded ? 'Memuat dompet akun…' : 'Dompet tersinkron dengan akun Google. 5 tugas terverifikasi = +500 XP, maksimal sekali per minggu (WIB).');
    }

    const shopBalEl = document.getElementById('shopModalXpBalance');
    if (shopBalEl) shopBalEl.textContent = `${xpBal.toLocaleString('id-ID')} XP`;

    const wSpendable = document.getElementById('walletCurrentXpValue');
    const wEarned = document.getElementById('walletLifetimeXpValue');
    const wSpent = document.getElementById('walletSpentXpValue');
    if (wSpendable) wSpendable.textContent = `${xpBal.toLocaleString('id-ID')} XP`;
    if (wEarned) wEarned.textContent = `${lifetimeEarned.toLocaleString('id-ID')} XP`;
    if (wSpent) wSpent.textContent = `${lifetimeSpent.toLocaleString('id-ID')} XP`;

    // Render Theme Shop Cards
    const gridEl = document.getElementById('themeShopGrid');
    if (gridEl) {
      gridEl.innerHTML = THEME_CATALOG.map((theme) => {
        const isOwned = theme.isDefault || ownedThemes.includes(theme.id);
        const isApplied = activeTheme === theme.id;
        const canAfford = xpBal >= theme.priceXp;

        let statusBadgeHtml = '';
        if (isApplied) {
          statusBadgeHtml = `<span class="theme-status-pill applied">✓ Currently Applied</span>`;
        } else if (isOwned) {
          statusBadgeHtml = `<span class="theme-status-pill unlocked">🔓 Unlocked</span>`;
        } else {
          statusBadgeHtml = `<span class="theme-status-pill">🔒 Locked</span>`;
        }

        let actionBtnHtml = '';
        if (isApplied) {
          actionBtnHtml = `<button type="button" class="theme-card-action-btn btn-applied" disabled>✓ Tema Sedang Digunakan</button>`;
        } else if (isOwned) {
          actionBtnHtml = `<button type="button" class="theme-card-action-btn btn-apply" data-apply-theme="${theme.id}">🎨 Apply Theme (Gratis)</button>`;
        } else if (!currentUser || !cloudWalletLoaded || navigator.onLine === false || isPurchasingTheme) {
          actionBtnHtml = `<button type="button" class="theme-card-action-btn btn-locked-insufficient" disabled>${!currentUser ? 'Masuk dengan Google untuk membeli' : 'Pembelian menunggu koneksi & dompet'}</button>`;
        } else if (canAfford) {
          actionBtnHtml = `<button type="button" class="theme-card-action-btn btn-buy" data-purchase-theme="${theme.id}">🛒 Beli Tema (${theme.priceXp.toLocaleString('id-ID')} XP)</button>`;
        } else {
          const kurang = theme.priceXp - xpBal;
          actionBtnHtml = `<button type="button" class="theme-card-action-btn btn-locked-insufficient" data-purchase-theme="${theme.id}">🔒 Butuh ${kurang.toLocaleString('id-ID')} XP Lagi (${theme.priceXp.toLocaleString('id-ID')} XP)</button>`;
        }

        const swatchesHtml = theme.swatches
          .map((c) => `<span class="theme-swatch-dot" style="background:${c};"></span>`)
          .join('');

        const previewBg =
          theme.id === 'christmas'
            ? 'linear-gradient(135deg, #991B1B 0%, #166534 100%)'
            : theme.id === 'nature'
              ? 'linear-gradient(135deg, #ECFCCB 0%, #86EFAC 100%)'
              : theme.id === 'antarctica'
                ? 'linear-gradient(135deg, #E0F2FE 0%, #93C5FD 100%)'
                : 'linear-gradient(135deg, #FEF08A 0%, #F3B9DF 100%)';

        return `
          <article class="theme-shop-card ${isApplied ? 'active-equipped' : ''}">
            <div class="theme-card-preview" style="background:${previewBg};">
              ${statusBadgeHtml}
              ${getThemeIllustrationSvg(theme.id)}
            </div>
            <div class="theme-card-body">
              <div>
                <div class="theme-card-title-row">
                  <h4 class="theme-card-title">${theme.emoji} ${escapeHtml(theme.name)}</h4>
                  <span class="theme-card-price">${theme.priceXp === 0 ? 'GRATIS' : `${theme.priceXp.toLocaleString('id-ID')} XP`}</span>
                </div>
                <p class="theme-card-desc">${escapeHtml(theme.description)}</p>
              </div>
              <div>
                <div class="theme-card-swatches">${swatchesHtml}</div>
                ${actionBtnHtml}
              </div>
            </div>
          </article>
        `;
      }).join('');

      gridEl.querySelectorAll('[data-apply-theme]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const themeId = btn.getAttribute('data-apply-theme');
          equipOwnedTheme(themeId);
        });
      });

      gridEl.querySelectorAll('[data-purchase-theme]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const themeId = btn.getAttribute('data-purchase-theme');
          openPurchaseConfirmationDialog(themeId);
        });
      });
    }

    // Render Owned Themes in Wallet
    const ownedListEl = document.getElementById('walletOwnedThemesList');
    if (ownedListEl) {
      ownedListEl.innerHTML = THEME_CATALOG.filter(
        (t) => t.isDefault || ownedThemes.includes(t.id)
      )
        .map(
          (t) =>
            `<span class="wallet-owned-chip">${t.emoji} ${escapeHtml(t.name)} ${activeTheme === t.id ? '• (Aktif)' : ''}</span>`
        )
        .join('');
    }

    // Render XP Transaction History in Wallet
    const txListEl = document.getElementById('walletHistoryList');
    if (txListEl) {
      const txs = Array.isArray(economyState.transactions) ? economyState.transactions : [];
      if (txs.length === 0) {
        txListEl.innerHTML = `<div style="text-align:center; padding:18px; color:var(--text-secondary); font-size:0.8rem;">Belum ada riwayat transaksi XP. Selesaikan 5 tugas minggu ini untuk mendapatkan +500 XP pertamamu! 🚀</div>`;
      } else {
        txListEl.innerHTML = txs
          .map((tx) => {
            const amt = Number(tx.amount || 0);
            const isPos = amt >= 0;
            const sign = isPos ? '+' : '';
            const dateStr = tx.createdAt
              ? formatDateDisplay(String(tx.createdAt).slice(0, 10))
              : 'Baru saja';
            return `
              <div class="wallet-tx-row">
                <div class="wallet-tx-left">
                  <span class="wallet-tx-desc">${escapeHtml(tx.description || (isPos ? 'Weekly Goal Completed' : 'Theme Purchased'))}</span>
                  <span class="wallet-tx-date">${escapeHtml(dateStr)} • Saldo akhir: ${Number(tx.balanceAfter ?? xpBal).toLocaleString('id-ID')} XP</span>
                </div>
                <span class="wallet-tx-amount ${isPos ? 'positive' : 'negative'}">${sign}${amt.toLocaleString('id-ID')} XP</span>
              </div>
            `;
          })
          .join('');
      }
    }
  }

  function equipOwnedTheme(themeId) {
    const ownedThemes = Array.isArray(economyState.purchasedThemes)
      ? economyState.purchasedThemes
      : ['default'];
    if (themeId !== 'default' && !ownedThemes.includes(themeId)) {
      showToast('Tema ini belum dibuka. Tukarkan 3.000 XP untuk membuka tema ini 🔒', '⚠️');
      return;
    }

    appData.profile.activeTheme = themeId;
    economyState.activeTheme = themeId;
    saveLocalEconomyState();
    applyAppearanceAndTheme();
    saveWorkspace();
    renderThemeShopAndWallet();
    playSound('success');

    const meta = THEME_CATALOG.find((t) => t.id === themeId) || THEME_CATALOG[0];
    showToast(`${meta.emoji} Tema "${meta.name}" berhasil diterapkan!`, '🎨');
  }

  function openPurchaseConfirmationDialog(themeId) {
    const theme = THEME_CATALOG.find((t) => t.id === themeId);
    if (!theme || theme.isDefault) return;
    if (!currentUser || !cloudWalletLoaded || navigator.onLine === false) {
      showToast('Masuk dengan Google dan hubungkan internet untuk membeli tema.', 'ℹ️');
      return;
    }

    const ownedThemes = Array.isArray(economyState.purchasedThemes)
      ? economyState.purchasedThemes
      : ['default'];
    if (ownedThemes.includes(themeId)) {
      equipOwnedTheme(themeId);
      return;
    }

    const xpBal = Math.max(0, Number(economyState.xpBalance || 0));
    if (xpBal < theme.priceXp) {
      const kurang = theme.priceXp - xpBal;
      playSound('pop');
      showToast(
        `XP belum cukup. Kamu butuh ${kurang.toLocaleString('id-ID')} XP lagi (Harga: ${theme.priceXp.toLocaleString('id-ID')} XP). Selesaikan target mingguan untuk +500 XP!`,
        '🔒'
      );
      return;
    }

    pendingPurchaseThemeId = theme.id;
    const remaining = xpBal - theme.priceXp;

    const iconEl = document.getElementById('purchaseConfirmPreviewBox');
    const titleEl = document.getElementById('purchaseConfirmTitle');
    const descEl = document.getElementById('purchaseConfirmThemeDesc');
    const balEl = document.getElementById('purchaseCurrentBalanceText');
    const nameEl = document.getElementById('purchaseThemeNameInline');
    const costEl = document.getElementById('purchasePriceText');
    const remEl = document.getElementById('purchaseRemainingBalanceText');

    if (iconEl) iconEl.innerHTML = getThemeIllustrationSvg(theme.id);
    const themeTitle = document.getElementById('purchaseConfirmThemeTitle');
    if (themeTitle) themeTitle.textContent = theme.name;
    if (titleEl) titleEl.textContent = `Beli Tema ${theme.name}?`;
    if (descEl) {
      descEl.textContent = `Tema ${theme.name} akan terbuka secara permanen di akunmu dan bisa dipasang kapan saja tanpa biaya tambahan.`;
    }
    if (balEl) balEl.textContent = `${xpBal.toLocaleString('id-ID')} XP`;
    if (nameEl) nameEl.textContent = `Purchase ${theme.name}:`;
    if (costEl) costEl.textContent = `-${theme.priceXp.toLocaleString('id-ID')} XP`;
    if (remEl) remEl.textContent = `${remaining.toLocaleString('id-ID')} XP`;

    playSound('pop');
    document.getElementById('purchaseConfirmModalBackdrop')?.classList.remove('hidden');
  }

  async function executeConfirmedThemePurchase() {
    if (!pendingPurchaseThemeId || isPurchasingTheme) return;
    const themeId = pendingPurchaseThemeId;
    const theme = THEME_CATALOG.find((item) => item.id === themeId);
    if (!theme || theme.isDefault || !currentUser || !cloudWalletLoaded || navigator.onLine === false) return;
    const user = currentUser;
    const epoch = accountEpoch;
    const confirmBtn = document.getElementById('confirmThemePurchaseBtn');
    isPurchasingTheme = true;
    if (confirmBtn) { confirmBtn.disabled = true; confirmBtn.textContent = 'Memproses…'; }
    try {
      const data = await postEconomyOperation('/api/purchase-theme', { themeId }, user, epoch);
      applyServerEconomy(data);
      pendingPurchaseThemeId = null;
      document.getElementById('purchaseConfirmModalBackdrop')?.classList.add('hidden');
      equipOwnedTheme(themeId);
      triggerConfetti();
      showToast(data.alreadyOwned ? 'Tema ini sudah dimiliki; tidak ada XP yang dipotong.' : theme.name + ' terbuka permanen (−3.000 XP)!', '🛍️');
    } catch (error) {
      if (epoch === accountEpoch) {
        economySyncError = error.message;
        showToast(error.message, '⚠️');
        renderThemeShopAndWallet();
      }
    } finally {
      if (epoch === accountEpoch) {
        isPurchasingTheme = false;
        if (confirmBtn) { confirmBtn.disabled = false; confirmBtn.textContent = '✓ Konfirmasi & Beli'; }
      }
    }
  }

  function renderCalendarView() {
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

    renderWeeklyFlowStrip(selDateObj);

    const monthTitleEl = document.getElementById('calMonthYearTitle');
    if (monthTitleEl) {
      monthTitleEl.textContent = `${MONTHS_ID[currentCalendarMonth]} ${currentCalendarYear}`;
    }

    const gridEl = document.getElementById('calendarDaysGrid');
    if (!gridEl) return;
    gridEl.innerHTML = '';

    const firstDayOfMonth = new Date(currentCalendarYear, currentCalendarMonth, 1);
    const startWeekday = (firstDayOfMonth.getDay() + 6) % 7;
    const daysInMonth = new Date(currentCalendarYear, currentCalendarMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentCalendarYear, currentCalendarMonth, 0).getDate();
    const todayStr = getOffsetDateStr(0);

    for (let i = startWeekday - 1; i >= 0; i--) {
      const dNum = daysInPrevMonth - i;
      const cell = document.createElement('div');
      cell.className = 'cal-day-cell other-month';
      cell.innerHTML = `<span class="cal-day-num">${dNum}</span>`;
      gridEl.appendChild(cell);
    }

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

    const agendaHeading = document.getElementById('agendaDateHeading');
    const agendaList = document.getElementById('selectedDateAgendaList');
    if (agendaHeading) {
      agendaHeading.textContent = `Agenda & Catatan • ${formatDateDisplay(selectedCalendarDate)}`;
    }
    if (!agendaList) return;

    agendaList.innerHTML = '';
    if (tasksOnDate.length === 0 && notesOnDate.length === 0) {
      agendaList.innerHTML = `
        <div class="sage-pill-row">
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

  function renderWeeklyFlowStrip(centerDateObj) {
    const stripEl = document.getElementById('weekPillsStrip');
    const chartBox = document.getElementById('pinkWaveChartBox');
    if (!stripEl || !chartBox) return;

    const dayOfWeek = (centerDateObj.getDay() + 6) % 7;
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
      const score = Math.min(100, countTasks * 25 + countNotes * 20);
      weekScores.push(score);

      const pill = document.createElement('button');
      pill.className = 'week-day-pill';
      if (dStr === selectedCalendarDate) {
        pill.classList.add('active-magenta');
      } else if (countTasks > 0 || countNotes > 0) {
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
    const activeScore = weekScores[activeIdx] || 0;

    const width = 360;
    const height = 195;
    const colWidth = width / 7;
    const points = weekScores.map((s, idx) => ({
      x: Math.round(colWidth * idx + colWidth / 2),
      y: Math.round(142 - (Math.max(12, s) / 100) * 90)
    }));

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

        ${points.map((pt, i) => `
          <line x1="${pt.x}" y1="22" x2="${pt.x}" y2="152" stroke="rgba(20,20,22,0.18)" stroke-width="1" />
          <text x="${pt.x}" y="170" text-anchor="middle" font-size="10" font-weight="700" fill="currentColor">
            ${['09:00', '11:00', '13:00', '15:00', '17:00', '19:00', '21:00'][i]}
          </text>
        `).join('')}

        <rect x="${hatchedX}" y="38" width="32" height="114" rx="4" fill="url(#diagonalHatch)" opacity="0.85" />
        <path d="${pathD}" fill="none" stroke="rgba(255,255,255,0.75)" stroke-width="2.5" stroke-dasharray="3 4" transform="translate(0, 12)" />
        <path d="${pathD}" fill="none" stroke="#C53B96" stroke-width="2.5" />

        <text x="${activePt.x}" y="${Math.max(24, activePt.y - 16)}" text-anchor="middle" font-size="22" font-weight="800" fill="currentColor">
          ${activeScore}%
        </text>
        <circle cx="${activePt.x}" cy="${activePt.y}" r="5.5" fill="#141416" stroke="#FFFFFF" stroke-width="2" />
        <text x="${activePt.x}" y="190" text-anchor="middle" font-size="14" font-weight="700" fill="#FFFFFF">
          Aktivitas Hari Ini
        </text>
      </svg>
    `;
  }

  // ==========================================================================
  // RENDERING ENGINE: VIEW 4 — CATATAN KULIAH STUDIO
  // ==========================================================================
  function renderNotesStudio() {
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

    filteredNotes.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return (b.updatedAt || '').localeCompare(a.updatedAt || '');
    });

    const listEl = document.getElementById('notesCardsList');
    if (listEl) {
      listEl.innerHTML = '';
      if (filteredNotes.length === 0) {
        listEl.innerHTML = `
          <div style="text-align:center; padding: 24px 12px; color: var(--text-secondary); font-size: 0.82rem;">
            Belum ada catatan tersimpan.<br/>Klik <strong>"+ Catatan Baru"</strong> di atas.
          </div>
        `;
      } else {
        filteredNotes.forEach((note) => {
          const card = document.createElement('div');
          card.className = `note-list-card ${note.id === activeNoteId ? 'active-note' : ''}`;
          card.setAttribute('data-color', note.color || 'cream');
          const snippet = stripHtml(note.content || '').slice(0, 95) || 'Catatan masih kosong...';
          card.innerHTML = `
            <div class="note-card-meta-top">
              <span>${escapeHtml(note.course || 'Umum')}</span>
              <span>${note.pinned ? '📌 ' : ''}${formatDateDisplay(note.date)}</span>
            </div>
            <div class="note-card-title">${escapeHtml(note.title || 'Tanpa Judul')}</div>
            <div class="note-card-snippet">${escapeHtml(snippet)}</div>
          `;
          card.addEventListener('click', () => {
            flushAllPendingCloudWrites();
            activeNoteId = note.id;
            playSound('pop');
            renderNotesStudio();
          });
          listEl.appendChild(card);
        });
      }
    }

    const emptyBox = document.getElementById('noteEmptyStateBox');
    const editorWrap = document.getElementById('noteActiveEditorWrap');

    let activeNote = appData.notes.find((n) => n.id === activeNoteId);
    if (!activeNote && appData.notes.length > 0) {
      activeNote = appData.notes[0];
      activeNoteId = activeNote.id;
    }

    if (!activeNote) {
      emptyBox?.classList.remove('hidden');
      editorWrap?.classList.add('hidden');
      return;
    }

    emptyBox?.classList.add('hidden');
    editorWrap?.classList.remove('hidden');

    const courseSel = document.getElementById('activeNoteCourseSelect');
    if (courseSel && document.activeElement !== courseSel) {
      courseSel.value = activeNote.course || '';
    }

    const dateInput = document.getElementById('activeNoteDateInput');
    if (dateInput && document.activeElement !== dateInput) {
      dateInput.value = activeNote.date || getOffsetDateStr(0);
    }

    const tagInput = document.getElementById('activeNoteTagInput');
    if (tagInput && document.activeElement !== tagInput) {
      tagInput.value = activeNote.tag || '';
    }

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
    const defaultCourse = currentNoteCourseFilter !== 'all'
      ? currentNoteCourseFilter
      : (appData.courses[0] || '');

    const nowIso = new Date().toISOString();
    const newNote = {
      id: 'note-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      title: '',
      course: defaultCourse,
      date: prefillDate || getOffsetDateStr(0),
      tag: '',
      color: 'cream',
      pinned: false,
      createdAt: nowIso,
      updatedAt: nowIso,
      updatedAtMs: Date.now(),
      content: ''
    };
    appData.notes.unshift(newNote);
    activeNoteId = newNote.id;
    playSound('pop');
    scheduleNoteSaveToFirestore(newNote, true);
    switchView('view-notes');
    renderAll();
    const titleInput = document.getElementById('activeNoteTitleInput');
    if (titleInput) {
      titleInput.focus();
    }
    showToast('Lembar catatan baru siap ditulis ✨', '📝');
  }

  // ==========================================================================
  // TASK MODAL LOGIC (CREATE & EDIT TASK)
  // ==========================================================================
  function openTaskModal(taskId = null, prefillDate = null) {
    const modal = document.getElementById('taskModalBackdrop');
    const titleEl = document.getElementById('taskModalTitle');
    const courseInput = document.getElementById('taskCourseInput');
    if (!modal || !courseInput) return;

    renderCoursesDatalist();

    const existing = taskId ? appData.tasks.find((t) => t.id === taskId) : null;
    document.getElementById('taskFormId').value = existing ? existing.id : '';
    document.getElementById('taskTitleInput').value = existing ? existing.title : '';
    courseInput.value = existing ? (existing.course || '') : (appData.courses[0] || '');
    document.getElementById('taskCategoryInput').value = existing ? (existing.category || 'Tugas Individu') : 'Tugas Individu';
    document.getElementById('taskDueDateInput').value = existing ? existing.dueDate : (prefillDate || getOffsetDateStr(0));
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
      totalEl.textContent = String(appData.profile.focusMinutesToday || 0);
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
          appData.profile.focusMinutesToday = (appData.profile.focusMinutesToday || 0) + 25;
          playSound('success');
          triggerConfetti();
          saveWorkspace();
          renderAll();
          updatePomodoroDisplay();
          if (btn) btn.textContent = '▶ Mulai Fokus';
          showToast('Sesi Fokus Pomodoro Selesai! 🔥', '🎉');
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
    applyAppearanceAndTheme();
    renderHeaderAndProfile();
    renderWeeklyProductivityWidget();
    renderDashboard();
    renderTasksView();
    renderCalendarView();
    renderNotesStudio();
    renderThemeShopAndWallet();
    updatePomodoroDisplay();
  }

  function openThemeShopModal(defaultTab = 'themes') {
    const modal = document.getElementById('themeShopModalBackdrop');
    if (!modal) return;
    switchThemeShopTab(defaultTab);
    renderThemeShopAndWallet();
    modal.classList.remove('hidden');
    flushPendingTaskCompletions().then(() => evaluateAndClaimWeeklyRewardIfEligible());
    playSound('pop');
  }

  function switchThemeShopTab(tabName = 'themes') {
    const btnThemes = document.getElementById('shopTabMarketplaceBtn');
    const btnWallet = document.getElementById('shopTabWalletBtn');
    const panelThemes = document.getElementById('shopPanelMarketplace');
    const panelWallet = document.getElementById('shopPanelWallet');

    const isWallet = tabName === 'wallet';
    btnThemes?.classList.toggle('active', !isWallet);
    btnWallet?.classList.toggle('active', isWallet);
    btnThemes?.setAttribute('aria-selected', String(!isWallet));
    btnWallet?.setAttribute('aria-selected', String(isWallet));
    btnThemes?.setAttribute('aria-pressed', String(!isWallet));
    btnWallet?.setAttribute('aria-pressed', String(isWallet));
    panelThemes?.classList.toggle('hidden', isWallet);
    panelWallet?.classList.toggle('hidden', !isWallet);
  }

  // ==========================================================================
  // EVENT LISTENERS BINDING
  // ==========================================================================
  function bindEvents() {
    // Keep keyboard focus inside the topmost dialog, including purchase confirmation.
    const modalOrigins = new WeakMap();
    const visibleModals = () => [...document.querySelectorAll('.modal-backdrop:not(.hidden)')];
    document.querySelectorAll('.modal-backdrop').forEach((modal) => {
      new MutationObserver(() => {
        if (!modal.classList.contains('hidden')) {
          if (!modalOrigins.has(modal)) modalOrigins.set(modal, document.activeElement);
          const preferred = modal.id === 'purchaseConfirmModalBackdrop'
            ? document.querySelector('.secondary-pill-btn[data-close-modal="purchaseConfirmModalBackdrop"]')
            : modal.querySelector('button, input, select, textarea, [tabindex="0"]');
          preferred?.focus();
        } else if (modalOrigins.has(modal)) {
          const origin = modalOrigins.get(modal);
          modalOrigins.delete(modal);
          if (origin?.isConnected && !origin.closest('.hidden')) origin.focus();
        }
      }).observe(modal, { attributes: true, attributeFilter: ['class'] });
    });
    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Tab') return;
      const modal = visibleModals().at(-1);
      if (!modal) return;
      const focusable = [...modal.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex="0"]')]
        .filter((element) => element.getClientRects().length > 0);
      const first = focusable[0], last = focusable.at(-1);
      if (!first) return;
      if (event.shiftKey && (document.activeElement === first || !modal.contains(document.activeElement))) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !modal.contains(document.activeElement))) {
        event.preventDefault(); first.focus();
      }
    });
    // 1. DARK MODE / LIGHT MODE / SYSTEM APPEARANCE CONTROLS
    const setColorModePreference = (mode) => {
      if (!['light', 'dark', 'system'].includes(mode)) return;
      appData.profile.colorMode = mode;
      applyAppearanceAndTheme();
      playSound('pop');
      saveWorkspace();
      const label =
        mode === 'dark' ? 'Dark Mode 🌙' : mode === 'light' ? 'Light Mode ☀️' : 'System Default 🖥️';
      showToast(`Tampilan diubah ke ${label}`, '🎨');
    };

    document.querySelectorAll('[data-color-mode-btn]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const mode = btn.getAttribute('data-color-mode-btn') || 'system';
        setColorModePreference(mode);
      });
    });

    // 2. THEME SHOP, XP WALLET & DECORATIVE ANIMATIONS TOGGLE
    document.getElementById('openThemeShopBtn')?.addEventListener('click', () => openThemeShopModal('themes'));
    document.getElementById('openThemeShopQuickBtn')?.addEventListener('click', () => openThemeShopModal('themes'));
    document.getElementById('popoverOpenThemeShopBtn')?.addEventListener('click', () => {
      document.getElementById('accountMenuPopover')?.classList.add('hidden');
      openThemeShopModal('themes');
    });
    document.getElementById('openXpWalletGaugeBtn')?.addEventListener('click', () => openThemeShopModal('wallet'));
    ['claimWeeklyRewardBtn', 'walletClaimWeeklyBtn'].forEach((id) => {
      document.getElementById(id)?.addEventListener('click', async () => {
        await flushPendingTaskCompletions();
        await evaluateAndClaimWeeklyRewardIfEligible();
      });
    });
    document.getElementById('widgetOpenThemeShopBtn')?.addEventListener('click', () => openThemeShopModal('themes'));
    document.getElementById('themeStageOpenShopBtn')?.addEventListener('click', () => openThemeShopModal('themes'));

    document.getElementById('shopTabMarketplaceBtn')?.addEventListener('click', () => {
      playSound('pop');
      switchThemeShopTab('themes');
    });
    document.getElementById('shopTabWalletBtn')?.addEventListener('click', () => {
      playSound('pop');
      switchThemeShopTab('wallet');
    });

    document.getElementById('toggleThemeAnimationsInput')?.addEventListener('change', (e) => {
      appData.profile.animationsEnabled = Boolean(e.target.checked);
      applyAppearanceAndTheme();
      saveWorkspace();
      showToast(
        appData.profile.animationsEnabled
          ? 'Animasi dekoratif tema diaktifkan ✨'
          : 'Animasi dekoratif tema dinonaktifkan ⏸️'
      );
    });

    document.querySelector('.secondary-pill-btn[data-close-modal="purchaseConfirmModalBackdrop"]')?.addEventListener('click', () => {
      pendingPurchaseThemeId = null;
      document.getElementById('purchaseConfirmModalBackdrop')?.classList.add('hidden');
    });

    document.getElementById('confirmThemePurchaseBtn')?.addEventListener('click', executeConfirmedThemePurchase);

    document.getElementById('closeCelebrationBannerBtn')?.addEventListener('click', () => {
      document.getElementById('weeklyGoalCelebrationBanner')?.classList.add('hidden');
    });

    // 3. GOOGLE AUTHENTICATION BUTTONS & ACCOUNT MENU POPOVER
    document.getElementById('topGoogleSignInBtn')?.addEventListener('click', () => triggerGoogleSignIn(true));
    document.getElementById('modalGoogleSignInBtn')?.addEventListener('click', () => triggerGoogleSignIn(true));
    document.getElementById('syncModalGoogleSignInBtn')?.addEventListener('click', () => triggerGoogleSignIn(true));
    document.getElementById('onboardingGoogleSignInBtn')?.addEventListener('click', () => triggerGoogleSignIn(true));
    document.getElementById('syncModalSwitchAccountBtn')?.addEventListener('click', () => triggerGoogleSignIn(true));
    document.getElementById('popoverSwitchAccountBtn')?.addEventListener('click', () => {
      document.getElementById('accountMenuPopover')?.classList.add('hidden');
      triggerGoogleSignIn(true);
    });

    document.getElementById('modalGoogleSignOutBtn')?.addEventListener('click', triggerGoogleSignOut);
    document.getElementById('syncModalSignOutBtn')?.addEventListener('click', triggerGoogleSignOut);
    document.getElementById('googleSignOutBtn')?.addEventListener('click', triggerGoogleSignOut);
    document.getElementById('popoverSignOutBtn')?.addEventListener('click', triggerGoogleSignOut);

    const accountMenuBtn = document.getElementById('topAccountMenuBtn');
    const accountPopover = document.getElementById('accountMenuPopover');
    if (accountMenuBtn && accountPopover) {
      accountMenuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        playSound('pop');
        accountPopover.classList.toggle('hidden');
      });
      document.addEventListener('click', (e) => {
        if (!accountPopover.classList.contains('hidden') && !accountPopover.contains(e.target) && e.target !== accountMenuBtn) {
          accountPopover.classList.add('hidden');
        }
      });
    }

    document.getElementById('popoverEditProfileBtn')?.addEventListener('click', () => {
      accountPopover?.classList.add('hidden');
      document.getElementById('editProfileBtn')?.click();
    });

    const openSyncFromPopover = () => {
      accountPopover?.classList.add('hidden');
      document.getElementById('openSyncModalBtn')?.click();
    };
    document.getElementById('popoverOpenSyncModalBtn')?.addEventListener('click', openSyncFromPopover);
    document.getElementById('popoverOpenSyncSettingsBtn')?.addEventListener('click', openSyncFromPopover);

    // Runtime Firebase Config Editor (inside Sync Modal)
    const handleSaveRuntimeFirebaseCfg = async () => {
      const input =
        document.getElementById('firebaseRuntimeConfigInput') ||
        document.getElementById('runtimeFirebaseConfigInput');
      if (!input || !input.value.trim()) return;
      try {
        let raw = input.value.trim();
        if (!raw.startsWith('{') && raw.includes('{')) {
          raw = raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1);
        }
        const normalizedJson = raw
          .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?\s*:/g, '"$2":')
          .replace(/'/g, '"')
          .replace(/,\s*}/g, '}');
        const parsed = JSON.parse(normalizedJson);
        if (!isValidFirebaseConfig(parsed)) {
          showToast('Config kurang lengkap (wajib ada apiKey, authDomain, projectId)', '⚠️');
          return;
        }
        localStorage.setItem(RUNTIME_FIREBASE_CFG_KEY, JSON.stringify(parsed));
        const ok = await initFirebaseSdk();
        if (ok) {
          playSound('success');
          showToast('Firebase berhasil dihubungkan! Silakan klik Continue with Google ☁️', '✅');
        }
      } catch (err) {
        showToast('Format JSON Firebase Config tidak valid', '⚠️');
      }
    };
    document.getElementById('saveFirebaseRuntimeConfigBtn')?.addEventListener('click', handleSaveRuntimeFirebaseCfg);
    document.getElementById('saveRuntimeFirebaseConfigBtn')?.addEventListener('click', handleSaveRuntimeFirebaseCfg);

    const handleClearRuntimeFirebaseCfg = () => {
      localStorage.removeItem(RUNTIME_FIREBASE_CFG_KEY);
      const input =
        document.getElementById('firebaseRuntimeConfigInput') ||
        document.getElementById('runtimeFirebaseConfigInput');
      if (input) input.value = '';
      showToast('Konfigurasi runtime Firebase dihapus', '🗑️');
    };
    document.getElementById('clearFirebaseRuntimeConfigBtn')?.addEventListener('click', handleClearRuntimeFirebaseCfg);
    document.getElementById('clearRuntimeFirebaseConfigBtn')?.addEventListener('click', handleClearRuntimeFirebaseCfg);

    // Pre-Migration Local Backup Recovery Button
    document.getElementById('restorePreMigrationBackupBtn')?.addEventListener('click', async () => {
      const rawBackup = localStorage.getItem(PRE_CLOUD_BACKUP_KEY);
      if (!rawBackup) {
        showToast('Tidak ada cadangan pra-migrasi ditemukan', 'ℹ️');
        return;
      }
      try {
        const backupObj = JSON.parse(rawBackup);
        if (backupObj && Array.isArray(backupObj.tasks) && Array.isArray(backupObj.notes)) {
          const merged = mergeLocalAndCloudData(backupObj, appData);
          appData = merged;
          if (currentUser && firestoreDb) {
            await uploadWorkspaceToFirestoreBatch(currentUser.uid, merged);
          } else {
            saveWorkspace();
          }
          renderAll();
          showToast('Cadangan lokal pra-login berhasil dipulihkan & digabungkan! 🎉', '🔄');
        }
      } catch (e) {
        showToast('Gagal memulihkan cadangan', '⚠️');
      }
    });

    // ONBOARDING EVENTS (Gender Tabs, Photo Upload, Submit)
    document.querySelectorAll('.avatar-gender-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.avatar-gender-tab').forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        currentAvatarGenderFilter = tab.getAttribute('data-gender-tab') || 'all';
        playSound('pop');
        renderOnboardingPresetGrid();
      });
    });

    const handleOnboardingPhotoUpload = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const dataUrl = await processUploadedAvatarFile(file);
        selectedOnboardingAvatar = dataUrl;
        const previewImg = document.getElementById('onboardingAvatarPreview');
        if (previewImg) previewImg.src = dataUrl;
        renderOnboardingPresetGrid();
        playSound('pop');
        showToast('Foto profil berhasil dipilih 📸');
      } catch (err) {
        showToast('Gagal memuat foto, pilih gambar lain', '⚠️');
      }
    };

    document.getElementById('onboardingPhotoInput')?.addEventListener('change', handleOnboardingPhotoUpload);
    document.getElementById('onboardingPhotoInputBtn')?.addEventListener('change', handleOnboardingPhotoUpload);

    document.getElementById('onboardingForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('onboardingNameInput').value.trim();
      const major = document.getElementById('onboardingMajorInput').value.trim();
      const campus = document.getElementById('onboardingCampusInput').value.trim();

      if (!name || !major || !campus) {
        showToast('Mohon lengkapi Nama, Jurusan, dan Nama Kampus ✨', '⚠️');
        return;
      }

      appData.profile.onboarded = true;
      appData.profile.name = name;
      appData.profile.major = major;
      appData.profile.campus = campus;
      appData.profile.avatarUrl = selectedOnboardingAvatar || PRESET_AVATARS[0].url;

      if (currentSpaceId === 'ruang-kuliah') {
        const cleanSlug = `${name}-${campus}`
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')
          .slice(0, 36);
        if (cleanSlug) currentSpaceId = cleanSlug;
      }

      document.getElementById('onboardingOverlay')?.classList.add('hidden');
      playSound('success');
      triggerConfetti();
      saveWorkspace();
      renderAll();
      showToast(`Selamat datang, ${name}! Ruang nugasmu siap digunakan 🎉`, '✨');
    });

    // View Navigation
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

    // Peeking Stacked Folder Tabs
    document.querySelectorAll('.peeking-layer').forEach((layer) => {
      layer.addEventListener('click', () => {
        currentStackFilter = layer.getAttribute('data-stack-filter');
        playSound('pop');
        renderSageStackedCard();
      });
    });

    document.getElementById('cycleStackTabBtn')?.addEventListener('click', () => {
      const order = ['priority', 'upcoming', 'pinned-notes'];
      const nextIdx = (order.indexOf(currentStackFilter) + 1) % order.length;
      currentStackFilter = order[nextIdx];
      playSound('pop');
      renderSageStackedCard();
    });

    // Theme Vibe Selector
    document.querySelectorAll('#vibeSelector .seg-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#vibeSelector .seg-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const vibe = btn.getAttribute('data-vibe') || 'default';
        document.body.setAttribute('data-theme-vibe', vibe);
        appData.profile.themeVibe = vibe;
        playSound('pop');
        saveWorkspace();
      });
    });

    // Phone Frame Preview Mode Toggle
    document.getElementById('toggleFrameModeBtn')?.addEventListener('click', () => {
      document.body.classList.toggle('phone-frame-mode');
      playSound('pop');
      const isPhone = document.body.classList.contains('phone-frame-mode');
      showToast(isPhone ? 'Mode Preview Frame HP Aktif 📱' : 'Mode Workspace Layar Penuh Aktif 💻', '✨');
    });

    // Sound Toggle
    document.getElementById('toggleSoundBtn')?.addEventListener('click', () => {
      soundEnabled = !soundEnabled;
      document.getElementById('soundIcon').textContent = soundEnabled ? '🔊' : '🔇';
      showToast(soundEnabled ? 'Efek suara diaktifkan 🔊' : 'Efek suara dibisukan 🔇');
    });

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

    // Hero & Quick Action Buttons
    document.getElementById('openNewTaskModalHeroBtn')?.addEventListener('click', () => openTaskModal());
    document.getElementById('openNewTaskModalStickerBtn')?.addEventListener('click', () => openTaskModal());
    document.getElementById('addTaskMainBtn')?.addEventListener('click', () => openTaskModal());
    document.getElementById('blushQuickAddTaskBtn')?.addEventListener('click', () => openTaskModal());
    document.getElementById('blushQuickAddNoteBtn')?.addEventListener('click', () => createNewNote());
    document.getElementById('quickAddNoteHeroBtn')?.addEventListener('click', () => createNewNote());
    document.getElementById('openQuickNotesBtn')?.addEventListener('click', () => switchView('view-notes'));
    document.getElementById('createNewNoteBtn')?.addEventListener('click', () => createNewNote());
    document.getElementById('createFirstNoteEmptyBtn')?.addEventListener('click', () => createNewNote());

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

      const courseName = ensureCourseRegistered(document.getElementById('taskCourseInput').value);
      const nowIso = new Date().toISOString();
      const nowMs = Date.now();

      const payload = {
        id: id || ('task-' + (window.crypto?.randomUUID?.() || nowMs + '-' + Math.random().toString(36).slice(2))),
        title,
        course: courseName,
        category: document.getElementById('taskCategoryInput').value,
        dueDate: document.getElementById('taskDueDateInput').value,
        dueTime: document.getElementById('taskDueTimeInput').value || '23:59',
        priority: document.getElementById('taskPriorityInput').value,
        description: document.getElementById('taskDescInput').value.trim(),
        link: document.getElementById('taskLinkInput').value.trim(),
        subtasks: tempSubtasks,
        status: 'pending',
        completedAtMs: null,
        createdAt: nowIso,
        updatedAt: nowIso,
        updatedAtMs: nowMs
      };

      if (id) {
        const idx = appData.tasks.findIndex((t) => t.id === id);
        if (idx !== -1) {
          const prev = appData.tasks[idx];
          payload.status = prev.status;
          payload.completedAtMs = prev.completedAtMs || null;
          payload.createdAt = prev.createdAt || nowIso;
          if (prev.xpRewarded !== undefined) payload.xpRewarded = prev.xpRewarded;
          if (prev.rewardedWeekKey !== undefined) payload.rewardedWeekKey = prev.rewardedWeekKey;
          if (prev.rewardClaimedAtMs !== undefined) payload.rewardClaimedAtMs = prev.rewardClaimedAtMs;
          appData.tasks[idx] = payload;
        }
        showToast('Tugas berhasil diperbarui ✨');
      } else {
        appData.tasks.unshift(payload);
        showToast('Tugas baru ditambahkan ke kalender & papan! 🚀');
      }

      playSound('success');
      document.getElementById('taskModalBackdrop')?.classList.add('hidden');
      saveTaskToFirestore(payload);
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

    // Notes Editor Auto-Save & Formatting (Debounced Granular Firestore Write)
    const saveActiveNoteChanges = (immediate = false) => {
      const note = appData.notes.find((n) => n.id === activeNoteId);
      if (!note) return;
      note.title = document.getElementById('activeNoteTitleInput').value;
      const rawCourse = document.getElementById('activeNoteCourseSelect').value.trim();
      note.course = rawCourse ? ensureCourseRegistered(rawCourse) : '';
      note.date = document.getElementById('activeNoteDateInput').value;
      note.tag = document.getElementById('activeNoteTagInput').value;
      note.content = document.getElementById('activeNoteBodyEditor').innerHTML;

      updateNoteWordCount();
      scheduleNoteSaveToFirestore(note, immediate);

      const activeCardTitle = document.querySelector(`.note-list-card.active-note .note-card-title`);
      const activeCardSnippet = document.querySelector(`.note-list-card.active-note .note-card-snippet`);
      if (activeCardTitle) activeCardTitle.textContent = note.title || 'Tanpa Judul';
      if (activeCardSnippet) activeCardSnippet.textContent = stripHtml(note.content).slice(0, 95) || 'Catatan masih kosong...';
    };

    ['activeNoteTitleInput', 'activeNoteTagInput', 'activeNoteBodyEditor', 'activeNoteCourseSelect'].forEach((id) => {
      document.getElementById(id)?.addEventListener('input', () => saveActiveNoteChanges(false));
    });
    ['activeNoteCourseSelect', 'activeNoteDateInput'].forEach((id) => {
      document.getElementById(id)?.addEventListener('change', () => {
        saveActiveNoteChanges(true);
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
        scheduleNoteSaveToFirestore(note, true);
        renderNotesStudio();
      });
    });

    // Pin / Delete / Share Note
    document.getElementById('togglePinNoteBtn')?.addEventListener('click', () => {
      const note = appData.notes.find((n) => n.id === activeNoteId);
      if (!note) return;
      note.pinned = !note.pinned;
      playSound('pop');
      scheduleNoteSaveToFirestore(note, true);
      renderNotesStudio();
      showToast(note.pinned ? 'Catatan disematkan di atas 📌' : 'Sematan catatan dilepas');
    });

    document.getElementById('deleteActiveNoteBtn')?.addEventListener('click', () => {
      const deletingId = activeNoteId;
      if (!deletingId) return;
      appData.notes = appData.notes.filter((n) => n.id !== deletingId);
      activeNoteId = appData.notes[0]?.id || null;
      playSound('pop');
      deleteNoteFromFirestore(deletingId);
      renderAll();
      showToast('Catatan dihapus', '🗑️');
    });

    document.getElementById('shareSingleNoteLinkBtn')?.addEventListener('click', copyShareableLinkToClipboard);

    // Rich Formatting Toolbar
    document.querySelectorAll('.editor-formatting-toolbar [data-cmd]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const cmd = btn.getAttribute('data-cmd');
        document.getElementById('activeNoteBodyEditor')?.focus();
        document.execCommand(cmd, false, null);
        saveActiveNoteChanges(false);
      });
    });

    document.querySelectorAll('.editor-formatting-toolbar [data-highlight]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const color = btn.getAttribute('data-highlight');
        document.getElementById('activeNoteBodyEditor')?.focus();
        document.execCommand('hiliteColor', false, color);
        saveActiveNoteChanges(false);
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
          document.execCommand('insertHTML', false, `<div>☑️ <b>Item langkah...</b></div>`);
        } else if (type === 'callout') {
          document.execCommand('insertHTML', false, `<div class="note-callout-box">💡 <b>Poin Penting:</b> </div><p><br></p>`);
        } else if (type === 'code') {
          document.execCommand('insertHTML', false, `<pre class="note-code-block">// Kode program\n</pre><p><br></p>`);
        }
        saveActiveNoteChanges(false);
      });
    });

    document.getElementById('notesSearchInput')?.addEventListener('input', (e) => {
      currentNoteSearchQuery = e.target.value;
      renderNotesStudio();
    });

    // Cloud Sync & Link Modal
    const openSyncModal = () => {
      const modal = document.getElementById('syncModalBackdrop');
      const linkInput = document.getElementById('shareableFullLinkInput');
      const codeInput = document.getElementById('workspaceCodeInput');
      const runtimeCfgInput =
        document.getElementById('firebaseRuntimeConfigInput') ||
        document.getElementById('runtimeFirebaseConfigInput');
      if (linkInput) linkInput.value = getShareablePermanentLink();
      if (codeInput) codeInput.value = currentSpaceId;
      if (runtimeCfgInput) {
        runtimeCfgInput.value = localStorage.getItem(RUNTIME_FIREBASE_CFG_KEY) || '';
      }
      updateAuthUI();
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

    // Optional JSON Export & Import Backup Feature
    document.getElementById('exportJsonBtn')?.addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(appData, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      const suffix = currentUser ? (currentUser.email || 'cloud').split('@')[0] : currentSpaceId;
      a.download = `nugasin-backup-${suffix}-${getOffsetDateStr(0)}.json`;
      a.click();
      showToast('File cadangan (.json) berhasil diunduh ⬇️');
    });

    document.getElementById('importJsonInput')?.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const imported = JSON.parse(String(reader.result));
          if (imported && Array.isArray(imported.tasks) && Array.isArray(imported.notes)) {
            const merged = mergeLocalAndCloudData(imported, appData);
            appData = merged;
            if (currentUser && firestoreDb) {
              await uploadWorkspaceToFirestoreBatch(currentUser.uid, appData);
            } else {
              saveWorkspace();
            }
            renderAll();
            document.getElementById('syncModalBackdrop')?.classList.add('hidden');
            showToast('Data berhasil dipulihkan & disinkronkan dari file JSON! 🎉');
          }
        } catch (err) {
          showToast('Format file JSON tidak valid', '⚠️');
        }
      };
      reader.readAsText(file);
    });

    // Clear all non-rewarded notes & tasks button
    document.getElementById('resetDemoDataBtn')?.addEventListener('click', async () => {
      const oldTasks = [...appData.tasks];
      const oldNotes = [...appData.notes];
      // Preserve tasks that were already locked for weekly XP rewards in Firestore
      appData.tasks = oldTasks.filter((t) => t.xpRewarded === true);
      appData.notes = [];
      appData.courses = [];
      appData.profile.focusMinutesToday = 0;
      activeNoteId = null;

      if (currentUser && firestoreDb) {
        for (const t of oldTasks) {
          if (t.xpRewarded !== true) {
            await deleteTaskFromFirestore(t.id);
          }
        }
        for (const n of oldNotes) {
          await deleteNoteFromFirestore(n.id);
        }
        scheduleFirestorePreferencesSave();
      } else {
        saveWorkspace();
      }
      renderAll();
      document.getElementById('syncModalBackdrop')?.classList.add('hidden');
      showToast('Semua catatan dan tugas aktif telah dikosongkan 🗑️');
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
      document.getElementById('profileNameInput').value = appData.profile.name || currentUser?.displayName || '';
      document.getElementById('profileMajorInput').value = appData.profile.major || '';
      document.getElementById('profileCampusInput').value = appData.profile.campus || '';
      selectedProfileModalAvatar = appData.profile.avatarUrl || currentUser?.photoURL || PRESET_AVATARS[0].url;
      const prevEl = document.getElementById('profileModalAvatarPreview');
      if (prevEl) prevEl.src = selectedProfileModalAvatar;
      renderProfileModalPresetGrid();
      renderCoursesManagerList();
      document.getElementById('profileModalBackdrop')?.classList.remove('hidden');
      playSound('pop');
    };

    document.getElementById('editProfileBtn')?.addEventListener('click', openProfileModal);
    document.getElementById('quickManageCoursesBtn')?.addEventListener('click', openProfileModal);

    document.getElementById('profileModalPhotoInput')?.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const dataUrl = await processUploadedAvatarFile(file);
        selectedProfileModalAvatar = dataUrl;
        const prevEl = document.getElementById('profileModalAvatarPreview');
        if (prevEl) prevEl.src = dataUrl;
        renderProfileModalPresetGrid();
        playSound('pop');
        showToast('Foto profil baru dipilih 📸');
      } catch (err) {
        showToast('Gagal memuat foto', '⚠️');
      }
    });

    function renderCoursesManagerList() {
      const list = document.getElementById('coursesManageList');
      if (!list) return;
      if (appData.courses.length === 0) {
        list.innerHTML = `<div style="font-size:0.78rem; color:var(--text-muted); padding: 4px 0;">Belum ada mata kuliah ditambahkan.</div>`;
        return;
      }
      list.innerHTML = appData.courses.map((c, idx) => `
        <div class="subtask-builder-item">
          <span>📚 ${escapeHtml(c)}</span>
          <button type="button" data-del-course="${idx}" style="color:#EF4444;font-weight:800;">✕</button>
        </div>
      `).join('');

      list.querySelectorAll('[data-del-course]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const idx = Number(btn.getAttribute('data-del-course'));
          appData.courses.splice(idx, 1);
          renderCoursesManagerList();
        });
      });
    }

    document.getElementById('addNewCourseBtn')?.addEventListener('click', () => {
      const inp = document.getElementById('newCourseNameInput');
      if (!inp || !inp.value.trim()) return;
      ensureCourseRegistered(inp.value.trim());
      inp.value = '';
      renderCoursesManagerList();
    });

    document.getElementById('saveProfileBtn')?.addEventListener('click', () => {
      const name = document.getElementById('profileNameInput').value.trim();
      const major = document.getElementById('profileMajorInput').value.trim();
      const campus = document.getElementById('profileCampusInput').value.trim();

      if (!name || !major || !campus) {
        showToast('Nama, Jurusan, dan Kampus wajib diisi!', '⚠️');
        return;
      }

      appData.profile.onboarded = true;
      appData.profile.name = name;
      appData.profile.major = major;
      appData.profile.campus = campus;
      appData.profile.avatarUrl = selectedProfileModalAvatar || PRESET_AVATARS[0].url;

      document.getElementById('profileModalBackdrop')?.classList.add('hidden');
      saveWorkspace();
      renderAll();
      showToast('Profil, Foto & Mata Kuliah berhasil disimpan! 🎓');
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
      if (e.key === 'Escape' && !isMigrationModalOpen) {
        document.querySelectorAll('.modal-backdrop').forEach((m) => {
          if (m.id !== 'migrationModalBackdrop') m.classList.add('hidden');
        });
        document.getElementById('fabQuickMenu')?.classList.add('hidden');
        document.getElementById('dockFabButton')?.classList.remove('active');
        document.getElementById('accountMenuPopover')?.classList.add('hidden');
      }
    });

    document.getElementById('globalSearchInput')?.addEventListener('input', (e) => {
      renderGlobalSearchResults(e.target.value);
    });

    document.querySelectorAll('[data-close-modal]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-close-modal');
        document.getElementById(target)?.classList.add('hidden');
      });
    });

    document.querySelectorAll('.modal-backdrop').forEach((backdrop) => {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop && backdrop.id !== 'migrationModalBackdrop') {
          backdrop.classList.add('hidden');
        }
      });
    });
  }

  function renderGlobalSearchResults(query) {
    const container = document.getElementById('globalSearchResults');
    if (!container) return;
    const q = (query || '').toLowerCase().trim();

    const matchedTasks = appData.tasks.filter((t) =>
      !q || (t.title || '').toLowerCase().includes(q) || (t.course || '').toLowerCase().includes(q)
    ).slice(0, 5);

    const matchedNotes = appData.notes.filter((n) =>
      !q || (n.title || '').toLowerCase().includes(q) || (n.course || '').toLowerCase().includes(q) || stripHtml(n.content).toLowerCase().includes(q)
    ).slice(0, 5);

    container.innerHTML = '';

    if (matchedTasks.length === 0 && matchedNotes.length === 0) {
      container.innerHTML = `<div style="text-align:center; padding:18px; color:var(--text-secondary); font-size:0.84rem;">Belum ada tugas atau catatan yang cocok.</div>`;
      return;
    }

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
            <span class="sage-row-title">${escapeHtml(n.title || 'Catatan Tanpa Judul')}</span>
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

  document.addEventListener('DOMContentLoaded', () => {
    bindEvents();
    initWorkspaceLoad();
    // A tab left open across Monday must reset without requiring a reload.
    setInterval(() => {
      subscribeToCurrentWeek();
      renderWeeklyProductivityWidget();
      if (pendingCompletions.size) flushPendingTaskCompletions();
    }, 30000);
    window.addEventListener('focus', () => {
      subscribeToCurrentWeek();
      renderWeeklyProductivityWidget();
      flushPendingTaskCompletions();
    });
  });
})();
