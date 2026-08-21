# Implementation Plan: Admin Checklist Template Builder

## 1. Overview
Triển khai chức năng tạo Mẫu Sổ Checklist cho Admin và áp dụng mẫu vào ca trực cho nhân viên trong `nhatky/index.html`.

## 2. Các Bước Thực Hiện (TDD Workflow)
1. **Viết Test Playwright:** Thêm kịch bản Admin tạo mẫu sổ checklist với các hạng mục và tiêu chí đạt được; nhân viên áp dụng mẫu sổ vào ca trực và kiểm tra hiển thị.
2. **Cập nhật `AppRepository`:** Quản lý `checklistTemplates`, phương thức `saveTemplate()`, `deleteTemplate()`, `applyTemplateToShift()`.
3. **Cập nhật Giao Diện:** Thêm `#modal-template-builder`, `#modal-apply-template`, nâng cấp hiển thị `criteria` (🎯 Tiêu chí đạt) trong danh sách task.
4. **Chạy Test & Verification:** Đảm bảo 100% test cases pass và deploy lên GitHub Pages.
