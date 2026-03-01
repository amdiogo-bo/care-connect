import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { USE_MOCK } from '@/lib/useMock';
import { BarChart3, TrendingUp, Users, CheckCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { mockAppointments } from '@/data/mockData';
import { doctorsApi } from '@/api/doctors';

const COLORS = ['hsl(217,91%,60%)', 'hsl(160,84%,39%)', 'hsl(38,92%,50%)', 'hsl(0,84%,60%)'];

const StatsPage = () => {
  const { user } = useAuth();
  const doctorId = user?.id || 0;
  const [apiStats, setApiStats] = useState<any>(null);
  const [loading, setLoading] = useState(!USE_MOCK);

  useEffect(() => {
    if (!USE_MOCK) {
      const load = async () => {
        try {
          const data = await doctorsApi.stats();
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

    const apts = mockAppointments.filter((a) => a.doctor_id === doctorId);
    const total = apts.length;
    const completed = apts.filter((a) => a.status === 'completed').length;
    const cancelled = apts.filter((a) => a.status === 'cancelled').length;
    const patients = new Set(apts.map((a) => a.patient_id)).size;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    const monthly = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(); d.setMonth(d.getMonth() - (5 - i));
      const key = d.toISOString().slice(0, 7);
      return { month: d.toLocaleDateString('fr-FR', { month: 'short' }), count: apts.filter((a) => a.date.startsWith(key)).length };
    });

    const statusBreakdown = [
      { name: 'Confirmés', value: apts.filter((a) => a.status === 'confirmed').length },
      { name: 'Terminés', value: completed },
      { name: 'Planifiés', value: apts.filter((a) => a.status === 'scheduled').length },
      { name: 'Annulés', value: cancelled },
    ];

    const typeBreakdown = [
      { name: 'Consultation', value: apts.filter((a) => a.type === 'consultation').length },
      { name: 'Suivi', value: apts.filter((a) => a.type === 'follow_up').length },
      { name: 'Urgence', value: apts.filter((a) => a.type === 'emergency').length },
    ];

    return { total, completed, cancelled, patients, rate, monthly, statusBreakdown, typeBreakdown };
  }, [doctorId, apiStats]);

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Statistiques</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total RDV', value: stats.total, icon: BarChart3, color: 'text-primary' },
          { label: 'Patients', value: stats.patients, icon: Users, color: 'text-accent' },
          { label: 'Terminés', value: stats.completed, icon: CheckCircle, color: 'text-accent' },
          { label: 'Taux complétion', value: `${stats.rate}%`, icon: TrendingUp, color: 'text-primary' },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-4 p-4">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-muted ${s.color}`}>
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Activité mensuelle</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats.monthly}>
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(217,91%,60%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Répartition par statut</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={stats.statusBreakdown} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {stats.statusBreakdown.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Répartition par type</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={stats.typeBreakdown} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {stats.typeBreakdown.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StatsPage;
