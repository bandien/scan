// =============================================================================
// js/api.js — BanDienScan Shared API Wrapper
// =============================================================================
// Cung cấp:
// 1. bdsApiFetch(action, params, options)  — GET requests
// 2. bdsApiPost(action, payload, options)  — POST requests
// 3. bdsShowLoading / bdsHideLoading       — Loading UI helpers
// 4. bdsShowError                          — Error UI with retry
// 5. bdsShowToast                          — Toast notifications
//
// Tự động xử lý: timeout, retry, cold-start detection.
// Yêu cầu: CONFIG.gasUrl và CONFIG.apiToken (từ js/config.js)
// =============================================================================

(function (root) {
  'use strict';

  // ─── Config defaults ───────────────────────────────────────────────────────
  const DEFAULT_TIMEOUT  = 15000;  // 15s — GAS cold-start có thể mất 10-12s
  const MAX_RETRIES      = 2;
  const RETRY_DELAYS     = [2000, 4000]; // Exponential backoff
  const COLD_START_THRESHOLD = 8000; // Nếu request đầu > 8s → khả năng cold-start

  // ─── Helpers ───────────────────────────────────────────────────────────────

  function getConfig() {
    // Hỗ trợ cả CONFIG global (từ config.js) và biến đơn
    if (typeof CONFIG !== 'undefined') {
      return { url: CONFIG.gasUrl, token: CONFIG.apiToken };
    }
    if (typeof gasUrl !== 'undefined') {
      return { url: gasUrl, token: (typeof API_TOKEN !== 'undefined' ? API_TOKEN : '') };
    }
    // Fallback: page có thể set window.BDS_GAS_URL
    return {
      url:   root.BDS_GAS_URL || '',
      token: root.BDS_API_TOKEN || ''
    };
  }

  // ─── Core API Fetch ────────────────────────────────────────────────────────

  /**
   * GET request đến GAS backend.
   * @param {string}  action    — action parameter (vd: 'getPlans')
   * @param {Object}  [params]  — thêm query params
   * @param {Object}  [options] — { timeout, retries, signal, showLoading, loadingEl }
   * @returns {Promise<Object>} — parsed JSON
   */
  async function bdsApiFetch(action, params, options) {
    const cfg = getConfig();
    if (!cfg.url) throw new Error('Chưa cấu hình URL backend');

    const opts = Object.assign({
      timeout:     DEFAULT_TIMEOUT,
      retries:     MAX_RETRIES,
      showLoading: false,
      loadingEl:   null
    }, options);

    const qp = new URLSearchParams({ action, token: cfg.token });
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null) qp.set(k, v);
      });
    }

    const url = `${cfg.url}?${qp.toString()}`;
    return _fetchWithRetry(url, { cache: 'no-cache' }, opts);
  }

  /**
   * POST request đến GAS backend.
   * @param {string}  action    — action name
   * @param {Object}  payload   — body payload
   * @param {Object}  [options] — { timeout, retries, showLoading, loadingEl }
   * @returns {Promise<Object>} — parsed JSON
   */
  async function bdsApiPost(action, payload, options) {
    const cfg = getConfig();
    if (!cfg.url) throw new Error('Chưa cấu hình URL backend');

    const opts = Object.assign({
      timeout:     DEFAULT_TIMEOUT,
      retries:     MAX_RETRIES,
      showLoading: false,
      loadingEl:   null
    }, options);

    const body = JSON.stringify({
      action,
      token: cfg.token,
      ...payload
    });

    return _fetchWithRetry(cfg.url, {
      method: 'POST',
      body
    }, opts);
  }

  // ─── Internal: fetch with retry + timeout ──────────────────────────────────

  async function _fetchWithRetry(url, fetchOpts, opts) {
    let lastError = null;
    const totalAttempts = 1 + (opts.retries || 0);

    if (opts.showLoading && opts.loadingEl) {
      bdsShowLoading(opts.loadingEl);
    }

    for (let attempt = 0; attempt < totalAttempts; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), opts.timeout);

        const startTime = Date.now();

        const response = await fetch(url, {
          ...fetchOpts,
          signal: opts.signal || controller.signal
        });

        clearTimeout(timeoutId);

        const elapsed = Date.now() - startTime;

        // Track cold-start for future UX hints
        if (elapsed > COLD_START_THRESHOLD) {
          root._bdsLastColdStart = Date.now();
        }

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.status === 'error') {
          throw new Error(data.message || 'Backend trả về lỗi');
        }

        // Success!
        if (opts.showLoading && opts.loadingEl) {
          bdsHideLoading(opts.loadingEl);
        }

        return data;

      } catch (err) {
        lastError = err;

        // Don't retry on user abort
        if (err.name === 'AbortError' && opts.signal && opts.signal.aborted) {
          break;
        }

        // Retry if not last attempt
        if (attempt < totalAttempts - 1) {
          const delay = RETRY_DELAYS[attempt] || 4000;
          // Update loading text to show retry status
          if (opts.showLoading && opts.loadingEl) {
            _updateLoadingText(opts.loadingEl, `Đang thử lại... (${attempt + 2}/${totalAttempts})`);
          }
          await _sleep(delay);
        }
      }
    }

    // All retries failed
    if (opts.showLoading && opts.loadingEl) {
      bdsHideLoading(opts.loadingEl);
    }

    throw lastError;
  }

  function _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function _updateLoadingText(el, text) {
    const target = typeof el === 'string' ? document.getElementById(el) : el;
    if (!target) return;
    const textEl = target.querySelector('.bds-loading-text');
    if (textEl) textEl.textContent = text;
  }

  // ─── Loading UI helpers ────────────────────────────────────────────────────

  /**
   * Hiện loading skeleton/spinner trong container.
   * @param {string|HTMLElement} el — container ID hoặc element
   * @param {Object} [opts] — { type: 'skeleton'|'spinner'|'page', count: number, message: string }
   */
  function bdsShowLoading(el, opts) {
    const target = typeof el === 'string' ? document.getElementById(el) : el;
    if (!target) return;

    const options = Object.assign({
      type: 'skeleton',
      count: 3,
      message: 'Đang tải dữ liệu...'
    }, opts);

    // Detect cold-start
    const isColdStart = root._bdsLastColdStart && (Date.now() - root._bdsLastColdStart < 60000);
    const subMessage = isColdStart
      ? 'Server đang khởi động, có thể mất 10-15 giây...'
      : '';

    let html = '';

    switch (options.type) {
      case 'spinner':
        html = `
          <div class="bds-loading-page bds-fade-in">
            <div class="bds-spinner"></div>
            <div class="bds-loading-text">${_escHtml(options.message)}</div>
            ${subMessage ? `<div class="bds-loading-sub">${_escHtml(subMessage)}</div>` : ''}
          </div>`;
        break;

      case 'page':
        html = `
          <div class="bds-loading-page bds-fade-in">
            <div class="bds-spinner"></div>
            <div class="bds-loading-text">${_escHtml(options.message)}</div>
            ${subMessage ? `<div class="bds-loading-sub">${_escHtml(subMessage)}</div>` : ''}
            <div class="bds-progress-bar"><div class="bds-progress-bar-fill"></div></div>
          </div>`;
        break;

      default: // skeleton
        const cards = Array.from({ length: options.count }, () => `
          <div class="bds-skeleton-row">
            <div class="bds-skeleton bds-skeleton-avatar"></div>
            <div class="bds-skeleton-lines">
              <div class="bds-skeleton bds-skeleton-text" style="width:${60 + Math.random() * 30}%"></div>
              <div class="bds-skeleton bds-skeleton-text" style="width:${40 + Math.random() * 30}%"></div>
            </div>
          </div>`).join('');
        html = `<div class="bds-fade-in" style="padding:16px">${cards}</div>`;
    }

    target.setAttribute('data-bds-prev', target.innerHTML);
    target.innerHTML = html;
  }

  /**
   * Ẩn loading, khôi phục nội dung cũ (nếu có).
   * @param {string|HTMLElement} el — container ID hoặc element
   */
  function bdsHideLoading(el) {
    const target = typeof el === 'string' ? document.getElementById(el) : el;
    if (!target) return;

    const prev = target.getAttribute('data-bds-prev');
    if (prev !== null) {
      target.innerHTML = prev;
      target.removeAttribute('data-bds-prev');
    }
  }

  // ─── Error UI helpers ──────────────────────────────────────────────────────

  /**
   * Hiện error banner hoặc retry card.
   * @param {string|HTMLElement} el       — container
   * @param {string}            message  — thông báo lỗi
   * @param {Function}          [retryFn] — hàm thử lại (nếu có → hiện nút)
   * @param {Object}            [opts]   — { type: 'banner'|'card', prepend: bool }
   */
  function bdsShowError(el, message, retryFn, opts) {
    const target = typeof el === 'string' ? document.getElementById(el) : el;
    if (!target) return;

    const options = Object.assign({ type: 'card', prepend: false }, opts);

    const retryBtn = retryFn
      ? `<button class="bds-btn bds-btn-outline bds-btn-sm" onclick="(${retryFn.toString()})()">
           <i class="bi bi-arrow-clockwise"></i> Thử lại
         </button>`
      : '';

    // Store retryFn globally so onclick works
    if (retryFn) {
      const fnId = '_bdsRetry_' + Math.random().toString(36).substr(2, 6);
      root[fnId] = retryFn;
      var retryBtnSafe = `<button class="bds-btn bds-btn-outline bds-btn-sm" onclick="window.${fnId}()">
           <i class="bi bi-arrow-clockwise"></i> Thử lại
         </button>`;
    } else {
      var retryBtnSafe = '';
    }

    let html = '';

    if (options.type === 'banner') {
      html = `
        <div class="bds-error-banner">
          <i class="bi bi-exclamation-triangle-fill"></i>
          <span class="bds-error-banner-text">${_escHtml(message)}</span>
          ${retryBtnSafe}
        </div>`;
    } else {
      html = `
        <div class="bds-retry-card bds-fade-in">
          <div class="bds-retry-icon"><i class="bi bi-wifi-off"></i></div>
          <div class="bds-retry-message">${_escHtml(message)}</div>
          <div class="bds-retry-sub">Kiểm tra kết nối mạng hoặc thử lại sau</div>
          ${retryBtnSafe}
        </div>`;
    }

    if (options.prepend) {
      target.insertAdjacentHTML('afterbegin', html);
    } else {
      target.innerHTML = html;
    }
  }

  /**
   * Xóa error banner khỏi container.
   */
  function bdsClearError(el) {
    const target = typeof el === 'string' ? document.getElementById(el) : el;
    if (!target) return;
    const banners = target.querySelectorAll('.bds-error-banner, .bds-retry-card');
    banners.forEach(b => b.remove());
  }

  // ─── Toast ─────────────────────────────────────────────────────────────────

  /**
   * Hiện toast notification.
   * @param {string} message   — nội dung
   * @param {string} [type]   — 'success'|'danger'|'warning' (mặc định: success)
   * @param {number} [duration] — ms (mặc định: 3000)
   */
  function bdsShowToast(message, type, duration) {
    type = type || 'success';
    duration = duration || 3000;

    // Ensure container exists
    let container = document.querySelector('.bds-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'bds-toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `bds-toast bds-toast-${type}`;
    toast.innerHTML = `
      <i class="bi ${type === 'success' ? 'bi-check-circle-fill' :
                      type === 'danger'  ? 'bi-exclamation-triangle-fill' :
                                           'bi-info-circle-fill'}"></i>
      <span>${_escHtml(message)}</span>`;

    container.innerHTML = '';
    container.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  // ─── Utility ───────────────────────────────────────────────────────────────

  function _escHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ─── Export to global scope ────────────────────────────────────────────────
  root.bdsApiFetch   = bdsApiFetch;
  root.bdsApiPost    = bdsApiPost;
  root.bdsShowLoading = bdsShowLoading;
  root.bdsHideLoading = bdsHideLoading;
  root.bdsShowError  = bdsShowError;
  root.bdsClearError = bdsClearError;
  root.bdsShowToast  = bdsShowToast;

})(window);
