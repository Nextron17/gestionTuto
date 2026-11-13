import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { Icon } from '../../ui/Icon';
import { Badge } from '../../ui/Badge';
import { CalloutBanner } from '../../ui/CalloutBanner';
import { FormInput, FormSelect, FormTextarea } from '../../ui/FormField';
import { HorarioItem, ProfesorConHorarios, RecursoRecomendado } from './types';

interface ModalSolicitarTutoriaProps {
  modalSolicitud: {
    profesor: ProfesorConHorarios;
    horario?: HorarioItem;
  } | null;
  onClose: () => void;
  enviarSolicitud: (e: React.FormEvent) => void;
  enviandoSolicitud: boolean;
  mensaje: { tipo: 'ok' | 'error'; texto: string } | null;
  userName?: string;
  materiasDisponiblesModal: string[];
  materia: string;
  setMateria: (value: string) => void;
  temasDeMateria: string[];
  tema: string;
  setTema: (value: string) => void;
  otroTema: string;
  setOtroTema: (value: string) => void;
  recursosRecomendados: RecursoRecomendado[];
  fechaPropuesta: string;
  setFechaPropuesta: (value: string) => void;
  horaSeleccion: string;
  setHoraSeleccion: (value: string) => void;
  otraHora: string;
  setOtraHora: (value: string) => void;
  descripcion: string;
  setDescripcion: (value: string) => void;
}

export function ModalSolicitarTutoria({
  modalSolicitud,
  onClose,
  enviarSolicitud,
  enviandoSolicitud,
  mensaje,
  userName,
  materiasDisponiblesModal,
  materia,
  setMateria,
  temasDeMateria,
  tema,
  setTema,
  otroTema,
  setOtroTema,
  recursosRecomendados,
  fechaPropuesta,
  setFechaPropuesta,
  horaSeleccion,
  setHoraSeleccion,
  otraHora,
  setOtraHora,
  descripcion,
  setDescripcion,
}: ModalSolicitarTutoriaProps) {
  return (
    <Modal
      open={Boolean(modalSolicitud)}
      onClose={onClose}
      title={`Solicitar Tutoría a ${modalSolicitud?.profesor.nombre || ''}`}
      subtitle={
        modalSolicitud?.profesor.carrera ||
        modalSolicitud?.profesor.escuela ||
        'Sesión Académica'
      }
      icon="calendar_add_on"
      tone="primary"
      footer={
        <>
          <Button
            type="button"
            variant="subtle"
            size="sm"
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form="form-solicitar-tutoria"
            variant="primary"
            size="sm"
            loading={enviandoSolicitud}
          >
            <Icon className="text-[16px]">send</Icon>
            <span>Enviar Petición</span>
          </Button>
        </>
      }
    >
      {mensaje && (
        <CalloutBanner
          tone={mensaje.tipo === 'ok' ? 'success' : 'danger'}
          title={mensaje.tipo === 'ok' ? 'Solicitud registrada' : 'Error al enviar'}
        >
          {mensaje.texto}
        </CalloutBanner>
      )}

      <form id="form-solicitar-tutoria" onSubmit={enviarSolicitud} className="space-y-3.5">
        {modalSolicitud && (
          <div className="rounded-xl bg-surface-container-low px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-on-surface-variant">
              <span className="inline-flex items-center gap-1.5">
                <Icon className="text-[15px] text-secondary">school</Icon>
                <span>Estudiante:</span>
                <strong className="text-on-surface font-semibold">
                  {userName || 'Estudiante'}
                </strong>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Icon className="text-[15px] text-primary">person</Icon>
                <span>Profesor:</span>
                <strong className="text-on-surface font-semibold">
                  {modalSolicitud.profesor.nombre}
                </strong>
              </span>
            </div>
            <Badge variant="warning" pulseDot>
              Estado inicial: Pendiente
            </Badge>
          </div>
        )}

        {materiasDisponiblesModal.length > 0 ? (
          <FormSelect
            id="solicitud-materia"
            label="Materia *"
            icon="menu_book"
            value={materia}
            onChange={(e) => {
              setMateria(e.target.value);
              setTema('');
              setOtroTema('');
            }}
            required
          >
            {materiasDisponiblesModal.map((mat, i) => (
              <option key={i} value={mat}>
                {mat}
              </option>
            ))}
          </FormSelect>
        ) : (
          <FormInput
            id="solicitud-materia-input"
            label="Materia *"
            icon="menu_book"
            value={materia}
            onChange={(e) => {
              setMateria(e.target.value);
              setTema('');
              setOtroTema('');
            }}
            placeholder="Nombre de la materia"
            required
          />
        )}

        {temasDeMateria.length > 0 ? (
          <div className="space-y-2.5">
            <FormSelect
              id="solicitud-tema-select"
              label="Tema Específico *"
              icon="topic"
              value={tema}
              onChange={(e) => {
                setTema(e.target.value);
                if (e.target.value !== '__otro__') {
                  setOtroTema('');
                }
              }}
              required
            >
              <option value="">-- Selecciona un tema específico --</option>
              {temasDeMateria.map((nomTema) => (
                <option key={nomTema} value={nomTema}>
                  {nomTema}
                </option>
              ))}
              <option value="__otro__">+ Otro tema específico...</option>
            </FormSelect>

            {tema === '__otro__' && (
              <FormInput
                id="solicitud-tema-personalizado"
                label="Escribe el tema específico *"
                icon="edit"
                value={otroTema}
                onChange={(e) => setOtroTema(e.target.value)}
                placeholder="Ej: Derivadas parciales, Árboles AVL..."
                required
              />
            )}
          </div>
        ) : (
          <FormInput
            id="solicitud-tema"
            label="Tema Específico *"
            icon="topic"
            value={tema}
            onChange={(e) => setTema(e.target.value)}
            placeholder="Ej: Derivadas parciales, Árboles AVL..."
            required
          />
        )}

        {(() => {
          const matLower = materia.trim().toLowerCase();
          const temaActivo = (tema === '__otro__' ? otroTema : tema).trim().toLowerCase();
          const recursosAsociados = recursosRecomendados.filter((rec) => {
            const coincideMateria =
              matLower !== '' && rec.materia.toLowerCase().includes(matLower);
            if (!coincideMateria) return false;
            if (!temaActivo) return true;
            return !rec.tema || rec.tema.toLowerCase().includes(temaActivo);
          });
          const listaFinal =
            recursosAsociados.length > 0
              ? recursosAsociados
              : recursosRecomendados.filter(
                  (rec) => matLower !== '' && rec.materia.toLowerCase().includes(matLower)
                );
          if (listaFinal.length === 0) return null;
          return (
            <div className="p-3 rounded-xl bg-primary-fixed/30 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-label-md font-bold text-primary">
                <Icon className="text-[16px]">auto_stories</Icon>
                <span>Material recomendado para consultar antes de solicitar tutoría</span>
              </div>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {listaFinal.slice(0, 4).map((rec) => (
                  <a
                    key={rec._id}
                    href={rec.link}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between gap-2 p-2 rounded-lg bg-surface-container-lowest hover:bg-surface-container transition-colors text-xs"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-on-surface truncate">{rec.titulo}</p>
                      <p className="text-[11px] text-on-surface-variant truncate">
                        <span className="uppercase font-bold text-primary mr-1">
                          {rec.tipo || 'enlace'}
                        </span>
                        {rec.tema ? `• ${rec.tema}` : ''}
                      </p>
                    </div>
                    <Icon className="text-[16px] text-primary shrink-0">open_in_new</Icon>
                  </a>
                ))}
              </div>
            </div>
          );
        })()}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormInput
            id="solicitud-fecha"
            type="date"
            label="Fecha Propuesta"
            icon="event"
            value={fechaPropuesta}
            onChange={(e) => setFechaPropuesta(e.target.value)}
            required
          />

          {modalSolicitud && modalSolicitud.profesor.horarios.length > 0 ? (
            <FormSelect
              id="solicitud-hora-select"
              label="Horario Elegido *"
              icon="schedule"
              value={horaSeleccion}
              onChange={(e) => {
                setHoraSeleccion(e.target.value);
                if (e.target.value !== '__otro__') {
                  setOtraHora('');
                }
              }}
              hint="Franjas libres registradas por el profesor."
              required
            >
              {modalSolicitud.profesor.horarios.map((h) => {
                const valorFranja = `${h.dia} ${h.horaInicio} - ${h.horaFin}`;
                return (
                  <option key={h._id} value={valorFranja}>
                    {valorFranja}
                    {h.materia ? ` (${h.materia})` : ''}
                  </option>
                );
              })}
              <option value="__otro__">+ Proponer otro horario...</option>
            </FormSelect>
          ) : (
            <FormInput
              id="solicitud-hora"
              label="Horario Elegido *"
              icon="schedule"
              value={otraHora}
              onChange={(e) => setOtraHora(e.target.value)}
              placeholder="Ej: Lunes 08:00 - 10:00"
              hint="El docente confirmará o reprogramará si es necesario."
              required
            />
          )}
        </div>

        {modalSolicitud &&
          modalSolicitud.profesor.horarios.length > 0 &&
          horaSeleccion === '__otro__' && (
            <FormInput
              id="solicitud-otra-hora"
              label="Especifica tu horario propuesto *"
              icon="schedule"
              value={otraHora}
              onChange={(e) => setOtraHora(e.target.value)}
              placeholder="Ej: Viernes 14:00 - 16:00"
              hint="El docente confirmará o reprogramará si es necesario."
              required
            />
          )}

        <FormTextarea
          id="solicitud-descripcion"
          label="Descripción de la duda (opcional)"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          rows={3}
          placeholder="Describe brevemente los ejercicios o conceptos que deseas revisar..."
        />
      </form>
    </Modal>
  );
}

