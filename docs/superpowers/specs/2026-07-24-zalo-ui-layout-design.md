# Design Spec & Phân Tích Thiết Kế: Giao Diện Zalo Layout Theo File `UI_Overall Layout.md`

- **Ngày lập:** 2026-07-24
- **Nguồn thiết kế chính:** `docs/superpowers/plans/UI_Overall Layout.md`
- **Phương pháp luận:** Superpowers SDLC (`brainstorming` & `writing-plans`)
- **Đối tượng:** `02_Source/nhatky/index.html`

---

## 1. TỔNG QUAN THIẾT KẾ ZALO LAYOUT (OVERALL LAYOUT SPEC)

Ứng dụng được thiết kế theo đúng chuẩn phong cách **Ứng dụng nhắn tin Zalo Mobile** mô tả tại file `UI_Overall Layout.md`:

```mermaid
flowchart TD
    subgraph Mobile Screen Layout (Zalo Style)
        H[1. Header Blue Bar - Search & QR / Plus Icons]
        SH[2. Sub-header - Tab 'Việc cần làm' | Tab 'Checklist']
        B[3. Body - Vertical Scrollable ListView Items]
        NAV[4. Bottom Navigation - 4 Tabs: Công việc, Contacts, Discovery, Me]
    end

    H --> SH --> B --> NAV
```

---

## 2. CHI TIẾT THÀNH PHẦN THEO SPEC (`UI_Overall Layout.md`)

### 2.1 Header (Thanh tìm kiếm & Công cụ)
- **Background**: Màu xanh dương đồng nhất (`#0084FF` / `#0068ff`).
- **Search Bar (Bên trái)**: Icon kính lúp màu trắng, ô nhập tìm kiếm Placeholder `"Search"` màu trắng/trong suốt.
- **Action Icons (Bên phải)**: 
  - Icon quét mã QR màu trắng.
  - Icon dấu cộng (**`+`**) màu trắng dành cho nút tạo việc mới / mở rộng.

### 2.2 Sub-header (Tab phân loại)
- **Background**: Màu trắng.
- **Cấu trúc Tab**: 2 Tab nằm sát lề trái:
  - Tab **"Việc cần làm"** (Active): Text màu đen, in đậm, có đường viền ngang (`border-bottom: 2px solid #000` hoặc `#0068ff`) phía dưới text.
  - Tab **"Checklist"** (Inactive): Text màu xám nhạt, in thường.
- **Divider**: Đường kẻ ngang (`border-bottom`) rất mờ màu xám nhạt ngăn cách với danh sách bên dưới.

### 2.3 Body (Danh sách cuộc trò chuyện - ListView)
- **Cấu trúc**: Danh sách cuộn dọc. Mỗi List Item có đường kẻ xám nhạt ngăn cách.
- **Cấu trúc một List Item**:
  - **Avatar (Bên trái)**: Khung hình tròn dạng Gradient / Avatar chữ cái đại diện.
  - **Khung nội dung (Ở giữa)**:
    - *Title (Tên công việc)*: Dòng trên, text màu đen, font lớn, in thường (tràn xuống hàng dưới nếu quá dài).
    - *Subtitle (Thông tin người thực hiện)*: Dòng dưới, text màu xám nhạt. Hiển thị dạng `"Tên người gửi: Nội dung"` (vd: `Thắng NQ: Kiểm tra nhiệt độ đầu cốt tủ MSB-B1`).
  - **Khung trạng thái (Bên phải)**:
    - *Thời gian*: Góc dưới bên phải, text xám nhạt (vd: `1 hour`, `1 second`, `14:20`).
    - *Icon Trạng thái*: Bên trái thời gian (Icon đinh ghim Pinned / Icon loa gạch chéo Muted / Icon trạng thái).
    - *Unread Badge (Số lượng đã làm / chưa làm)*: Hình tròn màu đỏ, text màu trắng (vd: `"1/2"` hoặc `"3/5"`).

### 2.4 Bottom Navigation Bar (Thanh điều hướng dưới)
- **Background**: Màu trắng, viền trên mờ màu xám (`border-top: 0.5px solid #e2e8f0`).
- **4 Tab chính**:
  1. **Công việc** (Đang chọn): Icon khung chat màu xanh dương, badge màu đỏ `5+` đè góc trên bên phải icon. Text label "Công việc" màu xanh dương.
  2. **Contacts**: Icon hình người (outline) màu xám. Text "Contacts".
  3. **Discovery**: Icon 4 ô vuông (outline) màu xám, có chấm đỏ nhỏ ở góc trên bên phải icon. Text "Discovery".
  4. **Me**: Icon hình người outline màu xám. Text "Me".

---

## 3. KẾ HOẠCH BẢO HÀNH & XÁC MINH (Verification Plan)

1. **Automated File Check**:
   ```bash
   node -e "const fs = require('fs'); const content = fs.readFileSync('d:/Claude/1_Projects/scan/02_Source/nhatky/index.html', 'utf8'); console.log('SPA File length:', content.length);"
   ```
2. **UI Verification**:
   Kiểm tra đúng 4 vùng: Header xanh dương, Sub-header 2 Tab ("Việc cần làm" | "Checklist"), ListView item có Unread Badge đỏ `"1/2"`, và Bottom Nav 4 tab.
