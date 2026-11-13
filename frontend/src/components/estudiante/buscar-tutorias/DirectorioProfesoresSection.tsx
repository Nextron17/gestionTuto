import { SurfaceCard } from '../../ui/SurfaceCard';
import { Icon } from '../../ui/Icon';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { CalloutBanner } from '../../ui/CalloutBanner';
import { HorarioItem, ProfesorConHorarios, getInitials } from './types';

interface DirectorioProfesoresSectionProps {
  profesoresFiltrados: ProfesorConHorarios[];
  userCarrera?: string;
  profesorSeleccionado: ProfesorConHorarios | null;
  setProfesorSeleccionado: (prof: ProfesorConHorarios | null) => void;
  abrirSolicitud: (prof: ProfesorConHorarios, horario?: HorarioItem) => void;
}

export function DirectorioProfesoresSection({
  profesoresFiltrados,
  userCarrera,
  profesorSeleccionado,
  setProfesorSeleccionado,
  abrirSolicitud,
}: DirectorioProfesoresSectionProps) {
  return (
    <>
      <section className="space-y-space-md min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="font-label-md text-[11px] uppercase tracking-wider text-outline font-semibold block">
              Mentoría Individual &amp; Grupal
            </span>
            <h2 className="text-lg sm:text-xl font-semibold text-on-surface">
              Profesores Disponibles
            </h2>
          </div>
          <Badge variant="neutral" className="self-start sm:self-auto">
            {profesoresFiltrados.length}{' '}
            {profesoresFiltrados.length === 1 ? 'profesor disponible' : 'profesores disponibles'}
          </Badge>
        </div>

        {profesoresFiltrados.length === 0 ? (
          <SurfaceCard tone="lowest" className="p-8 sm:p-10 text-center space-y-2">
            <Icon className="text-outline text-[36px]">search_off</Icon>
            <p className="text-sm text-on-surface-variant">
              No se encontraron profesores disponibles con ese criterio
              {userCarrera ? ` para ${userCarrera}` : ''}.
            </p>
          </SurfaceCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-space-md">
            {profesoresFiltrados.map((prof) => (
              <SurfaceCard
                key={prof._id}
                as="article"
                tone="lowest"
                interactive
                className="overflow-hidden flex flex-col justify-between"
              >
                <div className="min-w-0">
                  <div className="relative h-20 sm:h-24 bg-gradient-to-br from-primary/15 via-primary-fixed/60 to-surface-container">
                    <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-transparent to-transparent" />
                    <div className="absolute top-3 right-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-container-lowest/90 backdrop-blur text-primary font-label-md text-[11px] font-bold shadow-xs">
                        <Icon filled className="text-[13px] text-amber-500">
                          verified
                        </Icon>
                        <span>
                          {prof.horarios.length}{' '}
                          {prof.horarios.length === 1 ? 'franja' : 'franjas'}
                        </span>
                      </span>
                    </div>
                  </div>

                  <div className="px-4 sm:px-space-md pt-1 pb-4 sm:pb-space-md min-w-0">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 -mt-7 sm:-mt-8 rounded-full shadow-md bg-surface-container-lowest p-0.5 relative z-10 shrink-0">
                        <div className="w-full h-full rounded-full bg-primary text-on-primary font-bold text-sm sm:text-base flex items-center justify-center">
                          {getInitials(prof.nombre)}
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-label-md text-label-md font-bold text-on-surface leading-snug group-hover:text-primary transition-colors break-words">
                          {prof.nombre}
                        </h3>
                        <span className="block font-label-md text-[12px] text-on-surface-variant break-words">
                          {prof.carrera || prof.escuela || 'Docente Universitario'}
                        </span>
                      </div>
                    </div>

                    <p className="mt-3 font-body-md text-[12px] text-on-surface-variant flex items-center gap-1.5 min-w-0">
                      <Icon className="text-[15px] text-outline shrink-0">mail</Icon>
                      <span className="truncate">{prof.email}</span>
                    </p>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {prof.escuela && (
                        <span className="px-2 py-0.5 rounded bg-primary-fixed text-on-primary-fixed font-label-md text-[11px] font-medium break-words">
                          {prof.escuela}
                        </span>
                      )}
                      {prof.materias && prof.materias.length > 0 ? (
                        prof.materias.map((mat, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-label-md text-[11px] break-words"
                          >
                            {mat}
                          </span>
                        ))
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-surface-container text-outline font-label-md text-[11px]">
                          Tutoría General
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-3.5 sm:p-space-md bg-surface-container-low flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setProfesorSeleccionado(prof)}
                    className="font-label-md text-[12px] font-semibold text-on-surface-variant hover:text-primary inline-flex items-center gap-1 transition-colors cursor-pointer py-1"
                  >
                    <Icon className="text-[16px] text-primary">calendar_month</Icon>
                    <span>Horarios ({prof.horarios.length})</span>
                  </button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => abrirSolicitud(prof)}
                  >
                    <Icon className="text-[16px]">calendar_add_on</Icon>
                    <span>Solicitar Sesión</span>
                  </Button>
                </div>
              </SurfaceCard>
            ))}
          </div>
        )}
      </section>

      {profesorSeleccionado && (
        <SurfaceCard tone="lowest" className="p-4 sm:p-space-lg space-y-space-md">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 pb-3 border-b border-surface-container">
            <div className="min-w-0">
              <span className="font-label-md text-[11px] text-outline font-semibold uppercase tracking-wider block">
                Seleccionar Franja Horaria
              </span>
              <h3 className="text-base sm:text-lg font-bold text-on-surface flex items-center gap-2 mt-0.5">
                <Icon className="text-primary text-[20px]">event_available</Icon>
                <span className="break-words">{profesorSeleccionado.nombre}</span>
              </h3>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Haz clic en una franja horaria disponible para agendar tu tutoría directamente.
              </p>
            </div>
            <Button
              variant="subtle"
              size="sm"
              onClick={() => setProfesorSeleccionado(null)}
              className="self-start"
            >
              <Icon className="text-[16px]">close</Icon>
              <span>Cerrar</span>
            </Button>
          </div>

          {profesorSeleccionado.horarios.length === 0 ? (
            <CalloutBanner tone="info" title="Sin franjas fijas registradas">
              Este docente no tiene bloques de horario fijos publicados. Puedes enviar una
              solicitud proponiendo el horario que mejor se ajuste a tu disponibilidad.
            </CalloutBanner>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {profesorSeleccionado.horarios.map((h) => (
                <button
                  key={h._id}
                  type="button"
                  onClick={() => abrirSolicitud(profesorSeleccionado, h)}
                  className="py-2.5 px-3 rounded-lg bg-surface-container hover:bg-primary-fixed hover:text-primary transition-all text-on-surface font-label-md text-[12px] font-semibold flex items-center justify-between gap-2 cursor-pointer group active:scale-[0.98] text-left"
                >
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <span className="flex items-center gap-1.5 min-w-0">
                      <Icon className="text-[16px] text-primary shrink-0">schedule</Icon>
                      <span className="truncate">
                        {h.dia} {h.horaInicio} - {h.horaFin}
                      </span>
                    </span>
                    {(h.materia || h.semestre) && (
                      <span className="block text-[11px] font-normal text-on-surface-variant group-hover:text-primary/90 truncate pl-5">
                        {h.materia}
                        {h.materia && h.semestre ? ' • ' : ''}
                        {h.semestre ? `Sem. ${h.semestre}` : ''}
                      </span>
                    )}
                  </div>
                  <Icon className="text-[15px] text-outline group-hover:text-primary shrink-0">
                    arrow_forward
                  </Icon>
                </button>
              ))}
            </div>
          )}
        </SurfaceCard>
      )}
    </>
  );
}

