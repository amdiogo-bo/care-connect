import { useState, useEffect, useMemo } from 'react';
import { USE_MOCK } from '@/lib/useMock';
import { Search, Plus, XCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { mockAppointments, mockDoctors, mockUsers, addMockAppointment, updateAppointmentStatus, generateTimeSlots } from '@/data/mockData';
import { appointmentsApi, Appointment } from '@/api/appointments';
import { doctorsApi, Doctor } from '@/api/doctors';
import { secretaryApi } from '@/api/secretary';

const statusLabels: Record<string, string> = {
  scheduled: 'Planifié', confirmed: 'Confirmé', in_progress: 'En cours', completed: 'Terminé', cancelled: 'Annulé',
};
const statusColors: Record<string, string> = {
  scheduled: 'bg-warning/20 text-warning', confirmed: 'bg-primary/20 text-primary', in_progress: 'bg-accent/20 text-accent', completed: 'bg-accent/20 text-accent', cancelled: 'bg-destructive/20 text-destructive',
};

const AppointmentsPage = () => {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [doctorFilter, setDoctorFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Create form
  const [formDoctor, setFormDoctor] = useState('');
  const [formPatient, setFormPatient] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formSlot, setFormSlot] = useState('');
  const [formType, setFormType] = useState('consultation');
  const [formReason, setFormReason] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        if (USE_MOCK) {
          setAppointments([...mockAppointments]);
          setDoctors([...mockDoctors]);
          setPatients(mockUsers.filter((u) => u.role === 'patient'));
        } else {
          const [aptsData, docsData, patientsData] = await Promise.all([
            appointmentsApi.list(),
            secretaryApi.assignedDoctors(),
            secretaryApi.patients(),
          ]);
          setAppointments(Array.isArray(aptsData) ? aptsData : []);
          setDoctors(Array.isArray(docsData) ? docsData : []);
          setPatients(Array.isArray(patientsData) ? patientsData : []);
        }
      } catch (error) {
        console.error('Erreur chargement:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    return appointments
      .filter((a) => {
        const matchSearch = `${a.patient?.first_name} ${a.patient?.last_name} ${a.doctor?.first_name} ${a.doctor?.last_name}`.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === 'all' || a.status === statusFilter;
        const matchDoctor = doctorFilter === 'all' || String(a.doctor_id) === doctorFilter;
        return matchSearch && matchStatus && matchDoctor;
      })
      .sort((a, b) => b.date.localeCompare(a.date) || b.start_time.localeCompare(a.start_time));
  }, [search, statusFilter, doctorFilter, appointments]);

  const slots = formDoctor && formDate ? generateTimeSlots(Number(formDoctor), formDate).filter((s) => s.available) : [];

  const handleCreate = async () => {
    if (!formDoctor || !formPatient || !formDate || !formSlot) {
      toast({ title: 'Erreur', description: 'Veuillez remplir tous les champs obligatoires.', variant: 'destructive' });
      return;
    }
    const [start, end] = formSlot.split('-');
    try {
      if (USE_MOCK) {
        const doctor = doctors.find((d) => d.id === Number(formDoctor));
        const patient = patients.find((p) => p.id === Number(formPatient));
        addMockAppointment({
          patient_id: Number(formPatient), doctor_id: Number(formDoctor), date: formDate,
          start_time: start, end_time: end, status: 'confirmed', type: formType as Appointment['type'], reason: formReason,
          patient: patient ? { id: patient.id, first_name: patient.first_name, last_name: patient.last_name, email: patient.email } : undefined,
          doctor: doctor ? { id: doctor.id, first_name: doctor.first_name, last_name: doctor.last_name, doctor: doctor.doctor ? { specialization: doctor.doctor.specialization } : undefined } : undefined,
        });
        setAppointments([...mockAppointments]);
      } else {
        await secretaryApi.createAppointment({
          patient_id: Number(formPatient), doctor_id: Number(formDoctor), date: formDate,
          start_time: start, end_time: end, type: formType, reason: formReason,
        });
        const data = await appointmentsApi.list();
        setAppointments(Array.isArray(data) ? data : []);
      }
      setShowCreate(false);
      setFormDoctor(''); setFormPatient(''); setFormDate(''); setFormSlot(''); setFormReason('');
      toast({ title: 'Rendez-vous créé' });
    } catch (error) {
      console.error('Erreur création:', error);
      toast({ title: 'Erreur', description: 'Impossible de créer le rendez-vous.', variant: 'destructive' });
    }
  };

  const handleStatusChange = async (id: number, status: Appointment['status']) => {
    try {
      if (USE_MOCK) {
        updateAppointmentStatus(id, status);
        setAppointments([...mockAppointments]);
      } else {
        await appointmentsApi.updateStatus(id, status);
        const data = await appointmentsApi.list();
        setAppointments(Array.isArray(data) ? data : []);
      }
      toast({ title: 'Statut mis à jour' });
    } catch (error) {
      console.error('Erreur:', error);
      toast({ title: 'Erreur', variant: 'destructive' });
    }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-foreground">Gestion des rendez-vous</h1>
        <Button onClick={() => setShowCreate(true)}><Plus className="mr-2 h-4 w-4" /> Nouveau RDV</Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Rechercher..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Statut" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            {Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={doctorFilter} onValueChange={setDoctorFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Médecin" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les médecins</SelectItem>
            {doctors.map((d) => <SelectItem key={d.id} value={String(d.id)}>Dr. {d.first_name} {d.last_name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {filtered.map((apt) => (
          <Card key={apt.id}>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-sm font-semibold">{apt.patient?.first_name} {apt.patient?.last_name}</p>
                  <p className="text-xs text-muted-foreground">Dr. {apt.doctor?.first_name} {apt.doctor?.last_name} • {apt.doctor?.doctor?.specialization}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{new Date(apt.date).toLocaleDateString('fr-FR')}</span>
                <span>{apt.start_time} - {apt.end_time}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={statusColors[apt.status]}>{statusLabels[apt.status]}</Badge>
                {apt.status === 'scheduled' && (
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => handleStatusChange(apt.id, 'confirmed')}><CheckCircle className="mr-1 h-3 w-3" />Confirmer</Button>
                )}
                {apt.status !== 'cancelled' && apt.status !== 'completed' && (
                  <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive" onClick={() => handleStatusChange(apt.id, 'cancelled')}><XCircle className="mr-1 h-3 w-3" />Annuler</Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && <p className="text-center text-muted-foreground py-8">Aucun rendez-vous trouvé.</p>}
      </div>

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nouveau rendez-vous</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Patient</Label>
              <Select value={formPatient} onValueChange={setFormPatient}>
                <SelectTrigger><SelectValue placeholder="Choisir un patient" /></SelectTrigger>
                <SelectContent>{patients.map((p: any) => <SelectItem key={p.id} value={String(p.id)}>{p.first_name} {p.last_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Médecin</Label>
              <Select value={formDoctor} onValueChange={setFormDoctor}>
                <SelectTrigger><SelectValue placeholder="Choisir un médecin" /></SelectTrigger>
                <SelectContent>{doctors.map((d) => <SelectItem key={d.id} value={String(d.id)}>Dr. {d.first_name} {d.last_name} - {d.doctor?.specialization}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={formDate} onChange={(e) => { setFormDate(e.target.value); setFormSlot(''); }} />
            </div>
            {slots.length > 0 && (
              <div className="space-y-2">
                <Label>Créneau</Label>
                <Select value={formSlot} onValueChange={setFormSlot}>
                  <SelectTrigger><SelectValue placeholder="Choisir un créneau" /></SelectTrigger>
                  <SelectContent>{slots.map((s) => <SelectItem key={s.start_time} value={`${s.start_time}-${s.end_time}`}>{s.start_time} - {s.end_time}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={formType} onValueChange={setFormType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="consultation">Consultation</SelectItem>
                  <SelectItem value="follow_up">Suivi</SelectItem>
                  <SelectItem value="emergency">Urgence</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Motif</Label>
              <Textarea value={formReason} onChange={(e) => setFormReason(e.target.value)} placeholder="Motif de la consultation..." />
            </div>
            <Button className="w-full" onClick={handleCreate}>Créer le rendez-vous</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AppointmentsPage;
