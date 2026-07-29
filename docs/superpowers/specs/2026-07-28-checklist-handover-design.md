# Phân Tích Nghiệp Vụ: Liên Kết Checklist & Bàn Giao Ca

**Ngày:** 2026-07-28
**Tác giả:** Antigravity (Superpowers)
**Mục đích:** Vận hành đầy đủ, thông tin rõ ràng cho bàn giao ca giữa hệ thống Nhatky và module Checklist.

---

## 1. Vấn Đề Hiện Tại (As-Is)

Hiện nay, Nhatky và Checklist (Sangolf) đang hoạt động gần như độc lập, dẫn đến "đứt gãy thông tin" trong lúc bàn giao ca:
1. **Sinh Task:** Nhân viên tạo task `[CHECKLIST] Sân Golf...` trên Nhatky, task ở trạng thái "Đang làm".
2. **Điền Form:** Nhân viên bấm "Điền Form" mở sang tab `sangolf/index.html`. Form này không nhận dạng được nó thuộc về Task Nhatky nào.
3. **Chốt Ca độc lập:** Trong Sangolf, nhân viên bấm "CHỐT CA & BÀN GIAO". Dữ liệu lưu vào DB của Checklist.
4. **Hệ quả:**
   - Task `[CHECKLIST]` gốc trên Nhatky bị bỏ quên, luôn ở trạng thái "Đang làm".
   - Ca sau mở Nhatky không thể thấy ngay tóm tắt kết quả Checklist ca trước (bao nhiêu mục đạt, có ghi chú bàn giao gì không).
   - Nhatky chỉ ghi nhận các task Sự Cố do hệ thống tự sinh nếu có vi phạm, nhưng không thể hiện bức tranh toàn cảnh của ca.

## 2. Mục Tiêu Vận Hành (To-Be)

Để việc bàn giao ca **rõ ràng** và **đầy đủ thông tin**, hai hệ thống phải "nói chuyện" được với nhau theo một luồng xuyên suốt. Người nhận ca chỉ cần nhìn vào Nhatky là nắm được trọn vẹn tình trạng Checklist của ca trước.

### Yêu cầu:
- Nhatky Task phải tự động cập nhật trạng thái khi Checklist hoàn thành.
- Kết quả điền Checklist (tổng quan) phải được đẩy ngược về Nhatky dưới dạng Báo cáo / Comment.
- Ca sau xác nhận bàn giao (Nghiệm thu) trên Nhatky đồng thời xác nhận trên hệ thống Checklist.

## 3. Đề Xuất Giải Pháp Kiến Trúc (Architecture Proposal)

### Bước 1: Liên kết Task ID (Frontend Nhatky -> Sangolf)
- Khi bấm "Điền Form Checklist" trong chi tiết Task Nhatky, URL mở ra sẽ được đính kèm Task ID.
  - Ví dụ: `../sangolf/index.html?taskId=12345`
- Module `sangolf` sẽ đọc tham số `taskId` này và lưu vào bộ nhớ tạm (draft) của lượt chạy (Run) hiện tại.

### Bước 2: Tự động hoá cập nhật (Backend Sangolf -> Nhatky)
- Khi nhân viên bấm **"CHỐT CA & BÀN GIAO"** trong Sangolf, gọi API `submitGolfRun`.
- Backend (GAS) thực hiện lưu Checklist, ĐỒNG THỜI tự động gọi hàm cập nhật Task `12345` trong Nhatky:
  - **Đổi trạng thái:** Cập nhật status của task thành **"Bàn giao"** (để ca sau thấy và nghiệm thu).
  - **Bắn Comment Tự Động:** Ghi một dòng log chat vào task: 
    ```
    ✅ Đã chốt ca Checklist. 
    📊 Kết quả: 34/34 mục. 
    📝 Ghi chú bàn giao: "Mọi thứ bình thường."
    ```

### Bước 3: Ca sau nhận bàn giao (Nhatky)
- Ca tiếp theo vào Nhatky, thấy task `[CHECKLIST]` đang ở trạng thái **"Bàn giao"**.
- Mở task ra, đọc Comment hệ thống để nắm tình hình.
- Bấm nút **"Chốt sổ"** (theo luồng A3) để hoàn thành task. 
- *(Tuỳ chọn mở rộng: Nút "Chốt sổ" trên Nhatky có thể trigger ngược lại API `confirmHandover` của Sangolf, giúp 2 bên đồng bộ trạng thái "Confirmed").*

## 4. Các Thay Đổi Cần Thiết Kế

| Component | Hành động |
|-----------|-----------|
| `nhatky/index.html` | Cập nhật hàm render nút `📝 Điền Form Checklist` để append `?taskId=` vào URL. |
| `sangolf/index.html` | Đọc `taskId` từ URL, lưu vào đối tượng `currentRun`. Truyền `taskId` trong payload của API `submitGolfRun`. |
| `Backend (GAS)` | Trong `submitGolfRun`, nếu có `taskId`, tự động cập nhật Plan trong bảng Nhật Ký (đổi trạng thái thành "Bàn giao" và push nội dung chat). |

---
**Kết luận:** Phương án này tuân thủ đúng nguyên tắc **Single Source of Truth** (Nhatky là trung tâm điều hành), giúp luồng thông tin không bị phân mảnh và ca sau có thể an tâm nhận ca chỉ bằng cách đọc Nhatky.
