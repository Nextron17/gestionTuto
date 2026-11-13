'use client';

import { Icon } from '../../ui/Icon';
import { SurfaceCard } from '../../ui/SurfaceCard';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { RecursoItem, formatFecha, getInitials } from './types';

interface TablaRecursosAdminProps {
  recursosTotalCount: number;
  recursosFiltrados: RecursoItem[];
  abrirModalEditar: (recurso: RecursoItem) => void;
  setRecursoAEliminar: (recurso: RecursoItem) => void;
}

export function TablaRecursosAdmin({
  recursosTotalCount,
  recursosFiltrados,
  abrirModalEditar,
  setRecursoAEliminar,
}: TablaRecursosAdminProps) {
  return (
    <SurfaceCard tone="lowest" className="overflow-hidden">
      {recursosFiltrados.length === 0 ? (
        <div className="p-10 text-center space-y-2">
          <Icon className="text-outline text-[36px]">folder_off</Icon>
          <p className="text-sm text-on-surface-variant">
            No se encontraron recursos publicados con los filtros seleccionados.
          </p>
        </div>
      ) : (
        <>
          <div className="md:hidden divide-y divide-surface-container">
            {recursosFiltrados.map((r) => (
              <div
                key={r._id}
                className="p-4 space-y-3 hover:bg-surface-container-low/60 transition-colors"
              >
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge variant="neutral" pill={false} className="capitalize">
                    {r.tipo || 'enlace'}
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

                <div className="space-y-1 min-w-0">
                  <h3 className="font-label-md text-sm font-bold text-on-surface break-words">
                    {r.titulo}
                  </h3>
                  <p className="text-xs text-primary font-semibold flex flex-wrap items-center gap-1">
                    <Icon className="text-[14px] shrink-0">menu_book</Icon>
                    <span>
                      {r.materia} {r.tema ? `• ${r.tema}` : ''}
                    </span>
                  </p>
                  <a
                    href={r.link}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-outline hover:text-primary underline break-all block font-mono"
                  >
                    {r.link}
                  </a>
                </div>

                <div className="p-2.5 rounded-lg bg-surface-container-low flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-bold text-[11px] flex items-center justify-center shrink-0">
                      {getInitials(r.profesor?.nombre)}
                    </div>
                    <div className="min-w-0">
                      <span className="block font-semibold text-on-surface truncate">
                        {r.profesor?.nombre || 'Docente no disponible'}
                      </span>
                      <span className="block text-[11px] text-outline truncate">
                        Publicado el {formatFecha(r.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <a
                    href={r.link}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-surface-container hover:bg-primary-fixed text-on-surface hover:text-primary font-label-md text-xs font-semibold transition-colors"
                  >
                    <Icon className="text-[16px]">open_in_new</Icon>
                    <span>Abrir</span>
                  </a>
                  <Button
                    variant="tonal"
                    size="sm"
                    onClick={() => abrirModalEditar(r)}
                    className="flex-1"
                  >
                    <Icon className="text-[16px]">edit</Icon>
                    <span>Editar</span>
                  </Button>
                  <button
                    type="button"
                    onClick={() => setRecursoAEliminar(r)}
                    aria-label={`Eliminar ${r.titulo}`}
                    className="p-2 rounded-lg bg-surface-container hover:bg-error-container text-outline hover:text-error inline-flex items-center justify-center transition-colors cursor-pointer shrink-0"
                  >
                    <Icon className="text-[18px]">delete</Icon>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left font-body-md text-body-md">
              <thead>
                <tr className="bg-surface-container-low text-outline font-label-md text-[11px] uppercase tracking-wider">
                  <th className="py-3.5 px-space-md font-semibold">Recurso &amp; Enlace</th>
                  <th className="py-3.5 px-space-md font-semibold">Escuela &amp; Asignatura</th>
                  <th className="py-3.5 px-space-md font-semibold">Docente Autor</th>
                  <th className="py-3.5 px-space-md font-semibold text-right">
                    Revisión &amp; Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="text-[13px]">
                {recursosFiltrados.map((r, idx) => (
                  <tr
                    key={r._id}
                    className={`hover:bg-surface-container-low transition-colors group align-top ${
                      idx % 2 === 1 ? 'bg-surface-container-lowest/60' : ''
                    }`}
                  >
                    <td className="py-3.5 px-space-md max-w-xs">
                      <div className="space-y-1 min-w-0">
                        <span className="font-label-md font-bold text-on-surface block break-words">
                          {r.titulo}
                        </span>
                        <a
                          href={r.link}
                          target="_blank"
                          rel="noreferrer"
                          className="font-mono text-[11px] text-primary hover:underline truncate block"
                          title={r.link}
                        >
                          {r.link}
                        </a>
                        <span className="text-[11px] text-outline flex items-center gap-1">
                          <Icon className="text-[13px]">calendar_today</Icon>
                          <span>Publicado: {formatFecha(r.createdAt)}</span>
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-space-md">
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge variant="neutral" pill={false} className="capitalize">
                            {r.tipo || 'enlace'}
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
                        <p className="text-xs font-medium text-on-surface">
                          {r.materia}
                          {r.tema && (
                            <span className="text-on-surface-variant font-normal">
                              {' '}
                              • {r.tema}
                            </span>
                          )}
                        </p>
                      </div>
                    </td>

                    <td className="py-3.5 px-space-md">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-bold flex items-center justify-center text-[11px] shrink-0">
                          {getInitials(r.profesor?.nombre)}
                        </div>
                        <div className="min-w-0">
                          <span className="block font-semibold text-on-surface font-label-md text-xs truncate">
                            {r.profesor?.nombre || 'Docente no disponible'}
                          </span>
                          <span className="block text-outline text-[11px] truncate">
                            {r.profesor?.email || 'Sin correo'}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-space-md text-right">
                      <div className="flex items-center justify-end gap-1">
                        <a
                          href={r.link}
                          target="_blank"
                          rel="noreferrer"
                          className="w-8 h-8 rounded-lg hover:bg-surface-container flex items-center justify-center text-outline hover:text-primary transition-colors"
                          title="Verificar enlace en nueva pestaña"
                        >
                          <Icon className="text-[18px]">open_in_new</Icon>
                        </a>
                        <button
                          type="button"
                          onClick={() => abrirModalEditar(r)}
                          className="w-8 h-8 rounded-lg hover:bg-surface-container flex items-center justify-center text-outline hover:text-primary transition-colors cursor-pointer"
                          title="Revisar y Editar Recurso"
                        >
                          <Icon className="text-[18px]">edit</Icon>
                        </button>
                        <button
                          type="button"
                          onClick={() => setRecursoAEliminar(r)}
                          className="w-8 h-8 rounded-lg hover:bg-error-container flex items-center justify-center text-outline hover:text-error transition-colors cursor-pointer"
                          title="Eliminar Recurso"
                        >
                          <Icon className="text-[18px]">delete</Icon>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-4 sm:px-space-md py-3 bg-surface-container-low flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 font-label-md text-[12px] text-outline">
            <span>
              Mostrando {recursosFiltrados.length} de {recursosTotalCount} recursos publicados
            </span>
            <span className="flex items-center gap-1">
              <Icon className="text-[15px] text-primary">verified</Icon>
              <span>Control de Pertinencia y Vigencia</span>
            </span>
          </div>
        </>
      )}
    </SurfaceCard>
  );
}
