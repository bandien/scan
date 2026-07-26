const fs = require('fs');
let html = fs.readFileSync('nhatky/index.html', 'utf8');

const modalsHtml = `
<!-- MODAL GHI NHẬT KÝ -->
<div class="nk-modal" id="modalLog">
  <div class="nk-modal__dialog">
    <div class="nk-modal__header">
      <h3 class="nk-modal__title">＋ Ghi nhật ký công việc</h3>
      <button class="nk-modal__close" onclick="closeLogModal()">×</button>
    </div>
    <div class="nk-modal__body">
      <input type="hidden" id="logPlanId">
      <div class="nk-form-group">
        <label class="nk-label">NỘI DUNG / KẾT QUẢ *</label>
        <textarea id="logResult" class="nk-textarea" rows="3" placeholder="Nhập kết quả xử lý, nghiệm thu, sự cố phát sinh..."></textarea>
      </div>
      <div class="nk-form-group">
        <label class="nk-label">ĐỘI THỰC HIỆN</label>
        <input type="text" id="logTeams" class="nk-input" placeholder="Ví dụ: Đội Điện, Đội Nước...">
      </div>
    </div>
    <div class="nk-modal__footer">
      <button class="nk-btn nk-btn--ghost" onclick="closeLogModal()">Hủy</button>
      <button class="nk-btn nk-btn--primary" id="btnSubmitLog">💾 Lưu nhật ký</button>
    </div>
  </div>
</div>

<!-- MODAL BÀN GIAO -->
<div class="nk-modal" id="modalHandover">
  <div class="nk-modal__dialog">
    <div class="nk-modal__header">
      <h3 class="nk-modal__title">⇄ Bàn giao công việc</h3>
      <button class="nk-modal__close" onclick="closeHandoverModal()">×</button>
    </div>
    <div class="nk-modal__body">
      <input type="hidden" id="hoPlanId">
      <div class="nk-form-group">
        <label class="nk-label">BÀN GIAO CHO AI? *</label>
        <input type="text" id="hoPerson" class="nk-input" placeholder="Tên người nhận bàn giao...">
      </div>
      <div class="nk-form-group">
        <label class="nk-label">GHI CHÚ BÀN GIAO</label>
        <textarea id="hoNote" class="nk-textarea" rows="2" placeholder="Lý do bàn giao, nội dung cần lưu ý..."></textarea>
      </div>
    </div>
    <div class="nk-modal__footer">
      <button class="nk-btn nk-btn--ghost" onclick="closeHandoverModal()">Hủy</button>
      <button class="nk-btn nk-btn--primary" id="btnSubmitHandover">⇄ Xác nhận bàn giao</button>
    </div>
  </div>
</div>
`;

if (!html.includes('id="modalLog"')) {
  html = html.replace('</body>', modalsHtml + '\n</body>');
  fs.writeFileSync('nhatky/index.html', html, 'utf8');
  console.log('Injected missing modals');
}
