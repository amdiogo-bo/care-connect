import { useState, useEffect } from 'react';
import { mockDashboardApi } from '@/data/mockApi';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Calendar, BarChart3, UserCog, Loader2 } from 'lucide-react';

const AdminDashboard = () => {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const res = await mockDashboardApi.admin();
      setData(res);
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const stats = [
    { label: 'Utilisateurs', value: (data?.total_users as number) ?? 0, icon: Users, color: 'text-primary' },
    { label: 'Docteurs', value: (data?.total_doctors as number) ?? 0, icon: UserCog, color: 'text-warning' },
    { label: 'RDV total', value: (data?.total_appointments as number) ?? 0, icon: Calendar, color: 'text-success' },
    { label: 'RDV ce mois', value: (data?.appointments_this_month as number) ?? 0, icon: BarChart3, color: 'text-muted-foreground' },
  ];

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-foreground">Administration</h1><p className="text-muted-foreground">Statistiques globales de la plateforme</p></div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="stat-card-shadow">
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`rounded-xl bg-secondary p-3 ${s.color}`}><s.icon className="h-5 w-5" /></div>
              <div><p className="text-sm text-muted-foreground">{s.label}</p><p className="text-2xl font-bold text-foreground">{s.value}</p></div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
