// ==========================================
// 15_NhatKyAuth.gs — TÀI KHOẢN ĐĂNG NHẬP TRANG NHATKY
// ==========================================
// Trước đây trang nhatky "đăng nhập" chỉ bằng cách chọn tên — ai cũng có
// thể chọn tên người khác rồi ghi nhật ký hộ. Module này thêm tài khoản
// thật (họ tên + mật khẩu tự đặt), lưu mật khẩu dạng hash, không lưu chữ
// thô:
// - GET  action=nhatkyAccounts              → danh sách tên đã có tài khoản
// - POST action=nhatkyRegister {name,password} → tạo tài khoản mới
// - POST action=nhatkyLogin    {name,password} → xác thực đăng nhập

function ensureAccountsSheet_() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName("NhatKyAccounts");
  const headers = ["Name", "PasswordHash", "CreatedAt", "LastLoginAt"];

  if (!sheet) sheet = ss.insertSheet("NhatKyAccounts");
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight("bold");
  }
  return sheet;
}

// Hash có muối theo tên (không dùng để bảo mật dữ liệu nhạy cảm, chỉ để
// tránh lưu mật khẩu dạng chữ thô trong Sheets)
function hashPassword_(name, password) {
  const raw = "hapu-nhatky::" + String(name).trim().toLowerCase() + "::" + String(password);
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, raw, Utilities.Charset.UTF_8);
  return bytes.map(function(b) { return ((b < 0 ? b + 256 : b)).toString(16).padStart(2, "0"); }).join("");
}

function findAccountRow_(sheet, name) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return 0;
  const target = String(name).trim().toLowerCase();
  const names = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (let i = 0; i < names.length; i++) {
    if (String(names[i][0]).trim().toLowerCase() === target) return i + 2;
  }
  return 0;
}

function handleListAccounts(e) {
  const sheet = ensureAccountsSheet_();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return contentResponse({ status: "success", names: [] });
  const names = sheet.getRange(2, 1, lastRow - 1, 1).getValues()
    .map(function(r) { return String(r[0]).trim(); })
    .filter(Boolean)
    .sort();
  return contentResponse({ status: "success", names: names });
}

function handleNhatKyRegister(params) {
  const payload = params.payload || {};
  const name = String(payload.name || "").trim();
  const password = String(payload.password || "");

  if (!name) return contentResponse({ status: "error", message: "Thiếu họ tên" });
  if (password.length < 4) return contentResponse({ status: "error", message: "Mật khẩu tối thiểu 4 ký tự" });

  const sheet = ensureAccountsSheet_();
  if (findAccountRow_(sheet, name) > 0) {
    return contentResponse({ status: "error", message: "Tên này đã có tài khoản — hãy đăng nhập thay vì tạo mới" });
  }

  sheet.appendRow([name, hashPassword_(name, password), new Date(), new Date()]);
  writeAuditLog(name, "nhatkyRegister", name, "Tạo tài khoản trang nhật ký");
  return contentResponse({ status: "success", name: name });
}

function handleNhatKyLogin(params) {
  const payload = params.payload || {};
  const name = String(payload.name || "").trim();
  const password = String(payload.password || "");

  if (!name || !password) return contentResponse({ status: "error", message: "Thiếu tên hoặc mật khẩu" });

  const sheet = ensureAccountsSheet_();
  const rowIndex = findAccountRow_(sheet, name);
  if (rowIndex === 0) return contentResponse({ status: "error", message: "Chưa có tài khoản với tên này — hãy tạo tài khoản mới" });

  const stored = String(sheet.getRange(rowIndex, 2).getValue());
  if (stored !== hashPassword_(name, password)) {
    return contentResponse({ status: "error", message: "Sai mật khẩu" });
  }

  sheet.getRange(rowIndex, 4).setValue(new Date());
  return contentResponse({ status: "success", name: name });
}
