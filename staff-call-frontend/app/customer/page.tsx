import { Suspense } from 'react';
import CustomerPageInner from './CustomerPageInner';

export default function CustomerPage() {
  return (
    <Suspense fallback={null}>
      <CustomerPageInner />
    </Suspense>
  );
}
