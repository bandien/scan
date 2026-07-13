// ==========================================
// 15_NhatKyAuth.gs - NhatKy account login
// ==========================================
// Tài khoản dùng chung duy nhất trong sheet Users:
// Username | PIN | Role | Teams | Ghi chú | Cập nhật lúc | Cập nhật bởi | Phone | Họ và tên

const NHATKY_SESSION_CACHE_SECONDS = 21600;
const NHATKY_SESSION_DAYS = 30;
const NHATKY_SESSION_PREFIX = "nhatky_session_";

function cleanupExpiredNhatKySessions_() {
  const properties = PropertiesService.getScriptProperties();
  const all = properties.getProperties();
  const now = Date.now();
  Object.keys(all).forEach(function(key) {
    if (key.indexOf(NHATKY_SESSION_PREFIX) !== 0) return;
    try {
      const session = JSON.parse(all[key]);
      if (!session.expiresAt || Number(session.expiresAt) <= now) properties.deleteProperty(key);
    } catch (_) {
      properties.deleteProperty(key);
    }
  });
}

function createNhatKySession_(username) {
  const token = Utilities.getUuid().replace(/-/g, "") + Utilities.getUuid().replace(/-/g, "");
  const normalizedUsername = String(username || "").trim();
  const key = NHATKY_SESSION_PREFIX + token;
  const expiresAt = Date.now() + NHATKY_SESSION_DAYS * 24 * 60 * 60 * 1000;
  cleanupExpiredNhatKySessions_();
  PropertiesService.getScriptProperties().setProperty(key, JSON.stringify({
    username: normalizedUsername,
    expiresAt: expiresAt
  }));
  CacheService.getScriptCache().put(key, normalizedUsername, NHATKY_SESSION_CACHE_SECONDS);
  return token;
}

function getNhatKySessionUsername_(authToken) {
  const token = String(authToken || "").trim();
  if (!token) return "";
  const key = NHATKY_SESSION_PREFIX + token;
  const cached = String(CacheService.getScriptCache().get(key) || "").trim();
  if (cached) return cached;

  const properties = PropertiesService.getScriptProperties();
  const raw = properties.getProperty(key);
  if (!raw) return "";
  try {
    const session = JSON.parse(raw);
    if (!session.expiresAt || Number(session.expiresAt) <= Date.now()) {
      properties.deleteProperty(key);
      return "";
    }
    const username = String(session.username || "").trim();
    if (!username) {
      properties.deleteProperty(key);
      return "";
    }
    CacheService.getScriptCache().put(key, username, NHATKY_SESSION_CACHE_SECONDS);
    return username;
  } catch (_) {
    properties.deleteProperty(key);
    return "";
  }
}

function findAccountRow_(sheet, username) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return 0;
  const target = String(username).trim().toLowerCase();
  const data = sheet.getDataRange().getValues();
  const schema = typeof getUsersSchema_ === "function" ? getUsersSchema_(data) : { usernameIndex: 0 };
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][schema.usernameIndex] || "").trim().toLowerCase() === target) return i + 1;
  }
  return 0;
}

function getUserTeams_(username) {
  const sheet = getSheet(SHEETS.USERS);
  if (!username) return "";
  const rowIndex = findAccountRow_(sheet, username);
  if (rowIndex === 0) return "";
  const data = sheet.getDataRange().getValues();
  const schema = typeof getUsersSchema_ === "function" ? getUsersSchema_(data) : { teamsIndex: 3 };
  return String(sheet.getRange(rowIndex, schema.teamsIndex + 1).getValue() || "").trim();
}

function splitTeams_(value) {
  return String(value || "").split(/[,;|]/).map(function(team) { return team.trim(); }).filter(Boolean);
}

function isPrivilegedTeams_(value) {
  return splitTeams_(value).some(function(team) {
    const normalized = team.toLowerCase();
    return team === "*" || normalized === "admin";
  });
}

function userCanAccessTeam_(userTeams, requestedTeam) {
  const requested = String(requestedTeam || "").trim();
  if (!requested) return false;
  if (isPrivilegedTeams_(userTeams)) return true;
  return Boolean(requested) && splitTeams_(userTeams).indexOf(requested) >= 0;
}

function handleListAccounts(e) {
  const sheet = getSheet(SHEETS.USERS);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return contentResponse({ status: "success", names: [] });
  const names = sheet.getRange(2, 1, lastRow - 1, 1).getValues()
    .map(function(r) { return String(r[0]).trim(); })
    .filter(Boolean)
    .sort();
  return contentResponse({ status: "success", names: names });
}

function handleNhatKyRegister(params) {
  return contentResponse({
    status: "error",
    message: "Tài khoản được quản lý tập trung trong sheet Users. Vui lòng thêm Username/PIN/Role/Teams tại Google Sheet."
  });
}

function handleNhatKyLogin(params) {
  const payload = params.payload || params || {};
  const username = String(payload.name || payload.username || "").trim();
  const pin = String(payload.password || payload.pin || "");

  if (!username || !pin) return contentResponse({ status: "error", message: "Thiếu tên đăng nhập hoặc PIN" });

  const sheet = getSheet(SHEETS.USERS);
  const data = sheet.getDataRange().getValues();
  const schema = typeof getUsersSchema_ === "function"
    ? getUsersSchema_(data)
    : { usernameIndex: 0, pinIndex: 1, roleIndex: 2, teamsIndex: 3, lastLoginIndex: -1 };
  const rowIndex = findAccountRow_(sheet, username);
  if (rowIndex === 0) return contentResponse({ status: "error", message: "Tài khoản không tồn tại" });

  const row = data[rowIndex - 1];
  const storedPin = String(row[schema.pinIndex] || "").trim();
  const inputPin = pin.trim();

  if (storedPin !== inputPin) {
    return contentResponse({ status: "error", message: "Sai PIN" });
  }

  if (schema.lastLoginIndex >= 0) {
    sheet.getRange(rowIndex, schema.lastLoginIndex + 1).setValue(new Date());
  }
  const name = String(row[schema.usernameIndex] || username).trim();
  const fullName = schema.fullNameIndex >= 0 ? String(row[schema.fullNameIndex] || "").trim() : "";
  const role = String(row[schema.roleIndex] || "User").trim();
  const teams = String(row[schema.teamsIndex] || "").trim();
  const authToken = createNhatKySession_(name);
  writeAuditLog(username, "nhatkyLogin", username, "Đăng nhập trang nhật ký");

  return contentResponse({
    status: "success",
    name: fullName || name,
    fullName: fullName,
    username: name,
    role: role,
    teams: teams,
    authToken: authToken,
    sessionDays: NHATKY_SESSION_DAYS
  });
}

function handleNhatKyChangePin(params) {
  try {
    const payload = params && params.payload ? params.payload : (params || {});
    const actorUsername = String(payload.actorUsername || "").trim();
    const sessionUsername = getNhatKySessionUsername_(payload.authToken);
    const oldPin = String(payload.oldPin || "").trim();
    const newPin = String(payload.newPin || "").trim();

    if (!actorUsername || !sessionUsername || actorUsername.toLowerCase() !== sessionUsername.toLowerCase()) {
      return contentResponse({ status: "error", message: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại." });
    }
    if (!oldPin || !newPin) return contentResponse({ status: "error", message: "Nhập đầy đủ PIN hiện tại và PIN mới." });
    if (newPin.length < 4) return contentResponse({ status: "error", message: "PIN mới phải có ít nhất 4 ký tự." });
    if (newPin.length > 32) return contentResponse({ status: "error", message: "PIN mới không được vượt quá 32 ký tự." });
    if (oldPin === newPin) return contentResponse({ status: "error", message: "PIN mới phải khác PIN hiện tại." });

    const sheet = getSheet(SHEETS.USERS);
    const data = sheet.getDataRange().getValues();
    const schema = getUsersSchema_(data);
    const rowIndex = findAccountRow_(sheet, actorUsername);
    if (!rowIndex) return contentResponse({ status: "error", message: "Tài khoản không tồn tại." });

    const storedPin = String(data[rowIndex - 1][schema.pinIndex] || "").trim();
    if (storedPin !== oldPin) return contentResponse({ status: "error", message: "PIN hiện tại không chính xác." });

    sheet.getRange(rowIndex, schema.pinIndex + 1).setValue(newPin).setNumberFormat("@");
    if (schema.updatedAtIndex >= 0) sheet.getRange(rowIndex, schema.updatedAtIndex + 1).setValue(new Date());
    if (schema.updatedByIndex >= 0) sheet.getRange(rowIndex, schema.updatedByIndex + 1).setValue(actorUsername);
    writeAuditLog(actorUsername, "changeOwnPin", actorUsername, "Người dùng tự đổi PIN tại trang nhật ký");
    return contentResponse({ status: "success", message: "Đã đổi PIN thành công." });
  } catch (error) {
    return contentResponse({ status: "error", message: "Không đổi được PIN: " + error.message });
  }
}
