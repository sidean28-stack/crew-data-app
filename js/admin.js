function deduplicateLocalCrewDatabase() {
  if (!Array.isArray(window.crewDatabase)) return;
  const seen = new Set();
  const clean = [];
  window.crewDatabase.forEach(crew => {
    const key = (crew.submissionId || '').trim().toLowerCase() || (crew.fullName || '').trim().toLowerCase();
    if (key && !seen.has(key)) {
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

  const searchQuery = (document.getElementById('dirSearchInput')?.value || '').toLowerCase();
  const filterRank = document.getElementById('dirFilterRank')?.value || '';

  const filtered = window.crewDatabase.filter(crew => {
    const matchesSearch = !searchQuery || 
      (crew.fullName || "").toLowerCase().includes(searchQuery) ||
      (crew.rankPosition || "").toLowerCase().includes(searchQuery) ||
      (crew.passportNo || "").toLowerCase().includes(searchQuery);
    const matchesRank = !filterRank || crew.rankPosition === filterRank;
    return matchesSearch && matchesRank;
  });

  if (countText) countText.textContent = filtered.length;

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 30px;">Data kru tidak ditemukan.</td></tr>`;
    return;
  }

  const isUnmasked = (window.currentRole === 'admin' || window.activeToken !== null);

  tbody.innerHTML = filtered.map(crew => {
    const displayName = isUnmasked ? crew.fullName : maskName(crew.fullName);
    const displayPhone = isUnmasked ? crew.phoneNo : maskString(crew.phoneNo, 4);
    const expiryStatus = getDocExpiryStatus(crew);
    let currentStatus = crew.status || 'WAITING';
    
    // Status Badge Styling based on selection
    let statusStyle = "color: var(--text-muted);";
    if (currentStatus === 'SELECTED') statusStyle = "color: var(--status-success); font-weight: bold;";
    if (currentStatus === 'REJECTED') statusStyle = "color: var(--status-error);";
    if (currentStatus === 'PRIORITY') statusStyle = "color: #8b5cf6; font-weight: bold;";

    return `
      <tr>
        <td><strong>${escapeHTML(crew.submissionId)}</strong></td>
        <td class="crew-name-cell">
          ${escapeHTML(displayName)}
          ${crew.chineseName ? `<br><small style="color: var(--accent-teal);">${escapeHTML(crew.chineseName)}</small>` : ''}
        </td>
        <td><span class="rank-badge">${escapeHTML(crew.rankPosition)}</span></td>
        <td style="font-size: 0.82rem; color: var(--accent-amber);">${escapeHTML(crew.expLongline || '-')}</td>
        <td>${escapeHTML(displayPhone)}</td>
        <td><span class="${escapeHTML(expiryStatus.badgeClass)}">${escapeHTML(expiryStatus.text)}</span></td>
        <td><span class="status-badge" style="${escapeHTML(statusStyle)}">${escapeHTML(currentStatus)}</span></td>
        <td>
          <div style="display: flex; gap: 6px;">
            <button class="btn-secondary" style="padding: 4px 10px; font-size: 0.8rem;" onclick="printCrewCV('${escapeHTML(crew.submissionId)}')" title="Cetak CV">
              <i class="fa-solid fa-print"></i>
            </button>
            <button class="btn-secondary" style="padding: 4px 10px; font-size: 0.8rem;" onclick="exportCrewZip('${escapeHTML(crew.submissionId)}')" title="Download Berkas ZIP">
              <i class="fa-solid fa-file-zipper"></i>
            </button>
            <button class="btn-secondary" style="padding: 4px 10px; font-size: 0.8rem; color: var(--accent-amber);" onclick="editCrew('${escapeHTML(crew.submissionId)}')" title="Edit Data Kru">
              <i class="fa-solid fa-pen"></i>
            </button>
            ${window.currentRole === 'admin' ? `
              <button class="btn-secondary" style="padding: 4px 10px; font-size: 0.8rem; color: var(--status-error);" onclick="openDeleteModal('${escapeHTML(crew.submissionId)}')" title="Hapus Data Kru">
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
  const dates = [];
  
  if (crew.passportExpiry) {
    const pDate = new Date(crew.passportExpiry);
    if (!isNaN(pDate.getTime())) dates.push({ name: 'Passport', date: pDate });
  }
  if (crew.cdcExpiry) {
    const cDate = new Date(crew.cdcExpiry);
    if (!isNaN(cDate.getTime())) dates.push({ name: 'Seaman Book', date: cDate });
  }
  if (crew.bstExpiry) {
    const bDate = new Date(crew.bstExpiry);
    if (!isNaN(bDate.getTime())) dates.push({ name: 'BST', date: bDate });
  }

  if (dates.length === 0) {
    const hasDocs = crew.documents && Object.values(crew.documents).some(arr => Array.isArray(arr) && arr.length > 0);
    if (hasDocs) {
      return { text: "🟡 Dokumen Ada (Tgl Proses)", badgeClass: "badge-expiry-yellow" };
    }
    return { text: "⚪ Belum Ada Expiry", badgeClass: "badge-expiry-yellow" };
  }

  dates.sort((a, b) => a.date - b.date);
  const earliest = dates[0];
  const diffDays = Math.ceil((earliest.date - new Date()) / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    return { text: `🔴 Expired (${earliest.name})`, badgeClass: "badge-expiry-red" };
  } else if (diffDays < 90) {
    return { text: `🔴 Expired < 90 Hari (${diffDays} hr)`, badgeClass: "badge-expiry-red" };
  } else if (diffDays < 180) {
    return { text: `🟡 Warning < 180 Hari (${diffDays} hr)`, badgeClass: "badge-expiry-yellow" };
  } else {
    return { text: `🟢 Valid (${diffDays} hr)`, badgeClass: "badge-expiry-green" };
  }
}

function openOneTimeLinkModal() { document.getElementById('otlModal').classList.add('active'); }
function closeOneTimeLinkModal() { document.getElementById('otlModal').classList.remove('active'); }

function generateOtlLink() {
  const ownerName = document.getElementById('otlOwnerName').value.trim();
  if (!ownerName) { alert(t('promptOwnerName')); return; }
  const tokenStr = "OTL-" + Math.random().toString(36).substring(2, 10).toUpperCase();
  const currentUrl = window.location.href.split('?')[0];
  const generatedUrl = `${currentUrl}?role=owner&token=${tokenStr}&owner=${encodeURIComponent(ownerName)}`;
  document.getElementById('otlResultUrl').value = generatedUrl;
  document.getElementById('otlResultBox').style.display = 'block';
}

function copyOtlUrl() {
  const input = document.getElementById('otlResultUrl');
  input.select(); document.execCommand('copy');
  alert(t('copiedLinkAlert'));
}

function openDeleteModal(submissionId) {
  document.getElementById('deleteTargetId').value = submissionId;
  document.getElementById('deleteConfirmModal').classList.add('active');
}
function closeDeleteModal() { document.getElementById('deleteConfirmModal').classList.remove('active'); }

async function executeDeleteCrew() {
  const submissionId = document.getElementById('deleteTargetId').value;
  const crew = window.crewDatabase.find(c => c.submissionId === submissionId);
  const fullName = crew ? crew.fullName : '';

  closeDeleteModal();

  try {
    if (window.api && typeof window.api.deleteCrew === 'function') {
      await window.api.deleteCrew({ submissionId: submissionId, fullName: fullName });
    }

    const index = window.crewDatabase.findIndex(c => c.submissionId === submissionId);
    if (index >= 0) {
      window.crewDatabase.splice(index, 1);
      if (typeof saveLocalDatabase === 'function') saveLocalDatabase();
    }

    if (window.api && typeof window.api.syncNow === 'function') {
      await window.api.syncNow();
    }

    loadDirectoryTable();
    if (typeof renderCatalogGrid === 'function') renderCatalogGrid();

    alert(t('alertDeleteSuccess'));
  } catch (err) {
    console.error("Delete Error:", err);
    alert("Gagal menghapus data: " + err.message);
  }
}

async function executeDeduplicateCrew() {
  if (!confirm("Apakah Anda yakin ingin menghapus semua baris duplikat di Google Sheets secara otomatis?")) {
    return;
  }

  try {
    deduplicateLocalCrewDatabase();
    if (window.api && typeof window.api.deduplicateCrew === 'function') {
      const res = await window.api.deduplicateCrew();
      if (res && res.success) {
        alert("Berhasil membersihkan " + (res.removedCount || 0) + " baris duplikat dari Google Sheets!");
      }
    }
    if (window.api && typeof window.api.syncNow === 'function') {
      await window.api.syncNow();
    }
    deduplicateLocalCrewDatabase();
    loadDirectoryTable();
    if (typeof renderCatalogGrid === 'function') renderCatalogGrid();
  } catch (e) {
    console.error("Deduplicate Error:", e);
    alert("Gagal membersihkan duplikat: " + e.message);
  }
}

function editCrew(submissionId) {
  const crew = window.crewDatabase.find(c => c.submissionId === submissionId);
  if (!crew) return;

  window.editingSubmissionId = submissionId;
  if(typeof switchTab === 'function') switchTab('form');

  // Address fallback for Excel Import
  if (!crew.streetAddress && crew.combinedAddress) {
    crew.streetAddress = crew.combinedAddress;
  }

  const fields = ['fullName', 'chineseName', 'rankPosition', 'gender', 'pob', 'dob', 'heightCm', 'weightKg', 'religion', 'maritalStatus', 'bloodType', 'shirtSize', 'shoeSize', 'streetAddress', 'rtRw', 'village', 'district', 'city', 'province', 'phoneNo', 'fam1Name', 'fam1Relation', 'fam1Phone', 'fam2Name', 'fam2Relation', 'fam2Phone', 'vesselName', 'vesselTypeLongline', 'vesselOrigin', 'placementCountry', 'passportNo', 'passportExpiry', 'cdcNo', 'cdcExpiry', 'bstExpiry', 'kkStatus', 'akteStatus', 'ijazahLevel', 'medicalStatus', 'waliStatus', 'skckStatus'];

  fields.forEach(id => {
    const el = document.getElementById(id);
    if (el && crew[id] !== undefined) el.value = crew[id];
  });

  const expRadios = document.getElementsByName('expLongline');
  for(let i=0; i<expRadios.length; i++){
    if(expRadios[i].value === crew.expLongline) {
       expRadios[i].checked = true;
       break;
    }
  }

  const skillCheckboxes = document.getElementsByName('skillGeneral');
  const skills = Array.isArray(crew.skillGeneral) ? crew.skillGeneral : (crew.skillGeneral ? crew.skillGeneral.split(',').map(s=>s.trim()) : []);
  for(let i=0; i<skillCheckboxes.length; i++){
    skillCheckboxes[i].checked = skills.includes(skillCheckboxes[i].value);
  }

  // Normalize documents from Excel to crew.documents
  if (!crew.documents) {
    crew.documents = {};
  }
  
  const requiredDocs = ['passport', 'ktp', 'cdc', 'medical', 'cert', 'photo'];
  requiredDocs.forEach(d => {
    if (!crew.documents[d]) crew.documents[d] = [];
  });

  const excelDocMap = { docPhoto: 'photo', docPassport: 'passport', docCdc: 'cdc', docMedical: 'medical', docKtp: 'ktp', docCert: 'cert' };
  for (let key in excelDocMap) {
    if (crew[key] && Array.isArray(crew[key])) {
      crew[key].forEach(url => {
        // Only add if not already present
        if (!crew.documents[excelDocMap[key]].find(d => d.base64 === url || d.url === url)) {
           // We push as URL string to base64 property to be compatible with renderGallery temporarily
           crew.documents[excelDocMap[key]].push({ name: 'Google Drive Link', base64: url, isDriveUrl: true });
        }
      });
    }
  }

  window.uploadedDocuments = JSON.parse(JSON.stringify(crew.documents));
  const docTypes = ['passport', 'ktp', 'cdc', 'photo', 'medical', 'bst', 'skck', 'kk', 'akte', 'cert1', 'cert2', 'cert'];
  docTypes.forEach(dt => { if(typeof renderGallery === 'function' && window.uploadedDocuments[dt]) renderGallery(dt); });

  const agreeCheck = document.getElementById('agreeTermsCheck');
  if (agreeCheck) agreeCheck.checked = true;

  const btn = document.querySelector('.btn-submit');
  if (btn) btn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> UPDATE DATA';
  window.scrollTo(0,0);
}

const EXCEL_MAPPING = [
  { header: "Timestamp", key: "timestamp", type: "date" },
  { header: "ID Submisi", key: "submissionId", type: "string" },
  { header: "Nama Lengkap", key: "fullName", type: "string" },
  { header: "Nama Mandarin (中文名)", key: "chineseName", type: "string" },
  { header: "Jabatan / Posisi", key: "rankPosition", type: "string" },
  { header: "No. HP / WA", key: "phoneNo", type: "phone" },
  { header: "Alamat Lengkap (Combined)", key: "combinedAddress", type: "string" },
  { header: "Kontak Keluarga 1", key: "fam1Name", type: "string" },
  { header: "Telp Keluarga 1", key: "fam1Phone", type: "phone" },
  { header: "Kontak Keluarga 2", key: "fam2Name", type: "string" },
  { header: "Telp Keluarga 2", key: "fam2Phone", type: "phone" },
  { header: "Pengalaman Longline", key: "expLongline", type: "string" },
  { header: "Nama Kapal", key: "vesselName", type: "string" },
  { header: "Jenis Kapal", key: "vesselTypeLongline", type: "string" },
  { header: "Asal Kapal", key: "vesselOrigin", type: "string" },
  { header: "Negara Penempatan", key: "placementCountry", type: "string" },
  { header: "Skill Umum", key: "skillGeneral", type: "array" },
  { header: "No. Paspor", key: "passportNo", type: "string" },
  { header: "Expired Paspor", key: "passportExpiry", type: "date" },
  { header: "No. Seaman Book", key: "cdcNo", type: "string" },
  { header: "Expired Seaman Book", key: "cdcExpiry", type: "date" },
  { header: "Expired BST", key: "bstExpiry", type: "date" },
  { header: "Status KK", key: "kkStatus", type: "string" },
  { header: "Status Akte", key: "akteStatus", type: "string" },
  { header: "Status Ijazah", key: "ijazahLevel", type: "string" },
  { header: "Status MCU", key: "medicalStatus", type: "string" },
  { header: "Status Surat Wali", key: "waliStatus", type: "string" },
  { header: "Status SKCK", key: "skckStatus", type: "string" },
  { header: "Ukuran Baju", key: "shirtSize", type: "string" },
  { header: "Ukuran Sepatu", key: "shoeSize", type: "string" },
  { header: "Tanggal Lahir", key: "dob", type: "date" },
  { header: "Gender", key: "gender", type: "string" },
  { header: "Agama", key: "religion", type: "string" },
  { header: "Folder Google Drive", key: "folderUrl", type: "string" },
  { header: "URL Paspor (Drive)", key: "docPassport", type: "urlArray" },
  { header: "URL KTP (Drive)", key: "docKtp", type: "urlArray" },
  { header: "URL Seaman Book (Drive)", key: "docCdc", type: "urlArray" },
  { header: "URL MCU (Drive)", key: "docMedical", type: "urlArray" },
  { header: "URL Certificate (Drive)", key: "docCert", type: "urlArray" },
  { header: "URL Foto Crew (Drive)", key: "docPhoto", type: "urlArray" }
];

function formatPhone(phone) {
  if (!phone || phone === "undefined" || phone === "null" || phone === "Ada" || phone === "ada") return "";
  let p = String(phone).replace(/[^0-9+]/g, '');
  if (p.length < 5) return "";
  if (p.startsWith('0')) p = '+62' + p.substring(1);
  if (p.startsWith('62')) p = '+' + p;
  if (!p.startsWith('+')) p = '+' + p;
  return p;
}

function formatDate(dateVal) {
  if (!dateVal || dateVal === "undefined" || dateVal === "null" || dateVal === "Ada" || dateVal === "ada") return "";
  if (typeof dateVal === 'number') {
    let d = new Date(Math.round((dateVal - 25569) * 86400 * 1000));
    return d.toISOString().split('T')[0];
  }
  let str = String(dateVal).trim();
  let d = new Date(str);
  if (isNaN(d.getTime())) return str;
  return d.toISOString().split('T')[0];
}

function arrayToString(arr) {
  if (!arr) return "";
  if (Array.isArray(arr)) return arr.join(", ");
  return String(arr);
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
    alert(t('alertExcelEmpty'));
    return;
  }

  let totalParsed = 0;
  let duplicateCount = 0;
  let newCount = 0;
  pendingExcelData = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    let crewData = {};
    
    EXCEL_MAPPING.forEach(col => {
      let val = row[col.header];
      if (val === undefined || val === null || val === "") return;
      
      if (col.type === "phone") {
        val = formatPhone(val);
      } else if (col.type === "date") {
        val = formatDate(val);
      } else if (col.type === "array" || col.type === "urlArray") {
        val = String(val).split(',').map(s => s.trim()).filter(Boolean);
      } else {
        val = String(val).trim();
      }
      crewData[col.key] = val;
    });
    
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
          payload = { ...window.crewDatabase[idx] };
       }
       action = "update_crew";
    } else {
       payload.status = "WAITING";
       payload.documents = { passport:[], ktp:[], cdc:[], medical:[], photo:[] };
       window.crewDatabase.unshift(payload);
    }
    
    importedCount++;
    const pct = Math.round((importedCount / total) * 100);
    progressBar.style.width = pct + "%";
    progressText.innerText = `Memproses Kru ${importedCount} dari ${total}`;
    progressPercentage.innerText = pct + "%";
    
    try {
      payload.action = action;
      if (typeof saveLocalDatabase === 'function') saveLocalDatabase();
      
      await fetch(getGasUrl(), {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
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

function exportDirectoryCSV() {
  if (window.crewDatabase.length === 0) { alert(t('alertNoDataExport')); return; }
  
  const exportData = window.crewDatabase.map(crew => {
    let row = {};
    EXCEL_MAPPING.forEach(col => {
      let val = crew[col.key];
      if (val === undefined || val === null || val === "undefined" || val === "null") {
        val = "";
      }
      
      if (col.type === "phone") {
        val = formatPhone(val);
      } else if (col.type === "date") {
        val = formatDate(val);
      } else if (col.type === "array" || col.type === "urlArray") {
        val = arrayToString(val);
      } else {
        val = String(val).trim();
      }
      row[col.header] = val;
    });
    return row;
  });

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Data Crew");
  
  XLSX.writeFile(workbook, `Crew_Longline_PT_ALINDA_${Date.now()}.xlsx`);
}

function resolveImgSrc(docObjOrUrl) {
  if (!docObjOrUrl) return '';
  let url = typeof docObjOrUrl === 'string' ? docObjOrUrl : (docObjOrUrl.base64 || docObjOrUrl.url || '');
  if (!url) return '';
  if (url.includes('drive.google.com') || url.includes('googleusercontent.com')) {
    let fileId = '';
    const matchD = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    const matchId = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (matchD && matchD[1]) fileId = matchD[1];
    else if (matchId && matchId[1]) fileId = matchId[1];
    
    if (fileId) {
      return `https://lh3.googleusercontent.com/d/${fileId}`;
    }
  }
  return url;
}

// Print CV Pelaut Ikan Layout (Ultimate Trilingual Edition - A4 Compact)
function printCrewCV(submissionId) {
  const crew = window.crewDatabase.find(c => c.submissionId === submissionId);
  if (!crew) return;

  const printWindow = window.open('', '_blank');
  
  // Ambil foto profil (index 0) jika ada, format 4x6
  let photoHtml = '<div style="margin-top: 60px; font-size: 9pt;">4 x 6 cm</div>';
  if (crew.documents && crew.documents.photo && crew.documents.photo.length > 0) {
    const photoSrc = resolveImgSrc(crew.documents.photo[0]);
    if (photoSrc) photoHtml = `<img src="${photoSrc}">`;
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

  // Attachments HTML (Halaman 2 - Real Size)
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
          const imgSrc = resolveImgSrc(doc);
          if (imgSrc) {
            attachmentsHtml += `
              <div style="margin-bottom: 30px; text-align: center; page-break-inside: avoid;">
                <h4 style="margin-bottom: 8px; border-bottom: 1px solid #ccc; padding-bottom: 4px; font-size: 11pt;">${label}</h4>
                <img src="${imgSrc}" style="max-width: 100%; max-height: 850px; border: 1px solid #999; padding: 4px;">
              </div>
            `;
          }
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
        <h2>DOCUMENTATION ARCHIVE</h2>
        <p>WA N TAI FENG INTERNATIONAL CO LTD - PT ALINDA PRIMA SENTOSA</p>
      </div>
      ${attachmentsHtml}
    `;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>CV - ${crew.fullName}</title>
      <style>
        @media print {
          @page { size: A4 portrait; margin: 6mm 8mm; }
          body { padding: 0 !important; }
        }
        body { font-family: Arial, sans-serif; padding: 12px; color: #000; line-height: 1.25; font-size: 8.5pt; }
        .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 6px; margin-bottom: 10px; }
        .header h1 { margin: 0; font-size: 16pt; font-weight: bold; letter-spacing: 0.5px; }
        .header h2 { margin: 2px 0 0 0; font-size: 10pt; color: #333; }
        .header p { margin: 2px 0 0 0; font-size: 10pt; font-weight: bold; }
        
        .grid { display: grid; grid-template-columns: 1fr auto; gap: 15px; margin-bottom: 10px; }
        
        table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
        th, td { border: 1px solid #000; padding: 4px 6px; font-size: 8.5pt; text-align: left; vertical-align: middle; }
        th { background: #f4f4f4; width: 33%; }
        
        /* Photo 4x6 cm compact */
        .photo-box { width: 130px; height: 180px; border: 1px solid #000; display: flex; align-items: center; justify-content: center; overflow: hidden; background: #fff; padding: 2px; }
        .photo-box img { width: 100%; height: 100%; object-fit: cover; }
        
        .lbl-id { font-size: 8.5pt; display: block; font-weight: bold; }
        .lbl-en { font-size: 7.5pt; color: #444; display: block; margin-top: 1px; font-weight: normal; }
        .lbl-tw { font-size: 8pt; font-weight: bold; color: #000; display: block; margin-top: 1px; }
        
        .signature-section { display: flex; justify-content: space-between; margin-top: 15px; }
        .signature-box { text-align: center; width: 220px; }
        .signature-title { font-size: 8.5pt; font-weight: bold; margin-bottom: 2px; }
        .signature-tw { font-size: 8pt; color: #333; margin-bottom: 35px; }
        .signature-line { border-bottom: 1px solid #000; width: 100%; margin: 0 auto; }
        
        .footer { margin-top: 10px; text-align: left; font-size: 7.5pt; color: #555; border-top: 1.5px solid #000; padding-top: 6px; display: flex; justify-content: space-between; align-items: center; }
        
        .qr-container { text-align: center; }
        .qr-container img { width: 65px; height: 65px; border: 1px solid #ccc; padding: 2px; }
        .qr-container p { font-size: 7pt; margin: 2px 0 0 0; color: #333; font-weight: bold; }
        .qr-container p.qr-tw { font-weight: normal; margin-top: 1px; }
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
              <span class="lbl-id">Tinggi Badan</span>
              <span class="lbl-en">Height</span>
              <span class="lbl-tw">身高</span>
            </th>
            <td>${crew.heightCm || '-'} cm</td>
          </tr>
          <tr>
            <th>
              <span class="lbl-id">Berat Badan</span>
              <span class="lbl-en">Weight</span>
              <span class="lbl-tw">體重</span>
            </th>
            <td>${crew.weightKg || '-'} kg</td>
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
          setTimeout(() => { window.print(); }, 1200); 
        }
      </script>
    </body>
    </html>
  `);
  printWindow.document.close();
}

function exportCrewZip(submissionId) { alert(`Download ZIP Berkas Foto Kru (${submissionId}) diproses.`); }
