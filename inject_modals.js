const fs = require('fs');

let html = fs.readFileSync('nhatky/index.html', 'utf8');

const modalsHtml = `
<!-- ═══════════════════════════════════════════════════
     MODAL: GHI NHẬT KÝ
═══════════════════════════════════════════════════ -->
<div class="nk-modal-overlay" id="modalLog" role="dialog" aria-modal="true">
  <div class="nk-modal" role="document">
    <div class="nk-modal__header">
      <span class="nk-modal__title">Ghi nhật ký</span>
      <button class="nk-modal__close" id="btnCloseLog" aria-label="Đóng">×</button>
    </div>
    <div class="nk-modal__body">
      <input type="hidden" id="logPlanId">
      <div class="nk-field">
        <label for="logResult">Nội dung / Kết quả thực hiện</label>
        <textarea id="logResult" rows="3" placeholder="Đã làm gì, kết quả ra sao..."></textarea>
      </div>
      <div class="nk-field">
        <label for="logTeams">Tổ thực hiện</label>
        <select id="logTeams">
          <option value="">— Chọn tổ —</option>
          <option value="Tổ Trực vận hành">Tổ Trực vận hành</option>
          <option value="Tổ Sửa chữa">Tổ Sửa chữa</option>
          <option value="Tổ Kiểm tra bảo dưỡng">Tổ Kiểm tra bảo dưỡng</option>
          <option value="Tổ Ngoài giờ">Tổ Ngoài giờ</option>
          <option value="Khác">Khác</option>
        </select>
      </div>
      <div style="display:flex; gap:10px; margin-top:15px; flex-wrap:wrap;">
        <button class="nk-btn nk-btn--outline" type="button" onclick="document.getElementById('logResult').value='Không bất thường'">Không bất thường</button>
        <button class="nk-btn nk-btn--outline" type="button" onclick="document.getElementById('logResult').value='Đã xử lý dứt điểm'">Đã xử lý dứt điểm</button>
        <button class="nk-btn nk-btn--outline" type="button" onclick="document.getElementById('logResult').value='Cần theo dõi thêm'">Cần theo dõi thêm</button>
      </div>
    </div>
    <div class="nk-modal__footer">
      <button class="nk-btn" id="btnCancelLog">Hủy</button>
      <button class="nk-btn nk-btn--primary" id="btnSubmitLog">Lưu nhật ký</button>
    </div>
  </div>
</div>

<!-- ═══════════════════════════════════════════════════
     MODAL: BÀN GIAO
═══════════════════════════════════════════════════ -->
<div class="nk-modal-overlay" id="modalHandover" role="dialog" aria-modal="true">
  <div class="nk-modal" role="document">
    <div class="nk-modal__header">
      <span class="nk-modal__title">Bàn giao việc</span>
      <button class="nk-modal__close" id="btnCloseHandover" aria-label="Đóng">×</button>
    </div>
    <div class="nk-modal__body">
      <input type="hidden" id="handoverPlanId">
      <div class="nk-field">
        <label for="handoverAssignee">Bàn giao cho <span style="color:red">*</span></label>
        <input id="handoverAssignee" type="text" placeholder="Người / Tổ nhận việc">
      </div>
      <div class="nk-field">
        <label for="handoverNote">Ghi chú xử lý tiếp</label>
        <textarea id="handoverNote" rows="2" placeholder="Những việc còn tồn đọng..."></textarea>
      </div>
    </div>
    <div class="nk-modal__footer">
      <button class="nk-btn" id="btnCancelHandover">Hủy</button>
      <button class="nk-btn nk-btn--primary" id="btnSubmitHandover">Bàn giao</button>
    </div>
  </div>
</div>
`;

if (!html.includes('id="modalLog"')) {
  html = html.replace('<!-- MODAL: TẠO VIỆC MỚI -->', modalsHtml + '\n<!-- MODAL: TẠO VIỆC MỚI -->');
}

fs.writeFileSync('nhatky/index.html', html);
