import { useState, useEffect } from 'react';
import { USE_MOCK } from '@/lib/useMock';
import { mockDashboardApi } from '@/data/mockApi';
import { dashboardApi } from '@/api/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Calendar, BarChart3, UserCog, Loader2, TrendingUp, Activity, Stethoscope } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const AdminDashboard = () => {
  const [data, setData] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = USE_MOCK
          ? await mockDashboardApi.admin()
          : await dashboardApi.admin();
        setData(res);
      } catch (error) {
        console.error('Erreur chargement dashboard admin:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const stats = [
    { label: 'Utilisateurs', value: data?.total_users ?? 0, icon: Users, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Docteurs', value: data?.total_doctors ?? 0, icon: UserCog, color: 'text-warning', bg: 'bg-warning/10' },
    { label: 'Total RDV', value: data?.total_appointments ?? 0, icon: Calendar, color: 'text-success', bg: 'bg-success/10' },
    { label: 'RDV ce mois', value: data?.appointments_this_month ?? 0, icon: BarChart3, color: 'text-muted-foreground', bg: 'bg-muted' },
  ];

  const roleLabel: Record<string, string> = {
    patient: 'Patient', doctor: 'Docteur', secretary: 'Secrétaire', admin: 'Admin',
  };
  const roleBadge: Record<string, string> = {
    patient: 'bg-primary/10 text-primary',
    doctor: 'bg-success/10 text-success',
    secretary: 'bg-warning/10 text-warning',
    admin: 'bg-destructive/10 text-destructive',
  };
  const statusLabel: Record<string, string> = {
    confirmed: 'Confirmé', scheduled: 'Planifié', completed: 'Terminé', cancelled: 'Annulé',
  };
  const statusColor: Record<string, string> = {
    confirmed: 'bg-primary/10 text-primary',
    scheduled: 'bg-warning/10 text-warning',
    completed: 'bg-success/10 text-success',
    cancelled: 'bg-destructive/10 text-destructive',
  };

  const SPEC_COLORS = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--destructive))', 'hsl(var(--chart-5))'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Administration</h1>
        <p className="text-muted-foreground">Statistiques globales de la plateforme</p>
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
              <p className="text-sm font-medium text-foreground">Taux de complétion global</p>
              <span className="text-sm font-bold text-success">{data?.completion_rate ?? 0}%</span>
            </div>
            <Progress value={data?.completion_rate ?? 0} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Monthly trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-primary" /> Tendance mensuelle
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data?.monthly_trend || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                <Bar dataKey="appointments" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="RDV" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status breakdown pie */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Répartition des statuts</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={data?.status_breakdown || []} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={4} dataKey="value">
                  {(data?.status_breakdown || []).map((entry: any, i: number) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Users table */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Utilisateurs</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rôle</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.users_list?.map((u: any) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.first_name} {u.last_name}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{u.email}</TableCell>
                    <TableCell><Badge className={roleBadge[u.role] || ''} variant="secondary">{roleLabel[u.role] || u.role}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Specializations + recent */}
        <div className="space-y-6">
          {/* Specializations */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Spécialités médicales</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data?.specializations?.map((spec: any, i: number) => (
                  <div key={spec.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: SPEC_COLORS[i % SPEC_COLORS.length] }} />
                      <span className="text-sm text-foreground">{spec.name}</span>
                    </div>
                    <span className="text-sm font-medium text-foreground">{spec.value} docteur{spec.value > 1 ? 's' : ''}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent appointments */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Derniers rendez-vous</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data?.recent_appointments?.map((apt: any) => (
                  <div key={apt.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {apt.patient?.first_name} {apt.patient?.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(apt.date), 'd MMM yyyy', { locale: fr })} · Dr. {apt.doctor?.first_name} {apt.doctor?.last_name}
                      </p>
                    </div>
                    <Badge className={statusColor[apt.status] || ''} variant="secondary">{statusLabel[apt.status] || apt.status}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
