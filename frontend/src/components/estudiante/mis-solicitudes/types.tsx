import { Badge } from '../../ui/Badge';
import { Icon } from '../../ui/Icon';

export interface Solicitud {
  _id: string;
  materia: string;
  tema?: string;
  descripcion: string;
  hora?: string;
  fechaPropuesta?: string;
  fechaRespuestaProfesor?: string;
  fechaCancelacion?: string;
  modalidad?: string;
  tipo?: string;
  lugar?: string;
  enlaceReunion?: string;
  comentarioProfesor?: string;
  motivoCancelacion?: string;
  canceladaPor?: 'estudiante' | 'profesor';
  estado: string;
  createdAt?: string;
  updatedAt?: string;
  estudiante?: {
    nombre: string;
    email?: string;
  };
  profesor?: {
    nombre: string;
    email: string;
  };
}

export interface CambioEstadoNotificacion {
  id: string;
  materia: string;
  tema?: string;
  estadoAnterior: string;
  estadoNuevo: string;
}

export const ETIQUETAS_ESTADO: Record<string, string> = {
  pendiente: 'Pendiente',
  aceptada: 'Aceptada',
  aplazada: 'Aplazada',
  cancelada: 'Cancelada',
  finalizada: 'Finalizada',
};

export function formatearFecha(fechaIso?: string): string | null {
  if (!fechaIso) return null;
  const parsed = new Date(fechaIso);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleString('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
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

export function renderEstadoCita(estado: string) {
  if (estado === 'pendiente') {
    return (
      <Badge variant="warning" pulseDot>
        Pendiente de confirmación
      </Badge>
    );
  }
  if (estado === 'aceptada') {
    return (
      <Badge variant="success">
        <Icon className="text-[15px] text-[#16a34a]">check_circle</Icon>
        <span>Aceptada y Agendada</span>
      </Badge>
    );
  }
  if (estado === 'aplazada') {
    return (
      <Badge variant="primary">
        <Icon className="text-[15px] text-primary">event_repeat</Icon>
        <span>Aplazada por Docente</span>
      </Badge>
    );
  }
  if (estado === 'finalizada') {
    return (
      <Badge variant="secondary">
        <Icon className="text-[15px]">task_alt</Icon>
        <span>Finalizada</span>
      </Badge>
    );
  }
  return (
    <Badge variant="error">
      <Icon className="text-[15px] text-error">cancel</Icon>
      <span>Cancelada</span>
    </Badge>
  );
}
