export interface Tutoria {
  _id: string;
  materia: string;
  tema?: string;
  descripcion: string;
  hora?: string;
  fechaPropuesta?: string;
  createdAt?: string;
  updatedAt?: string;
  modalidad?: string;
  tipo?: string;
  cupoMaximo?: number;
  lugar?: string;
  comentarioProfesor?: string;
  enlaceReunion?: string;
  enlaceGrabacion?: string;
  estado: string;
  esInscrito?: boolean;
  miAsistencia?: boolean | null;
  estudiante?: { _id: string; nombre: string };
  asistenciaEstudiante?: boolean | null;
  participantes?: { estudiante: { _id: string; nombre: string }; asistio?: boolean | null }[];
  profesor?: {
    nombre: string;
    email: string;
  };
  recursos?: string[];
}

export function formatearFechaTutoria(fechaIso?: string): string {
  if (!fechaIso) return 'Por confirmar';
  const d = new Date(fechaIso);
  if (Number.isNaN(d.getTime())) return 'Por confirmar';
  return d.toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function toInputDateValue(fechaIso?: string): string {
  if (!fechaIso) return '';
  const d = new Date(fechaIso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

