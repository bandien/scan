# 📊 Cấu trúc Google Sheets (Database)

Để hệ thống hoạt động, bạn cần tạo một Google Sheet với các bảng (Tabs) và cấu trúc cột như sau:

## 1. Sheet: `Users`
Dùng để quản lý tài khoản đăng nhập.
| Username | PIN | Role |
|----------|-----|------|
| admin    | 1234| Admin|
| technician| 5678| User |

## 2. Sheet: `Devices`
Danh mục thiết bị/tài sản.
| UID | Name | Location | Specs | Cycle | NextMaintenance | Status |
|-----|------|----------|-------|-------|-----------------|--------|
| TB001| Máy nén khí | Tầng 1 - Khu A | 10HP, 8Bar | 30 | 2024-06-15 | IN |
| TB002| Điều hòa LG | Phòng Server | 24000 BTU | 90 | 2024-08-10 | IN |
| TB003| Xe nâng tay | Kho vật tư | Tải 2.5T | 180 | 2024-12-01 | OUT |

## 3. Sheet: `Logs`
Nhật ký bảo trì và lịch sử Nhập/Xuất.
- **Cột A**: `Timestamp` (Thời gian)
- **Cột B**: `AssetUID`
- **Cột C**: `Data` (Dữ liệu Checklist dạng JSON)
- **Cột D**: `Notes` (Ghi chú)
- **Cột E**: `User` (Người thực hiện)
- **Cột F**: `ImageURL` (Link ảnh trên Drive)

## 4. Sheet: `Checklists`
Cấu hình các đầu việc kiểm tra động.
- **Cột C**: `Title` (Tên đầu việc)
- **Cột D**: `Description` (Mô tả chi tiết)

## 5. Sheet: `WorkOrders`
Quản lý các phiếu sửa chữa/bảo trì.
- **Cột A**: `WO-ID`
- **Cột B**: `Timestamp`
- **Cột C**: `AssetUID`
- **Cột D**: `Status` (Open/Closed/In Progress)
- **Cột E**: `Priority`
- **Cột F**: `Type`
- **Cột G**: `Description`
- **Cột H**: `DueDate`

## 6. Sheet: `AuditLog`
Ghi nhật ký hệ thống và thay đổi mật khẩu.
- **Cột A**: `Timestamp`
- **Cột B**: `User`
- **Cột C**: `Action`
- **Cột D**: `Target`
- **Cột E**: `Details`
