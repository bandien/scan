# Kế hoạch chuẩn hóa gói deploy Apps Script

1. Viết test RED kiểm tra manifest allowlist, file cấm và inventory staging.
2. Tạo `tools/gas-deploy-files.json`.
3. Tạo `tools/Build-GasDeployPackage.ps1` với kiểm tra đường dẫn và staging mới hoàn toàn.
4. Chạy test package, backend lifecycle và build staging thật.
5. Chạy `clasp status` từ staging và so sánh inventory với remote.
6. Commit/push công cụ. Chỉ chạy `clasp push` sau khi xác nhận không có file ngoài phạm vi.

