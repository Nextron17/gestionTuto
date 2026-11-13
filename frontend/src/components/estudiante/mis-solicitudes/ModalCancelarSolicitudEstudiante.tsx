import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { Icon } from '../../ui/Icon';
import { CalloutBanner } from '../../ui/CalloutBanner';
import { FormTextarea } from '../../ui/FormField';
import { Solicitud } from './types';

interface ModalCancelarSolicitudEstudianteProps {
  solicitudACancelar: Solicitud | null;
  onClose: () => void;
  cancelando: boolean;
  confirmarCancelacion: () => void;
  errorCancelacion: string | null;
  motivoCancelacionEst: string;
  setMotivoCancelacionEst: (value: string) => void;
}

export function ModalCancelarSolicitudEstudiante({
  solicitudACancelar,
  onClose,
  cancelando,
  confirmarCancelacion,
  errorCancelacion,
  motivoCancelacionEst,
  setMotivoCancelacionEst,
}: ModalCancelarSolicitudEstudianteProps) {
  return (
    <Modal
      open={Boolean(solicitudACancelar)}
      onClose={onClose}
      title="Cancelar Solicitud y Liberar Horario"
      icon="warning"
      tone="danger"
      footer={
        <>
          <Button
            variant="subtle"
            size="sm"
            onClick={onClose}
          >
            Mantener Solicitud
          </Button>
          <Button
            variant="danger"
            size="sm"
            loading={cancelando}
            onClick={confirmarCancelacion}
          >
            Sí, Cancelar y Liberar Horario
          </Button>
        </>
      }
    >
      {errorCancelacion && (
        <CalloutBanner tone="danger" title="Error">
          {errorCancelacion}
        </CalloutBanner>
      )}

      <p className="font-body-md text-sm text-on-surface leading-relaxed">
        ¿Estás seguro de que deseas cancelar tu solicitud de{' '}
        <strong>{solicitudACancelar?.materia}</strong>
        {solicitudACancelar?.tema ? ` (${solicitudACancelar.tema})` : ''} con{' '}
        <strong>{solicitudACancelar?.profesor?.nombre || 'el docente asignado'}</strong>
        {solicitudACancelar?.hora ? (
          <>
            {' '}
            en el horario <strong>{solicitudACancelar.hora}</strong>
          </>
        ) : null}
        ?
      </p>

      <FormTextarea
        id="motivo-cancelacion-estudiante"
        label="Motivo de cancelación (opcional)"
        value={motivoCancelacionEst}
        onChange={(e) => setMotivoCancelacionEst(e.target.value)}
        rows={2}
        placeholder="Ej: Tengo cruce con otra clase o ya logré resolver la duda..."
      />

      <div className="p-space-sm rounded-lg bg-surface-container text-on-surface-variant font-label-md text-[12px] flex items-start gap-2">
        <Icon className="text-primary text-[16px] shrink-0 mt-0.5">event_available</Icon>
        <span>
          Al cancelar, liberarás inmediatamente esta franja en la agenda del profesor para que
          pueda atender a otros estudiantes.
        </span>
      </div>
    </Modal>
  );
}
