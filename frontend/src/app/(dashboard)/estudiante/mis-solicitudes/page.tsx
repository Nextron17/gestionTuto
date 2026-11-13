'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../context/AuthContext';
import api from '../../../../lib/api';
import { Icon } from '../../../../components/ui/Icon';
import { PageHeader } from '../../../../components/ui/PageHeader';
import { SearchInput } from '../../../../components/ui/SearchInput';
import { SurfaceCard } from '../../../../components/ui/SurfaceCard';
import { Button } from '../../../../components/ui/Button';
import { CalloutBanner } from '../../../../components/ui/CalloutBanner';
import {
  CambioEstadoNotificacion,
  ETIQUETAS_ESTADO,
  Solicitud,
  notificarCambioEstadoTutoria,
} from '../../../../components/estudiante/mis-solicitudes/types';
import { TarjetaSolicitudEstudiante } from '../../../../components/estudiante/mis-solicitudes/TarjetaSolicitudEstudiante';
import { ModalCancelarSolicitudEstudiante } from '../../../../components/estudiante/mis-solicitudes/ModalCancelarSolicitudEstudiante';

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

    const intervalId = setInterval(() => {
      cargarSolicitudesAPI();
    }, 4000);

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
          {solicitudesFiltradas.map((sol) => (
            <TarjetaSolicitudEstudiante
              key={sol._id}
              sol={sol}
              recienActualizada={idsResaltados.includes(sol._id)}
              userNombre={user?.nombre}
              abrirModalCancelar={abrirModalCancelar}
              onNavigate={(url) => router.push(url)}
            />
          ))}
        </div>
      )}

      <ModalCancelarSolicitudEstudiante
        solicitudACancelar={solicitudACancelar}
        onClose={() => setSolicitudACancelar(null)}
        cancelando={cancelando}
        confirmarCancelacion={confirmarCancelacion}
        errorCancelacion={errorCancelacion}
        motivoCancelacionEst={motivoCancelacionEst}
        setMotivoCancelacionEst={setMotivoCancelacionEst}
      />
    </div>
  );
}
