'use client';

import { Icon } from '../../ui/Icon';
import { FormInput, FormSelect } from '../../ui/FormField';
import { Button } from '../../ui/Button';
import { Modal } from '../../ui/Modal';
import { CalloutBanner } from '../../ui/CalloutBanner';
import { RecursoItem, formatFecha } from './types';

interface ModalesRecursoAdminProps {
  recursoEditando: RecursoItem | null;
  cerrarModalEditar: () => void;
  guardarEdicion: (e: React.FormEvent) => void;
  guardando: boolean;
  errorForm: string;
  tituloForm: string;
  setTituloForm: (v: string) => void;
  escuelaForm: string;
  setEscuelaForm: (v: string) => void;
  nombresEscuelasDisponibles: string[];
  materiaForm: string;
  setMateriaForm: (v: string) => void;
  temaForm: string;
  setTemaForm: (v: string) => void;
  tipoForm: 'video' | 'guia' | 'documento' | 'enlace';
  setTipoForm: (v: 'video' | 'guia' | 'documento' | 'enlace') => void;
  claseOrigenForm: string;
  setClaseOrigenForm: (v: string) => void;
  linkForm: string;
  setLinkForm: (v: string) => void;
  recursoAEliminar: RecursoItem | null;
  cerrarModalEliminar: () => void;
  confirmarEliminacion: () => void;
  eliminando: boolean;
}

export function ModalesRecursoAdmin({
  recursoEditando,
  cerrarModalEditar,
  guardarEdicion,
  guardando,
  errorForm,
  tituloForm,
  setTituloForm,
  escuelaForm,
  setEscuelaForm,
  nombresEscuelasDisponibles,
  materiaForm,
  setMateriaForm,
  temaForm,
  setTemaForm,
  tipoForm,
  setTipoForm,
  claseOrigenForm,
  setClaseOrigenForm,
  linkForm,
  setLinkForm,
  recursoAEliminar,
  cerrarModalEliminar,
  confirmarEliminacion,
  eliminando,
}: ModalesRecursoAdminProps) {
  return (
    <>
      <Modal
        open={Boolean(recursoEditando)}
        onClose={cerrarModalEditar}
        title="Revisar y Editar Recurso Académico"
        subtitle={
          recursoEditando
            ? `Publicado por ${recursoEditando.profesor?.nombre || 'Docente'} • ${formatFecha(
                recursoEditando.createdAt
              )}`
            : ''
        }
        icon="edit_document"
        tone="primary"
        maxWidthClassName="max-w-xl"
        footer={
          <>
            <Button variant="subtle" size="sm" onClick={cerrarModalEditar}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form="form-admin-recurso"
              variant="primary"
              size="sm"
              loading={guardando}
            >
              <Icon className="text-[16px]">save</Icon>
              <span>Guardar Cambios</span>
            </Button>
          </>
        }
      >
        {errorForm && (
          <CalloutBanner tone="danger" title="Error de validación">
            {errorForm}
          </CalloutBanner>
        )}

        <form id="form-admin-recurso" onSubmit={guardarEdicion} className="space-y-3.5">
          <FormInput
            id="edit-recurso-titulo"
            label="Título del Recurso"
            icon="description"
            value={tituloForm}
            onChange={(e) => setTituloForm(e.target.value)}
            placeholder="Ej: Guía de Ejercicios Resueltos"
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormSelect
              id="edit-recurso-escuela"
              label="Escuela / Facultad"
              icon="domain"
              value={escuelaForm}
              onChange={(e) => setEscuelaForm(e.target.value)}
            >
              <option value="General">General</option>
              {nombresEscuelasDisponibles
                .filter((esc) => esc !== 'General')
                .map((esc) => (
                  <option key={esc} value={esc}>
                    {esc}
                  </option>
                ))}
            </FormSelect>

            <FormInput
              id="edit-recurso-materia"
              label="Materia / Asignatura"
              icon="menu_book"
              value={materiaForm}
              onChange={(e) => setMateriaForm(e.target.value)}
              placeholder="Ej: Cálculo Multivariable"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormInput
              id="edit-recurso-tema"
              label="Tema (Opcional)"
              icon="topic"
              value={temaForm}
              onChange={(e) => setTemaForm(e.target.value)}
              placeholder="Ej: Integrales Múltiples"
            />

            <FormSelect
              id="edit-recurso-tipo"
              label="Tipo de Recurso"
              icon="category"
              value={tipoForm}
              onChange={(e) =>
                setTipoForm(e.target.value as 'video' | 'guia' | 'documento' | 'enlace')
              }
            >
              <option value="video">Video</option>
              <option value="guia">Guía</option>
              <option value="documento">Documento</option>
              <option value="enlace">Enlace</option>
            </FormSelect>
          </div>

          <FormInput
            id="edit-recurso-origen"
            label="Etiqueta de Origen (Opcional)"
            icon="label"
            value={claseOrigenForm}
            onChange={(e) => setClaseOrigenForm(e.target.value)}
            placeholder="Ej: Clase: Cálculo - Integrales"
          />

          <div className="space-y-1.5">
            <FormInput
              id="edit-recurso-link"
              type="url"
              label="Enlace del Recurso (URL Vigente)"
              icon="link"
              value={linkForm}
              onChange={(e) => setLinkForm(e.target.value)}
              placeholder="https://..."
              required
            />
            {linkForm && (
              <a
                href={linkForm}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-label-md font-semibold text-primary hover:underline"
              >
                <Icon className="text-[14px]">open_in_new</Icon>
                <span>Probar enlace en una pestaña nueva antes de guardar</span>
              </a>
            )}
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(recursoAEliminar)}
        onClose={cerrarModalEliminar}
        title="Confirmar Eliminación de Recurso"
        icon="warning"
        tone="danger"
        footer={
          <>
            <Button variant="subtle" size="sm" onClick={cerrarModalEliminar}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              size="sm"
              loading={eliminando}
              onClick={confirmarEliminacion}
            >
              Sí, Eliminar Recurso
            </Button>
          </>
        }
      >
        <p className="font-body-md text-sm text-on-surface leading-relaxed">
          ¿Estás seguro de que deseas retirar permanentemente el recurso{' '}
          <strong>{recursoAEliminar?.titulo}</strong> ({recursoAEliminar?.materia}) de la biblioteca
          digital?
        </p>
        <div className="p-space-sm rounded-lg bg-surface-container text-on-surface-variant font-label-md text-[12px] flex items-start gap-2">
          <Icon className="text-error text-[16px] shrink-0 mt-0.5">report</Icon>
          <span>
            Dejará de estar visible de inmediato para todos los estudiantes y docentes.
          </span>
        </div>
      </Modal>
    </>
  );
}

