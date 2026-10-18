import { useEffect, useRef } from 'react';

/**
 * MatrixRainCanvas
 * Cinematic, soothing digital rain effect from The Matrix.
 * Tuned for a slow, gentle, hypnotic cascade that doesn't distract or strain eyes.
 */
export const MatrixRainCanvas = ({ opacity = 0.28, fontSize = 15, className = '' }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let width = (canvas.width = canvas.offsetWidth || window.innerWidth || 800);
    let height = (canvas.height = canvas.offsetHeight || window.innerHeight || 600);

    // Iconic Katakana + cipher characters
    const chars =
      'ｦｱｳｴｵｶｷｹｹｺｻｼｽｾｿﾀﾂﾃﾅﾆﾇﾈﾊﾋﾎﾏﾐﾑﾒﾓﾔﾕﾗﾘﾜ1234567890ABCDEF:・."=*+-<>¦｜';
    const charArray = chars.split('');

    // Comfortable column spacing to avoid visual clutter
    const columnSpacing = fontSize * 1.6;
    let columns = Math.max(1, Math.floor(width / columnSpacing));

    // Staggered initial drop positions and gentle speeds
    let drops = Array.from({ length: columns }, () => Math.random() * -30);
    let speeds = Array.from({ length: columns }, () => 0.15 + Math.random() * 0.2); // Slower, relaxed speeds

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth || window.innerWidth || 800;
      height = canvas.height = canvas.offsetHeight || window.innerHeight || 600;
      columns = Math.max(1, Math.floor(width / columnSpacing));
      drops = Array.from({ length: columns }, () => Math.random() * -30);
      speeds = Array.from({ length: columns }, () => 0.15 + Math.random() * 0.2);
    };

    window.addEventListener('resize', handleResize);

    let lastDrawTime = 0;
    const fps = 20; // 20 fps for calm, authentic cinematic motion without jitter
    const interval = 1000 / fps;

    const draw = (currentTime) => {
      animationFrameId = requestAnimationFrame(draw);

      const delta = currentTime - lastDrawTime;
      if (delta < interval) return;
      lastDrawTime = currentTime - (delta % interval);

      // Softer, deeper translucent wash for gentle decay
      ctx.fillStyle = 'rgba(2, 10, 5, 0.12)';
      ctx.fillRect(0, 0, width, height);

      ctx.font = `${fontSize}px "Maple Mono", "Courier New", monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = charArray[Math.floor(Math.random() * charArray.length)];
        const x = i * columnSpacing;
        const currentY = Math.floor(drops[i]) * fontSize;

        if (currentY >= 0 && currentY <= height + fontSize) {
          // Leading drop glyph - soft mint/white
          ctx.fillStyle = '#d1fae5';
          ctx.shadowColor = '#10b981';
          ctx.shadowBlur = 4;
          ctx.fillText(text, x, currentY);

          // Body trail glyph
          if (drops[i] > 1) {
            const trailText = charArray[Math.floor(Math.random() * charArray.length)];
            ctx.fillStyle = '#059669';
            ctx.shadowBlur = 0;
            ctx.fillText(trailText, x, currentY - fontSize);
          }
        }

        // Reset shadow
        ctx.shadowBlur = 0;

        // Reset drop when off screen with random stagger
        if (currentY > height && Math.random() > 0.985) {
          drops[i] = -Math.floor(Math.random() * 15);
          speeds[i] = 0.15 + Math.random() * 0.2;
        }

        // Advance drop position slowly
        drops[i] += speeds[i];
      }
    };

    animationFrameId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [fontSize]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 h-full w-full select-none ${className}`}
      style={{ opacity }}
    />
  );
};

export default MatrixRainCanvas;
