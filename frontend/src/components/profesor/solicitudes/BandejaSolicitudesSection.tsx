import { SurfaceCard } from '../../ui/SurfaceCard';
import { Icon } from '../../ui/Icon';
import { SearchInput } from '../../ui/SearchInput';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import {
  FiltroEstado,
  Solicitud,
  formatearFechaLegible,
  renderBadgeEstado,
} from './types';

interface BandejaSolicitudesSectionProps {
  solicitudes: Solicitud[];
  solicitudesFiltradas: Solicitud[];
  busqueda: string;
  setBusqueda: (value: string) => void;
  filtroEstado: FiltroEstado;
  setFiltroEstado: (value: FiltroEstado) => void;
  tabsEstado: { id: FiltroEstado; label: string; count: number }[];
  abrirModalGestion: (sol: Solicitud, accion: 'aceptada' | 'aplazada') => void;
  abrirModalCancelacion: (sol: Solicitud) => void;
  restaurarAPendiente: (sol: Solicitud) => void;
}

export function BandejaSolicitudesSection({
  solicitudes,
  solicitudesFiltradas,
  busqueda,
  setBusqueda,
  filtroEstado,
  setFiltroEstado,
  tabsEstado,
  abrirModalGestion,
  abrirModalCancelacion,
  restaurarAPendiente,
}: BandejaSolicitudesSectionProps) {
  return (
    <SurfaceCard tone="lowest" className="p-4 sm:p-space-lg space-y-space-md">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-surface-container">
        <div className="min-w-0">
          <h2 className="text-base sm:text-lg font-bold text-on-surface flex items-center gap-2">
            <Icon className="text-tertiary text-[22px] shrink-0">pending_actions</Icon>
            <span>Solicitudes de Tutoría Recibidas</span>
          </h2>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Filtra por estado o busca por estudiante, materia, tema o fecha para gestionar tu agenda.
          </p>
        </div>
        <div className="w-full md:w-80">
          <SearchInput
            id="buscar-solicitudes-prof"
            placeholder="Buscar estudiante, materia, tema o fecha..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            onClear={() => setBusqueda('')}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
        {tabsEstado.map((tab) => {
          const activo = filtroEstado === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFiltroEstado(tab.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-label-md text-xs font-semibold transition-all cursor-pointer active:scale-95 ${
                activo
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  activo ? 'bg-white/20 text-white' : 'bg-surface-container-lowest text-on-surface'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {solicitudesFiltradas.length === 0 ? (
        <div className="p-6 sm:p-8 rounded-xl bg-surface-container-low text-center space-y-1.5">
          <Icon className="text-outline text-[32px]">task_alt</Icon>
          <p className="text-sm text-on-surface-variant">
            {solicitudes.length === 0
              ? 'Aún no has recibido solicitudes de tutoría.'
              : 'No hay solicitudes que coincidan con el filtro o búsqueda actual.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {solicitudesFiltradas.map((sol) => {
            const fechaMostrar = formatearFechaLegible(sol.fechaPropuesta || sol.createdAt);
            return (
              <div
                key={sol._id}
                className="p-3.5 sm:p-space-md rounded-xl bg-surface-container-low hover:bg-surface-container/70 transition-colors flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4"
              >
                <div className="space-y-2.5 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {renderBadgeEstado(sol.estado)}
                    {sol.modalidad && (
                      <Badge variant="neutral" pill={false} className="capitalize">
                        <Icon className="text-[13px]">
                          {sol.modalidad === 'presencial' ? 'location_on' : 'videocam'}
                        </Icon>
                        <span>{sol.modalidad}</span>
                      </Badge>
                    )}
                    <Badge variant={sol.tipo === 'grupal' ? 'secondary' : 'neutral'} pill={false}>
                      <Icon className="text-[13px]">
                        {sol.tipo === 'grupal' ? 'groups' : 'person'}
                      </Icon>
                      <span>
                        {sol.tipo === 'grupal'
                          ? `Grupal${sol.cupoMaximo ? ` (Cupo ${sol.cupoMaximo})` : ''}`
                          : 'Individual'}
                      </span>
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2 text-xs bg-surface-container-lowest/80 p-2.5 rounded-lg">
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase tracking-wider font-bold text-outline block">
                        Estudiante
                      </span>
                      <span className="font-semibold text-on-surface flex items-center gap-1 truncate">
                        <Icon className="text-[14px] text-primary shrink-0">school</Icon>
                        <span className="truncate">{sol.estudiante?.nombre || 'Estudiante'}</span>
                      </span>
                      {(sol.estudiante?.carrera || sol.estudiante?.semestre) && (
                        <span className="text-[11px] text-on-surface-variant block truncate">
                          {sol.estudiante?.carrera}
                          {sol.estudiante?.carrera && sol.estudiante?.semestre ? ' • ' : ''}
                          {sol.estudiante?.semestre ? `Sem. ${sol.estudiante.semestre}` : ''}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <span className="text-[10px] uppercase tracking-wider font-bold text-outline block">
                        Materia
                      </span>
                      <span className="font-semibold text-on-surface flex items-center gap-1 break-words">
                        <Icon className="text-[14px] text-primary shrink-0">menu_book</Icon>
                        <span>{sol.materia}</span>
                      </span>
                    </div>

                    <div className="min-w-0">
                      <span className="text-[10px] uppercase tracking-wider font-bold text-outline block">
                        Tema
                      </span>
                      <span className="font-semibold text-on-surface flex items-center gap-1 break-words">
                        <Icon className="text-[14px] text-secondary shrink-0">topic</Icon>
                        <span>{sol.tema || 'Tema general'}</span>
                      </span>
                    </div>

                    <div className="min-w-0">
                      <span className="text-[10px] uppercase tracking-wider font-bold text-outline block">
                        Fecha y Horario
                      </span>
                      <span className="font-semibold text-on-surface flex items-center gap-1">
                        <Icon className="text-[14px] text-tertiary shrink-0">event</Icon>
                        <span>{fechaMostrar}</span>
                      </span>
                      <span className="text-[11px] text-on-surface-variant block truncate">
                        {sol.hora || 'Franja por definir'}
                      </span>
                    </div>
                  </div>

                  <p className="font-body-md text-[13px] text-on-surface-variant leading-relaxed break-words">
                    {sol.descripcion}
                  </p>

                  {sol.modalidad === 'presencial' && sol.lugar && (
                    <div className="p-2.5 rounded-lg bg-primary-fixed/40 text-primary text-xs flex items-start gap-1.5">
                      <Icon className="text-[15px] shrink-0 mt-0.5">location_on</Icon>
                      <span className="break-words min-w-0">
                        <strong>Lugar presencial:</strong> {sol.lugar}
                      </span>
                    </div>
                  )}

                  {sol.comentarioProfesor && (
                    <div className="p-2.5 rounded-lg bg-[#fef3c7]/60 text-[#92400e] text-xs flex items-start gap-1.5">
                      <Icon className="text-[15px] text-tertiary shrink-0 mt-0.5">info</Icon>
                      <span className="break-words min-w-0">
                        <strong>Nota / Motivo docente:</strong> {sol.comentarioProfesor}
                      </span>
                    </div>
                  )}

                  {sol.estado === 'cancelada' && sol.canceladaPor === 'estudiante' && (
                    <div className="p-2.5 rounded-lg bg-error-container/30 text-error text-xs flex items-start gap-1.5">
                      <Icon className="text-[15px] shrink-0 mt-0.5">event_available</Icon>
                      <span className="break-words min-w-0">
                        <strong>Cancelada por el estudiante (horario liberado):</strong>{' '}
                        {sol.motivoCancelacion || 'El estudiante indicó que ya no puede asistir.'}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-surface-container-highest/60">
                  {(sol.estado === 'pendiente' || sol.estado === 'aplazada') && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => abrirModalGestion(sol, 'aceptada')}
                      className="flex-1 sm:flex-initial"
                    >
                      <Icon className="text-[16px]">check_circle</Icon>
                      <span>Aceptar</span>
                    </Button>
                  )}

                  {(sol.estado === 'pendiente' ||
                    sol.estado === 'aceptada' ||
                    sol.estado === 'aplazada') && (
                    <Button
                      variant="tonal"
                      size="sm"
                      onClick={() => abrirModalGestion(sol, 'aplazada')}
                      className="flex-1 sm:flex-initial"
                    >
                      <Icon className="text-[16px]">edit_calendar</Icon>
                      <span>Aplazar</span>
                    </Button>
                  )}

                  {(sol.estado === 'pendiente' ||
                    sol.estado === 'aceptada' ||
                    sol.estado === 'aplazada') && (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => abrirModalCancelacion(sol)}
                      className="flex-1 sm:flex-initial"
                    >
                      <Icon className="text-[16px]">cancel</Icon>
                      <span>Cancelar</span>
                    </Button>
                  )}

                  {(sol.estado === 'aplazada' || sol.estado === 'cancelada') && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => restaurarAPendiente(sol)}
                      className="w-full sm:w-auto"
                    >
                      <Icon className="text-[16px]">undo</Icon>
                      <span>Pasar a Pendiente</span>
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </SurfaceCard>
  );
}
