# Design Spec: Admin Checklist Template Builder & Acceptance Criteria

## 1. Mục Tiêu
Cung cấp chức năng thiết kế và tạo các Mẫu Sổ Checklist vận hành chuẩn hóa dành cho Quản Trị Viên (Admin), bao gồm các hạng mục và tiêu chí đạt được cụ thể.

## 2. Mô Hình Mẫu Sổ
```json
{
  "id": "tpl_1724250000000",
  "name": "Sổ kiểm tra Trạm Biến Áp (TBA)",
  "category": "Trạm điện",
  "createdBy": "ADMIN01",
  "items": [
    {
      "id": "item_1",
      "title": "Kiểm tra nhiệt độ tiếp xúc cáp tổng & máy biến áp",
      "priority": "Khẩn cấp",
      "criteria": "Nhiệt độ các điểm đấu nối ≤ 65°C, không có điểm nóng cục bộ"
    },
    {
      "id": "item_2",
      "title": "Kiểm tra điện áp 3 pha và tần số lưới",
      "priority": "Quan trọng",
      "criteria": "Điện áp 380V ± 5%, tần số 50Hz ± 0.2Hz"
    }
  ]
}
```
