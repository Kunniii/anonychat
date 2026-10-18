import { useState, useEffect } from 'react';
import { Terminal } from 'lucide-react';
import MatrixRainCanvas from './MatrixRainCanvas.jsx';

/**
 * MatrixCelebrationOverlay
 * Minimal, cinematic modal for The Matrix easter egg.
 * Features ultra-concise iconic lines and direct Red Pill / Blue Pill choices.
 */
export const MatrixCelebrationOverlay = ({
  isOpen = false,
  isMatrixTheme = false,
  onClose,
  onToggleMatrixTheme
}) => {
  const terminalLines = [
    'Wake up, Neo...',
    'The Matrix has you.',
    'Follow the white rabbit.',
    'Knock, knock, Neo.'
  ];

  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setDisplayedText('');
      return;
    }

    // Play subtle high-tech cyber hum/beep via Web Audio API
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(700, ctx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.03, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch {}

    let charIndex = 0;
    let lineIdx = 0;
    let timer = null;

    const typeNextChar = () => {
      const targetLine = terminalLines[lineIdx];
      if (charIndex <= targetLine.length) {
        setDisplayedText(targetLine.slice(0, charIndex));
        charIndex++;
        timer = setTimeout(typeNextChar, 55);
      } else {
        // Line finished, pause before next line
        if (lineIdx < terminalLines.length - 1) {
          timer = setTimeout(() => {
            lineIdx++;
            charIndex = 0;
            typeNextChar();
          }, 1800);
        }
      }
    };

    timer = setTimeout(typeNextChar, 200);

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn select-none"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm sm:max-w-md p-6 rounded-3xl text-center overflow-hidden border border-emerald-500/40 shadow-[0_0_50px_rgba(16,185,129,0.25)]"
        style={{
          background: 'linear-gradient(160deg, #020d06 0%, #010603 100%)',
          color: '#e6fffa'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle, slow digital rain background inside modal */}
        <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden">
          <MatrixRainCanvas opacity={0.3} fontSize={14} />
        </div>

        {/* Cyber Terminal Icon */}
        <div className="relative mx-auto w-14 h-14 rounded-2xl bg-[#031d0e] border border-emerald-500/60 flex items-center justify-center shadow-[0_0_25px_rgba(16,185,129,0.4)] mb-4">
          <Terminal className="w-7 h-7 text-emerald-400" />
        </div>

        {/* Minimal Title */}
        <h2 className="relative z-10 text-lg sm:text-xl font-mono font-bold tracking-tight text-emerald-300">
          THE MATRIX
        </h2>

        {/* Green CRT Terminal Box */}
        <div className="relative z-10 mt-4 p-3.5 rounded-xl border border-emerald-500/30 bg-black/80 shadow-[inset_0_0_15px_rgba(16,185,129,0.1)] text-left min-h-[56px] flex items-center">
          <div className="font-mono text-emerald-400 text-sm sm:text-base tracking-wide flex items-center">
            <span className="text-emerald-500/60 mr-2 select-none">&gt;</span>
            <span className="font-medium text-emerald-300 drop-shadow-[0_0_6px_rgba(52,211,153,0.7)]">
              {displayedText}
            </span>
            <span className="inline-block w-2 h-4 ml-1 bg-emerald-400 animate-pulse" />
          </div>
        </div>

        {/* Minimal Red Pill / Blue Pill Choice Buttons */}
        <div className="relative z-10 mt-6 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (onToggleMatrixTheme) onToggleMatrixTheme();
            }}
            className="flex-1 px-4 py-2.5 rounded-full text-xs font-mono font-bold bg-rose-950/90 hover:bg-rose-900 text-rose-200 border border-rose-500/70 transition-all shadow-[0_0_20px_rgba(244,63,94,0.35)] cursor-pointer inline-flex items-center justify-center gap-1.5"
          >
            <span>💊</span>
            <span>{isMatrixTheme ? 'Tắt Matrix' : 'Red Pill'}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-full text-xs font-mono font-semibold bg-sky-950/60 hover:bg-sky-900/80 text-sky-200 border border-sky-500/40 transition-all cursor-pointer inline-flex items-center justify-center gap-1.5"
          >
            <span>💊</span>
            <span>Blue Pill</span>
          </button>
        </div>

        {/* Short, minimal hint */}
        <p className="relative z-10 mt-4 text-[11px] text-emerald-400/50 font-mono">
          hackermodeactivated
        </p>
      </div>
    </div>
  );
};

export default MatrixCelebrationOverlay;
