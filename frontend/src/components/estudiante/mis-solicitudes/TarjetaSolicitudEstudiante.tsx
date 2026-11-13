import { SurfaceCard } from '../../ui/SurfaceCard';
import { Icon } from '../../ui/Icon';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { CalloutBanner } from '../../ui/CalloutBanner';
import { Solicitud, formatearFecha, renderEstadoCita } from './types';

interface TarjetaSolicitudEstudianteProps {
  sol: Solicitud;
  recienActualizada: boolean;
  userNombre?: string;
  abrirModalCancelar: (sol: Solicitud) => void;
  onNavigate: (url: string) => void;
}

export function TarjetaSolicitudEstudiante({
  sol,
  recienActualizada,
  userNombre,
  abrirModalCancelar,
  onNavigate,
}: TarjetaSolicitudEstudianteProps) {
  const fechaRespuestaTxt = formatearFecha(sol.fechaRespuestaProfesor || sol.updatedAt);

  return (
    <SurfaceCard
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
                {sol.estudiante?.nombre || userNombre || 'Estudiante'}
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
              onClick={() => onNavigate('/estudiante/mis-tutorias')}
            >
              <Icon className="text-[15px]">cast_for_education</Icon>
              <span>Ir a Mis Tutorías</span>
            </Button>
            <Button
              type="button"
              variant="subtle"
              size="sm"
              onClick={() =>
                onNavigate(`/estudiante/recursos?q=${encodeURIComponent(sol.materia)}`)
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
                onNavigate(
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
              onNavigate(
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
}

