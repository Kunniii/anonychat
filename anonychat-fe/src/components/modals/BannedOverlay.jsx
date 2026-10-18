import { useState, useEffect } from 'react';
import { ShieldAlert, Clock, RefreshCw } from 'lucide-react';

/**
 * Formats remaining seconds into HH:MM:SS or DDd HH:MM:SS.
 * @param {number} totalSeconds
 * @returns {string}
 */
function formatCountdown(totalSeconds) {
  if (totalSeconds <= 0) return '00:00:00';
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n) => String(n).padStart(2, '0');

  if (days > 0) {
    return `${days}d ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

export const BannedOverlay = ({ banInfo, onDismiss }) => {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!banInfo) return null;

  const remainingSeconds = Math.max(
    0,
    Math.ceil((banInfo.expiresAt - now) / 1000)
  );
  const isExpired = remainingSeconds <= 0;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="banned-title"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-fade-in"
    >
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-rose-500/40 bg-[#0c0d12] p-6 sm:p-7 shadow-[0_24px_80px_rgba(255,42,42,0.18),0_0_1px_1px_rgba(255,42,42,0.3)]">
        {/* Glow hazard accents */}
        <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-32 bg-rose-500/20 blur-3xl rounded-full" />

        <div className="relative space-y-5">
          {/* Header */}
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-rose-500/40 bg-rose-500/10 text-rose-400 shadow-[0_0_20px_rgba(255,42,42,0.25)]">
              <ShieldAlert className="h-6 w-6 stroke-[2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-rose-500 animate-ping" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">
                  LỆNH KHÓA TÀI KHOẢN // SYSTEM ENFORCEMENT
                </span>
              </div>
              <h2 id="banned-title" className="text-base sm:text-lg font-bold text-white tracking-tight">
                Tài khoản tạm thời bị khóa
              </h2>
            </div>
          </div>

          {/* Reason Box */}
          <div className="rounded-xl border border-rose-500/20 bg-rose-950/20 p-4 space-y-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-300/80">
              LÝ DO VI PHẠM:
            </span>
            <p className="text-sm font-medium text-rose-100 break-words leading-relaxed">
              {banInfo.reason || 'Vi phạm tiêu chuẩn cộng đồng hoặc quy định trò chuyện ẩn danh.'}
            </p>
          </div>

          {/* Live Countdown Timer */}
          <div className="rounded-xl border border-white/[0.08] bg-black/50 p-4 sm:p-5 text-center space-y-2">
            <div className="flex items-center justify-center gap-1.5 text-xs text-zinc-400">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>{isExpired ? 'Trạng thái lệnh khóa:' : 'Thời gian khóa còn lại:'}</span>
            </div>

            <div className="font-mono text-3xl sm:text-4xl font-extrabold tracking-wider text-amber-300 drop-shadow-[0_0_12px_rgba(251,191,36,0.3)] tabular-nums">
              {isExpired ? '00:00:00' : formatCountdown(remainingSeconds)}
            </div>

            <p className="text-[11px] text-zinc-400">
              {isExpired
                ? 'Thời hạn khóa đã kết thúc. Bạn có thể kết nối lại ngay.'
                : 'Hệ thống sẽ tự động gỡ khóa khi đồng hồ đếm ngược kết thúc.'}
            </p>
          </div>

          {/* Client ID info */}
          {banInfo.clientId && (
            <div className="flex items-center justify-between gap-2 px-1 text-[11px] text-zinc-400 font-mono">
              <span className="text-zinc-400">Client ID:</span>
              <span className="truncate max-w-[240px] text-zinc-300" title={banInfo.clientId}>
                {banInfo.clientId}
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="pt-2">
            {isExpired ? (
              <button
                type="button"
                onClick={onDismiss}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-3 text-sm transition-all shadow-[0_0_24px_rgba(16,185,129,0.3)] cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Kết nối lại ngay</span>
              </button>
            ) : (
              <div className="text-center text-xs text-zinc-400">
                Nếu cho rằng có sự nhầm lẫn, vui lòng liên hệ admin qua email hoặc mục Góp ý.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BannedOverlay;
