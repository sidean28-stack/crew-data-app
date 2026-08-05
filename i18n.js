/**
 * Crew Data Application - Internationalization (i18n) Dictionary
 * Company: Wantaifeng International Co Ltd - PT ALINDA PRIMA SENTOSA
 * Specialization: Kapal Longline (远洋延绳钓渔船)
 */

const i18n = {
  id: {
    appTitle: "Sistem Data & Katalog Crew Longline",
    appSubtitle: "Wantaifeng International Co Ltd - PT ALINDA PRIMA SENTOSA",
    langID: "Bahasa Indonesia",
    langZH: "中文 (Mandarin)",
    
    // User Roles
    roleLabel: "Peran Akses:",
    roleAdmin: "Admin Manning Agency",
    roleOwner: "Ship Owner (Katalog & Booking)",
    roleCandidate: "Kandidat Kru (Form Wizard)",

    // Tabs
    tabForm: "Formulir Kru Baru",
    tabCatalog: "Katalog Kru (Ship Owner)",
    tabDirectory: "Manajemen Database (Admin)",
    tabGoogleSetup: "Koneksi Google",
    
    // Step Titles
    step1Title: "1. Data Diri & Posisi",
    step1Desc: "Informasi personal, posisi & alamat lengkap",
    step2Title: "2. Kualifikasi & Berlayar",
    step2Desc: "Pengalaman longline, riwayat kapal & skill",
    step3Title: "3. Dokumen & Legalitas",
    step3Desc: "Status dokumen, nomor paspor & buku pelaut",
    step4Title: "4. Upload Foto Dokumen",
    step4Desc: "Unggah dokumen (Minimal 1 foto per dokumen wajib)",
    step5Title: "5. Review & Submit",
    step5Desc: "Pemeriksaan data & kirim",

    // Section 1 Personal & Position
    fullName: "Nama Lengkap Crew (全名)",
    chineseName: "Nama Mandarin (中文姓名 - Opsional)",
    heightCm: "Tinggi Badan (cm)",
    heightCmPlaceholder: "Contoh: 170",
    weightKg: "Berat Badan (kg)",
    weightKgPlaceholder: "Contoh: 65",
    rankPosition: "Jabatan / Posisi Longline (职务)",
    selectRank: "-- Pilih Jabatan Longline --",
    gender: "Jenis Kelamin (性别)",
    male: "Laki-laki (男)",
    female: "Perempuan (女)",
    pob: "Tempat Lahir (出生地点)",
    dob: "Tanggal Lahir (出生日期)",
    religion: "Agama (宗教)",
    maritalStatus: "Status Perkawinan (婚姻状况)",
    single: "Belum Menikah (未婚)",
    married: "Menikah (已婚)",
    divorced: "Cerai (离异)",
    bloodType: "Golongan Darah (血型)",
    shirtSize: "Ukuran Baju (服装尺寸)",
    shoeSize: "Ukuran Sepatu Safety (鞋码)",

    // Address
    streetAddress: "Jalan (街道/门牌号)",
    rtRw: "RT / RW",
    village: "Kelurahan / Desa (村/社区)",
    district: "Kecamatan (乡镇)",
    city: "Kabupaten / Kota (城市/县)",
    province: "Provinsi (省份)",
    phoneNo: "Nomor HP / WhatsApp Aktif",

    // Family Contacts
    familyNotice: "Data Keluarga Crew Minimal 2 Harus Diisi Untuk Kelengkapan Data dan Keadaan Darurat (为确保数据完整性并应对紧急情况，至少需要填写2名船员家属的信息)",
    family1Title: "Kontak Keluarga 1 (家庭联系人 1) *",
    family2Title: "Kontak Keluarga 2 (家庭联系人 2) *",
    famName: "Nama Lengkap Keluarga (全名)",
    famRelation: "Hubungan (Istri/Orang Tua/Saudara) (关系)",
    famPhone: "Nomor Telp / WhatsApp Aktif",

    // Section 2 Longline Qualifications & Sailing History
    qualSectionTitle: "KUALIFIKASI CREW 船员资格 (Khusus Kapal Longline)",
    expLonglineTitle: "Pengalaman Longline (Manual, Snap Atas, Snap Bawah)",
    sailingHistoryTitle: "PENGALAMAN BERLAYAR 航海经验",
    vesselName: "Nama Kapal (舰船名称)",
    vesselTypeLongline: "Jenis Kapal (船舶类型)",
    vesselOrigin: "Asal Kapal (船只的来源)",
    placementCountry: "Negara Penempatan (工作地点)",
    skillGeneralTitle: "SKILL UMUM 通用技能",

    // Section 3 Documents Checklist
    docChecklistTitle: "KELENGKAPAN DOKUMEN & SERTIFIKAT",
    passportNo: "Nomor Paspor (No. Paspor)",
    passportExpiry: "Expired Paspor (Tanggal)",
    cdcNo: "No. Seaman Book (海员证)",
    cdcExpiry: "Expired Seaman Book (Tanggal)",
    bstExpiry: "Sertifikat BST Expired (Tanggal)",
    kkStatus: "Kartu Keluarga (KK)",
    akteStatus: "Akte Kelahiran",
    ijazahLevel: "Ijazah Sekolah",
    medicalStatus: "Surat Medical Check-Up (MCU)",
    waliStatus: "Surat Ijin Wali",
    skckStatus: "Surat SKCK (Kepolisian)",

    // Document Uploads
    uploadNotice: "Unggah dokumen pendukung (Format: JPG, PNG, atau PDF). Minimal 1 foto jelas per kategori dokumen wajib.",
    docPassport: "Paspor / Passport (护照)",
    docKtp: "KTP / Kartu Identitas (身份证)",
    docCdc: "Buku Pelaut / CDC / Seaman Book (海员证)",
    docMedical: "Surat Medical Check-Up / MCU (体检报告)",
    docCert: "Sertifikat Keahlian / BST",
    docPhoto: "Foto Pas / Full Body Crew (免冠照/全身照)",
    docOptionalNotice: "(Opsional / Gambar Tambahan)",
    minRequirement: "Min. 1 Foto Wajib",

    // Actions & Buttons
    submitBtn: "Kirim Data Crew (Submit to Sheets & Drive)",
    saveDraftBtn: "Simpan Draf",
    clearDraftBtn: "Hapus Draf",
    prevBtn: "Kembali",
    nextBtn: "Lanjut",
    cameraBtn: "Ambil Foto Kamera",
    dropzoneHint: "Tarik & Lepas gambar di sini, atau klik untuk memilih file",

    // Catalogue & Booking
    catalogTitle: "Katalog Kandidat Kru Kapal Ikan Longline",
    catalogDesc: "Pilih kandidat kru berdedikasi tinggi untuk operasional kapal longline Taiwan & China",
    searchPlaceholder: "Cari nama kru, skill, kapal...",
    filterRank: "Semua Jabatan",
    filterQual: "Semua Kualifikasi Longline",
    filterVessel: "Semua Jenis Kapal",
    addToBasket: "Tambah ke Keranjang Booking",
    inBasket: "Sudah di Keranjang",
    basketTitle: "Keranjang Booking Kru (Crew Selection Basket)",
    basketCount: "Kru Dipilih",
    checkoutBooking: "Proses Pemesanan Kru",
    ownerNameLabel: "Nama Ship Owner / Perusahaan Kapal",
    ownerContactLabel: "No. HP / Email Kontak Owner",
    bookingNotesLabel: "Catatan Tambahan / Spesifikasi Kapal",
    sendBookingBtn: "Kirim Permintaan Booking ke Admin",
    bookingSuccessAlert: "Permintaan pemesanan kru telah dikirim ke Admin PT ALINDA!",

    // Admin Directory & One-Time Access Link
    adminTitle: "Direktori Data Crew & Kelola Berkas",
    totalCrewCount: "Total Crew Terdaftar",
    colCode: "ID / Kode Kru",
    colName: "Nama Crew",
    colRank: "Jabatan",
    colQual: "Kualifikasi Longline",
    colContact: "Kontak",
    colAddress: "Alamat Lengkap",
    colDocs: "Status Masa Berlaku Dokumen",
    colStatus: "Status Verifikasi",
    colAction: "Aksi",
    exportCSV: "Ekspor CSV Lengkap",
    exportZIP: "Download ZIP Berkas Foto",
    generateOneTimeLink: "Buat Link Sekali Pakai (One-Time Link)",
    editCrew: "Edit Data Kru",
    deleteCrew: "Hapus Data",
    printCV: "Cetak CV Pelaut",
    
    // One Time Link Modal
    otlModalTitle: "Generate One-Time Access Link (Owner Kapal)",
    otlDesc: "Buat link khusus berdurasi terbatas agar Owner Kapal dapat melihat data kru unmasked secara aman.",
    targetOwnerLabel: "Nama Owner / Perusahaan Sasaran",
    expiryDurationLabel: "Masa Berlaku Link",
    genLinkBtn: "Buat Link Sekarang",
    copiedLinkAlert: "Link Sekali Pakai berhasil dibuat dan disalin ke Clipboard!",

    // Alerts & Confirmations
    alertValidationErr: "Harap lengkapi semua kolom wajib (termasuk minimal 2 Kontak Keluarga) dan pastikan foto dokumen terunggah!",
    alertSubmitSuccess: "Data Crew Wantaifeng / PT ALINDA PRIMA SENTOSA berhasil dikirim!",
    confirmDeleteTitle: "Konfirmasi Hapus Data Kru 2-Langkah",
    confirmDeleteDesc: "Apakah Anda yakin ingin menghapus data kru ini secara permanen?",
    gasStatusConnected: "✓ Terhubung dengan Google Cloud / Apps Script API (Live Production)",
    gasStatusLocal: "Mode Pratinjau Lokal (Data disimpan di Browser)",

    // Crew Detail & Operational Modal
    detailCandidateData: "Data Lengkap Kandidat",
    detailUploadedDocs: "Berkas Dokumen Terunggah",
    detailOperationalManagement: "Status Operasional & Manajemen Admin",
    detailCrewStatus: "Status Kru (Penempatan / Keberadaan):",
    detailStatusStandby: "🟢 Stand By",
    detailStatusOnBoat: "🔵 On Boat",
    detailStatusSelected: "🟣 Terpilih",
    detailStatusBlacklist: "🔴 Blacklist",
    detailVesselCandidate: "Kandidat Kapal (Plotting Owner):",
    detailVesselAssigned: "Nama Kapal Aktif / Penempatan:",
    detailFlightDate: "Tanggal Terbang (Sign On):",
    detailFinishDate: "Tanggal Finish (Sign Off):",
    detailHistory: "Riwayat Status (History Record):",
    detailHistoryPlaceholder: "-- Pilih Riwayat Status --",
    detailHistoryFinish: "Finish (Selesai Kontrak)",
    detailHistoryBroken: "Broken (Putus Kontrak / Retur)",
    detailHistoryBlacklist: "Blacklist (Bermasalah / Cekal)",
    detailAdminNotes: "Catatan Khusus Admin:",
    detailAdminNotesPlaceholder: "Catatan riwayat performa, perilaku, medis...",
    detailPrintCv: "Cetak CV",
    detailSaveStatus: "Simpan Status",
    catalogSearchPlaceholder: "Cari nama, skill, paspor..."
  },

  zh: {
    appTitle: "延绳钓船员数据与目录系统",
    appSubtitle: "万泰丰国际有限公司 - 印尼 PT ALINDA PRIMA SENTOSA",
    langID: "Bahasa Indonesia",
    langZH: "中文 (Mandarin)",

    // User Roles
    roleLabel: "访问权限角色:",
    roleAdmin: "船员中介管理员 (Admin)",
    roleOwner: "船东/船长 (目录与预订)",
    roleCandidate: "新船员 (登记表单)",

    // Tabs
    tabForm: "新船员登记表",
    tabCatalog: "船员目录 (船东专区)",
    tabDirectory: "船员名册数据库 (管理员)",
    tabGoogleSetup: "谷歌云 API 连接",
    
    // Step Titles
    step1Title: "1. 个人信息与岗位",
    step1Desc: "个人基本资料、职务及详细地址",
    step2Title: "2. 船员资格与航海经验",
    step2Desc: "延绳钓经验、过往船只与通用技能",
    step3Title: "3. 证件与证书信息",
    step3Desc: "护照、水手簿及相关证明文件状态",
    step4Title: "4. 上传证件照片",
    step4Desc: "上传文件照片（每类必填证件至少1张照片）",
    step5Title: "5. 预览与提交",
    step5Desc: "核对数据并发送至系统",

    // Section 1 Personal & Position
    fullName: "船员英文全名 (Full Name)",
    chineseName: "中文姓名 (Chinese Name)",
    heightCm: "身高（厘米）",
    heightCmPlaceholder: "例如：170",
    weightKg: "体重（公斤）",
    weightKgPlaceholder: "例如：65",
    rankPosition: "延绳钓职务/岗位 (Position)",
    selectRank: "-- 请选择职务 --",
    gender: "性别 (Gender)",
    male: "男 (Male)",
    female: "女 (Female)",
    pob: "出生地点 (POB)",
    dob: "出生日期 (DOB)",
    religion: "宗教 (Religion)",
    maritalStatus: "婚姻状况 (Marital Status)",
    single: "未婚 (Single)",
    married: "已婚 (Married)",
    divorced: "离异 (Divorced)",
    bloodType: "血型 (Blood Type)",
    shirtSize: "工作服尺寸 (Shirt Size)",
    shoeSize: "劳保鞋码 (Shoe Size)",

    // Address
    streetAddress: "街道/门牌号 (Street Address)",
    rtRw: "门牌 / RT / RW",
    village: "村 / 社区 (Kelurahan / Village)",
    district: "乡镇 / 街道 (Kecamatan / District)",
    city: "城市 / 县 (City / Regency)",
    province: "省份 / 州 (Province)",
    phoneNo: "有效手机号码 / WhatsApp",

    // Family Contacts
    familyNotice: "为确保数据完整性并应对紧急情况，至少需要填写2名船员家属的信息 (Data Keluarga Crew Minimal 2 Harus Diisi)",
    family1Title: "家庭联系人 1 (Kontak Keluarga 1) *",
    family2Title: "家庭联系人 2 (Kontak Keluarga 2) *",
    famName: "家属全名 (Full Name)",
    famRelation: "家属关系 (妻子/父母/兄弟姐妹)",
    famPhone: "有效联系电话 / WhatsApp",

    // Section 2 Longline Qualifications & Sailing History
    qualSectionTitle: "船员资格 KUALIFIKASI CREW (仅限延绳钓船员)",
    expLonglineTitle: "延绳钓经验 (Manual, Snap Atas, Snap Bawah)",
    sailingHistoryTitle: "航海经验 PENGALAMAN BERLAYAR",
    vesselName: "舰船名称 (Nama Kapal)",
    vesselTypeLongline: "船舶类型 (Jenis Kapal)",
    vesselOrigin: "船只来源 (Asal Kapal)",
    placementCountry: "工作地点 (Negara Penempatan)",
    skillGeneralTitle: "通用技能 SKILL UMUM",

    // Section 3 Documents Checklist
    docChecklistTitle: "证件与证书清单 (Documents Checklist)",
    passportNo: "护照号码 (No. Paspor)",
    passportExpiry: "护照有效期 (Expired Paspor)",
    cdcNo: "海员证号码 (No. Seaman Book)",
    cdcExpiry: "海员证有效期 (Seaman Book Expired)",
    bstExpiry: "BST证书有效期 (Sertifikat BST Expired)",
    kkStatus: "户口簿 (Kartu Keluarga)",
    akteStatus: "出生证明 (Akte Kelahiran)",
    ijazahLevel: "毕业证书 (Ijazah Sekolah)",
    medicalStatus: "体检报告 (Surat Medical MCU)",
    waliStatus: "家属同意书 (Surat Ijin Wali)",
    skckStatus: "无犯罪证明 (SKCK)",

    // Document Uploads
    uploadNotice: "请上传清晰的证件照片/扫描件。每类必填证件至少需上传1张照片。",
    docPassport: "护照照片/扫描件 Passport (护照)",
    docKtp: "身份证照片 KTP (身份证)",
    docCdc: "海员证照片 Seaman Book (海员证)",
    docMedical: "体检报告 Surat MCU (体检报告)",
    docCert: "培训证书/BST Certificate",
    docPhoto: "免冠证件照/全身照 Full Body Photo",
    docOptionalNotice: "(可选附件 / Optional Upload)",
    minRequirement: "至少需上传1张",

    // Actions & Buttons
    submitBtn: "提交船员数据 (Submit to Sheets & Drive)",
    saveDraftBtn: "保存草稿",
    clearDraftBtn: "清除草稿",
    prevBtn: "上一步",
    nextBtn: "下一步",
    cameraBtn: "拍摄照片",
    dropzoneHint: "将文件拖放到此处，或点击选择文件",

    // Catalogue & Booking
    catalogTitle: "延绳钓远洋渔船船员选拔目录",
    catalogDesc: "为台湾及中国远洋延绳钓渔船筛选优质印尼船员",
    searchPlaceholder: "搜索姓名、技能、船名...",
    filterRank: "所有职务",
    filterQual: "所有延绳钓经验",
    filterVessel: "所有船舶类型",
    addToBasket: "加入选船篮",
    inBasket: "已在选船篮中",
    basketTitle: "预订船员清单 (Selection Basket)",
    basketCount: "已选船员",
    checkoutBooking: "提交预订请求",
    ownerNameLabel: "船东姓名 / 船公司名称",
    ownerContactLabel: "船东联系电话 / 微信 / Email",
    bookingNotesLabel: "备注说明 / 船只规格要求",
    sendBookingBtn: "发送预订请求给印尼中介",
    bookingSuccessAlert: "船员预订请求已成功发送至中介！",

    // Admin Directory & One-Time Access Link
    adminTitle: "船员名册与文件管理 (Admin)",
    totalCrewCount: "已登记船员总数",
    colCode: "船员编号",
    colName: "船员姓名",
    colRank: "职务",
    colQual: "延绳钓资格",
    colContact: "联系电话",
    colAddress: "详细地址",
    colDocs: "证件有效期状态",
    colStatus: "审核状态",
    colAction: "操作",
    exportCSV: "导出完整 CSV",
    exportZIP: "打包下载证件照 ZIP",
    generateOneTimeLink: "生成一次性访问链接 (One-Time Link)",
    editCrew: "编辑资料",
    deleteCrew: "删除船员",
    printCV: "打印船员履历表 (CV)",

    // One Time Link Modal
    otlModalTitle: "生成船东专属一次性访问链接",
    otlDesc: "生成带有时效性的安全链接，供船东查看完整的解密船员资料。",
    targetOwnerLabel: "目标船东/船公司名称",
    expiryDurationLabel: "链接有效时长",
    genLinkBtn: "立即生成链接",
    copiedLinkAlert: "一次性访问链接已生成并复制到剪贴板！",

    // Alerts & Confirmations
    alertValidationErr: "请填写所有必填项 (包括至少2位家属联系人) 并确保上传必要的证件照片！",
    alertSubmitSuccess: "船员数据已成功提交至系统！",
    confirmDeleteTitle: "确认删除船员数据 (两步确认)",
    confirmDeleteDesc: "您确定要永久删除此船员的数据吗？",
    gasStatusConnected: "✓ 已连接谷歌云 Google Cloud / Apps Script API (生产环境)",
    gasStatusLocal: "本地预览模式 (数据保存在浏览器中)",

    // Crew Detail & Operational Modal
    detailCandidateData: "船员完整资料",
    detailUploadedDocs: "已上传证件",
    detailOperationalManagement: "运营状态与管理员管理",
    detailCrewStatus: "船员状态（派遣 / 所在位置）：",
    detailStatusStandby: "🟢 待命",
    detailStatusOnBoat: "🔵 在船",
    detailStatusSelected: "🟣 已选中",
    detailStatusBlacklist: "🔴 黑名单",
    detailVesselCandidate: "候选船舶（船东安排）：",
    detailVesselAssigned: "当前派遣船舶：",
    detailFlightDate: "出发日期（Sign On）：",
    detailFinishDate: "结束日期（Sign Off）：",
    detailHistory: "状态记录：",
    detailHistoryPlaceholder: "-- 请选择状态记录 --",
    detailHistoryFinish: "完成（合同结束）",
    detailHistoryBroken: "中断（退回 / 解约）",
    detailHistoryBlacklist: "黑名单（问题 / 禁止派遣）",
    detailAdminNotes: "管理员特别备注：",
    detailAdminNotesPlaceholder: "绩效、行为、医疗等历史备注...",
    detailPrintCv: "打印履历表",
    detailSaveStatus: "保存状态",
    catalogSearchPlaceholder: "搜索姓名、技能或护照号码..."
  }
};

// Longline Specific Rank Positions (Khusus Kapal Longline) - Includes SELAM / TUKANG SELAM (潜水员)
const rankOptions = [
  { id: "deckhand", nameId: "DECKHAND", nameZh: "普通水手 / DECKHAND" },
  { id: "operator_holer", nameId: "OPERATOR HOLER", nameZh: "起绳机操作员 / OPERATOR HOLER" },
  { id: "koki", nameId: "KOKI", nameZh: "厨师 / KOKI (廚師)" },
  { id: "mandor", nameId: "MANDOR", nameZh: "水手长/大副 / MANDOR" },
  { id: "engine", nameId: "ENGINE", nameZh: "轮机员/机工 / ENGINE" },
  { id: "diver", nameId: "SELAM / TUKANG SELAM", nameZh: "潜水员 / DIVER (SELAM)" }
];

// Pengalaman Longline Qualifications (Kualifikasi Crew Longline)
const longlineQualifications = [
  { id: "manual_taiwan", nameId: "MANUAL 小筒下口 TAIWAN 小筒下口", nameZh: "MANUAL 小筒下口 TAIWAN 小筒下口" },
  { id: "manual_lokal", nameId: "MANUAL LOKAL 小筒下口", nameZh: "MANUAL LOKAL 小筒下口" },
  { id: "snap_bawah_atas", nameId: "SNAP BAWAH DAN ATAS 导轮入口，车筒下口", nameZh: "SNAP BAWAH DAN ATAS 导轮入口，车筒下口" },
  { id: "snap_atas", nameId: "SNAP ATAS 车筒下口", nameZh: "SNAP ATAS 车筒下口" },
  { id: "manual_snap_atas", nameId: "MANUAL DAN SNAP ATAS 小筒下口，车筒下口", nameZh: "MANUAL DAN SNAP ATAS 小筒下口，车筒下口" },
  { id: "manual_snap_bawah", nameId: "MANUAL DAN SNAP BAWAH 小筒下口，导轮入口", nameZh: "MANUAL DAN SNAP BAWAH 小筒下口，导轮入口" },
  { id: "snap_bawah", nameId: "SNAP BAWAH 导轮入口", nameZh: "SNAP BAWAH 导轮入口" },
  { id: "non_exp", nameId: "Non Pengalaman / 无经验", nameZh: "Non Pengalaman / 无经验" }
];

// Longline Vessel Types (Jenis Kapal)
const vesselTypeLonglineOptions = [
  { id: "vessel_lokal", nameId: "KAPAL LOKAL 印尼本地船", nameZh: "KAPAL LOKAL 印尼本地船" },
  { id: "ct2_3_taiwan", nameId: "CT2-3 本地 TAIWAN", nameZh: "CT2-3 本地 TAIWAN" },
  { id: "ct3_small", nameId: "CT3 小筒下口", nameZh: "CT3 小筒下口" },
  { id: "ct4_manual", nameId: "CT4 MANUAL 小筒下口", nameZh: "CT4 MANUAL 小筒下口" },
  { id: "ct4_snap_atas", nameId: "CT4 SNAP ATAS 车筒下口", nameZh: "CT4 SNAP ATAS 车筒下口" },
  { id: "ct5_snap_atas", nameId: "CT5 SNAP ATAS 车筒下口", nameZh: "CT5 SNAP ATAS 车筒下口" },
  { id: "ct5_snap_bawah", nameId: "CT5 SNAP BAWAH 导轮入口", nameZh: "CT5 SNAP BAWAH 导轮入口" },
  { id: "ct_6_7", nameId: "CT-6/7 导轮入口", nameZh: "CT-6/7 导轮入口" }
];

// Asal Kapal (Origin)
const vesselOriginOptions = [
  { id: "taiwan", nameId: "Taiwan 台湾", nameZh: "Taiwan 台湾" },
  { id: "china", nameId: "China 中国", nameZh: "China 中国" }
];

// Negara Penempatan (Placement Country)
const placementCountryOptions = [
  { id: "mauritius", nameId: "Mauritius 毛里求斯", nameZh: "Mauritius 毛里求斯" },
  { id: "taiwan", nameId: "Taiwan 台湾", nameZh: "Taiwan 台湾" },
  { id: "philippines", nameId: "Filiphina 菲律宾", nameZh: "Filiphina 菲律宾" },
  { id: "thailand", nameId: "Thailand 泰国", nameZh: "Thailand 泰国" },
  { id: "srilanka", nameId: "Srilanka 斯里兰卡", nameZh: "Srilanka 斯里兰卡" },
  { id: "capetown", nameId: "Capetown 开普敦", nameZh: "Capetown 开普敦" },
  { id: "solomon", nameId: "Solomon 所罗门", nameZh: "Solomon 所罗门" },
  { id: "fiji", nameId: "Fiji 斐济", nameZh: "Fiji 斐济" },
  { id: "samoa", nameId: "Samoa 萨摩亚", nameZh: "Samoa 萨摩亚" }
];

// Skill Umum Checkboxes (通用技能)
const skillGeneralOptions = [
  { id: "gulung_yoka", nameId: "Gulung Yoka (手工捲繩)", nameZh: "手工捲繩 Gulung Yoka" },
  { id: "holler", nameId: "Holler (辊仔車)", nameZh: "辊仔車 Holler" },
  { id: "buang_pancing", nameId: "Buang Pancing (掛朗)", nameZh: "掛朗 Buang Pancing" },
  { id: "proses_ikan", nameId: "Proses Ikan (殺魚)", nameZh: "殺魚 Proses Ikan" },
  { id: "susun_ikan", nameId: "Susun Ikan (排鱼)", nameZh: "排鱼 Susun Ikan" },
  { id: "tukang_es", nameId: "Tukang Es (冰工)", nameZh: "冰工 Tukang Es" },
  { id: "engine", nameId: "Engine (大车)", nameZh: "大车 Engine" },
  { id: "mandor", nameId: "Mandor (大副)", nameZh: "大副 Mandor" },
  { id: "kemudi_holing", nameId: "Kemudi Holing (开船)", nameZh: "开船 Kemudi Holing" },
  { id: "selam", nameId: "Selam / Tukang Selam (潜水)", nameZh: "潜水 Selam" },
  { id: "koki", nameId: "Koki (廚師)", nameZh: "廚師 Koki" }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    i18n,
    rankOptions,
    longlineQualifications,
    vesselTypeLonglineOptions,
    vesselOriginOptions,
    placementCountryOptions,
    skillGeneralOptions
  };
}
