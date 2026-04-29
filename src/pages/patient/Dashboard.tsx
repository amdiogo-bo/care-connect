import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { mockDashboardApi } from '@/data/mockApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, CalendarPlus, Clock, CheckCircle2, XCircle, Loader2, Stethoscope, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const PatientDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const res = await mockDashboardApi.patient(user!.id);
      setData(res);
      setLoading(false);
    };
    if (user) load();
  }, [user]);

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const stats = [
    { label: 'Total RDV', value: data?.total_appointments ?? 0, icon: Calendar, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'À venir', value: data?.upcoming_appointments ?? 0, icon: Clock, color: 'text-warning', bg: 'bg-warning/10' },
    { label: 'Terminés', value: data?.completed_appointments ?? 0, icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10' },
    { label: 'Annulés', value: data?.cancelled_appointments ?? 0, icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10' },
  ];

  const statusColor: Record<string, string> = {
    confirmed: 'bg-primary/10 text-primary',
    scheduled: 'bg-warning/10 text-warning',
    completed: 'bg-success/10 text-success',
    cancelled: 'bg-destructive/10 text-destructive',
  };
  const statusLabel: Record<string, string> = {
    confirmed: 'Confirmé', scheduled: 'Planifié', completed: 'Terminé', cancelled: 'Annulé',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Bonjour, {user?.first_name} 👋</h1>
          <p className="text-muted-foreground">Voici un aperçu de vos rendez-vous</p>
        </div>
        <Button onClick={() => navigate('/patient/book')} className="gap-2">
          <CalendarPlus className="h-4 w-4" /> Prendre un RDV
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="stat-card-shadow hover:stat-card-shadow-hover transition-shadow">
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`rounded-xl p-3 ${s.bg}`}><s.icon className={`h-5 w-5 ${s.color}`} /></div>
              <div>
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Next appointment highlight */}
      {data?.next_appointment && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader><CardTitle className="text-lg">Prochain rendez-vous</CardTitle></CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Stethoscope className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Dr. {data.next_appointment.doctor?.first_name} {data.next_appointment.doctor?.last_name}</p>
                <p className="text-sm text-muted-foreground">{data.next_appointment.doctor?.doctor?.specialization}</p>
                <p className="mt-1 text-sm font-medium text-primary">
                  {format(new Date(data.next_appointment.date), 'EEEE d MMMM yyyy', { locale: fr })} à {data.next_appointment.start_time}
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={() => navigate('/patient/appointments')}>Voir détails</Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Monthly chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-primary" /> Activité (6 derniers mois)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data?.monthly_data || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="RDV" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Upcoming list */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Rendez-vous à venir</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/patient/appointments')}>Voir tout</Button>
          </CardHeader>
          <CardContent>
            {data?.upcoming?.length > 0 ? (
              <div className="space-y-3">
                {data.upcoming.slice(0, 4).map((apt: any) => (
                  <div key={apt.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                        <Stethoscope className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">Dr. {apt.doctor?.first_name} {apt.doctor?.last_name}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(apt.date), 'd MMM yyyy', { locale: fr })} — {apt.start_time}</p>
                      </div>
                    </div>
                    <Badge className={statusColor[apt.status] || ''} variant="secondary">{statusLabel[apt.status] || apt.status}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <Calendar className="mx-auto mb-3 h-10 w-10 opacity-40" />
                <p>Aucun rendez-vous à venir</p>
                <Button variant="link" onClick={() => navigate('/patient/book')} className="mt-2">Prendre un rendez-vous</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent completed */}
      {data?.recent_completed?.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Dernières consultations terminées</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.recent_completed.map((apt: any) => (
                <div key={apt.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                      <CheckCircle2 className="h-5 w-5 text-success" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Dr. {apt.doctor?.first_name} {apt.doctor?.last_name}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(apt.date), 'd MMM yyyy', { locale: fr })} — {apt.reason || 'Consultation'}</p>
                    </div>
                  </div>
                  <Badge className="bg-success/10 text-success" variant="secondary">Terminé</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PatientDashboard;
