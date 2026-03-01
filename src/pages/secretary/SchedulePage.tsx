import { useState, useEffect, useMemo } from 'react';
import { USE_MOCK } from '@/lib/useMock';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { mockAppointments, mockDoctors } from '@/data/mockData';
import { secretaryApi } from '@/api/secretary';
import { Appointment } from '@/api/appointments';
import { Doctor } from '@/api/doctors';
import { cn } from '@/lib/utils';

const statusColors: Record<string, string> = {
  scheduled: 'bg-warning/20 text-warning border-warning/30',
  confirmed: 'bg-primary/20 text-primary border-primary/30',
  in_progress: 'bg-accent/20 text-accent border-accent/30',
  completed: 'bg-accent/20 text-accent border-accent/30',
  cancelled: 'bg-destructive/20 text-destructive border-destructive/30',
};

const SecretarySchedulePage = () => {
  const [selectedDoctor, setSelectedDoctor] = useState('all');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  const fmt = (d: Date) => d.toISOString().split('T')[0];

  const weekDays = useMemo(() => {
    const start = new Date(currentDate);
    start.setDate(start.getDate() - start.getDay() + 1);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start); d.setDate(d.getDate() + i); return d;
    });
  }, [currentDate]);

  const hours = Array.from({ length: 11 }, (_, i) => i + 8);

  useEffect(() => {
    const load = async () => {
      try {
        if (USE_MOCK) {
          setAppointments([...mockAppointments]);
          setDoctors([...mockDoctors]);
        } else {
          const [scheduleData, docsData] = await Promise.all([
            secretaryApi.schedule({ start_date: fmt(weekDays[0]), end_date: fmt(weekDays[6]) }),
            secretaryApi.assignedDoctors(),
          ]);
          setAppointments(Array.isArray(scheduleData) ? scheduleData : scheduleData?.appointments || []);
          setDoctors(Array.isArray(docsData) ? docsData : []);
        }
      } catch (error) {
        console.error('Erreur chargement planning:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [currentDate]);

  const displayDoctors = selectedDoctor === 'all' ? doctors : doctors.filter((d) => String(d.id) === selectedDoctor);

  const navigate = (dir: number) => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + dir * 7);
    setCurrentDate(d);
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-foreground">Planning multi-docteurs</h1>
        <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
          <SelectTrigger className="w-56"><SelectValue placeholder="Filtrer par médecin" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les médecins</SelectItem>
            {doctors.map((d) => <SelectItem key={d.id} value={String(d.id)}>Dr. {d.first_name} {d.last_name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ChevronLeft className="h-5 w-5" /></Button>
        <h2 className="text-lg font-semibold">{weekDays[0].toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} - {weekDays[6].toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</h2>
        <Button variant="ghost" size="icon" onClick={() => navigate(1)}><ChevronRight className="h-5 w-5" /></Button>
      </div>

      {displayDoctors.map((doc) => (
        <Card key={doc.id}>
          <CardContent className="p-0">
            <div className="border-b p-3">
              <p className="font-semibold text-foreground">Dr. {doc.first_name} {doc.last_name}</p>
              <p className="text-xs text-muted-foreground">{doc.doctor?.specialization}</p>
            </div>
            <div className="overflow-x-auto">
              <div className="min-w-[700px]">
                <div className="grid border-b" style={{ gridTemplateColumns: `60px repeat(7, 1fr)` }}>
                  <div className="border-r p-1" />
                  {weekDays.map((d) => (
                    <div key={fmt(d)} className={cn('p-1 text-center text-xs', fmt(d) === fmt(new Date()) && 'bg-primary/10')}>
                      <div className="text-muted-foreground">{d.toLocaleDateString('fr-FR', { weekday: 'short' })}</div>
                      <div className="font-bold">{d.getDate()}</div>
                    </div>
                  ))}
                </div>
                {hours.map((hour) => (
                  <div key={hour} className="grid border-b" style={{ gridTemplateColumns: `60px repeat(7, 1fr)` }}>
                    <div className="flex items-center border-r px-1 text-[10px] text-muted-foreground">{hour}:00</div>
                    {weekDays.map((d) => {
                      const apts = appointments.filter(
                        (a) => a.doctor_id === doc.id && a.date === fmt(d) && parseInt(a.start_time) === hour && a.status !== 'cancelled'
                      );
                      return (
                        <div key={fmt(d)} className="min-h-[40px] border-r p-0.5">
                          {apts.map((a) => (
                            <div key={a.id} className={cn('rounded px-1 py-0.5 text-[10px] border', statusColors[a.status])}>
                              <span className="font-medium">{a.patient?.first_name?.[0]}. {a.patient?.last_name}</span>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default SecretarySchedulePage;
