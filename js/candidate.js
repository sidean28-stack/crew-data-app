// js/candidate.js

function goToStep(step) {
  if (step > window.currentStep && !validateStep(window.currentStep)) {
    alert(t('alertValidationErr'));
    return;
  }
  window.currentStep = step;
  updateWizardProgress();
}

function nextStep() {
  if (validateStep(window.currentStep)) {
    if (window.currentStep < 5) {
      window.currentStep++;
      updateWizardProgress();
      if (window.currentStep === 5) renderReviewSummary();
    }
  } else {
    alert(t('alertValidationErr'));
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
  if (step === 1) {
    const fullName = document.getElementById('fullName').value.trim();
    const rank = document.getElementById('rankPosition').value;
    const pob = document.getElementById('pob').value.trim();
    const dob = document.getElementById('dob').value;
    const heightCm = document.getElementById('heightCm').value;
    const weightKg = document.getElementById('weightKg').value;
    const phone = document.getElementById('phoneNo').value.trim();
    const fam1Name = document.getElementById('fam1Name').value.trim();
    const fam1Phone = document.getElementById('fam1Phone').value.trim();
    const fam2Name = document.getElementById('fam2Name').value.trim();
    const fam2Phone = document.getElementById('fam2Phone').value.trim();
    
    if (!heightCm || heightCm < 130 || heightCm > 220) {
      alert(t('errHeightRequired'));
      return false;
    }
    if (!weightKg || weightKg < 35 || weightKg > 180) {
      alert(t('errWeightRequired'));
      return false;
    }

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
    heightCm: parseInt(document.getElementById('heightCm').value) || null,
    weightKg: parseInt(document.getElementById('weightKg').value) || null,
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
    status: 'WAITING',
    submittedAt: new Date().toISOString()
  };
}

async function submitCrewForm() {
  if (!document.getElementById('agreeTermsCheck').checked) {
    alert(t('alertValidationErr'));
    return;
  }
  const formData = getFormData();
  
  const btn = document.querySelector('.btn-submit');
  if (btn) btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> SYNCING TO CLOUD...';
  
  try {
    if (window.editingSubmissionId) {
      formData.submissionId = window.editingSubmissionId;
      formData.action = 'update_crew';
      const res = await window.api.updateCrew(formData);
      if (!res.success) throw new Error(res.error || "Update Failed on Cloud");
    } else {
      formData.submissionId = "CRW-" + Date.now();
      formData.action = 'submit_crew';
      const res = await window.api.submitCrew(formData);
      if (!res.success) throw new Error(res.error || "Submit Failed on Cloud");
    }
    
    // Cloud Refresh (ensures Cache and UI get the exact latest truth)
    await window.api.syncNow();
    
    if (typeof loadDirectoryTable === 'function') loadDirectoryTable();
    if (typeof renderCatalogGrid === 'function') renderCatalogGrid();

    alert(window.editingSubmissionId ? t('alertUpdateSuccess') : t('alertSaveSuccess'));
    
    window.editingSubmissionId = null;
    clearDraft();
    switchTab('directory');
    
  } catch (err) {
    console.error("Cloud Sync Error:", err);
    alert("Submission Failed: " + err.message);
  } finally {
    if (btn) btn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> SUBMIT DATA CREW';
  }
}

function saveDraft() {
  const data = getFormData();
  localStorage.setItem('crew_app_draft', JSON.stringify(data));
  alert(t('alertSaveSuccess'));
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
  const form = document.getElementById('crewForm');
  if (form) form.reset();
  
  window.editingSubmissionId = null;
  window.uploadedDocuments = { passport: [], ktp: [], cdc: [], medical: [], cert: [], photo: [] };
  
  // Clear galleries
  ['passport', 'ktp', 'cdc', 'medical', 'cert', 'photo'].forEach(doc => {
    const gal = document.getElementById('gallery' + doc.charAt(0).toUpperCase() + doc.slice(1));
    if (gal) gal.innerHTML = '';
  });

  // Reset wizard to step 1
  window.currentStep = 1;
  if (typeof updateWizardProgress === 'function') updateWizardProgress();
  
  alert(t ? t('alertDeleteSuccess') : 'Draft cleared.');
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
  container.innerHTML = window.uploadedDocuments[docType].map((doc, idx) => {
    let imgSrc = doc.base64;
    let clickAction = `onclick="openImagePreview('${doc.base64}')"`;
    if (doc.isDriveUrl) {
      if (imgSrc.includes('open?id=')) imgSrc = imgSrc.replace('open?id=', 'uc?export=view&id=');
      if (imgSrc.includes('file/d/')) {
         const match = imgSrc.match(/file\/d\/([a-zA-Z0-9_-]+)/);
         if (match) imgSrc = `https://drive.google.com/uc?export=view&id=${match[1]}`;
      }
      clickAction = `onclick="window.open('${doc.base64}', '_blank')"`;
    }
    return `
    <div class="thumb-item">
      <img src="${imgSrc}" ${clickAction} onerror="this.onerror=null; this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'50\\' height=\\'50\\'><text x=\\'5\\' y=\\'25\\' font-size=\\'10\\'>Drive Link</text></svg>';">
      <button class="thumb-remove-btn" onclick="removeDoc('${docType}', ${idx})">&times;</button>
      <div class="thumb-label">${escapeHTML(doc.name)}</div>
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
      alert(t('alertNoCamera'));
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
