(function() {
  if (typeof chrome === "undefined" || !chrome.runtime) return;

  const API_URL = "https://script.google.com/macros/s/AKfycbzW4TxDarLBOpZvO8hnE0R65IsCd95a5l-XPASjUmZNuefH5MiWMs8lCpLpggzFwyXK/exec";
  const API_TOKEN = "HAPU_QR_SECRET_2026";

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!message || message.type !== "bandien-api") return false;

    fetch(API_URL, {
      method: "POST",
      redirect: "follow",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        action: message.action,
        token: API_TOKEN,
        payload: message.payload || {}
      })
    })
      .then(async response => {
        const text = await response.text();
        if (!response.ok) throw new Error(`Máy chủ trả về HTTP ${response.status}`);
        try { return JSON.parse(text); }
        catch (_error) { throw new Error("Máy chủ trả về dữ liệu không hợp lệ."); }
      })
      .then(data => sendResponse({ ok: true, data }))
      .catch(error => sendResponse({ ok: false, error: error.message || String(error) }));

    return true;
  });
})();
