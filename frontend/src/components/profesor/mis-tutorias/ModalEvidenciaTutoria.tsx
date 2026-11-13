import { Dispatch, SetStateAction } from 'react';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { Icon } from '../../ui/Icon';
import { CalloutBanner } from '../../ui/CalloutBanner';
import { FormInput, FormSelect, FormTextarea } from '../../ui/FormField';
import { Tutoria } from './types';

interface ModalEvidenciaTutoriaProps {
  tutoriaEvidencia: Tutoria | null;
  onClose: () => void;
  guardarEvidencia: (e: React.FormEvent) => void;
  guardandoEvidencia: boolean;
  errorModal: string;
  modalidadEdit: 'virtual' | 'presencial';
  setModalidadEdit: (value: 'virtual' | 'presencial') => void;
  lugarEdit: string;
  setLugarEdit: (value: string) => void;
  enlaceReunionEdit: string;
  setEnlaceReunionEdit: (value: string) => void;
  grabacionEdit: string;
  setGrabacionEdit: (value: string) => void;
  comentarioEdit: string;
  setComentarioEdit: (value: string) => void;
  asistenciaPrincipalEdit: boolean | null;
  setAsistenciaPrincipalEdit: (value: boolean | null) => void;
  asistenciasPartEdit: Record<string, boolean | null>;
  setAsistenciasPartEdit: Dispatch<SetStateAction<Record<string, boolean | null>>>;
}

export function ModalEvidenciaTutoria({
  tutoriaEvidencia,
  onClose,
  guardarEvidencia,
  guardandoEvidencia,
  errorModal,
  modalidadEdit,
  setModalidadEdit,
  lugarEdit,
  setLugarEdit,
  enlaceReunionEdit,
  setEnlaceReunionEdit,
  grabacionEdit,
  setGrabacionEdit,
  comentarioEdit,
  setComentarioEdit,
  asistenciaPrincipalEdit,
  setAsistenciaPrincipalEdit,
  asistenciasPartEdit,
  setAsistenciasPartEdit,
}: ModalEvidenciaTutoriaProps) {
  return (
    <Modal
      open={Boolean(tutoriaEvidencia)}
      onClose={onClose}
      title="Registrar Evidencia de la Tutoría"
      subtitle={`${tutoriaEvidencia?.materia || ''}${
        tutoriaEvidencia?.tema ? ` — ${tutoriaEvidencia.tema}` : ''
      }`}
      icon="fact_check"
      tone="primary"
      footer={
        <>
          <Button variant="subtle" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="form-evidencia-tutoria"
            variant="primary"
            size="sm"
            loading={guardandoEvidencia}
          >
            <Icon className="text-[16px]">save</Icon>
            <span>Guardar Evidencia</span>
          </Button>
        </>
      }
    >
      <form id="form-evidencia-tutoria" onSubmit={guardarEvidencia} className="space-y-4">
        {errorModal && (
          <CalloutBanner tone="danger" title="Falta evidencia obligatoria">
            {errorModal}
          </CalloutBanner>
        )}

        <FormSelect
          id="evidencia-modalidad"
          label="Modalidad de la Sesión"
          icon={modalidadEdit === 'presencial' ? 'location_on' : 'videocam'}
          value={modalidadEdit}
          onChange={(e) => setModalidadEdit(e.target.value as 'virtual' | 'presencial')}
        >
          <option value="virtual">Virtual</option>
          <option value="presencial">Presencial</option>
        </FormSelect>

        {modalidadEdit === 'presencial' && (
          <FormInput
            id="evidencia-lugar"
            label="Lugar / Salón Presencial *"
            icon="location_on"
            value={lugarEdit}
            onChange={(e) => setLugarEdit(e.target.value)}
            placeholder="Ej: Salón 302 - Edificio de Ingeniería"
            required
          />
        )}

        {modalidadEdit === 'virtual' && (
          <FormInput
            id="evidencia-enlace-reunion"
            type="url"
            label="Enlace de la Reunión Virtual *"
            icon="link"
            value={enlaceReunionEdit}
            onChange={(e) => setEnlaceReunionEdit(e.target.value)}
            placeholder="https://meet.google.com/xxx-xxxx-xxx"
            required
          />
        )}

        <FormInput
          id="evidencia-grabacion"
          type="url"
          label="Enlace de Grabación (Opcional)"
          icon="play_circle"
          value={grabacionEdit}
          onChange={(e) => setGrabacionEdit(e.target.value)}
          placeholder="https://drive.google.com/..."
        />

        <FormTextarea
          id="evidencia-comentario"
          label={
            modalidadEdit === 'presencial'
              ? 'Salón / Lugar y Observaciones'
              : 'Observaciones de la Sesión'
          }
          value={comentarioEdit}
          onChange={(e) => setComentarioEdit(e.target.value)}
          rows={2}
          placeholder={
            modalidadEdit === 'presencial'
              ? 'Ej: Salón 302 Bloque B — Se desarrollaron 4 ejercicios.'
              : 'Resumen de los temas revisados durante la reunión.'
          }
        />

        <div className="space-y-2">
          <span className="font-label-md text-[13px] font-semibold text-on-surface block">
            Lista de Asistencia de Estudiantes
          </span>
          <div className="rounded-xl bg-surface-container-low divide-y divide-surface-container-highest overflow-hidden">
            {tutoriaEvidencia?.estudiante && (
              <div className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-xs font-bold text-on-surface block truncate">
                    {tutoriaEvidencia.estudiante.nombre}
                  </span>
                  <span className="text-[11px] text-outline block truncate">
                    Solicitante principal
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setAsistenciaPrincipalEdit(true)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                      asistenciaPrincipalEdit === true
                        ? 'bg-[#16a34a] text-white'
                        : 'bg-surface-container-lowest text-on-surface-variant'
                    }`}
                  >
                    Asistió
                  </button>
                  <button
                    type="button"
                    onClick={() => setAsistenciaPrincipalEdit(false)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                      asistenciaPrincipalEdit === false
                        ? 'bg-error text-on-error'
                        : 'bg-surface-container-lowest text-on-surface-variant'
                    }`}
                  >
                    No asistió
                  </button>
                </div>
              </div>
            )}

            {tutoriaEvidencia?.participantes?.map((p) => {
              const estadoPart = asistenciasPartEdit[p.estudiante._id];
              return (
                <div
                  key={p.estudiante._id}
                  className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-on-surface block truncate">
                      {p.estudiante.nombre}
                    </span>
                    <span className="text-[11px] text-outline block truncate">
                      Inscrito grupal
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        setAsistenciasPartEdit((prev) => ({
                          ...prev,
                          [p.estudiante._id]: true,
                        }))
                      }
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                        estadoPart === true
                          ? 'bg-[#16a34a] text-white'
                          : 'bg-surface-container-lowest text-on-surface-variant'
                      }`}
                    >
                      Asistió
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setAsistenciasPartEdit((prev) => ({
                          ...prev,
                          [p.estudiante._id]: false,
                        }))
                      }
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                        estadoPart === false
                          ? 'bg-error text-on-error'
                          : 'bg-surface-container-lowest text-on-surface-variant'
                      }`}
                    >
                      No asistió
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </form>
    </Modal>
  );
}

