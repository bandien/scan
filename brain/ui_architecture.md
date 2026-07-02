# Sơ đồ Kiến trúc UI & Chức năng (UI Architecture Map)

Tài liệu này đóng vai trò là "Bản đồ số" (Functional Map) giúp AI (Antigravity) và lập trình viên dễ dàng định vị các thành phần giao diện, chức năng và vị trí của chúng trong mã nguồn. 
**QUY TẮC:** Mọi thay đổi về giao diện hoặc chức năng mới BẮT BUỘC phải được cập nhật đồng bộ vào file này.

## 1. Sơ đồ Cấu trúc Thành phần (Mermaid Diagram)

```mermaid
graph TD
    %% Root
    Root[index.html] --> Login[Login Overlay<br/>#loginOverlay]
    Root --> App[App Shell<br/>#appShell]

    %% Login
    Login --> doLogin((doLogin function))
    doLogin -.-> LocalStorage[(LocalStorage)]
    doLogin -.-> GAS_GET[GAS GET action=login]

    %% App Shell Components
    App --> Header[Header Section<br/>.header-section]
    App --> Scanner[QR Scanner<br/>#reader]
    App --> Dash[Dashboard Section<br/>#dashboardSection]
    App --> Kanban[Kanban Section<br/>#kanbanSection]
    App --> Cal[Calendar Section<br/>#calendarSection]
    App --> Metering[Metering Section<br/>#meteringSection]
    App --> Info[Device Info Section<br/>#infoSection]

    %% Independent Satellite WebApps (GitHub Pages)
    Root -.-> LinkStatus[status.html<br/>Uptime Monitor]
    Root -.-> LinkMeter[meter.html<br/>Public 1-Touch Meter]
    LinkMeter -.-> LinkPrint[print_meters.html<br/>QR Print Sheet]

    %% Header Elements
    Header --> UserBadge[User Profile Badge<br/>#userBadge]
    Header --> SyncBadge[Sync Status Badge<br/>#syncBadge]
    Header --> NavBtns[Navigation Buttons<br/>Metering, Calendar, Kanban, Dash]

    %% Info Section Elements
    Info --> DevDetails[Device Profile<br/>#disp_name, #disp_uid]
    Info --> Checklist[Dynamic Checklist<br/>#dynamicChecklist]
    Info --> Notes[Field Notes<br/>#notes]
    Info --> SubmitBtn[Submit Button<br/>.btn-submit]

    %% Logic mapping
    Scanner --> fetchData((fetchData function))
    fetchData -.-> LocalStorage
    SubmitBtn --> submitData((submitData function))
    submitData -.-> OfflineSync[Offline Sync Logic]
    submitData -.-> GAS_POST[GAS POST Endpoint]
    OfflineSync -.-> updateSyncStatus((updateSyncStatus))

    %% Uptime Monitor Logic (status.html)
    LinkStatus --> pingServer((pingServer function))
    pingServer -.-> fetchNoCors[fetch mode=no-cors]
    pingServer -.-> LocalStorageStatus[(localStorage server_logs)]

    %% Public Meter Logic (meter.html)
    LinkMeter --> submitMeterReadingPub((submitMeterReading function))
    submitMeterReadingPub -.-> GAS_POST_METER[GAS POST action=submitMeterReading]
    submitMeterReadingPub -.-> LocalStorageMeterState[(localStorage pump_state_X)]

    %% Kanban / Work Orders
    Kanban --> loadKanban((loadKanban function))
    Kanban --> WOModal[WO Detail Modal<br/>#woDetailModal]
    Kanban --> CreateWO[Create WO Modal<br/>#createWOModal]
    loadKanban -.-> LocalStorage
    loadKanban -.-> GAS_GET_WO[GAS GET action=getWorkOrders]
    WOModal --> updateWOStatus((updateWOStatus))
    updateWOStatus -.-> GAS_POST
    updateWOStatus -.-> LocalStorage
    CreateWO --> submitCreateWO((submitCreateWO))
    submitCreateWO -.-> GAS_POST

    %% Metering / Electric & Water Meters
    Metering --> MeterList[Meter List<br/>#meterList]
    Metering --> MeterModal[Meter Reading Modal<br/>#meterReadingModal]
    Metering --> toggleMetering((toggleMetering function))
    toggleMetering --> loadMeterPoints((loadMeterPoints function))
    loadMeterPoints -.-> LocalStorageMeters[(localStorage localMeterPoints)]
    loadMeterPoints -.-> GAS_GET_METERS[GAS GET action=getMeterPoints]
    MeterList --> renderMeterDashboard((renderMeterDashboard function))
    MeterModal --> submitMeterReading((submitMeterReading function))
    MeterModal --> loadMeterHistoryInline((loadMeterHistoryInline function))
    loadMeterHistoryInline -.-> GAS_GET_HISTORY[GAS GET action=getMeterHistory]
    submitMeterReading -.-> GAS_POST_READING[GAS POST action=submitMeterReading]
    submitMeterReading -.-> LocalStorageMeters
```

## 2. Từ điển Mapping (UI to Code)

Để sửa chữa hoặc nâng cấp một tính năng, hãy tìm kiếm các ID/Function sau trong mã nguồn:

| Khu vực UI (Giao diện) | HTML ID / Class / File | JS Function liên quan | Nguồn Dữ liệu (Nơi cấp data) | Mã Vị trí (Copy to Prompt) |
| :--- | :--- | :--- | :--- | :--- |
| **Màn hình Đăng nhập** | `#loginOverlay`, `#usernameInput`, `#passwordInput` | `doLogin()` | Google Sheets (`Users`) -> `localStorage` | `[index.html#loginOverlay]` |
| **Chuyển ngôn ngữ (Login)** | `#loginLangToggle` | `setLanguage()` | Tĩnh (Static) | `[index.html#loginLangToggle]` |
| **Thanh Tiêu đề (Header)** | `.header-section` | `toggleDashboard()`, `setLanguage()` | Tĩnh (Static) | `[index.html.header-section]` |
| **Hồ sơ Nhân viên (Dropdown)** | `#userBadge`, `#userNameDisplay`, `#userRoleDisplay` | `updateUI(user)`, `doLogout()`, `setLanguage()` | `localStorage.getItem('currentUser')` | `[index.html#userBadge]` |
| **Trạng thái Đồng bộ** | `#syncBadge` | `updateSyncStatus()` | `localStorage.getItem('offline_logs')` | `[index.html:updateSyncStatus]` |
| **Camera Quét QR** | `#reader`, `#startScan` | `Html5Qrcode` library | Camera thiết bị | `[index.html#reader]` |
| **Hiển thị Thiết bị** | `#infoSection`, `#disp_name` | `fetchData(uid)` | `localStorage.getItem('localDevices')` | `[index.html:fetchData]` |
| **Mẫu Checklist** | `#dynamicChecklist` | `renderChecklist(type)` | Tĩnh (Cấu hình cứng trong mảng JS) | `[index.html:renderChecklist]` |
| **Gửi Dữ liệu (Submit)** | `.btn-submit`, `#notes` | `submitData()` | Đẩy thẳng lên GAS POST | `[index.html:submitData]` |
| **Bảng Dashboard** | `#dashboardSection`, `#assetChart`| `toggleDashboard()` | `Chart.js` (Đang là Mock Data) | `[index.html#dashboardSection]` |
| **Bảng Kanban (Live)** | `#kanbanSection`, `#kanbanBoard` | `toggleKanban()`, `loadKanban()`, `normalizeWorkOrders()`, `renderKanban()` | GAS GET `action=getWorkOrders` → chuẩn hóa schema WO → `localStorage('localWorkOrders')` | `[index.html#kanbanSection]` |
| **WO Detail Modal** | `#woDetailModal`, `#woDetailBody`, `#woNextStatusBtn` | `openWODetail(wo)`, `advanceWOStatus()`, `updateWOStatus()`, `quickAdvanceStatus()` | `localWorkOrders` → GAS POST `action=updateWOStatus` | `[index.html#woDetailModal]` |
| **Form Tạo WO** | `#createWOModal`, `#woType`, `#woPriority`, `#woAsset`, `#woDescription`, `#woDueDate` | `showCreateWOModal()`, `submitCreateWO()` | `localDevices` (dropdown) → GAS POST `action=createWO` | `[index.html#createWOModal]` |
| **Bảng Lịch (Calendar)** | `#calendarSection` | `toggleCalendar()` | (Đang là Mock Data) | `[index.html#calendarSection]` |
| **Danh mục Đồng hồ (Điện & Nước)** | `#meteringSection`, `#meterList`, `#btn-metering` | `toggleMetering()`, `loadMeterPoints()`, `renderMeterDashboard()` | GAS GET `action=getMeterPoints` → `localStorage('localMeterPoints')`; dữ liệu gốc sheet `MeterPoints` | `[index.html#meteringSection]`, `[js/metering.js:toggleMetering]` |
| **Chốt chỉ số Đồng hồ** | `#meterReadingModal`, `#meterValueInput`, `#meterPhotoPreview`, `#meterHistoryInline` | `openMeterReadingModal(meterId)`, `captureMeterPhoto()`, `loadMeterHistoryInline()`, `submitMeterReading()` | GAS GET `action=getMeterHistory`; GAS POST `action=submitMeterReading`; sheet `MeterReadings` | `[index.html#meterReadingModal]`, `[js/metering.js:submitMeterReading]` |
| **Giám sát Server Uptime** | `status.html` | `pingServer()`, `checkAllServers()`, `addLog()` | Trình duyệt Client-side (`fetch no-cors`) -> Lưu log vào `localStorage('server_logs')` | `[status.html]` |
| **Chốt 1-Touch Công cộng** | `meter.html` | `loadMeterData()`, `submitMeterReading()` | Cloud Proxy GAS -> `localStorage('pump_state_X')` | `[meter.html]` |
| **In tem QR 22 Đồng hồ** | `print_meters.html` | JS array rendering | Tĩnh + QRServer API | `[print_meters.html]` |

## 3. Kiến trúc Luồng Dữ liệu (Data Flow)

1. **Khởi tạo (Init)**: Khi mở WebApp, nếu có LocalStorage -> Bỏ qua Login. Nếu không -> Bật `#loginOverlay`.
2. **Đăng nhập (Auth)**: Nhập PIN -> Gửi GET request tới Apps Script -> Lấy thông tin `user` + danh sách `devices` -> Lưu vào `localStorage`.
3. **Quét Mã (Scan)**: Camera đọc được UID -> Hàm `fetchData(uid)` quét tìm uid đó trong `localStorage` thay vì gọi API -> Tốc độ phản hồi 0.01 giây.
4. **Nộp Báo cáo (Submit)**: Tick Checklist + Ghi chú -> Bấm Complete -> Gọi hàm `submitData()`. 
    - Nếu có mạng: Gửi POST tới Apps Script, cập nhật `updateSyncStatus()`.
    - Nếu mất mạng: Ghi vào `offline_logs` trong `localStorage`, đổi UI thành cảnh báo vàng. Khi có mạng (`window.addEventListener('online')`) tự động đẩy bù.
