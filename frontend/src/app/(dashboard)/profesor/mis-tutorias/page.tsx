'use client';

import { useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import api from '../../../../lib/api';
import { Icon } from '../../../../components/ui/Icon';
import { PageHeader } from '../../../../components/ui/PageHeader';
import { SurfaceCard } from '../../../../components/ui/SurfaceCard';
import { CalloutBanner } from '../../../../components/ui/CalloutBanner';
import { Tutoria, toInputDateValue } from '../../../../components/profesor/mis-tutorias/types';
import { MisTutoriasProfesorKpisFiltros } from '../../../../components/profesor/mis-tutorias/MisTutoriasProfesorKpisFiltros';
import { TarjetaTutoriaProfesor } from '../../../../components/profesor/mis-tutorias/TarjetaTutoriaProfesor';
import { ModalEvidenciaTutoria } from '../../../../components/profesor/mis-tutorias/ModalEvidenciaTutoria';

export default function MisTutoriasProfesorPage() {
  const [tutorias, setTutorias] = useState<Tutoria[]>([]);
  const [busquedaTexto, setBusquedaTexto] = useState('');
  const [filtroMateria, setFiltroMateria] = useState('');
  const [filtroTema, setFiltroTema] = useState('');
  const [filtroFecha, setFiltroFecha] = useState('');
  const [filtroModalidad, setFiltroModalidad] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<'todas' | 'finalizada' | 'aceptada'>('todas');
  const [cargando, setCargando] = useState(true);
  const [feedback, setFeedback] = useState('');

  const [tutoriaEvidencia, setTutoriaEvidencia] = useState<Tutoria | null>(null);
  const [modalidadEdit, setModalidadEdit] = useState<'virtual' | 'presencial'>('virtual');
  const [lugarEdit, setLugarEdit] = useState('');
  const [enlaceReunionEdit, setEnlaceReunionEdit] = useState('');
  const [comentarioEdit, setComentarioEdit] = useState('');
  const [grabacionEdit, setGrabacionEdit] = useState('');
  const [asistenciaPrincipalEdit, setAsistenciaPrincipalEdit] = useState<boolean | null>(null);
  const [asistenciasPartEdit, setAsistenciasPartEdit] = useState<Record<string, boolean | null>>(
    {}
  );
  const [guardandoEvidencia, setGuardandoEvidencia] = useState(false);
  const [errorModal, setErrorModal] = useState('');

  const recargarTutorias = async () => {
    try {
      const res = await api.get('/tutorias');
      setTutorias(
        (res.data || []).filter((t: Tutoria) => t.estado === 'finalizada' || t.estado === 'aceptada')
      );
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    let cancelado = false;

    const cargarTutorias = async () => {
      try {
        const res = await api.get('/tutorias');
        if (cancelado) return;
        setTutorias(
          (res.data || []).filter(
            (t: Tutoria) => t.estado === 'finalizada' || t.estado === 'aceptada'
          )
        );
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelado) {
          setCargando(false);
        }
      }
    };

    cargarTutorias();

    return () => {
      cancelado = true;
    };
  }, []);

  const abrirModalEvidencia = (t: Tutoria) => {
    setTutoriaEvidencia(t);
    setModalidadEdit(t.modalidad === 'presencial' ? 'presencial' : 'virtual');
    setLugarEdit(t.lugar || '');
    setEnlaceReunionEdit(t.enlaceReunion || '');
    setComentarioEdit(t.comentarioProfesor || '');
    setGrabacionEdit(t.enlaceGrabacion || '');
    setAsistenciaPrincipalEdit(
      t.asistenciaEstudiante !== undefined ? t.asistenciaEstudiante : null
    );
    const mapaPart: Record<string, boolean | null> = {};
    (t.participantes || []).forEach((p) => {
      if (p.estudiante?._id) {
        mapaPart[p.estudiante._id] = p.asistio !== undefined ? p.asistio : null;
      }
    });
    setAsistenciasPartEdit(mapaPart);
    setErrorModal('');
  };

  const guardarEvidencia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tutoriaEvidencia) return;
    setErrorModal('');

    if (modalidadEdit === 'presencial' && !lugarEdit.trim()) {
      setErrorModal(
        'Cuando la modalidad es presencial debes especificar el lugar o salón de encuentro.'
      );
      return;
    }
    if (modalidadEdit === 'virtual' && !enlaceReunionEdit.trim() && !grabacionEdit.trim()) {
      setErrorModal(
        'Cuando la modalidad es virtual debes ingresar el enlace de la reunión o la grabación.'
      );
      return;
    }

    setGuardandoEvidencia(true);
    try {
      const participantesPayload = (tutoriaEvidencia.participantes || []).map((p) => ({
        estudianteId: p.estudiante._id,
        asistio:
          asistenciasPartEdit[p.estudiante._id] !== undefined
            ? asistenciasPartEdit[p.estudiante._id]
            : null,
      }));

      await api.patch(`/tutorias/${tutoriaEvidencia._id}/asistencia`, {
        modalidad: modalidadEdit,
        lugar: modalidadEdit === 'presencial' ? lugarEdit.trim() : '',
        enlaceReunion: enlaceReunionEdit.trim(),
        comentarioProfesor: comentarioEdit.trim(),
        enlaceGrabacion: grabacionEdit.trim(),
        asistenciaEstudiante: asistenciaPrincipalEdit,
        participantes: participantesPayload,
      });

      setTutoriaEvidencia(null);
      await recargarTutorias();
      setFeedback('Evidencia de modalidad, enlace y asistencia actualizada correctamente.');
      setTimeout(() => setFeedback(''), 3500);
    } catch (err) {
      const errorAxios = err as AxiosError<{ message?: string }>;
      setErrorModal(
        errorAxios.response?.data?.message || 'No se pudo guardar la evidencia de la tutoría.'
      );
    } finally {
      setGuardandoEvidencia(false);
    }
  };

  const materiasDisponibles = Array.from(
    new Set(tutorias.map((t) => t.materia).filter((m): m is string => Boolean(m)))
  ).sort((a, b) => a.localeCompare(b));

  const temasDisponibles = Array.from(
    new Set(
      tutorias
        .filter((t) => !filtroMateria || t.materia === filtroMateria)
        .map((t) => t.tema)
        .filter((tm): tm is string => Boolean(tm && tm.trim() !== ''))
    )
  ).sort((a, b) => a.localeCompare(b));

  const filtradas = tutorias.filter((t) => {
    const q = busquedaTexto.toLowerCase().trim();
    const okTexto =
      !q ||
      t.materia.toLowerCase().includes(q) ||
      (t.tema && t.tema.toLowerCase().includes(q)) ||
      t.descripcion.toLowerCase().includes(q) ||
      (t.estudiante?.nombre && t.estudiante.nombre.toLowerCase().includes(q));
    const okMat = !filtroMateria || t.materia === filtroMateria;
    const okTema = !filtroTema || (t.tema || '') === filtroTema;
    const fechaTutoria = toInputDateValue(t.fechaPropuesta || t.createdAt);
    const okFecha = !filtroFecha || fechaTutoria === filtroFecha;
    const okMod = !filtroModalidad || t.modalidad === filtroModalidad;
    const okEstado = filtroEstado === 'todas' || t.estado === filtroEstado;
    return okTexto && okMat && okTema && okFecha && okMod && okEstado;
  });

  const hayFiltrosActivos = Boolean(
    busquedaTexto ||
    filtroMateria ||
    filtroTema ||
    filtroFecha ||
    filtroModalidad ||
    filtroEstado !== 'todas'
  );

  const limpiarFiltros = () => {
    setBusquedaTexto('');
    setFiltroMateria('');
    setFiltroTema('');
    setFiltroFecha('');
    setFiltroModalidad('');
    setFiltroEstado('todas');
  };

  if (cargando) {
    return (
      <div className="max-w-6xl mx-auto py-8 text-sm text-on-surface-variant flex items-center gap-2">
        <Icon className="text-primary animate-pulse">hourglass_top</Icon>
        <span>Cargando historial de tutorías...</span>
      </div>
    );
  }

  const totalFinalizadas = tutorias.filter((t) => t.estado === 'finalizada').length;
  const totalEnCurso = tutorias.filter((t) => t.estado === 'aceptada').length;

  return (
    <div className="space-y-space-lg max-w-6xl mx-auto min-w-0">
      <PageHeader
        eyebrow="03. Registro Académico"
        title="Historial y Evidencia de Tutorías"
        description="Consulta el registro de sesiones realizadas, modalidad, enlace de reunión, lista de asistencia y material compartido."
      />

      {feedback && (
        <CalloutBanner tone="success" title="Evidencia guardada">
          {feedback}
        </CalloutBanner>
      )}

      <MisTutoriasProfesorKpisFiltros
        totalTutorias={tutorias.length}
        totalFinalizadas={totalFinalizadas}
        totalEnCurso={totalEnCurso}
        filtroEstado={filtroEstado}
        setFiltroEstado={setFiltroEstado}
        hayFiltrosActivos={hayFiltrosActivos}
        limpiarFiltros={limpiarFiltros}
        busquedaTexto={busquedaTexto}
        setBusquedaTexto={setBusquedaTexto}
        filtroMateria={filtroMateria}
        setFiltroMateria={setFiltroMateria}
        materiasDisponibles={materiasDisponibles}
        filtroTema={filtroTema}
        setFiltroTema={setFiltroTema}
        temasDisponibles={temasDisponibles}
        filtroFecha={filtroFecha}
        setFiltroFecha={setFiltroFecha}
        filtroModalidad={filtroModalidad}
        setFiltroModalidad={setFiltroModalidad}
      />

      {filtradas.length === 0 ? (
        <SurfaceCard tone="lowest" className="p-10 text-center space-y-2">
          <Icon className="text-outline text-[36px]">history</Icon>
          <p className="text-sm text-on-surface-variant">
            No hay tutorías registradas con esos criterios.
          </p>
        </SurfaceCard>
      ) : (
        <div className="space-y-space-md">
          {filtradas.map((tutoria) => (
            <TarjetaTutoriaProfesor
              key={tutoria._id}
              tutoria={tutoria}
              abrirModalEvidencia={abrirModalEvidencia}
            />
          ))}
        </div>
      )}

      <ModalEvidenciaTutoria
        tutoriaEvidencia={tutoriaEvidencia}
        onClose={() => setTutoriaEvidencia(null)}
        guardarEvidencia={guardarEvidencia}
        guardandoEvidencia={guardandoEvidencia}
        errorModal={errorModal}
        modalidadEdit={modalidadEdit}
        setModalidadEdit={setModalidadEdit}
        lugarEdit={lugarEdit}
        setLugarEdit={setLugarEdit}
        enlaceReunionEdit={enlaceReunionEdit}
        setEnlaceReunionEdit={setEnlaceReunionEdit}
        grabacionEdit={grabacionEdit}
        setGrabacionEdit={setGrabacionEdit}
        comentarioEdit={comentarioEdit}
        setComentarioEdit={setComentarioEdit}
        asistenciaPrincipalEdit={asistenciaPrincipalEdit}
        setAsistenciaPrincipalEdit={setAsistenciaPrincipalEdit}
        asistenciasPartEdit={asistenciasPartEdit}
        setAsistenciasPartEdit={setAsistenciasPartEdit}
      />
    </div>
  );
}
