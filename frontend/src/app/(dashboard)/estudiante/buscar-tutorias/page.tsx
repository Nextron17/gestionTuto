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
import { FormSelect } from '../../../../components/ui/FormField';
import {
  DIAS_FILTRO,
  HorarioItem,
  ORDEN_DIAS,
  ProfesorConHorarios,
  ProfesorUser,
  RecursoRecomendado,
  TemaCatalogo,
  TutoriaGrupal,
  notificarCambioGrupal,
} from '../../../../components/estudiante/buscar-tutorias/types';
import { HorariosLibresSection } from '../../../../components/estudiante/buscar-tutorias/HorariosLibresSection';
import { TutoriasGrupalesSection } from '../../../../components/estudiante/buscar-tutorias/TutoriasGrupalesSection';
import { DirectorioProfesoresSection } from '../../../../components/estudiante/buscar-tutorias/DirectorioProfesoresSection';
import { ModalSolicitarTutoria } from '../../../../components/estudiante/buscar-tutorias/ModalSolicitarTutoria';

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

      <HorariosLibresSection
        horariosLibresFiltrados={horariosLibresFiltrados}
        horariosLibres={horariosLibres}
        profesores={profesores}
        abrirSolicitud={abrirSolicitud}
      />

      <TutoriasGrupalesSection
        grupalesFiltradas={grupalesFiltradas}
        alertaGrupal={alertaGrupal}
        userId={user?.id}
        inscribiendoGrupalId={inscribiendoGrupalId}
        inscribirseEnGrupal={inscribirseEnGrupal}
        onVerMisTutorias={() => router.push('/estudiante/mis-tutorias')}
      />

      <DirectorioProfesoresSection
        profesoresFiltrados={profesoresFiltrados}
        userCarrera={user?.carrera}
        profesorSeleccionado={profesorSeleccionado}
        setProfesorSeleccionado={setProfesorSeleccionado}
        abrirSolicitud={abrirSolicitud}
      />

      <ModalSolicitarTutoria
        modalSolicitud={modalSolicitud}
        onClose={() => setModalSolicitud(null)}
        enviarSolicitud={enviarSolicitud}
        enviandoSolicitud={enviandoSolicitud}
        mensaje={mensaje}
        userName={user?.nombre}
        materiasDisponiblesModal={materiasDisponiblesModal}
        materia={materia}
        setMateria={setMateria}
        temasDeMateria={temasDeMateria}
        tema={tema}
        setTema={setTema}
        otroTema={otroTema}
        setOtroTema={setOtroTema}
        recursosRecomendados={recursosRecomendados}
        fechaPropuesta={fechaPropuesta}
        setFechaPropuesta={setFechaPropuesta}
        horaSeleccion={horaSeleccion}
        setHoraSeleccion={setHoraSeleccion}
        otraHora={otraHora}
        setOtraHora={setOtraHora}
        descripcion={descripcion}
        setDescripcion={setDescripcion}
      />
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
