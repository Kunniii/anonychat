export const TypingBubble = ({ partnerColor, isVietnamTheme = false }) => (
  <div
    className={`mr-auto my-2 flex w-fit items-center gap-2 rounded-2xl rounded-tl-sm px-4 py-3 transition-colors duration-200 ${
      isVietnamTheme
        ? 'bg-[#240609]/95 border border-rose-900/60 shadow-[0_4px_16px_rgba(218,37,29,0.2)]'
        : 'border border-white/[0.08] bg-[#16171d]'
    }`}
    role="status"
    aria-label="Người lạ đang nhập"
  >
    <span
      className="h-2 w-2 rounded-full animate-bounce"
      style={{ backgroundColor: partnerColor || '#a1a1aa' }}
    />
    <span
      className="h-2 w-2 rounded-full animate-bounce [animation-delay:150ms]"
      style={{ backgroundColor: partnerColor || '#a1a1aa' }}
    />
    <span
      className="h-2 w-2 rounded-full animate-bounce [animation-delay:300ms]"
      style={{ backgroundColor: partnerColor || '#a1a1aa' }}
    />
  </div>
);

export default TypingBubble;
