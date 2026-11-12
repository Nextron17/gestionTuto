'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { Icon } from '../ui/Icon';

export function StudentSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navItems = [
    { label: 'Buscar Apoyo', path: '/estudiante/buscar-tutorias', icon: 'search' },
    { label: 'Mis Solicitudes', path: '/estudiante/mis-solicitudes', icon: 'pending_actions' },
    { label: 'Mis Tutorías', path: '/estudiante/mis-tutorias', icon: 'calendar_month' },
    { label: 'Recursos', path: '/estudiante/recursos', icon: 'library_books' },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-surface-container-low z-50 flex flex-col pt-space-lg pb-space-lg shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      {/* Brand Header */}
      <div className="px-space-md mb-space-lg flex items-center gap-space-sm">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <Icon className="text-on-primary text-[20px]">auto_stories</Icon>
        </div>
        <div className="min-w-0">
          <span className="block font-label-md text-label-md font-bold text-on-surface leading-none truncate">
            Tutorías Pro
          </span>
          <span className="block font-label-md text-[11px] text-on-surface-variant leading-tight mt-1 truncate">
            Portal Académico
          </span>
        </div>
      </div>

      {/* Section Label */}
      <div className="px-space-md mb-space-sm">
        <span className="font-label-md text-[11px] font-semibold text-outline uppercase tracking-wider">
          Módulo Estudiante
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-space-xs space-y-space-xs overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              aria-current={isActive ? 'page' : undefined}
              className={`flex items-center px-space-md py-space-sm rounded-lg font-label-md text-label-md transition-all ${
                isActive
                  ? 'bg-primary-container text-on-primary font-semibold shadow-xs'
                  : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
              }`}
            >
              <Icon className="mr-space-sm text-[20px]">{item.icon}</Icon>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom User & Status Footer */}
      <div className="px-space-md pt-space-md space-y-space-sm">
        {user?.carrera && (
          <div className="p-space-sm rounded-lg bg-surface-container text-on-surface-variant font-label-md text-[12px] flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 min-w-0 truncate">
              <Icon className="text-[16px] text-primary shrink-0">school</Icon>
              <span className="truncate">{user.carrera}</span>
            </span>
            <span className="text-[11px] text-outline shrink-0">Activo</span>
          </div>
        )}

        <button
          type="button"
          onClick={logout}
          className="w-full flex items-center gap-space-sm px-space-md py-space-sm rounded-lg font-label-md text-label-md text-on-surface-variant hover:bg-error-container hover:text-error transition-all cursor-pointer group"
        >
          <Icon className="text-[20px] text-on-surface-variant group-hover:text-error transition-colors">
            logout
          </Icon>
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
}
