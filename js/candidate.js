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
      <p><strong>${window.currentLang === 'zh' ? '身高 / 体重' : 'Tinggi / Berat'}:</strong> ${escapeHTML(data.heightCm)} ${window.currentLang === 'zh' ? '厘米' : 'cm'} / ${escapeHTML(data.weightKg)} ${window.currentLang === 'zh' ? '公斤' : 'kg'}</p>
      <p><strong>Kontak:</strong> ${escapeHTML(data.phoneNo)}</p>
      <p><strong>Alamat:</strong> ${escapeHTML(data.streetAddress)}, ${escapeHTML(data.city)}</p>
      <p><strong>Kualifikasi Longline:</strong> ${escapeHTML(data.expLongline)}</p>
      <p><strong>Paspor:</strong> ${escapeHTML(data.passportNo)} (Exp: ${escapeHTML(formatDisplayDate(data.passportExpiry))})</p>
      <p><strong>Buku Pelaut:</strong> ${escapeHTML(data.cdcNo)} (Exp: ${escapeHTML(formatDisplayDate(data.cdcExpiry))})</p>
    </div>
  `;
}

function generateSequentialSubmissionId() {
  const ids = Array.isArray(window.crewDatabase)
    ? window.crewDatabase
        .map(crew => parseInt(String(crew && crew.submissionId || '').match(/(\d+)$/)?.[1] || '0', 10))
        .filter(value => Number.isFinite(value) && value > 0)
    : [];
  const nextNumber = ids.length ? Math.max(...ids) + 1 : 1001;
  return `CREW-LONG-${nextNumber}`;
}

function getFormData() {
  const expRadio = document.querySelector('input[name="expLongline"]:checked');
  const skillsChecked = Array.from(document.querySelectorAll('input[name="skillGeneral"]:checked')).map(el => el.value);
  const properValue = id => properCaseText(document.getElementById(id).value.trim());
  const streetAddress = properValue('streetAddress');
  const village = properValue('village');
  const district = properValue('district');
  const city = properValue('city');
  const province = properValue('province');
  const rtRw = document.getElementById('rtRw').value.trim();
  const sailingHistory = [1, 2, 3].map(number => ({
    vessel: properValue(`vesselName${number}`),
    period: document.getElementById(`signOnOff${number}`).value.trim(),
    placement: properValue(`placementCountry${number}`)
  })).filter(entry => entry.vessel || entry.period || entry.placement);
  const vesselHistoryText = sailingHistory.map((entry, index) =>
    `${index + 1}. ${entry.vessel || '-'}${entry.period ? ` (${entry.period})` : ''}`
  ).join(' | ');
  const signOnOffText = sailingHistory.map((entry, index) => `${index + 1}. ${entry.period || '-'}`).join(' | ');
  const placementHistoryText = sailingHistory.map((entry, index) => `${index + 1}. ${entry.placement || '-'}`).join(' | ');

  return {
    submissionId: generateSequentialSubmissionId(),
    fullName: properValue('fullName'),
    chineseName: document.getElementById('chineseName').value.trim(),
    rankPosition: properValue('rankPosition'),
    gender: properValue('gender'),
    pob: properValue('pob'),
    dob: document.getElementById('dob').value,
    religion: properValue('religion'),
    maritalStatus: properValue('maritalStatus'),
    bloodType: document.getElementById('bloodType').value,
    shirtSize: document.getElementById('shirtSize').value,
    shoeSize: document.getElementById('shoeSize').value,
    heightCm: document.getElementById('heightCm').value,
    weightKg: document.getElementById('weightKg').value,
    streetAddress,
    rtRw,
    village,
    district,
    city,
    province,
    combinedAddress: `${streetAddress} RT/RW: ${rtRw} Kel/Desa: ${village} Kec: ${district} Kab/Kota: ${city} Prov: ${province}`,
    phoneNo: document.getElementById('phoneNo').value.trim(),
    fam1Name: properValue('fam1Name'),
    fam1Relation: properValue('fam1Relation'),
    fam1Phone: document.getElementById('fam1Phone').value.trim(),
    fam2Name: properValue('fam2Name'),
    fam2Relation: properValue('fam2Relation'),
    fam2Phone: document.getElementById('fam2Phone').value.trim(),
    expLongline: expRadio ? properCaseText(expRadio.value) : "",
    vesselName: vesselHistoryText,
    signOnOff: signOnOffText,
    vesselTypeLongline: properValue('vesselTypeLongline'),
    vesselOrigin: properValue('vesselOrigin'),
    placementCountry: placementHistoryText,
    skillGeneral: skillsChecked.map(properCaseText),
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
  if (window.isSubmittingCrewForm) return;

  if (!document.getElementById('agreeTermsCheck').checked) {
    alert("Harap centang persetujuan keabsahan data.");
    return;
  }
  window.isSubmittingCrewForm = true;
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
    formData.submissionId = generateSequentialSubmissionId();
  }

  const submitButton = document.querySelector('.btn-submit');
  const originalButtonHtml = submitButton ? submitButton.innerHTML : '';
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.classList.add('is-processing');
    submitButton.setAttribute('aria-busy', 'true');
    submitButton.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> MENYIMPAN...';
  }

  try {
    if (!window.api) throw new Error('API cloud tidak tersedia.');
    const saveResult = isEditing
      ? await window.api.updateCrew(cloudPayload)
      : await window.api.submitCrew(cloudPayload);
    if (!saveResult?.success) throw new Error('Backend tidak mengonfirmasi penyimpanan.');

    const savedIndex = window.crewDatabase.findIndex(crew => crew.submissionId === cloudPayload.submissionId);
    if (savedIndex >= 0) window.crewDatabase[savedIndex] = { ...window.crewDatabase[savedIndex], ...cloudPayload };
    else window.crewDatabase.push(cloudPayload);
    window.api.saveLocalDatabase();
  } catch (error) {
    console.error('Crew cloud sync failed:', error);
    alert(`Data belum tersimpan di cloud. ${error.message || 'Periksa koneksi lalu coba kembali.'}`);
    return;
  } finally {
    window.isSubmittingCrewForm = false;
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.classList.remove('is-processing');
      submitButton.removeAttribute('aria-busy');
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
    if (data.heightCm) document.getElementById('heightCm').value = data.heightCm;
    if (data.weightKg) document.getElementById('weightKg').value = data.weightKg;
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

function compressImage(file, callback) {
  if (!file.type.startsWith('image/')) {
    const reader = new FileReader();
    reader.onload = (e) => callback(e.target.result, file.type);
    reader.readAsDataURL(file);
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    const img = new Image();
    img.onload = function() {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      const MAX_WIDTH = 1200;
      const MAX_HEIGHT = 1200;

      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
      callback(dataUrl, 'image/jpeg');
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function handleFiles(files, docType) {
  if (!Array.isArray(window.uploadedDocuments[docType])) {
    window.uploadedDocuments[docType] = [];
  }
  Array.from(files).forEach(file => {
    const isValidType = file.type.startsWith('image/') || file.type === 'application/pdf';
    if (!isValidType) {
      if (typeof showNotification === 'function') {
        showNotification(`Format file '${file.name}' tidak didukung! Gunakan gambar atau PDF.`, 'error');
      } else {
        alert(`Format file '${file.name}' tidak didukung! Gunakan gambar atau PDF.`);
      }
      return;
    }

    const isDuplicate = window.uploadedDocuments[docType].some(doc => {
      if (doc && typeof doc === 'object') {
        return doc.name === file.name;
      }
      return false;
    });

    if (isDuplicate) {
      if (typeof showNotification === 'function') {
        showNotification(`Berkas '${file.name}' sudah ada di daftar unggahan!`, 'warning');
      } else {
        alert(`Berkas '${file.name}' sudah ada di daftar unggahan!`);
      }
      return;
    }

    compressImage(file, (dataUrl, mimeType) => {
      window.uploadedDocuments[docType].push({ 
        name: file.name, 
        type: mimeType, 
        base64: dataUrl 
      });
      renderGallery(docType);
    });
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
    let isPdf = false;

    if (typeof doc === 'string') {
      imgSrc = typeof resolveImgSrc === 'function' ? resolveImgSrc(doc) : doc;
      name = docType.toUpperCase() + ' Uploaded';
      if (doc.toLowerCase().includes('.pdf') || doc.includes('application/pdf')) {
        isPdf = true;
      }
    } else if (doc && typeof doc === 'object') {
      const rawSrc = doc.base64 || doc.url || doc.link || '';
      imgSrc = typeof resolveImgSrc === 'function' ? resolveImgSrc(rawSrc) : rawSrc;
      name = doc.name || (docType.toUpperCase() + ' File');
      if (name.toLowerCase().endsWith('.pdf') || (doc.type && doc.type === 'application/pdf') || rawSrc.includes('application/pdf') || rawSrc.toLowerCase().includes('.pdf')) {
        isPdf = true;
      }
    }

    if (!imgSrc) return '';

    const previewSrc = isPdf 
      ? 'https://cdn-icons-png.flaticon.com/512/337/337946.png'
      : imgSrc;

    return `
      <div class="thumb-item">
        <img src="${escapeHTML(previewSrc)}" onclick="openDocPreviewClick('${escapeHTML(imgSrc)}', ${isPdf})" alt="${escapeHTML(name)}" style="object-fit: ${isPdf ? 'contain' : 'cover'}; padding: ${isPdf ? '8px' : '0'}; cursor: pointer;">
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
  window.uploadedDocuments[window.activeCameraDocType].push({ name: `camera_${Date.now()}.jpg`, type: 'image/jpeg', base64: canvas.toDataURL('image/jpeg') });
  renderGallery(window.activeCameraDocType);
  closeCameraModal();
}

function openDocPreviewClick(url, isPdf) {
  if (isPdf) {
    const newWindow = window.open();
    if (newWindow) {
      newWindow.document.write(`<iframe src="${url}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
    } else {
      window.open(url, '_blank');
    }
  } else {
    if (typeof openImagePreview === 'function') {
      openImagePreview(url);
    } else {
      window.open(url, '_blank');
    }
  }
}

function addLinkDocFromInput(inputId, docType) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const url = input.value.trim();
  if (!url) return;

  if (!/^https?:\/\//i.test(url)) {
    alert("Format link tidak valid! Pastikan link diawali dengan http:// atau https://");
    return;
  }

  if (!Array.isArray(window.uploadedDocuments[docType])) {
    window.uploadedDocuments[docType] = [];
  }

  const exists = window.uploadedDocuments[docType].some(doc => {
    const docUrl = typeof doc === 'string' ? doc : (doc.url || doc.link || '');
    return docUrl.trim() === url;
  });

  if (exists) {
    alert("Link tersebut sudah terdaftar.");
    return;
  }

  window.uploadedDocuments[docType].push({
    name: 'CLOUD Link',
    url: url,
    base64: ''
  });

  renderGallery(docType);
  input.value = '';
  if (typeof showNotification === 'function') {
    showNotification("Link berhasil ditambahkan!", "success");
  }
}

window.openDocPreviewClick = openDocPreviewClick;
window.addLinkDocFromInput = addLinkDocFromInput;
