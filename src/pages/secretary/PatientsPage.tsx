import { useState, useMemo } from 'react';
import { Search, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { mockAppointments, mockUsers } from '@/data/mockData';

const SecretaryPatientsPage = () => {
  const [search, setSearch] = useState('');

  const patients = useMemo(() => {
    const ids = new Set(mockAppointments.map((a) => a.patient_id));
    return Array.from(ids).map((pid) => {
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
  }, []);

  const filtered = patients.filter((p) =>
    `${p.first_name} ${p.last_name} ${p.email}`.toLowerCase().includes(search.toLowerCase())
  );

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
