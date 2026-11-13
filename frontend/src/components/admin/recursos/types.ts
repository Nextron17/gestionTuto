export interface ProfesorInfo {
  _id: string;
  nombre: string;
  email: string;
  escuela?: string;
  carrera?: string;
}

export interface RecursoItem {
  _id: string;
  titulo: string;
  escuela: string;
  materia: string;
  tema?: string;
  tipo?: 'video' | 'guia' | 'documento' | 'enlace';
  claseOrigen?: string;
  link: string;
  profesor?: ProfesorInfo;
  createdAt?: string;
  updatedAt?: string;
}

export interface EscuelaCatalogo {
  _id: string;
  nombre: string;
  codigo: string;
}

export function getInitials(name?: string): string {
  if (!name) return 'DOC';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
}

export function formatFecha(fecha?: string): string {
  if (!fecha) return 'Fecha desconocida';
  const date = new Date(fecha);
  if (Number.isNaN(date.getTime())) return 'Fecha desconocida';
  return date.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

