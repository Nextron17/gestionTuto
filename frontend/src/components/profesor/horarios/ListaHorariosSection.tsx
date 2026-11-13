import { SurfaceCard } from '../../ui/SurfaceCard';
import { Icon } from '../../ui/Icon';
import { Badge } from '../../ui/Badge';
import { FormSelect } from '../../ui/FormField';
import { DIAS_SEMANA, Horario } from './types';

interface ListaHorariosSectionProps {
  cargando: boolean;
  horarios: Horario[];
  horariosFiltrados: Horario[];
  materiasRegistradas: string[];
  filtroMateria: string;
  setFiltroMateria: (value: string) => void;
  filtroDia: string;
  setFiltroDia: (value: string) => void;
  abrirModalEditar: (h: Horario) => void;
  abrirModalEliminar: (h: Horario) => void;
}

export function ListaHorariosSection({
  cargando,
  horarios,
  horariosFiltrados,
  materiasRegistradas,
  filtroMateria,
  setFiltroMateria,
  filtroDia,
  setFiltroDia,
  abrirModalEditar,
  abrirModalEliminar,
}: ListaHorariosSectionProps) {
  return (
    <SurfaceCard tone="lowest" className="p-4 sm:p-space-lg lg:col-span-7 space-y-space-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-surface-container">
        <div className="min-w-0">
          <h2 className="font-label-md text-base font-bold text-on-surface flex items-center gap-2">
            <Icon className="text-primary text-[20px] shrink-0">event_available</Icon>
            <span>Horarios Registrados</span>
          </h2>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Visibles para los estudiantes al buscar tutorías por profesor y asignatura.
          </p>
        </div>
        <Badge variant="neutral" className="self-start sm:self-auto shrink-0">
          {horariosFiltrados.length} de {horarios.length} bloques
        </Badge>
      </div>

      {horarios.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormSelect
            id="filtro-horarios-materia"
            label="Filtrar por Asignatura"
            icon="menu_book"
            value={filtroMateria}
            onChange={(e) => setFiltroMateria(e.target.value)}
          >
            <option value="todas">Todas las asignaturas</option>
            {materiasRegistradas.map((mat) => (
              <option key={mat} value={mat}>
                {mat}
              </option>
            ))}
          </FormSelect>

          <FormSelect
            id="filtro-horarios-dia"
            label="Filtrar por Día"
            icon="event"
            value={filtroDia}
            onChange={(e) => setFiltroDia(e.target.value)}
          >
            <option value="todos">Todos los días</option>
            {DIAS_SEMANA.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </FormSelect>
        </div>
      )}

      {cargando ? (
        <div className="p-8 text-center text-sm text-on-surface-variant">
          Cargando disponibilidad horaria...
        </div>
      ) : horariosFiltrados.length === 0 ? (
        <div className="p-10 rounded-xl bg-surface-container-low text-center space-y-2">
          <Icon className="text-outline text-[36px]">event_busy</Icon>
          <p className="text-sm text-on-surface-variant">
            {horarios.length === 0
              ? 'No has agregado bloques de horario aún. Usa el formulario lateral para añadir tu disponibilidad.'
              : 'No hay bloques horarios que coincidan con los filtros seleccionados.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {horariosFiltrados.map((h) => (
            <div
              key={h._id}
              className="flex justify-between items-start gap-3 p-4 bg-surface-container-low hover:bg-surface-container rounded-xl transition-colors group"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-primary-fixed text-primary flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="text-[20px]">schedule</Icon>
                </div>
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-label-md text-sm font-bold text-on-surface">{h.dia}</p>
                    <span className="font-mono text-xs text-primary font-semibold">
                      {h.horaInicio} - {h.horaFin}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {h.materia && (
                      <Badge variant="primary" pill={false}>
                        <Icon className="text-[12px]">menu_book</Icon>
                        <span className="truncate max-w-[180px]">{h.materia}</span>
                      </Badge>
                    )}
                    {h.semestre && (
                      <Badge variant="neutral" pill={false}>
                        Semestre {h.semestre}
                      </Badge>
                    )}
                  </div>

                  {h.nombreProfesor && (
                    <p className="text-[11px] text-on-surface-variant flex items-center gap-1 truncate">
                      <Icon className="text-[13px] text-outline shrink-0">person</Icon>
                      <span className="truncate">{h.nombreProfesor}</span>
                    </p>
                  )}

                  {h.tutoriasAceptadas && h.tutoriasAceptadas.length > 0 && (
                    <div className="pt-0.5">
                      <Badge variant="warning" dot>
                        {h.tutoriasAceptadas.length}{' '}
                        {h.tutoriasAceptadas.length === 1
                          ? 'tutoría aceptada'
                          : 'tutorías aceptadas'}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => abrirModalEditar(h)}
                  aria-label={`Editar horario ${h.dia} ${h.horaInicio}`}
                  className="w-8 h-8 rounded-lg hover:bg-primary-fixed text-outline hover:text-primary flex items-center justify-center transition-colors cursor-pointer"
                  title="Editar franja horaria"
                >
                  <Icon className="text-[18px]">edit</Icon>
                </button>
                <button
                  type="button"
                  onClick={() => abrirModalEliminar(h)}
                  aria-label={`Eliminar horario ${h.dia} ${h.horaInicio}`}
                  className="w-8 h-8 rounded-lg hover:bg-error-container text-outline hover:text-error flex items-center justify-center transition-colors cursor-pointer"
                  title={
                    h.tutoriasAceptadas && h.tutoriasAceptadas.length > 0
                      ? 'Tiene tutorías aceptadas asociadas'
                      : 'Eliminar franja'
                  }
                >
                  <Icon className="text-[18px]">delete</Icon>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </SurfaceCard>
  );
}
