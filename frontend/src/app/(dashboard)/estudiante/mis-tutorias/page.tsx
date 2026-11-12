'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import api from '../../../../lib/api';

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
  estudiante?: { _id: string; nombre: string };
  asistenciaEstudiante?: boolean | null;
  participantes?: { estudiante: { _id: string; nombre: string }; asistio?: boolean | null }[];
  profesor?: {
    nombre: string;
    email: string;
  };
  recursos?: string[];
}

export default function MisTutoriasEstudiantePage() {
  const { user } = useAuth();
  const [tutorias, setTutorias] = useState<Tutoria[]>([]);
  const [pestana, setPestana] = useState<'activas' | 'historial'>('activas');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarTutorias = async () => {
      try {
        const res = await api.get('/tutorias');
        setTutorias(
          res.data.filter((t: Tutoria) => t.estado === 'aceptada' || t.estado === 'finalizada')
        );
      } catch (err) {
        console.error(err);
      } finally {
        setCargando(false);
      }
    };
    cargarTutorias();
  }, []);

  const obtenerMiAsistencia = (t: Tutoria): boolean | null | undefined => {
    if (t.estudiante?._id === user?.id) {
      return t.asistenciaEstudiante;
    }
    const part = t.participantes?.find((p) => p.estudiante?._id === user?.id);
    return part?.asistio;
  };

  const listaMostrar = tutorias.filter((t) =>
    pestana === 'activas' ? t.estado === 'aceptada' : t.estado === 'finalizada'
  );

  if (cargando) {
    return <div className="text-gray-500">Cargando mis tutorías...</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Mis Tutorías e Historial</h1>
          <p className="text-sm text-gray-500">
            Consulta tus sesiones programadas, enlaces de reunión, asistencia y clases finalizadas
          </p>
        </div>

        <div className="flex bg-white p-1 rounded-lg border self-start">
          <button
            onClick={() => setPestana('activas')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
              pestana === 'activas'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Próximas / Activas ({tutorias.filter((t) => t.estado === 'aceptada').length})
          </button>
          <button
            onClick={() => setPestana('historial')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
              pestana === 'historial'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Historial ({tutorias.filter((t) => t.estado === 'finalizada').length})
          </button>
        </div>
      </div>

      {listaMostrar.length === 0 ? (
        <div className="bg-white p-8 rounded-xl shadow-sm border text-center text-gray-500 text-sm">
          {pestana === 'activas'
            ? 'No tienes tutorías activas programadas en este momento.'
            : 'Aún no tienes tutorías finalizadas en tu historial.'}
        </div>
      ) : (
        <div className="space-y-4">
          {listaMostrar.map((tutoria) => {
            const miAsistencia = obtenerMiAsistencia(tutoria);
            return (
              <div key={tutoria._id} className="bg-white p-6 rounded-xl shadow-sm border space-y-4">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-bold text-gray-800">
                        {tutoria.materia} {tutoria.tema ? `- ${tutoria.tema}` : ''}
                      </h3>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 capitalize">
                        {tutoria.modalidad || 'Virtual'}
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 capitalize">
                        {tutoria.tipo || 'Individual'}
                      </span>
                    </div>

                    <p className="text-gray-600 text-sm">{tutoria.descripcion}</p>
                    <p className="text-xs text-gray-500">
                      Profesor:{' '}
                      <span className="font-medium text-gray-700">{tutoria.profesor?.nombre}</span> (
                      {tutoria.profesor?.email}) • Horario:{' '}
                      <span className="font-medium text-gray-700">{tutoria.hora || 'Por definir'}</span>
                    </p>
                  </div>

                  <div className="flex sm:flex-col items-end gap-1.5">
                    <span
                      className={`px-3 py-1 text-xs rounded-full font-medium capitalize ${
                        tutoria.estado === 'aceptada'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {tutoria.estado}
                    </span>

                    <span
                      className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                        miAsistencia === true
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : miAsistencia === false
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      Asistencia:{' '}
                      {miAsistencia === true
                        ? 'Asististe'
                        : miAsistencia === false
                        ? 'No asististe'
                        : 'Pendiente'}
                    </span>
                  </div>
                </div>

                {tutoria.comentarioProfesor && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900">
                    <span className="font-bold">
                      {tutoria.modalidad === 'presencial'
                        ? 'Ubicación / Salón: '
                        : 'Enlace / Indicaciones de la sesión: '}
                    </span>
                    {tutoria.comentarioProfesor.startsWith('http') ? (
                      <a
                        href={tutoria.comentarioProfesor}
                        target="_blank"
                        rel="noreferrer"
                        className="underline font-medium"
                      >
                        {tutoria.comentarioProfesor}
                      </a>
                    ) : (
                      tutoria.comentarioProfesor
                    )}
                  </div>
                )}

                {tutoria.enlaceGrabacion && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900">
                    <span className="font-bold">Grabación de la clase: </span>
                    <a
                      href={tutoria.enlaceGrabacion}
                      target="_blank"
                      rel="noreferrer"
                      className="underline font-medium"
                    >
                      {tutoria.enlaceGrabacion}
                    </a>
                  </div>
                )}

                {tutoria.recursos && tutoria.recursos.length > 0 && (
                  <div className="border-t pt-3">
                    <h4 className="text-xs font-bold text-gray-700 mb-2">
                      Documentos y materiales de la clase:
                    </h4>
                    <div className="space-y-1">
                      {tutoria.recursos.map((link, idx) => (
                        <a
                          key={idx}
                          href={link}
                          target="_blank"
                          rel="noreferrer"
                          className="block text-xs text-blue-600 underline truncate"
                        >
                          {link}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}