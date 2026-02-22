import { useState, useEffect } from 'react';
import { mockDashboardApi } from '@/data/mockApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, ClipboardList, Clock, Loader2, Stethoscope, UserCircle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const SecretaryDashboard = () => {
  const [data, setData] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const res = await mockDashboardApi.secretary();
      setData(res);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const stats = [
    { label: "RDV aujourd'hui", value: data?.today_count ?? 0, icon: Calendar, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Docteurs', value: data?.doctors_count ?? 0, icon: Users, color: 'text-warning', bg: 'bg-warning/10' },
    { label: 'Total RDV', value: data?.total_appointments ?? 0, icon: ClipboardList, color: 'text-success', bg: 'bg-success/10' },
    { label: 'En attente', value: data?.pending_count ?? 0, icon: Clock, color: 'text-muted-foreground', bg: 'bg-muted' },
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

  const pieData = data?.status_breakdown ? [
    { name: 'Planifiés', value: data.status_breakdown.scheduled, fill: 'hsl(var(--warning))' },
    { name: 'Confirmés', value: data.status_breakdown.confirmed, fill: 'hsl(var(--primary))' },
    { name: 'Terminés', value: data.status_breakdown.completed, fill: 'hsl(var(--success))' },
    { name: 'Annulés', value: data.status_breakdown.cancelled, fill: 'hsl(var(--destructive))' },
  ] : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Tableau de bord secrétaire</h1>
        <p className="text-muted-foreground">Vue d'ensemble des rendez-vous et docteurs</p>
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
                        <p className="text-sm font-medium text-foreground">{apt.patient?.first_name} {apt.patient?.last_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {apt.start_time} · Dr. {apt.doctor?.first_name} {apt.doctor?.last_name}
                        </p>
                      </div>
                    </div>
                    <Badge className={statusColor[apt.status] || ''} variant="secondary">{statusLabel[apt.status] || apt.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pie chart */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Répartition des statuts</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Doctor summaries */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Aperçu des docteurs</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data?.doctor_summaries?.map((doc: any) => (
              <div key={doc.id} className="rounded-lg border p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Stethoscope className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">{doc.specialization}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-muted-foreground">{doc.today_count} RDV aujourd'hui</span>
                  {doc.next_apt ? (
                    <Badge variant="outline" className="text-xs">Prochain : {doc.next_apt.start_time}</Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs text-muted-foreground">Libre</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent appointments */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Rendez-vous récents</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data?.recent_appointments?.map((apt: any) => (
              <div key={apt.id} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {apt.patient?.first_name} {apt.patient?.last_name} → Dr. {apt.doctor?.first_name} {apt.doctor?.last_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(apt.date), 'd MMM yyyy', { locale: fr })} à {apt.start_time}
                  </p>
                </div>
                <Badge className={statusColor[apt.status] || ''} variant="secondary">{statusLabel[apt.status] || apt.status}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecretaryDashboard;
