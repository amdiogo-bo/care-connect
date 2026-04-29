import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { mockDashboardApi } from '@/data/mockApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, CheckCircle2, Clock, Loader2, TrendingUp, Activity, UserCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Progress } from '@/components/ui/progress';

const DoctorDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const res = await mockDashboardApi.doctor(user!.id);
      setData(res);
      setLoading(false);
    };
    if (user) load();
  }, [user]);

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const stats = [
    { label: "RDV aujourd'hui", value: data?.today_count ?? 0, icon: Calendar, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Total patients', value: data?.total_patients ?? 0, icon: Users, color: 'text-warning', bg: 'bg-warning/10' },
    { label: 'Complétés', value: data?.completed_this_month ?? 0, icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10' },
    { label: 'En attente', value: data?.pending_count ?? 0, icon: Clock, color: 'text-muted-foreground', bg: 'bg-muted' },
  ];

  const statusColor: Record<string, string> = {
    confirmed: 'bg-primary/10 text-primary',
    scheduled: 'bg-warning/10 text-warning',
    completed: 'bg-success/10 text-success',
    in_progress: 'bg-accent/10 text-accent',
  };
  const statusLabel: Record<string, string> = {
    confirmed: 'Confirmé', scheduled: 'Planifié', completed: 'Terminé', in_progress: 'En cours',
  };
  const typeLabel: Record<string, string> = {
    consultation: 'Consultation', follow_up: 'Suivi', emergency: 'Urgence',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Bonjour, Dr. {user?.last_name} 👋</h1>
        <p className="text-muted-foreground">Voici votre journée</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="stat-card-shadow">
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

      {/* Completion rate */}
      <Card>
        <CardContent className="flex items-center gap-6 p-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
            <Activity className="h-6 w-6 text-success" />
          </div>
          <div className="flex-1">
            <div className="mb-1 flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">Taux de complétion</p>
              <span className="text-sm font-bold text-success">{data?.completion_rate ?? 0}%</span>
            </div>
            <Progress value={data?.completion_rate ?? 0} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Today's appointments */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Rendez-vous du jour</CardTitle></CardHeader>
          <CardContent>
            {data?.today_appointments?.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">Aucun rendez-vous aujourd'hui</p>
            ) : (
              <div className="space-y-3">
                {data?.today_appointments?.map((apt: any) => (
                  <div key={apt.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
                        <UserCircle className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{apt.patient?.first_name} {apt.patient?.last_name}</p>
                        <p className="text-xs text-muted-foreground">{apt.start_time} - {apt.end_time} · {typeLabel[apt.type] || apt.type}</p>
                        {apt.reason && <p className="text-xs text-muted-foreground/70 mt-0.5">{apt.reason}</p>}
                      </div>
                    </div>
                    <Badge className={statusColor[apt.status] || ''} variant="secondary">{statusLabel[apt.status] || apt.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Weekly chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-primary" /> Activité de la semaine
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data?.weekly_data || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="RDV" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Patients list */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Mes patients</CardTitle></CardHeader>
        <CardContent>
          {data?.patients_list?.length > 0 ? (
            <div className="space-y-3">
              {data.patients_list.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <UserCircle className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{p.first_name} {p.last_name}</p>
                      <p className="text-xs text-muted-foreground">{p.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">{p.total_visits} visite{p.total_visits > 1 ? 's' : ''}</p>
                    {p.last_visit && <p className="text-xs text-muted-foreground">Dernière : {format(new Date(p.last_visit), 'd MMM yyyy', { locale: fr })}</p>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-muted-foreground">Aucun patient enregistré</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DoctorDashboard;
