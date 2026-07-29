---
title: Nhật ký thay đổi (Changelog) - BanDienScan
aliases:
  - changelog
  - nhật ký thay đổi (changelog) - bandienscan
tags:
  - khac
  - scan-cmms
  - dang-thuc-hien
date: 2026-06-08
updated: 2026-06-08
---
# Nhật ký thay đổi (Changelog) - BanDienScan

Tất cả các thay đổi và cải tiến của hệ thống Quản lý & Bảo trì Ban điện thông minh (CMMS Mini WebApp) được ghi nhận tại đây theo từng phiên bản.

## [v2.17.0] - 2026-07-29
### Thêm mới (Added)
- **Khởi tạo mẫu checklist theo địa điểm / thời gian / ca trực** (`19_GolfChecklist.gs`, `02_Router.gs`):
  - Sheet mới `ChecklistTemplateDefs` — sổ đăng ký mẫu checklist: mỗi mẫu khai báo Địa điểm, Ca trực (`ShiftCode`), Tần suất (`daily`/`weekly`/`monthly`), Khung giờ (`TimeStart`–`TimeEnd`, hỗ trợ ca qua đêm), Thứ/Ngày áp dụng, Tổ phụ trách. Seed sẵn 4 mẫu golf hiện hành.
  - API mới: `getChecklistTemplateDefs` (danh sách định nghĩa mẫu), `getChecklistSchedule` (mẫu nào áp dụng tại ngày/giờ — ngày nghiệp vụ tính ở server, không suy luận ở frontend), `upsertChecklistTemplateDef` (tạo/sửa mẫu, hỗ trợ `cloneFromTemplateId` nhân bản hạng mục từ mẫu có sẵn), `deleteChecklistTemplateDef` (soft delete, giữ lịch sử runs).
  - Mẫu mới tạo dùng lại nguyên vòng đời run hiện có (autosave → chốt ca → bàn giao → xác nhận) vì runs khóa theo `TemplateID`.
  - Tài liệu phân tích nghiệp vụ: `docs/superpowers/specs/2026-07-29-checklist-template-init-design.md`.
  - 8 test Node mới (`tests/checklist-template-defs.test.js`): khung giờ, ca qua đêm, tuần/tháng theo ngày nghiệp vụ, validation, route.

## [v2.16.0] - 2026-07-26
### Thêm mới (Added)
- **Quản lý tài khoản Admin / Account Management** (`nhatky/index.html`, `css/app.css`):
  - Phân quyền Gate Admin/Manager trên Screen Cá nhân (`#screenProfile`): hiện nút `⚙️ Quản lý tài khoản nhân sự`.
  - Modal `#modalManageAccounts` hiển thị Thống kê (255 Tổng số · 3 Admin · 11 Manager · 241 Staff), ô Tìm kiếm & Lọc vai trò.
  - Dropdown đổi vai trò nhanh (`Staff` ↔ `Manager` ↔ `Admin`) trực tiếp cho từng nhân sự.
  - Form `#formAddAccountBox` tạo tài khoản nhân sự mới và lưu vào `staffDirectory` + `localStorage`.
  - 5 Playwright tests mới (`100/100 tests passed`).
- **Quên mật khẩu / Forgot Password** (`nhatky/index.html`, `css/app.css`):
  - Link `#btnOpenForgot` "Quên mật khẩu?" tại form `#screenLogin`.
  - Modal `#modalForgotPassword` tra cứu cán bộ nhân sự theo Username / Họ tên / SĐT.
  - Tự động đối soát `staffDirectory` hiển thị thông tin Quản lý/Tổ trưởng phụ trách tổ hoặc Hotline Ban Điện (`0392966368`), kèm nút bấm gọi điện một chạm (`tel:`).
  - 3 Playwright tests mới (`90/90 tests passed`).
- **Login Screen — màn hình đăng nhập full-screen** (`nhatky/index.html`, `css/app.css`):
  - `#screenLogin` — HTML cố định theo SPA pattern (thay bottom-sheet overlay cũ tạo bằng JS).
  - Brand logo 🗂 + tiêu đề "Ban Điện" + subtitle "Nhật ký Công việc".
  - `#loginForm` với `#liUser`, `#liPass`, `#liBtn` — submit bằng Enter hoặc click.
  - `#loginError` — error inline (không dùng toast) khi nhập sai hoặc API lỗi.
  - `initLoginForm()` — gắn handler sau DOMContentLoaded, sau login thành công gọi `showScreen('main')` trực tiếp.
  - `checkLogin()` gọi `showLoginScreen()` (thay `showLoginOverlay()`) — hiện `#screenLogin` qua `showScreen('login')`.
  - `initApp()` — gate login trước khi load plans: `if (!checkLogin()) return`.
  - `handleRoute()` — guard: không override login screen khi đang hiện.
  - **CSS mới**: `.nk-login`, `.nk-login__brand`, `.nk-login__logo`, `.nk-login__title`, `.nk-login__sub`, `.nk-login__form`, `.nk-login__label`, `.nk-login__input`, `.nk-login__error`, `.nk-login__btn`, `.nk-login__footer`.
  - **Dark mode**: `.nk-login__error` đổi màu theo theme.
  - **Playwright 6 tests mới** (`Login Screen` describe): chưa login hiện screen, có form đúng, submit trống → error, sai credentials → error "Sai", đúng credentials → screenMain, đã login → không hiện.
  - **Verify**: Playwright **84/84 tests PASSED** (72 cũ + 6 login + 6 A6 — Chromium + Mobile Chrome, 15.7s).

## [v2.15.0] - 2026-07-26
### Thêm mới (Added)
- **A2 — Gate quyền Ghi hộ + Danh bạ thật** (`nhatky/index.html`):
  - `canWriteOnBehalf()` — gate theo `user.role` (Manager/Admin/Quản lý/Tổ trưởng); section "Ghi hộ" ẩn hoàn toàn với user thường.
  - `fAssignee` đổi thành datalist `staffDatalist` — gợi ý tên từ `staffDirectory` khi gõ.
  - `populateAssigneeDatalist()` — điền datalist sau `loadStaff()` trong `initApp()`.
  - `loadStaffIntoSelect()` refactor: dùng `staffDirectory` thay API call, sắp xếp cùng tổ lên trước, **xóa hoàn toàn** fallback 4 tên hardcode.
- **A5 — Tab Báo cáo + Tab Cá nhân** (`nhatky/index.html`, `css/app.css`):
  - **Screen Báo cáo** (`#screenReport`, `#report` hash route): 4 stat cards (Đang làm / Cần hỗ trợ / Hoàn thành / Tổng việc) + bảng Top 5 kỹ thuật viên theo số việc; bottom-nav đầy đủ.
  - **Screen Cá nhân** (`#screenProfile`, `#profile` hash route): avatar circle gradient + tên + role + tổ + username; nút Đổi giao diện (đồng bộ dark/light); nút Đăng xuất (clear localStorage + reload).
  - `navigateToReport()`, `navigateToProfile()` — hash routing mới.
  - `toggleTheme()` — đồng bộ icon dark/light trên cả 3 screen.
  - `renderReportScreen()`, `renderProfileScreen()`, `doLogout()`.
  - **CSS mới**: `.nk-stat-grid`, `.nk-stat-card`, `.nk-report-table`, `.nk-report-row`, `.nk-profile`, `.nk-profile__avatar`, `.nk-profile__action[--danger]`.
  - **Verify**: `node --check` 0 lỗi; Playwright **48/48 tests passed** (Chromium + Mobile Chrome, 9.7s).

## [v2.14.0] - 2026-07-26
### Thêm mới (Added)
- **Khôi phục Giai đoạn & Bước + Crowd-Completion trên Zalo shell** (`nhatky/index.html`): Port toàn bộ tính năng Plan A1 từ commit `e0dfa93` lên shell Zalo mới — đúng theo thiết kế "Việc nhỏ ẩn bớt, việc lớn hiện thêm".
  - **Task 1–2 (Hạ tầng)**: `planPhases`, `allPlanSteps`, `findAnyStep`, `findStepWithPhase`, `stepDoneInfo`, `markStepDoneByPeople`, `stepPeopleProgressHtml`, `rollUpPhaseStatus_`. Danh bạ thật (`loadStaff` → 3 tầng cache: localStorage → `danhba_chuan_hoa.json` → `getStaff` API), `getShortName` đầy đủ (tra `staffDirectory`, fallback format chuẩn), `knownPeopleNames`, `filterNamesByTag` (lọc theo `plan.team`/tổ).
  - **Task 3 (CRUD)**: `addPhase`, `renamePhase`, `deletePhase`, `addPhaseStep`, `renamePhaseStep`, `deletePhaseStep`, `togglePhaseStepDone`, `updatePlanPhases` (optimistic UI + rollback khi API lỗi).
  - **Task 4 (Gán người)**: `phaseStepAssigneeEditorHtml` — chip tên (có nút ×), dropdown `+ Gán người` lọc theo tổ, tuỳ chọn "➕ Nhập tên khác".
  - **Task 5 (Nâng cấp)**: Nút **"⚙️ Việc này phức tạp? Chia giai đoạn/bước"** chỉ hiện khi việc chưa có phases — bấm tạo giai đoạn đầu tiên "Thực hiện".
  - **Task 6 (Render)**: `renderFlatPhases` trong `renderDetailScreen` — khối Giai đoạn & Bước chỉ xuất hiện khi `planPhases(plan).length > 0`, kèm trạng thái done/doing/todo, đếm bước, nút + Thêm bước/giai đoạn.
  - **Task 7 (Crowd-Completion)**: `reportStepDone` + nút **"○ Báo mình xong"** (`nk-self-chip`) — mỗi assignee tự bấm xác nhận phần mình; bước chỉ tick Done khi mọi người đã báo xong (`markStepDoneByPeople` + `rollUpPhaseStatus_`).
  - **Task 8 (Badge danh sách)**: Card trên màn chính hiện badge **"GĐ X/Y"** thay badge trạng thái thường khi việc có phases — thể hiện tiến độ bước ngay ở màn danh sách.
  - **CSS mới**: `.nk-step-wrap`, `.step-chip`, `.step-assignees`, `.step-add-select`, `.step-done-note`, `.step-progress-people`, `.nk-self-chip` (hover + `is-done`), `.nk-step__del` (hiện khi hover).
  - **Utilities mới**: `friendlyDate()` — chuyển ISO date → "Hôm nay/Hôm qua/N ngày trước/dd/mm".
  - **Verify**: `node --check` 0 lỗi cú pháp; Playwright **28/28 tests passed** (Chromium + Mobile Chrome) — badge GĐ, nút Nâng cấp, render phases, chips, progress, crowd-completion self-chip.

## [v2.13.1] - 2026-07-22

### Thêm mới (Added)
- **Hướng dẫn Báo cáo Nước & Copy tin nhắn nhanh (chốt 18h)**: Thêm mục "Hướng dẫn báo cáo nước (18h)" vào Menu tiện ích của thanh điều hướng dưới (`js/bottomnav.js`). Khi bấm vào sẽ mở một hộp thoại (modal) hướng dẫn từng bước quy trình chốt số liệu nước lúc 18h00, tích hợp liên kết đến website KySon (tự động điền/hiển thị tài khoản và nút Copy nhanh thông tin đăng nhập `vanhanh/vanhanh`) và phần tạo mẫu tin nhắn báo cáo tóm tắt kèm nút **Copy tin nhắn** tiện lợi cho nhân viên vận hành.

## [v2.13.0] - 2026-07-22
### Thêm mới (Added)
- **Ghi nhật ký "mỗi người tự báo phần mình" theo bước/giai đoạn (P4, `nhatky/index.html`)**: đổi mô hình ghi nhật ký từ "1 người điền hộ cả nhóm" sang **mỗi người tự ghi phần mình** — đúng mục đích ban đầu (đánh giá riêng từng người, ghi nhanh gọn). Form ghi cho 1 bước mặc định là `currentUser()`; nếu bước có ≥2 người, hiện chip **"Tôi là ai"** (`#logSelfPicker`) để chọn đúng người khi dùng điện thoại chung. Chế độ "ghi hộ cả nhóm" (lưới nhiều người + đánh giá) vẫn giữ làm tuỳ chọn phụ, chuyển qua lại bằng 2 nút liên kết.
  - Thêm `step.doneByPeople[]` — bước chỉ tự chuyển **Xong** khi **mọi người trong `assignees` đã tự ghi Hoàn thành phần mình** (`markStepDoneByPeople()`, `stepDoneInfo()`), khắc phục lỗ hổng cũ: trước đây 1 chip trạng thái chung đủ để tick Xong cả bước dù có người "Chưa đạt"/"Vắng". Bước cũ (`done=true`, chưa có `doneByPeople`) giữ nguyên coi là đã xong — không đòi ghi lại.
  - Hiển thị tiến độ theo người ngay trên bước: **"x/y người đã xong"** + tên (`stepPeopleProgressHtml()`, dùng chung cho bước phẳng và bước trong giai đoạn).
  - Timeline Chi tiết việc nay chú thích **log thuộc bước/giai đoạn nào** (`findStepWithPhase()` + dòng `.tl-step`) — trước đây log gắn `stepId` nhưng không có màn nào tra lại tên bước.
  - **Đã verify bằng Chrome thật (Playwright)**: seed 1 bước 2 người, mock backend qua route interception — xác nhận chip "Tôi là ai" đúng người, ghi từng người cộng dồn đúng `doneByPeople`, bước/việc chỉ chuyển Hoàn thành khi đủ người, dòng tiến độ và timeline hiển thị đúng, 0 lỗi console. Chi tiết xem [`docs/ROADMAP_LamMoi_TrangQuanLyCongViec.md`](docs/ROADMAP_LamMoi_TrangQuanLyCongViec.md) §7.
- **Hoàn thiện backend cột "Tên thường gọi"** (nối tiếp v2.12.6, trước đó phần `.gs` chưa được ghi nhận): `handleGetStaff` (`07_Analytics.gs`) nay trả thêm `shortName`/`commonName`; thêm action **`populateShortNames`** (GET/POST, `02_Router.gs` → `11_Setup.gs`) để tự tra cứu/điền "Tên thường gọi" hàng loạt cho sheet `Users` (ưu tiên giá trị đã có, xử lý trùng tên bằng cách thêm chữ đệm viết tắt).

## [v2.12.9] - 2026-07-22
### Cập nhật (Updated)
- **Màn Ghi nhật ký — dựng lại đúng ngôn ngữ "gọn nhẹ" của A/B/C (`nhatky/index.html`)**: gộp toàn bộ form vào 1 `.d-sheet` (giống Chi tiết việc), chia 3 mục kẻ mảnh thay cho dải `.field` rời rạc + 1 khối `<details>` duy nhất trước đây: **① Việc đang ghi** (context/tổ), **② Trạng thái &amp; kết quả** (chip tiến độ, ô đo lường, kết quả nhanh), **Người tham gia** (hiện khi việc có nhiều người). Mục **Chi tiết thêm** (ngày/ca/giờ/tồn/làm tiếp/ảnh) giữ nguyên dạng gấp gọn `<details>`, không đánh số — cùng cách Chi tiết việc bỏ số cho khối hành động phụ. Giữ nguyên mọi control chạm to (chip trạng thái, ô đo lường +/-, chip kết quả nhanh) vì đó là thiết kế cố ý cho thao tác ngoài hiện trường, không thuộc phần cần gọn — chỉ đổi lớp bố cục/ngăn cách, không đổi logic (mọi id/hàm xử lý giữ nguyên).
- **Chưa verify bằng Chrome thật (Playwright)** như các màn trước — phiên này không có sẵn `chromium-cli`/Playwright. Đã tự kiểm: toàn bộ id không trùng/không mất, cú pháp JS qua `node --check` không lỗi, và vá 1 lỗi CSS tự phát hiện (5 input ẩn đứng trước mục ① khiến selector `.d-sec:first-child` không khớp, thừa 1 đường kẻ ở mép trên sheet — đã chuyển input ẩn vào trong mục ①). **Cần người dùng mở thử trên điện thoại/trình duyệt thật để xác nhận trước khi coi là xong.**

## [v2.12.8] - 2026-07-22
### Cập nhật (Updated)
- **Chi tiết việc (B): bỏ banner cảnh báo vàng "Việc tồn — quá hạn xem lại"** ở đầu màn (`nhatky/index.html`) — đúng mockup không có banner; thông tin hạn xem lại vẫn còn ở dòng "Khi nào" của mục ①. Giữ banner đỏ "Cần xử lý ngay" cho việc gấp.

## [v2.12.7] - 2026-07-22
### Cập nhật (Updated)
- **Chi tiết việc (B) — dựng lại đúng mockup, bỏ hẳn bố cục cũ (`nhatky/index.html`)**:
  - **Bỏ mục "Ai làm" cũ** (ô select Bootstrap to + nút "Lưu phân công") → gộp thành dòng **"Người làm"** gọn ngay trong mục ①: chip người (★ chủ trì) + 1 ô "＋ Gán người", **đổi là tự lưu nền** (không cần bấm Lưu).
  - **Giai đoạn dạng accordion đúng mockup**: mỗi giai đoạn là 1 dòng gọn (chấm trạng thái + tên + tóm tắt người "★chủ trì ○phối hợp" hoặc "đã xong" + đếm bước + mũi tên); **chỉ giai đoạn đang chạy mở sẵn các bước**, giai đoạn khác thu gọn — chạm để mở/đóng. Thêm bước / đổi tên / xoá giai đoạn nằm gọn dưới khi mở.
  - Mục ① đổi nhãn theo ngữ cảnh: **"Chỉ đạo & tiêu chí"** khi việc có chỉ đạo, **"Việc & người làm"** khi không.
  - Còn 3 mục đánh số ①②③ + hàng nút **Bàn giao / Nghiệm thu·Chốt sổ** đúng mockup. Verify Chrome thật (Playwright) cả việc có giai đoạn lẫn việc bước phẳng, 0 lỗi.

## [v2.12.6] - 2026-07-22
### Thêm mới (Added)
- **Cột Tên thường gọi (`shortName` / `commonName`)**: bổ sung cột "Tên thường gọi" vào schema sheet `Users`, API quản lý tài khoản (`17_UserAdmin.gs`) và xác thực đăng nhập (`03_Auth.gs`, `15_NhatKyAuth.gs`).
- **Hiển thị Dashboard ngắn gọn (`nhatky/index.html`)**: bổ sung hàm `getShortName(fullName)` tự động ưu tiên tên thường gọi từ danh bạ/tài khoản (vd: "Chiến", "Cường", "Dũng", "Huy pb", "Huy đh") hoặc quy đổi tên dài tiếng Việt thành dạng rút gọn ("Nguyễn Quốc Thắng" → "Thắng NQ", "Đinh Văn Hậu" → "Hậu DV"). Áp dụng trực tiếp lên dòng công việc Dashboard, badge nhân sự và danh sách gán bước.

## [v2.12.5] - 2026-07-22
### Cập nhật (Updated)
- **Chi tiết việc — nút hành động đúng mockup (`nhatky/index.html`)**:
  - Mục **④ Nhật ký & phát sinh** thêm nút **＋ Ghi nhật ký** (nổi) ngay trong mục, cạnh "Xem tất cả" — không phải kéo xuống thanh dưới.
  - **Bỏ thanh "Ghi nhật ký cho việc này" cố định dưới cùng**; hàng nút dưới còn đúng 2 nút như mockup: **⇄ Bàn giao** (viền) + **✓ Nghiệm thu · Chốt sổ** (nền xanh). Nút Nghiệm thu luôn hiện (bấm khi việc chưa Hoàn thành sẽ nhắc), khi đã chốt thì hiện trạng thái "Đã chốt sổ" mờ. Nút **Xác nhận nhận việc** (khi việc từ chỉ đạo) tách thành 1 hàng riêng phía trên.

## [v2.12.4] - 2026-07-22
### Cập nhật (Updated)
- **Rà tiếp 3 màn cốt lõi cho sát mockup "gọn nhẹ" (`nhatky/index.html`)** — nối tiếp v2.12.3:
  - **Trang chủ (A)**: thanh công cụ rút còn đúng như mockup — **1 ô tìm kiếm lớn + 1 nút chọn ngày gọn trên cùng 1 dòng**; bỏ nút chuyển ngày ‹ › và nút "về hôm nay" (chọn ngày trực tiếp trong ô ngày).
  - **Chi tiết việc (B)**: **bỏ hẳn bố cục cũ, dựng lại theo mockup** — các mục phẳng đánh số trong 1 sheet: **① Việc & chỉ đạo** (gộp việc/nơi/giờ/người giao/tiêu chí/khối lượng thành các dòng kv + trích dẫn chỉ đạo) · **② Ai làm** · **③ Giai đoạn & bước** · **④ Nhật ký & phát sinh** — thêm **dòng thời gian nhật ký ngay trong màn** (gộp cả mốc bàn giao, có ảnh, đề xuất, tồn tại), thay cho việc phải mở màn nhật ký riêng. Hàng nút **Nhận việc / Bàn giao / Nghiệm thu·Chốt sổ** kiểu `.d-actions`; nút "Ghi nhật ký cho việc này" vẫn giữ ở thanh dưới cố định (thao tác chính hằng ngày).
  - Chỉ đổi lớp trình bày, không đổi logic nghiệp vụ; verify Chrome thật (Playwright) cả Trang chủ + Chi tiết (việc có giai đoạn & nhật ký), 0 lỗi.

## [v2.12.0] - 2026-07-21
### Thêm mới (Added)
- **Vòng đời công việc & Bảng "Hôm nay" (`nhatky/index.html`)**: màn Việc của tôi nhóm theo Cần xử lý tiếp → Đang thực hiện → Chờ nghiệm thu → Kế hoạch trong ngày → Lịch sắp tới 7 ngày → Đã hoàn thành/Chốt sổ, thay vì nhóm theo người. Badge vòng đời (Tiếp nhận/Đã lên KH/Đang làm/Cần hỗ trợ/Bàn giao/Chờ nghiệm thu/Xong kỹ thuật/Đã chốt sổ/Đã hủy) suy ra được từ dữ liệu cũ, không cần migrate.
- **Phối hợp nhiều người theo vai trò**: `people[]` (chủ trì ★ / phối hợp ○ / nghiệm thu 👁) tách từ `assignee` cũ, hiển thị badge trên thẻ việc.
- **Avatar tài khoản** ở góc phải thanh tiêu đề → hồ sơ tài khoản (tên, tổ/ca) + phóng to cỡ chữ A/A+/A++ + đăng xuất.
- **Giai đoạn 2 tầng (`phases[]`)**: việc có thể "nâng cấp" từ bước phẳng lên giai đoạn (Khảo sát/Vật tư/Thi công/Nghiệm thu hoặc tự đặt tên) — mỗi giai đoạn có bước con riêng (thêm/sửa/xoá, tick xong), không khoá cứng thứ tự. Chạy song song bước cũ, không phá dữ liệu kế hoạch đã có.
- **Gán người theo tag**: chọn người thực hiện cho bước lọc theo cùng tổ/nhãn với việc, không đổ toàn bộ danh bạ.
- **Đính ảnh** ở chỉ đạo/kế hoạch, phát sinh, từng bước, nhật ký, và bàn giao — chụp/chọn ảnh, resize còn ≤900px, upload Google Drive, xem lại thumbnail ngay trên màn.
- **Bàn giao ca**: bàn giao việc cho 1 người hoặc cho ca/tổ, ghi "đã làm được / cần xử lý tiếp / lưu ý an toàn" + ảnh hiện trạng; người/ca sau bấm "Nhận bàn giao" để tiếp tục, tự động ghi người và giờ (không cần ký giấy).
- **Nghiệm thu · Chốt sổ**: tách rõ "Xong kỹ thuật" và "Đã chốt sổ" — bất kỳ ai cũng xác nhận chốt sổ được, phần mềm tự ghi người/giờ vào nhật ký.
- **Truy vết chỉ đạo**: thêm trường "Người giao" và "Tiêu chí hoàn thành" khi việc đến từ chỉ đạo cấp trên, kèm nút "Xác nhận nhận việc".
- **Kanban nhóm theo vòng đời**: thêm 2 cột "Bàn giao / Xử lý tiếp" và "Chờ nghiệm thu" xen giữa Đang làm và Hoàn thành.
- Backend: thêm cột `Phases`, `Photos`, `Handover`, `AssignedBy`, `DoneCriteria` vào sheet `NhatKyPlans`, cột `Photos` vào `WorkLogs`, action mới `uploadPhoto` — theo đúng cách bổ sung cột đã dùng từ trước (không đổi/xoá cột cũ).

### Sửa lỗi (Fixed)
- **`savePlan` không thực sự lưu xuống Google Sheets**: frontend gửi dữ liệu kế hoạch phẳng ở top-level nhưng backend chỉ đọc trường lồng `payload`, luôn nhận rỗng và luôn báo lỗi thiếu ngày/việc ở phía server; do frontend không kiểm tra kết quả trả về nên vẫn hiển thị "đã đồng bộ". `handleSavePlan` nay chấp nhận cả 2 dạng payload. **Cần đối chiếu dữ liệu `NhatKyPlans`** — các việc tạo/sửa trước bản vá này có thể chưa từng lưu xuống Sheets thật.
- **Trạng thái "Bàn giao"/"Tiếp nhận" bị kẹt vĩnh viễn**: việc từng được bàn giao 1 lần, hoặc có người giao chỉ đạo, sẽ mãi hiển thị "Bàn giao"/"Tiếp nhận" dù đã nhận lại/đã xác nhận — nay chỉ tính là đang chờ khi thực sự chưa có ai nhận/xác nhận.
- **Màn Chi tiết việc (và thực chất là mọi màn hình) trắng trơn, treo trình duyệt** — phát hiện sau khi deploy qua kiểm thử Chrome thật: `renderPeopleScreen()` gọi nhầm `shiftFilterDate(7)` (hàm vốn dùng cho nút chuyển ngày, có side-effect tự render lại chính màn đó) để tính "7 ngày sau", tạo vòng lặp gọi lẫn nhau tới tràn stack (`Maximum call stack size exceeded`) mỗi lần `render()` chạy. Đã thay bằng phép cộng ngày thuần, không còn side-effect.
- **Chữ "+ Gán người (Tổ...)" trong picker gán người ở bước tràn/đè lên mũi tên dropdown** khi tên tổ dài — rút gọn còn "+ Gán người", tên tổ chuyển sang tooltip (`title`).

## [v2.12.3] - 2026-07-22
### Cập nhật (Updated)
- **Rà 3 màn cốt lõi cho khớp mockup "gọn nhẹ" (`nhatky/index.html`)** — nối tiếp v2.12.2:
  - **Trang chủ (A)**: bỏ hẳn menu ⋮ và các nút phụ (Kanban, Bộ lọc nâng cao, Lịch tuần, Nạp lại, Thêm kế hoạch) — không có trong mockup; gộp **ô tìm kiếm + chọn ngày + về-hôm-nay trên cùng 1 dòng** đúng mockup.
  - **Chi tiết việc (B)**: phần **Giai đoạn & bước** đổi từ thẻ Bootstrap nặng (hộp màu, viền dày, checkbox tròn 36px) sang **dòng phẳng kẻ mảnh** — giai đoạn là chấm nhỏ 20px + tên + đếm, ngăn nhau bằng kẻ đứt; bước thụt lề dưới chấm, ô tick vuông 22px, pill gán người, nút thao tác không viền. Giữ nguyên mọi chức năng (thêm/sửa/xoá giai đoạn & bước, gán người theo tag, đính ảnh, tick xong).
  - **Bàn giao (C)**: modal vốn đã sát mockup; thêm ô nền nhạt cho dòng "Phần mềm tự ghi… — thay chữ ký" đúng khối `.autolog`.
  - Chỉ đổi lớp trình bày (CSS + rút gọn DOM/handler đã xoá), không đổi logic nghiệp vụ; verify Chrome thật (Playwright) cả 3 màn, 0 lỗi.

## [v2.12.2] - 2026-07-22
### Cập nhật (Updated)
- **Dọn phần đầu Trang chủ cho đúng mockup "gọn nhẹ" (`nhatky/index.html`)** — sau v2.12.1 phần danh sách đã phẳng nhưng khu điều khiển phía trên vẫn thừa so với 3 màn cốt lõi của mockup:
  - **Gộp thanh công cụ**: chỉ còn 1 ô tìm kiếm rộng + 1 hàng chọn ngày (‹ ngày › về-hôm-nay) + nút ⋮ — thay cho 3 hàng cũ (ngày+Việc mới, tìm kiếm, và dải chip lọc).
  - **Bỏ dải chip lọc** "Tất cả / Chưa xong / Cần hỗ trợ / Việc của tôi" — việc đã nhóm sẵn theo vòng đời nên không cần lọc thủ công; các chức năng phụ (Kanban, Bộ lọc nâng cao, Lịch tuần, Nạp lại, Thêm kế hoạch) dồn vào menu ⋮.
  - **Bỏ hộp "Tiến độ nhật ký hôm nay"** (`day-log-summary` / `vikunja-day-progress`) — không có trong mockup.
  - **Nút dưới đáy đổi từ "Ghi nhanh" → "＋ Việc mới"** đúng mockup (ghi nhật ký nay làm trong màn Chi tiết việc).
  - Không đổi logic nghiệp vụ — chỉ dọn lớp trình bày; đã verify bằng Chrome thật (Playwright), 0 lỗi.

## [v2.12.1] - 2026-07-21
### Cập nhật (Updated)
- **Trang chủ & Chi tiết việc đổi sang giao diện "gọn nhẹ"** đúng mockup đã duyệt (thay style thẻ Bootstrap nhiều viền/badge của bản v2.12.0):
  - **Trang chủ**: mỗi việc là 1 dòng phẳng (chấm màu theo vòng đời + tên việc + dòng phụ gọn: người ★/○, tiến độ "GĐ x/y", gợi ý ngắn nếu cần chú ý) thay cho thẻ card riêng có badge/viền/nút — nhóm theo mục vẫn giữ (Cần xử lý tiếp/Đang làm/Chờ nghiệm thu/Kế hoạch trong ngày/Lịch sắp tới/Đã hoàn thành).
  - **Chi tiết việc**: gộp toàn bộ mục (Việc gì, Ở đâu, Khi nào, Ai làm, Giai đoạn & bước, Khối lượng, Nguồn, Bàn giao/Nghiệm thu) vào **1 sheet liền**, ngăn cách bằng đường kẻ mảnh thay vì mỗi mục 1 hộp riêng có viền/bóng đổ.
  - Không đổi logic nghiệp vụ (giai đoạn, ảnh, bàn giao, chốt sổ) — chỉ đổi lớp trình bày.

## [v2.11.0] - 2026-07-16
### Thêm mới (Added)
- **PWA — cài ứng dụng ra màn hình chính, dùng được khi sóng yếu ngoài sân golf**: thêm `manifest.json`, `sw.js` (Service Worker) và `js/pwa.js`, áp dụng cho 8 trang tác nghiệp (`index.html`, `pump_info.html`, `meter.html`, `sangolf/`, `phanca/`, `hengio/`, `phongvan/`, `nhatky/`).
  - Chiến lược cache: API GAS (`script.google.com`) không bao giờ cache — dữ liệu vận hành luôn phải mới nhất; trang & tài nguyên cùng gốc (HTML, `css/`, `js/`) dùng network-first (ưu tiên bản mới, rơi về cache khi mất mạng); thư viện CDN (Bootstrap, icon, font — URL đã ghim version) dùng cache-first.
  - Menu tiện ích (`js/bottomnav.js`) thêm mục "Cài đặt ứng dụng" gọi prompt cài đặt native của trình duyệt; tự động hướng dẫn thao tác tay cho trình duyệt không hỗ trợ (Safari iOS).
  - Icon ứng dụng mới (`icons/`, `favicon.ico`) theo màu thương hiệu hiện có (#059669).
  - Không đổi giao diện/thương hiệu riêng của `nhatky/index.html` (theme xanh dương #0e6efd, icon "BD" sẵn có) — chỉ bổ sung khả năng cài đặt/offline.

## [v2.10.1] - 2026-07-16
### Sửa lỗi (Fixed)
- **`meter.html` viết lại toàn bộ** — trước đây gửi kiểu `no-cors` "bắn rồi quên": luôn báo thành công kể cả khi mất mạng/backend lỗi, không có hàng đợi offline, danh mục 22 đồng hồ hardcode trong file, trỏ vào deployment GAS cũ.
  - Chuyển sang `js/config.js` + `js/api.js` dùng chung (retry tự động, phát hiện cold-start).
  - Đọc danh mục đồng hồ từ API `getMeterPoints` (cache localStorage, chọn qua dropdown nhóm Điện/Nước hoặc nhập tay UID) thay vì hardcode.
  - Hàng đợi offline giống `pump_info.html`: mỗi lượt chốt chỉ số lưu localStorage trước, đồng bộ ngầm khi có mạng, có badge trạng thái Đang gửi/Chờ gửi/Đã đồng bộ.
  - Thêm lịch sử chốt chỉ số gần đây (API `getMeterHistory`) và bottom-nav.
- **`checkbom/` chuyển thành trang chuyển hướng** sang `pump_info.html` (giữ nguyên `pumpId`/`id` trên URL) — tránh 2 giao diện cùng ghi 1 loại dữ liệu sau khi đã gộp chức năng từ v2.9.0.

### Cập nhật (Updated)
- **Tên người thực hiện dùng 1 nguồn duy nhất**: thêm `BD_SSO.getOperatorName()`/`setOperatorName()` vào `js/sso.js` (ưu tiên tài khoản đăng nhập → PIN nhatky → tên gõ tay), áp dụng cho `pump_info.html`, `meter.html`, `sangolf/`. Trước đây mỗi trang tự đọc key khác nhau nên cùng 1 người có thể ra nhiều tên khác nhau trong dữ liệu.
- **`phanca/` chuyển sang `js/api.js` dùng chung** thay vì tự viết `fetch` trần — có retry + phát hiện cold-start khi GAS khởi động chậm sáng sớm.
- **Gộp nút phóng to chữ (A/A+/A++) vào `js/fontscale.js` dùng chung**, áp dụng cho `index.html`, `pump_info.html`, `meter.html`, `phanca/`, `hengio/`, thêm mới cho `sangolf/`. Phát hiện `phanca/` và `hengio/` trước đó dùng key localStorage riêng (`bandien_phanca_fontscale`, `bandien_hengio_fontscale`) không đồng bộ với phần còn lại của app — nay dùng chung 1 key.
- **Hiện số phiên bản ở menu mọi trang vệ tinh** (`js/bottomnav.js`) — trước đây chỉ `index.html` biết đang chạy bản nào.
- Thêm link **Checklist Cơ Điện Sân Golf** vào menu chính `index.html` (trước đó chỉ có trong menu các trang vệ tinh).

## [v2.10.0] - 2026-07-16
### Thêm mới (Added)
- **Checklist Cơ Điện Sân Golf (`sangolf/index.html` + `19_GolfChecklist.gs`):** số hóa sổ vận hành giấy `ChecklistCoDienSanGolf.xlsx` cho Tổ Cơ Điện Sân Golf Kỳ Sơn Montana.
  - 4 mẫu checklist: Ca Sáng (18 mục), Ca Tối (16 mục), Kiểm Tra Tuần — thứ Hai (14 mục), Kiểm Tra Tháng — ngày 1 (22 mục); tổng 70 hạng mục seed tự động vào sheet `GolfChecklistTemplates` (sửa mẫu chỉ cần sửa sheet, không cần deploy lại).
  - 6 kiểu nhập liệu: Đạt/Không đạt/Bỏ qua, số đo (cách tràn cm, nhiệt độ ℃, Volt, pH, kWh...), giờ bật, cặp giờ bật/tắt, văn bản, nhóm nhiều trường con (5 hồ, 3 bơm 160kW, 3 suối trang trí).
  - Cảnh báo vượt ngưỡng ngay khi gõ số (gia nhiệt <45℃, nối đất >4Ω, pH ngoài 6,5–7,5...) — ô nhập tô đỏ.
  - Autosave local-first: mỗi thao tác lưu localStorage tức thì, đồng bộ ngầm lên sheet `GolfChecklistRuns` (1 lượt/mẫu/ngày, không tạo trùng); mất mạng không mất dữ liệu.
  - Quy trình bàn giao ca: chốt ca (kèm nội dung bàn giao + gửi cảnh báo Telegram) → ca sau thấy banner và bấm xác nhận nhận bàn giao; lượt đã xác nhận bị khóa không sửa được.
  - API mới: `getGolfTemplates`, `getGolfRuns` (GET) · `saveGolfRun`, `submitGolfRun`, `confirmGolfHandover`, `seedGolfTemplates` (POST).

## [v2.9.0] - 2026-07-15
### Thêm mới (Added)
- **Trang Thông tin & Check vận hành bơm (`pump_info.html`):**
  - Quét QR / nhập mã bơm → hiển thị thông tin bơm, trạng thái chạy/dừng, nút Bật/Tắt, tờ check vận hành (TẮT/TỰ ĐỘNG/BẰNG TAY + cấu hình giờ hẹn Ca 1/Ca 2) và nhật ký gần đây — gộp toàn bộ chức năng của trang `checkbom/` vào một nơi.
  - Hàng đợi đồng bộ offline dùng chung với checkbom, tự gửi lại khi có mạng; tôn trọng chế độ chỉ giám sát (`monitorOnly`).
  - Tem QR in từ `print_pumps.html` giờ trỏ thẳng tới trang này; module quét chính ở trang chủ tự nhận diện tem bơm và điều hướng đúng.
- **Trang Nhật ký Thay đổi (`changelog.html`):** hiển thị nội dung `CHANGELOG.md` dạng timeline phiên bản ngay trên web (khắc phục link menu bị 404).
- **Phản hồi rung (Haptic feedback):** rung xác nhận khi hoàn tất kiểm tra, lưu thiết bị, tạo/sửa WO (rung 3 nhịp khi chuyển WO sang Done/Closed) và gửi báo cáo check bơm.

### Cập nhật (Updated)
- **Menu & điều hướng đồng nhất:** bỏ 2 nút menu/tài khoản trùng lặp ở header trang chủ; gom các mục cấu hình vào khối "Dành cho Quản trị" (ẩn với nhân viên thường); thêm nhánh "Quản lý máy bơm".
- **Form dài chuyển sang Wizard 3 bước:** Thêm/Sửa thiết bị và Tạo/Sửa Work Order chia bước Cơ bản → Bảo trì/Giao việc → Phân công/Thời hạn, đỡ cuộn dài trên điện thoại.
- **Độ tương phản chữ cao cho ngoài trời:** chữ chính đen tuyệt đối, chữ phụ đậm hơn (từ ~4.7:1 lên ~9.7:1 trên nền trắng) áp dụng toàn app.
- **Hiệu năng:** Dashboard, Kanban và 3 modal quản trị (Dự án/Ca trực/Địa điểm) tách ra `fragments/` và chỉ nạp khi mở lần đầu, giảm DOM ban đầu của `index.html`.

### Sửa lỗi (Fixed)
- Menu tiện ích bị nền trong suốt trên trang Nhật ký (thiếu biến CSS `--siu-*` dùng chung).
- Khung quét camera hiển thị chồng 2 lớp (ô vuông đen của thư viện + vòng tròn tùy chỉnh) — gộp về một khung vuông bo góc duy nhất, vùng giải mã tự co theo màn hình.
- Ô "Người vận hành" tự điền theo tài khoản đăng nhập thay vì phải gõ lại.
- Thống nhất số phiên bản về một nguồn (`CONFIG.version`), trước đó lệch nhau giữa màn đăng nhập, menu, `js/config.js` và CHANGELOG.

---

## [v2.8.0] - 2026-07-03
### Thêm mới (Added)
- **Module Giám sát Server Uptime (`status.html`):**
  - Công cụ giám sát thời gian phản hồi (latency) và trạng thái kết nối mạng của các server nội bộ và internet (Ví dụ: `chieusang.montanagc.com.vn:8383`).
  - Tích hợp bộ tính năng quản lý Thêm mới, Chỉnh sửa thông tin (Edit) và Xóa bỏ (Delete) các máy chủ cần giám sát ngay từ giao diện người dùng. Lưu cấu hình cục bộ (`localStorage`).
  - Ghi nhật ký lịch sử Uptime (Log History) tối đa 100 dòng kiểm tra gần nhất.
- **Liên kết điều hướng hai chiều:**
  - Tích hợp liên kết **Giám sát Server Uptime** vào Menu chính của trang chủ `index.html`.
  - Bổ sung nút bấm **Trang chủ** trên thanh tiêu đề của `status.html` để quay lại dễ dàng.
- **Trang phụ trợ chốt chỉ số 1-Touch công cộng (`meter.html`):**
  - WebApp di động độc lập giúp nhân viên vận hành chốt nhanh số điện, nước qua 4G ngoài hiện trường mà không bị chặn mạng/VPN.
  - Hỗ trợ nhập thời gian thao tác tùy chỉnh phục vụ kịch bản chốt chỉ số bù.
- **Trang in tem mã QR hàng loạt (`print_meters.html`):**
  - Tạo trang xuất bản và in nhãn dán QR hàng loạt cho 22 đồng hồ điện & nước.

### Cập nhật (Updated)
- **Kiến trúc & Sơ đồ Hệ thống (`architecture.html` & `ui_architecture.md`):**
  - Cập nhật sơ đồ Mermaid biểu diễn luồng dữ liệu (Data Flow) và bảng từ điển Mapping ánh xạ mã nguồn cho các trang vệ tinh phụ trợ mới.

---

## [v2.6.0] - 2026-05-30
### Thêm mới (Added)
- **Module Quản lý Địa điểm lắp đặt (Location CRUD Management):**
  - Bổ sung nút bánh răng cài đặt ⚙️ bên cạnh dropdown chọn địa điểm lắp đặt tại modal Lắp đặt thiết bị (`#installLocationModal`), giúp quản trị viên thêm mới, sửa đổi hoặc xóa các địa điểm lắp đặt.
  - Tích hợp thêm tùy chọn "Quản lý Địa điểm" vào Menu chính cho tài khoản vai trò Admin/Manager.
  - Tích hợp CRUD với cơ sở dữ liệu: Tạo địa điểm tự động sinh UID tiền tố `LOC-YYYYMM-NNN`, lưu trực tiếp vào danh sách thiết bị đặc biệt của hệ thống.
  - Tự động đồng bộ thông tin: Đổi tên địa điểm sẽ đồng bộ đổi tên Vị trí (Location - Cột C) của toàn bộ thiết bị liên đới trên Google Sheets. Xóa địa điểm sẽ tự động trả các thiết bị liên quan về vị trí mặc định (`Chưa phân công`).

---

## [v2.5.0] - 2026-05-29
### Thêm mới (Added)
- **Module Quản lý Ca trực (Shift CRUD Management):**
  - Bổ sung nút cài đặt hình bánh răng ⚙️ bên cạnh dropdown chọn Ca trực (trong modal Thêm, Sửa thiết bị và biểu mẫu Tạo hàng loạt) giúp mở nhanh bảng Quản lý Ca trực.
  - Tích hợp thêm tùy chọn "Quản lý Ca trực" vào Menu chính dành cho tài khoản Admin và Manager.
  - Hỗ trợ đầy đủ các thao tác Thêm mới, Chỉnh sửa thông tin ca (tên ca, giờ làm việc/mô tả, trạng thái) và Xóa ca trực.
  - Tự động hóa quá trình di chuyển (migration): Khi chạy `setupHeaders` lần đầu, backend tự động phát hiện và trích xuất các ca trực cũ từ cột Ca trực (cột H) trong sheet Devices để đưa vào sheet Shifts mới.
  - Tự động đồng bộ: Đổi tên ca trực sẽ tự động cập nhật lại thông tin ca trực cho toàn bộ các thiết bị liên quan trên Google Sheets. Xóa ca trực sẽ tự động đưa các thiết bị liên kết thuộc ca đó về trạng thái "Chưa phân công".

---

## [v2.4.2] - 2026-05-29
### Sửa lỗi (Fixed)
- **Tự động khởi tạo cấu trúc Projects & AuditLog trong Backend.gs:**
  - Khắc phục triệt để lỗi `Project sheet not found` khi khởi chạy hệ thống quản lý dự án lần đầu tiên trên Google Sheet trống.
  - Cải tiến hàm cấu hình `setupHeaders` để tự động kiểm tra và khởi tạo sheet `Projects` (với các cột `ProjectID`, `Name`, `Status`, `StartDate`, `EndDate`) cùng sheet `AuditLog` (với các cột `Timestamp`, `User`, `Action`, `Target`, `Details`) nếu chưa tồn tại.
  - Cập nhật hàm kiểm tra `testAuthorization` để bao quát kiểm tra sức khỏe cả sheet `Projects` mới.

---

## [v2.4.1] - 2026-05-29
### Thêm mới (Added)
- **Áp dụng gợi ý điền mẫu & chuẩn hóa mã theo chuẩn M&E:**
  - Bổ sung thanh Gợi ý Đặt mã & Tên (Chuẩn M&E) hiển thị động các nút mẫu nhanh (Bơm nước sạch BNS, Bơm nước thải BNT, Tủ tổng MSB, Tủ phân phối DB, ATS, v.v...) dựa theo Loại thiết bị được chọn trong Trình tạo hàng loạt.
  - Tự động điền các trường: Tiền tố (Prefix), Hậu tố (Suffix), Độ dài số đệm (Padding), Tên mẫu, Thông số mẫu, và định vị Vị trí mẫu tương ứng khi nhấp chọn mẫu.
  - Tích hợp hàm tự động định dạng mã UID sang viết hoa toàn bộ (UPPERCASE), loại bỏ dấu tiếng Việt, thay thế khoảng trắng thành dấu gạch ngang (`-`), gỡ bỏ ký tự đặc biệt không hợp lệ trong thời gian thực khi người dùng gõ mã UID (ở form đơn) hoặc tiền/hậu tố (ở form tạo hàng loạt).

---

## [v2.4.0] - 2026-05-29
### Thêm mới (Added)
- **Module Quản lý Dự án (Project Management CRUD):**
  - Tích hợp thêm nút cài đặt hình bánh răng ⚙️ bên cạnh tất cả các dropdown chọn Dự án (ở form Thêm, Sửa và Tạo thiết bị hàng loạt) để mở nhanh bảng Quản lý Dự án.
  - Hỗ trợ xem danh sách dự án dưới dạng bảng biểu trực quan, thêm mới dự án, chỉnh sửa thông tin hoặc xóa bỏ dự án.
  - Khi sửa tên một dự án, hệ thống tự động cập nhật lại tên dự án mới cho toàn bộ thiết bị đang liên kết với dự án đó trên Google Sheets.
  - Khi xóa một dự án, toàn bộ thiết bị liên kết với dự án đó sẽ tự động được gỡ liên kết dự án.
  - Tích hợp thêm nút "Quản lý Dự án" vào Menu chính dành riêng cho vai trò Admin và Manager.

---

## [v2.3.1] - 2026-05-29
### Thêm mới (Added)
- **Hỗ trợ trường thông tin Số Seri (Serial Number) cho thiết bị:**
  - Bổ sung cột `Serial Number` (Cột N) vào bảng tính **Devices** trên Google Sheets.
  - Cập nhật biểu mẫu **Thêm thiết bị** và **Sửa thiết bị** để kỹ thuật viên nhập/cập nhật Số Seri hãng sản xuất của thiết bị.
  - Hiển thị Số Seri gốc trong mục thông tin chi tiết thiết bị (Asset Profile) phục vụ cho bảo hành và thay thế thiết bị.
  - Tích hợp trường Số Seri hãng vào tệp kết xuất CSV dành cho **máy in nhãn Brother**.
  - Bổ sung cơ chế **Smart Fallback**: Khi quét nhầm mã vạch/QR Số Seri hãng thay vì nhãn UID hệ thống, ứng dụng sẽ tự động đối chiếu để tìm ra thiết bị tương ứng và hiển thị đúng thông tin mà không báo lỗi.

---

## [v2.3.0] - 2026-05-29
### Thêm mới (Added)
- **Mô hình Phân cấp & Nhiều tổ quản lý cho Nhân sự (Hierarchical & Multi-team Filtering):**
  - Hỗ trợ cấu hình cột `Teams` (Cột D) trong sheet `Users` của Google Sheets dưới dạng danh sách phân tách bằng dấu phẩy (ví dụ: `Cơ Điện, Vận hành`).
  - Hệ thống tự động nạp danh sách `teams` của người dùng khi đăng nhập thành công.
  - Cải tiến bộ lọc danh sách thiết bị trên màn hình **Thiết bị của tôi** (`renderDeviceList`): Đối sánh động cột `Tổ quản lý` (`d.manager`) của thiết bị với bất kỳ tổ nào trong danh sách tổ của người dùng hiện tại thay vì lọc cứng.
  - Đồng bộ hóa logic bộ lọc phân cấp đa tổ này vào tính năng xuất tệp CSV cho Fluke LinkWare Live và máy in Brother PT-E560BT.

---

## [v2.2.3] - 2026-05-29
### Cải tiến (Improved)
- **Dropdown chọn thông minh kết hợp Thêm mới cho các trường nhập liệu:**
  - Chuyển đổi các trường nhập tự do **Vị trí lắp đặt**, **Tổ quản lý**, và **Ca trực** trong biểu mẫu Thêm mới & Chỉnh sửa thiết bị thành dạng danh sách lựa chọn (**Dropdown**).
  - Danh sách dropdown tự động thu thập các giá trị đã tồn tại trong database thiết bị và sắp xếp theo bảng chữ cái.
  - Hỗ trợ option đặc biệt `-- Thêm mới --` (`__NEW__`), khi người dùng lựa chọn sẽ hiển thị thêm ô nhập văn bản tự do ngay bên dưới để ghi nhận giá trị mới chưa từng có trong danh sách.

---

## [v2.2.2] - 2026-05-29
### Thêm mới (Added)
- **Phân quyền Chỉnh sửa Thiết bị (CRUD Security):**
  - Phân quyền hiển thị tính năng chỉnh sửa thông tin thiết bị: Nút "Chỉnh sửa" chỉ hiển thị với tài khoản **Admin** và **Manager**. Người dùng có vai trò **Operator** (nhân viên vận hành) thông thường không được phép chỉnh sửa thiết bị.
- **Dịch chuyển Thiết bị theo Mã địa điểm:**
  - Bổ sung tùy chọn dịch chuyển thiết bị "Lắp theo mã địa điểm" vào biểu mẫu lịch sử di chuyển (bên cạnh Nhập kho, Xuất kho) để cập nhật vị trí lắp đặt hiện tại trực tiếp từ danh sách địa điểm.

---

## [v2.2.1] - 2026-05-29
### Thêm mới (Added)
- **Nâng cấp quét mã vạch (Barcode Scanner Upgrade):**
  - Khắc phục lỗi camera không quét được barcode: Hỗ trợ đầy đủ các định dạng mã vạch tiêu chuẩn (`code_128`, `code_39`, `ean_13`, `ean_8`, `upc_a`, `upc_e`) song song với QR Code thông qua thư viện `html5-qrcode` nâng cấp và API native `BarcodeDetector` trên thiết bị di động.
- **Thêm thuộc tính Ngày sản xuất & Ngày lắp đặt:**
  - Bổ sung 2 cột thông tin tiếng Anh cho thiết bị: `Manufacture Date` (Ngày sản xuất) và `Installation Date` (Ngày lắp đặt) vào Google Sheet **Devices**.
  - Hiển thị đầy đủ thông tin Ngày sản xuất & Ngày lắp đặt trên giao diện thông tin chi tiết thiết bị (Asset Profile).
  - Tích hợp endpoint quản trị `setupHeaders` trên Apps Script Backend để tự động đồng bộ hóa và khởi tạo các cột tiêu đề mới trên Google Sheets.

---

## [v2.2.0] - 2026-05-29
### Thêm mới (Added)
- **Tích hợp in nhãn với Fluke LinkWare Live & Brother PT-E560BT:**
  - Bổ sung nút bấm xuất CSV trong mục **Thiết bị của tôi** trên giao diện Web App.
  - Hỗ trợ xuất dữ liệu theo đúng chuẩn **LinkWare Live (Fluke)**: File CSV cột đơn chứa UID và 1 dòng trống kết thúc để import trực tiếp vào dự án.
  - Hỗ trợ xuất dữ liệu đầy đủ thông tin thiết bị cho **máy in Brother**: File CSV đa cột gồm `UID`, `Tên`, `Vị trí`, `Thông số`, `Chu kỳ`, `Tổ quản lý`, `Ca trực` để import vào phần mềm **P-touch Editor** hoặc ứng dụng di động **Brother Pro Label Tool**.
  - Bổ sung tài liệu hướng dẫn quy trình in nhãn thực tế [walkthrough.md](./brain/fd7a048f-0667-4e49-8a7b-7dbe2b720eb1/walkthrough.md).
- Thêm chuỗi dịch thuật `i18n` tiếng Việt và tiếng Anh cho các tính năng xuất dữ liệu mới.

---

## [v2.1.0] - 2026-05-14
### Thêm mới (Added)
- **Hệ thống phân quyền người dùng (RBAC Login):** Đăng nhập bằng tên đăng nhập và mật khẩu (PIN). Phân quyền theo Tổ/Đội (Admin, Manager, Operator).
- **Kiến trúc Local-First (Offline-First):** Lưu trữ toàn bộ dữ liệu thiết bị tại `localStorage` giúp tăng tốc độ phản hồi (0.01s).
- **Smart Data Preloading:** Tự động tải dữ liệu tương ứng với quyền của tài khoản sau khi đăng nhập thành công.
- **Background Syncing:** Lưu trữ các báo cáo kiểm tra offline cục bộ khi mất mạng và tự động đồng bộ lên Google Sheets khi có kết nối internet trở lại.
- **Tính năng đổi mật khẩu:** Người dùng có thể đổi PIN trực tiếp trên giao diện.

---

## [v2.0.0] - 2026-04-30
### Thêm mới (Added)
- **Bảng Kanban Work Orders (WO):** Quản lý phiếu sửa chữa/bảo dưỡng di động theo 3 trạng thái kéo-thả (Todo → In Progress → Done).
- **PM Calendar (Lịch bảo trì):** Hiển thị danh sách thiết bị đến hạn bảo dưỡng định kỳ (trong vòng 7 ngày, quá hạn, đã lên lịch).
- **Dashboard số liệu (Chart.js):** Biểu đồ tròn trực quan hóa tỷ lệ trạng thái thiết bị trong kho (IN) và đang lắp đặt (OUT).
- **Thư viện checklist mẫu:** Cấu hình checklist kiểm tra động cho từng nhóm thiết bị (Điều hòa, Thang máy, Hệ thống điện).

---

## [v1.0.0] - 2026-04-15
### Thêm mới (Added)
- **Nền tảng cốt lõi (Core):**
  - Giao diện Web tĩnh tối ưu di động (Bootstrap 5, Glassmorphism).
  - Quét mã QR bằng Camera qua thư viện `html5-qrcode` trực tiếp trên trình duyệt di động hoặc nhập tay UID.
  - Kết nối GAS API gửi/nhận dữ liệu trực tiếp với Google Sheets (Database).
  - Bảo mật kết nối API bằng token (`HAPU_QR_SECRET_2026`).
  - Hỗ trợ đa ngôn ngữ VI/EN (lưu tùy chọn vào trình duyệt).
