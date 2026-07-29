// Mẫu tối thiểu đi kèm frontend để Checklist vẫn khởi động khi lần đầu mở offline.
// Dữ liệu từ getGolfTemplates luôn thay thế danh sách này khi backend khả dụng.
(function (global) {
  'use strict';

  const section = (templateId, templateName, code, title, items) =>
    items.map((item, index) => ({
      templateId, templateName, section: code, sectionTitle: title,
      itemId: item[0], order: index + 1, label: item[1],
      inputType: item[2] || 'check', fields: item[3] || [],
      unit: item[4] || '', threshold: item[5] || '', note: item[6] || ''
    }));

  const morning = 'Ca Sáng (5h00 – 13h00)';
  const evening = 'Ca Tối (13h00 – 21h00)';
  global.BD_GOLF_FALLBACK_TEMPLATES = [
    ...section('ca_sang', morning, 'A', 'Nhận ca & kiểm tra nước', [
      ['A01', 'Nhận bàn giao từ ca tối — ghi nhận tình trạng'],
      ['A02', 'Kiểm tra mức nước bể ngầm CLH — ≥ 50%', 'number', [], 'cm'],
      ['A03', 'Kiểm tra mức nước bể mái CLH — ≥ 50%', 'number', [], 'cm'],
      ['A04', 'Kiểm tra bể ngầm nhà bảo dưỡng', 'number', [], 'cm'],
      ['A05', 'Kiểm tra bể ngầm nhà tập', 'number', [], 'cm'],
      ['A06', 'Kiểm tra bể nước nhà chòi vườn', 'number', [], 'cm'],
      ['A07', 'Kiểm tra bể nước nhà xe', 'number', [], 'cm'],
      ['A08', 'Vận hành bơm tăng áp sinh hoạt CLH'],
      ['A09', 'Kiểm tra và mở vận hành 3 suối trang trí'],
      ['A10', 'Kiểm tra mức nước 5 hồ'],
      ['A11', 'Kiểm tra và vận hành bơm hồ']
    ]),
    ...section('ca_sang', morning, 'B', 'Điện & chiếu sáng', [
      ['B01', 'Kiểm tra nhiệt độ hệ thống gia nhiệt — > 45°C', 'number', [], '°C', 'min:45'],
      ['B02', 'Đèn sân golf 18 hố — đã tắt hoàn toàn'],
      ['B03', 'Đèn LED hắt trang trí CLH hoạt động đúng lịch'],
      ['B04', 'Đèn hành lang, sảnh CLH — đã tắt hoàn toàn'],
      ['B05', 'Đồng hồ hẹn giờ sạc xe — đã cắt lúc 6h00']
    ]),
    ...section('ca_sang', morning, 'C', 'Đóng ca & bàn giao', [
      ['C01', 'Ghi nhật ký sự cố phát sinh trong ca sáng', 'text'],
      ['C02', 'Nội dung bàn giao đề nghị ca chiều thực hiện', 'text']
    ]),
    ...section('ca_toi', evening, 'A', 'Nhận ca & vận hành', [
      ['A01', 'Nhận bàn giao từ ca sáng — ghi nhận tình trạng'],
      ['A02', 'Kiểm tra bể ngầm CLH — ≥ 50%', 'number', [], 'cm'],
      ['A03', 'Kiểm tra bể mái CLH — ≥ 50%', 'number', [], 'cm'],
      ['A04', 'Kiểm tra bể ngầm nhà bảo dưỡng', 'number', [], 'cm'],
      ['A05', 'Kiểm tra bể ngầm nhà tập & nhà xe', 'number', [], 'cm'],
      ['A06', 'Tắt vận hành 3 suối trang trí'],
      ['A07', 'Kiểm tra mức nước 5 hồ'],
      ['A08', 'Kiểm tra và vận hành bơm hồ'],
      ['A09', 'Kiểm tra nhiệt độ hệ thống gia nhiệt — > 45°C', 'number', [], '°C', 'min:45'],
      ['A10', 'Kiểm tra đèn LED hắt trang trí CLH'],
      ['A11', 'Kiểm tra đèn chiếu sáng hành lang, sảnh CLH'],
      ['A12', 'Ghi số hiệu cột đèn hoặc đèn hỏng trên sân', 'text'],
      ['A13', 'Xác nhận tủ hẹn giờ sẽ đóng điện sạc lúc 22h00']
    ]),
    ...section('ca_toi', evening, 'B', 'Đóng ca & bàn giao', [
      ['B01', 'Tắt các thiết bị điện không cần thiết sau 21h00'],
      ['B02', 'Ghi nhật ký sự cố phát sinh trong ca chiều', 'text'],
      ['B03', 'Nội dung bàn giao đề nghị ca sáng thực hiện', 'text']
    ]),
    ...section('tuan', 'Kiểm Tra Tuần (thứ Hai)', 'A', 'Kiểm tra tuần', [
      ['A01', 'Đo điện áp 3 pha tủ MSB', 'number', [], 'V'],
      ['A02', 'Đo dòng tải MBA', 'number', [], '%Iđm'],
      ['A03', 'Kiểm tra tiếp điểm contactor tủ hẹn giờ sạc xe'],
      ['A04', 'Kiểm tra hạn kiểm định dụng cụ an toàn điện']
    ]),
    ...section('thang', 'Kiểm Tra Tháng (ngày 1)', 'A', 'Kiểm tra tháng', [
      ['A01', 'Đo điện trở nối đất hệ thống — ≤ 4 Ω', 'number', [], 'Ω', 'max:4'],
      ['A02', 'Đo kháng cách điện tuyến cáp chính — ≥ 1 MΩ', 'number', [], 'MΩ', 'min:1'],
      ['A03', 'Kiểm tra nhiệt độ cuộn dây MBA — ≤ 80°C', 'number', [], '°C', 'max:80'],
      ['A04', 'Vệ sinh tủ điện chính — thổi bụi, siết đầu cốt']
    ])
  ];
})(window);
