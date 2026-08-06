# Kế hoạch sửa tiêu đề phần checklist Golf

1. RED: test backend yêu cầu route và cập nhật toàn bộ dòng cùng phần.
2. RED: E2E yêu cầu nút/modal sửa tiêu đề và payload đúng.
3. GREEN: thêm handler `updateGolfTemplateSectionTitle` và route POST.
4. GREEN: thêm modal, nút tiêu đề và cập nhật dữ liệu local.
5. Verify: Node test, Playwright desktop/mobile, `git diff --check`.
