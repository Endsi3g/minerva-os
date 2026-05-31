'use client';
import { use } from 'react';
import TicketDetail from '@/modules/app/TicketDetail';

export default function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <TicketDetail ticketId={id} />;
}
