---
name: Scan Industrial Utility
colors:
  surface: '#10131b'
  surface-dim: '#10131b'
  surface-bright: '#363942'
  surface-container-lowest: '#0b0e16'
  surface-container-low: '#181b24'
  surface-container: '#1c2028'
  surface-container-high: '#272a32'
  surface-container-highest: '#32353d'
  on-surface: '#e0e2ed'
  on-surface-variant: '#c2c6d8'
  inverse-surface: '#e0e2ee'
  inverse-on-surface: '#2d3039'
  outline: '#8c90a1'
  outline-variant: '#424655'
  surface-tint: '#b1c5ff'
  primary: '#b1c5ff'
  on-primary: '#002c70'
  primary-container: '#0e6efd'
  on-primary-container: '#000415'
  inverse-primary: '#0057ce'
  secondary: '#b1c5ff'
  on-secondary: '#182e5f'
  secondary-container: '#314577'
  on-secondary-container: '#a0b4ed'
  tertiary: '#ffb599'
  on-tertiary: '#5a1c00'
  tertiary-container: '#cf4b00'
  on-tertiary-container: '#ffffff'
  error: '#93000a'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#dae2ff'
  primary-fixed-dim: '#b1c5ff'
  on-primary-fixed: '#001946'
  on-primary-fixed-variant: '#00419e'
  secondary-fixed: '#dae2ff'
  secondary-fixed-dim: '#b1c5ff'
  on-secondary-fixed: '#001847'
  on-secondary-fixed-variant: '#314577'
  tertiary-fixed: '#ffdbce'
  tertiary-fixed-dim: '#ffb599'
  on-tertiary-fixed: '#370e00'
  on-tertiary-fixed-variant: '#7f2b00'
  background: '#10131b'
  on-background: '#e0e2ee'
  surface-variant: '#32353d'
  surface-high: '#262a32'
  success: '#2d8a5f'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '800'
    lineHeight: 36px
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 24px
  label-md:
    fontFamily: Public Sans
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 18px
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '800'
    lineHeight: 32px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  touch-target: 52px
  margin-mobile: 16px
  gutter: 16px
  card-gap: 20px
---

## Brand & Style

Hệ thống thiết kế này tập trung vào tính chuyên nghiệp, độ tin cậy và hiệu năng vận hành cực cao cho các kỹ sư điện cơ. Phong cách chủ đạo là **Corporate Modern** kết hợp với **Dark Mode** sâu, được tối ưu hóa cho môi trường làm việc thực địa (tầng hầm, buồng kỹ thuật). 

Giao diện hướng tới sự kỷ luật, sắc nét và mạnh mẽ thông qua việc sử dụng các đường viền mảnh thanh lịch, lớp phủ bề mặt (tonal layering) tinh tế và tương tác phản hồi xúc giác nhạy bén. Trải nghiệm người dùng tập trung tuyệt đối vào tác vụ quét mã và nhập liệu nhanh, loại bỏ các chi tiết thừa để đảm bảo khả năng đọc tốt nhất dưới mọi điều kiện ánh sáng.

## Colors

Bảng màu sử dụng bảng màu tối sâu để giảm mỏi mắt và tiết kiệm pin cho thiết bị di động. 
- **Primary (#0e6efd):** Màu xanh dương công nghệ, dành cho các hành động quan trọng nhất và trạng thái kích hoạt.
- **Surface & Background (#10131b):** Nền tối sâu làm nền tảng cho hệ thống phân lớp.
- **Success & Error:** Sử dụng các tông màu có độ bão hòa cao để chỉ thị trạng thái thiết bị kỹ thuật một cách tức thì.
- **Text:** Sử dụng màu trắng xám nhẹ (#e0e2ed) để duy trì độ tương phản cao nhưng không gây hiện tượng "halo" (nở chữ) trên nền tối.

## Typography

Hệ thống sử dụng **Inter** cho hầu hết các thành phần để đảm bảo tính hiện đại và khả năng hiển thị kỹ thuật sắc nét. **Public Sans** được dùng cho các nhãn (labels) và chỉ số phụ để tạo sự phân cấp cấu trúc rõ ràng.

Đặc biệt lưu ý:
- Độ đậm (Weight) được đẩy cao hơn một mức so với thiết kế thông thường để bù đắp cho hiện tượng mất nét trên nền tối của màn hình di động.
- Khoảng cách dòng (Line-height) được duy trì ở mức 1.4x - 1.5x để tối ưu tốc độ đọc lướt các thông số kỹ thuật.

## Layout & Spacing

Hệ thống sử dụng mô hình **Fluid Grid** đơn cột tối ưu cho di động với chiều rộng tối đa (`max-width`) là 440px để duy trì sự tập trung.

- **Spacing Rhythm:** Dựa trên đơn vị 8px. 
- **Mobile First:** Lề trang cố định ở 16px để tận dụng tối đa diện tích hiển thị nhưng vẫn giữ được sự thông thoáng.
- **Touch-Friendly:** Mọi thành phần tương tác phải có vùng chạm tối thiểu là 44px, ưu tiên 52px cho các nút bấm tác vụ chính để kỹ sư dễ dàng thao tác khi đeo găng tay hoặc đang di chuyển.

## Elevation & Depth

Trong giao diện tối, chiều sâu không được diễn tả bằng bóng đổ tối mà bằng **Tonal Layering** (lớp phủ màu).
- **Mức 0 (Background):** #10131b - Nền ứng dụng.
- **Mức 1 (Surface/Cards):** #1c2028 - Các thẻ thiết bị, biểu mẫu.
- **Mức 2 (Dialogs/Menus):** #262a32 - Các thành phần nổi lên trên cùng.

Sử dụng đường viền mảnh (1px) với màu `#424655` để định hình các khối thông tin thay vì dùng bóng đổ rườm rà, giúp giao diện trông gọn gàng và kỹ thuật hơn.

## Shapes

Hệ thống sử dụng ngôn ngữ hình khối **Rounded (Level 2)** để cân bằng giữa sự kỷ luật kỹ thuật và tính dễ tiếp cận.
- **Nút bấm:** Sử dụng `rounded-xl` (24px/Pill-shaped) để tạo cảm giác mời gọi chạm.
- **Thẻ (Cards) & Input:** Sử dụng `rounded-lg` (16px) để tạo cấu trúc bao bọc chắc chắn.
- **Badges:** Sử dụng bo tròn hoàn toàn (Full rounded) để hiển thị trạng thái vận hành.

## Components

- **Buttons:** Nút chính cao 52px, nền `#0e6efd`, chữ trắng đậm (Weight 800). Hiệu ứng `scale(0.97)` khi nhấn để phản hồi xúc giác.
- **Input Fields:** Cao tối thiểu 50px, nền `#181c24`, viền 2px. Khi focus, viền đổi sang màu xanh rực để người dùng biết rõ đang nhập liệu ở đâu.
- **Cards:** Luôn có dải màu chỉ thị trạng thái (Status Bar) rộng 4px ở cạnh trái (Xanh: Hoạt động, Đỏ: Sự cố) để nhận diện nhanh không cần đọc chữ.
- **Checkboxes:** Kích thước lớn 24x24px để dễ dàng tích chọn tại hiện trường.
- **Meter Reading (Chốt số):** Ô nhập số kích thước lớn kết hợp nút tăng/giảm (+/-) hai bên để thay thế bàn phím ảo khi cần thiết.
- **Badges:** Hiển thị trạng thái "Đang chạy" hoặc "Đã dừng" bằng tiếng Việt với độ tương phản màu chữ/nền cực cao.