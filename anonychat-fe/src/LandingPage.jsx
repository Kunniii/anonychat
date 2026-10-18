import React, { useState } from "react";
import confetti from "canvas-confetti";

export const LandingPage = ({ onStartChat, onOpenDonation }) => {
  const [activeFaq, setActiveFaq] = useState(null);
  const [mockReactions, setMockReactions] = useState([
    { type: "heart", count: 4 },
    { type: "laugh", count: 2 },
  ]);
  const [hasCelebrated, setHasCelebrated] = useState(false);

  const triggerMockConfetti = () => {
    confetti({
      particleCount: 40,
      spread: 55,
      origin: { y: 0.65 },
      colors: ["#ffffff", "#a1a1aa", "#6ee7b7", "#93c5fd"],
    });
    setHasCelebrated(true);
  };

  const handleAddMockReaction = (type) => {
    setMockReactions((prev) =>
      prev.map((r) => (r.type === type ? { ...r, count: r.count + 1 } : r)),
    );
    confetti({
      particleCount: 20,
      spread: 40,
      origin: { y: 0.6 },
      colors: ["#ffffff", "#6ee7b7", "#cbd5e1"],
    });
  };

  const faqs = [
    {
      q: "Có ai biết danh tính thật hoặc tài khoản mạng xã hội của mình không?",
      a: "Tuyệt đối không. Hệ thống không yêu cầu tạo tài khoản, không liên kết email hay bất kỳ trang cá nhân nào. Đến cả quản trị viên cũng không có thông tin định danh của bạn. Mọi phiên trò chuyện đều là một ẩn số hoàn toàn.",
    },
    {
      q: "Nền tảng có thu phí, nạp VIP hay hiển thị quảng cáo pop-up không?",
      a: "Hoàn toàn miễn phí 100%. Không có nạp VIP, không bị làm phiền bởi quảng cáo tràn màn hình. Bạn chỉ cần truy cập và bắt đầu cuộc trò chuyện ngay tức thì.",
    },
    {
      q: "Đang tâm sự dở mà vô tình mất kết nối hoặc chuyển mạng 4G thì sao?",
      a: "Bạn hoàn toàn có thể yên tâm. AnonyChat tích hợp cơ chế giữ chỗ phiên kết nối kéo dài 120 giây. Khi đường truyền mạng phục hồi, bạn sẽ tự động được kết nối lại với đúng đối phương mà không bị mất dấu.",
    },
    {
      q: "Nếu gặp phải người không phù hợp hoặc có hành vi quấy rối?",
      a: "Bạn có thể bấm kết thúc và chuyển sang người mới trong vòng 1 giây. Ngoài ra, giao diện có sẵn tính năng báo cáo vi phạm để quản trị viên kiểm tra và xử lý kịp thời.",
    },
    {
      q: "Tính năng gửi góp ý bằng lệnh /admin hoạt động như thế nào?",
      a: "Đây là đường dây trực tiếp kết nối tới đội ngũ phát triển. Trong phòng chat, bạn có thể bấm nút góp ý hoặc gõ /admin để chia sẻ cảm nghĩ, phản ánh lỗi hay đề xuất tính năng mới.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#08090c] text-[#f4f4f5] font-sans-clean selection:bg-white selection:text-black overflow-x-hidden relative">
      {/* ── AMBIENT BACKGROUND GLOW (FIXED & SUBTLE) ── */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-40"
        style={{
          backgroundImage: `
            radial-gradient(circle at 50% 12%, rgba(255, 255, 255, 0.05) 0%, transparent 60%),
            radial-gradient(circle at 85% 45%, rgba(110, 231, 183, 0.03) 0%, transparent 50%),
            radial-gradient(circle at 15% 75%, rgba(147, 197, 253, 0.03) 0%, transparent 50%)
          `,
        }}
      />

      {/* ── FLOATING FLUID ISLAND NAVBAR ── */}
      <div className="fixed top-0 inset-x-0 z-50 flex justify-center px-4 pt-5 pointer-events-none">
        <header className="pointer-events-auto flex items-center justify-between gap-6 sm:gap-8 rounded-full border border-white/[0.08] bg-[#0c0d12]/80 backdrop-blur-xl px-4 sm:px-6 py-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.4)] transition-all duration-500 ease-spring">
          {/* Brand */}
          <a href="/" className="flex items-center gap-2.5 group">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            <span className="font-editorial text-lg tracking-tight font-medium text-white group-hover:text-zinc-200 transition-colors">
              AnonyChat<span className="text-zinc-400">.</span>
            </span>
          </a>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs text-zinc-400 font-medium">
            <a
              href="#tinh-nang"
              className="hover:text-white transition-colors duration-200"
            >
              Tính năng
            </a>
            <a
              href="#demo"
              className="hover:text-white transition-colors duration-200"
            >
              Trải nghiệm
            </a>
            <a
              href="#luat-chill"
              className="hover:text-white transition-colors duration-200"
            >
              Quy ước
            </a>
            <a
              href="#faq"
              className="hover:text-white transition-colors duration-200"
            >
              Hỏi đáp
            </a>
            {onOpenDonation && (
              <button
                type="button"
                onClick={onOpenDonation}
                className="hover:text-amber-200 transition-colors duration-200 cursor-pointer"
              >
                Ủng hộ
              </button>
            )}
          </nav>

          {/* Action Pills */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onStartChat}
              className="inline-flex items-center gap-1.5 rounded-full bg-white text-zinc-950 font-semibold px-3.5 sm:px-4 py-1.5 text-xs transition-all duration-300 ease-spring hover:bg-[#e4e4e7] active:scale-[0.97] cursor-pointer"
            >
              <span>Vào chat</span>
              <svg
                viewBox="0 0 16 16"
                fill="none"
                className="w-3.5 h-3.5 stroke-current stroke-[2]"
                aria-hidden="true"
              >
                <path
                  d="M4 12L12 4M12 4H6M12 4V10"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </header>
      </div>

      {/* ── HERO SECTION ── */}
      <section className="relative z-10 pt-36 pb-24 md:pt-44 md:pb-32 px-4 sm:px-8 max-w-6xl mx-auto text-center">
        {/* Eyebrow Pill */}
        <div className="inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-[11px] uppercase tracking-[0.2em] font-medium bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/20 mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>100% Ẩn Danh • Ghép Cặp Tức Thì</span>
        </div>

        {/* Editorial Heading */}
        <h1 className="font-editorial font-light text-4xl sm:text-6xl md:text-7xl lg:text-[5.25rem] text-white tracking-tight leading-[1.08] max-w-4xl mx-auto">
          Gặp gỡ ngẫu nhiên, <br className="hidden sm:inline" />
          <span className="italic font-normal text-zinc-300">sẻ chia</span> ẩn
          danh.
        </h1>

        {/* Lead Subtitle */}
        <p className="mt-7 text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto font-normal leading-relaxed">
          Không cần tạo tài khoản, không để lại danh tính, không hồ sơ cá nhân.
          Chỉ có bạn và một người lạ ở đầu dây bên kia, bắt đầu một câu chuyện
          thật.
        </p>

        {/* Island CTA Buttons */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <button
            type="button"
            onClick={onStartChat}
            className="group rounded-full bg-white text-zinc-950 font-semibold px-7 py-3.5 text-sm inline-flex items-center gap-3 transition-all duration-500 ease-spring hover:bg-[#ebebeb] active:scale-[0.98] shadow-[0_0_35px_rgba(255,255,255,0.12)] cursor-pointer"
          >
            <span>Bắt đầu cuộc trò chuyện</span>
            <span className="w-7 h-7 rounded-full bg-black/10 flex items-center justify-center transition-transform duration-500 ease-spring group-hover:translate-x-1 group-hover:-translate-y-0.5">
              <svg
                viewBox="0 0 16 16"
                fill="none"
                className="w-3.5 h-3.5 stroke-current stroke-[2]"
                aria-hidden="true"
              >
                <path
                  d="M4 12L12 4M12 4H6M12 4V10"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </button>

          <a
            href="#demo"
            className="rounded-full border border-white/10 bg-white/[0.03] text-zinc-300 font-medium px-6 py-3.5 text-sm hover:bg-white/[0.08] hover:border-white/20 transition-all duration-300 ease-spring"
          >
            Xem trước trải nghiệm
          </a>
        </div>

        {/* Minimalist Metrics Strip */}
        <div className="mt-20 pt-10 border-t border-white/[0.07] grid grid-cols-2 md:grid-cols-4 gap-6 text-left max-w-4xl mx-auto">
          <div>
            <p className="text-[11px] font-mono-clean uppercase tracking-widest text-zinc-500">
              Tốc độ ghép
            </p>
            <p className="mt-1 font-editorial text-2xl md:text-3xl font-light text-white">
              &lt; 3 giây
            </p>
            <p className="mt-0.5 text-xs text-zinc-400">
              Kết nối tức thời khi có bạn chat
            </p>
          </div>
          <div>
            <p className="text-[11px] font-mono-clean uppercase tracking-widest text-zinc-500">
              Lưu vết cá nhân
            </p>
            <p className="mt-1 font-editorial text-2xl md:text-3xl font-light text-white">
              0 byte
            </p>
            <p className="mt-0.5 text-xs text-zinc-400">
              Không lưu IP, cookies hay profile
            </p>
          </div>
          <div>
            <p className="text-[11px] font-mono-clean uppercase tracking-widest text-zinc-500">
              Giữ phòng chat
            </p>
            <p className="mt-1 font-editorial text-2xl md:text-3xl font-light text-white">
              120 giây
            </p>
            <p className="mt-0.5 text-xs text-zinc-400">
              Bảo lưu phiên khi rớt mạng
            </p>
          </div>
          <div>
            <p className="text-[11px] font-mono-clean uppercase tracking-widest text-zinc-500">
              Chi phí sử dụng
            </p>
            <p className="mt-1 font-editorial text-2xl md:text-3xl font-light text-white">
              Miễn phí
            </p>
            <p className="mt-0.5 text-xs text-zinc-400">
              Không nạp thẻ, không quảng cáo
            </p>
          </div>
        </div>
      </section>

      {/* ── INTERACTIVE DEMO (DOUBLE-BEZEL ARCHITECTURE) ── */}
      <section
        id="demo"
        className="relative z-10 py-24 md:py-32 px-4 sm:px-8 max-w-5xl mx-auto"
      >
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-[11px] font-mono-clean uppercase tracking-[0.2em] text-zinc-500">
            Trực quan hóa
          </span>
          <h2 className="font-editorial text-3xl sm:text-4xl font-light text-white tracking-tight mt-2">
            Đơn giản, riêng tư, trọn vẹn cảm xúc.
          </h2>
          <p className="mt-3 text-sm text-zinc-400">
            Một không gian tối giản tập trung duy nhất vào nội dung trò chuyện
            giữa hai con người.
          </p>
        </div>

        {/* Double-Bezel Wrapper */}
        <div className="rounded-[2rem] p-1.5 sm:p-2 bg-white/[0.03] ring-1 ring-white/[0.08] shadow-[0_24px_80px_rgba(0,0,0,0.5)]">
          <div className="rounded-[calc(2rem-0.375rem)] bg-[#0d0e13] border border-white/[0.05] p-5 sm:p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)]">
            {/* Minimalist macOS Window Chrome */}
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-4 mb-6">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-white/20" />
                <span className="w-2.5 h-2.5 rounded-full bg-white/20" />
                <span className="w-2.5 h-2.5 rounded-full bg-white/20" />
              </div>
              <div className="flex items-center gap-2 text-xs font-mono-clean text-zinc-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>đã kết nối với một người lạ</span>
              </div>
              <span className="text-[11px] font-mono-clean text-zinc-600">
                anonychat://session
              </span>
            </div>

            {/* Simulated Chat Dialogue */}
            <div className="space-y-4 max-w-2xl mx-auto py-2">
              {/* Partner message */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-white/[0.06] border border-white/[0.08] flex items-center justify-center shrink-0 text-zinc-400 text-xs font-mono-clean">
                  #1
                </div>
                <div>
                  <div className="rounded-2xl rounded-tl-sm bg-zinc-900/80 border border-white/[0.06] px-4 py-3 text-sm text-zinc-200 max-w-md leading-relaxed">
                    Chào bạn! Đêm muộn rồi mà vẫn chưa ngủ à?
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono-clean mt-1 block">
                    23:42 • Người lạ
                  </span>
                </div>
              </div>

              {/* Self message */}
              <div className="flex items-start justify-end gap-3">
                <div className="text-right">
                  <div className="rounded-2xl rounded-tr-sm bg-white text-zinc-950 font-medium px-4 py-3 text-sm max-w-md leading-relaxed text-left shadow-sm">
                    Ừ, đang nghe chút nhạc lofi rồi tình cờ tìm thấy web này. Ở
                    đây yên tĩnh thật, không có newfeed hay tin nhắn phiền phức.
                  </div>
                  <div className="flex items-center justify-end gap-1.5 mt-1 text-[10px] text-zinc-500 font-mono-clean">
                    <span>Đã chuyển giao</span>
                    <svg
                      viewBox="0 0 16 16"
                      fill="none"
                      className="w-3 h-3 stroke-emerald-400 stroke-2"
                      aria-hidden="true"
                    >
                      <path
                        d="M3 8.5L6.5 12L13 4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Partner reply */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-white/[0.06] border border-white/[0.08] flex items-center justify-center shrink-0 text-zinc-400 text-xs font-mono-clean">
                  #1
                </div>
                <div>
                  <div className="rounded-2xl rounded-tl-sm bg-zinc-900/80 border border-white/[0.06] px-4 py-3 text-sm text-zinc-200 max-w-md leading-relaxed">
                    Chuẩn luôn! Đôi khi nói chuyện với một người không hề biết
                    mình là ai lại thấy nhẹ nhõm nhất.
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    {mockReactions.map((r) => (
                      <span
                        key={r.type}
                        className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-xs text-zinc-300 font-mono-clean"
                      >
                        {r.type === "heart" ? (
                          <svg
                            viewBox="0 0 16 16"
                            fill="currentColor"
                            className="w-3 h-3 text-rose-400"
                            aria-hidden="true"
                          >
                            <path d="M8 13.5l-5.5-5.5A3.5 3.5 0 017.5 3.2L8 3.7l.5-.5a3.5 3.5 0 015 5L8 13.5z" />
                          </svg>
                        ) : (
                          <svg
                            viewBox="0 0 16 16"
                            fill="none"
                            className="w-3 h-3 stroke-amber-400 stroke-2"
                            aria-hidden="true"
                          >
                            <circle cx="8" cy="8" r="6" />
                            <path
                              d="M5.5 10c.8 1 1.7 1.5 2.5 1.5s1.7-.5 2.5-1.5"
                              strokeLinecap="round"
                            />
                            <circle
                              cx="6"
                              cy="6.5"
                              r="0.75"
                              fill="currentColor"
                            />
                            <circle
                              cx="10"
                              cy="6.5"
                              r="0.75"
                              fill="currentColor"
                            />
                          </svg>
                        )}
                        <span>{r.count}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Reaction Controls */}
            <div className="mt-8 pt-5 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <span className="font-mono-clean text-[11px] text-zinc-500">
                  Thử tương tác:
                </span>
                <button
                  type="button"
                  onClick={() => handleAddMockReaction("heart")}
                  className="rounded-full border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/20 px-3 py-1 text-xs text-zinc-200 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <svg
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    className="w-3 h-3 text-rose-400"
                    aria-hidden="true"
                  >
                    <path d="M8 13.5l-5.5-5.5A3.5 3.5 0 017.5 3.2L8 3.7l.5-.5a3.5 3.5 0 015 5L8 13.5z" />
                  </svg>
                  <span>Thả tim</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddMockReaction("laugh")}
                  className="rounded-full border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/20 px-3 py-1 text-xs text-zinc-200 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <svg
                    viewBox="0 0 16 16"
                    fill="none"
                    className="w-3 h-3 stroke-amber-400 stroke-2"
                    aria-hidden="true"
                  >
                    <circle cx="8" cy="8" r="6" />
                    <path
                      d="M5.5 10c.8 1 1.7 1.5 2.5 1.5s1.7-.5 2.5-1.5"
                      strokeLinecap="round"
                    />
                    <circle cx="6" cy="6.5" r="0.75" fill="currentColor" />
                    <circle cx="10" cy="6.5" r="0.75" fill="currentColor" />
                  </svg>
                  <span>Nụ cười</span>
                </button>
                <button
                  type="button"
                  onClick={triggerMockConfetti}
                  className="rounded-full border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/20 px-3 py-1 text-xs text-zinc-200 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <svg
                    viewBox="0 0 16 16"
                    fill="none"
                    className="w-3 h-3 stroke-sky-400 stroke-2"
                    aria-hidden="true"
                  >
                    <path
                      d="M2 14l5-5M9 7l1-3 4-2-2 4-3 1M6 10l-2 1M11 5l1 1"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span>Cột mốc chat</span>
                </button>
              </div>

              <button
                type="button"
                onClick={onStartChat}
                className="text-xs font-semibold text-white hover:text-zinc-300 transition-colors inline-flex items-center gap-1.5 group cursor-pointer"
              >
                <span>Vào phòng trò chuyện thật</span>
                <span className="transition-transform group-hover:translate-x-1">
                  →
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── ASYMMETRICAL BENTO FEATURE GRID (DOUBLE-BEZEL) ── */}
      <section
        id="tinh-nang"
        className="relative z-10 py-24 md:py-32 px-4 sm:px-8 max-w-6xl mx-auto"
      >
        <div className="max-w-2xl mb-14">
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-medium bg-white/[0.05] text-zinc-300 ring-1 ring-white/10 mb-4">
            Tính Năng Nền Tảng
          </div>
          <h2 className="font-editorial text-3xl sm:text-5xl font-light text-white tracking-tight leading-tight">
            Kiến trúc tối giản cho <br />
            trải nghiệm nguyên bản.
          </h2>
          <p className="mt-4 text-sm sm:text-base text-zinc-400 leading-relaxed font-normal">
            Loại bỏ mọi rườm rà. Chúng tôi thiết kế AnonyChat dựa trên nguyên lý
            tôn trọng quyền riêng tư và tối ưu tốc độ thời gian thực.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Card 1: Fast Matching (col-span-7) */}
          <div className="md:col-span-7 rounded-[2rem] p-1.5 bg-white/[0.03] ring-1 ring-white/[0.08] transition-all duration-300 hover:ring-white/20">
            <div className="h-full rounded-[calc(2rem-0.375rem)] bg-[#0d0e13] p-7 md:p-8 flex flex-col justify-between shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)]">
              <div>
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-300 mb-6">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="w-5 h-5 stroke-current stroke-2"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="9" />
                    <circle cx="12" cy="12" r="5" strokeDasharray="3 3" />
                    <circle cx="12" cy="12" r="1" fill="currentColor" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-white tracking-tight">
                  Ghép cặp 1-1 thần tốc
                </h3>
                <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
                  Thuật toán hàng đợi thông minh tự động kết nối hai người dùng
                  ngẫu nhiên trong chớp mắt. Nếu cuộc trò chuyện không còn phù
                  hợp, chỉ một chạm để chuyển sang đối tác mới mà không có độ
                  trễ.
                </p>
              </div>
              <div className="mt-8 pt-5 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono-clean text-zinc-400">
                <span>Hàng đợi: ngẫu nhiên</span>
                <span className="text-emerald-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Thời gian thực
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: 100% Privacy (col-span-5) */}
          <div className="md:col-span-5 rounded-[2rem] p-1.5 bg-white/[0.03] ring-1 ring-white/[0.08] transition-all duration-300 hover:ring-white/20">
            <div className="h-full rounded-[calc(2rem-0.375rem)] bg-[#0d0e13] p-7 md:p-8 flex flex-col justify-between shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)]">
              <div>
                <div className="w-10 h-10 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-300 mb-6">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="w-5 h-5 stroke-current stroke-2"
                    aria-hidden="true"
                  >
                    <path
                      d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-white tracking-tight">
                  Tuyệt đối riêng tư
                </h3>
                <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
                  Không email, không số điện thoại, không tài khoản mạng xã hội.
                  Mọi dữ liệu phiên kết nối biến mất hoàn toàn khi bạn rời đi.
                </p>
              </div>
              <div className="mt-8 pt-5 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono-clean text-zinc-400">
                <span>Theo dõi: không lưu</span>
                <span className="text-sky-400">Ẩn danh 100%</span>
              </div>
            </div>
          </div>

          {/* Card 3: Reconnect Grace Period (col-span-4) */}
          <div className="md:col-span-4 rounded-[2rem] p-1.5 bg-white/[0.03] ring-1 ring-white/[0.08] transition-all duration-300 hover:ring-white/20">
            <div className="h-full rounded-[calc(2rem-0.375rem)] bg-[#0d0e13] p-7 md:p-8 flex flex-col justify-between shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)]">
              <div>
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-300 mb-6">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="w-5 h-5 stroke-current stroke-2"
                    aria-hidden="true"
                  >
                    <path
                      d="M23 4v6h-6M1 20v-6h6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-white tracking-tight">
                  Hồi phục kết nối 120s
                </h3>
                <p className="mt-2.5 text-xs text-zinc-400 leading-relaxed">
                  Khi bạn chuyển sóng 4G hoặc đường truyền gián đoạn, phòng chat
                  được giữ nguyên để bạn không bị mất liên lạc đột ngột.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/[0.06] text-xs font-mono-clean text-amber-300/80">
                Bảo lưu: 120 giây
              </div>
            </div>
          </div>

          {/* Card 4: Real-time signals & Media (col-span-4) */}
          <div className="md:col-span-4 rounded-[2rem] p-1.5 bg-white/[0.03] ring-1 ring-white/[0.08] transition-all duration-300 hover:ring-white/20">
            <div className="h-full rounded-[calc(2rem-0.375rem)] bg-[#0d0e13] p-7 md:p-8 flex flex-col justify-between shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)]">
              <div>
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-300 mb-6">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="w-5 h-5 stroke-current stroke-2"
                    aria-hidden="true"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path
                      d="M21 15l-5-5L5 21"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-white tracking-tight">
                  Tín hiệu &amp; Ảnh nén tối ưu
                </h3>
                <p className="mt-2.5 text-xs text-zinc-400 leading-relaxed">
                  Hiển thị nhịp gõ phím tức thì và hỗ trợ gửi ảnh nén mượt mà,
                  loại bỏ metadata bảo vệ tối đa tính riêng tư.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/[0.06] text-xs font-mono-clean text-indigo-300/80">
                Mã hóa: Binary stream
              </div>
            </div>
          </div>

          {/* Card 5: Direct Dev Channel (col-span-4) */}
          <div className="md:col-span-4 rounded-[2rem] p-1.5 bg-white/[0.03] ring-1 ring-white/[0.08] transition-all duration-300 hover:ring-white/20">
            <div className="h-full rounded-[calc(2rem-0.375rem)] bg-[#0d0e13] p-7 md:p-8 flex flex-col justify-between shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)]">
              <div>
                <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-300 mb-6">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="w-5 h-5 stroke-current stroke-2"
                    aria-hidden="true"
                  >
                    <path
                      d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-white tracking-tight">
                  Kênh tâm sự nhà phát triển
                </h3>
                <p className="mt-2.5 text-xs text-zinc-400 leading-relaxed">
                  Gõ lệnh{" "}
                  <code className="font-mono-clean text-zinc-200 bg-white/[0.06] px-1.5 py-0.5 rounded text-[11px]">
                    /admin
                  </code>{" "}
                  trong khung chat để gửi ý kiến phản hồi hoặc góp ý thẳng thắn
                  cho dev.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/[0.06] text-xs font-mono-clean text-rose-300/80">
                Lệnh nhanh: /admin
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── EDITORIAL GUIDE / "LUẬT CHƠI ĐẸP" ── */}
      <section
        id="luat-chill"
        className="relative z-10 py-24 md:py-32 px-4 sm:px-8 max-w-5xl mx-auto border-t border-white/[0.06]"
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div>
            <span className="text-[11px] font-mono-clean uppercase tracking-[0.2em] text-zinc-500">
              Quy ước cộng đồng
            </span>
            <h2 className="font-editorial text-3xl sm:text-5xl font-light text-white tracking-tight mt-2">
              Bốn nguyên tắc ứng xử văn minh.
            </h2>
          </div>
          <p className="text-sm text-zinc-400 max-w-sm">
            Để mỗi cuộc trò chuyện đều là một trải nghiệm dễ chịu và đáng nhớ
            cho cả hai người.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 md:gap-12">
          {/* Rule 01 */}
          <div className="border-t border-white/[0.08] pt-6">
            <span className="font-editorial text-2xl font-light text-zinc-500">
              01
            </span>
            <h3 className="text-base font-semibold text-white mt-3 tracking-tight">
              Tôn trọng không gian riêng
            </h3>
            <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
              Không gặng hỏi số điện thoại, địa chỉ nhà hay tài khoản mạng xã
              hội nếu đối phương chưa thực sự thoải mái chia sẻ.
            </p>
          </div>

          {/* Rule 02 */}
          <div className="border-t border-white/[0.08] pt-6">
            <span className="font-editorial text-2xl font-light text-zinc-500">
              02
            </span>
            <h3 className="text-base font-semibold text-white mt-3 tracking-tight">
              Giữ kín bí mật người khác
            </h3>
            <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
              Những tâm sự sâu kín được thổ lộ tại đây nên được giữ lại tại đây.
              Hãy là người biết lắng nghe và giữ trọn niềm tin.
            </p>
          </div>

          {/* Rule 03 */}
          <div className="border-t border-white/[0.08] pt-6">
            <span className="font-editorial text-2xl font-light text-zinc-500">
              03
            </span>
            <h3 className="text-base font-semibold text-white mt-3 tracking-tight">
              Lịch sự và chừng mực
            </h3>
            <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
              Không gửi nội dung thô tục, quấy rối hay spam vô nghĩa. Hệ thống
              có bộ lọc tự động và nút báo cáo dành cho vi phạm.
            </p>
          </div>

          {/* Rule 04 */}
          <div className="border-t border-white/[0.08] pt-6">
            <span className="font-editorial text-2xl font-light text-zinc-500">
              04
            </span>
            <h3 className="text-base font-semibold text-white mt-3 tracking-tight">
              Rời đi thanh thản khi hết gu
            </h3>
            <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
              Nếu câu chuyện không còn hợp, bạn có thể chào tạm biệt hoặc bấm
              nút tìm người mới một cách nhẹ nhàng. Không áp lực.
            </p>
          </div>
        </div>
      </section>

      {/* ── FAQ ACCORDION (MINIMALIST STRIPPED ARCHITECTURE) ── */}
      <section
        id="faq"
        className="relative z-10 py-24 md:py-32 px-4 sm:px-8 max-w-4xl mx-auto border-t border-white/[0.06]"
      >
        <div className="text-center mb-16">
          <span className="text-[11px] font-mono-clean uppercase tracking-[0.2em] text-zinc-500">
            Giải đáp thắc mắc
          </span>
          <h2 className="font-editorial text-3xl sm:text-4xl font-light text-white tracking-tight mt-2">
            Những câu hỏi thường gặp.
          </h2>
        </div>

        <div className="space-y-0">
          {faqs.map((faq, idx) => {
            const isOpen = activeFaq === idx;
            return (
              <div key={idx} className="border-b border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setActiveFaq(isOpen ? null : idx)}
                  className="w-full py-6 flex items-center justify-between text-left gap-4 hover:text-white transition-colors cursor-pointer group"
                  aria-expanded={isOpen}
                >
                  <span className="text-base sm:text-lg font-medium text-zinc-200 group-hover:text-white transition-colors">
                    {faq.q}
                  </span>
                  <span className="w-7 h-7 rounded-full border border-white/10 flex items-center justify-center shrink-0 text-sm font-mono-clean text-zinc-400 group-hover:text-white group-hover:border-white/20 transition-all">
                    {isOpen ? "−" : "+"}
                  </span>
                </button>
                {isOpen && (
                  <div className="pb-6 pr-8 text-sm text-zinc-400 leading-relaxed font-normal animate-fadeIn">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── GRAND EDITORIAL BOTTOM CTA ── */}
      <section className="relative z-10 py-24 md:py-36 px-4 sm:px-8 max-w-5xl mx-auto text-center border-t border-white/[0.06]">
        <h2 className="font-editorial text-4xl sm:text-6xl font-light text-white tracking-tight max-w-3xl mx-auto leading-tight">
          Sẵn sàng cho một câu chuyện <br className="hidden sm:inline" />
          <span className="italic font-normal text-zinc-300">
            hoàn toàn mới?
          </span>
        </h2>
        <p className="mt-5 text-sm sm:text-base text-zinc-400 max-w-md mx-auto leading-relaxed">
          Đang có những người lạ trực tuyến chờ ghép cặp. Mở phòng chat và khám
          phá xem hôm nay bạn sẽ gặp ai.
        </p>

        <div className="mt-10">
          <button
            type="button"
            onClick={onStartChat}
            className="group rounded-full bg-white text-zinc-950 font-semibold px-8 py-4 text-sm sm:text-base inline-flex items-center gap-3.5 transition-all duration-500 ease-spring hover:bg-[#ebebeb] active:scale-[0.98] shadow-[0_0_45px_rgba(255,255,255,0.15)] cursor-pointer"
          >
            <span>Vào phòng trò chuyện</span>
            <span className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center transition-transform duration-500 ease-spring group-hover:translate-x-1 group-hover:-translate-y-0.5">
              <svg
                viewBox="0 0 16 16"
                fill="none"
                className="w-4 h-4 stroke-current stroke-[2]"
                aria-hidden="true"
              >
                <path
                  d="M4 12L12 4M12 4H6M12 4V10"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </button>
        </div>
      </section>

      {/* ── MINIMALIST FOOTER ── */}
      <footer className="relative z-10 border-t border-white/[0.06] bg-[#06070a] px-4 sm:px-8 py-10 text-xs text-zinc-500">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-6">
          <div>
            <p className="font-editorial text-base text-zinc-300 font-medium">
              AnonyChat.
            </p>
            <p className="mt-1 text-zinc-500 font-sans-clean">
              Nền tảng trò chuyện ẩn danh 1-1 trực tuyến. Miễn phí và bảo mật
              tuyệt đối.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6 font-medium">
            <button
              type="button"
              onClick={onStartChat}
              className="hover:text-zinc-300 transition-colors cursor-pointer"
            >
              Phòng chat (/chats)
            </button>
            <a href="/admin" className="hover:text-zinc-300 transition-colors">
              Quản trị (/admin)
            </a>
            {onOpenDonation && (
              <button
                type="button"
                onClick={onOpenDonation}
                className="hover:text-amber-300 transition-colors cursor-pointer"
              >
                Ủng hộ tác giả
              </button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
