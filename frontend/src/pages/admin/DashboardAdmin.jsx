import {
  HomeIcon,
  UsersIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  BuildingStorefrontIcon,
} from '@heroicons/react/24/outline';
import DashboardLayout from '../../components/layout/DashboardLayout';

const NAV_ITEMS = [
  { to: '/admin', label: 'Inicio', icon: HomeIcon, end: true },
  { to: '/admin/usuarios', label: 'Usuarios', icon: UsersIcon },
  { to: '/admin/habitaciones', label: 'Habitaciones', icon: BuildingStorefrontIcon },
  { to: '/admin/reportes/ingresos', label: 'Reportes', icon: ChartBarIcon },
  { to: '/admin/parametros', label: 'Parámetros', icon: Cog6ToothIcon },
];

export default function DashboardAdmin() {
  return (
    <DashboardLayout
      navItems={NAV_ITEMS}
      headerTitle="Hotel Bonaventura"
      roleBadge={{ label: 'Administrador', className: 'text-blue-700 bg-blue-50 border-blue-200' }}
      sidebarWidth="w-60"
    />
  );
}
