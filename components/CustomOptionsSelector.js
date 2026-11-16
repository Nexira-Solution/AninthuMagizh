'use client';

// Same crimson / gold / cream tokens as the product page.
// Palette: #8F1538 #C58A08 #FFF9F0 #E60062 #075447 #29211E
const INK = '#29211E';       // text
const INK_SOFT = '#7A6A63';  // muted labels (derived from text)
const PRIMARY = '#8F1538';   // selected chips and required marker
const LINE = '#E5CDD3';      // soft borders (derived tint of primary)
const PAPER = '#FFF9F0';     // background

// groups: product.optionGroups
// picks:  { [groupName]: choiceLabel }
// onPick(groupName, choiceLabelOrEmpty)
export default function CustomOptionsSelector({ groups, picks, onPick, formatINR }) {
  if (!groups?.length) return null;

  return (
    <div className="mt-4 sm:mt-6 space-y-4">
      {groups.map((g) => {
        const selected = picks[g.name] || '';
        return (
          <div key={g.name}>
            <p className="text-sm mb-2" style={{ color: INK_SOFT }}>
              {g.name}
              {g.required !== false && <span style={{ color: PRIMARY }}> *</span>}
              {selected && <span style={{ color: INK }}> — {selected}</span>}
            </p>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={g.name}>
              {g.choices.map((c) => {
                const active = selected === c.label;
                return (
                  <button
                    key={c.label}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => onPick(g.name, active && g.required === false ? '' : c.label)}
                    className="px-3.5 py-2 text-sm transition-colors"
                    style={{
                      borderRadius: '4px',
                      border: `1px solid ${active ? PRIMARY : LINE}`,
                      background: active ? PRIMARY : PAPER,
                      color: active ? PAPER : INK,
                    }}
                  >
                    {c.label}
                    {c.price > 0 && (
                      <span className="ml-1.5 text-xs" style={{ opacity: active ? 0.85 : 0.65 }}>
                        +{formatINR(c.price)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}