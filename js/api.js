const DEFAULT_GAS_URL = "https://script.google.com/macros/s/AKfycbwgSE70ic5Fuwe6j_e2gaK1Z5227MVmHJIqORI7BEhWTQm5nY8udw689d9uYWKwiVlG/exec";

function getGasUrl() {
  return localStorage.getItem('crew_app_gas_url') || DEFAULT_GAS_URL;
}

function loadLocalDatabase() {
  const saved = localStorage.getItem('crew_app_database');
  if (saved) {
    try {
      window.crewDatabase = JSON.parse(saved);
    } catch(e) {
      console.error("Error parsing local database:", e);
    }
  } else {
    // Initial Sample Crew Database
    window.crewDatabase = [
      {
        submissionId: "CREW-LONG-1001", fullName: "BUDI SANTOSO", chineseName: "张伟大 (Zhang Weida)",
        rankPosition: "DECKHAND", phoneNo: "+6281298765432", streetAddress: "Jl. Yos Sudarso No. 45",
        rtRw: "03/08", village: "Sukamaju", district: "Cilincing", city: "Jakarta Utara",
        province: "DKI Jakarta", combinedAddress: "Jl. Yos Sudarso No. 45 RT/RW: 03/08 Kel/Desa: Sukamaju Kec: Cilincing Kab/Kota: Jakarta Utara Prov: DKI Jakarta",
        fam1Name: "Siti Rahmawati", fam1Relation: "Istri", fam1Phone: "+6281387654321",
        fam2Name: "Herman Santoso", fam2Relation: "Orang Tua", fam2Phone: "+6281277665544",
        expLongline: "MANUAL DAN SNAP ATAS 小筒下口，车筒下口", vesselName: "FU YUAN YU 888",
        vesselTypeLongline: "CT4 SNAP ATAS 车筒下口", vesselOrigin: "Taiwan 台湾", placementCountry: "Mauritius 毛里求斯",
        skillGeneral: ["Gulung Yoka (手工捲繩)", "Proses Ikan (殺魚)", "Tukang Es (冰工)"],
        passportNo: "C9823411", passportExpiry: "2029-08-15", cdcNo: "E092182", cdcExpiry: "2028-11-20",
        bstExpiry: "2027-05-10", kkStatus: "Asli", akteStatus: "Asli", ijazahLevel: "SMA Sederajat - Asli",
        medicalStatus: "Ada", waliStatus: "Ada", skckStatus: "Ada", shirtSize: "L", shoeSize: "42",
        gender: "Male", dob: "1995-04-12", religion: "Islam", verificationStatus: "Verified", submittedAt: "2026-07-28 10:00",
        documents: {
          passport: [{ name: "passport_budi.jpg", base64: createDummySvgDataUrl("PASSPORT BUDI") }],
          ktp: [{ name: "ktp_budi.jpg", base64: createDummySvgDataUrl("KTP BUDI") }],
          cdc: [{ name: "seaman_book.jpg", base64: createDummySvgDataUrl("CDC BUDI") }],
          medical: [{ name: "mcu_fit.jpg", base64: createDummySvgDataUrl("MCU BUDI") }],
          cert: [{ name: "bst_cert.jpg", base64: createDummySvgDataUrl("BST BUDI") }],
          photo: [{ name: "fullbody_budi.jpg", base64: createDummySvgDataUrl("FOTO BUDI") }]
        }
      },
      {
        submissionId: "CREW-LONG-1002", fullName: "AGUS SETIAWAN", chineseName: "阿古斯 (Agus)",
        rankPosition: "OPERATOR HOLER", phoneNo: "+6281355443322", streetAddress: "Jl. Pelabuhan No. 12",
        rtRw: "01/02", village: "Muara Angke", district: "Penjaringan", city: "Jakarta Utara",
        province: "DKI Jakarta", combinedAddress: "Jl. Pelabuhan No. 12 RT/RW: 01/02 Kel/Desa: Muara Angke Kec: Penjaringan Kab/Kota: Jakarta Utara Prov: DKI Jakarta",
        fam1Name: "Rina Setyowati", fam1Relation: "Istri", fam1Phone: "+6281399887766",
        fam2Name: "Bambang Setiawan", fam2Relation: "Saudara", fam2Phone: "+6281244556677",
        expLongline: "SNAP BAWAH DAN ATAS 导轮入口，车筒下口", vesselName: "TAI WAN 12",
        vesselTypeLongline: "CT5 SNAP ATAS 车筒下口", vesselOrigin: "Taiwan 台湾", placementCountry: "Capetown 开普敦",
        skillGeneral: ["Holler (辊仔車)", "Buang Pancing (掛朗)", "Kemudi Holing (开船)"],
        passportNo: "C8812399", passportExpiry: "2026-09-30", cdcNo: "E088123", cdcExpiry: "2026-10-15",
        bstExpiry: "2027-01-20", kkStatus: "Asli", akteStatus: "FC", ijazahLevel: "SMP - Asli",
        medicalStatus: "Ada", waliStatus: "Ada", skckStatus: "Ada", shirtSize: "M", shoeSize: "40",
        gender: "Male", dob: "1992-09-18", religion: "Islam", verificationStatus: "Verified", submittedAt: "2026-07-29 14:20",
        documents: {
          passport: [{ name: "passport_agus.jpg", base64: createDummySvgDataUrl("PASSPORT AGUS") }],
          ktp: [{ name: "ktp_agus.jpg", base64: createDummySvgDataUrl("KTP AGUS") }],
          cdc: [{ name: "seaman_book.jpg", base64: createDummySvgDataUrl("CDC AGUS") }],
          medical: [{ name: "mcu_fit.jpg", base64: createDummySvgDataUrl("MCU AGUS") }],
          cert: [{ name: "bst_cert.jpg", base64: createDummySvgDataUrl("BST AGUS") }],
          photo: [{ name: "fullbody_agus.jpg", base64: createDummySvgDataUrl("FOTO AGUS") }]
        }
      },
      {
        submissionId: "CREW-LONG-1003", fullName: "DEDI KURNIAWAN", chineseName: "德迪 (Dedi - 潜水员)",
        rankPosition: "SELAM / TUKANG SELAM", phoneNo: "+6281277889900", streetAddress: "Jl. Bahari Indah No. 88",
        rtRw: "04/05", village: "Tanjung Priok", district: "Tanjung Priok", city: "Jakarta Utara",
        province: "DKI Jakarta", combinedAddress: "Jl. Bahari Indah No. 88 RT/RW: 04/05 Kel/Desa: Tanjung Priok Kec: Tanjung Priok Kab/Kota: Jakarta Utara Prov: DKI Jakarta",
        fam1Name: "Maya Kurnia", fam1Relation: "Istri", fam1Phone: "+6281277112233",
        fam2Name: "Subagyo Kurniawan", fam2Relation: "Orang Tua", fam2Phone: "+6281355667788",
        expLongline: "MANUAL DAN SNAP BAWAH 小筒下口，导轮入口", vesselName: "FU YUAN YU 999",
        vesselTypeLongline: "CT-6/7 导轮入口", vesselOrigin: "China 中国", placementCountry: "Solomon 所罗门",
        skillGeneral: ["Selam / Tukang Selam (潜水)", "Holler (辊仔車)", "Kemudi Holing (开船)"],
        passportNo: "C9945120", passportExpiry: "2030-01-10", cdcNo: "E099411", cdcExpiry: "2029-06-25",
        bstExpiry: "2028-09-12", kkStatus: "Asli", akteStatus: "Asli", ijazahLevel: "SMA Sederajat - Asli",
        medicalStatus: "Ada", waliStatus: "Ada", skckStatus: "Ada", shirtSize: "XL", shoeSize: "43",
        gender: "Male", dob: "1990-11-05", religion: "Islam", verificationStatus: "Verified", submittedAt: "2026-07-30 08:00",
        documents: {
          passport: [{ name: "passport_dedi.jpg", base64: createDummySvgDataUrl("PASSPORT DEDI") }],
          ktp: [{ name: "ktp_dedi.jpg", base64: createDummySvgDataUrl("KTP DEDI") }],
          cdc: [{ name: "seaman_book.jpg", base64: createDummySvgDataUrl("CDC DEDI") }],
          medical: [{ name: "mcu_fit.jpg", base64: createDummySvgDataUrl("MCU DEDI") }],
          cert: [{ name: "bst_cert.jpg", base64: createDummySvgDataUrl("BST DEDI") }],
          photo: [{ name: "fullbody_dedi.jpg", base64: createDummySvgDataUrl("FOTO DEDI SELAM") }]
        }
      }
    ];
    saveLocalDatabase();
  }
}

function saveLocalDatabase() {
  localStorage.setItem('crew_app_database', JSON.stringify(window.crewDatabase));
}
