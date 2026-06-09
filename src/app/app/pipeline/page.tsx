import { redirect } from 'next/navigation';

export default function PipelinePage() {
  redirect('/app/clients?tab=pipeline');
}
