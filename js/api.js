const DEFAULT_GAS_URL = "https://script.google.com/macros/s/AKfycbwf8iObaafOe69BE0h4rD59ujKMLV8Yr4HH9osx-L7SnMhKNEWvApJd50Asc9DdXDfu/exec";

function getGasUrl() {
  const cachedUrl = localStorage.getItem('crew_app_gas_url');
  if (cachedUrl && cachedUrl !== DEFAULT_GAS_URL) {
    localStorage.removeItem('crew_app_gas_url');
  }
  return DEFAULT_GAS_URL;
}

window.api = {
  fetchWithTimeout: async function (url, options, timeout = 15000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(id);
      if (!response.ok) throw new Error("HTTP " + response.status);
      return await response.json();
    } catch (e) {
      clearTimeout(id);
      throw e;
    }
  },

  getAllCrew: async function () {
    const url = getGasUrl() + "?action=getAllCrew&_t=" + Date.now();
    return this.fetchWithTimeout(url, { method: "GET", cache: "no-store" }, 15000);
  },

  postData: async function (payload, timeoutMs = 120000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(getGasUrl(), {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      clearTimeout(id);
      // Because of mode: 'no-cors', response is opaque. We cannot read JSON or status.
      // We must assume success if the network request didn't throw an error.
      return { success: true, opaque: true };
    } catch (e) {
      clearTimeout(id);
      if (e.name === 'AbortError') {
        throw new Error("Koneksi cloud membutuhkan waktu lebih lama (Timeout 120 detik). Mohon coba lagi atau periksa koneksi internet.");
      }
      throw e;
    }
  },

  submitCrew: function (data) {
    data.action = "submit_crew";
    return this.postData(data);
  },

  updateCrew: function (data) {
    data.action = "update_crew";
    return this.postData(data);
  },

  deleteCrew: function (data) {
    data.action = "delete_crew";
    return this.postData(data);
  },

  deduplicateCrew: function () {
    return this.postData({ action: "deduplicate_crew" });
  },

  booking: function (data) {
    data.action = "booking_request";
    return this.postData(data);
  },

  review: function (data) {
    data.action = "submit_review";
    return this.postData(data);
  },

  uploadDocument: function (data) {
    data.action = "upload_document";
    return this.postData(data);
  },

  saveLocalDatabase: function () {
    localStorage.setItem('crew_app_database', JSON.stringify(window.crewDatabase || []));
  },

  loadLocalDatabase: function () {
    const saved = localStorage.getItem('crew_app_database');
    if (saved) {
      try {
        window.crewDatabase = JSON.parse(saved);
      } catch (e) {
        console.error("Error parsing local database:", e);
        window.crewDatabase = [];
      }
    } else {
      // Production Mode
      // LocalStorage is only an offline cache fallback here.
      window.crewDatabase = [];
    }
  },

  loadCloudDatabase: async function () {
    const statusEl = document.getElementById('loadingStatusText');
    if (statusEl) statusEl.innerText = "Connecting to Google Cloud...";
    
    try {
      if (statusEl) statusEl.innerText = "Downloading Crew Database...";
      const res = await this.getAllCrew();
      
      if (res && res.success && Array.isArray(res.crew) && res.crew.length > 0) {
        const seenMap = new Set();
        const cleanCrew = [];
        res.crew.forEach((item, idx) => {
          const key = (item.submissionId || item.passportNo || item.cdcNo || item.fullName || ('item_' + idx)).toString().trim().toLowerCase();
          if (!seenMap.has(key)) {
            seenMap.add(key);
            cleanCrew.push(item);
          }
        });
        if (statusEl) statusEl.innerText = "Loading " + cleanCrew.length + " Crew...";
        window.crewDatabase = cleanCrew;
        this.saveLocalDatabase();

        if (typeof updateCloudBanner === 'function') {
          updateCloudBanner('Connected', res.lastSync);
        }
        return true;
      } else {
        console.warn("Cloud DB returned empty or offline. Loading local database fallback...");
        this.loadLocalDatabase();
        if (typeof updateCloudBanner === 'function') {
          updateCloudBanner('Connected', null);
        }
        return false;
      }
    } catch (e) {
      console.error("Cloud DB Load Failed:", e);
      this.loadLocalDatabase();
      if (typeof updateCloudBanner === 'function') {
        updateCloudBanner('Offline', null);
      }
      return false;
    }
  },

  syncNow: async function () {
    return await this.loadCloudDatabase();
  }
};

// Backward Compatibility Aliases for Phase B
// These will be refactored out in Phase C and D when app.js and admin.js are updated
window.loadLocalDatabase = window.api.loadLocalDatabase.bind(window.api);
window.saveLocalDatabase = window.api.saveLocalDatabase.bind(window.api);
window.loadCloudDatabase = window.api.loadCloudDatabase.bind(window.api);
