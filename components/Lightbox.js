'use client';

import { createPortal } from 'react-dom';
import Image from 'next/image';
import { X } from 'lucide-react';

// Palette: #8F1538 #C58A08 #FFF9F0 #E60062 #075447 #29211E
const PAPER = '#FFF9F0';                     // cream: close icon
const OVERLAY = 'rgba(41,33,30,0.88)';       // dark brown (from the text color) backdrop
const CONTROL_BG = 'rgba(255,249,240,0.15)'; // translucent cream control fill

export default function Lightbox({ src, onClose }) {
  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 flex items-center justify-center p-6"
      style={{ background: OVERLAY, zIndex: 10000 }}
    >
      <div className="relative w-full max-w-md aspect-square" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute -top-11 right-0 sm:-top-2 sm:-right-11 w-9 h-9 flex items-center justify-center rounded-full"
          style={{ background: CONTROL_BG, color: PAPER }}
          aria-label="Close"
        >
          <X size={20} />
        </button>
        <Image src={src} alt="Review image" fill className="object-contain" sizes="(max-width:640px) 90vw, 448px" />
      </div>
    </div>,
    document.body
  );
}