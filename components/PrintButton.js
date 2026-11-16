'use client';

// Palette: #8F1538 #C58A08 #FFF9F0 #E60062 #075447 #29211E
const GOLD = '#C58A08'; // secondary: button
const INK = '#29211E';  // text on gold

export default function PrintButton({ label = 'Print / Save as PDF' }) {
  return (
    <div className="text-center mt-6 print:hidden">
      <button
        onClick={() => window.print()}
        className="rounded-full px-7 py-2.5 text-sm font-semibold tracking-wide transition hover:brightness-95"
        style={{ background: GOLD, color: INK }}
      >
        {label}
      </button>
    </div>
  );
}