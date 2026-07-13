// ==========================================
// 03_Auth.gs - Authentication & authorization
// ==========================================

function handleLogin(e) {
  const { pin, username, user: userAlias } = e.parameter;
  const userParam = username || userAlias;
  if (!pin || !userParam) return contentResponse({ status: "error", message: "Missing credentials" });

  const ss = SpreadsheetApp.openById(SHEET_ID);
  const userSheet = ss.getSheetByName(SHEETS.USERS);
  if (!userSheet) return contentResponse({ status: "error", message: "Users sheet not found" });

  const users = userSheet.getDataRange().getValues();
  const schema = getUsersSchema_(users);
  let foundUser = null;
  let rowIdx = -1;

  for (let i = 1; i < users.length; i++) {
    const row = users[i];
    if (!userRowMatches_(row, schema, userParam)) continue;

    const storedPin = String(row[schema.pinIndex] || "").trim();
    const inputPin = String(pin).trim();

    if (storedPin === inputPin) {
      foundUser = {
        username: row[schema.usernameIndex],
        name: row[schema.usernameIndex],
        role: row[schema.roleIndex] || "User",
        teams: row[schema.teamsIndex] || ""
      };
      rowIdx = i + 1;
      break;
    }
  }

  if (!foundUser) return contentResponse({ status: "error", message: "Sai tên đăng nhập hoặc PIN" });

  if (rowIdx > 0 && schema.lastLoginIndex >= 0) {
    userSheet.getRange(rowIdx, schema.lastLoginIndex + 1).setValue(new Date());
  }

  writeAuditLog(foundUser.username || foundUser.name, "Login", "Web App", "Đăng nhập thành công");

  const devSheet = ss.getSheetByName(SHEETS.DEVICES);
  const checkSheet = ss.getSheetByName(SHEETS.CHECKLISTS);

  const devData = devSheet ? devSheet.getDataRange().getValues() : [];
  const devices = devData.slice(1).filter(r => r[0]).map(r => mapDeviceRow(r));

  const checklists = checkSheet
    ? checkSheet.getDataRange().getValues().slice(1).map(r => ({ type: r[0], id: r[1], title: r[2], desc: r[3] }))
    : [];

  const usersList = users.slice(1).filter(r => r[0]).map(r => ({
    username: r[schema.usernameIndex],
    name: r[schema.usernameIndex],
    role: r[schema.roleIndex] || "User",
    teams: r[schema.teamsIndex] || ""
  }));

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
  const schema = getUsersSchema_(users);
  let rowIdx = -1;

  for (let i = 1; i < users.length; i++) {
    if (!userRowMatches_(users[i], schema, params.username)) continue;

    const storedPin = String(users[i][schema.pinIndex] || "").trim();
    const inputPin = String(params.oldPin).trim();

    if (storedPin === inputPin) {
      rowIdx = i + 1;
      break;
    }
  }

  if (rowIdx === -1) return contentResponse({ status: "error", message: "PIN hiện tại không chính xác" });

  userSheet.getRange(rowIdx, schema.pinIndex + 1).setValue(String(params.newPin || "").trim());
  writeAuditLog(params.username, "changePin", params.username, "User changed their own PIN");
  return contentResponse({ status: "success" });
}

function getUsersSchema_(rows) {
  const headers = rows && rows.length ? rows[0].map(function(h) {
    return String(h || "").trim().toLowerCase();
  }) : [];
  return {
    usernameIndex: headers.indexOf("username") !== -1 ? headers.indexOf("username") : 0,
    pinIndex: headers.indexOf("pin") !== -1 ? headers.indexOf("pin") : 1,
    roleIndex: headers.indexOf("role") !== -1 ? headers.indexOf("role") : 2,
    teamsIndex: headers.indexOf("teams") !== -1 ? headers.indexOf("teams") : 3,
    lastLoginIndex: headers.indexOf("lastloginat")
  };
}

function userRowMatches_(row, schema, userParam) {
  const target = String(userParam || "").trim().toLowerCase();
  if (!target) return false;
  return String(row[schema.usernameIndex] || "").trim().toLowerCase() === target;
}

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
