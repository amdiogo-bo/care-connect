import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Settings as SettingsIcon, User, Bell, Shield, Lock, Mail, Smartphone } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { profileApi, Profile } from '@/api/profile';
import { notificationsApi, NotificationPreferences } from '@/api/notifications';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const Settings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [notifications, setNotifications] = useState<NotificationPreferences>({
    email_notifications: true,
    sms_notifications: false,
    push_notifications: true,
    appointment_reminders: true,
    system_notifications: true,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchNotifications();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await profileApi.get();
      setProfile(res.data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await profileApi.get();
      // Note: Vous devrez créer un endpoint pour les préférences de notifications
      if (res.data?.notification_preferences) {
        setNotifications(res.data.notification_preferences);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const updateProfile = async (data: Partial<Profile>) => {
    setLoading(true);
    try {
      await profileApi.update(data);
      toast({ title: 'Profil mis à jour' });
      fetchProfile();
    } catch (error) {
      toast({ title: 'Erreur', description: 'Impossible de mettre à jour le profil', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const updateNotifications = async (preferences: NotificationPreferences) => {
    setLoading(true);
    try {
      await notificationsApi.updatePreferences(preferences);
      toast({ title: 'Préférences mises à jour' });
      setNotifications(preferences);
    } catch (error) {
      toast({ title: 'Erreur', description: 'Impossible de mettre à jour les préférences', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Paramètres</h1>
        <p className="text-muted-foreground">Gérez vos préférences et paramètres</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profil
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {profile && (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="first_name">Prénom</Label>
                  <Input
                    id="first_name"
                    value={profile.first_name}
                    onChange={(e) => updateProfile({ first_name: e.target.value })}
                    disabled={loading}
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">Nom</Label>
                  <Input
                    id="last_name"
                    value={profile.last_name}
                    onChange={(e) => updateProfile({ last_name: e.target.value })}
                    disabled={loading}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    disabled
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    value={profile.phone || ''}
                    onChange={(e) => updateProfile({ phone: e.target.value })}
                    disabled={loading}
                  />
                </div>
                <div className="text-sm text-muted-foreground">
                  Membre depuis: {format(new Date(profile.created_at), 'd MMMM yyyy', { locale: fr })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <Label htmlFor="email_notifications">Email</Label>
                </div>
                <Switch
                  id="email_notifications"
                  checked={notifications.email_notifications}
                  onCheckedChange={(checked) => updateNotifications({ ...notifications, email_notifications: checked })}
                  disabled={loading}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  <Label htmlFor="sms_notifications">SMS</Label>
                </div>
                <Switch
                  id="sms_notifications"
                  checked={notifications.sms_notifications}
                  onCheckedChange={(checked) => updateNotifications({ ...notifications, sms_notifications: checked })}
                  disabled={loading}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  <Label htmlFor="push_notifications">Push</Label>
                </div>
                <Switch
                  id="push_notifications"
                  checked={notifications.push_notifications}
                  onCheckedChange={(checked) => updateNotifications({ ...notifications, push_notifications: checked })}
                  disabled={loading}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="appointment_reminders">Rappels de rendez-vous</Label>
                <Switch
                  id="appointment_reminders"
                  checked={notifications.appointment_reminders}
                  onCheckedChange={(checked) => updateNotifications({ ...notifications, appointment_reminders: checked })}
                  disabled={loading}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="system_notifications">Notifications système</Label>
                <Switch
                  id="system_notifications"
                  checked={notifications.system_notifications}
                  onCheckedChange={(checked) => updateNotifications({ ...notifications, system_notifications: checked })}
                  disabled={loading}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Sécurité
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Lock className="mr-2 h-4 w-4" />
                Changer le mot de passe
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Shield className="mr-2 h-4 w-4" />
                Authentification à deux facteurs
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              Général
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">
                Version de l'application: 1.0.0
              </div>
              <div className="text-sm text-muted-foreground">
                Dernière mise à jour: {format(new Date(), 'd MMMM yyyy', { locale: fr })}
              </div>
              <Button variant="outline" className="w-full justify-start">
                <SettingsIcon className="mr-2 h-4 w-4" />
                Paramètres avancés
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
