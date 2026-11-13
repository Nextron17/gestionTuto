export interface Usuario {
  _id: string;
  nombre: string;
  email: string;
  rol: 'estudiante' | 'profesor' | 'admin';
  escuela?: string;
  carrera?: string;
  semestre?: number;
  materias?: string[];
}

export interface Escuela {
  _id: string;
  nombre: string;
  codigo: string;
}

export interface Carrera {
  _id: string;
  nombre: string;
  codigo: string;
  escuela?: { _id: string; nombre: string };
}

export interface Materia {
  _id: string;
  nombre: string;
  codigo: string;
  carrera?: { _id: string; nombre: string };
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
}
