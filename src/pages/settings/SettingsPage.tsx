import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Save, User, Bell, Shield, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { mockUsers, mockNotificationPreferences, updateUser, updateNotificationPreferences, NotificationPreferences } from '@/data/mockData';

const SettingsPage = () => {
  const { user, login } = useAuth();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);

  // Account form
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Notification preferences
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);

  useEffect(() => {
    if (user) {
      const p = mockNotificationPreferences.find((np) => np.user_id === user.id);
      if (p) setPrefs({ ...p });
    }
  }, [user]);

  const handleSaveAccount = () => {
    if (!user) return;
    if (!email.trim() || !firstName.trim() || !lastName.trim()) {
      toast({ title: 'Erreur', description: 'Veuillez remplir tous les champs obligatoires.', variant: 'destructive' });
      return;
    }
    updateUser(user.id, { email, phone, first_name: firstName, last_name: lastName });
    // update auth context
    const updatedUser = mockUsers.find((u) => u.id === user.id);
    if (updatedUser) {
      localStorage.setItem('auth_user', JSON.stringify(updatedUser));
    }
    toast({ title: 'Succès', description: 'Informations mises à jour.' });
  };

  const handleChangePassword = () => {
    if (!user) return;
    const mockUser = mockUsers.find((u) => u.id === user.id);
    if (!mockUser || mockUser.password !== currentPassword) {
      toast({ title: 'Erreur', description: 'Mot de passe actuel incorrect.', variant: 'destructive' });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: 'Erreur', description: 'Le nouveau mot de passe doit contenir au moins 6 caractères.', variant: 'destructive' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: 'Erreur', description: 'Les mots de passe ne correspondent pas.', variant: 'destructive' });
      return;
    }
    updateUser(user.id, { password: newPassword });
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    toast({ title: 'Succès', description: 'Mot de passe modifié.' });
  };

  const handleSavePrefs = () => {
    if (!user || !prefs) return;
    updateNotificationPreferences(user.id, prefs);
    toast({ title: 'Succès', description: 'Préférences de notification mises à jour.' });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Paramètres</h1>
        <p className="text-sm text-muted-foreground">Gérez votre compte et vos préférences</p>
      </div>

      <Tabs defaultValue="account" className="space-y-4">
        <TabsList>
          <TabsTrigger value="account" className="gap-2"><User className="h-4 w-4" /> Compte</TabsTrigger>
          <TabsTrigger value="security" className="gap-2"><Shield className="h-4 w-4" /> Sécurité</TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2"><Bell className="h-4 w-4" /> Notifications</TabsTrigger>
        </TabsList>

        {/* Account */}
        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Informations du compte</CardTitle>
              <CardDescription>Modifiez vos informations personnelles</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Prénom</Label>
                  <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Nom</Label>
                  <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Téléphone</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <Button onClick={handleSaveAccount}><Save className="mr-2 h-4 w-4" /> Enregistrer</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Changer le mot de passe</CardTitle>
              <CardDescription>Assurez-vous d'utiliser un mot de passe fort</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Mot de passe actuel</Label>
                <div className="relative">
                  <Input type={showPassword ? 'text' : 'password'} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                  <Button type="button" variant="ghost" size="sm" className="absolute right-1 top-1 h-7 w-7 p-0" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Nouveau mot de passe</Label>
                <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Confirmer le mot de passe</Label>
                <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              </div>
              <Button onClick={handleChangePassword}><Shield className="mr-2 h-4 w-4" /> Modifier le mot de passe</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Préférences de notification</CardTitle>
              <CardDescription>Choisissez comment vous souhaitez être notifié</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {prefs && (
                <>
                  <div>
                    <h3 className="mb-3 text-sm font-semibold text-foreground">Canaux de notification</h3>
                    <div className="space-y-3">
                      {([
                        { key: 'email_enabled' as const, label: 'Email', desc: 'Recevoir les notifications par email' },
                        { key: 'sms_enabled' as const, label: 'SMS', desc: 'Recevoir les notifications par SMS' },
                        { key: 'push_enabled' as const, label: 'Push', desc: 'Recevoir les notifications push sur le navigateur' },
                      ]).map((item) => (
                        <div key={item.key} className="flex items-center justify-between rounded-lg border p-3">
                          <div>
                            <p className="text-sm font-medium text-foreground">{item.label}</p>
                            <p className="text-xs text-muted-foreground">{item.desc}</p>
                          </div>
                          <Switch checked={prefs[item.key]} onCheckedChange={(val) => setPrefs({ ...prefs, [item.key]: val })} />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="mb-3 text-sm font-semibold text-foreground">Rappels automatiques</h3>
                    <div className="space-y-3">
                      {([
                        { key: 'reminder_48h' as const, label: 'Rappel 48h', desc: '48 heures avant le rendez-vous' },
                        { key: 'reminder_24h' as const, label: 'Rappel 24h', desc: '24 heures avant le rendez-vous' },
                        { key: 'reminder_1h' as const, label: 'Rappel 1h', desc: '1 heure avant le rendez-vous' },
                      ]).map((item) => (
                        <div key={item.key} className="flex items-center justify-between rounded-lg border p-3">
                          <div>
                            <p className="text-sm font-medium text-foreground">{item.label}</p>
                            <p className="text-xs text-muted-foreground">{item.desc}</p>
                          </div>
                          <Switch checked={prefs[item.key]} onCheckedChange={(val) => setPrefs({ ...prefs, [item.key]: val })} />
                        </div>
                      ))}
                    </div>
                  </div>
                  <Button onClick={handleSavePrefs}><Save className="mr-2 h-4 w-4" /> Enregistrer les préférences</Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;
