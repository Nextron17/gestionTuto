'use client';

import { useCallback, useEffect, useState } from 'react';
import api from '../../../../lib/api';
import { Icon } from '../../../../components/ui/Icon';
import { PageHeader } from '../../../../components/ui/PageHeader';
import { SurfaceCard } from '../../../../components/ui/SurfaceCard';
import { Badge } from '../../../../components/ui/Badge';
import { Button } from '../../../../components/ui/Button';
import { FormInput, FormSelect, FormTextarea } from '../../../../components/ui/FormField';
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
  modalidad?: 'presencial' | 'virtual';
  tipo?: 'individual' | 'grupal';
  cupoMaximo?: number;
  comentarioProfesor?: string;
  enlaceGrabacion?: string;
  estado: 'pendiente' | 'aceptada' | 'cancelada' | 'aplazada' | 'finalizada';
  recursos?: string[];
  estudiante?: EstudianteInfo;
  asistenciaEstudiante?: boolean | null;
  participantes?: ParticipanteItem[];
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
}

export default function SolicitudesProfesorPage() {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [tutoriaSeleccionada, setTutoriaSeleccionada] = useState<Solicitud | null>(null);
  const [nuevoRecurso, setNuevoRecurso] = useState('');
  const [comentarioActivo, setComentarioActivo] = useState('');
  const [grabacionActiva, setGrabacionActiva] = useState('');
  const [cargando, setCargando] = useState(true);
  const [guardandoDetalles, setGuardandoDetalles] = useState(false);
  const [mensajeFeedback, setMensajeFeedback] = useState('');

  // Modal de respuesta (Aceptar o Aplazar)
  const [modalGestion, setModalGestion] = useState<{
    solicitud: Solicitud;
    accion: 'aceptada' | 'aplazada';
  } | null>(null);
  const [horaPropuesta, setHoraPropuesta] = useState('');
  const [modalidad, setModalidad] = useState<'virtual' | 'presencial'>('virtual');
  const [tipo, setTipo] = useState<'individual' | 'grupal'>('individual');
  const [cupoMaximo, setCupoMaximo] = useState(10);
  const [comentarioModal, setComentarioModal] = useState('');
  const [procesandoModal, setProcesandoModal] = useState(false);

  // Modal de confirmación para rechazar solicitud
  const [solicitudARechazar, setSolicitudARechazar] = useState<Solicitud | null>(null);
  const [rechazando, setRechazando] = useState(false);

  const sincronizarSeleccionada = useCallback((lista: Solicitud[], idActual?: string) => {
    const aceptadas = lista.filter((s) => s.estado === 'aceptada');
    const encontrada = idActual ? aceptadas.find((s) => s._id === idActual) : aceptadas[0];
    setTutoriaSeleccionada(encontrada || null);
    setComentarioActivo(encontrada?.comentarioProfesor || '');
    setGrabacionActiva(encontrada?.enlaceGrabacion || '');
  }, []);

  const cargarSolicitudesAPI = useCallback(
    async (idMantener?: string) => {
      try {
        const res = await api.get('/tutorias');
        const data: Solicitud[] = res.data;
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
    const cargarInicial = async () => {
      await cargarSolicitudesAPI();
      setCargando(false);
    };
    cargarInicial();
  }, [cargarSolicitudesAPI]);

  const abrirModalGestion = (sol: Solicitud, accion: 'aceptada' | 'aplazada') => {
    setModalGestion({ solicitud: sol, accion });
    setHoraPropuesta(sol.hora || '');
    setModalidad(sol.modalidad || 'virtual');
    setTipo(sol.tipo || 'individual');
    setCupoMaximo(sol.cupoMaximo || 10);
    setComentarioModal(sol.comentarioProfesor || '');
  };

  const confirmarGestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalGestion) return;

    setProcesandoModal(true);
    try {
      await api.patch(`/tutorias/${modalGestion.solicitud._id}`, {
        estado: modalGestion.accion,
        hora: horaPropuesta,
        modalidad,
        tipo,
        cupoMaximo: tipo === 'grupal' ? cupoMaximo : 1,
        comentarioProfesor: comentarioModal,
      });

      const idDestino =
        modalGestion.accion === 'aceptada'
          ? modalGestion.solicitud._id
          : tutoriaSeleccionada?._id;
      setModalGestion(null);
      await cargarSolicitudesAPI(idDestino);
      setMensajeFeedback(
        modalGestion.accion === 'aceptada'
          ? 'Tutoría aceptada y configurada exitosamente.'
          : 'Tutoría reprogramada y notificada al estudiante.'
      );
      setTimeout(() => setMensajeFeedback(''), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setProcesandoModal(false);
    }
  };

  const confirmarRechazo = async () => {
    if (!solicitudARechazar) return;
    setRechazando(true);
    try {
      await api.patch(`/tutorias/${solicitudARechazar._id}`, { estado: 'cancelada' });
      setSolicitudARechazar(null);
      await cargarSolicitudesAPI(tutoriaSeleccionada?._id);
    } catch (err) {
      console.error(err);
    } finally {
      setRechazando(false);
    }
  };

  const guardarDetallesSesion = async () => {
    if (!tutoriaSeleccionada) return;
    setGuardandoDetalles(true);
    try {
      await api.patch(`/tutorias/${tutoriaSeleccionada._id}`, {
        comentarioProfesor: comentarioActivo,
        enlaceGrabacion: grabacionActiva,
      });
      await cargarSolicitudesAPI(tutoriaSeleccionada._id);
      setMensajeFeedback('Comentarios y enlaces de la sesión guardados.');
      setTimeout(() => setMensajeFeedback(''), 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setGuardandoDetalles(false);
    }
  };

  const marcarAsistenciaPrincipal = async (asistio: boolean) => {
    if (!tutoriaSeleccionada) return;
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
    try {
      await api.patch(`/tutorias/${tutoriaSeleccionada._id}/asistencia`, {
        participantes: [{ estudianteId, asistio }],
      });
      await cargarSolicitudesAPI(tutoriaSeleccionada._id);
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
    try {
      await api.patch(`/tutorias/${id}/finalizar`, {
        comentarioProfesor: comentarioActivo,
        enlaceGrabacion: grabacionActiva,
      });
      await cargarSolicitudesAPI();
      setMensajeFeedback('Tutoría finalizada, guardada en Historial y publicada en Recursos.');
      setTimeout(() => setMensajeFeedback(''), 4000);
    } catch (err) {
      console.error(err);
    }
  };

  const pendientes = solicitudes.filter(
    (s) => s.estado === 'pendiente' || s.estado === 'aplazada'
  );
  const aceptadas = solicitudes.filter((s) => s.estado === 'aceptada');

  if (cargando) {
    return (
      <div className="max-w-6xl mx-auto py-8 text-sm text-on-surface-variant flex items-center gap-2">
        <Icon className="text-primary animate-pulse">hourglass_top</Icon>
        <span>Cargando solicitudes y sesiones de tutoría...</span>
      </div>
    );
  }

  return (
    <div className="space-y-space-lg max-w-6xl mx-auto">
      <PageHeader
        eyebrow="01. Bandeja Docente"
        title="Gestión de Solicitudes y Sesiones"
        description="Responde peticiones pendientes, administra el aula activa, toma asistencia y comparte recursos."
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="warning" pulseDot>
              {pendientes.length} por atender
            </Badge>
            <Badge variant="success" dot>
              {aceptadas.length} en curso
            </Badge>
          </div>
        }
      />

      {mensajeFeedback && (
        <CalloutBanner tone="success" title="Actualización completada">
          {mensajeFeedback}
        </CalloutBanner>
      )}

      {/* Solicitudes Pendientes o Aplazadas */}
      <SurfaceCard tone="lowest" className="p-space-lg space-y-space-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-surface-container">
          <div>
            <h2 className="text-lg font-bold text-on-surface flex items-center gap-2">
              <Icon className="text-tertiary text-[22px]">pending_actions</Icon>
              <span>Solicitudes Pendientes / Aplazadas</span>
            </h2>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Acepta y configura la modalidad de la sesión o propón un nuevo horario al estudiante.
            </p>
          </div>
          <Badge variant="neutral">
            {pendientes.length} {pendientes.length === 1 ? 'petición' : 'peticiones'}
          </Badge>
        </div>

        {pendientes.length === 0 ? (
          <div className="p-8 rounded-xl bg-surface-container-low text-center space-y-1.5">
            <Icon className="text-outline text-[32px]">task_alt</Icon>
            <p className="text-sm text-on-surface-variant">
              ¡Estás al día! No tienes solicitudes pendientes por responder.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendientes.map((sol) => (
              <div
                key={sol._id}
                className="p-space-md rounded-xl bg-surface-container-low hover:bg-surface-container/70 transition-colors flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4"
              >
                <div className="space-y-2 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-label-md text-[15px] font-bold text-on-surface">
                      {sol.materia} {sol.tema ? `• ${sol.tema}` : ''}
                    </span>
                    {sol.estado === 'aplazada' ? (
                      <Badge variant="primary">
                        <Icon className="text-[14px]">event_repeat</Icon>
                        <span>Aplazada</span>
                      </Badge>
                    ) : (
                      <Badge variant="warning" pulseDot>
                        Pendiente de confirmación
                      </Badge>
                    )}
                  </div>

                  <p className="font-body-md text-[13px] text-on-surface-variant leading-relaxed">
                    {sol.descripcion}
                  </p>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-on-surface-variant">
                    <span className="inline-flex items-center gap-1.5">
                      <Icon className="text-[15px] text-primary">school</Icon>
                      <span>Estudiante:</span>
                      <strong className="font-semibold text-on-surface">
                        {sol.estudiante?.nombre}
                      </strong>
                      <span className="text-outline">({sol.estudiante?.email})</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Icon className="text-[15px] text-outline">schedule</Icon>
                      <span>Horario propuesto:</span>
                      <strong className="font-semibold text-on-surface">
                        {sol.hora || 'Por definir'}
                      </strong>
                    </span>
                  </div>

                  {sol.comentarioProfesor && (
                    <div className="p-2.5 rounded-lg bg-[#fef3c7]/60 text-[#92400e] text-xs flex items-center gap-1.5">
                      <Icon className="text-[15px] text-tertiary">info</Icon>
                      <span>
                        <strong>Nota previa:</strong> {sol.comentarioProfesor}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => abrirModalGestion(sol, 'aceptada')}
                  >
                    <Icon className="text-[16px]">check_circle</Icon>
                    <span>Aceptar / Configurar</span>
                  </Button>
                  <Button
                    variant="tonal"
                    size="sm"
                    onClick={() => abrirModalGestion(sol, 'aplazada')}
                  >
                    <Icon className="text-[16px]">edit_calendar</Icon>
                    <span>Aplazar Hora</span>
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setSolicitudARechazar(sol)}
                  >
                    <Icon className="text-[16px]">delete</Icon>
                    <span>Rechazar</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </SurfaceCard>

      {/* Detalle de Tutoría Activa */}
      <SurfaceCard tone="lowest" className="p-space-lg space-y-space-lg">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 pb-3 border-b border-surface-container">
          <div>
            <span className="font-label-md text-[11px] uppercase tracking-wider text-outline font-semibold">
              Aula Virtual &amp; Seguimiento
            </span>
            <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
              <Icon className="text-[#16a34a] text-[22px]">cast_for_education</Icon>
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
                  setComentarioActivo(sel?.comentarioProfesor || '');
                  setGrabacionActiva(sel?.enlaceGrabacion || '');
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
                  Hora / Fecha
                </span>
                <p className="font-label-md text-sm font-bold text-on-surface mt-1 flex items-center gap-1.5">
                  <Icon className="text-[16px] text-primary">schedule</Icon>
                  <span>{tutoriaSeleccionada.hora || 'No especificada'}</span>
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
                  Modalidad
                </span>
                <p className="font-label-md text-sm font-bold text-primary capitalize mt-1 flex items-center gap-1.5">
                  <Icon className="text-[16px]">
                    {tutoriaSeleccionada.modalidad === 'presencial' ? 'location_on' : 'videocam'}
                  </Icon>
                  <span>{tutoriaSeleccionada.modalidad || 'Virtual'}</span>
                </p>
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

            {/* Comentario (Enlace de reunión / Salón) y Enlace de Grabación */}
            <div className="p-space-md rounded-xl bg-surface-container-low space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
                <FormInput
                  id="comentario-activo"
                  label="Enlace de Reunión Virtual o Salón Presencial"
                  icon={tutoriaSeleccionada.modalidad === 'presencial' ? 'location_on' : 'videocam'}
                  value={comentarioActivo}
                  onChange={(e) => setComentarioActivo(e.target.value)}
                  placeholder="Ej: https://meet.google.com/xxx o Salón 304 Bloque B"
                  hint="Visible para los estudiantes inscritos en la tutoría."
                />

                <div className="flex flex-col sm:flex-row sm:items-end gap-2">
                  <FormInput
                    id="grabacion-activa"
                    type="url"
                    label="Enlace de Grabación (Opcional / Post-sesión)"
                    icon="play_circle"
                    value={grabacionActiva}
                    onChange={(e) => setGrabacionActiva(e.target.value)}
                    placeholder="https://drive.google.com/..."
                    hint="Comparte la grabación en la nube al concluir."
                    containerClassName="flex-1"
                  />
                  <Button
                    variant="primary"
                    onClick={guardarDetallesSesion}
                    loading={guardandoDetalles}
                    className="sm:mb-[22px] shrink-0"
                  >
                    <Icon className="text-[16px]">save</Icon>
                    <span>Guardar</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* Control de Asistencia (Filas Interactivas Sección 07) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-label-md text-label-md font-bold text-on-surface flex items-center gap-2">
                  <Icon className="text-primary text-[18px]">fact_check</Icon>
                  <span>Control de Asistencia</span>
                </h4>
                <span className="text-xs text-outline">
                  Marca la asistencia de cada participante
                </span>
              </div>

              <div className="rounded-xl bg-surface-container-low overflow-hidden divide-y divide-surface-container-highest">
                {/* Solicitante principal */}
                {tutoriaSeleccionada.estudiante && (
                  <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-surface-container transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-primary-fixed text-primary font-bold text-xs flex items-center justify-center shrink-0">
                        {getInitials(tutoriaSeleccionada.estudiante.nombre)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
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

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => marcarAsistenciaPrincipal(true)}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg font-label-md text-xs font-semibold transition-all cursor-pointer active:scale-95 ${
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
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg font-label-md text-xs font-semibold transition-all cursor-pointer active:scale-95 ${
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

                {/* Estudiantes adicionales inscritos (si es grupal) */}
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
                        <div className="flex items-center gap-2">
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

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => marcarAsistenciaParticipante(part.estudiante._id, true)}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg font-label-md text-xs font-semibold transition-all cursor-pointer active:scale-95 ${
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
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg font-label-md text-xs font-semibold transition-all cursor-pointer active:scale-95 ${
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
                <Button variant="tonal" onClick={agregarRecurso} className="shrink-0">
                  <Icon className="text-[18px]">add</Icon>
                  <span>Subir Recurso</span>
                </Button>
              </div>
            </div>

            {/* Finalizar Sesión */}
            <div className="pt-4 border-t border-surface-container flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <Button
                variant="tonal"
                size="sm"
                onClick={() => abrirModalGestion(tutoriaSeleccionada, 'aplazada')}
              >
                <Icon className="text-[16px]">edit_calendar</Icon>
                <span>Reprogramar / Aplazar Hora</span>
              </Button>

              <Button
                variant="primary"
                onClick={() => finalizarTutoria(tutoriaSeleccionada._id)}
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
              Cancelar
            </Button>
            <Button
              type="submit"
              form="form-gestionar-solicitud"
              variant={modalGestion?.accion === 'aceptada' ? 'primary' : 'tertiary'}
              size="sm"
              loading={procesandoModal}
            >
              <Icon className="text-[16px]">check</Icon>
              <span>Confirmar</span>
            </Button>
          </>
        }
      >
        <form id="form-gestionar-solicitud" onSubmit={confirmarGestion} className="space-y-3.5">
          <FormInput
            id="modal-hora-propuesta"
            label={
              modalGestion?.accion === 'aplazada'
                ? 'Nueva Fecha y Hora Propuesta'
                : 'Horario / Fecha Confirmada'
            }
            icon="schedule"
            value={horaPropuesta}
            onChange={(e) => setHoraPropuesta(e.target.value)}
            placeholder="Ej: Viernes 10:00 - 12:00"
            required
          />

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
            </>
          )}

          <FormTextarea
            id="modal-comentario"
            label={
              modalGestion?.accion === 'aplazada'
                ? 'Motivo del aplazamiento / Comentario'
                : modalidad === 'virtual'
                ? 'Enlace de reunión virtual e indicaciones'
                : 'Salón o lugar de encuentro presencial'
            }
            value={comentarioModal}
            onChange={(e) => setComentarioModal(e.target.value)}
            rows={3}
            placeholder={
              modalGestion?.accion === 'aplazada'
                ? 'Ej: Tengo reunión de facultad, nos vemos el viernes a las 10 AM'
                : modalidad === 'virtual'
                ? 'Ej: https://meet.google.com/abc-defg-hij'
                : 'Ej: Salón 202 - Edificio Principal'
            }
            required
          />
        </form>
      </Modal>

      {/* Modal Canónico para Confirmar Rechazo */}
      <Modal
        open={Boolean(solicitudARechazar)}
        onClose={() => setSolicitudARechazar(null)}
        title="Confirmar Rechazo de Solicitud"
        icon="warning"
        tone="danger"
        footer={
          <>
            <Button variant="subtle" size="sm" onClick={() => setSolicitudARechazar(null)}>
              Volver
            </Button>
            <Button
              variant="danger"
              size="sm"
              loading={rechazando}
              onClick={confirmarRechazo}
            >
              Sí, Rechazar Solicitud
            </Button>
          </>
        }
      >
        <p className="font-body-md text-sm text-on-surface leading-relaxed">
          ¿Estás seguro de rechazar la solicitud de{' '}
          <strong>{solicitudARechazar?.materia}</strong> enviada por{' '}
          <strong>{solicitudARechazar?.estudiante?.nombre}</strong>?
        </p>
      </Modal>
    </div>
  );
}
