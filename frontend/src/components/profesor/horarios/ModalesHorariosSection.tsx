import Link from 'next/link';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { Icon } from '../../ui/Icon';
import { CalloutBanner } from '../../ui/CalloutBanner';
import { FormInput, FormSelect } from '../../ui/FormField';
import { DIAS_SEMANA, Horario, SEMESTRES, TutoriaAsociada } from './types';

interface ModalesHorariosSectionProps {
  modalEditar: Horario | null;
  cerrarModalEditar: () => void;
  guardarEdicionHorario: (e: React.FormEvent) => void;
  guardandoEdicion: boolean;
  errorModalEditar: string;
  editNombreProfesor: string;
  setEditNombreProfesor: (value: string) => void;
  editMateria: string;
  setEditMateria: (value: string) => void;
  opcionesMaterias: string[];
  editOtraMateria: string;
  setEditOtraMateria: (value: string) => void;
  editSemestre: string;
  setEditSemestre: (value: string) => void;
  editDia: string;
  setEditDia: (value: string) => void;
  editHoraInicio: string;
  setEditHoraInicio: (value: string) => void;
  editHoraFin: string;
  setEditHoraFin: (value: string) => void;
  horarioAEliminar: Horario | null;
  cerrarModalEliminar: () => void;
  tutoriasBloqueantes: TutoriaAsociada[];
  errorEliminacion: string;
  eliminandoHorario: boolean;
  confirmarEliminacionHorario: () => void;
}

export function ModalesHorariosSection({
  modalEditar,
  cerrarModalEditar,
  guardarEdicionHorario,
  guardandoEdicion,
  errorModalEditar,
  editNombreProfesor,
  setEditNombreProfesor,
  editMateria,
  setEditMateria,
  opcionesMaterias,
  editOtraMateria,
  setEditOtraMateria,
  editSemestre,
  setEditSemestre,
  editDia,
  setEditDia,
  editHoraInicio,
  setEditHoraInicio,
  editHoraFin,
  setEditHoraFin,
  horarioAEliminar,
  cerrarModalEliminar,
  tutoriasBloqueantes,
  errorEliminacion,
  eliminandoHorario,
  confirmarEliminacionHorario,
}: ModalesHorariosSectionProps) {
  return (
    <>
      <Modal
        open={Boolean(modalEditar)}
        onClose={cerrarModalEditar}
        title="Editar Horario Disponible"
        subtitle={
          modalEditar
            ? `${modalEditar.materia || ''} — ${modalEditar.dia} ${modalEditar.horaInicio} - ${modalEditar.horaFin}`
            : ''
        }
        icon="edit_calendar"
        tone="primary"
        footer={
          <>
            <Button variant="subtle" size="sm" onClick={cerrarModalEditar}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form="form-editar-horario"
              variant="primary"
              size="sm"
              loading={guardandoEdicion}
            >
              <Icon className="text-[16px]">save</Icon>
              <span>Guardar Cambios</span>
            </Button>
          </>
        }
      >
        <form id="form-editar-horario" onSubmit={guardarEdicionHorario} className="space-y-3.5">
          {errorModalEditar && (
            <CalloutBanner tone="danger" title="No se pudo guardar">
              {errorModalEditar}
            </CalloutBanner>
          )}

          {modalEditar?.tutoriasAceptadas && modalEditar.tutoriasAceptadas.length > 0 && (
            <CalloutBanner tone="warning" title="Horario con tutorías aceptadas">
              Este bloque tiene {modalEditar.tutoriasAceptadas.length} tutoría(s) aceptada(s).
              Solo puedes actualizar el semestre o el nombre del profesor; para cambiar día, franja o
              asignatura debes reprogramarlas o cancelarlas primero en Solicitudes.
            </CalloutBanner>
          )}

          <FormInput
            id="edit-horario-profesor"
            label="Nombre del Profesor *"
            icon="person"
            value={editNombreProfesor}
            onChange={(e) => setEditNombreProfesor(e.target.value)}
            required
          />

          <FormSelect
            id="edit-horario-materia"
            label="Asignatura / Materia *"
            icon="menu_book"
            value={editMateria}
            onChange={(e) => setEditMateria(e.target.value)}
            required
          >
            {opcionesMaterias.map((mat) => (
              <option key={mat} value={mat}>
                {mat}
              </option>
            ))}
            <option value="__otra__">+ Otra asignatura (escribir manualmente)</option>
          </FormSelect>

          {editMateria === '__otra__' && (
            <FormInput
              id="edit-horario-otra-materia"
              label="Nombre de la Asignatura *"
              icon="edit_note"
              value={editOtraMateria}
              onChange={(e) => setEditOtraMateria(e.target.value)}
              required
            />
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormSelect
              id="edit-horario-semestre"
              label="Semestre Académico *"
              icon="school"
              value={editSemestre}
              onChange={(e) => setEditSemestre(e.target.value)}
              required
            >
              {SEMESTRES.map((sem) => (
                <option key={sem} value={String(sem)}>
                  {sem}° Semestre
                </option>
              ))}
            </FormSelect>

            <FormSelect
              id="edit-horario-dia"
              label="Día de la Semana *"
              icon="event"
              value={editDia}
              onChange={(e) => setEditDia(e.target.value)}
              required
            >
              {DIAS_SEMANA.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </FormSelect>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormInput
              id="edit-horario-inicio"
              type="time"
              label="Hora de Inicio *"
              value={editHoraInicio}
              onChange={(e) => setEditHoraInicio(e.target.value)}
              required
            />
            <FormInput
              id="edit-horario-fin"
              type="time"
              label="Hora de Fin *"
              value={editHoraFin}
              onChange={(e) => setEditHoraFin(e.target.value)}
              required
            />
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(horarioAEliminar)}
        onClose={cerrarModalEliminar}
        title={
          tutoriasBloqueantes.length > 0
            ? 'Horario Protegido por Tutorías Aceptadas'
            : 'Confirmar Eliminación de Horario'
        }
        subtitle={
          horarioAEliminar
            ? `${horarioAEliminar.materia || ''} — ${horarioAEliminar.dia} ${horarioAEliminar.horaInicio} - ${horarioAEliminar.horaFin}`
            : ''
        }
        icon={tutoriasBloqueantes.length > 0 ? 'event_busy' : 'warning'}
        tone="danger"
        footer={
          <>
            <Button variant="subtle" size="sm" onClick={cerrarModalEliminar}>
              Cerrar
            </Button>
            {tutoriasBloqueantes.length > 0 ? (
              <Link
                href="/profesor/solicitudes"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary text-on-primary text-xs font-label-md font-semibold hover:bg-primary-container transition-colors"
              >
                <Icon className="text-[16px]">edit_calendar</Icon>
                <span>Ir a Solicitudes para Reprogramar o Cancelar</span>
              </Link>
            ) : (
              <Button
                variant="danger"
                size="sm"
                loading={eliminandoHorario}
                onClick={confirmarEliminacionHorario}
              >
                <Icon className="text-[16px]">delete</Icon>
                <span>Sí, Eliminar Horario</span>
              </Button>
            )}
          </>
        }
      >
        <div className="space-y-3">
          {errorEliminacion && (
            <CalloutBanner tone="danger" title="Eliminación bloqueada">
              {errorEliminacion}
            </CalloutBanner>
          )}

          {tutoriasBloqueantes.length > 0 ? (
            <>
              <CalloutBanner tone="danger" title="No es posible eliminar este horario">
                Este horario tiene <strong>{tutoriasBloqueantes.length}</strong> tutoría(s)
                aceptada(s) pendiente(s) por dictar. Según la política académica, debes
                reprogramarlas o cancelarlas antes de eliminar la franja.
              </CalloutBanner>
              <div className="rounded-xl bg-surface-container-low divide-y divide-surface-container-highest overflow-hidden">
                {tutoriasBloqueantes.map((tut) => (
                  <div key={tut._id} className="p-3 text-xs space-y-0.5">
                    <p className="font-bold text-on-surface">
                      {tut.materia} {tut.tema ? `• ${tut.tema}` : ''}
                    </p>
                    <p className="text-on-surface-variant">
                      Estudiante: <strong>{tut.estudiante?.nombre || 'Estudiante'}</strong> •{' '}
                      {tut.hora}
                    </p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="font-body-md text-sm text-on-surface leading-relaxed">
              ¿Deseas eliminar permanentemente la franja del{' '}
              <strong>
                {horarioAEliminar?.dia} ({horarioAEliminar?.horaInicio} - {horarioAEliminar?.horaFin})
              </strong>{' '}
              para <strong>{horarioAEliminar?.materia}</strong>? Dejará de mostrarse a los
              estudiantes.
            </p>
          )}
        </div>
      </Modal>
    </>
  );
}
