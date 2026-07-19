(() => {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  "use strict";

  const STORE_KEY = "bandienZaloJournal";
  const JOURNAL_URL = "https://bandien.github.io/scan/nhatky/";

  const storageGet = () => new Promise(resolve => chrome.storage.local.get(STORE_KEY, data => resolve(data[STORE_KEY] || {})));
  const storageSet = value => new Promise(resolve => chrome.storage.local.set({ [STORE_KEY]: value }, resolve));
  const api = (action, payload) => new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ type: "bandien-api", action, payload }, response => {
      if (chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message));
      if (!response?.ok) return reject(new Error(response?.error || "Không kết nối được máy chủ."));
      if (response.data?.status !== "success") return reject(new Error(response.data?.message || "Yêu cầu không thành công."));
      resolve(response.data);
    });
  });

  let floatingButton = null;

  function removeFloatingButton() {
    floatingButton?.remove();
    floatingButton = null;
  }

  function positionFloatingButton(rect) {
    const top = Math.max(8, rect.top - 36);
    const left = Math.min(Math.max(8, rect.left), window.innerWidth - 118);
    floatingButton.style.top = `${top}px`;
    floatingButton.style.left = `${left}px`;
  }

  function showFloatingButton(text, rect) {
    if (!floatingButton) {
      floatingButton = document.createElement("button");
      floatingButton.type = "button";
      floatingButton.className = "bandien-zalo-floating-btn";
      floatingButton.title = "Ghi nhận đoạn đã chọn vào Nhật ký công việc";
      floatingButton.textContent = "📋 Tạo việc";
      floatingButton.addEventListener("mousedown", event => event.preventDefault());
      document.body.appendChild(floatingButton);
    }
    floatingButton.dataset.bandienText = text;
    floatingButton.onclick = async event => {
      event.preventDefault();
      event.stopPropagation();
      const selectedText = floatingButton.dataset.bandienText || "";
      await createFromMessage(selectedText, floatingButton);
      removeFloatingButton();
    };
    positionFloatingButton(rect);
  }

  function handleSelectionChange() {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.rangeCount === 0) return removeFloatingButton();

    const text = selection.toString().replace(/\s+/g, " ").trim();
    if (!text || text.length > 5000) return removeFloatingButton();

    const anchorEl = selection.anchorNode?.nodeType === 1 ? selection.anchorNode : selection.anchorNode?.parentElement;
    if (!anchorEl || anchorEl.closest(".bandien-zalo-modal, .bandien-zalo-floating-btn, .bandien-zalo-toast")) return removeFloatingButton();

    const rect = selection.getRangeAt(0).getBoundingClientRect();
    if (!rect || (rect.width === 0 && rect.height === 0)) return removeFloatingButton();

    showFloatingButton(text, rect);
  }

  let selectionQueued = false;
  function queueSelectionCheck() {
    if (selectionQueued) return;
    selectionQueued = true;
    requestAnimationFrame(() => { selectionQueued = false; handleSelectionChange(); });
  }

  function modal(title, intro, fields, submitText) {
    return new Promise(resolve => {
      const overlay = document.createElement("div");
      overlay.className = "bandien-zalo-modal";
      const dialog = document.createElement("form");
      dialog.className = "bandien-zalo-dialog";
      dialog.innerHTML = `<h2>${title}</h2><p>${intro}</p>${fields}<div class="bandien-zalo-error"></div><div class="bandien-zalo-buttons"><button class="bandien-zalo-cancel" type="button">Hủy</button><button class="bandien-zalo-submit" type="submit">${submitText}</button></div>`;
      overlay.appendChild(dialog);
      document.body.appendChild(overlay);
      const close = value => { overlay.remove(); resolve(value); };
      dialog.querySelector(".bandien-zalo-cancel").onclick = () => close(null);
      overlay.addEventListener("mousedown", event => { if (event.target === overlay) close(null); });
      dialog.addEventListener("submit", async event => {
        event.preventDefault();
        const submit = dialog.querySelector(".bandien-zalo-submit");
        const error = dialog.querySelector(".bandien-zalo-error");
        submit.disabled = true;
        error.textContent = "";
        try {
          const values = Object.fromEntries(new FormData(dialog).entries());
          const result = await dialog.onBandienSubmit(values);
          close(result);
        } catch (problem) {
          error.textContent = problem.message || String(problem);
          submit.disabled = false;
        }
      });
      setTimeout(() => dialog.querySelector("input, textarea, select")?.focus(), 0);
      dialog.onBandienSubmit = async values => values;
    });
  }

  async function login() {
    const overlayPromise = modal(
      "Đăng nhập Nhật ký",
      "Chỉ cần thực hiện một lần. Phiên đăng nhập được lưu trong tiện ích trên máy này.",
      `<label>Username</label><input name="username" autocomplete="username" required>
       <label>PIN</label><input name="pin" type="password" autocomplete="current-password" required>`,
      "Đăng nhập"
    );
    const dialog = document.querySelector(".bandien-zalo-dialog");
    dialog.onBandienSubmit = async values => {
      const result = await api("nhatkyLogin", { username: values.username.trim(), pin: values.pin });
      const session = {
        actorUsername: result.user?.username || result.username || values.username.trim(),
        authToken: result.authToken,
        fullName: result.user?.fullName || result.fullName || ""
      };
      const options = await api("nhatkyExtensionOptions", session);
      session.teamOptions = options.teamOptions || [];
      session.staff = options.staff || [];
      session.defaultTeam = session.teamOptions[0] || "";
      await storageSet(session);
      return session;
    };
    return overlayPromise;
  }

  const escapeHtml = value => String(value || "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  const localDate = () => {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  };

  async function taskForm(text, session) {
    const teams = (session.teamOptions || []).map(team => `<option ${team === session.defaultTeam ? "selected" : ""}>${escapeHtml(team)}</option>`).join("");
    const staff = (session.staff || []).map(person => `<option value="${escapeHtml(person.name || person.username)}">${escapeHtml(person.name || person.username)}</option>`).join("");
    const promise = modal(
      "Tạo việc từ Zalo",
      "Kiểm tra nhanh nội dung trước khi ghi nhận.",
      `<label>Nội dung công việc</label><textarea name="task" required>${escapeHtml(text)}</textarea>
       <label>Tổ</label><select name="team" required>${teams}</select>
       <label>Người thực hiện</label><select name="assignee"><option value="${escapeHtml(session.fullName || session.actorUsername)}">${escapeHtml(session.fullName || session.actorUsername)} (tôi)</option>${staff}</select>
       <label>Ưu tiên</label><select name="priority"><option>Trung bình</option><option>Cao</option><option>Thấp</option></select>`,
      "Tạo việc & mở Nhật ký"
    );
    const dialog = document.querySelector(".bandien-zalo-dialog");
    dialog.onBandienSubmit = async values => {
      if (!values.team) throw new Error("Tài khoản chưa được phân tổ.");
      const result = await api("savePlanFromExtension", {
        actorUsername: session.actorUsername,
        authToken: session.authToken,
        plan: {
          date: localDate(),
          followUpDate: localDate(),
          team: values.team,
          task: values.task.trim(),
          assignee: values.assignee,
          priority: values.priority,
          type: "Phát sinh",
          sourceText: text
        }
      });
      session.defaultTeam = values.team;
      await storageSet(session);
      return result;
    };
    return promise;
  }

  function toast(message, isError = false) {
    document.querySelector(".bandien-zalo-toast")?.remove();
    const element = document.createElement("div");
    element.className = `bandien-zalo-toast${isError ? " error" : ""}`;
    element.textContent = message;
    document.body.appendChild(element);
    setTimeout(() => element.remove(), 4200);
  }

  async function createFromMessage(text, button) {
    if (!text) return toast("Không đọc được nội dung tin nhắn này.", true);
    button.disabled = true;
    button.textContent = "Đang xử lý…";
    try {
      let session = await storageGet();
      if (!session.actorUsername || !session.authToken) session = await login();
      if (!session) return;
      let result;
      try { result = await taskForm(text, session); }
      catch (error) {
        if (/phiên đăng nhập|đăng nhập lại/i.test(error.message)) {
          await storageSet({});
          session = await login();
          if (session) result = await taskForm(text, session);
        } else throw error;
      }
      if (!result) return;
      toast("Đã tạo việc. Đang mở Nhật ký…");
      window.open(result.journalUrl || `${JOURNAL_URL}?plan=${encodeURIComponent(result.planId)}`, "_blank", "noopener");
    } catch (error) {
      toast(error.message || "Không tạo được việc.", true);
    } finally {
      button.disabled = false;
      button.textContent = "📋 Tạo việc";
    }
  }

  document.addEventListener("selectionchange", queueSelectionCheck);
  document.addEventListener("mousedown", event => {
    if (floatingButton && event.target !== floatingButton) removeFloatingButton();
  });
  document.addEventListener("scroll", removeFloatingButton, true);
})();
