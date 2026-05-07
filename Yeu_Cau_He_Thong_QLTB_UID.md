# HỒ SƠ ĐẶC TẢ KỸ THUẬT: HỆ THỐNG QUẢN LÝ BẢO TRÌ QR-UID TOÀN DIỆN

## 1. TỔNG QUAN GIẢI PHÁP
Hệ thống được thiết kế để vận hành, quản lý thiết bị cơ điện bằng mã UID thông qua Web App. Mục tiêu tối thượng là tính linh hoạt: không phụ thuộc tên miền cố định, chi phí 0 đồng và dễ dàng di chuyển hạ tầng.

### Nguyên tắc cốt lõi:
- **Mã QR tinh gọn:** Chỉ chứa dữ liệu thô là UID (ví dụ: `TB001`). Không chứa URL để tránh việc phải in lại nhãn khi thay đổi server.
- **Hệ thống Hybrid:** Giao diện đặt trên GitHub Pages (Static Host), dữ liệu đặt trên Google Sheets (Database).
- **Kết nối API:** Sử dụng Google Apps Script (GAS) làm cầu nối xử lý dữ liệu.

---

## 2. KIẾN TRÚC HẠ TẦNG
| Thành phần | Công nghệ sử dụng | Ghi chú |
| :--- | :--- | :--- |
| **Frontend** | GitHub Pages (HTML5, Bootstrap 5, JS) | Cung cấp HTTPS miễn phí để dùng Camera. |
| **Backend/API** | Google Apps Script (GAS) | Xử lý logic tìm kiếm và ghi dữ liệu. |
| **Database** | Google Sheets | Lưu thông tin thiết bị và nhật ký bảo trì. |
| **QR Library** | Html5-qrcode.js | Quét mã trực tiếp trên trình duyệt điện thoại. |

---

## 3. LUỒNG VẬN HÀNH (WORKFLOW)
1. **Truy cập:** Nhân viên mở Web App trên GitHub Pages.
2. **Quét QR:** Nhấn nút quét -> Camera đọc UID từ nhãn thiết bị.
3. **Truy vấn:** Web App gửi UID tới GAS. GAS tra cứu Google Sheets.
4. **Hiển thị:** Web App hiện thông tin thiết bị & danh sách Checklist tương ứng.
5. **Checklist:** Nhân viên tích chọn các hạng mục và nhập thông số kỹ thuật.
6. **Lưu trữ:** Nhấn "Gửi" -> Dữ liệu đẩy về sheet "Lịch sử bảo trì".

---

## 4. GIAO DIỆN MẪU (CODE HTML/JS)
Đây là mã nguồn trang chủ (index.html) tích hợp sẵn tính năng quét QR và Checklist.
```html
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hệ thống Bảo trì QR-UID</title>
    <link href="[https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css](https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css)" rel="stylesheet">
    <script src="[https://unpkg.com/html5-qrcode](https://unpkg.com/html5-qrcode)"></script>
    <style>
        :root { --primary-color: #2c3e50; }
        body { background-color: #f4f7f6; }
        .main-container { max-width: 500px; margin: auto; padding: 15px; }
        .card-custom { border: none; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); margin-bottom: 15px; }
        #reader { width: 100%; border-radius: 12px; overflow: hidden; display: none; margin-bottom: 15px; }
        .check-item { padding: 12px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; }
        .btn-scan { background-color: var(--primary-color); color: white; height: 60px; font-weight: bold; border-radius: 10px; }
    </style>
</head>
<body>

<div class="main-container">
    <header class="text-center my-3">
        <h4 class="fw-bold text-uppercase">Vận hành Cơ điện</h4>
        <p class="text-muted small">Quét QR UID để bảo trì thiết bị</p>
    </header>

    <!-- Khu vực Quét QR -->
    <div id="reader"></div>
    <button class="btn btn-scan w-100 mb-3 shadow-sm" id="startScan">📸 QUÉT MÃ THIẾT BỊ</button>

    <!-- Khu vực Hiển thị Thông tin (Ẩn khi chưa quét) -->
    <div id="infoSection" style="display: none;">
        <div class="card card-custom">
            <div class="card-body">
                <h5 class="text-primary fw-bold" id="disp_name">Tên thiết bị</h5>
                <p class="mb-1 small"><strong>UID:</strong> <span id="disp_uid">---</span></p>
                <p class="mb-0 small"><strong>Vị trí:</strong> <span id="disp_loc">---</span></p>
            </div>
        </div>

        <!-- Bảng Checklist -->
        <div class="card card-custom">
            <div class="card-header bg-white fw-bold">DANH MỤC KIỂM TRA</div>
            <div id="checklistItems">
                <div class="check-item">
                    <span>1. Kiểm tra nguồn điện/Pin</span>
                    <input class="form-check-input" type="checkbox" id="item1">
                </div>
                <div class="check-item">
                    <span>2. Độ rung & Nhiệt độ máy</span>
                    <input class="form-check-input" type="checkbox" id="item2">
                </div>
                <div class="check-item">
                    <span>3. Vệ sinh & Tra dầu mỡ</span>
                    <input class="form-check-input" type="checkbox" id="item3">
                </div>
            </div>
            <div class="p-3 border-top">
                <label class="small fw-bold">Thông số đo đạc / Ghi chú:</label>
                <textarea class="form-control mt-1" id="notes" rows="2" placeholder="Nhập kết quả..."></textarea>
            </div>
        </div>

        <button class="btn btn-success w-100 py-3 fw-bold shadow" onclick="submitData()">XÁC NHẬN HOÀN TẤT</button>
    </div>
</div>

<script>
    const scanner = new Html5Qrcode("reader");
    const startBtn = document.getElementById('startScan');

    startBtn.addEventListener('click', () => {
        document.getElementById('reader').style.display = 'block';
        scanner.start({ facingMode: "environment" }, { fps: 10, qrbox: 250 }, 
        (uid) => {
            document.getElementById('disp_uid').innerText = uid;
            document.getElementById('infoSection').style.display = 'block';
            document.getElementById('reader').style.display = 'none';
            startBtn.innerText = "🔄 QUÉT THIẾT BỊ KHÁC";
            scanner.stop();
            fetchDataFromGAS(uid);
        });
    });

    function fetchDataFromGAS(uid) {
        // Logic: Gọi tới Google Apps Script để lấy thông tin thực tế
        document.getElementById('disp_name').innerText = "Thiết bị: " + uid;
        document.getElementById('disp_loc').innerText = "Khu vực kỹ thuật tầng 1";
    }

    function submitData() {
        const uid = document.getElementById('disp_uid').innerText;
        alert("Đã gửi báo cáo bảo trì cho UID: " + uid + " về hệ thống Google Sheets.");
        location.reload();
    }
</script>
</body>
</html>