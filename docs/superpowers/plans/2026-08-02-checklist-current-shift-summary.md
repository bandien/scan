# Kế hoạch triển khai Checklist ca hiện tại

1. Tạo nhánh `feat/checklist-current-shift-summary` từ `main`.
2. RED: mở rộng `tests/checklist-shifts.test.js` cho ngữ cảnh ca hiện tại/ca trước và tóm tắt run.
3. RED: cập nhật `tests/checklist-file-lifecycle.spec.js` để yêu cầu CTA ca hiện tại xuất hiện trước tóm tắt ca trước.
4. GREEN: mở rộng `js/checklist-shifts.js` với `context(now)` và `summarizePreviousRun(...)`.
5. GREEN: cập nhật `nhatky/index.html` để tải run ca trước, render CTA ca hiện tại và trạng thái bàn giao.
6. REFACTOR: chuyển style Checklist sang `css/app.css`, giữ HTML render gọn và semantic.
7. Verify: chạy Node test, Playwright riêng màn Checklist, toàn bộ test liên quan và kiểm tra trực quan ở viewport mobile.
