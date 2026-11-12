'use client';

import { useEffect, useState } from 'react';
import api from '../../../../lib/api';

interface Tutoria {
  _id: string;
  materia: string;
  descripcion: string;
  estado: string;
  profesor?: {
    nombre: string;
    email: string;
  };
  recursos?: string[];
}

export default function MisTutoriasEstudiantePage() {
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
    return <div className="text-gray-500">Cargando mis tutorías...</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Mis Tutorías Asignadas</h1>
        <p className="text-sm text-gray-500">Tutorías en proceso o finalizadas impartidas por tus profesores</p>
      </div>

      {tutorias.length === 0 ? (
        <div className="bg-white p-8 rounded-xl shadow-sm border text-center text-gray-500">
          No tienes tutorías activas o asignadas por el momento.
        </div>
      ) : (
        <div className="space-y-4">
          {tutorias.map((tutoria) => (
            <div key={tutoria._id} className="bg-white p-6 rounded-xl shadow-sm border space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">{tutoria.materia}</h3>
                  <p className="text-gray-600 text-sm mt-1">{tutoria.descripcion}</p>
                  {tutoria.profesor && (
                    <p className="text-xs text-gray-500 mt-2">
                      Profesor: <span className="font-medium text-gray-700">{tutoria.profesor.nombre}</span> ({tutoria.profesor.email})
                    </p>
                  )}
                </div>
                <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                  tutoria.estado === 'aceptada' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {tutoria.estado}
                </span>
              </div>

              {tutoria.recursos && tutoria.recursos.length > 0 && (
                <div className="border-t pt-3">
                  <h4 className="text-xs font-bold text-gray-700 mb-2">Materiales compartidos por el profesor:</h4>
                  <div className="space-y-1">
                    {tutoria.recursos.map((link, idx) => (
                      <a key={idx} href={link} target="_blank" rel="noreferrer" className="block text-xs text-blue-600 underline truncate">
                        {link}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}