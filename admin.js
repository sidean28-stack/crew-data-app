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

// printCrewCV is defined in app.js

function exportCrewZip(submissionId) { alert(`Download ZIP Berkas Foto Kru (${submissionId}) diproses.`); }
