import React, { useState, useEffect, useRef } from "react";

// SVG Icons for consistent rendering without external dependencies
const Icons = {
  Sparkles: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  ),
  Database: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
    </svg>
  ),
  Settings: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  Mail: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  CheckCircle: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  AlertCircle: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Terminal: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  ArrowRight: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
  ),
  FileText: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  Refresh: () => (
    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H17" />
    </svg>
  )
};

export default function GiaoViecApp() {
  // Config states
  const [appsScriptUrl, setAppsScriptUrl] = useState("");
  const [apiKey, setApiKey] = useState(""); // Optional Anthropic key
  
  // Workflow states
  const [emailText, setEmailText] = useState("");
  const [loadingAI, setLoadingAI] = useState(false);
  const [loadingSheet, setLoadingSheet] = useState(false);
  const [isTestConnecting, setIsTestConnecting] = useState(false);
  
  // Data State
  const [nextStt, setNextStt] = useState(null);
  const [phieuData, setPhieuData] = useState({
    ma: "",
    loai: "Hệ thống điện",
    ten: "",
    thu_phi: "Không",
    trang_thai: "Chưa thực hiện",
    loai_kh: "Nội bộ",
    nguon: "Email Chủ tịch",
    vi_tri: "",
    ngay: "",
    han: "",
    don_vi: "Ban điện",
    to_doi: "",
    noi_dung: "",
    ghi_chu: ""
  });
  const [isModified, setIsModified] = useState(false);
  const [successInfo, setSuccessInfo] = useState(null);

  // Activity Log State
  const [logs, setLogs] = useState([]);
  const logEndRef = useRef(null);

  // Set default date to today
  useEffect(() => {
    const today = new Date();
    const formattedDate = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
    setPhieuData(prev => ({ ...prev, ngay: formattedDate }));
    addLog("Ứng dụng khởi động thành công.", "info");
  }, []);

  // Auto scroll logs
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const addLog = (message, type = "info") => {
    const time = new Date().toLocaleTimeString("vi-VN", { hour12: false });
    setLogs(prev => [...prev, { time, message, type }]);
  };

  const handleTestConnection = async () => {
    if (!appsScriptUrl) {
      addLog("Lỗi: Chưa nhập URL Google Apps Script Web App.", "error");
      alert("Vui lòng nhập URL Google Apps Script trước!");
      return;
    }
    setIsTestConnecting(true);
    addLog(`Đang kiểm tra kết nối tới: ${appsScriptUrl.substring(0, 40)}...`, "info");
    try {
      const response = await fetch(appsScriptUrl, {
        method: "POST",
        body: JSON.stringify({ action: "getSttMoi" })
      });
      const data = await response.json();
      if (data.success) {
        setNextStt(data.stt);
        addLog(`Kết nối thành công! Số thứ tự phiếu tiếp theo trên Google Sheet là: [${data.stt}].`, "success");
      } else {
        addLog(`Kết nối thất bại. Lỗi từ hệ thống: ${data.message}`, "error");
      }
    } catch (err) {
      addLog(`Lỗi mạng/CORS: ${err.message}. Đảm bảo đã deploy Apps Script dưới quyền 'Anyone' (Kể cả ẩn danh).`, "error");
    } finally {
      setIsTestConnecting(false);
    }
  };

  const handleAIExtract = async () => {
    if (!emailText.trim()) {
      addLog("Lỗi: Chưa nhập nội dung email giao việc.", "error");
      alert("Hãy dán nội dung email vào trước!");
      return;
    }
    setLoadingAI(true);
    addLog("Đang gửi email tới Anthropic Claude AI để phân tích...", "info");
    
    const todayStr = phieuData.ngay || new Date().toLocaleDateString("vi-VN");
    const promptText = `Phân tích email sau đây và trả về duy nhất 1 chuỗi JSON (chỉ JSON thuần túy, không có thẻ code block \`\`\`json, không có markdown, không có giải thích bên ngoài):

Nội dung Email:
"${emailText}"

Yêu cầu xuất ra các thuộc tính JSON chính xác theo cấu trúc sau:
{
  "ma": "mã phiếu có dạng MM.XX.NguonVietTat.BĐ. Trong đó MM là tháng hiện tại (ví dụ tháng 6 là '06'), XX là chữ viết tắt địa điểm viết hoa (ví dụ: BV Bắc Hà -> 'BH', Hapulico -> 'HAPU'), NguonVietTat viết tắt nguồn (ví dụ: Email -> 'Email', Điện thoại -> 'ĐT'), BĐ là Ban Điện. Ví dụ cụ thể: '06.BH.Email.BĐ'",
  "loai": "loại hệ thống kỹ thuật liên quan (ví dụ: 'Hệ thống điện', 'Máy bơm', 'Thang máy', 'Điều hòa', 'PCCC', 'Thiết bị khác')",
  "ten": "tên đầu việc tóm tắt ngắn gọn dưới 80 ký tự, nêu rõ hành động và địa điểm (ví dụ: 'Kiểm tra hệ thống Điện Cân Pha - BV Bắc Hà')",
  "thu_phi": "luôn là 'Không' trừ khi email đề cập thu tiền dịch vụ thì ghi 'Có'",
  "trang_thai": "mặc định là 'Chưa thực hiện'",
  "loai_kh": "mặc định là 'Nội bộ' nếu là của nội bộ tòa nhà hoặc các công trình thuộc Hapulico, hoặc 'Bên ngoài'",
  "nguon": "nguồn giao việc (ví dụ: 'Email Chủ tịch', 'Điện thoại lãnh đạo', 'Email Ban giám đốc')",
  "vi_tri": "vị trí, địa điểm cụ thể cần làm việc trích xuất trong email (ví dụ: 'BV Bắc Hà - tầng 3')",
  "ngay": "ngày phản ánh định dạng DD/MM/YYYY của ngày hôm nay (${todayStr})",
  "han": "hạn deadline hoàn thành định dạng DD/MM/YYYY lấy từ email, nếu không nhắc đến hạn thì để trống ''",
  "don_vi": "đơn vị thực hiện mặc định là 'Ban điện'",
  "to_doi": "tên người thực hiện chính hoặc tổ được giao việc (ví dụ: 'Huy PBĐ, Báu')",
  "noi_dung": "nội dung mô tả đầy đủ nhiệm vụ kỹ thuật cần triển khai (ví dụ: 'Kiểm tra toàn bộ hệ thống Điện Cân Pha để đảm bảo An toàn hệ thống Điện Bệnh viện')",
  "ghi_chu": "ghi chú nguồn (ví dụ: 'Nguồn: Email CT Phạm Đình Mạnh ngày ${todayStr}')"
}`;

    try {
      const headers = { "Content-Type": "application/json" };
      if (apiKey) {
        headers["x-api-key"] = apiKey;
        headers["anthropic-dangerously-allow-html-user-access"] = "true";
      }

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: headers,
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: promptText }]
        })
      });

      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`Anthropic API trả về mã lỗi ${res.status}: ${errBody}`);
      }

      const data = await res.json();
      const text = data.content.find(b => b.type === "text").text;
      
      // Clean JSON string from markdown decorators
      const cleanJson = text.replace(/```json|```/g, "").trim();
      const extracted = JSON.parse(cleanJson);
      
      setPhieuData(extracted);
      setIsModified(true);
      addLog("Phân tích email bằng Claude AI thành công! Form preview đã được cập nhật dữ liệu.", "success");
    } catch (err) {
      addLog(`Lỗi phân tích AI: ${err.message}`, "error");
      addLog("Mẹo: Đảm bảo bạn đang mở cửa sổ chat Claude.ai (Claude tự động inject API Key) hoặc đã cấu hình Anthropic API Key hợp lệ trong cài đặt ứng dụng.", "warning");
    } finally {
      setLoadingAI(false);
    }
  };

  const handleFieldChange = (field, value) => {
    setPhieuData(prev => ({ ...prev, [field]: value }));
    setIsModified(true);
  };

  const handleSaveToSheet = async () => {
    if (!appsScriptUrl) {
      addLog("Lỗi: Chưa có URL Google Apps Script.", "error");
      alert("Vui lòng nhập URL Google Apps Script Web App trước!");
      return;
    }
    
    setLoadingSheet(true);
    addLog("Đang ghi dữ liệu phiếu tiếp nhận lên Google Sheet...", "info");
    
    try {
      const res = await fetch(appsScriptUrl, {
        method: "POST",
        body: JSON.stringify({ 
          action: "addPhieu", 
          data: phieuData 
        })
      });
      
      const result = await res.json();
      if (result.success) {
        setSuccessInfo({ stt: result.stt, ten: phieuData.ten });
        setNextStt(result.stt + 1);
        addLog(`Ghi thành công! Đã thêm phiếu mới thành công vào Sheet với số STT: [${result.stt}].`, "success");
        setIsModified(false);
      } else {
        addLog(`Lỗi từ Apps Script: ${result.message}`, "error");
      }
    } catch (err) {
      addLog(`Lỗi ghi Sheet: ${err.message}. Vui lòng kiểm tra lại URL Apps Script và phân quyền deploy.`, "error");
    } finally {
      setLoadingSheet(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased p-3 sm:p-6 md:p-8 relative overflow-hidden">
      
      {/* Background Neon Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />
      
      {/* Dynamic styling for glassmorphism */}
      <style dangerouslySetInnerHTML={{__html: `
        .glass-card {
          background: rgba(15, 23, 42, 0.45);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .glass-card:hover {
          border-color: rgba(255, 255, 255, 0.15);
          box-shadow: 0 12px 40px 0 rgba(0, 0, 0, 0.5);
        }
        .neon-border-glow:focus-within {
          border-color: rgba(99, 102, 241, 0.6);
          box-shadow: 0 0 15px rgba(99, 102, 241, 0.2);
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.3);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.15);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}} />

      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* HEADER SECTION */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-indigo-600/20 text-indigo-400 rounded-lg border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.15)]">
                <Icons.Sparkles />
              </span>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-transparent">
                Hệ Thống Tiếp Nhận Việc Tự Động AI
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Phân tích email giao việc bằng Claude AI & Tự động đồng bộ sang Google Sheets
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">Trạng thái Sheet:</span>
            {nextStt ? (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Connected (STT mới: {nextStt})
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-full text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                Chưa kết nối Sheet
              </span>
            )}
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT COLUMN: CONFIG & EMAIL INPUT */}
          <div className="lg:col-span-5 space-y-6 flex flex-col">
            
            {/* CONFIG CARD */}
            <div className="glass-card rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
                <span className="text-indigo-400"><Icons.Settings /></span>
                <h2 className="text-md sm:text-lg font-semibold text-slate-200">Cấu hình kết nối</h2>
              </div>
              
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-400 flex justify-between">
                    <span>Apps Script Web App URL *</span>
                    {appsScriptUrl && <span className="text-indigo-400 text-[10px]">Tự động lưu state</span>}
                  </label>
                  <input
                    type="text"
                    value={appsScriptUrl}
                    onChange={(e) => setAppsScriptUrl(e.target.value)}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className="w-full bg-slate-900/80 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition duration-200"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-400 flex justify-between">
                    <span>Anthropic API Key (Không bắt buộc)</span>
                    <span className="text-slate-500 text-[10px]">Để trống nếu Claude tự chạy</span>
                  </label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-ant-..."
                    className="w-full bg-slate-900/80 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition duration-200"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTestConnecting}
                  className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-xs font-semibold tracking-wide border transition duration-200 ${
                    isTestConnecting
                      ? "bg-indigo-600/10 border-indigo-500/30 text-indigo-400 cursor-not-allowed"
                      : "bg-indigo-600 hover:bg-indigo-500 border-indigo-500 text-white shadow-lg shadow-indigo-600/10"
                  }`}
                >
                  {isTestConnecting ? (
                    <>
                      <Icons.Refresh />
                      <span>Đang kiểm tra...</span>
                    </>
                  ) : (
                    <>
                      <Icons.Database />
                      <span>Kiểm tra kết nối Sheet</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* EMAIL INPUT CARD */}
            <div className="glass-card rounded-2xl p-5 space-y-4 flex-1 flex flex-col min-h-[300px]">
              <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
                <span className="text-indigo-400"><Icons.Mail /></span>
                <h2 className="text-md sm:text-lg font-semibold text-slate-200">Nội dung Email Giao Việc</h2>
              </div>
              
              <div className="flex-1 flex flex-col space-y-3">
                <textarea
                  value={emailText}
                  onChange={(e) => setEmailText(e.target.value)}
                  placeholder="Dán toàn bộ nội dung email giao việc từ Lãnh đạo vào đây..."
                  className="w-full flex-1 bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-xs sm:text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition duration-200 resize-none min-h-[180px] custom-scrollbar"
                />
                
                <button
                  type="button"
                  onClick={handleAIExtract}
                  disabled={loadingAI}
                  className={`w-full py-2.5 px-4 rounded-lg text-xs sm:text-sm font-semibold tracking-wider flex items-center justify-center gap-2 border transition duration-200 ${
                    loadingAI
                      ? "bg-violet-600/10 border-violet-500/30 text-violet-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 border-violet-500/80 text-white shadow-lg shadow-indigo-500/20"
                  }`}
                >
                  {loadingAI ? (
                    <>
                      <Icons.Refresh />
                      <span>Đang phân tích email bằng AI...</span>
                    </>
                  ) : (
                    <>
                      <Icons.Sparkles />
                      <span>Phân tích email bằng Claude AI</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: PREVIEW FORM & ACTIVITY LOG */}
          <div className="lg:col-span-7 space-y-6 flex flex-col">
            
            {/* PREVIEW FORM CARD */}
            <div className="glass-card rounded-2xl p-5 space-y-4 relative">
              
              {/* Watermark/Notice when no data */}
              {!isModified && !phieuData.ten && (
                <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[2px] rounded-2xl flex flex-col items-center justify-center z-10 p-6 text-center">
                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-full text-slate-500 mb-2">
                    <Icons.FileText />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-300">Chưa có dữ liệu phiếu tiếp nhận</h3>
                  <p className="text-xs text-slate-500 max-w-xs mt-1">
                    Nhập URL Apps Script và phân tích email giao việc bằng Claude AI ở cột bên để tự động trích xuất thông tin phiếu tiếp nhận tại đây.
                  </p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-indigo-400"><Icons.FileText /></span>
                  <h2 className="text-md sm:text-lg font-semibold text-slate-200">Xem trước phiếu tiếp nhận</h2>
                </div>
                {isModified && (
                  <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-medium">
                    Có thay đổi chưa lưu
                  </span>
                )}
              </div>

              {/* Form Input fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                
                <div className="space-y-1">
                  <label className="font-semibold text-slate-400">Mã Phiếu (MM.XX.Nguon.BĐ)</label>
                  <input
                    type="text"
                    value={phieuData.ma}
                    onChange={(e) => handleFieldChange("ma", e.target.value)}
                    placeholder="Ví dụ: 06.BH.Email.BĐ"
                    className="w-full bg-slate-900/60 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500/50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-400">Loại Hệ Thống</label>
                  <select
                    value={phieuData.loai}
                    onChange={(e) => handleFieldChange("loai", e.target.value)}
                    className="w-full bg-slate-900/60 border border-slate-800 rounded px-2 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500/50"
                  >
                    <option value="Hệ thống điện">Hệ thống điện</option>
                    <option value="Máy bơm">Máy bơm</option>
                    <option value="Thang máy">Thang máy</option>
                    <option value="Điều hòa">Điều hòa</option>
                    <option value="PCCC">PCCC</option>
                    <option value="Thiết bị khác">Thiết bị khác</option>
                  </select>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="font-semibold text-slate-400">Tên Đầu Việc (Tối đa 80 ký tự)</label>
                  <input
                    type="text"
                    value={phieuData.ten}
                    onChange={(e) => handleFieldChange("ten", e.target.value)}
                    placeholder="Tên tóm tắt công việc"
                    maxLength={80}
                    className="w-full bg-slate-900/60 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500/50 font-medium text-slate-100"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-400">Nguồn Việc</label>
                  <input
                    type="text"
                    value={phieuData.nguon}
                    onChange={(e) => handleFieldChange("nguon", e.target.value)}
                    placeholder="Ví dụ: Email Chủ tịch"
                    className="w-full bg-slate-900/60 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500/50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-400">Vị Trí / Địa Điểm</label>
                  <input
                    type="text"
                    value={phieuData.vi_tri}
                    onChange={(e) => handleFieldChange("vi_tri", e.target.value)}
                    placeholder="Địa điểm triển khai"
                    className="w-full bg-slate-900/60 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500/50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-400">Ngày Phản Ánh (DD/MM/YYYY)</label>
                  <input
                    type="text"
                    value={phieuData.ngay}
                    onChange={(e) => handleFieldChange("ngay", e.target.value)}
                    placeholder="DD/MM/YYYY"
                    className="w-full bg-slate-900/60 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500/50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-400">Hạn Hoàn Thành / Deadline</label>
                  <input
                    type="text"
                    value={phieuData.han}
                    onChange={(e) => handleFieldChange("han", e.target.value)}
                    placeholder="DD/MM/YYYY hoặc bỏ trống"
                    className="w-full bg-slate-900/60 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500/50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-400">Thu Phí</label>
                  <select
                    value={phieuData.thu_phi}
                    onChange={(e) => handleFieldChange("thu_phi", e.target.value)}
                    className="w-full bg-slate-900/60 border border-slate-800 rounded px-2 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500/50"
                  >
                    <option value="Không">Không</option>
                    <option value="Có">Có</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-400">Trạng Thái</label>
                  <select
                    value={phieuData.trang_thai}
                    onChange={(e) => handleFieldChange("trang_thai", e.target.value)}
                    className="w-full bg-slate-900/60 border border-slate-800 rounded px-2 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500/50"
                  >
                    <option value="Chưa thực hiện">Chưa thực hiện</option>
                    <option value="Đang thực hiện">Đang thực hiện</option>
                    <option value="Hoàn thành">Hoàn thành</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-400">Đơn Vị Thực Hiện</label>
                  <input
                    type="text"
                    value={phieuData.don_vi}
                    onChange={(e) => handleFieldChange("don_vi", e.target.value)}
                    className="w-full bg-slate-900/60 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500/50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-400">Người / Tổ Thực Hiện</label>
                  <input
                    type="text"
                    value={phieuData.to_doi}
                    onChange={(e) => handleFieldChange("to_doi", e.target.value)}
                    placeholder="Ví dụ: Huy PBĐ, Báu"
                    className="w-full bg-slate-900/60 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500/50"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="font-semibold text-slate-400">Nội Dung Chi Tiết Công Việc</label>
                  <textarea
                    value={phieuData.noi_dung}
                    onChange={(e) => handleFieldChange("noi_dung", e.target.value)}
                    placeholder="Mô tả công việc"
                    rows={3}
                    className="w-full bg-slate-900/60 border border-slate-800 rounded p-2 text-slate-200 focus:outline-none focus:border-indigo-500/50 resize-none custom-scrollbar"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="font-semibold text-slate-400">Ghi Chú</label>
                  <input
                    type="text"
                    value={phieuData.ghi_chu}
                    onChange={(e) => handleFieldChange("ghi_chu", e.target.value)}
                    placeholder="Ghi chú thêm"
                    className="w-full bg-slate-900/60 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500/50"
                  />
                </div>

              </div>

              {/* Submit to Sheet */}
              <div className="pt-3 border-t border-slate-800/80 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveToSheet}
                  disabled={loadingSheet || !appsScriptUrl || !phieuData.ten}
                  className={`px-6 py-2.5 rounded-lg text-xs sm:text-sm font-semibold tracking-wider flex items-center gap-2 border transition duration-200 ${
                    loadingSheet || !appsScriptUrl || !phieuData.ten
                      ? "bg-emerald-600/10 border-emerald-500/30 text-emerald-400/50 cursor-not-allowed"
                      : "bg-emerald-600 hover:bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-600/10"
                  }`}
                >
                  {loadingSheet ? (
                    <>
                      <Icons.Refresh />
                      <span>Đang ghi Sheet...</span>
                    </>
                  ) : (
                    <>
                      <Icons.CheckCircle />
                      <span>Ghi vào Google Sheets</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* SUCCESS BANNER */}
            {successInfo && (
              <div className="glass-card bg-emerald-500/10 border-emerald-500/30 rounded-2xl p-4 flex items-start gap-3 animate-[fadeIn_0.5s_ease-out]">
                <span className="text-emerald-400 mt-0.5"><Icons.CheckCircle /></span>
                <div className="flex-1 text-xs">
                  <h4 className="font-semibold text-emerald-300 text-sm">Ghi dữ liệu thành công!</h4>
                  <p className="text-emerald-400 mt-0.5">
                    Phiếu đầu việc: <strong>"{successInfo.ten}"</strong> đã được tạo thành công trên Google Sheet tại dòng STT: <strong>{successInfo.stt}</strong>.
                  </p>
                  <button 
                    onClick={() => setSuccessInfo(null)}
                    className="mt-2 text-[10px] text-emerald-300 underline hover:text-emerald-200 font-medium"
                  >
                    Đóng thông báo
                  </button>
                </div>
              </div>
            )}

            {/* ACTIVITY LOG (TERMINAL STYLED CARD) */}
            <div className="glass-card rounded-2xl p-5 space-y-3 flex-1 flex flex-col min-h-[220px]">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400"><Icons.Terminal /></span>
                  <h3 className="text-xs font-semibold text-slate-300">Nhật ký hoạt động</h3>
                </div>
                <button
                  onClick={() => setLogs([])}
                  className="text-[10px] text-slate-500 hover:text-slate-400 transition"
                >
                  Xóa lịch sử
                </button>
              </div>

              {/* Logs display */}
              <div className="flex-1 bg-slate-950/80 border border-slate-900 rounded-xl p-3 font-mono text-[10px] sm:text-xs overflow-y-auto max-h-[180px] custom-scrollbar flex flex-col space-y-1">
                {logs.length === 0 ? (
                  <div className="text-slate-700 italic">Chưa có sự kiện nào...</div>
                ) : (
                  logs.map((log, index) => {
                    let typeClass = "text-slate-400";
                    if (log.type === "success") typeClass = "text-emerald-400 font-semibold";
                    if (log.type === "error") typeClass = "text-red-400 font-semibold";
                    if (log.type === "warning") typeClass = "text-amber-400";
                    return (
                      <div key={index} className="leading-relaxed flex items-start gap-1.5">
                        <span className="text-slate-600 font-normal shrink-0">[{log.time}]</span>
                        <span className={typeClass}>{log.message}</span>
                      </div>
                    );
                  })
                )}
                <div ref={logEndRef} />
              </div>
            </div>

          </div>

        </div>

        {/* FOOTER */}
        <footer className="text-center py-6 text-[10px] text-slate-600 border-t border-slate-900/60 mt-4">
          <p>© 2026 Ban Điện Hapulico • Hệ thống xử lý CMMS vận hành an toàn</p>
        </footer>

      </div>
    </div>
  );
}
