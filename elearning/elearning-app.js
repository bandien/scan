/**
 * E-Learning & Sát Hạch Cơ Điện (M&E Training & Assessment Engine)
 * Tổ Cơ Điện Sân Golf • BanDienScan
 */

const DEFAULT_COURSES = [
  {
    id: 'course_safety',
    topic: 'safety',
    badge: 'Chuyên đề 1 • Bắt Buộc',
    color: 'rose',
    icon: 'shield-alert',
    sopCode: 'SOP-ANTOAN-01',
    title: 'An Toàn Lao Động, Cắt Điện Cô Lập (LOTO) & Cứu Hộ Khẩn Cấp',
    summary: 'Quy chuẩn an toàn sống còn khi thao tác cơ điện, quy trình 5 bước cắt điện LOTO, xử lý sự cố người bị điện giật và hotline ứng cứu khẩn cấp.',
    target: 'Bảo đảm an toàn tuyệt đối tính mạng nhân viên kỹ thuật khi bảo dưỡng, sửa chữa cơ điện tại hiện trường.',
    safetyWarning: 'TUYỆT ĐỐI KHÔNG LÀM VIỆC MỘT MÌNH KHI THAO TÁC ĐIỆN 3 PHA HOẶC TRONG KHÔNG GIAN KÍN/ẨM ƯỚT.',
    theoryPoints: [
      '<b>Quy tắc 5 bước cắt điện an toàn (LOTO):</b> (1) Cắt nguồn hoàn toàn -> (2) Khóa và treo biển cảnh báo LOTO -> (3) Thử hết điện bằng bút/đồng hồ chuẩn -> (4) Tiếp đất di động -> (5) Đặt rào chắn khu vực làm việc.',
      '<b>Thiết bị chống dòng rò (ELCB / RCD):</b> Phải kiểm tra nút Test định kỳ hàng tháng; ngưỡng tác động 30mA bảo vệ người, 100-300mA chống cháy nổ.',
      '<b>Cứu hộ người bị điện giật:</b> Tuyệt đối không chạm tay trần vào nạn nhân; nhanh chóng ngắt cầu dao tổng hoặc dùng vật cách điện khô gạt nguồn; tiến hành hô hấp nhân tạo nếu nạn nhân ngưng thở.',
      '<b>Hotline Khẩn Cấp:</b> Cấp cứu 115 • PCCC 114 • Điều độ Điện lực 1900.6769 • Trưởng Ban M&E.'
    ],
    practicalChecklist: [
      'Kiểm tra đầy đủ PPE (mũ, giày cách điện, găng tay cách điện hạ thế) trước khi mở tủ điện.',
      'Treo thẻ cảnh báo "CẤM ĐÓNG ĐIỆN - CÓ NGƯỜI ĐANG LÀM VIỆC" tại đúng aptomat cấp nguồn.',
      'Đo kiểm tra điện áp bằng đồng hồ VOM/bút thử điện tại cả 3 pha trước khi chạm vào dây dẫn.'
    ]
  },
  {
    id: 'course_tba',
    topic: 'tba',
    badge: 'Chuyên đề 2 • Trạm Điện',
    color: 'amber',
    icon: 'zap',
    sopCode: 'SOP-TBA-01',
    title: 'Vận Hành & Kiểm Tra Định Kỳ Trạm Biến Áp (TBA) 22/0.4kV',
    summary: 'Quy chuẩn kiểm tra nhiệt độ tiếp xúc máy biến áp, độ cân bằng pha, hệ số công suất Cosφ, mức dầu cách điện và an toàn phòng trạm.',
    target: 'Duy trì hệ thống phân phối điện 22kV / 0.4kV liên tục, an toàn, phát hiện sớm điểm phát nhiệt và nguy cơ sự cố.',
    safetyWarning: 'Bắt buộc trang bị găng tay cách điện hạ thế và giày bảo hộ. Không chạm tay vào thanh cái mang điện.',
    theoryPoints: [
      '<b>Nhiệt độ tiếp xúc:</b> Dùng súng đo nhiệt hồng ngoại kiểm tra đầu cốt MBA và đầu cáp tổng; nhiệt độ yêu cầu ≤ 65°C, không có điểm nóng cục bộ.',
      '<b>Thông số điện áp 3 pha:</b> Duy trì ở mức 380V ± 5% (khoảng 361V – 399V), tần số 50Hz ± 0.2Hz.',
      '<b>Độ lệch pha dòng điện:</b> Chênh lệch dòng điện giữa các pha không được vượt quá 15%.',
      '<b>Tủ tụ bù công suất:</b> Hệ số công suất Cosφ phải duy trì ≥ 0.92 để tối ưu hóa lưới điện và không bị điện lực phạt.',
      '<b>Mức dầu máy biến áp:</b> Phải nằm giữa vạch Min-Max của ống thủy; không có hiện tượng rò rỉ dầu tại các van và gioăng sứ.'
    ],
    practicalChecklist: [
      'Kiểm tra phòng trạm: đảm bảo khô ráo, quạt thông gió chạy tốt, cửa lưới chống chuột kín khít.',
      'Ghi chép thông số điện áp 3 pha (Uab, Ubc, Uca) và dòng điện 3 pha (Ia, Ib, Ic) vào nhật ký.',
      'Kiểm tra các cấp tụ bù tự động đóng ngắt êm ái, bình tụ không bị phồng rộp hay xì dầu.'
    ]
  },
  {
    id: 'course_pump',
    topic: 'pump',
    badge: 'Chuyên đề 3 • Cấp Nước',
    color: 'blue',
    icon: 'droplets',
    sopCode: 'SOP-FORMS-01',
    title: 'Vận Hành Trạm Bơm Tăng Áp, Bơm Suối Cun & PCCC',
    summary: 'Giám sát áp lực đường ống 4.0 - 5.5 bar, cài đặt biến tần GD200A, mực nước bể ngầm, máy bơm chữa cháy diesel và bơm tuần hoàn Suối Cun.',
    target: 'Bảo đảm cấp nước sinh hoạt, tưới sân golf và sẵn sàng PCCC 24/7 không bị gián đoạn.',
    safetyWarning: 'Không vận hành máy bơm khi cạn nước mồi hoặc họng hút bị tắc nghẽn (cháy phớt, bó cánh bơm).',
    theoryPoints: [
      '<b>Áp lực vận hành:</b> Duy trì áp lực đường ống cấp nước ổn định từ 4.0 bar đến 5.5 bar.',
      '<b>Biến tần điều khiển:</b> Biến tần INVT GD200A điều khiển động cơ bám sát áp suất cài đặt từ cảm biến áp suất 4-20mA.',
      '<b>Khung giờ kiểm tra Bơm Suối Cun:</b> Ca 1 (12h30–13h30), Ca 2 (16h15–17h15), Ca 3 (22h00–23h00 và 04h30–05h30).',
      '<b>Máy bơm PCCC Diesel:</b> Kiểm tra mức dầu nhớt bôi trơn, nước làm mát két nước, dầu diesel trong thùng và điện áp ắc quy khởi động (≥ 24V).'
    ],
    practicalChecklist: [
      'Quan sát đồng hồ đo áp lực trạm bơm tăng áp, ghi nhận số đo thực tế vào Form Checklist.',
      'Kiểm tra rò rỉ tại cổ phớt bơm, van một chiều, khớp nối mềm và độ rung lắc động cơ.',
      'Ghi nhận trạng thái bơm Suối Cun: Không chạy / Tự động / Giờ bật / Giờ tắt theo quy định.'
    ]
  },
  {
    id: 'course_lighting',
    topic: 'lighting',
    badge: 'Chuyên đề 4 • Vận Hành',
    color: 'amber',
    icon: 'timer',
    sopCode: 'SOP-HENGIO-01',
    title: 'Hệ Thống Chiếu Sáng Sân Golf, Tủ Điện Ngoài Trời & Hẹn Giờ',
    summary: 'Quy chuẩn tủ điện ngoài trời IP65, khoanh vùng CB nhảy sau mưa, đối chiếu danh sách 314 lộ công cộng & 197 lộ văn phòng theo mùa.',
    target: 'Vận hành đúng khung giờ tiết giảm năng lượng, bảo đảm thẩm mỹ cảnh quan và an toàn chiếu sáng đêm.',
    safetyWarning: 'Sau các trận mưa lớn, bắt buộc đo kiểm tra cách điện trước khi đóng lại aptomat các lộ ngầm.',
    theoryPoints: [
      '<b>Tủ điện ngoài trời:</b> Vỏ tủ đạt chuẩn IP65, gioăng cao su kín khít, dây tiếp địa vỏ tủ tiếp xúc tốt, có ELCB chống rò.',
      '<b>Xử lý CB nhảy sau mưa:</b> Không cố đóng lại CB nhiều lần; phải cách ly nhánh rẽ, kiểm tra nước đọng trong hộp nối chân cột, đo điện trở cách điện Megohmmeter.',
      '<b>Lịch kiểm tra hẹn giờ (Timer):</b> Thực hiện vào Ca 3 ngày Chủ Nhật hàng tuần.',
      '<b>Độ chính xác rơ-le thời gian:</b> Chỉ cho phép sai lệch < 1 phút so với giờ chuẩn, đúng thứ trong tuần.',
      '<b>Quy tắc đóng ngắt văn phòng:</b> Đóng điện trước giờ làm việc 30 phút, ngắt điện sau giờ làm việc 60 phút.'
    ],
    practicalChecklist: [
      'Đối chiếu giờ cài đặt của rơ-le thời gian với danh sách DS.01.BD (công cộng) và DS.02.BD (văn phòng).',
      'Kiểm tra công tắc chuyển mạch Auto / Manual tại tủ điều khiển chiếu sáng sân tập golf.',
      'Ghi nhận các đồng hồ bị lệch giờ, chạy chậm pin hoặc hỏng hóc để thay thế kịp thời.'
    ]
  },
  {
    id: 'course_meter',
    topic: 'meter',
    badge: 'Chuyên đề 5 • Đo Lường',
    color: 'emerald',
    icon: 'gauge',
    sopCode: 'SOP-CONGTO-01',
    title: 'Chốt Công Tơ Điện Nước & Quản Lý Sản Lượng Bằng Web App',
    summary: 'Quy trình đọc chỉ số công tơ điện tổng, biến dòng TI, đồng hồ nước tưới, nhập Web App chốt số và đối chiếu bảng Google Sheets.',
    target: 'Chốt chính xác 100% sản lượng tiêu thụ định kỳ cuối tháng, ngăn ngừa thất thoát nước và rò rỉ điện.',
    safetyWarning: 'Cẩn trọng khi tiếp cận tủ đo đếm có biến dòng TI đang mang điện; không được hở mạch thứ cấp của biến dòng.',
    theoryPoints: [
      '<b>Thời điểm chốt số:</b> Định kỳ ngày cuối cùng của tháng (hoặc ngày điện lực thông báo chốt chỉ số).',
      '<b>Công thức tính sản lượng công tơ TI:</b> Sản lượng (kWh) = (Chỉ số mới - Chỉ số cũ) × Hệ số nhân biến dòng TI.',
      '<b>Nhập số liệu:</b> Sử dụng ứng dụng Web App chuyên dụng để tự động tính toán chênh lệch sản lượng tiêu thụ.',
      '<b>Xử lý bất thường:</b> Nếu sản lượng tăng vọt hoặc giảm bất thường (>30%), phải kiểm tra rò rỉ đường ống hoặc kẹt công tơ và chụp ảnh mặt số lưu trữ.'
    ],
    practicalChecklist: [
      'Đọc và ghi nhận chỉ số công tơ điện tổng TBA và các lộ phụ tải độc lập.',
      'Chụp ảnh sắc nét mặt số đồng hồ nước và chỉ số điện để lưu trữ đối chiếu.',
      'Kiểm tra số liệu đã đồng bộ thành công vào Google Sheets tổng hợp điện nước sân golf.'
    ]
  },
  {
    id: 'course_schematic',
    topic: 'schematic',
    badge: 'Chuyên đề 6 • Kỹ Năng',
    color: 'indigo',
    icon: 'cpu',
    sopCode: 'SOP-GOLF-01',
    title: 'Đọc Hiểu Bản Vẽ Điều Khiển, Khí Cụ Đóng Cắt & Động Cơ 3 Pha',
    summary: 'Cách đọc nameplate động cơ (đấu Sao / Tam giác), nguyên lý mạch khởi động Contactor - Rơ-le nhiệt, sơ đồ tủ ATS máy phát điện.',
    target: 'Nâng cao năng lực tư duy khoanh vùng sự cố điện, sửa chữa nhanh và thay thế thiết bị đúng quy chuẩn kỹ thuật.',
    safetyWarning: 'Trước khi đấu nối động cơ, phải kiểm tra đúng điện áp nguồn và kiểu đấu dây (Δ hay Y) trên nhãn động cơ.',
    theoryPoints: [
      '<b>Nameplate động cơ:</b> Ghi "220V/380V - Δ/Y" nghĩa là ở lưới điện 3 pha 380V phải đấu hình Sao (Y). Ghi "380V/660V - Δ/Y" thì đấu Tam giác (Δ).',
      '<b>Tiếp điểm rơ-le nhiệt:</b> Cặp tiếp điểm 95-96 là thường đóng (NC) đưa vào mạch điều khiển ngắt cuộn hút; cặp 97-98 là thường mở (NO) dùng báo đèn sự cố (Trip).',
      '<b>Cuộn hút Contactor:</b> Kiểm tra đúng điện áp cuộn hút (Coil Voltage: 220VAC hoặc 24VDC, 380VAC) trước khi thay thế.',
      '<b>Sự cố máy phát không đề được:</b> Kiểm tra bình ắc quy đề (phải đủ 12.5V - 26V), cầu chì mạch sạc tự động và công tắc dừng khẩn cấp (Emergency Stop).'
    ],
    practicalChecklist: [
      'Đối chiếu ký hiệu bản vẽ với số dây đánh dấu thực tế trên hàng kẹp terminal tủ điện.',
      'Kiểm tra giá trị cài đặt dòng tác động trên rơ-le nhiệt phải phù hợp với dòng định mức (In) của động cơ.',
      'Kiểm tra tiếng hút contactor dứt khoát, không bị rè hoặc phát sinh hồ quang lớn.'
    ]
  }
];

const DEFAULT_QUESTIONS = [
  // An Toàn & LOTO (5 câu)
  {
    id: 'q_safe_1',
    topic: 'safety',
    topicName: '🛡️ An Toàn & LOTO',
    question: 'Quy trình 5 bước cắt điện an toàn (LOTO) theo tiêu chuẩn kỹ thuật gồm thứ tự nào sau đây?',
    options: [
      'Cắt nguồn -> Thử hết điện -> Khóa LOTO -> Tiếp đất -> Rào chắn',
      'Cắt nguồn hoàn toàn -> Khóa và treo biển LOTO -> Thử hết điện -> Tiếp đất di động -> Đặt rào chắn khu vực làm việc',
      'Khóa LOTO -> Cắt nguồn -> Tiếp đất -> Thử hết điện -> Làm việc',
      'Cắt nguồn -> Đặt rào chắn -> Khóa LOTO -> Thử hết điện'
    ],
    correct: 1,
    explain: 'Theo SOP-ANTOAN-01: Bắt buộc cắt nguồn trước, sau đó khóa và treo thẻ biển cảnh báo LOTO, tiếp theo thử kiểm tra hết điện, lắp tiếp đất di động và căng dây rào chắn khu vực.',
    sopRef: 'SOP-ANTOAN-01'
  },
  {
    id: 'q_safe_2',
    topic: 'safety',
    topicName: '🛡️ An Toàn & LOTO',
    question: 'Khi phát hiện một người bị điện giật tại hiện trường ẩm ướt, hành động ĐẦU TIÊN của kỹ thuật viên là gì?',
    options: [
      'Lao vào kéo ngay nạn nhân ra khỏi vùng nguy hiểm',
      'Tát nước hoặc gọi to để nạn nhân tỉnh lại',
      'Ngắt ngay nguồn điện tổng hoặc dùng vật cách điện khô gạt dây điện, không chạm tay trần vào nạn nhân',
      'Chạy đi tìm tủ sơ cứu lấy gạc'
    ],
    correct: 2,
    explain: 'Nguyên tắc an toàn cứu nạn: Người cứu hộ tuyệt đối không chạm trực tiếp vào nạn nhân khi chưa cắt nguồn hoặc chưa tách nạn nhân khỏi nguồn điện bằng vật cách điện khô.',
    sopRef: 'SOP-ANTOAN-01'
  },
  {
    id: 'q_safe_3',
    topic: 'safety',
    topicName: '🛡️ An Toàn & LOTO',
    question: 'Quy định làm việc an toàn khi thao tác đóng cắt điện 3 pha cao áp hoặc trong không gian kín (hố bơm, bể ngầm) là:',
    options: [
      'Chỉ cần 1 kỹ thuật viên có kinh nghiệm thao tác là đủ',
      'Bắt buộc tối thiểu 2 người (1 người thao tác kỹ thuật, 1 người giám sát an toàn)',
      'Làm việc lúc nào thuận tiện, không cần báo cáo ca trực',
      'Chỉ cần mang điện thoại để gọi khi có sự cố'
    ],
    correct: 1,
    explain: 'Quy chuẩn an toàn lao động quy định bắt buộc phải có tối thiểu 2 người để kịp thời hỗ trợ và xử lý cứu nạn khẩn cấp khi có rủi ro.',
    sopRef: 'SOP-ANTOAN-01'
  },
  {
    id: 'q_safe_4',
    topic: 'safety',
    topicName: '🛡️ An Toàn & LOTO',
    question: 'Thiết bị chống dòng rò (ELCB / RCD) lắp trong tủ điện có chức năng quan trọng nhất là gì?',
    options: [
      'Bảo vệ chống sét lan truyền',
      'Tăng điện áp cho các bóng đèn chiếu sáng',
      'Tự động ngắt mạch khi phát hiện dòng điện rò ra vỏ thiết bị hoặc tiếp đất để bảo vệ tính mạng con người',
      'Đo đếm điện năng tiêu thụ'
    ],
    correct: 2,
    explain: 'ELCB/RCD phát hiện dòng điện rò không cân bằng giữa dây pha và dây trung tính để ngắt nguồn tức thì, ngăn ngừa điện giật nguy hiểm.',
    sopRef: 'SOP-ANTOAN-01'
  },
  {
    id: 'q_safe_5',
    topic: 'safety',
    topicName: '🛡️ An Toàn & LOTO',
    question: 'Khi làm việc gần hố bơm nước hoặc trạm xử lý nước thải ngoài trời, trang bị bảo hộ cá nhân (PPE) nào là bắt buộc?',
    options: [
      'Dép lê và áo cộc tay',
      'Giày bảo hộ cách điện chống trơn trượt, găng tay cách điện phù hợp, mũ bảo hộ',
      'Chỉ cần đeo kính râm chống nắng',
      'Không cần trang bị nếu thời tiết đẹp'
    ],
    correct: 1,
    explain: 'Khu vực ẩm ướt gia tăng nguy cơ trơn trượt và truyền điện, bắt buộc phải có giày cách điện đế chống trượt và găng tay cách điện.',
    sopRef: 'SOP-ANTOAN-01'
  },

  // Trạm Biến Áp (TBA) (5 câu)
  {
    id: 'q_tba_1',
    topic: 'tba',
    topicName: '⚡ Trạm Biến Áp TBA',
    question: 'Nhiệt độ tiếp xúc tối đa cho phép tại các đầu cốt máy biến áp và đầu cáp tổng khi đo bằng súng nhiệt hồng ngoại là bao nhiêu?',
    options: [
      '≤ 40°C',
      '≤ 65°C và không có điểm nóng cục bộ bất thường',
      '≤ 95°C',
      'Không giới hạn nhiệt độ'
    ],
    correct: 1,
    explain: 'Theo SOP-TBA-01: Nhiệt độ đầu cốt điểm nối máy biến áp và cáp điện yêu cầu ≤ 65°C. Nhiệt độ cao hơn báo hiệu lỏng đầu cốt hoặc quá tải cục bộ.',
    sopRef: 'SOP-TBA-01'
  },
  {
    id: 'q_tba_2',
    topic: 'tba',
    topicName: '⚡ Trạm Biến Áp TBA',
    question: 'Điện áp 3 pha cấp từ trạm biến áp hạ thế quy định duy trì trong dải nào sau đây?',
    options: [
      '220V ± 20%',
      '380V ± 5% (khoảng 361V – 399V) và tần số 50Hz',
      '450V ± 10%',
      '300V – 350V'
    ],
    correct: 1,
    explain: 'Tiêu chuẩn điện áp 3 pha hạ thế tại Việt Nam là 380V ± 5%, tần số định mức 50Hz để thiết bị vận hành bền bỉ.',
    sopRef: 'SOP-TBA-01'
  },
  {
    id: 'q_tba_3',
    topic: 'tba',
    topicName: '⚡ Trạm Biến Áp TBA',
    question: 'Độ lệch dòng điện giữa các pha (lệch pha) tại máy biến áp không được vượt quá bao nhiêu phần trăm?',
    options: [
      'Không vượt quá 15% giữa pha cao nhất và pha thấp nhất',
      'Không vượt quá 50%',
      'Bao nhiêu cũng được',
      'Không vượt quá 1%'
    ],
    correct: 0,
    explain: 'Quy chuẩn vận hành máy biến áp: độ lệch dòng giữa các pha không vượt quá 15% để tránh dòng điện chạy trên dây trung tính lớn và gây nóng máy.',
    sopRef: 'SOP-TBA-01'
  },
  {
    id: 'q_tba_4',
    topic: 'tba',
    topicName: '⚡ Trạm Biến Áp TBA',
    question: 'Hệ số công suất Cosφ tại tủ tụ bù hạ thế trạm biến áp cần duy trì ở mức tối thiểu bao nhiêu để không bị phạt?',
    options: [
      'Cosφ ≥ 0.50',
      'Cosφ ≥ 0.70',
      'Cosφ ≥ 0.92',
      'Cosφ = 0.80'
    ],
    correct: 2,
    explain: 'Quy định của ngành Điện lực: khách hàng sử dụng điện phải duy trì hệ số công suất Cosφ ≥ 0.92, nếu dưới 0.90 sẽ bị tính tiền mua công suất phản kháng.',
    sopRef: 'SOP-TBA-01'
  },
  {
    id: 'q_tba_5',
    topic: 'tba',
    topicName: '⚡ Trạm Biến Áp TBA',
    question: 'Khi kiểm tra máy biến áp ngâm dầu, mức dầu báo trên ống thủy phải nằm ở vị trí nào?',
    options: [
      'Tràn ra ngoài miệng nắp',
      'Dưới vạch Min',
      'Nằm giữa vạch Min và Max theo nhiệt độ môi trường, không rò rỉ dầu',
      'Bao nhiêu cũng được'
    ],
    correct: 2,
    explain: 'Mức dầu phải nằm giữa vạch Min và Max; nếu hụt dầu dưới Min sẽ giảm khả năng cách điện và giải nhiệt cuộn dây.',
    sopRef: 'SOP-TBA-01'
  },

  // Trạm Bơm & PCCC (5 câu)
  {
    id: 'q_pump_1',
    topic: 'pump',
    topicName: '💧 Trạm Bơm & Suối Cun',
    question: 'Áp lực nước đường ống cấp nước tăng áp tại Sân Golf tiêu chuẩn cần duy trì ổn định trong khoảng nào?',
    options: [
      '1.0 – 2.0 bar',
      '4.0 – 5.5 bar',
      '8.0 – 10.0 bar',
      '15.0 – 20.0 bar'
    ],
    correct: 1,
    explain: 'Theo SOP-FORMS-01: Áp lực mạng lưới đường ống cấp nước sinh hoạt và tưới sân golf duy trì từ 4.0 đến 5.5 bar.',
    sopRef: 'SOP-FORMS-01'
  },
  {
    id: 'q_pump_2',
    topic: 'pump',
    topicName: '💧 Trạm Bơm & Suối Cun',
    question: 'Khi động cơ bơm tăng áp đang chạy nhưng áp lực trên đồng hồ không tăng, việc đầu tiên cần kiểm tra là gì?',
    options: [
      'Cắt dây điện động cơ',
      'Kiểm tra mực nước bể ngầm, van hút/xả, chiều quay động cơ và kiểm tra e-mồi bơm',
      'Thay ngay máy bơm mới',
      'Bỏ qua không kiểm tra'
    ],
    correct: 1,
    explain: 'Bơm chạy không lên áp thường do: hụt nước mồi, kẹt bọt khí (e-mồi), bể ngầm cạn nước, van hút chưa mở hoặc động cơ quay ngược chiều.',
    sopRef: 'SOP-FORMS-01'
  },
  {
    id: 'q_pump_3',
    topic: 'pump',
    topicName: '💧 Trạm Bơm & Suối Cun',
    question: 'Khung giờ quy định kiểm tra định kỳ tình trạng vận hành bơm Suối Cun theo ca trực là:',
    options: [
      'Chỉ kiểm tra lúc rảnh',
      'Ca 1 (12h30–13h30), Ca 2 (16h15–17h15), Ca 3 (22h00–23h00 và 04h30–05h30)',
      'Mỗi ngày kiểm tra 1 lần vào buổi trưa',
      'Chỉ kiểm tra khi nhận được phản ánh'
    ],
    correct: 1,
    explain: 'Quy chuẩn Checklist vận hành yêu cầu kiểm tra 4 thời điểm cố định trong ngày để ghi nhận trạng thái bơm Suối Cun.',
    sopRef: 'SOP-FORMS-01'
  },
  {
    id: 'q_pump_4',
    topic: 'pump',
    topicName: '💧 Trạm Bơm & Suối Cun',
    question: 'Máy bơm chữa cháy PCCC động cơ Diesel cần được kiểm tra định kỳ những hạng mục nào trước khi chạy thử?',
    options: [
      'Mức dầu nhớt bôi trơn, nước làm mát két nước, mức dầu diesel và điện áp bình ắc quy đề',
      'Chỉ cần kiểm tra màu sơn máy',
      'Chỉ cần lau bụi vỏ máy',
      'Không cần kiểm tra gì cả'
    ],
    correct: 0,
    explain: 'Động cơ diesel yêu cầu phải có đủ dầu bôi trơn, nước làm mát, nhiên liệu dầu diesel và ắc quy đề đủ điện áp để khởi động ngay khi có báo cháy.',
    sopRef: 'SOP-FORMS-01'
  },
  {
    id: 'q_pump_5',
    topic: 'pump',
    topicName: '💧 Trạm Bơm & Suối Cun',
    question: 'Chức năng chính của biến tần (ví dụ INVT GD200A) trong trạm bơm tăng áp là gì?',
    options: [
      'Biến đổi nước thành điện',
      'Điều khiển thay đổi tốc độ quay của động cơ theo áp suất hồi tiếp để giữ áp lực ổn định và tiết kiệm điện',
      'Thay thế công tơ đo điện',
      'Làm nóng nước sinh hoạt'
    ],
    correct: 1,
    explain: 'Biến tần điều chỉnh tần số nguồn cấp cho động cơ bơm theo tín hiệu cảm biến áp suất, đảm bảo áp lực nước luôn ổn định khi nhu cầu dùng nước thay đổi.',
    sopRef: 'SOP-FORMS-01'
  },

  // Chiếu Sáng & Hẹn Giờ (5 câu)
  {
    id: 'q_light_1',
    topic: 'lighting',
    topicName: '⏱️ Chiếu Sáng & Hẹn Giờ',
    question: 'Tiêu chuẩn cấp bảo vệ chống bụi và nước tối thiểu cho các tủ điện phân phối đặt ngoài trời sân tập golf là:',
    options: [
      'IP20 (chỉ dùng trong nhà)',
      'IP40',
      'IP65 (chống bụi hoàn toàn và chống nước phun từ mọi hướng)',
      'IP00'
    ],
    correct: 2,
    explain: 'Tủ điện ngoài trời chịu mưa bão trực tiếp phải đạt cấp bảo vệ tối thiểu IP65 và có gioăng cao su chống nước xâm nhập.',
    sopRef: 'SOP-GOLF-01'
  },
  {
    id: 'q_light_2',
    topic: 'lighting',
    topicName: '⏱️ Chiếu Sáng & Hẹn Giờ',
    question: 'Khi một nhánh chiếu sáng sân golf bị nhảy Aptomat (CB) liên tục sau cơn mưa lớn, quy trình xử lý đúng là:',
    options: [
      'Dùng băng keo giữ chặt cần gạt CB không cho nhảy',
      'Thay thế bằng CB có dòng định mức lớn gấp 5 lần',
      'Ngắt nguồn, cách ly từng cụm đèn, kiểm tra nước đọng trong hộp nối ngầm, đo điện trở cách điện trước khi đóng lại',
      'Bỏ mặc nhánh đèn đó'
    ],
    correct: 2,
    explain: 'Nhảy CB sau mưa thường do ngấm nước vào hộp nối ngầm hoặc đèn rò điện. Tuyệt đối không được cố ép đóng CB khi chưa cô lập điểm rò.',
    sopRef: 'SOP-HENGIO-01'
  },
  {
    id: 'q_light_3',
    topic: 'lighting',
    topicName: '⏱️ Chiếu Sáng & Hẹn Giờ',
    question: 'Thời gian thực hiện kiểm tra đồng hồ hẹn giờ (Timer) định kỳ toàn bộ khu vực theo quy định SOP là vào ca nào?',
    options: [
      'Ca 1 ngày Thứ Hai',
      'Ca 3 ngày Chủ Nhật hàng tuần (đi cùng sổ hẹn giờ văn phòng)',
      'Mỗi năm kiểm tra một lần',
      'Khi nào đèn không sáng mới kiểm tra'
    ],
    correct: 1,
    explain: 'Theo SOP-HENGIO-01: Quy định kiểm tra toàn bộ đồng hồ hẹn giờ vào Ca 3 ngày Chủ Nhật hàng tuần.',
    sopRef: 'SOP-HENGIO-01'
  },
  {
    id: 'q_light_4',
    topic: 'lighting',
    topicName: '⏱️ Chiếu Sáng & Hẹn Giờ',
    question: 'Đồng hồ hẹn giờ cơ/điện tử khi kiểm tra được coi là chuẩn khi sai lệch với giờ thực tế không quá bao nhiêu?',
    options: [
      'Lệch < 1 phút so với giờ thực tế và đúng thứ trong tuần',
      'Lệch 30 phút vẫn được',
      'Lệch 1 giờ vẫn được',
      'Không quan tâm giờ'
    ],
    correct: 0,
    explain: 'Theo SOP-HENGIO-01: Giờ đồng hồ timer chỉ được phép lệch < 1 phút so với giờ chuẩn để đảm bảo thời gian bật/tắt chính xác.',
    sopRef: 'SOP-HENGIO-01'
  },
  {
    id: 'q_light_5',
    topic: 'lighting',
    topicName: '⏱️ Chiếu Sáng & Hẹn Giờ',
    question: 'Quy định giờ đóng/ngắt điện chiếu sáng và điều hòa cho các đơn vị văn phòng so với giờ làm việc là:',
    options: [
      'Đóng cùng giờ làm, ngắt cùng giờ nghỉ',
      'Bật 24/24 tất cả các ngày',
      'Đóng điện trước giờ làm việc 30 phút, ngắt sau giờ làm việc 60 phút',
      'Đóng trước 2 tiếng, ngắt sau 4 tiếng'
    ],
    correct: 2,
    explain: 'Quy định tiêu chuẩn văn phòng: Mở nguồn điện/điều hòa trước giờ làm việc 30 phút và ngắt sau giờ làm việc 60 phút.',
    sopRef: 'SOP-HENGIO-01'
  },

  // Chốt Công Tơ (5 câu)
  {
    id: 'q_meter_1',
    topic: 'meter',
    topicName: '📊 Chốt Công Tơ',
    question: 'Thời điểm thực hiện chốt chỉ số công tơ điện nước định kỳ hàng tháng theo quy định là:',
    options: [
      'Ngày mùng 10 hàng tháng',
      'Định kỳ ngày cuối cùng của tháng (hoặc theo thông báo lịch ghi số điện lực)',
      'Đầu năm chốt một lần',
      'Chỉ chốt khi có hóa đơn'
    ],
    correct: 1,
    explain: 'Theo SOP-CONGTO-01: Chốt chỉ số công tơ điện nước vào ngày cuối cùng của tháng để phục vụ quyết toán sản lượng tiêu thụ.',
    sopRef: 'SOP-CONGTO-01'
  },
  {
    id: 'q_meter_2',
    topic: 'meter',
    topicName: '📊 Chốt Công Tơ',
    question: 'Sau khi ghi nhận số liệu công tơ điện nước mới vào Web App, kỹ thuật viên cần làm gì tiếp theo?',
    options: [
      'Tắt máy đi về ngay',
      'Kiểm tra so sánh sản lượng với tháng trước, chụp ảnh mặt số lưu trữ và đối chiếu trên bảng tính Google Sheets',
      'Xóa hết số liệu vừa nhập',
      'Không cần kiểm tra lại'
    ],
    correct: 1,
    explain: 'Kỹ thuật viên phải đối chiếu sản lượng tiêu thụ với tháng trước xem có dấu hiệu bất thường không và kiểm tra dữ liệu đồng bộ vào Google Sheets.',
    sopRef: 'SOP-CONGTO-01'
  },
  {
    id: 'q_meter_3',
    topic: 'meter',
    topicName: '📊 Chốt Công Tơ',
    question: 'Trường hợp phát hiện công tơ điện hoặc đồng hồ nước quay ngược, kẹt số hoặc mặt kính bị mờ, xử lý đúng là:',
    options: [
      'Tự ý cạy mặt kính sửa chữa',
      'Bỏ qua coi như không thấy',
      'Giữ nguyên hiện trạng, chụp ảnh ghi nhận, ghi nhật ký vận hành và báo cáo phụ trách để lập biên bản kiểm tra/thay thế',
      'Lấy búa đập vỡ'
    ],
    correct: 2,
    explain: 'Nghiêm cấm tự ý can thiệp vào niêm chì công tơ; phải lập biên bản ghi nhận hiện trạng và báo cáo phụ trách xử lý.',
    sopRef: 'SOP-CONGTO-01'
  },
  {
    id: 'q_meter_4',
    topic: 'meter',
    topicName: '📊 Chốt Công Tơ',
    question: 'Công thức tính điện năng tiêu thụ (kWh) của công tơ điện 3 pha gián tiếp có biến dòng đo lường (TI) là:',
    options: [
      'Sản lượng = (Chỉ số mới - Chỉ số cũ) × Hệ số nhân biến dòng TI',
      'Sản lượng = Chỉ số mới + Chỉ số cũ',
      'Sản lượng = Chỉ số mới chia cho TI',
      'Sản lượng = (Chỉ số mới - Chỉ số cũ) chia 100'
    ],
    correct: 0,
    explain: 'Công tơ gián tiếp đo qua biến dòng (ví dụ 100/5A có hệ số nhân 20), do đó sản lượng tiêu thụ thực tế bằng số đếm nhân với hệ số TI.',
    sopRef: 'SOP-CONGTO-01'
  },
  {
    id: 'q_meter_5',
    topic: 'meter',
    topicName: '📊 Chốt Công Tơ',
    question: 'Bảng tính Google Sheets "Tổng hợp điện nước sân golf" có vai trò gì trong quản lý vận hành?',
    options: [
      'Chỉ để xem lịch trực',
      'Tổng hợp chi tiết số liệu công tơ điện nước, phân bổ sản lượng các khu vực và theo dõi xu hướng tiêu thụ năng lượng',
      'Dùng làm danh bạ điện thoại',
      'Không có tác dụng gì'
    ],
    correct: 1,
    explain: 'Bảng tính tổng hợp điện nước sân golf giúp theo dõi lịch sử số đo, tính toán sản lượng điện nước và kiểm soát chi phí năng lượng.',
    sopRef: 'SOP-CONGTO-01'
  },

  // Sơ Đồ & Động Cơ 3 Pha (5 câu)
  {
    id: 'q_schema_1',
    topic: 'schematic',
    topicName: '📐 Sơ Đồ & Động Cơ 3 Pha',
    question: 'Trên nhãn mác (nameplate) động cơ 3 pha ghi "220V/380V - Δ/Y". Khi cấp nguồn từ lưới điện 3 pha 380V, động cơ phải được đấu dây theo kiểu nào?',
    options: [
      'Đấu hình Tam giác (Δ)',
      'Đấu hình Sao (Y)',
      'Đấu 1 pha 220V',
      'Đấu kiểu nào cũng được'
    ],
    correct: 1,
    explain: 'Ghi 220V/380V - Δ/Y nghĩa là: nếu nguồn 220V (3 pha) thì đấu Tam giác, còn nguồn 380V (3 pha) thì bắt buộc phải đấu hình Sao (Y) để mỗi cuộn dây chịu đúng 220V.',
    sopRef: 'SOP-GOLF-01'
  },
  {
    id: 'q_schema_2',
    topic: 'schematic',
    topicName: '📐 Sơ Đồ & Động Cơ 3 Pha',
    question: 'Thiết bị bảo vệ quá tải nhiệt cho động cơ điện thường được gắn nối tiếp ngay dưới Contactor là:',
    options: [
      'Cầu chì ống',
      'Rơ-le nhiệt (Thermal Overload Relay)',
      'Biến dòng đo lường',
      'Điện trở xả'
    ],
    correct: 1,
    explain: 'Rơ-le nhiệt có các thanh lưỡng kim uốn cong khi dòng điện qua động cơ vượt mức định mức trong thời gian dài, tác động mở tiếp điểm ngắt cuộn hút contactor.',
    sopRef: 'SOP-GOLF-01'
  },
  {
    id: 'q_schema_3',
    topic: 'schematic',
    topicName: '📐 Sơ Đồ & Động Cơ 3 Pha',
    question: 'Trong sơ đồ mạch điện điều khiển máy bơm, cặp tiếp điểm thường đóng (NC) của rơ-le nhiệt dùng để ngắt cuộn hút mang số:',
    options: [
      '13 - 14',
      '95 - 96',
      '97 - 98',
      'A1 - A2'
    ],
    correct: 1,
    explain: 'Tiếp điểm 95-96 trên rơ-le nhiệt là tiếp điểm thường đóng (NC); khi xảy ra quá tải nó sẽ mở ra ngắt mạch điều khiển cuộn hút contactor.',
    sopRef: 'SOP-GOLF-01'
  },
  {
    id: 'q_schema_4',
    topic: 'schematic',
    topicName: '📐 Sơ Đồ & Động Cơ 3 Pha',
    question: 'Mất điện lưới nhưng máy phát điện dự phòng không tự khởi động qua tủ ATS, bước kiểm tra đầu tiên trong 10 phút đầu là:',
    options: [
      'Tháo tung động cơ ra kiểm tra',
      'Kiểm tra điện áp bình ắc quy khởi động, trạng thái CB điều khiển ATS, mức nhiên liệu dầu và mã lỗi cảnh báo',
      'Đóng điện lưới trở lại',
      'Ngồi chờ điện lực có điện lại'
    ],
    correct: 1,
    explain: 'Phần lớn lỗi máy phát không đề được là do ắc quy đề yếu điện, hết dầu diesel, đứt cầu chì mạch điều khiển ATS hoặc kẹt nút dừng khẩn cấp.',
    sopRef: 'SOP-GOLF-01'
  },
  {
    id: 'q_schema_5',
    topic: 'schematic',
    topicName: '📐 Sơ Đồ & Động Cơ 3 Pha',
    question: 'Dấu hiệu nào trong ca trực cảnh báo sớm bạc đạn (vòng bi) động cơ máy bơm có nguy cơ hư hỏng?',
    options: [
      'Máy bơm chạy êm ru không tiếng động',
      'Tiếng ồn rít/gầm lạ, độ rung tăng cao, nhiệt độ gối đỡ tăng nóng và dòng điện làm việc tăng',
      'Áp lực nước tăng đột ngột',
      'Đèn báo nguồn sáng màu xanh'
    ],
    correct: 1,
    explain: 'Bạc đạn thiếu mỡ hoặc rỗ rãnh bi sẽ phát ra tiếng rít kim loại, rung lắc mạnh, gối đỡ nóng rát và dòng điện động cơ tăng do ma sát lớn.',
    sopRef: 'SOP-GOLF-01'
  }
];

// STATE MANAGEMENT
const STORAGE_KEYS = {
  QUESTIONS: 'elearning_questions_v1',
  RECORDS: 'elearning_records_v1',
  ACTIVE_TRAINEE: 'elearning_active_trainee_v1'
};

let questions = [];
let records = [];
let currentTrainee = 'Ngô Quyết Thắng';
let activeCourseId = null;

let examSession = {
  inProgress: false,
  timerInterval: null,
  remainingSeconds: 0,
  questions: [],
  userAnswers: {},
  topic: 'all',
  title: '',
  startTime: null
};

// INITIALIZATION
document.addEventListener('DOMContentLoaded', () => {
  loadData();
  initTraineeSelect();
  renderCourses();
  renderQuestionsList();
  renderTrainingRecords();
  updateStats();
  lucide.createIcons();
});

function loadData() {
  try {
    const savedQ = localStorage.getItem(STORAGE_KEYS.QUESTIONS);
    questions = savedQ ? JSON.parse(savedQ) : JSON.parse(JSON.stringify(DEFAULT_QUESTIONS));
  } catch (_) {
    questions = JSON.parse(JSON.stringify(DEFAULT_QUESTIONS));
  }

  try {
    const savedRec = localStorage.getItem(STORAGE_KEYS.RECORDS);
    records = savedRec ? JSON.parse(savedRec) : [];
  } catch (_) {
    records = [];
  }

  const savedTrainee = localStorage.getItem(STORAGE_KEYS.ACTIVE_TRAINEE);
  if (savedTrainee) currentTrainee = savedTrainee;
}

function saveData() {
  try {
    localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(questions));
    localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));
    localStorage.setItem(STORAGE_KEYS.ACTIVE_TRAINEE, currentTrainee);
  } catch (e) {
    console.warn('Lỗi lưu dữ liệu:', e);
  }
}

function initTraineeSelect() {
  const select = document.getElementById('select-active-trainee');
  if (!select) return;

  // Read employees from nhatky storage if available
  let employeeList = [
    'Ngô Quyết Thắng',
    'Đinh Văn Hậu',
    'Hoàng Việt Hoàng',
    'Nguyễn Đức Phong',
    'Nguyễn Văn Cường',
    'Quản Trị Viên'
  ];

  try {
    const rawEmps = localStorage.getItem('app_active_employees_v1');
    if (rawEmps) {
      const parsed = JSON.parse(rawEmps);
      if (Array.isArray(parsed) && parsed.length) {
        employeeList = parsed.map(e => e.fullName || e.name).filter(Boolean);
      }
    }
  } catch (_) {}

  select.innerHTML = employeeList.map(name => `<option value="${name}">${name}</option>`).join('');
  if (employeeList.includes(currentTrainee)) {
    select.value = currentTrainee;
  } else {
    currentTrainee = employeeList[0];
    select.value = currentTrainee;
  }

  document.getElementById('exam-trainee-display').textContent = currentTrainee;
  document.getElementById('cert-trainee-name').textContent = currentTrainee;
}

function changeTrainee(name) {
  currentTrainee = name;
  saveData();
  document.getElementById('exam-trainee-display').textContent = currentTrainee;
  document.getElementById('cert-trainee-name').textContent = currentTrainee;
  updateStats();
  showToast(`Đã chọn học viên: ${currentTrainee}`);
}

function showToast(message, isError = false) {
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toast-message');
  const toastIcon = document.getElementById('toast-icon');
  if (!toast || !toastMsg) return;

  toastMsg.textContent = message;
  toastIcon.setAttribute('data-lucide', isError ? 'alert-triangle' : 'check-circle-2');
  toastIcon.className = 'w-4 h-4 ' + (isError ? 'text-rose-400' : 'text-emerald-400');
  lucide.createIcons();

  toast.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-[-20px]');
  toast.classList.add('opacity-100', 'translate-y-0');

  setTimeout(() => {
    toast.classList.remove('opacity-100', 'translate-y-0');
    toast.classList.add('opacity-0', 'pointer-events-none', 'translate-y-[-20px]');
  }, 2200);
}

// TAB SWITCHING
function switchTab(tabId) {
  const tabs = ['courses', 'exam', 'certificates', 'questions'];
  tabs.forEach(t => {
    const sec = document.getElementById('tab-' + t);
    const btn = document.getElementById('tab-btn-' + t);
    if (sec) sec.classList.add('hidden');
    if (btn) {
      btn.className = 'px-3.5 py-2 rounded-xl text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition flex items-center gap-2';
    }
  });

  const activeSec = document.getElementById('tab-' + tabId);
  const activeBtn = document.getElementById('tab-btn-' + tabId);
  if (activeSec) activeSec.classList.remove('hidden');
  if (activeBtn) {
    activeBtn.className = 'px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 bg-indigo-600 text-white shadow-xs';
  }

  if (tabId === 'courses') renderCourses();
  if (tabId === 'certificates') renderTrainingRecords();
  if (tabId === 'questions') renderQuestionsList();
  lucide.createIcons();
}

// 1. COURSES TAB
function renderCourses() {
  const grid = document.getElementById('course-grid');
  if (!grid) return;

  grid.innerHTML = DEFAULT_COURSES.map(course => {
    return `
      <div class="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs hover:border-indigo-300 hover:shadow-sm transition flex flex-col justify-between space-y-3">
        <div class="space-y-2.5">
          <div class="flex items-start justify-between gap-2">
            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
              ${course.badge}
            </span>
            <span class="text-[11px] font-mono text-gray-400 font-semibold">${course.sopCode}</span>
          </div>

          <div class="flex items-center space-x-2.5">
            <div class="w-9 h-9 rounded-xl bg-gray-100 text-gray-800 flex items-center justify-center shrink-0 border border-gray-200">
              <i data-lucide="${course.icon}" class="w-4 h-4 text-indigo-600"></i>
            </div>
            <h4 class="font-extrabold text-sm text-gray-900 leading-snug line-clamp-2">${course.title}</h4>
          </div>

          <p class="text-xs text-gray-600 leading-relaxed line-clamp-3">${course.summary}</p>
        </div>

        <div class="pt-2 border-t border-gray-100 flex items-center gap-2">
          <button onclick="openCourseModal('${course.id}')" class="flex-1 py-2 bg-gray-50 hover:bg-gray-100 text-gray-800 border border-gray-200 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition">
            <i data-lucide="book-open" class="w-3.5 h-3.5 text-gray-500"></i>
            <span>Xem Bài Học</span>
          </button>
          <button onclick="startTopicExam('${course.topic}')" class="px-3 py-2 bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 border border-indigo-200 font-bold rounded-xl text-xs flex items-center gap-1 transition" title="Làm bài thi chuyên đề này">
            <i data-lucide="play" class="w-3.5 h-3.5 fill-current"></i>
            <span>Luyện Thi</span>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function openCourseModal(courseId) {
  const course = DEFAULT_COURSES.find(c => c.id === courseId);
  if (!course) return;

  activeCourseId = courseId;
  document.getElementById('modal-course-badge').textContent = course.badge;
  document.getElementById('modal-course-sop').textContent = course.sopCode;
  document.getElementById('modal-course-title').textContent = course.title;

  const body = document.getElementById('modal-course-body');
  body.innerHTML = `
    <!-- Target Alert -->
    <div class="p-3.5 rounded-xl bg-indigo-50/80 border border-indigo-200 text-indigo-950 space-y-1">
      <div class="flex items-center gap-1.5 font-bold text-xs text-indigo-900">
        <i data-lucide="target" class="w-4 h-4 text-indigo-600"></i>
        <span>Mục Tiêu Đào Tạo:</span>
      </div>
      <p class="leading-relaxed">${course.target}</p>
    </div>

    <!-- Safety Warning -->
    <div class="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-950 space-y-1">
      <div class="flex items-center gap-1.5 font-bold text-xs text-rose-900">
        <i data-lucide="alert-octagon" class="w-4 h-4 text-rose-600"></i>
        <span>Lưu Ý An Toàn Sống Còn:</span>
      </div>
      <p class="leading-relaxed font-semibold">${course.safetyWarning}</p>
    </div>

    <!-- Key Theory & Standards -->
    <div class="space-y-2">
      <h4 class="font-bold text-gray-900 flex items-center gap-1.5">
        <i data-lucide="check-circle" class="w-4 h-4 text-emerald-600"></i>
        <span>Lý Thuyết &amp; Quy Chuẩn Tiêu Chuẩn:</span>
      </h4>
      <div class="space-y-1.5 pl-1">
        ${course.theoryPoints.map(point => `
          <div class="p-2.5 rounded-lg bg-gray-50 border border-gray-200/80 text-gray-700 leading-relaxed">
            ${point}
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Practical Checklist -->
    <div class="space-y-2">
      <h4 class="font-bold text-gray-900 flex items-center gap-1.5">
        <i data-lucide="list-checks" class="w-4 h-4 text-blue-600"></i>
        <span>Checklist Thao Tác Ngoài Hiện Trường:</span>
      </h4>
      <ul class="space-y-1.5 pl-1">
        ${course.practicalChecklist.map((step, idx) => `
          <li class="flex items-start gap-2 p-2 rounded-lg bg-white border border-gray-200 text-gray-700">
            <span class="w-4 h-4 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">${idx + 1}</span>
            <span>${step}</span>
          </li>
        `).join('')}
      </ul>
    </div>
  `;

  document.getElementById('btn-modal-start-quiz').onclick = () => {
    closeCourseModal();
    startTopicExam(course.topic);
  };

  const modal = document.getElementById('modal-course-detail');
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  lucide.createIcons();
}

function closeCourseModal() {
  const modal = document.getElementById('modal-course-detail');
  modal.classList.add('hidden');
  modal.classList.remove('flex');
}

// 2. EXAM & ASSESSMENT ENGINE
function startComprehensiveExam() {
  switchTab('exam');
  document.getElementById('select-exam-topic').value = 'all';
  startExamSession();
}

function startTopicExam(topic) {
  switchTab('exam');
  document.getElementById('select-exam-topic').value = topic;
  startExamSession();
}

function startExamSession() {
  const topic = document.getElementById('select-exam-topic').value;

  let pool = [];
  if (topic === 'all') {
    pool = [...questions];
  } else {
    pool = questions.filter(q => q.topic === topic);
  }

  if (pool.length === 0) {
    showToast('Chưa có câu hỏi cho chuyên đề này', true);
    return;
  }

  // Shuffle pool
  pool.sort(() => Math.random() - 0.5);

  // Take up to 15 questions for comprehensive or all available for topic
  const examQuestions = topic === 'all' ? pool.slice(0, 15) : pool;

  examSession = {
    inProgress: true,
    timerInterval: null,
    remainingSeconds: 15 * 60, // 15 mins
    questions: examQuestions,
    userAnswers: {},
    topic: topic,
    title: topic === 'all' ? 'Sát Hạch Năng Lực Toàn Diện Cơ Điện' : 'Sát Hạch Chuyên Đề: ' + (pool[0]?.topicName || topic),
    startTime: new Date()
  };

  document.getElementById('exam-setup-box').classList.add('hidden');
  document.getElementById('exam-result-box').classList.add('hidden');
  document.getElementById('exam-active-box').classList.remove('hidden');

  document.getElementById('active-exam-title').textContent = examSession.title;
  document.getElementById('active-exam-trainee').textContent = currentTrainee;

  renderExamQuestions();
  renderQuestionPalette();

  // Start Timer
  if (examSession.timerInterval) clearInterval(examSession.timerInterval);
  updateTimerDisplay();
  examSession.timerInterval = setInterval(() => {
    examSession.remainingSeconds--;
    updateTimerDisplay();
    if (examSession.remainingSeconds <= 0) {
      clearInterval(examSession.timerInterval);
      showToast('Đã hết thời gian làm bài! Hệ thống tự động nộp bài.', true);
      submitExam(true);
    }
  }, 1000);

  window.scrollTo({ top: 100, behavior: 'smooth' });
}

function updateTimerDisplay() {
  const mins = Math.floor(examSession.remainingSeconds / 60);
  const secs = examSession.remainingSeconds % 60;
  const display = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  const timerEl = document.getElementById('countdown-timer');
  const timerBox = document.getElementById('timer-box');
  if (timerEl) timerEl.textContent = display;

  if (timerBox) {
    if (examSession.remainingSeconds < 120) {
      timerBox.className = 'flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 text-white rounded-xl font-mono font-bold text-sm shadow-xs animate-pulse';
    } else {
      timerBox.className = 'flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-xl font-mono font-bold text-sm shadow-xs';
    }
  }
}

function renderExamQuestions() {
  const list = document.getElementById('exam-questions-list');
  if (!list) return;

  list.innerHTML = examSession.questions.map((q, idx) => {
    return `
      <div class="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-xs space-y-3" id="q-card-${idx}">
        <div class="flex items-start justify-between gap-2">
          <div class="flex items-center gap-2">
            <span class="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 font-extrabold text-xs flex items-center justify-center shrink-0">
              ${idx + 1}
            </span>
            <span class="text-xs font-bold text-gray-500">${q.topicName || 'Kỹ thuật'}</span>
          </div>
          <span class="text-[10px] font-mono text-gray-400">${q.sopRef || ''}</span>
        </div>

        <p class="font-extrabold text-sm text-gray-900 leading-relaxed">${q.question}</p>

        <!-- Options Grid -->
        <div class="space-y-2 pt-1">
          ${q.options.map((opt, optIdx) => {
            const letter = ['A', 'B', 'C', 'D'][optIdx];
            const isSelected = examSession.userAnswers[idx] === optIdx;
            return `
              <label class="flex items-start gap-3 p-3 rounded-xl border transition cursor-pointer select-none ${isSelected ? 'bg-indigo-50 border-indigo-500 text-indigo-950 font-bold shadow-xs' : 'bg-gray-50/50 hover:bg-gray-50 border-gray-200 text-gray-700'}">
                <input type="radio" name="exam-q-${idx}" value="${optIdx}" onchange="selectExamAnswer(${idx}, ${optIdx})" ${isSelected ? 'checked' : ''} class="w-4 h-4 text-indigo-600 mt-0.5">
                <span class="text-xs font-bold w-4 text-indigo-600">${letter}.</span>
                <span class="text-xs flex-1">${opt}</span>
              </label>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }).join('');
  lucide.createIcons();
}

function selectExamAnswer(qIdx, optIdx) {
  examSession.userAnswers[qIdx] = optIdx;
  renderQuestionPalette();

  // Highlight card
  const card = document.getElementById('q-card-' + qIdx);
  if (card) {
    const labels = card.querySelectorAll('label');
    labels.forEach((l, idx) => {
      if (idx === optIdx) {
        l.className = 'flex items-start gap-3 p-3 rounded-xl border transition cursor-pointer select-none bg-indigo-50 border-indigo-500 text-indigo-950 font-bold shadow-xs';
      } else {
        l.className = 'flex items-start gap-3 p-3 rounded-xl border transition cursor-pointer select-none bg-gray-50/50 hover:bg-gray-50 border-gray-200 text-gray-700';
      }
    });
  }
}

function renderQuestionPalette() {
  const container = document.getElementById('question-palette');
  const label = document.getElementById('answered-count-label');
  if (!container) return;

  const total = examSession.questions.length;
  const answered = Object.keys(examSession.userAnswers).length;
  if (label) label.textContent = `Đã làm: ${answered}/${total} câu`;

  container.innerHTML = examSession.questions.map((_, idx) => {
    const isAnswered = examSession.userAnswers[idx] !== undefined;
    return `
      <button type="button" onclick="scrollToQuestion(${idx})" class="w-7 h-7 rounded-lg text-xs font-bold transition flex items-center justify-center ${isAnswered ? 'bg-indigo-600 text-white shadow-xs' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'}">
        ${idx + 1}
      </button>
    `;
  }).join('');
}

function scrollToQuestion(idx) {
  const card = document.getElementById('q-card-' + idx);
  if (card) {
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

function submitExamConfirmation() {
  const total = examSession.questions.length;
  const answered = Object.keys(examSession.userAnswers).length;

  if (answered < total) {
    if (!confirm(`Bạn mới trả lời ${answered}/${total} câu hỏi. Bạn có chắc chắn muốn nộp bài ngay?`)) {
      return;
    }
  } else {
    if (!confirm('Bạn có chắc chắn muốn nộp bài thi sát hạch?')) {
      return;
    }
  }
  submitExam(false);
}

function submitExam(isAuto = false) {
  clearInterval(examSession.timerInterval);
  examSession.inProgress = false;

  let correctCount = 0;
  const total = examSession.questions.length;

  examSession.questions.forEach((q, idx) => {
    if (examSession.userAnswers[idx] === q.correct) {
      correctCount++;
    }
  });

  const percent = Math.round((correctCount / total) * 100);
  const isPassed = percent >= 70;
  const verdict = percent >= 90 ? 'Xuất Sắc' : percent >= 70 ? 'Đạt Yêu Cầu' : 'Cần Đào Tạo Lại';

  const durationSec = 15 * 60 - examSession.remainingSeconds;
  const durationMin = Math.ceil(durationSec / 60);

  const newRecord = {
    id: 'rec_' + Date.now(),
    trainee: currentTrainee,
    examTitle: examSession.title,
    date: new Date().toISOString(),
    score: percent,
    correctCount,
    total,
    verdict,
    isPassed,
    durationMin,
    code: 'ME-CERT-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000)
  };

  records.unshift(newRecord);
  saveData();
  updateStats();

  // Hide active box, show result box
  document.getElementById('exam-active-box').classList.add('hidden');
  const resultBox = document.getElementById('exam-result-box');
  resultBox.classList.remove('hidden');

  resultBox.innerHTML = `
    <div class="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm text-center space-y-4">
      <div class="w-16 h-16 rounded-2xl ${isPassed ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'} flex items-center justify-center mx-auto shadow-sm">
        <i data-lucide="${isPassed ? 'award' : 'alert-triangle'}" class="w-8 h-8"></i>
      </div>

      <div class="space-y-1">
        <span class="px-3 py-1 rounded-full text-xs font-bold ${isPassed ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}">
          ${verdict}
        </span>
        <h3 class="text-2xl font-black text-gray-900 pt-2">${percent} / 100 Điểm</h3>
        <p class="text-xs text-gray-500 font-medium">Đúng ${correctCount}/${total} câu hỏi • Thời gian làm bài: ${durationMin} phút</p>
      </div>

      <div class="p-4 rounded-xl ${isPassed ? 'bg-emerald-50/70 border border-emerald-200 text-emerald-950' : 'bg-rose-50/70 border border-rose-200 text-rose-950'} max-w-md mx-auto text-xs leading-relaxed">
        ${isPassed ? 'Chúc mừng bạn đã hoàn thành bài thi sát hạch đạt chuẩn quy trình kỹ thuật & an toàn M&E.' : 'Bạn chưa đạt điểm sàn sát hạch (yêu cầu ≥ 70 điểm). Hãy rà soát lại các câu sai bên dưới và luyện thi lại.'}
      </div>

      <div class="flex items-center justify-center gap-2 pt-2 flex-wrap">
        ${isPassed ? `
          <button onclick="viewCertificateFromRecord('${newRecord.id}')" class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-2">
            <i data-lucide="award" class="w-4 h-4"></i>
            <span>Xem &amp; In Chứng Chỉ Điện Tử</span>
          </button>
        ` : ''}
        <button onclick="startExamSession()" class="px-4 py-2.5 bg-gray-900 hover:bg-black text-white font-semibold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5">
          <i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i>
          <span>Làm Bài Khác</span>
        </button>
        <button onclick="switchTab('courses')" class="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-xl border border-gray-200 transition">
          Về Khóa Học
        </button>
      </div>
    </div>

    <!-- Answer Breakdown & Explanations -->
    <div class="space-y-3">
      <div class="flex items-center justify-between px-1">
        <h4 class="font-bold text-xs text-gray-600 uppercase tracking-wider">Chi Tiết Đáp Án &amp; Căn Cứ Kỹ Thuật (SOP)</h4>
        <span class="text-[11px] text-gray-400">Xem giải thích cho từng câu</span>
      </div>

      <div class="space-y-3">
        ${examSession.questions.map((q, idx) => {
          const userAns = examSession.userAnswers[idx];
          const isCorrect = userAns === q.correct;
          return `
            <div class="bg-white rounded-2xl border ${isCorrect ? 'border-emerald-200' : 'border-rose-200'} p-4 sm:p-5 shadow-xs space-y-3">
              <div class="flex items-start justify-between gap-2">
                <div class="flex items-center gap-2">
                  <span class="w-6 h-6 rounded-lg ${isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'} text-xs font-black flex items-center justify-center shrink-0">
                    ${idx + 1}
                  </span>
                  <span class="text-xs font-bold ${isCorrect ? 'text-emerald-700' : 'text-rose-700'}">
                    ${isCorrect ? '✓ Trả lời Đúng' : '✗ Trả lời Sai'}
                  </span>
                </div>
                <span class="text-[10px] font-mono text-gray-400">${q.sopRef || ''}</span>
              </div>

              <p class="font-extrabold text-sm text-gray-900">${q.question}</p>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                ${q.options.map((opt, optIdx) => {
                  const letter = ['A', 'B', 'C', 'D'][optIdx];
                  const isUserPick = userAns === optIdx;
                  const isRealCorrect = q.correct === optIdx;

                  let cls = 'bg-gray-50 border-gray-200 text-gray-700';
                  if (isRealCorrect) cls = 'bg-emerald-50 border-emerald-400 text-emerald-950 font-bold';
                  else if (isUserPick && !isCorrect) cls = 'bg-rose-50 border-rose-300 text-rose-950 line-through';

                  return `
                    <div class="p-2.5 rounded-xl border flex items-start gap-2 ${cls}">
                      <span class="font-bold w-4 shrink-0 text-gray-500">${letter}.</span>
                      <span class="flex-1">${opt}</span>
                    </div>
                  `;
                }).join('')}
              </div>

              <!-- Explanation Box -->
              <div class="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
                <span class="font-bold text-slate-900 flex items-center gap-1">
                  <i data-lucide="info" class="w-3.5 h-3.5 text-indigo-600"></i>
                  <span>Căn cứ quy chuẩn kỹ thuật:</span>
                </span>
                <p class="leading-relaxed">${q.explain}</p>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;

  window.scrollTo({ top: 100, behavior: 'smooth' });
  lucide.createIcons();
}

// 3. CERTIFICATE & HISTORY TAB
function viewCertificateFromRecord(recordId) {
  const rec = records.find(r => r.id === recordId);
  if (!rec) return;

  switchTab('certificates');

  document.getElementById('cert-trainee-name').textContent = rec.trainee;
  document.getElementById('cert-exam-title').textContent = rec.examTitle;
  document.getElementById('cert-score').textContent = rec.score + '/100';
  document.getElementById('cert-verdict').textContent = rec.verdict;
  document.getElementById('cert-code').textContent = rec.code;

  const d = new Date(rec.date);
  document.getElementById('cert-date').textContent = 'Cấp ngày: ' + d.toLocaleDateString('vi-VN');

  const card = document.getElementById('certificate-printable');
  if (card) {
    card.scrollIntoView({ behavior: 'smooth' });
  }
}

function renderTrainingRecords() {
  const tbody = document.getElementById('records-table-body');
  if (!tbody) return;

  if (records.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="p-6 text-center text-gray-400 text-xs">
          Chưa có lịch sử kỳ thi sát hạch nào. Hãy bấm "Bắt Đầu Làm Bài" để tiến hành sát hạch.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = records.map(rec => {
    const d = new Date(rec.date);
    const dateFormatted = d.toLocaleDateString('vi-VN') + ' ' + d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    return `
      <tr class="hover:bg-gray-50/80 transition">
        <td class="p-2.5 font-mono text-[11px] text-gray-500">${dateFormatted}</td>
        <td class="p-2.5 font-bold text-gray-900">${rec.trainee}</td>
        <td class="p-2.5 text-gray-700">${rec.examTitle}</td>
        <td class="p-2.5 font-bold ${rec.score >= 70 ? 'text-emerald-700' : 'text-rose-700'}">${rec.score} đ</td>
        <td class="p-2.5">
          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${rec.score >= 70 ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}">
            ${rec.verdict}
          </span>
        </td>
        <td class="p-2.5 text-center">
          ${rec.isPassed ? `
            <button onclick="viewCertificateFromRecord('${rec.id}')" class="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 rounded-lg font-bold text-[11px] transition">
              Xem Chứng Chỉ
            </button>
          ` : '<span class="text-[11px] text-gray-400">—</span>'}
        </td>
      </tr>
    `;
  }).join('');
}

function exportTrainingRecordsCSV() {
  if (records.length === 0) {
    showToast('Chưa có dữ liệu để xuất báo cáo', true);
    return;
  }

  const headers = ['Mã Chứng Chỉ', 'Học Viên', 'Chuyên Đề', 'Điểm Số', 'Xếp Loại', 'Kết Quả', 'Thời Gian Thi'];
  const rows = records.map(r => [
    r.code,
    r.trainee,
    r.examTitle,
    r.score,
    r.verdict,
    r.isPassed ? 'Đạt' : 'Không đạt',
    new Date(r.date).toLocaleString('vi-VN')
  ]);

  const csv = [headers, ...rows].map(row => row.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(',')).join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `bao-cao-sat-hach-co-dien-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Đã xuất báo cáo CSV thành công');
}

function clearTrainingRecords() {
  if (!confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử thi trên máy này?')) return;
  records = [];
  saveData();
  renderTrainingRecords();
  updateStats();
  showToast('Đã xóa lịch sử thi');
}

// 4. QUESTION BANK ADMIN TAB
function renderQuestionsList() {
  const container = document.getElementById('admin-questions-list');
  if (!container) return;

  const search = (document.getElementById('question-search-input')?.value || '').trim().toLowerCase();
  const topicFilter = document.getElementById('question-topic-filter')?.value || 'all';

  const filtered = questions.filter(q => {
    if (topicFilter !== 'all' && q.topic !== topicFilter) return false;
    if (search) {
      const txt = (q.question + ' ' + (q.options || []).join(' ') + ' ' + (q.explain || '')).toLowerCase();
      if (!txt.includes(search)) return false;
    }
    return true;
  });

  if (filtered.length === 0) {
    container.innerHTML = '<div class="p-6 text-center text-gray-400 text-xs bg-white rounded-2xl border border-gray-200">Không tìm thấy câu hỏi nào phù hợp bộ lọc.</div>';
    return;
  }

  container.innerHTML = filtered.map((q, idx) => {
    const realIdx = questions.indexOf(q);
    return `
      <div class="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs space-y-2.5">
        <div class="flex items-start justify-between gap-2">
          <div class="flex items-center gap-2">
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
              ${q.topicName || q.topic}
            </span>
            <span class="text-[11px] font-mono text-gray-400">${q.sopRef || ''}</span>
          </div>

          <div class="flex items-center gap-1">
            <button onclick="editQuestion(${realIdx})" class="p-1.5 hover:bg-gray-100 text-gray-600 rounded-lg transition" title="Sửa câu hỏi">
              <i data-lucide="pencil" class="w-3.5 h-3.5"></i>
            </button>
            <button onclick="deleteQuestion(${realIdx})" class="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition" title="Xóa câu hỏi">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        </div>

        <p class="font-bold text-xs sm:text-sm text-gray-900">${idx + 1}. ${q.question}</p>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
          ${q.options.map((opt, optIdx) => {
            const isCorrect = q.correct === optIdx;
            return `
              <div class="p-2 rounded-lg border ${isCorrect ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold' : 'bg-gray-50 border-gray-200 text-gray-700'}">
                <span class="font-bold text-gray-500 mr-1">${['A', 'B', 'C', 'D'][optIdx]}.</span>
                <span>${opt}</span>
              </div>
            `;
          }).join('')}
        </div>

        <p class="text-[11px] text-gray-500 italic bg-gray-50 p-2 rounded-lg border border-gray-100">
          <b>💡 Căn cứ:</b> ${q.explain}
        </p>
      </div>
    `;
  }).join('');
  lucide.createIcons();
}

function openAddQuestionModal() {
  document.getElementById('modal-q-title').textContent = 'Thêm Câu Hỏi Trắc Nghiệm Mới';
  document.getElementById('edit-q-id').value = '';
  document.getElementById('form-edit-question').reset();

  const modal = document.getElementById('modal-edit-question');
  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function editQuestion(realIdx) {
  const q = questions[realIdx];
  if (!q) return;

  document.getElementById('modal-q-title').textContent = 'Chỉnh Sửa Câu Hỏi Trắc Nghiệm';
  document.getElementById('edit-q-id').value = realIdx;
  document.getElementById('edit-q-topic').value = q.topic;
  document.getElementById('edit-q-text').value = q.question;

  q.options.forEach((opt, idx) => {
    const input = document.getElementById('edit-q-opt-' + idx);
    if (input) input.value = opt;
  });

  const radio = document.getElementById('opt-radio-' + q.correct);
  if (radio) radio.checked = true;

  document.getElementById('edit-q-explain').value = q.explain || '';

  const modal = document.getElementById('modal-edit-question');
  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function closeEditQuestionModal() {
  const modal = document.getElementById('modal-edit-question');
  modal.classList.add('hidden');
  modal.classList.remove('flex');
}

function handleSaveQuestion(event) {
  event.preventDefault();
  const idStr = document.getElementById('edit-q-id').value;
  const topic = document.getElementById('edit-q-topic').value;
  const questionText = document.getElementById('edit-q-text').value.trim();

  const options = [
    document.getElementById('edit-q-opt-0').value.trim(),
    document.getElementById('edit-q-opt-1').value.trim(),
    document.getElementById('edit-q-opt-2').value.trim(),
    document.getElementById('edit-q-opt-3').value.trim()
  ];

  const checkedRadio = document.querySelector('input[name="correct-answer"]:checked');
  const correct = checkedRadio ? Number(checkedRadio.value) : 0;
  const explain = document.getElementById('edit-q-explain').value.trim();

  const topicNames = {
    safety: '🛡️ An Toàn & LOTO',
    tba: '⚡ Trạm Biến Áp TBA',
    pump: '💧 Trạm Bơm & Suối Cun',
    lighting: '⏱️ Chiếu Sáng & Hẹn Giờ',
    meter: '📊 Chốt Công Tơ',
    schematic: '📐 Sơ Đồ & Động Cơ 3 Pha'
  };

  const item = {
    id: 'q_' + Date.now(),
    topic,
    topicName: topicNames[topic] || topic,
    question: questionText,
    options,
    correct,
    explain: explain || 'Căn cứ quy chuẩn kỹ thuật chuyên ngành.',
    sopRef: 'SOP-ME'
  };

  if (idStr !== '') {
    questions[Number(idStr)] = item;
    showToast('Đã cập nhật câu hỏi');
  } else {
    questions.unshift(item);
    showToast('Đã thêm câu hỏi mới vào ngân hàng');
  }

  saveData();
  closeEditQuestionModal();
  renderQuestionsList();
  updateStats();
}

function deleteQuestion(realIdx) {
  if (!confirm('Bạn có chắc chắn muốn xóa câu hỏi này?')) return;
  questions.splice(realIdx, 1);
  saveData();
  renderQuestionsList();
  updateStats();
  showToast('Đã xóa câu hỏi');
}

function resetDefaultQuestionBank() {
  if (!confirm('Khôi phục ngân hàng 30 câu hỏi mặc định? Toàn bộ câu hỏi chỉnh sửa sẽ trở về gốc.')) return;
  questions = JSON.parse(JSON.stringify(DEFAULT_QUESTIONS));
  saveData();
  renderQuestionsList();
  updateStats();
  showToast('Đã khôi phục ngân hàng câu hỏi gốc');
}

function updateStats() {
  document.getElementById('stat-course-count').textContent = DEFAULT_COURSES.length;
  document.getElementById('stat-q-count').textContent = questions.length;

  const passedRecords = records.filter(r => r.isPassed);
  document.getElementById('stat-cert-count').textContent = passedRecords.length;

  const lastRec = records[0];
  const lastScoreEl = document.getElementById('top-last-score');
  if (lastScoreEl) {
    lastScoreEl.textContent = lastRec ? `${lastRec.score}đ (${lastRec.verdict})` : 'Chưa thi';
    lastScoreEl.className = lastRec ? (lastRec.isPassed ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold') : 'text-gray-400 font-bold';
  }
}
