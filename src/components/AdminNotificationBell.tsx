import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck, Headphones, ReceiptText, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import {
  AdminInboxNotification,
  AdminInboxNotificationType,
  getAdminInboxNotifications,
  getAdminInboxUnreadCount,
  markAdminInboxNotificationRead,
  markAllAdminInboxNotificationsRead,
} from '@/services/api';

function formatRelativeTime(iso: string) {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

function notificationIcon(type: AdminInboxNotificationType) {
  switch (type) {
    case 'new_user':
      return UserPlus;
    case 'transaction':
      return ReceiptText;
    case 'support_message':
      return Headphones;
    default:
      return Bell;
  }
}

function notificationAccent(type: AdminInboxNotificationType) {
  switch (type) {
    case 'new_user':
      return 'text-blue-400';
    case 'transaction':
      return 'text-green-400';
    case 'support_message':
      return 'text-purple-400';
    default:
      return 'text-muted-foreground';
  }
}

const AdminNotificationBell = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['admin-inbox-unread-count'],
    queryFn: getAdminInboxUnreadCount,
    refetchInterval: 30000,
  });

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['admin-inbox-notifications'],
    queryFn: () => getAdminInboxNotifications({ limit: 20 }),
    enabled: open,
    refetchInterval: open ? 30000 : false,
  });

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) {
      queryClient.invalidateQueries({ queryKey: ['admin-inbox-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['admin-inbox-unread-count'] });
    }
  };

  const handleNotificationClick = async (notification: AdminInboxNotification) => {
    if (!notification.read_at) {
      await markAdminInboxNotificationRead(notification.id);
      queryClient.invalidateQueries({ queryKey: ['admin-inbox-unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['admin-inbox-notifications'] });
    }

    setOpen(false);
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const handleMarkAllRead = async () => {
    const ok = await markAllAdminInboxNotificationsRead();
    if (ok) {
      queryClient.invalidateQueries({ queryKey: ['admin-inbox-unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['admin-inbox-notifications'] });
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 relative" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-solana rounded-full text-[10px] font-semibold text-black flex items-center justify-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-96 p-0 bg-black/95 border-white/10"
        align="end"
        sideOffset={8}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div>
            <p className="text-sm font-semibold">Notifications</p>
            <p className="text-xs text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={handleMarkAllRead}>
              <CheckCheck className="mr-1.5 h-3.5 w-3.5" />
              Mark all read
            </Button>
          )}
        </div>

        <div className="max-h-[420px] overflow-y-auto">
          {isLoading ? (
            <p className="px-4 py-8 text-sm text-muted-foreground text-center">Loading…</p>
          ) : notifications.length === 0 ? (
            <p className="px-4 py-8 text-sm text-muted-foreground text-center">
              No notifications yet
            </p>
          ) : (
            notifications.map((notification) => {
              const Icon = notificationIcon(notification.type);
              const unread = !notification.read_at;

              return (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => handleNotificationClick(notification)}
                  className={cn(
                    'w-full text-left px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors',
                    unread && 'bg-white/[0.03]'
                  )}
                >
                  <div className="flex gap-3">
                    <div className={cn('mt-0.5', notificationAccent(notification.type))}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn('text-sm leading-snug', unread && 'font-medium')}>
                          {notification.title}
                        </p>
                        {unread && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-solana" />}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2 whitespace-pre-wrap">
                        {notification.body}
                      </p>
                      <p className="mt-1.5 text-[11px] text-muted-foreground">
                        {formatRelativeTime(notification.created_at)}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default AdminNotificationBell;
