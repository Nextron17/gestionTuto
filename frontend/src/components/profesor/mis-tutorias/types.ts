export interface EstudianteInfo {
  _id: string;
  nombre: string;
  email: string;
}

export interface Tutoria {
  _id: string;
  materia: string;
  tema?: string;
  descripcion: string;
  hora?: string;
  fechaPropuesta?: string;
  createdAt?: string;
  modalidad?: 'virtual' | 'presencial';
  tipo?: string;
  lugar?: string;
  comentarioProfesor?: string;
  enlaceReunion?: string;
  enlaceGrabacion?: string;
  estado: string;
  recursos?: string[];
  estudiante?: EstudianteInfo;
  asistenciaEstudiante?: boolean | null;
  participantes?: { estudiante: EstudianteInfo; asistio?: boolean | null }[];
}

export function toInputDateValue(iso?: string): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

export function formatearFechaLegible(iso?: string): string {
  if (!iso) return 'Fecha por confirmar';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Fecha por confirmar';
  return date.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
}
