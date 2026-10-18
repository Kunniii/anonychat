export const TypingBubble = ({ partnerColor }) => (
  <div
    className="mr-auto my-2 flex w-fit items-center gap-2 rounded-2xl rounded-tl-sm border border-white/[0.08] bg-[#16171d] px-4 py-3"
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
