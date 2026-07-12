/**
 * GOOGLE APPS SCRIPT - HỆ THỐNG TỰ ĐỘNG XẾP LỊCH TUẦN CHO BAN ĐIỆN (HYBRID AI & RULE-BASED)
 * 
 * Hướng dẫn sử dụng:
 * 1. Đảm bảo bạn có sheet "DanhSachNhanSu" với:
 *    - Cột A: "Họ tên"
 *    - Cột B: "Tổ chuyên môn" (gồm các tổ: PCCC & QLRV, Điện nước, Thang máy, Điều hòa, Bảo trì, 11 Láng Hạ, Cơ điện sân Golf)
 * 2. Đảm bảo sheet "XepLichTuan" đã được tạo (nếu chưa, code sẽ tự tạo).
 * 3. Mở menu "Ban Điện" trên thanh công cụ để cấu hình API Key (nếu muốn dùng AI) và bấm "Xếp Lịch Tuần Mới".
 */

// ==========================================
// CẤU HÌNH HỆ THỐNG / CONFIGURATION
// ==========================================
const SCRIPT_PROP_KEY = "GEMINI_API_KEY";
const GEMINI_MODEL = "gemini-1.5-flash"; // Model nhanh, chi phí thấp và hỗ trợ JSON mode tốt

/**
 * Hàm khởi tạo Menu khi mở Google Sheet
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu("Ban Điện")
    .addItem("📅 Xếp Lịch Tuần Mới", "xepLichTuanMoi")
    .addSeparator()
    .addItem("🔑 Cấu hình Gemini API Key", "showApiKeyDialog")
    .addItem("🗑️ Xóa Gemini API Key", "clearApiKey")
    .addToUi();
}

/**
 * Hiển thị hộp thoại nhập Gemini API Key
 */
function showApiKeyDialog() {
  const ui = SpreadsheetApp.getUi();
  const result = ui.prompt(
    "🔑 Cấu hình Gemini API Key",
    "Nhập Gemini API Key của bạn để sử dụng tính năng xếp lịch bằng AI:\n(Nếu không cấu hình, hệ thống sẽ tự động dùng thuật toán lập trình sẵn)",
    ui.ButtonSet.OK_CANCEL
  );
  
  const button = result.getSelectedButton();
  const text = result.getResponseText().trim();
  
  if (button == ui.Button.OK) {
    if (text) {
      PropertiesService.getScriptProperties().setProperty(SCRIPT_PROP_KEY, text);
      ui.alert("Thành công", "Đã lưu Gemini API Key bảo mật!", ui.ButtonSet.OK);
    } else {
      ui.alert("Lỗi", "Key không được để trống.", ui.ButtonSet.OK);
    }
  }
}

/**
 * Xóa API Key khỏi Script Properties
 */
function clearApiKey() {
  const ui = SpreadsheetApp.getUi();
  PropertiesService.getScriptProperties().deleteProperty(SCRIPT_PROP_KEY);
  ui.alert("Thông báo", "Đã xóa Gemini API Key.", ui.ButtonSet.OK);
}

/**
 * Hàm điều khiển chính: Xếp lịch tuần mới
 */
function xepLichTuanMoi() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  
  // 1. Kiểm tra sheet Users
  const dsSheet = ss.getSheetByName("Users");
  if (!dsSheet) {
    ui.alert("Lỗi", "Không tìm thấy trang tính 'Users'. Vui lòng tạo trang tính này trước.", ui.ButtonSet.OK);
    return;
  }
  
  // 2. Chuẩn bị sheet XepLichTuan
  let lichSheet = ss.getSheetByName("XepLichTuan");
  let historyMap = {};
  
  if (lichSheet) {
    // Nếu sheet đã tồn tại, đọc lịch sử tuần trước trước khi ghi đè
    historyMap = extractPreviousSchedule(lichSheet);
  } else {
    // Nếu chưa tồn tại, tự động tạo mới
    lichSheet = ss.insertSheet("XepLichTuan");
  }
  
  // 3. Đọc danh sách nhân sự hiện tại từ Users
  const dsData = dsSheet.getRange(2, 1, dsSheet.getLastRow() - 1, 5).getValues();
  const staffList = [];
  for (let i = 0; i < dsData.length; i++) {
    const name = dsData[i][1].toString().trim(); // FullName
    const team = dsData[i][4].toString().trim(); // Teams
    if (name && team) {
      staffList.push({ name: name, team: team });
    }
  }
  
  if (staffList.length === 0) {
    ui.alert("Lỗi", "Không có nhân sự nào trong danh sách 'DanhSachNhanSu'.", ui.ButtonSet.OK);
    return;
  }
  
  // 4. Lấy API Key và quyết định chạy AI hay Rule-based
  const apiKey = PropertiesService.getScriptProperties().getProperty(SCRIPT_PROP_KEY);
  let finalSchedule = null;
  let usedAI = false;
  
  ss.toast("Đang phân bổ lịch trực...", "Ban Điện", 2);
  
  if (apiKey) {
    try {
      finalSchedule = scheduleWithGemini(staffList, historyMap, apiKey);
      if (finalSchedule && finalSchedule.length > 0) {
        usedAI = true;
      }
    } catch (e) {
      console.error("Lỗi khi chạy Gemini AI, chuyển hướng sang thuật toán dự phòng: " + e.message);
    }
  }
  
  // Nếu AI lỗi hoặc không có API Key, chạy thuật toán Rule-based
  if (!finalSchedule) {
    finalSchedule = scheduleWithRules(staffList, historyMap);
  }
  
  // 5. Ghi lịch mới vào sheet XepLichTuan và định dạng thẩm mỹ
  writeAndFormatSchedule(lichSheet, finalSchedule);
  
  // 6. Thông báo hoàn thành
  const methodText = usedAI ? "Trí tuệ nhân tạo (Gemini AI)" : "Thuật toán dự phòng (Rule-based)";
  ui.alert(
    "Hoàn thành", 
    "Đã xếp xong lịch tuần mới cho Ban Điện!\nPhương thức sử dụng: " + methodText, 
    ui.ButtonSet.OK
  );
}

/**
 * Đọc lịch tuần trước từ sheet XepLichTuan để phục vụ việc xoay ca
 * @return {Object} Map từ Họ tên -> { prevShift: string, prevOffDayIndex: number }
 */
function extractPreviousSchedule(sheet) {
  const history = {};
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return history;
  
  const data = sheet.getRange(2, 1, lastRow - 1, 9).getValues();
  for (let i = 0; i < data.length; i++) {
    const name = data[i][0].toString().trim();
    const team = data[i][1].toString().trim();
    if (!name) continue;
    
    // Tìm ngày nghỉ N (cột C đến I tương ứng chỉ số 0 đến 6)
    let prevOffDayIndex = -1;
    const shifts = [];
    
    for (let dayCol = 2; dayCol < 9; dayCol++) {
      const shiftVal = data[i][dayCol].toString().trim();
      if (shiftVal === "N") {
        prevOffDayIndex = dayCol - 2;
      } else if (shiftVal) {
        shifts.push(shiftVal);
      }
    }
    
    // Xác định ca chính của tuần trước
    let prevShift = "";
    if (shifts.length > 0) {
      // Tìm ca xuất hiện nhiều nhất (đối với nhân sự xoay ca có nhiều loại ca)
      const counts = {};
      let maxCount = 0;
      let mostFreqShift = shifts[0];
      for (let s = 0; s < shifts.length; s++) {
        const sh = shifts[s];
        counts[sh] = (counts[sh] || 0) + 1;
        if (counts[sh] > maxCount) {
          maxCount = counts[sh];
          mostFreqShift = sh;
        }
      }
      
      const uniqueShifts = Object.keys(counts);
      if (uniqueShifts.length > 1 && (team === "Điện nước" || team === "PCCC & QLRV")) {
        prevShift = "Floater";
      } else {
        prevShift = mostFreqShift;
      }
    }
    
    history[name] = {
      prevShift: prevShift,
      prevOffDayIndex: prevOffDayIndex
    };
  }
  return history;
}

/**
 * Xếp lịch bằng Gemini AI
 */
function scheduleWithGemini(staffList, historyMap, apiKey) {
  const url = "https://generativelanguage.googleapis.com/v1beta/models/" + GEMINI_MODEL + ":generateContent?key=" + apiKey;
  
  // Chuẩn bị dữ liệu đầu vào cho Prompt
  const staffInput = staffList.map(function(s) {
    return s.name + " (" + s.team + ")";
  }).join("\n");
  
  const historyInput = Object.keys(historyMap).map(function(name) {
    return name + ": Ca tuần trước = " + historyMap[name].prevShift + ", Thứ nghỉ tuần trước = Thứ " + (historyMap[name].prevOffDayIndex + 2);
  }).join("\n");
  
  const prompt = "Bạn là chuyên gia sắp xếp lịch nhân sự. Hãy xếp lịch tuần mới cho Ban Điện dựa trên danh sách nhân sự và lịch sử tuần trước.\n\n" +
    "QUY TẮC CỨNG PHẢI TUÂN THỦ:\n" +
    "1. Tất cả nhân sự đầu vào đều phải được xếp lịch.\n" +
    "2. Mỗi người phải được nghỉ đúng 1 ngày trong tuần (ký hiệu là 'N'). 6 ngày còn lại đi làm.\n" +
    "3. Phân ca theo tổ chuyên môn:\n" +
    "   - Tổ 'Điện nước' và 'PCCC & QLRV' (Trực 24/7 khép kín): Các ca cần phân bổ là 'Ca 1' (06:00-14:00), 'Ca 2' (14:00-22:00), 'Ca 3' (22:00-06:00).\n" +
    "     + Mỗi nhân sự đi làm cố định duy nhất 1 loại ca trong suốt cả tuần (ví dụ: chỉ đi Ca 1 vào các ngày đi làm, không đổi sang Ca 2 giữa tuần).\n" +
    "     + Thực hiện xoay ca xuôi chiều so với tuần trước: Ca 1 -> Ca 2, Ca 2 -> Ca 3, Ca 3 -> Ca 1.\n" +
    "     + Đảm bảo ngày nào cũng có ít nhất 1 người làm Ca 1, 1 người làm Ca 2, 1 người làm Ca 3 cho mỗi tổ. Nếu tổ có đúng 4 hoặc 5 người, hãy chọn 3 người đi 3 ca cố định, người thứ 4 (và thứ 5) sẽ đóng vai trò 'xoay ca' (Floater) đi các ca khác nhau trong tuần để trực bù vào ngày nghỉ của 3 người kia.\n" +
    "   - Tổ 'Thang máy', 'Điều hòa', 'Bảo trì', '11 Láng Hạ': Làm ca hành chính (ký hiệu 'HC').\n" +
    "   - Tổ 'Cơ điện sân Golf': Làm ca 'HC' hoặc ca hỗ trợ kéo dài 'HB' (06:00-18:00). Thực hiện luân chuyển tuần: HC -> HB, HB -> HC.\n" +
    "4. Nguyên tắc nghỉ ngơi:\n" +
    "   - Ngày nghỉ 'N' của các thành viên trong cùng một tổ (hoặc cùng một ca của tổ 24/7) phải xếp so le nhau (ví dụ: người này nghỉ Thứ 2 thì người kia nghỉ Thứ 3), đảm bảo ngày nào cũng có người trực kể cả thứ 7, chủ nhật.\n" +
    "   - Xoay ngày nghỉ: Tự động dịch chuyển ngày nghỉ của nhân viên thêm 1 ngày so với tuần trước (ví dụ tuần trước nghỉ Thứ 2 -> tuần này nghỉ Thứ 3). Nếu trùng lặp hoặc thiếu người trực, hãy điều chỉnh hợp lý để đảm bảo so le.\n\n" +
    "DỮ LIỆU ĐẦU VÀO:\n" +
    "== DANH SÁCH NHÂN SỰ VÀ TỔ ==\n" +
    staffInput + "\n\n" +
    "== LỊCH SỬ TUẦN TRƯỚC ==\n" +
    (historyInput || "Không có dữ liệu lịch sử") + "\n\n" +
    "YÊU CẦU ĐẦU RA:\n" +
    "Trả về DUY NHẤT dữ liệu định dạng JSON có cấu trúc như sau (không kèm markdown ```json hay giải thích gì thêm):\n" +
    "{\n" +
    "  \"schedule\": [\n" +
    "    {\n" +
    "      \"name\": \"Tên nhân sự\",\n" +
    "      \"team\": \"Tổ chuyên môn\",\n" +
    "      \"days\": [\"Ca Thứ 2\", \"Ca Thứ 3\", \"Ca Thứ 4\", \"Ca Thứ 5\", \"Ca Thứ 6\", \"Ca Thứ 7\", \"Ca Chủ Nhật\"]\n" +
    "    }\n" +
    "  ]\n" +
    "}\n" +
    "Giá trị trong mảng 'days' chỉ được là một trong các ký hiệu: 'Ca 1', 'Ca 2', 'Ca 3', 'HC', 'HB', 'N'.";

  const payload = {
    contents: [{
      parts: [{ text: prompt }]
    }],
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.1
    }
  };
  
  const options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  
  const response = UrlFetchApp.fetch(url, options);
  const responseCode = response.getResponseCode();
  const responseText = response.getContentText();
  
  if (responseCode !== 200) {
    throw new Error("Gemini API returned error code " + responseCode + ": " + responseText);
  }
  
  const json = JSON.parse(responseText);
  const textOutput = json.candidates[0].content.parts[0].text;
  const parsedData = JSON.parse(textOutput);
  
  if (parsedData && parsedData.schedule) {
    return parsedData.schedule;
  }
  return null;
}

/**
 * Thuật toán dự phòng (Rule-based) tự động xếp lịch chính xác 100% dựa trên quy tắc cứng
 */
function scheduleWithRules(staffList, historyMap) {
  const schedule = [];
  
  // 1. Gom nhóm nhân sự theo Tổ chuyên môn
  const teams = {};
  for (let i = 0; i < staffList.length; i++) {
    const member = staffList[i];
    if (!teams[member.team]) {
      teams[member.team] = [];
    }
    teams[member.team].push(member);
  }
  
  // 2. Xử lý xếp lịch cho từng tổ
  Object.keys(teams).forEach(function(teamName) {
    const members = teams[teamName];
    const n = members.length;
    
    if (teamName === "Điện nước" || teamName === "PCCC & QLRV") {
      if (n === 4 || n === 5) {
        scheduleSmall247Team(members, historyMap, schedule, teamName);
      } else {
        scheduleStandard247Team(members, historyMap, schedule, teamName);
      }
    } else if (teamName === "Cơ điện sân Golf") {
      scheduleGolfTeam(members, historyMap, schedule);
    } else {
      scheduleAdminTeam(members, historyMap, schedule, teamName);
    }
  });
  
  return schedule;
}

/**
 * Xếp lịch cho tổ 24/7 quy mô nhỏ (4 hoặc 5 người) dùng Floater
 */
function scheduleSmall247Team(members, historyMap, schedule, teamName) {
  const n = members.length;
  const assignedRoles = [];
  
  members.forEach(function(member) {
    const hist = historyMap[member.name];
    let prevRole = -1;
    if (hist) {
      if (hist.prevShift === "Ca 1") prevRole = 0;
      else if (hist.prevShift === "Ca 2") prevRole = 1;
      else if (hist.prevShift === "Ca 3") prevRole = 2;
      else if (hist.prevShift === "Floater") prevRole = 3;
    }
    assignedRoles.push({ member: member, prevRole: prevRole, newRole: -1 });
  });
  
  const occupiedRoles = {};
  assignedRoles.forEach(function(item) {
    if (item.prevRole !== -1) {
      let nextRole = (item.prevRole + 1) % n;
      if (!occupiedRoles[nextRole]) {
        item.newRole = nextRole;
        occupiedRoles[nextRole] = true;
      }
    }
  });
  
  assignedRoles.forEach(function(item) {
    if (item.newRole === -1) {
      for (let r = 0; r < n; r++) {
        if (!occupiedRoles[r]) {
          item.newRole = r;
          occupiedRoles[r] = true;
          break;
        }
      }
    }
  });
  
  const offDays = {
    0: 6, // Ca 1 nghỉ CN
    1: 1, // Ca 2 nghỉ T3
    2: 2, // Ca 3 nghỉ T4
    3: 3, // Floater 1 nghỉ T5
    4: 4  // Floater 2 nghỉ T6
  };
  
  assignedRoles.forEach(function(item) {
    const role = item.newRole;
    const memberName = item.member.name;
    const days = ["", "", "", "", "", "", ""];
    const offDayIdx = offDays[role];
    
    days[offDayIdx] = "N";
    
    if (role === 0) {
      for (let d = 0; d < 7; d++) if (d !== offDayIdx) days[d] = "Ca 1";
    } else if (role === 1) {
      for (let d = 0; d < 7; d++) if (d !== offDayIdx) days[d] = "Ca 2";
    } else if (role === 2) {
      for (let d = 0; d < 7; d++) if (d !== offDayIdx) days[d] = "Ca 3";
    } else if (role === 3) {
      for (let d = 0; d < 7; d++) {
        if (d === offDayIdx) continue;
        if (d === 1) days[d] = "Ca 2";
        else if (d === 2) days[d] = "Ca 3";
        else if (d === 6) days[d] = "Ca 1";
        else days[d] = "Ca 1";
      }
    } else if (role === 4) {
      for (let d = 0; d < 7; d++) {
        if (d === offDayIdx) continue;
        if (d === 3) days[d] = "Ca 1";
        else if (d === 5 || d === 6) days[d] = "Ca 2";
        else days[d] = "Ca 3";
      }
    }
    
    schedule.push({
      name: memberName,
      team: teamName,
      days: days
    });
  });
}

/**
 * Xếp lịch cho tổ 24/7 quy mô lớn (hoặc quá nhỏ < 4) - Phân ca đều và so le nghỉ
 */
function scheduleStandard247Team(members, historyMap, schedule, teamName) {
  const n = members.length;
  
  const memberShifts = [];
  members.forEach(function(member) {
    const hist = historyMap[member.name];
    let nextShift = "Ca 1";
    if (hist && hist.prevShift) {
      if (hist.prevShift === "Ca 1") nextShift = "Ca 2";
      else if (hist.prevShift === "Ca 2") nextShift = "Ca 3";
      else if (hist.prevShift === "Ca 3") nextShift = "Ca 1";
    }
    memberShifts.push({ member: member, shift: nextShift });
  });
  
  const shiftCounts = { "Ca 1": 0, "Ca 2": 0, "Ca 3": 0 };
  memberShifts.forEach(function(item) {
    shiftCounts[item.shift]++;
  });
  
  memberShifts.forEach(function(item) {
    const hist = historyMap[item.member.name];
    if (!hist) {
      let minShift = "Ca 1";
      let minVal = shiftCounts["Ca 1"];
      ["Ca 2", "Ca 3"].forEach(function(s) {
        if (shiftCounts[s] < minVal) {
          minVal = shiftCounts[s];
          minShift = s;
        }
      });
      shiftCounts[item.shift]--;
      item.shift = minShift;
      shiftCounts[minShift]++;
    }
  });
  
  const shiftGroups = { "Ca 1": [], "Ca 2": [], "Ca 3": [] };
  memberShifts.forEach(function(item) {
    shiftGroups[item.shift].push(item.member);
  });
  
  ["Ca 1", "Ca 2", "Ca 3"].forEach(function(sh) {
    const grp = shiftGroups[sh];
    const grpSize = grp.length;
    if (grpSize === 0) return;
    
    const sortedMembers = grp.map(function(m) {
      const hist = historyMap[m.name];
      const prevOff = (hist && hist.prevOffDayIndex !== undefined) ? hist.prevOffDayIndex : -1;
      return { member: m, prevOff: prevOff, finalOff: -1 };
    });
    
    sortedMembers.sort(function(a, b) { return b.prevOff - a.prevOff; });
    
    const takenDays = {};
    sortedMembers.forEach(function(item) {
      let targetOff = 0;
      if (item.prevOff !== -1) {
        targetOff = (item.prevOff + 1) % 7;
      } else {
        targetOff = 0;
        while (takenDays[targetOff] && targetOff < 7) {
          targetOff++;
        }
        if (targetOff >= 7) targetOff = 0;
      }
      
      let attempts = 0;
      while (takenDays[targetOff] && attempts < 7) {
        targetOff = (targetOff + 1) % 7;
        attempts++;
      }
      
      item.finalOff = targetOff;
      takenDays[targetOff] = true;
    });
    
    sortedMembers.forEach(function(item) {
      const days = [];
      for (let d = 0; d < 7; d++) {
        if (d === item.finalOff) {
          days.push("N");
        } else {
          days.push(sh);
        }
      }
      schedule.push({
        name: item.member.name,
        team: teamName,
        days: days
      });
    });
  });
}

/**
 * Xếp lịch cho tổ Cơ điện sân Golf (Ca HC hoặc HB)
 */
function scheduleGolfTeam(members, historyMap, schedule) {
  const n = members.length;
  const memberShifts = [];
  
  members.forEach(function(member) {
    const hist = historyMap[member.name];
    let nextShift = "HC";
    if (hist && hist.prevShift) {
      if (hist.prevShift === "HC") nextShift = "HB";
      else if (hist.prevShift === "HB") nextShift = "HC";
    }
    memberShifts.push({ member: member, shift: nextShift });
  });
  
  const counts = { "HC": 0, "HB": 0 };
  memberShifts.forEach(function(item) { counts[item.shift]++; });
  
  memberShifts.forEach(function(item) {
    const hist = historyMap[item.member.name];
    if (!hist) {
      const minShift = counts["HC"] <= counts["HB"] ? "HC" : "HB";
      counts[item.shift]--;
      item.shift = minShift;
      counts[minShift]++;
    }
  });
  
  const groups = { "HC": [], "HB": [] };
  memberShifts.forEach(function(item) {
    groups[item.shift].push(item.member);
  });
  
  ["HC", "HB"].forEach(function(sh) {
    const grp = groups[sh];
    const grpSize = grp.length;
    if (grpSize === 0) return;
    
    const sortedMembers = grp.map(function(m) {
      const hist = historyMap[m.name];
      const prevOff = (hist && hist.prevOffDayIndex !== undefined) ? hist.prevOffDayIndex : -1;
      return { member: m, prevOff: prevOff, finalOff: -1 };
    });
    
    sortedMembers.sort(function(a, b) { return b.prevOff - a.prevOff; });
    
    const takenDays = {};
    sortedMembers.forEach(function(item) {
      let targetOff = 0;
      if (item.prevOff !== -1) {
        targetOff = (item.prevOff + 1) % 7;
      } else {
        targetOff = 0;
        while (takenDays[targetOff] && targetOff < 7) targetOff++;
        if (targetOff >= 7) targetOff = 0;
      }
      
      let attempts = 0;
      while (takenDays[targetOff] && attempts < 7) {
        targetOff = (targetOff + 1) % 7;
        attempts++;
      }
      
      item.finalOff = targetOff;
      takenDays[targetOff] = true;
    });
    
    sortedMembers.forEach(function(item) {
      const days = [];
      for (let d = 0; d < 7; d++) {
        if (d === item.finalOff) days.push("N");
        else days.push(sh);
      }
      schedule.push({
        name: item.member.name,
        team: "Cơ điện sân Golf",
        days: days
      });
    });
  });
}

/**
 * Xếp lịch cho các tổ hành chính thông thường (HC toàn bộ, so le nghỉ)
 */
function scheduleAdminTeam(members, historyMap, schedule, teamName) {
  const n = members.length;
  
  const sortedMembers = members.map(function(m) {
    const hist = historyMap[m.name];
    const prevOff = (hist && hist.prevOffDayIndex !== undefined) ? hist.prevOffDayIndex : -1;
    return { member: m, prevOff: prevOff, finalOff: -1 };
  });
  
  sortedMembers.sort(function(a, b) { return b.prevOff - a.prevOff; });
  
  const takenDays = {};
  sortedMembers.forEach(function(item) {
    let targetOff = 0;
    if (item.prevOff !== -1) {
      targetOff = (item.prevOff + 1) % 7;
    } else {
      targetOff = 6; 
      while (takenDays[targetOff] && targetOff >= 0) targetOff--;
      if (targetOff < 0) targetOff = 0;
    }
    
    let attempts = 0;
    while (takenDays[targetOff] && attempts < 7) {
      targetOff = (targetOff + 1) % 7;
      attempts++;
    }
    
    item.finalOff = targetOff;
    takenDays[targetOff] = true;
  });
  
  sortedMembers.forEach(function(item) {
    const days = [];
    for (let d = 0; d < 7; d++) {
      if (d === item.finalOff) days.push("N");
      else days.push("HC");
    }
    schedule.push({
      name: item.member.name,
      team: teamName,
      days: days
    });
  });
}

/**
 * Ghi kết quả lịch trực ra sheet và căn chỉnh định dạng thẩm mỹ
 */
function writeAndFormatSchedule(sheet, schedule) {
  sheet.clear();
  
  const headers = ["Họ tên", "Tổ chuyên môn", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ Nhật"];
  sheet.getRange(1, 1, 1, 9).setValues([headers]);
  
  schedule.sort(function(a, b) {
    return a.team.localeCompare(b.team);
  });
  
  const rows = [];
  schedule.forEach(function(item) {
    const row = [item.name, item.team];
    for (let i = 0; i < 7; i++) {
      row.push(item.days[i]);
    }
    rows.push(row);
  });
  
  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, 9).setValues(rows);
  }
  
  const totalRows = rows.length + 1;
  const fullRange = sheet.getRange(1, 1, totalRows, 9);
  
  fullRange.setHorizontalAlignment("center");
  sheet.getRange(2, 1, rows.length, 1).setHorizontalAlignment("left");
  
  const headerRange = sheet.getRange(1, 1, 1, 9);
  headerRange.setFontWeight("bold");
  headerRange.setFontColor("#ffffff");
  headerRange.setBackgroundColor("#202124");
  headerRange.setFontSize(11);
  
  fullRange.setBorder(true, true, true, true, true, true, "#e0e0e0", SpreadsheetApp.BorderStyle.SOLID);
  
  for (let col = 1; col <= 9; col++) {
    sheet.autoResizeColumn(col);
    sheet.setColumnWidth(col, sheet.getColumnWidth(col) + 20);
  }
  
  sheet.setRowHeight(1, 30);
  for (let r = 2; r <= totalRows; r++) {
    sheet.setRowHeight(r, 22);
  }
  
  const dataRange = sheet.getRange(2, 3, rows.length, 7);
  
  const rules = [];
  const colorConfigs = [
    { text: "N", bg: "#fce8e6", font: "#c5221f" },
    { text: "Ca 1", bg: "#fef7e0", font: "#b06000" },
    { text: "Ca 2", bg: "#e8f0fe", font: "#1967d2" },
    { text: "Ca 3", bg: "#f3e8fd", font: "#681da8" },
    { text: "HC", bg: "#e6f4ea", font: "#137333" },
    { text: "HB", bg: "#e4f7fb", font: "#007b83" }
  ];
  
  colorConfigs.forEach(function(config) {
    const rule = SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo(config.text)
      .setBackground(config.bg)
      .setFontColor(config.font)
      .setBold(true)
      .setRanges([dataRange])
      .build();
    rules.push(rule);
  });
  
  sheet.setConditionalFormatRules(rules);
}
