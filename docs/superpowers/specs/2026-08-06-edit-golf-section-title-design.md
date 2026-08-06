# Thiết kế sửa tiêu đề phần checklist Golf

## Vấn đề

`SectionTitle` đang được lưu lặp lại trên từng dòng hạng mục. Biểu mẫu sửa hạng mục chỉ cập nhật một dòng nên không phải cách an toàn để đổi câu tiêu đề của toàn bộ Phần A hoặc Phần B.

## Giải pháp

- Hiển thị nút **Sửa tiêu đề** cạnh từng tiêu đề phần trong màn quản lý hạng mục.
- Mở modal riêng gồm mã phần chỉ đọc và ô tiêu đề mới.
- Thêm POST `updateGolfTemplateSectionTitle` nhận `templateId`, `section`, `sectionTitle`.
- Backend cập nhật cột `SectionTitle` cho tất cả hạng mục khớp mẫu và phần trong một lần ghi.
- Sau khi lưu, frontend cập nhật dữ liệu đang giữ và render lại ngay.

## Tiêu chí chấp nhận

1. Có thể sửa riêng tiêu đề Phần A/B từ màn quản lý hạng mục.
2. Tất cả hạng mục trong cùng phần nhận cùng tiêu đề mới.
3. Không thay đổi nhãn, loại đầu vào hay dữ liệu khác của hạng mục.
4. Tiêu đề rỗng bị chặn tại frontend và backend.
5. Hoạt động trên desktop và mobile.
