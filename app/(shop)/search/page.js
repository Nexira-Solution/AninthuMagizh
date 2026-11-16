'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductCard from '@/components/ProductCard';

function SearchResults() {
  const params = useSearchParams();
  const q = params.get('q') || '';
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/search?q=${encodeURIComponent(q)}`)
      .then((r) => r.json())
      .then((d) => setProducts(d.products || []))
      .finally(() => setLoading(false));
  }, [q]);

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold tracking-tight text-brand-primary mb-1">Search results for &ldquo;{q}&rdquo;</h1>
        <div className="w-12 h-[2px] mt-3 mb-3 bg-brand-secondary" />
        <p className="text-brand-inksoft text-sm mb-6">{products.length} products found</p>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="aspect-[3/4] rounded-xl bg-brand-wash animate-pulse" />)}
          </div>
        ) : products.length === 0 ? (
          <p className="text-brand-inksoft py-10 text-center">No products matched your search.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {products.map((p) => <ProductCard key={p._id} product={p} />)}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-brand-bg">
          <div className="max-w-7xl mx-auto px-4 py-20 text-center text-brand-inksoft">Loading...</div>
        </div>
      }
    >
      <SearchResults />
    </Suspense>
  );
}