// ==========================================
// js/sso.js — PHIÊN ĐĂNG NHẬP DÙNG CHUNG (SSO)
// ==========================================
// Nguồn duy nhất định nghĩa các key phiên đăng nhập, dùng bởi:
//   - index.html (app quét chính)
//   - nhatky/baocao_stitch.html (Tổng quan)
//   - nhatky/caidat_stitch.html (Nhiều hơn)
// Đăng xuất từ bất kỳ trang nào cũng phải giết phiên trên mọi trang
// (cùng origin nên chia sẻ localStorage).

(function () {
  var KEYS = {
    user: "currentUser",
    savedUsername: "savedUsername",
    savedPassword: "savedPassword",
    nhatkyEmployee: "bandien_nhatky_employee",
    nhatkyTeamGroup: "bandien_nhatky_teamgroup",
    scanHistory: "bandien_scan_history",
    scanPrefs: "bandien_scan_prefs",
    offlineLogs: "offline_logs",
    nhatkyLogs: "bandien_nhatky_logs",
    nhatkyPlans: "bandien_nhatky_plans",
    lastSync: "bandien_last_sync",
    // App data keys (xóa khi đăng xuất)
    localDevicesMap: "localDevicesMap",
    localDevices: "localDevices",
    localChecklists: "localChecklists",
    localWorkOrders: "localWorkOrders",
    localUsers: "localUsers",
    localStaff: "localStaff",
    localProjects: "localProjects",
    localShifts: "localShifts"
  };

  function safeParse(raw, fallback) {
    try { return JSON.parse(raw); } catch (e) { return fallback; }
  }

  function getUser() {
    var raw = localStorage.getItem(KEYS.user) || sessionStorage.getItem(KEYS.user);
    if (raw) {
      var parsed = safeParse(raw, null);
      if (parsed) {
        if (parsed.loginAt) {
          var now = Date.now();
          var thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
          if (now - parsed.loginAt > thirtyDaysMs) {
            logout();
            return null;
          }
        }
        return parsed;
      }
    }
    var loginAtStr = localStorage.getItem('bandien_nhatky_login_at');
    if (loginAtStr) {
      var loginAt = parseInt(loginAtStr, 10);
      if (!isNaN(loginAt)) {
        var now = Date.now();
        var thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
        if (now - loginAt > thirtyDaysMs) {
          logout();
          return null;
        }
      }
    }
    var name = localStorage.getItem(KEYS.nhatkyEmployee);
    if (name) return { username: name, name: name, teams: localStorage.getItem(KEYS.nhatkyTeamGroup) || "" };
    return null;
  }

  function isLoggedIn() {
    return Boolean(getUser());
  }

  function requireLogin(redirectUrl) {
    var user = getUser();
    if (user) return user;
    location.href = redirectUrl || "../index.html";
    return null;
  }

  // Mirror hoàn chỉnh của doLogout() trong index.html
  function logout() {
    localStorage.removeItem(KEYS.user);
    sessionStorage.removeItem(KEYS.user);
    localStorage.removeItem(KEYS.savedUsername);
    localStorage.removeItem(KEYS.savedPassword);
    localStorage.removeItem(KEYS.nhatkyEmployee);
    localStorage.removeItem(KEYS.nhatkyTeamGroup);
    localStorage.removeItem(KEYS.localDevices);
    localStorage.removeItem(KEYS.localDevicesMap);
    localStorage.removeItem(KEYS.localChecklists);
    localStorage.removeItem(KEYS.localWorkOrders);
    localStorage.removeItem(KEYS.localUsers);
    localStorage.removeItem(KEYS.localStaff);
    localStorage.removeItem(KEYS.localProjects);
    localStorage.removeItem(KEYS.localShifts);
    localStorage.removeItem(KEYS.offlineLogs);
  }

  // Đếm mục chờ đồng bộ: hàng đợi kiểm tra thiết bị + nhật ký/kế hoạch nhatky
  function pendingSyncCount() {
    var count = 0;
    var inspections = safeParse(localStorage.getItem(KEYS.offlineLogs) || "[]", []);
    if (Array.isArray(inspections)) count += inspections.length;
    var logs = safeParse(localStorage.getItem(KEYS.nhatkyLogs) || "[]", []);
    if (Array.isArray(logs)) {
      count += logs.filter(function (l) {
        return l && l.syncStatus && l.syncStatus !== "synced";
      }).length;
    }
    var plans = safeParse(localStorage.getItem(KEYS.nhatkyPlans) || "[]", []);
    if (Array.isArray(plans)) {
      count += plans.filter(function (p) {
        return p && (p.syncStatus === "pending" || p.syncStatus === "syncing");
      }).length;
    }
    return count;
  }

  function markSynced() {
    localStorage.setItem(KEYS.lastSync, new Date().toISOString());
  }

  function lastSync() {
    return localStorage.getItem(KEYS.lastSync) || "";
  }

  window.BD_SSO = {
    KEYS: KEYS,
    getUser: getUser,
    isLoggedIn: isLoggedIn,
    requireLogin: requireLogin,
    logout: logout,
    pendingSyncCount: pendingSyncCount,
    markSynced: markSynced,
    lastSync: lastSync
  };
})();
