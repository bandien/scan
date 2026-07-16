// =============================================================================
// js/fontscale.js — Phóng to chữ dùng chung (nhân viên lớn tuổi / mắt kém)
// =============================================================================
// Trước đây mỗi trang (index, pump_info, meter, phanca, hengio) tự chép lại
// cùng 1 đoạn logic 3 mức 100/115/130% — gộp về đây để sửa 1 nơi áp dụng mọi
// trang. nhatky/index.html có bản riêng (gắn thêm renderPersonalScreen +
// toast) nên chưa gộp vào đây, vẫn dùng chung key localStorage bên dưới.
//
// Cách dùng (đặt sau css/shared.css, cần có sẵn trong trang:
//   <button id="btnFontScale"><span id="fontScaleLabel">A</span></button>):
//   <script src="js/fontscale.js"></script>              (trang ở gốc)
//   <script src="../js/fontscale.js"></script>            (trang con)
// Script tự áp dụng cỡ chữ đã lưu và gắn sự kiện click khi tải trang xong.
(function (root) {
  'use strict';

  const KEY = 'bandien_nhatky_fontscale';
  const SCALES = [100, 115, 130];
  const LABELS = { 100: 'A', 115: 'A+', 130: 'A++' };

  function getScale() {
    return parseInt(localStorage.getItem(KEY) || '100', 10);
  }

  function apply() {
    const scale = getScale();
    document.documentElement.style.fontSize = scale + '%';
    const label = document.getElementById('fontScaleLabel');
    if (label) label.textContent = LABELS[scale] || 'A';
  }

  function cycle() {
    const next = SCALES[(SCALES.indexOf(getScale()) + 1) % SCALES.length];
    localStorage.setItem(KEY, String(next));
    apply();
    return next;
  }

  function bind() {
    apply();
    const btn = document.getElementById('btnFontScale');
    if (btn) btn.addEventListener('click', cycle);
  }

  root.BD_FontScale = { KEY, SCALES, LABELS, getScale, apply, cycle, bind };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }
})(window);
