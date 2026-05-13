# 11_BanDienScan (Ban điện Scan)

Module quản lý bảo trì ban điện, dựa trên [vanhanh-ai/qr](https://github.com/vanhanh-ai/qr).
Repo quản lý: [bandien/scan](https://github.com/bandien/scan.git)

---

## 🔄 Cập nhật từ bản gốc
Để cập nhật các tính năng mới từ hệ thống lõi `vanhanh-ai/qr`, sử dụng các lệnh sau:
```bash
git fetch upstream
git merge upstream/master
```

---

# UID QR Code Maintenance System

Hệ thống quản lý bảo trì thiết bị thông minh sử dụng mã QR UID.

## Tính năng
- Quét mã QR trực tiếp từ trình duyệt (không cần cài app).
- Tra cứu thông tin thiết bị từ Google Sheets.
- Gửi báo cáo bảo trì và checklist về Google Sheets.
- Hosting miễn phí trên GitHub Pages.

## Hạ tầng
- **Frontend**: GitHub Pages (Static HTML/JS).
- **Backend**: Google Apps Script (GAS).
- **Database**: Google Sheets.

## Cài đặt & Chuyển giao
Hệ thống được thiết kế để dễ dàng triển khai lại bởi bất kỳ ai. Vui lòng xem các hướng dẫn chi tiết sau:

1. **[Hướng dẫn triển khai nhanh (Deploy Guide)](./docs/DEPLOY_GUIDE.md)**: Cách thiết lập hệ thống từ đầu trong 5 phút.
2. **[Cấu trúc Database (Sheet Structure)](./docs/SHEET_STRUCTURE.md)**: Chi tiết cách thiết lập các bảng tính Google Sheets.

## Giấy phép
Dự án được phát hành dưới giấy phép mã nguồn mở MIT. Tự do sử dụng, chỉnh sửa và chia sẻ.
