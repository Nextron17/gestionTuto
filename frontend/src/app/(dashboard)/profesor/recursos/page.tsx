'use client';

import { useEffect, useState } from 'react';
import api from '../../../../lib/api';

interface Recurso {
  _id: string;
  titulo: string;
  materia: string;
  link: string;
}

export default function RecursosProfesorPage() {
  const [recursos, setRecursos] = useState<Recurso[]>([]);
  const [titulo, setTitulo] = useState('');
  const [materia, setMateria] = useState('');
  const [link, setLink] = useState('');

  const obtenerRecursosAPI = async () => {
    try {
      const res = await api.get('/recursos');
      setRecursos(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const cargarRecursos = async () => {
      try {
        const res = await api.get('/recursos');
        setRecursos(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    cargarRecursos();
  }, []);

  const agregarRecurso = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/recursos', { titulo, materia, link });
      setTitulo('');
      setMateria('');
      setLink('');
      await obtenerRecursosAPI();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Recursos Académicos</h1>
        <p className="text-sm text-gray-500">Comparte material de estudio, guías y enlaces de apoyo con los alumnos</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Subir Recurso</h2>
          <form onSubmit={agregarRecurso} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Título del material</label>
              <input
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Materia</label>
              <input
                type="text"
                value={materia}
                onChange={(e) => setMateria(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Enlace (URL / Documento)</label>
              <input
                type="url"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://"
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition"
            >
              Publicar Recurso
            </button>
          </form>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border md:col-span-2">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Materiales Publicados</h2>
          {recursos.length === 0 ? (
            <p className="text-gray-500 text-sm">No has publicado materiales aún.</p>
          ) : (
            <div className="space-y-3">
              {recursos.map((r) => (
                <div key={r._id} className="p-4 bg-gray-50 rounded-lg border flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-gray-800">{r.titulo}</h4>
                    <p className="text-xs text-blue-600 font-semibold mb-1">{r.materia}</p>
                    <a href={r.link} target="_blank" rel="noreferrer" className="text-xs text-gray-500 underline truncate block max-w-md">
                      {r.link}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}