'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { Icon } from '../ui/Icon';
import { Badge } from '../ui/Badge';

export default function AdminSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const links = [
    { href: '/admin/usuarios', label: 'Gestión Usuarios', icon: 'group' },
    { href: '/admin/catalogo-academico', label: 'Catálogo Académico', icon: 'school' },
    { href: '/admin/reportes', label: 'Reportes y Métricas', icon: 'analytics' },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-surface-container-low z-50 flex flex-col pt-space-lg pb-space-lg shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      {/* Brand Header */}
      <div className="px-space-md mb-space-md flex items-center gap-space-sm">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <Icon className="text-on-primary text-[20px]">auto_stories</Icon>
        </div>
        <div className="min-w-0">
          <span className="block font-label-md text-label-md font-bold text-on-surface leading-none truncate">
            Tutorías Pro
          </span>
          <span className="block font-label-md text-[11px] text-on-surface-variant leading-tight mt-1 truncate">
            Administración
          </span>
        </div>
      </div>

      {/* Role & Profile Card */}
      <div className="px-space-md mb-space-md">
        <div className="p-space-sm rounded-xl bg-surface-container-lowest shadow-xs space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <Badge variant="high">
              <Icon className="text-[14px]">shield_person</Icon>
              <span>Administrador</span>
            </Badge>
          </div>
          <div className="pt-0.5">
            <p className="font-label-md text-label-md font-semibold text-on-surface truncate">
              {user?.nombre || 'Administrador'}
            </p>
            <p className="text-[11px] text-outline truncate">{user?.email}</p>
          </div>
        </div>
      </div>

      <div className="px-space-md mb-space-xs">
        <span className="font-label-md text-[11px] font-semibold text-outline uppercase tracking-wider">
          Consola del Sistema
        </span>
      </div>

      <nav className="flex-1 px-space-xs space-y-space-xs overflow-y-auto">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive ? 'page' : undefined}
              className={`flex items-center px-space-md py-space-sm rounded-lg font-label-md text-label-md transition-all ${
                isActive
                  ? 'bg-primary-container text-on-primary font-semibold shadow-xs'
                  : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
              }`}
            >
              <Icon className="mr-space-sm text-[20px]">{link.icon}</Icon>
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-space-md pt-space-md">
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
