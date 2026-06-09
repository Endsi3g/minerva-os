import { redirect } from 'next/navigation';

export default function FilesPage() {
  redirect('/app/delivery?tab=files');
}
