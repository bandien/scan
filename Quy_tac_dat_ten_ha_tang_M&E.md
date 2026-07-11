---
title: QUY TẮC ĐẶT TÊN VÀ MÃ HÓA HẠ TẦNG KỸ THUẬT (CODING SYSTEM STANDARD)
aliases:
  - quy tac dat ten tang
  - quy tắc đặt tên và mã hóa hạ tầng kỹ thuật (coding system standard)
tags:
  - khac
  - scan-cmms
  - dang-thuc-hien
date: 2026-06-08
updated: 2026-06-08
---
# QUY TẮC ĐẶT TÊN VÀ MÃ HÓA HẠ TẦNG KỸ THUẬT (CODING SYSTEM STANDARD)

Bộ tài liệu này quy định chuẩn mã hóa cấu trúc tên cho hệ thống thiết bị cơ điện (M&E), cáp mạng và hạ tầng kỹ thuật. Mục tiêu nhằm tối ưu hóa khả năng nhận diện OCR/AI, đồng bộ dữ liệu checklist vận hành và chuẩn hóa cơ sở dữ liệu.

---

## 1. NGUYÊN TẮC CẤU TRÚC MÃ CHUNG

Tất cả các mã định danh thiết bị, tủ điện và đường dây phải tuân thủ nghiêm ngặt cấu trúc phân cấp sau:

> **`[Vị trí/Khu vực] - [Loại thiết bị/Hệ thống] - [Số thứ tự]`**

### Quy định định dạng ký tự:
- **Viết hoa toàn bộ (UPPERCASE):** Không dùng chữ thường, không dùng tiếng Việt có dấu.
- **Ký tự phân tách:** Sử dụng dấu gạch ngang (`-`) để phân tách các phân đoạn chính. Sử dụng dấu gạch dưới (`_`) để chỉ liên kết Nguồn_Đích (đối với tuyến dây cáp).
- **Không sử dụng khoảng trắng (Space):** Tuyệt đối không chứa khoảng trống trong chuỗi mã.

### Quy định về độ dài số thứ tự (Padding):
- **Hệ thống tiêu chuẩn (Khuyên dùng):** Cố định **2 chữ số** (Dùng `01`, `02`... thay vì `1`, `2`) để đảm bảo độ dài chuỗi đồng đều, tránh lỗi xô lệch hàng khi Sort/Unpivot dữ liệu.
- **Hệ thống mở rộng (Tùy chọn nâng cao):** Cố định **3 chữ số** (Dùng `001`, `002`...) đối với các dự án quy mô lớn, trạm vận hành nhiều thiết bị hoặc các tuyến cáp mạng có số lượng nút (Port) vượt quá 99.

---

## 2. QUY TẮC ĐẶT MÃ CHO TỪNG HẠNG MỤC CHI TIẾT

### 2.1. Hệ thống Bơm (Pumps)
- **Cấu trúc:** `[Vị trí] - [Ký hiệu loại bơm] - [Số thứ tự]`
- **Ký hiệu viết tắt loại bơm:**
  - `WP` (Water Pump) hoặc `BNS`: Bơm cấp nước sạch
  - `SP` (Sewage Pump) hoặc `BNT`: Bơm nước thải
  - `FP` (Fire Pump) hoặc `BCC`: Bơm cứu hỏa
  - `CP` (Circulating Pump): Bơm tuần hoàn / giải nhiệt
- **Ví dụ thực tế:**
  - `XLNT-BNT-01`: Bơm nước thải số 01 tại Trạm xử lý nước thải (độ dài 2 chữ số).
  - `T2-BNS-002`: Bơm nước sạch số 002 đặt tại Tầng 2 (độ dài 3 chữ số cho hệ thống lớn).

### 2.2. Hệ thống Tủ điện (Electrical Panels)
- **Cấu trúc:** `[Vị trí] - [Ký hiệu loại tủ] - [Số thứ tự/Tầng]`
- **Ký hiệu viết tắt loại tủ:**
  - `MSB` (Main Distribution Board): Tủ điện tổng / Trạm biến áp
  - `DB` (Distribution Board): Tủ điện phân phối tầng / khu vực
  - `CP` (Control Panel) hoặc `TĐK`: Tủ điều khiển trực tiếp thiết bị
  - `ATS`: Tủ chuyển đổi nguồn tự động
- **Ví dụ thực tế:**
  - `TBA-MSB-01`: Tủ điện tổng số 01 đặt tại Trạm biến áp.
  - `K1-DB-L02`: Tủ phân phối điện tầng 2 thuộc Khu nhà 1.

### 2.3. Tuyến Dây Dẫn Điện (Power Cables)
- **Cấu trúc:** `[Tên Tủ Nguồn] _ [Tên Thiết Bị Đích]`
- **Nguyên tắc:** Thể hiện rõ ràng điểm đầu (Nguồn cấp) và điểm cuối (Đích đến).
- **Ví dụ thực tế:**
  - `MSB1_DB-L2`: Cáp động lực đi từ tủ tổng MSB1 đến tủ phân phối DB-L2.
  - `TĐK-BOM1_PUMP01`: Cáp nguồn đi từ tủ điều khiển bơm 1 ra đến đầu cực động cơ bơm 01.

### 2.4. Hệ thống Cáp Mạng & Hạ tầng CNTT (Data Cables & IT)
Tuân thủ nguyên tắc phân cấp từ Phòng máy trung tâm $
ightarrow$ Tủ Rack $
ightarrow$ Thanh đấu nối $
ightarrow$ Đầu cuối.
- **Ký hiệu Tủ mạng:**
  - `MDF` (Main Distribution Frame): Tủ mạng trung tâm
  - `IDF` (Intermediate Distribution Frame): Tủ mạng nhánh / tầng
- **Cấu trúc mã cáp mạng / Nút mạng (Data Outlet):**
  - Cấu trúc: `[Tên tủ Rack] - [Vị trí thanh Patch Panel] - [Số Cổng (Port)]`
- **Ví dụ thực tế:**
  - `IDF3-P1-05`: Sợi cáp nối từ cổng số 05, thuộc thanh Patch Panel số 1, nằm trong tủ mạng IDF Tầng 3.
  - `MDF-P2-001`: Cáp mạng kết nối cổng số 001 trên thanh Patch Panel 2 tại tủ trung tâm MDF (sử dụng 3 chữ số).

### 2.5. Hệ thống Địa điểm lắp đặt & Khu vực (Locations & Areas)
Tất cả các mã địa điểm/khu vực lắp đặt thiết bị được mã hóa thống nhất theo định dạng phân cấp ngăn cách bởi dấu chấm (`.`), chuyển mã loại địa điểm thành tiền tố để hỗ trợ nhận diện và đồng bộ tối đa.
- **Cấu trúc:** `[Tiền tố].[Phân khu chính].[Phân khu con/Tầng/Hố].[Số thứ tự]`
- **Quy định thành phần:**
  - `[Tiền tố]`: `LOC` (Địa điểm cụ thể, ví dụ phòng máy, phòng bơm, vị trí tủ) hoặc `KV` (Khu vực chung, ví dụ khu sân tập, khu sân cỏ).
  - `[Phân khu chính]`: `T1` (Toà 1), `T2` (Toà 2), `SG` (Sân Golf), `CH` (Clubhouse), `DR` (Driving Range), `VIL` (Biệt thự)...
  - `[Phân khu con/Tầng/Hố]`: 
    - Đối với toà nhà cao tầng: `B1` (Hầm 1), `B2` (Hầm 2), `01` (Tầng 1), `02` (Tầng 2)...
    - Đối với sân golf (mặt đất): `H01` - `H18` (Hố số 1 đến 18), `TB` (Trạm bơm), `KT` (Khu kỹ thuật), `OD` (Outdoors / ngoài trời)...
  - `[Số thứ tự]`: Cố định 2 chữ số (`01`, `02`, `03`...) để định vị chính xác vị trí trong phân khu con.
- **Ví dụ thực tế:**
  - `LOC.T1.B1.01`: Địa điểm phòng kỹ thuật số 01 đặt tại Tầng hầm 1, Toà nhà 1.
  - `LOC.SG.H05.01`: Địa điểm hố số 5, vị trí số 01 trên Sân Golf.
  - `KV.SG.TB.02`: Khu vực trạm bơm tưới tiêu cỏ số 02 trên Sân Golf.
  - `LOC.CH.01.03`: Địa điểm vị trí lắp đặt số 03 tại Tầng 1 Nhà câu lạc bộ (Clubhouse).

---


## 3. DANH MỤC TỪ VIẾT TẮT CHUẨN HÓA (REFERENCE TABLE)

Hệ thống AI và kỹ thuật viên cần tra cứu bảng này để đồng bộ hóa danh mục thiết bị:

| Danh mục | Ký hiệu | Diễn giải tiếng Việt | Phạm vi áp dụng |
| :--- | :--- | :--- | :--- |
| **Khu vực** | `T1`, `T2`... | Tầng 1, Tầng 2... | Định vị cao độ mặt bằng |
| | `B1`, `B2`... | Tầng hầm 1, Tầng hầm 2... | Định vị khu vực ngầm |
| | `K1`, `K2`... | Khu 1, Khu 2... | Phân chia khối nhà / phân khu |
| | `PME` | Phòng kỹ thuật máy (Mechanical Room) | Phòng chức năng đặc thù |
| **Điện** | `MSB` | Tủ điện tổng | Vỏ tủ điện hạ thế |
| | `DB` | Tủ phân phối nhánh | Vỏ tủ tầng / khu vực |
| | `ATS` | Tủ nguồn tự động | Hệ thống máy phát / nguồn ưu tiên |
| | `VFD` | Biến tần / Tủ biến tần | Thiết bị điều khiển động cơ |
| **Cơ khí** | `PUMP` / `BOM`| Bơm nói chung | Định danh trên thân bơm |
| | `VALVE` | Van đường ống | Định danh hệ thống cơ cơ |
| **Mạng** | `MDF` | Tủ mạng trung tâm | Phòng Server / MDF |
| | `IDF` | Tủ mạng tầng | Các tủ nhánh trục đứng |
| | `PP` | Thanh đấu nối (Patch Panel) | Thiết bị thụ động trong tủ mạng |
| | `SW` | Thiết bị chuyển mạch (Switch) | Thiết bị chủ động |

---

## 4. TIÊU CHUẨN IN ẤN & HƯỚNG DẪN AI/OCR ĐỌC MÃ KHÔNG LỖI

Để các hệ thống AI mã thị giác hoặc OCR (như Google Vision, Tesseract) nhận diện chính xác 100%, tem nhãn khi in từ chuỗi mã này cần đảm bảo:
1. **Font chữ:** Chỉ sử dụng font không chân, nét đều đơn cách như `Arial`, `Helvetica`, `Helsinki` (trên máy Brother), hoặc `OCR-A` / `OCR-B`.
2. **Màu sắc tương phản:** Luôn dùng chữ Đen trên nền Trắng (`Black on White`) hoặc chữ Đen trên nền Vàng (`Black on Yellow`).
3. **Vùng đệm an toàn (Quiet Zone):** Để trống biên xung quanh chuỗi ký tự từ 2mm - 3mm, tránh để nét chữ sát mép nhãn khiến AI nhận diện nhầm nét cắt của nhãn.
4. **Định dạng QR chèn kèm:** Nếu chuyển mã này thành mã QR, hãy cài đặt mức sửa lỗi là **Level Q (25%)** hoặc **Level H (30%)** để đảm bảo nhãn dính bẩn, dầu mỡ trong phòng máy vẫn quét được bình thường.
