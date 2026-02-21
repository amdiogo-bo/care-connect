import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { dashboardApi } from '@/api/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, CheckCircle2, Clock, Loader2 } from 'lucide-react';

const DoctorDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await dashboardApi.doctor();
        setData(res.data);
      } catch {
        setData({});
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const stats = [
    { label: "RDV aujourd'hui", value: (data?.today_count as number) ?? 0, icon: Calendar, color: 'text-primary' },
    { label: 'Total patients', value: (data?.total_patients as number) ?? 0, icon: Users, color: 'text-warning' },
    { label: 'Complétés ce mois', value: (data?.completed_this_month as number) ?? 0, icon: CheckCircle2, color: 'text-success' },
    { label: 'En attente', value: (data?.pending_count as number) ?? 0, icon: Clock, color: 'text-muted-foreground' },
  ];

  const todayAppointments = (data?.today_appointments as Array<{ id: number; start_time: string; patient?: { first_name: string; last_name: string }; type: string; status: string }>) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Bonjour, Dr. {user?.last_name} 👋</h1>
        <p className="text-muted-foreground">Voici votre journée</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="stat-card-shadow">
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`rounded-xl bg-secondary p-3 ${s.color}`}>
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Rendez-vous du jour</CardTitle>
        </CardHeader>
        <CardContent>
          {todayAppointments.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">Aucun rendez-vous aujourd'hui</p>
          ) : (
            <div className="space-y-3">
              {todayAppointments.map((apt) => (
                <div key={apt.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium text-foreground">{apt.patient?.first_name} {apt.patient?.last_name}</p>
                    <p className="text-sm text-muted-foreground">{apt.start_time} — {apt.type}</p>
                  </div>
                  <Badge variant="secondary">{apt.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DoctorDashboard;
