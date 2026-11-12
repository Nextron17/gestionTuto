'use client';

import { useEffect, useState } from 'react';
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

export default function RecursosEstudiantePage() {
  const [recursos, setRecursos] = useState<Recurso[]>([]);
  const [escuelas, setEscuelas] = useState<EscuelaItem[]>([]);
  const [miEscuela, setMiEscuela] = useState<string>('');
  const [escuelaSeleccionada, setEscuelaSeleccionada] = useState<string>('todas');
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);

  const cargarRecursos = async (escuelaFiltro: string) => {
    try {
      const query =
        escuelaFiltro && escuelaFiltro !== 'todas'
          ? `?escuela=${encodeURIComponent(escuelaFiltro)}`
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
        const escuelaUsuario: string = resEsc.data.miEscuela || '';

        setEscuelas(listaEscuelas);
        setMiEscuela(escuelaUsuario);

        if (escuelaUsuario) {
          setEscuelaSeleccionada(escuelaUsuario);
          await cargarRecursos(escuelaUsuario);
        } else {
          setEscuelaSeleccionada('todas');
          await cargarRecursos('todas');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setCargando(false);
      }
    };
    inicializar();
  }, []);

  const seleccionarEscuela = async (nombreEscuela: string) => {
    setEscuelaSeleccionada(nombreEscuela);
    await cargarRecursos(nombreEscuela);
  };

  const filtrados = recursos.filter(
    (r) =>
      r.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
      r.materia.toLowerCase().includes(busqueda.toLowerCase()) ||
      (r.tema && r.tema.toLowerCase().includes(busqueda.toLowerCase())) ||
      (r.claseOrigen && r.claseOrigen.toLowerCase().includes(busqueda.toLowerCase()))
  );

  if (cargando) {
    return <div className="text-gray-500">Cargando recursos de estudio por escuela...</div>;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Recursos de Estudio por Escuela</h1>
          <p className="text-sm text-gray-500">
            Material de apoyo y documentos compartidos organizados por escuela académica
          </p>
        </div>
        <input
          type="text"
          placeholder="Buscar por materia, tema o clase..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-900 bg-white w-full sm:w-64 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Pestañas de Escuelas */}
      <div className="bg-white p-4 rounded-xl shadow-sm border space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-gray-600">Seleccionar Escuela:</span>
          {miEscuela && (
            <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full">
              Tu escuela: {miEscuela}
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            onClick={() => seleccionarEscuela('todas')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              escuelaSeleccionada === 'todas'
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
              onClick={() => seleccionarEscuela(esc.nombre)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                escuelaSeleccionada === esc.nombre
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {esc.nombre}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-800">
            {escuelaSeleccionada === 'todas'
              ? 'Biblioteca Digital • Todas las Escuelas'
              : `Biblioteca Digital • ${escuelaSeleccionada}`}
          </h2>
          <span className="text-xs text-gray-500 font-medium">
            {filtrados.length} {filtrados.length === 1 ? 'documento' : 'documentos'}
          </span>
        </div>

        {filtrados.length === 0 ? (
          <p className="text-gray-500 text-sm">
            No hay recursos disponibles para esta escuela con ese criterio.
          </p>
        ) : (
          <div className="space-y-3">
            {filtrados.map((r) => (
              <div
                key={r._id}
                className="p-4 bg-gray-50 rounded-lg border flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-md font-semibold">
                      {r.escuela || 'General'}
                    </span>
                    {r.claseOrigen && (
                      <span className="text-[11px] bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-semibold">
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
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-4 py-2 rounded-lg font-medium transition self-start sm:self-center shrink-0"
                >
                  Abrir Documento
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}