/**
 * ==============================================================================
 * GOOGLE APPS SCRIPT BACKEND FOR CREW MANAGEMENT SYSTEM (LONGLINE CREW)
 * Wantaifeng International Co Ltd - PT ALINDA PRIMA SENTOSA
 * Integrated with Google Sheets, Google Drive, AppSheet, and Google Cloud
 * ==============================================================================
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(30000);
  
  try {
    var rawData = e.postData.contents;
    var data = JSON.parse(rawData);
    var action = data.action || "submit_crew";

  // ---- Ping test endpoint ----
  if (action === 'ping') {
    return ContentService.createTextOutput(JSON.stringify({status:'success',message:'Endpoint alive'})).setMimeType(ContentService.MimeType.JSON);
  }

    var ss = SpreadsheetApp.getActiveSpreadsheet();

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
        reviewSheet.appendRow(["Timestamp", "ID Submisi", "Token OTL", "Status", "Comm", "Skill", "Exp", "Attitude", "Leadership", "Notes"]);
        reviewSheet.getRange(1, 1, 1, 10).setFontWeight("bold").setBackground("#8b5cf6").setFontColor("#ffffff");
      }
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
        review.notes || ""
      ]);

      return ContentService.createTextOutput(JSON.stringify({ success: true, message: "Review saved" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // ACTION: DELETE CREW FROM GOOGLE SHEET
    if (action === "delete_crew") {
      var sheet = ss.getSheetByName("Data Crew Longline") || ss.getActiveSheet();
      var dataRange = sheet.getDataRange();
      var values = dataRange.getValues();
      var searchId = String(data.submissionId || "").trim().toLowerCase();
      var searchName = String(data.fullName || "").trim().toLowerCase();
      var deleted = false;

      for (var i = values.length - 1; i >= 1; i--) {
        var rowId = String(values[i][1] || "").trim().toLowerCase();
        var rowName = String(values[i][2] || "").trim().toLowerCase();

        var isIdMatch = (searchId.length > 0 && (rowId === searchId || rowId.endsWith(searchId) || searchId.endsWith(rowId)));
        var isNameMatch = (searchName.length > 0 && rowName === searchName);

        if (isIdMatch || isNameMatch) {
          sheet.deleteRow(i + 1);
          deleted = true;
        }
      }

      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: deleted ? "Crew data deleted successfully from sheet" : "No matching row found"
      })).setMimeType(ContentService.MimeType.JSON);
    }


    // 2. ACTION: CREW REGISTRATION SUBMISSION (Form Wizard)
    var sheet = ss.getSheetByName("Data Crew Longline") || ss.getActiveSheet();
    
    // Ensure Header Row Exists (AppSheet Compatible)
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Timestamp",
        "ID Submisi",
        "Nama Lengkap",
        "Nama Mandarin (中文名)",
        "Jabatan / Posisi",
        "No. HP / WA",
        "Alamat Lengkap (Combined)",
        "Kontak Keluarga 1",
        "Telp Keluarga 1",
        "Kontak Keluarga 2",
        "Telp Keluarga 2",
        "Pengalaman Longline",
        "Nama Kapal",
        "Jenis Kapal",
        "Asal Kapal",
        "Negara Penempatan",
        "Skill Umum",
        "No. Paspor",
        "Expired Paspor",
        "No. Seaman Book",
        "Expired Seaman Book",
        "Expired BST",
        "Status KK",
        "Status Akte",
        "Status Ijazah",
        "Status MCU",
        "Status Surat Wali",
        "Status SKCK",
        "Ukuran Baju",
        "Ukuran Sepatu",
        "Tgl Lahir / Gender / Agama",
        "Folder Google Drive",
        "URL Paspor (Drive)",
        "URL KTP (Drive)",
        "URL Seaman Book (Drive)",
        "URL MCU (Drive)",
        "URL Certificate (Drive)",
        "URL Foto Crew (Drive)"
      ]);
      sheet.getRange(1, 1, 1, 38).setFontWeight("bold").setBackground("#0f172a").setFontColor("#ffffff");
    }
    
    // Format Combined Address
    var combinedAddress = (data.streetAddress || "") +
      (data.rtRw ? " RT/RW: " + data.rtRw : "") +
      (data.village ? " Kel/Desa: " + data.village : "") +
      (data.district ? " Kec: " + data.district : "") +
      (data.city ? " Kab/Kota: " + data.city : "") +
      (data.province ? " Prov: " + data.province : "");

    // Cek apakah update
    var isUpdate = (action === "update_crew");
    var updateRowIndex = -1;
    var existingFolderUrl = "";

    if (isUpdate) {
      var dataRange = sheet.getDataRange();
      var values = dataRange.getValues();
      var searchId = String(data.submissionId || "").trim().toLowerCase();
      var searchName = String(data.fullName || "").trim().toLowerCase();

      for (var i = 1; i < values.length; i++) {
        var rowId = String(values[i][1] || "").trim().toLowerCase();
        var rowName = String(values[i][2] || "").trim().toLowerCase();

        var isIdMatch = (searchId.length > 0 && (rowId === searchId || rowId.endsWith(searchId) || searchId.endsWith(rowId)));
        var isNameMatch = (searchName.length > 0 && rowName === searchName);

        if (isIdMatch || isNameMatch) {
          updateRowIndex = i + 1;
          existingFolderUrl = values[i][31] || "";
          break;
        }
      }
    }

    // Get or Create Google Drive Folder for Uploads
    var folderName = "Crew_Longline_Uploads_PT_ALINDA";
    var folders = DriveApp.getFoldersByName(folderName);
    var targetFolder = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);
    
    // Sub-folder per Crew
    var safeName = (data.fullName || "Crew").replace(/[^a-zA-Z0-9]/g, "_");
    var crewFolderName = safeName + "_" + (data.submissionId || Date.now());
    var crewFolder;
    
    var crewFolders = targetFolder.getFoldersByName(crewFolderName);
    if (crewFolders.hasNext()) {
      crewFolder = crewFolders.next();
    } else {
      crewFolder = targetFolder.createFolder(crewFolderName);
      try {
        crewFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      } catch(shareErr) {
        Logger.log("Sharing restriction notice: " + shareErr.toString());
      }
    }
    
    // Save Uploaded Files to Drive
    // If update, we might re-upload files. It's safer to re-upload if base64 is present.
    var docUrls = { passport: [], ktp: [], cdc: [], medical: [], cert: [], photo: [] };
    
    if (data.documents) {
      for (var docType in data.documents) {
        var files = data.documents[docType];
        if (Array.isArray(files)) {
          files.forEach(function(fileObj, index) {
            if (fileObj && fileObj.base64 && fileObj.base64.length > 100) {
              var fileUrl = saveBase64FileToDrive(crewFolder, fileObj, docType + "_" + (index + 1) + "_" + Date.now());
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
      data.fullName || "",
      data.chineseName || "",
      data.rankPosition || "",
      data.phoneNo || "",
      combinedAddress,
      (data.fam1Name || "") + " (" + (data.fam1Relation || "") + ")",
      data.fam1Phone || "",
      (data.fam2Name || "") + " (" + (data.fam2Relation || "") + ")",
      data.fam2Phone || "",
      data.expLongline || "",
      data.vesselName || "",
      data.vesselTypeLongline || "",
      data.vesselOrigin || "",
      data.placementCountry || "",
      Array.isArray(data.skillGeneral) ? data.skillGeneral.join(", ") : (data.skillGeneral || ""),
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
      crewFolder.getUrl(),
      docUrls.passport.join(" \n"),
      docUrls.ktp.join(" \n"),
      docUrls.cdc.join(" \n"),
      docUrls.medical.join(" \n"),
      docUrls.cert.join(" \n"),
      docUrls.photo.join(" \n"),
      data.heightCm || "",
      data.weightKg || ""
    ];

    if (isUpdate) {
      if (updateRowIndex === -1) {
        // Fallback: If no match found by ID/Name, update the last row to prevent duplicate creation
        updateRowIndex = sheet.getLastRow() > 1 ? sheet.getLastRow() : 2;
      }
      
      // Ensure the sheet has at least 40 columns before getting range to prevent "outside the dimensions" error
      var maxCol = sheet.getMaxColumns();
      if (maxCol < 40) {
        sheet.insertColumnsAfter(maxCol, 40 - maxCol);
      }
      
      // For updates, we keep the original URLs if the new one is empty (meaning no new file was uploaded)
      var oldValues = sheet.getRange(updateRowIndex, 1, 1, 40).getValues()[0];
      for (var c = 32; c <= 37; c++) {
        if (rowValues[c] === "" && oldValues[c] !== "") {
          rowValues[c] = oldValues[c]; // retain old links
        } else if (rowValues[c] !== "" && oldValues[c] !== "") {
          rowValues[c] = oldValues[c] + " \n" + rowValues[c]; // append new links
        }
      }
      rowValues[0] = oldValues[0]; // Retain original timestamp
      sheet.getRange(updateRowIndex, 1, 1, 40).setValues([rowValues]);
    } else {
      sheet.appendRow(rowValues);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        message: "Data crew Longline Wantaifeng / PT ALINDA berhasil " + (isUpdate ? "diupdate!" : "disimpan!"),
        folderUrl: crewFolder.getUrl(),
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

function saveBase64FileToDrive(folder, fileObj, fileTag) {
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

    var driveFile = folder.createFile(blob);
    try {
      driveFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch(shareErr) {}
    return driveFile.getUrl();
  } catch (e) {
    return null;
  }
}

function doGet(e) {
  var action = e.parameter.action;
  
  if (action === "getAllCrew") {
    try {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var sheet = ss.getSheetByName("Data Crew Longline") || ss.getActiveSheet();
      var dataRange = sheet.getDataRange();
      var values = dataRange.getValues();
      var crewList = [];
      
      // Assumes row 1 is header. Data starts at row 2.
      for (var i = 1; i < values.length; i++) {
        var row = values[i];
        if (!row[1]) continue; // skip if no submissionId
        
        var parseUrls = function(str) {
          if (!str) return [];
          return String(str).split("\\n").map(function(u){ return u.trim(); }).filter(function(u){ return u.length > 0; });
        };
        
        var fam1 = String(row[7]).split("(");
        var fam2 = String(row[9]).split("(");
        var combinedDob = String(row[30]).split("/");
        
        crewList.push({
          submissionId: String(row[1]),
          fullName: String(row[2]),
          chineseName: String(row[3]),
          rankPosition: String(row[4]),
          phoneNo: String(row[5]),
          combinedAddress: String(row[6]),
          fam1Name: fam1[0].trim(),
          fam1Relation: fam1[1] ? fam1[1].replace(")","").trim() : "",
          fam1Phone: String(row[8]),
          fam2Name: fam2[0].trim(),
          fam2Relation: fam2[1] ? fam2[1].replace(")","").trim() : "",
          fam2Phone: String(row[10]),
          expLongline: String(row[11]),
          vesselName: String(row[12]),
          vesselTypeLongline: String(row[13]),
          vesselOrigin: String(row[14]),
          placementCountry: String(row[15]),
          skillGeneral: String(row[16]),
          passportNo: String(row[17]),
          passportExpiry: String(row[18]),
          cdcNo: String(row[19]),
          cdcExpiry: String(row[20]),
          bstExpiry: String(row[21]),
          kkStatus: String(row[22]),
          akteStatus: String(row[23]),
          ijazahLevel: String(row[24]),
          medicalStatus: String(row[25]),
          waliStatus: String(row[26]),
          skckStatus: String(row[27]),
          shirtSize: String(row[28]),
          shoeSize: String(row[29]),
          dob: combinedDob[0] ? combinedDob[0].trim() : "",
          gender: combinedDob[1] ? combinedDob[1].trim() : "",
          religion: combinedDob[2] ? combinedDob[2].trim() : "",
          folderUrl: String(row[31]),
          documents: {
            passport: parseUrls(row[32]),
            ktp: parseUrls(row[33]),
            cdc: parseUrls(row[34]),
            medical: parseUrls(row[35]),
            cert: parseUrls(row[36]),
            photo: parseUrls(row[37])
          },
          heightCm: row[38] ? parseInt(row[38]) : null,
          weightKg: row[39] ? parseInt(row[39]) : null,
          status: "WAITING"
        });
      }
      
      var reviewSheet = ss.getSheetByName("Review Owner");
      if (reviewSheet) {
        var reviewValues = reviewSheet.getDataRange().getValues();
        var reviewMap = {};
        for (var j = 1; j < reviewValues.length; j++) {
          var rRow = reviewValues[j];
          var sId = String(rRow[1]);
          if (sId) {
             reviewMap[sId] = {
               status: String(rRow[3]),
               commScore: String(rRow[4]),
               skillScore: String(rRow[5]),
               expScore: String(rRow[6]),
               attitudeScore: String(rRow[7]),
               leadershipScore: String(rRow[8]),
               notes: String(rRow[9])
             };
          }
        }
        for (var k = 0; k < crewList.length; k++) {
           var cId = crewList[k].submissionId;
           if (reviewMap[cId]) {
              crewList[k].status = reviewMap[cId].status;
              crewList[k].review = reviewMap[cId];
           }
        }
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

function initializeSampleData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Data Crew Longline') || ss.getActiveSheet();
  // Check if data already exists (beyond header)
  if (sheet.getLastRow() > 1) return;
  var sampleRows = [
    [new Date(), 37, 'MUHAMMAD SAIBUL AMIN', 'MUHAMMAD SAIBUL AMIN', 'CT4 MANUAL 小筒下口', '+628138782718', 'TEGAL', 'Tegal (Tegal)', '+628138782718', '', 'MANUAL 小筒下口 TAIWAN 小筒下口', 'SHIN JIAN LIH', 'CT4 MANUAL 小筒下口', 'Taiwan 台湾', 'Taiwan  台湾', '2024-10-06 00:00:00', '2026-01-26 00:00:00', 'UMMU HABIBAH', '+6281393778634', 'Istri 妻子'],
    [new Date(), 38, 'RIO ADITIAS NUR CAHYA', 'RIO ADITIAS NUR CAHYA', 'CT5 SNAP ATAS 车筒下口', '+6289531882811', 'TEGAL', 'Tegal (TEGAL)', '+6289531882811', '+886967295041', 'MANUAL DAN SNAP ATAS 小筒下口 , 车筒下口', 'SHENG HI SAI', 'CT5 SNAP ATAS 车筒下口', 'Taiwan 台湾', 'Taiwan  台湾', '2014-02-17 00:00:00', '2017-07-05 00:00:00', 'JAYANTI', '+6289531882811', 'Ibu 母亲']
    // Additional rows can be added here following the same structure
  ];
  sheet.getRange(sheet.getLastRow() + 1, 1, sampleRows.length, sampleRows[0].length).setValues(sampleRows);
}

// Run initialization once
function onInstall(e) {
  initializeSampleData();
}
function onOpen(e) {
  initializeSampleData();
}
