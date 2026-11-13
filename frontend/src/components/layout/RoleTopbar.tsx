'use client';

import { useAuth } from '../../context/AuthContext';
import { Icon } from '../ui/Icon';
import { Badge } from '../ui/Badge';

interface RoleTopbarProps {
  roleLabel: string;
  roleIcon: string;
  roleVariant: 'primary' | 'tertiary' | 'high' | 'secondary';
  subtitle: string;
  onOpenMenu?: () => void;
}

export function RoleTopbar({
  roleLabel,
  roleIcon,
  roleVariant,
  subtitle,
  onOpenMenu,
}: RoleTopbarProps) {
  const { user } = useAuth();

  return (
    <header className="fixed top-0 left-0 lg:left-64 right-0 h-16 bg-surface/85 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-30 flex items-center justify-between px-4 sm:px-space-lg gap-3">
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        {onOpenMenu && (
          <button
            type="button"
            onClick={onOpenMenu}
            aria-label="Abrir menú de navegación"
            className="lg:hidden w-10 h-10 rounded-lg bg-surface-container hover:bg-primary-fixed hover:text-primary flex items-center justify-center text-on-surface-variant shrink-0 cursor-pointer active:scale-95 transition-all"
          >
            <Icon className="text-[22px]">menu</Icon>
          </button>
        )}

        <span className="font-label-md text-xs sm:text-label-md font-semibold text-on-surface truncate">
          {subtitle}
        </span>

        <div className="hidden xl:flex items-center bg-surface-container-high rounded-full px-space-sm py-1 shrink-0">
          <Icon className="text-primary text-[15px] mr-1">verified</Icon>
          <span className="font-label-md text-[12px] text-on-surface font-medium">
            Periodo Académico Activo
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-space-md shrink-0">
        <Badge variant={roleVariant} className="hidden sm:inline-flex">
          <Icon className="text-[15px]">{roleIcon}</Icon>
          <span>{roleLabel}</span>
        </Badge>

        <div className="flex items-center gap-2.5">
          <div className="hidden md:flex flex-col text-right max-w-[180px]">
            <span className="font-label-md text-label-md text-on-surface font-semibold leading-tight truncate">
              {user?.nombre || roleLabel}
            </span>
            <span className="text-[11px] text-outline leading-tight truncate">
              {user?.escuela || user?.email || 'Tutorías Pro'}
            </span>
          </div>
          <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-on-primary shadow-xs shrink-0">
            <Icon className="text-[18px]">person</Icon>
          </div>
        </div>
      </div>
    </header>
  );
}
