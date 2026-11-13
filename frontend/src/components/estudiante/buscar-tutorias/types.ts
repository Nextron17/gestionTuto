export interface ProfesorUser {
  _id: string;
  nombre: string;
  email: string;
  escuela?: string;
  carrera?: string;
  materias?: string[];
}

export interface HorarioItem {
  _id: string;
  dia: string;
  horaInicio: string;
  horaFin: string;
  nombreProfesor?: string;
  materia?: string;
  semestre?: number;
  libre?: boolean;
  tieneTutoriasAceptadas?: boolean;
  profesor: ProfesorUser;
}

export const ORDEN_DIAS: Record<string, number> = {
  Lunes: 1,
  Martes: 2,
  Miércoles: 3,
  Jueves: 4,
  Viernes: 5,
  Sábado: 6,
};

export const DIAS_FILTRO = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export interface ProfesorConHorarios extends ProfesorUser {
  horarios: HorarioItem[];
}

export interface TutoriaGrupal {
  _id: string;
  materia: string;
  tema?: string;
  descripcion: string;
  hora?: string;
  modalidad?: string;
  cupoMaximo?: number;
  lugar?: string;
  enlaceReunion?: string;
  enlaceGrabacion?: string;
  esInscrito?: boolean;
  comentarioProfesor?: string;
  profesor?: ProfesorUser;
  estudiante?: { _id: string; nombre: string };
  participantes?: { estudiante: { _id: string; nombre: string } }[];
}

export interface RecursoRecomendado {
  _id: string;
  titulo: string;
  materia: string;
  tema?: string;
  tipo?: 'video' | 'guia' | 'documento' | 'enlace';
  link: string;
}

export interface TemaCatalogo {
  _id: string;
  nombre: string;
  materia: string;
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
}

export function notificarCambioGrupal(tutoriaId: string): void {
  if (typeof window === 'undefined') return;
  const payload = { solicitudId: tutoriaId, estado: 'aceptada', timestamp: Date.now() };
  try {
    if ('BroadcastChannel' in window) {
      const channel = new BroadcastChannel('gestiontuto_solicitudes_sync');
      channel.postMessage(payload);
      channel.close();
    }
    window.localStorage.setItem('gestiontuto_last_tutoria_update', JSON.stringify(payload));
  } catch {
  }
}

