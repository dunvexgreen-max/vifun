/**
 * SIÊU SCRIPT: STOCK TRADING & FINANCE MANAGER (UNIFIED)
 * Version: Consolidated + Full Trading Logic Restored + Gmail Sync Fix + Auth Trigger
 */

/**
 * CHẠY HÀM NÀY MỘT LẦN TRONG TRÌNH CHỈNH SỬA APPS SCRIPT ĐỂ ÉP CẤP QUYỀN
 * (Nhấn Run -> Chọn TRIGGER_AUTHORIZATION -> Nhấn Allow)
 */
function TRIGGER_AUTHORIZATION() {
  DriveApp.getRootFolder(); // Cấp quyền Drive
  GmailApp.getInboxUnreadCount(); // Cấp quyền Gmail
  SpreadsheetApp.getActiveSpreadsheet(); // Cấp quyền Sheets
  console.log("Xác thực thành công. Bây giờ bạn có thể Deploy lại bản mới.");
}

// CẤU HÌNH CHÍNH
const SPREADSHEET_ID = '11ndIWy9yteJQFuWO4rssp3_8YJ-rYZgpJ1cLuLVQuy8'; // File Chứng khoán
const FINANCE_SPREADSHEET_ID = '1mKriBf9F_MST3nCe66b7675Ha6DxdYZ_EuPij2mU_MY'; // File Tài chính
const API_SECRET_KEY = 'STOCKS_SIM_SECURE_V1_2024_@SEC';
const FOLDER_ID = '1ravNtRAPEqi6WDSe_J522vbmIhroSK60'; // Thư mục lưu UNC mới

// GOOGLE OAUTH2 CONFIGURATION
const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID';
const GOOGLE_CLIENT_SECRET = 'YOUR_GOOGLE_CLIENT_SECRET';

// STOCK TRADING CONSTANTS
const FEE_BUY = 0.0015; // 0.15%
const FEE_SELL = 0.002;  // 0.2% (Fee + Tax)

// ==========================================
// 1. HTTP HANDLERS (DUY NHẤT)
// ==========================================

function doGet(e) {
  // Handle Admin Approval for Pro Upgrade
  if (e.parameter.action === 'approveUpgrade' && e.parameter.email) {
    const success = processUpgradeAction(e.parameter.email, true);
    return HtmlService.createHtmlOutput(`<h2 style="color: #10B981; text-align: center;">Đã duyệt nâng cấp cho ${e.parameter.email}</h2>`);
  }
  if (e.parameter.action === 'rejectUpgrade' && e.parameter.email) {
    processUpgradeAction(e.parameter.email, false);
    return HtmlService.createHtmlOutput(`<h2 style="color: #EF4444; text-align: center;">Đã từ chối nâng cấp cho ${e.parameter.email}</h2>`);
  }

  if (e.parameter.code && e.parameter.state) {
    const success = handleOAuthCallback(e.parameter.code, e.parameter.state);
    if (success) {
      return HtmlService.createHtmlOutput(`
        <div style="font-family: sans-serif; text-align: center; padding: 50px;">
          <h2 style="color: #10B981;">Kết nối thành công!</h2>
          <p>Tài khoản Gmail của bạn đã được liên kết với StockSim.</p>
          <p>Bạn có thể đóng cửa sổ này và quay lại ứng dụng.</p>
          <script>setTimeout(function(){ window.close(); }, 3000);</script>
        </div>
      `);
    } else {
      return HtmlService.createHtmlOutput(`
        <div style="font-family: sans-serif; text-align: center; padding: 50px;">
          <h2 style="color: #EF4444;">Kết nối thất bại</h2>
          <p>Có lỗi xảy ra trong quá trình xác thực. Vui lòng thử lại.</p>
        </div>
      `);
    }
  }
  return HtmlService.createHtmlOutput("StockSim Unified API is running.");
}

function doPost(e) {
  const params = JSON.parse(e.postData.contents);
  const action = params.action;
  
  if (params.apiKey !== API_SECRET_KEY) return response({ error: 'API Key không hợp lệ.' }, 401);

  // Đảm bảo cấu trúc sheet
  ensureHeaders();

  try {
    const criticalActions = ['placeOrder', 'deposit', 'deleteTransaction', 'sendOTP', 'verifyOTP'];
    if (criticalActions.includes(action)) checkRateLimit(params.email, action);

    switch (action) {
      // --- TRADING ACTIONS ---
      case 'login': return response(login(params.email, params.password));
      case 'register': return response(register(params.email, params.password, params.otp));
      case 'resetPassword': return response(resetPassword(params.email, params.password, params.otp));
      case 'getProfile': return response(getProfile(params.email));
      case 'sendOTP': return response(sendOTP(params.email, params.type));
      case 'verifyOTP': return response(verifyOTP(params.email, params.otp));
      case 'placeOrder': return response(placeOrder(params));
      case 'getHoldings': return response(getHoldings(params.email));
      case 'getHistory': return response(getHistory(params.email));
      case 'deleteTransaction': return response(deleteTradingTransaction(params.email, params.id));
      case 'deposit': return response(depositFunds(params));
      case 'adjustBalance': return response(adjustBalance(params));
      case 'getNotifications': return response(getNotifications(params.email));
      case 'markNotificationsRead': return response(markNotificationsRead(params.email));
      case 'getStockData': return response(getStockData(params.symbol));
      case 'getStockHistory': return response(getStockHistory(params.symbol));
      case 'refreshStockPrices': return response(refreshStockPrices());

      // --- FINANCE ACTIONS ---
      case 'checkGmailConnection': return response(checkGmailConnection(params.email));
      case 'syncGmailReceipts': return response(syncGmailReceipts(params.email));
      case 'getGoogleAuthUrl': return response(getGoogleAuthUrl(params.email));
      case 'getFinanceSummary': return response(getFinanceSummary(params.email));
      case 'getFinanceTransactions': return response(getFinanceTransactions(params.email));
      case 'addManualTransaction': return response(addManualTransaction(params));
      case 'deleteFinanceTransaction': return response(deleteFinanceTransaction(params.email, params.id));
      case 'updateFinanceTransaction': return response(updateFinanceTransaction(params));
      
      // --- USER SETTINGS & UPGRADE ---
      case 'getUserSettings': return response(getUserSettings(params.email));
      case 'updateUserSettings': return response(updateUserSettings(params.email, params.settings));
      case 'submitUpgradeRequest': return response(submitUpgradeRequest(params.email, params.method, params.file));
      case 'debugBackend': return response(ensureHeaders() || { success: true, message: "Headers checked." });
      case 'checkDriveAccess': 
        try {
          const folder = DriveApp.getFolderById(FOLDER_ID);
          return response({ success: true, folderName: folder.getName() });
        } catch(e) { return response({ success: false, error: e.message }); }
      
      default: return response({ error: 'Hành động không hợp lệ: ' + (params.action || 'Unknown') }, 400);
    }
  } catch (err) { return response({ error: err.message }, 500); }
}

function response(data, code = 200) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

// ==========================================
// 2. CORE UTILS & SECURITY
// ==========================================

function ensureHeaders() {
  const ssMain = SpreadsheetApp.openById(SPREADSHEET_ID);
  const ssFinance = SpreadsheetApp.openById(FINANCE_SPREADSHEET_ID);
  
  const createInMain = (name, headers) => {
    let sheet = ssMain.getSheetByName(name);
    if (!sheet) {
      sheet = ssMain.insertSheet(name);
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    }
    return sheet;
  };

  const createInFinance = (name, headers) => {
    let sheet = ssFinance.getSheetByName(name);
    if (!sheet) {
      sheet = ssFinance.insertSheet(name);
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    }
    return sheet;
  };

  // --- MAIN SPREADSHEET SHEETS ---
  createInMain('Users', ['Email', 'Balance', 'CreatedAt', 'Password', 'IsPro', 'SubStart', 'SubEnd']);
  createInMain('OTP', ['Email', 'OTP', 'Expiry']);
  createInMain('Notifications', ['Date', 'Email', 'Message', 'IsRead']);
  createInMain('PriceFetcher', ['Mã', 'Link', 'Công thức lấy giá', '', 'LÀM MỚI GIÁ', '']);
  createInMain('Deposits', ['Date', 'Email', 'Amount']);
  createInMain('UserSettings', ['Email', 'ConfigJSON', 'UpdatedAt']);
  createInMain('SettingsHistory', ['Date', 'Email', 'Change']);

  // --- FINANCE SPREADSHEET SHEETS ---
  createInFinance('Subscriptions', ['Date', 'Email', 'Method', 'UNC_Url', 'Status', 'ConfirmedAt', 'ExpiryDate']);
  createInFinance('SystemLogs', ['Date', 'Level', 'Action', 'Message', 'Details']);
  // 16 Cột chuẩn hóa theo yêu cầu người dùng
  const financeHeaders = [
    'ID', 'Date', 'Amount', 'Type', 'Category', 'Description', 
    'Source', 'Status', 'UserEmail', 'TransDate', 'OrderNo', 
    'SourceAcc', 'Remitter', 'TargetAcc', 'TargetName', 'RawAmount'
  ];
  createInFinance('Financial_Transactions', financeHeaders);
  createInFinance('Manual_Transactions', financeHeaders);
}

function checkRateLimit(email, action) {
  const cache = CacheService.getScriptCache();
  const key = `rl_${email}_${action}`;
  if (cache.get(key)) throw new Error('Bạn đang thao tác quá nhanh. Vui lòng đợi 2 giây.');
  cache.put(key, 'locked', 2);
}

function getIndices(headers) {
  const h = headers.map(v => String(v).trim().toLowerCase());
  const find = (names) => { for (let name of names) { const i = h.indexOf(name.toLowerCase()); if (i !== -1) return i; } return -1; };
  return {
    id: find(['ID']), date: find(['Date', 'Ngày']), amount: find(['Amount', 'Số tiền']),
    type: find(['Type', 'Loại']), category: find(['Category', 'Danh mục']),
    description: find(['Description', 'Mô tả', 'Nội dung']), source: find(['Source', 'Nguồn']),
    status: find(['Status', 'Trạng thái']), email: find(['UserEmail', 'Email']),
    actual: find(['Actual', 'Thực tế']), projected: find(['Projected', 'Dự kiến']),
    orderNo: find(['OrderNo', 'Mã lệnh', 'Số lệnh']), sourceAcc: find(['SourceAcc', 'TK Nguồn']),
    remitter: find(['Remitter', 'Người gửi']), targetAcc: find(['TargetAcc', 'TK Nhận']),
    targetName: find(['TargetName', 'Người nhận']), transDate: find(['TransDate', 'Ngày giao dịch']),
    rawAmount: find(['RawAmount', 'Số tiền gốc']),
    beneficiary: find(['beneficiary', 'người hưởng']),
    accountNum: find(['accountnum', 'số tài khoản']),
    symbol: find(['symbol', 'mã cp']),
    side: find(['side', 'chiều']),
    quantity: find(['quantity', 'số lượng']),
    price: find(['price', 'giá']),
    fee: find(['fee', 'phí']),
    total: find(['total', 'tổng']),
    pnl: find(['pnl', 'lợi nhuận'])
  };
}

function getFinanceTransactions(email) {
  const ssMain = SpreadsheetApp.openById(SPREADSHEET_ID);
  const userSheet = ssMain.getSheetByName('Users');
  const userData = userSheet.getDataRange().getValues();
  const userRow = userData.find(r => String(r[0]).toLowerCase().trim() === email.toLowerCase().trim());
  
  let isPro = false;
  if (userRow) {
    const status = String(userRow[4] || "").toUpperCase();
    isPro = (status === 'PRO' || status === 'TRUE');
  }

  const ss = SpreadsheetApp.openById(FINANCE_SPREADSHEET_ID);
  const headers = ['ID', 'Date', 'Amount', 'Type', 'Category', 'Description', 'Source', 'Status', 'UserEmail', 'TransDate', 'OrderNo', 'SourceAcc', 'Remitter', 'TargetAcc', 'TargetName', 'RawAmount'];
  
  const transactions = [];
  ['Financial_Transactions', 'Manual_Transactions'].forEach(name => {
    const sheet = ensureSheet(ss, name, headers);
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return;
    
    const idx = getIndices(data[0]);
    data.slice(1).forEach(row => {
      if (row[idx.email] && row[idx.email].toLowerCase().trim() === email.toLowerCase().trim()) {
        transactions.push({
          id: row[idx.id],
          date: row[idx.date],
          amount: parseFloat(row[idx.amount]) || 0,
          type: String(row[idx.type] || "EXPENSE").toUpperCase(),
          category: row[idx.category],
          description: row[idx.description],
          source: row[idx.source],
          status: row[idx.status],
          transDate: row[idx.transDate] || "",
          orderNo: row[idx.orderNo] || "",
          sourceAcc: row[idx.sourceAcc] || "",
          remitter: row[idx.remitter] || "",
          targetAcc: row[idx.targetAcc] || "",
          targetName: row[idx.targetName] || "",
          rawAmount: row[idx.rawAmount] || ""
        });
      }
    });
  });

  return { transactions: transactions.sort((a, b) => new Date(b.date) - new Date(a.date)), isPro: isPro };
}

function ensureSheet(ss, name, headers) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) { sheet = ss.insertSheet(name); sheet.appendRow(headers); }
  return sheet;
}

// ==========================================
// 3. FINANCE & GMAIL SYNC (FROM FINANCE.GS)
// ==========================================

function getGoogleAuthUrl(userEmail) {
  const scriptUrl = ScriptApp.getService().getUrl();
  const scope = 'https://www.googleapis.com/auth/gmail.readonly';
  const url = 'https://accounts.google.com/o/oauth2/v2/auth' +
    '?client_id=' + GOOGLE_CLIENT_ID +
    '&redirect_uri=' + encodeURIComponent(scriptUrl) +
    '&response_type=code' +
    '&scope=' + encodeURIComponent(scope) +
    '&state=' + encodeURIComponent(userEmail) +
    '&access_type=offline' +
    '&prompt=consent';
  return { url: url };
}

function handleOAuthCallback(code, userEmail) {
  const scriptUrl = ScriptApp.getService().getUrl();
  const tokenUrl = 'https://oauth2.googleapis.com/token';
  const payload = { code: code, client_id: GOOGLE_CLIENT_ID, client_secret: GOOGLE_CLIENT_SECRET, redirect_uri: scriptUrl, grant_type: 'authorization_code' };
  try {
    const res = UrlFetchApp.fetch(tokenUrl, { method: 'post', payload: payload, muteHttpExceptions: true });
    const data = JSON.parse(res.getContentText());
    if (data.refresh_token) { saveUserToken(userEmail, data.refresh_token); return true; }
  } catch (e) {}
  return false;
}

function saveUserToken(email, refreshToken) {
  const ss = SpreadsheetApp.openById(FINANCE_SPREADSHEET_ID);
  let sheet = ss.getSheetByName('UserTokens') || ss.insertSheet('UserTokens');
  const data = sheet.getDataRange().getValues();
  const rowIndex = data.findIndex(r => String(r[0]).toLowerCase() === String(email).toLowerCase());
  if (rowIndex !== -1) {
    sheet.getRange(rowIndex + 1, 2).setValue(refreshToken);
    sheet.getRange(rowIndex + 1, 3).setValue(new Date());
  } else {
    sheet.appendRow([email, refreshToken, new Date()]);
  }
}

function getUserToken(email) {
  const ss = SpreadsheetApp.openById(FINANCE_SPREADSHEET_ID);
  const sheet = ss.getSheetByName('UserTokens');
  if (!sheet) return null;
  const data = sheet.getDataRange().getValues();
  const row = data.find(r => String(r[0]).toLowerCase() === String(email).toLowerCase());
  return row ? { refreshToken: row[1] } : null;
}

function checkGmailConnection(email) {
  const token = getUserToken(email);
  return { connected: !!(token && token.refreshToken) };
}

function refreshAccessToken(refreshToken) {
  const url = 'https://oauth2.googleapis.com/token';
  const payload = { client_id: GOOGLE_CLIENT_ID, client_secret: GOOGLE_CLIENT_SECRET, refresh_token: refreshToken, grant_type: 'refresh_token' };
  try {
    const res = UrlFetchApp.fetch(url, { method: 'post', payload: payload });
    return JSON.parse(res.getContentText()).access_token;
  } catch (e) { return null; }
}

function syncGmailReceipts(email) {
  // 1. Kiểm tra trạng thái PRO
  const ssMain = SpreadsheetApp.openById(SPREADSHEET_ID);
  const uSheet = ssMain.getSheetByName('Users');
  const uData = uSheet.getDataRange().getValues();
  const userRow = uData.find(r => r[0].toLowerCase().trim() === email.toLowerCase().trim());
  const isPro = userRow && (userRow[4] === 'PRO' || userRow[4] === true || userRow[4] === 'true');

  if (!isPro) return { error: 'Tính năng này yêu cầu người dùng PRO.' };

  const ss = SpreadsheetApp.openById(FINANCE_SPREADSHEET_ID);
  const headers = ['ID', 'Date', 'Amount', 'Type', 'Category', 'Description', 'Source', 'Status', 'UserEmail', 'TransDate', 'OrderNo', 'SourceAcc', 'Remitter', 'TargetAcc', 'TargetName', 'RawAmount'];
  const sheet = ensureSheet(ss, 'Financial_Transactions', headers);
  const data = sheet.getDataRange().getValues();
  const idx = getIndices(data[0]);
  const existingIds = data.map(r => r[idx.id]);

  const query = 'newer_than:7d (subject:("biên lai" OR "biến động" OR "giao dịch" OR "thanh toán" OR "nạp thẻ" OR "số dư") OR from:VCBDigibank OR from:no-reply@techcombank.com.vn OR from:info@myvib.vib.com.vn)';
  const threads = GmailApp.search(query, 0, 20);
  
  let count = 0;
  threads.forEach(thread => {
    thread.getMessages().forEach(msg => {
      const id = "EMAIL_" + msg.getId();
      if (!existingIds.includes(id)) {
        const result = processEmailParsing(msg.getSubject(), msg.getBody(), msg.getPlainBody(), msg.getFrom(), msg.getDate(), id, email, headers.length, idx);
        if (result) {
          sheet.appendRow(result);
          count++;
        }
      }
    });
  });
  return { success: true, added: count };
}

function syncGmailApi(userEmail, accessToken) {
  const ss = SpreadsheetApp.openById(FINANCE_SPREADSHEET_ID);
  const headers = ['ID', 'Date', 'Amount', 'Type', 'Category', 'Description', 'Source', 'Status', 'UserEmail', 'Actual', 'Projected', 'OrderNo', 'SourceAcc', 'Remitter', 'TargetAcc', 'TargetName'];
  const sheet = ensureSheet(ss, 'Financial_Transactions', headers);
  const data = sheet.getDataRange().getValues();
  const idx = getIndices(data[0]);
  const existingIdMap = {};
  data.forEach(r => { if(r[idx.id]) existingIdMap[r[idx.id].toString()] = true; });

  const query = 'newer_than:30d (subject:("biên lai" OR "biến động" OR "giao dịch" OR "thanh toán" OR "nạp thẻ" OR "số dư") OR from:info@myvib.vib.com.vn)';
  const listUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=50`;
  const options = { headers: { Authorization: `Bearer ${accessToken}` }, muteHttpExceptions: true };
  
  const listResp = UrlFetchApp.fetch(listUrl, options);
  const listData = JSON.parse(listResp.getContentText());

  let syncCount = 0; const rowsToAppend = [];
  if (listData.messages) {
    listData.messages.forEach(m => {
      const emailId = 'EMAIL_' + m.id;
      if (existingIdMap[emailId]) return;
      const msgResp = UrlFetchApp.fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}`, options);
      const msgData = JSON.parse(msgResp.getContentText());
      let body = "";
      if (msgData.payload.parts) {
        const part = msgData.payload.parts.find(p => p.mimeType === 'text/html') || msgData.payload.parts[0];
        if (part && part.body && part.body.data) body = Utilities.newBlob(Utilities.base64DecodeWebSafe(part.body.data)).getDataAsString();
      } else if (msgData.payload.body && msgData.payload.body.data) body = Utilities.newBlob(Utilities.base64DecodeWebSafe(msgData.payload.body.data)).getDataAsString();
      
      const subject = (msgData.payload.headers.find(h => h.name === 'Subject') || {}).value || '';
      const sender = (msgData.payload.headers.find(h => h.name === 'From') || {}).value || '';
      const rowData = processEmailParsing(subject, body, body.replace(/<[^>]*>/g, ' '), sender, new Date(parseInt(msgData.internalDate)), emailId, userEmail, headers.length, idx);
      if (rowData) { rowsToAppend.push(rowData); existingIdMap[emailId] = true; syncCount++; }
    });
    if (rowsToAppend.length > 0) sheet.getRange(sheet.getLastRow() + 1, 1, rowsToAppend.length, headers.length).setValues(rowsToAppend);
  }
  return { success: true, message: `Synced ${syncCount} messages via API.` };
}

function processEmailParsing(subject, body, plainText, sender, dateObj, id, userEmail, rowLength, idx) {
  // 1. CHUẨN HÓA DỮ LIỆU ĐẦU VÀO
  const content = (subject + " " + plainText).replace(/\s+/g, ' '); // Gộp khoảng trắng nhưng giữ dấu *
  const contentLower = content.toLowerCase();

  // Bộ lọc rác
  if (contentLower.includes('quảng cáo') || contentLower.includes('otp')) return null;

  // 2. KHỞI TẠO BIẾN DỮ LIỆU CHI TIẾT
  let orderNo = "", sourceAcc = "", remitter = "", targetAcc = "", targetName = "", transDate = "", amount = 0, rawAmount = "", description = subject;
  let sourceName = 'Ngân hàng';

  // 3. LOGIC ĐẶC TRỊ VIETCOMBANK (FUZZY SCANNER)
  if (contentLower.includes('vcb') || contentLower.includes('vietcombank')) {
    sourceName = 'Vietcombank';
    const extract = (key, radius = 100) => {
      const regex = new RegExp(key + '[^*]*?\\*?\\s*([^\\*\\n\\r<|]{2,' + radius + '})', 'i');
      const m = content.match(regex);
      return m ? m[1].replace(/[*_]/g, '').trim() : "";
    };

    transDate = extract('Trans. Date, Time', 30);
    orderNo = extract('Order Number', 20);
    sourceAcc = extract('Debit Account', 20);
    remitter = extract('Remitter’s name', 50);
    targetAcc = extract('Credit Account', 20);
    targetName = extract('Beneficiary Name', 50);
    rawAmount = extract('Amount', 30);
    
    const descField = extract('Details of Payment', 150);
    if (descField) description = descField;
    
    // Làm sạch số tiền
    amount = parseFloat(rawAmount.replace(/[^\d]/g, '')) || 0;
  }

  // 4. DỰ PHÒNG CHO CÁC NGÂN HÀNG KHÁC (HOẶC VCB LỖI TRÍCH XUẤT)
  if (amount < 1000) {
    const moneyRegex = /(?:số tiền|amount|giá trị)[:\-\s*]*([+\-]?[\d.,\s]{4,20})\s*(?:VND|VNĐ|đ|d)/i;
    const m = content.match(moneyRegex);
    if (m) amount = parseFloat(m[1].replace(/[^\d]/g, '')) || 0;
  }

  if (amount < 1000) return null; 

  // 5. XÁC ĐỊNH LOẠI & GHI DỮ LIỆU
  const isIncome = subject.includes('+') || contentLower.includes('+') || contentLower.includes('ghi có') || contentLower.includes('nhận tiền');
  const type = isIncome ? 'INCOME' : 'EXPENSE';

  const newRow = new Array(rowLength).fill('');
  const set = (idxKey, val) => { if (idx[idxKey] !== -1) newRow[idx[idxKey]] = val; };

  set('id', id);
  set('date', dateObj.toISOString());
  set('amount', amount);
  set('actual', amount); // Compatible with old UI
  set('type', type);
  set('category', "Deep Sync");
  set('description', description);
  set('source', sourceName);
  set('status', 'SYNCED');
  set('email', userEmail.toLowerCase().trim());
  
  // Các cột chi tiết yêu cầu
  set('transDate', transDate);
  set('orderNo', orderNo);
  set('sourceAcc', sourceAcc);
  set('remitter', remitter);
  set('targetAcc', targetAcc);
  set('targetName', targetName);
  set('rawAmount', rawAmount);
  
  return newRow;
}

function getFinanceTransactions(email) {
  // 1. Check PRO status first
  const ssMain = SpreadsheetApp.openById(SPREADSHEET_ID);
  const userSheet = ssMain.getSheetByName('Users');
  const userData = userSheet.getDataRange().getValues();
  const userRow = userData.find(r => String(r[0]).toLowerCase().trim() === email.toLowerCase().trim());
  
  let isPro = false;
  if (userRow) {
      const subEnd = userRow[6] ? new Date(userRow[6]) : null;
      const now = new Date();
      const isSubscriptionActive = subEnd && subEnd > now;
      isPro = String(userRow[4] || "").toUpperCase() === 'PRO' || isSubscriptionActive;
  }

  const ss = SpreadsheetApp.openById(FINANCE_SPREADSHEET_ID);
  const results = [];
  const user = email.toLowerCase().trim();

  // 2. Determine sheets to read
  // Tài khoản FREE chỉ xem được Manual_Transactions
  // Tài khoản PRO xem được cả Financial_Transactions (Automated) + Manual
  const sheetsToRead = isPro ? ['Financial_Transactions', 'Manual_Transactions'] : ['Manual_Transactions'];

  sheetsToRead.forEach(name => {
    const sheet = ss.getSheetByName(name);
    if (!sheet) return;
    const data = sheet.getDataRange().getValues();
    const idx = getIndices(data[0]);
    data.slice(1).forEach(row => {
      const rowEmail = idx.email !== -1 ? String(row[idx.email] || "").toLowerCase().trim() : "";
      if (rowEmail === user || rowEmail === "") {
        const act = idx.actual !== -1 ? parseFloat(row[idx.actual]) || 0 : 0;
        
        // Logic mới: Nếu là Synced (từ ngân hàng) thì KHÔNG tự động lấy Amount làm Kế hoạch
        // Chỉ Manual mới cho phép fallback này.
        let proj = 0;
        if (idx.projected !== -1 && row[idx.projected] !== "") {
          proj = parseFloat(row[idx.projected]) || 0;
        } else if (name === 'Manual_Transactions' && idx.amount !== -1) {
          proj = parseFloat(row[idx.amount]) || 0;
        }

        results.push({
          id: row[idx.id], date: row[idx.date], 
          actual: act, 
          projected: proj,
          amount: name === 'Financial_Transactions' ? act : proj,
          type: String(row[idx.type] || "EXPENSE").toUpperCase(), category: row[idx.category],
          description: row[idx.description],
          source: row[idx.source],
          status: row[idx.status] || (name === 'Manual_Transactions' ? 'MANUAL' : 'SYNCED'),
          orderNo: row[idx.orderNo] || "",
          sourceAcc: row[idx.sourceAcc] || "",
          remitter: row[idx.remitter] || "",
          targetAcc: row[idx.targetAcc] || "",
          targetName: row[idx.targetName] || ""
        });
      }
    });
  });
  return results.sort((a, b) => new Date(b.date) - new Date(a.date));
}

function getFinanceSummary(email) {
  const tx = getFinanceTransactions(email);
  let income = 0, expense = 0;
  tx.forEach(t => { if (t.type === 'INCOME') income += t.actual; else expense += t.actual; });
  return { totalIncome: income, totalExpense: expense, netBalance: income - expense };
}

function addManualTransaction(params) {
    const ss = SpreadsheetApp.openById(FINANCE_SPREADSHEET_ID);
    const headers = ['ID', 'Date', 'Amount', 'Type', 'Category', 'Description', 'Source', 'Status', 'UserEmail', 'TransDate', 'OrderNo', 'SourceAcc', 'Remitter', 'TargetAcc', 'TargetName', 'RawAmount'];
    const sheet = ensureSheet(ss, 'Manual_Transactions', headers);
    const idx = getIndices(headers);
    const newRow = new Array(headers.length).fill('');
    newRow[idx.id] = 'MANUAL_' + new Date().getTime();
    newRow[idx.date] = params.date || new Date().toISOString();
    newRow[idx.actual] = parseFloat(params.actual) || 0;
    newRow[idx.projected] = parseFloat(params.projected) || parseFloat(params.amount) || 0;
    newRow[idx.type] = String(params.type || "EXPENSE").toUpperCase();
    newRow[idx.category] = params.category;
    newRow[idx.description] = params.description;
    newRow[idx.source] = params.source || 'Thủ công';
    newRow[idx.status] = 'MANUAL';
    newRow[idx.email] = params.email;
    if (idx.orderNo !== -1) newRow[idx.orderNo] = params.orderNo || '';
    if (idx.sourceAcc !== -1) newRow[idx.sourceAcc] = params.sourceAcc || '';
    if (idx.remitter !== -1) newRow[idx.remitter] = params.remitter || '';
    if (idx.targetAcc !== -1) newRow[idx.targetAcc] = params.targetAcc || '';
    if (idx.targetName !== -1) newRow[idx.targetName] = params.targetName || '';
    sheet.appendRow(newRow);
    return { success: true };
}

function deleteFinanceTransaction(email, id) {
    const ss = SpreadsheetApp.openById(FINANCE_SPREADSHEET_ID);
    ['Financial_Transactions', 'Manual_Transactions'].forEach(name => {
        const sheet = ss.getSheetByName(name); if (!sheet) return;
        const data = sheet.getDataRange().getValues(); const idx = getIndices(data[0]);
        for (let i = 1; i < data.length; i++) { if (String(data[i][idx.id]) === String(id)) { sheet.deleteRow(i + 1); break; } }
    });
    return { success: true };
}

function updateFinanceTransaction(params) {
    const ss = SpreadsheetApp.openById(FINANCE_SPREADSHEET_ID);
    const sheet = ss.getSheetByName('Manual_Transactions'); if (!sheet) return { error: 'Sheet not found' };
    const data = sheet.getDataRange().getValues(); const idx = getIndices(data[0]);
    for (let i = 1; i < data.length; i++) {
        if (String(data[i][idx.id]) === String(params.id)) {
            if (params.actual) sheet.getRange(i+1, idx.actual+1).setValue(params.actual);
            if (params.projected) sheet.getRange(i+1, idx.projected+1).setValue(params.projected);
            return { success: true };
        }
    }
    return { error: 'Not found' };
}

// ==========================================
// 4. TRADING LOGIC (RESTORED FROM BACKEND.GS)
// ==========================================

function login(email, password) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Users');
  const data = sheet.getDataRange().getValues();
  const searchEmail = email.toString().trim().toLowerCase();
  const searchPass = password.toString().trim();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0].toString().trim().toLowerCase() === searchEmail && data[i][3].toString().trim() === searchPass) {
      return { success: true, role: (searchEmail === 'admin@stocksim.com' || searchEmail === 'nbt1024@gmail.com') ? 'admin' : 'user', balance: data[i][1] };
    }
  }
  return { error: 'Email hoặc mật khẩu không đúng' };
}

function register(email, password, otp) {
  if (verifyOTP(email, otp).success === false) return { error: "OTP sai hoặc hết hạn" };
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Users');
  const data = sheet.getDataRange().getValues();
  if (data.some(r => r[0] === email)) return { error: "Email đã tồn tại" };
  sheet.appendRow([email, 0, new Date(), password]);
  return { success: true };
}

function resetPassword(email, password, otp) {
  if (verifyOTP(email, otp).success === false) return { error: "OTP sai hoặc hết hạn" };
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Users');
  const data = sheet.getDataRange().getValues();
  const idx = data.findIndex(r => r[0] === email);
  if (idx !== -1) { sheet.getRange(idx + 1, 4).setValue(password); return { success: true }; }
  return { error: "Email không tồn tại" };
}

function getProfile(email) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const userSheet = ss.getSheetByName('Users');
  const data = userSheet.getDataRange().getValues();
  const userRow = data.find(row => row[0] === email);
  if (!userRow) throw new Error('Người dùng không tồn tại');

  const holdings = getHoldings(email);
  const history = getHistory(email);
  
  // Tính toán chỉ số tài chính (RESTORED logic)
  let totalInvestment = 0;
  const recordedDeps = new Set();
  const depSheet = ss.getSheetByName('Deposits');
  if (depSheet) {
    depSheet.getDataRange().getValues().forEach((row, idx) => {
      if (idx > 0 && row[1] === email) {
        const amt = parseFloat(row[2]);
        totalInvestment += amt;
        recordedDeps.add(`${row[0]}_${amt}`);
      }
    });
  }

  let realizedPnL = 0, totalFees = 0;
  history.forEach(h => {
    if (h.side === 'SELL') realizedPnL += h.pnl;
    totalFees += (h.fee || 0);
  });

  const priceSheet = ss.getSheetByName('PriceFetcher');
  const priceMap = {};
  if (priceSheet) {
    priceSheet.getDataRange().getValues().forEach((row, idx) => { if (idx > 0) priceMap[row[0].toUpperCase()] = parseFloat(row[2]) || 0; });
  }

  let stockValue = 0, unrealizedPnL = 0;
  const enrichedHoldings = holdings.map(h => {
    const currentPrice = priceMap[h.symbol] || h.avgPrice;
    const value = h.quantity * currentPrice;
    const cost = h.quantity * h.avgPrice;
    const pnl = value - cost;
    stockValue += value;
    unrealizedPnL += pnl;
    return { ...h, currentPrice, value, pnl, pnlPct: h.avgPrice > 0 ? (pnl / cost) * 100 : 0 };
  });

  const balance = userRow[1];
  const totalAssets = balance + stockValue;
  
  // Check subscription expiry
  const subEnd = userRow[6] ? new Date(userRow[6]) : null;
  const now = new Date();
  const isSubscriptionActive = subEnd && subEnd > now;
  const isPro = userRow[4] === true || String(userRow[4] || "").toLowerCase() === 'true' || String(userRow[4] || "").toUpperCase() === 'PRO' || isSubscriptionActive;

  return {
    email: userRow[0], balance, holdings: enrichedHoldings, recentHistory: history.slice(0, 10),
    totalAssets, totalInvestment, realizedPnL, unrealizedPnL, totalFees, totalPnL: totalAssets - totalInvestment,
    isPro: !!isPro,
    subStart: userRow[5] ? new Date(userRow[5]).toISOString() : null,
    subEnd: subEnd ? subEnd.toISOString() : null
  };
}

function sendOTP(email, type = 'register') {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('OTP');
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiry = new Date(new Date().getTime() + 5 * 60000);
  
  const data = sheet.getDataRange().getValues();
  const idx = data.findIndex(r => r[0] === email);
  if (idx !== -1) { sheet.getRange(idx + 1, 2).setValue(otp); sheet.getRange(idx + 1, 3).setValue(expiry); }
  else { sheet.appendRow([email, otp, expiry]); }
  
  const subject = type === 'reset' ? '[StockSim] Khôi phục mật khẩu' : '[StockSim] Xác nhận đăng ký';
  MailApp.sendEmail({
    to: email, subject: subject,
    htmlBody: `<div style="font-family: sans-serif; text-align: center; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
      <h2>Mã OTP của bạn</h2>
      <div style="font-size: 32px; font-weight: bold; background: #f3f4f6; padding: 10px; margin: 20px;">${otp}</div>
      <p>Mã hết hạn sau 5 phút.</p>
    </div>`
  });
  return { success: true };
}

function verifyOTP(email, userOtp) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('OTP');
  const data = sheet.getDataRange().getValues();
  const row = data.find(r => r[0] === email && r[1].toString() === userOtp.toString());
  if (row && new Date() < new Date(row[2])) return { success: true };
  return { success: false, error: 'OTP không đúng hoặc đã hết hạn' };
}

function placeOrder(params) {
  const { email, symbol, quantity, type, side, price } = params;
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  
  refreshStockPrices(); // Refresh to get latest price
  Utilities.sleep(1000);

  const liveData = getStockData(symbol);
  if (liveData.error) throw new Error('Cổ phiếu không hợp lệ');
  
  const execPrice = (type === 'MP') ? liveData.price : parseFloat(price);
  const totalValue = execPrice * Math.floor(quantity);
  const fee = side === 'BUY' ? totalValue * FEE_BUY : totalValue * FEE_SELL;
  const grandTotal = side === 'BUY' ? totalValue + fee : totalValue - fee;
  
  const userSheet = ss.getSheetByName('Users');
  const userData = userSheet.getDataRange().getValues();
  const uIdx = userData.findIndex(r => r[0] === email);
  if (uIdx === -1) throw new Error('User not found');
  
  let balance = userData[uIdx][1];
  let realizedPnL = 0;

  if (side === 'BUY') {
    if (balance < grandTotal) throw new Error('Số dư không đủ');
    balance -= grandTotal;
    updateHolding(email, symbol, quantity, (totalValue + fee) / quantity, 'BUY');
  } else {
    const holdings = getHoldings(email);
    const pos = holdings.find(h => h.symbol === symbol.toUpperCase());
    if (!pos) throw new Error('Cổ phiếu này bạn chưa nắm giữ trong danh mục');
    if (pos.quantity < quantity) throw new Error('Số lượng cổ phiếu trong danh mục không đủ để bán');
    realizedPnL = grandTotal - (pos.avgPrice * quantity);
    balance += grandTotal;
    updateHolding(email, symbol, quantity, execPrice, 'SELL');
  }
  
  userSheet.getRange(uIdx + 1, 2).setValue(balance);
  logTransaction(email, symbol, quantity, execPrice, side, type, fee, grandTotal, realizedPnL);
  addNotification(email, `Khớp lệnh ${side} ${quantity} ${symbol} tại giá ${execPrice.toLocaleString()}đ.`);
  return { success: true, balance: balance };
}

function updateHolding(email, symbol, quantity, price, side) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName('Holdings') || ss.insertSheet('Holdings');
  const data = sheet.getDataRange().getValues();
  const sym = symbol.toUpperCase();
  const idx = data.findIndex(r => r[0] === email && r[1] === sym);
  
  if (idx === -1 && side === 'BUY') { sheet.appendRow([email, sym, quantity, price]); }
  else if (idx !== -1) {
    let q = data[idx][2], p = data[idx][3];
    if (side === 'BUY') {
      const nQ = q + quantity;
      sheet.getRange(idx+1, 3).setValue(nQ);
      sheet.getRange(idx+1, 4).setValue(((q * p) + (quantity * price)) / nQ);
    } else {
      const nQ = q - quantity;
      if (nQ <= 0) sheet.deleteRow(idx + 1);
      else sheet.getRange(idx+1, 3).setValue(nQ);
    }
  }
}

function getHoldings(email) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Holdings');
  if (!sheet) return [];
  return sheet.getDataRange().getValues().filter(r => r[0] === email && r[2] > 0).map(r => ({ symbol: r[1], quantity: r[2], avgPrice: r[3] }));
}

function getStockData(symbol) {
  const clean = symbol.toUpperCase().trim();
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const fetchSheet = ss.getSheetByName('PriceFetcher');
  const data = fetchSheet.getDataRange().getValues();
  const row = data.find(r => r[0].toString().toUpperCase() === clean);
  
  const refreshSignal = fetchSheet.getRange(1, 6).getValue();
  const formula = `=IFERROR(PRODUCT(IMPORTXML(CONCATENATE("https://finance.vietstock.vn/${clean}-ctcp.htm"; "?v="; $F$1); "//*[@id='stockprice']/span[1]"); 1000); 0)`;
  
  let finalRow = -1;
  if (row) {
    finalRow = data.indexOf(row) + 1;
    fetchSheet.getRange(finalRow, 3).setFormula(formula);
  } else {
    fetchSheet.appendRow([clean, `https://finance.vietstock.vn/${clean}-ctcp.htm`, formula]);
    finalRow = fetchSheet.getLastRow();
  }
  SpreadsheetApp.flush();
  const price = fetchSheet.getRange(finalRow, 3).getValue();
  
  if (!price || price === 0) {
    try {
      const res = UrlFetchApp.fetch(`https://wgateway-finfo.ssi.com.vn/quotes/daily?symbol=${clean}`, { muteHttpExceptions: true });
      const json = JSON.parse(res.getContentText());
      if (json.data && json.data[0]) return { price: json.data[0].lastPrice * 1000, symbol: clean, change: (json.data[0].lastPrice - json.data[0].priorClose) * 1000 };
    } catch(e) {}
  }
  return { price: price || 10000, symbol: clean, source: 'Vietstock' };
}

function getStockHistory(symbol) {
  if (!symbol) return { error: 'Mã không được để trống' };
  const clean = symbol.toUpperCase().trim();
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const dateToday = Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd");

  let cacheSheet = ss.getSheetByName('HistoryCache') || ss.insertSheet('HistoryCache');
  if (cacheSheet.getLastRow() === 0) cacheSheet.appendRow(['Mã', 'Dữ liệu JSON', 'Ngày cập nhật']);
  
  const cacheData = cacheSheet.getDataRange().getValues();
  const cached = cacheData.find(r => r[0] === clean);
  if (cached && cached[2] === dateToday) return { symbol: clean, history: JSON.parse(cached[1]), source: 'Cache' };

  try {
    let fetchSheet = ss.getSheetByName('HistoryFetcher') || ss.insertSheet('HistoryFetcher');
    fetchSheet.clear();
    fetchSheet.getRange("A1").setFormula(`=IMPORTHTML("https://finance.vietstock.vn/${clean}-ctcp.htm"; "table"; 3)`);
    SpreadsheetApp.flush();
    Utilities.sleep(2000);
    const data = fetchSheet.getDataRange().getValues();
    const history = data.slice(1, 7).map(row => ({
      date: (row[0] instanceof Date) ? Utilities.formatDate(row[0], "GMT+7", "dd/MM") : row[0].toString().substring(0, 5),
      price: parseFloat(row[1].toString().replace(',', '.')) * 1000, change: row[2], volume: row[3], foreignBuy: row[6], foreignSell: row[7]
    }));
    if (cached) {
      const rIdx = cacheData.indexOf(cached) + 1;
      cacheSheet.getRange(rIdx, 2).setValue(JSON.stringify(history));
      cacheSheet.getRange(rIdx, 3).setValue(dateToday);
    } else { cacheSheet.appendRow([clean, JSON.stringify(history), dateToday]); }
    return { symbol: clean, history };
  } catch(e) { return { error: e.message }; }
}

function refreshStockPrices() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('PriceFetcher');
  const ts = new Date().getTime();
  sheet.getRange(1, 6).setValue(ts);
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    const formulas = sheet.getRange(2, 1, lastRow - 1, 1).getValues().map(r => [`=IFERROR(PRODUCT(IMPORTXML(CONCATENATE("https://finance.vietstock.vn/${r[0]}-ctcp.htm"; "?v="; $F$1); "//*[@id='stockprice']/span[1]"); 1000); 0)`]);
    sheet.getRange(2, 3, formulas.length, 1).setFormulas(formulas);
  }
  SpreadsheetApp.flush();
  return { success: true, timestamp: ts };
}

function depositFunds(params) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const userSheet = ss.getSheetByName('Users');
  const data = userSheet.getDataRange().getValues();
  const idx = data.findIndex(r => r[0] === params.email);
  if (idx === -1) throw new Error('User not found');
  
  const amt = parseFloat(params.amount);
  const newBal = (data[idx][1] || 0) + amt;
  userSheet.getRange(idx + 1, 2).setValue(newBal);
  
  let depSheet = ss.getSheetByName('Deposits') || ss.insertSheet('Deposits');
  depSheet.appendRow([new Date(), params.email, amt]);
  logTransaction(params.email, 'DEPOSIT', 1, amt, 'IN', 'CASH', 0, amt, 0);
  addNotification(params.email, `Nạp tiền thành công: +${amt.toLocaleString()} đ`);
  return { success: true, balance: newBal };
}

function adjustBalance(params) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const userSheet = ss.getSheetByName('Users');
  const data = userSheet.getDataRange().getValues();
  const idx = data.findIndex(r => r[0] === params.email);
  if (idx === -1) throw new Error('User not found');
  
  const amt = parseFloat(params.amount);
  userSheet.getRange(idx + 1, 2).setValue(amt);
  
  const depSheet = ss.getSheetByName('Deposits');
  if (depSheet) { for (let i = depSheet.getLastRow(); i >= 2; i--) { if (depSheet.getRange(i, 2).getValue() === params.email) depSheet.deleteRow(i); } }
  
  depSheet.appendRow([new Date(), params.email, amt]);
  logTransaction(params.email, 'DEPOSIT', 1, amt, 'IN', 'INITIAL_ADJUST', 0, amt, 0);
  addNotification(params.email, `Thiết lập lại số dư: ${amt.toLocaleString()} đ`);
  return { success: true, balance: amt };
}

function getHistory(email) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('History');
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  const idx = getIndices(data[0]);
  
  return data.slice(1)
    .filter(r => r[idx.email] === email)
    .map(r => {
      const timestamp = r[idx.date] instanceof Date ? r[idx.date].getTime() : r[idx.date];
      return { 
        id: r[10] || timestamp, // Column K as ID or Timestamp
        date: r[idx.date], 
        email: r[idx.email], 
        symbol: r[idx.symbol], 
        side: r[idx.side],
        type: r[idx.type],
        quantity: r[idx.quantity], 
        price: r[idx.price], 
        fee: r[idx.fee], 
        total: r[idx.total], 
        pnl: r[idx.pnl] || 0 
      };
    }).reverse();
}

function deleteTradingTransaction(email, transId) { 
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const historySheet = ss.getSheetByName('History');
  const userSheet = ss.getSheetByName('Users');
  const data = historySheet.getDataRange().getValues();
  const idx = getIndices(data[0]);
  
  // Find row by email AND (Column K ID or Timestamp in Column A)
  const rowIndex = data.findIndex(row => {
    const timestamp = row[idx.date] instanceof Date ? row[idx.date].getTime() : row[idx.date];
    const rowEmail = String(row[idx.email] || "").toLowerCase().trim();
    return rowEmail === email.toLowerCase().trim() && (String(row[10] || "") === String(transId) || String(timestamp) === String(transId));
  });
  
  if (rowIndex === -1) throw new Error('Không tìm thấy giao dịch');
  
  const trans = data[rowIndex];
  const symbol = trans[idx.symbol];
  const side = trans[idx.side];
  const quantity = parseFloat(trans[idx.quantity]) || 0;
  const total = parseFloat(trans[idx.total]) || 0;
  
  // 1. Rollback Balance
  const userData = userSheet.getDataRange().getValues();
  const uIdx = userData.findIndex(r => String(r[0] || "").toLowerCase().trim() === email.toLowerCase().trim());
  if (uIdx !== -1) {
    let balance = parseFloat(userData[uIdx][1]) || 0;
    // BUY -> Delete -> Refund -> Balance +
    // SELL -> Delete -> Undo Sale -> Balance -
    // IN (Deposit) -> Delete -> Undo Deposit -> Balance -
    // OUT (Withdrawal) -> Delete -> Undo Withdraw -> Balance +
    if (side === 'BUY' || side === 'OUT') balance += total;
    else if (side === 'SELL' || side === 'IN') balance -= total;
    userSheet.getRange(uIdx + 1, 2).setValue(balance);
  }

  // 2. Rollback Holdings
  if (symbol !== 'DEPOSIT' && symbol !== 'INITIAL_ADJUST') {
    const holdSheet = ss.getSheetByName('Holdings');
    const holdData = holdSheet.getDataRange().getValues();
    const holdRowIndex = holdData.findIndex(r => 
      String(r[0] || "").toLowerCase().trim() === email.toLowerCase().trim() && 
      String(r[1] || "").toUpperCase().trim() === symbol.toUpperCase().trim()
    );
    
    if (holdRowIndex !== -1) {
      let q = parseFloat(holdData[holdRowIndex][2]) || 0;
      if (side === 'BUY') {
        const nQ = Math.max(0, q - quantity);
        if (nQ <= 0) holdSheet.deleteRow(holdRowIndex + 1);
        else holdSheet.getRange(holdRowIndex + 1, 3).setValue(nQ);
      } else if (side === 'SELL') {
        holdSheet.getRange(holdRowIndex + 1, 3).setValue(q + quantity);
      }
    }
  }

  // 3. Delete from History
  historySheet.deleteRow(rowIndex + 1);
  
  // 4. If Deposit, delete from Deposits sheet
  if (symbol === 'DEPOSIT') {
    const depSheet = ss.getSheetByName('Deposits');
    if (depSheet) {
      const depData = depSheet.getDataRange().getValues();
      const dIdx = depData.findIndex(r => r[1] === email && Math.abs(parseFloat(r[2]) - total) < 1);
      if (dIdx !== -1) depSheet.deleteRow(dIdx + 1);
    }
  }

  addNotification(email, `Đã xóa giao dịch ${symbol} (${side} ${quantity}). Số dư đã được hoàn tác.`);
  return { success: true };
}

function logTransaction(email, symbol, quantity, price, side, type, fee, total, pnl) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName('History') || ss.insertSheet('History');
  const headers = ['Date', 'Email', 'Symbol', 'Side', 'Type', 'Quantity', 'Price', 'Fee', 'Total', 'PnL'];
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
  } else {
    // Ensure correct headers
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
  // Append in correct order matching headers
  sheet.appendRow([new Date(), email, symbol, side, type, quantity, price, fee, total, pnl]);
}

function addNotification(email, message) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName('Notifications') || ss.insertSheet('Notifications');
  if (sheet.getLastRow() === 0) sheet.appendRow(['Date', 'Email', 'Message', 'IsRead']);
  sheet.appendRow([new Date(), email, message, false]);
}

function getNotifications(email) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Notifications');
  if (!sheet) return [];
  const targetEmail = String(email).toLowerCase().trim();
  
  return sheet.getDataRange().getValues()
    .filter(r => String(r[1]).toLowerCase().trim() === targetEmail)
    .map(r => ({ date: r[0], message: r[2], isRead: r[3] }))
    .reverse()
    .slice(0, 20);
}

function markNotificationsRead(email) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Notifications');
  if (!sheet) return { success: true };
  const data = sheet.getDataRange().getValues();
  const user = email.toLowerCase().trim();
  
  // Collect all ranges to update at once to avoid slow API calls in loop
  for (let i = 1; i < data.length; i++) { 
    if (String(data[i][1]).toLowerCase().trim() === user && data[i][3] === false) {
      sheet.getRange(i+1, 4).setValue(true); 
    }
  }
  SpreadsheetApp.flush(); // Force update immediately
  return { success: true };
}

/**
 * HÀM SỬA LỖI CỘT TRONG SHEET HISTORY (CHẠY 1 LẦN TRONG EDITOR NẾU CẦN)
 * Dùng để sửa lại các dòng bị lệch cột do version script cũ (ví dụ dòng số 12)
 */
function FIX_HISTORY_COLUMNS() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('History');
  if (!sheet) return;
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    // Kiểm tra nếu cột Side (D - index 3) là số -> Nghĩa là bị lệch cột (Quantity đang ở Side)
    if (typeof row[3] === 'number') {
      const quantity = row[3];
      const price = row[4];
      const side = row[5];
      const type = row[6];
      
      sheet.getRange(i + 1, 4).setValue(side);     // Column D (Side)
      sheet.getRange(i + 1, 5).setValue(type);     // Column E (Type)
      sheet.getRange(i + 1, 6).setValue(quantity); // Column F (Quantity)
      sheet.getRange(i + 1, 7).setValue(price);    // Column G (Price)
      console.log(`Đã sửa dòng ${i + 1}: ${row[2]}`);
    }
  }
}

/**
 * HÀM KHÔI PHỤC DANH MỤC TỪ LỊCH SỬ (DÙNG KHI DỮ LIỆU BỊ LỆCH)
 * Hàm này sẽ xóa sạch sheet Holdings và tính toán lại dựa trên sheet History
 */
function RECONSTRUCT_HOLDINGS_FROM_HISTORY() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const historySheet = ss.getSheetByName('History');
  const holdSheet = ss.getSheetByName('Holdings') || ss.insertSheet('Holdings');
  
  const historyData = historySheet.getDataRange().getValues();
  if (historyData.length <= 1) return "Không có lịch sử để khôi phục";
  
  const idx = getIndices(historyData[0]);
  const newHoldings = {}; // { "email_symbol": { quantity, totalCost } }

  historyData.slice(1).forEach(row => {
    const email = String(row[idx.email] || "").toLowerCase().trim();
    const symbol = String(row[idx.symbol] || "").toUpperCase().trim();
    
    if (!email || !symbol || symbol === 'DEPOSIT' || symbol === 'INITIAL_ADJUST' || symbol === 'CASH') return;

    // Xử lý dữ liệu bị lệch cột (nếu cột Side là số)
    let side = String(row[idx.side] || "").toUpperCase().trim();
    let qty = parseFloat(row[idx.quantity]) || 0;
    let price = parseFloat(row[idx.price]) || 0;

    if (!isNaN(parseFloat(side))) {
      // Bị lệch: Side đang chứa Quantity, Type đang chứa Price, Quantity đang chứa Side, Price đang chứa Type
      qty = parseFloat(side);
      price = parseFloat(row[idx.type]); // Type column
      side = String(row[idx.quantity]).toUpperCase().trim();
    }

    const key = `${email}_${symbol}`;
    if (!newHoldings[key]) newHoldings[key] = { email, symbol, quantity: 0, totalCost: 0 };

    if (side === 'BUY') {
      newHoldings[key].quantity += qty;
      newHoldings[key].totalCost += (qty * price);
    } else if (side === 'SELL') {
      newHoldings[key].quantity -= qty;
      // Giảm giá vốn theo tỷ lệ (không làm thay đổi giá vốn trung bình khi bán)
      if (newHoldings[key].quantity < 0) newHoldings[key].quantity = 0;
    }
  });

  // Ghi lại vào sheet Holdings
  holdSheet.clear();
  holdSheet.getRange(1, 1, 1, 4).setValues([['Email', 'Symbol', 'Quantity', 'AvgPrice']]);
  
  const rows = [];
  for (let key in newHoldings) {
    const h = newHoldings[key];
    if (h.quantity > 0) {
      const avgPrice = h.totalCost / (h.quantity + (h.quantity === 0 ? 1 : 0)); // Tránh chia cho 0
      rows.push([h.email, h.symbol, h.quantity, avgPrice || 0]);
    }
  }
  
  if (rows.length > 0) {
    holdSheet.getRange(2, 1, rows.length, 4).setValues(rows);
  }
  
  console.log("Đã khôi phục thành công danh mục cho " + rows.length + " mục.");
  return "Đã khôi phục thành công danh mục.";
}

function getUserSettings(email) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('UserSettings');
  if (!sheet) return { menu: {} };
  
  const data = sheet.getDataRange().getValues();
  const user = email.toLowerCase().trim();
  const row = data.find(r => String(r[0] || "").toLowerCase().trim() === user);
  
  if (row && row[1]) {
    try {
      return JSON.parse(row[1]);
    } catch (e) {
      return { menu: {} };
    }
  }
  return { menu: {} };
}

function updateUserSettings(email, settings) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('UserSettings');
  const logSheet = ss.getSheetByName('SettingsHistory');
  const data = sheet.getDataRange().getValues();
  const user = email.toLowerCase().trim();
  const rowIndex = data.findIndex(r => String(r[0] || "").toLowerCase().trim() === user);
  
  const configStr = JSON.stringify(settings);
  const now = new Date();
  
  if (rowIndex === -1) {
    sheet.appendRow([user, configStr, now]);
  } else {
    sheet.getRange(rowIndex + 1, 2).setValue(configStr);
    sheet.getRange(rowIndex + 1, 3).setValue(now);
  }
  
  // Log to history sheet
  if (logSheet) logSheet.appendRow([now, user, configStr]);
  
  addNotification(user, "Cài đặt menu đã được cập nhật thành công.");
  
  return { success: true };
}

/**
 * Xử lý yêu cầu nâng cấp Pro từ người dùng
 */
/**
 * Xử lý yêu cầu nâng cấp Pro từ người dùng (Manual Check)
 */
function submitUpgradeRequest(email, method, fileObj) {
  const ADMIN_EMAIL = 'nbt1024@gmail.com';
  const ssFinance = SpreadsheetApp.openById(FINANCE_SPREADSHEET_ID);
  
  // Không lưu file nữa, chỉ ghi nhận yêu cầu
  const transferCode = `UPGRADE PRO ${email.split('@')[0].toUpperCase()}`;

  // 1. GỬI MAIL THÔNG BÁO CHO ADMIN
  const scriptUrl = "https://script.google.com/macros/s/AKfycbwdW9xxcTVAhlghyO204RrMMqOYiyyI8MNRdQMdHY42HF-CNgAEnkBroBpTdwCOMijz/exec";
  const approveUrl = `${scriptUrl}?action=approveUpgrade&email=${encodeURIComponent(email)}`;
  const rejectUrl = `${scriptUrl}?action=rejectUpgrade&email=${encodeURIComponent(email)}`;

  const body = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
      <div style="background: linear-gradient(135deg, #2563eb, #1e40af); padding: 30px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Yêu cầu nâng cấp PRO</h1>
      </div>
      <div style="padding: 30px; background-color: #ffffff;">
        <p style="margin-bottom: 20px; font-size: 16px; color: #4a5568;">Xin chào Admin, có một yêu cầu nâng cấp tài khoản mới cần bạn kiểm tra:</p>
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 12px; margin-bottom: 30px;">
          <p style="margin: 8px 0;"><strong>Người dùng:</strong> ${email}</p>
          <p style="margin: 8px 0;"><strong>Phương thức:</strong> ${method === 'bank' ? 'Chuyển khoản Ngân hàng' : 'Ví Momo'}</p>
          <p style="margin: 8px 0; color: #d97706;"><strong>Nội dung CK cần check:</strong> <span style="font-weight: bold; font-size: 1.1em;">${transferCode}</span></p>
        </div>
        <div style="display: flex; gap: 12px; justify-content: center;">
          <a href="${approveUrl}" style="background-color: #10b981; color: white; padding: 14px 24px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 14px; text-transform: uppercase;">✔ Duyệt ngay</a>
          <a href="${rejectUrl}" style="background-color: #ef4444; color: white; padding: 14px 24px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 14px; text-transform: uppercase; margin-left: 10px;">✘ Từ chối</a>
        </div>
      </div>
      <div style="background-color: #f1f5f9; padding: 20px; text-align: center; color: #64748b; font-size: 12px;">
        Đây là email tự động từ hệ thống StockSim v2.0
      </div>
    </div>
  `;

  
  MailApp.sendEmail({
    to: ADMIN_EMAIL,
    subject: "🔔 Yêu cầu nâng cấp PRO mới: " + email,
    htmlBody: body
  });

  // 2. GHI LOG VÀO SHEET FINANCE
  try {
    const subLog = ssFinance.getSheetByName('Subscriptions');
    if (subLog) {
      subLog.appendRow([new Date(), email, method, "Kiểm tra nội dung chuyển khoản", 'PENDING', '', '']);
    }
  } catch(e) {
    console.error("Lỗi ghi log Subscription: " + e.message);
  }

  addNotification(email, "Yêu cầu nâng cấp của bạn đã được gửi thành công. Admin sẽ kiểm tra và kích hoạt sớm nhất.");
  return { success: true };
}

/**
 * Thực hiện duyệt hoặc từ chối từ link mail
 */
function processUpgradeAction(email, isApproved) {
  const ssMain = SpreadsheetApp.openById(SPREADSHEET_ID);
  const ssFinance = SpreadsheetApp.openById(FINANCE_SPREADSHEET_ID);
  
  // 1. Update Users sheet (Main)
  const userSheet = ssMain.getSheetByName('Users');
  const userData = userSheet.getDataRange().getValues();
  const uIdx = userData.findIndex(r => String(r[0] || "").toLowerCase().trim() === email.toLowerCase().trim());

  const now = new Date();
  const expiry = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // +1 năm

  if (uIdx !== -1) {
    if (isApproved) {
      userSheet.getRange(uIdx + 1, 5).setValue('PRO');
      userSheet.getRange(uIdx + 1, 6).setValue(now);
      userSheet.getRange(uIdx + 1, 7).setValue(expiry);
    }
  }

  // 2. Update Subscriptions sheet (Finance)
  const subSheet = ssFinance.getSheetByName('Subscriptions');
  if (subSheet) {
    const subData = subSheet.getDataRange().getValues();
    let sIdx = -1;
    for (let i = subData.length - 1; i >= 1; i--) {
      if (String(subData[i][1]).toLowerCase() === email.toLowerCase() && subData[i][4] === 'PENDING') {
        sIdx = i;
        break;
      }
    }

    if (sIdx !== -1) {
      subSheet.getRange(sIdx + 1, 5).setValue(isApproved ? 'APPROVED' : 'REJECTED');
      subSheet.getRange(sIdx + 1, 6).setValue(now);
      if (isApproved) subSheet.getRange(sIdx + 1, 7).setValue(expiry);
    }
  }

  // 3. Notify user (Web & Email)
  let subject, messageBody;
  
  if (isApproved) {
    subject = "🎉 Chúc mừng! StockSim PRO đã được kích hoạt";
    messageBody = `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #10b981;">Nâng cấp thành công!</h2>
        <p>Xin chào,</p>
        <p>Tài khoản <strong>${email}</strong> của bạn đã chính thức được nâng cấp lên gói <strong>STOCKSIM PRO</strong>.</p>
        <p>Bạn có thể truy cập ngay vào Web App để trải nghiệm các tính năng:</p>
        <ul>
          <li>✅ Tự động đồng bộ Gmail ngân hàng</li>
          <li>✅ Báo cáo tài chính chuyên sâu</li>
          <li>✅ Không giới hạn giao dịch</li>
        </ul>
        <p>Cảm ơn bạn đã đồng hành cùng chúng tôi!</p>
        <a href="https://stocksim.vn" style="background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 10px;">Truy cập ngay</a>
      </div>
    `;
    addNotification(email, "Chúc mừng! Tài khoản của bạn đã được nâng cấp lên PRO thành công.");
  } else {
    subject = "⚠️ Thông báo về yêu cầu nâng cấp StockSim PRO";
    messageBody = `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #ef4444;">Yêu cầu chưa được duyệt</h2>
        <p>Xin chào,</p>
        <p>Chúng tôi rất tiếc phải thông báo rằng yêu cầu nâng cấp gói PRO cho tài khoản <strong>${email}</strong> chưa được thông qua.</p>
        <p><strong>Lý do có thể:</strong> Nội dung chuyển khoản chưa khớp hoặc chưa nhận được thanh toán.</p>
        <p>Vui lòng liên hệ lại với Admin để được hỗ trợ kiểm tra nhé.</p>
      </div>
    `;
    addNotification(email, "Yêu cầu nâng cấp PRO của bạn không được duyệt. Vui lòng liên hệ hỗ trợ.");
  }
  
  // Gửi email cho người dùng
  try {
    MailApp.sendEmail({
      to: email,
      subject: subject,
      htmlBody: messageBody
    });
  } catch (e) {
    console.error("Không gửi được mail cho User: " + e.message);
  }
  
  return true;
}

/**
 * Hàm giả để ép Google nhận diện lại quyền (Force Scopes)
 * KHÔNG CHẠY HÀM NÀY
 */
function _FORCE_SCOPES_REGISTRATION_() {
  try {
    var a = DriveApp.createFile("dummy", "content");
    var b = GmailApp.getInboxUnreadCount();
    var c = UrlFetchApp.fetch("http://google.com");
    SpreadsheetApp.getActiveSpreadsheet();
  } catch(e) {}
}

/**
 * HÀM CHẨN ĐOÁN GIAO DỊCH GMAIL
 * Cách dùng: Chọn hàm này trong danh sách -> Nhấn Run -> Xem "Nhật ký thực thi"
 */
function DEBUG_GMAIL_SYNC() {
  const query = 'newer_than:30d (subject:("biên lai" OR "biến động" OR "giao dịch" OR "thanh toán" OR "nạp thẻ" OR "số dư") OR from:VCBDigibank OR from:no-reply@techcombank.com.vn OR from:info@myvib.vib.com.vn)';
  console.log("--- BẮT ĐẦU CHẨN ĐOÁN (Fuzzy Scanner v7) ---");
  const threads = GmailApp.search(query, 0, 3);
  
  threads.forEach((thread, i) => {
    const msg = thread.getMessages()[0];
    const id = "EMAIL_" + msg.getId();
    console.log(`\n[Email #${i+1}] ID: ${id}`);
    
    // Tạo mock indices cho 16 cột
    const headers = ['ID', 'Date', 'Amount', 'Type', 'Category', 'Description', 'Source', 'Status', 'UserEmail', 'TransDate', 'OrderNo', 'SourceAcc', 'Remitter', 'TargetAcc', 'TargetName', 'RawAmount'];
    const mockIdx = getIndices(headers);
    
    const result = processEmailParsing(msg.getSubject(), msg.getBody(), msg.getPlainBody(), msg.getFrom(), msg.getDate(), id, "nbt1024@gmail.com", 16, mockIdx);
    
    if (result) {
      console.log("✅ THÀNH CÔNG! Dữ liệu bóc tách:");
      headers.forEach((h, idx) => {
        if (result[idx]) console.log(`${h}: ${result[idx]}`);
      });
    } else {
      console.error(`❌ THẤT BẠI: Regex không khớp với nội dung email này.`);
    }
  });
  console.log("\n--- KẾT THÚC ---");
}

/**
 * HÀM BẢO TRÌ: TÁI CẤU TRÚC TOÀN BỘ CƠ SỞ DỮ LIỆU TÀI CHÍNH
 * Cách dùng: Chọn hàm này trong Apps Script -> Nhấn Run.
 * CẢNH BÁO: Hàm này sẽ xóa toàn bộ dữ liệu giao dịch cũ để thiết lập lại khung 16 cột chuẩn.
 */
function RESTRUCTURE_FINANCE_DATABASE() {
  const ss = SpreadsheetApp.openById(FINANCE_SPREADSHEET_ID);
  const sheetsToReset = ['Financial_Transactions', 'Manual_Transactions'];
  
  const newHeaders = [
    'ID', 'Date', 'Amount', 'Type', 'Category', 'Description', 
    'Source', 'Status', 'UserEmail', 'TransDate', 'OrderNo', 
    'SourceAcc', 'Remitter', 'TargetAcc', 'TargetName', 'RawAmount'
  ];
  
  sheetsToReset.forEach(name => {
    let sheet = ss.getSheetByName(name);
    if (sheet) {
      sheet.clear(); // Xóa sạch dữ liệu và định dạng cũ
      sheet.getRange(1, 1, 1, newHeaders.length)
           .setValues([newHeaders])
           .setFontWeight('bold')
           .setBackground('#f3f4f6');
      sheet.setFrozenRows(1);
      
      // Xóa các cột thừa nếu có (đảm bảo chỉ có đúng 16 cột)
      const maxCols = sheet.getMaxColumns();
      if (maxCols > newHeaders.length) {
        sheet.deleteColumns(newHeaders.length + 1, maxCols - newHeaders.length);
      }
    } else {
      sheet = ss.insertSheet(name);
      sheet.appendRow(newHeaders);
      sheet.getRange(1, 1, 1, newHeaders.length).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }
  });
  
  console.log("✅ Đã tái cấu trúc Database Tài chính thành công!");
  console.log("Khung 16 cột chuẩn đã sẵn sàng cho việc cào lại dữ liệu.");
  return "Thành công! Hãy chạy lại Gmail Sync để cào dữ liệu mới.";
}
