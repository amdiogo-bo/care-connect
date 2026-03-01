import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doctorsApi } from '@/api/doctors';
import { Doctor } from '@/api/doctors';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Stethoscope, Loader2, MapPin } from 'lucide-react';

const DoctorsList = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetch = async () => {
      try {
        const response = await doctorsApi.list();
        setDoctors(response);
      } catch (error) {
        console.error('Erreur lors du chargement des docteurs:', error);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const filtered = doctors.filter((d) => {
    const q = search.toLowerCase();
    return d.first_name.toLowerCase().includes(q) || d.last_name.toLowerCase().includes(q) || d.doctor?.specialization?.toLowerCase().includes(q);
  });

  const specializations = [...new Set(doctors.map((d) => d.doctor?.specialization).filter(Boolean))];

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Nos médecins</h1>
        <p className="text-muted-foreground">Trouvez le spécialiste qui vous convient</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Rechercher par nom ou spécialité..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" maxLength={100} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant={search === '' ? 'default' : 'outline'} size="sm" onClick={() => setSearch('')}>Tous</Button>
          {specializations.map((spec) => (
            <Button key={spec} variant={search === spec ? 'default' : 'outline'} size="sm" onClick={() => setSearch(spec || '')}>{spec}</Button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground"><Stethoscope className="mx-auto mb-3 h-10 w-10 opacity-40" /><p>Aucun médecin trouvé</p></div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((doctor) => (
            <Card key={doctor.id} className="stat-card-shadow transition-all hover:stat-card-shadow-hover hover:-translate-y-0.5">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Stethoscope className="h-7 w-7 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground">Dr. {doctor.first_name} {doctor.last_name}</h3>
                    <Badge variant="secondary" className="mt-1">{doctor.doctor?.specialization || 'Généraliste'}</Badge>
                    {doctor.doctor?.office_number && (
                      <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" />Bureau {doctor.doctor.office_number}</p>
                    )}
                    {doctor.doctor?.consultation_fee && (
                      <p className="mt-1 text-xs font-medium text-foreground">{doctor.doctor.consultation_fee.toLocaleString()} FCFA</p>
                    )}
                  </div>
                </div>
                <Button className="mt-4 w-full" onClick={() => navigate('/patient/book', { state: { doctorId: doctor.id } })}>Prendre rendez-vous</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default DoctorsList;
