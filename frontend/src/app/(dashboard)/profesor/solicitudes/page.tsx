'use client';

import { useEffect, useState } from 'react';
import api from '../../../../lib/api';

interface EstudianteInfo {
  _id: string;
  nombre: string;
  email: string;
  carrera?: string;
  semestre?: number;
}

interface ParticipanteItem {
  estudiante: EstudianteInfo;
  asistio?: boolean | null;
}

interface Solicitud {
  _id: string;
  materia: string;
  tema?: string;
  descripcion: string;
  hora?: string;
  modalidad?: 'presencial' | 'virtual';
  tipo?: 'individual' | 'grupal';
  cupoMaximo?: number;
  comentarioProfesor?: string;
  enlaceGrabacion?: string;
  estado: 'pendiente' | 'aceptada' | 'cancelada' | 'aplazada' | 'finalizada';
  recursos?: string[];
  estudiante?: EstudianteInfo;
  asistenciaEstudiante?: boolean | null;
  participantes?: ParticipanteItem[];
}

export default function SolicitudesProfesorPage() {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [tutoriaSeleccionada, setTutoriaSeleccionada] = useState<Solicitud | null>(null);
  const [nuevoRecurso, setNuevoRecurso] = useState('');
  const [comentarioActivo, setComentarioActivo] = useState('');
  const [grabacionActiva, setGrabacionActiva] = useState('');
  const [cargando, setCargando] = useState(true);
  const [mensajeFeedback, setMensajeFeedback] = useState('');

  // Modal de respuesta (Aceptar o Aplazar)
  const [modalGestion, setModalGestion] = useState<{
    solicitud: Solicitud;
    accion: 'aceptada' | 'aplazada';
  } | null>(null);
  const [horaPropuesta, setHoraPropuesta] = useState('');
  const [modalidad, setModalidad] = useState<'virtual' | 'presencial'>('virtual');
  const [tipo, setTipo] = useState<'individual' | 'grupal'>('individual');
  const [cupoMaximo, setCupoMaximo] = useState(10);
  const [comentarioModal, setComentarioModal] = useState('');

  const sincronizarSeleccionada = (lista: Solicitud[], idActual?: string) => {
    const aceptadas = lista.filter((s) => s.estado === 'aceptada');
    const encontrada = idActual ? aceptadas.find((s) => s._id === idActual) : aceptadas[0];
    setTutoriaSeleccionada(encontrada || null);
    setComentarioActivo(encontrada?.comentarioProfesor || '');
    setGrabacionActiva(encontrada?.enlaceGrabacion || '');
  };

  const cargarSolicitudesAPI = async (idMantener?: string) => {
    try {
      const res = await api.get('/tutorias');
      const data: Solicitud[] = res.data;
      setSolicitudes(data);
      sincronizarSeleccionada(data, idMantener);
      return data;
    } catch (err) {
      console.error(err);
      return [];
    }
  };

  useEffect(() => {
    const cargarInicial = async () => {
      await cargarSolicitudesAPI();
      setCargando(false);
    };
    cargarInicial();
  }, []);

  const abrirModalGestion = (sol: Solicitud, accion: 'aceptada' | 'aplazada') => {
    setModalGestion({ solicitud: sol, accion });
    setHoraPropuesta(sol.hora || '');
    setModalidad(sol.modalidad || 'virtual');
    setTipo(sol.tipo || 'individual');
    setCupoMaximo(sol.cupoMaximo || 10);
    setComentarioModal(sol.comentarioProfesor || '');
  };

  const confirmarGestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalGestion) return;

    try {
      await api.patch(`/tutorias/${modalGestion.solicitud._id}`, {
        estado: modalGestion.accion,
        hora: horaPropuesta,
        modalidad,
        tipo,
        cupoMaximo: tipo === 'grupal' ? cupoMaximo : 1,
        comentarioProfesor: comentarioModal,
      });

      const idDestino =
        modalGestion.accion === 'aceptada'
          ? modalGestion.solicitud._id
          : tutoriaSeleccionada?._id;
      setModalGestion(null);
      await cargarSolicitudesAPI(idDestino);
    } catch (err) {
      console.error(err);
    }
  };

  const rechazarSolicitud = async (id: string) => {
    try {
      await api.patch(`/tutorias/${id}`, { estado: 'cancelada' });
      await cargarSolicitudesAPI(tutoriaSeleccionada?._id);
    } catch (err) {
      console.error(err);
    }
  };

  const guardarDetallesSesion = async () => {
    if (!tutoriaSeleccionada) return;
    try {
      await api.patch(`/tutorias/${tutoriaSeleccionada._id}`, {
        comentarioProfesor: comentarioActivo,
        enlaceGrabacion: grabacionActiva,
      });
      await cargarSolicitudesAPI(tutoriaSeleccionada._id);
      setMensajeFeedback('Comentarios y enlaces guardados.');
      setTimeout(() => setMensajeFeedback(''), 2500);
    } catch (err) {
      console.error(err);
    }
  };

  const marcarAsistenciaPrincipal = async (asistio: boolean) => {
    if (!tutoriaSeleccionada) return;
    try {
      await api.patch(`/tutorias/${tutoriaSeleccionada._id}/asistencia`, {
        asistenciaEstudiante: asistio,
      });
      await cargarSolicitudesAPI(tutoriaSeleccionada._id);
    } catch (err) {
      console.error(err);
    }
  };

  const marcarAsistenciaParticipante = async (estudianteId: string, asistio: boolean) => {
    if (!tutoriaSeleccionada) return;
    try {
      await api.patch(`/tutorias/${tutoriaSeleccionada._id}/asistencia`, {
        participantes: [{ estudianteId, asistio }],
      });
      await cargarSolicitudesAPI(tutoriaSeleccionada._id);
    } catch (err) {
      console.error(err);
    }
  };

  const agregarRecurso = async () => {
    if (!nuevoRecurso.trim() || !tutoriaSeleccionada) return;
    try {
      await api.post(`/tutorias/${tutoriaSeleccionada._id}/recursos`, {
        link: nuevoRecurso.trim(),
      });
      setNuevoRecurso('');
      await cargarSolicitudesAPI(tutoriaSeleccionada._id);
    } catch (err) {
      console.error(err);
    }
  };

  const finalizarTutoria = async (id: string) => {
    try {
      await api.patch(`/tutorias/${id}/finalizar`, {
        comentarioProfesor: comentarioActivo,
        enlaceGrabacion: grabacionActiva,
      });
      await cargarSolicitudesAPI();
      setMensajeFeedback('Tutoría finalizada, guardada en Historial y publicada en Recursos.');
      setTimeout(() => setMensajeFeedback(''), 4000);
    } catch (err) {
      console.error(err);
    }
  };

  const pendientes = solicitudes.filter(
    (s) => s.estado === 'pendiente' || s.estado === 'aplazada'
  );
  const aceptadas = solicitudes.filter((s) => s.estado === 'aceptada');

  if (cargando) {
    return <div className="text-gray-500">Cargando solicitudes de tutoría...</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {mensajeFeedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium">
          {mensajeFeedback}
        </div>
      )}

      {/* Solicitudes Pendientes o Aplazadas */}
      <div className="bg-white p-6 rounded-xl shadow-sm border space-y-4">
        <h2 className="text-xl font-bold text-gray-800">
          Solicitudes de Tutoría Pendientes / Aplazadas
        </h2>
        {pendientes.length === 0 ? (
          <p className="text-sm text-gray-500">No tienes solicitudes pendientes por responder.</p>
        ) : (
          <div className="space-y-3">
            {pendientes.map((sol) => (
              <div
                key={sol._id}
                className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 p-4 bg-gray-50 rounded-lg border"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-800">
                      {sol.materia} {sol.tema ? `- ${sol.tema}` : ''}
                    </span>
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                        sol.estado === 'aplazada'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {sol.estado}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">{sol.descripcion}</p>
                  <p className="text-xs text-gray-500">
                    Alumno: <span className="font-medium text-gray-700">{sol.estudiante?.nombre}</span>{' '}
                    ({sol.estudiante?.email}) • Horario: <span className="font-medium">{sol.hora || 'Por definir'}</span>
                  </p>
                  {sol.comentarioProfesor && (
                    <p className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                      Nota previa: {sol.comentarioProfesor}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 shrink-0">
                  <button
                    onClick={() => abrirModalGestion(sol, 'aceptada')}
                    className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1.5 rounded-lg font-medium"
                  >
                    ✓ Aceptar / Configurar
                  </button>
                  <button
                    onClick={() => abrirModalGestion(sol, 'aplazada')}
                    className="bg-amber-500 hover:bg-amber-600 text-white text-xs px-3 py-1.5 rounded-lg font-medium"
                  >
                    🕒 Aplazar Hora
                  </button>
                  <button
                    onClick={() => rechazarSolicitud(sol._id)}
                    className="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1.5 rounded-lg font-medium"
                  >
                    ✕ Rechazar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detalle de Tutoría Activa */}
      <div className="bg-white p-6 rounded-xl shadow-sm border space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 border-b pb-3">
          <h3 className="text-lg font-bold text-gray-800">Gestión de Tutoría Activa</h3>
          {aceptadas.length > 0 && (
            <select
              value={tutoriaSeleccionada?._id || ''}
              onChange={(e) => {
                const sel = aceptadas.find((s) => s._id === e.target.value) || null;
                setTutoriaSeleccionada(sel);
                setComentarioActivo(sel?.comentarioProfesor || '');
                setGrabacionActiva(sel?.enlaceGrabacion || '');
              }}
              className="text-xs border rounded-lg px-3 py-1.5 bg-gray-50 text-gray-800 font-medium"
            >
              {aceptadas.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.materia} - {s.estudiante?.nombre} ({s.tipo === 'grupal' ? 'Grupal' : 'Individual'})
                </option>
              ))}
            </select>
          )}
        </div>

        {!tutoriaSeleccionada ? (
          <p className="text-sm text-gray-500">
            No tienes tutorías aceptadas en curso. Acepta una solicitud arriba para gestionarla.
          </p>
        ) : (
          <div className="space-y-6">
            {/* Resumen de la sesión */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-lg border text-sm">
              <div>
                <span className="text-xs text-gray-500 block">Hora / Fecha</span>
                <p className="font-semibold text-gray-800">
                  {tutoriaSeleccionada.hora || 'No especificada'}
                </p>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">Materia y Tema</span>
                <p className="font-semibold text-gray-800">
                  {tutoriaSeleccionada.materia}{' '}
                  {tutoriaSeleccionada.tema ? `(${tutoriaSeleccionada.tema})` : ''}
                </p>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">Modalidad</span>
                <p className="font-semibold text-blue-700 capitalize">
                  {tutoriaSeleccionada.modalidad || 'Virtual'}
                </p>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">Tipo de Sesión</span>
                <p className="font-semibold text-purple-700 capitalize">
                  {tutoriaSeleccionada.tipo || 'Individual'}
                  {tutoriaSeleccionada.tipo === 'grupal'
                    ? ` (${1 + (tutoriaSeleccionada.participantes?.length || 0)}/${tutoriaSeleccionada.cupoMaximo || 10} inscritos)`
                    : ''}
                </p>
              </div>
            </div>

            {/* Comentario (Enlace de reunión / Salón) y Enlace de Grabación */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-50/50 rounded-lg border border-blue-100">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Comentario del Profesor (Enlace de reunión virtual o Salón presencial)
                </label>
                <input
                  type="text"
                  value={comentarioActivo}
                  onChange={(e) => setComentarioActivo(e.target.value)}
                  placeholder="Ej: https://meet.google.com/xxx o Salón 304 Bloque B"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-900 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Enlace de Grabación (Opcional / Post-sesión)
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={grabacionActiva}
                    onChange={(e) => setGrabacionActiva(e.target.value)}
                    placeholder="https://drive.google.com/..."
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-900 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={guardarDetallesSesion}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-2 rounded-lg font-medium shrink-0"
                  >
                    Guardar
                  </button>
                </div>
              </div>
            </div>

            {/* Control de Asistencia */}
            <div className="space-y-3">
              <h4 className="font-bold text-gray-800 text-sm">Control de Asistencia</h4>
              <div className="divide-y border rounded-lg bg-gray-50">
                {/* Solicitante principal */}
                {tutoriaSeleccionada.estudiante && (
                  <div className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-bold text-gray-800">
                        {tutoriaSeleccionada.estudiante.nombre}{' '}
                        <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded ml-1">
                          Solicitante
                        </span>
                      </p>
                      <p className="text-[11px] text-gray-500">
                        {tutoriaSeleccionada.estudiante.email}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => marcarAsistenciaPrincipal(true)}
                        className={`px-3 py-1 rounded text-xs font-medium border transition ${
                          tutoriaSeleccionada.asistenciaEstudiante === true
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-emerald-50'
                        }`}
                      >
                        ✓ Asistió
                      </button>
                      <button
                        type="button"
                        onClick={() => marcarAsistenciaPrincipal(false)}
                        className={`px-3 py-1 rounded text-xs font-medium border transition ${
                          tutoriaSeleccionada.asistenciaEstudiante === false
                            ? 'bg-red-600 text-white border-red-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-red-50'
                        }`}
                      >
                        ✕ No asistió
                      </button>
                    </div>
                  </div>
                )}

                {/* Estudiantes adicionales inscritos (si es grupal) */}
                {tutoriaSeleccionada.participantes?.map((part) => (
                  <div
                    key={part.estudiante._id}
                    className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div>
                      <p className="text-xs font-bold text-gray-800">
                        {part.estudiante.nombre}{' '}
                        <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded ml-1">
                          Inscrito Grupal
                        </span>
                      </p>
                      <p className="text-[11px] text-gray-500">{part.estudiante.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => marcarAsistenciaParticipante(part.estudiante._id, true)}
                        className={`px-3 py-1 rounded text-xs font-medium border transition ${
                          part.asistio === true
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-emerald-50'
                        }`}
                      >
                        ✓ Asistió
                      </button>
                      <button
                        type="button"
                        onClick={() => marcarAsistenciaParticipante(part.estudiante._id, false)}
                        className={`px-3 py-1 rounded text-xs font-medium border transition ${
                          part.asistio === false
                            ? 'bg-red-600 text-white border-red-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-red-50'
                        }`}
                      >
                        ✕ No asistió
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recursos y Documentos de la Sesión */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-gray-800 text-sm">
                  Recursos y Documentos de la Clase
                </h4>
                <span className="text-[11px] text-gray-500">
                  Al finalizar se publicarán en Recursos como &quot;Clase: {tutoriaSeleccionada.materia}&quot;
                </span>
              </div>

              {!tutoriaSeleccionada.recursos || tutoriaSeleccionada.recursos.length === 0 ? (
                <p className="text-xs text-gray-400">
                  No hay documentos o enlaces agregados a esta tutoría.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {tutoriaSeleccionada.recursos.map((link, idx) => (
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
              )}

              <div className="flex gap-2 pt-1">
                <input
                  type="url"
                  placeholder="https://... (Enlace a guía, PDF, presentación o video)"
                  value={nuevoRecurso}
                  onChange={(e) => setNuevoRecurso(e.target.value)}
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={agregarRecurso}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-4 py-2 rounded-lg font-medium"
                >
                  + Subir Recurso
                </button>
              </div>
            </div>

            {/* Finalizar Sesión */}
            <div className="pt-4 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => abrirModalGestion(tutoriaSeleccionada, 'aplazada')}
                className="bg-amber-100 hover:bg-amber-200 text-amber-800 text-xs font-medium px-4 py-2 rounded-lg transition self-start"
              >
                Reprogramar / Aplazar Hora
              </button>

              <button
                type="button"
                onClick={() => finalizarTutoria(tutoriaSeleccionada._id)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition"
              >
                Finalizar Clase y Guardar en Historial / Recursos
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal para Aceptar / Configurar o Aplazar */}
      {modalGestion && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg border max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-800">
              {modalGestion.accion === 'aceptada'
                ? 'Aceptar y Configurar Tutoría'
                : 'Aplazar / Reprogramar Tutoría'}
            </h3>

            <form onSubmit={confirmarGestion} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700">
                  {modalGestion.accion === 'aplazada'
                    ? 'Nueva Fecha y Hora Propuesta'
                    : 'Horario / Fecha Confirmada'}
                </label>
                <input
                  type="text"
                  value={horaPropuesta}
                  onChange={(e) => setHoraPropuesta(e.target.value)}
                  placeholder="Ej: Viernes 10:00 - 12:00"
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              {modalGestion.accion === 'aceptada' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700">Modalidad</label>
                      <select
                        value={modalidad}
                        onChange={(e) =>
                          setModalidad(e.target.value as 'virtual' | 'presencial')
                        }
                        className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-900 bg-white"
                      >
                        <option value="virtual">Virtual</option>
                        <option value="presencial">Presencial</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700">Tipo</label>
                      <select
                        value={tipo}
                        onChange={(e) => setTipo(e.target.value as 'individual' | 'grupal')}
                        className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-900 bg-white"
                      >
                        <option value="individual">Individual</option>
                        <option value="grupal">Grupal (Abierta a otros)</option>
                      </select>
                    </div>
                  </div>

                  {tipo === 'grupal' && (
                    <div>
                      <label className="block text-xs font-medium text-gray-700">
                        Cupo Máximo de Estudiantes
                      </label>
                      <input
                        type="number"
                        min={2}
                        max={50}
                        value={cupoMaximo}
                        onChange={(e) => setCupoMaximo(Number(e.target.value))}
                        className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-900"
                      />
                    </div>
                  )}
                </>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-700">
                  {modalGestion.accion === 'aplazada'
                    ? 'Motivo del aplazamiento / Comentario'
                    : modalidad === 'virtual'
                    ? 'Comentario (Enlace de reunión virtual)'
                    : 'Comentario (Salón o lugar presencial)'}
                </label>
                <textarea
                  value={comentarioModal}
                  onChange={(e) => setComentarioModal(e.target.value)}
                  rows={2}
                  placeholder={
                    modalGestion.accion === 'aplazada'
                      ? 'Ej: Tengo reunión de facultad, nos vemos el viernes a las 10 AM'
                      : modalidad === 'virtual'
                      ? 'Ej: https://meet.google.com/abc-defg-hij'
                      : 'Ej: Salón 202 - Edificio Principal'
                  }
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalGestion(null)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs px-4 py-2 rounded-lg font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`text-white text-xs px-4 py-2 rounded-lg font-medium ${
                    modalGestion.accion === 'aceptada'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-amber-600 hover:bg-amber-700'
                  }`}
                >
                  Confirmar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}