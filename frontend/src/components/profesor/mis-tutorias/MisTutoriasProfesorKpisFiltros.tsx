import { SurfaceCard } from '../../ui/SurfaceCard';
import { Icon } from '../../ui/Icon';
import { Badge } from '../../ui/Badge';
import { SearchInput } from '../../ui/SearchInput';
import { FormInput, FormSelect } from '../../ui/FormField';

interface MisTutoriasProfesorKpisFiltrosProps {
  totalTutorias: number;
  totalFinalizadas: number;
  totalEnCurso: number;
  filtroEstado: 'todas' | 'finalizada' | 'aceptada';
  setFiltroEstado: (value: 'todas' | 'finalizada' | 'aceptada') => void;
  hayFiltrosActivos: boolean;
  limpiarFiltros: () => void;
  busquedaTexto: string;
  setBusquedaTexto: (value: string) => void;
  filtroMateria: string;
  setFiltroMateria: (value: string) => void;
  materiasDisponibles: string[];
  filtroTema: string;
  setFiltroTema: (value: string) => void;
  temasDisponibles: string[];
  filtroFecha: string;
  setFiltroFecha: (value: string) => void;
  filtroModalidad: string;
  setFiltroModalidad: (value: string) => void;
}

export function MisTutoriasProfesorKpisFiltros({
  totalTutorias,
  totalFinalizadas,
  totalEnCurso,
  filtroEstado,
  setFiltroEstado,
  hayFiltrosActivos,
  limpiarFiltros,
  busquedaTexto,
  setBusquedaTexto,
  filtroMateria,
  setFiltroMateria,
  materiasDisponibles,
  filtroTema,
  setFiltroTema,
  temasDisponibles,
  filtroFecha,
  setFiltroFecha,
  filtroModalidad,
  setFiltroModalidad,
}: MisTutoriasProfesorKpisFiltrosProps) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-md">
        <SurfaceCard tone="lowest" className="p-space-md flex items-center justify-between">
          <div>
            <span className="font-label-md text-[11px] uppercase text-outline font-semibold tracking-wider block">
              Total Sesiones
            </span>
            <span className="font-headline-lg text-2xl font-bold text-on-surface mt-1 block">
              {totalTutorias}
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

      <SurfaceCard tone="lowest" className="p-4 sm:p-space-md space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-surface-container">
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { id: 'todas', label: `Todas (${totalTutorias})` },
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
    </>
  );
}

