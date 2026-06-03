'use client';
import React from 'react';
import PortalShell from '@/modules/portal/PortalShell';
export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return <PortalShell>{children}</PortalShell>;
}
