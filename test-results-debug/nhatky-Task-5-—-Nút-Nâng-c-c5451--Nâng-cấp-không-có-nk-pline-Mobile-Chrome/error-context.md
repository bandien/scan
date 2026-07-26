# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: nhatky.spec.js >> Task 5 — Nút Nâng cấp (plan không có phases) >> Plan không có phases → hiện nút Nâng cấp, không có .nk-pline
- Location: tests\nhatky.spec.js:155:3

# Error details

```
Error: page.evaluate: ReferenceError: navigateToDetail is not defined
    at eval (eval at evaluate (:311:30), <anonymous>:3:5)
    at UtilityScript.evaluate (<anonymous>:313:16)
    at UtilityScript.<anonymous> (<anonymous>:1:44)
```

# Page snapshot

```yaml
- generic [ref=e2]:
  - banner [ref=e3]:
    - generic [ref=e4]: 🗂
    - generic [ref=e5]:
      - generic [ref=e6]: Công việc
      - generic [ref=e7]: Hôm nay
    - button "Dark/Light mode" [ref=e8] [cursor=pointer]: 🌙
    - generic "Tài khoản" [ref=e9] [cursor=pointer]: H
  - main [ref=e10]:
    - generic [ref=e11]:
      - generic [ref=e12]:
        - generic [ref=e13]: 🔍
        - searchbox "Tìm việc, người..." [ref=e14]
      - generic [ref=e15] [cursor=pointer]: Hôm nay ▾
    - generic [ref=e16]:
      - button "Công việc" [ref=e17] [cursor=pointer]
      - button "📅 Kế hoạch" [ref=e18] [cursor=pointer]
      - button "✅ Checklist" [ref=e19] [cursor=pointer]
  - navigation [ref=e20]:
    - link "🗂 Công việc" [ref=e21] [cursor=pointer]:
      - /url: "#"
      - generic [ref=e22]: 🗂
      - generic [ref=e23]: Công việc
    - link "👥 Danh bạ" [ref=e24] [cursor=pointer]:
      - /url: ../danhba.html
      - generic [ref=e25]: 👥
      - generic [ref=e26]: Danh bạ
    - button "Thêm việc mới" [ref=e28] [cursor=pointer]: ＋
    - link "📊 Báo cáo" [ref=e29] [cursor=pointer]:
      - /url: "#"
      - generic [ref=e30]: 📊
      - generic [ref=e31]: Báo cáo
    - link "👤 Cá nhân" [ref=e32] [cursor=pointer]:
      - /url: "#"
      - generic [ref=e33]: 👤
      - generic [ref=e34]: Cá nhân
```