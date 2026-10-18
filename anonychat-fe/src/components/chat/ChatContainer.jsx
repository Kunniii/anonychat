export const ChatContainer = ({ children, isVietnamTheme = false }) => (
  <div className="relative h-full min-h-0 w-full flex flex-col items-center justify-center p-0 sm:p-4 md:p-6 lg:p-8">
    {/* Outer Shell for Double-Bezel Architecture */}
    <div
      className={`relative flex h-full min-h-0 w-full max-w-4xl xl:max-w-5xl flex-col rounded-none sm:rounded-[2rem] sm:p-1.5 transition-all duration-500 ${
        isVietnamTheme
          ? 'sm:bg-[#da251d]/10 sm:ring-1 sm:ring-amber-500/30 shadow-[0_24px_80px_rgba(218,37,29,0.35)]'
          : 'sm:bg-white/[0.03] sm:ring-1 sm:ring-white/10 shadow-[0_24px_80px_rgba(0,0,0,0.6)]'
      }`}
    >
      {/* Inner Core */}
      <div
        className={`relative flex h-full min-h-0 w-full flex-col rounded-none sm:rounded-[calc(2rem-0.375rem)] border-0 sm:border transition-all duration-500 overflow-hidden ${
          isVietnamTheme
            ? 'border-amber-500/30 bg-gradient-to-b from-[#3a080f] via-[#240409] to-[#170205] shadow-[0_0_60px_rgba(218,37,29,0.35),inset_0_1px_1px_rgba(255,215,0,0.15)]'
            : 'border-white/[0.06] bg-[#0c0d12] shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)]'
        }`}
      >
        {/* ── VIETNAM DONG SON OVERLAY DIRECTLY IN CHAT UI BACKGROUND ── */}
        {isVietnamTheme && (
          <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center select-none overflow-hidden">
            {/* Ambient radial red glow */}
            <div
              className="absolute inset-0 opacity-75"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 50% 45%, rgba(218, 37, 29, 0.45) 0%, rgba(139, 0, 0, 0.25) 55%, transparent 80%)'
              }}
            />
            <img
              src="/images/trong-dong.jpg"
              alt="Họa tiết Trống Đồng Đông Sơn"
              className="dong-son-gold-overlay w-[800px] h-[800px] sm:w-[960px] sm:h-[960px] md:w-[1100px] md:h-[1100px] max-w-none object-contain opacity-50 drop-shadow-[0_0_20px_rgba(200,140,40,0.15)]"
            />
          </div>
        )}

        {children}
      </div>
    </div>
  </div>
);

export default ChatContainer;
