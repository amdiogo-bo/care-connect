import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { appointmentsApi } from '@/api/appointments';
import { Appointment } from '@/api/appointments';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Stethoscope, Loader2, Calendar, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  scheduled: { label: 'Planifié', variant: 'default' },
  confirmed: { label: 'Confirmé', variant: 'default' },
  in_progress: { label: 'En cours', variant: 'secondary' },
  completed: { label: 'Terminé', variant: 'outline' },
  cancelled: { label: 'Annulé', variant: 'destructive' },
};

const MyAppointments = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAppointments = async () => {
    try {
      const response = await appointmentsApi.list();
      setAppointments(response);
    } catch (error) {
      console.error('Erreur lors du chargement des rendez-vous:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (user) fetchAppointments(); }, [user]);

  const cancelAppointment = async (id: number) => {
    try {
      await appointmentsApi.cancel(id);
      toast({ title: 'Rendez-vous annulé' });
      fetchAppointments();
    } catch (error) {
      console.error('Erreur lors de l\'annulation:', error);
      toast({ title: 'Erreur', description: 'Erreur lors de l\'annulation', variant: 'destructive' });
    }
  };

  const now = new Date().toISOString().split('T')[0];
  const upcoming = appointments.filter((a) => a.date >= now && a.status !== 'cancelled' && a.status !== 'completed');
  const past = appointments.filter((a) => a.date < now || a.status === 'completed' || a.status === 'cancelled');

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const renderList = (list: Appointment[], showCancel: boolean) =>
    list.length === 0 ? (
      <div className="py-12 text-center text-muted-foreground"><Calendar className="mx-auto mb-3 h-10 w-10 opacity-40" /><p>Aucun rendez-vous</p></div>
    ) : (
      <div className="space-y-3">
        {list.map((apt) => {
          const status = statusMap[apt.status] || statusMap.scheduled;
          return (
            <div key={apt.id} className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-secondary/50">
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10"><Stethoscope className="h-5 w-5 text-primary" /></div>
                <div>
                  <p className="font-medium text-foreground">Dr. {apt.doctor?.first_name} {apt.doctor?.last_name}</p>
                  <p className="text-sm text-muted-foreground">{format(new Date(apt.date), 'd MMM yyyy', { locale: fr })} à {apt.start_time}</p>
                  {apt.reason && <p className="mt-1 text-xs text-muted-foreground">{apt.reason}</p>}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={status.variant}>{status.label}</Badge>
                {showCancel && apt.status !== 'cancelled' && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"><XCircle className="h-4 w-4" /></Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Annuler le rendez-vous ?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Voulez-vous vraiment annuler votre rendez-vous du {format(new Date(apt.date), 'd MMMM yyyy', { locale: fr })} à {apt.start_time} ?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Non, garder</AlertDialogCancel>
                        <AlertDialogAction onClick={() => cancelAppointment(apt.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Oui, annuler</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Mes rendez-vous</h1>
      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">À venir ({upcoming.length})</TabsTrigger>
          <TabsTrigger value="past">Historique ({past.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming" className="mt-4"><Card><CardContent className="p-4">{renderList(upcoming, true)}</CardContent></Card></TabsContent>
        <TabsContent value="past" className="mt-4"><Card><CardContent className="p-4">{renderList(past, false)}</CardContent></Card></TabsContent>
      </Tabs>
    </div>
  );
};

export default MyAppointments;
