'use client';
import dynamic from 'next/dynamic';

const Copilot = dynamic(() => import('@/modules/app/Copilot'), { ssr: false });

export default function CopilotPage() {
  return <Copilot />;
}
