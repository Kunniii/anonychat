import React, { useState } from 'react';
import confetti from 'canvas-confetti';

export const LandingPage = ({ onStartChat, onOpenDonation }) => {
  const [activeFaq, setActiveFaq] = useState(null);
  const [mockReactions, setMockReactions] = useState(['❤️', '😂']);
  const [hasCelebrated, setHasCelebrated] = useState(false);

  const triggerMockConfetti = () => {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 }
    });
    setHasCelebrated(true);
  };

  const handleAddMockReaction = (emoji) => {
    setMockReactions((prev) => [...prev, emoji]);
    confetti({
      particleCount: 25,
      spread: 40,
      origin: { y: 0.6 }
    });
  };

  const faqs = [
    {
      q: 'Có ai biết mình là ai không? Có bị lộ Facebook không?',
      a: 'Tuyệt đối không! Đến admin còn không biết bạn là ai nữa là người lạ. Không cần tài khoản, không email, không profile. Bạn bước vào đây hoàn toàn là một ẩn số.'
    },
    {
      q: 'Có mất tiền hay phải nạp VIP để chat không?',
      a: 'Hoàn toàn miễn phí 100%! Không nạp VIP, không quảng cáo pop-up khó chịu. Mở web lên là quẩy thôi.'
    },
    {
      q: 'Đang tám chuyện hay mà lỡ rớt mạng thì sao?',
      a: 'Đừng hoảng! AnonyChat có cơ chế giữ phòng chat lên tới 120 giây. Bật lại mạng là bạn tự động kết nối lại đúng người ấy mà không bị lạc nhau.'
    },
    {
      q: 'Nói chuyện không hợp gu hoặc gặp người kỳ cục?',
      a: 'Bấm nút "Tìm người mới" là hệ thống đổi partner ngay lập tức. Có nút "Báo cáo" để admin xử lý những thành phần quấy rối.'
    },
    {
      q: 'Tính năng "chửi admin" là cái gì vậy?',
      a: 'Đó là kênh feedback độc quyền! Khi trong phòng chat, bạn chỉ cần gõ /admin hoặc bấm nút góp ý là có thể gửi tâm tư trực tiếp tới dev.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#08090b] text-[#f4f4f5] font-mono selection:bg-emerald-500 selection:text-black overflow-x-hidden">
      {/* ── TOP NAVBAR ── */}
      <header className="sticky top-0 z-50 border-b border-zinc-800/80 bg-[#08090b]/85 backdrop-blur-md px-4 sm:px-8 py-3.5 transition-colors">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <a href="/" className="flex items-center gap-2.5 group">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-base sm:text-lg font-bold tracking-tight text-white group-hover:text-emerald-400 transition-colors">
              AnonyChat<span className="text-emerald-400">.</span>
            </span>
            <span className="hidden sm:inline-block border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 px-2 py-0.5 text-[10px] font-medium tracking-wide">
              #Ẩn_Danh_100%
            </span>
          </a>

          <nav className="hidden md:flex items-center gap-6 text-xs text-zinc-400 font-medium">
            <a href="#demo" className="hover:text-white transition-colors">Demo chat</a>
            <a href="#tinh-nang" className="hover:text-white transition-colors">Tính năng</a>
            <a href="#luat-chill" className="hover:text-white transition-colors">Luật chill</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
            {onOpenDonation && (
              <button
                type="button"
                onClick={onOpenDonation}
                className="hover:text-amber-300 transition-colors cursor-pointer"
              >
                Ủng hộ ☕
              </button>
            )}
          </nav>

          <div className="flex items-center gap-2.5">
            <a
              href="/admin"
              className="border border-zinc-800 px-2.5 py-1.5 text-[11px] text-zinc-500 hover:text-zinc-300 hover:border-zinc-700 transition-colors"
            >
              [Admin]
            </a>
            <button
              type="button"
              onClick={onStartChat}
              className="border border-emerald-400/80 bg-emerald-400 hover:bg-emerald-300 active:translate-y-px text-black font-extrabold px-3.5 sm:px-4 py-1.5 text-xs tracking-wider transition-all cursor-pointer shadow-[0_0_20px_rgba(16,185,129,0.25)]"
            >
              VÀO CHAT NGAY 🚀
            </button>
          </div>
        </div>
      </header>

      {/* ── HERO SECTION ── */}
      <section className="relative pt-12 pb-16 sm:pt-20 sm:pb-24 px-4 sm:px-8 border-b border-zinc-800/60 overflow-hidden">
        {/* Subtle grid and ambient glow */}
        <div className="absolute inset-0 tactical-grid-bg opacity-30 pointer-events-none" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 border border-zinc-700/80 bg-zinc-900/90 px-3.5 py-1 text-xs text-zinc-300 mb-6 shadow-inner">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>KHÔNG CẦN TẠO NICK • KHÔNG LỘ DANH TÍNH • VÀO LÀ GÁY</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.15]">
            Gặp người lạ, tám thả ga. <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
              Không lo lộ nick!
            </span>
          </h1>

          <p className="mt-5 text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Nền tảng chat ẩn danh 1-1 ghép cặp thần tốc. Không cần email, không số điện thoại, không profile.
            Hợp gu thì tâm sự thâu đêm, không hợp thì bấm <span className="text-zinc-200 font-semibold">[Next]</span> trong một nốt nhạc!
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={onStartChat}
              className="border-2 border-emerald-400 bg-emerald-400 hover:bg-emerald-300 active:translate-y-0.5 text-black font-black px-6 py-3 text-sm tracking-wider transition-all cursor-pointer shadow-[0_0_30px_rgba(16,185,129,0.35)]"
            >
              BẮT ĐẦU TRÒ CHUYỆN NGAY 💬
            </button>
            <a
              href="#demo"
              className="border border-zinc-700 bg-zinc-900/80 hover:bg-zinc-800 hover:border-zinc-500 text-zinc-300 font-bold px-5 py-3 text-sm transition-all"
            >
              Xem Demo Chat 👇
            </a>
          </div>

          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
            <div className="border border-zinc-800/80 bg-zinc-950/60 p-3.5">
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Tốc độ ghép</p>
              <p className="mt-1 text-xl font-extrabold text-emerald-400">&lt; 3 giây</p>
              <p className="text-[11px] text-zinc-400">Tìm đối phương tức thì</p>
            </div>
            <div className="border border-zinc-800/80 bg-zinc-950/60 p-3.5">
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Dữ liệu cá nhân</p>
              <p className="mt-1 text-xl font-extrabold text-cyan-400">0% lưu trữ</p>
              <p className="text-[11px] text-zinc-400">Ẩn danh tuyệt đối</p>
            </div>
            <div className="border border-zinc-800/80 bg-zinc-950/60 p-3.5">
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Giữ phòng chat</p>
              <p className="mt-1 text-xl font-extrabold text-amber-400">120 giây</p>
              <p className="text-[11px] text-zinc-400">Cứu nguy khi rớt mạng</p>
            </div>
            <div className="border border-zinc-800/80 bg-zinc-950/60 p-3.5">
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Phí sử dụng</p>
              <p className="mt-1 text-xl font-extrabold text-white">0 VNĐ</p>
              <p className="text-[11px] text-zinc-400">Mãi mãi miễn phí</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── INTERACTIVE CHAT MOCKUP DEMO ── */}
      <section id="demo" className="py-16 sm:py-20 px-4 sm:px-8 border-b border-zinc-800/60 bg-[#0a0b0e]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-xs font-bold text-emerald-400 tracking-widest uppercase">
              // TRẢI NGHIỆM TRỰC QUAN
            </span>
            <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold text-white">
              Giao diện mượt mà, đầy đủ đồ chơi vui nhộn
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-zinc-400">
              Thử bấm vào các nút bên dưới để test thử hiệu ứng thật của AnonyChat!
            </p>
          </div>

          {/* Mock chat window */}
          <div className="border-2 border-zinc-700 bg-[#0d0f14] shadow-2xl overflow-hidden max-w-2xl mx-auto">
            {/* Header */}
            <div className="border-b border-zinc-800 bg-[#12151c] px-4 py-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-bold text-white">Người lạ #82bf</span>
                <span className="text-[10px] text-zinc-500">[Đang kết nối]</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={triggerMockConfetti}
                  className="border border-amber-400/40 bg-amber-400/10 text-amber-300 hover:bg-amber-400 hover:text-black px-2 py-0.5 text-[10px] font-bold transition-colors cursor-pointer"
                >
                  🎉 Bắn pháo hoa
                </button>
                <span className="text-zinc-600">|</span>
                <span className="text-rose-400 font-bold text-[10px] cursor-not-allowed">[Thoát]</span>
              </div>
            </div>

            {/* Chat message body */}
            <div className="p-4 sm:p-6 space-y-3.5 min-h-[22rem] flex flex-col justify-end bg-[#0a0c10]">
              {/* Milestone alert */}
              <div className="text-center">
                <span className="inline-block border border-amber-500/30 bg-amber-500/10 text-amber-300 text-[11px] px-3 py-1 font-medium">
                  🎉 Vào guồng rồi — hai bạn đã gửi 10 tin nhắn cho nhau!
                </span>
              </div>

              {/* Message from stranger */}
              <div className="flex flex-col items-start max-w-[85%]">
                <span className="text-[10px] text-zinc-500 mb-1">Người lạ • 13:42</span>
                <div className="bg-zinc-800/90 text-zinc-100 px-3.5 py-2.5 text-xs leading-relaxed border border-zinc-700/60 relative">
                  Alo người lạ ơi! Nay có chuyện gì vui không, vào đây xả stress tí coi? 😎
                  <div className="absolute -bottom-2 -right-2 flex gap-1">
                    {mockReactions.map((r, i) => (
                      <span key={i} className="text-xs bg-zinc-900 border border-zinc-700 px-1 rounded-sm">{r}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Message from self */}
              <div className="flex flex-col items-end self-end max-w-[85%]">
                <span className="text-[10px] text-zinc-500 mb-1">Bạn • 13:43</span>
                <div className="bg-emerald-600 text-white px-3.5 py-2.5 text-xs leading-relaxed border border-emerald-500 shadow-sm">
                  Haha vừa cày deadline xong mệt phờ râu, vào đây tám nhảm xíu cho đỡ chán nè bro!
                </div>
              </div>

              {/* Easter egg message */}
              <div className="text-center">
                <span className="inline-block border border-zinc-800 bg-zinc-900/60 text-zinc-400 text-[10px] px-2.5 py-0.5 font-mono">
                  [SYSTEM] Bên kia đang chửi admin.
                </span>
              </div>

              {/* Stranger typing indicator */}
              <div className="flex items-center gap-1.5 text-zinc-400 text-[11px] pt-1">
                <span className="inline-block w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" />
                <span className="inline-block w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                <span className="inline-block w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                <span className="text-[10px] text-zinc-500 ml-1">Người lạ đang gõ phím...</span>
              </div>
            </div>

            {/* Demo interactive reaction toolbar */}
            <div className="border-t border-zinc-800 bg-[#0e1117] p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-zinc-400 mr-1">Thử thả reaction:</span>
                {['❤️', '😂', '😮', '👍', '🔥'].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleAddMockReaction(emoji)}
                    className="hover:scale-125 active:scale-95 transition-transform bg-zinc-800 hover:bg-zinc-700 p-1 px-1.5 rounded text-sm cursor-pointer"
                    title={`Thả ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={onStartChat}
                className="text-emerald-400 hover:text-emerald-300 font-bold text-xs underline underline-offset-4 cursor-pointer"
              >
                Vào chat thật ngay &gt;&gt;
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── BENTO FEATURES GRID ── */}
      <section id="tinh-nang" className="py-16 sm:py-24 px-4 sm:px-8 border-b border-zinc-800/60">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold text-emerald-400 tracking-widest uppercase">
              // TÍNH NĂNG ĂN TIỀN
            </span>
            <h2 className="mt-2 text-3xl font-extrabold text-white">
              Vì sao bạn sẽ thích AnonyChat?
            </h2>
            <p className="mt-2 text-sm text-zinc-400">
              Được thiết kế tối giản, tập trung 100% vào cảm xúc trò chuyện mộc mạc và chân thật nhất.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Feature 1 (Large) */}
            <div className="md:col-span-2 border border-zinc-800 bg-[#0d0f15] p-6 sm:p-8 relative overflow-hidden group hover:border-emerald-500/50 transition-colors">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-3">
                <span>⚡</span>
                <span>GHÉP CẶP 1-1 THẦN TỐC</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                Không chờ đợi, quẹt là có người nói chuyện
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-xl">
                Thuật toán xếp hàng tự động kết nối bạn với một người lạ ngẫu nhiên trong vài giây.
                Nếu không hợp gu? Bấm <span className="text-white font-semibold">"Tìm người mới"</span>,
                hệ thống tự động kích hoạt cooldown thông minh để bạn không bị gặp lại người cũ vừa thoát.
              </p>
              <div className="mt-6 flex flex-wrap gap-2 text-[11px]">
                <span className="border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-zinc-300">#Anti_Spam_Rematch</span>
                <span className="border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-zinc-300">#Zero_Latency_WS</span>
                <span className="border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-zinc-300">#Auto_Queue</span>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="border border-zinc-800 bg-[#0d0f15] p-6 sm:p-8 hover:border-cyan-500/50 transition-colors">
              <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-3">
                <span>🔒</span>
                <span>ẨN DANH 100%</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
                Không nick, không profile, không dấu vết
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                Tự do chia sẻ tâm tư thầm kín mà không sợ ai phán xét. Bạn là ai ngoài đời không quan trọng,
                ở đây chỉ có tâm hồn trò chuyện với tâm hồn.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="border border-zinc-800 bg-[#0d0f15] p-6 sm:p-8 hover:border-amber-500/50 transition-colors">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-3">
                <span>📶</span>
                <span>CỨU MẠNG KHI MẤT SÓNG</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
                Tự giữ phòng 120 giây khi rớt wifi
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                Lỡ tay quẹt nhầm reload hay mạng chập chờn? Đừng lo, AnonyChat giữ chỗ tới 2 phút
                để bạn tự động nối lại đúng cuộc trò chuyện đang dang dở!
              </p>
            </div>

            {/* Feature 4 */}
            <div className="border border-zinc-800 bg-[#0d0f15] p-6 sm:p-8 hover:border-rose-500/50 transition-colors">
              <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase tracking-wider mb-3">
                <span>🎉</span>
                <span>NỔ PHÁO HOA ĂN MỪNG</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
                Càng tám nhiều, pháo hoa nổ càng to
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                Hệ thống tự đếm cột mốc 10, 25, 50, 100 tin nhắn... và bất ngờ bắn pháo hoa giấy confetti
                chúc mừng tình bạn mới đâm chồi của hai bạn!
              </p>
            </div>

            {/* Feature 5 */}
            <div className="border border-zinc-800 bg-[#0d0f15] p-6 sm:p-8 hover:border-violet-500/50 transition-colors">
              <div className="flex items-center gap-2 text-violet-400 text-xs font-bold uppercase tracking-wider mb-3">
                <span>📬</span>
                <span>GỬI ẢNH &amp; PHẢN HỒI REALTIME</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
                Chia sẻ ảnh JPEG nét căng, reaction nhạy
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                Gửi ảnh khoảnh khắc vui vẻ an toàn (dưới 5MB), xem đối phương đang gõ phím,
                nhận thông báo tin nhắn đã tới nơi và thả emoji nảy lò xo vui mắt.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── LUẬT CHILL & VĂN HÓA ── */}
      <section id="luat-chill" className="py-16 sm:py-20 px-4 sm:px-8 border-b border-zinc-800/60 bg-[#090b0f]">
        <div className="max-w-4xl mx-auto">
          <div className="border-2 border-dashed border-zinc-700 bg-[#0e1117] p-6 sm:p-10">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-3">
              <span>📜</span>
              <span>VĂN HÓA ANONYCHAT // LUẬT CHƠI ĐẸP</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-4">
              4 nguyên tắc vàng để ai cũng vui vẻ
            </h2>

            <div className="space-y-4 text-xs sm:text-sm text-zinc-300">
              <div className="flex items-start gap-3">
                <span className="text-emerald-400 font-bold shrink-0">[01]</span>
                <p>
                  <strong className="text-white">Tôn trọng đối phương:</strong> Người ở đầu dây bên kia cũng là một con người bằng xương bằng thịt. Hãy chào nhau lịch sự và nói chuyện tử tế nhé.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-emerald-400 font-bold shrink-0">[02]</span>
                <p>
                  <strong className="text-white">Không hợp gu thì Next văn minh:</strong> Thấy không chung sở thích hay cảm thấy gượng gạo? Bấm nút <em>"Tìm người mới"</em> nhẹ nhàng, đừng buông lời cay đắng.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-amber-400 font-bold shrink-0">[03]</span>
                <p>
                  <strong className="text-white">Bảo vệ thông tin cá nhân:</strong> Không chia sẻ mật khẩu, số tài khoản ngân hàng, mã OTP hay địa chỉ nhà cho bất kỳ ai trên mạng.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-rose-400 font-bold shrink-0">[04]</span>
                <p>
                  <strong className="text-white">Bức xúc hay có ý tưởng hay?</strong> Gõ ngay <code className="text-rose-300 bg-rose-950/60 px-1 border border-rose-800">/admin</code> để gửi lời nhắn trực tiếp tới dev!
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ SECTION ── */}
      <section id="faq" className="py-16 sm:py-24 px-4 sm:px-8 border-b border-zinc-800/60">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-bold text-emerald-400 tracking-widest uppercase">
              // THẮC MẮC PHỔ BIẾN
            </span>
            <h2 className="mt-2 text-3xl font-extrabold text-white">
              Hỏi nhanh — Đáp gọn
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => {
              const isOpen = activeFaq === index;
              return (
                <div
                  key={index}
                  className="border border-zinc-800 bg-[#0d0f15] transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => setActiveFaq(isOpen ? null : index)}
                    className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 text-xs sm:text-sm font-bold text-white hover:text-emerald-400 transition-colors cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <span className="text-zinc-500 font-mono text-base shrink-0">
                      {isOpen ? '−' : '+'}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 sm:px-5 sm:pb-5 text-xs text-zinc-400 border-t border-zinc-800/60 pt-3 leading-relaxed">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA BANNER ── */}
      <section className="py-16 sm:py-24 px-4 sm:px-8 bg-gradient-to-b from-[#08090b] via-[#0d1210] to-[#08090b] text-center relative">
        <div className="max-w-3xl mx-auto">
          <span className="text-emerald-400 text-xs font-bold uppercase tracking-widest">
            ● NGAY BÂY GIỜ
          </span>
          <h2 className="mt-3 text-3xl sm:text-5xl font-black text-white tracking-tight">
            Sẵn sàng tìm một người lạ thú vị chưa?
          </h2>
          <p className="mt-4 text-xs sm:text-sm text-zinc-400 max-w-lg mx-auto">
            Hàng trăm người đang online chờ ghép cặp. Mở phòng chat lên và bắt đầu câu chuyện của bạn thôi!
          </p>
          <div className="mt-8">
            <button
              type="button"
              onClick={onStartChat}
              className="border-2 border-emerald-400 bg-emerald-400 hover:bg-emerald-300 active:translate-y-1 text-black font-black px-8 py-3.5 text-sm sm:text-base tracking-wider transition-all cursor-pointer shadow-[0_0_40px_rgba(16,185,129,0.4)]"
            >
              VÀO PHÒNG CHAT NGAY 🚀
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-zinc-800/80 bg-[#060709] px-4 sm:px-8 py-8 text-xs text-zinc-500">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="font-bold text-zinc-300">AnonyChat</span>
            <span className="mx-2">•</span>
            <span>Anonymous Stranger Chat Platform</span>
            <p className="mt-1 text-[11px] text-zinc-600">
              Made with passion for real-time human connection. 100% Free &amp; Private.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[11px]">
            <button
              type="button"
              onClick={onStartChat}
              className="text-zinc-400 hover:text-emerald-400 transition-colors cursor-pointer"
            >
              Chat ngay (/chats)
            </button>
            <a href="/admin" className="text-zinc-400 hover:text-zinc-200 transition-colors">
              Admin Console
            </a>
            {onOpenDonation && (
              <button
                type="button"
                onClick={onOpenDonation}
                className="text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
              >
                Ủng hộ tác giả ☕
              </button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
