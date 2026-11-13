'use client';

import { Icon } from '../../ui/Icon';
import { FormInput, FormSelect } from '../../ui/FormField';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { Modal } from '../../ui/Modal';
import { CalloutBanner } from '../../ui/CalloutBanner';
import { Carrera, Escuela, Materia, Usuario } from './types';

interface ModalesUsuarioAdminProps {
  modalAbierto: boolean;
  cerrarModalUsuario: () => void;
  usuarioEditando: Usuario | null;
  guardarUsuario: (e: React.FormEvent) => void;
  guardandoUsuario: boolean;
  errorForm: string;
  nombre: string;
  setNombre: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  rol: 'estudiante' | 'profesor' | 'admin';
  setRol: (v: 'estudiante' | 'profesor' | 'admin') => void;
  escuela: string;
  setEscuela: (v: string) => void;
  carrera: string;
  setCarrera: (v: string) => void;
  semestre: string;
  setSemestre: (v: string) => void;
  escuelas: Escuela[];
  carreras: Carrera[];
  carrerasFiltradas: Carrera[];
  materiasFiltradas: Materia[];
  materiasSeleccionadas: string[];
  toggleMateria: (nombreMateria: string) => void;
  usuarioAEliminar: Usuario | null;
  cerrarModalEliminar: () => void;
  confirmarEliminarUsuario: () => void;
  eliminando: boolean;
}

export function ModalesUsuarioAdmin({
  modalAbierto,
  cerrarModalUsuario,
  usuarioEditando,
  guardarUsuario,
  guardandoUsuario,
  errorForm,
  nombre,
  setNombre,
  email,
  setEmail,
  password,
  setPassword,
  rol,
  setRol,
  escuela,
  setEscuela,
  carrera,
  setCarrera,
  semestre,
  setSemestre,
  escuelas,
  carreras,
  carrerasFiltradas,
  materiasFiltradas,
  materiasSeleccionadas,
  toggleMateria,
  usuarioAEliminar,
  cerrarModalEliminar,
  confirmarEliminarUsuario,
  eliminando,
}: ModalesUsuarioAdminProps) {
  return (
    <>
      <Modal
        open={modalAbierto}
        onClose={cerrarModalUsuario}
        title={
          usuarioEditando
            ? `Editar Usuario: ${usuarioEditando.nombre}`
            : 'Crear Nuevo Usuario Institucional'
        }
        subtitle="Completa los datos de acceso y perfil académico"
        icon={usuarioEditando ? 'manage_accounts' : 'person_add'}
        tone="primary"
        maxWidthClassName="max-w-xl"
        footer={
          <>
            <Button variant="subtle" size="sm" onClick={cerrarModalUsuario}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form="form-admin-usuario"
              variant="primary"
              size="sm"
              loading={guardandoUsuario}
            >
              <Icon className="text-[16px]">save</Icon>
              <span>{usuarioEditando ? 'Guardar Cambios' : 'Crear Usuario'}</span>
            </Button>
          </>
        }
      >
        {errorForm && (
          <CalloutBanner tone="danger" title="Error de validación">
            {errorForm}
          </CalloutBanner>
        )}

        <form id="form-admin-usuario" onSubmit={guardarUsuario} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormInput
              id="user-nombre"
              label="Nombre Completo"
              icon="person"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Dra. Marcela Restrepo"
              required
            />

            <FormInput
              id="user-email"
              type="email"
              label="Correo Institucional"
              icon="mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@universidad.edu"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormInput
              id="user-password"
              type="password"
              label={usuarioEditando ? 'Nueva Contraseña (Opcional)' : 'Contraseña de Acceso'}
              icon="lock"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={usuarioEditando ? 'Dejar vacío para mantener' : '••••••••'}
              required={!usuarioEditando}
            />

            <FormSelect
              id="user-rol"
              label="Rol del Usuario"
              icon="badge"
              value={rol}
              onChange={(e) =>
                setRol(e.target.value as 'estudiante' | 'profesor' | 'admin')
              }
            >
              <option value="estudiante">Estudiante</option>
              <option value="profesor">Docente Tutor (Profesor)</option>
              {!usuarioEditando && <option value="admin">Administrador</option>}
            </FormSelect>
          </div>

          {rol === 'profesor' && (
            <div className="p-space-md bg-surface-container-low rounded-xl space-y-3.5">
              <span className="font-label-md text-[11px] font-semibold text-outline uppercase tracking-wider block">
                Asignación Académica del Profesor
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormSelect
                  id="prof-escuela"
                  label="Escuela / Facultad"
                  icon="domain"
                  value={escuela}
                  onChange={(e) => {
                    setEscuela(e.target.value);
                    setCarrera('');
                  }}
                >
                  <option value="">Seleccionar Escuela...</option>
                  {escuelas.map((esc) => (
                    <option key={esc._id} value={esc.nombre}>
                      {esc.nombre} ({esc.codigo})
                    </option>
                  ))}
                </FormSelect>

                <FormSelect
                  id="prof-carrera"
                  label="Carrera Principal"
                  icon="school"
                  value={carrera}
                  onChange={(e) => setCarrera(e.target.value)}
                >
                  <option value="">Seleccionar Carrera...</option>
                  {carrerasFiltradas.map((car) => (
                    <option key={car._id} value={car.nombre}>
                      {car.nombre} ({car.codigo})
                    </option>
                  ))}
                </FormSelect>
              </div>

              <div>
                <label className="block font-label-md text-[13px] font-semibold text-on-surface mb-1.5">
                  Materias que Imparte
                </label>
                {materiasFiltradas.length === 0 ? (
                  <p className="text-xs text-outline bg-surface-container-lowest p-3 rounded-lg">
                    {carrera
                      ? 'No hay materias registradas para esta carrera en el catálogo.'
                      : 'Selecciona una carrera o crea materias en el Catálogo Académico.'}
                  </p>
                ) : (
                  <div className="max-h-36 overflow-y-auto space-y-1 bg-surface-container-lowest p-2.5 rounded-lg">
                    {materiasFiltradas.map((mat) => (
                      <label
                        key={mat._id}
                        className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-surface-container cursor-pointer transition-colors text-xs text-on-surface"
                      >
                        <input
                          type="checkbox"
                          checked={materiasSeleccionadas.includes(mat.nombre)}
                          onChange={() => toggleMateria(mat.nombre)}
                          className="w-4 h-4 rounded accent-primary cursor-pointer"
                        />
                        <span className="font-medium">{mat.nombre}</span>
                        <span className="text-outline font-mono text-[11px]">({mat.codigo})</span>
                      </label>
                    ))}
                  </div>
                )}

                {materiasSeleccionadas.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {materiasSeleccionadas.map((mat, idx) => (
                      <Badge
                        key={idx}
                        variant="primary"
                        onRemove={() => toggleMateria(mat)}
                      >
                        {mat}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {rol === 'estudiante' && (
            <div className="p-space-md bg-surface-container-low rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormSelect
                id="est-carrera"
                label="Carrera"
                icon="school"
                value={carrera}
                onChange={(e) => setCarrera(e.target.value)}
              >
                <option value="">Seleccionar Carrera...</option>
                {carreras.map((car) => (
                  <option key={car._id} value={car.nombre}>
                    {car.nombre}
                  </option>
                ))}
              </FormSelect>

              <FormInput
                id="est-semestre"
                type="number"
                min={1}
                max={12}
                label="Semestre Actual"
                icon="format_list_numbered"
                value={semestre}
                onChange={(e) => setSemestre(e.target.value)}
                placeholder="Ej: 4"
              />
            </div>
          )}
        </form>
      </Modal>

      <Modal
        open={Boolean(usuarioAEliminar)}
        onClose={cerrarModalEliminar}
        title="Confirmar Eliminación de Usuario"
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
              onClick={confirmarEliminarUsuario}
            >
              Sí, Eliminar Usuario
            </Button>
          </>
        }
      >
        <p className="font-body-md text-sm text-on-surface leading-relaxed">
          ¿Estás seguro de que deseas eliminar permanentemente la cuenta de{' '}
          <strong>{usuarioAEliminar?.nombre}</strong> ({usuarioAEliminar?.email})?
        </p>
        <div className="p-space-sm rounded-lg bg-surface-container text-on-surface-variant font-label-md text-[12px] flex items-start gap-2">
          <Icon className="text-error text-[16px] shrink-0 mt-0.5">report</Icon>
          <span>Esta acción revocará de inmediato el acceso del usuario a la plataforma.</span>
        </div>
      </Modal>
    </>
  );
}

