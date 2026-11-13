'use client';

import { useEffect, useMemo, useState } from 'react';
import { AxiosError } from 'axios';
import api from '../../../../lib/api';
import { useAuth } from '../../../../context/AuthContext';
import { Icon } from '../../../../components/ui/Icon';
import { PageHeader } from '../../../../components/ui/PageHeader';
import { Badge } from '../../../../components/ui/Badge';
import {
  FranjaForm,
  Horario,
  TutoriaAsociada,
} from '../../../../components/profesor/horarios/types';
import { FormularioHorarioSection } from '../../../../components/profesor/horarios/FormularioHorarioSection';
import { ListaHorariosSection } from '../../../../components/profesor/horarios/ListaHorariosSection';
import { ModalesHorariosSection } from '../../../../components/profesor/horarios/ModalesHorariosSection';

export default function HorariosPage() {
  const { user } = useAuth();

  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [misMaterias, setMisMaterias] = useState<string[]>([]);
  const [catalogoMaterias, setCatalogoMaterias] = useState<string[]>([]);
  const [cargando, setCargando] = useState(true);

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

  const [filtroMateria, setFiltroMateria] = useState('todas');
  const [filtroDia, setFiltroDia] = useState('todos');

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
        <FormularioHorarioSection
          feedback={feedback}
          agregarHorario={agregarHorario}
          nombreProfesor={nombreProfesor}
          setNombreProfesor={setNombreProfesor}
          materiaSeleccionada={materiaSeleccionada}
          setMateriaSeleccionada={setMateriaSeleccionada}
          opcionesMaterias={opcionesMaterias}
          otraMateria={otraMateria}
          setOtraMateria={setOtraMateria}
          semestre={semestre}
          setSemestre={setSemestre}
          diasSeleccionados={diasSeleccionados}
          setDiasSeleccionados={setDiasSeleccionados}
          toggleDia={toggleDia}
          franjas={franjas}
          agregarFranja={agregarFranja}
          actualizarFranja={actualizarFranja}
          eliminarFranjaForm={eliminarFranjaForm}
          totalBloquesAGuardar={totalBloquesAGuardar}
          guardando={guardando}
        />

        <ListaHorariosSection
          cargando={cargando}
          horarios={horarios}
          horariosFiltrados={horariosFiltrados}
          materiasRegistradas={materiasRegistradas}
          filtroMateria={filtroMateria}
          setFiltroMateria={setFiltroMateria}
          filtroDia={filtroDia}
          setFiltroDia={setFiltroDia}
          abrirModalEditar={abrirModalEditar}
          abrirModalEliminar={abrirModalEliminar}
        />
      </div>

      <ModalesHorariosSection
        modalEditar={modalEditar}
        cerrarModalEditar={() => setModalEditar(null)}
        guardarEdicionHorario={guardarEdicionHorario}
        guardandoEdicion={guardandoEdicion}
        errorModalEditar={errorModalEditar}
        editNombreProfesor={editNombreProfesor}
        setEditNombreProfesor={setEditNombreProfesor}
        editMateria={editMateria}
        setEditMateria={setEditMateria}
        opcionesMaterias={opcionesMaterias}
        editOtraMateria={editOtraMateria}
        setEditOtraMateria={setEditOtraMateria}
        editSemestre={editSemestre}
        setEditSemestre={setEditSemestre}
        editDia={editDia}
        setEditDia={setEditDia}
        editHoraInicio={editHoraInicio}
        setEditHoraInicio={setEditHoraInicio}
        editHoraFin={editHoraFin}
        setEditHoraFin={setEditHoraFin}
        horarioAEliminar={horarioAEliminar}
        cerrarModalEliminar={() => {
          setHorarioAEliminar(null);
          setErrorEliminacion('');
          setTutoriasBloqueantes([]);
        }}
        tutoriasBloqueantes={tutoriasBloqueantes}
        errorEliminacion={errorEliminacion}
        eliminandoHorario={eliminandoHorario}
        confirmarEliminacionHorario={confirmarEliminacionHorario}
      />
    </div>
  );
}
