'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';

export default function ProfesorSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const links = [
    { href: '/profesor/solicitudes', label: 'Solicitudes' },
    { href: '/profesor/horarios', label: 'Mis Horarios' },
    { href: '/profesor/mis-tutorias', label: 'Mis Tutorías' },
    { href: '/profesor/recursos', label: 'Recursos' },
  ];

  return (
    <aside className="w-64 bg-white border-r min-h-screen p-6 flex flex-col justify-between">
      <div>
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-800">Gestión Tutorías</h2>
          <p className="text-xs text-blue-600 font-semibold mt-1">Panel de Profesor</p>
        </div>

        <div className="mb-6 p-3 bg-gray-50 rounded-lg border">
          <p className="text-sm font-medium text-gray-800">{user?.nombre}</p>
          <p className="text-xs text-gray-500 truncate">{user?.email}</p>
        </div>

        <nav className="space-y-1">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <button
        onClick={logout}
        className="w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition"
      >
        Cerrar Sesión
      </button>
    </aside>
  );
}