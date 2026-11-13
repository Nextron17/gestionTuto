import { SurfaceCard } from '../../ui/SurfaceCard';
import { Icon } from '../../ui/Icon';
import { Button } from '../../ui/Button';
import { FormInput, FormSelect } from '../../ui/FormField';
import { CalloutBanner } from '../../ui/CalloutBanner';
import { DIAS_SEMANA, FranjaForm, SEMESTRES } from './types';

interface FormularioHorarioSectionProps {
  feedback: { tipo: 'ok' | 'error'; texto: string } | null;
  agregarHorario: (e: React.FormEvent) => void;
  nombreProfesor: string;
  setNombreProfesor: (value: string) => void;
  materiaSeleccionada: string;
  setMateriaSeleccionada: (value: string) => void;
  opcionesMaterias: string[];
  otraMateria: string;
  setOtraMateria: (value: string) => void;
  semestre: string;
  setSemestre: (value: string) => void;
  diasSeleccionados: string[];
  setDiasSeleccionados: (dias: string[]) => void;
  toggleDia: (diaItem: string) => void;
  franjas: FranjaForm[];
  agregarFranja: () => void;
  actualizarFranja: (idx: number, campo: keyof FranjaForm, valor: string) => void;
  eliminarFranjaForm: (idx: number) => void;
  totalBloquesAGuardar: number;
  guardando: boolean;
}

export function FormularioHorarioSection({
  feedback,
  agregarHorario,
  nombreProfesor,
  setNombreProfesor,
  materiaSeleccionada,
  setMateriaSeleccionada,
  opcionesMaterias,
  otraMateria,
  setOtraMateria,
  semestre,
  setSemestre,
  diasSeleccionados,
  setDiasSeleccionados,
  toggleDia,
  franjas,
  agregarFranja,
  actualizarFranja,
  eliminarFranjaForm,
  totalBloquesAGuardar,
  guardando,
}: FormularioHorarioSectionProps) {
  return (
    <SurfaceCard
      tone="lowest"
      className="p-4 sm:p-space-lg space-y-space-md lg:col-span-5 h-fit"
    >
      <div>
        <h2 className="font-label-md text-base font-bold text-on-surface flex items-center gap-2">
          <Icon className="text-primary text-[20px]">calendar_add_on</Icon>
          <span>Registrar Disponibilidad</span>
        </h2>
        <p className="text-xs text-on-surface-variant mt-0.5">
          Completa tus datos docentes, la asignatura y selecciona uno o varios días y franjas.
        </p>
      </div>

      {feedback && (
        <CalloutBanner
          tone={feedback.tipo === 'ok' ? 'success' : 'danger'}
          title={feedback.tipo === 'ok' ? 'Horario registrado' : 'Revisa el formulario'}
        >
          {feedback.texto}
        </CalloutBanner>
      )}

      <form onSubmit={agregarHorario} className="space-y-4">
        <FormInput
          id="horario-profesor-nombre"
          label="Nombre del Profesor *"
          icon="person"
          value={nombreProfesor}
          onChange={(e) => setNombreProfesor(e.target.value)}
          placeholder="Ej: Dr. Carlos Andrés Ruiz"
          required
        />

        <FormSelect
          id="horario-materia"
          label="Asignatura / Materia *"
          icon="menu_book"
          value={materiaSeleccionada}
          onChange={(e) => setMateriaSeleccionada(e.target.value)}
          required
        >
          {opcionesMaterias.length === 0 && (
            <option value="__otra__">Escribir asignatura manualmente</option>
          )}
          {opcionesMaterias.map((mat) => (
            <option key={mat} value={mat}>
              {mat}
            </option>
          ))}
          {opcionesMaterias.length > 0 && (
            <option value="__otra__">+ Otra asignatura (escribir manualmente)</option>
          )}
        </FormSelect>

        {materiaSeleccionada === '__otra__' && (
          <FormInput
            id="horario-otra-materia"
            label="Nombre de la Asignatura *"
            icon="edit_note"
            value={otraMateria}
            onChange={(e) => setOtraMateria(e.target.value)}
            placeholder="Ej: Física Mecánica"
            required
          />
        )}

        <FormSelect
          id="horario-semestre"
          label="Semestre Académico *"
          icon="school"
          value={semestre}
          onChange={(e) => setSemestre(e.target.value)}
          required
        >
          {SEMESTRES.map((sem) => (
            <option key={sem} value={String(sem)}>
              {sem}° Semestre
            </option>
          ))}
        </FormSelect>

        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-label-md text-[13px] font-semibold text-on-surface">
              Días Disponibles * ({diasSeleccionados.length})
            </span>
            <div className="flex items-center gap-2 text-[11px] font-label-md">
              <button
                type="button"
                onClick={() =>
                  setDiasSeleccionados(['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'])
                }
                className="text-primary hover:underline cursor-pointer font-semibold"
              >
                Lun–Vie
              </button>
              <span className="text-outline">•</span>
              <button
                type="button"
                onClick={() => setDiasSeleccionados([])}
                className="text-on-surface-variant hover:text-error cursor-pointer"
              >
                Limpiar
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {DIAS_SEMANA.map((d) => {
              const activo = diasSeleccionados.includes(d);
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggleDia(d)}
                  aria-pressed={activo}
                  className={`px-2.5 py-2 rounded-lg text-xs font-label-md font-semibold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                    activo
                      ? 'bg-primary text-on-primary shadow-xs'
                      : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  {activo && <Icon className="text-[14px]">check</Icon>}
                  <span>{d}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="font-label-md text-[13px] font-semibold text-on-surface">
              Franjas Horarias * ({franjas.length})
            </span>
            <button
              type="button"
              onClick={agregarFranja}
              className="inline-flex items-center gap-1 text-xs font-label-md font-bold text-primary hover:underline cursor-pointer"
            >
              <Icon className="text-[16px]">add_circle</Icon>
              <span>Añadir otra franja</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {franjas.map((franja, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-surface-container-low space-y-2 border border-surface-container"
              >
                <div className="flex items-center justify-between">
                  <span className="font-label-md text-[11px] font-bold uppercase tracking-wider text-outline">
                    Franja #{idx + 1}
                  </span>
                  {franjas.length > 1 && (
                    <button
                      type="button"
                      onClick={() => eliminarFranjaForm(idx)}
                      className="text-xs font-label-md text-error hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <Icon className="text-[14px]">close</Icon>
                      <span>Quitar</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <FormInput
                    id={`horario-inicio-${idx}`}
                    type="time"
                    label="Inicio"
                    value={franja.horaInicio}
                    onChange={(e) => actualizarFranja(idx, 'horaInicio', e.target.value)}
                    required
                  />
                  <FormInput
                    id={`horario-fin-${idx}`}
                    type="time"
                    label="Fin"
                    value={franja.horaFin}
                    onChange={(e) => actualizarFranja(idx, 'horaFin', e.target.value)}
                    required
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <Button type="submit" variant="primary" fullWidth loading={guardando}>
          <Icon className="text-[18px]">save</Icon>
          <span>
            Guardar {totalBloquesAGuardar > 0 ? `${totalBloquesAGuardar} ` : ''}
            {totalBloquesAGuardar === 1 ? 'Horario' : 'Horarios'}
          </span>
        </Button>
      </form>
    </SurfaceCard>
  );
}

