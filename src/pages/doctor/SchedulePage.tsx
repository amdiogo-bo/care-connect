import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { USE_MOCK } from '@/lib/useMock';
import { ChevronLeft, ChevronRight, Clock, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { mockAppointments, updateAppointmentStatus } from '@/data/mockData';
import { appointmentsApi, Appointment } from '@/api/appointments';
import { doctorsApi } from '@/api/doctors';
import { cn } from '@/lib/utils';

const statusColors: Record<string, string> = {
  scheduled: 'bg-warning/20 text-warning border-warning/30',
  confirmed: 'bg-primary/20 text-primary border-primary/30',
  in_progress: 'bg-accent/20 text-accent border-accent/30',
  completed: 'bg-accent/20 text-accent border-accent/30',
  cancelled: 'bg-destructive/20 text-destructive border-destructive/30',
};

const statusLabels: Record<string, string> = {
  scheduled: 'Planifié',
  confirmed: 'Confirmé',
  in_progress: 'En cours',
  completed: 'Terminé',
  cancelled: 'Annulé',
};

const SchedulePage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'week' | 'day'>('week');
  const [selectedApt, setSelectedApt] = useState<Appointment | null>(null);
  const [notes, setNotes] = useState('');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const doctorId = user?.id || 0;
  const fmt = (d: Date) => d.toISOString().split('T')[0];

  const weekDays = useMemo(() => {
    const start = new Date(currentDate);
    start.setDate(start.getDate() - start.getDay() + 1);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [currentDate]);

  const hours = Array.from({ length: 11 }, (_, i) => i + 8);

  // Charger les données
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        if (USE_MOCK) {
          setAppointments(mockAppointments.filter((a) => a.doctor_id === doctorId));
        } else {
          const startDate = fmt(weekDays[0]);
          const endDate = fmt(weekDays[6]);
          const data = await doctorsApi.schedule({ start_date: startDate, end_date: endDate });
          setAppointments(Array.isArray(data) ? data : data?.appointments || []);
        }
      } catch (error) {
        console.error('Erreur chargement planning:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [doctorId, currentDate]);

  const getAptsForDateHour = (date: string, hour: number) =>
    appointments.filter(
      (a) => a.date === date && parseInt(a.start_time) === hour && a.status !== 'cancelled'
    );

  const navigate = (dir: number) => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + (view === 'week' ? dir * 7 : dir));
    setCurrentDate(d);
  };

  const handleStatusChange = async (id: number, status: Appointment['status']) => {
    try {
      if (USE_MOCK) {
        updateAppointmentStatus(id, status, notes || undefined);
        setAppointments(mockAppointments.filter((a) => a.doctor_id === doctorId));
      } else {
        await appointmentsApi.updateStatus(id, status);
        if (notes) await appointmentsApi.addNotes(id, notes);
        // Refresh
        const data = await doctorsApi.schedule();
        setAppointments(Array.isArray(data) ? data : data?.appointments || []);
      }
      setSelectedApt(null);
      setNotes('');
      toast({ title: 'Statut mis à jour', description: `Rendez-vous ${statusLabels[status].toLowerCase()}.` });
    } catch (error) {
      console.error('Erreur mise à jour statut:', error);
      toast({ title: 'Erreur', description: 'Impossible de mettre à jour le statut.', variant: 'destructive' });
    }
  };

  const displayDays = view === 'week' ? weekDays : [currentDate];

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-foreground">Planning</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setView('day')} className={cn(view === 'day' && 'bg-primary text-primary-foreground')}>Jour</Button>
          <Button variant="outline" size="sm" onClick={() => setView('week')} className={cn(view === 'week' && 'bg-primary text-primary-foreground')}>Semaine</Button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ChevronLeft className="h-5 w-5" /></Button>
        <h2 className="text-lg font-semibold text-foreground">
          {view === 'week'
            ? `${weekDays[0].toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} - ${weekDays[6].toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}`
            : currentDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </h2>
        <Button variant="ghost" size="icon" onClick={() => navigate(1)}><ChevronRight className="h-5 w-5" /></Button>
      </div>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <div className="min-w-[600px]">
            {/* Header */}
            <div className="grid border-b" style={{ gridTemplateColumns: `80px repeat(${displayDays.length}, 1fr)` }}>
              <div className="border-r p-2 text-xs font-medium text-muted-foreground">Heure</div>
              {displayDays.map((d) => (
                <div key={fmt(d)} className={cn('p-2 text-center text-xs font-medium', fmt(d) === fmt(new Date()) && 'bg-primary/10')}>
                  <div className="text-muted-foreground">{d.toLocaleDateString('fr-FR', { weekday: 'short' })}</div>
                  <div className="text-lg font-bold text-foreground">{d.getDate()}</div>
                </div>
              ))}
            </div>
            {/* Body */}
            {hours.map((hour) => (
              <div key={hour} className="grid border-b" style={{ gridTemplateColumns: `80px repeat(${displayDays.length}, 1fr)` }}>
                <div className="flex items-center border-r px-2 py-3 text-xs text-muted-foreground">{`${hour}:00`}</div>
                {displayDays.map((d) => {
                  const apts = getAptsForDateHour(fmt(d), hour);
                  return (
                    <div key={fmt(d)} className={cn('min-h-[60px] border-r p-1', fmt(d) === fmt(new Date()) && 'bg-primary/5')}>
                      {apts.map((a) => (
                        <button
                          key={a.id}
                          onClick={() => { setSelectedApt(a); setNotes(a.notes || ''); }}
                          className={cn('mb-1 w-full rounded border px-2 py-1 text-left text-xs transition-all hover:shadow', statusColors[a.status])}
                        >
                          <p className="font-medium">{a.start_time} - {a.end_time}</p>
                          <p className="truncate">{a.patient?.first_name} {a.patient?.last_name}</p>
                        </button>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Appointment detail dialog */}
      <Dialog open={!!selectedApt} onOpenChange={() => setSelectedApt(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Détails du rendez-vous</DialogTitle>
          </DialogHeader>
          {selectedApt && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">{selectedApt.patient?.first_name} {selectedApt.patient?.last_name}</p>
                  <p className="text-sm text-muted-foreground">{selectedApt.patient?.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Date : </span><span className="font-medium">{new Date(selectedApt.date).toLocaleDateString('fr-FR')}</span></div>
                <div><span className="text-muted-foreground">Heure : </span><span className="font-medium">{selectedApt.start_time} - {selectedApt.end_time}</span></div>
                <div><span className="text-muted-foreground">Type : </span><span className="font-medium">{selectedApt.type}</span></div>
                <div><span className="text-muted-foreground">Statut : </span><Badge className={statusColors[selectedApt.status]}>{statusLabels[selectedApt.status]}</Badge></div>
              </div>
              {selectedApt.reason && <div className="text-sm"><span className="text-muted-foreground">Motif : </span>{selectedApt.reason}</div>}
              <div className="space-y-2">
                <label className="text-sm font-medium">Notes du médecin</label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ajouter des notes..." rows={3} />
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedApt.status === 'scheduled' && <Button size="sm" onClick={() => handleStatusChange(selectedApt.id, 'confirmed')}>Confirmer</Button>}
                {(selectedApt.status === 'confirmed' || selectedApt.status === 'scheduled') && <Button size="sm" variant="secondary" onClick={() => handleStatusChange(selectedApt.id, 'in_progress')}>Démarrer</Button>}
                {selectedApt.status === 'in_progress' && <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => handleStatusChange(selectedApt.id, 'completed')}>Terminer</Button>}
                {selectedApt.status !== 'cancelled' && selectedApt.status !== 'completed' && (
                  <Button size="sm" variant="destructive" onClick={() => handleStatusChange(selectedApt.id, 'cancelled')}>Annuler</Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SchedulePage;
