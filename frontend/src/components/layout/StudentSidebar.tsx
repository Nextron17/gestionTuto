'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { Icon } from '../ui/Icon';

interface StudentSidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

export function StudentSidebar({ mobileOpen = false, onClose }: StudentSidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navItems = [
    { label: 'Buscar Apoyo', path: '/estudiante/buscar-tutorias', icon: 'search' },
    { label: 'Mis Solicitudes', path: '/estudiante/mis-solicitudes', icon: 'pending_actions' },
    { label: 'Mis Tutorías', path: '/estudiante/mis-tutorias', icon: 'calendar_month' },
    { label: 'Recursos', path: '/estudiante/recursos', icon: 'library_books' },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-on-background/40 backdrop-blur-[2px] z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-full w-64 max-w-[82vw] bg-surface-container-low z-50 flex flex-col pt-space-lg pb-space-lg shadow-xl lg:shadow-[0_1px_8px_rgba(0,0,0,0.04)] transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        {/* Brand Header */}
        <div className="px-space-md mb-space-lg flex items-center justify-between gap-space-sm">
          <div className="flex items-center gap-space-sm min-w-0">
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

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar menú"
              className="lg:hidden w-8 h-8 rounded-lg hover:bg-surface-container flex items-center justify-center text-outline hover:text-on-surface transition-colors cursor-pointer shrink-0"
            >
              <Icon className="text-[20px]">close</Icon>
            </button>
          )}
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
                onClick={onClose}
                aria-current={isActive ? 'page' : undefined}
                className={`flex items-center px-space-md py-space-sm rounded-lg font-label-md text-label-md transition-all ${
                  isActive
                    ? 'bg-primary-container text-on-primary font-semibold shadow-xs'
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                }`}
              >
                <Icon className="mr-space-sm text-[20px]">{item.icon}</Icon>
                <span className="truncate">{item.label}</span>
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
    </>
  );
}
