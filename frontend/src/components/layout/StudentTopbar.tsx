'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { Icon } from '../ui/Icon';
import { SearchInput } from '../ui/SearchInput';
import { Badge } from '../ui/Badge';

export function StudentTopbar() {
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
    <header className="fixed top-0 left-64 right-0 h-16 bg-surface/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 flex items-center justify-between px-space-lg gap-4">
      <form onSubmit={handleSearch} className="flex-1 max-w-md">
        <SearchInput
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onClear={() => setQuery('')}
          shortcut="⌘K"
          placeholder="Buscar tutores por materia, facultad o tema..."
          aria-label="Buscar tutores por materia, facultad o tema"
        />
      </form>

      <div className="flex items-center gap-space-md">
        <Badge variant="primary" className="hidden md:inline-flex">
          <Icon className="text-[15px]">school</Icon>
          <span>Estudiante</span>
        </Badge>

        <button
          className="w-10 h-10 rounded-full bg-surface-container hover:bg-primary-fixed hover:text-primary transition-all flex items-center justify-center text-on-surface-variant active:scale-95 relative cursor-pointer"
          type="button"
          aria-label="Notificaciones"
        >
          <Icon className="text-[20px]">notifications</Icon>
          <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-primary" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex flex-col text-right">
            <span className="font-label-md text-label-md text-on-surface font-semibold leading-tight">
              {user?.nombre || 'Estudiante'}
            </span>
            <span className="text-[11px] text-outline leading-tight">
              {user?.escuela || user?.carrera || 'Portal Académico'}
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
