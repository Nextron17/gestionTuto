import { SurfaceCard } from '../../ui/SurfaceCard';
import { Icon } from '../../ui/Icon';
import { Badge } from '../../ui/Badge';
import { FormSelect } from '../../ui/FormField';
import { Recurso, TIPOS_RECURSO, getTipoMeta } from './types';

interface ListaRecursosProfesorProps {
  escuelaFiltro: string;
  recursosFiltrados: Recurso[];
  materiaFiltro: string;
  setMateriaFiltro: (value: string) => void;
  materiasEnLista: string[];
  temaFiltro: string;
  setTemaFiltro: (value: string) => void;
  temasEnLista: string[];
  tipoFiltro: string;
  setTipoFiltro: (value: string) => void;
  cargando: boolean;
  userId?: string;
  eliminarMiRecurso: (recursoId: string) => void;
}

export function ListaRecursosProfesor({
  escuelaFiltro,
  recursosFiltrados,
  materiaFiltro,
  setMateriaFiltro,
  materiasEnLista,
  temaFiltro,
  setTemaFiltro,
  temasEnLista,
  tipoFiltro,
  setTipoFiltro,
  cargando,
  userId,
  eliminarMiRecurso,
}: ListaRecursosProfesorProps) {
  return (
    <SurfaceCard tone="lowest" className="p-4 sm:p-space-lg lg:col-span-2 space-y-space-md">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 pb-2 border-b border-surface-container">
        <h2 className="font-label-md text-base font-bold text-on-surface flex items-center gap-2 min-w-0">
          <Icon className="text-primary text-[20px] shrink-0">library_books</Icon>
          <span className="truncate">
            {escuelaFiltro === 'todas'
              ? 'Todos los Materiales Publicados'
              : `Materiales • ${escuelaFiltro}`}
          </span>
        </h2>
        <Badge variant="neutral" className="self-start sm:self-auto shrink-0">
          {recursosFiltrados.length}{' '}
          {recursosFiltrados.length === 1 ? 'recurso' : 'recursos'}
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <FormSelect
          id="filtro-recurso-materia"
          label="Materia"
          icon="menu_book"
          value={materiaFiltro}
          onChange={(e) => {
            setMateriaFiltro(e.target.value);
            setTemaFiltro('todos');
          }}
        >
          <option value="todas">Todas las materias</option>
          {materiasEnLista.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </FormSelect>

        <FormSelect
          id="filtro-recurso-tema"
          label="Tema"
          icon="topic"
          value={temaFiltro}
          onChange={(e) => setTemaFiltro(e.target.value)}
        >
          <option value="todos">Todos los temas</option>
          {temasEnLista.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </FormSelect>

        <FormSelect
          id="filtro-recurso-tipo"
          label="Tipo"
          icon="category"
          value={tipoFiltro}
          onChange={(e) => setTipoFiltro(e.target.value)}
        >
          <option value="todos">Todos los tipos</option>
          {TIPOS_RECURSO.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </FormSelect>
      </div>

      {cargando ? (
        <div className="py-8 text-sm text-on-surface-variant flex items-center gap-2">
          <Icon className="text-primary animate-pulse">hourglass_top</Icon>
          <span>Cargando recursos...</span>
        </div>
      ) : recursosFiltrados.length === 0 ? (
        <div className="p-8 sm:p-10 rounded-xl bg-surface-container-low text-center space-y-2">
          <Icon className="text-outline text-[36px]">folder_off</Icon>
          <p className="text-sm text-on-surface-variant">
            No hay materiales publicados con los filtros seleccionados.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {recursosFiltrados.map((r) => {
            const meta = getTipoMeta(r.tipo);
            const esAutor = Boolean(userId && r.profesor?._id === userId);
            return (
              <div
                key={r._id}
                className="p-3.5 sm:p-space-md bg-surface-container-low hover:bg-surface-container rounded-xl transition-colors flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3.5"
              >
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant={meta.badgeVariant} pill={false}>
                      <Icon className="text-[13px]">{meta.icon}</Icon>
                      <span>{meta.label}</span>
                    </Badge>
                    <Badge variant="primary" pill={false}>
                      {r.escuela || 'General'}
                    </Badge>
                    {r.claseOrigen && (
                      <Badge variant="success" dot>
                        {r.claseOrigen}
                      </Badge>
                    )}
                  </div>
                  <h4 className="font-label-md text-sm font-bold text-on-surface break-words">
                    {r.titulo}
                  </h4>
                  <p className="text-xs text-primary font-semibold flex flex-wrap items-center gap-1">
                    <Icon className="text-[14px] shrink-0">menu_book</Icon>
                    <span className="break-words">
                      {r.materia} {r.tema ? `• ${r.tema}` : ''}{' '}
                      {r.profesor ? `• Por ${r.profesor.nombre}` : ''}
                    </span>
                  </p>
                  <a
                    href={r.link}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-outline hover:text-primary underline truncate block font-mono"
                  >
                    {r.link}
                  </a>
                </div>

                <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                  <a
                    href={r.link}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 bg-primary hover:bg-primary-container text-on-primary font-label-md text-xs px-3.5 py-2.5 sm:py-2 rounded-lg font-semibold shadow-sm active:scale-[0.98] transition-all"
                  >
                    <Icon className="text-[16px]">open_in_new</Icon>
                    <span>Abrir</span>
                  </a>
                  {esAutor && (
                    <button
                      type="button"
                      onClick={() => eliminarMiRecurso(r._id)}
                      className="w-9 h-9 rounded-lg bg-surface-container hover:bg-error-container text-outline hover:text-error flex items-center justify-center transition-colors cursor-pointer shrink-0"
                      title="Eliminar recurso publicado"
                      aria-label={`Eliminar ${r.titulo}`}
                    >
                      <Icon className="text-[18px]">delete</Icon>
                    </button>
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
