'use client';

import { useCart } from './CartContext';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Zap } from 'lucide-react';
import { piecesPerUnit } from '@/lib/comboPieces';

// Palette: #8F1538 #C58A08 #FFF9F0 #E60062 #075447 #29211E
const PRIMARY = '#8F1538';     // primary brand (crimson): Add to cart outline and text
const GOLD = '#C58A08';        // secondary: Buy now button
const GOLD_DARK = '#A87506';   // gold hover state (derived, a darker shade of secondary)
const BG = '#FFF9F0';          // website background
const INK = '#29211E';         // text on gold
const TINT = '#F6E4E9';        // soft hover tint (derived, a light tint of primary)

export default function AddComboButton({ combo }) {
  const { addItem } = useCart();
  const router = useRouter();

  const item = {
    productId: combo._id,
    variantId: 'combo',
    comboId: combo._id,
    isCombo: true,
    name: combo.name,
    image: combo.images?.[0],
    color: '-',
    size: 'Combo',
    price: combo.comboPrice,
    qty: 1,
    // Pieces in ONE combo (admin-set piecesPerCombo, else products count)
    pieces: piecesPerUnit(combo),
  };

  function handleAddToCart() {
    addItem(item);
  }

  function handleBuyNow() {
    addItem(item);
    router.push('/checkout');
  }

  return (
    <div className="flex gap-2.5">
      <button
        onClick={handleAddToCart}
        className="flex-1 flex items-center justify-center gap-2 text-sm font-medium py-3 rounded-full active:scale-[0.98] transition-colors"
        style={{ border: `1px solid ${PRIMARY}`, color: PRIMARY, background: BG }}
        onMouseEnter={(e) => (e.currentTarget.style.background = TINT)}
        onMouseLeave={(e) => (e.currentTarget.style.background = BG)}
      >
        <ShoppingBag size={16} strokeWidth={1.75} />
        Add to cart
      </button>
      <button
        onClick={handleBuyNow}
        className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold py-3 rounded-full transition-colors active:scale-[0.98]"
        style={{ background: GOLD, color: INK }}
        onMouseEnter={(e) => (e.currentTarget.style.background = GOLD_DARK)}
        onMouseLeave={(e) => (e.currentTarget.style.background = GOLD)}
      >
        <Zap size={16} fill="currentColor" strokeWidth={0} />
        Buy now
      </button>
    </div>
  );
}