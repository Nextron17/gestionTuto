'use client';

import { useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import api from '../../../../lib/api';
import { Icon } from '../../../../components/ui/Icon';
import { PageHeader } from '../../../../components/ui/PageHeader';
import { SearchInput } from '../../../../components/ui/SearchInput';
import { FormInput, FormSelect, FormTextarea } from '../../../../components/ui/FormField';
import { SurfaceCard } from '../../../../components/ui/SurfaceCard';
import { Badge } from '../../../../components/ui/Badge';
import { Button } from '../../../../components/ui/Button';
import { CalloutBanner } from '../../../../components/ui/CalloutBanner';
import { Modal } from '../../../../components/ui/Modal';

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
  fechaPropuesta?: string;
  createdAt?: string;
  modalidad?: 'virtual' | 'presencial';
  tipo?: string;
  lugar?: string;
  comentarioProfesor?: string;
  enlaceReunion?: string;
  enlaceGrabacion?: string;
  estado: string;
  recursos?: string[];
  estudiante?: EstudianteInfo;
  asistenciaEstudiante?: boolean | null;
  participantes?: { estudiante: EstudianteInfo; asistio?: boolean | null }[];
}

function toInputDateValue(iso?: string): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

function formatearFechaLegible(iso?: string): string {
  if (!iso) return 'Fecha por confirmar';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Fecha por confirmar';
  return date.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
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
  const [busquedaTexto, setBusquedaTexto] = useState('');
  const [filtroMateria, setFiltroMateria] = useState('');
  const [filtroTema, setFiltroTema] = useState('');
  const [filtroFecha, setFiltroFecha] = useState('');
  const [filtroModalidad, setFiltroModalidad] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<'todas' | 'finalizada' | 'aceptada'>('todas');
  const [cargando, setCargando] = useState(true);
  const [feedback, setFeedback] = useState('');

  // Modal para registrar o editar evidencia (HU-05)
  const [tutoriaEvidencia, setTutoriaEvidencia] = useState<Tutoria | null>(null);
  const [modalidadEdit, setModalidadEdit] = useState<'virtual' | 'presencial'>('virtual');
  const [lugarEdit, setLugarEdit] = useState('');
  const [enlaceReunionEdit, setEnlaceReunionEdit] = useState('');
  const [comentarioEdit, setComentarioEdit] = useState('');
  const [grabacionEdit, setGrabacionEdit] = useState('');
  const [asistenciaPrincipalEdit, setAsistenciaPrincipalEdit] = useState<boolean | null>(null);
  const [asistenciasPartEdit, setAsistenciasPartEdit] = useState<Record<string, boolean | null>>(
    {}
  );
  const [guardandoEvidencia, setGuardandoEvidencia] = useState(false);
  const [errorModal, setErrorModal] = useState('');

  const recargarTutorias = async () => {
    try {
      const res = await api.get('/tutorias');
      setTutorias(
        (res.data || []).filter((t: Tutoria) => t.estado === 'finalizada' || t.estado === 'aceptada')
      );
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    let cancelado = false;

    const cargarTutorias = async () => {
      try {
        const res = await api.get('/tutorias');
        if (cancelado) return;
        setTutorias(
          (res.data || []).filter(
            (t: Tutoria) => t.estado === 'finalizada' || t.estado === 'aceptada'
          )
        );
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelado) {
          setCargando(false);
        }
      }
    };

    cargarTutorias();

    return () => {
      cancelado = true;
    };
  }, []);

  const abrirModalEvidencia = (t: Tutoria) => {
    setTutoriaEvidencia(t);
    setModalidadEdit(t.modalidad === 'presencial' ? 'presencial' : 'virtual');
    setLugarEdit(t.lugar || '');
    setEnlaceReunionEdit(t.enlaceReunion || '');
    setComentarioEdit(t.comentarioProfesor || '');
    setGrabacionEdit(t.enlaceGrabacion || '');
    setAsistenciaPrincipalEdit(
      t.asistenciaEstudiante !== undefined ? t.asistenciaEstudiante : null
    );
    const mapaPart: Record<string, boolean | null> = {};
    (t.participantes || []).forEach((p) => {
      if (p.estudiante?._id) {
        mapaPart[p.estudiante._id] = p.asistio !== undefined ? p.asistio : null;
      }
    });
    setAsistenciasPartEdit(mapaPart);
    setErrorModal('');
  };

  const guardarEvidencia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tutoriaEvidencia) return;
    setErrorModal('');

    if (modalidadEdit === 'presencial' && !lugarEdit.trim()) {
      setErrorModal(
        'Cuando la modalidad es presencial debes especificar el lugar o salón de encuentro.'
      );
      return;
    }
    if (modalidadEdit === 'virtual' && !enlaceReunionEdit.trim() && !grabacionEdit.trim()) {
      setErrorModal(
        'Cuando la modalidad es virtual debes ingresar el enlace de la reunión o la grabación.'
      );
      return;
    }

    setGuardandoEvidencia(true);
    try {
      const participantesPayload = (tutoriaEvidencia.participantes || []).map((p) => ({
        estudianteId: p.estudiante._id,
        asistio:
          asistenciasPartEdit[p.estudiante._id] !== undefined
            ? asistenciasPartEdit[p.estudiante._id]
            : null,
      }));

      await api.patch(`/tutorias/${tutoriaEvidencia._id}/asistencia`, {
        modalidad: modalidadEdit,
        lugar: modalidadEdit === 'presencial' ? lugarEdit.trim() : '',
        enlaceReunion: enlaceReunionEdit.trim(),
        comentarioProfesor: comentarioEdit.trim(),
        enlaceGrabacion: grabacionEdit.trim(),
        asistenciaEstudiante: asistenciaPrincipalEdit,
        participantes: participantesPayload,
      });

      setTutoriaEvidencia(null);
      await recargarTutorias();
      setFeedback('Evidencia de modalidad, enlace y asistencia actualizada correctamente.');
      setTimeout(() => setFeedback(''), 3500);
    } catch (err) {
      const errorAxios = err as AxiosError<{ message?: string }>;
      setErrorModal(
        errorAxios.response?.data?.message || 'No se pudo guardar la evidencia de la tutoría.'
      );
    } finally {
      setGuardandoEvidencia(false);
    }
  };

  const materiasDisponibles = Array.from(
    new Set(tutorias.map((t) => t.materia).filter((m): m is string => Boolean(m)))
  ).sort((a, b) => a.localeCompare(b));

  const temasDisponibles = Array.from(
    new Set(
      tutorias
        .filter((t) => !filtroMateria || t.materia === filtroMateria)
        .map((t) => t.tema)
        .filter((tm): tm is string => Boolean(tm && tm.trim() !== ''))
    )
  ).sort((a, b) => a.localeCompare(b));

  const filtradas = tutorias.filter((t) => {
    const q = busquedaTexto.toLowerCase().trim();
    const okTexto =
      !q ||
      t.materia.toLowerCase().includes(q) ||
      (t.tema && t.tema.toLowerCase().includes(q)) ||
      t.descripcion.toLowerCase().includes(q) ||
      (t.estudiante?.nombre && t.estudiante.nombre.toLowerCase().includes(q));
    const okMat = !filtroMateria || t.materia === filtroMateria;
    const okTema = !filtroTema || (t.tema || '') === filtroTema;
    const fechaTutoria = toInputDateValue(t.fechaPropuesta || t.createdAt);
    const okFecha = !filtroFecha || fechaTutoria === filtroFecha;
    const okMod = !filtroModalidad || t.modalidad === filtroModalidad;
    const okEstado = filtroEstado === 'todas' || t.estado === filtroEstado;
    return okTexto && okMat && okTema && okFecha && okMod && okEstado;
  });

  const hayFiltrosActivos = Boolean(
    busquedaTexto ||
      filtroMateria ||
      filtroTema ||
      filtroFecha ||
      filtroModalidad ||
      filtroEstado !== 'todas'
  );

  const limpiarFiltros = () => {
    setBusquedaTexto('');
    setFiltroMateria('');
    setFiltroTema('');
    setFiltroFecha('');
    setFiltroModalidad('');
    setFiltroEstado('todas');
  };

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
    <div className="space-y-space-lg max-w-6xl mx-auto min-w-0">
      <PageHeader
        eyebrow="03. Registro Académico"
        title="Historial y Evidencia de Tutorías"
        description="Consulta el registro de sesiones realizadas, modalidad, enlace de reunión, lista de asistencia y material compartido."
      />

      {feedback && (
        <CalloutBanner tone="success" title="Evidencia guardada">
          {feedback}
        </CalloutBanner>
      )}

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

      {/* Filtros HU-09: Materia, Tema, Fecha, Modalidad y Estado */}
      <SurfaceCard tone="lowest" className="p-4 sm:p-space-md space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-surface-container">
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { id: 'todas', label: `Todas (${tutorias.length})` },
                { id: 'finalizada', label: `Dictadas / Finalizadas (${totalFinalizadas})` },
                { id: 'aceptada', label: `En Agenda (${totalEnCurso})` },
              ] as const
            ).map((tab) => {
              const activo = filtroEstado === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFiltroEstado(tab.id)}
                  className={`px-3 py-1.5 rounded-full font-label-md text-xs font-semibold transition-all cursor-pointer ${
                    activo
                      ? 'bg-primary text-on-primary shadow-xs'
                      : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
          {hayFiltrosActivos && (
            <button
              type="button"
              onClick={limpiarFiltros}
              className="text-xs font-label-md font-semibold text-primary hover:underline self-start sm:self-auto cursor-pointer"
            >
              Limpiar todos los filtros
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
          <SearchInput
            id="filtro-busqueda-prof"
            label="Estudiante o palabra clave"
            placeholder="Nombre, descripción..."
            value={busquedaTexto}
            onChange={(e) => setBusquedaTexto(e.target.value)}
            onClear={() => setBusquedaTexto('')}
          />

          <FormSelect
            id="filtro-materia-prof"
            label="Materia"
            icon="menu_book"
            value={filtroMateria}
            onChange={(e) => {
              setFiltroMateria(e.target.value);
              setFiltroTema('');
            }}
          >
            <option value="">Todas las materias</option>
            {materiasDisponibles.map((mat) => (
              <option key={mat} value={mat}>
                {mat}
              </option>
            ))}
          </FormSelect>

          <FormSelect
            id="filtro-tema-prof"
            label="Tema"
            icon="topic"
            value={filtroTema}
            onChange={(e) => setFiltroTema(e.target.value)}
          >
            <option value="">Todos los temas</option>
            {temasDisponibles.map((tm) => (
              <option key={tm} value={tm}>
                {tm}
              </option>
            ))}
          </FormSelect>

          <FormInput
            id="filtro-fecha-prof"
            type="date"
            label="Fecha"
            icon="event"
            value={filtroFecha}
            onChange={(e) => setFiltroFecha(e.target.value)}
          />

          <FormSelect
            id="filtro-modalidad-prof"
            label="Modalidad"
            icon="filter_list"
            value={filtroModalidad}
            onChange={(e) => setFiltroModalidad(e.target.value)}
          >
            <option value="">Todas las modalidades</option>
            <option value="virtual">Virtual</option>
            <option value="presencial">Presencial</option>
          </FormSelect>
        </div>

        {hayFiltrosActivos && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="font-label-md text-[11px] text-outline font-semibold uppercase tracking-wider">
              Filtros activos:
            </span>
            {busquedaTexto && (
              <Badge variant="neutral" onRemove={() => setBusquedaTexto('')}>
                Búsqueda: {busquedaTexto}
              </Badge>
            )}
            {filtroMateria && (
              <Badge variant="primary" onRemove={() => setFiltroMateria('')}>
                Materia: {filtroMateria}
              </Badge>
            )}
            {filtroTema && (
              <Badge variant="secondary" onRemove={() => setFiltroTema('')}>
                Tema: {filtroTema}
              </Badge>
            )}
            {filtroFecha && (
              <Badge variant="neutral" onRemove={() => setFiltroFecha('')}>
                Fecha: {filtroFecha}
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
          {filtradas.map((tutoria) => {
            const listaEstados = [
              tutoria.asistenciaEstudiante,
              ...(tutoria.participantes?.map((p) => p.asistio) || []),
            ];
            const totalAsistieron = listaEstados.filter((a) => a === true).length;
            const totalNoAsistieron = listaEstados.filter((a) => a === false).length;

            return (
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

                    <p className="text-xs text-on-surface-variant flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="inline-flex items-center gap-1">
                        <Icon className="text-[15px] text-tertiary shrink-0">event</Icon>
                        <span>Fecha:</span>
                        <strong className="font-semibold text-on-surface">
                          {formatearFechaLegible(tutoria.fechaPropuesta || tutoria.createdAt)}
                        </strong>
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Icon className="text-[15px] text-outline shrink-0">schedule</Icon>
                        <span>Horario:</span>
                        <strong className="font-semibold text-on-surface">
                          {tutoria.hora || 'N/A'}
                        </strong>
                      </span>
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 self-start shrink-0">
                    <Badge
                      variant={tutoria.estado === 'finalizada' ? 'success' : 'primary'}
                      dot
                      className="capitalize"
                    >
                      {tutoria.estado}
                    </Badge>
                    <Button
                      variant="tonal"
                      size="sm"
                      onClick={() => abrirModalEvidencia(tutoria)}
                    >
                      <Icon className="text-[16px]">fact_check</Icon>
                      <span>Registrar / Editar Evidencia</span>
                    </Button>
                  </div>
                </div>

                {/* Lugar presencial o enlace virtual */}
                {tutoria.modalidad === 'presencial' && tutoria.lugar && (
                  <CalloutBanner
                    tone="primary"
                    icon="location_on"
                    title="Lugar / Salón Presencial"
                  >
                    {tutoria.lugar}
                  </CalloutBanner>
                )}

                {tutoria.modalidad !== 'presencial' && tutoria.enlaceReunion && (
                  <CalloutBanner
                    tone="primary"
                    icon="videocam"
                    title="Enlace de la Reunión Virtual"
                  >
                    <a
                      href={tutoria.enlaceReunion}
                      target="_blank"
                      rel="noreferrer"
                      className="underline font-semibold text-primary inline-flex items-center gap-1 break-all"
                    >
                      <span>{tutoria.enlaceReunion}</span>
                      <Icon className="text-[14px]">open_in_new</Icon>
                    </a>
                  </CalloutBanner>
                )}

                {tutoria.comentarioProfesor && (
                  <CalloutBanner
                    tone="info"
                    icon={tutoria.modalidad === 'presencial' ? 'location_on' : 'comment'}
                    title={
                      tutoria.modalidad === 'presencial'
                        ? 'Salón Presencial / Observación'
                        : 'Observación / Indicaciones de la Sesión'
                    }
                  >
                    {tutoria.comentarioProfesor}
                  </CalloutBanner>
                )}

                {/* Lista de Asistencia */}
                <div className="p-3.5 sm:p-space-md rounded-xl bg-surface-container-low space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-label-md text-xs font-bold text-on-surface flex items-center gap-1.5">
                      <Icon className="text-[16px] text-primary">fact_check</Icon>
                      <span>Lista de Asistentes</span>
                    </p>
                    <span className="font-label-md text-[11px] text-on-surface-variant font-semibold">
                      {totalAsistieron} asistieron • {totalNoAsistieron} no asistieron
                    </span>
                  </div>

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
            );
          })}
        </div>
      )}

      {/* Modal para Registrar o Editar Evidencia (HU-05) */}
      <Modal
        open={Boolean(tutoriaEvidencia)}
        onClose={() => setTutoriaEvidencia(null)}
        title="Registrar Evidencia de la Tutoría"
        subtitle={`${tutoriaEvidencia?.materia || ''}${
          tutoriaEvidencia?.tema ? ` — ${tutoriaEvidencia.tema}` : ''
        }`}
        icon="fact_check"
        tone="primary"
        footer={
          <>
            <Button variant="subtle" size="sm" onClick={() => setTutoriaEvidencia(null)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form="form-evidencia-tutoria"
              variant="primary"
              size="sm"
              loading={guardandoEvidencia}
            >
              <Icon className="text-[16px]">save</Icon>
              <span>Guardar Evidencia</span>
            </Button>
          </>
        }
      >
        <form id="form-evidencia-tutoria" onSubmit={guardarEvidencia} className="space-y-4">
          {errorModal && (
            <CalloutBanner tone="danger" title="Falta evidencia obligatoria">
              {errorModal}
            </CalloutBanner>
          )}

          <FormSelect
            id="evidencia-modalidad"
            label="Modalidad de la Sesión"
            icon={modalidadEdit === 'presencial' ? 'location_on' : 'videocam'}
            value={modalidadEdit}
            onChange={(e) => setModalidadEdit(e.target.value as 'virtual' | 'presencial')}
          >
            <option value="virtual">Virtual</option>
            <option value="presencial">Presencial</option>
          </FormSelect>

          {modalidadEdit === 'presencial' && (
            <FormInput
              id="evidencia-lugar"
              label="Lugar / Salón Presencial *"
              icon="location_on"
              value={lugarEdit}
              onChange={(e) => setLugarEdit(e.target.value)}
              placeholder="Ej: Salón 302 - Edificio de Ingeniería"
              required
            />
          )}

          {modalidadEdit === 'virtual' && (
            <FormInput
              id="evidencia-enlace-reunion"
              type="url"
              label="Enlace de la Reunión Virtual *"
              icon="link"
              value={enlaceReunionEdit}
              onChange={(e) => setEnlaceReunionEdit(e.target.value)}
              placeholder="https://meet.google.com/xxx-xxxx-xxx"
              required
            />
          )}

          <FormInput
            id="evidencia-grabacion"
            type="url"
            label="Enlace de Grabación (Opcional)"
            icon="play_circle"
            value={grabacionEdit}
            onChange={(e) => setGrabacionEdit(e.target.value)}
            placeholder="https://drive.google.com/..."
          />

          <FormTextarea
            id="evidencia-comentario"
            label={
              modalidadEdit === 'presencial'
                ? 'Salón / Lugar y Observaciones'
                : 'Observaciones de la Sesión'
            }
            value={comentarioEdit}
            onChange={(e) => setComentarioEdit(e.target.value)}
            rows={2}
            placeholder={
              modalidadEdit === 'presencial'
                ? 'Ej: Salón 302 Bloque B — Se desarrollaron 4 ejercicios.'
                : 'Resumen de los temas revisados durante la reunión.'
            }
          />

          {/* Lista de asistentes */}
          <div className="space-y-2">
            <span className="font-label-md text-[13px] font-semibold text-on-surface block">
              Lista de Asistencia de Estudiantes
            </span>
            <div className="rounded-xl bg-surface-container-low divide-y divide-surface-container-highest overflow-hidden">
              {tutoriaEvidencia?.estudiante && (
                <div className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-on-surface block truncate">
                      {tutoriaEvidencia.estudiante.nombre}
                    </span>
                    <span className="text-[11px] text-outline block truncate">
                      Solicitante principal
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setAsistenciaPrincipalEdit(true)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                        asistenciaPrincipalEdit === true
                          ? 'bg-[#16a34a] text-white'
                          : 'bg-surface-container-lowest text-on-surface-variant'
                      }`}
                    >
                      Asistió
                    </button>
                    <button
                      type="button"
                      onClick={() => setAsistenciaPrincipalEdit(false)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                        asistenciaPrincipalEdit === false
                          ? 'bg-error text-on-error'
                          : 'bg-surface-container-lowest text-on-surface-variant'
                      }`}
                    >
                      No asistió
                    </button>
                  </div>
                </div>
              )}

              {tutoriaEvidencia?.participantes?.map((p) => {
                const estadoPart = asistenciasPartEdit[p.estudiante._id];
                return (
                  <div
                    key={p.estudiante._id}
                    className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-on-surface block truncate">
                        {p.estudiante.nombre}
                      </span>
                      <span className="text-[11px] text-outline block truncate">
                        Inscrito grupal
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          setAsistenciasPartEdit((prev) => ({
                            ...prev,
                            [p.estudiante._id]: true,
                          }))
                        }
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                          estadoPart === true
                            ? 'bg-[#16a34a] text-white'
                            : 'bg-surface-container-lowest text-on-surface-variant'
                        }`}
                      >
                        Asistió
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setAsistenciasPartEdit((prev) => ({
                            ...prev,
                            [p.estudiante._id]: false,
                          }))
                        }
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                          estadoPart === false
                            ? 'bg-error text-on-error'
                            : 'bg-surface-container-lowest text-on-surface-variant'
                        }`}
                      >
                        No asistió
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
