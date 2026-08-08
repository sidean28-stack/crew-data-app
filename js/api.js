const DEFAULT_GAS_URL = "const DEFAULT_GAS_URL = "https://script.google.com/macros/s/AKfycbyt7FqVkzxmGZDed8g6dWNxEXq3slQIsaou5xL72jDTUZmhodoB56zFSYerFRLHbMlB/exec
";
const LEGACY_GAS_DEPLOYMENT_IDS = [
  'AKfycbyt7FqVkzxmGZDed8g6dWNxEXq3slQIsaou5xL72jDTUZmhodoB56zFSYerFRLHbMlB'
];

function getGasUrl() {
  return DEFAULT_GAS_URL;
}

window.api = {
  fetchWithTimeout: async function (url, options, timeoutMs) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs || 15000);

    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Koneksi cloud melewati batas waktu. Periksa koneksi lalu coba lagi.');
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  },

  getAllCrew: async function () {
    const separator = getGasUrl().includes('?') ? '&' : '?';
    let lastError;
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const url = `${getGasUrl()}${separator}action=getAllCrew&_t=${Date.now()}&attempt=${attempt}`;
        return await this.fetchWithTimeout(url, { method: 'GET', cache: 'no-store' }, 20000);
      } catch (error) {
        lastError = error;
        if (attempt < 2) await new Promise(resolve => setTimeout(resolve, 900));
      }
    }
    throw lastError;
  },

  postData: async function (payload, timeoutMs) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs || 120000);

    try {
      const response = await fetch(getGasUrl(), {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      if (!result || result.success !== true) {
        throw new Error(result?.message || result?.error || 'Backend menolak penyimpanan data.');
      }
      return result;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Pengiriman ke cloud melewati batas waktu. Periksa koneksi lalu coba lagi.');
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  },

  submitCrew: function (data) {
    return this.postData({ ...data, action: 'submit_crew' });
  },

  updateCrew: function (data) {
    return this.postData({ ...data, action: 'update_crew' });
  },

  updateCrewStatus: function (data) {
    return this.postData({ ...data, action: 'update_crew_status' });
  },

  deleteCrew: function (data) {
    return this.postData({ ...data, action: 'delete_crew' });
  },

  booking: function (data) {
    return this.postData({ ...data, action: 'booking_request' });
  },

  review: function (data) {
    return this.postData({ ...data, action: 'submit_review' });
  },

  saveLocalDatabase: function () {
    localStorage.setItem('crew_app_database', JSON.stringify(window.crewDatabase || []));
  },

  loadLocalDatabase: function () {
    const saved = localStorage.getItem('crew_app_database');
    if (!saved) {
      window.crewDatabase = [];
      return;
    }

    try {
      const parsed = JSON.parse(saved);
      window.crewDatabase = Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('Local crew cache is invalid:', error);
      window.crewDatabase = [];
    }
  },

  loadCloudDatabase: async function () {
    try {
      const response = await this.getAllCrew();
      if (!response || response.success !== true || !Array.isArray(response.crew)) {
        throw new Error(response && response.error ? response.error : 'Respons cloud tidak valid.');
      }

      const mergedCrew = new Map();
      response.crew.forEach((crew, index) => {
        const key = String(
          crew.submissionId || crew.passportNo || crew.cdcNo || `${crew.fullName || 'crew'}-${index}`
        ).trim().toLowerCase();

        if (!mergedCrew.has(key)) {
          mergedCrew.set(key, crew);
          return;
        }

        const current = mergedCrew.get(key);
        const currentHasProfile = Boolean(String(current.fullName || '').trim());
        const incomingHasProfile = Boolean(String(crew.fullName || '').trim());
        const profile = !currentHasProfile && incomingHasProfile
          ? { ...current, ...crew }
          : { ...current };

        // Legacy status writes can leave a second, status-only row for the
        // same ID. Preserve the complete profile and apply its latest status.
        const statusFields = [
          'operationalStatus', 'vesselCandidate', 'vesselAssigned',
          'flightDate', 'finishDate', 'historyStatus', 'adminNotes', 'status'
        ];
        statusFields.forEach(field => {
          const value = crew[field];
          if (value !== undefined && value !== null && String(value).trim() !== '') {
            profile[field] = value;
          }
        });
        mergedCrew.set(key, profile);
      });
      const properCaseFields = [
        'fullName', 'rankPosition', 'combinedAddress', 'fam1Name', 'fam1Relation',
        'fam2Name', 'fam2Relation', 'expLongline', 'vesselName', 'vesselTypeLongline',
        'vesselOrigin', 'placementCountry', 'skillGeneral', 'pob', 'religion',
        'maritalStatus', 'streetAddress', 'village', 'district', 'city', 'province',
        'vesselCandidate', 'vesselAssigned', 'historyStatus'
      ];
      window.crewDatabase = Array.from(mergedCrew.values()).map(crew => {
        const normalized = { ...crew };
        if (typeof properCaseText === 'function') {
          properCaseFields.forEach(field => {
            if (normalized[field]) normalized[field] = properCaseText(normalized[field]);
          });
        }
        if (!normalized.signOnOff && normalized.vesselName) {
          const periods = String(normalized.vesselName).split('|').map((entry, index) => {
            const match = entry.match(/\(([^()]*)\)\s*$/);
            return match ? `${index + 1}. ${match[1].trim()}` : '';
          }).filter(Boolean);
          normalized.signOnOff = periods.join(' | ');
        }
        return normalized;
      });
      this.saveLocalDatabase();

      if (typeof updateCloudBanner === 'function') {
        updateCloudBanner('Connected', response.lastSync || null);
      }
      return true;
    } catch (error) {
      console.warn('Cloud database unavailable:', error);
      // Preserve the last successful snapshot so a temporary Apps Script or
      // network failure does not blank the production UI.
      if (!Array.isArray(window.crewDatabase) || window.crewDatabase.length === 0) {
        this.loadLocalDatabase();
      }
      if (typeof updateCloudBanner === 'function') updateCloudBanner('Offline', null);
      return false;
    }
  },

  syncNow: function () {
    return this.loadCloudDatabase();
  },

  startLiveSync: function () {
    if (this.liveSyncTimer) clearInterval(this.liveSyncTimer);
    const refresh = () => {
      if (document.visibilityState === 'visible') this.loadCloudDatabase().then(() => {
        if (typeof loadDirectoryTable === 'function') loadDirectoryTable();
        if (typeof renderCatalogGrid === 'function') renderCatalogGrid();
      });
    };
    this.liveSyncTimer = setInterval(refresh, 30000);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
  }
};

window.loadLocalDatabase = window.api.loadLocalDatabase.bind(window.api);
window.saveLocalDatabase = window.api.saveLocalDatabase.bind(window.api);
window.loadCloudDatabase = window.api.loadCloudDatabase.bind(window.api);
