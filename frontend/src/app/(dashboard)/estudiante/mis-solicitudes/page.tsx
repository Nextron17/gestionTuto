'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../context/AuthContext';
import api from '../../../../lib/api';
import { Icon } from '../../../../components/ui/Icon';
import { PageHeader } from '../../../../components/ui/PageHeader';
import { SearchInput } from '../../../../components/ui/SearchInput';
import { SurfaceCard } from '../../../../components/ui/SurfaceCard';
import { Badge } from '../../../../components/ui/Badge';
import { Button } from '../../../../components/ui/Button';
import { CalloutBanner } from '../../../../components/ui/CalloutBanner';
import { Modal } from '../../../../components/ui/Modal';
import { FormTextarea } from '../../../../components/ui/FormField';

interface Solicitud {
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

interface CambioEstadoNotificacion {
  id: string;
  materia: string;
  tema?: string;
  estadoAnterior: string;
  estadoNuevo: string;
}

const ETIQUETAS_ESTADO: Record<string, string> = {
  pendiente: 'Pendiente',
  aceptada: 'Aceptada',
  aplazada: 'Aplazada',
  cancelada: 'Cancelada',
  finalizada: 'Finalizada',
};

function formatearFecha(fechaIso?: string): string | null {
  if (!fechaIso) return null;
  const parsed = new Date(fechaIso);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleString('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function renderEstadoCita(estado: string) {
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

export default function MisSolicitudesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [solicitudACancelar, setSolicitudACancelar] = useState<Solicitud | null>(null);
  const [motivoCancelacionEst, setMotivoCancelacionEst] = useState('');
  const [cancelando, setCancelando] = useState(false);
  const [errorCancelacion, setErrorCancelacion] = useState<string | null>(null);
  const [mensajeCancelacionExito, setMensajeCancelacionExito] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [ultimaSincronizacion, setUltimaSincronizacion] = useState<string>('');
  const [cambiosRecientes, setCambiosRecientes] = useState<CambioEstadoNotificacion[]>([]);
  const [idsResaltados, setIdsResaltados] = useState<string[]>([]);

  const estadosPreviosRef = useRef<Record<string, string> | null>(null);

  const cargarSolicitudesAPI = useCallback(async (esManual = false) => {
    if (esManual) {
      setActualizando(true);
    }
    try {
      const res = await api.get('/tutorias');
      const data: Solicitud[] = res.data || [];

      if (estadosPreviosRef.current !== null) {
        const nuevosCambios: CambioEstadoNotificacion[] = [];
        for (const sol of data) {
          const previo = estadosPreviosRef.current[sol._id];
          if (previo && previo !== sol.estado) {
            nuevosCambios.push({
              id: sol._id,
              materia: sol.materia,
              tema: sol.tema,
              estadoAnterior: previo,
              estadoNuevo: sol.estado,
            });
          }
        }
        if (nuevosCambios.length > 0) {
          setCambiosRecientes(nuevosCambios);
          setIdsResaltados((prev) =>
            Array.from(new Set([...prev, ...nuevosCambios.map((c) => c.id)]))
          );
        }
      }

      const mapaActual: Record<string, string> = {};
      for (const sol of data) {
        mapaActual[sol._id] = sol.estado;
      }
      estadosPreviosRef.current = mapaActual;

      setSolicitudes(data);
      setUltimaSincronizacion(
        new Date().toLocaleTimeString('es-CO', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    } catch (err) {
      console.error(err);
    } finally {
      if (esManual) {
        setActualizando(false);
      }
    }
  }, []);

  useEffect(() => {
    let cancelado = false;

    const cargarInicial = async () => {
      await cargarSolicitudesAPI();
      if (!cancelado) {
        setCargando(false);
      }
    };
    cargarInicial();

    // Polling frecuente para reflejar apenas el profesor responda desde cualquier dispositivo
    const intervalId = setInterval(() => {
      cargarSolicitudesAPI();
    }, 4000);

    // Sincronización instantánea entre pestañas/ventanas cuando el profesor responde
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

    const onFocusOrVisible = () => {
      if (document.visibilityState === 'visible') {
        cargarSolicitudesAPI();
      }
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', onFocusOrVisible);
    document.addEventListener('visibilitychange', onFocusOrVisible);

    return () => {
      cancelado = true;
      clearInterval(intervalId);
      if (channel) {
        channel.close();
      }
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('focus', onFocusOrVisible);
      document.removeEventListener('visibilitychange', onFocusOrVisible);
    };
  }, [cargarSolicitudesAPI]);

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

  const abrirModalCancelar = (sol: Solicitud) => {
    setSolicitudACancelar(sol);
    setMotivoCancelacionEst('');
    setErrorCancelacion(null);
  };

  const confirmarCancelacion = async () => {
    if (!solicitudACancelar) return;
    setCancelando(true);
    setErrorCancelacion(null);
    try {
      await api.patch(`/tutorias/${solicitudACancelar._id}/cancelar`, {
        motivoCancelacion: motivoCancelacionEst.trim() || undefined,
      });
      notificarCambioEstadoTutoria(solicitudACancelar._id, 'cancelada');
      await cargarSolicitudesAPI();
      const horarioLib = solicitudACancelar.hora ? ` (${solicitudACancelar.hora})` : '';
      const profLib = solicitudACancelar.profesor?.nombre || 'el profesor';
      setMensajeCancelacionExito(
        `Tu solicitud de ${solicitudACancelar.materia} fue cancelada y el horario${horarioLib} de ${profLib} quedó liberado.`
      );
      setSolicitudACancelar(null);
      setMotivoCancelacionEst('');
    } catch (err) {
      console.error(err);
      setErrorCancelacion('No se pudo cancelar la solicitud. Intenta nuevamente.');
    } finally {
      setCancelando(false);
    }
  };

  const solicitudesFiltradas = solicitudes.filter((sol) => {
    const coincideEstado = filtroEstado === 'todos' || sol.estado === filtroEstado;
    const q = busqueda.toLowerCase();
    if (!q) return coincideEstado;
    const coincideTexto =
      sol.materia.toLowerCase().includes(q) ||
      (sol.tema && sol.tema.toLowerCase().includes(q)) ||
      (sol.profesor?.nombre && sol.profesor.nombre.toLowerCase().includes(q)) ||
      sol.estado.toLowerCase().includes(q);
    return coincideEstado && coincideTexto;
  });

  if (cargando) {
    return (
      <div className="max-w-6xl mx-auto py-8 text-sm text-on-surface-variant flex items-center gap-2">
        <Icon className="text-primary animate-pulse">hourglass_top</Icon>
        <span>Cargando mis solicitudes...</span>
      </div>
    );
  }

  const conteos = {
    todos: solicitudes.length,
    pendiente: solicitudes.filter((s) => s.estado === 'pendiente').length,
    aceptada: solicitudes.filter((s) => s.estado === 'aceptada').length,
    aplazada: solicitudes.filter((s) => s.estado === 'aplazada').length,
    cancelada: solicitudes.filter((s) => s.estado === 'cancelada').length,
  };

  const estadosFiltro = [
    { id: 'todos', label: `Todas (${conteos.todos})` },
    { id: 'pendiente', label: `Pendientes (${conteos.pendiente})` },
    { id: 'aceptada', label: `Aceptadas (${conteos.aceptada})` },
    { id: 'aplazada', label: `Aplazadas (${conteos.aplazada})` },
    { id: 'cancelada', label: `Canceladas (${conteos.cancelada})` },
  ];

  const kpisEstado = [
    {
      id: 'pendiente',
      titulo: 'Pendientes',
      valor: conteos.pendiente,
      subtitulo: 'En espera de respuesta',
      icon: 'hourglass_top',
      colorIcon: 'text-amber-600 bg-amber-500/10',
    },
    {
      id: 'aceptada',
      titulo: 'Aceptadas',
      valor: conteos.aceptada,
      subtitulo: 'Prepárate para la tutoría',
      icon: 'check_circle',
      colorIcon: 'text-[#16a34a] bg-[#16a34a]/10',
    },
    {
      id: 'aplazada',
      titulo: 'Aplazadas',
      valor: conteos.aplazada,
      subtitulo: 'Reprogramadas por docente',
      icon: 'event_repeat',
      colorIcon: 'text-primary bg-primary-fixed/40',
    },
    {
      id: 'cancelada',
      titulo: 'Canceladas',
      valor: conteos.cancelada,
      subtitulo: 'Busca otra opción',
      icon: 'cancel',
      colorIcon: 'text-error bg-error-container/40',
    },
  ];

  return (
    <div className="space-y-space-lg max-w-6xl mx-auto min-w-0">
      <PageHeader
        eyebrow="02. Seguimiento de Citas"
        title="Mis Solicitudes"
        description="Seguimiento inmediato del estado de tus peticiones: si fueron aceptadas, aplazadas o canceladas por el profesor."
        actions={
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 w-full sm:w-auto">
            {solicitudes.length > 0 && (
              <div className="w-full sm:w-72">
                <SearchInput
                  placeholder="Buscar por materia, docente o estado..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  onClear={() => setBusqueda('')}
                />
              </div>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              loading={actualizando}
              onClick={() => cargarSolicitudesAPI(true)}
            >
              <Icon className="text-[16px]">refresh</Icon>
              <span>Actualizar</span>
            </Button>
          </div>
        }
      />

      {/* Indicador de actualización en tiempo real */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 rounded-xl bg-surface-container-low text-xs text-on-surface-variant">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-[#16a34a] animate-pulse" />
          <span className="font-medium text-on-surface">
            Seguimiento en tiempo real activo
          </span>
          <span className="hidden sm:inline">
            • El estado se actualiza automáticamente apenas el profesor responde.
          </span>
        </div>
        {ultimaSincronizacion && (
          <span className="font-label-md text-[11px] text-outline">
            Última sincronización: {ultimaSincronizacion}
          </span>
        )}
      </div>

      {/* Notificación inmediata cuando cambia el estado de alguna solicitud */}
      {cambiosRecientes.length > 0 && (
        <CalloutBanner
          tone="info"
          icon="notifications_active"
          title="¡Actualización recibida del profesor!"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <ul className="space-y-1 text-xs">
              {cambiosRecientes.map((c) => (
                <li key={c.id}>
                  Tu solicitud de <strong>{c.materia}</strong>
                  {c.tema ? ` (${c.tema})` : ''} pasó de{' '}
                  <strong>{ETIQUETAS_ESTADO[c.estadoAnterior] || c.estadoAnterior}</strong> a{' '}
                  <strong>{ETIQUETAS_ESTADO[c.estadoNuevo] || c.estadoNuevo}</strong>.
                </li>
              ))}
            </ul>
            <Button
              type="button"
              variant="subtle"
              size="sm"
              onClick={() => setCambiosRecientes([])}
            >
              Entendido
            </Button>
          </div>
        </CalloutBanner>
      )}

      {mensajeCancelacionExito && (
        <CalloutBanner
          tone="success"
          icon="event_available"
          title="Solicitud cancelada y horario liberado"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-xs">{mensajeCancelacionExito}</span>
            <Button
              type="button"
              variant="subtle"
              size="sm"
              onClick={() => setMensajeCancelacionExito(null)}
            >
              Cerrar
            </Button>
          </div>
        </CalloutBanner>
      )}

      {/* Resumen por estado (HU-14) */}
      {solicitudes.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {kpisEstado.map((kpi) => {
            const seleccionado = filtroEstado === kpi.id;
            return (
              <button
                key={kpi.id}
                type="button"
                onClick={() => setFiltroEstado(seleccionado ? 'todos' : kpi.id)}
                className={`text-left p-3.5 rounded-2xl transition-all cursor-pointer border ${
                  seleccionado
                    ? 'bg-primary-fixed/30 border-primary/40 shadow-xs'
                    : 'bg-surface-container-lowest border-outline-variant/20 hover:bg-surface-container-low'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-label-md text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">
                    {kpi.titulo}
                  </span>
                  <span className={`p-1.5 rounded-lg inline-flex ${kpi.colorIcon}`}>
                    <Icon className="text-[16px]">{kpi.icon}</Icon>
                  </span>
                </div>
                <p className="font-display-md text-2xl font-bold text-on-surface mt-1">
                  {kpi.valor}
                </p>
                <p className="text-[11px] text-on-surface-variant mt-0.5 truncate">
                  {kpi.subtitulo}
                </p>
              </button>
            );
          })}
        </div>
      )}

      {solicitudes.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {estadosFiltro.map((est) => {
            const activo = filtroEstado === est.id;
            return (
              <button
                key={est.id}
                type="button"
                onClick={() => setFiltroEstado(est.id)}
                className={`px-3 sm:px-3.5 py-1.5 rounded-full font-label-md text-[12px] font-semibold transition-all cursor-pointer active:scale-95 ${
                  activo
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface'
                }`}
              >
                {est.label}
              </button>
            );
          })}
        </div>
      )}

      {solicitudes.length === 0 ? (
        <SurfaceCard tone="lowest" className="p-8 sm:p-10 text-center space-y-3">
          <Icon className="text-outline text-[36px]">pending_actions</Icon>
          <p className="text-sm text-on-surface-variant">
            No has solicitado ninguna tutoría todavía.
          </p>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => router.push('/estudiante/buscar-tutorias')}
          >
            <Icon className="text-[16px]">search</Icon>
            <span>Buscar Horarios y Solicitar Tutoría</span>
          </Button>
        </SurfaceCard>
      ) : solicitudesFiltradas.length === 0 ? (
        <SurfaceCard tone="lowest" className="p-8 sm:p-10 text-center space-y-2">
          <Icon className="text-outline text-[36px]">search_off</Icon>
          <p className="text-sm text-on-surface-variant">
            No hay solicitudes que coincidan con los filtros seleccionados.
          </p>
        </SurfaceCard>
      ) : (
        <div className="space-y-4 sm:space-y-space-md">
          {solicitudesFiltradas.map((sol) => {
            const recienActualizada = idsResaltados.includes(sol._id);
            const fechaRespuestaTxt = formatearFecha(sol.fechaRespuestaProfesor || sol.updatedAt);

            return (
              <SurfaceCard
                key={sol._id}
                as="article"
                tone="lowest"
                interactive
                className={`p-4 sm:p-space-lg flex flex-col justify-between gap-4 ${
                  recienActualizada ? 'ring-2 ring-primary/40' : ''
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-4">
                  <div className="space-y-2 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-label-md text-[15px] sm:text-base font-bold text-on-surface group-hover:text-primary transition-colors break-words">
                        {sol.materia} {sol.tema ? `• ${sol.tema}` : ''}
                      </h2>
                      {recienActualizada && (
                        <Badge variant="primary" pill={false}>
                          <Icon className="text-[14px]">bolt</Icon>
                          <span>Actualizada</span>
                        </Badge>
                      )}
                      {sol.modalidad && (
                        <Badge variant="neutral" pill={false} className="capitalize">
                          <Icon className="text-[14px]">
                            {sol.modalidad === 'presencial' ? 'location_on' : 'videocam'}
                          </Icon>
                          <span>{sol.modalidad}</span>
                        </Badge>
                      )}
                      {sol.tipo && (
                        <Badge
                          variant={sol.tipo === 'grupal' ? 'secondary' : 'neutral'}
                          pill={false}
                          className="capitalize"
                        >
                          <Icon className="text-[14px]">
                            {sol.tipo === 'grupal' ? 'groups' : 'person'}
                          </Icon>
                          <span>{sol.tipo}</span>
                        </Badge>
                      )}
                    </div>

                    <p className="font-body-md text-on-surface-variant text-[13px] leading-relaxed break-words">
                      {sol.descripcion}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-2 text-xs text-on-surface-variant pt-1">
                      <span className="inline-flex items-center gap-1.5 min-w-0">
                        <Icon className="text-[16px] text-secondary">school</Icon>
                        <span>Estudiante:</span>
                        <strong className="font-semibold text-on-surface break-words">
                          {sol.estudiante?.nombre || user?.nombre || 'Estudiante'}
                        </strong>
                      </span>
                      <span className="inline-flex items-center gap-1.5 min-w-0">
                        <Icon className="text-[16px] text-primary">person</Icon>
                        <span>Profesor:</span>
                        <strong className="font-semibold text-on-surface break-words">
                          {sol.profesor?.nombre || 'Por asignar'}
                        </strong>
                      </span>
                      <span className="inline-flex items-center gap-1.5 min-w-0">
                        <Icon className="text-[16px] text-primary">menu_book</Icon>
                        <span>Materia:</span>
                        <strong className="font-semibold text-on-surface break-words">
                          {sol.materia}
                        </strong>
                      </span>
                      <span className="inline-flex items-center gap-1.5 min-w-0">
                        <Icon className="text-[16px] text-primary">topic</Icon>
                        <span>Tema:</span>
                        <strong className="font-semibold text-on-surface break-words">
                          {sol.tema || 'General'}
                        </strong>
                      </span>
                      <span className="inline-flex items-center gap-1.5 min-w-0 sm:col-span-2">
                        <Icon className="text-[16px] text-outline">schedule</Icon>
                        <span>Horario elegido:</span>
                        <strong className="font-semibold text-on-surface break-words">
                          {sol.hora || 'No definido'}
                        </strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap sm:flex-col items-center sm:items-end justify-between gap-2.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-surface-container shrink-0">
                    {renderEstadoCita(sol.estado)}

                    {(sol.estado === 'pendiente' || sol.estado === 'aplazada') && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => abrirModalCancelar(sol)}
                      >
                        <Icon className="text-[16px]">delete_forever</Icon>
                        <span>Cancelar Solicitud</span>
                      </Button>
                    )}
                  </div>
                </div>

                {/* Guía accionable según respuesta del profesor (HU-14) */}
                {sol.estado === 'aceptada' && (
                  <div className="rounded-xl bg-[#16a34a]/10 border border-[#16a34a]/25 p-3.5 space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-bold text-[#15803d] flex items-center gap-1.5">
                        <Icon className="text-[17px]">event_available</Icon>
                        <span>
                          ¡Solicitud aceptada! Ya puedes prepararte para tu tutoría.
                        </span>
                      </p>
                      {fechaRespuestaTxt && (
                        <span className="text-[11px] text-on-surface-variant">
                          Respondida: {fechaRespuestaTxt}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-on-surface">
                      {sol.modalidad === 'presencial' && sol.lugar && (
                        <span className="inline-flex items-center gap-1 bg-surface-container-lowest px-2.5 py-1 rounded-lg">
                          <Icon className="text-[15px] text-primary">location_on</Icon>
                          <span>Lugar: {sol.lugar}</span>
                        </span>
                      )}
                      {sol.modalidad !== 'presencial' && sol.enlaceReunion && (
                        <a
                          href={sol.enlaceReunion}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 bg-surface-container-lowest text-primary font-semibold px-2.5 py-1 rounded-lg hover:bg-surface-container transition-colors"
                        >
                          <Icon className="text-[15px]">videocam</Icon>
                          <span>Enlace de reunión</span>
                          <Icon className="text-[14px]">open_in_new</Icon>
                        </a>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => router.push('/estudiante/mis-tutorias')}
                      >
                        <Icon className="text-[15px]">cast_for_education</Icon>
                        <span>Ir a Mis Tutorías</span>
                      </Button>
                      <Button
                        type="button"
                        variant="subtle"
                        size="sm"
                        onClick={() =>
                          router.push(`/estudiante/recursos?q=${encodeURIComponent(sol.materia)}`)
                        }
                      >
                        <Icon className="text-[15px]">auto_stories</Icon>
                        <span>Prepararme con Recursos</span>
                      </Button>
                    </div>
                  </div>
                )}

                {sol.estado === 'aplazada' && (
                  <div className="rounded-xl bg-primary-fixed/30 border border-primary/20 p-3.5 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-bold text-primary flex items-center gap-1.5">
                        <Icon className="text-[17px]">event_repeat</Icon>
                        <span>
                          Solicitud aplazada por el profesor. Verifica la nueva franja o busca otra
                          opción.
                        </span>
                      </p>
                      {fechaRespuestaTxt && (
                        <span className="text-[11px] text-on-surface-variant">
                          Respondida: {fechaRespuestaTxt}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          router.push(
                            `/estudiante/buscar-tutorias?q=${encodeURIComponent(sol.materia)}`
                          )
                        }
                      >
                        <Icon className="text-[15px]">search</Icon>
                        <span>Buscar otra opción de tutoría</span>
                      </Button>
                    </div>
                  </div>
                )}

                {sol.estado === 'cancelada' && (
                  <div className="rounded-xl bg-error-container/30 border border-error/20 p-3.5 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-bold text-error flex items-center gap-1.5">
                        <Icon className="text-[17px]">event_busy</Icon>
                        <span>
                          {sol.canceladaPor === 'estudiante'
                            ? 'Cancelada por ti — El horario del profesor quedó liberado.'
                            : 'Esta solicitud fue cancelada por el profesor. Puedes buscar otro horario o docente disponible.'}
                        </span>
                      </p>
                      {(formatearFecha(sol.fechaCancelacion) || fechaRespuestaTxt) && (
                        <span className="text-[11px] text-on-surface-variant">
                          Actualizada: {formatearFecha(sol.fechaCancelacion) || fechaRespuestaTxt}
                        </span>
                      )}
                    </div>
                    {sol.motivoCancelacion && (
                      <p className="text-xs text-on-surface-variant">
                        <strong>Motivo registrado:</strong> {sol.motivoCancelacion}
                      </p>
                    )}
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() =>
                        router.push(
                          `/estudiante/buscar-tutorias?q=${encodeURIComponent(sol.materia)}`
                        )
                      }
                    >
                      <Icon className="text-[15px]">search</Icon>
                      <span>Buscar otra opción para {sol.materia}</span>
                    </Button>
                  </div>
                )}

                {sol.estado === 'pendiente' && (
                  <p className="text-[11px] text-on-surface-variant flex items-center gap-1.5">
                    <Icon className="text-[15px] text-amber-600">schedule_send</Icon>
                    <span>
                      Esperando respuesta de {sol.profesor?.nombre || 'tu profesor'}. El estado se
                      actualizará automáticamente apenas responda.
                    </span>
                  </p>
                )}

                {sol.comentarioProfesor && (
                  <CalloutBanner
                    tone="info"
                    icon="comment"
                    title="Observación del Docente"
                  >
                    {sol.comentarioProfesor}
                  </CalloutBanner>
                )}
              </SurfaceCard>
            );
          })}
        </div>
      )}

      {/* Modal Canónico de Confirmación de Cancelación (HU-15) */}
      <Modal
        open={Boolean(solicitudACancelar)}
        onClose={() => setSolicitudACancelar(null)}
        title="Cancelar Solicitud y Liberar Horario"
        icon="warning"
        tone="danger"
        footer={
          <>
            <Button
              variant="subtle"
              size="sm"
              onClick={() => setSolicitudACancelar(null)}
            >
              Mantener Solicitud
            </Button>
            <Button
              variant="danger"
              size="sm"
              loading={cancelando}
              onClick={confirmarCancelacion}
            >
              Sí, Cancelar y Liberar Horario
            </Button>
          </>
        }
      >
        {errorCancelacion && (
          <CalloutBanner tone="danger" title="Error">
            {errorCancelacion}
          </CalloutBanner>
        )}

        <p className="font-body-md text-sm text-on-surface leading-relaxed">
          ¿Estás seguro de que deseas cancelar tu solicitud de{' '}
          <strong>{solicitudACancelar?.materia}</strong>
          {solicitudACancelar?.tema ? ` (${solicitudACancelar.tema})` : ''} con{' '}
          <strong>{solicitudACancelar?.profesor?.nombre || 'el docente asignado'}</strong>
          {solicitudACancelar?.hora ? (
            <>
              {' '}
              en el horario <strong>{solicitudACancelar.hora}</strong>
            </>
          ) : null}
          ?
        </p>

        <FormTextarea
          id="motivo-cancelacion-estudiante"
          label="Motivo de cancelación (opcional)"
          value={motivoCancelacionEst}
          onChange={(e) => setMotivoCancelacionEst(e.target.value)}
          rows={2}
          placeholder="Ej: Tengo cruce con otra clase o ya logré resolver la duda..."
        />

        <div className="p-space-sm rounded-lg bg-surface-container text-on-surface-variant font-label-md text-[12px] flex items-start gap-2">
          <Icon className="text-primary text-[16px] shrink-0 mt-0.5">event_available</Icon>
          <span>
            Al cancelar, liberarás inmediatamente esta franja en la agenda del profesor para que
            pueda atender a otros estudiantes.
          </span>
        </div>
      </Modal>
    </div>
  );
}
