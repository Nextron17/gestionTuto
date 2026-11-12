'use client';

import { useEffect, useState } from 'react';
import api from '../../../../lib/api';

interface EstudianteInfo {
  _id: string;
  nombre: string;
  email: string;
  carrera?: string;
  semestre?: number;
}

interface Solicitud {
  _id: string;
  materia: string;
  tema?: string;
  descripcion: string;
  hora?: string;
  estado: 'pendiente' | 'aceptada' | 'cancelada' | 'aplazada' | 'finalizada';
  recursos?: string[];
  estudiante?: EstudianteInfo;
}

export default function SolicitudesProfesorPage() {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [tutoriaSeleccionada, setTutoriaSeleccionada] = useState<Solicitud | null>(null);
  const [nuevoRecurso, setNuevoRecurso] = useState('');
  const [cargando, setCargando] = useState(true);

  const cargarSolicitudesAPI = async () => {
    try {
      const res = await api.get('/tutorias');
      setSolicitudes(res.data);
      return res.data;
    } catch (err) {
      console.error(err);
      return [];
    }
  };

  useEffect(() => {
    const cargarInicial = async () => {
      try {
        const data: Solicitud[] = await cargarSolicitudesAPI();
        const activa = data.find((s) => s.estado === 'aceptada');
        if (activa) {
          setTutoriaSeleccionada(activa);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setCargando(false);
      }
    };
    cargarInicial();
  }, []);

  const cambiarEstado = async (id: string, nuevoEstado: string) => {
    try {
      await api.patch(`/tutorias/${id}`, { estado: nuevoEstado });
      const actualizadas: Solicitud[] = await cargarSolicitudesAPI();
      if (tutoriaSeleccionada && tutoriaSeleccionada._id === id) {
        const actualizada = actualizadas.find((s) => s._id === id);
        setTutoriaSeleccionada(actualizada || null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const agregarRecurso = async () => {
    if (!nuevoRecurso || !tutoriaSeleccionada) return;
    try {
      await api.post(`/tutorias/${tutoriaSeleccionada._id}/recursos`, { link: nuevoRecurso });
      setNuevoRecurso('');
      const actualizadas: Solicitud[] = await cargarSolicitudesAPI();
      const actualizada = actualizadas.find((s) => s._id === tutoriaSeleccionada._id);
      setTutoriaSeleccionada(actualizada || null);
    } catch (err) {
      console.error(err);
    }
  };

  const finalizarTutoria = async (id: string) => {
    try {
      await api.patch(`/tutorias/${id}/finalizar`);
      const actualizadas: Solicitud[] = await cargarSolicitudesAPI();
      if (tutoriaSeleccionada && tutoriaSeleccionada._id === id) {
        setTutoriaSeleccionada(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const pendientes = solicitudes.filter((s) => s.estado === 'pendiente');

  if (cargando) {
    return <div className="text-gray-500">Cargando solicitudes de tutoría...</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="bg-white p-6 rounded-xl shadow-sm border space-y-4">
        <h2 className="text-xl font-bold text-gray-800">Solicitudes de Tutoría Pendientes</h2>
        {pendientes.length === 0 ? (
          <p className="text-sm text-gray-500">No tienes solicitudes pendientes por responder.</p>
        ) : (
          <div className="space-y-2">
            {pendientes.map((sol) => (
              <div key={sol._id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border">
                <div>
                  <span className="font-semibold text-gray-800">
                    {sol.materia} {sol.tema ? `- ${sol.tema}` : ''}
                  </span>
                  <p className="text-xs text-gray-500">
                    Alumno: {sol.estudiante?.nombre || 'Desconocido'} ({sol.estudiante?.email || 'N/A'})
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => cambiarEstado(sol._id, 'cancelada')}
                    className="bg-red-500 hover:bg-red-600 text-white text-xs px-2.5 py-1 rounded font-bold"
                    title="Rechazar"
                  >
                    ✕
                  </button>
                  <button
                    onClick={() => cambiarEstado(sol._id, 'aceptada')}
                    className="bg-green-600 hover:bg-green-700 text-white text-xs px-2.5 py-1 rounded font-bold"
                    title="Aceptar"
                  >
                    ✓
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border space-y-6">
        <div className="flex justify-between items-center border-b pb-2">
          <h3 className="text-lg font-bold text-gray-800">Detalle de Tutoría Activa</h3>
          {solicitudes.filter((s) => s.estado === 'aceptada').length > 0 && (
            <select
              value={tutoriaSeleccionada?._id || ''}
              onChange={(e) => {
                const sel = solicitudes.find((s) => s._id === e.target.value);
                setTutoriaSeleccionada(sel || null);
              }}
              className="text-xs border rounded px-2 py-1 bg-gray-50 text-gray-800"
            >
              <option value="">-- Seleccionar Tutoría Aceptada --</option>
              {solicitudes
                .filter((s) => s.estado === 'aceptada')
                .map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.materia} - {s.estudiante?.nombre}
                  </option>
                ))}
            </select>
          )}
        </div>

        {!tutoriaSeleccionada ? (
          <p className="text-sm text-gray-500">
            Selecciona una tutoría aceptada para agregar recursos o finalizar la sesión.
          </p>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-lg text-sm">
              <div>
                <span className="text-xs text-gray-500 block">Hora / Fecha</span>
                <p className="font-semibold text-gray-800">{tutoriaSeleccionada.hora || 'No especificada'}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">Materia</span>
                <p className="font-semibold text-gray-800">{tutoriaSeleccionada.materia}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">Tema</span>
                <p className="font-semibold text-gray-800">{tutoriaSeleccionada.tema || 'General'}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">Alumno</span>
                <p className="font-semibold text-gray-800">{tutoriaSeleccionada.estudiante?.nombre || 'Desconocido'}</p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-gray-800 text-sm">Recursos Propuestos</h4>
              {!tutoriaSeleccionada.recursos || tutoriaSeleccionada.recursos.length === 0 ? (
                <p className="text-xs text-gray-400">No hay recursos agregados a esta tutoría.</p>
              ) : (
                <div className="space-y-2">
                  {tutoriaSeleccionada.recursos.map((link, idx) => (
                    <a key={idx} href={link} target="_blank" rel="noreferrer" className="block text-xs text-blue-600 underline truncate">
                      {link}
                    </a>
                  ))}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <input
                  type="url"
                  placeholder="Link del recurso..."
                  value={nuevoRecurso}
                  onChange={(e) => setNuevoRecurso(e.target.value)}
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  onClick={agregarRecurso}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded-lg font-medium"
                >
                  + Recurso
                </button>
              </div>
            </div>

            <div className="pt-4 border-t flex justify-end">
              <button
                onClick={() => finalizarTutoria(tutoriaSeleccionada._id)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
              >
                Terminar Asignación
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}