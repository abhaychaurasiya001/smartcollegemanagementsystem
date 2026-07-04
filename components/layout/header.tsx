'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Bell, Moon, Sun, Check, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useTheme } from 'next-themes';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Notification {
  id: string;
  title: string;
  message: string | null;
  type: string;
  is_read: boolean;
  created_at: string;
}

export function Header() {
  const { user, profile } = useAuth();
  const { theme, setTheme } = useTheme();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);
    if (data) setNotifications(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  };

  const markAllAsRead = async () => {
    if (!user) return;
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      application: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      notice: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
      attendance: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      assignment: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      result: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      system: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200',
    };
    return colors[type] || colors.system;
  };

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <MobileMenuButton />
        <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100 hidden sm:block">
          Welcome, {profile?.full_name?.split(' ')[0] || 'User'}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {theme === 'dark' ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </Button>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-red-500 text-white text-xs">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notifications</span>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 text-xs text-blue-600"
                  onClick={markAllAsRead}
                >
                  Mark all read
                </Button>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-500">
                No notifications
              </div>
            ) : (
              <ScrollArea className="h-[300px]">
                {notifications.map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    className="flex items-start gap-3 p-3 cursor-pointer"
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div
                      className={`mt-1 h-2 w-2 rounded-full ${
                        notification.is_read ? 'bg-slate-300' : 'bg-blue-500'
                      }`}
                    />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {notification.title}
                        </p>
                        <Badge variant="outline" className={getTypeColor(notification.type)}>
                          {notification.type}
                        </Badge>
                      </div>
                      {notification.message && (
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {notification.message}
                        </p>
                      )}
                      <p className="text-xs text-slate-400">
                        {new Date(notification.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </DropdownMenuItem>
                ))}
              </ScrollArea>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

function MobileMenuButton() {
  return null; // Navigation is handled by Sidebar component
}
