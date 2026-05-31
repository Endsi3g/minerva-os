'use client';
import { use } from 'react';
import ClientDetail from '@/modules/app/ClientDetail';

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <ClientDetail clientId={id} />;
}
