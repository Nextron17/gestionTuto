'use client';

import { useEffect, useState } from 'react';
import api from '../../../../lib/api';

interface ProfesorUser {
  _id: string;
  nombre: string;
  email: string;
}

interface HorarioItem {
  _id: string;
  dia: string;
  horaInicio: string;
  horaFin: string;
  profesor: ProfesorUser;
}

interface ProfesorAgrupado {
  id: string;
  nombre: string;
  email: string;
  horarios: HorarioItem[];
}

export default function BuscarTutoriasPage() {
  const [nomProf, setNomProf] = useState('');
  const [materiaInput, setMateriaInput] = useState('');
  const [profesores, setProfesores] = useState<ProfesorAgrupado[]>([]);
  const [profesorSeleccionado, setProfesorSeleccionado] = useState<ProfesorAgrupado | null>(null);

  const [modalSolicitud, setModalSolicitud] = useState<{ profesor: ProfesorAgrupado; horario?: HorarioItem } | null>(null);
  const [materia, setMateria] = useState('');
  const [tema, setTema] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [hora, setHora] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const res = await api.get('/horarios');
        const data: HorarioItem[] = res.data;

        const mapa = new Map<string, ProfesorAgrupado>();
        data.forEach((h) => {
          if (h.profesor && h.profesor._id) {
            if (!mapa.has(h.profesor._id)) {
              mapa.set(h.profesor._id, {
                id: h.profesor._id,
                nombre: h.profesor.nombre,
                email: h.profesor.email,
                horarios: [],
              });
            }
            mapa.get(h.profesor._id)?.horarios.push(h);
          }
        });

        setProfesores(Array.from(mapa.values()));
      } catch (err) {
        console.error(err);
      } finally {
        setCargando(false);
      }
    };
    cargarDatos();
  }, []);

  const profesoresFiltrados = profesores.filter((p) => {
    return p.nombre.toLowerCase().includes(nomProf.toLowerCase());
  });

  const abrirSolicitud = (prof: ProfesorAgrupado, horario?: HorarioItem) => {
    setModalSolicitud({ profesor: prof, horario });
    if (horario) {
      setHora(`${horario.dia} ${horario.horaInicio} - ${horario.horaFin}`);
    } else {
      setHora('');
    }
    setMateria(materiaInput);
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
        profesorId: modalSolicitud.profesor.id,
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
    return <div className="text-gray-500">Cargando profesores y horarios disponibles...</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="bg-white p-6 rounded-xl shadow-sm border space-y-4">
        <h2 className="text-xl font-bold text-gray-800">Buscar Tutorías</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Nom Prof"
            value={nomProf}
            onChange={(e) => setNomProf(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="Materia"
            value={materiaInput}
            onChange={(e) => setMateriaInput(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg text-sm transition">
            Buscar
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border space-y-4">
        <h3 className="text-lg font-bold text-gray-800">Resultados</h3>
        {profesoresFiltrados.length === 0 ? (
          <p className="text-gray-500 text-sm">No se encontraron profesores con horarios registrados.</p>
        ) : (
          profesoresFiltrados.map((prof) => (
            <div key={prof.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border">
              <div>
                <h4 className="font-bold text-gray-800">{prof.nombre}</h4>
                <p className="text-sm text-gray-600">{prof.email}</p>
              </div>
              <div className="flex gap-2">
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
          ))
        )}
      </div>

      {profesorSeleccionado && (
        <div className="bg-white p-6 rounded-xl shadow-sm border space-y-4">
          <div className="flex justify-between items-center border-b pb-2">
            <h3 className="text-lg font-bold text-gray-800">{profesorSeleccionado.nombre} - Horarios Disponibles</h3>
            <button
              onClick={() => setProfesorSeleccionado(null)}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Cerrar
            </button>
          </div>
          {profesorSeleccionado.horarios.length === 0 ? (
            <p className="text-xs text-gray-500">Este profesor no tiene horarios configurados.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {profesorSeleccionado.horarios.map((h) => (
                <div key={h._id} className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex justify-between items-center">
                  <div>
                    <span className="font-bold text-xs text-blue-900 block">{h.dia}</span>
                    <span className="text-xs text-blue-700">{h.horaInicio} - {h.horaFin}</span>
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
            <h3 className="text-lg font-bold text-gray-800">
              Solicitar Tutoría a {modalSolicitud.profesor.nombre}
            </h3>

            {mensaje && <p className="text-xs font-medium text-blue-600">{mensaje}</p>}

            <form onSubmit={enviarSolicitud} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700">Materia</label>
                <input
                  type="text"
                  value={materia}
                  onChange={(e) => setMateria(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700">Tema Especifico</label>
                <input
                  type="text"
                  value={tema}
                  onChange={(e) => setTema(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700">Horario / Fecha Propuesta</label>
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
                <label className="block text-xs font-medium text-gray-700">Descripción de la duda</label>
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