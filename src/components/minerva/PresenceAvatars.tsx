'use client';
import { usePresence } from '@/lib/hooks/usePresence';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useLang } from '@/i18n';
import { usePathname } from 'next/navigation';

export function PresenceAvatars() {
  const pathname = usePathname();
  const { t } = useLang();
  const activeUsers = usePresence(pathname);

  if (activeUsers.length === 0) return null;

  return (
    <div className="flex -space-x-2 overflow-hidden items-center mr-4">
      {activeUsers.map((presence: any) => {
        const initials = presence.user.slice(0, 2).toUpperCase();
        return (
          <Tooltip key={presence._id}>
            <TooltipTrigger asChild>
              <Avatar className="h-7 w-7 border-2 border-obsidian shrink-0">
                <AvatarFallback className="text-[10px] bg-dusk text-silver">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">{presence.user} · {t.app.collaboration.presenceStatus}</p>
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
