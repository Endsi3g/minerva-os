import { redirect } from 'next/navigation';

export default function TasksPage() {
  redirect('/app/delivery?tab=tasks');
}
