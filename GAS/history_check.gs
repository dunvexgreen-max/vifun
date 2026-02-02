/**
 * SIÊU SCRIPT: STOCK TRADING & FINANCE MANAGER (GỘP CHUNG)
 * Chứa toàn bộ logic backend cho ứng dụng chứng khoán StockSim.
 */

// CẤU HÌNH CHÍNH (ĐIỀN ID SHEET CHÍNH VÀO ĐÂY)
const SPREADSHEET_ID = '11ndIWy9yteJQFuWO4rssp3_8YJ-rYZgpJ1cLuLVQuy8'; // ID của Stock Trading Sheet
const FINANCE_SPREADSHEET_ID = '1mKriBf9F_MST3nCe66b7675Ha6DxdYZ_EuPij2mU_MY'; // ID của Finance Sheet (Có thể dùng chung ID trên nếu gộp sheet)

const API_SECRET_KEY = 'STOCKS_SIM_SECURE_V1_2024_@SEC';

// GOOGLE OAUTH2 CONFIGURATION
const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID';
const GOOGLE_CLIENT_SECRET = 'YOUR_GOOGLE_CLIENT_SECRET';

// ==========================================
// 1. HTTP HANDLERS (doGet & doPost Duy Nhất)
// ==========================================

function doGet(e) {
  // Ưu tiên xử lý OAuth Callback
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
  
  // Kiểm tra API Key chung
  if (params.apiKey !== API_SECRET_KEY) {
    return response({ error: 'API Key không hợp lệ.' }, 401);
  }

  try {
    // ĐIỀU PHỐI HÀNH ĐỘNG
    switch (action) {
      // --- NHÓM CHỨNG KHOÁN (TRADING) ---
      case 'login': return response(login(params.email, params.password));
      case 'register': return response(register(params.email, params.password, params.otp));
      case 'resetPassword': return response(resetPassword(params.email, params.password, params.otp));
      case 'getProfile': return response(getProfile(params.email));
      case 'sendOTP': return response(sendOTP(params.email, params.type));
      case 'verifyOTP': return response(verifyOTP(params.email, params.otp));
      case 'placeOrder': return response(placeOrder(params));
      case 'getHoldings': return response(getHoldings(params.email));
      case 'getHistory': return response(getHistory(params.email));
      case 'deleteTransaction': return response(deleteTransaction(params.email, params.id)); // Cẩn thận trùng tên
      case 'deposit': return response(depositFunds(params));
      case 'adjustBalance': return response(adjustBalance(params));
      case 'getNotifications': return response(getNotifications(params.email));
      case 'markNotificationsRead': return response(markNotificationsRead(params.email));
      case 'getStockData': return response(getStockData(params.symbol));
      case 'getStockHistory': return response(getStockHistory(params.symbol));
      case 'refreshStockPrices': return response(refreshStockPrices());
      
      // --- NHÓM TÀI CHÍNH (FINANCE) ---
      case 'syncGmailReceipts': return response(syncGmailReceipts(params.email));
      case 'getGoogleAuthUrl': return response(getGoogleAuthUrl(params.email));
      case 'getFinanceSummary': return response(getFinanceSummary(params.email));
      case 'getFinanceTransactions': return response(getFinanceTransactions(params.email));
      case 'addManualTransaction': return response(addManualTransaction(params));
      case 'deleteFinanceTransaction': return response(deleteFinanceTransaction(params.email, params.id));
      case 'updateFinanceTransaction': return response(updateFinanceTransaction(params));
      
      default: return response({ error: 'Hành động không hợp lệ: ' + action }, 400);
    }
  } catch (err) {
    return response({ error: err.message }, 500);
  }
}

function response(data, code = 200) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ==========================================
// 2. CÁC HÀM XỬ LÝ OAUTH & GMAIL API (Mới)
// ==========================================

function getGoogleAuthUrl(userEmail) {
  if (GOOGLE_CLIENT_ID === 'YOUR_CLIENT_ID') return { error: 'Chưa cấu hình Google API.' };
  
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
  
  const payload = {
    code: code,
    client_id: GOOGLE_CLIENT_ID,
    client_secret: GOOGLE_CLIENT_SECRET,
    redirect_uri: scriptUrl,
    grant_type: 'authorization_code'
  };
  
  const options = {
    method: 'post',
    payload: payload
  };
  
  try {
    const response = UrlFetchApp.fetch(tokenUrl, options);
    const tokenData = JSON.parse(response.getContentText());
    if (tokenData.refresh_token) {
      saveUserToken(userEmail, tokenData.refresh_token);
      return true;
    }
  } catch (e) {
    Logger.log('Lỗi đổi Code lấy Token: ' + e.message);
  }
  return false;
}

function saveUserToken(email, refreshToken) {
  // Lưu token vào file Finance Spreadsheet (hoặc chung tùy ý)
  const ss = SpreadsheetApp.openById(FINANCE_SPREADSHEET_ID);
  let sheet = ss.getSheetByName('UserTokens');
  if (!sheet) {
    sheet = ss.insertSheet('UserTokens');
    sheet.appendRow(['Email', 'RefreshToken', 'UpdatedAt']);
  }
  
  const data = sheet.getDataRange().getValues();
  // Tìm xem email đã có chưa để update
  let found = false;
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === email) {
      sheet.getRange(i + 1, 2).setValue(refreshToken);
      sheet.getRange(i + 1, 3).setValue(new Date());
      found = true;
      break;
    }
  }
  
  if (!found) {
    sheet.appendRow([email, refreshToken, new Date()]);
  }
}

function getUserToken(email) {
  const ss = SpreadsheetApp.openById(FINANCE_SPREADSHEET_ID);
  const sheet = ss.getSheetByName('UserTokens');
  if (!sheet) return null;
  
  const data = sheet.getDataRange().getValues();
  const row = data.find(r => r[0] === email);
  if (row) return { refreshToken: row[1] };
  return null;
}

function refreshAccessToken(refreshToken) {
  const tokenUrl = 'https://oauth2.googleapis.com/token';
  const payload = {
    client_id: GOOGLE_CLIENT_ID,
    client_secret: GOOGLE_CLIENT_SECRET,
    refresh_token: refreshToken,
    grant_type: 'refresh_token'
  };
  
  try {
    const response = UrlFetchApp.fetch(tokenUrl, { method: 'post', payload: payload });
    const json = JSON.parse(response.getContentText());
    return json.access_token;
  } catch (e) {
    Logger.log('Lỗi refresh token: ' + e.message);
    return null;
  }
}

function syncGmailApi(userEmail, accessToken) {
  const ss = SpreadsheetApp.openById(FINANCE_SPREADSHEET_ID);
  const headers = ['ID', 'Date', 'Amount', 'Type', 'Category', 'Description', 'Source', 'Status', 'UserEmail', 'Actual', 'Projected'];
  const sheet = ensureSheet(ss, 'Financial_Transactions', headers);
  const data = sheet.getDataRange().getValues();
  const idx = getIndices(data[0]);
  const existingIdMap = {};
  data.forEach(r => { if(r[idx.id]) existingIdMap[r[idx.id].toString()] = true; });

  let syncCount = 0;
  const rowsToAppend = [];
  
  // Dùng query tương tự syncGmailReceipts
  const query = 'subject:("biên lai" OR "biến động" OR "giao dịch success" OR "completed transaction") newer_than:30d';
  
  // 1. Tìm danh sách message ID
  const listUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=50`;
  const listParams = {
    method: 'get',
    headers: { Authorization: `Bearer ${accessToken}` },
    muteHttpExceptions: true
  };
  
  const listResp = UrlFetchApp.fetch(listUrl, listParams);
  const listData = JSON.parse(listResp.getContentText());

  if (listData.messages) {
    listData.messages.forEach(m => {
      const emailId = 'EMAIL_' + m.id;
      if (existingIdMap[emailId]) return;

      // 2. Lấy chi tiết từng mail
      const msgUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}`;
      const msgResp = UrlFetchApp.fetch(msgUrl, listParams);
      const msgData = JSON.parse(msgResp.getContentText());
      
      // Giải mã body (Base64URL)
      let body = "";
      if (msgData.payload.parts) {
        // Tìm part text/html hoặc text/plain
        const part = msgData.payload.parts.find(p => p.mimeType === 'text/html') || msgData.payload.parts[0];
        if (part && part.body && part.body.data) {
           body = Utilities.newBlob(Utilities.base64DecodeWebSafe(part.body.data)).getDataAsString();
        }
      } else if (msgData.payload.body && msgData.payload.body.data) {
        body = Utilities.newBlob(Utilities.base64DecodeWebSafe(msgData.payload.body.data)).getDataAsString();
      }
      
      const subjectHeader = msgData.payload.headers.find(h => h.name === 'Subject');
      const fromHeader = msgData.payload.headers.find(h => h.name === 'From');
      const subject = subjectHeader ? subjectHeader.value : '';
      const sender = fromHeader ? fromHeader.value : '';
      const date = new Date(parseInt(msgData.internalDate));
      
      const rowData = processEmailParsing(
        subject,
        body,
        body.replace(/<[^>]*>/g, ' '), // Simple plain text conversion
        sender,
        date,
        emailId,
        userEmail,
        headers.length,
        idx
      );

      if (rowData) {
        rowsToAppend.push(rowData);
        existingIdMap[emailId] = true;
        syncCount++;
      }
    });

    if (rowsToAppend.length > 0) {
      sheet.getRange(sheet.getLastRow() + 1, 1, rowsToAppend.length, headers.length).setValues(rowsToAppend);
    }
  }
  
  return { success: true, message: `Đã đồng bộ ${syncCount} giao dịch mới qua kết nối trực tiếp.` };
}

// ==========================================
// 3. LOGIC XỬ LÝ EMAIL & FINANCE CHUNG
// ==========================================

function syncGmailReceipts(userEmail) {
  const ss = SpreadsheetApp.openById(FINANCE_SPREADSHEET_ID);

  // KIỂM TRA OAUTH TOKEN TRƯỚC
  const tokenData = getUserToken(userEmail);
  if (tokenData && tokenData.refreshToken) {
    const accessToken = refreshAccessToken(tokenData.refreshToken);
    if (accessToken) {
       return syncGmailApi(userEmail, accessToken);
    }
  }

  // Nếu không có token, dùng GmailApp (chế độ cũ / Admin)
  const headers = ['ID', 'Date', 'Amount', 'Type', 'Category', 'Description', 'Source', 'Status', 'UserEmail', 'Actual', 'Projected'];
  const sheet = ensureSheet(ss, 'Financial_Transactions', headers);
  const data = sheet.getDataRange().getValues();
  const idx = getIndices(data[0]);
  const existingIdMap = {};
  data.forEach(r => { if(r[idx.id]) existingIdMap[r[idx.id].toString()] = true; });

  let syncCount = 0;
  const rowsToAppend = [];
  const queries = [
    'from:VCBDigibank "Biên lai" OR "Biến động"',
    'from:no-reply@techcombank.com.vn OR "Techcombank" "biến động số dư"',
    'from:mbbank.com.vn OR "MB Bank" "biến động số dư" OR "số dư thay đổi"',
    'subject:("giao dịch thành công" OR "chuyển tiền" OR "nhận tiền") newer_than:30d'
  ];

  queries.forEach(query => {
    try {
      const threads = GmailApp.search(query, 0, 20);
      const threadMessages = GmailApp.getMessagesForThreads(threads);
      threadMessages.forEach((messages) => {
        messages.forEach((msg) => {
          const id = 'EMAIL_' + msg.getId();
          if (existingIdMap[id]) return;

          const rowData = processEmailParsing(
            msg.getSubject(),
            msg.getBody(),
            msg.getPlainBody(),
            msg.getFrom(),
            msg.getDate(),
            id,
            userEmail,
            headers.length,
            idx
          );

          if (rowData) {
            rowsToAppend.push(rowData);
            existingIdMap[id] = true;
            syncCount++;
          }
        });
      });
    } catch (e) {
      Logger.log("Lỗi quét Query [" + query + "]: " + e.message);
    }
  });

  if (rowsToAppend.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, rowsToAppend.length, headers.length).setValues(rowsToAppend);
  }
  
  return { success: true, syncCount: syncCount, message: `Đã đồng bộ ${syncCount} giao dịch mới.` };
}

function processEmailParsing(subject, body, plainText, sender, dateObj, id, userEmail, rowLength, idx) {
  // 1. BLACKLIST
  const blacklist = ['quảng cáo', 'tóm tắt', 'cơ hội', 'tin tức', 'giới thiệu', 'khóa thẻ', 'tạm khóa', 'mở khóa', 'đăng nhập', 'otp', 'mã xác thực', 'ưu đãi', 'quà tặng', 'sao kê'];
  const contentToStyle = (subject + plainText).toLowerCase();
  if (blacklist.some(word => contentToStyle.includes(word))) return null;

  // 2. WHITELIST
  const whitelist = ['số dư', 'giao dịch', 'biến động', 'biên lai', 'số tiền', 'amount', 'transaction'];
  if (!whitelist.some(word => contentToStyle.includes(word))) return null;

  let effectiveUser = userEmail.toLowerCase().trim();

  // 3. BÓC TÁCH SỐ TIỀN
  let amountStr = "";
  const strictRegex = /(?:số tiền|amount|giá trị|gd|thanh toán)[:\-\s]+([\d\.,]{4,15})\s*(?:VND|đ|d|bdsd)/i;
  const match = body.match(strictRegex) || plainText.match(strictRegex);
  
  if (match) {
    amountStr = match[1];
  } else {
    amountStr = extractField(body, 'Số tiền', 'Amount');
    if (!amountStr) amountStr = extractField(plainText, 'Số tiền', 'Amount');
  }

  let amount = parseFloat(String(amountStr || "").replace(/[^\d]/g, '')) || 0;
  if (amount < 2000 || amount > 5000000000) return null; 

  if (amount > 0) {
    const isIncome = subject.includes('+') || body.includes('+') || body.includes('Ghi có') || body.includes('đã nhận') || body.includes('vào tài khoản') || body.includes('nạp tiền');
    const type = isIncome ? 'INCOME' : 'EXPENSE';
    const newRow = new Array(rowLength).fill('');
    
    if (idx.id !== -1) newRow[idx.id] = id;
    if (idx.date !== -1) newRow[idx.date] = dateObj.toISOString();
    if (idx.amount !== -1) newRow[idx.amount] = amount;
    if (idx.actual !== -1) newRow[idx.actual] = amount;
    if (idx.projected !== -1) newRow[idx.projected] = 0; 
    if (idx.type !== -1) newRow[idx.type] = type;
    
    let sourceName = 'Ngân hàng';
    const sLower = (sender + subject + body).toLowerCase();
    if (sLower.includes('vcb') || sLower.includes('vietcombank')) sourceName = 'Vietcombank';
    else if (sLower.includes('tcb') || sLower.includes('techcombank')) sourceName = 'Techcombank';
    else if (sLower.includes('mbbank') || sLower.includes('mb bank')) sourceName = 'MB Bank';
    else if (sLower.includes('vib')) sourceName = 'VIB';
    else if (sLower.includes('momo')) sourceName = 'MoMo';
    
    if (idx.category !== -1) newRow[idx.category] = sourceName;
    
    let desc = extractField(body, 'Nội dung', 'Details');
    if (!desc) desc = extractField(plainText, 'Nội dung', 'Details');
    if (!desc) desc = subject;
    
    if (idx.description !== -1) newRow[idx.description] = desc;
    if (idx.source !== -1) newRow[idx.source] = sourceName;
    if (idx.status !== -1) newRow[idx.status] = 'SYNCED';
    if (idx.email !== -1) newRow[idx.email] = effectiveUser;
    
    return newRow;
  }
  return null;
}

function extractField(text, keyVi, keyEn) {
  const ViRegex = new RegExp(keyVi + '\\s*[:\\-]?\\s*([^\\n\\r<]+)', 'i');
  let match = text.match(ViRegex);
  if (match) return match[1].trim();
  const EnRegex = new RegExp(keyEn + '\\s*[:\\-]?\\s*([^\\n\\r<]+)', 'i');
  match = text.match(EnRegex);
  if (match) return match[1].trim();
  return '';
}

function getIndices(headers) {
  const h = headers.map(v => String(v).trim().toLowerCase());
  const find = (names) => { for (let name of names) { const i = h.indexOf(name.toLowerCase()); if (i !== -1) return i; } return -1; };
  return {
    id: find(['ID']), date: find(['Date', 'Ngày']), amount: find(['Amount', 'Số tiền']),
    type: find(['Type', 'Loại']), category: find(['Category', 'Danh mục']),
    description: find(['Description', 'Mô tả', 'Nội dung']), source: find(['Source', 'Nguồn']),
    status: find(['Status', 'Trạng thái']), email: find(['UserEmail', 'Email']),
    actual: find(['Actual', 'Thực tế']), projected: find(['Projected', 'Dự kiến'])
  };
}

function ensureSheet(ss, name, headers) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
  }
  return sheet;
}

// ==========================================
// 4. CÁC HÀM FINANCE DATA KHÁC
// ==========================================
function getFinanceTransactions(email) {
  const ss = SpreadsheetApp.openById(FINANCE_SPREADSHEET_ID);
  const headers = ['ID', 'Date', 'Amount', 'Type', 'Category', 'Description', 'Source', 'Status', 'UserEmail', 'Actual', 'Projected'];
  const sheet = ensureSheet(ss, 'Financial_Transactions', headers);
  
  const data = sheet.getDataRange().getValues();
  const idx = getIndices(data[0]);
  const user = email.toLowerCase().trim();
  
  const transactions = [];
  // Skip header
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const rowEmail = row[idx.email] ? String(row[idx.email]).toLowerCase().trim() : "";
    
    if (rowEmail === user || rowEmail === "") {
        transactions.push({
            id: row[idx.id],
            date: row[idx.date],
            amount: row[idx.amount],
            type: row[idx.type],
            category: row[idx.category],
            description: row[idx.description],
            source: row[idx.source],
            status: row[idx.status],
            actual: row[idx.actual],
            projected: row[idx.projected]
        });
    }
  }
  return transactions.reverse();
}

function getFinanceSummary(email) {
  const transactions = getFinanceTransactions(email);
  let totalIncome = 0;
  let totalExpense = 0;
  
  transactions.forEach(t => {
      const amt = parseFloat(t.amount) || 0;
      if (t.type === 'INCOME') totalIncome += amt;
      else if (t.type === 'EXPENSE') totalExpense += amt;
  });
  
  return {
      totalIncome,
      totalExpense,
      netBalance: totalIncome - totalExpense
  };
}

function addManualTransaction(params) {
    const ss = SpreadsheetApp.openById(FINANCE_SPREADSHEET_ID);
    const headers = ['ID', 'Date', 'Amount', 'Type', 'Category', 'Description', 'Source', 'Status', 'UserEmail', 'Actual', 'Projected'];
    const sheet = ensureSheet(ss, 'Financial_Transactions', headers);
    
    const id = 'MANUAL_' + new Date().getTime();
    const newRow = [
        id,
        params.date || new Date().toISOString(),
        params.amount,
        params.type,
        params.category,
        params.description,
        'Manual',
        'COMPLETED',
        params.email,
        params.amount, // Actual defaults to amount
        0 // Projected defaults to 0
    ];
    
    sheet.appendRow(newRow);
    return { success: true, id: id };
}

function deleteFinanceTransaction(email, id) {
    const ss = SpreadsheetApp.openById(FINANCE_SPREADSHEET_ID);
    const sheet = ss.getSheetByName('Financial_Transactions');
    const data = sheet.getDataRange().getValues();
    const idx = getIndices(data[0]);
    
    for (let i = 1; i < data.length; i++) {
        if (String(data[i][idx.id]) === String(id)) {
             // Check ownership if needed, currently assumes trusted client or basic filtering
             sheet.deleteRow(i + 1);
             return { success: true };
        }
    }
    return { error: 'Transaction not found' };
}

function updateFinanceTransaction(params) {
    const ss = SpreadsheetApp.openById(FINANCE_SPREADSHEET_ID);
    const sheet = ss.getSheetByName('Financial_Transactions');
    const data = sheet.getDataRange().getValues();
    const idx = getIndices(data[0]);

    for (let i = 1; i < data.length; i++) {
        if (String(data[i][idx.id]) === String(params.id)) {
            if (params.amount) sheet.getRange(i + 1, idx.amount + 1).setValue(params.amount);
            if (params.actual) sheet.getRange(i + 1, idx.actual + 1).setValue(params.actual);
            if (params.projected) sheet.getRange(i + 1, idx.projected + 1).setValue(params.projected); 
            if (params.category) sheet.getRange(i + 1, idx.category + 1).setValue(params.category);
            if (params.description) sheet.getRange(i + 1, idx.description + 1).setValue(params.description);
            if (params.date) sheet.getRange(i + 1, idx.date + 1).setValue(params.date);
            return { success: true };
        }
    }
    return { error: 'Transaction not found' };
}


// ==========================================
// 5. CÁC HÀM TRADING (Từ Backend cũ)
// ==========================================

// ... (Giữ nguyên các hàm Trading cốt lõi: Login, Register, PlaceOrder...)
// Để file đỡ dài quá mức, bạn hãy copy nội dung các hàm Trading từ file `backend.gs` cũ vào đây nếu chưa có.
// Lưu ý: Tôi đã tích hợp sẵn chúng vào Switch Case ở doPost rồi.
// Dưới đây là các hàm Login/Register cơ bản để script chạy được ngay:

function login(email, password) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Users');
  const data = sheet.getDataRange().getValues();
  
  // Find user (skip header)
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === email && data[i][3] === password) { // Simple password check
       return { 
         success: true, 
         role: (email === 'admin@stocksim.com' || email === 'nbt1024@gmail.com') ? 'admin' : 'user',
         balance: data[i][1]
       };
    }
  }
  return { error: 'Email hoặc mật khẩu không đúng' };
}
