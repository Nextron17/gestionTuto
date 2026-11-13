import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { Icon } from '../../ui/Icon';
import { CalloutBanner } from '../../ui/CalloutBanner';
import { FormInput, FormSelect, FormTextarea } from '../../ui/FormField';
import { Solicitud } from './types';

interface ModalesGestionSolicitudProps {
  modalGestion: {
    solicitud: Solicitud;
    accion: 'aceptada' | 'aplazada';
  } | null;
  cerrarModalGestion: () => void;
  confirmarGestion: (e: React.FormEvent) => void;
  errorModalGestion: string;
  procesandoModal: boolean;
  fechaModal: string;
  setFechaModal: (value: string) => void;
  horaPropuesta: string;
  setHoraPropuesta: (value: string) => void;
  modalidad: 'virtual' | 'presencial';
  setModalidad: (value: 'virtual' | 'presencial') => void;
  tipo: 'individual' | 'grupal';
  setTipo: (value: 'individual' | 'grupal') => void;
  cupoMaximo: number;
  setCupoMaximo: (value: number) => void;
  lugarModal: string;
  setLugarModal: (value: string) => void;
  enlaceReunionModal: string;
  setEnlaceReunionModal: (value: string) => void;
  comentarioModal: string;
  setComentarioModal: (value: string) => void;
  solicitudACancelar: Solicitud | null;
  cerrarModalCancelacion: () => void;
  confirmarCancelacion: (e: React.FormEvent) => void;
  motivoCancelacion: string;
  setMotivoCancelacion: (value: string) => void;
  cancelando: boolean;
}

export function ModalesGestionSolicitud({
  modalGestion,
  cerrarModalGestion,
  confirmarGestion,
  errorModalGestion,
  procesandoModal,
  fechaModal,
  setFechaModal,
  horaPropuesta,
  setHoraPropuesta,
  modalidad,
  setModalidad,
  tipo,
  setTipo,
  cupoMaximo,
  setCupoMaximo,
  lugarModal,
  setLugarModal,
  enlaceReunionModal,
  setEnlaceReunionModal,
  comentarioModal,
  setComentarioModal,
  solicitudACancelar,
  cerrarModalCancelacion,
  confirmarCancelacion,
  motivoCancelacion,
  setMotivoCancelacion,
  cancelando,
}: ModalesGestionSolicitudProps) {
  return (
    <>
      <Modal
        open={Boolean(modalGestion)}
        onClose={cerrarModalGestion}
        title={
          modalGestion?.accion === 'aceptada'
            ? 'Aceptar y Configurar Tutoría'
            : 'Aplazar / Reprogramar Tutoría'
        }
        subtitle={`${modalGestion?.solicitud.materia || ''} — ${
          modalGestion?.solicitud.estudiante?.nombre || ''
        }`}
        icon={modalGestion?.accion === 'aceptada' ? 'check_circle' : 'edit_calendar'}
        tone={modalGestion?.accion === 'aceptada' ? 'primary' : 'warning'}
        footer={
          <>
            <Button variant="subtle" size="sm" onClick={cerrarModalGestion}>
              Cerrar
            </Button>
            <Button
              type="submit"
              form="form-gestionar-solicitud"
              variant={modalGestion?.accion === 'aceptada' ? 'primary' : 'tertiary'}
              size="sm"
              loading={procesandoModal}
            >
              <Icon className="text-[16px]">check</Icon>
              <span>
                {modalGestion?.accion === 'aceptada' ? 'Confirmar Aceptación' : 'Confirmar Aplazamiento'}
              </span>
            </Button>
          </>
        }
      >
        <form id="form-gestionar-solicitud" onSubmit={confirmarGestion} className="space-y-3.5">
          {errorModalGestion && (
            <CalloutBanner tone="danger" title="Faltan datos requeridos">
              {errorModalGestion}
            </CalloutBanner>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormInput
              id="modal-fecha-propuesta"
              type="date"
              label={
                modalGestion?.accion === 'aplazada'
                  ? 'Nueva Fecha Propuesta'
                  : 'Fecha Confirmada'
              }
              icon="event"
              value={fechaModal}
              onChange={(e) => setFechaModal(e.target.value)}
              required
            />

            <FormInput
              id="modal-hora-propuesta"
              label={
                modalGestion?.accion === 'aplazada'
                  ? 'Nueva Franja Horaria'
                  : 'Franja Horaria Confirmada'
              }
              icon="schedule"
              value={horaPropuesta}
              onChange={(e) => setHoraPropuesta(e.target.value)}
              placeholder="Ej: Viernes 10:00 - 12:00"
              required
            />
          </div>

          {modalGestion?.accion === 'aceptada' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormSelect
                  id="modal-modalidad"
                  label="Modalidad"
                  icon={modalidad === 'presencial' ? 'location_on' : 'videocam'}
                  value={modalidad}
                  onChange={(e) => setModalidad(e.target.value as 'virtual' | 'presencial')}
                >
                  <option value="virtual">Virtual (Google Meet / Zoom)</option>
                  <option value="presencial">Presencial (En campus)</option>
                </FormSelect>

                <FormSelect
                  id="modal-tipo"
                  label="Tipo de Sesión"
                  icon={tipo === 'grupal' ? 'groups' : 'person'}
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value as 'individual' | 'grupal')}
                >
                  <option value="individual">Individual</option>
                  <option value="grupal">Grupal (Abierta a otros)</option>
                </FormSelect>
              </div>

              {tipo === 'grupal' && (
                <FormInput
                  id="modal-cupo"
                  type="number"
                  min={2}
                  max={50}
                  label="Cupo Máximo de Estudiantes"
                  icon="group_add"
                  value={cupoMaximo}
                  onChange={(e) => setCupoMaximo(Number(e.target.value))}
                />
              )}
              {modalGestion?.accion === 'aceptada' && modalidad === 'presencial' && (
                <FormInput
                  id="modal-lugar"
                  label="Lugar / Salón de la Tutoría Presencial *"
                  icon="location_on"
                  value={lugarModal}
                  onChange={(e) => setLugarModal(e.target.value)}
                  placeholder="Ej: Salón 202 - Edificio de Ingeniería"
                  required
                />
              )}
              {modalGestion?.accion === 'aceptada' && modalidad === 'virtual' && (
                <FormInput
                  id="modal-enlace-reunion"
                  type="url"
                  label="Enlace de la Reunión Virtual *"
                  icon="link"
                  value={enlaceReunionModal}
                  onChange={(e) => setEnlaceReunionModal(e.target.value)}
                  placeholder="https://meet.google.com/abc-defg-hij"
                  required
                />
              )}
            </>
          )}

          <FormTextarea
            id="modal-comentario"
            label={
              modalGestion?.accion === 'aplazada'
                ? 'Motivo del aplazamiento / Dificultad de agenda *'
                : 'Indicaciones adicionales para el estudiante (Opcional)'
            }
            value={comentarioModal}
            onChange={(e) => setComentarioModal(e.target.value)}
            rows={3}
            placeholder={
              modalGestion?.accion === 'aplazada'
                ? 'Ej: Tengo reunión de facultad en esa fecha, propongo reprogramar para el viernes.'
                : modalidad === 'virtual'
                ? 'Ej: Tener ejercicios listos y cámara activa'
                : 'Ej: Traer guía de ejercicios impresa o computador portátil'
            }
            required={modalGestion?.accion === 'aplazada'}
          />
        </form>
      </Modal>

      <Modal
        open={Boolean(solicitudACancelar)}
        onClose={cerrarModalCancelacion}
        title="Confirmar Cancelación de Solicitud"
        subtitle={`${solicitudACancelar?.materia || ''} — ${
          solicitudACancelar?.estudiante?.nombre || ''
        }`}
        icon="warning"
        tone="danger"
        footer={
          <>
            <Button variant="subtle" size="sm" onClick={cerrarModalCancelacion}>
              Volver
            </Button>
            <Button
              type="submit"
              form="form-cancelar-solicitud"
              variant="danger"
              size="sm"
              loading={cancelando}
            >
              <Icon className="text-[16px]">cancel</Icon>
              <span>Sí, Cancelar Solicitud</span>
            </Button>
          </>
        }
      >
        <form id="form-cancelar-solicitud" onSubmit={confirmarCancelacion} className="space-y-3.5">
          <p className="font-body-md text-sm text-on-surface leading-relaxed">
            ¿Deseas cancelar la solicitud de <strong>{solicitudACancelar?.materia}</strong>
            {solicitudACancelar?.tema ? ` (${solicitudACancelar.tema})` : ''} enviada por{' '}
            <strong>{solicitudACancelar?.estudiante?.nombre}</strong>?
          </p>

          <FormTextarea
            id="modal-motivo-cancelacion"
            label="Motivo de cancelación (visible para el estudiante)"
            value={motivoCancelacion}
            onChange={(e) => setMotivoCancelacion(e.target.value)}
            rows={3}
            placeholder="Ej: Cruce con comité académico; por favor agenda en otra franja disponible."
            required
          />
        </form>
      </Modal>
    </>
  );
}
