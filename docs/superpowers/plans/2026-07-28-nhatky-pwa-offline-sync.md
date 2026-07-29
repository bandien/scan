# Kế hoạch triển khai PWA/offline sync

1. Viết Playwright test cho manifest, script PWA, queue allowlist, gộp bản ghi,
   phục hồi queue và flush. Chạy để xác nhận RED.
2. Khôi phục `sw.js`, `js/pwa.js`, thêm manifest riêng cho Nhật ký.
3. Tạo `js/offline-queue.js`, bọc transport hiện hữu và phát sự kiện trạng thái.
4. Gắn badge đồng bộ vào Nhật ký, không sửa các hàm nghiệp vụ.
5. Chạy test mới, rồi toàn bộ test Nhật ký trên desktop và mobile.

Verification:

```powershell
npx playwright test tests/nhatky-offline.spec.js --project=chromium
npx playwright test tests/nhatky.spec.js tests/nhatky-account.spec.js tests/nhatky-offline.spec.js
```

