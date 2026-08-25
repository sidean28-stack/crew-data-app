// js/admin.js

function deduplicateLocalCrewDatabase() {
  if (!Array.isArray(window.crewDatabase)) return;
  const seen = new Set();
  const clean = [];
  window.crewDatabase.forEach((crew, idx) => {
    if (!crew || typeof crew !== 'object') return;
    const key = (crew.submissionId || crew.passportNo || crew.cdcNo || crew.fullName || ('crew_' + idx)).toString().trim().toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      clean.push(crew);
    }
  });
  window.crewDatabase = clean;
  if (typeof saveLocalDatabase === 'function') saveLocalDatabase();
}

function loadDirectoryTable() {
  deduplicateLocalCrewDatabase();
  const tbody = document.getElementById('directoryTableBody');
  const countText = document.getElementById('totalCrewCountText');
  if (!tbody) return;

  const searchQuery = (document.getElementById('dirSearchInput')?.value || '').trim().toLowerCase();
  const filterRank = document.getElementById('dirFilterRank')?.value || '';
  const filterVesselName = document.getElementById('dirFilterVesselName')?.value || '';
  const filterStatus = document.getElementById('dirFilterStatus')?.value || '';

  const matcher = window.matchFilterValue || matchFilterValue;

  const filtered = window.crewDatabase.filter(crew => {
    const matchesSearch = !searchQuery || 
      (crew.fullName || "").toLowerCase().includes(searchQuery) ||
      (crew.chineseName || "").toLowerCase().includes(searchQuery) ||
      (crew.submissionId || "").toLowerCase().includes(searchQuery) ||
      (crew.rankPosition || "").toLowerCase().includes(searchQuery) ||
      (crew.passportNo || "").toLowerCase().includes(searchQuery) ||
      (crew.cdcNo || "").toLowerCase().includes(searchQuery) ||
      (crew.vesselName || "").toLowerCase().includes(searchQuery) ||
      (crew.phoneNo || "").toLowerCase().includes(searchQuery);

    const matchesRank = matcher(crew.rankPosition, filterRank);

    const matchesVesselName = !filterVesselName || 
      matcher(crew.vesselName, filterVesselName) || 
      matcher(crew.vesselAssigned, filterVesselName) || 
      matcher(crew.vesselCandidate, filterVesselName);

    let matchesStatus = true;
    if (filterStatus) {
      const opStatus = String(crew.operationalStatus || crew.status || 'STAND_BY').toUpperCase();
      const selStatus = String(crew.ownerReview?.status || '').toUpperCase();
      if (filterStatus === 'ON_BOAT_SELECTED') {
        matchesStatus = opStatus === 'ON_BOAT' || opStatus === 'SELECTED' || selStatus === 'SELECTED';
      } else {
        matchesStatus = opStatus === filterStatus || (filterStatus === 'SELECTED' && selStatus === 'SELECTED');
      }
    }

    return matchesSearch && matchesRank && matchesVesselName && matchesStatus;
  });

  if (countText) countText.textContent = filtered.length;

  if (filtered.length === 0) {
    const msg = searchQuery 
      ? `Data kru tidak ditemukan untuk kata pencarian "${escapeHTML(searchQuery)}". Hapus kata kunci untuk menampilkan semua kru (${window.crewDatabase.length} kru terdaftar).` 
      : 'Belum ada data kru terdaftar.';
    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 30px; color: var(--text-muted);">${msg}</td></tr>`;
    return;
  }

  const savedRole = sessionStorage.getItem('auth_role');
  const authUser = sessionStorage.getItem('auth_user');
  const isUnmasked = (
    window.currentRole === 'admin' || 
    window.currentRole === 'superadmin' || 
    savedRole === 'admin' || 
    savedRole === 'superadmin' || 
    !!authUser || 
    window.activeToken !== null
  );

  tbody.innerHTML = filtered.map(crew => {
    const displayName = isUnmasked ? crew.fullName : maskName(crew.fullName);
    const displayPhone = isUnmasked ? crew.phoneNo : maskString(crew.phoneNo, 4);
    const expiryStatus = getDocExpiryStatus(crew);
    let currentStatus = crew.operationalStatus || crew.status || 'STAND_BY';
    
    // Status Badge Styling based on Operational Status
    let statusBadgeHtml = '<span class="status-badge" style="color: var(--status-success); font-weight: bold;">🟢 Stand By</span>';
    if (currentStatus === 'ON_BOAT') statusBadgeHtml = '<span class="status-badge" style="color: #0284c7; font-weight: bold;">🔵 On Boat</span>';
    if (currentStatus === 'SELECTED' || currentStatus === 'PRIORITY') statusBadgeHtml = '<span class="status-badge" style="color: #8b5cf6; font-weight: bold;">🟣 Terpilih</span>';
    if (currentStatus === 'BLACKLIST') statusBadgeHtml = '<span class="status-badge" style="color: #dc2626; font-weight: bold; background: #fee2e2; padding: 2px 6px; border-radius: 4px;">🔴 Blacklist</span>';
    if (currentStatus === 'REJECTED') statusBadgeHtml = '<span class="status-badge" style="color: var(--status-error);">🔴 Ditolak</span>';

    return `
      <tr>
        <td><strong>${escapeHTML(crew.submissionId)}</strong></td>
        <td class="crew-name-cell" style="cursor: pointer;" onclick="openCrewDetailModal('${escapeHTML(crew.submissionId)}')" title="Klik untuk Lihat Detail & Status">
          <strong style="color: var(--primary); text-decoration: underline;">${escapeHTML(displayName)}</strong>
          ${crew.chineseName ? `<br><small style="color: var(--accent-teal);">${escapeHTML(crew.chineseName)}</small>` : ''}
        </td>
        <td><span class="rank-badge">${escapeHTML(crew.rankPosition)}</span></td>
        <td style="font-size: 0.82rem; color: var(--accent-amber);">${escapeHTML(crew.expLongline || '-')}</td>
        <td>${escapeHTML(displayPhone)}</td>
        <td><span class="${escapeHTML(expiryStatus.badgeClass)}">${escapeHTML(expiryStatus.text)}</span></td>
        <td>${statusBadgeHtml}</td>
        <td>
          <div style="display: flex; gap: 4px; flex-wrap: wrap;">
            <button class="btn-primary" style="padding: 4px 8px; font-size: 0.78rem;" onclick="openCrewDetailModal('${escapeHTML(crew.submissionId)}')" title="Detail Per Crew & Status">
              <i class="fa-solid fa-user-gear"></i> Detail
            </button>
            <button class="btn-secondary" style="padding: 4px 8px; font-size: 0.78rem;" onclick="printCrewCV('${escapeHTML(crew.submissionId)}')" title="Cetak CV">
              <i class="fa-solid fa-print"></i>
            </button>
            <button class="btn-secondary" style="padding: 4px 8px; font-size: 0.78rem; color: var(--accent-amber);" onclick="editCrew('${escapeHTML(crew.submissionId)}')" title="Edit Data Kru">
              <i class="fa-solid fa-pen"></i>
            </button>
            ${(window.currentRole === 'admin' || window.currentRole === 'superadmin') ? `
              <button class="btn-secondary" style="padding: 4px 8px; font-size: 0.78rem; color: var(--status-error);" onclick="openDeleteModal('${escapeHTML(crew.submissionId)}')" title="Hapus Data Kru">
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
  if (!crew.passportExpiry) return { text: "-", badgeClass: "badge-expiry-yellow" };
  const expDate = new Date(crew.passportExpiry);
  const diffDays = Math.ceil((expDate - new Date()) / (1000 * 60 * 60 * 24));
  const displayDate = typeof formatDisplayDate === 'function' ? formatDisplayDate(crew.passportExpiry) : crew.passportExpiry;
  if (diffDays < 90) return { text: displayDate, badgeClass: "badge-expiry-red" };
  if (diffDays < 180) return { text: displayDate, badgeClass: "badge-expiry-yellow" };
  return { text: displayDate, badgeClass: "badge-expiry-green" };
}

function openOneTimeLinkModal() { document.getElementById('otlModal').classList.add('active'); }
function closeOneTimeLinkModal() { document.getElementById('otlModal').classList.remove('active'); }

function generateOtlLink() {
  const ownerName = document.getElementById('otlOwnerName').value.trim();
  if (!ownerName) { alert("Harap masukkan nama Owner Kapal!"); return; }
  const tokenStr = "OTL-" + Math.random().toString(36).substring(2, 10).toUpperCase();
  const currentUrl = window.location.href.split('?')[0];
  const generatedUrl = `${currentUrl}?role=owner&token=${tokenStr}&owner=${encodeURIComponent(ownerName)}`;
  document.getElementById('otlResultUrl').value = generatedUrl;
  document.getElementById('otlResultBox').style.display = 'block';
}

function copyOtlUrl() {
  const input = document.getElementById('otlResultUrl');
  input.select(); document.execCommand('copy');
  alert(i18n[window.currentLang].copiedLinkAlert);
}

function openDeleteModal(submissionId) {
  document.getElementById('deleteTargetId').value = submissionId;
  document.getElementById('deleteConfirmModal').classList.add('active');
}
function closeDeleteModal() { document.getElementById('deleteConfirmModal').classList.remove('active'); }

async function executeDeleteCrew() {
  const submissionId = document.getElementById('deleteTargetId').value;
  const crew = window.crewDatabase.find(c => c.submissionId === submissionId);
  if (!crew || !window.api || typeof window.api.deleteCrew !== 'function') {
    alert('Data kru atau koneksi backend tidak tersedia.');
    return;
  }

  const deleteButton = document.getElementById('confirmDeleteCrewButton');
  if (deleteButton) deleteButton.disabled = true;

  try {
    await window.api.deleteCrew({ submissionId: submissionId });
    const cloudSynced = await window.api.syncNow();
    if (!cloudSynced || window.crewDatabase.some(item => item.submissionId === submissionId)) {
      throw new Error('Penghapusan belum terkonfirmasi pada snapshot cloud.');
    }

    loadDirectoryTable();
    if (typeof renderCatalogGrid === 'function') renderCatalogGrid();
    alert("Data kru berhasil dihapus!");
    closeDeleteModal();
  } catch (error) {
    console.error('Delete crew failed:', error);
    alert('Gagal menghapus data kru dari backend. Data lokal tidak diubah.');
  } finally {
    if (deleteButton) deleteButton.disabled = false;
  }
}

function populateAddressFieldsForEdit(crew) {
  const streetInput = document.getElementById('streetAddress');
  const rtRwInput = document.getElementById('rtRw');
  const villageInput = document.getElementById('village');
  const districtInput = document.getElementById('district');
  const cityInput = document.getElementById('city');
  const provinceInput = document.getElementById('province');

  let street = crew.streetAddress || '';
  let rtRw = crew.rtRw || '';
  let village = crew.village || '';
  let district = crew.district || '';
  let city = crew.city || '';
  let province = crew.province || '';

  const combined = (crew.combinedAddress || '').trim();

  if ((!street || street === '') && combined !== '') {
    let remaining = combined;

    if (remaining.includes(' Prov: ')) {
      const parts = remaining.split(' Prov: ');
      province = parts[1].trim();
      remaining = parts[0];
    }
    if (remaining.includes(' Kab/Kota: ')) {
      const parts = remaining.split(' Kab/Kota: ');
      city = parts[1].trim();
      remaining = parts[0];
    }
    if (remaining.includes(' Kec: ')) {
      const parts = remaining.split(' Kec: ');
      district = parts[1].trim();
      remaining = parts[0];
    }
    if (remaining.includes(' Kel/Desa: ')) {
      const parts = remaining.split(' Kel/Desa: ');
      village = parts[1].trim();
      remaining = parts[0];
    }
    if (remaining.includes(' RT/RW: ')) {
      const parts = remaining.split(' RT/RW: ');
      rtRw = parts[1].trim();
      remaining = parts[0];
    }

    street = remaining.trim() || combined;
  }

  if (streetInput) streetInput.value = street;
  if (rtRwInput) rtRwInput.value = rtRw;
  if (villageInput) villageInput.value = village;
  if (districtInput) districtInput.value = district;
  if (cityInput) cityInput.value = city;
  if (provinceInput) provinceInput.value = province;
}

function formatDateForInput(dateValue) {
  if (!dateValue) return '';
  const directMatch = String(dateValue).match(/^(\d{4}-\d{2}-\d{2})/);
  if (directMatch) return directMatch[1];

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function editCrew(submissionId) {
  const crew = window.crewDatabase.find(c => c.submissionId === submissionId);
  if (!crew) return;

  window.editingSubmissionId = submissionId;
  if (typeof switchTab === 'function') switchTab('form');

  const fields = ['fullName', 'chineseName', 'rankPosition', 'gender', 'pob', 'dob', 'religion', 'maritalStatus', 'bloodType', 'shirtSize', 'shoeSize', 'streetAddress', 'rtRw', 'village', 'district', 'city', 'province', 'phoneNo', 'fam1Name', 'fam1Relation', 'fam1Phone', 'fam2Name', 'fam2Relation', 'fam2Phone', 'vesselName1', 'signOnOff1', 'placementCountry1', 'vesselName2', 'signOnOff2', 'placementCountry2', 'vesselName3', 'signOnOff3', 'placementCountry3', 'vesselName', 'vesselTypeLongline', 'vesselOrigin', 'placementCountry', 'passportNo', 'passportExpiry', 'cdcNo', 'cdcExpiry', 'bstExpiry', 'kkStatus', 'akteStatus', 'ijazahLevel', 'medicalStatus', 'waliStatus', 'skckStatus', 'heightCm', 'weightKg'];

  fields.forEach(id => {
    const el = document.getElementById(id);
    if (el && crew[id] !== undefined && crew[id] !== null) {
      if (el.type === 'date') {
        el.value = typeof formatDateForInput === 'function' ? formatDateForInput(crew[id]) : crew[id];
      } else {
        el.value = crew[id];
      }
    }
  });

  const vesselEntries = String(crew.vesselName || '').split('|').map(value => value.trim()).filter(Boolean);
  const placementEntries = String(crew.placementCountry || '').split('|').map(value => value.trim()).filter(Boolean);
  vesselEntries.slice(0, 3).forEach((value, index) => {
    const number = index + 1;
    const withoutNumber = value.replace(/^\d+\.\s*/, '');
    const periodMatch = withoutNumber.match(/\(([^()]*)\)\s*$/);
    const vesselInput = document.getElementById(`vesselName${number}`);
    const periodInput = document.getElementById(`signOnOff${number}`);
    if (vesselInput) vesselInput.value = withoutNumber.replace(/\s*\([^()]*\)\s*$/, '').trim();
    if (periodInput && periodMatch) periodInput.value = periodMatch[1].trim();
  });
  placementEntries.slice(0, 3).forEach((value, index) => {
    const placementInput = document.getElementById(`placementCountry${index + 1}`);
    if (placementInput) placementInput.value = value.replace(/^\d+\.\s*/, '').trim().replace(/^-$|^–$/, '');
  });

  // Presisi Alamat (BUG 2 Fix)
  populateAddressFieldsForEdit(crew);

  const expRadios = document.getElementsByName('expLongline');
  for (let i = 0; i < expRadios.length; i++) {
    if (expRadios[i].value === crew.expLongline) {
      expRadios[i].checked = true;
      break;
    }
  }

  const skillCheckboxes = document.getElementsByName('skillGeneral');
  const skills = Array.isArray(crew.skillGeneral) ? crew.skillGeneral : (crew.skillGeneral ? crew.skillGeneral.split(',').map(s => s.trim()) : []);
  for (let i = 0; i < skillCheckboxes.length; i++) {
    skillCheckboxes[i].checked = skills.includes(skillCheckboxes[i].value);
  }

  // Presisi Berkas Upload Gambar (BUG 4 Fix)
  if (crew.documents) {
    window.uploadedDocuments = {
      passport: [], ktp: [], cdc: [], photo: [], medical: [], cert: [], bst: [], skck: [], kk: [], akte: []
    };

    Object.keys(crew.documents).forEach(dk => {
      const list = crew.documents[dk];
      if (Array.isArray(list)) {
        window.uploadedDocuments[dk] = list.map(item => {
          if (typeof item === 'string') {
            return { name: dk.toUpperCase() + ' File', url: item, base64: '' };
          } else if (item && typeof item === 'object') {
            const sourceUrl = item.url || item.link ||
              (typeof item.base64 === 'string' && !item.base64.startsWith('data:') ? item.base64 : '');
            const base64 = typeof item.base64 === 'string' && item.base64.startsWith('data:')
              ? item.base64
              : '';
            return {
              name: item.name || (dk.toUpperCase() + ' File'),
              url: sourceUrl,
              base64: base64
            };
          }
          return null;
        }).filter(Boolean);
      }
    });

    ['passport', 'ktp', 'cdc', 'photo', 'medical', 'cert'].forEach(dt => {
      if (typeof renderGallery === 'function') renderGallery(dt);
    });
  }

  // Reset wizard ke Step 1 & Update UI
  window.currentStep = 1;
  if (typeof updateWizardProgress === 'function') updateWizardProgress();

  const btn = document.querySelector('.btn-submit');
  if (btn) btn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> UPDATE DATA KRU';

  // Mode Edit Banner (BUG 3 Fix)
  let banner = document.getElementById('editModeBanner');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'editModeBanner';
    banner.style.cssText = 'background: #fef3c7; color: #92400e; padding: 12px 16px; border-radius: 8px; font-weight: 600; margin-bottom: 16px; border-left: 4px solid #f59e0b; display: flex; justify-content: space-between; align-items: center;';
    const formCard = document.querySelector('#formTabSection .form-card');
    if (formCard) formCard.prepend(banner);
  }
  if (banner) {
    banner.style.display = 'flex';
    banner.innerHTML = `
      <span><i class="fa-solid fa-pen-to-square"></i> <strong>Mode Edit Admin Aktif (ID: ${crew.submissionId})</strong> — Anda bebas mengubah data di Step 1 - Step 5 tanpa batasan.</span>
      <button onclick="cancelEditMode()" style="background: transparent; border: none; color: #92400e; font-size: 1.1rem; cursor: pointer; font-weight: bold;">&times;</button>
    `;
  }

  window.scrollTo(0, 0);
}

function cancelEditMode() {
  window.editingSubmissionId = null;
  const banner = document.getElementById('editModeBanner');
  if (banner) banner.style.display = 'none';
  const btn = document.querySelector('.btn-submit');
  if (btn) btn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> SUBMIT DATA CREW';
  if (typeof clearDraft === 'function') clearDraft();
  if (typeof switchTab === 'function') switchTab('directory');
}

let pendingExcelData = [];

function normalizeCrewIdentifier(value) {
  return String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function normalizeCrewName(value) {
  return String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
}

function normalizeCrewDob(value) {
  const v = String(value || '').trim();
  if (!v) return '';
  const d = new Date(v);
  if (!isNaN(d.getTime())) return UtilitiesCrewDateKey(d);
  return v.replace(/[^0-9]/g, '');
}

function UtilitiesCrewDateKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function extractKtpFromCrew(crew) {
  const text = String(crew.adminNotes || crew.ktpNo || '').trim();
  const m = text.match(/(?:KTP|NIK)\s*[:=]?\s*([0-9]{10,20})/i);
  return m ? normalizeCrewIdentifier(m[1]) : normalizeCrewIdentifier(crew.ktpNo || '');
}

function findCrewIdentityMatch(crewData) {
  const db = Array.isArray(window.crewDatabase) ? window.crewDatabase : [];
  const sid = String(crewData.submissionId || '').trim();
  const passport = normalizeCrewIdentifier(crewData.passportNo);
  const cdc = normalizeCrewIdentifier(crewData.cdcNo);
  const ktp = extractKtpFromCrew(crewData);
  const name = normalizeCrewName(crewData.fullName);
  const dob = normalizeCrewDob(crewData.dob);

  if (sid) {
    const exactId = db.find(c => String(c.submissionId || '').trim() === sid);
    if (exactId) return { type: 'CREW_ID', crew: exactId };
  }

  const strong = [];
  db.forEach(c => {
    const matches = [];
    if (passport && normalizeCrewIdentifier(c.passportNo) === passport) matches.push('PASSPORT');
    if (cdc && normalizeCrewIdentifier(c.cdcNo) === cdc) matches.push('SEAMAN_BOOK');
    if (ktp && extractKtpFromCrew(c) === ktp) matches.push('NIK_KTP');
    if (matches.length) strong.push({ crew: c, matches });
  });

  const uniqueStrong = [];
  strong.forEach(x => {
    if (!uniqueStrong.some(y => y.crew.submissionId === x.crew.submissionId)) uniqueStrong.push(x);
  });

  if (uniqueStrong.length === 1) {
    return { type: uniqueStrong[0].matches.join('+'), crew: uniqueStrong[0].crew };
  }
  if (uniqueStrong.length > 1) {
    return { type: 'CONFLICT_STRONG_IDENTIFIERS', candidates: uniqueStrong };
  }

  if (name && dob) {
    const samePerson = db.filter(c => normalizeCrewName(c.fullName) === name && normalizeCrewDob(c.dob) === dob);
    if (samePerson.length === 1) return { type: 'NAME+DOB', crew: samePerson[0] };
    if (samePerson.length > 1) return { type: 'CONFLICT_NAME_DOB', candidates: samePerson.map(c => ({ crew: c, matches: ['NAME+DOB'] })) };
  }

  return null;
}

let currentPreviewFilter = 'ALL';

function filterPreviewTab(filter) {
  currentPreviewFilter = filter || 'ALL';
  ['All', 'Update', 'Rejoin', 'Append', 'Hold'].forEach(f => {
    const btn = document.getElementById('btnFilter' + f);
    if (btn) btn.classList.toggle('active', f.toUpperCase() === currentPreviewFilter);
  });
  renderExcelPreviewTable(currentPreviewFilter);
}

function renderExcelPreviewTable(filter = 'ALL') {
  const tbody = document.getElementById('excelPreviewTbody');
  const noticeBox = document.getElementById('excelHoldNotice');
  if (!tbody) return;

  const data = Array.isArray(window.pendingExcelData) ? window.pendingExcelData : [];
  
  let countUpdate = 0;
  let countRejoin = 0;
  let countAppend = 0;
  let countHold = 0;

  data.forEach(item => {
    const act = (item._importAction || 'APPEND').toUpperCase();
    if (act === 'UPDATE') countUpdate++;
    else if (act === 'REJOIN') countRejoin++;
    else if (act === 'APPEND') countAppend++;
    else if (act === 'HOLD') countHold++;
  });

  const elAll = document.getElementById('cntAll');
  const elUpdate = document.getElementById('cntUpdate');
  const elRejoin = document.getElementById('cntRejoin');
  const elAppend = document.getElementById('cntAppend');
  const elHold = document.getElementById('cntHold');

  if (elAll) elAll.textContent = data.length;
  if (elUpdate) elUpdate.textContent = countUpdate;
  if (elRejoin) elRejoin.textContent = countRejoin;
  if (elAppend) elAppend.textContent = countAppend;
  if (elHold) elHold.textContent = countHold;

  if (noticeBox) {
    noticeBox.style.display = countHold > 0 ? 'block' : 'none';
  }

  const filtered = data.filter(item => {
    if (filter === 'ALL') return true;
    return (item._importAction || 'APPEND').toUpperCase() === filter;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 18px; color: var(--text-muted);">Tidak ada data kru untuk kategori filter '${filter}'.</td></tr>`;
    return;
  }

  let html = '';
  filtered.forEach((item, idx) => {
    const action = (item._importAction || 'APPEND').toUpperCase();
    let badgeClass = 'badge-import-append';
    if (action === 'UPDATE') badgeClass = 'badge-import-update';
    else if (action === 'REJOIN') badgeClass = 'badge-import-rejoin';
    else if (action === 'HOLD') badgeClass = 'badge-import-hold';

    const docStr = (item.passportNo ? `Pass: ${escapeHTML(item.passportNo)}` : '') + 
                   (item.cdcNo ? (item.passportNo ? ' | ' : '') + `CDC: ${escapeHTML(item.cdcNo)}` : '') || '-';
    
    const crewId = item._existingId || item.submissionId || '-';

    html += `
      <tr style="border-bottom: 1px solid var(--border-color);">
        <td style="text-align: center; font-size: 0.8rem; color: var(--text-muted); padding: 6px 8px;">${idx + 1}</td>
        <td style="font-weight: 600; padding: 6px 8px;">${escapeHTML(item.fullName || '-')}</td>
        <td style="font-family: monospace; font-size: 0.78rem; padding: 6px 8px; color: var(--accent);">${escapeHTML(crewId)}</td>
        <td style="font-size: 0.8rem; padding: 6px 8px; color: var(--text-muted);">${docStr}</td>
        <td style="text-align: center; padding: 6px 8px;"><span class="badge-import-action ${badgeClass}">${action}</span></td>
        <td style="font-size: 0.8rem; padding: 6px 8px; color: var(--text-muted);">${escapeHTML(item._matchReason || '-')}</td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
}

async function handleExcelImport(event) {
  const file = event.target.files[0];
  if (!file) return;

  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json(worksheet, { defval: "", raw: false, dateNF: "yyyy-mm-dd" });

  if (rows.length === 0) {
    if (typeof showNotification === 'function') showNotification('File Excel kosong atau format tidak valid.', 'warning');
    return;
  }

  const mapKey = (headerName) => {
    headerName = String(headerName || '').toLowerCase().replace(/\s+/g, ' ').trim();
    if (headerName.includes("nama mandarin") || headerName.includes("chinese name") || headerName.includes("中文姓名")) return "chineseName";
    if (headerName.includes("id submisi") || headerName === "id" || headerName.includes("crew id")) return "submissionId";
    if (headerName.includes("id pelaut") || headerName.includes("seafarer id") || headerName.includes("pelaut id")) return "pelautId";
    if (headerName.includes("nik") || headerName.includes("no ktp") || headerName.includes("nomor ktp") || headerName.includes("ktp")) return "ktpNo";
    if ((headerName.includes("nama lengkap") && !headerName.includes("keluarga")) || headerName.includes("full name")) return "fullName";
    if (headerName.includes("jabatan") || headerName.includes("posisi")) return "rankPosition";
    if (headerName.includes("tempat lahir") || headerName.includes("出生地")) return "pob";
    if (headerName.includes("tanggal lahir") || headerName.includes("出生日期")) return "dob";
    if (headerName.includes("jenis kelamin") || headerName.includes("性别")) return "gender";
    if (headerName.includes("agama") || headerName.includes("宗教")) return "religion";
    if (headerName.includes("status perkawinan") || headerName.includes("婚姻状况")) return "maritalStatus";
    if (headerName.includes("golongan darah") || headerName.includes("血型")) return "bloodType";
    if (headerName.includes("tinggi badan") || headerName.includes("tinggi (cm)") || headerName.includes("身高")) return "heightCm";
    if (headerName.includes("berat badan") || headerName.includes("berat (kg)") || headerName.includes("体重")) return "weightKg";
    if (headerName.includes("ukuran baju") || headerName.includes("服装尺寸")) return "shirtSize";
    if (headerName.includes("ukuran sepatu") || headerName.includes("鞋码")) return "shoeSize";
    if (headerName.includes("rt/rw") || headerName.includes("社区编号")) return "rtRw";
    if (headerName.includes("kelurahan") || headerName.includes("desa") || headerName.includes("村镇")) return "village";
    if (headerName.includes("kecamatan") || headerName === "区") return "district";
    if (headerName.includes("kabupaten") || headerName.includes("kota") || headerName.includes("市县")) return "city";
    if (headerName.includes("provinsi") || headerName === "省") return "province";
    if (headerName.includes("alamat jalan") || headerName.includes("street address") || headerName.includes("街道地址")) return "streetAddress";
    if (headerName.includes("keluarga 2") || headerName.includes("第二紧急联系人姓名")) {
      if (headerName.includes("nomor") || headerName.includes("telp") || headerName.includes("电话")) return "fam2Phone";
      if (headerName.includes("hubungan") || headerName.includes("关系")) return "fam2Relation";
      return "fam2Name";
    }
    if (headerName.includes("nama lengkap keluarga") || headerName.includes("家庭联系1")) return "fam1Name";
    if (headerName.includes("status dalam keluarga") || headerName.includes("家庭地位")) return "fam1Relation";
    if (headerName.includes("nomor telp / whatsapp aktif") || headerName.includes("有效手机号码")) return "fam1Phone";
    if (headerName.includes("nomor telp") || headerName.includes("nomor whatsapp") || headerName.includes("phone")) return "phoneNo";
    if (headerName.includes("exp longline") || headerName.includes("pengalaman longline")) return "expLongline";
    if (headerName.includes("nama kapal")) return "vesselName";
    if (headerName.includes("jenis kapal")) return "vesselTypeLongline";
    if (headerName.includes("asal kapal")) return "vesselOrigin";
    if (headerName.includes("penempatan") || headerName.includes("negara")) return "placementCountry";
    if (headerName.includes("skill")) return "skillGeneral";
    if (headerName.includes("status operasional") || headerName.includes("operational status")) return "operationalStatus";
    if (headerName.includes("kapal penempatan") || headerName.includes("vessel assigned")) return "vesselAssigned";
    if (headerName.includes("tgl terbang") || headerName.includes("flight date")) return "flightDate";
    if (headerName.includes("tgl finish") || headerName.includes("finish date")) return "finishDate";
    if (headerName.includes("riwayat status") || headerName.includes("history status")) return "historyStatus";
    if (headerName.includes("catatan admin") || headerName.includes("admin notes")) return "adminNotes";
    if (headerName.includes("paspor") || headerName.includes("passpor") || headerName.includes("passport")) {
      if (headerName.includes("expired") || headerName.includes("exp") || headerName.includes("masa berlaku") || headerName.includes("有效期") || headerName.includes("到期日")) return "passportExpiry";
      return "passportNo";
    }
    if (headerName.includes("seaman book") || headerName.includes("cdc") || headerName.includes("buku pelaut")) {
      if (headerName.includes("expired") || headerName.includes("exp") || headerName.includes("masa berlaku") || headerName.includes("有效期")) return "cdcExpiry";
      return "cdcNo";
    }
    if (headerName.includes("bst") && (headerName.includes("masa berlaku") || headerName.includes("expired") || headerName.includes("有效期"))) return "bstExpiry";
    if (headerName.includes("status kartu keluarga") || headerName.includes("户口簿状态")) return "kkStatus";
    if (headerName.includes("status akte") || headerName.includes("出生证明状态")) return "akteStatus";
    if (headerName.includes("status ijazah") || headerName.includes("学历证明状态")) return "ijazahLevel";
    if (headerName.includes("status medical") || headerName.includes("体检状态")) return "medicalStatus";
    if (headerName.includes("status surat izin wali") || headerName.includes("监护人同意书状态")) return "waliStatus";
    if (headerName.includes("status skck") || headerName.includes("无犯罪记录证明状态")) return "skckStatus";
    return null;
  };

  let totalParsed = 0;
  let updateCount = 0;
  let rejoinCount = 0;
  let newCount = 0;
  let conflictCount = 0;
  const pendingExcelData = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    let crewData = {};

    for (let key in row) {
      const mappedKey = mapKey(key);
      if (mappedKey && row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== '' && !crewData[mappedKey]) {
        crewData[mappedKey] = String(row[key]).trim();
      }
    }

    if (!crewData.submissionId) crewData.submissionId = "IMP-" + Date.now() + "-" + i;
    if (!crewData.fullName) continue;

    if (crewData.ktpNo && !crewData.adminNotes) crewData.adminNotes = "KTP: " + crewData.ktpNo;

    const match = findCrewIdentityMatch(crewData);
    if (match && match.crew) {
      const isFinishedOrResigned = (
        String(match.crew.operationalStatus || '').toUpperCase().includes('FINISHED') ||
        String(match.crew.operationalStatus || '').toUpperCase().includes('RESIGNED') ||
        String(match.crew.historyStatus || '').toUpperCase().includes('FINISHED') ||
        String(match.crew.historyStatus || '').toUpperCase().includes('RESIGNED')
      );

      if (isFinishedOrResigned) {
        crewData._importAction = 'REJOIN';
        crewData._matchReason = `Existing ${match.crew.operationalStatus || 'TERMINATED'} Crew -> REJOIN (${match.crew.submissionId})`;
        rejoinCount++;
      } else {
        crewData._importAction = 'UPDATE';
        let reasonType = match.type || 'IDENTIFIER';
        if (reasonType === 'CREW_ID') reasonType = 'Crew ID';
        else if (reasonType.includes('PASSPORT')) reasonType = `Passport (${crewData.passportNo || ''})`;
        else if (reasonType.includes('SEAMAN_BOOK')) reasonType = `Buku Pelaut (${crewData.cdcNo || ''})`;
        else if (reasonType.includes('NIK_KTP')) reasonType = `NIK KTP (${crewData.ktpNo || ''})`;
        else if (reasonType.includes('NAME+DOB')) reasonType = 'Nama Lengkap + Tanggal Lahir';
        crewData._matchReason = `Matched via ${reasonType}`;
        updateCount++;
      }

      crewData._isDuplicate = true;
      crewData._existingId = match.crew.submissionId;
      crewData._needsReview = false;
    } else if (match && match.candidates) {
      crewData._importAction = 'HOLD';
      crewData._needsReview = true;
      crewData._matchType = match.type;
      crewData._candidates = match.candidates.map(x => x.crew.submissionId);
      if (match.type === 'CONFLICT_STRONG_IDENTIFIERS') {
        crewData._matchReason = 'Conflict: Strong Identifier Collision across candidates';
      } else if (match.type === 'CONFLICT_NAME_DOB') {
        crewData._matchReason = 'Conflict: Same Name + Different Date of Birth';
      } else {
        crewData._matchReason = 'Conflict: Manual Admin Verification Required';
      }
      conflictCount++;
    } else {
      crewData._importAction = 'APPEND';
      crewData._isDuplicate = false;
      crewData._needsReview = false;
      crewData._matchReason = 'No Existing Match -> New Crew';
      newCount++;
    }

    pendingExcelData.push(crewData);
    totalParsed++;
  }

  window.pendingExcelData = pendingExcelData;

  const statsBox = document.getElementById("excelPreviewStats");
  if (statsBox) {
    statsBox.innerHTML = `
      <div style="display: flex; gap: 15px; flex-wrap: wrap; align-items: center; justify-content: space-between;">
        <div><strong>Total Baris Parsed:</strong> ${totalParsed}</div>
        <div><span class="badge-import-action badge-import-update">UPDATE</span> <strong>${updateCount}</strong></div>
        <div><span class="badge-import-action badge-import-rejoin">REJOIN</span> <strong>${rejoinCount}</strong></div>
        <div><span class="badge-import-action badge-import-append">APPEND</span> <strong>${newCount}</strong></div>
        <div><span class="badge-import-action badge-import-hold">HOLD</span> <strong>${conflictCount}</strong></div>
      </div>
    `;
  }

  filterPreviewTab('ALL');

  document.getElementById("excelImportProgressContainer").style.display = "none";
  document.getElementById("excelPreviewButtons").style.display = "flex";
  document.getElementById("excelPreviewModal").classList.add("active");
  event.target.value = '';
}

function closeExcelPreview() {
  document.getElementById("excelPreviewModal").classList.remove("active");
  window.pendingExcelData = [];
}

async function confirmExcelImport() {
  const safeRows = (window.pendingExcelData || []).filter(x => !x._needsReview);
  const holdRows = (window.pendingExcelData || []).filter(x => x._needsReview);

  if (safeRows.length === 0 && holdRows.length === 0) {
    if (typeof showNotification === 'function') showNotification('Tidak ada data kru untuk diimport.', 'warning');
    return;
  }

  document.getElementById("excelPreviewButtons").style.display = "none";
  document.getElementById("excelImportProgressContainer").style.display = "block";

  const progressBar = document.getElementById("excelProgressBar");
  const progressText = document.getElementById("excelProgressText");
  const progressPercentage = document.getElementById("excelProgressPercentage");

  let processedCount = 0;
  let successCount = 0;
  let failedCount = 0;
  let updatedCount = 0;
  let rejoinedCount = 0;
  let addedCount = 0;
  const totalSafe = safeRows.length;
  const resultRows = [];

  for (let i = 0; i < totalSafe; i++) {
    const crewData = safeRows[i];
    const importAction = (crewData._importAction || 'APPEND').toUpperCase();
    let action = "submit_crew";

    let payload = { ...crewData };
    delete payload._isDuplicate;
    delete payload._existingId;
    delete payload._matchType;
    delete payload._needsReview;
    delete payload._candidates;
    delete payload._importAction;
    delete payload._matchReason;

    if (crewData._isDuplicate) {
      const idx = window.crewDatabase.findIndex(c => c.submissionId === crewData._existingId);
      if (idx !== -1) {
        // Preserve existing documents & photos so updates do not clear attached files
        const existingDocs = window.crewDatabase[idx].documents || { passport:[], ktp:[], cdc:[], medical:[], photo:[] };
        const existingPhoto = window.crewDatabase[idx].photoUrl || '';
        window.crewDatabase[idx] = { 
          ...window.crewDatabase[idx], 
          ...payload,
          documents: existingDocs,
          photoUrl: payload.photoUrl || existingPhoto
        };
        payload = { ...window.crewDatabase[idx] };
      }
      action = "update_crew";
    } else {
      payload.status = payload.operationalStatus || "WAITING";
      payload.documents = payload.documents || { passport:[], ktp:[], cdc:[], medical:[], photo:[] };
      window.crewDatabase.unshift(payload);
    }

    processedCount++;
    const pct = totalSafe ? Math.round((processedCount / totalSafe) * 100) : 100;
    if (progressBar) progressBar.style.width = pct + "%";
    if (progressText) progressText.innerText = `Memproses Kru ${processedCount} dari ${totalSafe} (${escapeHTML(crewData.fullName)})`;
    if (progressPercentage) progressPercentage.innerText = pct + "%";

    payload.action = action;
    if (typeof saveLocalDatabase === 'function') saveLocalDatabase();

    let rowResult = {
      fullName: crewData.fullName || '-',
      action: importAction,
      result: 'SUCCESS',
      submissionId: payload.submissionId || crewData._existingId || '-',
      message: importAction === 'REJOIN' ? 'Riwayat pekerjaan disinkronkan (REJOIN)' : (importAction === 'UPDATE' ? 'Data kru diperbarui (UPDATE)' : 'Kru baru dibuat (APPEND)')
    };

    try {
      if (window.api && typeof window.api.postData === 'function') {
        await window.api.postData(payload, 20000).catch(err => {
          // If postData throws (e.g. CORS/timeout), fallback to direct fetch without breaking UI loop
          return fetch(getGasUrl(), {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          }).then(() => ({ success: true, fallback: true }));
        });
      }

      successCount++;
      if (importAction === 'UPDATE') updatedCount++;
      else if (importAction === 'REJOIN') rejoinedCount++;
      else if (importAction === 'APPEND') addedCount++;

    } catch (err) {
      console.error(`Smart Import Error for ${crewData.fullName}:`, err);
      rowResult.result = 'FAILED';
      rowResult.message = err.message || 'Gagal menyimpan ke server cloud';
      failedCount++;
    }

    resultRows.push(rowResult);
    await new Promise(resolve => setTimeout(resolve, 150));
  }

  // Record HOLD rows in the final result table as SKIPPED
  holdRows.forEach(h => {
    resultRows.push({
      fullName: h.fullName || '-',
      action: 'HOLD',
      result: 'SKIPPED',
      submissionId: '-',
      message: h._matchReason || 'Conflict requires manual review'
    });
  });

  closeExcelPreview();
  renderExcelResultModal(resultRows, {
    total: (window.pendingExcelData || []).length,
    updated: updatedCount,
    rejoined: rejoinedCount,
    added: addedCount,
    held: holdRows.length,
    failed: failedCount
  });

  if (typeof loadDirectoryTable === 'function') loadDirectoryTable();
  if (typeof renderCatalogGrid === 'function') renderCatalogGrid();
}

function renderExcelResultModal(results, summary) {
  const modal = document.getElementById('excelResultModal');
  const statsBox = document.getElementById('excelResultStatsSummary');
  const tbody = document.getElementById('excelResultTbody');
  if (!modal || !tbody) return;

  if (statsBox) {
    statsBox.innerHTML = `
      <div style="display: flex; gap: 15px; flex-wrap: wrap; align-items: center; justify-content: space-between;">
        <div><strong>Total Parsed:</strong> ${summary.total}</div>
        <div><span class="badge-import-action badge-import-update">UPDATED</span> <strong>${summary.updated}</strong></div>
        <div><span class="badge-import-action badge-import-rejoin">REJOINED</span> <strong>${summary.rejoined}</strong></div>
        <div><span class="badge-import-action badge-import-append">ADDED</span> <strong>${summary.added}</strong></div>
        <div><span class="badge-import-action badge-import-hold">HELD</span> <strong>${summary.held}</strong></div>
        <div><strong style="color: var(--status-error);">FAILED:</strong> ${summary.failed}</div>
      </div>
    `;
  }

  let html = '';
  results.forEach((res, i) => {
    let actBadge = 'badge-import-append';
    if (res.action === 'UPDATE') actBadge = 'badge-import-update';
    else if (res.action === 'REJOIN') actBadge = 'badge-import-rejoin';
    else if (res.action === 'HOLD') actBadge = 'badge-import-hold';

    let resColor = 'var(--status-success)';
    if (res.result === 'FAILED') resColor = 'var(--status-error)';
    else if (res.result === 'SKIPPED') resColor = 'var(--accent-amber)';

    html += `
      <tr style="border-bottom: 1px solid var(--border-color);">
        <td style="text-align: center; padding: 6px 8px; color: var(--text-muted);">${i + 1}</td>
        <td style="font-weight: 600; padding: 6px 8px;">${escapeHTML(res.fullName)}</td>
        <td style="text-align: center; padding: 6px 8px;"><span class="badge-import-action ${actBadge}">${res.action}</span></td>
        <td style="text-align: center; font-weight: 700; color: ${resColor}; padding: 6px 8px;">${res.result}</td>
        <td style="font-family: monospace; font-size: 0.78rem; padding: 6px 8px; color: var(--accent);">${escapeHTML(res.submissionId)}</td>
        <td style="font-size: 0.8rem; padding: 6px 8px; color: var(--text-muted);">${escapeHTML(res.message)}</td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
  modal.classList.add('active');
}

function closeExcelResultModal() {
  const modal = document.getElementById('excelResultModal');
  if (modal) modal.classList.remove('active');
  window.pendingExcelData = [];
  if (typeof loadDirectoryTable === 'function') loadDirectoryTable();
  if (typeof renderCatalogGrid === 'function') renderCatalogGrid();
}

window.filterPreviewTab = filterPreviewTab;
window.renderExcelPreviewTable = renderExcelPreviewTable;
window.closeExcelResultModal = closeExcelResultModal;

function exportDirectoryExcel() {
  if (!window.crewDatabase || window.crewDatabase.length === 0) { 
    alert("Tidak ada data kru untuk diekspor."); 
    return; 
  }

  const exportData = window.crewDatabase.map(c => {
    let skillsText = '-';
    if (Array.isArray(c.skillGeneral) && c.skillGeneral.length > 0) {
      skillsText = c.skillGeneral.map(properCaseText).join(', ');
    } else if (c.skillGeneral) {
      skillsText = properCaseText(c.skillGeneral);
    }

    return {
      "ID Submisi": c.submissionId || '',
      "Nama Lengkap": properCaseText(c.fullName),
      "Nama Mandarin (中文名)": c.chineseName || '',
      "Jabatan / Posisi": properCaseText(c.rankPosition),
      "No. HP / WA": c.phoneNo || '',
      "Alamat Lengkap": properCaseText(c.combinedAddress || c.streetAddress),
      "Kontak Darurat 1": properCaseText((c.fam1Name || '') + (c.fam1Relation ? ' (' + c.fam1Relation + ')' : '')),
      "Telp Darurat 1": c.fam1Phone || '',
      "Kontak Darurat 2": properCaseText((c.fam2Name || '') + (c.fam2Relation ? ' (' + c.fam2Relation + ')' : '')),
      "Telp Darurat 2": c.fam2Phone || '',
      "Pengalaman Longline": properCaseText(c.expLongline),
      "Nama Kapal 1-3": properCaseText(c.vesselName),
      "Sign On/Off 1-3": c.signOnOff || '',
      "Jenis Kapal": properCaseText(c.vesselTypeLongline),
      "Asal Kapal": properCaseText(c.vesselOrigin),
      "Negara Penempatan 1-3": properCaseText(c.placementCountry),
      "Skill Umum": skillsText,
      "No. Paspor": c.passportNo || '',
      "Expired Paspor": c.passportExpiry ? formatDisplayDate(c.passportExpiry) : '',
      "No. Buku Pelaut": c.cdcNo || '',
      "Expired Buku Pelaut": c.cdcExpiry ? formatDisplayDate(c.cdcExpiry) : '',
      "Expired BST": c.bstExpiry ? formatDisplayDate(c.bstExpiry) : '',
      "Status KK": c.kkStatus || '',
      "Status Akte": c.akteStatus || '',
      "Status Ijazah": c.ijazahLevel || '',
      "Status MCU": c.medicalStatus || '',
      "Status Surat Wali": c.waliStatus || '',
      "Status SKCK": c.skckStatus || '',
      "Ukuran Baju": c.shirtSize || '',
      "Ukuran Sepatu": c.shoeSize || '',
      "Tgl Lahir": c.dob ? formatDisplayDate(c.dob) : '',
      "Jenis Kelamin": properCaseText(c.gender),
      "Agama": properCaseText(c.religion),
      "Status Operasional": c.operationalStatus || c.status || 'STAND_BY',
      "Kandidat Kapal": properCaseText(c.vesselCandidate),
      "Nama Kapal Penempatan": properCaseText(c.vesselAssigned),
      "Tgl Terbang": c.flightDate ? formatDisplayDate(c.flightDate) : '',
      "Tgl Finish": c.finishDate ? formatDisplayDate(c.finishDate) : '',
      "Riwayat Status": properCaseText(c.historyStatus),
      "Catatan Admin": c.adminNotes || ''
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Data Crew Longline");
  
  const fileName = `Data_Crew_Longline_PT_ALINDA_${Date.now()}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

// Print CV Pelaut Ikan Layout (Ultimate Trilingual Edition)
function printCrewCV(submissionId) {
  const crew = window.crewDatabase.find(c => c.submissionId === submissionId);
  if (!crew) return;

  const isZh = window.currentLang === 'zh';
  const cvLabel = (id, en, zh) => isZh
    ? `<span class="lbl-id">${zh}</span><span class="lbl-en">${en}</span><span class="lbl-tw">${id}</span>`
    : `<span class="lbl-id">${id}</span><span class="lbl-en">${en}</span><span class="lbl-tw">${zh}</span>`;
  const validUntilText = date => isZh
    ? `有效至 ${formatDisplayDate(date)}`
    : `Berlaku hingga ${formatDisplayDate(date)}`;
  const unavailableText = isZh ? '無效或未提供' : 'Expired / None';
  const availableText = isZh ? '已提供' : 'Available';
  const noneText = isZh ? '無' : 'None';

  const printWindow = window.open('', '_blank');
  
  // Ambil foto profil (index 0) jika ada, format 3x4
  let photoHtml = '<div class="photo-placeholder font-label-bilingual text-label-bilingual text-on-surface-variant text-center">3 x 4 cm</div>';
  if (crew.documents && crew.documents.photo && crew.documents.photo.length > 0) {
    const photoSrc = resolveImgSrc(crew.documents.photo[0]);
    if (photoSrc) photoHtml = `<img src="${escapeHTML(photoSrc)}" class="w-full h-full object-cover">`;
  }

  // Hitung Umur
  let age = '-';
  if (crew.dob) {
    const diff = Date.now() - new Date(crew.dob).getTime();
    age = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  }

  // Format Skills dengan Bullet
  let skillsHtml = '-';
  if (Array.isArray(crew.skillGeneral) && crew.skillGeneral.length > 0) {
    skillsHtml = crew.skillGeneral.map(s => `&#10003; ${s}`).join(' &nbsp; ');
  } else if (typeof crew.skillGeneral === 'string' && crew.skillGeneral.trim() !== '') {
    skillsHtml = crew.skillGeneral.split(',').map(s => `&#10003; ${s.trim()}`).join(' &nbsp; ');
  }

  // Validasi Expiry
  const isDocValid = (dateStr) => {
    if (!dateStr) return false;
    return new Date(dateStr) > new Date();
  };
  const isPassportValid = isDocValid(crew.passportExpiry);
  const isCdcValid = isDocValid(crew.cdcExpiry);
  const isBstValid = isDocValid(crew.bstExpiry);

  // Generate QR Code URL
  const qrUrl = encodeURIComponent(`https://sidean28-stack.github.io/crew-data-app/?view=${crew.submissionId}`);
  const qrImage = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${qrUrl}" alt="QR Code" class="w-12 h-12">`;

  // Attachments HTML (Halaman 2)
  let attachmentsHtml = '';
  const docNames = {
    cert: 'Sertifikat / Certificates',
    passport: 'Paspor / Passport / 護照',
    ktp: 'KTP / ID Card / 身份證',
    cdc: 'Buku Pelaut / Seaman Book / 船員手冊',
    kk: 'Kartu Keluarga / Family Card / 戶口名簿',
    akte: 'Akte Kelahiran / Birth Certificate / 出生證明',
    medical: 'MCU / Medical Certificate / 體檢報告',
    bst: 'BST / Basic Safety Training / 基本安全訓練',
    skck: 'SKCK / Police Record / 良民證'
  };

  if (crew.documents) {
    for (const [key, label] of Object.entries(docNames)) {
      if (crew.documents[key] && crew.documents[key].length > 0) {
        crew.documents[key].forEach((doc) => {
          const attachmentSrc = resolveImgSrc(doc);
          if (!attachmentSrc) return;
          attachmentsHtml += `
            <article class="attachment-sheet">
              <h4 class="font-headline-sm text-headline-sm text-primary mb-2 pb-1 border-b border-outline-variant">${label}</h4>
              <img src="${escapeHTML(attachmentSrc)}" class="attachment-image mx-auto rounded border border-outline-variant p-1 bg-white">
            </article>
          `;
        });
      }
    }
  }

  let page2Html = '';
  if (attachmentsHtml) {
    page2Html = `
      <section class="documents-section">
      <div class="attachment-header no-print text-center my-6">
        <h1 class="font-display text-display text-primary">${isZh ? '附件文件' : 'DOCUMENT ATTACHMENTS'}</h1>
        <p class="text-on-surface-variant font-bold">${isZh ? '船員證件' : 'Lampiran Berkas'} - ${escapeHTML(crew.fullName)} (${escapeHTML(crew.submissionId)})</p>
      </div>
      <div class="attachments-container">
        ${attachmentsHtml}
      </div>
      </section>
    `;
  }

  // Generate Document Gallery HTML dynamically
  let galleryHtml = '';
  if (crew.documents) {
    for (const [key, docsList] of Object.entries(crew.documents)) {
      if (Array.isArray(docsList)) {
        docsList.forEach((doc, idx) => {
          const docUrl = resolveImgSrc(doc);
          if (!docUrl) return;
          const docName = doc.name || `${key.toUpperCase()}_${idx + 1}`;
          const isPdf = docName.toLowerCase().endsWith('.pdf') || docUrl.includes('application/pdf') || docUrl.toLowerCase().includes('.pdf');
          
          if (isPdf) {
            galleryHtml += `
              <div class="border border-outline-variant rounded flex flex-col items-center justify-center bg-surface-bright w-[30mm] h-[40mm] max-w-[120px] max-h-[160px] p-2">
                <img alt="PDF Icon" class="w-10 h-10 mb-1 opacity-80" src="https://cdn-icons-png.flaticon.com/512/337/337946.png"/>
                <span class="font-label-bilingual text-label-bilingual text-on-surface-variant truncate w-full text-center">${escapeHTML(docName)}</span>
              </div>
            `;
          } else {
            galleryHtml += `
              <div class="border border-outline-variant rounded overflow-hidden w-[30mm] h-[40mm] max-w-[120px] max-h-[160px] bg-surface-container relative">
                <img src="${escapeHTML(docUrl)}" class="w-full h-full object-cover">
                <div class="absolute bottom-0 w-full bg-surface-dim bg-opacity-90 py-0.5 text-center font-label-bilingual text-label-bilingual border-t border-outline-variant truncate">${escapeHTML(docName)}</div>
              </div>
            `;
          }
        });
      }
    }
  }

  // Generate Vessel History Rows HTML dynamically
  let vesselRowsHtml = '';
  const vesselText = crew.vesselName || '';
  if (vesselText) {
    const parts = vesselText.split('|');
    parts.forEach(part => {
      const trimmed = part.trim();
      const numberMatch = trimmed.match(/^(\d+\.\s*)(.*)$/);
      let rest = trimmed;
      if (numberMatch) {
        rest = numberMatch[2];
      }
      const periodMatch = rest.match(/^(.*?)\s*(\([^()]*\))\s*$/);
      let duration = '-';
      let cleanName = rest;
      if (periodMatch) {
        cleanName = periodMatch[1].trim();
        duration = periodMatch[2].replace(/[()]/g, '');
      }
      
      const bilingualName = typeof getBilingualVesselName === 'function' ? getBilingualVesselName(cleanName) : cleanName;
      const chineseLabel = bilingualName.includes('(') ? bilingualName.match(/\(([^()]*)\)/)?.[1] : '';
      
      vesselRowsHtml += `
        <tr class="hover:bg-surface-bright">
          <td class="py-2 px-3 border-b border-outline-variant">
            <div class="font-bold">${escapeHTML(cleanName.toUpperCase())}</div>
            <div class="font-label-bilingual text-label-bilingual text-on-surface-variant">${escapeHTML(chineseLabel || '')}</div>
          </td>
          <td class="py-2 px-3 border-b border-outline-variant">${escapeHTML(crew.vesselTypeLongline || 'Longline')}</td>
          <td class="py-2 px-3 border-b border-outline-variant">${escapeHTML(crew.rankPosition || 'Crew')}</td>
          <td class="py-2 px-3 border-b border-outline-variant font-bold">${escapeHTML(duration)}</td>
        </tr>
      `;
    });
  } else {
    vesselRowsHtml = `
      <tr>
        <td colspan="4" class="py-4 text-center text-on-surface-variant">${isZh ? '無航海經歷' : 'Tidak ada riwayat kapal'}</td>
      </tr>
    `;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html class="light" lang="en">
    <head>
      <meta charset="utf-8"/>
      <meta content="width=device-width, initial-scale=1.0" name="viewport"/>
      <title>${isZh ? '船員履歷表' : 'CV'} - ${escapeHTML(crew.fullName)}</title>
      <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
      <script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    "colors": {
                        "primary-fixed": "#d5e3ff",
                        "primary": "#001e40",
                        "surface-bright": "#f7f9fb",
                        "error-container": "#ffdad6",
                        "on-secondary-fixed": "#0d1c2f",
                        "tertiary-container": "#592300",
                        "secondary-fixed-dim": "#b9c7e0",
                        "tertiary": "#381300",
                        "inverse-on-surface": "#eff1f3",
                        "surface-container": "#eceef0",
                        "on-tertiary-fixed": "#341100",
                        "surface-tint": "#3a5f94",
                        "on-tertiary-fixed-variant": "#723610",
                        "primary-container": "#003366",
                        "surface-variant": "#e0e3e5",
                        "secondary-fixed": "#d5e3fd",
                        "tertiary-fixed": "#ffdbca",
                        "on-background": "#191c1e",
                        "primary-fixed-dim": "#a7c8ff",
                        "tertiary-fixed-dim": "#ffb690",
                        "on-primary-fixed-variant": "#1f477b",
                        "inverse-surface": "#2d3133",
                        "background": "#f7f9fb",
                        "on-error-container": "#93000a",
                        "on-primary-fixed": "#001b3c",
                        "surface-container-high": "#e6e8ea",
                        "surface-container-low": "#f2f4f6",
                        "outline-variant": "#c3c6d1",
                        "surface-container-highest": "#e0e3e5",
                        "inverse-primary": "#a7c8ff",
                        "secondary": "#515f74",
                        "on-primary": "#ffffff",
                        "on-surface": "#191c1e",
                        "on-tertiary": "#ffffff",
                        "on-surface-variant": "#43474f",
                        "on-primary-container": "#799dd6",
                        "on-tertiary-container": "#d8885c",
                        "surface-dim": "#d8dadc",
                        "outline": "#737780",
                        "on-error": "#ffffff",
                        "on-secondary-fixed-variant": "#3a485c",
                        "secondary-container": "#d5e3fd",
                        "surface-container-lowest": "#ffffff",
                        "on-secondary-container": "#57657b",
                        "error": "#ba1a1a",
                        "on-secondary": "#ffffff",
                        "surface": "#f7f9fb"
                    },
                    "borderRadius": {
                        "DEFAULT": "0.125rem",
                        "lg": "0.25rem",
                        "xl": "0.5rem",
                        "full": "0.75rem"
                    },
                    "spacing": {
                        "margin-page": "24px",
                        "stack-sm": "4px",
                        "gutter-grid": "16px",
                        "stack-md": "12px",
                        "stack-lg": "24px"
                    },
                    "fontFamily": {
                        "headline-sm": ["Inter"],
                        "label-bilingual": ["Inter"],
                        "body-sm": ["Inter"],
                        "display": ["Inter"],
                        "body-md": ["Inter"],
                        "label-bold": ["Inter"]
                    },
                    "fontSize": {
                        "headline-sm": ["18px", { "lineHeight": "24px", "fontWeight": "600" }],
                        "label-bilingual": ["10px", { "lineHeight": "14px", "fontWeight": "400" }],
                        "body-sm": ["12px", { "lineHeight": "18px", "fontWeight": "400" }],
                        "display": ["24px", { "lineHeight": "32px", "letterSpacing": "-0.02em", "fontWeight": "700" }],
                        "body-md": ["14px", { "lineHeight": "20px", "fontWeight": "400" }],
                        "label-bold": ["11px", { "lineHeight": "16px", "fontWeight": "700" }]
                    }
                }
            }
        }
      </script>
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap" rel="stylesheet"/>
      <style>
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        @media print {
            body { background: white; margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .no-print { display: none !important; }
            .a4-page { width: 100%; height: auto; min-height: 297mm; margin: 0; padding: 24px; box-shadow: none; overflow: visible; break-after: auto; position: relative;}
            .watermark-overlay { position: fixed; inset: 0; z-index: -1; pointer-events: none; overflow: hidden; opacity: 0.05; display: flex; flex-wrap: wrap; justify-content: center; align-items: center; transform: rotate(-30deg); }
            .watermark-text { font-size: 2rem; font-weight: bold; color: black; white-space: nowrap; margin: 50px; }
            .attachment-sheet { page-break-before: always; break-before: page; min-height: 268mm; text-align: center; }
            .attachment-image { max-width: 100%; max-height: 250mm; object-fit: contain; }
        }
        @media screen {
            body { background-color: #f2f4f6; padding: 2rem 0; display: flex; flex-direction: column; align-items: center; gap: 1rem; }
            .a4-page { width: 210mm; min-height: 297mm; background: white; margin: 0 auto; padding: 24px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); position: relative; overflow: hidden; }
            .watermark-overlay { position: absolute; inset: -50%; z-index: 0; pointer-events: none; opacity: 0.03; display: flex; flex-wrap: wrap; align-content: flex-start; transform: rotate(-30deg); }
            .watermark-text { font-size: 1.5rem; font-weight: bold; color: black; padding: 2rem; white-space: nowrap; }
            .attachment-sheet { margin-top: 2rem; background: white; width: 210mm; padding: 24px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; }
            .attachment-image { max-width: 100%; max-height: 250mm; object-fit: contain; }
        }
      </style>
    </head>
    <body class="font-body-md text-on-surface bg-surface-container-low min-h-screen">
      <!-- Top Navigation (Screen Only) -->
      <nav class="fixed top-0 w-full z-50 flex justify-between items-center px-margin-page py-stack-md bg-surface-bright border-b border-outline-variant no-print shadow-sm">
        <div class="font-headline-sm text-headline-sm font-bold text-primary">SEAFARER CV PORTAL</div>
        <div class="flex gap-4">
          <button class="px-4 py-2 bg-primary text-on-primary rounded font-label-bold flex items-center gap-2 hover:bg-primary-container transition-colors" onclick="window.print()">
            <span class="material-symbols-outlined text-[18px]">print</span> Print CV / Cetak PDF
          </button>
        </div>
      </nav>

      <!-- A4 Document Container -->
      <div class="a4-page mt-[60px] print:mt-0 z-10 relative bg-surface-container-lowest">
        <!-- Watermark -->
        <div aria-hidden="true" class="watermark-overlay">
          <script>
            for(let i=0; i<30; i++) {
                document.write('<div class="watermark-text font-headline-sm">CONFIDENTIAL FOR ${escapeHTML(window.tokenOwnerName || 'SHIP OWNER')} - ${new Date().getFullYear()}</div>');
            }
          </script>
        </div>

        <!-- Content Canvas -->
        <div class="relative z-10">
          <!-- Header Section -->
          <header class="flex justify-between items-start border-b border-outline-variant pb-stack-lg mb-stack-lg">
            <div class="flex-1">
              <h1 class="font-display text-display text-primary mb-1">${escapeHTML(crew.fullName)}</h1>
              <div class="font-headline-sm text-headline-sm text-on-surface-variant mb-stack-md">${escapeHTML(crew.chineseName || '-')}</div>
              <div class="grid grid-cols-2 gap-y-stack-sm w-3/4">
                <div>
                  <div class="font-label-bilingual text-label-bilingual text-on-surface-variant uppercase">${isZh ? '船員編號' : 'Crew ID'}</div>
                  <div class="font-body-md text-body-md font-bold">${escapeHTML(crew.submissionId)}</div>
                </div>
                <div>
                  <div class="font-label-bilingual text-label-bilingual text-on-surface-variant uppercase">${isZh ? '職務' : 'Position'}</div>
                  <div class="font-body-md text-body-md font-bold text-primary">${escapeHTML(crew.rankPosition || '-')}</div>
                </div>
              </div>
            </div>
            <div class="w-[30mm] h-[40mm] border border-outline-variant rounded overflow-hidden flex-shrink-0 bg-surface-container flex items-center justify-center">
              ${photoHtml}
            </div>
          </header>

          <!-- Personal Data Grid -->
          <section class="mb-stack-lg">
            <h2 class="font-headline-sm text-headline-sm text-primary border-b border-outline-variant pb-stack-sm mb-stack-md flex items-center gap-2">
              <span class="material-symbols-outlined text-[20px]">person</span> ${isZh ? '個人資料 / Personal Data' : 'Personal Data / 个人资料'}
            </h2>
            <div class="grid grid-cols-2 gap-x-gutter-grid gap-y-stack-md bg-surface-bright p-stack-md rounded-DEFAULT border border-outline-variant">
              <div>
                <div class="font-label-bold text-label-bold text-on-surface mb-0.5">${isZh ? '出生地點/日期' : 'POB/DOB'}</div>
                <div class="font-label-bilingual text-label-bilingual text-on-surface-variant mb-1">${isZh ? '出生地點/日期' : 'Tempat/Tgl Lahir / 出生地点/日期'}</div>
                <div class="font-body-sm text-body-sm">${escapeHTML(crew.pob || '-')}, ${escapeHTML(formatDisplayDate(crew.dob))}</div>
              </div>
              <div>
                <div class="font-label-bold text-label-bold text-on-surface mb-0.5">${isZh ? '身高/體重' : 'Height/Weight'}</div>
                <div class="font-label-bilingual text-label-bilingual text-on-surface-variant mb-1">${isZh ? '身高/體重' : 'Tinggi/Berat / 身高/体重'}</div>
                <div class="font-body-sm text-body-sm">${escapeHTML(crew.heightCm || '-')}cm / ${escapeHTML(crew.weightKg || '-')}kg</div>
              </div>
              <div>
                <div class="font-label-bold text-label-bold text-on-surface mb-0.5">${isZh ? '宗教' : 'Religion'}</div>
                <div class="font-label-bilingual text-label-bilingual text-on-surface-variant mb-1">${isZh ? '宗教' : 'Agama / 宗教'}</div>
                <div class="font-body-sm text-body-sm">${escapeHTML(crew.religion || '-').toUpperCase()}</div>
              </div>
              <div>
                <div class="font-label-bold text-label-bold text-on-surface mb-0.5">${isZh ? '衣服/鞋子尺碼' : 'Shirt/Shoe Size'}</div>
                <div class="font-label-bilingual text-label-bilingual text-on-surface-variant mb-1">${isZh ? '衣服/鞋子尺碼' : 'Ukuran Baju/Sepatu / 衣服/鞋子尺码'}</div>
                <div class="font-body-sm text-body-sm">${escapeHTML(crew.shirtSize || '-')} / ${escapeHTML(crew.shoeSize || '-')}</div>
              </div>
            </div>
          </section>

          <!-- Documents Section -->
          <section class="mb-stack-lg">
            <h2 class="font-headline-sm text-headline-sm text-primary border-b border-outline-variant pb-stack-sm mb-stack-md flex items-center gap-2">
              <span class="material-symbols-outlined text-[20px]">description</span> ${isZh ? '核心文件 / Core Documents' : 'Core Documents / 核心文件'}
            </h2>
            <div class="flex flex-col gap-stack-sm">
              <!-- Passport -->
              <div class="flex justify-between items-center py-2 border-b border-outline-variant border-opacity-50">
                <div class="flex items-center gap-3">
                  <span class="material-symbols-outlined text-outline">book</span>
                  <div>
                    <div class="font-label-bold text-label-bold">${isZh ? '護照 (Passport)' : 'Passport (Paspor)'}</div>
                    <div class="font-label-bilingual text-label-bilingual text-on-surface-variant">No: ${escapeHTML(crew.passportNo || '-')} • Exp: ${escapeHTML(formatDisplayDate(crew.passportExpiry))}</div>
                  </div>
                </div>
                <div class="px-2 py-0.5 rounded font-label-bold uppercase text-[9px] tracking-wider border ${isPassportValid ? 'bg-[#e6f4ea] text-[#137333] border-[#ceead6]' : 'bg-[#fce8e6] text-[#c5221f] border-[#fad2cf]' }">
                  ${isPassportValid ? (isZh ? '有效 / Valid' : 'Valid') : (isZh ? '無效 / Expired' : 'Expired')}
                </div>
              </div>
              <!-- CDC -->
              <div class="flex justify-between items-center py-2 border-b border-outline-variant border-opacity-50">
                <div class="flex items-center gap-3">
                  <span class="material-symbols-outlined text-outline">directions_boat</span>
                  <div>
                    <div class="font-label-bold text-label-bold">${isZh ? '船員手冊 (Seaman Book / CDC)' : 'Seaman Book / CDC (Buku Pelaut)'}</div>
                    <div class="font-label-bilingual text-label-bilingual text-on-surface-variant">No: ${escapeHTML(crew.cdcNo || '-')} • Exp: ${escapeHTML(formatDisplayDate(crew.cdcExpiry))}</div>
                  </div>
                </div>
                <div class="px-2 py-0.5 rounded font-label-bold uppercase text-[9px] tracking-wider border ${isCdcValid ? 'bg-[#e6f4ea] text-[#137333] border-[#ceead6]' : 'bg-[#fce8e6] text-[#c5221f] border-[#fad2cf]' }">
                  ${isCdcValid ? (isZh ? '有效 / Valid' : 'Valid') : (isZh ? '無效 / Expired' : 'Expired')}
                </div>
              </div>
              <!-- BST -->
              <div class="flex justify-between items-center py-2">
                <div class="flex items-center gap-3">
                  <span class="material-symbols-outlined text-outline">verified</span>
                  <div>
                    <div class="font-label-bold text-label-bold">${isZh ? '基本安全訓練 (BST)' : 'BST (Basic Safety Training)'}</div>
                    <div class="font-label-bilingual text-label-bilingual text-on-surface-variant">Exp: ${escapeHTML(formatDisplayDate(crew.bstExpiry))}</div>
                  </div>
                </div>
                <div class="px-2 py-0.5 rounded font-label-bold uppercase text-[9px] tracking-wider border ${isBstValid ? 'bg-[#e6f4ea] text-[#137333] border-[#ceead6]' : 'bg-[#fce8e6] text-[#c5221f] border-[#fad2cf]' }">
                  ${isBstValid ? (isZh ? '有效 / Valid' : 'Valid') : (isZh ? '無效 / Expired' : 'Expired')}
                </div>
              </div>
            </div>
          </section>

          <!-- Document Gallery -->
          <section class="mb-stack-lg">
            <h2 class="font-headline-sm text-headline-sm text-primary border-b border-outline-variant pb-stack-sm mb-stack-md flex items-center gap-2">
              <span class="material-symbols-outlined text-[20px]">photo_library</span> ${isZh ? '文件庫 / Document Gallery' : 'Document Gallery / 文件库'}
            </h2>
            <div class="flex gap-gutter-grid flex-wrap">
              ${galleryHtml || `<div class="text-on-surface-variant font-body-sm">${isZh ? '無上傳文件' : 'Tidak ada berkas terunggah.'}</div>`}
            </div>
          </section>

          <!-- Vessel History Table -->
          <section class="mb-stack-lg">
            <div class="flex justify-between items-end border-b border-outline-variant pb-stack-sm mb-stack-md">
              <h2 class="font-headline-sm text-headline-sm text-primary flex items-center gap-2">
                <span class="material-symbols-outlined text-[20px]">history</span> ${isZh ? '航海經歷 / Vessel History' : 'Vessel History / 航海经历'}
              </h2>
              <div class="font-label-bold text-label-bold text-on-surface-variant bg-surface-container-low px-2 py-1 rounded">
                ${isZh ? '延繩釣經驗：' : 'Longline Fishing Exp: '}${escapeHTML(crew.expLongline || '-')}
              </div>
            </div>
            <div class="border border-outline-variant rounded overflow-hidden">
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="bg-surface-dim text-on-surface">
                    <th class="py-2 px-3 font-label-bold text-label-bold border-b border-outline-variant">Vessel Name <br/><span class="font-label-bilingual text-label-bilingual text-on-surface-variant font-normal">船名</span></th>
                    <th class="py-2 px-3 font-label-bold text-label-bold border-b border-outline-variant">Type <br/><span class="font-label-bilingual text-label-bilingual text-on-surface-variant font-normal">类型</span></th>
                    <th class="py-2 px-3 font-label-bold text-label-bold border-b border-outline-variant">Rank <br/><span class="font-label-bilingual text-label-bilingual text-on-surface-variant font-normal">职务</span></th>
                    <th class="py-2 px-3 font-label-bold text-label-bold border-b border-outline-variant">Duration <br/><span class="font-label-bilingual text-label-bilingual text-on-surface-variant font-normal">服务期</span></th>
                  </tr>
                </thead>
                <tbody class="font-body-sm text-body-sm">
                  ${vesselRowsHtml}
                </tbody>
              </table>
            </div>
          </section>

          <!-- Signature Section -->
          <div class="flex justify-between mt-8 pt-4 border-t border-outline-variant">
            <div class="text-center w-[45%]">
              <div class="font-label-bold text-label-bold text-on-surface">${isZh ? '船員簽名' : 'Crew Signature'}</div>
              <div class="font-label-bilingual text-label-bilingual text-on-surface-variant mb-10">${isZh ? 'Crew Signature' : '船員簽名'}</div>
              <div class="border-b border-on-background w-3/4 mx-auto"></div>
            </div>
            <div class="text-center w-[45%]">
              <div class="font-label-bold text-label-bold text-on-surface">${isZh ? '合法船員派遣公司' : 'Authorized Manning Agency'}</div>
              <div class="font-label-bilingual text-label-bilingual text-on-surface-variant">PT ALINDA PRIMA SENTOSA</div>
              <div class="font-label-bilingual text-label-bilingual text-on-surface-variant mb-6">${isZh ? 'Authorized Manning Agency' : '合法船員派遣公司'}</div>
              <div class="border-b border-on-background w-3/4 mx-auto"></div>
            </div>
          </div>

          <!-- Footer Section -->
          <div class="flex justify-between items-center mt-6 pt-4 border-t border-outline-variant text-[10px] text-on-surface-variant">
            <div>
              <div>${isZh ? '系統產生' : 'Generated by'}</div>
              <div class="font-bold text-primary">Longline Crew Management System</div>
              <div>Version 2.0</div>
              <div class="font-bold">PT ALINDA PRIMA SENTOSA</div>
            </div>
            <div class="flex flex-col items-center">
              ${qrImage}
              <div class="font-label-bilingual text-label-bilingual text-center mt-1 font-bold">${isZh ? '掃描查看完整資料' : 'Scan to View Complete Profile'}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Attachment Pages (Page 2+) -->
      ${page2Html}

      <script>
        window.onload = function() { 
          setTimeout(() => { window.print(); }, 1000);
        }
      </script>
    </body>
    </html>
  `);
  printWindow.document.close();
}

function exportCrewZip(submissionId) { alert(`Download ZIP Berkas Foto Kru (${submissionId}) diproses.`); }

// ==============================================================================
// DETAIL PER CREW & OPERATIONAL STATUS MANAGEMENT MODAL
// ==============================================================================
window.currentDetailSubmissionId = null;

function openCrewDetailModal(submissionId) {
  const crew = window.crewDatabase.find(c => c.submissionId === submissionId);
  if (!crew) return;

  const isZh = window.currentLang === 'zh';
  const detailText = isZh ? {
    title: '船員資料與運營狀態', fullName: '姓名：', chineseName: '中文姓名：', position: '職務：',
    birthAge: '出生日期 / 年齡：', years: '歲', gender: '性別：', religion: '宗教：',
    heightWeight: '身高 / 體重：', shirtShoe: '工作服 / 鞋碼：', phone: '電話 / WhatsApp：',
    address: '完整地址：', emergency1: '緊急聯絡人 1：', emergency2: '緊急聯絡人 2：',
    qualification: '資格與航海經驗', experience: '延繩釣經驗：', vesselHistory: '船舶經歷：',
    signOnOff: '上船 / 下船：', vesselTypeOrigin: '船型 / 船籍：', placement: '派遣地區：',
    skills: '一般技能：', noDocuments: '尚未上傳證件照片。'
  } : {
    title: 'Profil & Status Operasional', fullName: 'Nama Lengkap:', chineseName: 'Nama Mandarin:', position: 'Jabatan:',
    birthAge: 'Tgl Lahir / Umur:', years: 'Tahun', gender: 'Jenis Kelamin:', religion: 'Agama:',
    heightWeight: 'Tinggi / Berat:', shirtShoe: 'Ukuran Baju/Sepatu:', phone: 'No. HP / WA:',
    address: 'Alamat Lengkap:', emergency1: 'Kontak Darurat 1:', emergency2: 'Kontak Darurat 2:',
    qualification: 'Kualifikasi & Pengalaman Berlayar', experience: 'Pengalaman:', vesselHistory: 'Riwayat Kapal:',
    signOnOff: 'Sign On / Off:', vesselTypeOrigin: 'Jenis & Asal Kapal:', placement: 'Negara Penempatan:',
    skills: 'Skill Umum:', noDocuments: 'Belum ada foto berkas terunggah.'
  };

  window.currentDetailSubmissionId = submissionId;

  const modalTitle = document.getElementById('detailModalTitle');
  const modalBadge = document.getElementById('detailSubmisiBadge');
  if (modalTitle) modalTitle.innerText = `${detailText.title}: ${crew.fullName}`;
  if (modalBadge) modalBadge.innerText = `${isZh ? '船員編號' : 'ID'}: ${crew.submissionId}`;

  // Hitung Umur
  let age = '-';
  if (crew.dob) {
    const diff = Date.now() - new Date(crew.dob).getTime();
    age = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  }

  // Format skills
  let skillsText = '-';
  if (Array.isArray(crew.skillGeneral) && crew.skillGeneral.length > 0) {
    skillsText = crew.skillGeneral.join(', ');
  } else if (typeof crew.skillGeneral === 'string' && crew.skillGeneral.trim() !== '') {
    skillsText = crew.skillGeneral;
  }

  // Left Column Content: Data Lengkap Kandidat
  const infoHtml = `
    <div class="crew-detail-data-grid" style="display: grid; grid-template-columns: minmax(118px, 150px) minmax(0, 1fr); gap: 4px 10px; margin-bottom: 8px;">
      <strong>${detailText.fullName}</strong> <span><strong>${escapeHTML(crew.fullName)}</strong></span>
      <strong>${detailText.chineseName}</strong> <span lang="zh">${escapeHTML(crew.chineseName || '-')}</span>
      <strong>${detailText.position}</strong> <span><span class="rank-badge">${escapeHTML(crew.rankPosition)}</span></span>
      <strong>${detailText.birthAge}</strong> <span>${escapeHTML(crew.dob || '-')} (${age} ${detailText.years})</span>
      <strong>${detailText.gender}</strong> <span>${escapeHTML(crew.gender === 'Male' ? (isZh ? '男 (Male)' : 'Laki-laki (男)') : (crew.gender === 'Female' ? (isZh ? '女 (Female)' : 'Perempuan (女)') : (crew.gender || '-')))}</span>
      <strong>${detailText.religion}</strong> <span>${escapeHTML(crew.religion || '-')}</span>
      <strong>${detailText.heightWeight}</strong> <span>${escapeHTML(crew.heightCm || '-')} cm / ${escapeHTML(crew.weightKg || '-')} kg</span>
      <strong>${detailText.shirtShoe}</strong> <span>${escapeHTML(crew.shirtSize || '-')} / ${escapeHTML(crew.shoeSize || '-')}</span>
      <strong>${detailText.phone}</strong> <span>${escapeHTML(crew.phoneNo || '-')}</span>
      <strong>${detailText.address}</strong> <span>${escapeHTML(crew.combinedAddress || crew.streetAddress || '-')}</span>
      <strong>${detailText.emergency1}</strong> <span>${escapeHTML(crew.fam1Name || '-')} (${escapeHTML(crew.fam1Relation || '-')}): ${escapeHTML(crew.fam1Phone || '-')}</span>
      <strong>${detailText.emergency2}</strong> <span>${escapeHTML(crew.fam2Name || '-')} (${escapeHTML(crew.fam2Relation || '-')}): ${escapeHTML(crew.fam2Phone || '-')}</span>
    </div>
    
    <div style="border-top: 1px solid var(--border-color); padding-top: 8px; margin-top: 8px;">
      <h5 style="margin: 0 0 6px 0; font-size: 0.85rem; color: var(--primary);">${detailText.qualification}</h5>
      <div class="crew-detail-data-grid" style="display: grid; grid-template-columns: minmax(118px, 150px) minmax(0, 1fr); gap: 4px 10px;">
        <strong>${detailText.experience}</strong> <span>${escapeHTML(crew.expLongline || '-')}</span>
        <strong>${detailText.vesselHistory}</strong> <span>${escapeHTML(typeof makeVesselHistoryBilingual === 'function' ? makeVesselHistoryBilingual(crew.vesselName) : (crew.vesselName || '-'))}</span>
        <strong>${detailText.signOnOff}</strong> <span>${escapeHTML(crew.signOnOff || '-')}</span>
        <strong>${detailText.vesselTypeOrigin}</strong> <span>${escapeHTML(crew.vesselTypeLongline || '-')} (${escapeHTML(crew.vesselOrigin || '-')})</span>
        <strong>${detailText.placement}</strong> <span>${escapeHTML(crew.placementCountry || '-')}</span>
        <strong>${detailText.skills}</strong> <span>${escapeHTML(skillsText)}</span>
      </div>
    </div>
  `;
  const infoEl = document.getElementById('detailInfoContent');
  if (infoEl) infoEl.innerHTML = infoHtml;

  // Left Column Document Buttons
  let docButtonsHtml = '';
  const docLabels = isZh ? {
    passport: '護照', ktp: '身份證', cdc: '船員手冊', medical: '體檢證明',
    bst: '基本安全訓練', kk: '戶口名簿', akte: '出生證明', skck: '良民證', cert: '證書', photo: '照片'
  } : {
    passport: 'Paspor', ktp: 'KTP', cdc: 'Buku Pelaut', medical: 'MCU',
    bst: 'BST', kk: 'KK', akte: 'Akte', skck: 'SKCK', cert: 'Sertifikat', photo: 'Foto'
  };

  const previewItems = setDocumentPreviewGallery(crew, docLabels);
  if (crew.documents) {
    for (const [key, label] of Object.entries(docLabels)) {
      if (crew.documents[key] && crew.documents[key].length > 0) {
        const previewIndex = previewItems.findIndex(item => item.type === key);
        if (previewIndex >= 0) {
          docButtonsHtml += `
            <button class="btn-secondary" style="padding: 4px 8px; font-size: 0.75rem;" onclick="openDocumentPreview(${previewIndex})">
              <i class="fa-solid fa-file-image"></i> ${label}${crew.documents[key].length > 1 ? ` (${crew.documents[key].length})` : ''}
            </button>
          `;
        }
      }
    }
  }
  if (!docButtonsHtml) docButtonsHtml = `<span style="color: var(--text-muted); font-size: 0.8rem;">${detailText.noDocuments}</span>`;
  const docEl = document.getElementById('detailDocList');
  if (docEl) docEl.innerHTML = docButtonsHtml;

  // Right Column: Operational Controls
  const opStatus = crew.operationalStatus || crew.status || 'STAND_BY';
  const radioGroup = document.getElementsByName('crewOpStatus');
  for (let r of radioGroup) {
    r.checked = (r.value === opStatus || (opStatus === 'WAITING' && r.value === 'STAND_BY'));
  }

  const vCand = document.getElementById('detailVesselCandidate');
  const vAssigned = document.getElementById('detailVesselAssigned');
  const fDate = document.getElementById('detailFlightDate');
  const fnDate = document.getElementById('detailFinishDate');
  const hStatus = document.getElementById('detailHistoryStatus');
  const aNotes = document.getElementById('detailAdminNotes');

  if (vCand) vCand.value = crew.vesselCandidate || '';
  if (vAssigned) vAssigned.value = crew.vesselAssigned || '';
  if (fDate) fDate.value = typeof formatDateForInput === 'function' ? formatDateForInput(crew.flightDate) : (crew.flightDate || '');
  if (fnDate) fnDate.value = typeof formatDateForInput === 'function' ? formatDateForInput(crew.finishDate) : (crew.finishDate || '');
  if (hStatus) hStatus.value = crew.historyStatus || '';
  if (aNotes) aNotes.value = crew.adminNotes || '';

  const modalEl = document.getElementById('crewDetailModal');
  if (modalEl) modalEl.classList.add('active');
}

function closeCrewDetailModal() {
  const modalEl = document.getElementById('crewDetailModal');
  if (modalEl) modalEl.classList.remove('active');
  window.currentDetailSubmissionId = null;
}

async function saveCrewOperationalStatus() {
  if (!window.currentDetailSubmissionId) return;

  const crew = window.crewDatabase.find(c => c.submissionId === window.currentDetailSubmissionId);
  if (!crew) return;

  const radioGroup = document.getElementsByName('crewOpStatus');
  let selectedOpStatus = 'STAND_BY';
  for (let r of radioGroup) {
    if (r.checked) {
      selectedOpStatus = r.value;
      break;
    }
  }

  const statusUpdate = {
    submissionId: crew.submissionId,
    operationalStatus: selectedOpStatus,
    vesselCandidate: properCaseText(document.getElementById('detailVesselCandidate')?.value.trim() || ''),
    vesselAssigned: properCaseText(document.getElementById('detailVesselAssigned')?.value.trim() || ''),
    flightDate: document.getElementById('detailFlightDate')?.value || '',
    finishDate: document.getElementById('detailFinishDate')?.value || '',
    historyStatus: properCaseText(document.getElementById('detailHistoryStatus')?.value || ''),
    adminNotes: document.getElementById('detailAdminNotes')?.value.trim() || ''
  };

  const saveButton = document.getElementById('saveCrewStatusButton');
  const originalSaveButtonHtml = saveButton ? saveButton.innerHTML : '';
  if (saveButton) {
    saveButton.disabled = true;
    saveButton.classList.add('is-processing');
    saveButton.setAttribute('aria-busy', 'true');
    saveButton.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>Menyimpan Status...</span>';
  }

  // Sync to Cloud / Google Apps Script
  if (window.api && typeof window.api.updateCrewStatus === 'function') {
    try {
      await window.api.updateCrewStatus(statusUpdate);

      // Apps Script POST uses no-cors and Sheets may need a few seconds before
      // the updated row is visible to the next GET. Poll the authoritative
      // snapshot instead of treating the first stale read as a failed save.
      let statusMatches = false;
      const verificationDelays = [1200, 1800, 2600, 3600, 5000];
      for (const delay of verificationDelays) {
        await new Promise(resolve => setTimeout(resolve, delay));
        const cloudSynced = await window.api.syncNow();
        const syncedCrew = window.crewDatabase.find(item => item.submissionId === crew.submissionId);
        statusMatches = Boolean(cloudSynced && syncedCrew &&
          String(syncedCrew.operationalStatus || '').trim().toUpperCase() === statusUpdate.operationalStatus &&
          properCaseText(syncedCrew.vesselCandidate) === statusUpdate.vesselCandidate &&
          properCaseText(syncedCrew.vesselAssigned) === statusUpdate.vesselAssigned);
        if (statusMatches) break;
      }

      if (!statusMatches) {
        throw new Error('Status belum terkonfirmasi pada snapshot cloud.');
      }
    } catch (err) {
      console.error("Cloud status update failed:", err);
      alert('Status belum tersimpan di cloud. Data tampilan dikembalikan ke snapshot cloud terakhir.');
      return;
    } finally {
      if (saveButton) {
        saveButton.disabled = false;
        saveButton.classList.remove('is-processing');
        saveButton.removeAttribute('aria-busy');
        saveButton.innerHTML = originalSaveButtonHtml;
      }
    }
  } else {
    if (saveButton) {
      saveButton.disabled = false;
      saveButton.classList.remove('is-processing');
      saveButton.removeAttribute('aria-busy');
      saveButton.innerHTML = originalSaveButtonHtml;
    }
    alert('Koneksi backend tidak tersedia. Status tidak disimpan.');
    return;
  }

  if (typeof loadDirectoryTable === 'function') loadDirectoryTable();
  alert(`Status operasional & data kru (${crew.fullName}) berhasil disimpan!`);
  closeCrewDetailModal();
}

function triggerPrintFromDetail() {
  if (window.currentDetailSubmissionId && typeof printCrewCV === 'function') {
    printCrewCV(window.currentDetailSubmissionId);
  }
}

// --- SUPER ADMIN AUDIT TRAIL LOG VIEWER ---
window.auditLogsCache = [];

function openAuditLogModal() {
  const modal = document.getElementById('auditLogModal');
  if (modal) {
    modal.classList.add('active');
    loadAuditLogs();
  }
}

function closeAuditLogModal() {
  const modal = document.getElementById('auditLogModal');
  if (modal) modal.classList.remove('active');
}

async function loadAuditLogs() {
  const tbody = document.getElementById('auditLogTableBody');
  if (tbody) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px; color: var(--text-muted);"><i class="fa-solid fa-spinner fa-spin"></i> Memuat data log audit dari cloud...</td></tr>';
  }

  try {
    const role = sessionStorage.getItem('auth_role') || window.currentRole || 'admin';
    const user = sessionStorage.getItem('auth_user') || 'superadmin';
    
    let res = null;
    if (window.api && typeof window.api.getAuditLogs === 'function') {
      res = await window.api.getAuditLogs({ role: role, username: user });
    }

    if (res && res.success && Array.isArray(res.logs)) {
      window.auditLogsCache = res.logs;
    } else {
      window.auditLogsCache = JSON.parse(localStorage.getItem('crew_app_audit_logs') || '[]');
    }

    renderAuditLogs();
  } catch (err) {
    console.error("Load audit logs error:", err);
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--status-error); padding: 15px;">Gagal memuat log audit: ${escapeHtml(err.message)}</td></tr>`;
    }
  }
}

function renderAuditLogs() {
  const tbody = document.getElementById('auditLogTableBody');
  if (!tbody) return;

  const searchVal = String(document.getElementById('auditLogSearch')?.value || '').toLowerCase().trim();
  const filterAction = String(document.getElementById('auditLogFilterAction')?.value || '').toUpperCase().trim();

  let logs = window.auditLogsCache || [];

  if (filterAction) {
    logs = logs.filter(l => String(l.action || '').toUpperCase() === filterAction);
  }

  if (searchVal) {
    logs = logs.filter(l => 
      String(l.timestamp || '').toLowerCase().includes(searchVal) ||
      String(l.action || '').toLowerCase().includes(searchVal) ||
      String(l.targetId || '').toLowerCase().includes(searchVal) ||
      String(l.userRole || '').toLowerCase().includes(searchVal) ||
      String(l.details || '').toLowerCase().includes(searchVal)
    );
  }

  if (logs.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px; color: var(--text-muted);">Tidak ada riwayat audit log yang cocok.</td></tr>';
    return;
  }

  const actionBadge = (act) => {
    const a = String(act || '').toUpperCase();
    if (a.includes('DELETE')) return `<span style="background: rgba(239,68,68,0.2); color: #ef4444; padding: 2px 8px; border-radius: 4px; font-weight: 600; font-size: 0.78rem;">${escapeHtml(a)}</span>`;
    if (a.includes('INPUT') || a.includes('SUBMIT')) return `<span style="background: rgba(16,185,129,0.2); color: #10b981; padding: 2px 8px; border-radius: 4px; font-weight: 600; font-size: 0.78rem;">${escapeHtml(a)}</span>`;
    if (a.includes('UPDATE') || a.includes('STATUS')) return `<span style="background: rgba(56,189,248,0.2); color: #38bdf8; padding: 2px 8px; border-radius: 4px; font-weight: 600; font-size: 0.78rem;">${escapeHtml(a)}</span>`;
    if (a.includes('LOGIN')) return `<span style="background: rgba(168,85,247,0.2); color: #c084fc; padding: 2px 8px; border-radius: 4px; font-weight: 600; font-size: 0.78rem;">${escapeHtml(a)}</span>`;
    return `<span style="background: rgba(255,255,255,0.1); color: var(--text-main); padding: 2px 8px; border-radius: 4px; font-weight: 600; font-size: 0.78rem;">${escapeHtml(a)}</span>`;
  };

  tbody.innerHTML = logs.map(l => `
    <tr>
      <td style="font-size: 0.8rem; color: var(--text-muted);">${escapeHtml(l.timestamp ? new Date(l.timestamp).toLocaleString('id-ID') : '-')}</td>
      <td>${actionBadge(l.action)}</td>
      <td style="font-weight: 600; font-size: 0.84rem; color: var(--accent);">${escapeHtml(l.userRole || 'ADMIN')}</td>
      <td style="font-family: monospace; font-size: 0.82rem;">${escapeHtml(l.targetId || '-')}</td>
      <td style="font-size: 0.84rem;">${escapeHtml(l.details || '-')}</td>
    </tr>
  `).join('');
}

window.openAuditLogModal = openAuditLogModal;
window.closeAuditLogModal = closeAuditLogModal;
window.loadAuditLogs = loadAuditLogs;
window.renderAuditLogs = renderAuditLogs;

/* ==============================================================================
 * SUPER ADMIN USER MANAGEMENT MODULE
 * Allows Super Admin to view, create, edit, and delete system users & passwords.
 * ==============================================================================
 */

const DEFAULT_USERS_DB = [
  { id: 'usr_superadmin', username: 'superadmin', password: 'SuperAdmin123!', role: 'superadmin', createdAt: '2026-08-23' },
  { id: 'usr_admin', username: 'admin', password: 'Admin123!', role: 'admin', createdAt: '2026-08-23' }
];

window.cloudUsersCache = [];

async function loadUsersFromCloud() {
  try {
    const authUser = sessionStorage.getItem('auth_user') || localStorage.getItem('auth_user') || 'superadmin';
    const authRole = sessionStorage.getItem('auth_role') || localStorage.getItem('auth_role') || 'superadmin';

    const res = await window.api.getUsers(authUser, authRole);
    if (res && res.success && Array.isArray(res.users)) {
      window.cloudUsersCache = res.users;
      return true;
    }
  } catch (e) {
    console.error("Gagal load users dari cloud:", e);
  }
  return false;
}

function getStoredUsers() {
  return window.cloudUsersCache.length > 0 ? window.cloudUsersCache : DEFAULT_USERS_DB;
}

function saveStoredUsers(users) {
  window.cloudUsersCache = users;
  try {
    localStorage.setItem('app_users_db_local_backup', JSON.stringify(users));
  } catch (e) {
    console.error("Error saving local backup:", e);
  }
}

async function openUserManagementModal() {
  const modal = document.getElementById('userManagementModal');
  if (!modal) return;

  await loadUsersFromCloud();

  resetUserForm();
  renderUserManagementTable();
  modal.classList.add('active');
}

function closeUserManagementModal() {
  const modal = document.getElementById('userManagementModal');
  if (modal) modal.classList.remove('active');
  resetUserForm();
}

function resetUserForm() {
  const formTitle = document.getElementById('userFormTitle');
  const inputId = document.getElementById('userMgmtId');
  const inputUser = document.getElementById('userMgmtUsername');
  const inputPass = document.getElementById('userMgmtPassword');
  const inputRole = document.getElementById('userMgmtRole');

  if (formTitle) formTitle.innerHTML = '<i class="fa-solid fa-user-plus"></i> Tambah User Baru';
  if (inputId) inputId.value = '';
  if (inputUser) {
    inputUser.value = '';
    inputUser.disabled = false;
  }
  if (inputPass) inputPass.value = '';
  if (inputRole) inputRole.value = 'admin';
}

function renderUserManagementTable() {
  const tbody = document.getElementById('userManagementTbody');
  if (!tbody) return;

  const users = getStoredUsers();
  if (users.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px; color: var(--text-muted);">Belum ada user terdaftar.</td></tr>';
    return;
  }

  const currentUser = sessionStorage.getItem('auth_user') || 'superadmin';

  let html = '';
  users.forEach((u, i) => {
    const isSuper = u.role === 'superadmin';
    const roleBadge = isSuper 
      ? '<span style="background: rgba(168,85,247,0.18); color: #c084fc; border: 1px solid rgba(168,85,247,0.3); padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 700;">Super Admin</span>'
      : '<span style="background: rgba(56,189,248,0.18); color: #38bdf8; border: 1px solid rgba(56,189,248,0.3); padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 700;">Admin Manning</span>';
    
    const isSelf = u.username.toLowerCase() === currentUser.toLowerCase();

    html += `
      <tr style="border-bottom: 1px solid var(--border-color);">
        <td style="text-align: center; padding: 8px; color: var(--text-muted);">${i + 1}</td>
        <td style="font-weight: 600; padding: 8px; color: var(--text-main);">${escapeHTML(u.username)} ${isSelf ? ' <small style="color: var(--status-success);">(Aktif)</small>' : ''}</td>
        <td style="padding: 8px;">${roleBadge}</td>
        <td style="font-size: 0.8rem; padding: 8px; color: var(--text-muted);">Password Set (${u.password ? '••••••••' : 'Default'})</td>
        <td style="text-align: center; padding: 8px; display: flex; gap: 6px; justify-content: center;">
          <button class="btn-secondary" onclick="editUserInModal('${escapeHTML(u.id)}')" style="padding: 3px 8px; font-size: 0.75rem;" title="Edit Password / Role">
            <i class="fa-solid fa-pen-to-square"></i> Edit
          </button>
          ${!isSelf && u.username !== 'superadmin' ? `
            <button class="btn-secondary" onclick="deleteUserInModal('${escapeHTML(u.id)}')" style="padding: 3px 8px; font-size: 0.75rem; color: var(--status-error); border-color: var(--status-error);" title="Hapus User">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          ` : ''}
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
}

async function saveUserFromModal(e) {
  if (e) e.preventDefault();

  const inputId = document.getElementById('userMgmtId');
  const inputUser = document.getElementById('userMgmtUsername');
  const inputPass = document.getElementById('userMgmtPassword');
  const inputRole = document.getElementById('userMgmtRole');

  const userId = inputId ? inputId.value.trim() : '';
  const username = inputUser ? inputUser.value.trim() : '';
  const password = inputPass ? inputPass.value.trim() : '';
  const role = inputRole ? inputRole.value : 'admin';

  if (!username || !password) {
    if (typeof showNotification === 'function') showNotification('Username dan password wajib diisi.', 'warning');
    return;
  }

  const authUser = sessionStorage.getItem('auth_user') || localStorage.getItem('auth_user') || 'superadmin';
  const authRole = sessionStorage.getItem('auth_role') || localStorage.getItem('auth_role') || 'superadmin';

  const userObj = {
    id: userId || ('usr_' + Date.now()),
    username: username,
    password: password,
    role: role,
    createdAt: new Date().toISOString().split('T')[0]
  };

  try {
    const res = await window.api.saveUser(authUser, authRole, userObj);
    if (res && res.success) {
      if (typeof showNotification === 'function') showNotification(`User '${username}' berhasil disimpan.`, 'success');
      await loadUsersFromCloud();
      resetUserForm();
      renderUserManagementTable();
    } else {
      if (typeof showNotification === 'function') showNotification(res?.message || 'Gagal menyimpan user.', 'error');
    }
  } catch (err) {
    console.error('Save user error:', err);
    if (typeof showNotification === 'function') showNotification('Gagal menyimpan user ke cloud.', 'error');
  }
}

function editUserInModal(userId) {
  const users = getStoredUsers();
  const target = users.find(u => u.id === userId);
  if (!target) return;

  const formTitle = document.getElementById('userFormTitle');
  const inputId = document.getElementById('userMgmtId');
  const inputUser = document.getElementById('userMgmtUsername');
  const inputPass = document.getElementById('userMgmtPassword');
  const inputRole = document.getElementById('userMgmtRole');

  if (formTitle) formTitle.innerHTML = `<i class="fa-solid fa-user-pen"></i> Edit User: <strong>${escapeHTML(target.username)}</strong>`;
  if (inputId) inputId.value = target.id;
  if (inputUser) {
    inputUser.value = target.username;
    inputUser.disabled = true; // Username cannot be changed once created
  }
  if (inputPass) inputPass.value = target.password || '';
  if (inputRole) inputRole.value = target.role || 'admin';
}

async function deleteUserInModal(userId) {
  const users = getStoredUsers();
  const target = users.find(u => u.id === userId);
  if (!target) return;

  if (target.username === 'superadmin') {
    if (typeof showNotification === 'function') showNotification('User superadmin utama tidak dapat dihapus.', 'error');
    return;
  }

  if (!confirm(`Apakah Anda yakin ingin menghapus user '${target.username}'?`)) return;

  const authUser = sessionStorage.getItem('auth_user') || localStorage.getItem('auth_user') || 'superadmin';
  const authRole = sessionStorage.getItem('auth_role') || localStorage.getItem('auth_role') || 'superadmin';

  try {
    const res = await window.api.deleteUser(authUser, authRole, userId);
    if (res && res.success) {
      if (typeof showNotification === 'function') showNotification(`User '${target.username}' berhasil dihapus.`, 'info');
      await loadUsersFromCloud();
      renderUserManagementTable();
    } else {
      if (typeof showNotification === 'function') showNotification(res?.message || 'Gagal menghapus user.', 'error');
    }
  } catch (err) {
    console.error('Delete user error:', err);
    if (typeof showNotification === 'function') showNotification('Gagal menghapus user dari cloud.', 'error');
  }
}

window.loadUsersFromCloud = loadUsersFromCloud;
window.getStoredUsers = getStoredUsers;
window.saveStoredUsers = saveStoredUsers;
window.openUserManagementModal = openUserManagementModal;
window.closeUserManagementModal = closeUserManagementModal;
window.resetUserForm = resetUserForm;
window.renderUserManagementTable = renderUserManagementTable;
window.saveUserFromModal = saveUserFromModal;
window.editUserInModal = editUserInModal;
window.deleteUserInModal = deleteUserInModal;
