'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import api from '../../../../lib/api';

interface EscuelaItem {
  _id: string;
  nombre: string;
  codigo: string;
}

interface Recurso {
  _id: string;
  titulo: string;
  escuela: string;
  materia: string;
  tema?: string;
  claseOrigen?: string;
  link: string;
  profesor?: {
    nombre: string;
  };
}

export default function RecursosProfesorPage() {
  const { user } = useAuth();
  const [recursos, setRecursos] = useState<Recurso[]>([]);
  const [escuelas, setEscuelas] = useState<EscuelaItem[]>([]);
  const [escuelaFiltro, setEscuelaFiltro] = useState<string>('todas');

  const [titulo, setTitulo] = useState('');
  const [escuelaForm, setEscuelaForm] = useState('');
  const [materia, setMateria] = useState('');
  const [tema, setTema] = useState('');
  const [link, setLink] = useState('');
  const [cargando, setCargando] = useState(true);

  const cargarRecursos = async (escuelaSeleccionada: string) => {
    try {
      const query =
        escuelaSeleccionada && escuelaSeleccionada !== 'todas'
          ? `?escuela=${encodeURIComponent(escuelaSeleccionada)}`
          : '';
      const res = await api.get(`/recursos${query}`);
      setRecursos(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const inicializar = async () => {
      try {
        const resEsc = await api.get('/recursos/escuelas');
        const listaEscuelas: EscuelaItem[] = resEsc.data.escuelas || [];
        const miEscuela: string = resEsc.data.miEscuela || user?.escuela || '';

        setEscuelas(listaEscuelas);
        if (miEscuela) {
          setEscuelaForm(miEscuela);
          setEscuelaFiltro(miEscuela);
          await cargarRecursos(miEscuela);
        } else {
          await cargarRecursos('todas');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setCargando(false);
      }
    };
    inicializar();
  }, [user?.escuela]);

  const cambiarFiltroEscuela = async (nuevaEscuela: string) => {
    setEscuelaFiltro(nuevaEscuela);
    await cargarRecursos(nuevaEscuela);
  };

  const agregarRecurso = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/recursos', {
        titulo,
        escuela: escuelaForm,
        materia,
        tema,
        link,
      });
      setTitulo('');
      setMateria('');
      setTema('');
      setLink('');
      await cargarRecursos(escuelaFiltro);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Recursos Académicos por Escuela</h1>
        <p className="text-sm text-gray-500">
          Publica material de estudio clasificado por escuela y consulta los documentos de tus clases
        </p>
      </div>

      {/* Filtro rápido por Escuela */}
      <div className="bg-white p-4 rounded-xl shadow-sm border flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-gray-600 mr-1">Filtrar por Escuela:</span>
        <button
          type="button"
          onClick={() => cambiarFiltroEscuela('todas')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
            escuelaFiltro === 'todas'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Todas las Escuelas
        </button>
        {escuelas.map((esc) => (
          <button
            key={esc._id}
            type="button"
            onClick={() => cambiarFiltroEscuela(esc.nombre)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              escuelaFiltro === esc.nombre
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {esc.nombre}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border h-fit">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Subir Recurso</h2>
          <form onSubmit={agregarRecurso} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Escuela</label>
              <select
                value={escuelaForm}
                onChange={(e) => setEscuelaForm(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              >
                <option value="">-- Seleccionar Escuela --</option>
                {escuelas.map((esc) => (
                  <option key={esc._id} value={esc.nombre}>
                    {esc.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Título del material</label>
              <input
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Materia</label>
              <input
                type="text"
                value={materia}
                onChange={(e) => setMateria(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Tema (Opcional)</label>
              <input
                type="text"
                value={tema}
                onChange={(e) => setTema(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Enlace (URL / Documento)</label>
              <input
                type="url"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://"
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-800">
              {escuelaFiltro === 'todas'
                ? 'Todos los Materiales Publicados'
                : `Materiales • ${escuelaFiltro}`}
            </h2>
            <span className="text-xs text-gray-500 font-medium">
              {recursos.length} {recursos.length === 1 ? 'recurso' : 'recursos'}
            </span>
          </div>

          {cargando ? (
            <p className="text-gray-500 text-sm">Cargando recursos...</p>
          ) : recursos.length === 0 ? (
            <p className="text-gray-500 text-sm">
              No hay materiales publicados para esta escuela aún.
            </p>
          ) : (
            <div className="space-y-3">
              {recursos.map((r) => (
                <div
                  key={r._id}
                  className="p-4 bg-gray-50 rounded-lg border flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-md font-semibold">
                        {r.escuela || 'General'}
                      </span>
                      {r.claseOrigen && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold">
                          {r.claseOrigen}
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-gray-800">{r.titulo}</h4>
                    <p className="text-xs text-blue-600 font-semibold">
                      {r.materia} {r.tema ? `• ${r.tema}` : ''}{' '}
                      {r.profesor ? `• Por ${r.profesor.nombre}` : ''}
                    </p>
                    <a
                      href={r.link}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-gray-500 underline truncate block max-w-md"
                    >
                      {r.link}
                    </a>
                  </div>

                  <a
                    href={r.link}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded-lg font-medium transition self-start sm:self-center shrink-0"
                  >
                    Abrir
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}