'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';

const PAPER = '#FFF5E8';
const MIN = 1;
const MAX = 4;
const DOUBLE_TAP_SCALE = 2.5;

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export default function ImageZoomModal({ images, index, onIndexChange, onClose, alt = '' }) {
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const boxRef = useRef(null);
  const pointers = useRef(new Map());
  const dragStart = useRef(null);
  const pinchStart = useRef(null);
  const moved = useRef(false);
  const lastTap = useRef(0);

  const count = images.length;
  const prev = () => onIndexChange(index === 0 ? count - 1 : index - 1);
  const next = () => onIndexChange(index === count - 1 ? 0 : index + 1);

  // Keep the image from being dragged out of view
  const clampPos = (p, s) => {
    const r = boxRef.current?.getBoundingClientRect();
    if (!r) return p;
    const mx = (r.width * (s - 1)) / 2;
    const my = (r.height * (s - 1)) / 2;
    return { x: clamp(p.x, -mx, mx), y: clamp(p.y, -my, my) };
  };

  const applyScale = (s) => {
    const ns = clamp(s, MIN, MAX);
    setScale(ns);
    setPos((p) => (ns === 1 ? { x: 0, y: 0 } : clampPos(p, ns)));
  };

  // Reset when the image changes
  useEffect(() => {
    setScale(1);
    setPos({ x: 0, y: 0 });
  }, [index]);

  // Lock page scroll + keyboard controls
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft' && count > 1) prev();
      else if (e.key === 'ArrowRight' && count > 1) next();
      else if (e.key === '+' || e.key === '=') applyScale(scale * 1.4);
      else if (e.key === '-') applyScale(scale / 1.4);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  });

  const dist = () => {
    const [a, b] = [...pointers.current.values()];
    return Math.hypot(a.x - b.x, a.y - b.y);
  };

  const onPointerDown = (e) => {
    e.currentTarget.setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    moved.current = false;
    if (pointers.current.size === 2) {
      pinchStart.current = { d: dist(), scale };
    } else {
      dragStart.current = { x: e.clientX, y: e.clientY, px: pos.x, py: pos.y };
    }
  };

  const onPointerMove = (e) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 2 && pinchStart.current) {
      moved.current = true;
      applyScale(pinchStart.current.scale * (dist() / pinchStart.current.d));
      return;
    }
    const s = dragStart.current;
    if (!s) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) moved.current = true;
    if (scale > 1) setPos(clampPos({ x: s.px + dx, y: s.py + dy }, scale));
  };

  const onPointerUp = (e) => {
    const wasSingle = pointers.current.size === 1;
    pointers.current.delete(e.pointerId);
    pinchStart.current = null;

    // One finger left after a pinch: continue panning from where it is
    if (pointers.current.size === 1) {
      const [p] = [...pointers.current.values()];
      dragStart.current = { x: p.x, y: p.y, px: pos.x, py: pos.y };
      return;
    }
    if (!wasSingle) return;

    const s = dragStart.current;
    dragStart.current = null;
    if (!s) return;

    // Swipe to change image (only when not zoomed in)
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (scale === 1 && count > 1 && Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) {
      dx < 0 ? next() : prev();
      return;
    }

    // Double tap / double click toggles zoom
    if (!moved.current) {
      const now = Date.now();
      if (now - lastTap.current < 300) {
        applyScale(scale > 1 ? 1 : DOUBLE_TAP_SCALE);
        lastTap.current = 0;
      } else {
        lastTap.current = now;
      }
    }
  };

  const onWheel = (e) => applyScale(scale * (e.deltaY < 0 ? 1.15 : 1 / 1.15));

  const btn = 'w-10 h-10 flex items-center justify-center rounded-full active:scale-90 transition-transform';
  const btnStyle = { background: 'rgba(255,245,232,0.15)', color: PAPER };

  return createPortal(
    <div className="fixed inset-0" style={{ background: 'rgba(36,5,47,0.95)', zIndex: 10000 }}>
      {/* Image area */}
      <div
        ref={boxRef}
        className="absolute inset-0 overflow-hidden select-none"
        style={{ touchAction: 'none', cursor: scale > 1 ? 'grab' : 'zoom-in' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
      >
        <div
          className="absolute inset-0"
          style={{
            transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`,
            transformOrigin: 'center',
            willChange: 'transform',
          }}
        >
          <Image
            src={images[index]}
            alt={alt}
            fill
            draggable={false}
            quality={90}
            sizes="200vw" // request a larger file so zoomed-in detail stays sharp
            className="object-contain pointer-events-none"
            priority
          />
        </div>
      </div>

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-3 pointer-events-none">
        <span className="px-3 py-1 rounded-full text-xs pointer-events-auto" style={btnStyle}>
          {index + 1} / {count}
        </span>
        <div className="flex gap-2 pointer-events-auto">
          <button onClick={() => applyScale(scale / 1.5)} className={btn} style={btnStyle} aria-label="Zoom out"><ZoomOut size={18} /></button>
          <button onClick={() => applyScale(scale * 1.5)} className={btn} style={btnStyle} aria-label="Zoom in"><ZoomIn size={18} /></button>
          <button onClick={onClose} className={btn} style={btnStyle} aria-label="Close"><X size={20} /></button>
        </div>
      </div>

      {/* Prev / next */}
      {count > 1 && (
        <>
          <button onClick={prev} className={`${btn} absolute left-3 top-1/2 -translate-y-1/2`} style={btnStyle} aria-label="Previous image"><ChevronLeft size={22} /></button>
          <button onClick={next} className={`${btn} absolute right-3 top-1/2 -translate-y-1/2`} style={btnStyle} aria-label="Next image"><ChevronRight size={22} /></button>
        </>
      )}
    </div>,
    document.body
  );
}