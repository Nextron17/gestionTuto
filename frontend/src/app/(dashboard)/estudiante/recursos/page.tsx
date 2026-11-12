'use client';

import { useEffect, useState } from 'react';
import api from '../../../../lib/api';

interface Recurso {
  _id: string;
  titulo: string;
  materia: string;
  link: string;
  profesor?: {
    nombre: string;
  };
}

export default function RecursosEstudiantePage() {
  const [recursos, setRecursos] = useState<Recurso[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarRecursos = async () => {
      try {
        const res = await api.get('/recursos');
        setRecursos(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setCargando(false);
      }
    };
    cargarRecursos();
  }, []);

  if (cargando) {
    return <div className="text-gray-500">Cargando recursos de estudio...</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Recursos de Estudio</h1>
        <p className="text-sm text-gray-500">Material de apoyo compartido por tus docentes</p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border space-y-4">
        <h2 className="text-lg font-bold text-gray-800">Biblioteca Digital</h2>
        {recursos.length === 0 ? (
          <p className="text-gray-500 text-sm">No hay recursos disponibles aún.</p>
        ) : (
          <div className="space-y-3">
            {recursos.map((r) => (
              <div key={r._id} className="p-4 bg-gray-50 rounded-lg border flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-gray-800">{r.titulo}</h4>
                  <p className="text-xs text-blue-600 font-semibold mb-1">{r.materia} {r.profesor ? `• Por ${r.profesor.nombre}` : ''}</p>
                  <a href={r.link} target="_blank" rel="noreferrer" className="text-xs text-gray-500 underline truncate block max-w-md">
                    {r.link}
                  </a>
                </div>
                <a
                  href={r.link}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded-lg font-medium transition"
                >
                  Abrir
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}