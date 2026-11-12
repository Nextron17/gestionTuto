'use client';

import { useEffect, useState } from 'react';
import api from '../../../../lib/api';

interface EstudianteInfo {
  _id: string;
  nombre: string;
  email: string;
}

interface Tutoria {
  _id: string;
  materia: string;
  tema?: string;
  descripcion: string;
  hora?: string;
  modalidad?: string;
  tipo?: string;
  comentarioProfesor?: string;
  enlaceGrabacion?: string;
  estado: string;
  recursos?: string[];
  estudiante?: EstudianteInfo;
  asistenciaEstudiante?: boolean | null;
  participantes?: { estudiante: EstudianteInfo; asistio?: boolean | null }[];
}

export default function MisTutoriasProfesorPage() {
  const [tutorias, setTutorias] = useState<Tutoria[]>([]);
  const [filtroMateria, setFiltroMateria] = useState('');
  const [filtroModalidad, setFiltroModalidad] = useState('');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarTutorias = async () => {
      try {
        const res = await api.get('/tutorias');
        setTutorias(res.data.filter((t: Tutoria) => t.estado === 'finalizada' || t.estado === 'aceptada'));
      } catch (err) {
        console.error(err);
      } finally {
        setCargando(false);
      }
    };
    cargarTutorias();
  }, []);

  const filtradas = tutorias.filter((t) => {
    const okMat = t.materia.toLowerCase().includes(filtroMateria.toLowerCase());
    const okMod = !filtroModalidad || t.modalidad === filtroModalidad;
    return okMat && okMod;
  });

  if (cargando) {
    return <div className="text-gray-500">Cargando historial de tutorías...</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Historial de Tutorías Dictadas</h1>
        <p className="text-sm text-gray-500">
          Registro de sesiones realizadas, asistencias, grabaciones y material compartido
        </p>
      </div>

      {/* Filtros HU-09 */}
      <div className="bg-white p-4 rounded-xl shadow-sm border grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          type="text"
          placeholder="Filtrar por materia..."
          value={filtroMateria}
          onChange={(e) => setFiltroMateria(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-900"
        />
        <select
          value={filtroModalidad}
          onChange={(e) => setFiltroModalidad(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-900 bg-white"
        >
          <option value="">Todas las modalidades</option>
          <option value="virtual">Virtual</option>
          <option value="presencial">Presencial</option>
        </select>
      </div>

      {filtradas.length === 0 ? (
        <div className="bg-white p-8 rounded-xl shadow-sm border text-center text-gray-500 text-sm">
          No hay tutorías registradas con esos criterios.
        </div>
      ) : (
        <div className="space-y-4">
          {filtradas.map((tutoria) => (
            <div key={tutoria._id} className="bg-white p-6 rounded-xl shadow-sm border space-y-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-bold text-gray-800">
                      {tutoria.materia} {tutoria.tema ? `- ${tutoria.tema}` : ''}
                    </h3>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 capitalize">
                      {tutoria.modalidad || 'Virtual'}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 capitalize">
                      {tutoria.tipo || 'Individual'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Horario: <span className="font-medium text-gray-700">{tutoria.hora || 'N/A'}</span>
                  </p>
                  {tutoria.comentarioProfesor && (
                    <p className="text-xs text-gray-700 mt-1">
                      <span className="font-semibold">Comentario / Salón / Link:</span>{' '}
                      {tutoria.comentarioProfesor}
                    </p>
                  )}
                </div>

                <span
                  className={`px-3 py-1 text-xs rounded-full font-medium self-start ${
                    tutoria.estado === 'finalizada'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {tutoria.estado}
                </span>
              </div>

              {/* Lista de Asistencia */}
              <div className="bg-gray-50 p-3 rounded-lg border space-y-1.5">
                <p className="text-xs font-bold text-gray-700">Registro de Asistencia:</p>
                {tutoria.estudiante && (
                  <div className="flex justify-between text-xs">
                    <span>
                      {tutoria.estudiante.nombre} ({tutoria.estudiante.email})
                    </span>
                    <span
                      className={`font-semibold ${
                        tutoria.asistenciaEstudiante === true
                          ? 'text-emerald-600'
                          : tutoria.asistenciaEstudiante === false
                          ? 'text-red-600'
                          : 'text-gray-400'
                      }`}
                    >
                      {tutoria.asistenciaEstudiante === true
                        ? 'Asistió'
                        : tutoria.asistenciaEstudiante === false
                        ? 'No asistió'
                        : 'Sin registrar'}
                    </span>
                  </div>
                )}
                {tutoria.participantes?.map((p) => (
                  <div key={p.estudiante._id} className="flex justify-between text-xs">
                    <span>
                      {p.estudiante.nombre} ({p.estudiante.email})
                    </span>
                    <span
                      className={`font-semibold ${
                        p.asistio === true
                          ? 'text-emerald-600'
                          : p.asistio === false
                          ? 'text-red-600'
                          : 'text-gray-400'
                      }`}
                    >
                      {p.asistio === true
                        ? 'Asistió'
                        : p.asistio === false
                        ? 'No asistió'
                        : 'Sin registrar'}
                    </span>
                  </div>
                ))}
              </div>

              {/* Grabación y Documentos */}
              {(tutoria.enlaceGrabacion || (tutoria.recursos && tutoria.recursos.length > 0)) && (
                <div className="border-t pt-3 space-y-1 text-xs">
                  {tutoria.enlaceGrabacion && (
                    <p>
                      <span className="font-semibold text-gray-700">Grabación: </span>
                      <a
                        href={tutoria.enlaceGrabacion}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 underline"
                      >
                        {tutoria.enlaceGrabacion}
                      </a>
                    </p>
                  )}
                  {tutoria.recursos && tutoria.recursos.length > 0 && (
                    <div>
                      <span className="font-semibold text-gray-700 block">
                        Documentos publicados en Recursos:
                      </span>
                      {tutoria.recursos.map((r, i) => (
                        <a
                          key={i}
                          href={r}
                          target="_blank"
                          rel="noreferrer"
                          className="block text-blue-600 underline truncate"
                        >
                          {r}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}