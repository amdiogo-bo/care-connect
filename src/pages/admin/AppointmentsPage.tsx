import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { mockAppointments, mockDoctors } from '@/data/mockData';

const statusLabels: Record<string, string> = { scheduled: 'Planifié', confirmed: 'Confirmé', in_progress: 'En cours', completed: 'Terminé', cancelled: 'Annulé' };
const statusColors: Record<string, string> = { scheduled: 'bg-warning/20 text-warning', confirmed: 'bg-primary/20 text-primary', in_progress: 'bg-accent/20 text-accent', completed: 'bg-accent/20 text-accent', cancelled: 'bg-destructive/20 text-destructive' };

const AdminAppointmentsPage = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = useMemo(() => {
    return mockAppointments
      .filter((a) => {
        const q = `${a.patient?.first_name} ${a.patient?.last_name} ${a.doctor?.first_name} ${a.doctor?.last_name}`.toLowerCase();
        return q.includes(search.toLowerCase()) && (statusFilter === 'all' || a.status === statusFilter);
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [search, statusFilter]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Tous les rendez-vous</h1>
      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Rechercher..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Statut" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            {Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Médecin</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Heure</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.patient?.first_name} {a.patient?.last_name}</TableCell>
                  <TableCell>Dr. {a.doctor?.first_name} {a.doctor?.last_name}</TableCell>
                  <TableCell>{new Date(a.date).toLocaleDateString('fr-FR')}</TableCell>
                  <TableCell>{a.start_time} - {a.end_time}</TableCell>
                  <TableCell className="capitalize">{a.type}</TableCell>
                  <TableCell><Badge className={statusColors[a.status]}>{statusLabels[a.status]}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAppointmentsPage;
