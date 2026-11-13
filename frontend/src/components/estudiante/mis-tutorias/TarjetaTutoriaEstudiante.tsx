import { SurfaceCard } from '../../ui/SurfaceCard';
import { Icon } from '../../ui/Icon';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { CalloutBanner } from '../../ui/CalloutBanner';
import { Tutoria, formatearFechaTutoria } from './types';

interface TarjetaTutoriaEstudianteProps {
  tutoria: Tutoria;
  miAsistencia: boolean | null;
  userId?: string;
  claveCopiada: string | null;
  copiarEnlace: (url: string, clave: string) => void;
}

export function TarjetaTutoriaEstudiante({
  tutoria,
  miAsistencia,
  userId,
  claveCopiada,
  copiarEnlace,
}: TarjetaTutoriaEstudianteProps) {
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
                {tutoria.estudiante._id === userId ? ' (Tú • Solicitante)' : ''}
              </Badge>
            )}
            {(tutoria.participantes || []).map((part, idx) => (
              <Badge key={part.estudiante?._id || idx} variant="primary" pill={false}>
                {part.estudiante?.nombre || 'Estudiante'}
                {part.estudiante?._id === userId ? ' (Tú • Participante)' : ''}
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
}
