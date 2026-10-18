import { useState, useEffect } from 'react';

export const OnlineCounter = ({ count }) => {
  const [prevCount, setPrevCount] = useState(count);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (count !== prevCount) {
      setIsAnimating(true);
      const timer = window.setTimeout(() => {
        setIsAnimating(false);
        setPrevCount(count);
      }, 250);
      return () => window.clearTimeout(timer);
    }
  }, [count, prevCount]);

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-mono-clean text-zinc-300 tabular-nums transition-all duration-300 ${
        isAnimating ? 'scale-[1.03]' : 'scale-100'
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
      <span className="tabular-nums">{count ?? 0} online</span>
    </div>
  );
};

export default OnlineCounter;
