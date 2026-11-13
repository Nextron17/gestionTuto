import { SurfaceCard } from '../../ui/SurfaceCard';
import { Icon } from '../../ui/Icon';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { FormInput, FormSelect } from '../../ui/FormField';
import { CalloutBanner } from '../../ui/CalloutBanner';
import { Solicitud, formatearFechaLegible, getInitials } from './types';

interface TutoriaActivaSectionProps {
  aceptadas: Solicitud[];
  tutoriaSeleccionada: Solicitud | null;
  onSelectTutoria: (sel: Solicitud | null) => void;
  modalidadActiva: 'virtual' | 'presencial';
  setModalidadActiva: (value: 'virtual' | 'presencial') => void;
  tipoActivo: 'individual' | 'grupal';
  setTipoActivo: (value: 'individual' | 'grupal') => void;
  cupoActivo: number;
  setCupoActivo: (value: number) => void;
  lugarActivo: string;
  setLugarActivo: (value: string) => void;
  enlaceReunionActivo: string;
  setEnlaceReunionActivo: (value: string) => void;
  comentarioActivo: string;
  setComentarioActivo: (value: string) => void;
  grabacionActiva: string;
  setGrabacionActiva: (value: string) => void;
  guardandoDetalles: boolean;
  errorEvidencia: string;
  guardarDetallesSesion: () => void;
  marcarAsistenciaPrincipal: (asistio: boolean) => void;
  marcarAsistenciaParticipante: (estudianteId: string, asistio: boolean) => void;
  marcarTodosAsistio: () => void;
  nuevoRecurso: string;
  setNuevoRecurso: (value: string) => void;
  agregarRecurso: () => void;
  abrirModalGestion: (sol: Solicitud, accion: 'aceptada' | 'aplazada') => void;
  abrirModalCancelacion: (sol: Solicitud) => void;
  finalizarTutoria: (id: string) => void;
}

export function TutoriaActivaSection({
  aceptadas,
  tutoriaSeleccionada,
  onSelectTutoria,
  modalidadActiva,
  setModalidadActiva,
  tipoActivo,
  setTipoActivo,
  cupoActivo,
  setCupoActivo,
  lugarActivo,
  setLugarActivo,
  enlaceReunionActivo,
  setEnlaceReunionActivo,
  comentarioActivo,
  setComentarioActivo,
  grabacionActiva,
  setGrabacionActiva,
  guardandoDetalles,
  errorEvidencia,
  guardarDetallesSesion,
  marcarAsistenciaPrincipal,
  marcarAsistenciaParticipante,
  marcarTodosAsistio,
  nuevoRecurso,
  setNuevoRecurso,
  agregarRecurso,
  abrirModalGestion,
  abrirModalCancelacion,
  finalizarTutoria,
}: TutoriaActivaSectionProps) {
  return (
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
                onSelectTutoria(sel);
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
                <p
                  className="text-[11px] text-on-surface-variant mt-1 truncate"
                  title={tutoriaSeleccionada.lugar}
                >
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
  );
}
