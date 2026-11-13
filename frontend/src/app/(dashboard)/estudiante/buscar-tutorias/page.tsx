'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AxiosError } from 'axios';
import { useAuth } from '../../../../context/AuthContext';
import api from '../../../../lib/api';
import { Icon } from '../../../../components/ui/Icon';
import { SearchInput } from '../../../../components/ui/SearchInput';
import { Button } from '../../../../components/ui/Button';
import { SurfaceCard } from '../../../../components/ui/SurfaceCard';
import { Badge } from '../../../../components/ui/Badge';
import { PageHeader } from '../../../../components/ui/PageHeader';
import { Modal } from '../../../../components/ui/Modal';
import { FormInput, FormSelect, FormTextarea } from '../../../../components/ui/FormField';
import { CalloutBanner } from '../../../../components/ui/CalloutBanner';

interface ProfesorUser {
  _id: string;
  nombre: string;
  email: string;
  escuela?: string;
  carrera?: string;
  materias?: string[];
}

interface HorarioItem {
  _id: string;
  dia: string;
  horaInicio: string;
  horaFin: string;
  nombreProfesor?: string;
  materia?: string;
  semestre?: number;
  libre?: boolean;
  tieneTutoriasAceptadas?: boolean;
  profesor: ProfesorUser;
}

const ORDEN_DIAS: Record<string, number> = {
  Lunes: 1,
  Martes: 2,
  Miércoles: 3,
  Jueves: 4,
  Viernes: 5,
  Sábado: 6,
};

const DIAS_FILTRO = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

interface ProfesorConHorarios extends ProfesorUser {
  horarios: HorarioItem[];
}

interface TutoriaGrupal {
  _id: string;
  materia: string;
  tema?: string;
  descripcion: string;
  hora?: string;
  modalidad?: string;
  cupoMaximo?: number;
  lugar?: string;
  enlaceReunion?: string;
  enlaceGrabacion?: string;
  esInscrito?: boolean;
  comentarioProfesor?: string;
  profesor?: ProfesorUser;
  estudiante?: { _id: string; nombre: string };
  participantes?: { estudiante: { _id: string; nombre: string } }[];
}

interface RecursoRecomendado {
  _id: string;
  titulo: string;
  materia: string;
  tema?: string;
  tipo?: 'video' | 'guia' | 'documento' | 'enlace';
  link: string;
}

interface TemaCatalogo {
  _id: string;
  nombre: string;
  materia: string;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
}

function notificarCambioGrupal(tutoriaId: string) {
  if (typeof window === 'undefined') return;
  const payload = { solicitudId: tutoriaId, estado: 'aceptada', timestamp: Date.now() };
  try {
    if ('BroadcastChannel' in window) {
      const channel = new BroadcastChannel('gestiontuto_solicitudes_sync');
      channel.postMessage(payload);
      channel.close();
    }
    window.localStorage.setItem('gestiontuto_last_tutoria_update', JSON.stringify(payload));
  } catch {
    // Ignorar errores de sincronización entre pestañas
  }
}

function BuscarTutoriasContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryGlobal = searchParams.get('q')?.trim() || '';

  const [nomProf, setNomProf] = useState('');
  const [materiaFiltro, setMateriaFiltro] = useState('');
  const [diaFiltro, setDiaFiltro] = useState('');
  const [profesores, setProfesores] = useState<ProfesorConHorarios[]>([]);
  const [horariosLibres, setHorariosLibres] = useState<HorarioItem[]>([]);
  const [grupales, setGrupales] = useState<TutoriaGrupal[]>([]);
  const [recursosRecomendados, setRecursosRecomendados] = useState<RecursoRecomendado[]>([]);
  const [temasCatalogo, setTemasCatalogo] = useState<TemaCatalogo[]>([]);
  const [profesorSeleccionado, setProfesorSeleccionado] = useState<ProfesorConHorarios | null>(null);
  const [alertaGrupal, setAlertaGrupal] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(
    null
  );
  const [inscribiendoGrupalId, setInscribiendoGrupalId] = useState<string | null>(null);

  const [modalSolicitud, setModalSolicitud] = useState<{
    profesor: ProfesorConHorarios;
    horario?: HorarioItem;
  } | null>(null);
  const [materia, setMateria] = useState('');
  const [tema, setTema] = useState('');
  const [otroTema, setOtroTema] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [horaSeleccion, setHoraSeleccion] = useState('');
  const [otraHora, setOtraHora] = useState('');
  const [fechaPropuesta, setFechaPropuesta] = useState(() => new Date().toISOString().slice(0, 10));
  const [enviandoSolicitud, setEnviandoSolicitud] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);
  const [cargando, setCargando] = useState(true);

  const cargarDatos = async () => {
    try {
      const [resProfesores, resHorarios, resGrupales, resRecursos, resEscuelas] = await Promise.all([
        api.get('/auth/profesores'),
        api.get('/horarios?soloLibres=true'),
        api.get('/tutorias/grupales'),
        api.get('/recursos'),
        api.get('/recursos/escuelas'),
      ]);

      const listaProfesores: ProfesorUser[] = resProfesores.data || [];
      const listaHorariosRaw: HorarioItem[] = resHorarios.data || [];
      const horariosDisponibles = listaHorariosRaw.filter(
        (h) => !h.tieneTutoriasAceptadas && h.libre !== false
      );

      const profesoresAgrupados: ProfesorConHorarios[] = listaProfesores.map((prof) => ({
        ...prof,
        horarios: horariosDisponibles.filter((h) => h.profesor && h.profesor._id === prof._id),
      }));

      setProfesores(profesoresAgrupados);
      setHorariosLibres(horariosDisponibles);
      setGrupales(resGrupales.data || []);
      setRecursosRecomendados(resRecursos.data || []);
      setTemasCatalogo(resEscuelas.data?.temas || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const iniciar = async () => {
      await cargarDatos();
      setCargando(false);
    };
    iniciar();
  }, []);

  const inscribirseEnGrupal = async (tutoriaId: string) => {
    setAlertaGrupal(null);
    setInscribiendoGrupalId(tutoriaId);
    try {
      const res = await api.post(`/tutorias/${tutoriaId}/inscribirse`);
      const cuposOcupados = res.data?.cuposOcupados;
      const cupoMaximo = res.data?.cupoMaximo;
      const detalleCupo =
        cuposOcupados && cupoMaximo
          ? ` (${cuposOcupados}/${cupoMaximo} cupos ocupados)`
          : '';
      setAlertaGrupal({
        tipo: 'ok',
        texto: `¡Te has inscrito correctamente y ya figuras en la lista de participantes${detalleCupo}!`,
      });
      notificarCambioGrupal(tutoriaId);
      await cargarDatos();
      setTimeout(() => setAlertaGrupal(null), 4500);
    } catch (err) {
      const errorAxios = err as AxiosError<{ message: string }>;
      setAlertaGrupal({
        tipo: 'error',
        texto: errorAxios.response?.data?.message || 'No se pudo completar la inscripción',
      });
    } finally {
      setInscribiendoGrupalId(null);
    }
  };

  const limpiarTodosLosFiltros = () => {
    setNomProf('');
    setMateriaFiltro('');
    setDiaFiltro('');
    if (queryGlobal) {
      router.replace('/estudiante/buscar-tutorias');
    }
  };

  const profesoresFiltrados = profesores.filter((p) => {
    const coincideNombre = p.nombre.toLowerCase().includes(nomProf.toLowerCase());
    const coincideMateria =
      materiaFiltro.trim() === '' ||
      (p.materias &&
        p.materias.some((m) => m.toLowerCase().includes(materiaFiltro.toLowerCase())));
    const coincideDia = !diaFiltro || p.horarios.some((h) => h.dia === diaFiltro);

    const qLower = queryGlobal.toLowerCase();
    const coincideGlobal =
      !qLower ||
      p.nombre.toLowerCase().includes(qLower) ||
      (p.carrera && p.carrera.toLowerCase().includes(qLower)) ||
      (p.escuela && p.escuela.toLowerCase().includes(qLower)) ||
      (p.materias && p.materias.some((m) => m.toLowerCase().includes(qLower)));

    return coincideNombre && coincideMateria && coincideDia && coincideGlobal;
  });

  const horariosLibresFiltrados = [...horariosLibres]
    .filter((h) => {
      const nombreDocente = (h.nombreProfesor || h.profesor?.nombre || '').toLowerCase();
      const matHorario = (h.materia || '').toLowerCase();
      const qLower = queryGlobal.toLowerCase();

      const okProf = !nomProf.trim() || nombreDocente.includes(nomProf.toLowerCase().trim());
      const okMat =
        !materiaFiltro.trim() || matHorario.includes(materiaFiltro.toLowerCase().trim());
      const okDia = !diaFiltro || h.dia === diaFiltro;
      const okGlobal =
        !qLower ||
        nombreDocente.includes(qLower) ||
        matHorario.includes(qLower) ||
        h.dia.toLowerCase().includes(qLower) ||
        (h.profesor?.carrera && h.profesor.carrera.toLowerCase().includes(qLower));

      return okProf && okMat && okDia && okGlobal;
    })
    .sort((a, b) => {
      const diffDia = (ORDEN_DIAS[a.dia] || 99) - (ORDEN_DIAS[b.dia] || 99);
      if (diffDia !== 0) return diffDia;
      return a.horaInicio.localeCompare(b.horaInicio);
    });

  const grupalesFiltradas = grupales.filter((tg) => {
    const qLower = queryGlobal.toLowerCase();
    const matLower = materiaFiltro.toLowerCase();
    const profLower = nomProf.toLowerCase();
    const diaLower = diaFiltro.toLowerCase();

    const coincideProf =
      !profLower || (tg.profesor?.nombre || '').toLowerCase().includes(profLower);
    const coincideMat = !matLower || tg.materia.toLowerCase().includes(matLower);
    const coincideDia = !diaLower || (tg.hora || '').toLowerCase().includes(diaLower);
    const coincideGlobal =
      !qLower ||
      tg.materia.toLowerCase().includes(qLower) ||
      (tg.tema && tg.tema.toLowerCase().includes(qLower)) ||
      (tg.profesor?.nombre && tg.profesor.nombre.toLowerCase().includes(qLower));

    return coincideProf && coincideMat && coincideDia && coincideGlobal;
  });

  const materiasDisponiblesModal = modalSolicitud
    ? Array.from(
        new Set([
          ...(modalSolicitud.profesor.materias || []),
          ...modalSolicitud.profesor.horarios
            .map((h) => h.materia || '')
            .filter(Boolean),
        ])
      )
    : [];

  const temasDeMateria = Array.from(
    new Set(
      temasCatalogo
        .filter(
          (t) =>
            materia.trim() !== '' &&
            t.materia.trim().toLowerCase() === materia.trim().toLowerCase()
        )
        .map((t) => t.nombre)
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b));

  const abrirSolicitud = (prof: ProfesorConHorarios, horario?: HorarioItem) => {
    setModalSolicitud({ profesor: prof, horario });

    const materiasProf = Array.from(
      new Set([
        ...(prof.materias || []),
        ...prof.horarios.map((h) => h.materia || '').filter(Boolean),
      ])
    );

    if (horario?.materia) {
      setMateria(horario.materia);
    } else if (materiasProf.length > 0) {
      setMateria(materiasProf[0]);
    } else {
      setMateria(materiaFiltro);
    }

    if (horario) {
      setHoraSeleccion(`${horario.dia} ${horario.horaInicio} - ${horario.horaFin}`);
      setOtraHora('');
    } else if (prof.horarios.length > 0) {
      const primero = prof.horarios[0];
      setHoraSeleccion(`${primero.dia} ${primero.horaInicio} - ${primero.horaFin}`);
      setOtraHora('');
    } else {
      setHoraSeleccion('__otro__');
      setOtraHora('');
    }

    setTema('');
    setOtroTema('');
    setDescripcion('');
    setFechaPropuesta(new Date().toISOString().slice(0, 10));
    setMensaje(null);
  };

  const enviarSolicitud = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalSolicitud) return;

    const materiaFinal = materia.trim();
    const temaFinal = (tema === '__otro__' ? otroTema : tema).trim();
    const horaFinal = (horaSeleccion === '__otro__' ? otraHora : horaSeleccion).trim();

    if (!materiaFinal || !temaFinal || !horaFinal) {
      setMensaje({
        tipo: 'error',
        texto: 'Debes indicar la materia, el tema específico y el horario elegido.',
      });
      return;
    }

    setEnviandoSolicitud(true);
    setMensaje(null);
    try {
      await api.post('/tutorias', {
        materia: materiaFinal,
        tema: temaFinal,
        descripcion: descripcion.trim() || `Refuerzo académico sobre ${temaFinal}`,
        profesorId: modalSolicitud.profesor._id,
        hora: horaFinal,
        fechaPropuesta: fechaPropuesta || undefined,
      });
      setMensaje({
        tipo: 'ok',
        texto: `Solicitud enviada en estado "pendiente" para ${materiaFinal} (${temaFinal}) en horario ${horaFinal}.`,
      });
      await cargarDatos();
      setTimeout(() => {
        setModalSolicitud(null);
        setMensaje(null);
      }, 1500);
    } catch (err) {
      console.error(err);
      const axiosErr = err as AxiosError<{ message?: string }>;
      setMensaje({
        tipo: 'error',
        texto: axiosErr.response?.data?.message || 'Error al enviar la solicitud',
      });
    } finally {
      setEnviandoSolicitud(false);
    }
  };

  if (cargando) {
    return (
      <div className="max-w-6xl mx-auto py-8 text-sm text-on-surface-variant flex items-center gap-2">
        <Icon className="text-primary animate-pulse">hourglass_top</Icon>
        <span>Cargando profesores y tutorías disponibles...</span>
      </div>
    );
  }

  const hayFiltrosActivos = Boolean(nomProf || materiaFiltro || diaFiltro || queryGlobal);

  return (
    <div className="space-y-space-lg max-w-6xl mx-auto min-w-0">
      <PageHeader
        eyebrow="01. Directorio Académico"
        title="Buscar Tutorías"
        description="Encuentra docentes disponibles, revisa sus franjas horarias o inscríbete en talleres y tutorías grupales."
        actions={
          user?.carrera ? (
            <Badge variant="primary" className="px-3 py-1 max-w-full">
              <Icon className="text-[15px]">school</Icon>
              <span className="truncate">{user.carrera}</span>
            </Badge>
          ) : undefined
        }
      />

      {/* Barra de búsqueda y filtros canónica (Sección 03 & 04) */}
      <SurfaceCard tone="lowest" className="p-4 sm:p-space-lg space-y-space-md">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_200px_auto] gap-3 sm:gap-space-md items-end">
          <SearchInput
            id="search-profesor"
            label="Buscar por Docente"
            icon="person_search"
            placeholder="Ej: Dra. Marcela Restrepo..."
            value={nomProf}
            onChange={(e) => setNomProf(e.target.value)}
            onClear={() => setNomProf('')}
          />
          <SearchInput
            id="search-materia"
            label="Filtrar por Materia o Área"
            icon="menu_book"
            placeholder="Ej: Cálculo, Estructuras de Datos..."
            value={materiaFiltro}
            onChange={(e) => setMateriaFiltro(e.target.value)}
            onClear={() => setMateriaFiltro('')}
          />
          <FormSelect
            id="search-dia"
            label="Filtrar por Día"
            icon="event"
            value={diaFiltro}
            onChange={(e) => setDiaFiltro(e.target.value)}
          >
            <option value="">Todos los días</option>
            {DIAS_FILTRO.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </FormSelect>
          <Button
            variant={hayFiltrosActivos ? 'outline' : 'primary'}
            onClick={limpiarTodosLosFiltros}
            className="w-full md:w-auto"
          >
            <Icon className="text-[18px]">{hayFiltrosActivos ? 'close' : 'search'}</Icon>
            <span>{hayFiltrosActivos ? 'Cancelar Filtros' : 'Buscar'}</span>
          </Button>
        </div>

        {hayFiltrosActivos && (
          <div className="pt-1 flex flex-wrap items-center gap-2">
            <span className="font-label-md text-[11px] text-outline font-semibold uppercase tracking-wider mr-1">
              Filtros Activos:
            </span>
            {nomProf && (
              <Badge variant="neutral" onRemove={() => setNomProf('')}>
                Docente: {nomProf}
              </Badge>
            )}
            {materiaFiltro && (
              <Badge variant="neutral" onRemove={() => setMateriaFiltro('')}>
                Materia: {materiaFiltro}
              </Badge>
            )}
            {diaFiltro && (
              <Badge variant="secondary" onRemove={() => setDiaFiltro('')}>
                Día: {diaFiltro}
              </Badge>
            )}
            {queryGlobal && (
              <Badge
                variant="primary"
                onRemove={() => router.replace('/estudiante/buscar-tutorias')}
              >
                Búsqueda: &ldquo;{queryGlobal}&rdquo;
              </Badge>
            )}
          </div>
        )}
      </SurfaceCard>

      {/* HU-02: Horarios Disponibles de Profesores (Solo aún libres) */}
      <section className="space-y-space-md min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="min-w-0">
            <span className="font-label-md text-[11px] uppercase tracking-wider text-outline font-semibold block">
              Disponibilidad en Tiempo Real
            </span>
            <h2 className="text-lg sm:text-xl font-semibold text-on-surface flex items-center gap-2">
              <Icon className="text-[#16a34a] text-[22px]">event_available</Icon>
              <span className="break-words">Horarios Disponibles (Aún Libres)</span>
            </h2>
          </div>
          <Badge variant="success" dot className="self-start sm:self-auto">
            {horariosLibresFiltrados.length}{' '}
            {horariosLibresFiltrados.length === 1 ? 'franja libre' : 'franjas libres'}
          </Badge>
        </div>

        {horariosLibresFiltrados.length === 0 ? (
          <SurfaceCard tone="lowest" className="p-6 sm:p-8 text-center space-y-1.5">
            <Icon className="text-outline text-[32px]">event_busy</Icon>
            <p className="text-sm text-on-surface-variant">
              No hay franjas horarias libres disponibles con los filtros actuales.
            </p>
          </SurfaceCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-space-md">
            {horariosLibresFiltrados.map((h) => {
              const profAsociado: ProfesorConHorarios = profesores.find(
                (p) => p._id === h.profesor?._id
              ) || {
                ...h.profesor,
                horarios: horariosLibres.filter((item) => item.profesor?._id === h.profesor?._id),
              };
              const nombreDocente = h.nombreProfesor || h.profesor?.nombre || 'Docente';

              return (
                <SurfaceCard
                  key={h._id}
                  as="article"
                  tone="lowest"
                  interactive
                  className="p-4 flex flex-col justify-between gap-3.5"
                >
                  <div className="space-y-2.5 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="success" dot>
                        Libre
                      </Badge>
                      {h.semestre && (
                        <Badge variant="neutral" pill={false}>
                          Semestre {h.semestre}
                        </Badge>
                      )}
                    </div>

                    <div className="p-2.5 rounded-lg bg-surface-container-low flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Icon className="text-[18px] text-primary shrink-0">schedule</Icon>
                        <div className="min-w-0">
                          <span className="font-label-md text-xs font-bold text-on-surface block truncate">
                            {h.dia}
                          </span>
                          <span className="font-mono text-xs text-primary font-semibold">
                            {h.horaInicio} - {h.horaFin}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1 min-w-0">
                      <p className="text-xs font-bold text-on-surface flex items-center gap-1.5 break-words">
                        <Icon className="text-[15px] text-primary shrink-0">menu_book</Icon>
                        <span>{h.materia || 'Tutoría Académica'}</span>
                      </p>
                      <p className="text-xs text-on-surface-variant flex items-center gap-1.5 min-w-0">
                        <Icon className="text-[15px] text-outline shrink-0">person</Icon>
                        <span className="truncate">{nombreDocente}</span>
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="tonal"
                    size="sm"
                    fullWidth
                    onClick={() => abrirSolicitud(profAsociado, h)}
                  >
                    <Icon className="text-[16px]">calendar_add_on</Icon>
                    <span>Escoger Horario</span>
                  </Button>
                </SurfaceCard>
              );
            })}
          </div>
        )}
      </section>

      {/* Tutorías Grupales Programadas Abiertas (Patrón Canónico Sección 05) */}
      {grupalesFiltradas.length > 0 && (
        <section className="space-y-space-md min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="min-w-0">
              <span className="font-label-md text-[11px] uppercase tracking-wider text-outline font-semibold block">
                Sesiones Colaborativas
              </span>
              <h2 className="text-lg sm:text-xl font-semibold text-on-surface flex items-center gap-2">
                <Icon className="text-primary text-[22px]">groups</Icon>
                <span className="break-words">Tutorías Grupales Programadas</span>
              </h2>
            </div>
            <Badge variant="secondary" className="self-start sm:self-auto">
              {grupalesFiltradas.length}{' '}
              {grupalesFiltradas.length === 1 ? 'sesión abierta' : 'sesiones abiertas'}
            </Badge>
          </div>

          {alertaGrupal && (
            <CalloutBanner
              tone={alertaGrupal.tipo === 'ok' ? 'success' : 'danger'}
              title={alertaGrupal.tipo === 'ok' ? 'Inscripción confirmada' : 'Aviso de inscripción'}
            >
              {alertaGrupal.texto}
            </CalloutBanner>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-space-md">
            {grupalesFiltradas.map((tg) => {
              const totalInscritos = 1 + (tg.participantes?.length || 0);
              const tieneCupoMaximo = typeof tg.cupoMaximo === 'number' && tg.cupoMaximo > 0;
              const cupo = tieneCupoMaximo ? (tg.cupoMaximo as number) : 0;
              const lugaresRestantes = tieneCupoMaximo ? Math.max(0, cupo - totalInscritos) : null;
              const porcentaje = tieneCupoMaximo
                ? Math.min(100, Math.round((totalInscritos / cupo) * 100))
                : 0;
              const sinCupos = tieneCupoMaximo && totalInscritos >= cupo;
              const soySolicitante = tg.estudiante?._id === user?.id;
              const soyParticipante = Boolean(
                tg.participantes?.some((p) => p.estudiante?._id === user?.id)
              );
              const yaSoyParte = soySolicitante || soyParticipante;

              const participantesLista = [
                ...(tg.estudiante?.nombre
                  ? [
                      {
                        id: tg.estudiante._id,
                        nombre: tg.estudiante.nombre,
                        esTu: tg.estudiante._id === user?.id,
                      },
                    ]
                  : []),
                ...(tg.participantes || []).map((p, idx) => ({
                  id: p.estudiante?._id || `part-${idx}`,
                  nombre: p.estudiante?.nombre || 'Estudiante',
                  esTu: p.estudiante?._id === user?.id,
                })),
              ];

              return (
                <SurfaceCard
                  key={tg._id}
                  as="article"
                  tone="lowest"
                  interactive
                  className="p-4 sm:p-space-md flex flex-col justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <Badge variant="secondary" pill={false}>
                        <Icon className="text-[13px]">groups</Icon>
                        <span>Tutoría Grupal</span>
                      </Badge>
                      <span className="font-mono text-[11px] sm:text-[12px] text-outline">
                        {tg.hora || 'Por confirmar'}
                      </span>
                    </div>

                    <h3 className="font-label-md text-[15px] font-bold text-on-surface mb-1 break-words">
                      {tg.materia} {tg.tema ? `: ${tg.tema}` : ''}
                    </h3>

                    <p className="font-body-md text-[13px] text-on-surface-variant mb-4 line-clamp-2 break-words">
                      {tg.descripcion}
                    </p>

                    {/* Barra de Cupos (HU-16) */}
                    <div className="p-space-sm bg-surface-container-low rounded-lg space-y-1.5 mb-3">
                      <div className="flex flex-wrap justify-between items-center gap-1 font-label-md text-[11px] sm:text-[12px]">
                        <span className="text-on-surface font-medium">
                          {tieneCupoMaximo ? (
                            <>
                              Cupos Ocupados:{' '}
                              <strong>
                                {totalInscritos} de {cupo}
                              </strong>
                            </>
                          ) : (
                            <>
                              Participantes inscritos: <strong>{totalInscritos}</strong>
                            </>
                          )}
                        </span>
                        <span
                          className={`font-bold ${
                            lugaresRestantes !== null && lugaresRestantes <= 3
                              ? 'text-tertiary'
                              : 'text-primary'
                          }`}
                        >
                          {!tieneCupoMaximo
                            ? 'Cupo abierto'
                            : lugaresRestantes === 0
                            ? 'Cupo máximo completo'
                            : lugaresRestantes !== null && lugaresRestantes <= 4
                            ? `¡Últimos ${lugaresRestantes} lugares!`
                            : `${lugaresRestantes} disponibles`}
                        </span>
                      </div>
                      {tieneCupoMaximo && (
                        <div className="w-full bg-surface-container-highest rounded-full h-2.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              sinCupos ? 'bg-error' : 'bg-primary'
                            }`}
                            style={{ width: `${porcentaje}%` }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Lista de participantes inscritos */}
                    <div className="mb-3 space-y-1">
                      <span className="text-[11px] font-label-md font-semibold text-outline block">
                        Lista de participantes ({participantesLista.length}):
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {participantesLista.slice(0, 4).map((p) => (
                          <Badge
                            key={p.id}
                            variant={p.esTu ? 'success' : 'neutral'}
                            pill={false}
                            className="text-[10px]"
                          >
                            {p.nombre}
                            {p.esTu ? ' (Tú)' : ''}
                          </Badge>
                        ))}
                        {participantesLista.length > 4 && (
                          <Badge variant="neutral" pill={false} className="text-[10px]">
                            +{participantesLista.length - 4} más
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-on-surface-variant font-label-md text-[12px]">
                      <span className="flex items-center gap-1 capitalize">
                        <Icon className="text-[16px] text-primary">
                          {tg.modalidad === 'presencial' ? 'location_on' : 'videocam'}
                        </Icon>
                        <span>
                          {tg.modalidad || 'Virtual'}
                          {tg.modalidad === 'presencial' && tg.lugar ? ` (${tg.lugar})` : ''}
                        </span>
                      </span>
                      <span className="flex items-center gap-1 min-w-0">
                        <Icon className="text-[16px] text-outline">person</Icon>
                        <span className="truncate">{tg.profesor?.nombre || 'Docente'}</span>
                      </span>
                    </div>

                    {/* HU-17: Enlace de reunión y grabación solo visible para estudiantes inscritos */}
                    {yaSoyParte ? (
                      (tg.enlaceReunion || tg.enlaceGrabacion) && (
                        <div className="mt-3 p-2.5 rounded-lg bg-[#16a34a]/10 border border-[#16a34a]/25 space-y-1.5">
                          <span className="text-[11px] font-bold text-[#15803d] flex items-center gap-1">
                            <Icon className="text-[14px]">verified_user</Icon>
                            <span>Acceso exclusivo habilitado para inscritos:</span>
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {tg.enlaceReunion && (
                              <a
                                href={tg.enlaceReunion}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary bg-surface-container-lowest px-2 py-1 rounded-md hover:bg-surface-container transition-colors"
                              >
                                <Icon className="text-[14px]">videocam</Icon>
                                <span>Conectarme a la reunión</span>
                                <Icon className="text-[12px]">open_in_new</Icon>
                              </a>
                            )}
                            {tg.enlaceGrabacion && (
                              <a
                                href={tg.enlaceGrabacion}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#15803d] bg-surface-container-lowest px-2 py-1 rounded-md hover:bg-surface-container transition-colors"
                              >
                                <Icon className="text-[14px]">play_circle</Icon>
                                <span>Ver grabación</span>
                                <Icon className="text-[12px]">open_in_new</Icon>
                              </a>
                            )}
                          </div>
                        </div>
                      )
                    ) : (
                      <div className="mt-3 p-2 rounded-lg bg-surface-container-low text-[11px] text-on-surface-variant flex items-start gap-1.5">
                        <Icon className="text-[14px] text-outline shrink-0 mt-0.5">lock</Icon>
                        <span>
                          El enlace de reunión y la grabación solo son visibles para los estudiantes
                          inscritos en esta tutoría.
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-surface-container flex flex-wrap items-center justify-between gap-2">
                    <div className="flex -space-x-2 overflow-hidden">
                      {participantesLista.slice(0, 2).map((p, idx) => (
                        <div
                          key={p.id}
                          className={`inline-flex h-7 w-7 rounded-full text-[10px] font-bold items-center justify-center ring-2 ring-surface-container-lowest ${
                            idx === 0
                              ? 'bg-primary-container text-on-primary'
                              : 'bg-secondary text-on-secondary'
                          }`}
                          title={p.nombre}
                        >
                          {getInitials(p.nombre)}
                        </div>
                      ))}
                      {totalInscritos > 2 && (
                        <div className="inline-flex h-7 w-7 rounded-full bg-tertiary-container text-white text-[10px] font-bold items-center justify-center ring-2 ring-surface-container-lowest">
                          +{totalInscritos - 2}
                        </div>
                      )}
                    </div>

                    {yaSoyParte ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="success" dot>
                          En lista de participantes
                        </Badge>
                        <Button
                          type="button"
                          variant="subtle"
                          size="sm"
                          onClick={() => router.push('/estudiante/mis-tutorias')}
                        >
                          <span>Ver en Mis Tutorías</span>
                        </Button>
                      </div>
                    ) : sinCupos ? (
                      <Button variant="subtle" size="sm" disabled>
                        <Icon className="text-[15px]">lock</Icon>
                        <span>
                          Sin cupos ({totalInscritos}/{cupo})
                        </span>
                      </Button>
                    ) : (
                      <Button
                        variant="tonal"
                        size="sm"
                        loading={inscribiendoGrupalId === tg._id}
                        onClick={() => inscribirseEnGrupal(tg._id)}
                      >
                        <Icon className="text-[16px]">group_add</Icon>
                        <span>Inscribirme al Taller</span>
                      </Button>
                    )}
                  </div>
                </SurfaceCard>
              );
            })}
          </div>
        </section>
      )}

      {/* Resultados de Profesores (Patrón Canónico Tarjeta de Tutor - Sección 05) */}
      <section className="space-y-space-md min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="font-label-md text-[11px] uppercase tracking-wider text-outline font-semibold block">
              Mentoría Individual &amp; Grupal
            </span>
            <h2 className="text-lg sm:text-xl font-semibold text-on-surface">
              Profesores Disponibles
            </h2>
          </div>
          <Badge variant="neutral" className="self-start sm:self-auto">
            {profesoresFiltrados.length}{' '}
            {profesoresFiltrados.length === 1 ? 'profesor disponible' : 'profesores disponibles'}
          </Badge>
        </div>

        {profesoresFiltrados.length === 0 ? (
          <SurfaceCard tone="lowest" className="p-8 sm:p-10 text-center space-y-2">
            <Icon className="text-outline text-[36px]">search_off</Icon>
            <p className="text-sm text-on-surface-variant">
              No se encontraron profesores disponibles con ese criterio
              {user?.carrera ? ` para ${user.carrera}` : ''}.
            </p>
          </SurfaceCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-space-md">
            {profesoresFiltrados.map((prof) => (
              <SurfaceCard
                key={prof._id}
                as="article"
                tone="lowest"
                interactive
                className="overflow-hidden flex flex-col justify-between"
              >
                <div className="min-w-0">
                  {/* Cabecera Tonal de Tarjeta con Badge */}
                  <div className="relative h-20 sm:h-24 bg-gradient-to-br from-primary/15 via-primary-fixed/60 to-surface-container">
                    <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-transparent to-transparent" />
                    <div className="absolute top-3 right-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-container-lowest/90 backdrop-blur text-primary font-label-md text-[11px] font-bold shadow-xs">
                        <Icon filled className="text-[13px] text-amber-500">
                          verified
                        </Icon>
                        <span>
                          {prof.horarios.length}{' '}
                          {prof.horarios.length === 1 ? 'franja' : 'franjas'}
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Cuerpo de Tarjeta de Tutor */}
                  <div className="px-4 sm:px-space-md pt-1 pb-4 sm:pb-space-md min-w-0">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 -mt-7 sm:-mt-8 rounded-full shadow-md bg-surface-container-lowest p-0.5 relative z-10 shrink-0">
                        <div className="w-full h-full rounded-full bg-primary text-on-primary font-bold text-sm sm:text-base flex items-center justify-center">
                          {getInitials(prof.nombre)}
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-label-md text-label-md font-bold text-on-surface leading-snug group-hover:text-primary transition-colors break-words">
                          {prof.nombre}
                        </h3>
                        <span className="block font-label-md text-[12px] text-on-surface-variant break-words">
                          {prof.carrera || prof.escuela || 'Docente Universitario'}
                        </span>
                      </div>
                    </div>

                    <p className="mt-3 font-body-md text-[12px] text-on-surface-variant flex items-center gap-1.5 min-w-0">
                      <Icon className="text-[15px] text-outline shrink-0">mail</Icon>
                      <span className="truncate">{prof.email}</span>
                    </p>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {prof.escuela && (
                        <span className="px-2 py-0.5 rounded bg-primary-fixed text-on-primary-fixed font-label-md text-[11px] font-medium break-words">
                          {prof.escuela}
                        </span>
                      )}
                      {prof.materias && prof.materias.length > 0 ? (
                        prof.materias.map((mat, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-label-md text-[11px] break-words"
                          >
                            {mat}
                          </span>
                        ))
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-surface-container text-outline font-label-md text-[11px]">
                          Tutoría General
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Pie de Tarjeta en surface-container-low */}
                <div className="p-3.5 sm:p-space-md bg-surface-container-low flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setProfesorSeleccionado(prof)}
                    className="font-label-md text-[12px] font-semibold text-on-surface-variant hover:text-primary inline-flex items-center gap-1 transition-colors cursor-pointer py-1"
                  >
                    <Icon className="text-[16px] text-primary">calendar_month</Icon>
                    <span>Horarios ({prof.horarios.length})</span>
                  </button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => abrirSolicitud(prof)}
                  >
                    <Icon className="text-[16px]">calendar_add_on</Icon>
                    <span>Solicitar Sesión</span>
                  </Button>
                </div>
              </SurfaceCard>
            ))}
          </div>
        )}
      </section>

      {/* Franjas Horarias Seleccionables del Profesor (Sección 04) */}
      {profesorSeleccionado && (
        <SurfaceCard tone="lowest" className="p-4 sm:p-space-lg space-y-space-md">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 pb-3 border-b border-surface-container">
            <div className="min-w-0">
              <span className="font-label-md text-[11px] text-outline font-semibold uppercase tracking-wider block">
                Seleccionar Franja Horaria
              </span>
              <h3 className="text-base sm:text-lg font-bold text-on-surface flex items-center gap-2 mt-0.5">
                <Icon className="text-primary text-[20px]">event_available</Icon>
                <span className="break-words">{profesorSeleccionado.nombre}</span>
              </h3>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Haz clic en una franja horaria disponible para agendar tu tutoría directamente.
              </p>
            </div>
            <Button
              variant="subtle"
              size="sm"
              onClick={() => setProfesorSeleccionado(null)}
              className="self-start"
            >
              <Icon className="text-[16px]">close</Icon>
              <span>Cerrar</span>
            </Button>
          </div>

          {profesorSeleccionado.horarios.length === 0 ? (
            <CalloutBanner tone="info" title="Sin franjas fijas registradas">
              Este docente no tiene bloques de horario fijos publicados. Puedes enviar una
              solicitud proponiendo el horario que mejor se ajuste a tu disponibilidad.
            </CalloutBanner>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {profesorSeleccionado.horarios.map((h) => (
                <button
                  key={h._id}
                  type="button"
                  onClick={() => abrirSolicitud(profesorSeleccionado, h)}
                  className="py-2.5 px-3 rounded-lg bg-surface-container hover:bg-primary-fixed hover:text-primary transition-all text-on-surface font-label-md text-[12px] font-semibold flex items-center justify-between gap-2 cursor-pointer group active:scale-[0.98] text-left"
                >
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <span className="flex items-center gap-1.5 min-w-0">
                      <Icon className="text-[16px] text-primary shrink-0">schedule</Icon>
                      <span className="truncate">
                        {h.dia} {h.horaInicio} - {h.horaFin}
                      </span>
                    </span>
                    {(h.materia || h.semestre) && (
                      <span className="block text-[11px] font-normal text-on-surface-variant group-hover:text-primary/90 truncate pl-5">
                        {h.materia}
                        {h.materia && h.semestre ? ' • ' : ''}
                        {h.semestre ? `Sem. ${h.semestre}` : ''}
                      </span>
                    )}
                  </div>
                  <Icon className="text-[15px] text-outline group-hover:text-primary shrink-0">
                    arrow_forward
                  </Icon>
                </button>
              ))}
            </div>
          )}
        </SurfaceCard>
      )}

      {/* Modal Canónico de Solicitud de Tutoría (Sección 06) */}
      <Modal
        open={Boolean(modalSolicitud)}
        onClose={() => setModalSolicitud(null)}
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
              onClick={() => setModalSolicitud(null)}
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
                    {user?.nombre || 'Estudiante'}
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
    </div>
  );
}

export default function BuscarTutoriasPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-6xl mx-auto py-8 text-sm text-on-surface-variant">
          Cargando buscador de tutorías...
        </div>
      }
    >
      <BuscarTutoriasContent />
    </Suspense>
  );
}
