'use client';
import { useParams } from 'next/navigation';
import ClientForm from '@/modules/app/ClientForm';

export const dynamic = 'force-dynamic';

export default function ClientEditPage() {
  const params = useParams();
  const id = params?.id as string;
  return <ClientForm clientId={id} />;
}
