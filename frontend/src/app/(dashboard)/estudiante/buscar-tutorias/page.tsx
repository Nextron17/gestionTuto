'use client';

import { useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import { useAuth } from '../../../../context/AuthContext';
import api from '../../../../lib/api';

interface ProfesorUser {
  _id: string;
  nombre: string;
  email: string;
  escuela?: string;
  carrera?: string;
  materias?: string[];
}

interface HorarioItem {
  _id: string;
  dia: string;
  horaInicio: string;
  horaFin: string;
  profesor: ProfesorUser;
}

interface ProfesorConHorarios extends ProfesorUser {
  horarios: HorarioItem[];
}

interface TutoriaGrupal {
  _id: string;
  materia: string;
  tema?: string;
  descripcion: string;
  hora?: string;
  modalidad?: string;
  cupoMaximo?: number;
  comentarioProfesor?: string;
  profesor?: ProfesorUser;
  estudiante?: { _id: string; nombre: string };
  participantes?: { estudiante: { _id: string; nombre: string } }[];
}

export default function BuscarTutoriasPage() {
  const { user } = useAuth();
  const [nomProf, setNomProf] = useState('');
  const [materiaFiltro, setMateriaFiltro] = useState('');
  const [profesores, setProfesores] = useState<ProfesorConHorarios[]>([]);
  const [grupales, setGrupales] = useState<TutoriaGrupal[]>([]);
  const [profesorSeleccionado, setProfesorSeleccionado] = useState<ProfesorConHorarios | null>(null);
  const [alertaGrupal, setAlertaGrupal] = useState('');

  const [modalSolicitud, setModalSolicitud] = useState<{
    profesor: ProfesorConHorarios;
    horario?: HorarioItem;
  } | null>(null);
  const [materia, setMateria] = useState('');
  const [tema, setTema] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [hora, setHora] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(true);

  const cargarDatos = async () => {
    try {
      const [resProfesores, resHorarios, resGrupales] = await Promise.all([
        api.get('/auth/profesores'),
        api.get('/horarios'),
        api.get('/tutorias/grupales'),
      ]);

      const listaProfesores: ProfesorUser[] = resProfesores.data;
      const listaHorarios: HorarioItem[] = resHorarios.data;

      const profesoresAgrupados: ProfesorConHorarios[] = listaProfesores.map((prof) => ({
        ...prof,
        horarios: listaHorarios.filter((h) => h.profesor && h.profesor._id === prof._id),
      }));

      setProfesores(profesoresAgrupados);
      setGrupales(resGrupales.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const iniciar = async () => {
      await cargarDatos();
      setCargando(false);
    };
    iniciar();
  }, []);

  const inscribirseEnGrupal = async (tutoriaId: string) => {
    setAlertaGrupal('');
    try {
      await api.post(`/tutorias/${tutoriaId}/inscribirse`);
      setAlertaGrupal('¡Te has inscrito correctamente a la tutoría grupal!');
      await cargarDatos();
      setTimeout(() => setAlertaGrupal(''), 3500);
    } catch (err) {
      const errorAxios = err as AxiosError<{ message: string }>;
      setAlertaGrupal(errorAxios.response?.data?.message || 'No se pudo completar la inscripción');
    }
  };

  const profesoresFiltrados = profesores.filter((p) => {
    const coincideNombre = p.nombre.toLowerCase().includes(nomProf.toLowerCase());
    const coincideMateria =
      materiaFiltro.trim() === '' ||
      (p.materias &&
        p.materias.some((m) => m.toLowerCase().includes(materiaFiltro.toLowerCase())));

    return coincideNombre && coincideMateria;
  });

  const abrirSolicitud = (prof: ProfesorConHorarios, horario?: HorarioItem) => {
    setModalSolicitud({ profesor: prof, horario });
    if (horario) {
      setHora(`${horario.dia} ${horario.horaInicio} - ${horario.horaFin}`);
    } else {
      setHora('');
    }
    if (prof.materias && prof.materias.length > 0) {
      setMateria(prof.materias[0]);
    } else {
      setMateria(materiaFiltro);
    }
    setTema('');
    setDescripcion('');
    setMensaje('');
  };

  const enviarSolicitud = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalSolicitud) return;

    try {
      await api.post('/tutorias', {
        materia,
        tema,
        descripcion,
        profesorId: modalSolicitud.profesor._id,
        hora,
      });
      setMensaje('¡Solicitud enviada correctamente!');
      setTimeout(() => {
        setModalSolicitud(null);
        setMensaje('');
      }, 1500);
    } catch (err) {
      console.error(err);
      setMensaje('Error al enviar la solicitud');
    }
  };

  if (cargando) {
    return <div className="text-gray-500">Cargando profesores y tutorías disponibles...</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Buscador de Profesores */}
      <div className="bg-white p-6 rounded-xl shadow-sm border space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h2 className="text-xl font-bold text-gray-800">Buscar Tutorías</h2>
          {user?.carrera && (
            <span className="text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-full self-start sm:self-auto">
              Carrera: {user.carrera}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Nom Prof"
            value={nomProf}
            onChange={(e) => setNomProf(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="Materia"
            value={materiaFiltro}
            onChange={(e) => setMateriaFiltro(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={() => {
              setNomProf('');
              setMateriaFiltro('');
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg text-sm transition"
          >
            {nomProf || materiaFiltro ? 'Limpiar Filtros' : 'Buscar'}
          </button>
        </div>
      </div>

      {/* Tutorías Grupales Programadas Abiertas (HU-16) */}
      {grupales.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-sm border space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <div>
              <h3 className="text-lg font-bold text-gray-800">
                Tutorías Grupales Programadas (Inscripción Abierta)
              </h3>
              <p className="text-xs text-gray-500">
                Únete a una tutoría ya programada por un docente de tu carrera
              </p>
            </div>
          </div>

          {alertaGrupal && (
            <div className="p-2.5 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg text-xs font-medium">
              {alertaGrupal}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {grupales.map((tg) => {
              const totalInscritos = 1 + (tg.participantes?.length || 0);
              const cupo = tg.cupoMaximo || 10;
              const yaSoyParte =
                tg.estudiante?._id === user?.id ||
                tg.participantes?.some((p) => p.estudiante?._id === user?.id);

              return (
                <div
                  key={tg._id}
                  className="p-4 bg-purple-50/40 rounded-lg border border-purple-200 flex flex-col justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-sm text-gray-800">
                        {tg.materia} {tg.tema ? `- ${tg.tema}` : ''}
                      </span>
                      <span className="text-[11px] font-semibold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                        Cupos: {totalInscritos}/{cupo}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">{tg.descripcion}</p>
                    <p className="text-xs text-gray-700 pt-1">
                      <span className="font-semibold">Profesor:</span> {tg.profesor?.nombre} •{' '}
                      <span className="capitalize">{tg.modalidad || 'Virtual'}</span>
                    </p>
                    <p className="text-xs text-gray-700">
                      <span className="font-semibold">Horario:</span> {tg.hora || 'Por confirmar'}
                    </p>
                  </div>

                  <div className="flex justify-end">
                    {yaSoyParte ? (
                      <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-lg">
                        ✓ Ya estás inscrito
                      </span>
                    ) : totalInscritos >= cupo ? (
                      <span className="text-xs font-semibold text-gray-500 bg-gray-200 px-3 py-1.5 rounded-lg">
                        Cupo lleno
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => inscribirseEnGrupal(tg._id)}
                        className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-4 py-1.5 rounded-lg font-medium transition"
                      >
                        + Inscribirme a esta tutoría
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Resultados de Profesores */}
      <div className="bg-white p-6 rounded-xl shadow-sm border space-y-4">
        <h3 className="text-lg font-bold text-gray-800">Profesores Disponibles</h3>

        {profesoresFiltrados.length === 0 ? (
          <p className="text-gray-500 text-sm">
            No se encontraron profesores disponibles para tu carrera
            {user?.carrera ? ` (${user.carrera})` : ''}.
          </p>
        ) : (
          <div className="space-y-3">
            {profesoresFiltrados.map((prof) => (
              <div
                key={prof._id}
                className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 p-4 bg-gray-50 rounded-lg border"
              >
                <div className="space-y-1.5">
                  <div>
                    <h4 className="font-bold text-gray-800">{prof.nombre}</h4>
                    <p className="text-xs text-gray-500">{prof.email}</p>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                      Escuela: {prof.escuela || 'Sin asignar'}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
                      Carrera: {prof.carrera || 'Sin asignar'}
                    </span>
                  </div>

                  {prof.materias && prof.materias.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-xs font-semibold text-gray-600">Materias:</span>
                      {prof.materias.map((mat, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded text-[11px] font-medium bg-white text-gray-700 border border-gray-300"
                        >
                          {mat}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 self-end sm:self-center shrink-0">
                  <button
                    onClick={() => setProfesorSeleccionado(prof)}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs px-3 py-1.5 rounded-md font-medium"
                  >
                    Ver
                  </button>
                  <button
                    onClick={() => abrirSolicitud(prof)}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded-md font-medium"
                  >
                    + Tuto
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {profesorSeleccionado && (
        <div className="bg-white p-6 rounded-xl shadow-sm border space-y-4">
          <div className="flex justify-between items-center border-b pb-2">
            <div>
              <h3 className="text-lg font-bold text-gray-800">
                {profesorSeleccionado.nombre} - Horarios Disponibles
              </h3>
              <p className="text-xs text-gray-500">
                {profesorSeleccionado.escuela || 'Escuela no asignada'} •{' '}
                {profesorSeleccionado.carrera || 'Carrera no asignada'}
              </p>
            </div>
            <button
              onClick={() => setProfesorSeleccionado(null)}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Cerrar
            </button>
          </div>

          {profesorSeleccionado.horarios.length === 0 ? (
            <p className="text-xs text-gray-500">
              Este profesor no tiene bloques de horario configurados aún.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {profesorSeleccionado.horarios.map((h) => (
                <div
                  key={h._id}
                  className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex justify-between items-center"
                >
                  <div>
                    <span className="font-bold text-xs text-blue-900 block">{h.dia}</span>
                    <span className="text-xs text-blue-700">
                      {h.horaInicio} - {h.horaFin}
                    </span>
                  </div>
                  <button
                    onClick={() => abrirSolicitud(profesorSeleccionado, h)}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1 rounded font-medium"
                  >
                    Solicitar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {modalSolicitud && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg border max-w-md w-full p-6 space-y-4">
            <div>
              <h3 className="text-lg font-bold text-gray-800">
                Solicitar Tutoría a {modalSolicitud.profesor.nombre}
              </h3>
              <p className="text-xs text-gray-500">
                {modalSolicitud.profesor.carrera || 'Carrera general'}
              </p>
            </div>

            {mensaje && <p className="text-xs font-medium text-blue-600">{mensaje}</p>}

            <form onSubmit={enviarSolicitud} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700">Materia</label>
                {modalSolicitud.profesor.materias && modalSolicitud.profesor.materias.length > 0 ? (
                  <select
                    value={materia}
                    onChange={(e) => setMateria(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-900 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  >
                    {modalSolicitud.profesor.materias.map((mat, i) => (
                      <option key={i} value={mat}>
                        {mat}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={materia}
                    onChange={(e) => setMateria(e.target.value)}
                    placeholder="Nombre de la materia"
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700">Tema Específico</label>
                <input
                  type="text"
                  value={tema}
                  onChange={(e) => setTema(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700">
                  Horario / Fecha Propuesta
                </label>
                <input
                  type="text"
                  value={hora}
                  onChange={(e) => setHora(e.target.value)}
                  placeholder="Ej: Lunes 08:00 - 10:00"
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700">
                  Descripción de la duda
                </label>
                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  rows={3}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2 justify-end">
                <button
                  type="button"
                  onClick={() => setModalSolicitud(null)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs px-4 py-2 rounded-lg font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-4 py-2 rounded-lg font-medium"
                >
                  Enviar Petición
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}