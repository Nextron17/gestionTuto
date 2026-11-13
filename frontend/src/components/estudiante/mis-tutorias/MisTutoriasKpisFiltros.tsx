import { SurfaceCard } from '../../ui/SurfaceCard';
import { Icon } from '../../ui/Icon';
import { Badge } from '../../ui/Badge';
import { SearchInput } from '../../ui/SearchInput';
import { Button } from '../../ui/Button';
import { FormInput, FormSelect } from '../../ui/FormField';

interface MisTutoriasKpisFiltrosProps {
  totalActivas: number;
  totalHistorial: number;
  totalAsistidas: number;
  totalConRegistroAsistencia: number;
  porcentajeAsistencia: number | null;
  totalGrabaciones: number;
  mostrarFiltros: boolean;
  busqueda: string;
  setBusqueda: (value: string) => void;
  filtroMateria: string;
  setFiltroMateria: (value: string) => void;
  materiasDisponibles: string[];
  filtroModalidad: string;
  setFiltroModalidad: (value: string) => void;
  filtroAsistencia: string;
  setFiltroAsistencia: (value: string) => void;
  filtroFecha: string;
  setFiltroFecha: (value: string) => void;
  hayFiltrosActivos: boolean;
  limpiarFiltros: () => void;
}

export function MisTutoriasKpisFiltros({
  totalActivas,
  totalHistorial,
  totalAsistidas,
  totalConRegistroAsistencia,
  porcentajeAsistencia,
  totalGrabaciones,
  mostrarFiltros,
  busqueda,
  setBusqueda,
  filtroMateria,
  setFiltroMateria,
  materiasDisponibles,
  filtroModalidad,
  setFiltroModalidad,
  filtroAsistencia,
  setFiltroAsistencia,
  filtroFecha,
  setFiltroFecha,
  hayFiltrosActivos,
  limpiarFiltros,
}: MisTutoriasKpisFiltrosProps) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-space-md">
        <SurfaceCard
          tone="lowest"
          className="p-4 sm:p-space-md flex items-center justify-between gap-3"
        >
          <div className="min-w-0">
            <span className="font-label-md text-[11px] uppercase text-outline font-semibold tracking-wider block">
              Sesiones Activas
            </span>
            <div className="flex flex-wrap items-baseline gap-2 mt-1">
              <span className="font-headline-lg text-2xl font-bold text-on-surface">
                {totalActivas}
              </span>
              <Badge variant="success" dot>
                Confirmadas
              </Badge>
            </div>
            <span className="text-on-surface-variant font-label-md text-[11px] mt-1 block">
              Con enlace o aula asignada
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-primary-fixed flex items-center justify-center text-primary shrink-0">
            <Icon className="text-[22px]">calendar_month</Icon>
          </div>
        </SurfaceCard>

        <SurfaceCard
          tone="lowest"
          className="p-4 sm:p-space-md flex items-center justify-between gap-3"
        >
          <div className="min-w-0">
            <span className="font-label-md text-[11px] uppercase text-outline font-semibold tracking-wider block">
              Tutorías Recibidas
            </span>
            <div className="flex flex-wrap items-baseline gap-2 mt-1">
              <span className="font-headline-lg text-2xl font-bold text-on-surface">
                {totalHistorial}
              </span>
              <Badge variant="primary">Historial</Badge>
            </div>
            <span className="text-on-surface-variant font-label-md text-[11px] mt-1 block">
              Sesiones completadas
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-secondary-fixed flex items-center justify-center text-secondary shrink-0">
            <Icon className="text-[22px]">history_edu</Icon>
          </div>
        </SurfaceCard>

        <SurfaceCard
          tone="lowest"
          className="p-4 sm:p-space-md flex items-center justify-between gap-3"
        >
          <div className="min-w-0">
            <span className="font-label-md text-[11px] uppercase text-outline font-semibold tracking-wider block">
              Asistencia Registrada
            </span>
            <div className="flex flex-wrap items-baseline gap-2 mt-1">
              <span className="font-headline-lg text-2xl font-bold text-on-surface">
                {totalAsistidas}
              </span>
              {porcentajeAsistencia !== null && (
                <Badge variant="success">{porcentajeAsistencia}%</Badge>
              )}
            </div>
            <span className="text-on-surface-variant font-label-md text-[11px] mt-1 block">
              {totalConRegistroAsistencia > 0
                ? `${totalAsistidas} de ${totalConRegistroAsistencia} evaluadas`
                : 'Sin registros evaluados aún'}
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[#16a34a]/15 flex items-center justify-center text-[#16a34a] shrink-0">
            <Icon className="text-[22px]">how_to_reg</Icon>
          </div>
        </SurfaceCard>

        <SurfaceCard
          tone="lowest"
          className="p-4 sm:p-space-md flex items-center justify-between gap-3"
        >
          <div className="min-w-0">
            <span className="font-label-md text-[11px] uppercase text-outline font-semibold tracking-wider block">
              Grabaciones
            </span>
            <div className="flex flex-wrap items-baseline gap-2 mt-1">
              <span className="font-headline-lg text-2xl font-bold text-on-surface">
                {totalGrabaciones}
              </span>
              <Badge variant="secondary">Repaso</Badge>
            </div>
            <span className="text-on-surface-variant font-label-md text-[11px] mt-1 block">
              Exclusivas para inscritos
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-primary-fixed/60 flex items-center justify-center text-primary shrink-0">
            <Icon className="text-[22px]">video_library</Icon>
          </div>
        </SurfaceCard>
      </div>

      {mostrarFiltros && (
        <SurfaceCard tone="lowest" className="p-4 sm:p-space-md space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
            <div className="lg:col-span-2">
              <SearchInput
                placeholder="Buscar por materia, tema o profesor..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                onClear={() => setBusqueda('')}
              />
            </div>

            <FormSelect
              id="filtro-historial-materia"
              label="Materia"
              icon="menu_book"
              value={filtroMateria}
              onChange={(e) => setFiltroMateria(e.target.value)}
            >
              <option value="">Todas las materias</option>
              {materiasDisponibles.map((mat) => (
                <option key={mat} value={mat}>
                  {mat}
                </option>
              ))}
            </FormSelect>

            <FormSelect
              id="filtro-historial-modalidad"
              label="Modalidad"
              icon="videocam"
              value={filtroModalidad}
              onChange={(e) => setFiltroModalidad(e.target.value)}
            >
              <option value="">Todas</option>
              <option value="virtual">Virtual</option>
              <option value="presencial">Presencial</option>
            </FormSelect>

            <FormSelect
              id="filtro-historial-asistencia"
              label="Asistencia"
              icon="how_to_reg"
              value={filtroAsistencia}
              onChange={(e) => setFiltroAsistencia(e.target.value)}
            >
              <option value="">Todas</option>
              <option value="asistio">Asistió</option>
              <option value="no_asistio">No asistió</option>
              <option value="pendiente">Pendiente</option>
            </FormSelect>
          </div>

          <div className="flex flex-wrap items-end justify-between gap-3 pt-1">
            <div className="w-full sm:w-56">
              <FormInput
                id="filtro-historial-fecha"
                type="date"
                label="Filtrar por fecha"
                icon="event"
                value={filtroFecha}
                onChange={(e) => setFiltroFecha(e.target.value)}
              />
            </div>

            {hayFiltrosActivos && (
              <Button type="button" variant="subtle" size="sm" onClick={limpiarFiltros}>
                <Icon className="text-[16px]">filter_alt_off</Icon>
                <span>Limpiar filtros</span>
              </Button>
            )}
          </div>
        </SurfaceCard>
      )}
    </>
  );
}
