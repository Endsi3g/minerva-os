'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavLinkProps {
  href: string;
  className: string | ((args: { isActive: boolean }) => string);
  children: React.ReactNode;
  end?: boolean;
  onClick?: () => void;
}

export function NavLink({ href, className, children, end, onClick }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = end ? pathname === href : pathname.startsWith(href);
  const resolvedClass = typeof className === 'function' ? className({ isActive }) : className;
  return (
    <Link href={href} className={resolvedClass} onClick={onClick}>
      {children}
    </Link>
  );
}
