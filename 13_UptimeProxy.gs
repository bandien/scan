// ==========================================
// 13_UptimeProxy.gs — PING PROXY CHO STATUS PAGE
// ==========================================
// status.html chạy trên GitHub Pages (HTTPS) nên trình duyệt chặn fetch
// trực tiếp tới server http:// (Mixed Content). Trang đó gọi qua đây để
// GAS kiểm tra server hộ (server-side) rồi trả kết quả JSON qua HTTPS.
// Chỉ cho phép ping host trong PING_ALLOWED_HOSTS — không mở proxy tự do.

const PING_ALLOWED_HOSTS = [
  'chieusang.montanagc.com.vn'
];

function handlePingUrl(e) {
  const url = (e.parameter.url || '').trim();
  const m = url.match(/^https?:\/\/([^\/:?#]+)/i);
  const host = m ? m[1].toLowerCase() : '';

  if (!host || PING_ALLOWED_HOSTS.indexOf(host) === -1) {
    return contentResponse({ status: 'error', message: 'Host not allowed: ' + (host || url) });
  }

  const started = Date.now();
  try {
    const res = UrlFetchApp.fetch(url, {
      muteHttpExceptions: true,
      followRedirects: true,
      validateHttpsCertificates: false
    });
    const code = res.getResponseCode();
    return contentResponse({
      status: 'success',
      online: code > 0 && code < 500,
      httpCode: code,
      latencyMs: Date.now() - started
    });
  } catch (err) {
    const msg = String(err);
    // Script chưa được cấp quyền UrlFetchApp → báo lỗi hệ thống,
    // KHÔNG được kết luận server đích offline
    if (msg.indexOf('external_request') !== -1 || msg.indexOf('UrlFetchApp') !== -1) {
      return contentResponse({ status: 'error', message: 'Proxy chưa được cấp quyền UrlFetchApp. Chạy testPingUrl trong editor để cấp quyền. ' + msg });
    }
    // Không kết nối được (DNS, refused, timeout) → server đích offline
    return contentResponse({
      status: 'success',
      online: false,
      httpCode: 0,
      latencyMs: Date.now() - started,
      message: msg
    });
  }
}

// Chạy hàm này 1 lần trong editor để cấp quyền script.external_request
function testPingUrl() {
  const res = UrlFetchApp.fetch('http://chieusang.montanagc.com.vn:8383/', { muteHttpExceptions: true });
  Logger.log('HTTP ' + res.getResponseCode());
}
