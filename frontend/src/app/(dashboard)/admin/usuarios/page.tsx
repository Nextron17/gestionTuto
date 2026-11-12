'use client';

import { useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import api from '../../../../lib/api';

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

export default function AdminUsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [escuelas, setEscuelas] = useState<Escuela[]>([]);
  const [carreras, setCarreras] = useState<Carrera[]>([]);
  const [materiasCatalogo, setMateriasCatalogo] = useState<Materia[]>([]);
  const [cargando, setCargando] = useState(true);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState<Usuario | null>(null);
  const [errorForm, setErrorForm] = useState('');

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

  const eliminarUsuario = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este usuario?')) return;
    try {
      await api.delete(`/admin/usuarios/${id}`);
      await cargarDatosAPI();
    } catch (err) {
      console.error(err);
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

  if (cargando) {
    return <div className="text-gray-500">Cargando usuarios...</div>;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Gestión de Usuarios</h1>
          <p className="text-sm text-gray-500">
            Crea cuentas y administra información académica de profesores y estudiantes
          </p>
        </div>
        <button
          onClick={abrirModalCrear}
          className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition self-start sm:self-auto"
        >
          + Crear Usuario
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
        {usuarios.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            No hay usuarios registrados en la base de datos.
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
            <thead className="bg-gray-50 text-gray-700 font-semibold">
              <tr>
                <th className="px-6 py-3">Usuario</th>
                <th className="px-6 py-3">Rol</th>
                <th className="px-6 py-3">Datos Académicos</th>
                <th className="px-6 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {usuarios.map((u) => (
                <tr key={u._id} className="hover:bg-gray-50 align-top">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-800">{u.nombre}</p>
                    <p className="text-xs text-gray-500">{u.email}</p>
                  </td>

                  <td className="px-6 py-4">
                    {u.rol === 'admin' ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                        Administrador
                      </span>
                    ) : (
                      <select
                        value={u.rol}
                        onChange={(e) => cambiarRolRapido(u._id, e.target.value)}
                        className="border border-gray-300 rounded px-2 py-1 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-purple-500"
                      >
                        <option value="estudiante">Estudiante</option>
                        <option value="profesor">Profesor</option>
                      </select>
                    )}
                  </td>

                  <td className="px-6 py-4 text-xs text-gray-600">
                    {u.rol === 'admin' && (
                      <span className="text-gray-400 italic">Acceso administrativo completo</span>
                    )}

                    {u.rol === 'profesor' && (
                      <div className="space-y-1">
                        <p>
                          <span className="font-semibold text-gray-700">Escuela:</span>{' '}
                          {u.escuela || <span className="text-gray-400">Sin asignar</span>}
                        </p>
                        <p>
                          <span className="font-semibold text-gray-700">Carrera:</span>{' '}
                          {u.carrera || <span className="text-gray-400">Sin asignar</span>}
                        </p>
                        <div>
                          <span className="font-semibold text-gray-700 block mb-1">Materias:</span>
                          {u.materias && u.materias.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {u.materias.map((mat, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[11px] font-medium"
                                >
                                  {mat}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400">Sin materias asignadas</span>
                          )}
                        </div>
                      </div>
                    )}

                    {u.rol === 'estudiante' && (
                      <div className="space-y-1">
                        <p>
                          <span className="font-semibold text-gray-700">Carrera:</span>{' '}
                          {u.carrera || <span className="text-gray-400">No especificada</span>}
                        </p>
                        {u.semestre && (
                          <p>
                            <span className="font-semibold text-gray-700">Semestre:</span> {u.semestre}
                          </p>
                        )}
                      </div>
                    )}
                  </td>

                  <td className="px-6 py-4 text-right">
                    {u.rol === 'admin' ? (
                      <span className="text-xs text-gray-400 font-medium">No editable</span>
                    ) : (
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => abrirModalEditar(u)}
                          className="text-purple-600 hover:text-purple-800 font-medium text-xs"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => eliminarUsuario(u._id)}
                          className="text-red-600 hover:text-red-800 font-medium text-xs"
                        >
                          Eliminar
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalAbierto && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-lg border max-w-lg w-full p-6 space-y-4 my-8">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="text-lg font-bold text-gray-800">
                {usuarioEditando ? `Editar Usuario: ${usuarioEditando.nombre}` : 'Crear Nuevo Usuario'}
              </h2>
              <button
                onClick={() => setModalAbierto(false)}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {errorForm && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 p-2.5 rounded-lg">
                {errorForm}
              </p>
            )}

            <form onSubmit={guardarUsuario} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700">Nombre Completo</label>
                  <input
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700">Correo Electrónico</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700">
                    {usuarioEditando ? 'Nueva Contraseña (Opcional)' : 'Contraseña'}
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={usuarioEditando ? 'Dejar vacío para mantener' : '••••••••'}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    required={!usuarioEditando}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700">Rol del Usuario</label>
                  <select
                    value={rol}
                    onChange={(e) => setRol(e.target.value as 'estudiante' | 'profesor' | 'admin')}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  >
                    <option value="estudiante">Estudiante</option>
                    <option value="profesor">Profesor</option>
                    {!usuarioEditando && <option value="admin">Administrador</option>}
                  </select>
                </div>
              </div>

              {rol === 'profesor' && (
                <div className="p-4 bg-gray-50 rounded-lg border space-y-3">
                  <p className="text-xs font-bold text-gray-700 uppercase">Asignación Académica del Profesor</p>

                  <div>
                    <label className="block text-xs font-medium text-gray-700">Escuela</label>
                    <select
                      value={escuela}
                      onChange={(e) => {
                        setEscuela(e.target.value);
                        setCarrera('');
                      }}
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-900 bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                    >
                      <option value="">Seleccionar Escuela...</option>
                      {escuelas.map((esc) => (
                        <option key={esc._id} value={esc.nombre}>
                          {esc.nombre} ({esc.codigo})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700">Carrera</label>
                    <select
                      value={carrera}
                      onChange={(e) => setCarrera(e.target.value)}
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-900 bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                    >
                      <option value="">Seleccionar Carrera...</option>
                      {carrerasFiltradas.map((car) => (
                        <option key={car._id} value={car.nombre}>
                          {car.nombre} ({car.codigo})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Materias que dicta
                    </label>
                    {materiasFiltradas.length === 0 ? (
                      <p className="text-xs text-gray-400">
                        {carrera
                          ? 'No hay materias registradas para esta carrera en el catálogo.'
                          : 'Selecciona una carrera o crea materias en el Catálogo Académico.'}
                      </p>
                    ) : (
                      <div className="max-h-36 overflow-y-auto space-y-1.5 bg-white p-2.5 rounded-lg border">
                        {materiasFiltradas.map((mat) => (
                          <label
                            key={mat._id}
                            className="flex items-center gap-2 text-xs text-gray-800 cursor-pointer hover:bg-gray-50 p-1 rounded"
                          >
                            <input
                              type="checkbox"
                              checked={materiasSeleccionadas.includes(mat.nombre)}
                              onChange={() => toggleMateria(mat.nombre)}
                              className="rounded text-purple-600 focus:ring-purple-500"
                            />
                            <span>
                              {mat.nombre} <span className="text-gray-400">({mat.codigo})</span>
                            </span>
                          </label>
                        ))}
                      </div>
                    )}

                    {materiasSeleccionadas.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {materiasSeleccionadas.map((mat, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-100 text-purple-800 text-[11px] font-medium"
                          >
                            {mat}
                            <button
                              type="button"
                              onClick={() => toggleMateria(mat)}
                              className="text-purple-600 hover:text-purple-900 font-bold"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {rol === 'estudiante' && (
                <div className="p-4 bg-gray-50 rounded-lg border grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700">Carrera</label>
                    <select
                      value={carrera}
                      onChange={(e) => setCarrera(e.target.value)}
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-900 bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                    >
                      <option value="">Seleccionar Carrera...</option>
                      {carreras.map((car) => (
                        <option key={car._id} value={car.nombre}>
                          {car.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700">Semestre</label>
                    <input
                      type="number"
                      min={1}
                      max={12}
                      value={semestre}
                      onChange={(e) => setSemestre(e.target.value)}
                      placeholder="Ej: 4"
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-900 bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs px-4 py-2 rounded-lg font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-4 py-2 rounded-lg font-medium"
                >
                  {usuarioEditando ? 'Guardar Cambios' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}