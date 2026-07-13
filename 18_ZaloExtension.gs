// ==========================================
// 18_ZaloExtension.gs - API an toàn cho extension Zalo → Nhật ký
// ==========================================

function getZaloExtensionActor_(payload) {
  const actorUsername = String(payload.actorUsername || "").trim();
  const authToken = String(payload.authToken || "").trim();
  if (!actorUsername || !authToken) {
    return { ok: false, message: "Vui lòng đăng nhập Username + PIN trên extension." };
  }

  const sessionUsername = getNhatKySessionUsername_(authToken);
  if (!sessionUsername || sessionUsername.toLowerCase() !== actorUsername.toLowerCase()) {
    return { ok: false, message: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại." };
  }

  const sheet = getSheet(SHEETS.USERS);
  const data = sheet.getDataRange().getValues();
  const schema = getUsersSchema_(data);
  const rowIndex = findAccountRow_(sheet, actorUsername);
  if (!rowIndex) return { ok: false, message: "Tài khoản không còn tồn tại." };

  const row = data[rowIndex - 1];
  return {
    ok: true,
    username: String(row[schema.usernameIndex] || actorUsername).trim(),
    fullName: schema.fullNameIndex >= 0 ? String(row[schema.fullNameIndex] || "").trim() : "",
    role: String(row[schema.roleIndex] || "User").trim(),
    teams: String(row[schema.teamsIndex] || "").trim(),
    sheet: sheet,
    data: data,
    schema: schema
  };
}

function extensionTeamOptions_(actor) {
  if (!isPrivilegedTeams_(actor.teams)) return splitTeams_(actor.teams);

  const teams = [];
  actor.data.slice(1).forEach(function(row) {
    splitTeams_(row[actor.schema.teamsIndex]).forEach(function(team) {
      const normalized = team.toLowerCase();
      if (team !== "*" && normalized !== "admin" && teams.indexOf(team) < 0) teams.push(team);
    });
  });
  ["Tổ cơ điện", "Tổ điện nước"].forEach(function(team) {
    if (teams.indexOf(team) < 0) teams.push(team);
  });
  return teams.sort();
}

function handleNhatKyExtensionOptions(params) {
  try {
    const payload = params.payload || {};
    const actor = getZaloExtensionActor_(payload);
    if (!actor.ok) return contentResponse({ status: "error", message: actor.message });

    const teamOptions = extensionTeamOptions_(actor);
    if (!teamOptions.length) {
      return contentResponse({ status: "error", message: "Tài khoản chưa được phân tổ." });
    }
    const privileged = isPrivilegedTeams_(actor.teams);
    const staff = actor.data.slice(1).map(function(row) {
      const username = String(row[actor.schema.usernameIndex] || "").trim();
      const fullName = actor.schema.fullNameIndex >= 0 ? String(row[actor.schema.fullNameIndex] || "").trim() : "";
      const teams = String(row[actor.schema.teamsIndex] || "").trim();
      return { username: username, name: fullName || username, teams: teams };
    }).filter(function(person) {
      if (!person.username) return false;
      if (privileged) return true;
      return splitTeams_(person.teams).some(function(team) { return teamOptions.indexOf(team) >= 0; });
    }).sort(function(a, b) {
      return a.name.localeCompare(b.name);
    });

    return contentResponse({
      status: "success",
      actor: { username: actor.username, fullName: actor.fullName, role: actor.role, teams: actor.teams },
      teamOptions: teamOptions,
      staff: staff
    });
  } catch (error) {
    return contentResponse({ status: "error", message: "Không tải được danh mục extension: " + error.message });
  }
}

function extensionText_(value, maxLength) {
  return String(value || "").trim().slice(0, maxLength);
}

function handleSavePlanFromExtension(params) {
  try {
    const payload = params.payload || {};
    const actor = getZaloExtensionActor_(payload);
    if (!actor.ok) return contentResponse({ status: "error", message: actor.message });

    const input = payload.plan || {};
    const team = extensionText_(input.team, 100);
    if (!team || !userCanAccessTeam_(actor.teams, team)) {
      return contentResponse({ status: "error", message: "Bạn không có quyền tạo việc cho tổ đã chọn." });
    }

    const date = formatPlanDate_(input.date);
    const followUpDate = formatPlanDate_(input.followUpDate) || date;
    const dateEnd = formatPlanDate_(input.dateEnd);
    const task = extensionText_(input.task, 3000);
    if (!date) return contentResponse({ status: "error", message: "Thiếu ngày bắt đầu." });
    if (!task) return contentResponse({ status: "error", message: "Thiếu nội dung công việc." });
    if (dateEnd && dateEnd < date) return contentResponse({ status: "error", message: "Hạn cuối không được trước ngày bắt đầu." });

    const priorityInput = extensionText_(input.priority, 30);
    const priority = ["Thấp", "Trung bình", "Cao"].indexOf(priorityInput) >= 0 ? priorityInput : "Trung bình";
    const type = extensionText_(input.type, 30) === "Kế hoạch" ? "Kế hoạch" : "Phát sinh";

    const planId = "PLAN-" + date.replace(/-/g, "") + "-" + new Date().getTime();
    const plan = {
      id: planId,
      date: date,
      followUpDate: followUpDate,
      dateEnd: dateEnd,
      time: extensionText_(input.time, 20),
      team: team,
      area: extensionText_(input.area, 300),
      asset: extensionText_(input.asset, 300),
      task: task,
      assignee: extensionText_(input.assignee, 1000),
      priority: priority,
      status: "Chưa làm",
      type: type,
      planQty: input.planQty === 0 || input.planQty ? Number(input.planQty) : "",
      unit: extensionText_(input.unit, 50),
      source: "Zalo Web",
      sourceText: extensionText_(input.sourceText, 5000),
      updatedBy: actor.username
    };
    if (plan.planQty !== "" && (isNaN(plan.planQty) || plan.planQty < 0)) {
      return contentResponse({ status: "error", message: "Khối lượng không hợp lệ." });
    }

    handleSavePlan({ payload: plan });
    return contentResponse({
      status: "success",
      planId: planId,
      journalUrl: "https://bandien.github.io/scan/nhatky/?plan=" + encodeURIComponent(planId)
    });
  } catch (error) {
    return contentResponse({ status: "error", message: "Không tạo được việc từ Zalo: " + error.message });
  }
}
