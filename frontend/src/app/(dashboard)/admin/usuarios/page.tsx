'use client';

import { useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import api from '../../../../lib/api';
import { Icon } from '../../../../components/ui/Icon';
import { PageHeader } from '../../../../components/ui/PageHeader';
import { SearchInput } from '../../../../components/ui/SearchInput';
import { FormInput, FormSelect } from '../../../../components/ui/FormField';
import { SurfaceCard } from '../../../../components/ui/SurfaceCard';
import { Badge } from '../../../../components/ui/Badge';
import { Button } from '../../../../components/ui/Button';
import { Modal } from '../../../../components/ui/Modal';
import { CalloutBanner } from '../../../../components/ui/CalloutBanner';

interface Usuario {
  _id: string;
  nombre: string;
  email: string;
  rol: 'estudiante' | 'profesor' | 'admin';
  escuela?: string;
  carrera?: string;
  semestre?: number;
  materias?: string[];
}

interface Escuela {
  _id: string;
  nombre: string;
  codigo: string;
}

interface Carrera {
  _id: string;
  nombre: string;
  codigo: string;
  escuela?: { _id: string; nombre: string };
}

interface Materia {
  _id: string;
  nombre: string;
  codigo: string;
  carrera?: { _id: string; nombre: string };
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
}

export default function AdminUsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [escuelas, setEscuelas] = useState<Escuela[]>([]);
  const [carreras, setCarreras] = useState<Carrera[]>([]);
  const [materiasCatalogo, setMateriasCatalogo] = useState<Materia[]>([]);
  const [cargando, setCargando] = useState(true);

  const [busqueda, setBusqueda] = useState('');
  const [filtroRol, setFiltroRol] = useState<string>('todos');

  const [modalAbierto, setModalAbierto] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState<Usuario | null>(null);
  const [guardandoUsuario, setGuardandoUsuario] = useState(false);
  const [errorForm, setErrorForm] = useState('');

  const [usuarioAEliminar, setUsuarioAEliminar] = useState<Usuario | null>(null);
  const [eliminando, setEliminando] = useState(false);

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState<'estudiante' | 'profesor' | 'admin'>('estudiante');
  const [escuela, setEscuela] = useState('');
  const [carrera, setCarrera] = useState('');
  const [semestre, setSemestre] = useState('');
  const [materiasSeleccionadas, setMateriasSeleccionadas] = useState<string[]>([]);

  const cargarDatosAPI = async () => {
    try {
      const [resUsuarios, resCatalogo] = await Promise.all([
        api.get('/admin/usuarios'),
        api.get('/admin/catalogo'),
      ]);
      setUsuarios(resUsuarios.data);
      setEscuelas(resCatalogo.data.escuelas || []);
      setCarreras(resCatalogo.data.carreras || []);
      setMateriasCatalogo(resCatalogo.data.materias || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const cargarInicial = async () => {
      await cargarDatosAPI();
      setCargando(false);
    };
    cargarInicial();
  }, []);

  const abrirModalCrear = () => {
    setUsuarioEditando(null);
    setNombre('');
    setEmail('');
    setPassword('');
    setRol('estudiante');
    setEscuela('');
    setCarrera('');
    setSemestre('');
    setMateriasSeleccionadas([]);
    setErrorForm('');
    setModalAbierto(true);
  };

  const abrirModalEditar = (u: Usuario) => {
    if (u.rol === 'admin') return;
    setUsuarioEditando(u);
    setNombre(u.nombre);
    setEmail(u.email);
    setPassword('');
    setRol(u.rol);
    setEscuela(u.escuela || '');
    setCarrera(u.carrera || '');
    setSemestre(u.semestre ? String(u.semestre) : '');
    setMateriasSeleccionadas(u.materias || []);
    setErrorForm('');
    setModalAbierto(true);
  };

  const toggleMateria = (nombreMateria: string) => {
    setMateriasSeleccionadas((prev) =>
      prev.includes(nombreMateria)
        ? prev.filter((m) => m !== nombreMateria)
        : [...prev, nombreMateria]
    );
  };

  const guardarUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorForm('');
    setGuardandoUsuario(true);

    try {
      const payload = {
        nombre,
        email,
        password,
        rol,
        escuela: rol === 'profesor' ? escuela : undefined,
        carrera: rol === 'profesor' || rol === 'estudiante' ? carrera : undefined,
        semestre: rol === 'estudiante' && semestre ? Number(semestre) : undefined,
        materias: rol === 'profesor' ? materiasSeleccionadas : [],
      };

      if (usuarioEditando) {
        await api.put(`/admin/usuarios/${usuarioEditando._id}`, payload);
      } else {
        await api.post('/admin/usuarios', payload);
      }

      setModalAbierto(false);
      await cargarDatosAPI();
    } catch (err) {
      const errorAxios = err as AxiosError<{ message: string }>;
      setErrorForm(errorAxios.response?.data?.message || 'Error al guardar el usuario');
    } finally {
      setGuardandoUsuario(false);
    }
  };

  const cambiarRolRapido = async (id: string, nuevoRol: string) => {
    try {
      await api.patch(`/admin/usuarios/${id}/rol`, { rol: nuevoRol });
      await cargarDatosAPI();
    } catch (err) {
      console.error(err);
    }
  };

  const confirmarEliminarUsuario = async () => {
    if (!usuarioAEliminar) return;
    setEliminando(true);
    try {
      await api.delete(`/admin/usuarios/${usuarioAEliminar._id}`);
      setUsuarioAEliminar(null);
      await cargarDatosAPI();
    } catch (err) {
      console.error(err);
    } finally {
      setEliminando(false);
    }
  };

  const escuelaSeleccionadaObj = escuelas.find((e) => e.nombre === escuela);
  const carrerasFiltradas = escuelaSeleccionadaObj
    ? carreras.filter(
        (c) =>
          c.escuela?._id === escuelaSeleccionadaObj._id ||
          c.escuela?.nombre === escuelaSeleccionadaObj.nombre
      )
    : carreras;

  const carreraSeleccionadaObj = carreras.find((c) => c.nombre === carrera);
  const materiasFiltradas = carreraSeleccionadaObj
    ? materiasCatalogo.filter(
        (m) =>
          m.carrera?._id === carreraSeleccionadaObj._id ||
          m.carrera?.nombre === carreraSeleccionadaObj.nombre
      )
    : materiasCatalogo;

  const usuariosFiltrados = usuarios.filter((u) => {
    const okRol = filtroRol === 'todos' || u.rol === filtroRol;
    const q = busqueda.toLowerCase();
    if (!q) return okRol;
    const okTexto =
      u.nombre.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.carrera && u.carrera.toLowerCase().includes(q)) ||
      (u.escuela && u.escuela.toLowerCase().includes(q));
    return okRol && okTexto;
  });

  if (cargando) {
    return (
      <div className="max-w-6xl mx-auto py-8 text-sm text-on-surface-variant flex items-center gap-2">
        <Icon className="text-primary animate-pulse">hourglass_top</Icon>
        <span>Cargando directorio de usuarios...</span>
      </div>
    );
  }

  return (
    <div className="space-y-space-lg max-w-6xl mx-auto">
      <PageHeader
        eyebrow="01. Control de Acceso y Perfiles"
        title="Gestión de Usuarios"
        description="Crea cuentas institucionales y administra la asignación académica de docentes y estudiantes."
        actions={
          <Button variant="primary" onClick={abrirModalCrear} className="w-full sm:w-auto">
            <Icon className="text-[18px]">person_add</Icon>
            <span>Crear Usuario</span>
          </Button>
        }
      />

      {/* Barra de Búsqueda y Filtros por Rol */}
      <SurfaceCard tone="lowest" className="p-4 sm:p-space-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="w-full md:flex-1 md:max-w-md">
          <SearchInput
            placeholder="Buscar por nombre, correo, escuela o carrera..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            onClear={() => setBusqueda('')}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'todos', label: 'Todos', count: usuarios.length },
            {
              id: 'estudiante',
              label: 'Estudiantes',
              count: usuarios.filter((u) => u.rol === 'estudiante').length,
            },
            {
              id: 'profesor',
              label: 'Profesores',
              count: usuarios.filter((u) => u.rol === 'profesor').length,
            },
            {
              id: 'admin',
              label: 'Administradores',
              count: usuarios.filter((u) => u.rol === 'admin').length,
            },
          ].map((tab) => {
            const active = filtroRol === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFiltroRol(tab.id)}
                className={`px-3 py-1.5 rounded-full font-label-md text-[12px] font-semibold transition-all cursor-pointer active:scale-95 ${
                  active
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            );
          })}
        </div>
      </SurfaceCard>

      {/* Tabla Canónica de Gestión (Sección 07 de code.html) */}
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
            {/* Vista Mobile: Tarjetas de Usuarios (< md) */}
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

                    {/* Asignación académica */}
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

                    {/* Acciones rápidas en mobile */}
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

            {/* Vista Desktop: Tabla Canónica (md+) */}
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
                Mostrando {usuariosFiltrados.length} de {usuarios.length} registros
              </span>
              <span className="flex items-center gap-1">
                <Icon className="text-[15px] text-primary">verified</Icon>
                <span>Directorio Sincronizado</span>
              </span>
            </div>
          </>
        )}
      </SurfaceCard>

      {/* Modal Canónico para Crear / Editar Usuario */}
      <Modal
        open={modalAbierto}
        onClose={() => setModalAbierto(false)}
        title={
          usuarioEditando
            ? `Editar Usuario: ${usuarioEditando.nombre}`
            : 'Crear Nuevo Usuario Institucional'
        }
        subtitle="Completa los datos de acceso y perfil académico"
        icon={usuarioEditando ? 'manage_accounts' : 'person_add'}
        tone="primary"
        maxWidthClassName="max-w-xl"
        footer={
          <>
            <Button variant="subtle" size="sm" onClick={() => setModalAbierto(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form="form-admin-usuario"
              variant="primary"
              size="sm"
              loading={guardandoUsuario}
            >
              <Icon className="text-[16px]">save</Icon>
              <span>{usuarioEditando ? 'Guardar Cambios' : 'Crear Usuario'}</span>
            </Button>
          </>
        }
      >
        {errorForm && (
          <CalloutBanner tone="danger" title="Error de validación">
            {errorForm}
          </CalloutBanner>
        )}

        <form id="form-admin-usuario" onSubmit={guardarUsuario} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormInput
              id="user-nombre"
              label="Nombre Completo"
              icon="person"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Dra. Marcela Restrepo"
              required
            />

            <FormInput
              id="user-email"
              type="email"
              label="Correo Institucional"
              icon="mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@universidad.edu"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormInput
              id="user-password"
              type="password"
              label={usuarioEditando ? 'Nueva Contraseña (Opcional)' : 'Contraseña de Acceso'}
              icon="lock"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={usuarioEditando ? 'Dejar vacío para mantener' : '••••••••'}
              required={!usuarioEditando}
            />

            <FormSelect
              id="user-rol"
              label="Rol del Usuario"
              icon="badge"
              value={rol}
              onChange={(e) =>
                setRol(e.target.value as 'estudiante' | 'profesor' | 'admin')
              }
            >
              <option value="estudiante">Estudiante</option>
              <option value="profesor">Docente Tutor (Profesor)</option>
              {!usuarioEditando && <option value="admin">Administrador</option>}
            </FormSelect>
          </div>

          {rol === 'profesor' && (
            <div className="p-space-md bg-surface-container-low rounded-xl space-y-3.5">
              <span className="font-label-md text-[11px] font-semibold text-outline uppercase tracking-wider block">
                Asignación Académica del Profesor
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormSelect
                  id="prof-escuela"
                  label="Escuela / Facultad"
                  icon="domain"
                  value={escuela}
                  onChange={(e) => {
                    setEscuela(e.target.value);
                    setCarrera('');
                  }}
                >
                  <option value="">Seleccionar Escuela...</option>
                  {escuelas.map((esc) => (
                    <option key={esc._id} value={esc.nombre}>
                      {esc.nombre} ({esc.codigo})
                    </option>
                  ))}
                </FormSelect>

                <FormSelect
                  id="prof-carrera"
                  label="Carrera Principal"
                  icon="school"
                  value={carrera}
                  onChange={(e) => setCarrera(e.target.value)}
                >
                  <option value="">Seleccionar Carrera...</option>
                  {carrerasFiltradas.map((car) => (
                    <option key={car._id} value={car.nombre}>
                      {car.nombre} ({car.codigo})
                    </option>
                  ))}
                </FormSelect>
              </div>

              <div>
                <label className="block font-label-md text-[13px] font-semibold text-on-surface mb-1.5">
                  Materias que Imparte
                </label>
                {materiasFiltradas.length === 0 ? (
                  <p className="text-xs text-outline bg-surface-container-lowest p-3 rounded-lg">
                    {carrera
                      ? 'No hay materias registradas para esta carrera en el catálogo.'
                      : 'Selecciona una carrera o crea materias en el Catálogo Académico.'}
                  </p>
                ) : (
                  <div className="max-h-36 overflow-y-auto space-y-1 bg-surface-container-lowest p-2.5 rounded-lg">
                    {materiasFiltradas.map((mat) => (
                      <label
                        key={mat._id}
                        className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-surface-container cursor-pointer transition-colors text-xs text-on-surface"
                      >
                        <input
                          type="checkbox"
                          checked={materiasSeleccionadas.includes(mat.nombre)}
                          onChange={() => toggleMateria(mat.nombre)}
                          className="w-4 h-4 rounded accent-primary cursor-pointer"
                        />
                        <span className="font-medium">{mat.nombre}</span>
                        <span className="text-outline font-mono text-[11px]">({mat.codigo})</span>
                      </label>
                    ))}
                  </div>
                )}

                {materiasSeleccionadas.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {materiasSeleccionadas.map((mat, idx) => (
                      <Badge
                        key={idx}
                        variant="primary"
                        onRemove={() => toggleMateria(mat)}
                      >
                        {mat}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {rol === 'estudiante' && (
            <div className="p-space-md bg-surface-container-low rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormSelect
                id="est-carrera"
                label="Carrera"
                icon="school"
                value={carrera}
                onChange={(e) => setCarrera(e.target.value)}
              >
                <option value="">Seleccionar Carrera...</option>
                {carreras.map((car) => (
                  <option key={car._id} value={car.nombre}>
                    {car.nombre}
                  </option>
                ))}
              </FormSelect>

              <FormInput
                id="est-semestre"
                type="number"
                min={1}
                max={12}
                label="Semestre Actual"
                icon="format_list_numbered"
                value={semestre}
                onChange={(e) => setSemestre(e.target.value)}
                placeholder="Ej: 4"
              />
            </div>
          )}
        </form>
      </Modal>

      {/* Modal Canónico para Confirmar Eliminación de Usuario */}
      <Modal
        open={Boolean(usuarioAEliminar)}
        onClose={() => setUsuarioAEliminar(null)}
        title="Confirmar Eliminación de Usuario"
        icon="warning"
        tone="danger"
        footer={
          <>
            <Button variant="subtle" size="sm" onClick={() => setUsuarioAEliminar(null)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              size="sm"
              loading={eliminando}
              onClick={confirmarEliminarUsuario}
            >
              Sí, Eliminar Usuario
            </Button>
          </>
        }
      >
        <p className="font-body-md text-sm text-on-surface leading-relaxed">
          ¿Estás seguro de que deseas eliminar permanentemente la cuenta de{' '}
          <strong>{usuarioAEliminar?.nombre}</strong> ({usuarioAEliminar?.email})?
        </p>
        <div className="p-space-sm rounded-lg bg-surface-container text-on-surface-variant font-label-md text-[12px] flex items-start gap-2">
          <Icon className="text-error text-[16px] shrink-0 mt-0.5">report</Icon>
          <span>Esta acción revocará de inmediato el acceso del usuario a la plataforma.</span>
        </div>
      </Modal>
    </div>
  );
}
