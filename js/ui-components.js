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

  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (i18n[lang] && i18n[lang][key]) el.placeholder = i18n[lang][key];
  });

  populateDropdowns();
  renderDynamicRadioAndCheckboxes();
  if (typeof updateUploadBadges === 'function') updateUploadBadges();
  if (typeof loadDirectoryTable === 'function') loadDirectoryTable();
  if (typeof renderCatalogGrid === 'function') renderCatalogGrid();
  const detailModal = document.getElementById('crewDetailModal');
  if (detailModal?.classList.contains('active') && window.currentDetailSubmissionId && typeof openCrewDetailModal === 'function') {
    openCrewDetailModal(window.currentDetailSubmissionId);
  }
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
  document.getElementById('gasUrlInput').value = getGasUrl();
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
  const safeTitle = escapeHTML(title || 'CREW PHOTO');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="100%" height="100%" fill="#152036"/><text x="50%" y="50%" fill="#2dd4bf" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle">${safeTitle}</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
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

function transliterateNameToChinese(name) {
  const normalized = String(name || '').toLowerCase().replace(/[^a-z\s'-]/g, ' ').trim();
  if (!normalized) return '';
  const syllables = {
    a:'阿', adi:'阿迪', agus:'阿古斯', ahmad:'艾哈迈德', ali:'阿里', andi:'安迪', arif:'阿里夫',
    ba:'巴', bambang:'班邦', bayu:'巴尤', be:'贝', bi:'比', bo:'博', bu:'布', budi:'布迪',
    ca:'查', ce:'切', ci:'奇', co:'乔', cu:'楚', da:'达', de:'德', di:'迪', do:'多', du:'杜',
    e:'埃', fa:'法', fe:'费', fi:'菲', fo:'福', fu:'富', ga:'加', ge:'格', gi:'吉', go:'戈', gu:'古',
    ha:'哈', hadi:'哈迪', hendri:'亨德里', hi:'希', ho:'霍', hu:'胡', i:'伊', ja:'贾', joko:'佐科',
    ka:'卡', ke:'克', ki:'基', ko:'科', ku:'库', la:'拉', le:'勒', li:'利', lo:'洛', lu:'卢',
    ma:'马', me:'梅', mi:'米', mo:'莫', mu:'穆', muhammad:'穆罕默德', na:'纳', ne:'内', ni:'尼', no:'诺', nu:'努',
    pa:'帕', pe:'佩', pi:'皮', po:'波', pu:'普', ra:'拉', re:'雷', ri:'里', ro:'罗', ru:'鲁',
    sa:'萨', santoso:'桑托索', se:'塞', si:'西', so:'索', su:'苏', ta:'塔', te:'特', ti:'蒂', to:'托', tu:'图',
    u:'乌', wa:'瓦', wahyu:'瓦尤', we:'韦', wi:'维', wo:'沃', ya:'亚', ye:'耶', yi:'伊', yo:'约', yu:'尤', za:'扎', zi:'齐'
  };
  const fallback = {a:'阿',b:'布',c:'奇',d:'德',e:'埃',f:'夫',g:'格',h:'赫',i:'伊',j:'杰',k:'克',l:'尔',m:'姆',n:'恩',o:'奥',p:'普',q:'库',r:'尔',s:'斯',t:'特',u:'乌',v:'维',w:'瓦',x:'克斯',y:'伊',z:'兹'};
  return normalized.split(/\s+/).map(word => {
    if (syllables[word]) return syllables[word];
    let result = '';
    for (let i = 0; i < word.length;) {
      const chunk3 = word.slice(i, i + 3);
      const chunk2 = word.slice(i, i + 2);
      if (syllables[chunk3]) { result += syllables[chunk3]; i += 3; }
      else if (syllables[chunk2]) { result += syllables[chunk2]; i += 2; }
      else { result += fallback[word[i]] || ''; i += 1; }
    }
    return result;
  }).join('');
}

window.transliterateNameToChinese = transliterateNameToChinese;

function syncChineseNameFromFullName() {
  const fullName = document.getElementById('fullName');
  const chineseName = document.getElementById('chineseName');
  if (!fullName || !chineseName) return;
  if (!chineseName.dataset.manualName) {
    chineseName.value = transliterateNameToChinese(fullName.value);
    chineseName.dataset.autoValue = chineseName.value;
  }
}

document.getElementById('fullName')?.addEventListener('input', syncChineseNameFromFullName);
document.getElementById('chineseName')?.addEventListener('input', function () {
  this.dataset.manualName = this.value.trim() && this.value !== this.dataset.autoValue ? 'true' : '';
});

window.currentDocumentPreviewItems = [];
window.currentDocumentPreviewIndex = 0;

function setDocumentPreviewGallery(crew, labels) {
  const items = [];
  Object.entries(labels || {}).forEach(([type, label]) => {
    const documents = crew?.documents?.[type];
    if (!Array.isArray(documents)) return;
    documents.forEach((documentItem, itemIndex) => {
      const src = resolveImgSrc(documentItem);
      if (!src) return;
      items.push({ src, type, label, name: documentItem?.name || `${label} ${itemIndex + 1}` });
    });
  });
  window.currentDocumentPreviewItems = items;
  window.currentDocumentPreviewIndex = 0;
  const previewModal = document.getElementById('imagePreviewModal');
  if (previewModal) previewModal.dataset.gallery = JSON.stringify(items);
  return items;
}

function getDocumentPreviewItems() {
  if (Array.isArray(window.currentDocumentPreviewItems) && window.currentDocumentPreviewItems.length) {
    return window.currentDocumentPreviewItems;
  }
  try {
    const storedItems = JSON.parse(document.getElementById('imagePreviewModal')?.dataset.gallery || '[]');
    if (Array.isArray(storedItems)) window.currentDocumentPreviewItems = storedItems;
  } catch (error) {
    window.currentDocumentPreviewItems = [];
  }
  return window.currentDocumentPreviewItems;
}

function openDocumentPreview(index) {
  const items = getDocumentPreviewItems();
  if (!items.length) return;
  window.currentDocumentPreviewIndex = Math.max(0, Math.min(Number(index) || 0, items.length - 1));
  openImagePreview(items[window.currentDocumentPreviewIndex]);
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
  const previewModal = document.getElementById('imagePreviewModal');
  previewModal.classList.add('active');
  document.body.classList.add('image-preview-open');
  updateImagePreviewControls();
}

function updateImagePreviewControls() {
  const items = getDocumentPreviewItems();
  const index = window.currentDocumentPreviewIndex || 0;
  const current = items[index];
  const hasMultiple = items.length > 1;
  document.getElementById('imagePreviewPrev').hidden = !hasMultiple;
  document.getElementById('imagePreviewNext').hidden = !hasMultiple;
  document.getElementById('imagePreviewCounter').textContent = items.length ? `${index + 1} / ${items.length}` : '';
  document.getElementById('imagePreviewCaption').textContent = current?.name || current?.label || 'Dokumen kru';
}

function navigateImagePreview(direction) {
  const items = getDocumentPreviewItems();
  if (items.length < 2) return;
  window.currentDocumentPreviewIndex = (window.currentDocumentPreviewIndex + direction + items.length) % items.length;
  const current = items[window.currentDocumentPreviewIndex];
  const image = document.getElementById('enlargedImage');
  image.src = current.src;
  image.alt = current.name || current.label || 'Preview dokumen kru';
  updateImagePreviewControls();
}

function downloadCurrentPreview() {
  const current = getDocumentPreviewItems()[window.currentDocumentPreviewIndex];
  const image = document.getElementById('enlargedImage');
  const src = current?.src || image.src;
  if (!src) return;
  const link = document.createElement('a');
  link.href = src;
  link.download = current?.name || `dokumen-kru-${window.currentDocumentPreviewIndex + 1}`;
  link.target = '_blank';
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();
}

// Dynamic detail buttons use inline handlers, so viewer actions must be explicit globals.
window.setDocumentPreviewGallery = setDocumentPreviewGallery;
window.openDocumentPreview = openDocumentPreview;
window.openImagePreview = openImagePreview;
window.navigateImagePreview = navigateImagePreview;
window.downloadCurrentPreview = downloadCurrentPreview;

function closeImagePreview() {
  const modal = document.getElementById('imagePreviewModal');
  const image = document.getElementById('enlargedImage');
  modal.classList.remove('active');
  document.body.classList.remove('image-preview-open');
  image.removeAttribute('src');
  window.currentDocumentPreviewIndex = 0;
}

window.closeImagePreview = closeImagePreview;

document.addEventListener('click', function (event) {
  if (event.target && event.target.id === 'imagePreviewModal') closeImagePreview();
});

document.addEventListener('keydown', function (event) {
  if (event.key === 'Escape' && document.getElementById('imagePreviewModal')?.classList.contains('active')) {
    closeImagePreview();
  } else if (event.key === 'ArrowLeft' && document.getElementById('imagePreviewModal')?.classList.contains('active')) {
    navigateImagePreview(-1);
  } else if (event.key === 'ArrowRight' && document.getElementById('imagePreviewModal')?.classList.contains('active')) {
    navigateImagePreview(1);
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

function inferNotificationType(message) {
  const text = String(message || '').toLowerCase();
  if (/gagal|error|tidak tersedia|belum tersimpan|tidak ditemukan|failed|失败|错误/.test(text)) return 'error';
  if (/harap|pastikan|periksa|belum ada|kosong|warning|注意|请选择|请填写/.test(text)) return 'warning';
  if (/berhasil|success|tersimpan|terhubung|selesai|saved|成功|已保存|已连接/.test(text)) return 'success';
  return 'info';
}

function getNotificationCopy(type) {
  const isZh = window.currentLang === 'zh';
  const copy = {
    success: { icon: 'fa-circle-check', id: 'Berhasil', zh: '操作成功' },
    error: { icon: 'fa-circle-xmark', id: 'Terjadi Kendala', zh: '操作失败' },
    warning: { icon: 'fa-triangle-exclamation', id: 'Perlu Perhatian', zh: '请注意' },
    info: { icon: 'fa-circle-info', id: 'Informasi', zh: '信息' }
  };
  const selected = copy[type] || copy.info;
  return { icon: selected.icon, title: isZh ? selected.zh : selected.id };
}

function closeAppNotification(notification) {
  if (!notification || notification.classList.contains('is-leaving')) return;
  notification.classList.add('is-leaving');
  setTimeout(() => notification.remove(), 220);
}

function showAppNotification(message, type, options) {
  const region = document.getElementById('appNotificationRegion');
  if (!region) return;

  const resolvedType = type || inferNotificationType(message);
  const copy = getNotificationCopy(resolvedType);
  const duration = options?.duration || (resolvedType === 'error' ? 8000 : 5200);
  const notification = document.createElement('section');
  notification.className = `app-notification app-notification--${resolvedType}`;
  notification.setAttribute('role', resolvedType === 'error' ? 'alert' : 'status');
  notification.innerHTML = `
    <div class="app-notification__art" aria-hidden="true">
      <img src="assets/notification-crew.png" alt="">
      <span class="app-notification__status"><i class="fa-solid ${copy.icon}"></i></span>
    </div>
    <div class="app-notification__content">
      <strong class="app-notification__title"></strong>
      <p class="app-notification__message"></p>
    </div>
    <button type="button" class="app-notification__close" aria-label="${window.currentLang === 'zh' ? '关闭通知' : 'Tutup notifikasi'}" title="${window.currentLang === 'zh' ? '关闭' : 'Tutup'}">
      <i class="fa-solid fa-xmark"></i>
    </button>
    <span class="app-notification__timer" style="animation-duration:${duration}ms"></span>
  `;
  notification.querySelector('.app-notification__title').textContent = copy.title;
  notification.querySelector('.app-notification__message').textContent = String(message || '');
  notification.querySelector('.app-notification__close').addEventListener('click', () => closeAppNotification(notification));

  region.prepend(notification);
  while (region.children.length > 3) region.lastElementChild.remove();
  setTimeout(() => closeAppNotification(notification), duration);
  return notification;
}

window.showAppNotification = showAppNotification;
window.notifySuccess = (message, options) => showAppNotification(message, 'success', options);
window.notifyError = (message, options) => showAppNotification(message, 'error', options);
window.notifyWarning = (message, options) => showAppNotification(message, 'warning', options);
window.notifyInfo = (message, options) => showAppNotification(message, 'info', options);

const nativeAlert = window.alert.bind(window);
window.alert = function (message) {
  if (!document.getElementById('appNotificationRegion')) return nativeAlert(message);
  showAppNotification(message);
};

document.addEventListener('click', function (event) {
  const button = event.target.closest?.('button');
  if (!button || button.disabled || button.classList.contains('app-notification__close')) return;

  button.classList.add('is-processing');
  button.setAttribute('aria-busy', 'true');
  const startedAt = Date.now();
  const release = function () {
    const elapsed = Date.now() - startedAt;
    if (button.isConnected && button.disabled && elapsed < 120000) {
      setTimeout(release, 180);
      return;
    }
    if (elapsed < 520) {
      setTimeout(release, 520 - elapsed);
      return;
    }
    button.classList.remove('is-processing');
    button.removeAttribute('aria-busy');
  };
  setTimeout(release, 520);
}, true);
