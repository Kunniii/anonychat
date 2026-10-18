export const ChatContainer = ({ children }) => (
  <div className="relative h-full min-h-0 w-full flex flex-col items-center justify-center p-0 sm:p-4 md:p-6 lg:p-8">
    {/* Outer Shell for Double-Bezel Architecture */}
    <div className="relative flex h-full min-h-0 w-full max-w-4xl xl:max-w-5xl flex-col rounded-none sm:rounded-[2rem] sm:p-1.5 sm:bg-white/[0.03] sm:ring-1 sm:ring-white/10 shadow-[0_24px_80px_rgba(0,0,0,0.6)]">
      {/* Inner Core */}
      <div className="relative flex h-full min-h-0 w-full flex-col rounded-none sm:rounded-[calc(2rem-0.375rem)] border-0 sm:border sm:border-white/[0.06] bg-[#0c0d12] shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] overflow-hidden">
        {children}
      </div>
    </div>
  </div>
);

export default ChatContainer;
