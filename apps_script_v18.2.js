// 🌟 1. 권한 강제 승인을 위한 셋업 함수 (반드시 한 번 실행해야 합니다!)
function setup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var drive = DriveApp.getRootFolder();
  console.log("✅ 구글 시트와 드라이브 접근 권한이 모두 완벽하게 승인되었습니다.");
}

// 🌟 2. 스마트폰에서 데이터를 받는 메인 함수
function doPost(e) {
  try {
    var requestData = JSON.parse(e.postData.contents);
    var record = requestData.record;
    var pdfData = requestData.pdfBase64;
    var certData = requestData.certBase64;
    var certName = requestData.certName || '완료확인서.jpg';

    // 1. 구글 시트 기록
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("작업기록");
    if (!sheet) {
      sheet = ss.insertSheet("작업기록");
      sheet.appendRow(["date", "no", "site", "dong", "ho", "loc", "work", "type", "contractor", "desc"]);
    }
    sheet.appendRow([
      record.date, record.no, record.site, record.dong,
      record.ho, record.loc, record.work, record.type,
      record.contractor, record.desc
    ]);

    // 2. 구글 드라이브 저장 로직
    var folderName = "METRO_현장보고서";
    var folders = DriveApp.getFoldersByName(folderName);
    var folder;
    
    if (folders.hasNext()) {
      folder = folders.next();
    } else {
      folder = DriveApp.createFolder(folderName);
    }

    var pdfFileName = "보고서_" + record.site + "_" + record.dong + "동_" + record.ho + "호.pdf";
    var certFileName = record.site + "_" + certName;

    // PDF 저장
    if (pdfData && pdfData !== "") {
      var pdfBlob = Utilities.newBlob(Utilities.base64Decode(pdfData), 'application/pdf', pdfFileName);
      folder.createFile(pdfBlob);
    }

    // 사진(완료확인서) 저장
    if (certData && certData !== "") {
      var certBlob = Utilities.newBlob(Utilities.base64Decode(certData), 'image/jpeg', certFileName);
      folder.createFile(certBlob);
    }

    return ContentService.createTextOutput(JSON.stringify({ "result": "success", "message": "드라이브 저장 완료" })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ "result": "error", "message": error.message })).setMimeType(ContentService.MimeType.JSON);
  }
}

// 🌟 3. DB를 넘겨주는 함수
function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheets = ss.getSheets();
    var db = {};
    for (var i = 0; i < sheets.length; i++) {
      var sheetName = sheets[i].getName();
      if (sheetName === "작업기록") continue;
      var data = sheets[i].getDataRange().getValues();
      if (data.length > 1) {
        var headers = data[0];
        var rows = [];
        for (var j = 1; j < data.length; j++) {
          var obj = {};
          for (var k = 0; k < headers.length; k++) {
            var headerName = String(headers[k]).toLowerCase().trim();
            obj[headerName] = data[j][k];
          }
          rows.push(obj);
        }
        db[sheetName] = rows;
      } else {
        db[sheetName] = [];
      }
    }
    return ContentService.createTextOutput(JSON.stringify({ "result": "success", "data": db })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ "result": "error", "message": error.message })).setMimeType(ContentService.MimeType.JSON);
  }
}