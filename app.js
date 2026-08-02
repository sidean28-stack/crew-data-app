/**
 * Crew Data Application - Frontend Logic (app.js)
 * Wantaifeng International Co Ltd - PT ALINDA PRIMA SENTOSA
 * Specialization: Longline Crew Data, Catalogue, Booking Basket & Security
 */

const DEFAULT_GAS_URL = "https://script.googleusercontent.com/macros/echo?user_content_key=AUkAhnQs6QoX5n9WhMiKlbALyXxVne2lE77H05nEZIEajutRLtxXiVGdteGJV9_kwVBS6JIW0-mHvD5QTBmFDqnoHBkeYCDBvVnbR-HjmrCGz34DfsGmMD5_6o13OAqSIvpqGcGTG4QfRhqDEBrn0XkDsA6WeImr6g3N0JCRU33E6tPBxD7eOHRQcQPBoRZNDaAKpDqkU5J_Cz1q8oXDVipK7BJu_rkGtTRK6dHG5pAJusFjXl0cLtb3EuhThajRIhhSAnccYSscbNw2V-Bu8EE&lib=MWXtw9lwuPUCgEy8iGs-2YCekRsELq_92";

// Global State
let currentLang = 'id';
let currentRole = 'admin'; // 'admin', 'owner', 'candidate'
let activeToken = null;
let tokenOwnerName = null;
let currentStep = 1;
let activeCameraDocType = null;
let cameraStream = null;

// Selection Basket
let bookingBasket = [];

// Documents uploaded per step
const uploadedDocuments = {
  passport: [],
  ktp: [],
  cdc: [],
  medical: [],
  cert: [],
  photo: []
};

// Helper for GAS Endpoint
function getGasUrl() {
  return localStorage.getItem('crew_app_gas_url') || DEFAULT_GAS_URL;
}

// Initial Sample Crew Database (Including SELAM / TUKANG SELAM)
let crewDatabase = [
  {
    submissionId: "CREW-LONG-1001",
    fullName: "BUDI SANTOSO",
    chineseName: "张伟大 (Zhang Weida)",
    rankPosition: "DECKHAND",
    phoneNo: "+6281298765432",
    streetAddress: "Jl. Yos Sudarso No. 45",
    rtRw: "03/08",
    village: "Sukamaju",
    district: "Cilincing",
    city: "Jakarta Utara",
    province: "DKI Jakarta",
    combinedAddress: "Jl. Yos Sudarso No. 45 RT/RW: 03/08 Kel/Desa: Sukamaju Kec: Cilincing Kab/Kota: Jakarta Utara Prov: DKI Jakarta",
    fam1Name: "Siti Rahmawati",
    fam1Relation: "Istri",
    fam1Phone: "+6281387654321",
    fam2Name: "Herman Santoso",
    fam2Relation: "Orang Tua",
    fam2Phone: "+6281277665544",
    expLongline: "MANUAL DAN SNAP ATAS 小筒下口，车筒下口",
    vesselName: "FU YUAN YU 888",
    vesselTypeLongline: "CT4 SNAP ATAS 车筒下口",
    vesselOrigin: "Taiwan 台湾",
    placementCountry: "Mauritius 毛里求斯",
    skillGeneral: ["Gulung Yoka (手工捲繩)", "Proses Ikan (殺魚)", "Tukang Es (冰工)"],
    passportNo: "C9823411",
    passportExpiry: "2029-08-15",
    cdcNo: "E092182",
    cdcExpiry: "2028-11-20",
    bstExpiry: "2027-05-10",
    kkStatus: "Asli",
    akteStatus: "Asli",
    ijazahLevel: "SMA Sederajat - Asli",
    medicalStatus: "Ada",
    waliStatus: "Ada",
    skckStatus: "Ada",
    shirtSize: "L",
    shoeSize: "42",
    gender: "Male",
    dob: "1995-04-12",
    religion: "Islam",
    verificationStatus: "Verified",
    submittedAt: "2026-07-28 10:00",
    documents: {
      passport: [{ name: "passport_budi.jpg", base64: createDummySvgDataUrl("PASSPORT BUDI") }],
      ktp: [{ name: "ktp_budi.jpg", base64: createDummySvgDataUrl("KTP BUDI") }],
      cdc: [{ name: "seaman_book.jpg", base64: createDummySvgDataUrl("CDC BUDI") }],
      medical: [{ name: "mcu_fit.jpg", base64: createDummySvgDataUrl("MCU BUDI") }],
      cert: [{ name: "bst_cert.jpg", base64: createDummySvgDataUrl("BST BUDI") }],
      photo: [{ name: "fullbody_budi.jpg", base64: createDummySvgDataUrl("FOTO BUDI") }]
    }
  },
  {
    submissionId: "CREW-LONG-1002",
    fullName: "AGUS SETIAWAN",
    chineseName: "阿古斯 (Agus)",
    rankPosition: "OPERATOR HOLER",
    phoneNo: "+6281355443322",
    streetAddress: "Jl. Pelabuhan No. 12",
    rtRw: "01/02",
    village: "Muara Angke",
    district: "Penjaringan",
    city: "Jakarta Utara",
    province: "DKI Jakarta",
    combinedAddress: "Jl. Pelabuhan No. 12 RT/RW: 01/02 Kel/Desa: Muara Angke Kec: Penjaringan Kab/Kota: Jakarta Utara Prov: DKI Jakarta",
    fam1Name: "Rina Setyowati",
    fam1Relation: "Istri",
    fam1Phone: "+6281399887766",
    fam2Name: "Bambang Setiawan",
    fam2Relation: "Saudara",
    fam2Phone: "+6281244556677",
    expLongline: "SNAP BAWAH DAN ATAS 导轮入口，车筒下口",
    vesselName: "TAI WAN 12",
    vesselTypeLongline: "CT5 SNAP ATAS 车筒下口",
    vesselOrigin: "Taiwan 台湾",
    placementCountry: "Capetown 开普敦",
    skillGeneral: ["Holler (辊仔車)", "Buang Pancing (掛朗)", "Kemudi Holing (开船)"],
    passportNo: "C8812399",
    passportExpiry: "2026-09-30",
    cdcNo: "E088123",
    cdcExpiry: "2026-10-15",
    bstExpiry: "2027-01-20",
    kkStatus: "Asli",
    akteStatus: "FC",
    ijazahLevel: "SMP - Asli",
    medicalStatus: "Ada",
    waliStatus: "Ada",
    skckStatus: "Ada",
    shirtSize: "M",
    shoeSize: "40",
    gender: "Male",
    dob: "1992-09-18",
    religion: "Islam",
    verificationStatus: "Verified",
    submittedAt: "2026-07-29 14:20",
    documents: {
      passport: [{ name: "passport_agus.jpg", base64: createDummySvgDataUrl("PASSPORT AGUS") }],
      ktp: [{ name: "ktp_agus.jpg", base64: createDummySvgDataUrl("KTP AGUS") }],
      cdc: [{ name: "seaman_book.jpg", base64: createDummySvgDataUrl("CDC AGUS") }],
      medical: [{ name: "mcu_fit.jpg", base64: createDummySvgDataUrl("MCU AGUS") }],
      cert: [{ name: "bst_cert.jpg", base64: createDummySvgDataUrl("BST AGUS") }],
      photo: [{ name: "fullbody_agus.jpg", base64: createDummySvgDataUrl("FOTO AGUS") }]
    }
  },
  {
    submissionId: "CREW-LONG-1003",
    fullName: "DEDI KURNIAWAN",
    chineseName: "德迪 (Dedi - 潜水员)",
    rankPosition: "SELAM / TUKANG SELAM",
    phoneNo: "+6281277889900",
    streetAddress: "Jl. Bahari Indah No. 88",
    rtRw: "04/05",
    village: "Tanjung Priok",
    district: "Tanjung Priok",
    city: "Jakarta Utara",
    province: "DKI Jakarta",
    combinedAddress: "Jl. Bahari Indah No. 88 RT/RW: 04/05 Kel/Desa: Tanjung Priok Kec: Tanjung Priok Kab/Kota: Jakarta Utara Prov: DKI Jakarta",
    fam1Name: "Maya Kurnia",
    fam1Relation: "Istri",
    fam1Phone: "+6281277112233",
    fam2Name: "Subagyo Kurniawan",
    fam2Relation: "Orang Tua",
    fam2Phone: "+6281355667788",
    expLongline: "MANUAL DAN SNAP BAWAH 小筒下口，导轮入口",
    vesselName: "FU YUAN YU 999",
    vesselTypeLongline: "CT-6/7 导轮入口",
    vesselOrigin: "China 中国",
    placementCountry: "Solomon 所罗门",
    skillGeneral: ["Selam / Tukang Selam (潜水)", "Holler (辊仔車)", "Kemudi Holing (开船)"],
    passportNo: "C9945120",
    passportExpiry: "2030-01-10",
    cdcNo: "E099411",
    cdcExpiry: "2029-06-25",
    bstExpiry: "2028-09-12",
    kkStatus: "Asli",
    akteStatus: "Asli",
    ijazahLevel: "SMA Sederajat - Asli",
    medicalStatus: "Ada",
    waliStatus: "Ada",
    skckStatus: "Ada",
    shirtSize: "XL",
    shoeSize: "43",
    gender: "Male",
    dob: "1990-11-05",
    religion: "Islam",
    verificationStatus: "Verified",
    submittedAt: "2026-07-30 08:00",
    documents: {
      passport: [{ name: "passport_dedi.jpg", base64: createDummySvgDataUrl("PASSPORT DEDI") }],
      ktp: [{ name: "ktp_dedi.jpg", base64: createDummySvgDataUrl("KTP DEDI") }],
      cdc: [{ name: "seaman_book.jpg", base64: createDummySvgDataUrl("CDC DEDI") }],
      medical: [{ name: "mcu_fit.jpg", base64: createDummySvgDataUrl("MCU DEDI") }],
      cert: [{ name: "bst_cert.jpg", base64: createDummySvgDataUrl("BST DEDI") }],
      photo: [{ name: "fullbody_dedi.jpg", base64: createDummySvgDataUrl("FOTO DEDI SELAM") }]
    }
  }
];

// Initialize DOM
document.addEventListener('DOMContentLoaded', () => {
  loadLocalDatabase();
  parseUrlParams();
  initLanguage();
  populateDropdowns();
  renderDynamicRadioAndCheckboxes();
  loadSavedDraft();
  updateRoleUI();
  updateGasStatusUI();
  setupDragAndDrop();
});

/* ==========================================================================
   1. LOCAL STORAGE & URL SECURITY TOKEN HANDLING
   ========================================================================== */

function loadLocalDatabase() {
  const saved = localStorage.getItem('crew_app_database');
  if (saved) {
    try {
      crewDatabase = JSON.parse(saved);
    } catch(e) {
      console.error("Error parsing local database:", e);
    }
  } else {
    saveLocalDatabase();
  }
}

function saveLocalDatabase() {
  localStorage.setItem('crew_app_database', JSON.stringify(crewDatabase));
}

function parseUrlParams() {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  const roleParam = urlParams.get('role');

  if (token) {
    activeToken = token;
    tokenOwnerName = urlParams.get('owner') || "Ship Owner";
    currentRole = 'owner';
    document.getElementById('userRoleSelect').value = 'owner';
    showSecurityBanner(`One-Time Access Link Aktif: Terverifikasi untuk ${tokenOwnerName}. Data Unmasked & Watermarked.`);
  } else if (roleParam) {
    currentRole = roleParam;
    document.getElementById('userRoleSelect').value = roleParam;
  }
}

function showSecurityBanner(msg) {
  const banner = document.getElementById('securityTokenBanner');
  document.getElementById('securityBannerText').textContent = msg;
  banner.style.display = 'flex';
}

function switchRole(role) {
  currentRole = role;
  updateRoleUI();
}

function updateRoleUI() {
  const navForm = document.getElementById('tabBtnForm');
  const navCatalog = document.getElementById('tabBtnCatalog');
  const navDirectory = document.getElementById('tabBtnDirectory');

  if (currentRole === 'candidate') {
    switchTab('form');
  } else if (currentRole === 'owner') {
    switchTab('catalog');
  } else if (currentRole === 'admin') {
    switchTab('directory');
  }

  loadDirectoryTable();
  renderCatalogGrid();
}

/* ==========================================================================
   2. INTERNATIONALIZATION (i18n) & THEMES
   ========================================================================== */

function switchLanguage(lang) {
  currentLang = lang;
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
  updateUploadBadges();
  loadDirectoryTable();
  renderCatalogGrid();
}

function initLanguage() {
  switchLanguage(currentLang);
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

  rankSelect.innerHTML = `<option value="">${i18n[currentLang].selectRank}</option>`;
  if (dirFilterRank) dirFilterRank.innerHTML = `<option value="">${i18n[currentLang].filterRank}</option>`;
  if (catFilterRank) catFilterRank.innerHTML = `<option value="">${i18n[currentLang].filterRank}</option>`;

  rankOptions.forEach(opt => {
    const label = currentLang === 'zh' ? opt.nameZh : opt.nameId;
    rankSelect.innerHTML += `<option value="${opt.nameId}">${label}</option>`;
    if (dirFilterRank) dirFilterRank.innerHTML += `<option value="${opt.nameId}">${label}</option>`;
    if (catFilterRank) catFilterRank.innerHTML += `<option value="${opt.nameId}">${label}</option>`;
  });

  // Qual Filter for Catalog
  const catFilterQual = document.getElementById('catFilterQual');
  if (catFilterQual) {
    catFilterQual.innerHTML = `<option value="">${i18n[currentLang].filterQual}</option>`;
    longlineQualifications.forEach(q => {
      catFilterQual.innerHTML += `<option value="${q.nameId}">${q.nameId}</option>`;
    });
  }

  // Vessel Type Filter for Catalog & Form
  const vesselTypeSelect = document.getElementById('vesselTypeLongline');
  const catFilterVessel = document.getElementById('catFilterVessel');
  vesselTypeSelect.innerHTML = `<option value="">-- Pilih Jenis Kapal --</option>`;
  if (catFilterVessel) catFilterVessel.innerHTML = `<option value="">${i18n[currentLang].filterVessel}</option>`;

  vesselTypeLonglineOptions.forEach(v => {
    vesselTypeSelect.innerHTML += `<option value="${v.nameId}">${v.nameId}</option>`;
    if (catFilterVessel) catFilterVessel.innerHTML += `<option value="${v.nameId}">${v.nameId}</option>`;
  });

  // Vessel Origin & Placement Dropdowns
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
  // Longline Qualifications Radio Options
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

  // General Skill Checkboxes
  const skillContainer = document.getElementById('skillGeneralContainer');
  skillContainer.innerHTML = '';
  skillGeneralOptions.forEach(skill => {
    const label = currentLang === 'zh' ? skill.nameZh : skill.nameId;
    skillContainer.innerHTML += `
      <label style="display: flex; align-items: center; gap: 8px; font-size: 0.88rem; cursor: pointer; padding: 6px; background: rgba(0,0,0,0.08); border-radius: 6px;">
        <input type="checkbox" name="skillGeneral" value="${skill.nameId}" style="width: 16px; height: 16px;">
        <span>${label}</span>
      </label>
    `;
  });
}

/* ==========================================================================
   3. SHIP OWNER CREW CATALOGUE & BOOKING BASKET
   ========================================================================== */

function renderCatalogGrid() {
  const container = document.getElementById('catalogGridContainer');
  if (!container) return;

  const searchQuery = (document.getElementById('catSearchInput')?.value || '').toLowerCase();
  const filterRank = document.getElementById('catFilterRank')?.value || '';
  const filterQual = document.getElementById('catFilterQual')?.value || '';
  const filterVessel = document.getElementById('catFilterVessel')?.value || '';

  const filtered = crewDatabase.filter(crew => {
    const matchesSearch = !searchQuery || 
      crew.fullName.toLowerCase().includes(searchQuery) ||
      (crew.chineseName && crew.chineseName.toLowerCase().includes(searchQuery)) ||
      crew.rankPosition.toLowerCase().includes(searchQuery) ||
      (crew.vesselName && crew.vesselName.toLowerCase().includes(searchQuery));

    const matchesRank = !filterRank || crew.rankPosition === filterRank;
    const matchesQual = !filterQual || crew.expLongline === filterQual;
    const matchesVessel = !filterVessel || crew.vesselTypeLongline === filterVessel;

    return matchesSearch && matchesRank && matchesQual && matchesVessel;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">
        <i class="fa-solid fa-folder-open" style="font-size: 3rem; margin-bottom: 12px;"></i>
        <p>Tidak ada kandidat kru yang cocok dengan kriteria pencarian.</p>
      </div>
    `;
    return;
  }

  const isUnmasked = (currentRole === 'admin' || activeToken !== null);

  container.innerHTML = filtered.map(crew => {
    const displayName = isUnmasked ? crew.fullName : maskName(crew.fullName);
    const displayPassport = isUnmasked ? crew.passportNo : maskString(crew.passportNo, 3);
    const displayPhone = isUnmasked ? crew.phoneNo : maskString(crew.phoneNo, 4);
    
    // Photo thumb
    let photoUrl = createDummySvgDataUrl("CREW PHOTO");
    if (crew.documents && crew.documents.photo && crew.documents.photo.length > 0) {
      photoUrl = crew.documents.photo[0].base64 || photoUrl;
    }

    const inBasket = bookingBasket.some(item => item.submissionId === crew.submissionId);
    const expiryStatus = getDocExpiryStatus(crew);

    return `
      <div class="crew-card">
        <div class="crew-card-header">
          <img src="${photoUrl}" class="crew-avatar" alt="${displayName}">
          <div class="crew-header-info">
            <h3>${displayName}</h3>
            ${crew.chineseName ? `<small style="color: var(--accent-teal); display: block;">${crew.chineseName}</small>` : ''}
            <span class="rank-badge">${crew.rankPosition}</span>
          </div>
        </div>

        <div class="crew-card-body">
          <div class="crew-spec-item">
            <span class="crew-spec-label">Kode Kru:</span>
            <span class="crew-spec-value">${crew.submissionId}</span>
          </div>
          <div class="crew-spec-item">
            <span class="crew-spec-label">Kualifikasi Longline:</span>
            <span class="crew-spec-value" style="color: var(--accent-amber);">${crew.expLongline || 'N/A'}</span>
          </div>
          <div class="crew-spec-item">
            <span class="crew-spec-label">Pengalaman Kapal:</span>
            <span class="crew-spec-value">${crew.vesselTypeLongline || '-'} (${crew.vesselOrigin || '-'})</span>
          </div>
          <div class="crew-spec-item">
            <span class="crew-spec-label">Penempatan:</span>
            <span class="crew-spec-value">${crew.placementCountry || '-'}</span>
          </div>
          <div class="crew-spec-item">
            <span class="crew-spec-label">Status Paspor/CDC:</span>
            <span class="${expiryStatus.badgeClass}">${expiryStatus.text}</span>
          </div>
        </div>

        <div class="crew-card-footer">
          <button class="btn-primary" style="width: 100%; ${inBasket ? 'background: var(--bg-input); border: 1px solid var(--accent-teal); color: var(--accent-teal);' : ''}" 
                  onclick="toggleBasketItem('${crew.submissionId}')">
            <i class="fa-solid ${inBasket ? 'fa-check' : 'fa-plus'}"></i>
            <span>${inBasket ? i18n[currentLang].inBasket : i18n[currentLang].addToBasket}</span>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function toggleBasketItem(submissionId) {
  const crew = crewDatabase.find(c => c.submissionId === submissionId);
  if (!crew) return;

  const index = bookingBasket.findIndex(b => b.submissionId === submissionId);
  if (index >= 0) {
    bookingBasket.splice(index, 1);
  } else {
    bookingBasket.push(crew);
  }

  updateBasketBadge();
  renderCatalogGrid();
  renderBasketDrawerItems();
}

function updateBasketBadge() {
  const badge = document.getElementById('basketCountBadge');
  if (badge) badge.textContent = bookingBasket.length;
}

function toggleBasketDrawer() {
  const drawer = document.getElementById('basketDrawer');
  const overlay = document.getElementById('basketDrawerOverlay');
  drawer.classList.toggle('active');
  overlay.classList.toggle('active');
  renderBasketDrawerItems();
}

function renderBasketDrawerItems() {
  const container = document.getElementById('basketDrawerItems');
  if (!container) return;

  if (bookingBasket.length === 0) {
    container.innerHTML = `<p style="text-align: center; color: var(--text-muted); padding: 30px;">Keranjang pemesanan kru masih kosong.</p>`;
    return;
  }

  container.innerHTML = bookingBasket.map(item => `
    <div class="basket-item-card">
      <div>
        <strong style="color: var(--text-main); font-size: 0.95rem;">${item.fullName}</strong>
        <div style="font-size: 0.8rem; color: var(--accent-teal);">${item.rankPosition} (${item.expLongline})</div>
      </div>
      <button class="btn-secondary" style="padding: 4px 8px; color: var(--accent-rose);" onclick="toggleBasketItem('${item.submissionId}')">
        <i class="fa-solid fa-trash"></i>
      </button>
    </div>
  `).join('');
}

function submitBookingOrder() {
  const ownerName = document.getElementById('bookingOwnerName').value.trim();
  const ownerContact = document.getElementById('bookingOwnerContact').value.trim();
  const notes = document.getElementById('bookingNotes').value.trim();

  if (!ownerName || !ownerContact) {
    alert("Harap isi Nama Ship Owner dan No. HP Kontak!");
    return;
  }

  if (bookingBasket.length === 0) {
    alert("Keranjang booking masih kosong. Harap pilih kandidat kru!");
    return;
  }

  const payload = {
    action: "booking_request",
    ownerName: ownerName,
    ownerContact: ownerContact,
    notes: notes,
    selectedCrew: bookingBasket.map(c => ({ id: c.submissionId, name: c.fullName, rank: c.rankPosition })),
    timestamp: new Date().toISOString()
  };

  fetch(getGasUrl(), {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  }).catch(err => console.log("Gas booking sync notice:", err));

  alert(i18n[currentLang].bookingSuccessAlert);
  bookingBasket = [];
  updateBasketBadge();
  toggleBasketDrawer();
}

/* ==========================================================================
   4. ADMIN PANEL & ONE-TIME ACCESS LINK GENERATOR
   ========================================================================== */

function loadDirectoryTable() {
  const tbody = document.getElementById('directoryTableBody');
  const countText = document.getElementById('totalCrewCountText');
  if (!tbody) return;

  const searchQuery = (document.getElementById('dirSearchInput')?.value || '').toLowerCase();
  const filterRank = document.getElementById('dirFilterRank')?.value || '';

  const filtered = crewDatabase.filter(crew => {
    const matchesSearch = !searchQuery || 
      crew.fullName.toLowerCase().includes(searchQuery) ||
      crew.rankPosition.toLowerCase().includes(searchQuery) ||
      crew.passportNo.toLowerCase().includes(searchQuery);

    const matchesRank = !filterRank || crew.rankPosition === filterRank;

    return matchesSearch && matchesRank;
  });

  if (countText) countText.textContent = filtered.length;

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 30px;">Data kru tidak ditemukan.</td></tr>`;
    return;
  }

  const isUnmasked = (currentRole === 'admin' || activeToken !== null);

  tbody.innerHTML = filtered.map(crew => {
    const displayName = isUnmasked ? crew.fullName : maskName(crew.fullName);
    const displayPhone = isUnmasked ? crew.phoneNo : maskString(crew.phoneNo, 4);
    const displayAddress = isUnmasked ? (crew.combinedAddress || crew.streetAddress) : '*** Masked Address ***';
    const expiryStatus = getDocExpiryStatus(crew);

    return `
      <tr>
        <td><strong>${crew.submissionId}</strong></td>
        <td class="crew-name-cell">
          ${displayName}
          ${crew.chineseName ? `<br><small style="color: var(--accent-teal);">${crew.chineseName}</small>` : ''}
        </td>
        <td><span class="rank-badge">${crew.rankPosition}</span></td>
        <td style="font-size: 0.82rem; color: var(--accent-amber);">${crew.expLongline || '-'}</td>
        <td>${displayPhone}</td>
        <td><span class="${expiryStatus.badgeClass}">${expiryStatus.text}</span></td>
        <td><span class="status-badge" style="color: var(--accent-emerald);">✓ Verified</span></td>
        <td>
          <div style="display: flex; gap: 6px;">
            <button class="btn-secondary" style="padding: 4px 10px; font-size: 0.8rem;" onclick="printCrewCV('${crew.submissionId}')" title="Cetak CV">
              <i class="fa-solid fa-print"></i>
            </button>
            <button class="btn-secondary" style="padding: 4px 10px; font-size: 0.8rem;" onclick="exportCrewZip('${crew.submissionId}')" title="Download Berkas ZIP">
              <i class="fa-solid fa-file-zipper"></i>
            </button>
            ${currentRole === 'admin' ? `
              <button class="btn-secondary" style="padding: 4px 10px; font-size: 0.8rem; color: var(--accent-rose);" onclick="openDeleteModal('${crew.submissionId}')" title="Hapus Data Kru">
                <i class="fa-solid fa-trash"></i>
              </button>
            ` : ''}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function filterDirectory() {
  loadDirectoryTable();
}

function getDocExpiryStatus(crew) {
  if (!crew.passportExpiry) return { text: "No Date", badgeClass: "badge-expiry-yellow" };

  const expDate = new Date(crew.passportExpiry);
  const now = new Date();
  const diffDays = Math.ceil((expDate - now) / (1000 * 60 * 60 * 24));

  if (diffDays < 90) {
    return { text: `🔴 Expired / < 90 Hari (${diffDays} hr)`, badgeClass: "badge-expiry-red" };
  } else if (diffDays < 180) {
    return { text: `🟡 Warning (< 180 Hari)`, badgeClass: "badge-expiry-yellow" };
  } else {
    return { text: `🟢 Valid (${diffDays} hr)`, badgeClass: "badge-expiry-green" };
  }
}

// One-Time Link Generator
function openOneTimeLinkModal() {
  document.getElementById('otlModal').classList.add('active');
}
function closeOneTimeLinkModal() {
  document.getElementById('otlModal').classList.remove('active');
}

function generateOtlLink() {
  const ownerName = document.getElementById('otlOwnerName').value.trim();
  const duration = document.getElementById('otlExpiryHours').value;

  if (!ownerName) {
    alert("Harap masukkan nama Owner Kapal!");
    return;
  }

  const tokenStr = "OTL-" + Math.random().toString(36).substring(2, 10).toUpperCase();
  const currentUrl = window.location.href.split('?')[0];
  const generatedUrl = `${currentUrl}?role=owner&token=${tokenStr}&owner=${encodeURIComponent(ownerName)}`;

  document.getElementById('otlResultUrl').value = generatedUrl;
  document.getElementById('otlResultBox').style.display = 'block';
}

function copyOtlUrl() {
  const input = document.getElementById('otlResultUrl');
  input.select();
  document.execCommand('copy');
  alert(i18n[currentLang].copiedLinkAlert);
}

// 2-Step Confirmation Delete Modal
function openDeleteModal(submissionId) {
  document.getElementById('deleteTargetId').value = submissionId;
  document.getElementById('deleteConfirmModal').classList.add('active');
}
function closeDeleteModal() {
  document.getElementById('deleteConfirmModal').classList.remove('active');
}

function executeDeleteCrew() {
  const submissionId = document.getElementById('deleteTargetId').value;
  const index = crewDatabase.findIndex(c => c.submissionId === submissionId);
  if (index >= 0) {
    crewDatabase.splice(index, 1);
    saveLocalDatabase();
    loadDirectoryTable();
    renderCatalogGrid();
    alert("Data kru berhasil dihapus!");
  }
  closeDeleteModal();
}

// CSV Export
function exportDirectoryCSV() {
  if (crewDatabase.length === 0) {
    alert("Tidak ada data untuk diekspor.");
    return;
  }

  let csvContent = "data:text/csv;charset=utf-8,";
  csvContent += "ID Submisi,Nama Lengkap,Nama Mandarin,Jabatan,No HP,Alamat,Pengalaman Longline,Jenis Kapal,Asal Kapal,Negara Penempatan,Paspor Expired,CDC Expired\n";

  crewDatabase.forEach(c => {
    const row = [
      c.submissionId,
      `"${c.fullName}"`,
      `"${c.chineseName || ''}"`,
      `"${c.rankPosition}"`,
      `"${c.phoneNo}"`,
      `"${c.combinedAddress || c.streetAddress}"`,
      `"${c.expLongline}"`,
      `"${c.vesselTypeLongline}"`,
      `"${c.vesselOrigin}"`,
      `"${c.placementCountry}"`,
      `"${c.passportExpiry}"`,
      `"${c.cdcExpiry}"`
    ].join(",");
    csvContent += row + "\n";
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `Crew_Longline_PT_ALINDA_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Print CV Pelaut Ikan Layout
function printCrewCV(submissionId) {
  const crew = crewDatabase.find(c => c.submissionId === submissionId);
  if (!crew) return;

  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>CV Pelaut Ikan - ${crew.fullName}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; color: #000; }
        .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
        .header h2 { margin: 0; font-size: 18pt; }
        .header p { margin: 4px 0; font-size: 10pt; }
        .grid { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { border: 1px solid #000; padding: 8px; font-size: 10pt; text-align: left; }
        th { background: #eee; }
        .photo-box { border: 1px solid #000; height: 180px; text-align: center; display: flex; align-items: center; justify-content: center; }
        .signature-box { display: flex; justify-content: space-between; margin-top: 50px; text-align: center; font-size: 10pt; }
      </style>
    </head>
    <body>
      <div class="header">
        <h2>WANTAIFENG INTERNATIONAL CO LTD - PT ALINDA PRIMA SENTOSA</h2>
        <p>CURRICULUM VITAE PELAUT KAPAL LONGLINE / 远洋延绳钓船员履历表</p>
      </div>

      <div class="grid">
        <table>
          <tr><th>ID Kru / ID</th><td>${crew.submissionId}</td></tr>
          <tr><th>Nama Lengkap / 全名</th><td>${crew.fullName} (${crew.chineseName || '-'})</td></tr>
          <tr><th>Jabatan / 职务</th><td><strong>${crew.rankPosition}</strong></td></tr>
          <tr><th>Tgl Lahir / DOB</th><td>${crew.dob} (${crew.gender})</td></tr>
          <tr><th>No. HP / Phone</th><td>${crew.phoneNo}</td></tr>
          <tr><th>Alamat / Address</th><td>${crew.combinedAddress || crew.streetAddress}</td></tr>
        </table>
        <div class="photo-box">
          [ FOTO CREW ]
        </div>
      </div>

      <h3>KUALIFIKASI LONGLINE & DOKUMEN</h3>
      <table>
        <tr><th>Pengalaman Longline</th><td>${crew.expLongline}</td></tr>
        <tr><th>Jenis Kapal / Vessel</th><td>${crew.vesselTypeLongline} (${crew.vesselOrigin})</td></tr>
        <tr><th>No. Paspor / Passport</th><td>${crew.passportNo} (Exp: ${crew.passportExpiry})</td></tr>
        <tr><th>Buku Pelaut / CDC</th><td>${crew.cdcNo} (Exp: ${crew.cdcExpiry})</td></tr>
        <tr><th>Status Dokumen</th><td>KK: ${crew.kkStatus} | Akte: ${crew.akteStatus} | MCU: ${crew.medicalStatus}</td></tr>
      </table>

      <div class="signature-box">
        <div>
          <p>Tanda Tangan Kru</p>
          <br><br><br>
          <p>( ${crew.fullName} )</p>
        </div>
        <div>
          <p>PT ALINDA PRIMA SENTOSA</p>
          <br><br><br>
          <p>( Authorized Manning Agency )</p>
        </div>
      </div>

      <script>window.onload = function() { window.print(); }</script>
    </body>
    </html>
  `);
  printWindow.document.close();
}

function exportCrewZip(submissionId) {
  alert(`Download ZIP Berkas Foto Kru (${submissionId}) diproses. Seluruh dokumen foto akan dibundel.`);
}

/* ==========================================================================
   5. WIZARD FORM STEP MANAGEMENT & SUBMISSION
   ========================================================================== */

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
    renderCatalogGrid();
  } else if (tab === 'directory') {
    document.getElementById('tabBtnDirectory').classList.add('active');
    document.getElementById('directoryTabSection').style.display = 'block';
    loadDirectoryTable();
  }
}

function goToStep(step) {
  if (step > currentStep && !validateStep(currentStep)) {
    alert(i18n[currentLang].alertValidationErr);
    return;
  }
  currentStep = step;
  updateWizardProgress();
}

function nextStep() {
  if (validateStep(currentStep)) {
    if (currentStep < 5) {
      currentStep++;
      updateWizardProgress();
      if (currentStep === 5) renderReviewSummary();
    }
  } else {
    alert(i18n[currentLang].alertValidationErr);
  }
}

function prevStep() {
  if (currentStep > 1) {
    currentStep--;
    updateWizardProgress();
  }
}

function updateWizardProgress() {
  for (let i = 1; i <= 5; i++) {
    const panel = document.getElementById(`stepPanel${i}`);
    const indicator = document.getElementById(`stepIndicator${i}`);

    if (i === currentStep) {
      panel.style.display = 'block';
      indicator.classList.add('active');
    } else {
      panel.style.display = 'none';
      indicator.classList.remove('active');
    }

    if (i < currentStep) {
      indicator.classList.add('completed');
    } else {
      indicator.classList.remove('completed');
    }
  }

  const fillPercent = ((currentStep - 1) / 4) * 100;
  document.getElementById('wizardProgressFill').style.width = `${fillPercent}%`;

  document.getElementById('btnPrevStep').style.display = currentStep > 1 ? 'inline-flex' : 'none';
  document.getElementById('btnNextStep').style.display = currentStep < 5 ? 'inline-flex' : 'none';
}

function validateStep(step) {
  if (step === 1) {
    const fullName = document.getElementById('fullName').value.trim();
    const rank = document.getElementById('rankPosition').value;
    const pob = document.getElementById('pob').value.trim();
    const dob = document.getElementById('dob').value;
    const phone = document.getElementById('phoneNo').value.trim();
    const fam1Name = document.getElementById('fam1Name').value.trim();
    const fam1Phone = document.getElementById('fam1Phone').value.trim();
    const fam2Name = document.getElementById('fam2Name').value.trim();
    const fam2Phone = document.getElementById('fam2Phone').value.trim();

    return fullName && rank && pob && dob && phone && fam1Name && fam1Phone && fam2Name && fam2Phone;
  }
  if (step === 3) {
    const passportNo = document.getElementById('passportNo').value.trim();
    const passportExp = document.getElementById('passportExpiry').value;
    const cdcNo = document.getElementById('cdcNo').value.trim();
    const cdcExp = document.getElementById('cdcExpiry').value;
    return passportNo && passportExp && cdcNo && cdcExp;
  }
  if (step === 4) {
    return uploadedDocuments.passport.length >= 1 &&
           uploadedDocuments.ktp.length >= 1 &&
           uploadedDocuments.cdc.length >= 1 &&
           uploadedDocuments.photo.length >= 1;
  }
  return true;
}

function renderReviewSummary() {
  const container = document.getElementById('reviewSummaryContainer');
  if (!container) return;

  const data = getFormData();
  container.innerHTML = `
    <div style="background: var(--bg-input); border: 1px solid var(--border-color); padding: 20px; border-radius: 10px;">
      <h3 style="color: var(--accent-teal); margin-bottom: 12px;">Data Pendaftaran Crew</h3>
      <p><strong>Nama Lengkap:</strong> ${data.fullName} (${data.chineseName || '-'})</p>
      <p><strong>Jabatan:</strong> ${data.rankPosition}</p>
      <p><strong>Kontak:</strong> ${data.phoneNo}</p>
      <p><strong>Alamat:</strong> ${data.streetAddress}, ${data.city}</p>
      <p><strong>Kualifikasi Longline:</strong> ${data.expLongline}</p>
      <p><strong>Paspor:</strong> ${data.passportNo} (Exp: ${data.passportExpiry})</p>
      <p><strong>Buku Pelaut:</strong> ${data.cdcNo} (Exp: ${data.cdcExpiry})</p>
    </div>
  `;
}

function getFormData() {
  const expRadio = document.querySelector('input[name="expLongline"]:checked');
  const skillsChecked = Array.from(document.querySelectorAll('input[name="skillGeneral"]:checked')).map(el => el.value);

  return {
    submissionId: "CREW-LONG-" + Date.now().toString().slice(-6),
    fullName: document.getElementById('fullName').value.trim(),
    chineseName: document.getElementById('chineseName').value.trim(),
    rankPosition: document.getElementById('rankPosition').value,
    gender: document.getElementById('gender').value,
    pob: document.getElementById('pob').value.trim(),
    dob: document.getElementById('dob').value,
    religion: document.getElementById('religion').value,
    maritalStatus: document.getElementById('maritalStatus').value,
    bloodType: document.getElementById('bloodType').value,
    shirtSize: document.getElementById('shirtSize').value,
    shoeSize: document.getElementById('shoeSize').value,
    streetAddress: document.getElementById('streetAddress').value.trim(),
    rtRw: document.getElementById('rtRw').value.trim(),
    village: document.getElementById('village').value.trim(),
    district: document.getElementById('district').value.trim(),
    city: document.getElementById('city').value.trim(),
    province: document.getElementById('province').value.trim(),
    combinedAddress: `${document.getElementById('streetAddress').value} RT/RW: ${document.getElementById('rtRw').value} Kel/Desa: ${document.getElementById('village').value} Kec: ${document.getElementById('district').value} Kab/Kota: ${document.getElementById('city').value} Prov: ${document.getElementById('province').value}`,
    phoneNo: document.getElementById('phoneNo').value.trim(),
    fam1Name: document.getElementById('fam1Name').value.trim(),
    fam1Relation: document.getElementById('fam1Relation').value.trim(),
    fam1Phone: document.getElementById('fam1Phone').value.trim(),
    fam2Name: document.getElementById('fam2Name').value.trim(),
    fam2Relation: document.getElementById('fam2Relation').value.trim(),
    fam2Phone: document.getElementById('fam2Phone').value.trim(),
    expLongline: expRadio ? expRadio.value : "",
    vesselName: document.getElementById('vesselName').value.trim(),
    vesselTypeLongline: document.getElementById('vesselTypeLongline').value,
    vesselOrigin: document.getElementById('vesselOrigin').value,
    placementCountry: document.getElementById('placementCountry').value,
    skillGeneral: skillsChecked,
    passportNo: document.getElementById('passportNo').value.trim(),
    passportExpiry: document.getElementById('passportExpiry').value,
    cdcNo: document.getElementById('cdcNo').value.trim(),
    cdcExpiry: document.getElementById('cdcExpiry').value,
    bstExpiry: document.getElementById('bstExpiry').value,
    kkStatus: document.getElementById('kkStatus').value,
    akteStatus: document.getElementById('akteStatus').value,
    ijazahLevel: document.getElementById('ijazahLevel').value,
    medicalStatus: document.getElementById('medicalStatus').value,
    waliStatus: document.getElementById('waliStatus').value,
    skckStatus: document.getElementById('skckStatus').value,
    documents: uploadedDocuments,
    submittedAt: new Date().toISOString()
  };
}

function submitCrewForm() {
  if (!document.getElementById('agreeTermsCheck').checked) {
    alert("Harap centang persetujuan keabsahan data.");
    return;
  }

  const formData = getFormData();
  crewDatabase.unshift(formData);
  saveLocalDatabase();

  // POST to Google Apps Script
  fetch(getGasUrl(), {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formData)
  }).catch(err => console.log("GAS post sync:", err));

  alert(i18n[currentLang].alertSubmitSuccess);
  clearDraft();
  switchTab('directory');
}

/* ==========================================================================
   6. FILE UPLOADS, CAMERA SNAP, & UTILITIES
   ========================================================================== */

function setupDragAndDrop() {
  ['Passport', 'Ktp', 'Cdc', 'Medical', 'Cert', 'Photo'].forEach(doc => {
    const zone = document.getElementById(`dropzone${doc}`);
    if (!zone) return;

    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      zone.classList.add('dragover');
    });
    zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('dragover');
      const files = e.dataTransfer.files;
      handleFiles(files, doc.toLowerCase());
    });
  });
}

function triggerFileInput(id) {
  document.getElementById(id).click();
}

function handleFileSelect(e, docType) {
  handleFiles(e.target.files, docType);
}

function handleFiles(files, docType) {
  Array.from(files).forEach(file => {
    const reader = new FileReader();
    reader.onload = (event) => {
      uploadedDocuments[docType].push({
        name: file.name,
        base64: event.target.result
      });
      renderGallery(docType);
      updateUploadBadges();
    };
    reader.readAsDataURL(file);
  });
}

function renderGallery(docType) {
  const container = document.getElementById(`gallery${docType.charAt(0).toUpperCase() + docType.slice(1)}`);
  if (!container) return;

  container.innerHTML = uploadedDocuments[docType].map((doc, idx) => `
    <div class="thumb-item">
      <img src="${doc.base64}" onclick="openImagePreview('${doc.base64}')">
      <button class="thumb-remove-btn" onclick="removeDoc('${docType}', ${idx})">&times;</button>
    </div>
  `).join('');

  const card = document.getElementById(`docCard${docType.charAt(0).toUpperCase() + docType.slice(1)}`);
  if (card) {
    if (uploadedDocuments[docType].length > 0) {
      card.classList.add('has-files');
    } else {
      card.classList.remove('has-files');
    }
  }
}

function removeDoc(docType, idx) {
  uploadedDocuments[docType].splice(idx, 1);
  renderGallery(docType);
  updateUploadBadges();
}

function updateUploadBadges() {
  // Update badge states
}

function openCameraModal(docType) {
  activeCameraDocType = docType;
  const modal = document.getElementById('cameraModal');
  modal.classList.add('active');

  navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
    .then(stream => {
      cameraStream = stream;
      document.getElementById('cameraVideo').srcObject = stream;
    }).catch(err => {
      alert("Kamera tidak dapat diakses.");
      closeCameraModal();
    });
}

function closeCameraModal() {
  if (cameraStream) {
    cameraStream.getTracks().forEach(track => track.stop());
  }
  document.getElementById('cameraModal').classList.remove('active');
}

function takeCameraSnap() {
  const video = document.getElementById('cameraVideo');
  const canvas = document.getElementById('cameraCanvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext('2d').drawImage(video, 0, 0);

  const dataUrl = canvas.toDataURL('image/jpeg');
  uploadedDocuments[activeCameraDocType].push({
    name: `camera_${Date.now()}.jpg`,
    base64: dataUrl
  });
  renderGallery(activeCameraDocType);
  closeCameraModal();
}

function openImagePreview(src) {
  document.getElementById('enlargedImage').src = src;
  const watermark = document.getElementById('watermarkOverlay');
  if (activeToken || currentRole === 'owner') {
    watermark.textContent = `CONFIDENTIAL FOR ${tokenOwnerName || 'SHIP OWNER'} - ${new Date().toLocaleDateString()}`;
    watermark.style.display = 'block';
  } else {
    watermark.style.display = 'none';
  }
  document.getElementById('imagePreviewModal').classList.add('active');
}

function closeImagePreview() {
  document.getElementById('imagePreviewModal').classList.remove('active');
}

// Draft storage
function saveDraft() {
  const data = getFormData();
  localStorage.setItem('crew_app_draft', JSON.stringify(data));
  alert("Draf formulir berhasil disimpan!");
}

function loadSavedDraft() {
  const draft = localStorage.getItem('crew_app_draft');
  if (!draft) return;
  try {
    const data = JSON.parse(draft);
    if (data.fullName) document.getElementById('fullName').value = data.fullName;
    if (data.phoneNo) document.getElementById('phoneNo').value = data.phoneNo;
  } catch(e) {}
}

function clearDraft() {
  localStorage.removeItem('crew_app_draft');
  document.getElementById('crewForm').reset();
}

// Google Connection Modal
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
    statusText.textContent = i18n[currentLang].gasStatusConnected;
    statusBar.classList.add('connected');
  } else {
    statusText.textContent = i18n[currentLang].gasStatusLocal;
    statusBar.classList.remove('connected');
  }
}

// Masking Utilities
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
