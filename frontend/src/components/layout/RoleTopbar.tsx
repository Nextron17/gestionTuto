'use client';

import { useAuth } from '../../context/AuthContext';
import { Icon } from '../ui/Icon';
import { Badge } from '../ui/Badge';

interface RoleTopbarProps {
  roleLabel: string;
  roleIcon: string;
  roleVariant: 'primary' | 'tertiary' | 'high' | 'secondary';
  subtitle: string;
}

export function RoleTopbar({
  roleLabel,
  roleIcon,
  roleVariant,
  subtitle,
}: RoleTopbarProps) {
  const { user } = useAuth();

  return (
    <header className="fixed top-0 left-64 right-0 h-16 bg-surface/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 flex items-center justify-between px-space-lg gap-4">
      <div className="flex items-center gap-space-md min-w-0">
        <span className="font-label-md text-label-md font-semibold text-on-surface truncate">
          {subtitle}
        </span>
        <div className="hidden sm:flex items-center bg-surface-container-high rounded-full px-space-sm py-1">
          <Icon className="text-primary text-[15px] mr-1">verified</Icon>
          <span className="font-label-md text-[12px] text-on-surface font-medium">
            Periodo Académico Activo
          </span>
        </div>
      </div>

      <div className="flex items-center gap-space-md">
        <Badge variant={roleVariant} className="hidden md:inline-flex">
          <Icon className="text-[15px]">{roleIcon}</Icon>
          <span>{roleLabel}</span>
        </Badge>

        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex flex-col text-right">
            <span className="font-label-md text-label-md text-on-surface font-semibold leading-tight">
              {user?.nombre || roleLabel}
            </span>
            <span className="text-[11px] text-outline leading-tight">
              {user?.escuela || user?.email || 'Tutorías Pro'}
            </span>
          </div>
          <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-on-primary shadow-xs">
            <Icon className="text-[18px]">person</Icon>
          </div>
        </div>
      </div>
    </header>
  );
}

