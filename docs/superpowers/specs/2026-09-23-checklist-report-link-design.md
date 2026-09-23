# Thiết kế liên kết báo cáo tại Checklist

## Mục tiêu

Thêm một liên kết dễ nhận biết tại phần đầu màn hình `#checklist`, mở đúng báo cáo vận hành trên Google Sheets trong tab mới.

## Thiết kế

- Nhãn hiển thị: `Báo cáo`.
- Vị trí: nhóm thao tác bên phải tiêu đề “Quy Trình & Biểu Mẫu Vận Hành”.
- Đích: trang tính và sheet có `gid=2114189017` do người dùng cung cấp.
- Bảo mật và khả năng truy cập: dùng `target="_blank"`, `rel="noopener noreferrer"` và `aria-label` mô tả rõ đích đến.
- Giữ nguyên các luồng checklist và quyền quản trị hiện có.

## Nghiệm thu

Playwright xác nhận liên kết hiển thị tại `#checklist`, đúng URL, mở tab mới và có thuộc tính bảo mật.
