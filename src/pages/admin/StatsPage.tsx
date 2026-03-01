import { useState, useEffect, useMemo } from 'react';
import { USE_MOCK } from '@/lib/useMock';
import { Users, Calendar, Stethoscope, TrendingUp, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { mockAppointments, mockDoctors, mockUsers } from '@/data/mockData';
import { dashboardApi } from '@/api/dashboard';

const COLORS = ['hsl(217,91%,60%)', 'hsl(160,84%,39%)', 'hsl(38,92%,50%)', 'hsl(0,84%,60%)', 'hsl(262,83%,58%)'];

const AdminStatsPage = () => {
  const [apiStats, setApiStats] = useState<any>(null);
  const [loading, setLoading] = useState(!USE_MOCK);

  useEffect(() => {
    if (!USE_MOCK) {
      const load = async () => {
        try {
          const data = await dashboardApi.stats();
          setApiStats(data);
        } catch (error) {
          console.error('Erreur chargement stats:', error);
        } finally {
          setLoading(false);
        }
      };
      load();
    }
  }, []);

  const stats = useMemo(() => {
    if (!USE_MOCK && apiStats) return apiStats;

    const total = mockAppointments.length;
    const completed = mockAppointments.filter((a) => a.status === 'completed').length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    const monthly = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(); d.setMonth(d.getMonth() - (5 - i));
      const key = d.toISOString().slice(0, 7);
      return { month: d.toLocaleDateString('fr-FR', { month: 'short' }), count: mockAppointments.filter((a) => a.date.startsWith(key)).length };
    });

    const bySpec: Record<string, number> = {};
    mockDoctors.forEach((d) => { const s = d.doctor?.specialization || 'Autre'; bySpec[s] = (bySpec[s] || 0) + 1; });

    const roleBreakdown = [
      { name: 'Patients', value: mockUsers.filter((u) => u.role === 'patient').length },
      { name: 'Médecins', value: mockUsers.filter((u) => u.role === 'doctor').length },
      { name: 'Secrétaires', value: mockUsers.filter((u) => u.role === 'secretary').length },
      { name: 'Admins', value: mockUsers.filter((u) => u.role === 'admin').length },
    ];

    return {
      total, completed, rate, monthly,
      totalUsers: mockUsers.length,
      totalDoctors: mockDoctors.length,
      specializations: Object.entries(bySpec).map(([name, value]) => ({ name, value })),
      roleBreakdown,
    };
  }, [apiStats]);

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Statistiques avancées</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Utilisateurs', value: stats.totalUsers ?? stats.total_users ?? 0, icon: Users, color: 'text-primary' },
          { label: 'Médecins', value: stats.totalDoctors ?? stats.total_doctors ?? 0, icon: Stethoscope, color: 'text-accent' },
          { label: 'Total RDV', value: stats.total ?? stats.total_appointments ?? 0, icon: Calendar, color: 'text-warning' },
          { label: 'Taux complétion', value: `${stats.rate ?? stats.completion_rate ?? 0}%`, icon: TrendingUp, color: 'text-primary' },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-4 p-4">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-muted ${s.color}`}><s.icon className="h-5 w-5" /></div>
              <div><p className="text-2xl font-bold text-foreground">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card><CardHeader><CardTitle>Tendance mensuelle</CardTitle></CardHeader><CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={stats.monthly}><XAxis dataKey="month" fontSize={12} /><YAxis fontSize={12} /><Tooltip /><Bar dataKey="count" fill="hsl(217,91%,60%)" radius={[4,4,0,0]} /></BarChart>
          </ResponsiveContainer>
        </CardContent></Card>

        <Card><CardHeader><CardTitle>Utilisateurs par rôle</CardTitle></CardHeader><CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart><Pie data={stats.roleBreakdown || stats.role_breakdown || []} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({name, value}: any) => `${name}: ${value}`}>
              {(stats.roleBreakdown || stats.role_breakdown || []).map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie><Tooltip /></PieChart>
          </ResponsiveContainer>
        </CardContent></Card>

        <Card><CardHeader><CardTitle>Spécialités médicales</CardTitle></CardHeader><CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart><Pie data={stats.specializations || []} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({name, value}: any) => `${name}: ${value}`}>
              {(stats.specializations || []).map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie><Tooltip /></PieChart>
          </ResponsiveContainer>
        </CardContent></Card>
      </div>
    </div>
  );
};

export default AdminStatsPage;
