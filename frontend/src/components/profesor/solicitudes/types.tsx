import { Badge } from '../../../components/ui/Badge';
import { Icon } from '../../../components/ui/Icon';

export interface EstudianteInfo {
  _id: string;
  nombre: string;
  email: string;
  carrera?: string;
  semestre?: number;
}

export interface ParticipanteItem {
  estudiante: EstudianteInfo;
  asistio?: boolean | null;
}

export interface Solicitud {
  _id: string;
  materia: string;
  tema?: string;
  descripcion: string;
  hora?: string;
  fechaPropuesta?: string;
  createdAt?: string;
  modalidad?: 'presencial' | 'virtual';
  tipo?: 'individual' | 'grupal';
  cupoMaximo?: number;
  comentarioProfesor?: string;
  motivoCancelacion?: string;
  canceladaPor?: 'estudiante' | 'profesor';
  fechaCancelacion?: string;
  lugar?: string;
  enlaceReunion?: string;
  enlaceGrabacion?: string;
  estado: 'pendiente' | 'aceptada' | 'cancelada' | 'aplazada' | 'finalizada';
  recursos?: string[];
  estudiante?: EstudianteInfo;
  asistenciaEstudiante?: boolean | null;
  participantes?: ParticipanteItem[];
}

export type FiltroEstado = 'todos' | 'pendiente' | 'aceptada' | 'aplazada' | 'cancelada';

export function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
}

export function formatearFechaLegible(fechaISO?: string): string {
  if (!fechaISO) return 'Sin fecha definida';
  const fecha = new Date(fechaISO);
  if (Number.isNaN(fecha.getTime())) return 'Sin fecha definida';
  return fecha.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function toInputDateValue(fechaISO?: string): string {
  if (!fechaISO) return '';
  const fecha = new Date(fechaISO);
  if (Number.isNaN(fecha.getTime())) return '';
  return fecha.toISOString().slice(0, 10);
}

export function notificarCambioEstadoTutoria(solicitudId: string, nuevoEstado: string): void {
  if (typeof window === 'undefined') return;
  const payload = { solicitudId, estado: nuevoEstado, timestamp: Date.now() };
  try {
    if ('BroadcastChannel' in window) {
      const channel = new BroadcastChannel('gestiontuto_solicitudes_sync');
      channel.postMessage(payload);
      channel.close();
    }
  } catch {
  }
  try {
    window.localStorage.setItem('gestiontuto_last_tutoria_update', JSON.stringify(payload));
  } catch {
  }
}

export function renderBadgeEstado(estado: Solicitud['estado']) {
  if (estado === 'pendiente') {
    return (
      <Badge variant="warning" pulseDot>
        Pendiente
      </Badge>
    );
  }
  if (estado === 'aceptada') {
    return (
      <Badge variant="success" dot>
        Aceptada
      </Badge>
    );
  }
  if (estado === 'aplazada') {
    return (
      <Badge variant="primary">
        <Icon className="text-[14px]">event_repeat</Icon>
        <span>Aplazada</span>
      </Badge>
    );
  }
  if (estado === 'cancelada') {
    return (
      <Badge variant="error">
        <Icon className="text-[14px]">cancel</Icon>
        <span>Cancelada</span>
      </Badge>
    );
  }
  return (
    <Badge variant="secondary">
      <Icon className="text-[14px]">task_alt</Icon>
      <span>Finalizada</span>
    </Badge>
  );
}
