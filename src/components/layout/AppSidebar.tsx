import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Stethoscope,
  ClipboardList,
  Clock,
  BarChart3,
  Settings,
  CalendarPlus,
  UserCog,
  Bell,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
}

const roleNavItems: Record<string, NavItem[]> = {
  patient: [
    { label: 'Tableau de bord', path: '/patient', icon: LayoutDashboard },
    { label: 'Médecins', path: '/patient/doctors', icon: Stethoscope },
    { label: 'Prendre RDV', path: '/patient/book', icon: CalendarPlus },
    { label: 'Mes rendez-vous', path: '/patient/appointments', icon: Calendar },
  ],
  doctor: [
    { label: 'Tableau de bord', path: '/doctor', icon: LayoutDashboard },
    { label: 'Planning', path: '/doctor/schedule', icon: Calendar },
    { label: 'Mes patients', path: '/doctor/patients', icon: Users },
    { label: 'Disponibilités', path: '/doctor/availabilities', icon: Clock },
    { label: 'Statistiques', path: '/doctor/stats', icon: BarChart3 },
  ],
  secretary: [
    { label: 'Tableau de bord', path: '/secretary', icon: LayoutDashboard },
    { label: 'Rendez-vous', path: '/secretary/appointments', icon: ClipboardList },
    { label: 'Planning', path: '/secretary/schedule', icon: Calendar },
    { label: 'Patients', path: '/secretary/patients', icon: Users },
  ],
  admin: [
    { label: 'Tableau de bord', path: '/admin', icon: LayoutDashboard },
    { label: 'Utilisateurs', path: '/admin/users', icon: UserCog },
    { label: 'Rendez-vous', path: '/admin/appointments', icon: ClipboardList },
    { label: 'Statistiques', path: '/admin/stats', icon: BarChart3 },
  ],
};

const AppSidebar = () => {
  const { user } = useAuth();
  const location = useLocation();
  const items = roleNavItems[user?.role || 'patient'] || [];

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-sidebar text-sidebar-foreground">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg medical-gradient">
          <Stethoscope className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-base font-bold text-sidebar-foreground">MediCal</h1>
          <p className="text-[11px] text-sidebar-muted">Gestion médicale</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="mt-4 flex-1 space-y-1 px-3">
        {items.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="space-y-1 border-t border-sidebar-border p-3">
        <NavLink
          to="/notifications"
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
              isActive ? 'bg-sidebar-primary text-sidebar-primary-foreground' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
            )
          }
        >
          <Bell className="h-5 w-5" />
          Notifications
        </NavLink>
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
              isActive ? 'bg-sidebar-primary text-sidebar-primary-foreground' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
            )
          }
        >
          <User className="h-5 w-5" />
          Mon profil
        </NavLink>
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
              isActive ? 'bg-sidebar-primary text-sidebar-primary-foreground' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
            )
          }
        >
          <Settings className="h-5 w-5" />
          Paramètres
        </NavLink>
      </div>
    </aside>
  );
};

export default AppSidebar;
