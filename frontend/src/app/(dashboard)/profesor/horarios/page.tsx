'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AxiosError } from 'axios';
import api from '../../../../lib/api';
import { useAuth } from '../../../../context/AuthContext';
import { Icon } from '../../../../components/ui/Icon';
import { PageHeader } from '../../../../components/ui/PageHeader';
import { SurfaceCard } from '../../../../components/ui/SurfaceCard';
import { Badge } from '../../../../components/ui/Badge';
import { Button } from '../../../../components/ui/Button';
import { FormInput, FormSelect } from '../../../../components/ui/FormField';
import { CalloutBanner } from '../../../../components/ui/CalloutBanner';
import { Modal } from '../../../../components/ui/Modal';

interface TutoriaAsociada {
  _id: string;
  materia: string;
  tema?: string;
  hora?: string;
  estudiante?: {
    _id: string;
    nombre: string;
    email?: string;
  };
}

interface Horario {
  _id: string;
  nombreProfesor?: string;
  materia?: string;
  semestre?: number;
  dia: string;
  horaInicio: string;
  horaFin: string;
  tieneTutoriasAceptadas?: boolean;
  tutoriasAceptadas?: TutoriaAsociada[];
}

interface FranjaForm {
  horaInicio: string;
  horaFin: string;
}

const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const SEMESTRES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export default function HorariosPage() {
  const { user } = useAuth();

  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [misMaterias, setMisMaterias] = useState<string[]>([]);
  const [catalogoMaterias, setCatalogoMaterias] = useState<string[]>([]);
  const [cargando, setCargando] = useState(true);

  // Campos del formulario HU-01
  const [nombreProfesor, setNombreProfesor] = useState('');
  const [materiaSeleccionada, setMateriaSeleccionada] = useState('');
  const [otraMateria, setOtraMateria] = useState('');
  const [semestre, setSemestre] = useState('1');
  const [diasSeleccionados, setDiasSeleccionados] = useState<string[]>(['Lunes']);
  const [franjas, setFranjas] = useState<FranjaForm[]>([
    { horaInicio: '08:00', horaFin: '10:00' },
  ]);

  const [guardando, setGuardando] = useState(false);
  const [feedback, setFeedback] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

  // Filtros de la lista de horarios registrados
  const [filtroMateria, setFiltroMateria] = useState('todas');
  const [filtroDia, setFiltroDia] = useState('todos');

  // Modal de edición (HU-08)
  const [modalEditar, setModalEditar] = useState<Horario | null>(null);
  const [editNombreProfesor, setEditNombreProfesor] = useState('');
  const [editMateria, setEditMateria] = useState('');
  const [editOtraMateria, setEditOtraMateria] = useState('');
  const [editSemestre, setEditSemestre] = useState('1');
  const [editDia, setEditDia] = useState('Lunes');
  const [editHoraInicio, setEditHoraInicio] = useState('08:00');
  const [editHoraFin, setEditHoraFin] = useState('10:00');
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);
  const [errorModalEditar, setErrorModalEditar] = useState('');

  // Modal de eliminación / bloqueo por tutorías aceptadas (HU-08)
  const [horarioAEliminar, setHorarioAEliminar] = useState<Horario | null>(null);
  const [eliminandoHorario, setEliminandoHorario] = useState(false);
  const [errorEliminacion, setErrorEliminacion] = useState('');
  const [tutoriasBloqueantes, setTutoriasBloqueantes] = useState<TutoriaAsociada[]>([]);

  const opcionesMaterias = useMemo(() => {
    const combinadas = Array.from(
      new Set([
        ...misMaterias.filter(Boolean),
        ...catalogoMaterias.filter(Boolean),
        ...(user?.materias || []).filter(Boolean),
      ])
    );
    return combinadas;
  }, [misMaterias, catalogoMaterias, user?.materias]);

  const recargarHorarios = async () => {
    try {
      const [resHorarios, resMat] = await Promise.all([
        api.get('/horarios'),
        api.get('/horarios/materias-disponibles'),
      ]);
      setHorarios(resHorarios.data || []);
      const nuevasMis: string[] = resMat.data?.misMaterias || [];
      const nuevoCatalogo: string[] = resMat.data?.catalogoMaterias || [];
      setMisMaterias(nuevasMis);
      setCatalogoMaterias(nuevoCatalogo);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    let cancelado = false;

    const cargarInicial = async () => {
      try {
        const [resHorarios, resMat] = await Promise.all([
          api.get('/horarios'),
          api.get('/horarios/materias-disponibles'),
        ]);
        if (cancelado) return;

        const listaHorarios: Horario[] = resHorarios.data || [];
        const mis: string[] = resMat.data?.misMaterias || [];
        const catalogo: string[] = resMat.data?.catalogoMaterias || [];
        const nombreBD: string = resMat.data?.nombreProfesor || '';

        setHorarios(listaHorarios);
        setMisMaterias(mis);
        setCatalogoMaterias(catalogo);
        setNombreProfesor((prev) => prev || nombreBD || user?.nombre || '');

        const primeraMateria = mis[0] || catalogo[0] || '__otra__';
        setMateriaSeleccionada((prev) => prev || primeraMateria);
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelado) {
          setCargando(false);
        }
      }
    };

    cargarInicial();

    return () => {
      cancelado = true;
    };
  }, [user?.nombre]);

  const toggleDia = (diaItem: string) => {
    setDiasSeleccionados((prev) =>
      prev.includes(diaItem) ? prev.filter((d) => d !== diaItem) : [...prev, diaItem]
    );
  };

  const agregarFranja = () => {
    setFranjas((prev) => [...prev, { horaInicio: '14:00', horaFin: '16:00' }]);
  };

  const actualizarFranja = (idx: number, campo: keyof FranjaForm, valor: string) => {
    setFranjas((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [campo]: valor } : item))
    );
  };

  const eliminarFranjaForm = (idx: number) => {
    setFranjas((prev) => prev.filter((_, i) => i !== idx));
  };

  const agregarHorario = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const nombreLimpio = nombreProfesor.trim();
    const materiaFinal =
      materiaSeleccionada === '__otra__' ? otraMateria.trim() : materiaSeleccionada.trim();
    const numSemestre = Number(semestre);

    if (!nombreLimpio) {
      setFeedback({ tipo: 'error', texto: 'El nombre del profesor es obligatorio.' });
      return;
    }

    if (!materiaFinal) {
      setFeedback({ tipo: 'error', texto: 'Debes seleccionar o escribir una asignatura.' });
      return;
    }

    if (!Number.isInteger(numSemestre) || numSemestre < 1 || numSemestre > 12) {
      setFeedback({ tipo: 'error', texto: 'Selecciona un semestre válido.' });
      return;
    }

    if (diasSeleccionados.length === 0) {
      setFeedback({
        tipo: 'error',
        texto: 'Selecciona al menos un día de la semana disponible.',
      });
      return;
    }

    if (franjas.length === 0) {
      setFeedback({ tipo: 'error', texto: 'Agrega al menos una franja horaria.' });
      return;
    }

    for (let i = 0; i < franjas.length; i++) {
      const f = franjas[i];
      if (!f.horaInicio || !f.horaFin) {
        setFeedback({
          tipo: 'error',
          texto: `Completa la hora de inicio y fin en la franja #${i + 1}.`,
        });
        return;
      }
      if (f.horaInicio >= f.horaFin) {
        setFeedback({
          tipo: 'error',
          texto: `En la franja #${i + 1}, la hora de finalización debe ser mayor a la hora de inicio.`,
        });
        return;
      }
    }

    setGuardando(true);
    try {
      const res = await api.post('/horarios', {
        nombreProfesor: nombreLimpio,
        materia: materiaFinal,
        semestre: numSemestre,
        dias: diasSeleccionados,
        franjas,
      });
      await recargarHorarios();
      if (materiaSeleccionada === '__otra__') {
        setMateriaSeleccionada(materiaFinal);
        setOtraMateria('');
      }
      setFeedback({
        tipo: 'ok',
        texto:
          res.data?.message ||
          `Horarios guardados correctamente para ${materiaFinal} (Semestre ${numSemestre}).`,
      });
    } catch (err) {
      const errorAxios = err as AxiosError<{ message?: string }>;
      setFeedback({
        tipo: 'error',
        texto:
          errorAxios.response?.data?.message ||
          'No se pudieron guardar los horarios disponibles.',
      });
    } finally {
      setGuardando(false);
    }
  };

  const abrirModalEditar = (h: Horario) => {
    setModalEditar(h);
    setEditNombreProfesor(h.nombreProfesor || nombreProfesor || user?.nombre || '');
    const matActual = h.materia || '';
    if (matActual && opcionesMaterias.includes(matActual)) {
      setEditMateria(matActual);
      setEditOtraMateria('');
    } else if (matActual) {
      setEditMateria('__otra__');
      setEditOtraMateria(matActual);
    } else {
      setEditMateria(opcionesMaterias[0] || '__otra__');
      setEditOtraMateria('');
    }
    setEditSemestre(String(h.semestre || 1));
    setEditDia(h.dia || 'Lunes');
    setEditHoraInicio(h.horaInicio || '08:00');
    setEditHoraFin(h.horaFin || '10:00');
    setErrorModalEditar('');
  };

  const guardarEdicionHorario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalEditar) return;
    setErrorModalEditar('');

    const materiaFinal =
      editMateria === '__otra__' ? editOtraMateria.trim() : editMateria.trim();
    if (!editNombreProfesor.trim() || !materiaFinal) {
      setErrorModalEditar('El nombre del profesor y la asignatura son obligatorios.');
      return;
    }
    if (!editHoraInicio || !editHoraFin || editHoraInicio >= editHoraFin) {
      setErrorModalEditar('La hora de finalización debe ser mayor a la hora de inicio.');
      return;
    }

    setGuardandoEdicion(true);
    try {
      const res = await api.put(`/horarios/${modalEditar._id}`, {
        nombreProfesor: editNombreProfesor.trim(),
        materia: materiaFinal,
        semestre: Number(editSemestre),
        dia: editDia,
        horaInicio: editHoraInicio,
        horaFin: editHoraFin,
      });
      setModalEditar(null);
      await recargarHorarios();
      setFeedback({
        tipo: 'ok',
        texto: res.data?.message || 'Horario actualizado correctamente.',
      });
    } catch (err) {
      const errorAxios = err as AxiosError<{ message?: string }>;
      setErrorModalEditar(
        errorAxios.response?.data?.message || 'No se pudo actualizar el horario.'
      );
    } finally {
      setGuardandoEdicion(false);
    }
  };

  const abrirModalEliminar = (h: Horario) => {
    setHorarioAEliminar(h);
    setErrorEliminacion('');
    setTutoriasBloqueantes(h.tutoriasAceptadas || []);
  };

  const confirmarEliminacionHorario = async () => {
    if (!horarioAEliminar) return;
    setErrorEliminacion('');
    setEliminandoHorario(true);
    try {
      const res = await api.delete(`/horarios/${horarioAEliminar._id}`);
      setHorarioAEliminar(null);
      setTutoriasBloqueantes([]);
      await recargarHorarios();
      setFeedback({
        tipo: 'ok',
        texto: res.data?.message || 'Horario eliminado correctamente.',
      });
    } catch (err) {
      const errorAxios = err as AxiosError<{
        message?: string;
        tutoriasAceptadas?: TutoriaAsociada[];
      }>;
      setErrorEliminacion(
        errorAxios.response?.data?.message || 'No se pudo eliminar este horario.'
      );
      if (Array.isArray(errorAxios.response?.data?.tutoriasAceptadas)) {
        setTutoriasBloqueantes(errorAxios.response.data.tutoriasAceptadas);
      }
    } finally {
      setEliminandoHorario(false);
    }
  };

  const materiasRegistradas = useMemo(() => {
    return Array.from(
      new Set(horarios.map((h) => h.materia).filter((m): m is string => Boolean(m)))
    );
  }, [horarios]);

  const horariosFiltrados = useMemo(() => {
    return horarios.filter((h) => {
      const okMateria = filtroMateria === 'todas' || h.materia === filtroMateria;
      const okDia = filtroDia === 'todos' || h.dia === filtroDia;
      return okMateria && okDia;
    });
  }, [horarios, filtroMateria, filtroDia]);

  const totalBloquesAGuardar = diasSeleccionados.length * franjas.length;

  return (
    <div className="space-y-space-lg max-w-6xl mx-auto min-w-0">
      <PageHeader
        eyebrow="02. Agenda Docente"
        title="Disponibilidad Horaria"
        description="Registra tus días y franjas libres por asignatura y semestre para atender estudiantes fuera de las monitorías regulares."
        actions={
          <Badge variant="primary">
            <Icon className="text-[15px]">calendar_month</Icon>
            <span>
              {horarios.length} {horarios.length === 1 ? 'franja activa' : 'franjas activas'}
            </span>
          </Badge>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-md items-start">
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

            {/* Selección múltiple de días */}
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

            {/* Múltiples franjas horarias */}
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

        <SurfaceCard tone="lowest" className="p-4 sm:p-space-lg lg:col-span-7 space-y-space-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-surface-container">
            <div className="min-w-0">
              <h2 className="font-label-md text-base font-bold text-on-surface flex items-center gap-2">
                <Icon className="text-primary text-[20px] shrink-0">event_available</Icon>
                <span>Horarios Registrados</span>
              </h2>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Visibles para los estudiantes al buscar tutorías por profesor y asignatura.
              </p>
            </div>
            <Badge variant="neutral" className="self-start sm:self-auto shrink-0">
              {horariosFiltrados.length} de {horarios.length} bloques
            </Badge>
          </div>

          {horarios.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormSelect
                id="filtro-horarios-materia"
                label="Filtrar por Asignatura"
                icon="menu_book"
                value={filtroMateria}
                onChange={(e) => setFiltroMateria(e.target.value)}
              >
                <option value="todas">Todas las asignaturas</option>
                {materiasRegistradas.map((mat) => (
                  <option key={mat} value={mat}>
                    {mat}
                  </option>
                ))}
              </FormSelect>

              <FormSelect
                id="filtro-horarios-dia"
                label="Filtrar por Día"
                icon="event"
                value={filtroDia}
                onChange={(e) => setFiltroDia(e.target.value)}
              >
                <option value="todos">Todos los días</option>
                {DIAS_SEMANA.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </FormSelect>
            </div>
          )}

          {cargando ? (
            <div className="p-8 text-center text-sm text-on-surface-variant">
              Cargando disponibilidad horaria...
            </div>
          ) : horariosFiltrados.length === 0 ? (
            <div className="p-10 rounded-xl bg-surface-container-low text-center space-y-2">
              <Icon className="text-outline text-[36px]">event_busy</Icon>
              <p className="text-sm text-on-surface-variant">
                {horarios.length === 0
                  ? 'No has agregado bloques de horario aún. Usa el formulario lateral para añadir tu disponibilidad.'
                  : 'No hay bloques horarios que coincidan con los filtros seleccionados.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {horariosFiltrados.map((h) => (
                <div
                  key={h._id}
                  className="flex justify-between items-start gap-3 p-4 bg-surface-container-low hover:bg-surface-container rounded-xl transition-colors group"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-primary-fixed text-primary flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="text-[20px]">schedule</Icon>
                    </div>
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-label-md text-sm font-bold text-on-surface">{h.dia}</p>
                        <span className="font-mono text-xs text-primary font-semibold">
                          {h.horaInicio} - {h.horaFin}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        {h.materia && (
                          <Badge variant="primary" pill={false}>
                            <Icon className="text-[12px]">menu_book</Icon>
                            <span className="truncate max-w-[180px]">{h.materia}</span>
                          </Badge>
                        )}
                        {h.semestre && (
                          <Badge variant="neutral" pill={false}>
                            Semestre {h.semestre}
                          </Badge>
                        )}
                      </div>

                      {h.nombreProfesor && (
                        <p className="text-[11px] text-on-surface-variant flex items-center gap-1 truncate">
                          <Icon className="text-[13px] text-outline shrink-0">person</Icon>
                          <span className="truncate">{h.nombreProfesor}</span>
                        </p>
                      )}

                      {h.tutoriasAceptadas && h.tutoriasAceptadas.length > 0 && (
                        <div className="pt-0.5">
                          <Badge variant="warning" dot>
                            {h.tutoriasAceptadas.length}{' '}
                            {h.tutoriasAceptadas.length === 1
                              ? 'tutoría aceptada'
                              : 'tutorías aceptadas'}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => abrirModalEditar(h)}
                      aria-label={`Editar horario ${h.dia} ${h.horaInicio}`}
                      className="w-8 h-8 rounded-lg hover:bg-primary-fixed text-outline hover:text-primary flex items-center justify-center transition-colors cursor-pointer"
                      title="Editar franja horaria"
                    >
                      <Icon className="text-[18px]">edit</Icon>
                    </button>
                    <button
                      type="button"
                      onClick={() => abrirModalEliminar(h)}
                      aria-label={`Eliminar horario ${h.dia} ${h.horaInicio}`}
                      className="w-8 h-8 rounded-lg hover:bg-error-container text-outline hover:text-error flex items-center justify-center transition-colors cursor-pointer"
                      title={
                        h.tutoriasAceptadas && h.tutoriasAceptadas.length > 0
                          ? 'Tiene tutorías aceptadas asociadas'
                          : 'Eliminar franja'
                      }
                    >
                      <Icon className="text-[18px]">delete</Icon>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SurfaceCard>
      </div>

      {/* Modal Canónico para Editar Horario (HU-08) */}
      <Modal
        open={Boolean(modalEditar)}
        onClose={() => setModalEditar(null)}
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
            <Button variant="subtle" size="sm" onClick={() => setModalEditar(null)}>
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

      {/* Modal Canónico para Confirmar / Bloquear Eliminación de Horario (HU-08) */}
      <Modal
        open={Boolean(horarioAEliminar)}
        onClose={() => {
          setHorarioAEliminar(null);
          setErrorEliminacion('');
          setTutoriasBloqueantes([]);
        }}
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
            <Button
              variant="subtle"
              size="sm"
              onClick={() => {
                setHorarioAEliminar(null);
                setErrorEliminacion('');
                setTutoriasBloqueantes([]);
              }}
            >
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
    </div>
  );
}
