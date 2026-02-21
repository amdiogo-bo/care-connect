import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { doctorsApi, Doctor } from '@/api/doctors';
import { appointmentsApi, TimeSlot } from '@/api/appointments';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Stethoscope, Loader2, CheckCircle2, ArrowLeft, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const STEPS = ['Médecin', 'Date', 'Créneau', 'Confirmation'];

const BookAppointment = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const [step, setStep] = useState(0);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [type, setType] = useState('consultation');
  const [reason, setReason] = useState('');
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Load doctors
  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await doctorsApi.list();
        setDoctors(res.data);
        // Pre-select if passed via state
        const preselectedId = (location.state as { doctorId?: number })?.doctorId;
        if (preselectedId) {
          const doc = res.data.find((d) => d.id === preselectedId);
          if (doc) {
            setSelectedDoctor(doc);
            setStep(1);
          }
        }
      } catch {
        setDoctors([]);
      } finally {
        setLoadingDoctors(false);
      }
    };
    fetch();
  }, [location.state]);

  // Load slots when date changes
  useEffect(() => {
    if (!selectedDoctor || !selectedDate) return;
    const fetch = async () => {
      setLoadingSlots(true);
      setSelectedSlot(null);
      try {
        const res = await appointmentsApi.availableSlots(
          selectedDoctor.id,
          format(selectedDate, 'yyyy-MM-dd')
        );
        setSlots(res.data.available_slots || []);
      } catch {
        setSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };
    fetch();
  }, [selectedDoctor, selectedDate]);

  const handleSubmit = async () => {
    if (!selectedDoctor || !selectedDate || !selectedSlot || !user) return;
    setSubmitting(true);
    try {
      await appointmentsApi.create({
        patient_id: user.id,
        doctor_id: selectedDoctor.id,
        date: format(selectedDate, 'yyyy-MM-dd'),
        start_time: selectedSlot.start_time,
        end_time: selectedSlot.end_time,
        type,
        reason: reason.trim() || undefined,
      });
      setSuccess(true);
      toast({ title: 'Rendez-vous confirmé !', description: 'Votre rendez-vous a bien été enregistré.' });
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erreur lors de la réservation';
      toast({ title: 'Erreur', description: message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-success/10">
          <CheckCircle2 className="h-10 w-10 text-success" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Rendez-vous confirmé !</h2>
        <p className="mt-2 text-muted-foreground">
          Dr. {selectedDoctor?.first_name} {selectedDoctor?.last_name} — {selectedDate && format(selectedDate, 'd MMMM yyyy', { locale: fr })} à {selectedSlot?.start_time}
        </p>
        <Button className="mt-6" onClick={() => navigate('/patient/appointments')}>
          Voir mes rendez-vous
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Prendre un rendez-vous</h1>
        <p className="text-muted-foreground">Suivez les étapes pour réserver</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors',
                i <= step ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
              )}
            >
              {i + 1}
            </div>
            <span className={cn('hidden text-sm sm:inline', i <= step ? 'font-medium text-foreground' : 'text-muted-foreground')}>
              {s}
            </span>
            {i < STEPS.length - 1 && <div className={cn('h-px w-6 sm:w-10', i < step ? 'bg-primary' : 'bg-border')} />}
          </div>
        ))}
      </div>

      {/* Step 0: Choose doctor */}
      {step === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Choisir un médecin</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingDoctors ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : (
              <div className="space-y-3">
                {doctors.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => { setSelectedDoctor(doc); setStep(1); }}
                    className={cn(
                      'flex w-full items-center gap-4 rounded-lg border p-4 text-left transition-colors hover:bg-secondary',
                      selectedDoctor?.id === doc.id && 'border-primary bg-primary/5'
                    )}
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <Stethoscope className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Dr. {doc.first_name} {doc.last_name}</p>
                      <Badge variant="secondary" className="mt-1">{doc.doctor?.specialization || 'Généraliste'}</Badge>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 1: Choose date */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Choisir une date</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => { setSelectedDate(date); if (date) setStep(2); }}
              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
              className="p-3 pointer-events-auto"
            />
          </CardContent>
        </Card>
      )}

      {/* Step 2: Choose slot */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>
              Créneaux disponibles — {selectedDate && format(selectedDate, 'd MMMM yyyy', { locale: fr })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingSlots ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : slots.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">Aucun créneau disponible pour cette date</p>
            ) : (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {slots.map((slot) => (
                  <Button
                    key={slot.start_time}
                    variant={selectedSlot?.start_time === slot.start_time ? 'default' : 'outline'}
                    disabled={!slot.available}
                    onClick={() => { setSelectedSlot(slot); setStep(3); }}
                    className="text-sm"
                  >
                    {slot.start_time}
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 3: Confirm */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Confirmer le rendez-vous</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-secondary p-4 space-y-2">
              <p className="text-sm"><span className="text-muted-foreground">Médecin :</span> <span className="font-medium text-foreground">Dr. {selectedDoctor?.first_name} {selectedDoctor?.last_name}</span></p>
              <p className="text-sm"><span className="text-muted-foreground">Spécialité :</span> <span className="font-medium text-foreground">{selectedDoctor?.doctor?.specialization}</span></p>
              <p className="text-sm"><span className="text-muted-foreground">Date :</span> <span className="font-medium text-foreground">{selectedDate && format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr })}</span></p>
              <p className="text-sm"><span className="text-muted-foreground">Heure :</span> <span className="font-medium text-foreground">{selectedSlot?.start_time} — {selectedSlot?.end_time}</span></p>
            </div>

            <div className="space-y-2">
              <Label>Type de consultation</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="consultation">Consultation</SelectItem>
                  <SelectItem value="follow_up">Suivi</SelectItem>
                  <SelectItem value="emergency">Urgence</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Motif de la visite (optionnel)</Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Décrivez brièvement le motif..."
                maxLength={500}
              />
            </div>

            <Button className="w-full" onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmer le rendez-vous
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      {step > 0 && (
        <div className="flex justify-between">
          <Button variant="ghost" onClick={() => setStep(step - 1)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Retour
          </Button>
          {step < 3 && (
            <Button
              variant="ghost"
              disabled={
                (step === 1 && !selectedDate) ||
                (step === 2 && !selectedSlot)
              }
              onClick={() => setStep(step + 1)}
            >
              Suivant <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default BookAppointment;
