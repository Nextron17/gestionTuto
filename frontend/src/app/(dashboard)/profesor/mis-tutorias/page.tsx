'use client';

import { useEffect, useState } from 'react';
import api from '../../../../lib/api';

interface Tutoria {
  _id: string;
  materia: string;
  descripcion: string;
  estado: string;
  estudiante?: {
    nombre: string;
    email: string;
  };
}

export default function MisTutoriasProfesorPage() {
  const [tutorias, setTutorias] = useState<Tutoria[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarTutorias = async () => {
      try {
        const res = await api.get('/tutorias');
        setTutorias(res.data.filter((t: Tutoria) => t.estado !== 'pendiente'));
      } catch (err) {
        console.error(err);
      } finally {
        setCargando(false);
      }
    };
    cargarTutorias();
  }, []);

  if (cargando) {
    return <div className="text-gray-500">Cargando tutorías...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Mis Tutorías Asignadas</h1>
        <p className="text-sm text-gray-500">Historial y seguimiento de tutorías aceptadas o finalizadas</p>
      </div>

      {tutorias.length === 0 ? (
        <div className="bg-white p-8 rounded-xl shadow-sm border text-center text-gray-500">
          Aún no has aceptado ninguna tutoría.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {tutorias.map((tutoria) => (
            <div key={tutoria._id} className="bg-white p-6 rounded-xl shadow-sm border flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-gray-800">{tutoria.materia}</h3>
                <p className="text-gray-600 text-sm mt-1">{tutoria.descripcion}</p>
                {tutoria.estudiante && (
                  <p className="text-xs text-gray-500 mt-2">
                    Estudiante: <span className="font-medium text-gray-700">{tutoria.estudiante.nombre}</span> ({tutoria.estudiante.email})
                  </p>
                )}
              </div>
              <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                tutoria.estado === 'aceptada' ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-800'
              }`}>
                {tutoria.estado}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}