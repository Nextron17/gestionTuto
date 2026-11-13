'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AxiosError } from 'axios';
import api from '../../../../lib/api';
import { Icon } from '../../../../components/ui/Icon';
import { PageHeader } from '../../../../components/ui/PageHeader';
import { Badge } from '../../../../components/ui/Badge';
import { CalloutBanner } from '../../../../components/ui/CalloutBanner';
import {
  FiltroEstado,
  Solicitud,
  formatearFechaLegible,
  notificarCambioEstadoTutoria,
  toInputDateValue,
} from '../../../../components/profesor/solicitudes/types';
import { BandejaSolicitudesSection } from '../../../../components/profesor/solicitudes/BandejaSolicitudesSection';
import { TutoriaActivaSection } from '../../../../components/profesor/solicitudes/TutoriaActivaSection';
import { ModalesGestionSolicitud } from '../../../../components/profesor/solicitudes/ModalesGestionSolicitud';

export default function SolicitudesProfesorPage() {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [tutoriaSeleccionada, setTutoriaSeleccionada] = useState<Solicitud | null>(null);
  const [nuevoRecurso, setNuevoRecurso] = useState('');
  const [modalidadActiva, setModalidadActiva] = useState<'virtual' | 'presencial'>('virtual');
  const [tipoActivo, setTipoActivo] = useState<'individual' | 'grupal'>('individual');
  const [cupoActivo, setCupoActivo] = useState(10);
  const [lugarActivo, setLugarActivo] = useState('');
  const [enlaceReunionActivo, setEnlaceReunionActivo] = useState('');
  const [comentarioActivo, setComentarioActivo] = useState('');
  const [grabacionActiva, setGrabacionActiva] = useState('');
  const [cargando, setCargando] = useState(true);
  const [guardandoDetalles, setGuardandoDetalles] = useState(false);
  const [mensajeFeedback, setMensajeFeedback] = useState('');
  const [errorEvidencia, setErrorEvidencia] = useState('');

  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('todos');
  const [busqueda, setBusqueda] = useState('');

  const [modalGestion, setModalGestion] = useState<{
    solicitud: Solicitud;
    accion: 'aceptada' | 'aplazada';
  } | null>(null);
  const [fechaModal, setFechaModal] = useState('');
  const [horaPropuesta, setHoraPropuesta] = useState('');
  const [modalidad, setModalidad] = useState<'virtual' | 'presencial'>('virtual');
  const [tipo, setTipo] = useState<'individual' | 'grupal'>('individual');
  const [cupoMaximo, setCupoMaximo] = useState(10);
  const [lugarModal, setLugarModal] = useState('');
  const [enlaceReunionModal, setEnlaceReunionModal] = useState('');
  const [comentarioModal, setComentarioModal] = useState('');
  const [errorModalGestion, setErrorModalGestion] = useState('');
  const [procesandoModal, setProcesandoModal] = useState(false);

  const [solicitudACancelar, setSolicitudACancelar] = useState<Solicitud | null>(null);
  const [motivoCancelacion, setMotivoCancelacion] = useState('');
  const [cancelando, setCancelando] = useState(false);

  const sincronizarSeleccionada = useCallback((lista: Solicitud[], idActual?: string) => {
    const aceptadas = lista.filter((s) => s.estado === 'aceptada');
    const encontrada = idActual ? aceptadas.find((s) => s._id === idActual) : aceptadas[0];
    setTutoriaSeleccionada(encontrada || null);
    setModalidadActiva(encontrada?.modalidad || 'virtual');
    setTipoActivo(encontrada?.tipo || 'individual');
    setCupoActivo(encontrada?.cupoMaximo && encontrada.cupoMaximo > 1 ? encontrada.cupoMaximo : 10);
    setLugarActivo(encontrada?.lugar || '');
    setEnlaceReunionActivo(encontrada?.enlaceReunion || '');
    setComentarioActivo(encontrada?.comentarioProfesor || '');
    setGrabacionActiva(encontrada?.enlaceGrabacion || '');
    setErrorEvidencia('');
  }, []);

  const cargarSolicitudesAPI = useCallback(
    async (idMantener?: string) => {
      try {
        const res = await api.get('/tutorias');
        const data: Solicitud[] = res.data || [];
        setSolicitudes(data);
        sincronizarSeleccionada(data, idMantener);
        return data;
      } catch (err) {
        console.error(err);
        return [];
      }
    },
    [sincronizarSeleccionada]
  );

  useEffect(() => {
    let cancelado = false;

    const cargarInicial = async () => {
      try {
        const res = await api.get('/tutorias');
        if (cancelado) return;
        const data: Solicitud[] = res.data || [];
        setSolicitudes(data);
        sincronizarSeleccionada(data);
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelado) {
          setCargando(false);
        }
      }
    };

    cargarInicial();

    let channel: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      channel = new BroadcastChannel('gestiontuto_solicitudes_sync');
      channel.onmessage = () => {
        cargarSolicitudesAPI();
      };
    }

    const onStorage = (event: StorageEvent) => {
      if (event.key === 'gestiontuto_last_tutoria_update') {
        cargarSolicitudesAPI();
      }
    };

    window.addEventListener('storage', onStorage);

    return () => {
      cancelado = true;
      if (channel) {
        channel.close();
      }
      window.removeEventListener('storage', onStorage);
    };
  }, [cargarSolicitudesAPI, sincronizarSeleccionada]);

  const mostrarFeedback = (texto: string) => {
    setMensajeFeedback(texto);
    setTimeout(() => setMensajeFeedback(''), 3500);
  };

  const abrirModalGestion = (sol: Solicitud, accion: 'aceptada' | 'aplazada') => {
    setModalGestion({ solicitud: sol, accion });
    setFechaModal(
      toInputDateValue(sol.fechaPropuesta || sol.createdAt) ||
        new Date().toISOString().slice(0, 10)
    );
    setHoraPropuesta(sol.hora || '');
    setModalidad(sol.modalidad || 'virtual');
    setTipo(sol.tipo || 'individual');
    setCupoMaximo(sol.cupoMaximo && sol.cupoMaximo > 1 ? sol.cupoMaximo : 10);
    setLugarModal(sol.lugar || '');
    setEnlaceReunionModal(sol.enlaceReunion || '');
    setComentarioModal(sol.comentarioProfesor || '');
    setErrorModalGestion('');
  };

  const confirmarGestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalGestion) return;

    setErrorModalGestion('');
    if (modalGestion.accion === 'aceptada' && modalidad === 'presencial' && !lugarModal.trim()) {
      setErrorModalGestion(
        'Al aceptar una tutoría presencial es obligatorio indicar el lugar o salón de encuentro.'
      );
      return;
    }

    setProcesandoModal(true);
    try {
      await api.patch(`/tutorias/${modalGestion.solicitud._id}`, {
        estado: modalGestion.accion,
        fechaPropuesta: fechaModal || undefined,
        hora: horaPropuesta,
        modalidad,
        tipo,
        cupoMaximo: tipo === 'grupal' ? cupoMaximo : 1,
        lugar:
          modalGestion.accion === 'aceptada' && modalidad === 'presencial'
            ? lugarModal.trim()
            : undefined,
        enlaceReunion:
          modalGestion.accion === 'aceptada' && modalidad === 'virtual'
            ? enlaceReunionModal.trim()
            : undefined,
        comentarioProfesor: comentarioModal,
      });

      const idDestino =
        modalGestion.accion === 'aceptada'
          ? modalGestion.solicitud._id
          : tutoriaSeleccionada?._id;
      const accionTexto =
        modalGestion.accion === 'aceptada'
          ? 'Solicitud aceptada y configurada exitosamente.'
          : 'Solicitud aplazada y reprogramada; se notificó la nueva fecha al estudiante.';
      notificarCambioEstadoTutoria(modalGestion.solicitud._id, modalGestion.accion);
      setModalGestion(null);
      await cargarSolicitudesAPI(idDestino);
      mostrarFeedback(accionTexto);
    } catch (err) {
      const errorAxios = err as AxiosError<{ message?: string }>;
      setErrorModalGestion(
        errorAxios.response?.data?.message || 'Error al guardar la configuración de la tutoría.'
      );
    } finally {
      setProcesandoModal(false);
    }
  };

  const abrirModalCancelacion = (sol: Solicitud) => {
    setSolicitudACancelar(sol);
    setMotivoCancelacion(sol.comentarioProfesor || '');
  };

  const confirmarCancelacion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!solicitudACancelar) return;
    setCancelando(true);
    try {
      await api.patch(`/tutorias/${solicitudACancelar._id}`, {
        estado: 'cancelada',
        comentarioProfesor: motivoCancelacion.trim() || 'Cancelada por disponibilidad docente.',
      });
      const idMantener =
        tutoriaSeleccionada?._id === solicitudACancelar._id ? undefined : tutoriaSeleccionada?._id;
      notificarCambioEstadoTutoria(solicitudACancelar._id, 'cancelada');
      setSolicitudACancelar(null);
      setMotivoCancelacion('');
      await cargarSolicitudesAPI(idMantener);
      mostrarFeedback('Solicitud marcada como cancelada y actualizada en tu agenda.');
    } catch (err) {
      console.error(err);
    } finally {
      setCancelando(false);
    }
  };

  const restaurarAPendiente = async (sol: Solicitud) => {
    try {
      await api.patch(`/tutorias/${sol._id}`, { estado: 'pendiente' });
      await cargarSolicitudesAPI(tutoriaSeleccionada?._id);
      mostrarFeedback('Solicitud devuelta a estado Pendiente.');
    } catch (err) {
      console.error(err);
    }
  };

  const guardarDetallesSesion = async () => {
    if (!tutoriaSeleccionada) return;
    setErrorEvidencia('');
    if (modalidadActiva === 'presencial' && !lugarActivo.trim()) {
      setErrorEvidencia(
        'Para sesiones presenciales debes registrar el lugar o salón de encuentro.'
      );
      return;
    }
    if (modalidadActiva === 'virtual' && !enlaceReunionActivo.trim() && !grabacionActiva.trim()) {
      setErrorEvidencia(
        'Para sesiones virtuales debes registrar el enlace de la reunión como evidencia.'
      );
      return;
    }

    setGuardandoDetalles(true);
    try {
      await api.patch(`/tutorias/${tutoriaSeleccionada._id}`, {
        modalidad: modalidadActiva,
        tipo: tipoActivo,
        cupoMaximo: tipoActivo === 'grupal' ? cupoActivo : 1,
        lugar: modalidadActiva === 'presencial' ? lugarActivo.trim() : '',
        enlaceReunion: enlaceReunionActivo.trim(),
        comentarioProfesor: comentarioActivo,
        enlaceGrabacion: grabacionActiva,
      });
      await cargarSolicitudesAPI(tutoriaSeleccionada._id);
      mostrarFeedback('Configuración y evidencia de la tutoría guardadas correctamente.');
    } catch (err) {
      console.error(err);
      setErrorEvidencia('Error al guardar la configuración y evidencia de la sesión.');
    } finally {
      setGuardandoDetalles(false);
    }
  };

  const marcarAsistenciaPrincipal = async (asistio: boolean) => {
    if (!tutoriaSeleccionada) return;
    setErrorEvidencia('');
    try {
      await api.patch(`/tutorias/${tutoriaSeleccionada._id}/asistencia`, {
        asistenciaEstudiante: asistio,
      });
      await cargarSolicitudesAPI(tutoriaSeleccionada._id);
    } catch (err) {
      console.error(err);
    }
  };

  const marcarAsistenciaParticipante = async (estudianteId: string, asistio: boolean) => {
    if (!tutoriaSeleccionada) return;
    setErrorEvidencia('');
    try {
      await api.patch(`/tutorias/${tutoriaSeleccionada._id}/asistencia`, {
        participantes: [{ estudianteId, asistio }],
      });
      await cargarSolicitudesAPI(tutoriaSeleccionada._id);
    } catch (err) {
      console.error(err);
    }
  };

  const marcarTodosAsistio = async () => {
    if (!tutoriaSeleccionada) return;
    setErrorEvidencia('');
    try {
      const participantesPayload = (tutoriaSeleccionada.participantes || []).map((p) => ({
        estudianteId: p.estudiante._id,
        asistio: true,
      }));
      await api.patch(`/tutorias/${tutoriaSeleccionada._id}/asistencia`, {
        asistenciaEstudiante: true,
        participantes: participantesPayload,
      });
      await cargarSolicitudesAPI(tutoriaSeleccionada._id);
      mostrarFeedback('Todos los estudiantes fueron marcados como "Asistió".');
    } catch (err) {
      console.error(err);
    }
  };

  const agregarRecurso = async () => {
    if (!nuevoRecurso.trim() || !tutoriaSeleccionada) return;
    try {
      await api.post(`/tutorias/${tutoriaSeleccionada._id}/recursos`, {
        link: nuevoRecurso.trim(),
      });
      setNuevoRecurso('');
      await cargarSolicitudesAPI(tutoriaSeleccionada._id);
    } catch (err) {
      console.error(err);
    }
  };

  const finalizarTutoria = async (id: string) => {
    if (!tutoriaSeleccionada) return;
    setErrorEvidencia('');

    const tieneEnlaceComentario = /https?:\/\/\S+/i.test(comentarioActivo);
    if (modalidadActiva === 'presencial' && !lugarActivo.trim()) {
      setErrorEvidencia(
        'Debes registrar el lugar o salón presencial antes de finalizar la tutoría.'
      );
      return;
    }
    if (
      modalidadActiva === 'virtual' &&
      !enlaceReunionActivo.trim() &&
      !grabacionActiva.trim() &&
      !tieneEnlaceComentario
    ) {
      setErrorEvidencia(
        'Debes registrar el enlace de la reunión virtual antes de finalizar la tutoría.'
      );
      return;
    }

    const faltaPrincipal =
      tutoriaSeleccionada.asistenciaEstudiante === null ||
      tutoriaSeleccionada.asistenciaEstudiante === undefined;
    const faltaParticipante = (tutoriaSeleccionada.participantes || []).some(
      (p) => p.asistio === null || p.asistio === undefined
    );

    if (faltaPrincipal || faltaParticipante) {
      setErrorEvidencia(
        'Debes marcar la asistencia (Asistió o No asistió) de todos los estudiantes antes de finalizar.'
      );
      return;
    }

    try {
      await api.patch(`/tutorias/${id}/finalizar`, {
        modalidad: modalidadActiva,
        tipo: tipoActivo,
        cupoMaximo: tipoActivo === 'grupal' ? cupoActivo : 1,
        lugar: modalidadActiva === 'presencial' ? lugarActivo.trim() : '',
        enlaceReunion: enlaceReunionActivo.trim(),
        comentarioProfesor: comentarioActivo,
        enlaceGrabacion: grabacionActiva,
      });
      await cargarSolicitudesAPI();
      mostrarFeedback(
        'Tutoría finalizada con su evidencia completa y guardada en Historial / Recursos.'
      );
    } catch (err) {
      const errorAxios = err as AxiosError<{ message?: string }>;
      setErrorEvidencia(
        errorAxios.response?.data?.message || 'Error al finalizar la tutoría y guardar evidencia.'
      );
    }
  };

  const conteos = useMemo(() => {
    return {
      todos: solicitudes.length,
      pendiente: solicitudes.filter((s) => s.estado === 'pendiente').length,
      aceptada: solicitudes.filter((s) => s.estado === 'aceptada').length,
      aplazada: solicitudes.filter((s) => s.estado === 'aplazada').length,
      cancelada: solicitudes.filter((s) => s.estado === 'cancelada').length,
    };
  }, [solicitudes]);

  const aceptadas = useMemo(
    () => solicitudes.filter((s) => s.estado === 'aceptada'),
    [solicitudes]
  );

  const solicitudesFiltradas = useMemo(() => {
    const q = busqueda.toLowerCase().trim();
    return solicitudes.filter((sol) => {
      const coincideEstado =
        filtroEstado === 'todos' ? sol.estado !== 'finalizada' : sol.estado === filtroEstado;
      if (!coincideEstado) return false;
      if (!q) return true;

      const fechaTexto = formatearFechaLegible(sol.fechaPropuesta || sol.createdAt).toLowerCase();
      return (
        sol.materia.toLowerCase().includes(q) ||
        (sol.tema && sol.tema.toLowerCase().includes(q)) ||
        (sol.estudiante?.nombre && sol.estudiante.nombre.toLowerCase().includes(q)) ||
        (sol.estudiante?.email && sol.estudiante.email.toLowerCase().includes(q)) ||
        (sol.hora && sol.hora.toLowerCase().includes(q)) ||
        fechaTexto.includes(q)
      );
    });
  }, [solicitudes, filtroEstado, busqueda]);

  if (cargando) {
    return (
      <div className="max-w-6xl mx-auto py-8 text-sm text-on-surface-variant flex items-center gap-2">
        <Icon className="text-primary animate-pulse">hourglass_top</Icon>
        <span>Cargando solicitudes y sesiones de tutoría...</span>
      </div>
    );
  }

  const tabsEstado: { id: FiltroEstado; label: string; count: number }[] = [
    {
      id: 'todos',
      label: 'Todas (Activas)',
      count: solicitudes.filter((s) => s.estado !== 'finalizada').length,
    },
    { id: 'pendiente', label: 'Pendientes', count: conteos.pendiente },
    { id: 'aceptada', label: 'Aceptadas', count: conteos.aceptada },
    { id: 'aplazada', label: 'Aplazadas', count: conteos.aplazada },
    { id: 'cancelada', label: 'Canceladas', count: conteos.cancelada },
  ];

  const seleccionarTutoriaDesdeSelect = (sel: Solicitud | null) => {
    setTutoriaSeleccionada(sel);
    setModalidadActiva(sel?.modalidad || 'virtual');
    setTipoActivo(sel?.tipo || 'individual');
    setCupoActivo(sel?.cupoMaximo && sel.cupoMaximo > 1 ? sel.cupoMaximo : 10);
    setLugarActivo(sel?.lugar || '');
    setEnlaceReunionActivo(sel?.enlaceReunion || '');
    setComentarioActivo(sel?.comentarioProfesor || '');
    setGrabacionActiva(sel?.enlaceGrabacion || '');
    setErrorEvidencia('');
  };

  return (
    <div className="space-y-space-lg max-w-6xl mx-auto min-w-0">
      <PageHeader
        eyebrow="01. Bandeja Docente"
        title="Gestión de Solicitudes Recibidas"
        description="Revisa quién solicita tutoría, materia, tema y fecha; acepta, aplaza o cancela solicitudes para organizar tu agenda."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="warning" pulseDot>
              {conteos.pendiente} pendientes
            </Badge>
            <Badge variant="success" dot>
              {conteos.aceptada} aceptadas
            </Badge>
            <Badge variant="primary">
              {conteos.aplazada} aplazadas
            </Badge>
            <Badge variant="error">
              {conteos.cancelada} canceladas
            </Badge>
          </div>
        }
      />

      {mensajeFeedback && (
        <CalloutBanner tone="success" title="Actualización completada">
          {mensajeFeedback}
        </CalloutBanner>
      )}

      <BandejaSolicitudesSection
        solicitudes={solicitudes}
        solicitudesFiltradas={solicitudesFiltradas}
        busqueda={busqueda}
        setBusqueda={setBusqueda}
        filtroEstado={filtroEstado}
        setFiltroEstado={setFiltroEstado}
        tabsEstado={tabsEstado}
        abrirModalGestion={abrirModalGestion}
        abrirModalCancelacion={abrirModalCancelacion}
        restaurarAPendiente={restaurarAPendiente}
      />

      <TutoriaActivaSection
        aceptadas={aceptadas}
        tutoriaSeleccionada={tutoriaSeleccionada}
        onSelectTutoria={seleccionarTutoriaDesdeSelect}
        modalidadActiva={modalidadActiva}
        setModalidadActiva={setModalidadActiva}
        tipoActivo={tipoActivo}
        setTipoActivo={setTipoActivo}
        cupoActivo={cupoActivo}
        setCupoActivo={setCupoActivo}
        lugarActivo={lugarActivo}
        setLugarActivo={setLugarActivo}
        enlaceReunionActivo={enlaceReunionActivo}
        setEnlaceReunionActivo={setEnlaceReunionActivo}
        comentarioActivo={comentarioActivo}
        setComentarioActivo={setComentarioActivo}
        grabacionActiva={grabacionActiva}
        setGrabacionActiva={setGrabacionActiva}
        guardandoDetalles={guardandoDetalles}
        errorEvidencia={errorEvidencia}
        guardarDetallesSesion={guardarDetallesSesion}
        marcarAsistenciaPrincipal={marcarAsistenciaPrincipal}
        marcarAsistenciaParticipante={marcarAsistenciaParticipante}
        marcarTodosAsistio={marcarTodosAsistio}
        nuevoRecurso={nuevoRecurso}
        setNuevoRecurso={setNuevoRecurso}
        agregarRecurso={agregarRecurso}
        abrirModalGestion={abrirModalGestion}
        abrirModalCancelacion={abrirModalCancelacion}
        finalizarTutoria={finalizarTutoria}
      />

      <ModalesGestionSolicitud
        modalGestion={modalGestion}
        cerrarModalGestion={() => setModalGestion(null)}
        confirmarGestion={confirmarGestion}
        errorModalGestion={errorModalGestion}
        procesandoModal={procesandoModal}
        fechaModal={fechaModal}
        setFechaModal={setFechaModal}
        horaPropuesta={horaPropuesta}
        setHoraPropuesta={setHoraPropuesta}
        modalidad={modalidad}
        setModalidad={setModalidad}
        tipo={tipo}
        setTipo={setTipo}
        cupoMaximo={cupoMaximo}
        setCupoMaximo={setCupoMaximo}
        lugarModal={lugarModal}
        setLugarModal={setLugarModal}
        enlaceReunionModal={enlaceReunionModal}
        setEnlaceReunionModal={setEnlaceReunionModal}
        comentarioModal={comentarioModal}
        setComentarioModal={setComentarioModal}
        solicitudACancelar={solicitudACancelar}
        cerrarModalCancelacion={() => setSolicitudACancelar(null)}
        confirmarCancelacion={confirmarCancelacion}
        motivoCancelacion={motivoCancelacion}
        setMotivoCancelacion={setMotivoCancelacion}
        cancelando={cancelando}
      />
    </div>
  );
}
