# Thiết kế gói deploy Apps Script an toàn

## Vấn đề

`clasp` đang chạy trực tiếp tại repository root. `.claspignore` dùng blacklist và đã
để lọt nhiều file không thuộc backend lên remote: báo cáo Playwright, trang phục hồi,
redirect/stub và mã extension. Một `clasp push` từ root có thể ghi đè project bằng trạng
thái workspace không kiểm soát.

## Quyết định

Không chạy `clasp push` tại repository root. Tạo một staging directory mới từ allowlist:

- Các module Apps Script chính thức `00_...gs` đến `20_...gs`, `Code.gs.gs`, `XepLich.gs`.
- `appsscript.json`.
- `index.html`, vì `doGet` gọi `HtmlService.createTemplateFromFile('index')`.

Không đưa frontend GitHub Pages, báo cáo test, file tạm, trang legacy/recovered, extension,
tài liệu hay dữ liệu vào gói.

`.clasp.json` chỉ được sao chép vào staging lúc build, không nhân bản script ID vào
manifest hoặc log. Deploy luôn chạy từ staging.

## Cổng kiểm soát

1. Mọi file allowlist phải tồn tại.
2. Không chấp nhận đường dẫn tuyệt đối hoặc `..`.
3. Inventory staging phải khớp tuyệt đối allowlist cộng `.clasp.json`.
4. Từ chối tên/path chứa `test-results`, `playwright-report`, `temp`, `recovered`,
   `old_`, `node_modules`, `danhba_chuan_hoa`.
5. Parse toàn bộ JavaScript/Apps Script trước deploy.
6. Chạy test backend và E2E liên quan trước khi push.
7. `clasp status` phải được chạy trong staging, không tại repository root.

## Phát hành

Build staging không thay đổi remote. `clasp push` và cập nhật deployment là bước riêng,
chỉ thực hiện sau khi inventory và test đều GREEN.

