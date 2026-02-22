import { useState } from 'react';
import { Search, Plus, Edit2, Trash2, UserCog } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { mockUsers, addUser, updateUser, deleteUser } from '@/data/mockData';

const roleLabels: Record<string, string> = { patient: 'Patient', doctor: 'Médecin', secretary: 'Secrétaire', admin: 'Admin' };
const roleColors: Record<string, string> = { patient: 'bg-primary/10 text-primary', doctor: 'bg-accent/10 text-accent', secretary: 'bg-warning/10 text-warning', admin: 'bg-destructive/10 text-destructive' };

const UsersPage = () => {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [, setRefresh] = useState(0);

  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', phone: '', role: 'patient', password: 'password' });

  const filtered = mockUsers.filter((u) => {
    const matchSearch = `${u.first_name} ${u.last_name} ${u.email}`.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const openCreate = () => {
    setForm({ first_name: '', last_name: '', email: '', phone: '', role: 'patient', password: 'password' });
    setEditId(null);
    setShowForm(true);
  };

  const openEdit = (id: number) => {
    const u = mockUsers.find((usr) => usr.id === id);
    if (u) {
      setForm({ first_name: u.first_name, last_name: u.last_name, email: u.email, phone: u.phone || '', role: u.role, password: '' });
      setEditId(id);
      setShowForm(true);
    }
  };

  const handleSave = () => {
    if (!form.first_name || !form.last_name || !form.email) {
      toast({ title: 'Erreur', description: 'Veuillez remplir les champs obligatoires.', variant: 'destructive' });
      return;
    }
    if (editId) {
      updateUser(editId, { first_name: form.first_name, last_name: form.last_name, email: form.email, phone: form.phone, role: form.role as any, ...(form.password ? { password: form.password } : {}) });
      toast({ title: 'Utilisateur mis à jour' });
    } else {
      addUser({ first_name: form.first_name, last_name: form.last_name, email: form.email, phone: form.phone, role: form.role as any, password: form.password || 'password' });
      toast({ title: 'Utilisateur créé' });
    }
    setShowForm(false);
    setRefresh((r) => r + 1);
  };

  const handleDelete = (id: number) => {
    deleteUser(id);
    setRefresh((r) => r + 1);
    toast({ title: 'Utilisateur supprimé' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-foreground">Gestion des utilisateurs</h1>
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" /> Nouvel utilisateur</Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Rechercher..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Rôle" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les rôles</SelectItem>
            {Object.entries(roleLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Téléphone</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.first_name} {u.last_name}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{u.phone || '—'}</TableCell>
                  <TableCell><Badge className={roleColors[u.role]}>{roleLabels[u.role]}</Badge></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(u.id)}><Edit2 className="h-4 w-4" /></Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Supprimer cet utilisateur ?</AlertDialogTitle>
                            <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(u.id)}>Supprimer</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? 'Modifier' : 'Créer'} un utilisateur</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>Prénom *</Label><Input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} /></div>
              <div className="space-y-2"><Label>Nom *</Label><Input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} /></div>
            </div>
            <div className="space-y-2"><Label>Email *</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div className="space-y-2"><Label>Téléphone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div className="space-y-2">
              <Label>Rôle</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(roleLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{editId ? 'Nouveau mot de passe (laisser vide pour garder)' : 'Mot de passe *'}</Label>
              <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            <Button className="w-full" onClick={handleSave}>{editId ? 'Mettre à jour' : 'Créer'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsersPage;
