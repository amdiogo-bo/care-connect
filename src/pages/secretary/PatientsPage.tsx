import { useState, useEffect } from 'react';
import { USE_MOCK } from '@/lib/useMock';
import { Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { mockAppointments, mockUsers } from '@/data/mockData';
import { secretaryApi } from '@/api/secretary';

interface PatientSummary {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  total: number;
  upcoming: number;
}

const SecretaryPatientsPage = () => {
  const [search, setSearch] = useState('');
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        if (USE_MOCK) {
          const ids = new Set(mockAppointments.map((a) => a.patient_id));
          const result = Array.from(ids).map((pid) => {
            const u = mockUsers.find((usr) => usr.id === pid);
            const apts = mockAppointments.filter((a) => a.patient_id === pid);
            return {
              id: pid,
              first_name: u?.first_name || apts[0]?.patient?.first_name || '',
              last_name: u?.last_name || apts[0]?.patient?.last_name || '',
              email: u?.email || apts[0]?.patient?.email || '',
              phone: u?.phone || '',
              total: apts.length,
              upcoming: apts.filter((a) => a.date >= new Date().toISOString().split('T')[0] && a.status !== 'cancelled').length,
            };
          });
          setPatients(result);
        } else {
          const data = await secretaryApi.patients();
          setPatients(Array.isArray(data) ? data : data?.patients || []);
        }
      } catch (error) {
        console.error('Erreur chargement patients:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = patients.filter((p) =>
    `${p.first_name} ${p.last_name} ${p.email}`.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Patients</h1>
        <Badge variant="secondary">{patients.length} patient{patients.length !== 1 ? 's' : ''}</Badge>
      </div>
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Rechercher..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((p) => (
          <Card key={p.id}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {p.first_name[0]}{p.last_name[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{p.first_name} {p.last_name}</p>
                  <p className="truncate text-xs text-muted-foreground">{p.email}</p>
                </div>
              </div>
              <div className="mt-3 flex gap-3 text-xs text-muted-foreground">
                <span>{p.total} RDV total</span>
                <span>{p.upcoming} à venir</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SecretaryPatientsPage;
