import { dbConnect } from '@/lib/mongodb';
import Product from '@/models/Product';
import ProductCard from '@/components/ProductCard';
import { toCardProduct } from '@/lib/cardProduct';
import { liveDiscountQuery } from '@/lib/discount';

// Rebuilt at most every 5 minutes; the admin product API also calls
// revalidatePath('/discounts') on every save, so changes show up instantly.
export const revalidate = 300;

export const metadata = {
  title: 'Discount Offers',
  description: 'Products on offer right now.',
};

// Theme: #8F1538 (primary), #C58A08 (secondary), #FFF9F0 (background), #E60062 (accent), #075447 (highlight), #29211E (text)
const PRIMARY = '#8F1538';
const SECONDARY = '#C58A08';
const INK_FAINT = '#8A7A70';
const PAPER = '#FFF9F0';
const FONT_SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";

export default async function DiscountsPage() {
  await dbConnect();
  const products = JSON.parse(
    JSON.stringify(
      await Product.find({ isActive: true, ...liveDiscountQuery() })
        .sort({ createdAt: -1 })
        .lean()
    )
  );

  return (
    <div style={{ background: PAPER }} className="min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <h1
          className="text-xl sm:text-2xl font-bold tracking-[3px] uppercase text-center"
          style={{ color: PRIMARY, fontFamily: FONT_SANS }}
        >
          Discount Offers
        </h1>
        <div className="w-12 h-[2px] mx-auto mt-3" style={{ background: SECONDARY }} />
        <p
          className="text-center text-sm font-light mt-3 mb-8"
          style={{ color: INK_FAINT, fontFamily: FONT_SANS }}
        >
          Offer prices apply to items added from this page.
        </p>

        {products.length === 0 ? (
          <p className="text-center py-16" style={{ color: INK_FAINT, fontFamily: FONT_SANS }}>
            No offers right now. Check back soon.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8">
            {products.map((p) => (
              <ProductCard key={p._id} product={toCardProduct(p, { discount: true })} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}