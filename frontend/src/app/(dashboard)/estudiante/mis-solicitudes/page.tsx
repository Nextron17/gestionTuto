'use client';

import { useEffect, useState } from 'react';
import api from '../../../../lib/api';

interface Solicitud {
  _id: string;
  materia: string;
  descripcion: string;
  estado: string;
}

export default function MisSolicitudesPage() {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarSolicitudes = async () => {
      try {
        const res = await api.get('/tutorias');
        setSolicitudes(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setCargando(false);
      }
    };
    cargarSolicitudes();
  }, []);

  if (cargando) {
    return <div className="text-gray-500">Cargando mis solicitudes...</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Mis Solicitudes</h1>
        <p className="text-sm text-gray-500">Estado de tus peticiones de tutoría enviadas a los profesores</p>
      </div>

      {solicitudes.length === 0 ? (
        <div className="bg-white p-8 rounded-xl shadow-sm border text-center text-gray-500">
          No has solicitado ninguna tutoría todavía.
        </div>
      ) : (
        <div className="space-y-4">
          {solicitudes.map((sol) => (
            <div key={sol._id} className="bg-white p-6 rounded-xl shadow-sm border flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-gray-800">{sol.materia}</h3>
                <p className="text-gray-600 text-sm mt-1">{sol.descripcion}</p>
              </div>
              <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                sol.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
                sol.estado === 'aceptada' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {sol.estado}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}