// js/admin.js

function loadDirectoryTable() {
  const tbody = document.getElementById('directoryTableBody');
  const countText = document.getElementById('totalCrewCountText');
  if (!tbody) return;

  const searchQuery = (document.getElementById('dirSearchInput')?.value || '').toLowerCase();
  const filterRank = document.getElementById('dirFilterRank')?.value || '';

  const filtered = window.crewDatabase.filter(crew => {
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

function exportDirectoryCSV() {
  if (window.crewDatabase.length === 0) { alert("Tidak ada data untuk diekspor."); return; }
  let csvContent = "data:text/csv;charset=utf-8,ID Submisi,Nama Lengkap,Nama Mandarin,Jabatan,No HP,Alamat,Pengalaman Longline,Jenis Kapal,Asal Kapal,Negara Penempatan,Paspor Expired,CDC Expired,Status\n";
  window.crewDatabase.forEach(c => {
    const row = [c.submissionId, `"${c.fullName}"`, `"${c.chineseName || ''}"`, `"${c.rankPosition}"`, `"${c.phoneNo}"`, `"${c.combinedAddress || c.streetAddress}"`, `"${c.expLongline}"`, `"${c.vesselTypeLongline}"`, `"${c.vesselOrigin}"`, `"${c.placementCountry}"`, `"${c.passportExpiry}"`, `"${c.cdcExpiry}"`, `"${c.status || 'WAITING'}"`].join(",");
    csvContent += row + "\n";
  });
  const link = document.createElement("a");
  link.setAttribute("href", encodeURI(csvContent));
  link.setAttribute("download", `Crew_Longline_PT_ALINDA_${Date.now()}.csv`);
  document.body.appendChild(link); link.click(); document.body.removeChild(link);
}

// Print CV Pelaut Ikan Layout
function printCrewCV(submissionId) {
  const crew = window.crewDatabase.find(c => c.submissionId === submissionId);
  if (!crew) return;

  const printWindow = window.open('', '_blank');
  
  // Ambil foto profil (index 0) jika ada
  let photoHtml = '[ FOTO CREW ]';
  if (crew.documents && crew.documents.photo && crew.documents.photo.length > 0) {
    photoHtml = `<img src="${crew.documents.photo[0].base64}" style="max-width:100%; max-height:100%; object-fit:contain;">`;
  }

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
        .photo-box { border: 1px solid #000; height: 180px; text-align: center; display: flex; align-items: center; justify-content: center; overflow: hidden; }
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
          ${photoHtml}
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

function exportCrewZip(submissionId) { alert(`Download ZIP Berkas Foto Kru (${submissionId}) diproses.`); }
