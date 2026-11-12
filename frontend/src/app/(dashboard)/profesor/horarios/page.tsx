'use client';

import { useEffect, useState } from 'react';
import api from '../../../../lib/api';

interface Horario {
  _id: string;
  dia: string;
  horaInicio: string;
  horaFin: string;
}

export default function HorariosPage() {
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [dia, setDia] = useState('Lunes');
  const [horaInicio, setHoraInicio] = useState('08:00');
  const [horaFin, setHoraFin] = useState('10:00');

  const obtenerHorariosAPI = async () => {
    try {
      const res = await api.get('/horarios');
      setHorarios(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const cargarHorarios = async () => {
      try {
        const res = await api.get('/horarios');
        setHorarios(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    cargarHorarios();
  }, []);

  const agregarHorario = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/horarios', { dia, horaInicio, horaFin });
      await obtenerHorariosAPI();
    } catch (err) {
      console.error(err);
    }
  };

  const eliminarHorario = async (id: string) => {
    try {
      await api.delete(`/horarios/${id}`);
      await obtenerHorariosAPI();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Disponibilidad Horaria</h1>
        <p className="text-sm text-gray-500">Configura las franjas horarias en las que puedes impartir tutorías</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Añadir Horario</h2>
          <form onSubmit={agregarHorario} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Día de la semana</label>
              <select
                value={dia}
                onChange={(e) => setDia(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="Lunes">Lunes</option>
                <option value="Martes">Martes</option>
                <option value="Miércoles">Miércoles</option>
                <option value="Jueves">Jueves</option>
                <option value="Viernes">Viernes</option>
                <option value="Sábado">Sábado</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Hora Inicio</label>
              <input
                type="time"
                value={horaInicio}
                onChange={(e) => setHoraInicio(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Hora Fin</label>
              <input
                type="time"
                value={horaFin}
                onChange={(e) => setHoraFin(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition"
            >
              Guardar Horario
            </button>
          </form>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border md:col-span-2">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Horarios Registrados</h2>
          {horarios.length === 0 ? (
            <p className="text-gray-500 text-sm">No has agregado bloques de horario aún.</p>
          ) : (
            <div className="space-y-3">
              {horarios.map((h) => (
                <div key={h._id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border">
                  <div>
                    <p className="font-semibold text-gray-800">{h.dia}</p>
                    <p className="text-sm text-gray-600">{h.horaInicio} - {h.horaFin}</p>
                  </div>
                  <button
                    onClick={() => eliminarHorario(h._id)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Eliminar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}