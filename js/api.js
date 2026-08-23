const DEFAULT_GAS_URL = "https://script.google.com/macros/s/AKfycbyWFFF3c_zAd3IKkwN9n5QoGLPybISJRbh4omxuQdZv8uL4siyyL3bS0dkTO5p_fnPP/exec";
const LEGACY_GAS_DEPLOYMENT_IDS = [
  'AKfycbwAH46Bzqpj3OlkjO38LkqFTrueILfJbtbKL9236MybMQwJJCnUcJap0L6eVYgL9Vg',
  'AKfycbx6irb9Xq1yWK7XFmSO8eeZ1a2sj9R2bFbuL2TdDLMiz8McDQuDNwCG_q4zhL9I_MeN',
  'AKfycbwNOS1RAjR2i3NiFFq6AQ7XAD2L53aORemrPGM2rj1fFJ-Ehsk6PAaw6EPnsWChaQ58',
  'AKfycbwgSE70ic5Fuwe6j_e2gaK1Z5227MVmHJIqORI7BEhWTQm5nY8udw689d9uYWKwiVlG',
  'AKfycbwf8iObaafOe69BE0h4rD59ujKMLV8Yr4HH9osx-L7SnMhKNEWvApJd50Asc9DdXDfu'
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

  login: function (credentials) {
    return this.postData({ ...credentials, action: 'login' });
  },

  getAuditLogs: function (data) {
    return this.postData({ ...data, action: 'get_audit_logs' });
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
      if (typeof populateFilterRankOptions === 'function') {
        populateFilterRankOptions();
      }
      if (typeof populateFilterVesselOptions === 'function') {
        populateFilterVesselOptions();
      }

      if (typeof updateCloudBanner === 'function') {
        updateCloudBanner('Connected', response.lastSync || null);
      }
      return true;
    } catch (error) {
      console.warn('Cloud database unavailable:', error);
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
    setInterval(() => this.syncNow(), 30000);
  },

  loginUser: function(username, password) {
    return this.postData({ action: 'login_user', username: username, password: password });
  },

  getUsers: function(authUser, authRole) {
    return this.postData({ action: 'get_users', auth_user: authUser, auth_role: authRole });
  },

  saveUser: function(authUser, authRole, userObj) {
    return this.postData({ action: 'save_user', auth_user: authUser, auth_role: authRole, user: userObj });
  },

  deleteUser: function(authUser, authRole, userId) {
    return this.postData({ action: 'delete_user', auth_user: authUser, auth_role: authRole, userId: userId });
  }
};
