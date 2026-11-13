import { SurfaceCard } from '../../ui/SurfaceCard';
import { Icon } from '../../ui/Icon';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { CalloutBanner } from '../../ui/CalloutBanner';
import { TutoriaGrupal, getInitials } from './types';

interface TutoriasGrupalesSectionProps {
  grupalesFiltradas: TutoriaGrupal[];
  alertaGrupal: { tipo: 'ok' | 'error'; texto: string } | null;
  userId?: string;
  inscribiendoGrupalId: string | null;
  inscribirseEnGrupal: (tutoriaId: string) => void;
  onVerMisTutorias: () => void;
}

export function TutoriasGrupalesSection({
  grupalesFiltradas,
  alertaGrupal,
  userId,
  inscribiendoGrupalId,
  inscribirseEnGrupal,
  onVerMisTutorias,
}: TutoriasGrupalesSectionProps) {
  if (grupalesFiltradas.length === 0) return null;

  return (
    <section className="space-y-space-md min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="min-w-0">
          <span className="font-label-md text-[11px] uppercase tracking-wider text-outline font-semibold block">
            Sesiones Colaborativas
          </span>
          <h2 className="text-lg sm:text-xl font-semibold text-on-surface flex items-center gap-2">
            <Icon className="text-primary text-[22px]">groups</Icon>
            <span className="break-words">Tutorías Grupales Programadas</span>
          </h2>
        </div>
        <Badge variant="secondary" className="self-start sm:self-auto">
          {grupalesFiltradas.length}{' '}
          {grupalesFiltradas.length === 1 ? 'sesión abierta' : 'sesiones abiertas'}
        </Badge>
      </div>

      {alertaGrupal && (
        <CalloutBanner
          tone={alertaGrupal.tipo === 'ok' ? 'success' : 'danger'}
          title={alertaGrupal.tipo === 'ok' ? 'Inscripción confirmada' : 'Aviso de inscripción'}
        >
          {alertaGrupal.texto}
        </CalloutBanner>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-space-md">
        {grupalesFiltradas.map((tg) => {
          const totalInscritos = 1 + (tg.participantes?.length || 0);
          const tieneCupoMaximo = typeof tg.cupoMaximo === 'number' && tg.cupoMaximo > 0;
          const cupo = tieneCupoMaximo ? (tg.cupoMaximo as number) : 0;
          const lugaresRestantes = tieneCupoMaximo ? Math.max(0, cupo - totalInscritos) : null;
          const porcentaje = tieneCupoMaximo
            ? Math.min(100, Math.round((totalInscritos / cupo) * 100))
            : 0;
          const sinCupos = tieneCupoMaximo && totalInscritos >= cupo;
          const soySolicitante = tg.estudiante?._id === userId;
          const soyParticipante = Boolean(
            tg.participantes?.some((p) => p.estudiante?._id === userId)
          );
          const yaSoyParte = soySolicitante || soyParticipante;

          const participantesLista = [
            ...(tg.estudiante?.nombre
              ? [
                  {
                    id: tg.estudiante._id,
                    nombre: tg.estudiante.nombre,
                    esTu: tg.estudiante._id === userId,
                  },
                ]
              : []),
            ...(tg.participantes || []).map((p, idx) => ({
              id: p.estudiante?._id || `part-${idx}`,
              nombre: p.estudiante?.nombre || 'Estudiante',
              esTu: p.estudiante?._id === userId,
            })),
          ];

          return (
            <SurfaceCard
              key={tg._id}
              as="article"
              tone="lowest"
              interactive
              className="p-4 sm:p-space-md flex flex-col justify-between"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <Badge variant="secondary" pill={false}>
                    <Icon className="text-[13px]">groups</Icon>
                    <span>Tutoría Grupal</span>
                  </Badge>
                  <span className="font-mono text-[11px] sm:text-[12px] text-outline">
                    {tg.hora || 'Por confirmar'}
                  </span>
                </div>

                <h3 className="font-label-md text-[15px] font-bold text-on-surface mb-1 break-words">
                  {tg.materia} {tg.tema ? `: ${tg.tema}` : ''}
                </h3>

                <p className="font-body-md text-[13px] text-on-surface-variant mb-4 line-clamp-2 break-words">
                  {tg.descripcion}
                </p>

                <div className="p-space-sm bg-surface-container-low rounded-lg space-y-1.5 mb-3">
                  <div className="flex flex-wrap justify-between items-center gap-1 font-label-md text-[11px] sm:text-[12px]">
                    <span className="text-on-surface font-medium">
                      {tieneCupoMaximo ? (
                        <>
                          Cupos Ocupados:{' '}
                          <strong>
                            {totalInscritos} de {cupo}
                          </strong>
                        </>
                      ) : (
                        <>
                          Participantes inscritos: <strong>{totalInscritos}</strong>
                        </>
                      )}
                    </span>
                    <span
                      className={`font-bold ${
                        lugaresRestantes !== null && lugaresRestantes <= 3
                          ? 'text-tertiary'
                          : 'text-primary'
                      }`}
                    >
                      {!tieneCupoMaximo
                        ? 'Cupo abierto'
                        : lugaresRestantes === 0
                        ? 'Cupo máximo completo'
                        : lugaresRestantes !== null && lugaresRestantes <= 4
                        ? `¡Últimos ${lugaresRestantes} lugares!`
                        : `${lugaresRestantes} disponibles`}
                    </span>
                  </div>
                  {tieneCupoMaximo && (
                    <div className="w-full bg-surface-container-highest rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          sinCupos ? 'bg-error' : 'bg-primary'
                        }`}
                        style={{ width: `${porcentaje}%` }}
                      />
                    </div>
                  )}
                </div>

                <div className="mb-3 space-y-1">
                  <span className="text-[11px] font-label-md font-semibold text-outline block">
                    Lista de participantes ({participantesLista.length}):
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {participantesLista.slice(0, 4).map((p) => (
                      <Badge
                        key={p.id}
                        variant={p.esTu ? 'success' : 'neutral'}
                        pill={false}
                        className="text-[10px]"
                      >
                        {p.nombre}
                        {p.esTu ? ' (Tú)' : ''}
                      </Badge>
                    ))}
                    {participantesLista.length > 4 && (
                      <Badge variant="neutral" pill={false} className="text-[10px]">
                        +{participantesLista.length - 4} más
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-on-surface-variant font-label-md text-[12px]">
                  <span className="flex items-center gap-1 capitalize">
                    <Icon className="text-[16px] text-primary">
                      {tg.modalidad === 'presencial' ? 'location_on' : 'videocam'}
                    </Icon>
                    <span>
                      {tg.modalidad || 'Virtual'}
                      {tg.modalidad === 'presencial' && tg.lugar ? ` (${tg.lugar})` : ''}
                    </span>
                  </span>
                  <span className="flex items-center gap-1 min-w-0">
                    <Icon className="text-[16px] text-outline">person</Icon>
                    <span className="truncate">{tg.profesor?.nombre || 'Docente'}</span>
                  </span>
                </div>

                {yaSoyParte ? (
                  (tg.enlaceReunion || tg.enlaceGrabacion) && (
                    <div className="mt-3 p-2.5 rounded-lg bg-[#16a34a]/10 border border-[#16a34a]/25 space-y-1.5">
                      <span className="text-[11px] font-bold text-[#15803d] flex items-center gap-1">
                        <Icon className="text-[14px]">verified_user</Icon>
                        <span>Acceso exclusivo habilitado para inscritos:</span>
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {tg.enlaceReunion && (
                          <a
                            href={tg.enlaceReunion}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary bg-surface-container-lowest px-2 py-1 rounded-md hover:bg-surface-container transition-colors"
                          >
                            <Icon className="text-[14px]">videocam</Icon>
                            <span>Conectarme a la reunión</span>
                            <Icon className="text-[12px]">open_in_new</Icon>
                          </a>
                        )}
                        {tg.enlaceGrabacion && (
                          <a
                            href={tg.enlaceGrabacion}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#15803d] bg-surface-container-lowest px-2 py-1 rounded-md hover:bg-surface-container transition-colors"
                          >
                            <Icon className="text-[14px]">play_circle</Icon>
                            <span>Ver grabación</span>
                            <Icon className="text-[12px]">open_in_new</Icon>
                          </a>
                        )}
                      </div>
                    </div>
                  )
                ) : (
                  <div className="mt-3 p-2 rounded-lg bg-surface-container-low text-[11px] text-on-surface-variant flex items-start gap-1.5">
                    <Icon className="text-[14px] text-outline shrink-0 mt-0.5">lock</Icon>
                    <span>
                      El enlace de reunión y la grabación solo son visibles para los estudiantes
                      inscritos en esta tutoría.
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-surface-container flex flex-wrap items-center justify-between gap-2">
                <div className="flex -space-x-2 overflow-hidden">
                  {participantesLista.slice(0, 2).map((p, idx) => (
                    <div
                      key={p.id}
                      className={`inline-flex h-7 w-7 rounded-full text-[10px] font-bold items-center justify-center ring-2 ring-surface-container-lowest ${
                        idx === 0
                          ? 'bg-primary-container text-on-primary'
                          : 'bg-secondary text-on-secondary'
                      }`}
                      title={p.nombre}
                    >
                      {getInitials(p.nombre)}
                    </div>
                  ))}
                  {totalInscritos > 2 && (
                    <div className="inline-flex h-7 w-7 rounded-full bg-tertiary-container text-white text-[10px] font-bold items-center justify-center ring-2 ring-surface-container-lowest">
                      +{totalInscritos - 2}
                    </div>
                  )}
                </div>

                {yaSoyParte ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="success" dot>
                      En lista de participantes
                    </Badge>
                    <Button
                      type="button"
                      variant="subtle"
                      size="sm"
                      onClick={onVerMisTutorias}
                    >
                      <span>Ver en Mis Tutorías</span>
                    </Button>
                  </div>
                ) : sinCupos ? (
                  <Button variant="subtle" size="sm" disabled>
                    <Icon className="text-[15px]">lock</Icon>
                    <span>
                      Sin cupos ({totalInscritos}/{cupo})
                    </span>
                  </Button>
                ) : (
                  <Button
                    variant="tonal"
                    size="sm"
                    loading={inscribiendoGrupalId === tg._id}
                    onClick={() => inscribirseEnGrupal(tg._id)}
                  >
                    <Icon className="text-[16px]">group_add</Icon>
                    <span>Inscribirme al Taller</span>
                  </Button>
                )}
              </div>
            </SurfaceCard>
          );
        })}
      </div>
    </section>
  );
}
