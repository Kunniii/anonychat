import { getCelebrationMessage } from '../../constants/chat.js';

export const EasterEggCelebration = ({ celebration }) => (
  <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
    <div className="easter-egg-toast-wrap absolute left-1/2 top-[6%]">
      <div
        className={`easter-egg-toast easter-egg-toast--${celebration.intensity} flex max-w-[calc(100vw-2rem)] items-center justify-center gap-2 rounded-xl border border-emerald-300/25 bg-zinc-950/95 px-4 py-2 text-center text-xs text-emerald-100`}
      >
        <span
          className={`easter-egg-emoji easter-egg-emoji--${celebration.intensity}`}
          aria-hidden="true"
        >
          {celebration.icon}
        </span>
        <span className="break-words">{getCelebrationMessage(celebration)}</span>
      </div>
    </div>
  </div>
);

export default EasterEggCelebration;
