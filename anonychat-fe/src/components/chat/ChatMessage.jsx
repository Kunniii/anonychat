import { useState, useEffect, useRef } from 'react';
import { X, Flag } from 'lucide-react';
import { REACTION_EMOJIS } from '../../constants/chat.js';

export const ChatMessage = ({
  message,
  image,
  isMine,
  delivered,
  isLastDelivered,
  partnerColor,
  timestamp,
  reactions,
  reactionAnimation,
  index,
  originIndex,
  author,
  onReact,
  onReport,
  isVietnamTheme = false
}) => {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isDelayedSending, setIsDelayedSending] = useState(false);
  const hideTimeoutRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  const handleMouseEnter = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
    hideTimeoutRef.current = window.setTimeout(() => {
      setIsHovered(false);
      setPickerOpen(false);
    }, 150);
  };

  const handleFocus = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    setIsHovered(true);
  };

  const handleBlur = (e) => {
    if (containerRef.current && containerRef.current.contains(e.relatedTarget)) {
      return;
    }
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
    hideTimeoutRef.current = window.setTimeout(() => {
      setIsHovered(false);
      setPickerOpen(false);
    }, 150);
  };

  useEffect(() => {
    if (isMine && !delivered) {
      const elapsed = Date.now() - (timestamp || Date.now());
      if (elapsed >= 1000) {
        setIsDelayedSending(true);
      } else {
        const timer = window.setTimeout(() => {
          setIsDelayedSending(true);
        }, Math.max(0, 1000 - elapsed));
        return () => window.clearTimeout(timer);
      }
    } else {
      setIsDelayedSending(false);
    }
  }, [isMine, delivered, timestamp]);

  const selectedReaction = reactions?.self ?? null;
  const ownReaction = reactions?.self ?? null;
  const peerReaction = reactions?.peer ?? null;

  const handleReaction = (emoji) => {
    const sent = onReact({ index, originIndex, author }, emoji);
    if (sent) {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }
      setIsHovered(false);
      setPickerOpen(false);
    }
  };

  const formattedTime = timestamp
    ? new Date(timestamp).toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
    : '';

  const hasReaction = Boolean(peerReaction || ownReaction);
  const showPicker = isHovered || pickerOpen;

  return (
    <div
      className={`flex w-full items-start ${isMine ? 'justify-end' : 'justify-start'} ${
        hasReaction ? 'my-2 mb-4' : 'my-2'
      }`}
    >
      <div
        ref={containerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className={`group relative flex flex-col ${
          isMine ? 'items-end' : 'items-start'
        } max-w-[85%] md:max-w-xl lg:max-w-2xl`}
      >
        {/* Floating reaction picker toolbar */}
        <div
          className={`absolute -top-11 z-20 flex items-center gap-1 rounded-full border border-white/10 bg-[#121318]/95 p-1 shadow-[0_8px_24px_rgba(0,0,0,0.5)] transition-all duration-150 ${
            isMine ? 'right-0' : 'left-0'
          } ${
            showPicker
              ? 'pointer-events-auto opacity-100 translate-y-0 scale-100'
              : 'pointer-events-none opacity-0 translate-y-1 scale-95'
          }`}
          role="group"
          aria-label="Chọn cảm xúc"
        >
          {REACTION_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              aria-label={`Phản ứng ${emoji}`}
              aria-pressed={selectedReaction === emoji}
              onClick={() => handleReaction(emoji)}
              className={`flex h-8 w-8 items-center justify-center rounded-full text-base transition-colors hover:bg-white/10 ${
                selectedReaction === emoji ? 'bg-white/15' : ''
              }`}
            >
              {emoji}
            </button>
          ))}
          {selectedReaction && (
            <button
              type="button"
              aria-label="Bỏ reaction"
              onClick={() => handleReaction(null)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          {!isMine && onReport && (
            <button
              type="button"
              aria-label="Báo cáo tin nhắn"
              title="Báo cáo nội dung vi phạm"
              onClick={() => onReport({ text: message || '[ảnh]', image: !!image })}
              className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-white/10 hover:text-rose-400"
            >
              <Flag className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Bubble */}
        <button
          type="button"
          title={formattedTime}
          aria-label="Chạm hoặc nhấn Enter để chọn cảm xúc"
          onClick={() => setPickerOpen((prev) => !prev)}
          className={`animate-chat-message ${
            isMine ? 'origin-bottom-right' : 'origin-bottom-left'
          } relative w-fit max-w-full break-words px-4 py-3 text-[15.5px] sm:text-[16px] leading-relaxed transition-all duration-200 text-left active:scale-[0.99] cursor-pointer ${
            isMine
              ? isVietnamTheme
                ? 'rounded-2xl rounded-tr-sm bg-gradient-to-br from-[#ffeef1] via-[#fedde3] to-[#fecdd6] text-[#2c0409] font-medium shadow-[0_4px_16px_rgba(218,37,29,0.22),inset_0_1px_1px_rgba(255,255,255,0.85)] border border-rose-300/80'
                : 'rounded-2xl rounded-tr-sm bg-zinc-100 text-zinc-950 font-medium shadow-[0_4px_16px_rgba(255,255,255,0.06),inset_0_1px_1px_rgba(255,255,255,0.9)] border border-white/60'
              : isVietnamTheme
              ? 'rounded-2xl rounded-tl-sm bg-[#240609]/95 border border-rose-900/60 text-zinc-100 shadow-[0_4px_16px_rgba(0,0,0,0.4),0_0_15px_rgba(218,37,29,0.2),inset_0_1px_0_rgba(255,215,0,0.08)]'
              : 'rounded-2xl rounded-tl-sm bg-[#16171d] border border-white/[0.08] text-zinc-100 shadow-[0_4px_16px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)]'
          }`}
        >
          {image ? (
            <img
              src={image}
              alt="Ảnh trong cuộc trò chuyện"
              className="max-h-96 max-w-full rounded-xl object-contain"
            />
          ) : (
            <span className="block whitespace-pre-wrap">{message}</span>
          )}

          {/* Unified reaction capsule overlay */}
          {hasReaction && (
            <span
              className={`absolute ${
                isMine ? '-bottom-2.5 right-3' : '-bottom-2.5 left-3'
              } z-10 inline-flex items-center gap-1 rounded-full border border-white/10 bg-[#121318] px-2 py-0.5 text-xs shadow-md`}
            >
              {peerReaction && (
                <span
                  title="Cảm xúc từ người lạ"
                  className={
                    reactionAnimation?.emoji === peerReaction
                      ? 'animate-reaction-spring inline-block'
                      : 'inline-block'
                  }
                >
                  {peerReaction}
                </span>
              )}
              {ownReaction && (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    onReact({ index, originIndex, author }, null);
                  }}
                  title="Bỏ cảm xúc của bạn"
                  className={`inline-block cursor-pointer hover:scale-110 transition-transform ${
                    reactionAnimation?.emoji === ownReaction ? 'animate-reaction-spring' : ''
                  }`}
                >
                  {ownReaction}
                </span>
              )}
            </span>
          )}
        </button>

        {/* Status indicator under bubble: only if delayed sending (>1s) or peer read dot */}
        {((isMine && !delivered && isDelayedSending) || (isMine && delivered && isLastDelivered)) && (
          <div
            className={`flex justify-end items-center px-1.5 ${hasReaction ? 'mt-4' : 'mt-1.5'}`}
          >
            {isMine && !delivered && isDelayedSending && (
              <span className="font-mono-clean text-[10px] text-zinc-500 italic">Đang gửi…</span>
            )}
            {isMine && delivered && isLastDelivered && (
              <span
                title="Người lạ đã nhận và đọc đến tin nhắn này"
                className="inline-block w-3 h-3 rounded-full ring-2 ring-[#0c0d12] shadow-sm transition-all duration-300"
                style={{
                  backgroundColor: partnerColor || '#10b981',
                  boxShadow: `0 0 8px ${partnerColor || '#10b981'}80`
                }}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
