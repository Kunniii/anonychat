import React, { useEffect } from "react";
import confetti from "canvas-confetti";
import { Star } from "lucide-react";

/**
 * VietnamCelebrationOverlay
 * Grand celebration overlay for the "Tự Hào Việt Nam" Easter Egg.
 * Displays national red & gold confetti, the Golden Star on Crimson Flag,
 * and inspirational celebratory banner with quick theme toggle.
 */
export const VietnamCelebrationOverlay = ({
  isOpen = false,
  isVietnamTheme = false,
  onClose,
  onToggleVietnamTheme,
}) => {
  useEffect(() => {
    if (isOpen) {
      // Fire red and gold national celebration fireworks
      const end = Date.now() + 2500;
      const colors = ["#da251d", "#ffff00", "#ffd700", "#b22222", "#ffffff"];

      const frame = () => {
        confetti({
          particleCount: 7,
          angle: 60,
          spread: 70,
          origin: { x: 0, y: 0.7 },
          colors,
        });
        confetti({
          particleCount: 7,
          angle: 120,
          spread: 70,
          origin: { x: 1, y: 0.7 },
          colors,
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md p-6 sm:p-8 rounded-3xl text-center overflow-hidden border border-amber-500/40 shadow-[0_0_60px_rgba(218,37,29,0.35)]"
        style={{
          background: "linear-gradient(145deg, #2b0609 0%, #170407 100%)",
          color: "#ffffff",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle Dong Son drum background watermark */}
        <div className="absolute inset-0 opacity-20 pointer-events-none flex items-center justify-center overflow-hidden">
          <img
            src="/images/trong-dong.jpg"
            alt="Họa tiết Trống Đồng"
            className="dong-son-gold-overlay w-[360px] h-[360px] object-contain opacity-35"
          />
        </div>

        {/* Golden Star National Emblem Badge */}
        <div className="relative mx-auto w-24 h-24 rounded-full bg-[#da251d] border-4 border-amber-400 flex items-center justify-center shadow-[0_0_35px_rgba(255,215,0,0.6)] mb-6 animate-pulse">
          <Star className="w-12 h-12 text-amber-300 fill-amber-300" />
        </div>

        {/* Heading & Subtitle */}
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold tracking-widest uppercase bg-[#da251d] text-amber-300 border border-amber-400/50 mb-3 shadow-[0_0_15px_rgba(218,37,29,0.4)]">
          <Star className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
          <span>TỰ HÀO VIỆT NAM</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-200 to-yellow-400 tracking-tight">
          TỰ HÀO VIỆT NAM
        </h2>

        <p className="mt-3 text-sm text-zinc-300 leading-relaxed font-medium">
          Đất nước nghìn năm văn hiến
          <br />
          Chúc bạn có những cuộc trò chuyện văn minh, ấm áp và kết nối thêm
          nhiều người bạn tuyệt vời.
        </p>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (onToggleVietnamTheme) onToggleVietnamTheme();
            }}
            className="w-full sm:w-auto px-5 py-2.5 rounded-full text-xs font-bold bg-[#da251d] hover:bg-[#b81d16] text-amber-300 border border-amber-400/50 transition-all shadow-[0_0_20px_rgba(218,37,29,0.5)] cursor-pointer inline-flex items-center justify-center gap-1.5"
          >
            <Star className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
            <span>
              {isVietnamTheme
                ? "Đang dùng Theme Trống Đồng"
                : "Kích hoạt Theme Trống Đồng"}
            </span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-full text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all cursor-pointer"
          >
            Đóng [✕]
          </button>
        </div>

        <p className="mt-4 text-[11px] text-zinc-400 font-mono-clean">
          Gõ <code className="text-amber-300 font-bold">tự hào việt nam</code> bất kỳ lúc nào để bật/tắt
        </p>
      </div>
    </div>
  );
};

export default VietnamCelebrationOverlay;
