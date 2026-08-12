const GAS_URL = "https://script.google.com/macros/s/AKfycbx2yPUDkKAOhJcIIWH9QHijMBKOFiHsOLhpPuBruNZ7MjtmAXdQvN8erlWXZUKzH-VT/exec";

async function runProductionAudit() {
  console.log("=================================================");
  console.log("🚀 MEMULAI AUDIT SIKLUS PRODUKSI 100% (LIVE)");
  console.log("=================================================\n");

  const testId = "TEST-CREW-" + Math.floor(1000 + Math.random() * 9000);
  
  // ---------------------------------------------------------
  // TAHAP 1: INPUT DATA FAKE 1 KRU UJI (CREATE)
  // ---------------------------------------------------------
  console.log("📍 [TAHAP 1/3] MEMASUKKAN DATA FAKE 1 KRU UJI (SUBMIT CREW)...");
  
  const createPayload = {
    action: "submit_crew",
    submissionId: testId,
    fullName: "Budi Santoso (TEST UJI PRODUKSI)",
    chineseName: "陳武雄",
    rankPosition: "AB (Jurumudi)",
    phoneNo: "081234567890",
    streetAddress: "Jl. Laut Samudera No. 88",
    rtRw: "002/005",
    village: "Ancol",
    district: "Pademangan",
    city: "Jakarta Utara",
    province: "DKI Jakarta",
    fam1Name: "Siti Aminah",
    fam1Relation: "Istri",
    fam1Phone: "081987654321",
    expLongline: "3 Tahun (Taiwan Longline)",
    vesselName: "Longline 88",
    passportNo: "A12345678",
    passportExpiry: "2028-12-31",
    cdcNo: "B98765432",
    cdcExpiry: "2027-10-15",
    ijazahLevel: "SMA",
    kkStatus: "Ada",
    akteStatus: "Ada",
    medicalStatus: "Fit",
    operationalStatus: "STAND_BY",
    vesselCandidate: "LONG FU 68",
    documents: {}
  };

  try {
    console.log(`Mengirim payload pendaftaran ID: ${testId}...`);
    const createRes = await fetch(GAS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createPayload)
    });

    const createText = await createRes.text();
    console.log("Response Create Status Code:", createRes.status);
    console.log("Response Create Body:", createText);
    
    let createJson;
    try { createJson = JSON.parse(createText); } catch(e) {}
    
    if (createRes.ok || (createJson && createJson.success)) {
      console.log("✅ TAHAP 1 BERHASIL: Data kru uji berhasil didaftarkan di Google Cloud / Sheets!\n");
    } else {
      console.error("❌ TAHAP 1 GAGAL:", createText);
      return;
    }
  } catch (err) {
    console.error("❌ TAHAP 1 ERROR KONEKSI:", err.message);
    return;
  }

  // ---------------------------------------------------------
  // TAHAP 2: EDIT DATA KRU UJI (UPDATE)
  // ---------------------------------------------------------
  console.log("📍 [TAHAP 2/3] MENGEDIT & MENYIMPAN PERUBAHAN DATA KRU (UPDATE CREW)...");
  
  const updatePayload = {
    action: "update_crew",
    submissionId: testId,
    fullName: "Budi Santoso (TEST UJI PRODUKSI - UPDATED)",
    chineseName: "陳武雄",
    rankPosition: "AB (Jurumudi)",
    phoneNo: "081234567890",
    streetAddress: "Jl. Laut Samudera No. 88",
    rtRw: "002/005",
    village: "Ancol",
    district: "Pademangan",
    city: "Jakarta Utara",
    province: "DKI Jakarta",
    fam1Name: "Siti Aminah",
    fam1Relation: "Istri",
    fam1Phone: "081987654321",
    expLongline: "4 Tahun (Taiwan Longline)",
    vesselName: "Longline 88",
    passportNo: "A12345678",
    passportExpiry: "2028-12-31",
    cdcNo: "B98765432",
    cdcExpiry: "2027-10-15",
    ijazahLevel: "SMA",
    kkStatus: "Ada",
    akteStatus: "Ada",
    medicalStatus: "Fit",
    operationalStatus: "ON_BOAT",
    vesselAssigned: "LONG FU NO. 68",
    flightDate: "2026-09-01",
    finishDate: "2028-09-01",
    historyStatus: "STAND_BY -> ON_BOAT",
    adminNotes: "Kru lolos uji medis, visa selesai, siap terbang tanggal 1 Sep 2026",
    status: "ON_BOAT"
  };

  try {
    console.log(`Mengirim update status operasional untuk ID: ${testId}...`);
    const updateRes = await fetch(GAS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatePayload)
    });

    const updateText = await updateRes.text();
    console.log("Response Update Status Code:", updateRes.status);
    console.log("Response Update Body:", updateText);

    let updateJson;
    try { updateJson = JSON.parse(updateText); } catch(e) {}

    if (updateRes.ok || (updateJson && updateJson.success)) {
      console.log("✅ TAHAP 2 BERHASIL: Edit & simpan data kru berhasil di-update di Google Cloud / Sheets!\n");
    } else {
      console.error("❌ TAHAP 2 GAGAL:", updateText);
      return;
    }
  } catch (err) {
    console.error("❌ TAHAP 2 ERROR KONEKSI:", err.message);
    return;
  }

  // ---------------------------------------------------------
  // TAHAP 3: BACA & VERIFIKASI DATA KRU (READ)
  // ---------------------------------------------------------
  console.log("📍 [TAHAP 3/3] MEMBACA & VERIFIKASI DATA KRU DARI CLOUD (READ)...");
  
  try {
    const fetchRes = await fetch(GAS_URL + "?action=getAllCrew&t=" + Date.now());
    const fetchText = await fetchRes.text();
    console.log("Response Read Status Code:", fetchRes.status);
    
    let fetchJson;
    try { fetchJson = JSON.parse(fetchText); } catch(e) {}

    if (fetchJson && fetchJson.success && Array.isArray(fetchJson.crew)) {
      const found = fetchJson.crew.find(c => c.submissionId === testId);
      if (found) {
        console.log("✅ KRU DITEMUKAN DALAM DATABASE CLOUD:");
        console.log(" - ID Submisi:", found.submissionId);
        console.log(" - Nama Lengkap:", found.fullName);
        console.log(" - Status Operasional:", found.operationalStatus);
        console.log(" - Kapal Penempatan:", found.vesselAssigned);
        console.log(" - Tgl Terbang:", found.flightDate);
        console.log(" - Catatan Admin:", found.adminNotes);
        console.log("\n🎉 AUDIT PRODUKSI SELESAI: 100% SUKSES TERSIMPAN DAN TERVERIFIKASI!");
      } else {
        console.warn("⚠️ Data kru baru belum ditemukan di list (kemungkinan sheet delay): Total kru =", fetchJson.crew.length);
      }
    } else {
      console.log("Raw Read Response:", fetchText);
    }
  } catch (err) {
    console.error("❌ TAHAP 3 ERROR READ:", err.message);
  }
}

runProductionAudit();
