// js/owner.js

function renderCatalogGrid() {
  const container = document.getElementById('catalogGridContainer');
  if (!container) return;

  const searchQuery = (document.getElementById('catSearchInput')?.value || '').toLowerCase();
  const filterRank = document.getElementById('catFilterRank')?.value || '';
  const filterQual = document.getElementById('catFilterQual')?.value || '';
  const filterVessel = document.getElementById('catFilterVessel')?.value || '';

  const filtered = window.crewDatabase.filter(crew => {
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
    container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);"><p>Tidak ada kandidat kru yang cocok.</p></div>`;
    return;
  }

  const isUnmasked = (window.currentRole === 'admin' || window.activeToken !== null);

  container.innerHTML = filtered.map(crew => {
    const displayName = isUnmasked ? crew.fullName : maskName(crew.fullName);
    let photoUrl = createDummySvgDataUrl("CREW PHOTO");
    if (crew.documents && crew.documents.photo && crew.documents.photo.length > 0) {
      photoUrl = resolveImgSrc(crew.documents.photo[0]) || photoUrl;
    }
    
    let currentStatus = crew.status || 'WAITING';
    let statusStyle = "color: var(--text-muted); border-color: var(--text-muted);";
    if (currentStatus === 'SELECTED') statusStyle = "color: var(--status-success); border-color: var(--status-success); background: rgba(16, 185, 129, 0.1);";
    if (currentStatus === 'REJECTED') statusStyle = "color: var(--status-error); border-color: var(--status-error); background: rgba(239, 68, 68, 0.1);";
    if (currentStatus === 'PRIORITY') statusStyle = "color: #8b5cf6; border-color: #8b5cf6; background: rgba(139, 92, 246, 0.1);";

    return `
      <div class="crew-card">
        <div class="crew-card-header">
          <img src="${escapeHTML(photoUrl)}" class="crew-avatar" alt="${escapeHTML(displayName)}">
          <div class="crew-header-info">
            <h3>${escapeHTML(displayName)}</h3>
            ${crew.chineseName ? `<small style="color: var(--accent-teal); display: block;">${escapeHTML(crew.chineseName)}</small>` : ''}
            <span class="rank-badge">${escapeHTML(crew.rankPosition)}</span>
          </div>
        </div>
        <div class="crew-card-body">
          <div class="crew-spec-item"><span class="crew-spec-label">Kode Kru:</span><span class="crew-spec-value">${escapeHTML(crew.submissionId)}</span></div>
          <div class="crew-spec-item"><span class="crew-spec-label">Pengalaman:</span><span class="crew-spec-value" style="color: var(--accent-amber);">${escapeHTML(crew.expLongline || 'N/A')}</span></div>
          <div class="crew-spec-item"><span class="crew-spec-label">Kapal:</span><span class="crew-spec-value">${escapeHTML(crew.vesselTypeLongline || '-')} (${escapeHTML(crew.vesselOrigin || '-')})</span></div>
        </div>
        <div class="crew-card-footer" style="display: flex; justify-content: space-between; gap: 8px;">
          <div style="padding: 6px 12px; border: 1px solid; border-radius: 4px; font-size: 0.8rem; font-weight: bold; ${escapeHTML(statusStyle)}">${escapeHTML(currentStatus)}</div>
          <button class="btn-primary" style="flex: 1;" onclick="openCrewDetailModal('${escapeHTML(crew.submissionId)}')">
            <i class="fa-solid fa-file-invoice"></i> View Profile & Score
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function openCrewDetailModal(submissionId) {
  const crew = window.crewDatabase.find(c => c.submissionId === submissionId);
  if (!crew) return;

  const isUnmasked = (window.currentRole === 'admin' || window.activeToken !== null);
  const displayName = isUnmasked ? crew.fullName : maskName(crew.fullName);
  const displayPhone = isUnmasked ? crew.phoneNo : maskString(crew.phoneNo, 4);
  const address = isUnmasked ? crew.combinedAddress : '*** Masked ***';

  window.ownerSelections = window.ownerSelections || {};
  let selection = window.ownerSelections[submissionId] || {
    status: crew.status || 'WAITING',
    commScore: 0, skillScore: 0, expScore: 0, attitudeScore: 0, leadershipScore: 0, notes: ''
  };

  let modalHtml = `
  <div class="modal-overlay active" id="crewDetailModal">
    <div class="modal-card" style="max-width: 900px; width: 95%; max-height: 90vh; overflow-y: auto;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid var(--border-color); padding-bottom: 10px;">
        <h2 style="color: var(--primary);"><i class="fa-solid fa-user-tie"></i> Profile & Review: ${escapeHTML(displayName)}</h2>
        <button class="modal-close-btn" onclick="closeCrewDetailModal()" style="position: static;">&times;</button>
      </div>

      <div style="display: flex; flex-wrap: wrap; gap: 24px;">
        <!-- Left Column: Details & Docs -->
        <div style="flex: 1 1 300px;">
          <h3 style="margin-bottom: 10px; color: var(--primary-container);">Informasi Kandidat</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
            <tr><td style="padding: 4px 0; font-weight: bold;">Kode Kru:</td><td>${escapeHTML(crew.submissionId)}</td></tr>
            <tr><td style="padding: 4px 0; font-weight: bold;">Jabatan:</td><td>${escapeHTML(crew.rankPosition)}</td></tr>
            <tr><td style="padding: 4px 0; font-weight: bold;">Umur/Tgl Lahir:</td><td>${escapeHTML(crew.dob)}</td></tr>
            <tr><td style="padding: 4px 0; font-weight: bold;">Pengalaman:</td><td>${escapeHTML(crew.expLongline)}</td></tr>
            <tr><td style="padding: 4px 0; font-weight: bold;">Kapal Terakhir:</td><td>${escapeHTML(crew.vesselName)} (${escapeHTML(crew.vesselTypeLongline)})</td></tr>
            <tr><td style="padding: 4px 0; font-weight: bold;">Kontak:</td><td>${escapeHTML(displayPhone)}</td></tr>
          </table>

          <h3 style="margin-top: 20px; margin-bottom: 10px; color: var(--primary-container);">Dokumen</h3>
          <div style="display: flex; gap: 10px; flex-wrap: wrap;">
            ${generateDocButton(crew, 'photo', 'Foto')}
            ${generateDocButton(crew, 'passport', 'Paspor')}
            ${generateDocButton(crew, 'cdc', 'Buku Pelaut')}
            ${generateDocButton(crew, 'medical', 'MCU')}
          </div>
        </div>

        <!-- Right Column: Scoring & Selection -->
        <div style="flex: 1 1 300px; background: var(--bg-primary); padding: 16px; border-radius: 8px; border: 1px solid var(--border-subtle);">
          <h3 style="margin-bottom: 16px; color: var(--primary-container);"><i class="fa-solid fa-star-half-stroke"></i> Interview Score (1-10)</h3>
          
          ${generateScoreInput('Communication', 'commScore', selection.commScore)}
          ${generateScoreInput('Skill / Teknik', 'skillScore', selection.skillScore)}
          ${generateScoreInput('Experience', 'expScore', selection.expScore)}
          ${generateScoreInput('Attitude', 'attitudeScore', selection.attitudeScore)}
          ${generateScoreInput('Leadership', 'leadershipScore', selection.leadershipScore)}

          <div style="margin-top: 16px;">
            <label style="font-weight: bold; font-size: 0.9rem; display: block; margin-bottom: 6px;">Interview Notes:</label>
            <textarea id="reviewNotes" class="form-control" rows="3" placeholder="Tambahkan catatan interview di sini...">${selection.notes}</textarea>
          </div>

          <div style="margin-top: 20px;">
            <label style="font-weight: bold; font-size: 0.9rem; display: block; margin-bottom: 10px;">Selection Status:</label>
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
              <button class="btn-secondary" id="btnWait" style="${selection.status==='WAITING'?'background:var(--text-muted);color:#fff;':''}" onclick="setReviewStatus('${crew.submissionId}', 'WAITING')">Waiting</button>
              <button class="btn-secondary" id="btnSel" style="${selection.status==='SELECTED'?'background:var(--status-success);color:#fff;':''}" onclick="setReviewStatus('${crew.submissionId}', 'SELECTED')">Selected</button>
              <button class="btn-secondary" id="btnPri" style="${selection.status==='PRIORITY'?'background:#8b5cf6;color:#fff;':''}" onclick="setReviewStatus('${crew.submissionId}', 'PRIORITY')">Priority</button>
              <button class="btn-secondary" id="btnRej" style="${selection.status==='REJECTED'?'background:var(--status-error);color:#fff;':''}" onclick="setReviewStatus('${crew.submissionId}', 'REJECTED')">Rejected</button>
            </div>
          </div>
          
          <button class="btn-primary" style="width: 100%; margin-top: 20px; padding: 12px;" onclick="saveReviewSelection('${crew.submissionId}')">
            <i class="fa-solid fa-floppy-disk"></i> Simpan Review & Keputusan
          </button>
        </div>
      </div>
    </div>
  </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function generateScoreInput(label, id, value) {
  return `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
      <span style="font-size: 0.9rem; font-weight: 600;">${label}</span>
      <input type="number" id="${id}" class="form-control" style="width: 80px;" min="0" max="10" value="${value}">
    </div>
  `;
}

function generateDocButton(crew, type, label) {
  if (crew.documents && crew.documents[type] && crew.documents[type].length > 0) {
    const imageUrl = resolveImgSrc(crew.documents[type][0]);
    if (imageUrl) {
      return `<button class="btn-secondary" style="font-size: 0.8rem; padding: 4px 8px;" data-preview-src="${escapeHTML(imageUrl)}" onclick="openImagePreview(this.dataset.previewSrc)"><i class="fa-solid fa-image"></i> ${label}</button>`;
    }
  }
  return `<button class="btn-secondary" style="font-size: 0.8rem; padding: 4px 8px; opacity: 0.5;" disabled><i class="fa-solid fa-image"></i> ${label}</button>`;
}

function closeCrewDetailModal() {
  const modal = document.getElementById('crewDetailModal');
  if (modal) modal.remove();
}

function setReviewStatus(submissionId, status) {
  if (!window.ownerSelections[submissionId]) window.ownerSelections[submissionId] = {};
  window.ownerSelections[submissionId].status = status;
  
  // Re-render modal to update button colors
  const notes = document.getElementById('reviewNotes').value;
  const comm = document.getElementById('commScore').value;
  const skill = document.getElementById('skillScore').value;
  const exp = document.getElementById('expScore').value;
  const att = document.getElementById('attitudeScore').value;
  const lead = document.getElementById('leadershipScore').value;

  window.ownerSelections[submissionId].notes = notes;
  window.ownerSelections[submissionId].commScore = comm;
  window.ownerSelections[submissionId].skillScore = skill;
  window.ownerSelections[submissionId].expScore = exp;
  window.ownerSelections[submissionId].attitudeScore = att;
  window.ownerSelections[submissionId].leadershipScore = lead;

  closeCrewDetailModal();
  openCrewDetailModal(submissionId);
}

function saveReviewSelection(submissionId) {
  if (!window.ownerSelections[submissionId]) return;

  const notes = document.getElementById('reviewNotes').value;
  const comm = document.getElementById('commScore').value;
  const skill = document.getElementById('skillScore').value;
  const exp = document.getElementById('expScore').value;
  const att = document.getElementById('attitudeScore').value;
  const lead = document.getElementById('leadershipScore').value;

  window.ownerSelections[submissionId].notes = notes;
  window.ownerSelections[submissionId].commScore = comm;
  window.ownerSelections[submissionId].skillScore = skill;
  window.ownerSelections[submissionId].expScore = exp;
  window.ownerSelections[submissionId].attitudeScore = att;
  window.ownerSelections[submissionId].leadershipScore = lead;

  const status = window.ownerSelections[submissionId].status;

  // Update crew database
  const crewIndex = window.crewDatabase.findIndex(c => c.submissionId === submissionId);
  if (crewIndex >= 0) {
    window.crewDatabase[crewIndex].status = status;
    if (typeof saveLocalDatabase === 'function') saveLocalDatabase();
    
    // Sync with backend
    const payload = {
      action: 'submit_review',
      submissionId: submissionId,
      token: window.activeToken,
      review: window.ownerSelections[submissionId],
      timestamp: new Date().toISOString()
    };

    fetch(getGasUrl(), {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }).catch(err => console.error("Gas review sync notice:", err));
  }

  closeCrewDetailModal();
  renderCatalogGrid();
  if (typeof loadDirectoryTable === 'function') loadDirectoryTable();
  alert("Review & keputusan berhasil disimpan.");
}
