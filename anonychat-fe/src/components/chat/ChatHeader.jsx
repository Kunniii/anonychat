import { ArrowLeft, Heart, LogOut, ShieldAlert, Star } from 'lucide-react';
import OnlineCounter from '../common/OnlineCounter.jsx';

export const ChatHeader = ({
  onlineCount,
  hasActiveConversation,
  isUserConnected,
  onEndConversation,
  onOpenReport,
  onOpenDonation,
  onGoHome,
  isVietnamTheme = false,
  onToggleVietnamTheme
}) => (
  <header className="flex shrink-0 items-center justify-between gap-3 p-4 sm:p-5 border-b border-white/[0.06] bg-[#0e0f14]/85 backdrop-blur-md">
    <div className="flex min-w-0 items-center gap-2.5 sm:gap-3.5">
      {onGoHome && (
        <button
          type="button"
          onClick={onGoHome}
          className="inline-flex min-h-8 shrink-0 items-center justify-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 text-xs font-medium text-zinc-300 transition-colors hover:bg-white/10 hover:text-white cursor-pointer"
          title="Về trang chủ AnonyChat"
          aria-label="Về trang chủ"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Trang chủ</span>
        </button>
      )}
      <div className="flex items-center gap-2">
        <span
          className={`h-2 w-2 shrink-0 rounded-full ${
            isUserConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400/80'
          }`}
          role="status"
          aria-label={isUserConnected ? 'Đã kết nối' : 'Đang tìm người chat'}
        />
        <span className="text-xs sm:text-sm font-medium text-white truncate max-w-[120px] sm:max-w-none">
          {isUserConnected ? 'Đang trò chuyện' : 'Đang tìm người lạ…'}
        </span>
      </div>
      {isVietnamTheme && (
        <button
          type="button"
          onClick={onToggleVietnamTheme}
          className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/50 bg-[#da251d] hover:bg-[#b81d16] px-3 py-1 text-xs font-bold text-amber-300 transition-all cursor-pointer shadow-[0_0_15px_rgba(218,37,29,0.5)]"
          title="Đang bật Theme Tự Hào Việt Nam (Bấm để tắt)"
        >
          <Star className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
          <span>Việt Nam</span>
        </button>
      )}
    </div>
    <div className="flex min-w-0 items-center justify-end gap-2">
      <OnlineCounter count={onlineCount} />
      {hasActiveConversation && onOpenReport && (
        <button
          type="button"
          onClick={onOpenReport}
          className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-300 hover:bg-rose-500/20 hover:border-rose-500/50 hover:text-white transition-all cursor-pointer"
          title="Báo cáo người lạ vi phạm"
          aria-label="Báo cáo người lạ"
        >
          <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
          <span className="hidden xs:inline sm:inline">Báo cáo</span>
        </button>
      )}
      <button
        type="button"
        onClick={onOpenDonation}
        className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-amber-200 hover:bg-white/10 transition-colors cursor-pointer"
        aria-label="Ủng hộ AnonyChat"
      >
        <Heart className="w-3.5 h-3.5 text-amber-300 fill-amber-300/30" />
        <span>Ủng hộ</span>
      </button>
      {hasActiveConversation && (
        <button
          type="button"
          onClick={onEndConversation}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-rose-950/60 hover:border-rose-500/30 hover:text-rose-200 transition-all cursor-pointer"
        >
          <LogOut className="w-3 h-3 text-rose-400" />
          <span>Rời phòng</span>
        </button>
      )}
    </div>
  </header>
);

export default ChatHeader;
