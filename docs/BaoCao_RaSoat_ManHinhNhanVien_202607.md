# Báo cáo rà soát màn hình nhân viên & đề xuất tối ưu

> Phạm vi: các trang nhân viên hiện trường sử dụng hàng ngày trên BanDienScan
> Ngày rà soát: 2026-07-16 · Phiên bản: v2.10.0

---

## 1. Kiểm kê màn hình

| Trang | Vai trò | Dòng | Bottom-nav | Đăng nhập | Offline | Đánh giá nhanh |
|---|---|---|---|---|---|---|
| `index.html` | Quét QR, thiết bị, WO, dashboard | 5.320 | Nav riêng | RBAC đầy đủ | ✅ queue | Ổn sau đợt v2.9 |
| `nhatky/` | Kế hoạch + nhật ký công việc | 5.514 | Nav riêng | PIN nhatky | ✅ queue | Ổn sau đợt v2.9 |
| `pump_info.html` | Thông tin + check vận hành bơm | 965 | ✅ | Tên tự điền | ✅ queue | Tốt |
| `checkbom/` | Tờ check bơm (đã gộp vào pump_info) | 1.299 | ✅ | Tên tự điền | ✅ queue | ⚠️ Trùng chức năng |
| `sangolf/` | Checklist cơ điện sân golf (mới) | 789 | ✅ (mới thêm) | Tên tự điền | ✅ draft | Tốt |
| `phanca/` | Bảng phân ca trực | 1.358 | ✅ | Không | ❌ | Khá |
| `meter.html` | Chốt chỉ số đồng hồ (vào từ QR) | 292 | ❌ | Tên tự điền | ❌ | 🔴 Nhiều vấn đề |
| `phongvan/` | Câu hỏi phỏng vấn (tĩnh) | 703 | ✅ | Không | — | Ổn |

---

## 2. Phát hiện chính (xếp theo mức độ)

### 🔴 P1 — meter.html: rủi ro mất dữ liệu chỉ số
1. **Gửi kiểu `no-cors` fire-and-forget**: luôn báo "✅ thành công" kể cả khi backend lỗi/mất mạng → nhân viên tưởng đã chốt xong, dữ liệu mất không ai biết. Không có hàng đợi offline (các trang khác đều có).
2. **Trỏ URL backend khác** (deployment cũ `AKfycbzw04m0…` thay vì `CONFIG.gasUrl`): hiện vẫn chạy nhưng khi deploy phiên bản mới, trang này không nhận được — nguồn lỗi ngầm khó truy.
3. **Danh mục 22 đồng hồ hardcode trong file** trong khi backend đã có API `getMeterPoints` (chính URL cũ trả về đúng dữ liệu này) → sửa đồng hồ phải sửa code.
4. Không dùng `js/config.js` + `js/api.js` (không retry, không báo cold-start), không bottom-nav, Bootstrap 5.3.0 lệch các trang khác (5.3.3).

### 🟠 P2 — checkbom/ trùng chức năng pump_info.html
- v2.9.0 đã gộp toàn bộ chức năng checkbom vào `pump_info.html`, nhưng `checkbom/` vẫn chạy song song → 2 UI cùng ghi 1 loại dữ liệu, sửa tính năng phải sửa 2 nơi (root `checkbom.html` đã redirect, còn `checkbom/` thì chưa).
- Đề xuất: `checkbom/index.html` chuyển thành trang redirect sang `pump_info.html` (giữ nguyên query `?id=`), sau 1–2 tuần không ai kêu thì xóa code.

### 🟠 P3 — "Người thực hiện" có 3 nguồn tên khác nhau
- `currentUser` (đăng nhập chính) · `bandien_nhatky_employee` (PIN nhatky) · `cmms_op_name` (gõ tay ở pump_info/checkbom/meter/sangolf).
- Hệ quả: cùng 1 người có thể xuất hiện 3 tên khác nhau trong dữ liệu ("Nam", "Nguyễn Nam", "nam") → báo cáo theo người không khớp.
- Đề xuất: dồn 1 nguồn dữ liệu, vẫn giữ mã PIN truy cập nhanh.

### 🟡 P4 — Trải nghiệm không đồng nhất giữa các trang
1. **phanca/** tự viết fetch thay vì dùng `js/api.js` → không retry khi GAS cold-start (10–12s), nhân viên mở sáng sớm dễ thấy trang trắng.
2. **Phóng to chữ (A/A+/A++)** mới chỉ có ở meter.html — nhân viên lớn tuổi dùng các trang khác không có (nên đưa vào `shared.css` + nút chung ở bottom-nav Menu).
3. **Số phiên bản** chỉ hiện ở index.html — các trang vệ tinh không biết đang chạy bản nào (khó hỗ trợ từ xa).
4. **CDN phụ thuộc mạng ngoài** (Bootstrap, icons, fonts từ jsdelivr/Google): ngoài sân sóng yếu → trang vỡ giao diện. Đề xuất: vendor về `css/vendor/` + Service Worker precache (PWA), cài được ra màn hình chính điện thoại.

### 🟡 P5 — sangolf/ (trang mới) — việc còn lại
1. Chưa có link trong menu của `index.html` (nav riêng, không dùng bottomnav.js) — nhân viên vào từ trang chủ không thấy.
2. Ngưỡng cảnh báo mức nước (cách tràn ≤ ? cm = 50%) chờ bảng quy đổi — điền vào cột `Threshold` trên sheet.
3. Người xác nhận bàn giao đang tự gõ tên — nên khóa theo tài khoản nhatky khi P3 hoàn thành.

---

## 3. Lộ trình đề xuất

| Ưu tiên | Việc | Trạng thái |
|---|---|---|
| 1 | Viết lại meter.html: dùng config/api.js chung, đọc `getMeterPoints`, hàng đợi offline như pump_info, bottom-nav | ✅ Xong (v2.10.1) |
| 2 | Redirect `checkbom/` → `pump_info.html` | ✅ Xong (v2.10.1) |
| 3 | `BD_SSO.getOperatorName()` dùng chung 4 trang | ✅ Xong (v2.10.1) — áp dụng pump_info/meter/sangolf |
| 4 | phanca/ chuyển sang `bdsApiFetch` | ✅ Xong (v2.10.1) — không cần skeleton: trang vốn render từ cache local trước rồi mới đồng bộ ngầm, không có màn trắng chờ mạng như nhận định ban đầu |
| 5 | Nút phóng to chữ toàn hệ thống (`js/fontscale.js`) | ✅ Xong (v2.10.1) — phát hiện thêm: phanca/hengio trước đó dùng key riêng không đồng bộ, nay đã gộp chung |
| 6 | Thêm link sangolf vào menu index.html + hiện version ở trang vệ tinh | ✅ Xong (v2.10.1) |
| 7 | PWA: Service Worker + cài ra màn hình chính | ✅ Xong (v2.11.0) — xem ghi chú điều chỉnh bên dưới |

### Ghi chú điều chỉnh mục 7

Đề xuất gốc ghi "vendor CDN" (tải hẳn Bootstrap/icon/font về repo). Khi triển khai, đổi sang cách an toàn hơn và cũng là chuẩn PWA phổ biến hơn: **Service Worker cache CDN theo kiểu runtime cache-first** (tự lưu vào cache trình duyệt lần đầu tải, không cần tải thủ công từng file CDN về repo). Lý do đổi:
- Codebase đang dùng ít nhất 4 phiên bản Bootstrap/Icons khác nhau và ~8 tổ hợp Google Fonts khác nhau trên 40+ trang — vendor thủ công toàn bộ rủi ro cao, dễ lệch phiên bản.
- Cache runtime qua Service Worker đạt đúng mục tiêu (dùng được khi sóng yếu/mất mạng, cài ra màn hình chính) với rủi ro thấp hơn nhiều.

Đã triển khai cho 8 trang tác nghiệp: `index.html`, `pump_info.html`, `meter.html`, `sangolf/`, `phanca/`, `hengio/`, `phongvan/`, `nhatky/`. Chi tiết xem CHANGELOG v2.11.0.

**Không đề xuất làm**: gộp index.html/nhatky thành SPA lớn (đang ổn định, rủi ro cao, lợi ích thấp).
