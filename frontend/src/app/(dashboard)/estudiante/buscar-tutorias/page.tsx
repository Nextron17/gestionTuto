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
  profesor: ProfesorUser;
}

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
  comentarioProfesor?: string;
  profesor?: ProfesorUser;
  estudiante?: { _id: string; nombre: string };
  participantes?: { estudiante: { _id: string; nombre: string } }[];
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
}

function BuscarTutoriasContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryGlobal = searchParams.get('q')?.trim() || '';

  const [nomProf, setNomProf] = useState('');
  const [materiaFiltro, setMateriaFiltro] = useState('');
  const [profesores, setProfesores] = useState<ProfesorConHorarios[]>([]);
  const [grupales, setGrupales] = useState<TutoriaGrupal[]>([]);
  const [profesorSeleccionado, setProfesorSeleccionado] = useState<ProfesorConHorarios | null>(null);
  const [alertaGrupal, setAlertaGrupal] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(
    null
  );

  const [modalSolicitud, setModalSolicitud] = useState<{
    profesor: ProfesorConHorarios;
    horario?: HorarioItem;
  } | null>(null);
  const [materia, setMateria] = useState('');
  const [tema, setTema] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [hora, setHora] = useState('');
  const [enviandoSolicitud, setEnviandoSolicitud] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);
  const [cargando, setCargando] = useState(true);

  const cargarDatos = async () => {
    try {
      const [resProfesores, resHorarios, resGrupales] = await Promise.all([
        api.get('/auth/profesores'),
        api.get('/horarios'),
        api.get('/tutorias/grupales'),
      ]);

      const listaProfesores: ProfesorUser[] = resProfesores.data;
      const listaHorarios: HorarioItem[] = resHorarios.data;

      const profesoresAgrupados: ProfesorConHorarios[] = listaProfesores.map((prof) => ({
        ...prof,
        horarios: listaHorarios.filter((h) => h.profesor && h.profesor._id === prof._id),
      }));

      setProfesores(profesoresAgrupados);
      setGrupales(resGrupales.data || []);
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
    try {
      await api.post(`/tutorias/${tutoriaId}/inscribirse`);
      setAlertaGrupal({
        tipo: 'ok',
        texto: '¡Te has inscrito correctamente a la tutoría grupal!',
      });
      await cargarDatos();
      setTimeout(() => setAlertaGrupal(null), 3500);
    } catch (err) {
      const errorAxios = err as AxiosError<{ message: string }>;
      setAlertaGrupal({
        tipo: 'error',
        texto: errorAxios.response?.data?.message || 'No se pudo completar la inscripción',
      });
    }
  };

  const limpiarTodosLosFiltros = () => {
    setNomProf('');
    setMateriaFiltro('');
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

    const qLower = queryGlobal.toLowerCase();
    const coincideGlobal =
      !qLower ||
      p.nombre.toLowerCase().includes(qLower) ||
      (p.carrera && p.carrera.toLowerCase().includes(qLower)) ||
      (p.escuela && p.escuela.toLowerCase().includes(qLower)) ||
      (p.materias && p.materias.some((m) => m.toLowerCase().includes(qLower)));

    return coincideNombre && coincideMateria && coincideGlobal;
  });

  const grupalesFiltradas = grupales.filter((tg) => {
    const qLower = queryGlobal.toLowerCase();
    const matLower = materiaFiltro.toLowerCase();
    const profLower = nomProf.toLowerCase();

    const coincideProf =
      !profLower || (tg.profesor?.nombre || '').toLowerCase().includes(profLower);
    const coincideMat = !matLower || tg.materia.toLowerCase().includes(matLower);
    const coincideGlobal =
      !qLower ||
      tg.materia.toLowerCase().includes(qLower) ||
      (tg.tema && tg.tema.toLowerCase().includes(qLower)) ||
      (tg.profesor?.nombre && tg.profesor.nombre.toLowerCase().includes(qLower));

    return coincideProf && coincideMat && coincideGlobal;
  });

  const abrirSolicitud = (prof: ProfesorConHorarios, horario?: HorarioItem) => {
    setModalSolicitud({ profesor: prof, horario });
    setHora(horario ? `${horario.dia} ${horario.horaInicio} - ${horario.horaFin}` : '');
    if (prof.materias && prof.materias.length > 0) {
      setMateria(prof.materias[0]);
    } else {
      setMateria(materiaFiltro);
    }
    setTema('');
    setDescripcion('');
    setMensaje(null);
  };

  const enviarSolicitud = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalSolicitud) return;

    setEnviandoSolicitud(true);
    try {
      await api.post('/tutorias', {
        materia,
        tema,
        descripcion,
        profesorId: modalSolicitud.profesor._id,
        hora,
      });
      setMensaje({ tipo: 'ok', texto: '¡Solicitud enviada correctamente!' });
      setTimeout(() => {
        setModalSolicitud(null);
        setMensaje(null);
      }, 1200);
    } catch (err) {
      console.error(err);
      setMensaje({ tipo: 'error', texto: 'Error al enviar la solicitud' });
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

  const hayFiltrosActivos = Boolean(nomProf || materiaFiltro || queryGlobal);

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
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 sm:gap-space-md items-end">
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
              const cupo = tg.cupoMaximo || 10;
              const lugaresRestantes = Math.max(0, cupo - totalInscritos);
              const porcentaje = Math.min(100, Math.round((totalInscritos / cupo) * 100));
              const yaSoyParte =
                tg.estudiante?._id === user?.id ||
                tg.participantes?.some((p) => p.estudiante?._id === user?.id);

              const nombresInscritos = [
                tg.estudiante?.nombre,
                ...(tg.participantes?.map((p) => p.estudiante?.nombre) || []),
              ].filter(Boolean) as string[];

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

                    {/* Barra de Cupos (Sección 05) */}
                    <div className="p-space-sm bg-surface-container-low rounded-lg space-y-1.5 mb-4">
                      <div className="flex flex-wrap justify-between items-center gap-1 font-label-md text-[11px] sm:text-[12px]">
                        <span className="text-on-surface font-medium">
                          Cupos Ocupados:{' '}
                          <strong>
                            {totalInscritos} de {cupo}
                          </strong>
                        </span>
                        <span
                          className={`font-bold ${
                            lugaresRestantes <= 3 ? 'text-tertiary' : 'text-primary'
                          }`}
                        >
                          {lugaresRestantes === 0
                            ? 'Sin cupos'
                            : lugaresRestantes <= 4
                            ? `¡Últimos ${lugaresRestantes} lugares!`
                            : `${lugaresRestantes} disponibles`}
                        </span>
                      </div>
                      <div className="w-full bg-surface-container-highest rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-primary h-full rounded-full transition-all duration-500"
                          style={{ width: `${porcentaje}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-on-surface-variant font-label-md text-[12px]">
                      <span className="flex items-center gap-1 capitalize">
                        <Icon className="text-[16px] text-primary">
                          {tg.modalidad === 'presencial' ? 'location_on' : 'videocam'}
                        </Icon>
                        <span>{tg.modalidad || 'Virtual'}</span>
                      </span>
                      <span className="flex items-center gap-1 min-w-0">
                        <Icon className="text-[16px] text-outline">person</Icon>
                        <span className="truncate">{tg.profesor?.nombre || 'Docente'}</span>
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-surface-container flex flex-wrap items-center justify-between gap-2">
                    <div className="flex -space-x-2 overflow-hidden">
                      {nombresInscritos.slice(0, 2).map((nom, idx) => (
                        <div
                          key={idx}
                          className={`inline-flex h-7 w-7 rounded-full text-[10px] font-bold items-center justify-center ring-2 ring-surface-container-lowest ${
                            idx === 0
                              ? 'bg-primary-container text-on-primary'
                              : 'bg-secondary text-on-secondary'
                          }`}
                          title={nom}
                        >
                          {getInitials(nom)}
                        </div>
                      ))}
                      {totalInscritos > 2 && (
                        <div className="inline-flex h-7 w-7 rounded-full bg-tertiary-container text-white text-[10px] font-bold items-center justify-center ring-2 ring-surface-container-lowest">
                          +{totalInscritos - 2}
                        </div>
                      )}
                    </div>

                    {yaSoyParte ? (
                      <Badge variant="success" dot>
                        Inscrito
                      </Badge>
                    ) : totalInscritos >= cupo ? (
                      <Button variant="subtle" size="sm" disabled>
                        <Icon className="text-[15px]">lock</Icon>
                        <span>Sin cupos</span>
                      </Button>
                    ) : (
                      <Button
                        variant="tonal"
                        size="sm"
                        onClick={() => inscribirseEnGrupal(tg._id)}
                      >
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
              {profesorSeleccionado.horarios.map((h) => (
                <button
                  key={h._id}
                  type="button"
                  onClick={() => abrirSolicitud(profesorSeleccionado, h)}
                  className="py-2.5 px-3 rounded-lg bg-surface-container hover:bg-primary-fixed hover:text-primary transition-all text-on-surface font-label-md text-[12px] font-semibold flex items-center justify-between gap-2 cursor-pointer group active:scale-[0.98]"
                >
                  <span className="flex items-center gap-1.5 min-w-0">
                    <Icon className="text-[16px] text-primary">schedule</Icon>
                    <span className="truncate">
                      {h.dia} {h.horaInicio} - {h.horaFin}
                    </span>
                  </span>
                  <Icon className="text-[15px] text-outline group-hover:text-primary">
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
          {modalSolicitud?.profesor.materias && modalSolicitud.profesor.materias.length > 0 ? (
            <FormSelect
              id="solicitud-materia"
              label="Materia"
              icon="menu_book"
              value={materia}
              onChange={(e) => setMateria(e.target.value)}
              required
            >
              {modalSolicitud.profesor.materias.map((mat, i) => (
                <option key={i} value={mat}>
                  {mat}
                </option>
              ))}
            </FormSelect>
          ) : (
            <FormInput
              id="solicitud-materia-input"
              label="Materia"
              icon="menu_book"
              value={materia}
              onChange={(e) => setMateria(e.target.value)}
              placeholder="Nombre de la materia"
              required
            />
          )}

          <FormInput
            id="solicitud-tema"
            label="Tema Específico"
            icon="topic"
            value={tema}
            onChange={(e) => setTema(e.target.value)}
            placeholder="Ej: Derivadas parciales, Árboles AVL..."
            required
          />

          <FormInput
            id="solicitud-hora"
            label="Horario / Fecha Propuesta"
            icon="schedule"
            value={hora}
            onChange={(e) => setHora(e.target.value)}
            placeholder="Ej: Lunes 08:00 - 10:00"
            hint="El docente confirmará la disponibilidad o propondrá un ajuste."
            required
          />

          <FormTextarea
            id="solicitud-descripcion"
            label="Descripción de la duda"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            rows={3}
            placeholder="Describe brevemente los ejercicios o conceptos que deseas revisar..."
            required
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
