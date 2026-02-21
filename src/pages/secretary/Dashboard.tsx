import { useState, useEffect } from 'react';
import { dashboardApi } from '@/api/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, ClipboardList, Loader2 } from 'lucide-react';

const SecretaryDashboard = () => {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await dashboardApi.secretary();
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
    { label: 'Docteurs', value: (data?.doctors_count as number) ?? 0, icon: Users, color: 'text-warning' },
    { label: 'Total RDV', value: (data?.total_appointments as number) ?? 0, icon: ClipboardList, color: 'text-success' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Tableau de bord secrétaire</h1>
        <p className="text-muted-foreground">Vue d'ensemble des rendez-vous</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
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
    </div>
  );
};

export default SecretaryDashboard;
