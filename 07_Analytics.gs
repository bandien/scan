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
  const apiToken = e && e.parameter ? String(e.parameter.token || "").trim() : "";
  const authToken = e && e.parameter ? String(e.parameter.authToken || "").trim() : "";

  // Step 4: AuthToken Session Verification
  if (authToken && typeof getNhatKySessionUsername_ === "function") {
    const sessionUser = getNhatKySessionUsername_(authToken);
    if (!sessionUser) {
      return contentResponse({ status: "error", message: "Phiên làm việc hết hạn hoặc AuthToken không hợp lệ. Vui lòng đăng nhập lại." });
    }
  }

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

  // Step 2: STRICT PIN EXCLUSION - Only public fields are mapped
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

function normalizePhone_(phoneStr) {
  if (!phoneStr) return "";
  let digits = String(phoneStr).replace(/\D/g, "");
  if (digits.indexOf("84") === 0 && digits.length > 9) {
    digits = "0" + digits.substring(2);
  }
  return digits;
}

// ===== 6. Backend API Unified ERP Party Model (handleGetErpParties) =====
function handleGetErpParties(e) {
  const staffRes = handleGetStaff(e);
  const partnerRes = handleGetPartners(e);

  let staffList = [];
  let partnerList = [];

  try {
    const sObj = JSON.parse(staffRes.getContent());
    if (sObj.status === "success" && Array.isArray(sObj.staff)) {
      staffList = sObj.staff.map(function(s, idx) {
        return {
          partyId: "PT-EMP-" + (s.username || idx),
          name: s.fullName || s.name || s.username,
          phone: s.phone || "",
          deptOrCompany: s.dept || "Ban Điện",
          position: s.position || "Staff",
          roles: ["EMPLOYEE"],
          labels: String(s.labels || s.dept || "Public").split(/[,;]/).map(function(x){ return x.trim(); }).filter(Boolean),
          type: "STAFF"
        };
      });
    }
  } catch(err) {}

  try {
    const pObj = JSON.parse(partnerRes.getContent());
    if (pObj.status === "success" && Array.isArray(pObj.partners)) {
      partnerList = pObj.partners.map(function(p, idx) {
        return {
          partyId: p.partyId || ("PT-PARTNER-" + idx),
          name: p.name || p.fullName || p.contactPerson,
          phone: p.phone || "",
          email: p.email || "",
          address: p.address || "",
          taxCode: p.taxCode || "",
          deptOrCompany: p.loai || "Đối tác / NCC",
          contactPerson: p.contactPerson || "",
          roles: [p.loai ? p.loai.toUpperCase() : "SUPPLIER"],
          labels: String(p.labels || p.loai || "Public").split(/[,;]/).map(function(x){ return x.trim(); }).filter(Boolean),
          type: "PARTNER"
        };
      });
    }
  } catch(err) {}

  // Deduplicate and Merge Staff & Partner records by normalized phone number
  const partyMap = {};
  const unmergedParties = [];

  function mergeLabels(arr1, arr2) {
    const set = {};
    (arr1 || []).concat(arr2 || []).forEach(function(l) {
      if (l) set[l] = true;
    });
    return Object.keys(set);
  }

  function mergeRoles(arr1, arr2) {
    const set = {};
    (arr1 || []).concat(arr2 || []).forEach(function(r) {
      if (r) set[r] = true;
    });
    return Object.keys(set);
  }

  // 1. Map staffList by phone
  staffList.forEach(function(s) {
    const phoneKey = normalizePhone_(s.phone);
    if (phoneKey && phoneKey.length >= 9) {
      partyMap[phoneKey] = s;
    } else {
      unmergedParties.push(s);
    }
  });

  // 2. Iterate partnerList and merge or insert
  partnerList.forEach(function(p) {
    const phoneKey = normalizePhone_(p.phone);
    if (phoneKey && phoneKey.length >= 9 && partyMap[phoneKey]) {
      // Merge into existing Staff record
      const existing = partyMap[phoneKey];
      existing.roles = mergeRoles(existing.roles, p.roles);
      existing.labels = mergeLabels(existing.labels, p.labels);
      if (p.email && !existing.email) existing.email = p.email;
      if (p.address && !existing.address) existing.address = p.address;
      if (p.taxCode && !existing.taxCode) existing.taxCode = p.taxCode;
      if (p.contactPerson && !existing.contactPerson) existing.contactPerson = p.contactPerson;
      if (p.name && existing.name !== p.name && !existing.partnerName) existing.partnerName = p.name;
      existing.type = "HYBRID";
      existing.isMerged = true;
    } else if (phoneKey && phoneKey.length >= 9) {
      partyMap[phoneKey] = p;
    } else {
      unmergedParties.push(p);
    }
  });

  const parties = Object.keys(partyMap).map(function(k) { return partyMap[k]; }).concat(unmergedParties);
  return contentResponse({ status: "success", count: parties.length, parties: parties });
}

// ===== 5. Quản lý Đối Tác & NCC ERP (kh_ncc) =====
function handleGetPartners(e) {
  const sheet = getSheet("kh_ncc");
  if (!sheet) return contentResponse({ status: "success", partners: [] });

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return contentResponse({ status: "success", partners: [] });

  const partners = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const id = String(row[0] || "").trim();
    const loai = String(row[1] || "ĐốiTác").trim();
    const name = String(row[2] || "").trim();
    const contactPerson = String(row[3] || "").trim();
    const phone = String(row[4] || "").trim();
    const email = String(row[5] || "").trim();
    const taxCode = String(row[6] || "").trim();
    const address = String(row[7] || "").trim();
    const labels = String(row[row.length - 1] || "").trim();

    if (name || contactPerson || phone) {
      partners.push({
        id: id || ("PARTNER-" + i),
        partyId: "PT-PARTNER-" + i,
        loai: loai,
        name: name || contactPerson,
        fullName: name,
        contactPerson: contactPerson,
        phone: phone,
        email: email,
        taxCode: taxCode,
        address: address,
        labels: labels || (loai + ", Public"),
        role: "SUPPLIER"
      });
    }
  }
  return contentResponse({ status: "success", partners });
}

// ===== 4. Quản lý Danh Bạ Cá Nhân (Personal Phonebook) =====
function handleGetPersonalContacts(e) {
  const username = e && e.parameter ? String(e.parameter.username || "").trim().toLowerCase() : "";
  if (!username) return contentResponse({ status: "error", message: "Username required" });

  const sheet = getSheet("PersonalContacts");
  if (!sheet) return contentResponse({ status: "success", contacts: [] });

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return contentResponse({ status: "success", contacts: [] });

  const contacts = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const owner = String(row[1] || "").trim().toLowerCase();
    if (owner === username) {
      contacts.push({
        id: String(row[0] || "").trim(),
        ownerUsername: String(row[1] || "").trim(),
        fullName: String(row[2] || "").trim(),
        phone: String(row[3] || "").trim(),
        deptOrNote: String(row[4] || "").trim(),
        email: String(row[5] || "").trim(),
        updatedAt: String(row[6] || "").trim()
      });
    }
  }
  return contentResponse({ status: "success", contacts });
}

function handleSavePersonalContact(e) {
  let body = {};
  try {
    body = JSON.parse(e.postData.contents);
  } catch(err) {}

  const contact = body.contact || {};
  const ownerUsername = String(contact.ownerUsername || body.username || "").trim();
  const fullName = String(contact.fullName || "").trim();
  const phone = String(contact.phone || "").trim();
  const deptOrNote = String(contact.deptOrNote || "").trim();
  const email = String(contact.email || "").trim();
  const id = String(contact.id || ("PC-" + Date.now())).trim();

  if (!ownerUsername || !fullName) {
    return contentResponse({ status: "error", message: "ownerUsername & fullName are required" });
  }

  const sheet = getSheet("PersonalContacts");
  if (!sheet) return contentResponse({ status: "error", message: "PersonalContacts sheet not found" });

  const data = sheet.getDataRange().getValues();
  let foundIndex = -1;
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === id || (String(data[i][1]).trim().toLowerCase() === ownerUsername.toLowerCase() && String(data[i][2]).trim().toLowerCase() === fullName.toLowerCase())) {
      foundIndex = i + 1;
      break;
    }
  }

  const now = new Date().toISOString();
  const rowValue = [id, ownerUsername, fullName, phone, deptOrNote, email, now];

  if (foundIndex > 0) {
    sheet.getRange(foundIndex, 1, 1, 7).setValues([rowValue]);
  } else {
    sheet.appendRow(rowValue);
  }

  return contentResponse({ status: "success", message: "Đã lưu liên hệ cá nhân", contact: { id, ownerUsername, fullName, phone, deptOrNote, email, updatedAt: now } });
}

function handleDeletePersonalContact(e) {
  let body = {};
  try {
    body = JSON.parse(e.postData.contents);
  } catch(err) {}

  const id = String(body.id || (e.parameter ? e.parameter.id : "")).trim();
  if (!id) return contentResponse({ status: "error", message: "Contact ID required" });

  const sheet = getSheet("PersonalContacts");
  if (!sheet) return contentResponse({ status: "error", message: "PersonalContacts sheet not found" });

  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === id) {
      sheet.deleteRow(i + 1);
      return contentResponse({ status: "success", message: "Đã xóa liên hệ cá nhân" });
    }
  }

  return contentResponse({ status: "error", message: "Không tìm thấy liên hệ để xóa" });
}

// ===== 7. Utility to Clean Duplicates from kh_ncc according to SSOT =====
function handleCleanupDuplicateErpParties(e) {
  const staffRes = handleGetStaff(e);
  let staffList = [];
  try {
    const sObj = JSON.parse(staffRes.getContent());
    if (sObj.status === "success" && Array.isArray(sObj.staff)) {
      staffList = sObj.staff;
    }
  } catch(err) {}

  const staffPhones = {};
  staffList.forEach(function(s) {
    const pk = normalizePhone_(s.phone);
    if (pk && pk.length >= 9) staffPhones[pk] = s.name || s.fullName || s.username;
  });

  const sheet = getSheet("kh_ncc");
  if (!sheet) return contentResponse({ status: "success", message: "kh_ncc sheet không tồn tại", removed: [] });

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return contentResponse({ status: "success", message: "kh_ncc không có dữ liệu", removed: [] });

  const removed = [];
  // Loop backwards to safely delete rows
  for (let i = data.length - 1; i >= 1; i--) {
    const row = data[i];
    const pName = String(row[2] || row[3] || "").trim();
    const phone = String(row[4] || "").trim();
    const pk = normalizePhone_(phone);

    if (pk && staffPhones[pk]) {
      removed.push({ row: i + 1, name: pName, phone: phone, matchedStaff: staffPhones[pk] });
      sheet.deleteRow(i + 1);
    }
  }

  return contentResponse({
    status: "success",
    message: `Đã dọn dẹp ${removed.length} dòng trùng lặp trong kh_ncc theo nguyên tắc SSOT.`,
    removedCount: removed.length,
    removed: removed
  });
}


