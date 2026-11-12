'use client';

import { useEffect, useState } from 'react';
import api from '../../../../lib/api';

interface Solicitud {
  _id: string;
  materia: string;
  tema?: string;
  descripcion: string;
  hora?: string;
  modalidad?: string;
  tipo?: string;
  comentarioProfesor?: string;
  estado: string;
  profesor?: {
    nombre: string;
    email: string;
  };
}

export default function MisSolicitudesPage() {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [cargando, setCargando] = useState(true);

  const cargarSolicitudesAPI = async () => {
    try {
      const res = await api.get('/tutorias');
      setSolicitudes(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const cargarInicial = async () => {
      await cargarSolicitudesAPI();
      setCargando(false);
    };
    cargarInicial();
  }, []);

  const cancelarSolicitud = async (id: string) => {
    try {
      await api.patch(`/tutorias/${id}`, { estado: 'cancelada' });
      await cargarSolicitudesAPI();
    } catch (err) {
      console.error(err);
    }
  };

  if (cargando) {
    return <div className="text-gray-500">Cargando mis solicitudes...</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Mis Solicitudes</h1>
        <p className="text-sm text-gray-500">
          Estado de tus peticiones de tutoría, reprogramaciones y comentarios del docente
        </p>
      </div>

      {solicitudes.length === 0 ? (
        <div className="bg-white p-8 rounded-xl shadow-sm border text-center text-gray-500">
          No has solicitado ninguna tutoría todavía.
        </div>
      ) : (
        <div className="space-y-4">
          {solicitudes.map((sol) => (
            <div
              key={sol._id}
              className="bg-white p-6 rounded-xl shadow-sm border flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4"
            >
              <div className="space-y-1.5">
                <h3 className="text-lg font-bold text-gray-800">
                  {sol.materia} {sol.tema ? `- ${sol.tema}` : ''}
                </h3>
                <p className="text-gray-600 text-sm">{sol.descripcion}</p>
                <p className="text-xs text-gray-500">
                  Profesor: <span className="font-medium text-gray-700">{sol.profesor?.nombre || 'Por asignar'}</span> •{' '}
                  Horario: <span className="font-medium text-gray-800">{sol.hora || 'No definido'}</span>
                </p>

                {sol.comentarioProfesor && (
                  <div className="mt-2 p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900">
                    <span className="font-bold">Comentario del profesor: </span>
                    {sol.comentarioProfesor}
                  </div>
                )}
              </div>

              <div className="flex sm:flex-col items-end gap-2 shrink-0">
                <span
                  className={`px-3 py-1 text-xs rounded-full font-medium capitalize ${
                    sol.estado === 'pendiente'
                      ? 'bg-yellow-100 text-yellow-800'
                      : sol.estado === 'aplazada'
                      ? 'bg-amber-100 text-amber-800'
                      : sol.estado === 'aceptada'
                      ? 'bg-green-100 text-green-800'
                      : sol.estado === 'finalizada'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {sol.estado}
                </span>

                {(sol.estado === 'pendiente' || sol.estado === 'aplazada') && (
                  <button
                    onClick={() => cancelarSolicitud(sol._id)}
                    className="text-xs text-red-600 hover:text-red-800 font-medium underline"
                  >
                    Cancelar solicitud
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}