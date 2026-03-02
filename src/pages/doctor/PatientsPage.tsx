import { useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Search, User, Calendar, Mail, Phone } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { mockAppointments, mockUsers } from '@/data/mockData';

const PatientsPage = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);

  const patients = useMemo(() => {
    const ids = new Set(mockAppointments.filter((a) => a.doctor_id === user?.id).map((a) => a.patient_id));
    return Array.from(ids).map((pid) => {
      const pUser = mockUsers.find((u) => u.id === pid);
      const apts = mockAppointments.filter((a) => a.patient_id === pid && a.doctor_id === user?.id);
      return {
        id: pid,
        first_name: pUser?.first_name || apts[0]?.patient?.first_name || 'Patient',
        last_name: pUser?.last_name || apts[0]?.patient?.last_name || '',
        email: pUser?.email || apts[0]?.patient?.email || '',
        phone: pUser?.phone || '',
        total_visits: apts.length,
        completed: apts.filter((a) => a.status === 'completed').length,
        last_visit: apts.sort((a, b) => b.date.localeCompare(a.date))[0]?.date,
        appointments: apts.sort((a, b) => b.date.localeCompare(a.date)),
      };
    });
  }, [user?.id]);

  const filtered = patients.filter((p) =>
    `${p.first_name} ${p.last_name}`.toLowerCase().includes(search.toLowerCase())
  );

  const selected = selectedPatientId ? patients.find((p) => p.id === selectedPatientId) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Mes patients</h1>
        <Badge variant="secondary">{patients.length} patient{patients.length !== 1 ? 's' : ''}</Badge>
      </div>
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Rechercher un patient..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((p) => (
          <Card key={p.id} className="cursor-pointer transition-all hover:shadow-md" onClick={() => setSelectedPatientId(p.id)}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {p.first_name[0]}{p.last_name[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">{p.first_name} {p.last_name}</p>
                  <p className="truncate text-xs text-muted-foreground">{p.email}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                <span>{p.total_visits} visite{p.total_visits !== 1 ? 's' : ''}</span>
                {p.last_visit && <span>Dernière : {new Date(p.last_visit).toLocaleDateString('fr-FR')}</span>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!selected} onOpenChange={() => setSelectedPatientId(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Fiche patient</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                  {selected.first_name[0]}{selected.last_name[0]}
                </div>
                <div>
                  <p className="text-lg font-semibold">{selected.first_name} {selected.last_name}</p>
                  <div className="flex gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{selected.email}</span>
                    {selected.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{selected.phone}</span>}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-xl font-bold text-primary">{selected.total_visits}</p>
                  <p className="text-xs text-muted-foreground">Total visites</p>
                </div>
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-xl font-bold text-accent">{selected.completed}</p>
                  <p className="text-xs text-muted-foreground">Terminées</p>
                </div>
              </div>
              <div>
                <h3 className="mb-2 text-sm font-semibold">Historique des rendez-vous</h3>
                <div className="max-h-48 space-y-2 overflow-y-auto">
                  {selected.appointments.map((a) => (
                    <div key={a.id} className="flex items-center justify-between rounded border p-2 text-sm">
                      <div>
                        <span className="font-medium">{new Date(a.date).toLocaleDateString('fr-FR')}</span>
                        <span className="ml-2 text-muted-foreground">{a.start_time}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">{a.status}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PatientsPage;
