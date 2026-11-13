import { SurfaceCard } from '../../ui/SurfaceCard';
import { Icon } from '../../ui/Icon';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { CalloutBanner } from '../../ui/CalloutBanner';
import { Tutoria, formatearFechaLegible, getInitials } from './types';

interface TarjetaTutoriaProfesorProps {
  tutoria: Tutoria;
  abrirModalEvidencia: (tutoria: Tutoria) => void;
}

export function TarjetaTutoriaProfesor({
  tutoria,
  abrirModalEvidencia,
}: TarjetaTutoriaProfesorProps) {
  const listaEstados = [
    tutoria.asistenciaEstudiante,
    ...(tutoria.participantes?.map((p) => p.asistio) || []),
  ];
  const totalAsistieron = listaEstados.filter((a) => a === true).length;
  const totalNoAsistieron = listaEstados.filter((a) => a === false).length;

  return (
    <SurfaceCard
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
}

