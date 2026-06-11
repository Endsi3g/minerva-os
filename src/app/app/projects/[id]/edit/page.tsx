'use client';
import { useParams } from 'next/navigation';
import ProjectForm from '@/modules/app/ProjectForm';

export const dynamic = 'force-dynamic';

export default function ProjectEditPage() {
  const params = useParams();
  const id = params?.id as string;
  return <ProjectForm projectId={id} />;
}
