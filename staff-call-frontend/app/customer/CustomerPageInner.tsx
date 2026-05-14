'use client';

import { useSearchParams } from 'next/navigation';
import CustomerPhone from '@/components/customer/CustomerPhone';

export default function CustomerPageInner() {
  const params = useSearchParams();
  const tableId = params.get('table') ?? '';
  return <CustomerPhone tableId={tableId} />;
}
