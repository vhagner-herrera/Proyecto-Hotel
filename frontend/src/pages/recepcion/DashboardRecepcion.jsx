import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  HomeIcon,
  ClipboardDocumentListIcon,
  BuildingOffice2Icon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import { Toaster } from 'react-hot-toast';
import useAuthStore from '../../store/authStore';

const NAV_ITEMS = [
  { to: '/recepcion', label: 'Habitaciones', icon: HomeIcon, end: true },
  { to: '/recepcion/reservas', label: 'Reservas', icon: ClipboardDocumentListIcon },
];

export default function DashboardRecepcion() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <Toaster position="top-right" />

      {/* Sidebar */}
      <aside className="w-56 bg-[#1e3a5f] flex flex-col shadow-xl flex-shrink-0">
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#c9a84c] rounded-lg flex items-center justify-center flex-shrink-0">
              <BuildingOffice2Icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-tight">Hotel</p>
              <p className="text-[#c9a84c] font-bold text-sm leading-tight">Bonaventura</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-white/15 text-white'
                    : 'text-white/65 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="mb-3 px-1">
            <p className="text-white text-sm font-medium truncate">{user?.nombre ?? 'Recepcionista'}</p>
            <p className="text-white/50 text-xs truncate">{user?.email ?? ''}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm
              text-white/65 hover:bg-white/10 hover:text-white transition-all"
          >
            <ArrowRightOnRectangleIcon className="w-4 h-4" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-6 py-3.5 flex items-center justify-between flex-shrink-0">
          <h1 className="text-base font-semibold text-gray-800">Hotel Bonaventura — Recepción</h1>
          <span className="text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-3 py-1 rounded-full">
            Recepcionista
          </span>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
