'use client';

import { useSearchParams } from 'next/navigation';
import CustomerPhone from '@/components/customer/CustomerPhone';
import { Replace } from 'lucide-react';

export default function CustomerPageInner() {
  const params = useSearchParams();
  const tableId = params.get('table') ?? '';
  return <CustomerPhone tableId={tableId} />;
}



//http://localhost:3000/customer?table=T01
// Replace T01 with any of the configured table IDs:

// Zone	Tables
// Window	T01 T02 T03 T04 T05
// Main	T06 T07 T08 T09
// Bar	BAR
// Booth	B01 B02
// Patio	P01 P02
// So for example:

// http://localhost:3000/customer?table=BAR
// http://localhost:3000/customer?table=B01