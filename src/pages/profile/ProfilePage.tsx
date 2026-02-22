import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Save, User, Stethoscope, Heart, Phone, MapPin, Calendar, Droplets, AlertTriangle, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { mockProfiles, mockDoctors, mockAppointments, mockUsers, updateProfile, UserProfile } from '@/data/mockData';

const roleLabels: Record<string, string> = {
  patient: 'Patient',
  doctor: 'Médecin',
  secretary: 'Secrétaire',
  admin: 'Administrateur',
};

const ProfilePage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (user) {
      const p = mockProfiles.find((pr) => pr.user_id === user.id);
      setProfile(p ? { ...p } : { user_id: user.id });
    }
  }, [user]);

  const handleSave = () => {
    if (!user || !profile) return;
    updateProfile(user.id, profile);
    toast({ title: 'Profil mis à jour', description: 'Vos informations ont été enregistrées.' });
  };

  const update = (key: keyof UserProfile, value: unknown) => {
    if (profile) setProfile({ ...profile, [key]: value });
  };

  if (!user || !profile) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full medical-gradient text-2xl font-bold text-primary-foreground">
          {user.first_name[0]}{user.last_name[0]}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{user.first_name} {user.last_name}</h1>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{roleLabels[user.role]}</Badge>
            {user.doctor && <Badge className="bg-primary/10 text-primary">{user.doctor.specialization}</Badge>}
          </div>
        </div>
      </div>

      {/* Common info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" /> Informations personnelles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label>Prénom</Label><Input value={user.first_name} disabled /></div>
            <div className="space-y-2"><Label>Nom</Label><Input value={user.last_name} disabled /></div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label>Email</Label><Input value={user.email} disabled /></div>
            <div className="space-y-2"><Label>Téléphone</Label><Input value={user.phone || ''} disabled /></div>
          </div>
          <div className="space-y-2">
            <Label>Adresse</Label>
            <Input value={profile.address || ''} onChange={(e) => update('address', e.target.value)} placeholder="Votre adresse" />
          </div>
          <div className="space-y-2">
            <Label>Bio</Label>
            <Textarea value={profile.bio || ''} onChange={(e) => update('bio', e.target.value)} placeholder="Une courte description..." rows={3} />
          </div>
        </CardContent>
      </Card>

      {/* Patient-specific */}
      {user.role === 'patient' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Heart className="h-5 w-5 text-destructive" /> Informations médicales</CardTitle>
            <CardDescription>Ces informations aident vos médecins à mieux vous soigner</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Date de naissance</Label>
                <Input type="date" value={profile.date_of_birth || ''} onChange={(e) => update('date_of_birth', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1"><Droplets className="h-3.5 w-3.5" /> Groupe sanguin</Label>
                <Input value={profile.blood_type || ''} onChange={(e) => update('blood_type', e.target.value)} placeholder="Ex: O+, A-, B+..." />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1"><AlertTriangle className="h-3.5 w-3.5" /> Allergies</Label>
              <Textarea value={profile.allergies || ''} onChange={(e) => update('allergies', e.target.value)} placeholder="Listez vos allergies connues..." rows={2} />
            </div>
            <div className="space-y-2">
              <Label>Conditions chroniques</Label>
              <Textarea value={profile.chronic_conditions || ''} onChange={(e) => update('chronic_conditions', e.target.value)} placeholder="Hypertension, diabète, etc." rows={2} />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> Contact d'urgence</Label>
              <Input value={profile.emergency_contact || ''} onChange={(e) => update('emergency_contact', e.target.value)} placeholder="+221 ..." />
            </div>

            {/* Medical history (read-only) */}
            <div className="mt-4">
              <h3 className="mb-2 text-sm font-semibold text-foreground">Historique médical récent</h3>
              <div className="space-y-2">
                {mockAppointments
                  .filter((a) => a.patient_id === user.id && a.status === 'completed')
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .slice(0, 5)
                  .map((a) => (
                    <div key={a.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="text-sm font-medium">Dr. {a.doctor?.first_name} {a.doctor?.last_name}</p>
                        <p className="text-xs text-muted-foreground">{a.reason}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">{new Date(a.date).toLocaleDateString('fr-FR')}</span>
                    </div>
                  ))}
                {mockAppointments.filter((a) => a.patient_id === user.id && a.status === 'completed').length === 0 && (
                  <p className="text-sm text-muted-foreground">Aucun historique disponible.</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Doctor-specific */}
      {user.role === 'doctor' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Stethoscope className="h-5 w-5 text-primary" /> Informations professionnelles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Spécialité</Label>
                <Input value={user.doctor?.specialization || ''} disabled />
              </div>
              <div className="space-y-2">
                <Label>Bureau</Label>
                <Input value={user.doctor?.office_number || ''} disabled />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Prix de consultation (FCFA)</Label>
              <Input type="number" value={profile.consultation_fee || ''} onChange={(e) => update('consultation_fee', Number(e.target.value))} placeholder="25000" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Secretary-specific */}
      {user.role === 'secretary' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-primary" /> Médecins assignés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(profile.assigned_doctors || []).map((docId) => {
                const doc = mockDoctors.find((d) => d.id === docId);
                return doc ? (
                  <div key={docId} className="flex items-center gap-3 rounded-lg border p-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      {doc.first_name[0]}{doc.last_name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium">Dr. {doc.first_name} {doc.last_name}</p>
                      <p className="text-xs text-muted-foreground">{doc.doctor?.specialization}</p>
                    </div>
                  </div>
                ) : null;
              })}
              {(!profile.assigned_doctors || profile.assigned_doctors.length === 0) && (
                <p className="text-sm text-muted-foreground">Aucun médecin assigné.</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Admin-specific */}
      {user.role === 'admin' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5 text-primary" /> Accès global</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border p-4 text-center">
                <p className="text-2xl font-bold text-primary">{mockUsers.length}</p>
                <p className="text-xs text-muted-foreground">Utilisateurs</p>
              </div>
              <div className="rounded-lg border p-4 text-center">
                <p className="text-2xl font-bold text-accent">{mockDoctors.length}</p>
                <p className="text-xs text-muted-foreground">Médecins</p>
              </div>
              <div className="rounded-lg border p-4 text-center">
                <p className="text-2xl font-bold text-warning">{mockAppointments.length}</p>
                <p className="text-xs text-muted-foreground">Rendez-vous</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Button size="lg" onClick={handleSave}><Save className="mr-2 h-4 w-4" /> Enregistrer le profil</Button>
    </div>
  );
};

export default ProfilePage;
