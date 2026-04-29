import { useEffect, useRef } from 'react';

const MatrixBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let raf = 0;
    let columns: number[] = [];
    const fontSize = 14;

    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
      const cols = Math.floor(window.innerWidth / fontSize);
      columns = Array(cols)
        .fill(0)
        .map(() => Math.random() * -50);
    };
    resize();

    const chars =
      'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン01アクсе{}<>=#@$';
    const charArr = chars.split('');

    let lastResize = 0;
    const onResize = () => {
      const now = Date.now();
      if (now - lastResize < 200) return;
      lastResize = now;
      resize();
    };
    window.addEventListener('resize', onResize);

    const tick = () => {
      ctx.fillStyle = 'rgba(10,14,39,0.12)';
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < columns.length; i++) {
        const ch = charArr[Math.floor(Math.random() * charArr.length)];
        const x = i * fontSize;
        const y = columns[i] * fontSize;

        const rand = (i * 9301 + 49297) % 233280;
        const isBlue = rand / 233280 > 0.5;

        ctx.fillStyle = isBlue
          ? `rgba(96,165,250,${0.4 + Math.random() * 0.5})`
          : `rgba(167,139,250,${0.4 + Math.random() * 0.5})`;
        ctx.fillText(ch, x, y);

        if (Math.random() > 0.97) {
          ctx.fillStyle = '#fff';
          ctx.fillText(ch, x, y);
        }

        if (y > window.innerHeight && Math.random() > 0.975) {
          columns[i] = 0;
        } else {
          columns[i] += 0.4 + Math.random() * 0.5;
        }
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <div
      aria-hidden
      className="absolute inset-0 pointer-events-none overflow-hidden"
      style={{ opacity: 0.45 }}
    >
      <canvas ref={canvasRef} />
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 0%, rgba(10,14,39,0.85) 75%)',
        }}
      />
    </div>
  );
};

export default MatrixBackground;
