import { redirect } from 'next/navigation';

export default function ApprovalsPage() {
  redirect('/app/delivery?tab=approvals');
}
