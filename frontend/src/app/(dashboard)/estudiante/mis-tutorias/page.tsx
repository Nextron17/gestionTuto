'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import api from '../../../../lib/api';
import { Icon } from '../../../../components/ui/Icon';
import { PageHeader } from '../../../../components/ui/PageHeader';
import { SearchInput } from '../../../../components/ui/SearchInput';
import { SurfaceCard } from '../../../../components/ui/SurfaceCard';
import { Badge } from '../../../../components/ui/Badge';
import { Button } from '../../../../components/ui/Button';
import { CalloutBanner } from '../../../../components/ui/CalloutBanner';
import { FormInput, FormSelect } from '../../../../components/ui/FormField';

interface Tutoria {
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

function formatearFechaTutoria(fechaIso?: string): string {
  if (!fechaIso) return 'Por confirmar';
  const d = new Date(fechaIso);
  if (Number.isNaN(d.getTime())) return 'Por confirmar';
  return d.toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function toInputDateValue(fechaIso?: string): string {
  if (!fechaIso) return '';
  const d = new Date(fechaIso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

export default function MisTutoriasEstudiantePage() {
  const { user } = useAuth();
  const [tutorias, setTutorias] = useState<Tutoria[]>([]);
  const [pestana, setPestana] = useState<'activas' | 'grabaciones' | 'historial'>('activas');
  const [busqueda, setBusqueda] = useState('');
  const [filtroMateria, setFiltroMateria] = useState('');
  const [filtroModalidad, setFiltroModalidad] = useState('');
  const [filtroAsistencia, setFiltroAsistencia] = useState('');
  const [filtroFecha, setFiltroFecha] = useState('');
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [claveCopiada, setClaveCopiada] = useState<string | null>(null);

  const cargarTutorias = useCallback(async (esManual = false) => {
    if (esManual) {
      setActualizando(true);
    }
    try {
      const res = await api.get('/tutorias');
      const lista: Tutoria[] = (res.data || []).filter(
        (t: Tutoria) => t.estado === 'aceptada' || t.estado === 'finalizada'
      );
      setTutorias(lista);
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
      await cargarTutorias();
      if (!cancelado) {
        setCargando(false);
      }
    };
    cargarInicial();

    let channel: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      channel = new BroadcastChannel('gestiontuto_solicitudes_sync');
      channel.onmessage = () => {
        cargarTutorias();
      };
    }

    const onStorage = (event: StorageEvent) => {
      if (event.key === 'gestiontuto_last_tutoria_update') {
        cargarTutorias();
      }
    };

    const onFocusOrVisible = () => {
      if (document.visibilityState === 'visible') {
        cargarTutorias();
      }
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', onFocusOrVisible);
    document.addEventListener('visibilitychange', onFocusOrVisible);

    return () => {
      cancelado = true;
      if (channel) {
        channel.close();
      }
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('focus', onFocusOrVisible);
      document.removeEventListener('visibilitychange', onFocusOrVisible);
    };
  }, [cargarTutorias]);

  const copiarEnlace = async (url: string, clave: string) => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setClaveCopiada(clave);
        setTimeout(() => setClaveCopiada(null), 2000);
      }
    } catch {
      // Ignorar si el portapapeles no está disponible
    }
  };

  const obtenerMiAsistencia = (t: Tutoria): boolean | null => {
    if (typeof t.miAsistencia === 'boolean' || t.miAsistencia === null) {
      return t.miAsistencia;
    }
    if (t.estudiante?._id === user?.id) {
      return t.asistenciaEstudiante ?? null;
    }
    const part = t.participantes?.find((p) => p.estudiante?._id === user?.id);
    return part?.asistio ?? null;
  };

  const materiasDisponibles = Array.from(
    new Set(tutorias.map((t) => t.materia).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));

  const hayFiltrosActivos = Boolean(
    busqueda.trim() || filtroMateria || filtroModalidad || filtroAsistencia || filtroFecha
  );

  const limpiarFiltros = () => {
    setBusqueda('');
    setFiltroMateria('');
    setFiltroModalidad('');
    setFiltroAsistencia('');
    setFiltroFecha('');
  };

  const listaMostrar = tutorias
    .filter((t) => {
      if (pestana === 'activas') return t.estado === 'aceptada';
      if (pestana === 'grabaciones') return Boolean(t.enlaceGrabacion && t.enlaceGrabacion.trim());
      return t.estado === 'finalizada';
    })
    .filter((t) => {
      const q = busqueda.trim().toLowerCase();
      if (q) {
        const coincideTexto =
          t.materia.toLowerCase().includes(q) ||
          (t.tema && t.tema.toLowerCase().includes(q)) ||
          (t.profesor?.nombre && t.profesor.nombre.toLowerCase().includes(q));
        if (!coincideTexto) return false;
      }

      if (filtroMateria && t.materia !== filtroMateria) {
        return false;
      }

      if (filtroModalidad && (t.modalidad || 'virtual') !== filtroModalidad) {
        return false;
      }

      if (filtroAsistencia) {
        const asis = obtenerMiAsistencia(t);
        if (filtroAsistencia === 'asistio' && asis !== true) return false;
        if (filtroAsistencia === 'no_asistio' && asis !== false) return false;
        if (filtroAsistencia === 'pendiente' && asis !== null) return false;
      }

      if (filtroFecha) {
        const fechaTutoria = toInputDateValue(t.fechaPropuesta || t.createdAt);
        if (fechaTutoria !== filtroFecha) return false;
      }

      return true;
    });

  if (cargando) {
    return (
      <div className="max-w-6xl mx-auto py-8 text-sm text-on-surface-variant flex items-center gap-2">
        <Icon className="text-primary animate-pulse">hourglass_top</Icon>
        <span>Cargando mis tutorías...</span>
      </div>
    );
  }

  const totalActivas = tutorias.filter((t) => t.estado === 'aceptada').length;
  const totalGrabaciones = tutorias.filter(
    (t) => Boolean(t.enlaceGrabacion && t.enlaceGrabacion.trim())
  ).length;
  const tutoriasFinalizadas = tutorias.filter((t) => t.estado === 'finalizada');
  const totalHistorial = tutoriasFinalizadas.length;
  const totalAsistidas = tutorias.filter((t) => obtenerMiAsistencia(t) === true).length;
  const totalConRegistroAsistencia = tutorias.filter(
    (t) => typeof obtenerMiAsistencia(t) === 'boolean'
  ).length;
  const porcentajeAsistencia =
    totalConRegistroAsistencia > 0
      ? Math.round((totalAsistidas / totalConRegistroAsistencia) * 100)
      : null;

  return (
    <div className="space-y-space-lg max-w-6xl mx-auto min-w-0">
      <PageHeader
        eyebrow="03. Agenda Académica e Historial"
        title="Mis Tutorías e Historial"
        description="Consulta tus sesiones programadas, tu historial de tutorías recibidas, modalidad, enlaces y asistencia registrada."
        actions={
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="grid grid-cols-3 sm:flex flex-1 sm:flex-initial bg-surface-container-low p-1 rounded-xl gap-1">
              <button
                type="button"
                onClick={() => setPestana('activas')}
                className={`inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-lg font-label-md text-xs sm:text-[13px] font-semibold transition-all cursor-pointer ${
                  pestana === 'activas'
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                }`}
              >
                <Icon className="text-[16px]">event_available</Icon>
                <span className="truncate">Activas ({totalActivas})</span>
              </button>
              <button
                type="button"
                onClick={() => setPestana('grabaciones')}
                className={`inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-lg font-label-md text-xs sm:text-[13px] font-semibold transition-all cursor-pointer ${
                  pestana === 'grabaciones'
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                }`}
              >
                <Icon className="text-[16px]">play_circle</Icon>
                <span className="truncate">Grabaciones ({totalGrabaciones})</span>
              </button>
              <button
                type="button"
                onClick={() => setPestana('historial')}
                className={`inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-lg font-label-md text-xs sm:text-[13px] font-semibold transition-all cursor-pointer ${
                  pestana === 'historial'
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                }`}
              >
                <Icon className="text-[16px]">history_edu</Icon>
                <span className="truncate">Historial ({totalHistorial})</span>
              </button>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              loading={actualizando}
              onClick={() => cargarTutorias(true)}
            >
              <Icon className="text-[16px]">refresh</Icon>
              <span className="hidden sm:inline">Actualizar</span>
            </Button>
          </div>
        }
      />

      {/* Resumen KPI Cards (HU-17 / HU-18) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-space-md">
        <SurfaceCard
          tone="lowest"
          className="p-4 sm:p-space-md flex items-center justify-between gap-3"
        >
          <div className="min-w-0">
            <span className="font-label-md text-[11px] uppercase text-outline font-semibold tracking-wider block">
              Sesiones Activas
            </span>
            <div className="flex flex-wrap items-baseline gap-2 mt-1">
              <span className="font-headline-lg text-2xl font-bold text-on-surface">
                {totalActivas}
              </span>
              <Badge variant="success" dot>
                Confirmadas
              </Badge>
            </div>
            <span className="text-on-surface-variant font-label-md text-[11px] mt-1 block">
              Con enlace o aula asignada
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-primary-fixed flex items-center justify-center text-primary shrink-0">
            <Icon className="text-[22px]">calendar_month</Icon>
          </div>
        </SurfaceCard>

        <SurfaceCard
          tone="lowest"
          className="p-4 sm:p-space-md flex items-center justify-between gap-3"
        >
          <div className="min-w-0">
            <span className="font-label-md text-[11px] uppercase text-outline font-semibold tracking-wider block">
              Tutorías Recibidas
            </span>
            <div className="flex flex-wrap items-baseline gap-2 mt-1">
              <span className="font-headline-lg text-2xl font-bold text-on-surface">
                {totalHistorial}
              </span>
              <Badge variant="primary">Historial</Badge>
            </div>
            <span className="text-on-surface-variant font-label-md text-[11px] mt-1 block">
              Sesiones completadas
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-secondary-fixed flex items-center justify-center text-secondary shrink-0">
            <Icon className="text-[22px]">history_edu</Icon>
          </div>
        </SurfaceCard>

        <SurfaceCard
          tone="lowest"
          className="p-4 sm:p-space-md flex items-center justify-between gap-3"
        >
          <div className="min-w-0">
            <span className="font-label-md text-[11px] uppercase text-outline font-semibold tracking-wider block">
              Asistencia Registrada
            </span>
            <div className="flex flex-wrap items-baseline gap-2 mt-1">
              <span className="font-headline-lg text-2xl font-bold text-on-surface">
                {totalAsistidas}
              </span>
              {porcentajeAsistencia !== null && (
                <Badge variant="success">{porcentajeAsistencia}%</Badge>
              )}
            </div>
            <span className="text-on-surface-variant font-label-md text-[11px] mt-1 block">
              {totalConRegistroAsistencia > 0
                ? `${totalAsistidas} de ${totalConRegistroAsistencia} evaluadas`
                : 'Sin registros evaluados aún'}
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[#16a34a]/15 flex items-center justify-center text-[#16a34a] shrink-0">
            <Icon className="text-[22px]">how_to_reg</Icon>
          </div>
        </SurfaceCard>

        <SurfaceCard
          tone="lowest"
          className="p-4 sm:p-space-md flex items-center justify-between gap-3"
        >
          <div className="min-w-0">
            <span className="font-label-md text-[11px] uppercase text-outline font-semibold tracking-wider block">
              Grabaciones
            </span>
            <div className="flex flex-wrap items-baseline gap-2 mt-1">
              <span className="font-headline-lg text-2xl font-bold text-on-surface">
                {totalGrabaciones}
              </span>
              <Badge variant="secondary">Repaso</Badge>
            </div>
            <span className="text-on-surface-variant font-label-md text-[11px] mt-1 block">
              Exclusivas para inscritos
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-primary-fixed/60 flex items-center justify-center text-primary shrink-0">
            <Icon className="text-[22px]">video_library</Icon>
          </div>
        </SurfaceCard>
      </div>

      {/* Filtros completos de historial y sesiones (HU-18) */}
      {tutorias.length > 0 && (
        <SurfaceCard tone="lowest" className="p-4 sm:p-space-md space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
            <div className="lg:col-span-2">
              <SearchInput
                placeholder="Buscar por materia, tema o profesor..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                onClear={() => setBusqueda('')}
              />
            </div>

            <FormSelect
              id="filtro-historial-materia"
              label="Materia"
              icon="menu_book"
              value={filtroMateria}
              onChange={(e) => setFiltroMateria(e.target.value)}
            >
              <option value="">Todas las materias</option>
              {materiasDisponibles.map((mat) => (
                <option key={mat} value={mat}>
                  {mat}
                </option>
              ))}
            </FormSelect>

            <FormSelect
              id="filtro-historial-modalidad"
              label="Modalidad"
              icon="videocam"
              value={filtroModalidad}
              onChange={(e) => setFiltroModalidad(e.target.value)}
            >
              <option value="">Todas</option>
              <option value="virtual">Virtual</option>
              <option value="presencial">Presencial</option>
            </FormSelect>

            <FormSelect
              id="filtro-historial-asistencia"
              label="Asistencia"
              icon="how_to_reg"
              value={filtroAsistencia}
              onChange={(e) => setFiltroAsistencia(e.target.value)}
            >
              <option value="">Todas</option>
              <option value="asistio">Asistió</option>
              <option value="no_asistio">No asistió</option>
              <option value="pendiente">Pendiente</option>
            </FormSelect>
          </div>

          <div className="flex flex-wrap items-end justify-between gap-3 pt-1">
            <div className="w-full sm:w-56">
              <FormInput
                id="filtro-historial-fecha"
                type="date"
                label="Filtrar por fecha"
                icon="event"
                value={filtroFecha}
                onChange={(e) => setFiltroFecha(e.target.value)}
              />
            </div>

            {hayFiltrosActivos && (
              <Button type="button" variant="subtle" size="sm" onClick={limpiarFiltros}>
                <Icon className="text-[16px]">filter_alt_off</Icon>
                <span>Limpiar filtros</span>
              </Button>
            )}
          </div>
        </SurfaceCard>
      )}

      {listaMostrar.length === 0 ? (
        <SurfaceCard tone="lowest" className="p-8 sm:p-10 text-center space-y-2">
          <Icon className="text-outline text-[36px]">
            {pestana === 'activas'
              ? 'event_busy'
              : pestana === 'grabaciones'
              ? 'video_library'
              : 'history'}
          </Icon>
          <p className="text-sm text-on-surface-variant">
            {hayFiltrosActivos
              ? 'No se encontraron tutorías que coincidan con los filtros seleccionados.'
              : pestana === 'activas'
              ? 'No tienes tutorías activas programadas en este momento.'
              : pestana === 'grabaciones'
              ? 'Todavía no hay grabaciones disponibles en tus tutorías inscritas.'
              : 'Aún no tienes tutorías finalizadas en tu historial.'}
          </p>
        </SurfaceCard>
      ) : (
        <div className="space-y-4 sm:space-y-space-md">
          {listaMostrar.map((tutoria) => {
            const miAsistencia = obtenerMiAsistencia(tutoria);
            const enlaceReunionDisponible = Boolean(
              tutoria.enlaceReunion && tutoria.enlaceReunion.trim()
            );
            const enlaceGrabacionDisponible = Boolean(
              tutoria.enlaceGrabacion && tutoria.enlaceGrabacion.trim()
            );
            const mostrarPanelEnlaces =
              tutoria.modalidad !== 'presencial' ||
              enlaceReunionDisponible ||
              enlaceGrabacionDisponible;
            const fechaLegible = formatearFechaTutoria(
              tutoria.fechaPropuesta || tutoria.createdAt
            );

            return (
              <SurfaceCard
                key={tutoria._id}
                as="article"
                tone="lowest"
                interactive
                className="p-4 sm:p-space-lg space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                  <div className="space-y-2.5 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-label-md text-[15px] sm:text-base font-bold text-on-surface group-hover:text-primary transition-colors break-words">
                        {tutoria.materia} {tutoria.tema ? `• ${tutoria.tema}` : ''}
                      </h2>
                      <Badge variant="primary" pill={false} className="capitalize">
                        <Icon className="text-[14px]">
                          {tutoria.modalidad === 'presencial' ? 'location_on' : 'videocam'}
                        </Icon>
                        <span>{tutoria.modalidad || 'Virtual'}</span>
                      </Badge>
                      <Badge variant="secondary" pill={false} className="capitalize">
                        <Icon className="text-[14px]">
                          {tutoria.tipo === 'grupal' ? 'groups' : 'person'}
                        </Icon>
                        <span>{tutoria.tipo || 'Individual'}</span>
                      </Badge>
                    </div>

                    <p className="font-body-md text-on-surface-variant text-[13px] leading-relaxed break-words">
                      {tutoria.descripcion}
                    </p>

                    {/* HU-18: Ficha explícita con Materia, Tema, Profesor, Fecha, Modalidad y Asistencia */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
                      <div className="p-2.5 rounded-lg bg-surface-container-low min-w-0">
                        <span className="text-[10px] uppercase tracking-wider font-bold text-outline block">
                          Materia
                        </span>
                        <span className="text-xs font-semibold text-on-surface flex items-center gap-1.5 mt-0.5 break-words">
                          <Icon className="text-[15px] text-primary shrink-0">menu_book</Icon>
                          <span>{tutoria.materia}</span>
                        </span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-surface-container-low min-w-0">
                        <span className="text-[10px] uppercase tracking-wider font-bold text-outline block">
                          Tema
                        </span>
                        <span className="text-xs font-semibold text-on-surface flex items-center gap-1.5 mt-0.5 break-words">
                          <Icon className="text-[15px] text-secondary shrink-0">topic</Icon>
                          <span>{tutoria.tema || 'General'}</span>
                        </span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-surface-container-low min-w-0">
                        <span className="text-[10px] uppercase tracking-wider font-bold text-outline block">
                          Profesor
                        </span>
                        <span className="text-xs font-semibold text-on-surface flex items-center gap-1.5 mt-0.5 break-words">
                          <Icon className="text-[15px] text-primary shrink-0">person</Icon>
                          <span>{tutoria.profesor?.nombre || 'Docente asignado'}</span>
                        </span>
                        {tutoria.profesor?.email && (
                          <span className="text-[11px] text-outline block truncate pl-5">
                            {tutoria.profesor.email}
                          </span>
                        )}
                      </div>

                      <div className="p-2.5 rounded-lg bg-surface-container-low min-w-0">
                        <span className="text-[10px] uppercase tracking-wider font-bold text-outline block">
                          Fecha y Franja
                        </span>
                        <span className="text-xs font-semibold text-on-surface flex items-center gap-1.5 mt-0.5">
                          <Icon className="text-[15px] text-tertiary shrink-0">event</Icon>
                          <span>{fechaLegible}</span>
                        </span>
                        <span className="text-[11px] text-on-surface-variant block truncate pl-5">
                          {tutoria.hora || 'Por definir'}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-surface-container-low min-w-0">
                        <span className="text-[10px] uppercase tracking-wider font-bold text-outline block">
                          Modalidad
                        </span>
                        <span className="text-xs font-semibold text-on-surface capitalize flex items-center gap-1.5 mt-0.5">
                          <Icon className="text-[15px] text-primary shrink-0">
                            {tutoria.modalidad === 'presencial' ? 'location_on' : 'videocam'}
                          </Icon>
                          <span>{tutoria.modalidad || 'Virtual'}</span>
                        </span>
                        {tutoria.modalidad === 'presencial' && tutoria.lugar && (
                          <span className="text-[11px] text-on-surface-variant block truncate pl-5">
                            {tutoria.lugar}
                          </span>
                        )}
                      </div>

                      <div className="p-2.5 rounded-lg bg-surface-container-low min-w-0">
                        <span className="text-[10px] uppercase tracking-wider font-bold text-outline block">
                          Asistencia
                        </span>
                        <span
                          className={`text-xs font-bold flex items-center gap-1.5 mt-0.5 ${
                            miAsistencia === true
                              ? 'text-[#15803d]'
                              : miAsistencia === false
                              ? 'text-error'
                              : 'text-on-surface-variant'
                          }`}
                        >
                          <Icon className="text-[15px] shrink-0">
                            {miAsistencia === true
                              ? 'check_circle'
                              : miAsistencia === false
                              ? 'cancel'
                              : 'schedule'}
                          </Icon>
                          <span>
                            {miAsistencia === true
                              ? 'Asistió'
                              : miAsistencia === false
                              ? 'No asistió'
                              : 'Pendiente de registro'}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap sm:flex-col items-center sm:items-end justify-between gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-surface-container shrink-0">
                    <Badge
                      variant={tutoria.estado === 'aceptada' ? 'success' : 'primary'}
                      dot
                      className="capitalize"
                    >
                      {tutoria.estado === 'aceptada' ? 'Confirmada' : 'Finalizada'}
                    </Badge>

                    <Badge
                      variant={
                        miAsistencia === true
                          ? 'success'
                          : miAsistencia === false
                          ? 'error'
                          : 'neutral'
                      }
                    >
                      <Icon className="text-[14px]">
                        {miAsistencia === true
                          ? 'check_circle'
                          : miAsistencia === false
                          ? 'cancel'
                          : 'schedule'}
                      </Icon>
                      <span>
                        Asistencia:{' '}
                        {miAsistencia === true
                          ? 'Asististe'
                          : miAsistencia === false
                          ? 'No asististe'
                          : 'Pendiente'}
                      </span>
                    </Badge>
                  </div>
                </div>

                {tutoria.modalidad === 'presencial' && tutoria.lugar && (
                  <CalloutBanner
                    tone="primary"
                    icon="location_on"
                    title="Lugar / Salón Presencial"
                  >
                    {tutoria.lugar}
                  </CalloutBanner>
                )}

                {/* HU-17: Enlace de reunión virtual y grabación exclusivos para estudiantes inscritos */}
                {mostrarPanelEnlaces && (
                  <div className="p-3.5 sm:p-space-md rounded-xl bg-primary-fixed/25 border border-primary/20 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-label-md text-xs font-bold text-primary flex items-center gap-1.5">
                        <Icon className="text-[17px]">verified_user</Icon>
                        <span>Acceso a Reunión Virtual y Grabación</span>
                      </span>
                      <Badge variant="success" pill={false}>
                        Exclusivo para estudiantes inscritos
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg bg-surface-container-lowest space-y-2 min-w-0">
                        <span className="text-[11px] font-label-md font-semibold uppercase tracking-wider text-outline flex items-center gap-1">
                          <Icon className="text-[15px] text-primary">videocam</Icon>
                          <span>Enlace de Reunión</span>
                        </span>
                        {enlaceReunionDisponible ? (
                          <>
                            <p className="text-xs font-mono text-on-surface truncate">
                              {tutoria.enlaceReunion}
                            </p>
                            <div className="flex flex-wrap items-center gap-2">
                              <a
                                href={tutoria.enlaceReunion}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:opacity-90 transition-opacity"
                              >
                                <Icon className="text-[15px]">video_call</Icon>
                                <span>Conectarme a la Reunión</span>
                                <Icon className="text-[13px]">open_in_new</Icon>
                              </a>
                              <Button
                                type="button"
                                variant="subtle"
                                size="sm"
                                onClick={() =>
                                  copiarEnlace(
                                    tutoria.enlaceReunion || '',
                                    `reunion-${tutoria._id}`
                                  )
                                }
                              >
                                <Icon className="text-[15px]">
                                  {claveCopiada === `reunion-${tutoria._id}`
                                    ? 'check'
                                    : 'content_copy'}
                                </Icon>
                                <span>
                                  {claveCopiada === `reunion-${tutoria._id}`
                                    ? 'Copiado'
                                    : 'Copiar'}
                                </span>
                              </Button>
                            </div>
                          </>
                        ) : (
                          <p className="text-xs text-on-surface-variant">
                            {tutoria.modalidad === 'presencial'
                              ? 'Esta tutoría es presencial; no requiere enlace de videollamada.'
                              : 'El profesor aún no ha publicado el enlace de la reunión.'}
                          </p>
                        )}
                      </div>

                      <div className="p-3 rounded-lg bg-surface-container-lowest space-y-2 min-w-0">
                        <span className="text-[11px] font-label-md font-semibold uppercase tracking-wider text-outline flex items-center gap-1">
                          <Icon className="text-[15px] text-[#16a34a]">play_circle</Icon>
                          <span>Grabación para Repasar</span>
                        </span>
                        {enlaceGrabacionDisponible ? (
                          <>
                            <p className="text-xs font-mono text-on-surface truncate">
                              {tutoria.enlaceGrabacion}
                            </p>
                            <div className="flex flex-wrap items-center gap-2">
                              <a
                                href={tutoria.enlaceGrabacion}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#16a34a] text-white text-xs font-semibold hover:opacity-90 transition-opacity"
                              >
                                <Icon className="text-[15px]">play_arrow</Icon>
                                <span>Ver Grabación</span>
                                <Icon className="text-[13px]">open_in_new</Icon>
                              </a>
                              <Button
                                type="button"
                                variant="subtle"
                                size="sm"
                                onClick={() =>
                                  copiarEnlace(
                                    tutoria.enlaceGrabacion || '',
                                    `grab-${tutoria._id}`
                                  )
                                }
                              >
                                <Icon className="text-[15px]">
                                  {claveCopiada === `grab-${tutoria._id}`
                                    ? 'check'
                                    : 'content_copy'}
                                </Icon>
                                <span>
                                  {claveCopiada === `grab-${tutoria._id}` ? 'Copiado' : 'Copiar'}
                                </span>
                              </Button>
                            </div>
                          </>
                        ) : (
                          <p className="text-xs text-on-surface-variant">
                            {tutoria.estado === 'aceptada'
                              ? 'La grabación estará disponible cuando el profesor finalice la tutoría.'
                              : 'El profesor no registró enlace de grabación para esta sesión.'}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {tutoria.comentarioProfesor && (
                  <CalloutBanner
                    tone="info"
                    icon="comment"
                    title="Indicaciones u Observaciones del Docente"
                  >
                    {tutoria.comentarioProfesor.startsWith('http') ? (
                      <a
                        href={tutoria.comentarioProfesor}
                        target="_blank"
                        rel="noreferrer"
                        className="underline font-semibold text-primary hover:text-primary-container break-all inline-flex items-center gap-1"
                      >
                        <span>{tutoria.comentarioProfesor}</span>
                        <Icon className="text-[14px]">open_in_new</Icon>
                      </a>
                    ) : (
                      tutoria.comentarioProfesor
                    )}
                  </CalloutBanner>
                )}

                {tutoria.tipo === 'grupal' && (
                  <div className="p-3 rounded-xl bg-surface-container-low space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="font-bold text-on-surface flex items-center gap-1.5">
                        <Icon className="text-[16px] text-secondary">groups</Icon>
                        <span>Participantes de la tutoría grupal</span>
                      </span>
                      <Badge variant="secondary" pill={false}>
                        {1 + (tutoria.participantes?.length || 0)}
                        {tutoria.cupoMaximo && tutoria.cupoMaximo > 0
                          ? ` / ${tutoria.cupoMaximo} cupos`
                          : ' inscritos'}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {tutoria.estudiante?.nombre && (
                        <Badge variant="neutral" pill={false}>
                          {tutoria.estudiante.nombre}
                          {tutoria.estudiante._id === user?.id ? ' (Tú • Solicitante)' : ''}
                        </Badge>
                      )}
                      {(tutoria.participantes || []).map((part, idx) => (
                        <Badge key={part.estudiante?._id || idx} variant="primary" pill={false}>
                          {part.estudiante?.nombre || 'Estudiante'}
                          {part.estudiante?._id === user?.id ? ' (Tú • Participante)' : ''}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {tutoria.recursos && tutoria.recursos.length > 0 && (
                  <div className="p-3.5 sm:p-space-md rounded-xl bg-surface-container-low space-y-2 min-w-0">
                    <h3 className="font-label-md text-xs font-bold text-on-surface flex items-center gap-1.5">
                      <Icon className="text-[16px] text-primary">folder</Icon>
                      <span>Documentos y Materiales de la Sesión</span>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {tutoria.recursos.map((link, idx) => (
                        <a
                          key={idx}
                          href={link}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2.5 rounded-lg bg-surface-container-lowest hover:bg-primary-fixed/40 flex items-center justify-between gap-2 text-xs text-primary font-medium transition-colors min-w-0"
                        >
                          <span className="truncate">{link}</span>
                          <Icon className="text-[16px] shrink-0">download</Icon>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </SurfaceCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
