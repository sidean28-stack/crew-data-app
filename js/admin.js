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
    const matchesRank = !filterRank || crew.rankPosition === filterRank;
    return matchesSearch && matchesRank;
  });

  if (countText) countText.textContent = filtered.length;

  if (filtered.length === 0) {
    const msg = searchQuery 
      ? `Data kru tidak ditemukan untuk kata pencarian "${escapeHTML(searchQuery)}". Hapus kata kunci untuk menampilkan semua kru (${window.crewDatabase.length} kru terdaftar).` 
      : 'Belum ada data kru terdaftar.';
    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 30px; color: var(--text-muted);">${msg}</td></tr>`;
    return;
  }

  const isUnmasked = (window.currentRole === 'admin' || window.activeToken !== null);

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
            ${window.currentRole === 'admin' ? `
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
  if (!crew.passportExpiry) return { text: "No Date", badgeClass: "badge-expiry-yellow" };
  const expDate = new Date(crew.passportExpiry);
  const diffDays = Math.ceil((expDate - new Date()) / (1000 * 60 * 60 * 24));
  if (diffDays < 90) return { text: `🔴 Expired / < 90 Hari (${diffDays} hr)`, badgeClass: "badge-expiry-red" };
  if (diffDays < 180) return { text: `🟡 Warning (< 180 Hari)`, badgeClass: "badge-expiry-yellow" };
  return { text: `🟢 Valid (${diffDays} hr)`, badgeClass: "badge-expiry-green" };
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

function executeDeleteCrew() {
  const submissionId = document.getElementById('deleteTargetId').value;
  const index = window.crewDatabase.findIndex(c => c.submissionId === submissionId);
  if (index >= 0) {
    window.crewDatabase.splice(index, 1);
    if (typeof saveLocalDatabase === 'function') saveLocalDatabase();
    loadDirectoryTable();
    if (typeof renderCatalogGrid === 'function') renderCatalogGrid();
    alert("Data kru berhasil dihapus!");
  }
  closeDeleteModal();
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
            return { name: dk.toUpperCase() + ' File', url: item, base64: item };
          } else if (item && typeof item === 'object') {
            return {
              name: item.name || (dk.toUpperCase() + ' File'),
              url: item.url || item.base64 || '',
              base64: item.base64 || item.url || ''
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

async function handleExcelImport(event) {
  const file = event.target.files[0];
  if (!file) return;

  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

  if (rows.length === 0) {
    alert("Excel kosong.");
    return;
  }

  const mapKey = (headerName) => {
    headerName = headerName.toLowerCase();
    if (headerName.includes("id submisi") || headerName === "id") return "submissionId";
    if (headerName.includes("nama lengkap") || headerName.includes("full name") || headerName.includes("nama")) return "fullName";
    if (headerName.includes("nama mandarin") || headerName.includes("chinese")) return "chineseName";
    if (headerName.includes("jabatan") || headerName.includes("posisi")) return "rankPosition";
    if (headerName.includes("hp") || headerName.includes("wa") || headerName.includes("phone")) return "phoneNo";
    if (headerName.includes("alamat")) return "streetAddress";
    if (headerName.includes("keluarga 1") && !headerName.includes("telp")) return "fam1Name";
    if (headerName.includes("telp keluarga 1")) return "fam1Phone";
    if (headerName.includes("keluarga 2") && !headerName.includes("telp")) return "fam2Name";
    if (headerName.includes("telp keluarga 2")) return "fam2Phone";
    if (headerName.includes("pengalaman") || headerName.includes("longline")) return "expLongline";
    if (headerName.includes("nama kapal")) return "vesselName";
    if (headerName.includes("jenis kapal")) return "vesselTypeLongline";
    if (headerName.includes("asal kapal")) return "vesselOrigin";
    if (headerName.includes("penempatan") || headerName.includes("negara")) return "placementCountry";
    if (headerName.includes("skill")) return "skillGeneral";
    if (headerName.includes("paspor") || headerName.includes("passport")) {
      if (headerName.includes("expired") || headerName.includes("exp")) return "passportExpiry";
      return "passportNo";
    }
    if (headerName.includes("seaman book") || headerName.includes("cdc") || headerName.includes("buku pelaut")) {
      if (headerName.includes("expired") || headerName.includes("exp")) return "cdcExpiry";
      return "cdcNo";
    }
    if (headerName.includes("bst")) return "bstExpiry";
    if (headerName.includes("kk")) return "kkStatus";
    if (headerName.includes("mcu")) return "medicalStatus";
    if (headerName.includes("baju")) return "shirtSize";
    if (headerName.includes("sepatu")) return "shoeSize";
    return null;
  };

  let totalParsed = 0;
  let duplicateCount = 0;
  let newCount = 0;
  pendingExcelData = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    let crewData = {};
    
    for (let key in row) {
      const mappedKey = mapKey(key);
      if (mappedKey && row[key]) {
        crewData[mappedKey] = String(row[key]).trim();
      }
    }
    
    if (!crewData.submissionId) crewData.submissionId = "IMP-" + Date.now() + "-" + i;
    if (!crewData.fullName) continue; 

    const existing = window.crewDatabase.find(c => 
      c.submissionId === crewData.submissionId || 
      (crewData.passportNo && c.passportNo === crewData.passportNo) ||
      (crewData.cdcNo && c.cdcNo === crewData.cdcNo)
    );
    
    if (existing) {
       crewData._isDuplicate = true;
       crewData._existingId = existing.submissionId;
       duplicateCount++;
    } else {
       crewData._isDuplicate = false;
       newCount++;
    }
    
    pendingExcelData.push(crewData);
    totalParsed++;
  }

  document.getElementById("excelPreviewStats").innerHTML = `
    <ul style="list-style: none; padding: 0;">
      <li><strong>Total Baris Ditemukan:</strong> ${totalParsed}</li>
      <li><strong style="color: var(--status-error);">Kru Duplikat (Akan Ditimpa):</strong> ${duplicateCount}</li>
      <li><strong style="color: var(--status-success);">Kru Baru:</strong> ${newCount}</li>
    </ul>
    <p style="font-size: 0.85rem; color: #666; margin-top: 10px;">Catatan: Sistem mendeteksi duplikat dari Nomor Paspor, Buku Pelaut, atau ID.</p>
  `;

  document.getElementById("excelImportProgressContainer").style.display = "none";
  document.getElementById("excelPreviewButtons").style.display = "flex";
  document.getElementById("excelPreviewModal").classList.add("active");
  event.target.value = '';
}

function closeExcelPreview() {
  document.getElementById("excelPreviewModal").classList.remove("active");
  pendingExcelData = [];
}

async function confirmExcelImport() {
  document.getElementById("excelPreviewButtons").style.display = "none";
  document.getElementById("excelImportProgressContainer").style.display = "block";
  
  const progressBar = document.getElementById("excelProgressBar");
  const progressText = document.getElementById("excelProgressText");
  const progressPercentage = document.getElementById("excelProgressPercentage");
  
  let importedCount = 0;
  const total = pendingExcelData.length;

  for (let i = 0; i < total; i++) {
    const crewData = pendingExcelData[i];
    let action = "submit_crew";
    
    let payload = { ...crewData };
    delete payload._isDuplicate;
    delete payload._existingId;
    
    if (crewData._isDuplicate) {
       const idx = window.crewDatabase.findIndex(c => c.submissionId === crewData._existingId);
       if (idx !== -1) {
          window.crewDatabase[idx] = { ...window.crewDatabase[idx], ...payload };
          // the payload sent to GAS should have the full merged data, especially existing submissionId
          payload = { ...window.crewDatabase[idx] };
       }
       action = "update_crew";
    } else {
       payload.status = "WAITING";
       payload.documents = { passport:[], ktp:[], cdc:[], medical:[], photo:[] };
       window.crewDatabase.unshift(payload);
    }
    
    // UI Update immediate
    importedCount++;
    const pct = Math.round((importedCount / total) * 100);
    progressBar.style.width = pct + "%";
    progressText.innerText = `Memproses Kru ${importedCount} dari ${total}`;
    progressPercentage.innerText = pct + "%";
    
    try {
      payload.action = action;
      // Backup UI changes before sending to backend
      if (typeof saveLocalDatabase === 'function') saveLocalDatabase();
      
      await fetch(getGasUrl(), {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      // Added a tiny delay to prevent Apps Script concurrent request limitation drop
      await new Promise(resolve => setTimeout(resolve, 300));
    } catch(e) { 
      console.error("GAS Sync Error:", e);
    }
  }
  
  progressText.innerText = `Berhasil Import ${importedCount} Kru!`;
  loadDirectoryTable();
  if (typeof renderCatalogGrid === 'function') renderCatalogGrid();
  
  setTimeout(() => {
    closeExcelPreview();
  }, 2000);
}

function exportDirectoryExcel() {
  if (!window.crewDatabase || window.crewDatabase.length === 0) { 
    alert("Tidak ada data kru untuk diekspor."); 
    return; 
  }

  const exportData = window.crewDatabase.map(c => {
    let skillsText = '-';
    if (Array.isArray(c.skillGeneral) && c.skillGeneral.length > 0) {
      skillsText = c.skillGeneral.join(', ');
    } else if (c.skillGeneral) {
      skillsText = c.skillGeneral;
    }

    return {
      "ID Submisi": c.submissionId || '',
      "Nama Lengkap": c.fullName || '',
      "Nama Mandarin (中文名)": c.chineseName || '',
      "Jabatan / Posisi": c.rankPosition || '',
      "No. HP / WA": c.phoneNo || '',
      "Alamat Lengkap": c.combinedAddress || c.streetAddress || '',
      "Kontak Darurat 1": (c.fam1Name || '') + (c.fam1Relation ? ' (' + c.fam1Relation + ')' : ''),
      "Telp Darurat 1": c.fam1Phone || '',
      "Kontak Darurat 2": (c.fam2Name || '') + (c.fam2Relation ? ' (' + c.fam2Relation + ')' : ''),
      "Telp Darurat 2": c.fam2Phone || '',
      "Pengalaman Longline": c.expLongline || '',
      "Nama Kapal 1-3": c.vesselName || '',
      "Sign On/Off 1-3": c.signOnOff || '',
      "Jenis Kapal": c.vesselTypeLongline || '',
      "Asal Kapal": c.vesselOrigin || '',
      "Negara Penempatan 1-3": c.placementCountry || '',
      "Skill Umum": skillsText,
      "No. Paspor": c.passportNo || '',
      "Expired Paspor": c.passportExpiry || '',
      "No. Buku Pelaut": c.cdcNo || '',
      "Expired Buku Pelaut": c.cdcExpiry || '',
      "Expired BST": c.bstExpiry || '',
      "Status KK": c.kkStatus || '',
      "Status Akte": c.akteStatus || '',
      "Status Ijazah": c.ijazahLevel || '',
      "Status MCU": c.medicalStatus || '',
      "Status Surat Wali": c.waliStatus || '',
      "Status SKCK": c.skckStatus || '',
      "Ukuran Baju": c.shirtSize || '',
      "Ukuran Sepatu": c.shoeSize || '',
      "Tgl Lahir": c.dob || '',
      "Jenis Kelamin": c.gender || '',
      "Agama": c.religion || '',
      "Status Operasional": c.operationalStatus || c.status || 'STAND_BY',
      "Kandidat Kapal": c.vesselCandidate || '',
      "Nama Kapal Penempatan": c.vesselAssigned || '',
      "Tgl Terbang": c.flightDate || '',
      "Tgl Finish": c.finishDate || '',
      "Riwayat Status": c.historyStatus || '',
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

  const printWindow = window.open('', '_blank');
  
  // Ambil foto profil (index 0) jika ada, format 4x6
  let photoHtml = '<div style="margin-top: 80px; font-size: 10pt;">4 x 6 cm</div>';
  if (crew.documents && crew.documents.photo && crew.documents.photo.length > 0) {
    photoHtml = `<img src="${crew.documents.photo[0].base64}">`;
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
    skillsHtml = crew.skillGeneral.map(s => `&#10003; ${s}`).join('<br>');
  } else if (typeof crew.skillGeneral === 'string' && crew.skillGeneral.trim() !== '') {
    skillsHtml = crew.skillGeneral.split(',').map(s => `&#10003; ${s.trim()}`).join('<br>');
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
  const qrImage = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${qrUrl}" alt="QR Code">`;

  // Attachments HTML (Halaman 2)
  let attachmentsHtml = '';
  const docNames = {
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
          attachmentsHtml += `
            <div style="margin-bottom: 40px; text-align: center; page-break-inside: avoid;">
              <h4 style="margin-bottom: 10px; border-bottom: 1px solid #ccc; padding-bottom: 5px;">${label}</h4>
              <img src="${doc.base64}" style="max-width: 100%; max-height: 800px; border: 1px solid #999; padding: 5px;">
            </div>
          `;
        });
      }
    }
  }

  let page2Html = '';
  if (attachmentsHtml) {
    page2Html = `
      <div style="page-break-before: always;"></div>
      <div class="header">
        <h1>DOCUMENT ATTACHMENTS</h1>
        <p>附件文件 - ${crew.fullName} (${crew.submissionId})</p>
      </div>
      <div class="attachments-container">
        ${attachmentsHtml}
      </div>
    `;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>CV - ${crew.fullName}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 30px; color: #000; line-height: 1.4; }
        .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 20px; }
        .header h1 { margin: 0; font-size: 22pt; font-weight: bold; letter-spacing: 1px; }
        .header h2 { margin: 5px 0 0 0; font-size: 14pt; color: #333; }
        .header p { margin: 5px 0 0 0; font-size: 14pt; font-weight: bold; }
        
        .grid { display: grid; grid-template-columns: 1fr auto; gap: 30px; margin-bottom: 20px; }
        
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { border: 1px solid #000; padding: 8px 10px; font-size: 10pt; text-align: left; vertical-align: top; }
        th { background: #f4f4f4; width: 35%; }
        
        /* Photo 4x6 cm approx 151x226px at 96 DPI */
        .photo-box { width: 151px; height: 226px; border: 1px solid #000; display: flex; align-items: center; justify-content: center; overflow: hidden; background: #fff; padding: 2px; }
        .photo-box img { width: 100%; height: 100%; object-fit: cover; }
        
        .lbl-id { font-size: 10pt; display: block; font-weight: bold; }
        .lbl-en { font-size: 8.5pt; color: #444; display: block; margin-top: 2px; font-weight: normal; }
        .lbl-tw { font-size: 9pt; font-weight: bold; color: #000; display: block; margin-top: 1px; }
        
        .signature-section { display: flex; justify-content: space-between; margin-top: 40px; }
        .signature-box { text-align: center; width: 250px; }
        .signature-title { font-size: 10pt; font-weight: bold; margin-bottom: 2px; }
        .signature-tw { font-size: 9pt; color: #333; margin-bottom: 60px; }
        .signature-line { border-bottom: 1px solid #000; width: 100%; margin: 0 auto; }
        
        .footer { margin-top: 30px; text-align: left; font-size: 8pt; color: #555; border-top: 2px solid #000; padding-top: 15px; display: flex; justify-content: space-between; align-items: center; }
        
        .qr-container { text-align: center; }
        .qr-container img { width: 80px; height: 80px; border: 1px solid #ccc; padding: 2px; }
        .qr-container p { font-size: 7.5pt; margin: 4px 0 0 0; color: #333; font-weight: bold; }
        .qr-container p.qr-tw { font-weight: normal; margin-top: 2px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>CURRICULUM VITAE</h1>
        <h2>LONGLINE FISHING CREW</h2>
        <p>遠洋延繩釣船員履歷表</p>
      </div>

      <div class="grid">
        <table>
          <tr>
            <th>
              <span class="lbl-id">Nama Lengkap</span>
              <span class="lbl-en">Full Name</span>
              <span class="lbl-tw">姓名</span>
            </th>
            <td style="font-size: 12pt;"><strong>${crew.fullName}</strong></td>
          </tr>
          <tr>
            <th>
              <span class="lbl-id">Nama Mandarin</span>
              <span class="lbl-en">Chinese Name</span>
              <span class="lbl-tw">中文姓名</span>
            </th>
            <td style="font-size: 12pt;"><strong>${crew.chineseName || '-'}</strong></td>
          </tr>
          <tr>
            <th>
              <span class="lbl-id">ID Kru</span>
              <span class="lbl-en">Crew ID</span>
              <span class="lbl-tw">船員編號</span>
            </th>
            <td>${crew.submissionId}</td>
          </tr>
          <tr>
            <th>
              <span class="lbl-id">Jabatan</span>
              <span class="lbl-en">Position</span>
              <span class="lbl-tw">職務</span>
            </th>
            <td style="font-size: 11pt;"><strong>${crew.rankPosition}</strong></td>
          </tr>
          <tr>
            <th>
              <span class="lbl-id">Tanggal Lahir</span>
              <span class="lbl-en">Date of Birth</span>
              <span class="lbl-tw">出生日期</span>
            </th>
            <td>${crew.dob}</td>
          </tr>
          <tr>
            <th>
              <span class="lbl-id">Umur</span>
              <span class="lbl-en">Age</span>
              <span class="lbl-tw">年齡</span>
            </th>
            <td>${age} Tahun / Years / 歲</td>
          </tr>
          <tr>
            <th>
              <span class="lbl-id">Jenis Kelamin</span>
              <span class="lbl-en">Gender</span>
              <span class="lbl-tw">性別</span>
            </th>
            <td>${crew.gender === 'Male' ? 'Laki-laki / Male / 男' : (crew.gender === 'Female' ? 'Perempuan / Female / 女' : crew.gender)}</td>
          </tr>
          <tr>
            <th>
              <span class="lbl-id">Agama</span>
              <span class="lbl-en">Religion</span>
              <span class="lbl-tw">宗教</span>
            </th>
            <td>${crew.religion}</td>
          </tr>
          <tr>
            <th>
              <span class="lbl-id">Alamat</span>
              <span class="lbl-en">Address</span>
              <span class="lbl-tw">地址</span>
            </th>
            <td>${crew.combinedAddress || crew.streetAddress}</td>
          </tr>
          <tr>
            <th>
              <span class="lbl-id">Kontak Darurat</span>
              <span class="lbl-en">Emergency Contact</span>
              <span class="lbl-tw">緊急聯絡人</span>
            </th>
            <td>${crew.fam1Name} (${crew.fam1Relation}): ${crew.fam1Phone}</td>
          </tr>
        </table>
        
        <div>
          <div class="photo-box">
            ${photoHtml}
          </div>
        </div>
      </div>

      <h3 style="margin-bottom: 10px; border-bottom: 1px solid #ccc; padding-bottom: 5px;">KUALIFIKASI / QUALIFICATIONS / 資格</h3>
      <table>
        <tr>
          <th>
            <span class="lbl-id">Pengalaman Longline</span>
            <span class="lbl-en">Years of Experience</span>
            <span class="lbl-tw">工作年資</span>
          </th>
          <td><strong>${crew.expLongline}</strong></td>
        </tr>
        <tr>
          <th>
            <span class="lbl-id">Jenis Kapal</span>
            <span class="lbl-en">Vessel Type</span>
            <span class="lbl-tw">船型</span>
          </th>
          <td>${crew.vesselTypeLongline} (${crew.vesselOrigin})</td>
        </tr>
        <tr>
          <th>
            <span class="lbl-id">Negara Penempatan</span>
            <span class="lbl-en">Available for</span>
            <span class="lbl-tw">可派遣地區</span>
          </th>
          <td><strong>${crew.placementCountry || '-'}</strong></td>
        </tr>
        <tr>
          <th>
            <span class="lbl-id">Skill Umum</span>
            <span class="lbl-en">General Skills</span>
            <span class="lbl-tw">一般技能</span>
          </th>
          <td style="line-height: 1.6;">${skillsHtml}</td>
        </tr>
      </table>

      <h3 style="margin-bottom: 10px; border-bottom: 1px solid #ccc; padding-bottom: 5px;">STATUS DOKUMEN / DOCUMENT STATUS / 文件狀態</h3>
      <table style="text-align: center;">
        <tr>
          <th style="text-align: center; width: 33%;">Document<br><span style="font-weight:normal; font-size:9pt;">文件</span></th>
          <th style="text-align: center; width: 33%;">Status<br><span style="font-weight:normal; font-size:9pt;">狀態</span></th>
          <th style="text-align: center; width: 33%;">Chinese<br><span style="font-weight:normal; font-size:9pt;">中文</span></th>
        </tr>
        <tr>
          <td><strong>Passport</strong><br><span style="font-size: 8pt; color: #555;">${crew.passportNo}</span></td>
          <td>${isPassportValid ? 'Valid until ' + crew.passportExpiry : 'Expired / None'}</td>
          <td style="font-weight: bold;">${isPassportValid ? '有效至 ' + crew.passportExpiry : '無效'}</td>
        </tr>
        <tr>
          <td><strong>Seaman Book</strong><br><span style="font-size: 8pt; color: #555;">${crew.cdcNo}</span></td>
          <td>${isCdcValid ? 'Valid until ' + crew.cdcExpiry : 'Expired / None'}</td>
          <td style="font-weight: bold;">${isCdcValid ? '有效至 ' + crew.cdcExpiry : '無效'}</td>
        </tr>
        <tr>
          <td><strong>MCU</strong></td>
          <td>${crew.medicalStatus === 'Ada' ? 'Available' : 'Expired / None'}</td>
          <td style="font-weight: bold;">${crew.medicalStatus === 'Ada' ? '已提供' : '無'}</td>
        </tr>
        <tr>
          <td><strong>BST</strong></td>
          <td>${isBstValid ? 'Valid until ' + crew.bstExpiry : 'Expired / None'}</td>
          <td style="font-weight: bold;">${isBstValid ? '有效至 ' + crew.bstExpiry : '無'}</td>
        </tr>
        <tr>
          <td><strong>SKCK / ID Card</strong></td>
          <td>${(crew.kkStatus === 'Ada' || crew.akteStatus === 'Ada') ? 'Available' : 'None'}</td>
          <td style="font-weight: bold;">${(crew.kkStatus === 'Ada' || crew.akteStatus === 'Ada') ? '已提供' : '無'}</td>
        </tr>
      </table>

      <div class="signature-section">
        <div class="signature-box">
          <div class="signature-title">Crew Signature</div>
          <div class="signature-tw">船員簽名</div>
          <div class="signature-line"></div>
        </div>
        
        <div class="signature-box">
          <div class="signature-title">Authorized Manning Agency</div>
          <div class="signature-tw">PT ALINDA PRIMA SENTOSA<br>合法船員派遣公司</div>
          <div class="signature-line"></div>
        </div>
      </div>
      
      <div class="footer">
        <div>
          Generated by<br>
          <strong>Longline Crew Management System</strong><br>
          Version 2.0<br>
          <strong>PT ALINDA PRIMA SENTOSA</strong>
        </div>
        <div class="qr-container">
          ${qrImage}
          <p>Scan to View Complete Profile</p>
          <p class="qr-tw">掃描查看完整資料</p>
        </div>
      </div>

      ${page2Html}

      <script>
        window.onload = function() { 
          setTimeout(() => { window.print(); }, 500); 
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

  window.currentDetailSubmissionId = submissionId;

  const modalTitle = document.getElementById('detailModalTitle');
  const modalBadge = document.getElementById('detailSubmisiBadge');
  if (modalTitle) modalTitle.innerText = `Profile & Operational Status: ${crew.fullName}`;
  if (modalBadge) modalBadge.innerText = `ID: ${crew.submissionId}`;

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
    <div style="display: grid; grid-template-columns: 110px 1fr; gap: 4px; margin-bottom: 8px;">
      <strong>Nama Lengkap:</strong> <span><strong>${escapeHTML(crew.fullName)}</strong> ${crew.chineseName ? `(${escapeHTML(crew.chineseName)})` : ''}</span>
      <strong>Jabatan:</strong> <span><span class="rank-badge">${escapeHTML(crew.rankPosition)}</span></span>
      <strong>Tgl Lahir / Umur:</strong> <span>${escapeHTML(crew.dob || '-')} (${age} Tahun)</span>
      <strong>Jenis Kelamin:</strong> <span>${escapeHTML(crew.gender === 'Male' ? 'Laki-laki (男)' : (crew.gender === 'Female' ? 'Perempuan (女)' : (crew.gender || '-')))}</span>
      <strong>Agama:</strong> <span>${escapeHTML(crew.religion || '-')}</span>
      <strong>Tinggi / Berat:</strong> <span>${escapeHTML(crew.heightCm || '-')} cm / ${escapeHTML(crew.weightKg || '-')} kg</span>
      <strong>Ukuran Baju/Sepatu:</strong> <span>${escapeHTML(crew.shirtSize || '-')} / ${escapeHTML(crew.shoeSize || '-')}</span>
      <strong>No. HP / WA:</strong> <span>${escapeHTML(crew.phoneNo || '-')}</span>
      <strong>Alamat Lengkap:</strong> <span>${escapeHTML(crew.combinedAddress || crew.streetAddress || '-')}</span>
      <strong>Kontak Darurat 1:</strong> <span>${escapeHTML(crew.fam1Name || '-')} (${escapeHTML(crew.fam1Relation || '-')}): ${escapeHTML(crew.fam1Phone || '-')}</span>
      <strong>Kontak Darurat 2:</strong> <span>${escapeHTML(crew.fam2Name || '-')} (${escapeHTML(crew.fam2Relation || '-')}): ${escapeHTML(crew.fam2Phone || '-')}</span>
    </div>
    
    <div style="border-top: 1px solid var(--border-color); padding-top: 8px; margin-top: 8px;">
      <h5 style="margin: 0 0 6px 0; font-size: 0.85rem; color: var(--primary);">Kualifikasi & Pengalaman Berlayar:</h5>
      <div style="display: grid; grid-template-columns: 120px 1fr; gap: 4px;">
        <strong>Pengalaman:</strong> <span>${escapeHTML(crew.expLongline || '-')}</span>
        <strong>Riwayat Kapal:</strong> <span>${escapeHTML(crew.vesselName || '-')}</span>
        <strong>Sign On / Off:</strong> <span>${escapeHTML(crew.signOnOff || '-')}</span>
        <strong>Jenis & Asal Kapal:</strong> <span>${escapeHTML(crew.vesselTypeLongline || '-')} (${escapeHTML(crew.vesselOrigin || '-')})</span>
        <strong>Negara Penempatan:</strong> <span>${escapeHTML(crew.placementCountry || '-')}</span>
        <strong>Skill Umum:</strong> <span>${escapeHTML(skillsText)}</span>
      </div>
    </div>
  `;
  const infoEl = document.getElementById('detailInfoContent');
  if (infoEl) infoEl.innerHTML = infoHtml;

  // Left Column Document Buttons
  let docButtonsHtml = '';
  const docLabels = {
    passport: 'Paspor', ktp: 'KTP', cdc: 'Buku Pelaut', medical: 'MCU',
    bst: 'BST', kk: 'KK', akte: 'Akte', skck: 'SKCK', cert: 'Sertifikat', photo: 'Foto'
  };

  if (crew.documents) {
    for (const [key, label] of Object.entries(docLabels)) {
      if (crew.documents[key] && crew.documents[key].length > 0) {
        const firstDoc = crew.documents[key][0];
        const imgSrc = typeof resolveImgSrc === 'function' ? resolveImgSrc(firstDoc) : (firstDoc.base64 || firstDoc.url);
        if (imgSrc) {
          docButtonsHtml += `
            <button class="btn-secondary" style="padding: 4px 8px; font-size: 0.75rem;" onclick="openImagePreview('${imgSrc}')">
              <i class="fa-solid fa-file-image"></i> ${label}
            </button>
          `;
        }
      }
    }
  }
  if (!docButtonsHtml) docButtonsHtml = '<span style="color: var(--text-muted); font-size: 0.8rem;">Belum ada foto berkas terunggah.</span>';
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

  crew.operationalStatus = selectedOpStatus;
  crew.status = selectedOpStatus;
  crew.vesselCandidate = document.getElementById('detailVesselCandidate')?.value.trim() || '';
  crew.vesselAssigned = document.getElementById('detailVesselAssigned')?.value.trim() || '';
  crew.flightDate = document.getElementById('detailFlightDate')?.value || '';
  crew.finishDate = document.getElementById('detailFinishDate')?.value || '';
  crew.historyStatus = document.getElementById('detailHistoryStatus')?.value || '';
  crew.adminNotes = document.getElementById('detailAdminNotes')?.value.trim() || '';

  // Save to local storage cache
  if (typeof saveLocalDatabase === 'function') saveLocalDatabase();

  // Sync to Cloud / Google Apps Script
  if (window.api && typeof window.api.updateCrew === 'function') {
    try {
      await window.api.updateCrew(crew);
    } catch (err) {
      console.warn("Cloud update notice:", err);
    }
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
