// js/owner.js

function renderCatalogGrid() {
  const container = document.getElementById('catalogGridContainer');
  if (!container) return;

  const searchQuery = (document.getElementById('catSearchInput')?.value || '').toLowerCase();
  const filterRank = document.getElementById('catFilterRank')?.value || '';
  const filterQual = document.getElementById('catFilterQual')?.value || '';
  const filterVessel = document.getElementById('catFilterVessel')?.value || '';

  const zh = window.currentLang === 'zh';
  const text = zh ? {
    empty:'没有符合条件的船员候选人。', photo:'船员照片', code:'船员编号：', experience:'延绳钓经验：', vessel:'船型：', physique:'身高 / 体重：',
    view:'查看资料与评分', waiting:'待审核', selected:'已选中', priority:'优先', rejected:'未选中'
  } : {
    empty:'Tidak ada kandidat kru yang cocok.', photo:'CREW PHOTO', code:'Kode Kru:', experience:'Pengalaman:', vessel:'Kapal:', physique:'Tinggi / Berat:',
    view:'Lihat Profil & Nilai', waiting:'Menunggu', selected:'Terpilih', priority:'Prioritas', rejected:'Ditolak'
  };
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
    container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);"><p>${text.empty}</p></div>`;
    return;
  }

  const isUnmasked = (window.currentRole === 'admin' || window.activeToken !== null);

  container.innerHTML = filtered.map(crew => {
    const displayName = isUnmasked ? crew.fullName : maskName(crew.fullName);
    let photoUrl = createDummySvgDataUrl(text.photo);
    if (crew.documents && crew.documents.photo && crew.documents.photo.length > 0) {
      photoUrl = resolveImgSrc(crew.documents.photo[0]) || photoUrl;
    }
    
    let currentStatus = crew.status || 'WAITING';
    const statusText = {WAITING:text.waiting, SELECTED:text.selected, PRIORITY:text.priority, REJECTED:text.rejected}[currentStatus] || currentStatus;
    const chineseName = crew.chineseName || transliterateNameToChinese(crew.fullName);
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
            ${chineseName ? `<small lang="zh" style="color: var(--accent-teal); display: block;">${escapeHTML(chineseName)}</small>` : ''}
            <span class="rank-badge">${escapeHTML(crew.rankPosition)}</span>
          </div>
        </div>
        <div class="crew-card-body">
          <div class="crew-spec-item"><span class="crew-spec-label">${text.code}</span><span class="crew-spec-value">${escapeHTML(crew.submissionId)}</span></div>
          <div class="crew-spec-item"><span class="crew-spec-label">${text.experience}</span><span class="crew-spec-value" style="color: var(--accent-amber);">${escapeHTML(crew.expLongline || '-')}</span></div>
          <div class="crew-spec-item"><span class="crew-spec-label">${text.vessel}</span><span class="crew-spec-value">${escapeHTML(crew.vesselTypeLongline || '-')} (${escapeHTML(crew.vesselOrigin || '-')})</span></div>
          <div class="crew-spec-item"><span class="crew-spec-label">${text.physique}</span><span class="crew-spec-value">${escapeHTML(crew.heightCm || '-')} ${zh ? '厘米' : 'cm'} / ${escapeHTML(crew.weightKg || '-')} ${zh ? '公斤' : 'kg'}</span></div>
        </div>
        <div class="crew-card-footer" style="display: flex; justify-content: space-between; gap: 8px;">
          <div style="padding: 6px 12px; border: 1px solid; border-radius: 4px; font-size: 0.8rem; font-weight: bold; ${escapeHTML(statusStyle)}">${escapeHTML(statusText)}</div>
          <button class="btn-primary" style="flex: 1;" onclick="openCrewDetailModal('${escapeHTML(crew.submissionId)}')">
            <i class="fa-solid fa-file-invoice"></i> ${text.view}
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
  const zh = window.currentLang === 'zh';
  const t = zh ? {
    profile:'船员资料与审核', info:'候选人资料', code:'船员编号：', chineseName:'中文姓名：', rank:'职务：', dob:'出生日期：', physique:'身高 / 体重：',
    experience:'延绳钓经验：', vessel:'最近船舶：', contact:'联系方式：', docs:'证件资料', photo:'照片', passport:'护照', cdc:'船员手册', medical:'体检证明',
    score:'面试评分（1-10）', communication:'沟通能力', skill:'专业技能', exp:'工作经验', attitude:'工作态度', leadership:'领导能力',
    notes:'面试备注：', notesPlaceholder:'请填写面试备注...', status:'选拔状态：', waiting:'待审核', selected:'已选中', priority:'优先', rejected:'未选中', save:'保存审核与决定'
  } : {
    profile:'Profil & Penilaian', info:'Informasi Kandidat', code:'Kode Kru:', chineseName:'Nama Mandarin:', rank:'Jabatan:', dob:'Umur/Tgl Lahir:', physique:'Tinggi / Berat:',
    experience:'Pengalaman:', vessel:'Kapal Terakhir:', contact:'Kontak:', docs:'Dokumen', photo:'Foto', passport:'Paspor', cdc:'Buku Pelaut', medical:'MCU',
    score:'Nilai Interview (1-10)', communication:'Komunikasi', skill:'Skill / Teknik', exp:'Pengalaman', attitude:'Sikap', leadership:'Kepemimpinan',
    notes:'Catatan Interview:', notesPlaceholder:'Tambahkan catatan interview di sini...', status:'Status Seleksi:', waiting:'Menunggu', selected:'Terpilih', priority:'Prioritas', rejected:'Ditolak', save:'Simpan Review & Keputusan'
  };
  const chineseName = crew.chineseName || transliterateNameToChinese(crew.fullName);

  window.ownerSelections = window.ownerSelections || {};
  let selection = window.ownerSelections[submissionId] || {
    status: crew.status || 'WAITING',
    commScore: 0, skillScore: 0, expScore: 0, attitudeScore: 0, leadershipScore: 0, notes: ''
  };

  let modalHtml = `
  <div class="modal-overlay active owner-crew-detail-modal" id="ownerCrewDetailModal">
    <div class="modal-card" style="max-width: 900px; width: 95%; max-height: 90vh; overflow-y: auto;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid var(--border-color); padding-bottom: 10px;">
        <h2 style="color: var(--primary);"><i class="fa-solid fa-user-tie"></i> ${t.profile}：${escapeHTML(displayName)}</h2>
        <button class="modal-close-btn" onclick="closeCrewDetailModal()" style="position: static;">&times;</button>
      </div>

      <div style="display: flex; flex-wrap: wrap; gap: 24px;">
        <!-- Left Column: Details & Docs -->
        <div style="flex: 1 1 300px;">
          <h3 style="margin-bottom: 10px; color: var(--primary-container);">${t.info}</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
            <tr><td style="padding: 4px 0; font-weight: bold;">${t.code}</td><td>${escapeHTML(crew.submissionId)}</td></tr>
            <tr><td style="padding: 4px 0; font-weight: bold;">${t.chineseName}</td><td lang="zh">${escapeHTML(chineseName || '-')}</td></tr>
            <tr><td style="padding: 4px 0; font-weight: bold;">${t.rank}</td><td>${escapeHTML(crew.rankPosition)}</td></tr>
            <tr><td style="padding: 4px 0; font-weight: bold;">${t.dob}</td><td>${escapeHTML(crew.dob)}</td></tr>
            <tr><td style="padding: 4px 0; font-weight: bold;">${t.physique}</td><td>${escapeHTML(crew.heightCm || '-')} ${zh ? '厘米' : 'cm'} / ${escapeHTML(crew.weightKg || '-')} ${zh ? '公斤' : 'kg'}</td></tr>
            <tr><td style="padding: 4px 0; font-weight: bold;">${t.experience}</td><td>${escapeHTML(crew.expLongline)}</td></tr>
            <tr><td style="padding: 4px 0; font-weight: bold;">${t.vessel}</td><td>${escapeHTML(crew.vesselName)} (${escapeHTML(crew.vesselTypeLongline)})</td></tr>
            <tr><td style="padding: 4px 0; font-weight: bold;">${t.contact}</td><td>${escapeHTML(displayPhone)}</td></tr>
          </table>

          <h3 style="margin-top: 20px; margin-bottom: 10px; color: var(--primary-container);">${t.docs}</h3>
          <div style="display: flex; gap: 10px; flex-wrap: wrap;">
            ${generateDocButton(crew, 'photo', t.photo)}
            ${generateDocButton(crew, 'passport', t.passport)}
            ${generateDocButton(crew, 'cdc', t.cdc)}
            ${generateDocButton(crew, 'medical', t.medical)}
          </div>
        </div>

        <!-- Right Column: Scoring & Selection -->
        <div style="flex: 1 1 300px; background: var(--bg-primary); padding: 16px; border-radius: 8px; border: 1px solid var(--border-subtle);">
          <h3 style="margin-bottom: 16px; color: var(--primary-container);"><i class="fa-solid fa-star-half-stroke"></i> ${t.score}</h3>
          
          ${generateScoreInput(t.communication, 'commScore', selection.commScore)}
          ${generateScoreInput(t.skill, 'skillScore', selection.skillScore)}
          ${generateScoreInput(t.exp, 'expScore', selection.expScore)}
          ${generateScoreInput(t.attitude, 'attitudeScore', selection.attitudeScore)}
          ${generateScoreInput(t.leadership, 'leadershipScore', selection.leadershipScore)}

          <div style="margin-top: 16px;">
            <label style="font-weight: bold; font-size: 0.9rem; display: block; margin-bottom: 6px;">${t.notes}</label>
            <textarea id="reviewNotes" class="form-control" rows="3" placeholder="${t.notesPlaceholder}">${escapeHTML(selection.notes)}</textarea>
          </div>

          <div style="margin-top: 20px;">
            <label style="font-weight: bold; font-size: 0.9rem; display: block; margin-bottom: 10px;">${t.status}</label>
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
              <button class="btn-secondary" id="btnWait" style="${selection.status==='WAITING'?'background:var(--text-muted);color:#fff;':''}" onclick="setReviewStatus('${crew.submissionId}', 'WAITING')">${t.waiting}</button>
              <button class="btn-secondary" id="btnSel" style="${selection.status==='SELECTED'?'background:var(--status-success);color:#fff;':''}" onclick="setReviewStatus('${crew.submissionId}', 'SELECTED')">${t.selected}</button>
              <button class="btn-secondary" id="btnPri" style="${selection.status==='PRIORITY'?'background:#8b5cf6;color:#fff;':''}" onclick="setReviewStatus('${crew.submissionId}', 'PRIORITY')">${t.priority}</button>
              <button class="btn-secondary" id="btnRej" style="${selection.status==='REJECTED'?'background:var(--status-error);color:#fff;':''}" onclick="setReviewStatus('${crew.submissionId}', 'REJECTED')">${t.rejected}</button>
            </div>
          </div>
          
          <button class="btn-primary" style="width: 100%; margin-top: 20px; padding: 12px;" onclick="saveReviewSelection('${crew.submissionId}')">
            <i class="fa-solid fa-floppy-disk"></i> ${t.save}
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
  const modal = document.getElementById('ownerCrewDetailModal') || document.getElementById('crewDetailModal');
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
  alert(window.currentLang === 'zh' ? "审核与决定已成功保存。" : "Review & keputusan berhasil disimpan.");
}
