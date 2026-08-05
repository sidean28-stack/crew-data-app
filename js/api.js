const DEFAULT_GAS_URL = "https://script.google.com/macros/s/AKfycbz5n3DVX3ZvCH0vKZsUXX1XUgkJiYTQXit6Jp3d0gbyFRAWRsTirK8LNtZgUPr91uGh/exec";
const LEGACY_GAS_DEPLOYMENT_IDS = [
  'AKfycbwgSE70ic5Fuwe6j_e2gaK1Z5227MVmHJIqORI7BEhWTQm5nY8udw689d9uYWKwiVlG',
  'AKfycbwf8iObaafOe69BE0h4rD59ujKMLV8Yr4HH9osx-L7SnMhKNEWvApJd50Asc9DdXDfu'
];

function getGasUrl() {
  const cachedUrl = localStorage.getItem('crew_app_gas_url');
  if (!cachedUrl) return DEFAULT_GAS_URL;

  if (LEGACY_GAS_DEPLOYMENT_IDS.some(id => cachedUrl.includes(id))) {
    localStorage.removeItem('crew_app_gas_url');
    return DEFAULT_GAS_URL;
  }
  return cachedUrl;
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

  getAllCrew: function () {
    const separator = getGasUrl().includes('?') ? '&' : '?';
    const url = `${getGasUrl()}${separator}action=getAllCrew&_t=${Date.now()}`;
    return this.fetchWithTimeout(url, { method: 'GET', cache: 'no-store' }, 20000);
  },

  postData: async function (payload, timeoutMs) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs || 120000);

    try {
      await fetch(getGasUrl(), {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      // Apps Script responses are opaque in no-cors mode. A resolved request only
      // confirms delivery; the next cloud read remains the source of truth.
      return { success: true, dispatched: true };
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

      const seen = new Set();
      window.crewDatabase = response.crew.filter((crew, index) => {
        const key = String(
          crew.submissionId || crew.passportNo || crew.cdcNo || `${crew.fullName || 'crew'}-${index}`
        ).trim().toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      this.saveLocalDatabase();

      if (typeof updateCloudBanner === 'function') {
        updateCloudBanner('Connected', response.lastSync || null);
      }
      return true;
    } catch (error) {
      console.warn('Cloud database unavailable; using local cache:', error);
      if (typeof updateCloudBanner === 'function') updateCloudBanner('Offline', null);
      return false;
    }
  },

  syncNow: function () {
    return this.loadCloudDatabase();
  }
};

window.loadLocalDatabase = window.api.loadLocalDatabase.bind(window.api);
window.saveLocalDatabase = window.api.saveLocalDatabase.bind(window.api);
window.loadCloudDatabase = window.api.loadCloudDatabase.bind(window.api);
