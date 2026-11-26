'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Expenses now live inside the Purchases page (Expenses tab).
// This keeps old links and bookmarks working.
export default function ExpensesRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/admin/purchases?tab=expenses'); }, [router]);
  return null;
}