'use client';

import { useEffect, useState } from 'react';
import api from '../../../../lib/api';
import { Icon } from '../../../../components/ui/Icon';
import { PageHeader } from '../../../../components/ui/PageHeader';
import { SearchInput } from '../../../../components/ui/SearchInput';
import { FormSelect } from '../../../../components/ui/FormField';
import { SurfaceCard } from '../../../../components/ui/SurfaceCard';
import { Badge } from '../../../../components/ui/Badge';
import { CalloutBanner } from '../../../../components/ui/CalloutBanner';

interface EstudianteInfo {
  _id: string;
  nombre: string;
  email: string;
}

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
  recursos?: string[];
  estudiante?: EstudianteInfo;
  asistenciaEstudiante?: boolean | null;
  participantes?: { estudiante: EstudianteInfo; asistio?: boolean | null }[];
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
}

export default function MisTutoriasProfesorPage() {
  const [tutorias, setTutorias] = useState<Tutoria[]>([]);
  const [filtroMateria, setFiltroMateria] = useState('');
  const [filtroModalidad, setFiltroModalidad] = useState('');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarTutorias = async () => {
      try {
        const res = await api.get('/tutorias');
        setTutorias(
          res.data.filter((t: Tutoria) => t.estado === 'finalizada' || t.estado === 'aceptada')
        );
      } catch (err) {
        console.error(err);
      } finally {
        setCargando(false);
      }
    };
    cargarTutorias();
  }, []);

  const filtradas = tutorias.filter((t) => {
    const q = filtroMateria.toLowerCase();
    const okMat =
      !q ||
      t.materia.toLowerCase().includes(q) ||
      (t.tema && t.tema.toLowerCase().includes(q)) ||
      (t.estudiante?.nombre && t.estudiante.nombre.toLowerCase().includes(q));
    const okMod = !filtroModalidad || t.modalidad === filtroModalidad;
    return okMat && okMod;
  });

  if (cargando) {
    return (
      <div className="max-w-6xl mx-auto py-8 text-sm text-on-surface-variant flex items-center gap-2">
        <Icon className="text-primary animate-pulse">hourglass_top</Icon>
        <span>Cargando historial de tutorías...</span>
      </div>
    );
  }

  const totalFinalizadas = tutorias.filter((t) => t.estado === 'finalizada').length;
  const totalEnCurso = tutorias.filter((t) => t.estado === 'aceptada').length;

  return (
    <div className="space-y-space-lg max-w-6xl mx-auto">
      <PageHeader
        eyebrow="03. Registro Académico"
        title="Historial de Tutorías Dictadas"
        description="Consulta el registro de sesiones realizadas, control de asistencias, grabaciones y material compartido."
      />

      {/* Resumen KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-md">
        <SurfaceCard tone="lowest" className="p-space-md flex items-center justify-between">
          <div>
            <span className="font-label-md text-[11px] uppercase text-outline font-semibold tracking-wider block">
              Total Sesiones
            </span>
            <span className="font-headline-lg text-2xl font-bold text-on-surface mt-1 block">
              {tutorias.length}
            </span>
            <span className="text-on-surface-variant font-label-md text-[11px] mt-0.5 block">
              Individuales y grupales
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-primary-fixed flex items-center justify-center text-primary shrink-0">
            <Icon className="text-[24px]">school</Icon>
          </div>
        </SurfaceCard>

        <SurfaceCard tone="lowest" className="p-space-md flex items-center justify-between">
          <div>
            <span className="font-label-md text-[11px] uppercase text-outline font-semibold tracking-wider block">
              Tutorías Finalizadas
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-headline-lg text-2xl font-bold text-on-surface">
                {totalFinalizadas}
              </span>
              <Badge variant="success" dot>
                Completadas
              </Badge>
            </div>
            <span className="text-on-surface-variant font-label-md text-[11px] mt-0.5 block">
              Con asistencia registrada
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#dcfce7] flex items-center justify-center text-[#16a34a] shrink-0">
            <Icon className="text-[24px]">verified</Icon>
          </div>
        </SurfaceCard>

        <SurfaceCard tone="lowest" className="p-space-md flex items-center justify-between">
          <div>
            <span className="font-label-md text-[11px] uppercase text-outline font-semibold tracking-wider block">
              Sesiones Activas
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-headline-lg text-2xl font-bold text-on-surface">
                {totalEnCurso}
              </span>
              <Badge variant="primary">En agenda</Badge>
            </div>
            <span className="text-on-surface-variant font-label-md text-[11px] mt-0.5 block">
              Pendientes por concluir
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-secondary-fixed flex items-center justify-center text-secondary shrink-0">
            <Icon className="text-[24px]">event_available</Icon>
          </div>
        </SurfaceCard>
      </div>

      {/* Filtros HU-09 */}
      <SurfaceCard tone="lowest" className="p-space-md space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md items-end">
          <SearchInput
            id="filtro-materia-prof"
            label="Buscar por Materia, Tema o Estudiante"
            placeholder="Ej: Cálculo, Estructuras de Datos..."
            value={filtroMateria}
            onChange={(e) => setFiltroMateria(e.target.value)}
            onClear={() => setFiltroMateria('')}
          />

          <FormSelect
            id="filtro-modalidad-prof"
            label="Filtrar por Modalidad"
            icon="filter_list"
            value={filtroModalidad}
            onChange={(e) => setFiltroModalidad(e.target.value)}
          >
            <option value="">Todas las modalidades</option>
            <option value="virtual">Virtual</option>
            <option value="presencial">Presencial</option>
          </FormSelect>
        </div>

        {(filtroMateria || filtroModalidad) && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="font-label-md text-[11px] text-outline font-semibold uppercase tracking-wider">
              Filtros activos:
            </span>
            {filtroMateria && (
              <Badge variant="neutral" onRemove={() => setFiltroMateria('')}>
                Búsqueda: {filtroMateria}
              </Badge>
            )}
            {filtroModalidad && (
              <Badge
                variant="primary"
                onRemove={() => setFiltroModalidad('')}
                className="capitalize"
              >
                Modalidad: {filtroModalidad}
              </Badge>
            )}
          </div>
        )}
      </SurfaceCard>

      {filtradas.length === 0 ? (
        <SurfaceCard tone="lowest" className="p-10 text-center space-y-2">
          <Icon className="text-outline text-[36px]">history</Icon>
          <p className="text-sm text-on-surface-variant">
            No hay tutorías registradas con esos criterios.
          </p>
        </SurfaceCard>
      ) : (
        <div className="space-y-space-md">
          {filtradas.map((tutoria) => (
            <SurfaceCard
              key={tutoria._id}
              as="article"
              tone="lowest"
              interactive
              className="p-4 sm:p-space-lg space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-label-md text-base font-bold text-on-surface group-hover:text-primary transition-colors break-words">
                      {tutoria.materia} {tutoria.tema ? `• ${tutoria.tema}` : ''}
                    </h3>
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

                  <p className="text-xs text-on-surface-variant flex flex-wrap items-center gap-1.5">
                    <Icon className="text-[15px] text-outline shrink-0">schedule</Icon>
                    <span>Horario:</span>
                    <strong className="font-semibold text-on-surface">
                      {tutoria.hora || 'N/A'}
                    </strong>
                  </p>
                </div>

                <Badge
                  variant={tutoria.estado === 'finalizada' ? 'success' : 'primary'}
                  dot
                  className="capitalize self-start shrink-0"
                >
                  {tutoria.estado}
                </Badge>
              </div>

              {tutoria.comentarioProfesor && (
                <CalloutBanner
                  tone="info"
                  icon={tutoria.modalidad === 'presencial' ? 'location_on' : 'videocam'}
                  title="Comentario / Salón / Enlace de Reunión"
                >
                  {tutoria.comentarioProfesor}
                </CalloutBanner>
              )}

              {/* Lista de Asistencia */}
              <div className="p-3.5 sm:p-space-md rounded-xl bg-surface-container-low space-y-2.5">
                <p className="font-label-md text-xs font-bold text-on-surface flex items-center gap-1.5">
                  <Icon className="text-[16px] text-primary">fact_check</Icon>
                  <span>Registro de Asistencia</span>
                </p>

                <div className="divide-y divide-surface-container-highest">
                  {tutoria.estudiante && (
                    <div className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-primary-fixed text-primary font-bold text-[11px] flex items-center justify-center shrink-0">
                          {getInitials(tutoria.estudiante.nombre)}
                        </div>
                        <div className="min-w-0">
                          <span className="block truncate text-on-surface font-medium">
                            {tutoria.estudiante.nombre}
                          </span>
                          <span className="block truncate text-outline text-[11px]">
                            {tutoria.estudiante.email}
                          </span>
                        </div>
                      </div>

                      <Badge
                        variant={
                          tutoria.asistenciaEstudiante === true
                            ? 'success'
                            : tutoria.asistenciaEstudiante === false
                            ? 'error'
                            : 'neutral'
                        }
                        className="self-start sm:self-auto shrink-0"
                      >
                        {tutoria.asistenciaEstudiante === true
                          ? 'Asistió'
                          : tutoria.asistenciaEstudiante === false
                          ? 'No asistió'
                          : 'Sin registrar'}
                      </Badge>
                    </div>
                  )}

                  {tutoria.participantes?.map((p) => (
                    <div
                      key={p.estudiante._id}
                      className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-secondary-fixed text-secondary font-bold text-[11px] flex items-center justify-center shrink-0">
                          {getInitials(p.estudiante.nombre)}
                        </div>
                        <div className="min-w-0">
                          <span className="block truncate text-on-surface font-medium">
                            {p.estudiante.nombre}
                          </span>
                          <span className="block truncate text-outline text-[11px]">
                            {p.estudiante.email}
                          </span>
                        </div>
                      </div>

                      <Badge
                        variant={
                          p.asistio === true
                            ? 'success'
                            : p.asistio === false
                            ? 'error'
                            : 'neutral'
                        }
                        className="self-start sm:self-auto shrink-0"
                      >
                        {p.asistio === true
                          ? 'Asistió'
                          : p.asistio === false
                          ? 'No asistió'
                          : 'Sin registrar'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* Grabación y Documentos */}
              {(tutoria.enlaceGrabacion ||
                (tutoria.recursos && tutoria.recursos.length > 0)) && (
                <div className="pt-2 space-y-2">
                  {tutoria.enlaceGrabacion && (
                    <CalloutBanner
                      tone="success"
                      icon="play_circle"
                      title="Grabación de la Sesión"
                    >
                      <a
                        href={tutoria.enlaceGrabacion}
                        target="_blank"
                        rel="noreferrer"
                        className="underline font-semibold text-[#166534] inline-flex items-center gap-1 break-all"
                      >
                        <span>{tutoria.enlaceGrabacion}</span>
                        <Icon className="text-[14px]">open_in_new</Icon>
                      </a>
                    </CalloutBanner>
                  )}

                  {tutoria.recursos && tutoria.recursos.length > 0 && (
                    <div className="p-space-md rounded-xl bg-surface-container-low space-y-2">
                      <span className="font-label-md text-xs font-bold text-on-surface flex items-center gap-1.5">
                        <Icon className="text-[16px] text-primary">folder</Icon>
                        <span>Documentos publicados en Recursos</span>
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {tutoria.recursos.map((r, i) => (
                          <a
                            key={i}
                            href={r}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2.5 rounded-lg bg-surface-container-lowest hover:bg-primary-fixed/40 flex items-center justify-between gap-2 text-xs text-primary font-medium transition-colors"
                          >
                            <span className="truncate">{r}</span>
                            <Icon className="text-[16px] shrink-0">open_in_new</Icon>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </SurfaceCard>
          ))}
        </div>
      )}
    </div>
  );
}
