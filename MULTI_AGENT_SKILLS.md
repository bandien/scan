---
title: Multi-Agent System (MAS) Workflow Skill
aliases:
  - skills
  - multi-agent system (mas) workflow skill
tags:
  - khac
  - scan-cmms
  - dang-thuc-hien
date: 2026-06-08
updated: 2026-06-08
---
# Multi-Agent System (MAS) Workflow Skill

Hệ thống Multi-Agent (MAS) được thiết kế để tối ưu hóa quy trình làm việc giữa **AI Kiến trúc (Architect)** và các **AI Thực thi (Sub-agents/Workers)**.

## 1. Cơ chế Hoạt động (Core Logic)

Hệ thống vận hành dựa trên sự phân tách giữa "Lập kế hoạch" và "Thực thi":
- **Architect (Antigravity/Lead AI):** Giữ vai trò bộ não, nắm bắt toàn bộ Roadmap.
- **Sub-agents (Claude Code/Copilot Code):** Giữ vai trò tay chân, thực thi các task cụ thể một cách độc lập và tuần tự.

## 2. Quy trình cho AI Chủ đạo (Lead AI/Architect)

Khi nhận yêu cầu lớn từ người dùng, Lead AI phải thực hiện các bước sau:

1.  **Cập nhật Roadmap:** Đọc và cập nhật file `brain/roadmap.md` để đảm bảo lộ trình tổng thể luôn chính xác.
2.  **Chia nhỏ công việc (Task Decomposition):** Chia yêu cầu lớn thành các task nhỏ, độc lập, có thể thực thi trong vòng 5-10 phút.
3.  **Khởi tạo Task:**
    - **GitHub Issue:** Tạo GitHub Issue với label `claude-todo` (hoặc sub-agent tương ứng). Nội dung Issue phải cực kỳ ngắn gọn: File cần sửa và logic cần thay đổi.
    - **Local Task File:** Tạo file `.txt` trong thư mục `brain/tasks_queue/`. Nội dung file `.txt` chính là prompt để Sub-agent đọc và làm theo.
    - **Ghi log:** Cập nhật trạng thái vào `brain/task.md`.

## 3. Quy trình cho Sub-Agents (Workers)

Các Sub-agent (thông qua các script như `claude-worker.ps1`, `copilot-worker.ps1`) sẽ vận hành theo chu kỳ:

1.  **Quét Task (Polling):** Định kỳ (mặc định 5-30 phút) quét các GitHub Issue có label tương ứng hoặc quét thư mục `brain/tasks_queue/`.
2.  **Thực thi (Execution):**
    - Đổi tên file từ `.txt` sang `.working` để đánh dấu đang xử lý.
    - Đọc prompt từ file và chạy lệnh thực thi (ví dụ: `claude -p prompt`).
3.  **Hoàn tất & Báo cáo (Reporting):**
    - Khi xong, cập nhật kết quả (Success/Failed) trực tiếp vào nội dung file.
    - **Đổi tên & Di chuyển:** Đổi tên file thành `[TaskName].done.txt` và di chuyển sang thư mục `brain/tasks_done/`.
    - **Đồng bộ:** Tự động `git add`, `git commit`, `git push` để cập nhật trạng thái lên GitHub.
    - **Thông báo:** Phát âm thanh "Beep" tại máy tính để báo hiệu cho người dùng.
    - **Cross-Agent Review:** Sau khi kết thúc một Giai đoạn (Phase), Lead AI (Architect) phải tạo một Task Review giao cho Model khác để đánh giá kết quả, ghi báo cáo đánh giá và đề xuất tối ưu.

## 4. Cấu trúc thư mục liên quan

- `brain/roadmap.md`: Lộ trình tổng thể.
- `brain/task.md`: Danh sách task hiện tại.
- `brain/tasks_queue/`: Nơi chứa các task đang chờ xử lý.
- `brain/tasks_done/`: Nơi lưu trữ lịch sử các task đã hoàn thành.

## 5. Lệnh thực thi hỗ trợ

- **Tạo task nhanh:** `echo "Nội dung task" > brain/tasks_queue/task_name.txt`
- **Chạy Worker (PowerShell):** `.\claude-worker.ps1`
- **Âm thanh thông báo:** `[console]::beep(1000, 300)`

---
*Lưu ý: Luôn ưu tiên GitHub Issue để Sub-agent có context cô đọng nhất, tránh lãng phí Token.*
