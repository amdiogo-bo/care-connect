import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { dashboardApi } from '@/api/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, CalendarPlus, Clock, CheckCircle2, XCircle, Loader2, Stethoscope } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface DashboardData {
  total_appointments?: number;
  upcoming_appointments?: number;
  completed_appointments?: number;
  cancelled_appointments?: number;
  next_appointment?: {
    id: number;
    date: string;
    start_time: string;
    doctor?: { first_name: string; last_name: string; doctor?: { specialization: string } };
  };
  upcoming?: Array<{
    id: number;
    date: string;
    start_time: string;
    doctor?: { first_name: string; last_name: string; doctor?: { specialization: string } };
  }>;
}

const statusBadge: Record<string, { label: string; className: string }> = {
  scheduled: { label: 'Planifié', className: 'bg-primary/10 text-primary' },
  confirmed: { label: 'Confirmé', className: 'bg-primary/10 text-primary' },
  completed: { label: 'Terminé', className: 'bg-success/10 text-success' },
  cancelled: { label: 'Annulé', className: 'bg-destructive/10 text-destructive' },
};

const PatientDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await dashboardApi.patient();
        setData(res.data);
      } catch {
        // API not available — show empty state
        setData({});
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const stats = [
    { label: 'Total RDV', value: data?.total_appointments ?? 0, icon: Calendar, color: 'text-primary' },
    { label: 'À venir', value: data?.upcoming_appointments ?? 0, icon: Clock, color: 'text-warning' },
    { label: 'Terminés', value: data?.completed_appointments ?? 0, icon: CheckCircle2, color: 'text-success' },
    { label: 'Annulés', value: data?.cancelled_appointments ?? 0, icon: XCircle, color: 'text-destructive' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Bonjour, {user?.first_name} 👋
          </h1>
          <p className="text-muted-foreground">Voici un aperçu de vos rendez-vous</p>
        </div>
        <Button onClick={() => navigate('/patient/book')} className="gap-2">
          <CalendarPlus className="h-4 w-4" />
          Prendre un RDV
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="stat-card-shadow transition-shadow hover:stat-card-shadow-hover">
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`rounded-xl bg-secondary p-3 ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Next appointment */}
      {data?.next_appointment && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg">Prochain rendez-vous</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Stethoscope className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">
                  Dr. {data.next_appointment.doctor?.first_name} {data.next_appointment.doctor?.last_name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {data.next_appointment.doctor?.doctor?.specialization}
                </p>
                <p className="mt-1 text-sm font-medium text-primary">
                  {format(new Date(data.next_appointment.date), 'EEEE d MMMM yyyy', { locale: fr })} à {data.next_appointment.start_time}
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={() => navigate(`/patient/appointments`)}>
              Voir détails
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Upcoming list */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Rendez-vous à venir</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => navigate('/patient/appointments')}>
            Voir tout
          </Button>
        </CardHeader>
        <CardContent>
          {data?.upcoming && data.upcoming.length > 0 ? (
            <div className="space-y-3">
              {data.upcoming.slice(0, 5).map((apt) => (
                <div key={apt.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                      <Stethoscope className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Dr. {apt.doctor?.first_name} {apt.doctor?.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(apt.date), 'd MMM yyyy', { locale: fr })} — {apt.start_time}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {apt.doctor?.doctor?.specialization || 'Consultation'}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              <Calendar className="mx-auto mb-3 h-10 w-10 opacity-40" />
              <p>Aucun rendez-vous à venir</p>
              <Button variant="link" onClick={() => navigate('/patient/book')} className="mt-2">
                Prendre un rendez-vous
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PatientDashboard;
