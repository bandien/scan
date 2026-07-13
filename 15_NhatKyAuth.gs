// ==========================================
// 15_NhatKyAuth.gs - NhatKy account login
// ==========================================
// Tài khoản dùng chung duy nhất trong sheet Users:
// Username | PIN | Role | Teams

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

function getUserTeamGroup_(username) {
  const sheet = getSheet(SHEETS.USERS);
  if (!username) return "";
  const rowIndex = findAccountRow_(sheet, username);
  if (rowIndex === 0) return "";
  const data = sheet.getDataRange().getValues();
  const schema = typeof getUsersSchema_ === "function" ? getUsersSchema_(data) : { teamsIndex: 3 };
  return String(sheet.getRange(rowIndex, schema.teamsIndex + 1).getValue() || "").trim();
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

  const row = sheet.getRange(rowIndex, 1, 1, Math.max(schema.teamsIndex + 1, 4)).getValues()[0];
  const storedPin = String(row[schema.pinIndex] || "").trim();
  const inputPin = pin.trim();

  if (storedPin !== inputPin) {
    return contentResponse({ status: "error", message: "Sai PIN" });
  }

  if (schema.lastLoginIndex >= 0) {
    sheet.getRange(rowIndex, schema.lastLoginIndex + 1).setValue(new Date());
  }
  const name = String(row[schema.usernameIndex] || username).trim();
  const role = String(row[schema.roleIndex] || "User").trim();
  const teamGroup = String(row[schema.teamsIndex] || "").trim();
  writeAuditLog(username, "nhatkyLogin", username, "Đăng nhập trang nhật ký");

  return contentResponse({ status: "success", name: name, username: name, role: role, teamGroup: teamGroup, teams: teamGroup });
}
