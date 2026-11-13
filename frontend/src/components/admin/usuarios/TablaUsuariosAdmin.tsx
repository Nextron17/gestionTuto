'use client';

import { Icon } from '../../ui/Icon';
import { SurfaceCard } from '../../ui/SurfaceCard';
import { Badge } from '../../ui/Badge';
import { Usuario, getInitials } from './types';

interface TablaUsuariosAdminProps {
  usuariosTotalCount: number;
  usuariosFiltrados: Usuario[];
  cambiarRolRapido: (id: string, nuevoRol: string) => void;
  abrirModalEditar: (u: Usuario) => void;
  setUsuarioAEliminar: (u: Usuario) => void;
}

export function TablaUsuariosAdmin({
  usuariosTotalCount,
  usuariosFiltrados,
  cambiarRolRapido,
  abrirModalEditar,
  setUsuarioAEliminar,
}: TablaUsuariosAdminProps) {
  return (
    <SurfaceCard tone="lowest" className="overflow-hidden">
      {usuariosFiltrados.length === 0 ? (
        <div className="p-10 text-center space-y-2">
          <Icon className="text-outline text-[36px]">person_off</Icon>
          <p className="text-sm text-on-surface-variant">
            No se encontraron usuarios registrados con ese criterio.
          </p>
        </div>
      ) : (
        <>
          <div className="md:hidden divide-y divide-surface-container">
            {usuariosFiltrados.map((u) => {
              const avatarClass =
                u.rol === 'profesor'
                  ? 'bg-tertiary-fixed text-on-tertiary-fixed'
                  : u.rol === 'admin'
                  ? 'bg-surface-container-highest text-on-surface'
                  : 'bg-primary-fixed text-primary';

              return (
                <div key={u._id} className="p-4 space-y-3 hover:bg-surface-container-low/60 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-full font-bold flex items-center justify-center text-xs shrink-0 ${avatarClass}`}
                      >
                        {getInitials(u.nombre)}
                      </div>
                      <div className="min-w-0">
                        <span className="block font-semibold text-on-surface font-label-md text-sm truncate">
                          {u.nombre}
                        </span>
                        <span className="block text-outline text-xs truncate">
                          {u.email}
                        </span>
                      </div>
                    </div>

                    {u.rol === 'admin' ? (
                      <Badge variant="high" className="shrink-0">
                        <Icon className="text-[14px]">shield_person</Icon>
                        <span>Admin</span>
                      </Badge>
                    ) : u.rol === 'profesor' ? (
                      <Badge variant="tertiary" className="shrink-0">
                        <Icon className="text-[14px]">psychology</Icon>
                        <span>Docente</span>
                      </Badge>
                    ) : (
                      <Badge variant="primary" className="shrink-0">
                        <Icon className="text-[14px]">school</Icon>
                        <span>Estudiante</span>
                      </Badge>
                    )}
                  </div>

                  <div className="p-3 rounded-xl bg-surface-container-low text-xs text-on-surface-variant space-y-1.5">
                    {u.rol === 'admin' && (
                      <span className="text-outline italic flex items-center gap-1.5">
                        <Icon className="text-[14px] text-primary">verified_user</Icon>
                        <span>Acceso administrativo completo</span>
                      </span>
                    )}

                    {u.rol === 'profesor' && (
                      <>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-on-surface font-semibold">
                            {u.escuela || 'Escuela sin asignar'}
                          </span>
                          <span className="text-outline">•</span>
                          <span>{u.carrera || 'Carrera sin asignar'}</span>
                        </div>
                        {u.materias && u.materias.length > 0 ? (
                          <div className="flex flex-wrap gap-1 pt-0.5">
                            {u.materias.map((mat, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 rounded bg-surface-container-lowest text-on-surface-variant font-label-md text-[11px]"
                              >
                                {mat}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-outline text-[11px] block">
                            Sin materias asignadas
                          </span>
                        )}
                      </>
                    )}

                    {u.rol === 'estudiante' && (
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-medium text-on-surface">
                          {u.carrera || 'Carrera no especificada'}
                        </span>
                        {u.semestre && (
                          <span className="text-outline text-[11px] font-mono">
                            Semestre {u.semestre}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {u.rol !== 'admin' && (
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <div className="relative inline-flex items-center">
                        <select
                          value={u.rol}
                          onChange={(e) => cambiarRolRapido(u._id, e.target.value)}
                          aria-label={`Cambiar rol de ${u.nombre}`}
                          className="py-1.5 pl-2.5 pr-7 rounded-lg bg-surface-container text-on-surface-variant font-label-md text-xs appearance-none cursor-pointer hover:bg-surface-container-highest focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                          <option value="estudiante">Rol: Estudiante</option>
                          <option value="profesor">Rol: Profesor</option>
                        </select>
                        <Icon className="absolute right-1.5 text-[15px] text-outline pointer-events-none">
                          expand_more
                        </Icon>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => abrirModalEditar(u)}
                          className="px-2.5 py-1.5 rounded-lg bg-surface-container hover:bg-primary-fixed text-on-surface-variant hover:text-primary font-label-md text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Icon className="text-[16px]">edit</Icon>
                          <span>Editar</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setUsuarioAEliminar(u)}
                          className="p-1.5 rounded-lg bg-surface-container hover:bg-error-container text-outline hover:text-error inline-flex items-center justify-center transition-colors cursor-pointer"
                          title="Eliminar Usuario"
                        >
                          <Icon className="text-[16px]">delete</Icon>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left font-body-md text-body-md">
              <thead>
                <tr className="bg-surface-container-low text-outline font-label-md text-[11px] uppercase tracking-wider">
                  <th className="py-3.5 px-space-md font-semibold">Usuario</th>
                  <th className="py-3.5 px-space-md font-semibold">Rol / Nivel de Acceso</th>
                  <th className="py-3.5 px-space-md font-semibold">Asignación Académica</th>
                  <th className="py-3.5 px-space-md font-semibold text-right">
                    Acciones Rápidas
                  </th>
                </tr>
              </thead>
              <tbody className="text-[13px]">
                {usuariosFiltrados.map((u, idx) => {
                  const avatarClass =
                    u.rol === 'profesor'
                      ? 'bg-tertiary-fixed text-on-tertiary-fixed'
                      : u.rol === 'admin'
                      ? 'bg-surface-container-highest text-on-surface'
                      : 'bg-primary-fixed text-primary';

                  return (
                    <tr
                      key={u._id}
                      className={`hover:bg-surface-container-low transition-colors group align-top ${
                        idx % 2 === 1 ? 'bg-surface-container-lowest/60' : ''
                      }`}
                    >
                      <td className="py-3.5 px-space-md">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-full font-bold flex items-center justify-center text-[12px] shrink-0 ${avatarClass}`}
                          >
                            {getInitials(u.nombre)}
                          </div>
                          <div className="min-w-0">
                            <span className="block font-semibold text-on-surface font-label-md truncate">
                              {u.nombre}
                            </span>
                            <span className="block text-outline text-[11px] truncate">
                              {u.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-space-md">
                        <div className="flex flex-col items-start gap-1.5">
                          {u.rol === 'admin' ? (
                            <Badge variant="high">
                              <Icon className="text-[14px]">shield_person</Icon>
                              <span>Administrador</span>
                            </Badge>
                          ) : u.rol === 'profesor' ? (
                            <Badge variant="tertiary">
                              <Icon className="text-[14px]">psychology</Icon>
                              <span>Docente Tutor</span>
                            </Badge>
                          ) : (
                            <Badge variant="primary">
                              <Icon className="text-[14px]">school</Icon>
                              <span>Estudiante</span>
                            </Badge>
                          )}

                          {u.rol !== 'admin' && (
                            <div className="relative inline-flex items-center">
                              <select
                                value={u.rol}
                                onChange={(e) => cambiarRolRapido(u._id, e.target.value)}
                                aria-label={`Cambiar rol de ${u.nombre}`}
                                className="py-1 pl-2 pr-6 rounded-md bg-surface-container text-on-surface-variant font-label-md text-[11px] appearance-none cursor-pointer hover:bg-surface-container-highest focus:outline-none focus:ring-1 focus:ring-primary"
                              >
                                <option value="estudiante">Cambiar a Estudiante</option>
                                <option value="profesor">Cambiar a Profesor</option>
                              </select>
                              <Icon className="absolute right-1 text-[14px] text-outline pointer-events-none">
                                expand_more
                              </Icon>
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-space-md text-xs text-on-surface-variant">
                        {u.rol === 'admin' && (
                          <span className="text-outline italic flex items-center gap-1">
                            <Icon className="text-[14px] text-primary">verified_user</Icon>
                            <span>Acceso administrativo completo</span>
                          </span>
                        )}

                        {u.rol === 'profesor' && (
                          <div className="space-y-1.5">
                            <div className="flex flex-wrap gap-2">
                              <span className="text-on-surface font-medium">
                                {u.escuela || 'Escuela sin asignar'}
                              </span>
                              <span className="text-outline">•</span>
                              <span>{u.carrera || 'Carrera sin asignar'}</span>
                            </div>
                            {u.materias && u.materias.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {u.materias.map((mat, i) => (
                                  <span
                                    key={i}
                                    className="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-label-md text-[11px]"
                                  >
                                    {mat}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-outline text-[11px]">
                                Sin materias asignadas
                              </span>
                            )}
                          </div>
                        )}

                        {u.rol === 'estudiante' && (
                          <div className="space-y-0.5">
                            <span className="font-medium text-on-surface block">
                              {u.carrera || 'Carrera no especificada'}
                            </span>
                            {u.semestre && (
                              <span className="text-outline text-[11px] block">
                                Semestre {u.semestre}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-space-md text-right">
                        {u.rol === 'admin' ? (
                          <span className="text-[11px] text-outline font-label-md inline-flex items-center gap-1">
                            <Icon className="text-[14px]">lock</Icon>
                            <span>Protegido</span>
                          </span>
                        ) : (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => abrirModalEditar(u)}
                              className="w-8 h-8 rounded-lg hover:bg-surface-container flex items-center justify-center text-outline hover:text-primary transition-colors cursor-pointer"
                              title="Editar Usuario"
                            >
                              <Icon className="text-[18px]">edit</Icon>
                            </button>
                            <button
                              type="button"
                              onClick={() => setUsuarioAEliminar(u)}
                              className="w-8 h-8 rounded-lg hover:bg-error-container flex items-center justify-center text-outline hover:text-error transition-colors cursor-pointer"
                              title="Eliminar Usuario"
                            >
                              <Icon className="text-[18px]">delete</Icon>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="px-4 sm:px-space-md py-3 bg-surface-container-low flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 font-label-md text-[12px] text-outline">
            <span>
              Mostrando {usuariosFiltrados.length} de {usuariosTotalCount} registros
            </span>
            <span className="flex items-center gap-1">
              <Icon className="text-[15px] text-primary">verified</Icon>
              <span>Directorio Sincronizado</span>
            </span>
          </div>
        </>
      )}
    </SurfaceCard>
  );
}
