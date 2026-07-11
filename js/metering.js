// ==========================================
// js/metering.js — ĐO LƯỜNG & NĂNG LƯỢNG (Phase 11)
// ==========================================
// Phụ thuộc: config.js (CONFIG, t), sync.js (apiGet, apiPost)
// HTML cần có: #meteringSection, #meterList, #meterReadingModal

let localMeterPoints = []; // cache từ localStorage

// ── Load & hiển thị ────────────────────────────────────────────────────────

async function toggleMetering() {
  const section = document.getElementById('meteringSection');
  if (!section) return;

  const isVisible = section.style.display !== 'none';
  hideAllSections();
  if (isVisible) return;

  section.style.display = 'block';
  await loadMeterPoints();
  renderMeterDashboard();
}

async function loadMeterPoints(forceRefresh = false) {
  const CACHE_KEY = 'localMeterPoints';
  const cached    = localStorage.getItem(CACHE_KEY);

  if (!forceRefresh && cached) {
    try { localMeterPoints = JSON.parse(cached); return; } catch (_) {}
  }

  try {
    showMeterSkeleton();
    const user = getCurrentUser();
    const res  = await apiGet({ action: 'getMeterPoints', token: CONFIG.apiToken });
    if (res.status === 'success') {
      localMeterPoints = res.points || [];
      localStorage.setItem(CACHE_KEY, JSON.stringify(localMeterPoints));
    }
  } catch (err) {
    console.warn('loadMeterPoints offline, dùng cache:', err);
  }
}

function renderMeterDashboard() {
  const container = document.getElementById('meterList');
  if (!container) return;

  if (!localMeterPoints.length) {
    container.innerHTML = `
      <div class="text-center text-muted py-4">
        <i class="bi bi-speedometer2 fs-1 d-block mb-2 text-primary opacity-50"></i>
        <p class="small">Chưa có điểm đo nào. Admin hãy thêm đồng hồ điện/nước.</p>
      </div>`;
    return;
  }

  // Nhóm theo Type: Điện / Nước / Gas
  const groups = {};
  localMeterPoints.forEach(p => {
    const g = p.type || 'Khác';
    if (!groups[g]) groups[g] = [];
    groups[g].push(p);
  });

  const typeIcon = { 'Điện': '⚡', 'Nước': '💧', 'Gas': '🔥', 'Khác': '📊' };

  container.innerHTML = Object.entries(groups).map(([type, points]) => `
    <div class="mb-3">
      <div class="fw-bold text-secondary small text-uppercase mb-2" style="letter-spacing:1px">
        ${typeIcon[type] || '📊'} ${type}
      </div>
      ${points.map(p => renderMeterCard(p)).join('')}
    </div>
  `).join('');
}

function renderMeterCard(p) {
  const lastDate = p.lastDate ? new Date(p.lastDate).toLocaleDateString('vi-VN') : 'Chưa đọc';
  const lastVal  = p.lastReading !== null && p.lastReading !== '' ? `${p.lastReading} ${p.unit}` : '—';

  return `
    <div class="card border-0 shadow-sm rounded-4 mb-2 overflow-hidden" onclick="openMeterReadingModal('${p.meterId}')">
      <div class="card-body p-3">
        <div class="d-flex justify-content-between align-items-start">
          <div>
            <div class="fw-bold">${p.name}</div>
            <div class="text-muted small">${p.location || 'Chưa có vị trí'}</div>
          </div>
          <div class="text-end">
            <div class="fw-bold text-primary">${lastVal}</div>
            <div class="text-muted" style="font-size:0.7rem">${lastDate}</div>
          </div>
        </div>
        ${p.threshold > 0 ? `
          <div class="mt-2 pt-2 border-top d-flex justify-content-between align-items-center">
            <span class="text-muted" style="font-size:0.75rem">Ngưỡng: ${p.threshold} ${p.unit}/tháng</span>
            <span class="badge ${p.lastReading > p.threshold ? 'bg-danger' : 'bg-success'} rounded-pill" style="font-size:0.7rem">
              ${p.lastReading > p.threshold ? '⚡ Vượt ngưỡng' : '✓ Bình thường'}
            </span>
          </div>` : ''}
      </div>
    </div>`;
}

// ── Modal nhập chỉ số ──────────────────────────────────────────────────────

let _activeMeter = null;
let _meterPhotoBase64 = null;

function openMeterReadingModal(meterId) {
  _activeMeter = localMeterPoints.find(p => p.meterId === meterId);
  if (!_activeMeter) return;

  _meterPhotoBase64 = null;
  document.getElementById('meterModalTitle').textContent   = _activeMeter.name;
  document.getElementById('meterModalLocation').textContent = _activeMeter.location || '';
  document.getElementById('meterModalUnit').textContent    = _activeMeter.unit || '';
  document.getElementById('meterValueInput').value         = '';
  document.getElementById('meterPhotoPreview').style.display = 'none';

  // Tải lịch sử gần nhất (3 lần)
  loadMeterHistoryInline(meterId);

  const modal = new bootstrap.Modal(document.getElementById('meterReadingModal'));
  modal.show();
}

async function loadMeterHistoryInline(meterId) {
  const el = document.getElementById('meterHistoryInline');
  if (!el) return;
  el.innerHTML = '<div class="text-muted small text-center py-2">Đang tải...</div>';

  try {
    const res = await apiGet({ action: 'getMeterHistory', meterId, limit: 3, token: CONFIG.apiToken });
    if (res.status === 'success' && res.history.length > 0) {
      el.innerHTML = res.history.map(h => `
        <div class="d-flex justify-content-between align-items-center py-1 border-bottom">
          <span class="text-muted small">${new Date(h.timestamp).toLocaleDateString('vi-VN')}</span>
          <span class="fw-bold small">${h.value} ${_activeMeter.unit}</span>
          <span class="text-${h.alert ? 'danger' : 'success'} small">
            ${h.calculated > 0 ? '+' + h.calculated.toFixed(1) : h.calculated.toFixed(1)}
          </span>
        </div>`).join('');
    } else {
      el.innerHTML = '<div class="text-muted small text-center py-2">Chưa có lịch sử</div>';
    }
  } catch (_) {
    el.innerHTML = '<div class="text-muted small text-center py-2">Lỗi tải lịch sử</div>';
  }
}

function captureMeterPhoto() {
  const input = document.createElement('input');
  input.type    = 'file';
  input.accept  = 'image/*';
  input.capture = 'environment';
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      _meterPhotoBase64 = ev.target.result.split(',')[1];
      const preview = document.getElementById('meterPhotoPreview');
      if (preview) {
        preview.src = ev.target.result;
        preview.style.display = 'block';
      }
    };
    reader.readAsDataURL(file);
  };
  input.click();
}

async function submitMeterReading() {
  const value = parseFloat(document.getElementById('meterValueInput')?.value);
  if (!_activeMeter || isNaN(value)) {
    showToast('Vui lòng nhập chỉ số hợp lệ', 'warning');
    return;
  }

  const user = getCurrentUser();
  const btn  = document.getElementById('meterSubmitBtn');
  if (btn) { btn.disabled = true; btn.textContent = 'Đang lưu...'; }

  try {
    const payload = {
      action:      'submitMeterReading',
      token:       CONFIG.apiToken,
      meterId:     _activeMeter.meterId,
      value,
      user:        user?.name || 'Mobile User',
      photoBase64: _meterPhotoBase64 || null,
      mimeType:    'image/jpeg',
    };

    const res = await apiPost(payload);

    if (res.status === 'success') {
      showToast(`✅ Đã ghi chỉ số ${value} ${_activeMeter.unit} | Sản lượng: ${res.calculated} ${_activeMeter.unit}`, 'success');
      if (res.alert) showToast('⚡ Cảnh báo: vượt ngưỡng tiêu thụ!', 'danger');

      // Cập nhật cache
      const pt = localMeterPoints.find(p => p.meterId === _activeMeter.meterId);
      if (pt) { pt.lastReading = value; pt.lastDate = new Date().toISOString(); }
      localStorage.setItem('localMeterPoints', JSON.stringify(localMeterPoints));

      bootstrap.Modal.getInstance(document.getElementById('meterReadingModal'))?.hide();
      renderMeterDashboard();
    } else {
      showToast('Lỗi: ' + (res.message || 'Unknown'), 'danger');
    }
  } catch (err) {
    showToast('Mất kết nối. Vui lòng thử lại.', 'warning');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = t('meter_submit'); }
  }
}

// ── Skeleton loader ────────────────────────────────────────────────────────

function showMeterSkeleton() {
  const container = document.getElementById('meterList');
  if (!container) return;
  container.innerHTML = Array(3).fill(`
    <div class="card border-0 shadow-sm rounded-4 mb-2">
      <div class="card-body p-3">
        <div class="placeholder-glow">
          <div class="placeholder col-7 rounded mb-1"></div>
          <div class="placeholder col-4 rounded"></div>
        </div>
      </div>
    </div>`).join('');
}
