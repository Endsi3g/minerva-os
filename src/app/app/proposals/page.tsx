import { redirect } from 'next/navigation';

export default function ProposalsPage() {
  redirect('/app/clients?tab=proposals');
}
