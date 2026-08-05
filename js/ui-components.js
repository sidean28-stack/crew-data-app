// js/ui-components.js

function switchLanguage(lang) {
  window.currentLang = lang;
  document.getElementById('btnLangID').classList.toggle('active', lang === 'id');
  document.getElementById('btnLangZH').classList.toggle('active', lang === 'zh');
  document.documentElement.lang = lang;

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (i18n[lang] && i18n[lang][key]) {
      el.textContent = i18n[lang][key];
    }
  });

  populateDropdowns();
  renderDynamicRadioAndCheckboxes();
  if (typeof updateUploadBadges === 'function') updateUploadBadges();
  if (typeof loadDirectoryTable === 'function') loadDirectoryTable();
  if (typeof renderCatalogGrid === 'function') renderCatalogGrid();
}

function initLanguage() {
  switchLanguage(window.currentLang);
}

function toggleTheme() {
  document.body.classList.toggle('light-theme');
  const icon = document.querySelector('#themeToggleBtn i');
  icon.className = document.body.classList.contains('light-theme') ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
}

function populateDropdowns() {
  const rankSelect = document.getElementById('rankPosition');
  const dirFilterRank = document.getElementById('dirFilterRank');
  const catFilterRank = document.getElementById('catFilterRank');

  rankSelect.innerHTML = `<option value="">${i18n[window.currentLang].selectRank}</option>`;
  if (dirFilterRank) dirFilterRank.innerHTML = `<option value="">${i18n[window.currentLang].filterRank}</option>`;
  if (catFilterRank) catFilterRank.innerHTML = `<option value="">${i18n[window.currentLang].filterRank}</option>`;

  rankOptions.forEach(opt => {
    const label = window.currentLang === 'zh' ? opt.nameZh : opt.nameId;
    rankSelect.innerHTML += `<option value="${opt.nameId}">${label}</option>`;
    if (dirFilterRank) dirFilterRank.innerHTML += `<option value="${opt.nameId}">${label}</option>`;
    if (catFilterRank) catFilterRank.innerHTML += `<option value="${opt.nameId}">${label}</option>`;
  });

  const catFilterQual = document.getElementById('catFilterQual');
  if (catFilterQual) {
    catFilterQual.innerHTML = `<option value="">${i18n[window.currentLang].filterQual}</option>`;
    longlineQualifications.forEach(q => {
      catFilterQual.innerHTML += `<option value="${q.nameId}">${q.nameId}</option>`;
    });
  }

  const vesselTypeSelect = document.getElementById('vesselTypeLongline');
  const catFilterVessel = document.getElementById('catFilterVessel');
  vesselTypeSelect.innerHTML = `<option value="">-- Pilih Jenis Kapal --</option>`;
  if (catFilterVessel) catFilterVessel.innerHTML = `<option value="">${i18n[window.currentLang].filterVessel}</option>`;

  vesselTypeLonglineOptions.forEach(v => {
    vesselTypeSelect.innerHTML += `<option value="${v.nameId}">${v.nameId}</option>`;
    if (catFilterVessel) catFilterVessel.innerHTML += `<option value="${v.nameId}">${v.nameId}</option>`;
  });

  const vesselOriginSelect = document.getElementById('vesselOrigin');
  vesselOriginSelect.innerHTML = `<option value="">-- Pilih Asal Kapal --</option>`;
  vesselOriginOptions.forEach(o => {
    vesselOriginSelect.innerHTML += `<option value="${o.nameId}">${o.nameId}</option>`;
  });

  const placementSelect = document.getElementById('placementCountry');
  placementSelect.innerHTML = `<option value="">-- Pilih Negara Penempatan --</option>`;
  placementCountryOptions.forEach(p => {
    placementSelect.innerHTML += `<option value="${p.nameId}">${p.nameId}</option>`;
  });
}

function renderDynamicRadioAndCheckboxes() {
  const qualContainer = document.getElementById('longlineQualContainer');
  qualContainer.innerHTML = '';
  longlineQualifications.forEach((qual, index) => {
    qualContainer.innerHTML += `
      <label style="display: flex; align-items: center; gap: 10px; padding: 10px 14px; background: rgba(0,0,0,0.1); border: 1px solid var(--border-color); border-radius: 8px; cursor: pointer;">
        <input type="radio" name="expLongline" value="${qual.nameId}" ${index === 0 ? 'checked' : ''} style="width: 18px; height: 18px;">
        <span style="font-size: 0.9rem; font-weight: 600;">${qual.nameId}</span>
      </label>
    `;
  });

  const skillContainer = document.getElementById('skillGeneralContainer');
  skillContainer.innerHTML = '';
  skillGeneralOptions.forEach(skill => {
    const label = window.currentLang === 'zh' ? skill.nameZh : skill.nameId;
    skillContainer.innerHTML += `
      <label style="display: flex; align-items: center; gap: 8px; font-size: 0.88rem; cursor: pointer; padding: 6px; background: rgba(0,0,0,0.08); border-radius: 6px;">
        <input type="checkbox" name="skillGeneral" value="${skill.nameId}" style="width: 16px; height: 16px;">
        <span>${label}</span>
      </label>
    `;
  });
}

function switchTab(tab) {
  document.querySelectorAll('.tab-link').forEach(btn => btn.classList.remove('active'));
  document.getElementById('formTabSection').style.display = 'none';
  document.getElementById('catalogTabSection').style.display = 'none';
  document.getElementById('directoryTabSection').style.display = 'none';

  if (tab === 'form') {
    document.getElementById('tabBtnForm').classList.add('active');
    document.getElementById('formTabSection').style.display = 'block';
  } else if (tab === 'catalog') {
    document.getElementById('tabBtnCatalog').classList.add('active');
    document.getElementById('catalogTabSection').style.display = 'block';
    if (typeof renderCatalogGrid === 'function') renderCatalogGrid();
  } else if (tab === 'directory') {
    document.getElementById('tabBtnDirectory').classList.add('active');
    document.getElementById('directoryTabSection').style.display = 'block';
    if (typeof loadDirectoryTable === 'function') loadDirectoryTable();
  }
}

function openGasModal() {
  document.getElementById('gasSetupModal').classList.add('active');
  document.getElementById('gasUrlInput').value = getGasUrl();
}
function closeGasModal() {
  document.getElementById('gasSetupModal').classList.remove('active');
}
function saveGasUrl() {
  const url = document.getElementById('gasUrlInput').value.trim();
  if (url) localStorage.setItem('crew_app_gas_url', url);
  closeGasModal();
  updateGasStatusUI();
}

function updateGasStatusUI() {
  const statusText = document.getElementById('gasStatusText');
  const statusBar = document.getElementById('connectionStatusBar');
  if (getGasUrl()) {
    statusText.textContent = i18n[window.currentLang].gasStatusConnected;
    statusBar.classList.add('connected');
  } else {
    statusText.textContent = i18n[window.currentLang].gasStatusLocal;
    statusBar.classList.remove('connected');
  }
}

function maskName(name) {
  if (!name) return "";
  const parts = name.split(" ");
  return parts.map(p => p.length > 2 ? p[0] + "***" + p[p.length - 1] : p[0] + "*").join(" ");
}

function maskString(str, visibleCount) {
  if (!str) return "";
  if (str.length <= visibleCount) return str;
  return str.slice(0, visibleCount) + "****" + str.slice(-2);
}

function createDummySvgDataUrl(title) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="100%" height="100%" fill="#152036"/><text x="50%" y="50%" fill="#2dd4bf" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle">${title}</text></svg>`;
  return "data:image/svg+xml;base64," + btoa(svg);
}

function getGoogleDriveFileId(url) {
  if (!url) return '';
  const value = String(url).trim();
  const pathMatch = value.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (pathMatch) return pathMatch[1];

  try {
    const parsedUrl = new URL(value, window.location.href);
    return parsedUrl.searchParams.get('id') || '';
  } catch (error) {
    return '';
  }
}

function resolveImgSrc(source) {
  if (!source) return '';
  const rawUrl = typeof source === 'string'
    ? source
    : (source.base64 || source.url || source.link || '');
  const url = String(rawUrl).trim();
  if (!url) return '';

  if (url.includes('drive.google.com') || url.includes('googleusercontent.com')) {
    const fileId = getGoogleDriveFileId(url);
    if (fileId) return `https://lh3.googleusercontent.com/d/${encodeURIComponent(fileId)}`;
  }
  return url;
}

function openImagePreview(source) {
  const src = resolveImgSrc(source);
  if (!src) return;

  const image = document.getElementById('enlargedImage');
  image.src = src;
  image.alt = typeof source === 'object' && source.name ? source.name : 'Preview dokumen kru';
  const watermark = document.getElementById('watermarkOverlay');
  if (window.activeToken || window.currentRole === 'owner') {
    watermark.textContent = `CONFIDENTIAL FOR ${window.tokenOwnerName || 'SHIP OWNER'} - ${new Date().toLocaleDateString()}`;
    watermark.style.display = 'block';
  } else {
    watermark.style.display = 'none';
  }
  document.getElementById('imagePreviewModal').classList.add('active');
}

function closeImagePreview() {
  const modal = document.getElementById('imagePreviewModal');
  const image = document.getElementById('enlargedImage');
  modal.classList.remove('active');
  image.removeAttribute('src');
}

document.addEventListener('click', function (event) {
  if (event.target && event.target.id === 'imagePreviewModal') closeImagePreview();
});

document.addEventListener('keydown', function (event) {
  if (event.key === 'Escape' && document.getElementById('imagePreviewModal')?.classList.contains('active')) {
    closeImagePreview();
  }
});

/**
 * Escapes HTML characters to prevent Cross-Site Scripting (XSS).
 * Accepts null, undefined, number, boolean, and string types.
 * Always returns a string without throwing exceptions.
 * 
 * @param {*} value - The input value to escape.
 * @returns {string} The HTML-escaped string.
 */
function escapeHTML(value) {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value).replace(/[&<>"']/g, function (match) {
    switch (match) {
      case "&": return "&amp;";
      case "<": return "&lt;";
      case ">": return "&gt;";
      case '"': return "&quot;";
      case "'": return "&#39;";
      default: return match;
    }
  });
}
