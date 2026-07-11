# Dữ liệu đồng hồ từ DanhSachDongHo.ods

Thư mục này chứa danh sách đồng hồ đã trích xuất từ file:

`C:\Users\vitmo.WINDOWS11PRO\OneDrive - hapucomplex\03_TL\00_Golf\09_VANHANH\01_CoDien\01_Dien\05_ChotChiSo\DanhSachDongHo.ods`

## File xuất ra

- `meter-points-google-sheet.csv`: file import trực tiếp vào sheet `MeterPoints` của Google Sheet.
- `meter-points-with-qr.csv`: danh sách đầy đủ hơn, có thêm `SerialNumber`, `MeasureMode`, `QrUrl`.
- `meter-points.json`: dữ liệu cho trang `print-meter-qr.html` sinh tem QR để in.

## Cách import vào Google Sheet

Trạng thái hiện tại: đã ghi trực tiếp 22 đồng hồ lên Google Sheet cloud qua Apps Script deployment `AKfycbzw04m0_pE6dfFfvcR0H--kEXBo-yBWasZScimucw_y6xlTuZR7pM4UUlSV4vzHjfVi` ngày 2026-06-28.

1. Mở Google Sheet đang làm backend cho Apps Script.
2. Tạo hoặc mở sheet tên `MeterPoints`.
3. Import file `meter-points-google-sheet.csv`.
4. Chọn import từ ô `A1` hoặc thay thế nội dung sheet `MeterPoints`.

Cột dữ liệu theo đúng chuẩn hiện tại:

```text
MeterID,Type,Name,Location,Multiplier,Threshold,Unit,Notes,LastReading,LastDate
```

## In tem QR

Mo trang:

```text
https://bandien.github.io/scan/print-meter-qr.html
```

Nếu chạy local để kiểm tra:

```powershell
cd D:\Claude\1_Projects\scan\02_Source
python -m http.server 8089
```

Sau đó mở:

```text
http://localhost:8089/print-meter-qr.html
```
