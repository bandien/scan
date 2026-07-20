// ==========================================
// 17_UserAdmin.gs - Quản lý tài khoản Users
// ==========================================

function normalizeUserRole_(value) {
  const role = String(value || "User").trim().toLowerCase();
  if (role === "admin") return "Admin";
  if (role === "manager") return "Manager";
  return "User";
}

function getUserAdminSheet_() {
  const sheet = getSheet(SHEETS.USERS);
  if (!sheet) throw new Error("Không tìm thấy sheet Users");
  return sheet;
}

function ensureUserAdminColumns_(sheet) {
  let data = sheet.getDataRange().getValues();
  let schema = getUsersSchema_(data);
  const missingHeaders = [];
  if (schema.phoneIndex < 0) missingHeaders.push("Phone");
  if (schema.fullNameIndex < 0) missingHeaders.push("Họ và tên");
  missingHeaders.forEach(function(header) {
    const column = sheet.getLastColumn() + 1;
    sheet.getRange(1, column).setValue(header).setFontWeight("bold");
    sheet.getRange(2, column, Math.max(sheet.getMaxRows() - 1, 1), 1).setNumberFormat("@");
  });
  if (!missingHeaders.length) return { data: data, schema: schema };
  data = sheet.getDataRange().getValues();
  schema = getUsersSchema_(data);
  return { data: data, schema: schema };
}

function userAdminRecord_(row, schema) {
  return {
    username: String(row[schema.usernameIndex] || "").trim(),
    fullName: schema.fullNameIndex >= 0 ? String(row[schema.fullNameIndex] || "").trim() : "",
    pin: String(row[schema.pinIndex] || "").trim(),
    role: normalizeUserRole_(row[schema.roleIndex]),
    teams: String(row[schema.teamsIndex] || "").trim(),
    note: schema.noteIndex >= 0 ? String(row[schema.noteIndex] || "").trim() : "",
    phone: schema.phoneIndex >= 0 ? String(row[schema.phoneIndex] || "").trim() : "",
    updatedAt: schema.updatedAtIndex >= 0 ? row[schema.updatedAtIndex] : "",
    updatedBy: schema.updatedByIndex >= 0 ? String(row[schema.updatedByIndex] || "").trim() : "",
    hasPin: Boolean(String(row[schema.pinIndex] || "").trim())
  };
}

function parseUserAdminDate_(value) {
  if (Object.prototype.toString.call(value) === "[object Date]" && !isNaN(value.getTime())) return value;
  const text = String(value || "").trim();
  if (!text) return "";
  const date = new Date(text);
  return isNaN(date.getTime()) ? text : date;
}

function getUserManagerActor_(params) {
  const payload = params && params.payload ? params.payload : (params || {});
  const actorUsername = String(payload.actorUsername || "").trim();
  const authToken = String(payload.authToken || "").trim();
  if (!actorUsername || !authToken) return { ok: false, message: "Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại." };

  const cachedUsername = typeof getNhatKySessionUsername_ === "function"
    ? getNhatKySessionUsername_(authToken)
    : CacheService.getScriptCache().get("nhatky_session_" + authToken);
  if (!cachedUsername || cachedUsername.toLowerCase() !== actorUsername.toLowerCase()) {
    return { ok: false, message: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại." };
  }

  const sheet = getUserAdminSheet_();
  const prepared = ensureUserAdminColumns_(sheet);
  const rowIndex = findAccountRow_(sheet, actorUsername);
  if (!rowIndex) return { ok: false, message: "Tài khoản quản lý không còn tồn tại." };

  const row = prepared.data[rowIndex - 1];
  const actor = userAdminRecord_(row, prepared.schema);
  if (actor.role !== "Admin" && actor.role !== "Manager") {
    return { ok: false, message: "Bạn không có quyền quản lý người dùng." };
  }

  return { ok: true, payload: payload, sheet: sheet, data: prepared.data, schema: prepared.schema, actor: actor };
}

function managerCanAccessUser_(actor, user) {
  if (actor.role === "Admin") return true;
  if (user.role !== "User") return false;

  const managerTeams = splitTeams_(actor.teams).filter(function(team) {
    const normalized = team.toLowerCase();
    return team !== "*" && normalized !== "admin";
  });
  if (!managerTeams.length || isPrivilegedTeams_(actor.teams)) return true;

  const userTeams = splitTeams_(user.teams);
  return userTeams.length > 0 && userTeams.every(function(team) {
    return managerTeams.indexOf(team) >= 0;
  });
}

function getUserTeamOptions_(sheet, schema) {
  let options = [];
  if (schema.teamsIndex >= 0 && sheet.getMaxRows() >= 2) {
    const validation = sheet.getRange(2, schema.teamsIndex + 1).getDataValidation();
    if (validation && validation.getCriteriaType() === SpreadsheetApp.DataValidationCriteria.VALUE_IN_LIST) {
      const values = validation.getCriteriaValues();
      options = values && values[0] ? values[0].map(function(value) { return String(value).trim(); }) : [];
    }
  }
  if (!options.length) {
    options = ["*", "Tổ cơ điện", "Tổ điện nước", "Tổ vận hành", "Tổ PCCC", "Tổ điện lạnh"];
  }
  return options.filter(Boolean).filter(function(value, index, all) { return all.indexOf(value) === index; });
}

function teamOptionsForActor_(actor, allOptions) {
  if (actor.role === "Admin" || isPrivilegedTeams_(actor.teams)) return allOptions;
  const assigned = splitTeams_(actor.teams);
  if (!assigned.length) return allOptions.filter(function(team) { return team !== "*" && team.toLowerCase() !== "admin"; });
  return allOptions.filter(function(team) { return assigned.indexOf(team) >= 0; });
}

function handleListUsers(params) {
  try {
    const context = getUserManagerActor_(params);
    if (!context.ok) return contentResponse({ status: "error", message: context.message });

    const users = context.data.slice(1).map(function(row) {
      return userAdminRecord_(row, context.schema);
    }).filter(function(user) {
      return user.username && managerCanAccessUser_(context.actor, user);
    }).map(function(user) {
      user.canDelete = user.username.toLowerCase() !== context.actor.username.toLowerCase();
      return user;
    }).sort(function(a, b) {
      return a.username.localeCompare(b.username);
    });

    const allTeamOptions = getUserTeamOptions_(context.sheet, context.schema);
    return contentResponse({
      status: "success",
      users: users,
      roles: context.actor.role === "Admin" ? ["Admin", "Manager", "User"] : ["User"],
      teamOptions: teamOptionsForActor_(context.actor, allTeamOptions),
      actorRole: context.actor.role
    });
  } catch (error) {
    return contentResponse({ status: "error", message: "Không tải được danh sách người dùng: " + error.message });
  }
}

function validateManagedUser_(actor, user) {
  if (!user.username) return "Tên đăng nhập không được để trống.";
  if (!user.fullName) return "Họ và tên không được để trống.";
  if (["Admin", "Manager", "User"].indexOf(user.role) < 0) return "Vai trò không hợp lệ.";
  if (actor.role === "Manager" && user.role !== "User") return "Cấp quản lý chỉ được quản lý tài khoản User.";
  if (user.pin && user.pin.length < 4) return "PIN phải có ít nhất 4 ký tự.";
  if (user.phone && !/^[+0-9 ()-]{1,24}$/.test(user.phone)) return "Số điện thoại không hợp lệ.";
  if (!managerCanAccessUser_(actor, user)) return "Tài khoản nằm ngoài phạm vi tổ bạn được quản lý.";
  return "";
}

function countAdmins_(data, schema) {
  return data.slice(1).filter(function(row) {
    return String(row[schema.usernameIndex] || "").trim() && normalizeUserRole_(row[schema.roleIndex]) === "Admin";
  }).length;
}

function handleSaveUser(params) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const context = getUserManagerActor_(params);
    if (!context.ok) return contentResponse({ status: "error", message: context.message });

    const input = context.payload.user || {};
    const originalUsername = String(input.originalUsername || "").trim();
    const user = {
      username: String(input.username || "").trim(),
      fullName: String(input.fullName || "").trim(),
      pin: String(input.pin || "").trim(),
      role: normalizeUserRole_(input.role),
      teams: splitTeams_(input.teams).filter(function(team, index, all) { return all.indexOf(team) === index; }).join(", "),
      phone: String(input.phone || "").trim(),
      note: String(input.note || "").trim(),
      updatedAt: input.updatedAt,
      updatedBy: String(input.updatedBy || "").trim()
    };

    const validationError = validateManagedUser_(context.actor, user);
    if (validationError) return contentResponse({ status: "error", message: validationError });

    const originalRowIndex = originalUsername ? findAccountRow_(context.sheet, originalUsername) : 0;
    if (originalUsername && !originalRowIndex) return contentResponse({ status: "error", message: "Không tìm thấy tài khoản cần sửa." });
    if (!originalUsername && !user.pin) return contentResponse({ status: "error", message: "Tài khoản mới phải có PIN." });

    const duplicateRowIndex = findAccountRow_(context.sheet, user.username);
    if (duplicateRowIndex && duplicateRowIndex !== originalRowIndex) {
      return contentResponse({ status: "error", message: "Tên đăng nhập đã tồn tại." });
    }

    if (originalRowIndex) {
      const original = userAdminRecord_(context.data[originalRowIndex - 1], context.schema);
      if (!managerCanAccessUser_(context.actor, original)) return contentResponse({ status: "error", message: "Bạn không có quyền sửa tài khoản này." });
      if (original.username.toLowerCase() === context.actor.username.toLowerCase() && original.username.toLowerCase() !== user.username.toLowerCase()) {
        return contentResponse({ status: "error", message: "Không thể đổi tên tài khoản đang đăng nhập." });
      }
      if (original.role === "Admin" && user.role !== "Admin" && countAdmins_(context.data, context.schema) <= 1) {
        return contentResponse({ status: "error", message: "Không thể hạ quyền quản trị viên cuối cùng." });
      }
    }

    const rowIndex = originalRowIndex || context.sheet.getLastRow() + 1;
    const lastColumn = context.sheet.getLastColumn();
    const row = originalRowIndex
      ? context.sheet.getRange(rowIndex, 1, 1, lastColumn).getValues()[0]
      : new Array(lastColumn).fill("");

    row[context.schema.usernameIndex] = user.username;
    if (user.pin) row[context.schema.pinIndex] = user.pin;
    row[context.schema.roleIndex] = user.role;
    row[context.schema.teamsIndex] = user.teams;
    if (context.schema.noteIndex >= 0) row[context.schema.noteIndex] = user.note;
    if (context.schema.updatedAtIndex >= 0) row[context.schema.updatedAtIndex] = parseUserAdminDate_(user.updatedAt) || new Date();
    if (context.schema.updatedByIndex >= 0) row[context.schema.updatedByIndex] = user.updatedBy || context.actor.username;
    if (context.schema.phoneIndex >= 0) row[context.schema.phoneIndex] = user.phone;
    if (context.schema.fullNameIndex >= 0) row[context.schema.fullNameIndex] = user.fullName;
    context.sheet.getRange(rowIndex, 1, 1, lastColumn).setValues([row]);

    writeAuditLog(context.actor.username, originalRowIndex ? "updateUser" : "createUser", user.username, "Quản lý tài khoản Users");
    return contentResponse({ status: "success", message: originalRowIndex ? "Đã cập nhật tài khoản." : "Đã thêm tài khoản." });
  } catch (error) {
    return contentResponse({ status: "error", message: "Không lưu được tài khoản: " + error.message });
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}

function handleDeleteUser(params) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const context = getUserManagerActor_(params);
    if (!context.ok) return contentResponse({ status: "error", message: context.message });

    const username = String(context.payload.username || "").trim();
    if (!username) return contentResponse({ status: "error", message: "Thiếu tài khoản cần xóa." });
    if (username.toLowerCase() === context.actor.username.toLowerCase()) {
      return contentResponse({ status: "error", message: "Không thể xóa tài khoản đang đăng nhập." });
    }

    const rowIndex = findAccountRow_(context.sheet, username);
    if (!rowIndex) return contentResponse({ status: "error", message: "Tài khoản không tồn tại." });
    const target = userAdminRecord_(context.data[rowIndex - 1], context.schema);
    if (!managerCanAccessUser_(context.actor, target)) return contentResponse({ status: "error", message: "Bạn không có quyền xóa tài khoản này." });
    if (target.role === "Admin" && countAdmins_(context.data, context.schema) <= 1) {
      return contentResponse({ status: "error", message: "Không thể xóa quản trị viên cuối cùng." });
    }

    context.sheet.deleteRow(rowIndex);
    writeAuditLog(context.actor.username, "deleteUser", username, "Xóa tài khoản khỏi Users");
    return contentResponse({ status: "success", message: "Đã xóa tài khoản." });
  } catch (error) {
    return contentResponse({ status: "error", message: "Không xóa được tài khoản: " + error.message });
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}
