import { HomeIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';
import DashboardLayout from '../../components/layout/DashboardLayout';

const NAV_ITEMS = [
  { to: '/recepcion', label: 'Habitaciones', icon: HomeIcon, end: true },
  { to: '/recepcion/reservas', label: 'Reservas', icon: ClipboardDocumentListIcon },
];

export default function DashboardRecepcion() {
  return (
    <DashboardLayout
      navItems={NAV_ITEMS}
      headerTitle="Hotel Bonaventura — Recepción"
      roleBadge={{ label: 'Recepcionista', className: 'text-green-700 bg-green-50 border-green-200' }}
      sidebarWidth="w-56"
    />
  );
}
