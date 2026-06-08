import { Suspense } from 'react';
import Login from '@/Login';

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  return (
    <Suspense>
      <Login />
    </Suspense>
  );
}
