'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import api from '../../../../lib/api';
import { Icon } from '../../../../components/ui/Icon';
import { PageHeader } from '../../../../components/ui/PageHeader';
import { SearchInput } from '../../../../components/ui/SearchInput';
import { SurfaceCard } from '../../../../components/ui/SurfaceCard';
import { Badge } from '../../../../components/ui/Badge';
import { CalloutBanner } from '../../../../components/ui/CalloutBanner';

interface Tutoria {
  _id: string;
  materia: string;
  tema?: string;
  descripcion: string;
  hora?: string;
  modalidad?: string;
  tipo?: string;
  comentarioProfesor?: string;
  enlaceGrabacion?: string;
  estado: string;
  estudiante?: { _id: string; nombre: string };
  asistenciaEstudiante?: boolean | null;
  participantes?: { estudiante: { _id: string; nombre: string }; asistio?: boolean | null }[];
  profesor?: {
    nombre: string;
    email: string;
  };
  recursos?: string[];
}

export default function MisTutoriasEstudiantePage() {
  const { user } = useAuth();
  const [tutorias, setTutorias] = useState<Tutoria[]>([]);
  const [pestana, setPestana] = useState<'activas' | 'historial'>('activas');
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarTutorias = async () => {
      try {
        const res = await api.get('/tutorias');
        setTutorias(
          res.data.filter((t: Tutoria) => t.estado === 'aceptada' || t.estado === 'finalizada')
        );
      } catch (err) {
        console.error(err);
      } finally {
        setCargando(false);
      }
    };
    cargarTutorias();
  }, []);

  const obtenerMiAsistencia = (t: Tutoria): boolean | null | undefined => {
    if (t.estudiante?._id === user?.id) {
      return t.asistenciaEstudiante;
    }
    const part = t.participantes?.find((p) => p.estudiante?._id === user?.id);
    return part?.asistio;
  };

  const listaMostrar = tutorias
    .filter((t) => (pestana === 'activas' ? t.estado === 'aceptada' : t.estado === 'finalizada'))
    .filter((t) => {
      const q = busqueda.toLowerCase();
      if (!q) return true;
      return (
        t.materia.toLowerCase().includes(q) ||
        (t.tema && t.tema.toLowerCase().includes(q)) ||
        (t.profesor?.nombre && t.profesor.nombre.toLowerCase().includes(q))
      );
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
  const totalHistorial = tutorias.filter((t) => t.estado === 'finalizada').length;

  return (
    <div className="space-y-space-lg max-w-6xl mx-auto min-w-0">
      <PageHeader
        eyebrow="03. Agenda Académica"
        title="Mis Tutorías e Historial"
        description="Consulta tus sesiones programadas, enlaces de reunión, asistencia registrada y clases finalizadas."
        actions={
          <div className="grid grid-cols-2 sm:flex w-full sm:w-auto bg-surface-container-low p-1 rounded-xl gap-1">
            <button
              type="button"
              onClick={() => setPestana('activas')}
              className={`inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-4 py-2 rounded-lg font-label-md text-xs sm:text-[13px] font-semibold transition-all cursor-pointer ${
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
              onClick={() => setPestana('historial')}
              className={`inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-4 py-2 rounded-lg font-label-md text-xs sm:text-[13px] font-semibold transition-all cursor-pointer ${
                pestana === 'historial'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
              }`}
            >
              <Icon className="text-[16px]">history_edu</Icon>
              <span className="truncate">Historial ({totalHistorial})</span>
            </button>
          </div>
        }
      />

      {/* Resumen KPI Cards (Patrón Canónico Sección 05) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-space-md">
        <SurfaceCard
          tone="lowest"
          className="p-4 sm:p-space-md flex items-center justify-between gap-3"
        >
          <div className="min-w-0">
            <span className="font-label-md text-[11px] uppercase text-outline font-semibold tracking-wider block">
              Sesiones Activas Programadas
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
              Disponibles con acceso a sala o aula
            </span>
          </div>
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-primary-fixed flex items-center justify-center text-primary shrink-0">
            <Icon className="text-[22px] sm:text-[24px]">calendar_month</Icon>
          </div>
        </SurfaceCard>

        <SurfaceCard
          tone="lowest"
          className="p-4 sm:p-space-md flex items-center justify-between gap-3"
        >
          <div className="min-w-0">
            <span className="font-label-md text-[11px] uppercase text-outline font-semibold tracking-wider block">
              Tutorías Completadas
            </span>
            <div className="flex flex-wrap items-baseline gap-2 mt-1">
              <span className="font-headline-lg text-2xl font-bold text-on-surface">
                {totalHistorial}
              </span>
              <Badge variant="primary">Historial</Badge>
            </div>
            <span className="text-on-surface-variant font-label-md text-[11px] mt-1 block">
              Con registro de asistencia y grabaciones
            </span>
          </div>
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-secondary-fixed flex items-center justify-center text-secondary shrink-0">
            <Icon className="text-[22px] sm:text-[24px]">verified</Icon>
          </div>
        </SurfaceCard>
      </div>

      {tutorias.length > 0 && (
        <SurfaceCard tone="lowest" className="p-4 sm:p-space-md">
          <div className="max-w-lg">
            <SearchInput
              placeholder="Filtrar sesiones por materia, tema o profesor..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              onClear={() => setBusqueda('')}
            />
          </div>
        </SurfaceCard>
      )}

      {listaMostrar.length === 0 ? (
        <SurfaceCard tone="lowest" className="p-8 sm:p-10 text-center space-y-2">
          <Icon className="text-outline text-[36px]">
            {pestana === 'activas' ? 'event_busy' : 'history'}
          </Icon>
          <p className="text-sm text-on-surface-variant">
            {busqueda
              ? `No se encontraron tutorías que coincidan con "${busqueda}".`
              : pestana === 'activas'
              ? 'No tienes tutorías activas programadas en este momento.'
              : 'Aún no tienes tutorías finalizadas en tu historial.'}
          </p>
        </SurfaceCard>
      ) : (
        <div className="space-y-4 sm:space-y-space-md">
          {listaMostrar.map((tutoria) => {
            const miAsistencia = obtenerMiAsistencia(tutoria);
            return (
              <SurfaceCard
                key={tutoria._id}
                as="article"
                tone="lowest"
                interactive
                className="p-4 sm:p-space-lg space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                  <div className="space-y-2 min-w-0 flex-1">
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

                    <div className="flex flex-col xs:flex-row flex-wrap gap-x-5 gap-y-1.5 text-xs text-on-surface-variant pt-1">
                      <span className="inline-flex flex-wrap items-center gap-1 min-w-0">
                        <Icon className="text-[16px] text-primary">person</Icon>
                        <span>Docente:</span>
                        <strong className="font-semibold text-on-surface break-words">
                          {tutoria.profesor?.nombre}
                        </strong>
                        {tutoria.profesor?.email && (
                          <span className="text-outline break-all">
                            ({tutoria.profesor.email})
                          </span>
                        )}
                      </span>
                      <span className="inline-flex flex-wrap items-center gap-1 min-w-0">
                        <Icon className="text-[16px] text-outline">schedule</Icon>
                        <span>Horario:</span>
                        <strong className="font-semibold text-on-surface break-words">
                          {tutoria.hora || 'Por definir'}
                        </strong>
                      </span>
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

                {tutoria.comentarioProfesor && (
                  <CalloutBanner
                    tone="info"
                    icon={tutoria.modalidad === 'presencial' ? 'location_on' : 'videocam'}
                    title={
                      tutoria.modalidad === 'presencial'
                        ? 'Ubicación / Salón Asignado'
                        : 'Enlace e Indicaciones de la Sesión'
                    }
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

                {tutoria.enlaceGrabacion && (
                  <CalloutBanner
                    tone="success"
                    icon="play_circle"
                    title="Grabación de la Clase Disponible"
                  >
                    <a
                      href={tutoria.enlaceGrabacion}
                      target="_blank"
                      rel="noreferrer"
                      className="underline font-semibold text-[#166534] hover:opacity-80 break-all inline-flex items-center gap-1"
                    >
                      <span>{tutoria.enlaceGrabacion}</span>
                      <Icon className="text-[14px]">open_in_new</Icon>
                    </a>
                  </CalloutBanner>
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
