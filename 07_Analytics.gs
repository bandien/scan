// ==========================================
// 07_Analytics.gs — DỮ LIỆU THỐNG KÊ & BÁO CÁO
// ==========================================

function handleGetAnalyticsData(e) {
  const ss      = SpreadsheetApp.openById(SHEET_ID);
  const devices = (ss.getSheetByName(SHEETS.DEVICES)?.getDataRange().getValues().slice(1) || []).filter(r => r[0]);
  const logs    = ss.getSheetByName(SHEETS.LOGS)?.getDataRange().getValues().slice(1) || [];
  const wos     = ss.getSheetByName(SHEETS.WORK_ORDERS)?.getDataRange().getValues().slice(1) || [];

  const today = new Date(); today.setHours(0,0,0,0);

  // KPIs
  const overdue   = devices.filter(r => { const d = r[5] && new Date(r[5]); d && d.setHours(0,0,0,0); return d && d < today; }).length;
  const woByStatus = {};
  wos.forEach(r => { const s = r[3] || 'New'; woByStatus[s] = (woByStatus[s] || 0) + 1; });
  const activeWOs  = (woByStatus['New']||0) + (woByStatus['Assigned']||0) + (woByStatus['In Progress']||0);

  // Logs by month (6 tháng gần nhất)
  const sixMonthsAgo = new Date(); sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5); sixMonthsAgo.setDate(1); sixMonthsAgo.setHours(0,0,0,0);
  const logsByMonth  = {};
  logs.forEach(r => {
    if (!r[0]) return;
    const d = new Date(r[0]);
    if (d >= sixMonthsAgo) {
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      logsByMonth[key] = (logsByMonth[key] || 0) + 1;
    }
  });

  // By area
  const byArea = {};
  devices.forEach(r => { const a = r[14] || 'Chưa phân khu'; byArea[a] = (byArea[a]||0)+1; });

  return contentResponse({
    status: 'success',
    kpi: { total: devices.length, overdue, activeWOs, doneWOs: woByStatus['Done'] || 0 },
    woByStatus, logsByMonth, byArea
  });
}

function handleGetMaintenanceDue(e) {
  const sheet = getSheet(SHEETS.DEVICES);
  if (!sheet) return contentResponse({ status: "error", message: "Devices sheet not found" });

  const today = new Date(); today.setHours(0,0,0,0);
  const data  = sheet.getDataRange().getValues().slice(1).filter(r => r[0]).map(r => {
    const rawNext = r[5];
    let nextMaintenance = null, daysUntil = null, scheduleStatus = 'never';
    if (rawNext) {
      const nd = new Date(rawNext);
      if (!isNaN(nd)) {
        nd.setHours(0,0,0,0);
        nextMaintenance = Utilities.formatDate(nd, Session.getScriptTimeZone(), 'yyyy-MM-dd');
        daysUntil       = Math.round((nd - today) / 86400000);
        scheduleStatus  = daysUntil < 0 ? 'overdue' : daysUntil <= 3 ? 'due_soon' : 'scheduled';
      }
    }
    return { uid: r[0], name: r[1], location: r[2], cycle: r[4], nextMaintenance, daysUntil, scheduleStatus };
  });

  return contentResponse({ status: 'success', data });
}

function handleGetInventory(e) {
  const sheet = getSheet(SHEETS.INVENTORY);
  if (!sheet) return contentResponse({ status: "error", message: "Inventory sheet not found" });
  const headers = sheet.getDataRange().getValues()[0] || [];
  const inventory = sheet.getDataRange().getValues().slice(1).map(r => {
    const item = {};
    headers.forEach((h, j) => { item[h] = r[j]; });
    return item;
  });
  return contentResponse({ status: "success", inventory });
}

function handleGetStaff(e) {
  const sheet = getSheet(SHEETS.USERS || "Users");
  if (!sheet) return contentResponse({ status: "error", message: "Users sheet not found" });
  const data = sheet.getDataRange().getValues();
  const schema = typeof getUsersSchema_ === "function"
    ? getUsersSchema_(data)
    : { usernameIndex: 0, roleIndex: 2, teamsIndex: 3, phoneIndex: 7, fullNameIndex: 8, labelsIndex: 9 };

  const requestingRole = e && e.parameter ? String(e.parameter.role || "").trim() : "";
  const requestingDept = e && e.parameter ? String(e.parameter.dept || e.parameter.team || "").trim().toLowerCase() : "";
  const requestingLabels = e && e.parameter && e.parameter.labels
    ? String(e.parameter.labels).split(",").map(function(s) { return s.trim().toLowerCase(); }).filter(Boolean)
    : [];

  let staff = data.slice(1).filter(function(row) {
    return String(row[schema.usernameIndex] || "").trim();
  }).map(function(row) {
    const username = String(row[schema.usernameIndex] || "").trim();
    const fullName = schema.fullNameIndex >= 0 ? String(row[schema.fullNameIndex] || "").trim() : "";
    const labels = schema.labelsIndex >= 0 ? String(row[schema.labelsIndex] || "").trim() : "";
    return {
      id: username,
      username: username,
      name: fullName || username,
      fullName: fullName,
      position: String(row[schema.roleIndex] || "User").trim(),
      dept: String(row[schema.teamsIndex] || "").trim(),
      phone: schema.phoneIndex >= 0 ? String(row[schema.phoneIndex] || "").trim() : "",
      labels: labels || (String(row[schema.teamsIndex] || "") + ", Public")
    };
  });

  // Label-Based & Role-Based Access Control filtering
  if (requestingRole === "User" || requestingRole === "Staff") {
    staff = staff.filter(function(person) {
      const pos = person.position.toLowerCase();
      const personDept = person.dept.toLowerCase();
      const personLabels = (person.labels || "").toLowerCase();

      const isLeader = pos === "admin" || pos === "manager" || person.dept === "*";
      const isSameTeam = requestingDept && (personDept.includes(requestingDept) || requestingDept.includes(personDept));
      const hasMatchingLabel = requestingLabels.length > 0 && requestingLabels.some(function(lbl) {
        return lbl === "*" || personLabels.includes(lbl);
      });

      return isLeader || isSameTeam || hasMatchingLabel;
    });
  }

  return contentResponse({ status: "success", staff });
}


