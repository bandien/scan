# Implementation Plan: Đính kèm ảnh khi ghi nhật ký

## 1. Frontend: HTML & CSS (nhatky/index.html & app.css)
- Thêm HTML vào `modalLog`:
  ```html
  <div class="nk-form-group">
    <label class="nk-label">ĐÍNH KÈM ẢNH (Tối đa 3)</label>
    <div style="display:flex; gap:10px; align-items:center;">
      <button type="button" class="nk-btn nk-btn--outline" onclick="document.getElementById('logImageInput').click()">📷 Chọn ảnh</button>
      <input type="file" id="logImageInput" accept="image/*" multiple style="display:none" onchange="handleLogImages(this)">
    </div>
    <div id="logImagePreview" style="display:flex; gap:10px; margin-top:10px; flex-wrap:wrap;"></div>
  </div>
  ```
- CSS: `nk-img-preview-box`, `nk-img-delete-btn`.

## 2. Frontend: Xử lý nén ảnh & State (nhatky/index.html)
- Viết hàm nén ảnh `compressImageToDataURL(file, maxWidth)` dùng `canvas`.
- Tạo mảng toàn cục `let logSelectedImages = [];`.
- Viết hàm `handleLogImages(input)` đọc file, gọi hàm nén ảnh, đẩy vào mảng và gọi `renderLogImagePreview()`.
- Viết hàm xóa ảnh khỏi mảng `removeLogImage(index)`.
- Reset lại `logSelectedImages = []` và `#logImagePreview` khi đóng/mở lại modal `closeLogModal()`.

## 3. Frontend: Logic `submitLog()`
- Đổi nút "Lưu nhật ký" thành trạng thái loading (VD: "Đang tải ảnh...").
- Nếu `logSelectedImages.length > 0`:
  - Gọi API: `const res = await window.bdsApiFetch('uploadImages', { images: logSelectedImages })`.
  - Nhận `res.data` là mảng URL (hoặc mảng ID để ghép với link GDrive).
  - Gán vào biến `uploadedPhotos = res.data`.
- Gắn `uploadedPhotos` vào `logData.photos = uploadedPhotos`.
- Tiến hành luồng `savePlan` như cũ.

## 4. Frontend: Hiển thị ảnh Timeline
- Sửa đổi hàm `renderTimelineHtml(planId)` trong đoạn duyệt mảng `actionLog`.
- Nếu `log.photos` tồn tại và là Array, tạo HTML grid hiển thị thumbnail các ảnh.
- Click vào ảnh để mở popup (dùng modal popup ảnh fullscreen mới).

## 5. Backend: Code.gs (Google Apps Script)
- Hướng dẫn người dùng copy đoạn mã sau vào App Script:
  ```javascript
  function uploadImages(payload) {
    try {
      const folderId = "THAY_ID_THU_MUC_GOOGEL_DRIVE_VAO_DAY";
      const folder = DriveApp.getFolderById(folderId);
      const urls = [];
      const images = payload.images || [];
      
      for (let i = 0; i < images.length; i++) {
        const base64Data = images[i].split(',')[1];
        const blob = Utilities.newBlob(Utilities.base64Decode(base64Data), "image/jpeg", "LOG_" + new Date().getTime() + "_" + i + ".jpg");
        const file = folder.createFile(blob);
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        urls.push(file.getId());
      }
      return success({ data: urls });
    } catch (e) {
      return error("Lỗi upload: " + e.toString());
    }
  }
  ```
