'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import api from '../../../../lib/api';
import { Icon } from '../../../../components/ui/Icon';
import { PageHeader } from '../../../../components/ui/PageHeader';
import { SurfaceCard } from '../../../../components/ui/SurfaceCard';
import { Button } from '../../../../components/ui/Button';
import { Tutoria, toInputDateValue } from '../../../../components/estudiante/mis-tutorias/types';
import { MisTutoriasKpisFiltros } from '../../../../components/estudiante/mis-tutorias/MisTutoriasKpisFiltros';
import { TarjetaTutoriaEstudiante } from '../../../../components/estudiante/mis-tutorias/TarjetaTutoriaEstudiante';

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
                className={`inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-lg font-label-md text-xs sm:text-[13px] font-semibold transition-all cursor-pointer ${pestana === 'activas'
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
                className={`inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-lg font-label-md text-xs sm:text-[13px] font-semibold transition-all cursor-pointer ${pestana === 'grabaciones'
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
                className={`inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-lg font-label-md text-xs sm:text-[13px] font-semibold transition-all cursor-pointer ${pestana === 'historial'
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

      <MisTutoriasKpisFiltros
        totalActivas={totalActivas}
        totalHistorial={totalHistorial}
        totalAsistidas={totalAsistidas}
        totalConRegistroAsistencia={totalConRegistroAsistencia}
        porcentajeAsistencia={porcentajeAsistencia}
        totalGrabaciones={totalGrabaciones}
        mostrarFiltros={tutorias.length > 0}
        busqueda={busqueda}
        setBusqueda={setBusqueda}
        filtroMateria={filtroMateria}
        setFiltroMateria={setFiltroMateria}
        materiasDisponibles={materiasDisponibles}
        filtroModalidad={filtroModalidad}
        setFiltroModalidad={setFiltroModalidad}
        filtroAsistencia={filtroAsistencia}
        setFiltroAsistencia={setFiltroAsistencia}
        filtroFecha={filtroFecha}
        setFiltroFecha={setFiltroFecha}
        hayFiltrosActivos={hayFiltrosActivos}
        limpiarFiltros={limpiarFiltros}
      />

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
          {listaMostrar.map((tutoria) => (
            <TarjetaTutoriaEstudiante
              key={tutoria._id}
              tutoria={tutoria}
              miAsistencia={obtenerMiAsistencia(tutoria)}
              userId={user?.id}
              claveCopiada={claveCopiada}
              copiarEnlace={copiarEnlace}
            />
          ))}
        </div>
      )}
    </div>
  );
}
