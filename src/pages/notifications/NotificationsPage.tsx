import { useState, useEffect } from 'react';
import { Bell, BellOff, Check, CheckCheck, Trash2, Mail, MessageSquare, Smartphone, Clock } from 'lucide-react';
import { mockNotificationsApi } from '@/data/mockApi';
import { Notification } from '@/api/notifications';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const typeIcons: Record<string, { icon: React.ElementType; color: string }> = {
  appointment_confirmed: { icon: Check, color: 'text-accent' },
  appointment_created: { icon: Bell, color: 'text-primary' },
  appointment_cancelled: { icon: BellOff, color: 'text-destructive' },
  appointment_completed: { icon: CheckCheck, color: 'text-accent' },
  appointment_reminder: { icon: Clock, color: 'text-warning' },
  appointment_in_progress: { icon: Clock, color: 'text-primary' },
  welcome: { icon: Bell, color: 'text-primary' },
};

const channelIcons: Record<string, { icon: React.ElementType; label: string }> = {
  email: { icon: Mail, label: 'Email' },
  sms: { icon: MessageSquare, label: 'SMS' },
  push: { icon: Smartphone, label: 'Push' },
  in_app: { icon: Bell, label: 'In-app' },
};

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    const data = await mockNotificationsApi.list();
    setNotifications(data);
    setLoading(false);
  };

  useEffect(() => { fetchNotifications(); }, []);

  const handleMarkAsRead = async (id: number) => {
    await mockNotificationsApi.markAsRead(id);
    fetchNotifications();
  };

  const handleMarkAllAsRead = async () => {
    await mockNotificationsApi.markAllAsRead();
    fetchNotifications();
  };

  const handleDelete = async (id: number) => {
    await mockNotificationsApi.delete(id);
    fetchNotifications();
  };

  const filtered = notifications.filter((n) => {
    if (filter === 'unread') return !n.read;
    if (filter === 'read') return n.read;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "À l'instant";
    if (diffMin < 60) return `Il y a ${diffMin} min`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `Il y a ${diffH}h`;
    const diffD = Math.floor(diffH / 24);
    if (diffD < 7) return `Il y a ${diffD}j`;
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
          <p className="text-sm text-muted-foreground">{unreadCount} non lue{unreadCount !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleMarkAllAsRead} disabled={unreadCount === 0}>
            <CheckCheck className="mr-2 h-4 w-4" /> Tout marquer comme lu
          </Button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(['all', 'unread', 'read'] as const).map((f) => (
          <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm" onClick={() => setFilter(f)}>
            {f === 'all' ? 'Toutes' : f === 'unread' ? 'Non lues' : 'Lues'}
            {f === 'unread' && unreadCount > 0 && <Badge variant="destructive" className="ml-2 h-5 px-1.5 text-[10px]">{unreadCount}</Badge>}
          </Button>
        ))}
      </div>

      {/* Notification list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Bell className="mb-3 h-12 w-12 text-muted-foreground/40" />
              <p className="text-muted-foreground">Aucune notification</p>
            </CardContent>
          </Card>
        ) : (
          filtered.map((notif) => {
            const typeInfo = typeIcons[notif.type] || typeIcons.welcome;
            const Icon = typeInfo.icon;
            const channels = (notif.data?.channels as string[]) || ['in_app'];
            return (
              <Card key={notif.id} className={cn('transition-all hover:shadow-md', !notif.read && 'border-l-4 border-l-primary bg-primary/5')}>
                <CardContent className="flex items-start gap-4 p-4">
                  <div className={cn('mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-muted', typeInfo.color)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className={cn('text-sm font-semibold text-foreground', !notif.read && 'font-bold')}>{notif.title}</p>
                        <p className="mt-0.5 text-sm text-muted-foreground">{notif.message}</p>
                      </div>
                      <span className="flex-shrink-0 text-xs text-muted-foreground">{formatDate(notif.created_at)}</span>
                    </div>
                    <div className="mt-2 flex items-center gap-3">
                      <div className="flex gap-1.5">
                        {channels.map((ch) => {
                          const chInfo = channelIcons[ch];
                          if (!chInfo) return null;
                          const ChIcon = chInfo.icon;
                          return (
                            <span key={ch} className="flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                              <ChIcon className="h-3 w-3" />{chInfo.label}
                            </span>
                          );
                        })}
                      </div>
                      <div className="ml-auto flex gap-1">
                        {!notif.read && (
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => handleMarkAsRead(notif.id)}>
                            <Check className="mr-1 h-3 w-3" /> Lu
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-destructive hover:text-destructive" onClick={() => handleDelete(notif.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
