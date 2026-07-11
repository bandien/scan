// ==========================================
// 03_Auth.gs — XÁC THỰC & PHÂN QUYỀN
// ==========================================

function handleLogin(e) {
  const { pin, username, user: userAlias } = e.parameter;
  const userParam = username || userAlias;
  if (!pin || !userParam) return contentResponse({ status: "error", message: "Missing credentials" });

  const ss = SpreadsheetApp.openById(SHEET_ID);
  const userSheet = ss.getSheetByName(SHEETS.USERS);
  if (!userSheet) return contentResponse({ status: "error", message: "Users sheet not found" });

  const users = userSheet.getDataRange().getValues();
  let foundUser = null;
  let rowIdx = -1;
  for (let i = 1; i < users.length; i++) {
    if (String(users[i][0]).trim().toLowerCase() === String(userParam).trim().toLowerCase()) {
      const storedPass = String(users[i][2]).trim();
      const inputPass = String(pin).trim();
      // Chấp nhận mật khẩu thô trong giai đoạn chuyển đổi (nếu lỡ nhập thô) hoặc chuỗi đã hash
      const inputHash = (typeof hashPassword_ === 'function') ? hashPassword_(users[i][0], inputPass) : inputPass;
      if (storedPass === inputHash || storedPass === inputPass) {
        foundUser = { username: users[i][0], name: users[i][1], role: users[i][3], teams: users[i][4] || "" };
        rowIdx = i + 1;
        break;
      }
    }
  }
  if (!foundUser) return contentResponse({ status: "error", message: "Sai tên đăng nhập hoặc mật khẩu" });

  // Cập nhật LastLoginAt
  if (rowIdx > 0) {
    userSheet.getRange(rowIdx, 7).setValue(new Date());
  }

  writeAuditLog(foundUser.username || foundUser.name, "Login", "Web App", "Đăng nhập thành công");

  // Preload toàn bộ dữ liệu sau khi login (Local-First architecture)
  const devSheet   = ss.getSheetByName(SHEETS.DEVICES);
  const checkSheet = ss.getSheetByName(SHEETS.CHECKLISTS);

  const devData    = devSheet ? devSheet.getDataRange().getValues() : [];
  const devices    = devData.slice(1).filter(r => r[0]).map(r => mapDeviceRow(r));

  const checklists = checkSheet
    ? checkSheet.getDataRange().getValues().slice(1).map(r => ({ type: r[0], id: r[1], title: r[2], desc: r[3] }))
    : [];

  const usersList = users.slice(1).map(r => ({ username: r[0], name: r[1], role: r[3], teams: r[4] || "" }));

  return contentResponse({
    status: "success",
    user: foundUser,
    devices,
    checklists,
    users: usersList
  });
}

function handleChangePassword(params) {
  const userSheet = getSheet(SHEETS.USERS);
  if (!userSheet) return contentResponse({ status: "error", message: "Users sheet not found" });

  const users = userSheet.getDataRange().getValues();
  let rowIdx = -1;
  for (let i = 1; i < users.length; i++) {
    if (String(users[i][0]).trim().toLowerCase() === String(params.username).trim().toLowerCase()) {
      const storedPass = String(users[i][2]).trim();
      const inputPass = String(params.oldPin).trim();
      const inputHash = (typeof hashPassword_ === 'function') ? hashPassword_(users[i][0], inputPass) : inputPass;
      if (storedPass === inputHash || storedPass === inputPass) {
        rowIdx = i + 1;
        break;
      }
    }
  }
  if (rowIdx === -1) return contentResponse({ status: "error", message: "Mật khẩu cũ không chính xác" });

  const newHash = (typeof hashPassword_ === 'function') ? hashPassword_(params.username, params.newPin) : params.newPin;
  userSheet.getRange(rowIdx, 3).setValue(newHash);
  writeAuditLog(params.username, 'changePassword', params.username, 'User changed their own password');
  return contentResponse({ status: "success" });
}

// ── Internal helper: map Devices row array → object ─────────────────────────
function mapDeviceRow(r) {
  return {
    uid:             r[0],  name:            r[1],  location:        r[2],
    specs:           r[3]  || "N/A",
    cycle:           r[4]  || 30,
    nextMaintenance: r[5]  || "",
    manager:         r[6]  || "Chưa phân công",
    shift:           r[7]  || "Chưa phân công",
    warningDays:     r[8]  || 7,
    manufactureDate: r[9]  || "",
    installationDate:r[10] || "",
    status:          r[11] || "IN",
    project:         r[12] || "",
    serialNumber:    r[13] || "",
    area:            r[14] || "",
    equipmentType:   r[15] || ""
  };
}
