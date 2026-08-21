# Implementation Plan: Auth Login, Logout & Password Management

## 1. Overview
Triển khai hệ thống xác thực: Đăng nhập, Đăng xuất, Đổi mật khẩu và cơ chế mật khẩu mặc định (Default PIN `1234`) cho `nhatky/index.html`.

## 2. Các Bước Thực Hiện (TDD Workflow)
1. **Viết Test Playwright:** Thêm test cases kiểm tra flow Login với PIN mặc định `1234`, Login thất bại khi sai PIN, Đổi PIN sang mã mới, Đăng xuất khóa màn hình.
2. **Cập nhật `AppRepository`:** Thêm `pin` vào `employees`, viết `login()`, `logout()`, `changePin()`.
3. **Cập nhật Giao Diện:** Thêm `#screen-login`, `#modal-change-password`, nút "Đăng xuất" và "Đổi mật khẩu" trong Tab Cá nhân.
4. **Chạy Test & Verification:** Đảm bảo 100% test cases pass và deploy lên GitHub Pages.
