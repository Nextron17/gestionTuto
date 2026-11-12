'use client';

import { useEffect, useState } from 'react';
import api from '../../../../lib/api';
import { Icon } from '../../../../components/ui/Icon';
import { PageHeader } from '../../../../components/ui/PageHeader';
import { SurfaceCard } from '../../../../components/ui/SurfaceCard';
import { Badge } from '../../../../components/ui/Badge';
import { Button } from '../../../../components/ui/Button';
import { FormInput, FormSelect } from '../../../../components/ui/FormField';

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
  const [guardando, setGuardando] = useState(false);

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
    setGuardando(true);
    try {
      await api.post('/horarios', { dia, horaInicio, horaFin });
      await obtenerHorariosAPI();
    } catch (err) {
      console.error(err);
    } finally {
      setGuardando(false);
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
    <div className="space-y-space-lg max-w-6xl mx-auto">
      <PageHeader
        eyebrow="02. Agenda Docente"
        title="Disponibilidad Horaria"
        description="Configura las franjas horarias semanales en las que los estudiantes pueden solicitarte tutorías."
        actions={
          <Badge variant="primary">
            <Icon className="text-[15px]">calendar_month</Icon>
            <span>
              {horarios.length} {horarios.length === 1 ? 'franja activa' : 'franjas activas'}
            </span>
          </Badge>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-space-md">
        <SurfaceCard tone="lowest" className="p-space-lg space-y-space-md h-fit">
          <div>
            <h2 className="font-label-md text-base font-bold text-on-surface flex items-center gap-2">
              <Icon className="text-primary text-[20px]">calendar_add_on</Icon>
              <span>Añadir Franja Horaria</span>
            </h2>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Define un nuevo bloque de atención para tus asignaturas.
            </p>
          </div>

          <form onSubmit={agregarHorario} className="space-y-4">
            <FormSelect
              id="horario-dia"
              label="Día de la Semana"
              icon="event"
              value={dia}
              onChange={(e) => setDia(e.target.value)}
            >
              <option value="Lunes">Lunes</option>
              <option value="Martes">Martes</option>
              <option value="Miércoles">Miércoles</option>
              <option value="Jueves">Jueves</option>
              <option value="Viernes">Viernes</option>
              <option value="Sábado">Sábado</option>
            </FormSelect>

            <FormInput
              id="horario-inicio"
              type="time"
              label="Hora de Inicio"
              icon="schedule"
              value={horaInicio}
              onChange={(e) => setHoraInicio(e.target.value)}
              required
            />

            <FormInput
              id="horario-fin"
              type="time"
              label="Hora de Finalización"
              icon="schedule"
              value={horaFin}
              onChange={(e) => setHoraFin(e.target.value)}
              required
            />

            <Button type="submit" variant="primary" fullWidth loading={guardando}>
              <Icon className="text-[18px]">add</Icon>
              <span>Guardar Horario</span>
            </Button>
          </form>
        </SurfaceCard>

        <SurfaceCard tone="lowest" className="p-space-lg lg:col-span-2 space-y-space-md">
          <div className="flex items-center justify-between pb-2 border-b border-surface-container">
            <div>
              <h2 className="font-label-md text-base font-bold text-on-surface flex items-center gap-2">
                <Icon className="text-primary text-[20px]">event_available</Icon>
                <span>Horarios Registrados</span>
              </h2>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Estas franjas son visibles para los estudiantes en el buscador de tutorías.
              </p>
            </div>
            <Badge variant="neutral">{horarios.length} bloques</Badge>
          </div>

          {horarios.length === 0 ? (
            <div className="p-10 rounded-xl bg-surface-container-low text-center space-y-2">
              <Icon className="text-outline text-[36px]">event_busy</Icon>
              <p className="text-sm text-on-surface-variant">
                No has agregado bloques de horario aún. Usa el formulario lateral para añadir tu
                disponibilidad.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {horarios.map((h) => (
                <div
                  key={h._id}
                  className="flex justify-between items-center p-4 bg-surface-container-low hover:bg-surface-container rounded-xl transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary-fixed text-primary flex items-center justify-center shrink-0">
                      <Icon className="text-[20px]">schedule</Icon>
                    </div>
                    <div>
                      <p className="font-label-md text-sm font-bold text-on-surface">{h.dia}</p>
                      <p className="font-mono text-xs text-on-surface-variant">
                        {h.horaInicio} - {h.horaFin}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => eliminarHorario(h._id)}
                    aria-label={`Eliminar horario ${h.dia} ${h.horaInicio}`}
                    className="w-9 h-9 rounded-lg hover:bg-error-container text-outline hover:text-error flex items-center justify-center transition-colors cursor-pointer"
                    title="Eliminar franja"
                  >
                    <Icon className="text-[18px]">delete</Icon>
                  </button>
                </div>
              ))}
            </div>
          )}
        </SurfaceCard>
      </div>
    </div>
  );
}
