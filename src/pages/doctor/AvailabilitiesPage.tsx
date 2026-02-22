import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Clock, Plus, Trash2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

interface DaySchedule {
  enabled: boolean;
  slots: { start: string; end: string }[];
}

const defaultSchedule: Record<string, DaySchedule> = {
  Lundi: { enabled: true, slots: [{ start: '08:00', end: '12:00' }, { start: '14:00', end: '18:00' }] },
  Mardi: { enabled: true, slots: [{ start: '08:00', end: '12:00' }, { start: '14:00', end: '18:00' }] },
  Mercredi: { enabled: true, slots: [{ start: '08:00', end: '12:00' }] },
  Jeudi: { enabled: true, slots: [{ start: '08:00', end: '12:00' }, { start: '14:00', end: '18:00' }] },
  Vendredi: { enabled: true, slots: [{ start: '08:00', end: '12:00' }, { start: '14:00', end: '17:00' }] },
  Samedi: { enabled: false, slots: [] },
  Dimanche: { enabled: false, slots: [] },
};

const AvailabilitiesPage = () => {
  const { toast } = useToast();
  const [schedule, setSchedule] = useState<Record<string, DaySchedule>>(defaultSchedule);

  // Leaves
  const [leaves, setLeaves] = useState<{ from: string; to: string; reason: string }[]>([
    { from: '2025-04-01', to: '2025-04-05', reason: 'Congé annuel' },
  ]);
  const [newLeave, setNewLeave] = useState({ from: '', to: '', reason: '' });

  const toggleDay = (day: string) => {
    setSchedule((s) => ({
      ...s,
      [day]: { ...s[day], enabled: !s[day].enabled },
    }));
  };

  const updateSlot = (day: string, idx: number, field: 'start' | 'end', value: string) => {
    setSchedule((s) => ({
      ...s,
      [day]: {
        ...s[day],
        slots: s[day].slots.map((sl, i) => (i === idx ? { ...sl, [field]: value } : sl)),
      },
    }));
  };

  const addSlot = (day: string) => {
    setSchedule((s) => ({
      ...s,
      [day]: { ...s[day], slots: [...s[day].slots, { start: '08:00', end: '12:00' }] },
    }));
  };

  const removeSlot = (day: string, idx: number) => {
    setSchedule((s) => ({
      ...s,
      [day]: { ...s[day], slots: s[day].slots.filter((_, i) => i !== idx) },
    }));
  };

  const addLeave = () => {
    if (!newLeave.from || !newLeave.to) {
      toast({ title: 'Erreur', description: 'Veuillez remplir les dates.', variant: 'destructive' });
      return;
    }
    setLeaves([...leaves, { ...newLeave }]);
    setNewLeave({ from: '', to: '', reason: '' });
    toast({ title: 'Congé ajouté' });
  };

  const handleSave = () => {
    toast({ title: 'Disponibilités enregistrées', description: 'Votre planning a été mis à jour.' });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Mes disponibilités</h1>

      {/* Weekly schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5" /> Horaires de travail</CardTitle>
          <CardDescription>Définissez vos heures de disponibilité pour chaque jour</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(schedule).map(([day, daySchedule]) => (
            <div key={day} className="rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Switch checked={daySchedule.enabled} onCheckedChange={() => toggleDay(day)} />
                  <span className="text-sm font-medium text-foreground">{day}</span>
                </div>
                {daySchedule.enabled && (
                  <Button variant="ghost" size="sm" onClick={() => addSlot(day)}><Plus className="mr-1 h-3 w-3" /> Créneau</Button>
                )}
              </div>
              {daySchedule.enabled && (
                <div className="mt-3 space-y-2 pl-12">
                  {daySchedule.slots.map((slot, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Input type="time" value={slot.start} onChange={(e) => updateSlot(day, idx, 'start', e.target.value)} className="w-32" />
                      <span className="text-muted-foreground">→</span>
                      <Input type="time" value={slot.end} onChange={(e) => updateSlot(day, idx, 'end', e.target.value)} className="w-32" />
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeSlot(day, idx)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          <Button onClick={handleSave}><Save className="mr-2 h-4 w-4" /> Enregistrer</Button>
        </CardContent>
      </Card>

      {/* Leaves */}
      <Card>
        <CardHeader>
          <CardTitle>Congés & absences</CardTitle>
          <CardDescription>Gérez vos périodes d'indisponibilité</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {leaves.map((leave, idx) => (
            <div key={idx} className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">{new Date(leave.from).toLocaleDateString('fr-FR')} → {new Date(leave.to).toLocaleDateString('fr-FR')}</p>
                {leave.reason && <p className="text-xs text-muted-foreground">{leave.reason}</p>}
              </div>
              <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setLeaves(leaves.filter((_, i) => i !== idx))}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <div className="grid gap-3 rounded-lg border p-3 sm:grid-cols-4">
            <div className="space-y-1">
              <Label className="text-xs">Du</Label>
              <Input type="date" value={newLeave.from} onChange={(e) => setNewLeave({ ...newLeave, from: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Au</Label>
              <Input type="date" value={newLeave.to} onChange={(e) => setNewLeave({ ...newLeave, to: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Motif</Label>
              <Input value={newLeave.reason} onChange={(e) => setNewLeave({ ...newLeave, reason: e.target.value })} placeholder="Optionnel" />
            </div>
            <div className="flex items-end">
              <Button onClick={addLeave} className="w-full"><Plus className="mr-1 h-4 w-4" /> Ajouter</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AvailabilitiesPage;
