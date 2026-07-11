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

// Đã gỡ bỏ ensureAccountsSheet_ vì giờ dùng chung SHEETS.USERS

// Hash có muối theo tên (không dùng để bảo mật dữ liệu nhạy cảm, chỉ để
// tránh lưu mật khẩu dạng chữ thô trong Sheets)
function hashPassword_(name, password) {
  const raw = "hapu-nhatky::" + String(name).trim().toLowerCase() + "::" + String(password);
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, raw, Utilities.Charset.UTF_8);
  return bytes.map(function(b) { return ((b < 0 ? b + 256 : b)).toString(16).padStart(2, "0"); }).join("");
}

function findAccountRow_(sheet, username) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return 0;
  const target = String(username).trim().toLowerCase();
  const names = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (let i = 0; i < names.length; i++) {
    if (String(names[i][0]).trim().toLowerCase() === target) return i + 2;
  }
  return 0;
}

function getUserTeamGroup_(username) {
  const sheet = getSheet(SHEETS.USERS);
  if (!username) return "";
  const rowIndex = findAccountRow_(sheet, username);
  if (rowIndex > 0) {
    return String(sheet.getRange(rowIndex, 5).getValue() || "").trim(); // Teams column
  }
  return "";
}

function handleListAccounts(e) {
  const sheet = getSheet(SHEETS.USERS);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return contentResponse({ status: "success", names: [] });
  // Cột 1 là Username
  const names = sheet.getRange(2, 1, lastRow - 1, 1).getValues()
    .map(function(r) { return String(r[0]).trim(); })
    .filter(Boolean)
    .sort();
  return contentResponse({ status: "success", names: names });
}

function handleNhatKyRegister(params) {
  const payload = params.payload || {};
  const username = String(payload.name || "").trim();
  const fullName = String(payload.fullName || username).trim(); // Nếu không có, dùng username
  const password = String(payload.password || "");

  if (!username) return contentResponse({ status: "error", message: "Thiếu tên đăng nhập" });
  if (password.length < 4) return contentResponse({ status: "error", message: "Mật khẩu tối thiểu 4 ký tự" });

  const sheet = getSheet(SHEETS.USERS);
  if (findAccountRow_(sheet, username) > 0) {
    return contentResponse({ status: "error", message: "Tên đăng nhập này đã tồn tại" });
  }

  // ["Username","FullName","PasswordHash","Role","Teams","CreatedAt","LastLoginAt"]
  sheet.appendRow([username, fullName, hashPassword_(username, password), "Operator", "- Chưa phân tổ -", new Date(), ""]);
  writeAuditLog(username, "nhatkyRegister", username, "Tạo tài khoản qua trang nhật ký");
  return contentResponse({ status: "success", name: username, teamGroup: "- Chưa phân tổ -" });
}

function handleNhatKyLogin(params) {
  const payload = params.payload || params || {};
  const username = String(payload.name || payload.username || "").trim();
  const password = String(payload.password || payload.pin || "");

  if (!username || !password) return contentResponse({ status: "error", message: "Thiếu tên đăng nhập hoặc mật khẩu" });

  const sheet = getSheet(SHEETS.USERS);
  const rowIndex = findAccountRow_(sheet, username);
  if (rowIndex === 0) return contentResponse({ status: "error", message: "Tài khoản không tồn tại" });

  const storedHash = String(sheet.getRange(rowIndex, 3).getValue()).trim();
  const inputPass = password.trim();
  const inputHash = hashPassword_(username, inputPass);

  if (storedHash !== inputHash && storedHash !== inputPass) {
    return contentResponse({ status: "error", message: "Sai mật khẩu" });
  }

  sheet.getRange(rowIndex, 7).setValue(new Date()); // LastLoginAt
  const teamGroup = String(sheet.getRange(rowIndex, 5).getValue() || "").trim();
  writeAuditLog(username, "nhatkyLogin", username, "Đăng nhập trang nhật ký");

  return contentResponse({ status: "success", name: username, teamGroup: teamGroup });
}
