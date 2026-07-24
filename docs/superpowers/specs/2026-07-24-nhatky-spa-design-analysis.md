# Design Spec & Architecture Analysis: Nâng Cấp Giao Diện WebApp `nhatky/index.html` Đơn Trang (SPA) & Tích Hợp Chi Tiết

- **Ngày lập:** 2026-07-24
- **Phương pháp luận:** Superpowers SDLC (`brainstorming` & `writing-plans`)
- **Đối tượng:** `02_Source/nhatky/index.html`, `02_Source/19_GolfChecklist.gs`, `02_Source/14_NhatKyPlans.gs`
- **Trạng thái:** BẢN PHÂN TÍCH THIẾT KẾ CHI TIẾT (DESIGN SPEC & ARCHITECTURE ANALYSIS)

---

## 1. PHÂN TÍCH HIỆN TRẠNG & NGUYÊN NHÂN GỐC RỄ (Root Cause & Gap Analysis)

### 1.1 Vấn đề hiện tại của `nhatky/index.html` cũ:
1. **Thiết kế monolithic dồn nén**: File HTML cũ dài gần 8,200 dòng, chứa đồng thời hàng chục screen HTML, CSS inline và logic JS lồng ghép, khiến giao diện bị nặng, nút bấm dễ bị tràn/đè lên Card trên thiết bị màn hình nhỏ.
2. **Đứt gãy liên kết Checklist $\rightarrow$ Công việc**: Khi KTV đi checklist (ở `sangolf/index.html`) phát hiện bơm quá nhiệt hoặc sự cố không đạt, thông tin chỉ được ghi vào `GolfChecklistRuns` mà không tự động chuyển thành Task sự cố cho Tổ cơ điện xử lý.
3. **Chưa hỗ trợ linh hoạt 2 luồng công việc**:
   - **Luồng Việc Nhỏ**: KTV xử lý việc phát sinh trong 10-15 phút nhưng phải trải qua quy trình tạo kế hoạch rườm rà.
   - **Luồng Việc Nhiều Giai Đoạn**: Chưa hỗ trợ gán nhiều KTV cho 1 bước và quy tắc đánh giá đủ người mới hoàn thành.
4. **Thiếu tính năng Ghi Hộ của Quản Lý**: Khi Tổ trưởng đi kiểm tra hoặc nhập báo cáo hộ KTV, hệ thống cũ đè tên Tổ trưởng lên tên KTV, làm mất dấu vết người thực tế làm việc.

---

## 2. KIẾN TRÚC VÀ THIẾT KẾ GIẢI PHÁP (Detailed Architecture & Design)

```mermaid
flowchart TD
    subgraph Frontend Single Page Application - nhatky/index.html
        UI[App Shell & Header with Top-Right + Button]
        T1[Tab 1: Công việc - Zalo Mobile Chat List Style]
        T2[Tab 2: Checklist Vận Hành - Golf & Bơm]
        T3[Tab 3: Danh Bạ Nhân Sự]
        T4[Tab 4: Cá Nhân & Cài Đặt]
        M1[Modal 1-Touch: Ghi Nhanh Việc Nhỏ]
        M2[Modal Multi-Phase: Chi Tiết & Gán Người]
        M3[Modal Manager Proxy: Ghi Hộ Nhân Viên]
    end

    subgraph Backend Services - Google Apps Script
        GAS1[14_NhatKyPlans.gs - CRUD Plans & Phases]
        GAS2[19_GolfChecklist.gs - Auto-create Issue Task on Violation]
        GAS3[15_NhatKyAuth.gs & Users Sheet - Role & Proxy Audit]
    end

    UI --> T1 & T2 & T3 & T4
    T1 --> M1 & M2 & M3
    T2 -->|Save/Submit Checklist| GAS2
    GAS2 -->|Auto Violation Detect| GAS1
    M1 & M2 & M3 -->|Save Plan / WorkLog| GAS1 & GAS3
```

---

## 3. THIẾT KẾ CHI TIẾT CÁC THÀNH PHẦN (Component Specs)

### 3.1 Giao diện Card Công việc (Zalo Mobile Chat List Style)
- **Avatar & Status Dot**: Dạng hình tròn Gradient, góc dưới có chấm màu biểu thị trạng thái (`#0068ff` Đang làm, `#20a647` Hoàn thành, `#ff9500` Chờ nghiệm thu).
- **Dòng Tiêu Đề (Top Line)**: Tiêu đề công việc in đậm, kết thúc ở bên phải bằng chuỗi thời gian cập nhật gần nhất (`14:20`, `08:15`).
- **Dòng Phụ Đề (Sub Line)**: Tên người vừa cập nhật/xử lý bước cuối (`Thắng NQ: ...`) kèm icon vị trí `📍`.
- **Badge Trạng Thái & Ưu Tiên**: Pill nhỏ gọn thể hiện tên trạng thái và badge đỏ `Khẩn cấp` nếu có.

### 3.2 Quy tắc Ghi Hộ Của Quản Lý (Manager Proxy Logging)
- **Bảng phân quyền**:
  - `Role: User` (KTV): Chỉ báo cáo cho chính mình.
  - `Role: Manager / Admin / Tổ trưởng`: Có cờ bật **"Ghi hộ cho nhân viên"**, hiển thị danh sách KTV trong tổ để chọn 1 KTV (Single Proxy) hoặc chọn cả nhóm (Batch Proxy).
- **Lưu vết Audit**:
  - `Employee`: Tên KTV thực tế làm việc (vd: `Thắng NQ`).
  - `RecordedBy`: Tên người đang đăng nhập bấm Lưu (vd: `Tổ trưởng Hậu DV`).
  - UI hiển thị: *"Thắng NQ (Ghi hộ bởi Tổ trưởng Hậu DV lúc 14:20)"*.

### 3.3 Quy trình 2 Luồng Công Việc
1. **Luồng 1-Touch (Việc Nhỏ / Phát Sinh)**:
   - Form gồm: Tên việc + Vị trí + Chụp 1-2 Ảnh kết quả $\rightarrow$ Bấm **"Lưu & Hoàn Thành"**.
   - Backend tự động ghi `Status = Hoàn thành`, `Lifecycle = closed`, `Labels = Đã chốt sổ` và lưu WorkLog.
2. **Luồng Multi-Phase (Việc Phức Tạp / Nhiều Giai Đoạn)**:
   - Chia thành mảng `Phases` $\rightarrow$ `Steps`.
   - Mỗi step có mảng `assignees` (ví dụ: `["Thắng NQ", "Hậu DV"]`).
   - Quy tắc **Crowd-Completion**: `doneByPeople` lưu danh sách KTV đã hoàn thành phần việc của họ. Khi `doneByPeople.length == assignees.length` $\rightarrow$ Step tự chuyển `done = true`.

---

## 4. KẾ HOẠCH BẢO HÀNH & XÁC MINH (Verification Plan)

1. **Cú pháp HTML/JS**:
   Chạy lệnh node kiểm tra cú pháp và sự tồn tại của file SPA:
   ```bash
   node -e "const fs = require('fs'); console.log('File size:', fs.readFileSync('d:/Claude/1_Projects/scan/02_Source/nhatky/index.html', 'utf8').length);"
   ```
2. **Kiểm thử Luồng Nghiệp vụ (Manual & Data Flow)**:
   - Thử nghiệm tạo việc nhỏ 1-Touch $\rightarrow$ Kiểm tra trạng thái tự chốt sổ.
   - Thử nghiệm chọn cờ Ghi Hộ $\rightarrow$ Kiểm tra hiển thị chuỗi danh tính 2 bên trên card.
   - Thử nghiệm chốt ca Checklist có lỗi $\rightarrow$ Kiểm tra tự tạo Task sự cố trong NhatKyPlans.
