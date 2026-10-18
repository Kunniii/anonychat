import { ArrowLeft, Heart, LogOut, ShieldAlert, Star, Terminal } from "lucide-react";
import OnlineCounter from "../common/OnlineCounter.jsx";

export const ChatHeader = ({
  onlineCount,
  hasActiveConversation,
  isUserConnected,
  onEndConversation,
  onOpenReport,
  onOpenDonation,
  onGoHome,
  isVietnamTheme = false,
  onToggleVietnamTheme,
  isMatrixTheme = false,
  onToggleMatrixTheme,
}) => (
  <header
    className={`flex shrink-0 items-center justify-between gap-3 p-4 sm:p-5 border-b backdrop-blur-md relative z-10 transition-colors duration-500 ${
      isMatrixTheme
        ? "border-emerald-500/20 bg-[#021308]/85"
        : isVietnamTheme
        ? "border-amber-500/20 bg-[#220407]/85"
        : "border-white/[0.06] bg-[#0e0f14]/85"
    }`}
  >
    <div className="flex min-w-0 items-center gap-2 sm:gap-3">
      {onGoHome && (
        <button
          type="button"
          onClick={onGoHome}
          className="h-8 shrink-0 inline-flex items-center justify-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 sm:px-3 text-xs font-medium text-zinc-300 transition-colors hover:bg-white/10 hover:text-white cursor-pointer"
          title="Về trang chủ AnonyChat"
          aria-label="Về trang chủ"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Trang chủ</span>
        </button>
      )}
      <div className="h-8 flex items-center gap-2">
        <span
          className={`h-2 w-2 shrink-0 rounded-full ${
            isUserConnected ? "bg-emerald-400 animate-pulse" : "bg-amber-400/80"
          }`}
          role="status"
          aria-label={isUserConnected ? "Connected" : "Searching"}
        />
      </div>
      {isMatrixTheme && (
        <button
          type="button"
          onClick={onToggleMatrixTheme}
          className="h-8 shrink-0 inline-flex items-center justify-center gap-1.5 rounded-full border border-emerald-400/50 bg-[#052613] hover:bg-[#07361b] px-3.5 text-xs font-mono font-bold text-emerald-300 transition-all cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.4)]"
          title="Đang bật Matrix Mode (Bấm để tắt hoặc mở lại bảng)"
        >
          <Terminal className="w-3.5 h-3.5 text-emerald-400" />
          <span>Matrix</span>
        </button>
      )}
      {!isMatrixTheme && isVietnamTheme && (
        <button
          type="button"
          onClick={onToggleVietnamTheme}
          className="h-8 shrink-0 inline-flex items-center justify-center gap-1.5 rounded-full border border-amber-400/50 bg-[#da251d] hover:bg-[#b81d16] px-3.5 text-xs font-bold text-amber-300 transition-all cursor-pointer shadow-[0_0_15px_rgba(218,37,29,0.5)]"
          title="Đang bật Theme Tự Hào Việt Nam (Bấm để tắt)"
        >
          <Star className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
          <span>Việt Nam</span>
        </button>
      )}
    </div>
    <div className="flex min-w-0 items-center justify-end gap-1.5 sm:gap-2">
      <OnlineCounter count={onlineCount} />
      {hasActiveConversation && onOpenReport && (
        <button
          type="button"
          onClick={onOpenReport}
          className="h-8 w-8 inline-flex items-center justify-center rounded-full border border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 hover:border-rose-500/50 hover:text-white transition-all cursor-pointer shadow-[0_0_10px_rgba(244,63,94,0.15)]"
          title="Báo cáo người lạ"
          aria-label="Báo cáo người lạ"
        >
          <ShieldAlert className="w-4 h-4 text-rose-400" />
        </button>
      )}
      <button
        type="button"
        onClick={onOpenDonation}
        className="h-8 w-8 inline-flex items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-zinc-300 hover:text-amber-200 hover:bg-white/10 hover:border-amber-400/30 transition-all cursor-pointer shadow-[0_0_10px_rgba(255,255,255,0.05)]"
        title="Ủng hộ dự án"
        aria-label="Ủng hộ AnonyChat"
      >
        <Heart className="w-4 h-4 text-amber-300 fill-amber-300/30" />
      </button>
      {hasActiveConversation && (
        <button
          type="button"
          onClick={onEndConversation}
          className="h-8 w-8 inline-flex items-center justify-center rounded-full border border-white/10 bg-white/10 text-white hover:bg-rose-950/60 hover:border-rose-500/40 hover:text-rose-200 transition-all cursor-pointer shadow-[0_0_10px_rgba(255,255,255,0.05)]"
          title="Rời phòng chat"
          aria-label="Rời phòng chat"
        >
          <LogOut className="w-3.5 h-3.5 text-rose-400" />
        </button>
      )}
    </div>
  </header>
);

export default ChatHeader;
