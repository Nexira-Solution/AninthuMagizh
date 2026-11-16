/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}'
  ],
  theme: {
    extend: {
      animation: {
        marquee: 'marquee 22s linear infinite',
      },
      keyframes: {
        marquee: {
          '0%':   { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      colors: {
        // Palette: #8F1538 #C58A08 #FFF9F0 #E60062 #075447 #29211E
        brand: {
          // New names (use these going forward)
          primary: '#8F1538',        // headings, prices, links, focus
          primarydark: '#6E0F2B',    // darker primary, for hovers (derived)
          secondary: '#C58A08',      // buttons and premium details
          secondarydark: '#A87306',  // darker secondary, for button hovers (derived)
          secondarytext: '#8A6100',  // text-safe gold for use on cream (derived)
          bg: '#FFF9F0',             // page background
          accent: '#E60062',         // errors, destructive actions
          highlight: '#075447',      // badges, success, small highlights
          ink: '#29211E',            // main text, dark sections
          inksoft: '#8A7A70',        // muted text (derived)
          line: '#E8D5C4',           // borders, dividers (derived)
          wash: '#F6EADB',           // soft fills (derived)

          // Previous names: kept so existing classes like bg-brand-purple or
          // text-brand-gold keep working. They now resolve to the new palette.
          purple: '#8F1538',         // -> primary
          purpledark: '#6E0F2B',     // -> primarydark
          gold: '#C58A08',           // -> secondary
          golddark: '#A87306',       // -> secondarydark
          ivory: '#FFF9F0',          // -> bg
          lavender: '#E8D5C4',       // -> line

          // Legacy names: kept so existing classes like bg-brand-magenta keep working.
          teal: '#8F1538',           // -> primary
          tealdark: '#6E0F2B',       // -> primarydark
          cream: '#FFF9F0',          // -> bg
          sand: '#E8D5C4',           // -> line
          magenta: '#8F1538',        // -> primary
          rose: '#B0204A',           // lighter primary hover (derived)
          pink: '#C58A08',           // accent -> secondary (gold)
          green: '#075447',          // -> highlight
          deepgreen: '#075447'       // -> highlight
        }
      },
      fontFamily: {
        display: ['var(--font-display)'],
        body: ['var(--font-body)']
      },
      boxShadow: {
        soft: '0 8px 30px -8px rgba(143,21,56,0.18)'
      },
      borderRadius: {
        xl2: '1.25rem'
      }
    }
  },
  plugins: []
};