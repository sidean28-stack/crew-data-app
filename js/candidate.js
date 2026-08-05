// js/candidate.js

function goToStep(step) {
  if (!window.editingSubmissionId && window.currentRole !== 'admin' && step > window.currentStep && !validateStep(window.currentStep)) {
    alert(i18n[window.currentLang].alertValidationErr);
    return;
  }
  window.currentStep = step;
  updateWizardProgress();
  if (window.currentStep === 5) renderReviewSummary();
}

function nextStep() {
  if (validateStep(window.currentStep)) {
    if (window.currentStep < 5) {
      window.currentStep++;
      updateWizardProgress();
      if (window.currentStep === 5) renderReviewSummary();
    }
  } else {
    alert(i18n[window.currentLang].alertValidationErr);
  }
}

function prevStep() {
  if (window.currentStep > 1) {
    window.currentStep--;
    updateWizardProgress();
  }
}

function updateWizardProgress() {
  for (let i = 1; i <= 5; i++) {
    const panel = document.getElementById(`stepPanel${i}`);
    const indicator = document.getElementById(`stepIndicator${i}`);

    if (i === window.currentStep) {
      panel.style.display = 'block';
      indicator.classList.add('active');
    } else {
      panel.style.display = 'none';
      indicator.classList.remove('active');
    }

    if (i < window.currentStep) {
      indicator.classList.add('completed');
    } else {
      indicator.classList.remove('completed');
    }
  }

  const fillPercent = ((window.currentStep - 1) / 4) * 100;
  document.getElementById('wizardProgressFill').style.width = `${fillPercent}%`;

  document.getElementById('btnPrevStep').style.display = window.currentStep > 1 ? 'inline-flex' : 'none';
  document.getElementById('btnNextStep').style.display = window.currentStep < 5 ? 'inline-flex' : 'none';
}

function validateStep(step) {
  // Free step navigation for Admin or during Edit Mode
  if (window.editingSubmissionId || window.currentRole === 'admin') {
    return true;
  }

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
    return window.uploadedDocuments.passport.length >= 1 &&
           window.uploadedDocuments.ktp.length >= 1 &&
           window.uploadedDocuments.cdc.length >= 1 &&
           window.uploadedDocuments.photo.length >= 1;
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
      <p><strong>Nama Lengkap:</strong> ${escapeHTML(data.fullName)} (${escapeHTML(data.chineseName || '-')})</p>
      <p><strong>Jabatan:</strong> ${escapeHTML(data.rankPosition)}</p>
      <p><strong>Kontak:</strong> ${escapeHTML(data.phoneNo)}</p>
      <p><strong>Alamat:</strong> ${escapeHTML(data.streetAddress)}, ${escapeHTML(data.city)}</p>
      <p><strong>Kualifikasi Longline:</strong> ${escapeHTML(data.expLongline)}</p>
      <p><strong>Paspor:</strong> ${escapeHTML(data.passportNo)} (Exp: ${escapeHTML(data.passportExpiry)})</p>
      <p><strong>Buku Pelaut:</strong> ${escapeHTML(data.cdcNo)} (Exp: ${escapeHTML(data.cdcExpiry)})</p>
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
    documents: window.uploadedDocuments,
    operationalStatus: 'STAND_BY',
    status: 'STAND_BY',
    submittedAt: new Date().toISOString()
  };
}

async function submitCrewForm() {
  if (!document.getElementById('agreeTermsCheck').checked) {
    alert("Harap centang persetujuan keabsahan data.");
    return;
  }
  const formData = getFormData();
  const isEditing = Boolean(window.editingSubmissionId);
  let cloudPayload = formData;
  
  if (isEditing) {
    formData.submissionId = window.editingSubmissionId;
    const idx = window.crewDatabase.findIndex(c => c.submissionId === window.editingSubmissionId);
    if (idx === -1) {
      alert('Data kru yang akan diedit tidak ditemukan. Muat ulang data lalu coba lagi.');
      return;
    }

    const existingCrew = window.crewDatabase[idx];
    delete formData.operationalStatus;
    delete formData.status;
    delete formData.submittedAt;
    cloudPayload = { ...existingCrew, ...formData };
  } else {
    formData.submissionId = "CRW-" + Date.now();
  }

  const submitButton = document.querySelector('.btn-submit');
  const originalButtonHtml = submitButton ? submitButton.innerHTML : '';
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> MENYIMPAN...';
  }

  try {
    if (!window.api) throw new Error('API cloud tidak tersedia.');
    if (isEditing) await window.api.updateCrew(cloudPayload);
    else await window.api.submitCrew(cloudPayload);

    const cloudSynced = await window.api.syncNow();
    const cloudCrew = window.crewDatabase.find(crew => crew.submissionId === cloudPayload.submissionId);
    if (!cloudSynced || !cloudCrew) {
      throw new Error('Perubahan belum terkonfirmasi pada snapshot cloud.');
    }

    if (isEditing) {
      const verificationFields = [
        'fullName', 'chineseName', 'rankPosition', 'phoneNo',
        'fam1Name', 'fam1Relation', 'fam1Phone', 'fam2Name', 'fam2Relation', 'fam2Phone',
        'expLongline', 'vesselName', 'vesselTypeLongline', 'vesselOrigin', 'placementCountry',
        'passportNo', 'passportExpiry', 'cdcNo', 'cdcExpiry', 'bstExpiry', 'kkStatus',
        'akteStatus', 'ijazahLevel', 'medicalStatus', 'waliStatus', 'skckStatus',
        'shirtSize', 'shoeSize', 'dob', 'gender', 'religion'
      ];
      const hasMismatch = verificationFields.some(field =>
        String(cloudCrew[field] || '').trim() !== String(cloudPayload[field] || '').trim()
      );
      const expectedAddress = (cloudPayload.streetAddress || '') +
        (cloudPayload.rtRw ? ' RT/RW: ' + cloudPayload.rtRw : '') +
        (cloudPayload.village ? ' Kel/Desa: ' + cloudPayload.village : '') +
        (cloudPayload.district ? ' Kec: ' + cloudPayload.district : '') +
        (cloudPayload.city ? ' Kab/Kota: ' + cloudPayload.city : '') +
        (cloudPayload.province ? ' Prov: ' + cloudPayload.province : '');
      const addressMismatch = String(cloudCrew.combinedAddress || '').trim() !== expectedAddress.trim();
      if (hasMismatch || addressMismatch) {
        throw new Error('Nilai perubahan belum sama dengan snapshot cloud.');
      }
    }
  } catch (error) {
    console.error('Crew cloud sync failed:', error);
    alert('Perubahan belum terkonfirmasi di cloud. Silakan periksa koneksi lalu simpan kembali.');
    return;
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.innerHTML = originalButtonHtml;
    }
  }

  if (typeof loadDirectoryTable === 'function') loadDirectoryTable();
  if (typeof renderCatalogGrid === 'function') renderCatalogGrid();

  alert(isEditing ? "Data kru berhasil diupdate!" : i18n[window.currentLang].alertSubmitSuccess);
  
  window.editingSubmissionId = null;
  if (submitButton) submitButton.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> SUBMIT DATA CREW';
  
  clearDraft();
  switchTab('directory');
}

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

function setupDragAndDrop() {
  ['Passport', 'Ktp', 'Cdc', 'Medical', 'Cert', 'Photo'].forEach(doc => {
    const zone = document.getElementById(`dropzone${doc}`);
    if (!zone) return;
    zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('dragover'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
    zone.addEventListener('drop', (e) => {
      e.preventDefault(); zone.classList.remove('dragover');
      handleFiles(e.dataTransfer.files, doc.toLowerCase());
    });
  });
}

function triggerFileInput(id) { document.getElementById(id).click(); }
function handleFileSelect(e, docType) { handleFiles(e.target.files, docType); }

function handleFiles(files, docType) {
  Array.from(files).forEach(file => {
    const reader = new FileReader();
    reader.onload = (event) => {
      window.uploadedDocuments[docType].push({ name: file.name, base64: event.target.result });
      renderGallery(docType);
    };
    reader.readAsDataURL(file);
  });
}

function renderGallery(docType) {
  const container = document.getElementById(`gallery${docType.charAt(0).toUpperCase() + docType.slice(1)}`);
  if (!container) return;

  if (!Array.isArray(window.uploadedDocuments[docType])) {
    window.uploadedDocuments[docType] = [];
  }

  container.innerHTML = window.uploadedDocuments[docType].map((doc, idx) => {
    let imgSrc = '';
    let name = docType.toUpperCase() + ' File';

    if (typeof doc === 'string') {
      imgSrc = typeof resolveImgSrc === 'function' ? resolveImgSrc(doc) : doc;
      name = docType.toUpperCase() + ' Uploaded';
    } else if (doc && typeof doc === 'object') {
      const rawSrc = doc.base64 || doc.url || doc.link || '';
      imgSrc = typeof resolveImgSrc === 'function' ? resolveImgSrc(rawSrc) : rawSrc;
      name = doc.name || (docType.toUpperCase() + ' File');
    }

    if (!imgSrc) return '';

    return `
      <div class="thumb-item">
        <img src="${escapeHTML(imgSrc)}" onclick="openImagePreview(this.currentSrc || this.src)" alt="${escapeHTML(name)}">
        <button class="thumb-remove-btn" onclick="removeDoc('${docType}', ${idx})">&times;</button>
        <div class="thumb-label">${escapeHTML(name)}</div>
      </div>
    `;
  }).join('');

  const card = document.getElementById(`docCard${docType.charAt(0).toUpperCase() + docType.slice(1)}`);
  if (card) {
    if (window.uploadedDocuments[docType].length > 0) card.classList.add('has-files');
    else card.classList.remove('has-files');
  }
}

function removeDoc(docType, idx) {
  window.uploadedDocuments[docType].splice(idx, 1);
  renderGallery(docType);
}



function openCameraModal(docType) {
  window.activeCameraDocType = docType;
  document.getElementById('cameraModal').classList.add('active');
  navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
    .then(stream => {
      window.cameraStream = stream;
      document.getElementById('cameraVideo').srcObject = stream;
    }).catch(err => {
      alert("Kamera tidak dapat diakses.");
      closeCameraModal();
    });
}

function closeCameraModal() {
  if (window.cameraStream) window.cameraStream.getTracks().forEach(track => track.stop());
  document.getElementById('cameraModal').classList.remove('active');
}

function takeCameraSnap() {
  const video = document.getElementById('cameraVideo');
  const canvas = document.getElementById('cameraCanvas');
  canvas.width = video.videoWidth; canvas.height = video.videoHeight;
  canvas.getContext('2d').drawImage(video, 0, 0);
  window.uploadedDocuments[window.activeCameraDocType].push({ name: `camera_${Date.now()}.jpg`, base64: canvas.toDataURL('image/jpeg') });
  renderGallery(window.activeCameraDocType);
  closeCameraModal();
}
