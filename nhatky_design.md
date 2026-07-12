---
name: BanDienScan NhatKy Accessibility Modern
colors:
  surface: '#ffffff'
  background: '#eef0f2'
  primary: '#0b4d5e'
  secondary: '#1b5e20'
  on-primary: '#ffffff'
  on-surface: '#000000'
  on-background: '#000000'
  outline: '#c7ccd1'
  error: '#b3261e'
  error-container: '#fdeceb'
  on-error-container: '#7a1410'
  primary-container: '#0b4d5e'
  on-primary-container: '#ffffff'
typography:
  headline-lg:
    fontFamily: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif
    fontSize: 20px
    fontWeight: '800'
    lineHeight: 28px
  body-md:
    fontFamily: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
rounded:
  DEFAULT: 16px
  md: 16px
  lg: 16px
spacing:
  base: 8px
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 20px
---

# Design System: BanDienScan NhatKy Accessibility Modern

## Brand & Style
Giao diện được thiết kế tối ưu hóa cho môi trường vận hành thực tế (nhà máy, tòa nhà) với độ tương phản cao (Accessibility) giúp nhân viên kỹ thuật dễ dàng đọc thông tin và chạm tương tác kể cả trong điều kiện di chuyển hay thiếu sáng. Phong cách thiết kế mang tính trực quan, các phần tử chạm to, viền nét rõ ràng để tránh thao tác nhầm lẫn.

## Bố cục di động (Mobile First App-Shell)
Giao diện đi theo dạng App Shell với chiều rộng tối đa là `460px` ở trung tâm màn hình, mô phỏng hoàn hảo trải nghiệm ứng dụng di động bản địa. Các khoảng cách (margin, padding) từ `12px` đến `16px` được tính toán kỹ lưỡng để tối ưu hóa không gian hiển thị trên thiết bị cầm tay.

## Bảng màu đặc trưng (Color Palette)
- **Primary / Brand (#0b4d5e):** Màu xanh cổ vịt sẫm biểu trưng cho sự tin cậy, chuyên nghiệp.
- **Success / Done (#1b5e20):** Màu xanh lá sẫm hiển thị trạng thái hoàn thành.
- **Doing (#0d47a1):** Màu xanh dương hoàng gia thể hiện trạng thái đang xử lý.
- **Danger / Alert (#b3261e):** Màu đỏ thẫm hiển thị các lỗi kỹ thuật khẩn cấp hoặc trạng thái cần hỗ trợ.
- **Warning (#8a5a00):** Màu vàng hổ phách cảnh báo các công việc cần theo dõi sát sao.
- **Background (#eef0f2 & #d8dade):** Màu nền trung tính dịu mắt, tăng cường chiều sâu phân lớp cho các card màu trắng.

## Phông chữ tương phản cao (Typography)
Hệ thống sử dụng các font mặc định của hệ điều hành di động (San Francisco, Segoe UI, Roboto) để tối ưu hóa hiệu năng tải và giữ cảm giác thân thuộc với người dùng. Cỡ chữ to hơn thông thường (font gốc 1.05rem) cùng với độ đậm (Font Weight) lớn giúp nhân viên đọc lướt nhanh nội dung công việc.

## Hình khối & Bo góc (Shapes & Borders)
- **Bo góc 16px (ROUND_SIXTEEN):** Sử dụng rộng rãi cho các App Shell, các thẻ danh sách công việc (`.a11y-list`), các nút bấm lớn (`.btn-main`).
- **Bo góc 999px (ROUND_FULL):** Áp dụng cho các badge trạng thái (`.badge-soft`) và chip người thực hiện (`.person-chip`).
- **Đường viền dày (2px - 3px):** Tất cả các khung nhập liệu và nút bấm đều có đường viền đậm nét (`#c7ccd1` hoặc màu chữ chính) nhằm định hình rõ khu vực tương tác xúc giác.
