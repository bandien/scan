---
title: Prompt Triển khai Hệ thống CMMS — Hapulico
aliases:
  - cmms prompt
  - prompt triển khai hệ thống cmms — hapulico
tags:
  - khac
  - cmms
  - scan-cmms
  - dang-thuc-hien
date: 2026-06-08
updated: 2026-06-08
---
# Prompt Triển khai Hệ thống CMMS — Hapulico

> **Mục đích:** File prompt tổng hợp để đưa cho AI coding agent (Claude Code, Cursor, v.v.) triển khai hệ thống CMMS doanh nghiệp cho công ty Hapulico — quản lý sân golf và khu phức hợp đa tòa nhà.
>
> **Cách dùng:** Có thể đưa toàn bộ file một lần, hoặc tách theo từng `## Phase` để chạy tuần tự (khuyến nghị cách thứ hai để chất lượng output cao hơn).

---

## TỔNG QUAN DỰ ÁN

Tôi cần xây dựng một hệ thống **CMMS (Computerized Maintenance Management System)** cho công ty **Hapulico** (Hà Nội Power Company) — quản lý công việc và bảo trì thiết bị cho một sân golf và khu phức hợp nhiều tòa nhà. Hệ thống cần đạt mức độ doanh nghiệp về tính năng nhưng vẫn dễ triển khai và chi phí vận hành thấp.

### Tech Stack

- **Frontend:** React + Vite + Tailwind CSS, deploy trên **GitHub Pages**
- **Backend:** **Cloudflare Workers** (REST API + business logic + cron jobs) với framework **Hono**, viết bằng **TypeScript**
- **Database:** **Supabase** (PostgreSQL + Auth + Realtime + Storage)
- **AI Service:** Cloudflare Worker riêng, gọi **Anthropic Claude API** (mặc định) hoặc **OpenAI** (fallback)
- **Tên miền:** GitHub Pages free domain hoặc custom domain
- **Ngôn ngữ giao diện:** Tiếng Việt (mặc định) + Tiếng Anh

---

## PHASE 1 — YÊU CẦU NGHIỆP VỤ

### 1.1. Quản lý thiết bị (Assets)

- Cây phân cấp: **Khu vực → Tòa nhà → Tầng → Phòng → Thiết bị**
- Mỗi thiết bị có: mã, tên, loại, nhà sản xuất, model, serial, ngày lắp đặt, ngày hết bảo hành, vị trí, trạng thái (hoạt động/hỏng/đang bảo trì), thông số kỹ thuật (JSONB)
- Hỗ trợ **QR code** cho mỗi thiết bị (kỹ thuật viên scan để xem lịch sử + tạo WO nhanh)
- Upload ảnh thiết bị (Supabase Storage)
- Lịch sử đầy đủ: mọi WO đã thực hiện, vật tư đã thay, người thực hiện

### 1.2. Quản lý công việc (Work Orders)

- **Loại:** bảo trì định kỳ (PM), sửa chữa khẩn (CM), kiểm tra (Inspection)
- **Mức độ ưu tiên:** thấp / trung bình / cao / khẩn cấp
- **Trạng thái:** mới tạo → được giao → đang thực hiện → hoàn thành → đóng
- **Trường dữ liệu:** tiêu đề, mô tả, thiết bị liên quan, người yêu cầu, người thực hiện, hạn xử lý, thời gian thực tế, vật tư đã dùng, ảnh trước/sau, ghi chú
- Tự động tạo WO từ lịch PM
- Kỹ thuật viên có thể cập nhật trạng thái từ điện thoại tại hiện trường

### 1.3. Lịch bảo trì định kỳ (Preventive Maintenance)

- Tần suất: hàng ngày / tuần / tháng / quý / năm / theo giờ chạy
- Tự động sinh WO trước hạn N ngày (cron job trên Cloudflare Workers chạy 00:00 hàng ngày)
- Checklist các bước thực hiện cho mỗi loại PM
- Lịch PM gắn với từng thiết bị hoặc nhóm thiết bị

### 1.4. Quản lý vật tư (Inventory)

- Kho linh kiện, mức tồn tối thiểu, cảnh báo khi sắp hết
- Lịch sử xuất/nhập kho gắn với work order
- Mã vật tư, đơn vị tính, vị trí trong kho, giá nhập

### 1.5. Phân quyền (Roles)

- **Admin:** toàn quyền
- **Manager:** xem tất cả, tạo/giao việc trong phòng ban mình
- **Technician:** chỉ thấy việc được giao, cập nhật trạng thái
- **Viewer:** chỉ xem báo cáo

Phân quyền implement qua **Row Level Security (RLS)** của Supabase.

### 1.6. Dashboard & Báo cáo

- **KPI:** MTBF (Mean Time Between Failures), MTTR (Mean Time To Repair), tỷ lệ hoàn thành PM đúng hạn, số việc tồn đọng, chi phí bảo trì theo tháng
- **Biểu đồ:** việc theo trạng thái, theo kỹ thuật viên, chi phí theo thiết bị, xu hướng hỏng hóc
- **Realtime:** thông báo khi có việc mới giao (Supabase Realtime)
- **Export Excel** cho báo cáo tuần/tháng (theo ngôn ngữ user đang chọn)

### 1.7. Quản lý điểm đo & tiêu thụ năng lượng (Metering)

- **Điểm đo (Meter Points):** quản lý các đồng hồ điện, đồng hồ nước phân bố theo cây phân cấp (khu vực → tòa nhà → tầng → phòng/thiết bị)
- Mỗi điểm đo có: mã, loại (điện/nước/khí/khác), đơn vị (kWh/m³/...), nhà cung cấp đồng hồ, hệ số nhân, ngưỡng cảnh báo (min/max), trạng thái
- **Ghi chỉ số (Readings):** kỹ thuật viên ghi chỉ số định kỳ (hàng ngày/tuần/tháng) qua app mobile, có thể chụp ảnh đồng hồ làm bằng chứng
- Tính toán tự động: sản lượng tiêu thụ kỳ này = chỉ số kỳ này − chỉ số kỳ trước × hệ số
- **Cảnh báo:** khi tiêu thụ vượt ngưỡng hoặc tăng đột biến so với cùng kỳ
- **So sánh:** giữa các điểm đo cùng loại, giữa các kỳ, theo phụ tải/diện tích/số người dùng
- **Báo cáo điện/nước:** tổng hợp tháng/quý/năm, biểu đồ xu hướng, bảng phân bổ chi phí theo khu vực
- Hỗ trợ nhập chỉ số từ file Excel (cho trường hợp đo bằng tay, sau nhập batch)
- API webhook nhận data từ smart meter (nếu có) trong tương lai

---

## PHASE 2 — YÊU CẦU KỸ THUẬT

### 2.1. Database (Supabase / PostgreSQL)

- Schema chuẩn 3NF, dùng **UUID** làm PK
- Index đầy đủ cho các trường hay query: `asset_id`, `status`, `assigned_to`, `due_date`, `created_at`
- **Audit trail:** bảng `work_orders_history` ghi mọi thay đổi
- **RLS policies** đầy đủ cho từng role
- **Soft delete** (`deleted_at`) thay vì xóa thật
- **Triggers:** tự cập nhật `updated_at`, tự sinh mã thiết bị/WO theo format (vd: `WO-2026-00001`, `EQ-GOLF-001`)
- **Multilingual columns:** trường mô tả/checklist dùng JSONB format `{"vi": "...", "en": "..."}`
- Bảng `users` có cột `preferred_language` (`vi` | `en`)

### 2.2. Backend (Cloudflare Workers + Hono)

- REST API với endpoints: `/api/assets`, `/api/work-orders`, `/api/pm-schedules`, `/api/inventory`, `/api/reports`, `/api/ai/*`
- **Authentication:** dùng Supabase JWT, validate ở Worker bằng middleware
- **Rate limiting** bằng Cloudflare KV (per-user, per-endpoint)
- **Cron Triggers:** chạy hàng ngày 00:00 để sinh PM work orders + gửi reminders
- **Webhooks:** nhận sự kiện từ Supabase (vd: gửi email khi WO khẩn cấp)
- **CORS** cấu hình đúng cho domain GitHub Pages
- **Error handling** thống nhất, log lỗi vào Cloudflare Logs hoặc Sentry

### 2.3. Frontend (React + Vite + Tailwind)

- **SPA, mobile-first** (kỹ thuật viên dùng điện thoại ngoài hiện trường)
- **PWA:** cài được trên điện thoại, hoạt động offline cơ bản (cache danh sách thiết bị, đồng bộ khi có mạng)
- **Camera API** để chụp ảnh trực tiếp + scan QR code thiết bị
- Form work order tối giản, giảm số lần chạm trên mobile
- **Dark mode**
- State management: Zustand hoặc TanStack Query
- Routing: React Router

### 2.4. Tính năng góp ý chỉnh sửa vị trí (Location Feedback)

**Vấn đề thực tế:** Vị trí thiết bị được khai báo ban đầu thường sai lệch hoặc thay đổi theo thời gian (thiết bị di chuyển, tòa nhà cải tạo, đặt nhầm tầng/phòng). Cần cơ chế cho người dùng tại hiện trường góp ý sửa vị trí.

**Yêu cầu chức năng:**

- Trên màn hình chi tiết thiết bị, có nút **"Góp ý vị trí"** / **"Suggest correction"**
- Người dùng có thể đề xuất:
  - Vị trí trong cây phân cấp đúng (khu vực/tòa nhà/tầng/phòng)
  - **Tọa độ GPS** (lấy từ thiết bị di động khi đứng cạnh thiết bị thật)
  - Mô tả vị trí cụ thể (vd: "góc tây nam phòng máy tầng B1")
  - Ảnh chụp xung quanh để làm bằng chứng
- Lưu vào bảng `location_corrections`: thiết bị, người đề xuất, vị trí cũ, vị trí mới đề xuất, GPS, ảnh, ghi chú, trạng thái (pending/approved/rejected)
- **Workflow duyệt:**
  - Manager nhận thông báo realtime khi có đề xuất mới
  - Manager xem đề xuất, có thể accept (cập nhật vị trí thiết bị + ghi log audit) hoặc reject (kèm lý do)
  - Người đề xuất nhận thông báo kết quả
- **Crowdsourced verification:** nếu cùng một thiết bị có ≥ 2 người đề xuất cùng một vị trí mới → tự động đánh dấu high-confidence để manager duyệt nhanh
- **Bản đồ:**
  - Hiển thị thiết bị trên sơ đồ tòa nhà (floor plan SVG upload sẵn) hoặc map outdoor (cho golf course)
  - Cho phép user kéo-thả pin để chỉ vị trí mới
  - Sau khi approve, vị trí GPS được lưu thành điểm chính thức

**Yêu cầu kỹ thuật:**

- Thêm columns vào `assets`: `latitude`, `longitude`, `floor_plan_x`, `floor_plan_y`, `location_verified_at`, `location_verified_by`
- Bảng `location_corrections` với RLS:
  - Technician: tạo và xem corrections do mình tạo
  - Manager: xem tất cả corrections trong phạm vi quản lý, approve/reject
  - Admin: toàn quyền
- Sử dụng **Geolocation API** của browser cho lấy GPS (kèm fallback nếu user từ chối quyền)
- Thư viện bản đồ: **Leaflet** (nhẹ, free) cho cả indoor floor plan và outdoor map
- Lưu floor plans trong Supabase Storage, render dạng SVG overlay với markers

### 2.5. Đa ngôn ngữ (i18n)

- Hỗ trợ **Tiếng Việt (mặc định)** và **Tiếng Anh**
- Dùng **react-i18next** cho frontend
- Cấu trúc file dịch:
  ```
  /frontend/src/locales/vi.json
  /frontend/src/locales/en.json
  ```
- Người dùng chọn ngôn ngữ ở góc trên header → lưu vào localStorage + cập nhật `users.preferred_language`
- Toàn bộ UI text, thông báo, email template đi qua hàm `t()`
- **Date format thống nhất:** `yyyy-MM-dd` cho cả VI và EN (chuẩn ISO 8601, dễ sort, không gây nhầm lẫn giữa locale)
- **Datetime format:** `yyyy-MM-dd HH:mm` (24h)
- **Number format:** dấu phẩy phân tách hàng nghìn, dấu chấm cho thập phân (vd: `1,234.56`) — thống nhất cho cả 2 ngôn ngữ
- Dùng `date-fns` với format string cố định, KHÔNG dùng locale-dependent formatting
- **Data nhập vào:** giữ nguyên ngôn ngữ user nhập (không auto-translate). AI assistant đủ thông minh để hiểu và phản hồi đúng ngôn ngữ user đang dùng
- Báo cáo Excel: render header/labels theo ngôn ngữ đang chọn

### 2.6. DevOps

- Repo Git có 3 thư mục chính:
  ```
  /frontend       — React app
  /workers        — Cloudflare Workers (api + ai-service)
  /supabase       — migrations + seed data
  ```
- **GitHub Actions:**
  - Tự động deploy `/frontend` lên GitHub Pages khi push `main`
  - Tự động deploy `/workers` lên Cloudflare khi push `main`
- Migrations bằng **Supabase CLI**
- File `.env.example` đầy đủ + `README.md` hướng dẫn setup từng bước

---

## PHASE 3 — TÍCH HỢP AI

Tích hợp LLM với **5 vai trò chính**: phân tích, kiểm tra, nhắc nhở, trợ lý, và phân tích năng lượng.

> **Nguyên tắc quan trọng:** KHÔNG để AI tự động ra quyết định critical. Luôn có **human-in-the-loop** confirm. AI là công cụ hỗ trợ, không thay thế phán đoán của kỹ thuật viên/quản lý.

### 3.1. AI Phân tích (Analytics Assistant)

**Chức năng:**

- Phân tích lịch sử bảo trì để phát hiện pattern bất thường
  > Ví dụ: "Máy bơm B12 hỏng 3 lần trong tháng, cao hơn trung bình cụm 250%"
- Tóm tắt báo cáo tuần/tháng bằng ngôn ngữ tự nhiên cho quản lý
- Phân tích nguyên nhân gốc (RCA) từ mô tả sự cố nhân viên ghi
- Gợi ý lịch PM tối ưu dựa trên MTBF thực tế

**Endpoint:** `POST /api/ai/analyze`

```json
{
  "type": "anomaly" | "summary" | "rca" | "pm-optimization",
  "scope": { "asset_ids": [...], "date_range": [...] },
  "language": "vi" | "en"
}
```

### 3.2. AI Kiểm tra (Quality Check)

**Chức năng:** Khi kỹ thuật viên submit WO hoàn thành, AI đọc mô tả + ảnh và đánh giá:

- Mô tả đã đủ chi tiết chưa? (vd: thiếu nguyên nhân, thiếu biện pháp xử lý)
- Ảnh trước/sau có khớp với mô tả không?
- Vật tư khai báo có hợp lý so với loại sự cố không?

**Output:** điểm chất lượng 0–100 + gợi ý bổ sung. Nếu điểm < 60, manager nhận thông báo review thủ công.

**Vision API:** phân tích ảnh để phát hiện rỉ sét, rò rỉ, nứt vỡ rõ ràng.

### 3.3. AI Nhắc nhở (Smart Reminder)

**Chức năng:** Sinh nội dung thông báo thông minh, không chỉ nhắc theo lịch cố định:

- > "Máy A07 sắp đến hạn PM hàng quý. Lần PM trước phát hiện bạc đạn mòn — lần này nên kiểm tra lại."
- Gom nhiều việc cùng khu vực thành 1 thông báo:
  > "Hôm nay bạn có 3 việc tại khu Tee Box. Đề xuất thứ tự: 1→3→2 để tiết kiệm di chuyển."
- **Cảnh báo proactive:** nếu một loại thiết bị đang có tỷ lệ hỏng cao bất thường, AI gửi cảnh báo cho manager kèm phân tích

**Channels:** in-app notification, email, có thể mở rộng Zalo/Telegram.

### 3.4. AI Trợ lý (Chat Assistant)

**Chức năng:** Chatbot tích hợp trong UI, cho phép kỹ thuật viên hỏi tự nhiên:

- > "Lần cuối bảo trì máy bơm B12 là khi nào?"
- > "Vật tư còn lại của bộ lọc HEPA?"
- > "Tạo work order khẩn cấp cho đèn sân số 9 bị cháy"

**Yêu cầu kỹ thuật:**

- Dùng **function calling / tool use:** AI gọi internal API để lấy data hoặc thực hiện hành động
- Lưu lịch sử chat vào bảng `ai_conversations`
- Hỗ trợ cả tiếng Việt và tiếng Anh, **tự nhận diện ngôn ngữ** user nhập
- **Streaming response** qua Server-Sent Events
- **Confirm trước khi thực hiện:** với các action có side-effect (tạo/sửa/xóa WO), AI phải hiển thị preview và xin user confirm

### 3.5. AI Phân tích Năng lượng (Energy & Utility Analytics)

**Chức năng chính:** Kiểm tra và phân tích sản lượng điện năng, tiêu thụ nước của từng điểm đo.

**Các khả năng cụ thể:**

- **Phát hiện bất thường:** so sánh chỉ số kỳ hiện tại với cùng kỳ năm trước, với cụm điểm đo tương tự, với mô hình dự báo
  > "Đồng hồ điện tòa B tháng này tiêu thụ 18.500 kWh, cao hơn 32% so với cùng kỳ năm trước trong khi số phòng hoạt động không đổi. Nghi ngờ: rò rỉ điện hoặc thiết bị mới chưa khai báo."
- **Phát hiện rò rỉ nước:** chỉ số tăng đều cả ban đêm khi không có hoạt động → cảnh báo có thể rò rỉ ngầm
- **Phát hiện sai sót khi ghi chỉ số:** chỉ số mới thấp hơn chỉ số cũ, nhảy vọt bất hợp lý, format số không chuẩn
- **Phân tích tương quan:** liên kết tiêu thụ điện với thời tiết (nóng → tăng điều hòa), với số khách sân golf, với lịch hoạt động sự kiện
- **Tóm tắt báo cáo năng lượng:** sinh nội dung báo cáo tháng bằng ngôn ngữ tự nhiên, kèm insight và khuyến nghị tiết kiệm
- **Benchmark nội bộ:** xếp hạng các điểm đo cùng loại, chỉ ra khu vực tiêu hao bất thường
- **Dự báo:** ước tính tiêu thụ kỳ tới dựa trên trend lịch sử (đơn giản, không cần ML model phức tạp — chỉ cần LLM đọc data và đưa range hợp lý)
- **Gợi ý hành động:**
  > "3 điểm đo khu Tee Box có công suất phản kháng cao bất thường — đề xuất kiểm tra tụ bù."

**Endpoint:** `POST /api/ai/energy-analyze`

```json
{
  "type": "anomaly" | "leak-detection" | "reading-validation" | "correlation" | "summary" | "forecast" | "benchmark",
  "meter_point_ids": [...],
  "date_range": { "from": "2026-01-01", "to": "2026-03-31" },
  "language": "vi" | "en"
}
```

**Tích hợp với workflow:**

- Khi technician ghi chỉ số xong → AI tự động validate ngay tại form (không cần submit là quay lại sửa)
- Cron hàng ngày 06:00: AI quét tất cả điểm đo có data mới, sinh cảnh báo nếu phát hiện bất thường
- Dashboard "Năng lượng" có nút "AI Insight" để sinh phân tích on-demand

### 3.6. Kiến trúc AI

**Triết lý:** Ưu tiên các provider sử dụng **OAuth/subscription đã có sẵn** thay vì API trả phí, giúp giảm chi phí vận hành về gần bằng 0. API key chỉ là fallback tùy chọn.

**Provider Strategy (theo thứ tự ưu tiên):**

1. **OpenAI Codex OAuth** (qua ChatGPT Plus/Pro subscription) — primary
   - Tận dụng subscription đã trả của user, không tốn thêm phí API
   - Dùng OAuth flow để lấy session token, auto-refresh khi hết hạn
   - Phù hợp cho phân tích chung, code-related tasks, function calling

2. **OpenClaw** — alternative orchestrator
   - Open-source orchestration platform, có thể self-host trên Synology NAS hoặc VPS rẻ
   - Quản lý nhiều backend AI (Claude, GPT, local models qua Ollama) qua một interface thống nhất
   - Phù hợp khi cần linh hoạt chuyển đổi model, hoặc muốn data ở lại trong mạng nội bộ

3. **Hermes** — alternative orchestrator
   - Tương tự OpenClaw, một option khác cho headless AI orchestration
   - Hỗ trợ tool use và streaming

4. **Anthropic Claude API / OpenAI API** — fallback tùy chọn (KHÔNG bắt buộc)
   - Chỉ kích hoạt khi user cấu hình API key thủ công
   - Dùng cho production cần SLA cao, hoặc khi không có sẵn OAuth subscription
   - Nếu không cấu hình, hệ thống vẫn chạy bình thường

**Cấu hình provider:**

```typescript
// /workers/ai-service/src/config/providers.ts
type AIProvider = 
  | { type: 'openai-codex-oauth', session_token: string, refresh_token: string }
  | { type: 'openclaw', endpoint: string, auth: string }
  | { type: 'hermes', endpoint: string, auth: string }
  | { type: 'anthropic-api', api_key: string }     // optional
  | { type: 'openai-api', api_key: string };        // optional

// Cho phép cấu hình thứ tự fallback chain
const PROVIDER_CHAIN: AIProvider[] = loadFromEnv();
```

**Cấu hình qua Admin UI:**

- Trang **Settings → AI Providers** cho admin chọn provider nào active và thứ tự fallback
- **Test connection** button để verify trước khi save
- Nếu user không cấu hình gì, hệ thống chạy ở **"AI-disabled mode"** — toàn bộ tính năng AI bị ẩn nhưng app vẫn chạy bình thường (đây là yêu cầu **BẮT BUỘC**)

**Triển khai kỹ thuật:**

- **Service riêng:** Cloudflare Worker tại `/workers/ai-service/`
- **Provider abstraction layer:** interface chung `IAIProvider` với methods `chat()`, `complete()`, `embed()` — các provider implement interface này
- **Token/session lưu trữ:**
  - OAuth tokens: lưu encrypted trong Cloudflare KV với TTL phù hợp, auto-refresh khi hết hạn
  - API keys (nếu có): lưu trong **Cloudflare Workers Secrets**
  - KHÔNG để trong code, KHÔNG commit lên git
- **Caching:** cache response cho query lặp lại (Cloudflare KV, TTL 1 giờ cho analytics, 5 phút cho energy data)
- **Rate limiting per user:** 50 AI requests/giờ cho technician, 200 cho manager, không giới hạn cho admin
- **Logging:** bảng `ai_usage_logs` (user_id, provider_used, type, tokens_in, tokens_out, cost_estimate_usd, created_at) để theo dõi chi phí và performance từng provider
- **Fallback gracefully:** nếu provider hiện tại fail → tự động chuyển provider tiếp theo trong chain. Nếu tất cả đều fail, ẩn tính năng AI tạm thời, hệ thống vẫn chạy bình thường

### 3.7. Prompt Templates

Tạo thư mục `/workers/ai-service/prompts/` chứa các template:

```
prompts/
├── system-vi.md           # System prompt tiếng Việt
├── system-en.md           # System prompt tiếng Anh
├── analyze-anomaly.md
├── analyze-summary.md
├── analyze-rca.md
├── quality-check.md
├── smart-reminder.md
├── energy-anomaly.md      # Phát hiện bất thường tiêu thụ
├── energy-leak.md         # Phát hiện rò rỉ nước
├── energy-validation.md   # Validate chỉ số đồng hồ khi nhập
├── energy-summary.md      # Tóm tắt báo cáo năng lượng
└── chat-assistant.md      # Kèm tool definitions cho function calling
```

**Mỗi template phải có:**

- **Vai trò rõ ràng:** "Bạn là chuyên gia bảo trì thiết bị với 20 năm kinh nghiệm..."
- **Context:** dữ liệu liên quan được inject vào (lịch sử WO, thông số thiết bị, tồn kho)
- **Format output:** JSON structured cho analytics, markdown cho summary
- **Guard rails:**
  - Không bịa số liệu
  - Luôn cite nguồn data
  - Nếu không đủ thông tin, nói rõ thay vì đoán
  - Không đưa ra khuyến nghị về an toàn điện/cơ khí mà không kèm cảnh báo "cần kỹ sư có chứng chỉ kiểm tra"

### 3.8. Bảo mật & Privacy

- Dữ liệu thiết bị Hapulico gửi sang LLM provider — cân nhắc:
  - Dùng Anthropic API với **Zero Data Retention** (cần đăng ký riêng với Anthropic)
  - Hoặc self-host model open source (Qwen, Llama) qua Ollama trên VPS — đánh đổi chất lượng lấy privacy
- **Sanitize input** trước khi gửi sang AI: loại bỏ thông tin cá nhân không cần thiết (số điện thoại, email nếu không liên quan)
- **PII masking** trong logs

---

## PHASE 4 — OUTPUT THEO THỨ TỰ TRIỂN KHAI

Hãy bắt đầu bằng cách:

### Bước 1: Cấu trúc dự án

Tạo cấu trúc thư mục project hoàn chỉnh:

```
hapulico-cmms/
├── frontend/              # React + Vite
├── workers/
│   ├── api/              # REST API chính
│   └── ai-service/       # AI service riêng
├── supabase/
│   ├── migrations/
│   └── seed.sql
├── .github/workflows/
├── .env.example
└── README.md
```

### Bước 2: Database Schema

Viết SQL migrations cho toàn bộ schema:

- Tất cả bảng (users, assets, work_orders, pm_schedules, inventory, ai_conversations, ai_usage_logs, work_orders_history, v.v.)
- RLS policies cho từng role
- Triggers (updated_at, auto-generate codes, audit log)
- Indexes
- JSONB columns cho multilingual fields

### Bước 3: Seed Data

Tạo seed data thực tế:

- 5 khu vực (sân golf + 4 tòa nhà)
- 20 thiết bị mẫu (máy bơm, đèn sân, hệ thống tưới, thang máy, chiller, máy phát điện...)
- 10 lịch PM
- 5 user mẫu cho từng role
- Data có cả tiếng Việt và tiếng Anh để test i18n

### Bước 4: Cloudflare Worker (API chính)

- Code TypeScript với Hono
- Đầy đủ CRUD cho `assets` và `work-orders` trước
- Middleware: auth (validate Supabase JWT), rate limit, error handling, CORS
- Cron handler cho PM auto-generation

### Bước 5: Frontend cơ bản

- Trang đăng nhập (Supabase Auth)
- Dashboard với KPI cơ bản
- Danh sách work order (list + filter + search)
- Form tạo/sửa work order
- Quản lý điểm đo điện/nước + form ghi chỉ số
- Tính năng góp ý vị trí thiết bị (Location Feedback) với bản đồ Leaflet
- **i18n switcher** ở header (VI/EN), date format `yyyy-MM-dd`
- Mobile-responsive với Tailwind

### Bước 6: AI Service

- Cấu hình provider chain (OpenAI Codex OAuth → OpenClaw → Hermes → API fallback)
- AI Trợ lý chat (tính năng dễ thấy giá trị nhất, làm trước)
- AI Phân tích Năng lượng (validate chỉ số khi nhập, cảnh báo bất thường điện/nước)
- AI Kiểm tra chất lượng work order
- AI Nhắc nhở thông minh
- AI Phân tích + dashboard insights

### Bước 7: PWA + Camera + QR

- Service worker, manifest
- Camera capture cho ảnh trước/sau
- QR scan để mở thiết bị

### Bước 8: README.md tiếng Việt

Hướng dẫn setup từng bước:

1. Clone repo
2. Tạo Supabase project, lấy keys
3. Chạy migrations + seed
4. Tạo Cloudflare account, setup Workers
5. Cấu hình AI Provider (chọn 1 hoặc nhiều):
   - **Cách 1 (khuyên dùng):** OpenAI Codex OAuth — đăng nhập ChatGPT account
   - **Cách 2:** Self-host OpenClaw hoặc Hermes trên Synology NAS / VPS
   - **Cách 3 (tùy chọn):** Đăng ký Anthropic/OpenAI API key
   - **Hoặc bỏ qua:** chạy ở AI-disabled mode
6. Cấu hình `.env`
7. Deploy frontend lên GitHub Pages
8. Deploy Workers lên Cloudflare
9. Upload floor plans (cho tính năng Location Feedback)
10. Test end-to-end

---

## QUY TẮC LÀM VIỆC

1. **Bắt đầu từ schema database trước.** Sau khi tôi xác nhận schema → mới qua bước kế.
2. **Hỏi tôi xác nhận trước khi qua mỗi Phase mới.**
3. **Nếu có quyết định kiến trúc quan trọng** (vd: chọn library, đặt tên bảng), nêu 2–3 phương án với pros/cons để tôi chọn.
4. **Code production-quality:** có TypeScript types đầy đủ, error handling, comments tiếng Anh trong code, JSDoc cho public functions.
5. **Test:** ít nhất phải có integration test cho các API endpoint chính.
6. **Commit message** theo Conventional Commits (`feat:`, `fix:`, `docs:`, ...).

---

## THÔNG TIN BỔ SUNG TÔI SẼ CUNG CẤP KHI ĐƯỢC HỎI

- Số lượng thiết bị thực tế hiện tại
- Số kỹ thuật viên đồng thời sử dụng
- Tích hợp với hệ thống sẵn có nào (chấm công, ERP)?
- Logo công ty + bộ màu thương hiệu
- Mẫu báo cáo Excel hiện đang dùng

Bắt đầu nào.
