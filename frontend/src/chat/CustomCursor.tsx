'use client';

import { useEffect, useRef } from 'react';

export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Skip on touch devices
    if (window.matchMedia('(pointer: coarse)').matches) return;

    const dot = dotRef.current!;
    const ring = ringRef.current!;

    let mouseX = 0, mouseY = 0;
    let ringX = 0, ringY = 0;
    let animId: number;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      dot.style.left = `${mouseX}px`;
      dot.style.top = `${mouseY}px`;
    };

    const animate = () => {
      ringX += (mouseX - ringX) * 0.12;
      ringY += (mouseY - ringY) * 0.12;
      ring.style.left = `${ringX}px`;
      ring.style.top = `${ringY}px`;
      animId = requestAnimationFrame(animate);
    };

    // Hover state detection
    const onMouseEnter = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.matches('a, button, [role="button"], [data-cursor="pointer"], label, input[type="checkbox"], input[type="radio"], select')
      ) {
        document.body.classList.add('cursor-hover');
      } else if (target.matches('input[type="text"], input[type="email"], input[type="password"], textarea')) {
        document.body.classList.add('cursor-text');
      }
    };

    const onMouseLeave = () => {
      document.body.classList.remove('cursor-hover', 'cursor-text');
    };

    // Magnetic button effect
    const setupMagnetic = () => {
      const magnetics = document.querySelectorAll<HTMLElement>('.magnetic');
      magnetics.forEach((el) => {
        el.addEventListener('mousemove', (e) => {
          const rect = el.getBoundingClientRect();
          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height / 2;
          const dx = (e.clientX - cx) * 0.3;
          const dy = (e.clientY - cy) * 0.3;
          el.style.transform = `translate(${dx}px, ${dy}px)`;
        });

        el.addEventListener('mouseleave', () => {
          el.style.transform = 'translate(0, 0)';
        });
      });
    };

    // Click effect
    const onClick = () => {
      dot.style.transform = 'translate(-50%, -50%) scale(0.5)';
      setTimeout(() => {
        dot.style.transform = 'translate(-50%, -50%) scale(1)';
      }, 150);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseover', onMouseEnter);
    document.addEventListener('mouseout', onMouseLeave);
    document.addEventListener('click', onClick);

    animId = requestAnimationFrame(animate);
    setupMagnetic();

    // Re-setup magnetic on DOM changes
    const observer = new MutationObserver(setupMagnetic);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseover', onMouseEnter);
      document.removeEventListener('mouseout', onMouseLeave);
      document.removeEventListener('click', onClick);
      cancelAnimationFrame(animId);
      observer.disconnect();
    };
  }, []);

  return (
    <>
      <div ref={dotRef} className="cursor-dot" aria-hidden="true" />
      <div ref={ringRef} className="cursor-ring" aria-hidden="true" />
    </>
  );
}
