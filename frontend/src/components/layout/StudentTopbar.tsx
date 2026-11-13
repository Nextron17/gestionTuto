'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { Icon } from '../ui/Icon';
import { SearchInput } from '../ui/SearchInput';
import { Badge } from '../ui/Badge';

interface StudentTopbarProps {
  onOpenMenu?: () => void;
}

export function StudentTopbar({ onOpenMenu }: StudentTopbarProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [query, setQuery] = useState('');

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    router.push(
      trimmed
        ? `/estudiante/buscar-tutorias?q=${encodeURIComponent(trimmed)}`
        : '/estudiante/buscar-tutorias'
    );
  };

  return (
    <header className="fixed top-0 left-0 lg:left-64 right-0 h-16 bg-surface/85 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-30 flex items-center justify-between px-4 sm:px-space-lg gap-3">
      <div className="flex items-center gap-2.5 flex-1 max-w-md min-w-0">
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

        <form onSubmit={handleSearch} className="flex-1 min-w-0">
          <SearchInput
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onClear={() => setQuery('')}
            shortcut="⌘K"
            placeholder="Buscar tutores o materias..."
            aria-label="Buscar tutores por materia, facultad o tema"
          />
        </form>
      </div>

      <div className="flex items-center gap-2 sm:gap-space-md shrink-0">
        <Badge variant="primary" className="hidden md:inline-flex">
          <Icon className="text-[15px]">school</Icon>
          <span>Estudiante</span>
        </Badge>

        <button
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-surface-container hover:bg-primary-fixed hover:text-primary transition-all flex items-center justify-center text-on-surface-variant active:scale-95 relative cursor-pointer shrink-0"
          type="button"
          aria-label="Notificaciones"
        >
          <Icon className="text-[20px]">notifications</Icon>
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex flex-col text-right max-w-[160px]">
            <span className="font-label-md text-label-md text-on-surface font-semibold leading-tight truncate">
              {user?.nombre || 'Estudiante'}
            </span>
            <span className="text-[11px] text-outline leading-tight truncate">
              {user?.escuela || user?.carrera || 'Portal Académico'}
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
