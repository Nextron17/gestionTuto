import { SurfaceCard } from '../../ui/SurfaceCard';
import { Icon } from '../../ui/Icon';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { HorarioItem, ProfesorConHorarios } from './types';

interface HorariosLibresSectionProps {
  horariosLibresFiltrados: HorarioItem[];
  horariosLibres: HorarioItem[];
  profesores: ProfesorConHorarios[];
  abrirSolicitud: (prof: ProfesorConHorarios, horario?: HorarioItem) => void;
}

export function HorariosLibresSection({
  horariosLibresFiltrados,
  horariosLibres,
  profesores,
  abrirSolicitud,
}: HorariosLibresSectionProps) {
  return (
    <section className="space-y-space-md min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="min-w-0">
          <span className="font-label-md text-[11px] uppercase tracking-wider text-outline font-semibold block">
            Disponibilidad en Tiempo Real
          </span>
          <h2 className="text-lg sm:text-xl font-semibold text-on-surface flex items-center gap-2">
            <Icon className="text-[#16a34a] text-[22px]">event_available</Icon>
            <span className="break-words">Horarios Disponibles (Aún Libres)</span>
          </h2>
        </div>
        <Badge variant="success" dot className="self-start sm:self-auto">
          {horariosLibresFiltrados.length}{' '}
          {horariosLibresFiltrados.length === 1 ? 'franja libre' : 'franjas libres'}
        </Badge>
      </div>

      {horariosLibresFiltrados.length === 0 ? (
        <SurfaceCard tone="lowest" className="p-6 sm:p-8 text-center space-y-1.5">
          <Icon className="text-outline text-[32px]">event_busy</Icon>
          <p className="text-sm text-on-surface-variant">
            No hay franjas horarias libres disponibles con los filtros actuales.
          </p>
        </SurfaceCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-space-md">
          {horariosLibresFiltrados.map((h) => {
            const profAsociado: ProfesorConHorarios = profesores.find(
              (p) => p._id === h.profesor?._id
            ) || {
              ...h.profesor,
              horarios: horariosLibres.filter((item) => item.profesor?._id === h.profesor?._id),
            };
            const nombreDocente = h.nombreProfesor || h.profesor?.nombre || 'Docente';

            return (
              <SurfaceCard
                key={h._id}
                as="article"
                tone="lowest"
                interactive
                className="p-4 flex flex-col justify-between gap-3.5"
              >
                <div className="space-y-2.5 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="success" dot>
                      Libre
                    </Badge>
                    {h.semestre && (
                      <Badge variant="neutral" pill={false}>
                        Semestre {h.semestre}
                      </Badge>
                    )}
                  </div>

                  <div className="p-2.5 rounded-lg bg-surface-container-low flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Icon className="text-[18px] text-primary shrink-0">schedule</Icon>
                      <div className="min-w-0">
                        <span className="font-label-md text-xs font-bold text-on-surface block truncate">
                          {h.dia}
                        </span>
                        <span className="font-mono text-xs text-primary font-semibold">
                          {h.horaInicio} - {h.horaFin}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1 min-w-0">
                    <p className="text-xs font-bold text-on-surface flex items-center gap-1.5 break-words">
                      <Icon className="text-[15px] text-primary shrink-0">menu_book</Icon>
                      <span>{h.materia || 'Tutoría Académica'}</span>
                    </p>
                    <p className="text-xs text-on-surface-variant flex items-center gap-1.5 min-w-0">
                      <Icon className="text-[15px] text-outline shrink-0">person</Icon>
                      <span className="truncate">{nombreDocente}</span>
                    </p>
                  </div>
                </div>

                <Button
                  variant="tonal"
                  size="sm"
                  fullWidth
                  onClick={() => abrirSolicitud(profAsociado, h)}
                >
                  <Icon className="text-[16px]">calendar_add_on</Icon>
                  <span>Escoger Horario</span>
                </Button>
              </SurfaceCard>
            );
          })}
        </div>
      )}
    </section>
  );
}
