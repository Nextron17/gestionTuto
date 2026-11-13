'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AxiosError } from 'axios';
import api from '../../../../lib/api';
import { Icon } from '../../../../components/ui/Icon';
import { PageHeader } from '../../../../components/ui/PageHeader';
import { SurfaceCard } from '../../../../components/ui/SurfaceCard';
import { Badge } from '../../../../components/ui/Badge';
import { Button } from '../../../../components/ui/Button';
import { FormInput, FormSelect, FormTextarea } from '../../../../components/ui/FormField';
import { SearchInput } from '../../../../components/ui/SearchInput';
import { Modal } from '../../../../components/ui/Modal';
import { CalloutBanner } from '../../../../components/ui/CalloutBanner';

interface EstudianteInfo {
  _id: string;
  nombre: string;
  email: string;
  carrera?: string;
  semestre?: number;
}

interface ParticipanteItem {
  estudiante: EstudianteInfo;
  asistio?: boolean | null;
}

interface Solicitud {
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

type FiltroEstado = 'todos' | 'pendiente' | 'aceptada' | 'aplazada' | 'cancelada';

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
}

function formatearFechaLegible(fechaISO?: string): string {
  if (!fechaISO) return 'Sin fecha definida';
  const fecha = new Date(fechaISO);
  if (Number.isNaN(fecha.getTime())) return 'Sin fecha definida';
  return fecha.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function toInputDateValue(fechaISO?: string): string {
  if (!fechaISO) return '';
  const fecha = new Date(fechaISO);
  if (Number.isNaN(fecha.getTime())) return '';
  return fecha.toISOString().slice(0, 10);
}

function renderBadgeEstado(estado: Solicitud['estado']) {
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

export default function SolicitudesProfesorPage() {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [tutoriaSeleccionada, setTutoriaSeleccionada] = useState<Solicitud | null>(null);
  const [nuevoRecurso, setNuevoRecurso] = useState('');
  const [modalidadActiva, setModalidadActiva] = useState<'virtual' | 'presencial'>('virtual');
  const [tipoActivo, setTipoActivo] = useState<'individual' | 'grupal'>('individual');
  const [cupoActivo, setCupoActivo] = useState(10);
  const [lugarActivo, setLugarActivo] = useState('');
  const [enlaceReunionActivo, setEnlaceReunionActivo] = useState('');
  const [comentarioActivo, setComentarioActivo] = useState('');
  const [grabacionActiva, setGrabacionActiva] = useState('');
  const [cargando, setCargando] = useState(true);
  const [guardandoDetalles, setGuardandoDetalles] = useState(false);
  const [mensajeFeedback, setMensajeFeedback] = useState('');
  const [errorEvidencia, setErrorEvidencia] = useState('');

  // Filtros de solicitudes recibidas (HU-04)
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('todos');
  const [busqueda, setBusqueda] = useState('');

  // Modal de respuesta (Aceptar o Aplazar)
  const [modalGestion, setModalGestion] = useState<{
    solicitud: Solicitud;
    accion: 'aceptada' | 'aplazada';
  } | null>(null);
  const [fechaModal, setFechaModal] = useState('');
  const [horaPropuesta, setHoraPropuesta] = useState('');
  const [modalidad, setModalidad] = useState<'virtual' | 'presencial'>('virtual');
  const [tipo, setTipo] = useState<'individual' | 'grupal'>('individual');
  const [cupoMaximo, setCupoMaximo] = useState(10);
  const [lugarModal, setLugarModal] = useState('');
  const [enlaceReunionModal, setEnlaceReunionModal] = useState('');
  const [comentarioModal, setComentarioModal] = useState('');
  const [errorModalGestion, setErrorModalGestion] = useState('');
  const [procesandoModal, setProcesandoModal] = useState(false);

  // Modal de confirmación para cancelar solicitud con motivo
  const [solicitudACancelar, setSolicitudACancelar] = useState<Solicitud | null>(null);
  const [motivoCancelacion, setMotivoCancelacion] = useState('');
  const [cancelando, setCancelando] = useState(false);

  const sincronizarSeleccionada = useCallback((lista: Solicitud[], idActual?: string) => {
    const aceptadas = lista.filter((s) => s.estado === 'aceptada');
    const encontrada = idActual ? aceptadas.find((s) => s._id === idActual) : aceptadas[0];
    setTutoriaSeleccionada(encontrada || null);
    setModalidadActiva(encontrada?.modalidad || 'virtual');
    setTipoActivo(encontrada?.tipo || 'individual');
    setCupoActivo(encontrada?.cupoMaximo && encontrada.cupoMaximo > 1 ? encontrada.cupoMaximo : 10);
    setLugarActivo(encontrada?.lugar || '');
    setEnlaceReunionActivo(encontrada?.enlaceReunion || '');
    setComentarioActivo(encontrada?.comentarioProfesor || '');
    setGrabacionActiva(encontrada?.enlaceGrabacion || '');
    setErrorEvidencia('');
  }, []);

  const cargarSolicitudesAPI = useCallback(
    async (idMantener?: string) => {
      try {
        const res = await api.get('/tutorias');
        const data: Solicitud[] = res.data || [];
        setSolicitudes(data);
        sincronizarSeleccionada(data, idMantener);
        return data;
      } catch (err) {
        console.error(err);
        return [];
      }
    },
    [sincronizarSeleccionada]
  );

  useEffect(() => {
    let cancelado = false;

    const cargarInicial = async () => {
      try {
        const res = await api.get('/tutorias');
        if (cancelado) return;
        const data: Solicitud[] = res.data || [];
        setSolicitudes(data);
        sincronizarSeleccionada(data);
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelado) {
          setCargando(false);
        }
      }
    };

    cargarInicial();

    let channel: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      channel = new BroadcastChannel('gestiontuto_solicitudes_sync');
      channel.onmessage = () => {
        cargarSolicitudesAPI();
      };
    }

    const onStorage = (event: StorageEvent) => {
      if (event.key === 'gestiontuto_last_tutoria_update') {
        cargarSolicitudesAPI();
      }
    };

    window.addEventListener('storage', onStorage);

    return () => {
      cancelado = true;
      if (channel) {
        channel.close();
      }
      window.removeEventListener('storage', onStorage);
    };
  }, [cargarSolicitudesAPI, sincronizarSeleccionada]);

  const mostrarFeedback = (texto: string) => {
    setMensajeFeedback(texto);
    setTimeout(() => setMensajeFeedback(''), 3500);
  };

  const notificarCambioEstadoTutoria = (solicitudId: string, nuevoEstado: string) => {
    if (typeof window === 'undefined') return;
    const payload = { solicitudId, estado: nuevoEstado, timestamp: Date.now() };
    try {
      if ('BroadcastChannel' in window) {
        const channel = new BroadcastChannel('gestiontuto_solicitudes_sync');
        channel.postMessage(payload);
        channel.close();
      }
    } catch {
      // Ignorar si BroadcastChannel no está disponible
    }
    try {
      window.localStorage.setItem('gestiontuto_last_tutoria_update', JSON.stringify(payload));
    } catch {
      // Ignorar errores de almacenamiento
    }
  };

  const abrirModalGestion = (sol: Solicitud, accion: 'aceptada' | 'aplazada') => {
    setModalGestion({ solicitud: sol, accion });
    setFechaModal(
      toInputDateValue(sol.fechaPropuesta || sol.createdAt) ||
        new Date().toISOString().slice(0, 10)
    );
    setHoraPropuesta(sol.hora || '');
    setModalidad(sol.modalidad || 'virtual');
    setTipo(sol.tipo || 'individual');
    setCupoMaximo(sol.cupoMaximo && sol.cupoMaximo > 1 ? sol.cupoMaximo : 10);
    setLugarModal(sol.lugar || '');
    setEnlaceReunionModal(sol.enlaceReunion || '');
    setComentarioModal(sol.comentarioProfesor || '');
    setErrorModalGestion('');
  };

  const confirmarGestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalGestion) return;

    setErrorModalGestion('');
    if (modalGestion.accion === 'aceptada' && modalidad === 'presencial' && !lugarModal.trim()) {
      setErrorModalGestion(
        'Al aceptar una tutoría presencial es obligatorio indicar el lugar o salón de encuentro.'
      );
      return;
    }

    setProcesandoModal(true);
    try {
      await api.patch(`/tutorias/${modalGestion.solicitud._id}`, {
        estado: modalGestion.accion,
        fechaPropuesta: fechaModal || undefined,
        hora: horaPropuesta,
        modalidad,
        tipo,
        cupoMaximo: tipo === 'grupal' ? cupoMaximo : 1,
        lugar:
          modalGestion.accion === 'aceptada' && modalidad === 'presencial'
            ? lugarModal.trim()
            : undefined,
        enlaceReunion:
          modalGestion.accion === 'aceptada' && modalidad === 'virtual'
            ? enlaceReunionModal.trim()
            : undefined,
        comentarioProfesor: comentarioModal,
      });

      const idDestino =
        modalGestion.accion === 'aceptada'
          ? modalGestion.solicitud._id
          : tutoriaSeleccionada?._id;
      const accionTexto =
        modalGestion.accion === 'aceptada'
          ? 'Solicitud aceptada y configurada exitosamente.'
          : 'Solicitud aplazada y reprogramada; se notificó la nueva fecha al estudiante.';
      notificarCambioEstadoTutoria(modalGestion.solicitud._id, modalGestion.accion);
      setModalGestion(null);
      await cargarSolicitudesAPI(idDestino);
      mostrarFeedback(accionTexto);
    } catch (err) {
      const errorAxios = err as AxiosError<{ message?: string }>;
      setErrorModalGestion(
        errorAxios.response?.data?.message || 'Error al guardar la configuración de la tutoría.'
      );
    } finally {
      setProcesandoModal(false);
    }
  };

  const abrirModalCancelacion = (sol: Solicitud) => {
    setSolicitudACancelar(sol);
    setMotivoCancelacion(sol.comentarioProfesor || '');
  };

  const confirmarCancelacion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!solicitudACancelar) return;
    setCancelando(true);
    try {
      await api.patch(`/tutorias/${solicitudACancelar._id}`, {
        estado: 'cancelada',
        comentarioProfesor: motivoCancelacion.trim() || 'Cancelada por disponibilidad docente.',
      });
      const idMantener =
        tutoriaSeleccionada?._id === solicitudACancelar._id ? undefined : tutoriaSeleccionada?._id;
      notificarCambioEstadoTutoria(solicitudACancelar._id, 'cancelada');
      setSolicitudACancelar(null);
      setMotivoCancelacion('');
      await cargarSolicitudesAPI(idMantener);
      mostrarFeedback('Solicitud marcada como cancelada y actualizada en tu agenda.');
    } catch (err) {
      console.error(err);
    } finally {
      setCancelando(false);
    }
  };

  const restaurarAPendiente = async (sol: Solicitud) => {
    try {
      await api.patch(`/tutorias/${sol._id}`, { estado: 'pendiente' });
      await cargarSolicitudesAPI(tutoriaSeleccionada?._id);
      mostrarFeedback('Solicitud devuelta a estado Pendiente.');
    } catch (err) {
      console.error(err);
    }
  };

  const guardarDetallesSesion = async () => {
    if (!tutoriaSeleccionada) return;
    setErrorEvidencia('');
    if (modalidadActiva === 'presencial' && !lugarActivo.trim()) {
      setErrorEvidencia(
        'Para sesiones presenciales debes registrar el lugar o salón de encuentro.'
      );
      return;
    }
    if (modalidadActiva === 'virtual' && !enlaceReunionActivo.trim() && !grabacionActiva.trim()) {
      setErrorEvidencia(
        'Para sesiones virtuales debes registrar el enlace de la reunión como evidencia.'
      );
      return;
    }

    setGuardandoDetalles(true);
    try {
      await api.patch(`/tutorias/${tutoriaSeleccionada._id}`, {
        modalidad: modalidadActiva,
        tipo: tipoActivo,
        cupoMaximo: tipoActivo === 'grupal' ? cupoActivo : 1,
        lugar: modalidadActiva === 'presencial' ? lugarActivo.trim() : '',
        enlaceReunion: enlaceReunionActivo.trim(),
        comentarioProfesor: comentarioActivo,
        enlaceGrabacion: grabacionActiva,
      });
      await cargarSolicitudesAPI(tutoriaSeleccionada._id);
      mostrarFeedback('Configuración y evidencia de la tutoría guardadas correctamente.');
    } catch (err) {
      console.error(err);
      setErrorEvidencia('Error al guardar la configuración y evidencia de la sesión.');
    } finally {
      setGuardandoDetalles(false);
    }
  };

  const marcarAsistenciaPrincipal = async (asistio: boolean) => {
    if (!tutoriaSeleccionada) return;
    setErrorEvidencia('');
    try {
      await api.patch(`/tutorias/${tutoriaSeleccionada._id}/asistencia`, {
        asistenciaEstudiante: asistio,
      });
      await cargarSolicitudesAPI(tutoriaSeleccionada._id);
    } catch (err) {
      console.error(err);
    }
  };

  const marcarAsistenciaParticipante = async (estudianteId: string, asistio: boolean) => {
    if (!tutoriaSeleccionada) return;
    setErrorEvidencia('');
    try {
      await api.patch(`/tutorias/${tutoriaSeleccionada._id}/asistencia`, {
        participantes: [{ estudianteId, asistio }],
      });
      await cargarSolicitudesAPI(tutoriaSeleccionada._id);
    } catch (err) {
      console.error(err);
    }
  };

  const marcarTodosAsistio = async () => {
    if (!tutoriaSeleccionada) return;
    setErrorEvidencia('');
    try {
      const participantesPayload = (tutoriaSeleccionada.participantes || []).map((p) => ({
        estudianteId: p.estudiante._id,
        asistio: true,
      }));
      await api.patch(`/tutorias/${tutoriaSeleccionada._id}/asistencia`, {
        asistenciaEstudiante: true,
        participantes: participantesPayload,
      });
      await cargarSolicitudesAPI(tutoriaSeleccionada._id);
      mostrarFeedback('Todos los estudiantes fueron marcados como "Asistió".');
    } catch (err) {
      console.error(err);
    }
  };

  const agregarRecurso = async () => {
    if (!nuevoRecurso.trim() || !tutoriaSeleccionada) return;
    try {
      await api.post(`/tutorias/${tutoriaSeleccionada._id}/recursos`, {
        link: nuevoRecurso.trim(),
      });
      setNuevoRecurso('');
      await cargarSolicitudesAPI(tutoriaSeleccionada._id);
    } catch (err) {
      console.error(err);
    }
  };

  const finalizarTutoria = async (id: string) => {
    if (!tutoriaSeleccionada) return;
    setErrorEvidencia('');

    const tieneEnlaceComentario = /https?:\/\/\S+/i.test(comentarioActivo);
    if (modalidadActiva === 'presencial' && !lugarActivo.trim()) {
      setErrorEvidencia(
        'Debes registrar el lugar o salón presencial antes de finalizar la tutoría.'
      );
      return;
    }
    if (
      modalidadActiva === 'virtual' &&
      !enlaceReunionActivo.trim() &&
      !grabacionActiva.trim() &&
      !tieneEnlaceComentario
    ) {
      setErrorEvidencia(
        'Debes registrar el enlace de la reunión virtual antes de finalizar la tutoría.'
      );
      return;
    }

    const faltaPrincipal =
      tutoriaSeleccionada.asistenciaEstudiante === null ||
      tutoriaSeleccionada.asistenciaEstudiante === undefined;
    const faltaParticipante = (tutoriaSeleccionada.participantes || []).some(
      (p) => p.asistio === null || p.asistio === undefined
    );

    if (faltaPrincipal || faltaParticipante) {
      setErrorEvidencia(
        'Debes marcar la asistencia (Asistió o No asistió) de todos los estudiantes antes de finalizar.'
      );
      return;
    }

    try {
      await api.patch(`/tutorias/${id}/finalizar`, {
        modalidad: modalidadActiva,
        tipo: tipoActivo,
        cupoMaximo: tipoActivo === 'grupal' ? cupoActivo : 1,
        lugar: modalidadActiva === 'presencial' ? lugarActivo.trim() : '',
        enlaceReunion: enlaceReunionActivo.trim(),
        comentarioProfesor: comentarioActivo,
        enlaceGrabacion: grabacionActiva,
      });
      await cargarSolicitudesAPI();
      mostrarFeedback(
        'Tutoría finalizada con su evidencia completa y guardada en Historial / Recursos.'
      );
    } catch (err) {
      const errorAxios = err as AxiosError<{ message?: string }>;
      setErrorEvidencia(
        errorAxios.response?.data?.message || 'Error al finalizar la tutoría y guardar evidencia.'
      );
    }
  };

  const conteos = useMemo(() => {
    return {
      todos: solicitudes.length,
      pendiente: solicitudes.filter((s) => s.estado === 'pendiente').length,
      aceptada: solicitudes.filter((s) => s.estado === 'aceptada').length,
      aplazada: solicitudes.filter((s) => s.estado === 'aplazada').length,
      cancelada: solicitudes.filter((s) => s.estado === 'cancelada').length,
    };
  }, [solicitudes]);

  const aceptadas = useMemo(
    () => solicitudes.filter((s) => s.estado === 'aceptada'),
    [solicitudes]
  );

  const solicitudesFiltradas = useMemo(() => {
    const q = busqueda.toLowerCase().trim();
    return solicitudes.filter((sol) => {
      const coincideEstado =
        filtroEstado === 'todos' ? sol.estado !== 'finalizada' : sol.estado === filtroEstado;
      if (!coincideEstado) return false;
      if (!q) return true;

      const fechaTexto = formatearFechaLegible(sol.fechaPropuesta || sol.createdAt).toLowerCase();
      return (
        sol.materia.toLowerCase().includes(q) ||
        (sol.tema && sol.tema.toLowerCase().includes(q)) ||
        (sol.estudiante?.nombre && sol.estudiante.nombre.toLowerCase().includes(q)) ||
        (sol.estudiante?.email && sol.estudiante.email.toLowerCase().includes(q)) ||
        (sol.hora && sol.hora.toLowerCase().includes(q)) ||
        fechaTexto.includes(q)
      );
    });
  }, [solicitudes, filtroEstado, busqueda]);

  if (cargando) {
    return (
      <div className="max-w-6xl mx-auto py-8 text-sm text-on-surface-variant flex items-center gap-2">
        <Icon className="text-primary animate-pulse">hourglass_top</Icon>
        <span>Cargando solicitudes y sesiones de tutoría...</span>
      </div>
    );
  }

  const tabsEstado: { id: FiltroEstado; label: string; count: number }[] = [
    { id: 'todos', label: 'Todas (Activas)', count: solicitudes.filter((s) => s.estado !== 'finalizada').length },
    { id: 'pendiente', label: 'Pendientes', count: conteos.pendiente },
    { id: 'aceptada', label: 'Aceptadas', count: conteos.aceptada },
    { id: 'aplazada', label: 'Aplazadas', count: conteos.aplazada },
    { id: 'cancelada', label: 'Canceladas', count: conteos.cancelada },
  ];

  return (
    <div className="space-y-space-lg max-w-6xl mx-auto min-w-0">
      <PageHeader
        eyebrow="01. Bandeja Docente"
        title="Gestión de Solicitudes Recibidas"
        description="Revisa quién solicita tutoría, materia, tema y fecha; acepta, aplaza o cancela solicitudes para organizar tu agenda."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="warning" pulseDot>
              {conteos.pendiente} pendientes
            </Badge>
            <Badge variant="success" dot>
              {conteos.aceptada} aceptadas
            </Badge>
            <Badge variant="primary">
              {conteos.aplazada} aplazadas
            </Badge>
            <Badge variant="error">
              {conteos.cancelada} canceladas
            </Badge>
          </div>
        }
      />

      {mensajeFeedback && (
        <CalloutBanner tone="success" title="Actualización completada">
          {mensajeFeedback}
        </CalloutBanner>
      )}

      {/* Bandeja de Solicitudes Recibidas (HU-04) */}
      <SurfaceCard tone="lowest" className="p-4 sm:p-space-lg space-y-space-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-surface-container">
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-on-surface flex items-center gap-2">
              <Icon className="text-tertiary text-[22px] shrink-0">pending_actions</Icon>
              <span>Solicitudes de Tutoría Recibidas</span>
            </h2>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Filtra por estado o busca por estudiante, materia, tema o fecha para gestionar tu agenda.
            </p>
          </div>
          <div className="w-full md:w-80">
            <SearchInput
              id="buscar-solicitudes-prof"
              placeholder="Buscar estudiante, materia, tema o fecha..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              onClear={() => setBusqueda('')}
            />
          </div>
        </div>

        {/* Pestañas por estado */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {tabsEstado.map((tab) => {
            const activo = filtroEstado === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFiltroEstado(tab.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-label-md text-xs font-semibold transition-all cursor-pointer active:scale-95 ${
                  activo
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    activo ? 'bg-white/20 text-white' : 'bg-surface-container-lowest text-on-surface'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {solicitudesFiltradas.length === 0 ? (
          <div className="p-6 sm:p-8 rounded-xl bg-surface-container-low text-center space-y-1.5">
            <Icon className="text-outline text-[32px]">task_alt</Icon>
            <p className="text-sm text-on-surface-variant">
              {solicitudes.length === 0
                ? 'Aún no has recibido solicitudes de tutoría.'
                : 'No hay solicitudes que coincidan con el filtro o búsqueda actual.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {solicitudesFiltradas.map((sol) => {
              const fechaMostrar = formatearFechaLegible(sol.fechaPropuesta || sol.createdAt);
              return (
                <div
                  key={sol._id}
                  className="p-3.5 sm:p-space-md rounded-xl bg-surface-container-low hover:bg-surface-container/70 transition-colors flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4"
                >
                  <div className="space-y-2.5 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {renderBadgeEstado(sol.estado)}
                      {sol.modalidad && (
                        <Badge variant="neutral" pill={false} className="capitalize">
                          <Icon className="text-[13px]">
                            {sol.modalidad === 'presencial' ? 'location_on' : 'videocam'}
                          </Icon>
                          <span>{sol.modalidad}</span>
                        </Badge>
                      )}
                      <Badge variant={sol.tipo === 'grupal' ? 'secondary' : 'neutral'} pill={false}>
                        <Icon className="text-[13px]">
                          {sol.tipo === 'grupal' ? 'groups' : 'person'}
                        </Icon>
                        <span>
                          {sol.tipo === 'grupal'
                            ? `Grupal${sol.cupoMaximo ? ` (Cupo ${sol.cupoMaximo})` : ''}`
                            : 'Individual'}
                        </span>
                      </Badge>
                    </div>

                    {/* Datos clave requeridos por HU-04: Estudiante, Materia, Tema y Fecha */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2 text-xs bg-surface-container-lowest/80 p-2.5 rounded-lg">
                      <div className="min-w-0">
                        <span className="text-[10px] uppercase tracking-wider font-bold text-outline block">
                          Estudiante
                        </span>
                        <span className="font-semibold text-on-surface flex items-center gap-1 truncate">
                          <Icon className="text-[14px] text-primary shrink-0">school</Icon>
                          <span className="truncate">{sol.estudiante?.nombre || 'Estudiante'}</span>
                        </span>
                        {(sol.estudiante?.carrera || sol.estudiante?.semestre) && (
                          <span className="text-[11px] text-on-surface-variant block truncate">
                            {sol.estudiante?.carrera}
                            {sol.estudiante?.carrera && sol.estudiante?.semestre ? ' • ' : ''}
                            {sol.estudiante?.semestre ? `Sem. ${sol.estudiante.semestre}` : ''}
                          </span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <span className="text-[10px] uppercase tracking-wider font-bold text-outline block">
                          Materia
                        </span>
                        <span className="font-semibold text-on-surface flex items-center gap-1 break-words">
                          <Icon className="text-[14px] text-primary shrink-0">menu_book</Icon>
                          <span>{sol.materia}</span>
                        </span>
                      </div>

                      <div className="min-w-0">
                        <span className="text-[10px] uppercase tracking-wider font-bold text-outline block">
                          Tema
                        </span>
                        <span className="font-semibold text-on-surface flex items-center gap-1 break-words">
                          <Icon className="text-[14px] text-secondary shrink-0">topic</Icon>
                          <span>{sol.tema || 'Tema general'}</span>
                        </span>
                      </div>

                      <div className="min-w-0">
                        <span className="text-[10px] uppercase tracking-wider font-bold text-outline block">
                          Fecha y Horario
                        </span>
                        <span className="font-semibold text-on-surface flex items-center gap-1">
                          <Icon className="text-[14px] text-tertiary shrink-0">event</Icon>
                          <span>{fechaMostrar}</span>
                        </span>
                        <span className="text-[11px] text-on-surface-variant block truncate">
                          {sol.hora || 'Franja por definir'}
                        </span>
                      </div>
                    </div>

                    <p className="font-body-md text-[13px] text-on-surface-variant leading-relaxed break-words">
                      {sol.descripcion}
                    </p>

                    {sol.modalidad === 'presencial' && sol.lugar && (
                      <div className="p-2.5 rounded-lg bg-primary-fixed/40 text-primary text-xs flex items-start gap-1.5">
                        <Icon className="text-[15px] shrink-0 mt-0.5">location_on</Icon>
                        <span className="break-words min-w-0">
                          <strong>Lugar presencial:</strong> {sol.lugar}
                        </span>
                      </div>
                    )}

                    {sol.comentarioProfesor && (
                      <div className="p-2.5 rounded-lg bg-[#fef3c7]/60 text-[#92400e] text-xs flex items-start gap-1.5">
                        <Icon className="text-[15px] text-tertiary shrink-0 mt-0.5">info</Icon>
                        <span className="break-words min-w-0">
                          <strong>Nota / Motivo docente:</strong> {sol.comentarioProfesor}
                        </span>
                      </div>
                    )}

                    {sol.estado === 'cancelada' && sol.canceladaPor === 'estudiante' && (
                      <div className="p-2.5 rounded-lg bg-error-container/30 text-error text-xs flex items-start gap-1.5">
                        <Icon className="text-[15px] shrink-0 mt-0.5">event_available</Icon>
                        <span className="break-words min-w-0">
                          <strong>Cancelada por el estudiante (horario liberado):</strong>{' '}
                          {sol.motivoCancelacion || 'El estudiante indicó que ya no puede asistir.'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Acciones por estado */}
                  <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-surface-container-highest/60">
                    {(sol.estado === 'pendiente' || sol.estado === 'aplazada') && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => abrirModalGestion(sol, 'aceptada')}
                        className="flex-1 sm:flex-initial"
                      >
                        <Icon className="text-[16px]">check_circle</Icon>
                        <span>Aceptar</span>
                      </Button>
                    )}

                    {(sol.estado === 'pendiente' ||
                      sol.estado === 'aceptada' ||
                      sol.estado === 'aplazada') && (
                      <Button
                        variant="tonal"
                        size="sm"
                        onClick={() => abrirModalGestion(sol, 'aplazada')}
                        className="flex-1 sm:flex-initial"
                      >
                        <Icon className="text-[16px]">edit_calendar</Icon>
                        <span>Aplazar</span>
                      </Button>
                    )}

                    {(sol.estado === 'pendiente' ||
                      sol.estado === 'aceptada' ||
                      sol.estado === 'aplazada') && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => abrirModalCancelacion(sol)}
                        className="flex-1 sm:flex-initial"
                      >
                        <Icon className="text-[16px]">cancel</Icon>
                        <span>Cancelar</span>
                      </Button>
                    )}

                    {(sol.estado === 'aplazada' || sol.estado === 'cancelada') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => restaurarAPendiente(sol)}
                        className="w-full sm:w-auto"
                      >
                        <Icon className="text-[16px]">undo</Icon>
                        <span>Pasar a Pendiente</span>
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SurfaceCard>

      {/* Detalle de Tutoría Activa */}
      <SurfaceCard tone="lowest" className="p-4 sm:p-space-lg space-y-space-lg">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 pb-3 border-b border-surface-container">
          <div className="min-w-0">
            <span className="font-label-md text-[11px] uppercase tracking-wider text-outline font-semibold">
              Aula Virtual &amp; Seguimiento
            </span>
            <h3 className="text-base sm:text-lg font-bold text-on-surface flex items-center gap-2">
              <Icon className="text-[#16a34a] text-[22px] shrink-0">cast_for_education</Icon>
              <span>Gestión de Tutoría Activa</span>
            </h3>
          </div>

          {aceptadas.length > 0 && (
            <div className="w-full sm:w-80">
              <FormSelect
                icon="event_available"
                value={tutoriaSeleccionada?._id || ''}
                onChange={(e) => {
                  const sel = aceptadas.find((s) => s._id === e.target.value) || null;
                  setTutoriaSeleccionada(sel);
                  setModalidadActiva(sel?.modalidad || 'virtual');
                  setTipoActivo(sel?.tipo || 'individual');
                  setCupoActivo(sel?.cupoMaximo && sel.cupoMaximo > 1 ? sel.cupoMaximo : 10);
                  setLugarActivo(sel?.lugar || '');
                  setEnlaceReunionActivo(sel?.enlaceReunion || '');
                  setComentarioActivo(sel?.comentarioProfesor || '');
                  setGrabacionActiva(sel?.enlaceGrabacion || '');
                  setErrorEvidencia('');
                }}
              >
                {aceptadas.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.materia} — {s.estudiante?.nombre} (
                    {s.tipo === 'grupal' ? 'Grupal' : 'Individual'})
                  </option>
                ))}
              </FormSelect>
            </div>
          )}
        </div>

        {!tutoriaSeleccionada ? (
          <div className="p-8 rounded-xl bg-surface-container-low text-center space-y-1.5">
            <Icon className="text-outline text-[32px]">event_busy</Icon>
            <p className="text-sm text-on-surface-variant">
              No tienes tutorías aceptadas en curso. Acepta una solicitud arriba para gestionarla.
            </p>
          </div>
        ) : (
          <div className="space-y-space-lg">
            {/* Resumen de la sesión en Micro Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-space-md rounded-xl bg-surface-container-low">
                <span className="font-label-md text-[11px] uppercase text-outline font-semibold tracking-wider block">
                  Fecha y Hora
                </span>
                <p className="font-label-md text-sm font-bold text-on-surface mt-1 flex items-center gap-1.5">
                  <Icon className="text-[16px] text-primary">schedule</Icon>
                  <span>
                    {formatearFechaLegible(
                      tutoriaSeleccionada.fechaPropuesta || tutoriaSeleccionada.createdAt
                    )}
                    {tutoriaSeleccionada.hora ? ` • ${tutoriaSeleccionada.hora}` : ''}
                  </span>
                </p>
              </div>

              <div className="p-space-md rounded-xl bg-surface-container-low">
                <span className="font-label-md text-[11px] uppercase text-outline font-semibold tracking-wider block">
                  Materia y Tema
                </span>
                <p className="font-label-md text-sm font-bold text-on-surface mt-1 truncate">
                  {tutoriaSeleccionada.materia}{' '}
                  {tutoriaSeleccionada.tema ? `(${tutoriaSeleccionada.tema})` : ''}
                </p>
              </div>

              <div className="p-space-md rounded-xl bg-surface-container-low">
                <span className="font-label-md text-[11px] uppercase text-outline font-semibold tracking-wider block">
                  Modalidad y Ubicación
                </span>
                <p className="font-label-md text-sm font-bold text-primary capitalize mt-1 flex items-center gap-1.5">
                  <Icon className="text-[16px]">
                    {tutoriaSeleccionada.modalidad === 'presencial' ? 'location_on' : 'videocam'}
                  </Icon>
                  <span>{tutoriaSeleccionada.modalidad || 'Virtual'}</span>
                </p>
                {tutoriaSeleccionada.modalidad === 'presencial' && tutoriaSeleccionada.lugar && (
                  <p className="text-[11px] text-on-surface-variant mt-1 truncate" title={tutoriaSeleccionada.lugar}>
                    {tutoriaSeleccionada.lugar}
                  </p>
                )}
              </div>

              <div className="p-space-md rounded-xl bg-surface-container-low">
                <span className="font-label-md text-[11px] uppercase text-outline font-semibold tracking-wider block">
                  Tipo de Sesión
                </span>
                <p className="font-label-md text-sm font-bold text-secondary capitalize mt-1 flex items-center gap-1.5">
                  <Icon className="text-[16px]">
                    {tutoriaSeleccionada.tipo === 'grupal' ? 'groups' : 'person'}
                  </Icon>
                  <span>
                    {tutoriaSeleccionada.tipo || 'Individual'}
                    {tutoriaSeleccionada.tipo === 'grupal'
                      ? ` (${1 + (tutoriaSeleccionada.participantes?.length || 0)}/${
                          tutoriaSeleccionada.cupoMaximo || 10
                        } inscritos)`
                      : ''}
                  </span>
                </p>
              </div>
            </div>

            {/* Evidencia HU-05: Modalidad, Enlace de Reunión, Salón/Indicaciones y Grabación */}
            {errorEvidencia && (
              <CalloutBanner tone="danger" title="Evidencia incompleta">
                {errorEvidencia}
              </CalloutBanner>
            )}

            <div className="p-space-md rounded-xl bg-surface-container-low space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="font-label-md text-xs font-bold uppercase tracking-wider text-on-surface flex items-center gap-1.5">
                  <Icon className="text-primary text-[18px]">verified</Icon>
                  <span>Configuración y Evidencia de la Sesión</span>
                </h4>
                <div className="flex items-center gap-1.5">
                  <Badge variant="primary" pill={false} className="capitalize">
                    {modalidadActiva}
                  </Badge>
                  <Badge variant="secondary" pill={false} className="capitalize">
                    {tipoActivo}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
                <FormSelect
                  id="modalidad-activa"
                  label="Modalidad"
                  icon={modalidadActiva === 'presencial' ? 'location_on' : 'videocam'}
                  value={modalidadActiva}
                  onChange={(e) => setModalidadActiva(e.target.value as 'virtual' | 'presencial')}
                >
                  <option value="virtual">Virtual (con enlace de reunión)</option>
                  <option value="presencial">Presencial (en aula / campus)</option>
                </FormSelect>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormSelect
                    id="tipo-activo"
                    label="Tipo de Tutoría"
                    icon={tipoActivo === 'grupal' ? 'groups' : 'person'}
                    value={tipoActivo}
                    onChange={(e) => setTipoActivo(e.target.value as 'individual' | 'grupal')}
                  >
                    <option value="individual">Individual</option>
                    <option value="grupal">Grupal</option>
                  </FormSelect>

                  {tipoActivo === 'grupal' && (
                    <FormInput
                      id="cupo-activo"
                      type="number"
                      min={2}
                      max={50}
                      label="Cupo Máximo"
                      icon="group_add"
                      value={cupoActivo}
                      onChange={(e) => setCupoActivo(Number(e.target.value))}
                    />
                  )}
                </div>

                {modalidadActiva === 'presencial' ? (
                  <FormInput
                    id="lugar-activo"
                    label="Lugar / Salón Presencial *"
                    icon="location_on"
                    value={lugarActivo}
                    onChange={(e) => setLugarActivo(e.target.value)}
                    placeholder="Ej: Salón 202 - Edificio de Ingeniería"
                    required
                  />
                ) : (
                  <div className="flex items-end gap-2">
                    <FormInput
                      id="enlace-reunion-activo"
                      type="url"
                      label="Enlace de la Reunión Virtual *"
                      icon="link"
                      value={enlaceReunionActivo}
                      onChange={(e) => setEnlaceReunionActivo(e.target.value)}
                      placeholder="https://meet.google.com/xxx-xxxx-xxx"
                      containerClassName="flex-1"
                    />
                    {enlaceReunionActivo.trim().startsWith('http') && (
                      <a
                        href={enlaceReunionActivo.trim()}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-2.5 rounded-lg bg-primary-fixed text-primary text-xs font-semibold hover:bg-primary hover:text-on-primary transition-colors inline-flex items-center gap-1 shrink-0"
                        title="Abrir reunión"
                      >
                        <Icon className="text-[16px]">open_in_new</Icon>
                        <span>Abrir</span>
                      </a>
                    )}
                  </div>
                )}

                <FormInput
                  id="comentario-activo"
                  label="Observaciones o Indicaciones de la Sesión"
                  icon="comment"
                  value={comentarioActivo}
                  onChange={(e) => setComentarioActivo(e.target.value)}
                  placeholder={
                    modalidadActiva === 'presencial'
                      ? 'Ej: Traer calculadora científica o taller impreso'
                      : 'Ej: Traer dudas del taller 2'
                  }
                  hint="Visible para los estudiantes inscritos en la tutoría."
                />

                <div className="md:col-span-2 flex flex-col sm:flex-row sm:items-end gap-2">
                  <FormInput
                    id="grabacion-activa"
                    type="url"
                    label="Enlace de Grabación (Opcional / Post-sesión)"
                    icon="play_circle"
                    value={grabacionActiva}
                    onChange={(e) => setGrabacionActiva(e.target.value)}
                    placeholder="https://drive.google.com/..."
                    hint="Se publicará automáticamente en Recursos al finalizar."
                    containerClassName="flex-1"
                  />
                  <Button
                    variant="primary"
                    onClick={guardarDetallesSesion}
                    loading={guardandoDetalles}
                    className="sm:mb-[22px] shrink-0"
                  >
                    <Icon className="text-[16px]">save</Icon>
                    <span>Guardar Configuración y Evidencia</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* Control de Asistencia */}
            <div className="space-y-3">
              {(() => {
                const estadosAsist = [
                  tutoriaSeleccionada.asistenciaEstudiante,
                  ...(tutoriaSeleccionada.participantes?.map((p) => p.asistio) || []),
                ];
                const asistieronCount = estadosAsist.filter((a) => a === true).length;
                const noAsistieronCount = estadosAsist.filter((a) => a === false).length;
                const pendientesCount = estadosAsist.filter(
                  (a) => a === null || a === undefined
                ).length;

                return (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="font-label-md text-label-md font-bold text-on-surface flex items-center gap-2">
                        <Icon className="text-primary text-[18px]">fact_check</Icon>
                        <span>Control de Asistencia ({estadosAsist.length} asistentes)</span>
                      </h4>
                      <span className="text-xs text-outline">
                        {asistieronCount} asistieron • {noAsistieronCount} no asistieron •{' '}
                        {pendientesCount} pendientes por marcar
                      </span>
                    </div>
                    <Button variant="tonal" size="sm" onClick={marcarTodosAsistio}>
                      <Icon className="text-[16px]">done_all</Icon>
                      <span>Marcar todos como Asistió</span>
                    </Button>
                  </div>
                );
              })()}

              <div className="rounded-xl bg-surface-container-low overflow-hidden divide-y divide-surface-container-highest">
                {tutoriaSeleccionada.estudiante && (
                  <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-surface-container transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-primary-fixed text-primary font-bold text-xs flex items-center justify-center shrink-0">
                        {getInitials(tutoriaSeleccionada.estudiante.nombre)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-label-md text-sm font-semibold text-on-surface truncate">
                            {tutoriaSeleccionada.estudiante.nombre}
                          </span>
                          <Badge variant="primary">Solicitante</Badge>
                        </div>
                        <span className="text-xs text-outline block truncate">
                          {tutoriaSeleccionada.estudiante.email}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto shrink-0">
                      <button
                        type="button"
                        onClick={() => marcarAsistenciaPrincipal(true)}
                        className={`inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg font-label-md text-xs font-semibold transition-all cursor-pointer active:scale-95 ${
                          tutoriaSeleccionada.asistenciaEstudiante === true
                            ? 'bg-[#16a34a] text-white shadow-xs'
                            : 'bg-surface-container-lowest text-on-surface-variant hover:bg-[#dcfce7] hover:text-[#166534]'
                        }`}
                      >
                        <Icon className="text-[15px]">check_circle</Icon>
                        <span>Asistió</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => marcarAsistenciaPrincipal(false)}
                        className={`inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg font-label-md text-xs font-semibold transition-all cursor-pointer active:scale-95 ${
                          tutoriaSeleccionada.asistenciaEstudiante === false
                            ? 'bg-error text-on-error shadow-xs'
                            : 'bg-surface-container-lowest text-on-surface-variant hover:bg-error-container hover:text-error'
                        }`}
                      >
                        <Icon className="text-[15px]">cancel</Icon>
                        <span>No asistió</span>
                      </button>
                    </div>
                  </div>
                )}

                {tutoriaSeleccionada.participantes?.map((part) => (
                  <div
                    key={part.estudiante._id}
                    className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-surface-container transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-secondary-fixed text-secondary font-bold text-xs flex items-center justify-center shrink-0">
                        {getInitials(part.estudiante.nombre)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-label-md text-sm font-semibold text-on-surface truncate">
                            {part.estudiante.nombre}
                          </span>
                          <Badge variant="secondary">Inscrito Grupal</Badge>
                        </div>
                        <span className="text-xs text-outline block truncate">
                          {part.estudiante.email}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto shrink-0">
                      <button
                        type="button"
                        onClick={() => marcarAsistenciaParticipante(part.estudiante._id, true)}
                        className={`inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg font-label-md text-xs font-semibold transition-all cursor-pointer active:scale-95 ${
                          part.asistio === true
                            ? 'bg-[#16a34a] text-white shadow-xs'
                            : 'bg-surface-container-lowest text-on-surface-variant hover:bg-[#dcfce7] hover:text-[#166534]'
                        }`}
                      >
                        <Icon className="text-[15px]">check_circle</Icon>
                        <span>Asistió</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => marcarAsistenciaParticipante(part.estudiante._id, false)}
                        className={`inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg font-label-md text-xs font-semibold transition-all cursor-pointer active:scale-95 ${
                          part.asistio === false
                            ? 'bg-error text-on-error shadow-xs'
                            : 'bg-surface-container-lowest text-on-surface-variant hover:bg-error-container hover:text-error'
                        }`}
                      >
                        <Icon className="text-[15px]">cancel</Icon>
                        <span>No asistió</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recursos y Documentos de la Sesión */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <h4 className="font-label-md text-label-md font-bold text-on-surface flex items-center gap-2">
                  <Icon className="text-primary text-[18px]">folder</Icon>
                  <span>Recursos y Documentos de la Clase</span>
                </h4>
                <span className="text-xs text-outline">
                  Al finalizar se publicarán en Recursos como &ldquo;Clase:{' '}
                  {tutoriaSeleccionada.materia}&rdquo;
                </span>
              </div>

              {tutoriaSeleccionada.recursos && tutoriaSeleccionada.recursos.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {tutoriaSeleccionada.recursos.map((link, idx) => (
                    <a
                      key={idx}
                      href={link}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2.5 rounded-lg bg-surface-container-low hover:bg-primary-fixed/40 flex items-center justify-between gap-2 text-xs text-primary font-medium transition-colors"
                    >
                      <span className="truncate">{link}</span>
                      <Icon className="text-[16px] shrink-0">open_in_new</Icon>
                    </a>
                  ))}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <FormInput
                  type="url"
                  icon="link"
                  placeholder="https://... (Enlace a guía, PDF, presentación o repositorio)"
                  value={nuevoRecurso}
                  onChange={(e) => setNuevoRecurso(e.target.value)}
                  containerClassName="flex-1"
                />
                <Button variant="tonal" onClick={agregarRecurso} className="w-full sm:w-auto shrink-0">
                  <Icon className="text-[18px]">add</Icon>
                  <span>Subir Recurso</span>
                </Button>
              </div>
            </div>

            {/* Finalizar, Aplazar o Cancelar Sesión Activa */}
            <div className="pt-4 border-t border-surface-container flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="tonal"
                  size="sm"
                  onClick={() => abrirModalGestion(tutoriaSeleccionada, 'aplazada')}
                >
                  <Icon className="text-[16px]">edit_calendar</Icon>
                  <span>Aplazar Sesión</span>
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => abrirModalCancelacion(tutoriaSeleccionada)}
                >
                  <Icon className="text-[16px]">cancel</Icon>
                  <span>Cancelar Sesión</span>
                </Button>
              </div>

              <Button
                variant="primary"
                onClick={() => finalizarTutoria(tutoriaSeleccionada._id)}
                className="w-full sm:w-auto text-center"
              >
                <Icon className="text-[18px]">task_alt</Icon>
                <span>Finalizar Clase y Guardar en Historial / Recursos</span>
              </Button>
            </div>
          </div>
        )}
      </SurfaceCard>

      {/* Modal Canónico para Aceptar / Configurar o Aplazar */}
      <Modal
        open={Boolean(modalGestion)}
        onClose={() => setModalGestion(null)}
        title={
          modalGestion?.accion === 'aceptada'
            ? 'Aceptar y Configurar Tutoría'
            : 'Aplazar / Reprogramar Tutoría'
        }
        subtitle={`${modalGestion?.solicitud.materia || ''} — ${
          modalGestion?.solicitud.estudiante?.nombre || ''
        }`}
        icon={modalGestion?.accion === 'aceptada' ? 'check_circle' : 'edit_calendar'}
        tone={modalGestion?.accion === 'aceptada' ? 'primary' : 'warning'}
        footer={
          <>
            <Button variant="subtle" size="sm" onClick={() => setModalGestion(null)}>
              Cerrar
            </Button>
            <Button
              type="submit"
              form="form-gestionar-solicitud"
              variant={modalGestion?.accion === 'aceptada' ? 'primary' : 'tertiary'}
              size="sm"
              loading={procesandoModal}
            >
              <Icon className="text-[16px]">check</Icon>
              <span>
                {modalGestion?.accion === 'aceptada' ? 'Confirmar Aceptación' : 'Confirmar Aplazamiento'}
              </span>
            </Button>
          </>
        }
      >
        <form id="form-gestionar-solicitud" onSubmit={confirmarGestion} className="space-y-3.5">
          {errorModalGestion && (
            <CalloutBanner tone="danger" title="Faltan datos requeridos">
              {errorModalGestion}
            </CalloutBanner>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormInput
              id="modal-fecha-propuesta"
              type="date"
              label={
                modalGestion?.accion === 'aplazada'
                  ? 'Nueva Fecha Propuesta'
                  : 'Fecha Confirmada'
              }
              icon="event"
              value={fechaModal}
              onChange={(e) => setFechaModal(e.target.value)}
              required
            />

            <FormInput
              id="modal-hora-propuesta"
              label={
                modalGestion?.accion === 'aplazada'
                  ? 'Nueva Franja Horaria'
                  : 'Franja Horaria Confirmada'
              }
              icon="schedule"
              value={horaPropuesta}
              onChange={(e) => setHoraPropuesta(e.target.value)}
              placeholder="Ej: Viernes 10:00 - 12:00"
              required
            />
          </div>

          {modalGestion?.accion === 'aceptada' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormSelect
                  id="modal-modalidad"
                  label="Modalidad"
                  icon={modalidad === 'presencial' ? 'location_on' : 'videocam'}
                  value={modalidad}
                  onChange={(e) => setModalidad(e.target.value as 'virtual' | 'presencial')}
                >
                  <option value="virtual">Virtual (Google Meet / Zoom)</option>
                  <option value="presencial">Presencial (En campus)</option>
                </FormSelect>

                <FormSelect
                  id="modal-tipo"
                  label="Tipo de Sesión"
                  icon={tipo === 'grupal' ? 'groups' : 'person'}
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value as 'individual' | 'grupal')}
                >
                  <option value="individual">Individual</option>
                  <option value="grupal">Grupal (Abierta a otros)</option>
                </FormSelect>
              </div>

              {tipo === 'grupal' && (
                <FormInput
                  id="modal-cupo"
                  type="number"
                  min={2}
                  max={50}
                  label="Cupo Máximo de Estudiantes"
                  icon="group_add"
                  value={cupoMaximo}
                  onChange={(e) => setCupoMaximo(Number(e.target.value))}
                />
              )}
              {modalGestion?.accion === 'aceptada' && modalidad === 'presencial' && (
                <FormInput
                  id="modal-lugar"
                  label="Lugar / Salón de la Tutoría Presencial *"
                  icon="location_on"
                  value={lugarModal}
                  onChange={(e) => setLugarModal(e.target.value)}
                  placeholder="Ej: Salón 202 - Edificio de Ingeniería"
                  required
                />
              )}
              {modalGestion?.accion === 'aceptada' && modalidad === 'virtual' && (
                <FormInput
                  id="modal-enlace-reunion"
                  type="url"
                  label="Enlace de la Reunión Virtual *"
                  icon="link"
                  value={enlaceReunionModal}
                  onChange={(e) => setEnlaceReunionModal(e.target.value)}
                  placeholder="https://meet.google.com/abc-defg-hij"
                  required
                />
              )}
            </>
          )}

          <FormTextarea
            id="modal-comentario"
            label={
              modalGestion?.accion === 'aplazada'
                ? 'Motivo del aplazamiento / Dificultad de agenda *'
                : 'Indicaciones adicionales para el estudiante (Opcional)'
            }
            value={comentarioModal}
            onChange={(e) => setComentarioModal(e.target.value)}
            rows={3}
            placeholder={
              modalGestion?.accion === 'aplazada'
                ? 'Ej: Tengo reunión de facultad en esa fecha, propongo reprogramar para el viernes.'
                : modalidad === 'virtual'
                ? 'Ej: Tener ejercicios listos y cámara activa'
                : 'Ej: Traer guía de ejercicios impresa o computador portátil'
            }
            required={modalGestion?.accion === 'aplazada'}
          />
        </form>
      </Modal>

      {/* Modal Canónico para Confirmar Cancelación */}
      <Modal
        open={Boolean(solicitudACancelar)}
        onClose={() => setSolicitudACancelar(null)}
        title="Confirmar Cancelación de Solicitud"
        subtitle={`${solicitudACancelar?.materia || ''} — ${
          solicitudACancelar?.estudiante?.nombre || ''
        }`}
        icon="warning"
        tone="danger"
        footer={
          <>
            <Button variant="subtle" size="sm" onClick={() => setSolicitudACancelar(null)}>
              Volver
            </Button>
            <Button
              type="submit"
              form="form-cancelar-solicitud"
              variant="danger"
              size="sm"
              loading={cancelando}
            >
              <Icon className="text-[16px]">cancel</Icon>
              <span>Sí, Cancelar Solicitud</span>
            </Button>
          </>
        }
      >
        <form id="form-cancelar-solicitud" onSubmit={confirmarCancelacion} className="space-y-3.5">
          <p className="font-body-md text-sm text-on-surface leading-relaxed">
            ¿Deseas cancelar la solicitud de <strong>{solicitudACancelar?.materia}</strong>
            {solicitudACancelar?.tema ? ` (${solicitudACancelar.tema})` : ''} enviada por{' '}
            <strong>{solicitudACancelar?.estudiante?.nombre}</strong>?
          </p>

          <FormTextarea
            id="modal-motivo-cancelacion"
            label="Motivo de cancelación (visible para el estudiante)"
            value={motivoCancelacion}
            onChange={(e) => setMotivoCancelacion(e.target.value)}
            rows={3}
            placeholder="Ej: Cruce con comité académico; por favor agenda en otra franja disponible."
            required
          />
        </form>
      </Modal>
    </div>
  );
}
