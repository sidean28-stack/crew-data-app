/**
 * ==============================================================================
 * GOOGLE APPS SCRIPT BACKEND FOR CREW MANAGEMENT SYSTEM (LONGLINE CREW)
 * Wantaifeng International Co Ltd - PT ALINDA PRIMA SENTOSA
 * Integrated with Google Sheets, Google Drive, AppSheet, and Google Cloud
 * ==============================================================================
 */

var CREW_SPREADSHEET_ID = "18z_NRHfbZDaUrfWmF7hCZiSdzLNNlTcEwYmNvL-i4nY";

function getCrewSpreadsheet_() {
  return SpreadsheetApp.getActiveSpreadsheet() || SpreadsheetApp.openById(CREW_SPREADSHEET_ID);
}

function authorizeProduction() {
  var sheet = getCrewSheet_(getCrewSpreadsheet_());
  return { spreadsheetId: CREW_SPREADSHEET_ID, sheetName: sheet.getName() };
}

function migrateProductionSchema() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) throw new Error("Server sedang sibuk. Silakan coba lagi.");
  try {
    return migrateCrewSchema_(getCrewSheet_(getCrewSpreadsheet_()));
  } finally {
    lock.releaseLock();
  }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) {
    return jsonResponse_({ success: false, message: "Server sedang sibuk. Silakan coba lagi." });
  }
  
  try {
    var rawData = e.postData.contents;
    var data = JSON.parse(rawData);
    var action = data.action || "submit_crew";

  // ---- Ping test endpoint ----
  if (action === 'ping') {
    return ContentService.createTextOutput(JSON.stringify({status:'success',message:'Endpoint alive'})).setMimeType(ContentService.MimeType.JSON);
  }

    var ss = getCrewSpreadsheet_();

    // 1. ACTION: BOOKING REQUEST FROM SHIP OWNER
    if (action === "booking_request") {
      var bookingSheet = ss.getSheetByName("Pemesanan Kru (Booking)") || ss.insertSheet("Pemesanan Kru (Booking)");
      if (bookingSheet.getLastRow() === 0) {
        bookingSheet.appendRow(["Timestamp", "Nama Owner / Perusahaan", "Kontak Owner", "Catatan Specs", "Daftar Kru Dipilih"]);
        bookingSheet.getRange(1, 1, 1, 5).setFontWeight("bold").setBackground("#0284c7").setFontColor("#ffffff");
      }

      var selectedList = Array.isArray(data.selectedCrew) 
        ? data.selectedCrew.map(function(c){ return c.id + " - " + c.name + " (" + c.rank + ")"; }).join("\n") 
        : "";

      bookingSheet.appendRow([
        new Date(),
        data.ownerName || "",
        data.ownerContact || "",
        data.notes || "",
        selectedList
      ]);

      return ContentService.createTextOutput(JSON.stringify({ success: true, message: "Booking order registered successfully!" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    if (action === "edit_crew") {
      // return editCrew(data);
    }

    // ACTION: OWNER SCORING & SELECTION (submit_review)
    if (action === "submit_review") {
      var reviewSheet = ss.getSheetByName("Review Owner") || ss.insertSheet("Review Owner");
      if (reviewSheet.getLastRow() === 0) {
        reviewSheet.appendRow(["Timestamp", "ID Submisi", "Token OTL", "Status", "Comm", "Skill", "Exp", "Attitude", "Leadership", "Notes", "Nama Owner / Perusahaan"]);
        reviewSheet.getRange(1, 1, 1, 11).setFontWeight("bold").setBackground("#8b5cf6").setFontColor("#ffffff");
      }
      if (!reviewSheet.getRange(1, 11).getValue()) reviewSheet.getRange(1, 11).setValue("Nama Owner / Perusahaan");
      var review = data.review || {};
      reviewSheet.appendRow([
        new Date(),
        data.submissionId || "",
        data.token || "",
        review.status || "",
        review.commScore || "",
        review.skillScore || "",
        review.expScore || "",
        review.attitudeScore || "",
        review.leadershipScore || "",
        review.notes || "",
        data.ownerName || ""
      ]);

      return ContentService.createTextOutput(JSON.stringify({ success: true, message: "Review saved" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (action === "delete_crew") {
      return deleteCrew_(ss, data);
    }

    if (action === "update_crew_status") {
      return updateCrewStatus_(ss, data);
    }

    if (action === "migrate_crew_schema") {
      return jsonResponse_({ success: true, migration: migrateCrewSchema_(getCrewSheet_(ss)) });
    }

    if (action !== "submit_crew" && action !== "update_crew") {
      return jsonResponse_({ success: false, message: "Unknown action ignored: " + action });
    }


    // 2. ACTION: CREW REGISTRATION SUBMISSION (Form Wizard)
    var sheet = getCrewSheet_(ss);
    migrateCrewSchema_(sheet);
    
    // Ensure Header Row Exists (AppSheet Compatible)
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(getCrewHeaders_());
      sheet.getRange(1, 1, 1, getCrewHeaders_().length).setFontWeight("bold").setBackground("#0f172a").setFontColor("#ffffff");
    }
    
    // Format Combined Address
    var combinedAddress = properCase_(data.streetAddress) +
      (data.rtRw ? " RT/RW: " + data.rtRw : "") +
      (data.village ? " Kel/Desa: " + properCase_(data.village) : "") +
      (data.district ? " Kec: " + properCase_(data.district) : "") +
      (data.city ? " Kab/Kota: " + properCase_(data.city) : "") +
      (data.province ? " Prov: " + properCase_(data.province) : "");

    // Cek apakah update
    var isUpdate = (action === "update_crew");
    var updateRowIndex = -1;
    var existingFolderUrl = "";

    if (isUpdate) {
      var dataRange = sheet.getDataRange();
      var values = dataRange.getValues();
      for (var i = 1; i < values.length; i++) {
        if (String(values[i][1]) === String(data.submissionId)) {
          updateRowIndex = i + 1;
          existingFolderUrl = values[i][31] || "";
          break;
        }
      }
      if (updateRowIndex === -1) {
        return jsonResponse_({ success: false, message: "Crew yang akan diupdate tidak ditemukan." });
      }
    }

    // Save Uploaded Files to Drive
    var docUrls = { passport: [], ktp: [], cdc: [], medical: [], cert: [], photo: [] };
    var crewFolderId = "";
    var crewFolderUrl = existingFolderUrl || "";

    if (data.documents) {
      for (var docType in data.documents) {
        var files = data.documents[docType];
        if (Array.isArray(files)) {
          files.forEach(function(fileObj, index) {
            if (isNewBase64Upload_(fileObj)) {
              if (!crewFolderId) {
                crewFolderId = getOrCreateCrewUploadFolder_(data.submissionId, data.fullName);
                crewFolderUrl = "https://drive.google.com/drive/folders/" + crewFolderId;
              }
              var fileUrl = saveBase64FileToDrive(crewFolderId, fileObj, docType + "_" + (index + 1) + "_" + Date.now());
              if (fileUrl && docUrls[docType]) {
                docUrls[docType].push(fileUrl);
              }
            }
          });
        }
      }
    }

    var rowValues = [
      new Date(),
      data.submissionId || Date.now(),
      properCase_(data.fullName),
      data.chineseName || "",
      properCase_(data.rankPosition),
      asPhoneText_(data.phoneNo),
      combinedAddress,
      properCase_(data.fam1Name) + " (" + properCase_(data.fam1Relation) + ")",
      asPhoneText_(data.fam1Phone),
      properCase_(data.fam2Name) + " (" + properCase_(data.fam2Relation) + ")",
      asPhoneText_(data.fam2Phone),
      properCase_(data.expLongline),
      properCase_(data.vesselName),
      properCase_(data.vesselTypeLongline),
      properCase_(data.vesselOrigin),
      properCase_(data.placementCountry),
      properCase_(Array.isArray(data.skillGeneral) ? data.skillGeneral.join(", ") : data.skillGeneral),
      data.passportNo || "",
      data.passportExpiry || "",
      data.cdcNo || "",
      data.cdcExpiry || "",
      data.bstExpiry || "",
      data.kkStatus || "",
      data.akteStatus || "",
      data.ijazahLevel || "",
      data.medicalStatus || "",
      data.waliStatus || "",
      data.skckStatus || "",
      data.shirtSize || "",
      data.shoeSize || "",
      (data.dob || "") + " / " + (data.gender || "") + " / " + (data.religion || ""),
      crewFolderUrl,
      docUrls.passport.join(" \n"),
      docUrls.ktp.join(" \n"),
      docUrls.cdc.join(" \n"),
      docUrls.medical.join(" \n"),
      docUrls.cert.join(" \n"),
      docUrls.photo.join(" \n"),
      data.heightCm || "",
      data.weightKg || "",
      data.operationalStatus || data.status || "STAND_BY",
      properCase_(data.vesselCandidate),
      properCase_(data.vesselAssigned),
      data.flightDate || "",
      data.finishDate || "",
      properCase_(data.historyStatus),
      data.adminNotes || "",
      properCase_(data.pob),
      data.dob || "",
      properCase_(data.gender),
      properCase_(data.religion),
      properCase_(data.maritalStatus),
      data.bloodType || "",
      properCase_(data.streetAddress),
      data.rtRw || "",
      properCase_(data.village),
      properCase_(data.district),
      properCase_(data.city),
      properCase_(data.province),
      properCase_(data.fam1Name),
      properCase_(data.fam1Relation),
      properCase_(data.fam2Name),
      properCase_(data.fam2Relation),
      data.submittedAt || ""
    ];

    if (isUpdate && updateRowIndex !== -1) {
      var maxCol = sheet.getMaxColumns();
      if (maxCol < 64) {
        sheet.insertColumnsAfter(maxCol, 64 - maxCol);
      }
      
      var oldValues = sheet.getRange(updateRowIndex, 1, 1, 64).getValues()[0];
      for (var c = 32; c <= 37; c++) {
        if (rowValues[c] === "" && oldValues[c] !== "") {
          rowValues[c] = oldValues[c];
        } else if (rowValues[c] !== "" && oldValues[c] !== "") {
          rowValues[c] = oldValues[c] + " \n" + rowValues[c];
        }
      }
      var preservedFields = [
        [38, "heightCm"],
        [39, "weightKg"],
        [40, "operationalStatus"],
        [41, "vesselCandidate"],
        [42, "vesselAssigned"],
        [43, "flightDate"],
        [44, "finishDate"],
        [45, "historyStatus"],
        [46, "adminNotes"],
        [47, "pob"], [48, "dob"], [49, "gender"], [50, "religion"],
        [51, "maritalStatus"], [52, "bloodType"], [53, "streetAddress"],
        [54, "rtRw"], [55, "village"], [56, "district"], [57, "city"],
        [58, "province"], [59, "fam1Name"], [60, "fam1Relation"],
        [61, "fam2Name"], [62, "fam2Relation"], [63, "submittedAt"]
      ];
      preservedFields.forEach(function(field) {
        if (!Object.prototype.hasOwnProperty.call(data, field[1])) {
          rowValues[field[0]] = oldValues[field[0]];
        }
      });
      rowValues[0] = oldValues[0];
      sheet.getRange(updateRowIndex, 1, 1, 64).setValues([rowValues]);
    } else {
      sheet.appendRow(rowValues);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        message: "Data crew Longline Wantaifeng / PT ALINDA berhasil " + (isUpdate ? "diupdate!" : "disimpan!"),
        folderUrl: crewFolderUrl,
        submissionId: data.submissionId,
        total: sheet.getLastRow() - 1,
        lastSync: new Date().toISOString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function jsonResponse_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function getCrewHeaders_() {
  return [
    "Timestamp", "ID Submisi", "Nama Lengkap", "Nama Mandarin (中文名)",
    "Jabatan / Posisi", "No. HP / WA", "Alamat Lengkap (Combined)",
    "Kontak Keluarga 1", "Telp Keluarga 1", "Kontak Keluarga 2", "Telp Keluarga 2",
    "Pengalaman Longline", "Nama Kapal", "Jenis Kapal", "Asal Kapal", "Negara Penempatan",
    "Skill Umum", "No. Paspor", "Expired Paspor", "No. Seaman Book", "Expired Seaman Book",
    "Expired BST", "Status KK", "Status Akte", "Status Ijazah", "Status MCU",
    "Status Surat Wali", "Status SKCK", "Ukuran Baju", "Ukuran Sepatu",
    "Tgl Lahir / Gender / Agama", "Folder Google Drive", "URL Paspor (Drive)",
    "URL KTP (Drive)", "URL Seaman Book (Drive)", "URL MCU (Drive)",
    "URL Certificate (Drive)", "URL Foto Crew (Drive)", "Tinggi Badan (cm)",
    "Berat Badan (kg)", "Status Operasional", "Kandidat Kapal",
    "Nama Kapal Penempatan", "Tgl Terbang", "Tgl Finish", "Riwayat Status", "Catatan Admin",
    "Tempat Lahir", "Tanggal Lahir", "Jenis Kelamin", "Agama", "Status Perkawinan",
    "Golongan Darah", "Alamat Jalan", "RT/RW", "Kelurahan / Desa", "Kecamatan",
    "Kabupaten / Kota", "Provinsi", "Nama Keluarga 1", "Hubungan Keluarga 1",
    "Nama Keluarga 2", "Hubungan Keluarga 2", "Waktu Submit"
  ];
}

function getCrewSheet_(spreadsheet) {
  var namedSheet = spreadsheet.getSheetByName("Data Crew Longline");
  if (namedSheet) return namedSheet;

  var sheets = spreadsheet.getSheets();
  for (var i = 0; i < sheets.length; i++) {
    if (sheets[i].getLastRow() < 1 || sheets[i].getMaxColumns() < 3) continue;
    var headers = sheets[i].getRange(1, 1, 1, 3).getDisplayValues()[0];
    if (String(headers[1] || "").trim() === "ID Submisi" &&
        String(headers[2] || "").trim() === "Nama Lengkap") {
      return sheets[i];
    }
  }

  throw new Error("Sheet data crew tidak ditemukan atau header tidak valid.");
}

function asPhoneText_(value) {
  var v = String(value || "").trim();
  return v ? "'" + v : "";
  }

function normalizeOperationalStatus_(value) {
  var status = String(value || "").trim().toUpperCase();
  return status === "WAITING" ? "STAND_BY" : status;
}

function properCase_(value) {
  return String(value || "").trim().toLowerCase().replace(/(^|[\s\/|,(\-])([a-z])/g, function(match, separator, letter) {
    return separator + letter.toUpperCase();
  });
}

function isOperationalStatus_(value) {
  return ["WAITING", "STAND_BY", "ON_BOAT", "SELECTED", "BLACKLIST"]
    .indexOf(String(value || "").trim().toUpperCase()) !== -1;
}

function migrateCrewSchema_(sheet) {
  var headers = getCrewHeaders_();
  var requiredColumns = headers.length;
  if (sheet.getMaxColumns() < requiredColumns) {
    sheet.insertColumnsAfter(sheet.getMaxColumns(), requiredColumns - sheet.getMaxColumns());
  }

  var currentHeaders = sheet.getRange(1, 39, 1, 9).getDisplayValues()[0];
  var alreadyCanonical = String(currentHeaders[0] || "").trim() === headers[38] &&
    String(currentHeaders[1] || "").trim() === headers[39] &&
    String(currentHeaders[2] || "").trim() === headers[40];

  if (alreadyCanonical) {
    var extendedHeaders = headers.slice(47);
    var currentExtendedHeaders = sheet.getRange(1, 48, 1, extendedHeaders.length).getDisplayValues()[0];
    var needsExtension = extendedHeaders.some(function(header, index) {
      return String(currentExtendedHeaders[index] || "").trim() !== header;
    });
    if (needsExtension) {
      sheet.getRange(1, 48, 1, extendedHeaders.length).setValues([extendedHeaders]);
      sheet.getRange(1, 48, 1, extendedHeaders.length)
        .setFontWeight("bold").setBackground("#0f172a").setFontColor("#ffffff");
    }
    return { migrated: needsExtension, extendedFields: needsExtension, shiftedStatusRows: 0, retainedMeasurementRows: 0 };
  }

  var lastRow = sheet.getLastRow();
  var shiftedStatusRows = 0;
  var retainedMeasurementRows = 0;
  if (lastRow > 1) {
    var identities = sheet.getRange(2, 2, lastRow - 1, 2).getDisplayValues();
    var legacyValues = sheet.getRange(2, 39, lastRow - 1, 9).getValues();

    for (var i = 0; i < legacyValues.length; i++) {
      if (!String(identities[i][0] || "").trim() && !String(identities[i][1] || "").trim()) continue;

      var row = legacyValues[i];
      if (isOperationalStatus_(row[2])) {
        row[2] = normalizeOperationalStatus_(row[2]);
        continue;
      }

      if (isOperationalStatus_(row[0])) {
        legacyValues[i] = [
          "", "", normalizeOperationalStatus_(row[0]), row[1], row[2], row[3], row[4], row[5], row[6]
        ];
        shiftedStatusRows++;
      } else {
        row[2] = "STAND_BY";
        retainedMeasurementRows++;
      }
    }

    sheet.getRange(2, 39, lastRow - 1, 9).setValues(legacyValues);
  }

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length)
    .setFontWeight("bold").setBackground("#0f172a").setFontColor("#ffffff");

  return {
    migrated: true,
    shiftedStatusRows: shiftedStatusRows,
    retainedMeasurementRows: retainedMeasurementRows
  };
}

function findCrewRowById_(sheet, submissionId) {
  var searchId = String(submissionId || "").trim();
  if (!searchId || sheet.getLastRow() < 2) return -1;

  var ids = sheet.getRange(2, 2, sheet.getLastRow() - 1, 1).getDisplayValues();
  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0] || "").trim() === searchId) return i + 2;
  }
  return -1;
}

function deleteCrew_(spreadsheet, data) {
  var sheet = getCrewSheet_(spreadsheet);
  var searchId = String(data.submissionId || "").trim();
  if (!searchId || sheet.getLastRow() < 2) {
    return jsonResponse_({ success: false, message: "Crew tidak ditemukan." });
  }

  var ids = sheet.getRange(2, 2, sheet.getLastRow() - 1, 1).getDisplayValues();
  var deletedCount = 0;
  for (var i = ids.length - 1; i >= 0; i--) {
    if (String(ids[i][0] || "").trim() === searchId) {
      sheet.deleteRow(i + 2);
      deletedCount++;
    }
  }

  if (deletedCount === 0) {
    return jsonResponse_({ success: false, message: "Crew tidak ditemukan." });
  }
  return jsonResponse_({ success: true, deletedId: searchId, deletedCount: deletedCount });
}

function updateCrewStatus_(spreadsheet, data) {
  var sheet = getCrewSheet_(spreadsheet);
  migrateCrewSchema_(sheet);
  var rowIndex = findCrewRowById_(sheet, data.submissionId);
  if (rowIndex === -1) {
    return jsonResponse_({ success: false, message: "Crew tidak ditemukan." });
  }

  var allowedStatuses = ["STAND_BY", "ON_BOAT", "SELECTED", "BLACKLIST"];
  var operationalStatus = String(data.operationalStatus || "STAND_BY").trim();
  if (allowedStatuses.indexOf(operationalStatus) === -1) {
    return jsonResponse_({ success: false, message: "Status operasional tidak valid." });
  }

  sheet.getRange(rowIndex, 41, 1, 7).setValues([[
    operationalStatus,
    properCase_(data.vesselCandidate),
    properCase_(data.vesselAssigned),
    data.flightDate || "",
    data.finishDate || "",
    properCase_(data.historyStatus),
    String(data.adminNotes || "").trim()
  ]]);

  return jsonResponse_({ success: true, submissionId: String(data.submissionId) });
}

function isNewBase64Upload_(fileObj) {
  if (!fileObj || !fileObj.base64) return false;
  var value = String(fileObj.base64).trim();
  return value.length > 100 && !/^https?:\/\//i.test(value);
}

function setDriveAnyoneView_(fileId) {
  try {
    Drive.Permissions.create({ type: "anyone", role: "reader" }, fileId);
  } catch (shareError) {
    Logger.log("Sharing restriction notice: " + shareError.toString());
  }
}

function createDriveFolder_(name, parentId) {
  var metadata = { name: name, mimeType: "application/vnd.google-apps.folder" };
  if (parentId) metadata.parents = [parentId];
  var folder = Drive.Files.create(metadata, null, { fields: "id" });
  setDriveAnyoneView_(folder.id);
  return folder.id;
}

function getOrCreateCrewUploadFolder_(submissionId, fullName) {
  var properties = PropertiesService.getScriptProperties();
  var rootKey = "CREW_UPLOAD_ROOT_FOLDER_ID";
  var rootFolderId = properties.getProperty(rootKey);

  if (rootFolderId) {
    try {
      var rootFolder = Drive.Files.get(rootFolderId, { fields: "id,trashed" });
      if (rootFolder.trashed) rootFolderId = "";
    } catch (rootError) {
      rootFolderId = "";
    }
  }
  if (!rootFolderId) {
    rootFolderId = createDriveFolder_("Crew_Longline_Uploads_PT_ALINDA", "");
    properties.setProperty(rootKey, rootFolderId);
  }

  var crewKey = "CREW_FOLDER_" + String(submissionId || "unknown").replace(/[^a-zA-Z0-9_-]/g, "_");
  var crewFolderId = properties.getProperty(crewKey);
  if (crewFolderId) {
    try {
      var crewFolder = Drive.Files.get(crewFolderId, { fields: "id,trashed" });
      if (!crewFolder.trashed) return crewFolderId;
    } catch (crewError) {}
  }

  var safeName = String(fullName || "Crew").replace(/[^a-zA-Z0-9]/g, "_");
  crewFolderId = createDriveFolder_(safeName + "_" + (submissionId || Date.now()), rootFolderId);
  properties.setProperty(crewKey, crewFolderId);
  return crewFolderId;
}

function saveBase64FileToDrive(folderId, fileObj, fileTag) {
  try {
    var rawBase64 = fileObj.base64 || "";
    if (rawBase64.indexOf(",") !== -1) {
      rawBase64 = rawBase64.split(",")[1];
    }
    rawBase64 = rawBase64.replace(/\s/g, "");

    var mimeType = fileObj.type || "image/jpeg";
    var fileName = fileTag + "_" + (fileObj.name || "document.jpg");

    var decodedBytes = Utilities.base64Decode(rawBase64);
    var blob = Utilities.newBlob(decodedBytes, mimeType, fileName);

    var driveFile = Drive.Files.create(
      { name: fileName, parents: [folderId] },
      blob,
      { fields: "id,webViewLink" }
    );
    setDriveAnyoneView_(driveFile.id);
    Logger.log("✅ File uploaded: " + fileName + " (ID: " + driveFile.id + ")");
    return driveFile.webViewLink || ("https://drive.google.com/file/d/" + driveFile.id + "/view");
  } catch (e) {
    Logger.log("❌ ERROR uploading file " + fileTag + ": " + e.toString());
    return null;
  }
}

function doGet(e) {
  var action = e.parameter.action;
  
  if (action === "getAllCrew") {
    try {
      var ss = getCrewSpreadsheet_();
      var sheet = getCrewSheet_(ss);
      var dataRange = sheet.getDataRange();
      var values = dataRange.getValues();
      var crewList = [];
      var latestReviews = {};
      var reviewSheet = ss.getSheetByName("Review Owner");
      if (reviewSheet && reviewSheet.getLastRow() > 1) {
        var reviewValues = reviewSheet.getRange(2, 1, reviewSheet.getLastRow() - 1, Math.max(11, reviewSheet.getLastColumn())).getValues();
        reviewValues.forEach(function(reviewRow) {
          var reviewId = String(reviewRow[1] || "").trim();
          if (!reviewId) return;
          latestReviews[reviewId] = {
            status: String(reviewRow[3] || "WAITING"),
            commScore: reviewRow[4] === "" ? 0 : Number(reviewRow[4]),
            skillScore: reviewRow[5] === "" ? 0 : Number(reviewRow[5]),
            expScore: reviewRow[6] === "" ? 0 : Number(reviewRow[6]),
            attitudeScore: reviewRow[7] === "" ? 0 : Number(reviewRow[7]),
            leadershipScore: reviewRow[8] === "" ? 0 : Number(reviewRow[8]),
            notes: String(reviewRow[9] || ""),
            ownerName: String(reviewRow[10] || ""),
            ownerToken: String(reviewRow[2] || ""),
            updatedAt: reviewRow[0] instanceof Date ? reviewRow[0].toISOString() : String(reviewRow[0] || "")
          };
        });
      }
      
      for (var i = 1; i < values.length; i++) {
        var row = values[i];
        var subId = String(row[1] || "").trim();
        var fullName = String(row[2] || "").trim();
        if (!subId && !fullName) continue;
        if (!subId) subId = "CREW-LONG-" + (100 + i);
        
        var parseUrls = function(str) {
          if (!str) return [];
          return String(str).split("\n").map(function(u){ return u.trim(); }).filter(function(u){ return u.length > 0; });
        };
        
        var fam1 = String(row[7] || "").split("(");
        var fam2 = String(row[9] || "").split("(");
        var combinedDob = String(row[30] || "").split("/");
        
        crewList.push({
          submissionId: subId,
          fullName: fullName,
          chineseName: String(row[3] || ""),
          rankPosition: String(row[4] || ""),
          phoneNo: String(row[5] || ""),
          combinedAddress: String(row[6] || ""),
          fam1Name: String(row[59] || (fam1[0] ? fam1[0].trim() : "")),
          fam1Relation: String(row[60] || (fam1[1] ? fam1[1].replace(")","").trim() : "")),
          fam1Phone: String(row[8] || ""),
          fam2Name: String(row[61] || (fam2[0] ? fam2[0].trim() : "")),
          fam2Relation: String(row[62] || (fam2[1] ? fam2[1].replace(")","").trim() : "")),
          fam2Phone: String(row[10] || ""),
          expLongline: String(row[11] || ""),
          vesselName: String(row[12] || ""),
          vesselTypeLongline: String(row[13] || ""),
          vesselOrigin: String(row[14] || ""),
          placementCountry: String(row[15] || ""),
          skillGeneral: String(row[16] || ""),
          passportNo: String(row[17] || ""),
          passportExpiry: String(row[18] || ""),
          cdcNo: String(row[19] || ""),
          cdcExpiry: String(row[20] || ""),
          bstExpiry: String(row[21] || ""),
          kkStatus: String(row[22] || ""),
          akteStatus: String(row[23] || ""),
          ijazahLevel: String(row[24] || ""),
          medicalStatus: String(row[25] || ""),
          waliStatus: String(row[26] || ""),
          skckStatus: String(row[27] || ""),
          shirtSize: String(row[28] || ""),
          shoeSize: String(row[29] || ""),
          pob: String(row[47] || ""),
          dob: String(row[48] || (combinedDob[0] ? combinedDob[0].trim() : "")),
          gender: String(row[49] || (combinedDob[1] ? combinedDob[1].trim() : "")),
          religion: String(row[50] || (combinedDob[2] ? combinedDob[2].trim() : "")),
          maritalStatus: String(row[51] || ""),
          bloodType: String(row[52] || ""),
          streetAddress: String(row[53] || ""),
          rtRw: String(row[54] || ""),
          village: String(row[55] || ""),
          district: String(row[56] || ""),
          city: String(row[57] || ""),
          province: String(row[58] || ""),
          submittedAt: String(row[63] || ""),
          folderUrl: String(row[31] || ""),
          documents: {
            passport: parseUrls(row[32]),
            ktp: parseUrls(row[33]),
            cdc: parseUrls(row[34]),
            medical: parseUrls(row[35]),
            cert: parseUrls(row[36]),
            photo: parseUrls(row[37])
          },
          heightCm: row[38] ? String(row[38]) : "",
          weightKg: row[39] ? String(row[39]) : "",
          operationalStatus: row[40] ? String(row[40]) : "STAND_BY",
          vesselCandidate: row[41] ? String(row[41]) : "",
          vesselAssigned: row[42] ? String(row[42]) : "",
          flightDate: row[43] ? String(row[43]) : "",
          finishDate: row[44] ? String(row[44]) : "",
          historyStatus: row[45] ? String(row[45]) : "",
          adminNotes: row[46] ? String(row[46]) : "",
          status: row[40] ? String(row[40]) : "STAND_BY",
          ownerReview: latestReviews[subId] || null
        });
      }
      
      return ContentService
        .createTextOutput(JSON.stringify({
          success: true,
          total: crewList.length,
          lastSync: new Date().toISOString(),
          crew: crewList
        }))
        .setMimeType(ContentService.MimeType.JSON);
        
    } catch (e) {
      return ContentService
        .createTextOutput(JSON.stringify({
          success: false,
          error: e.toString()
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }

  return ContentService.createTextOutput("Crew Data System Endpoint (PT ALINDA PRIMA SENTOSA) is Active.");
}
