'use client';

import { useEffect, useState } from 'react';
import api from '../../../../lib/api';
import { Icon } from '../../../../components/ui/Icon';
import { PageHeader } from '../../../../components/ui/PageHeader';
import { SurfaceCard } from '../../../../components/ui/SurfaceCard';
import { Badge } from '../../../../components/ui/Badge';
import { Button } from '../../../../components/ui/Button';
import { FormSelect } from '../../../../components/ui/FormField';
import { CalloutBanner } from '../../../../components/ui/CalloutBanner';

interface DemandaMateria {
  materia: string;
  totalSolicitudes: number;
  finalizadas: number;
  pendientes: number;
  carreras?: string[];
}

interface DemandaTema {
  materia: string;
  tema: string;
  totalSolicitudes: number;
  finalizadas: number;
  pendientes: number;
}

interface DemandaCarreraSemestre {
  carrera: string;
  semestre?: number | null;
  totalSolicitudes: number;
  materiasPrincipales?: string[];
}

interface ReporteData {
  fechaGeneracion?: string;
  filtros?: {
    periodo?: string;
    carrera?: string;
    semestre?: string;
  };
  carrerasDisponibles?: string[];
  semestresDisponibles?: number[];
  totalUsuarios: number;
  totalEstudiantes: number;
  totalProfesores: number;
  totalTutorias: number;
  tutoriasPendientes: number;
  tutoriasAceptadas: number;
  tutoriasFinalizadas: number;
  tutoriasAplazadas?: number;
  tutoriasCanceladas?: number;
  tutoriasVirtuales?: number;
  tutoriasPresenciales?: number;
  tutoriasIndividuales?: number;
  tutoriasGrupales?: number;
  asistenciasConfirmadas?: number;
  inasistenciasRegistradas?: number;
  totalRecursos?: number;
  totalHorarios?: number;
  demandaPorMateria?: DemandaMateria[];
  demandaPorTema?: DemandaTema[];
  demandaPorCarreraSemestre?: DemandaCarreraSemestre[];
}

function escapeCsvCell(value: unknown): string {
  const str = String(value ?? '');
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function triggerFileDownload(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function AdminReportesPage() {
  const [reporte, setReporte] = useState<ReporteData | null>(null);
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [carreraFiltro, setCarreraFiltro] = useState<string>('todas');
  const [semestreFiltro, setSemestreFiltro] = useState<string>('todos');
  const [mensajeDescarga, setMensajeDescarga] = useState('');

  useEffect(() => {
    let cancelado = false;

    const consultarReportes = async () => {
      try {
        const params = new URLSearchParams();
        if (carreraFiltro && carreraFiltro !== 'todas') params.set('carrera', carreraFiltro);
        if (semestreFiltro && semestreFiltro !== 'todos') params.set('semestre', semestreFiltro);
        const query = params.toString() ? `?${params.toString()}` : '';
        const res = await api.get(`/admin/reportes${query}`);
        if (!cancelado) {
          setReporte(res.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelado) {
          setCargando(false);
          setActualizando(false);
        }
      }
    };

    consultarReportes();

    return () => {
      cancelado = true;
    };
  }, [carreraFiltro, semestreFiltro]);

  const aplicarFiltro = (nuevaCarrera: string, nuevoSemestre: string) => {
    if (nuevaCarrera === carreraFiltro && nuevoSemestre === semestreFiltro) return;
    setActualizando(true);
    setCarreraFiltro(nuevaCarrera);
    setSemestreFiltro(nuevoSemestre);
  };

  if (cargando) {
    return (
      <div className="max-w-6xl mx-auto py-8 text-sm text-on-surface-variant flex items-center gap-2">
        <Icon className="text-primary animate-pulse">hourglass_top</Icon>
        <span>Generando métricas del sistema...</span>
      </div>
    );
  }

  const totalTutorias = reporte?.totalTutorias || 0;
  const pctFinalizadas =
    totalTutorias > 0
      ? Math.round(((reporte?.tutoriasFinalizadas || 0) / totalTutorias) * 100)
      : 0;
  const pctAceptadas =
    totalTutorias > 0
      ? Math.round(((reporte?.tutoriasAceptadas || 0) / totalTutorias) * 100)
      : 0;
  const pctPendientes =
    totalTutorias > 0
      ? Math.round(((reporte?.tutoriasPendientes || 0) / totalTutorias) * 100)
      : 0;

  const hayFiltroActivo = carreraFiltro !== 'todas' || semestreFiltro !== 'todos';

  const descargarReporteCSV = () => {
    if (!reporte) return;
    const fechaISO = reporte.fechaGeneracion || new Date().toISOString();
    const fechaLegible = new Date(fechaISO).toLocaleString('es-CO');
    const fechaArchivo = fechaISO.slice(0, 10);

    const filas: Array<Array<string | number>> = [
      ['REPORTE ACADÉMICO INSTITUCIONAL - TUTORÍAS PRO'],
      ['Fecha de Generación', fechaLegible],
      ['Periodo', reporte.filtros?.periodo || 'Global / Tiempo Real'],
      ['Filtro Carrera', reporte.filtros?.carrera || 'Todas'],
      ['Filtro Semestre', reporte.filtros?.semestre || 'Todos'],
      [],
      ['CATEGORÍA', 'MÉTRICA', 'VALOR', 'DETALLE / PORCENTAJE'],
      ['Usuarios', 'Total Usuarios Activos', reporte.totalUsuarios, 'Estudiantes + Profesores'],
      ['Usuarios', 'Total Estudiantes', reporte.totalEstudiantes, ''],
      ['Usuarios', 'Total Profesores', reporte.totalProfesores, ''],
      ['Tutorías (Estados)', 'Solicitudes Totales', totalTutorias, '100%'],
      ['Tutorías (Estados)', 'Finalizadas', reporte.tutoriasFinalizadas, `${pctFinalizadas}%`],
      ['Tutorías (Estados)', 'En Curso (Aceptadas)', reporte.tutoriasAceptadas, `${pctAceptadas}%`],
      ['Tutorías (Estados)', 'Pendientes de Revisión', reporte.tutoriasPendientes, `${pctPendientes}%`],
      ['Tutorías (Estados)', 'Aplazadas', reporte.tutoriasAplazadas || 0, ''],
      ['Tutorías (Estados)', 'Canceladas', reporte.tutoriasCanceladas || 0, ''],
      ['Modalidad y Tipo', 'Modalidad Virtual', reporte.tutoriasVirtuales || 0, ''],
      ['Modalidad y Tipo', 'Modalidad Presencial', reporte.tutoriasPresenciales || 0, ''],
      ['Modalidad y Tipo', 'Sesiones Individuales', reporte.tutoriasIndividuales || 0, ''],
      ['Modalidad y Tipo', 'Sesiones Grupales', reporte.tutoriasGrupales || 0, ''],
      ['Asistencia y Oferta', 'Asistencias Confirmadas', reporte.asistenciasConfirmadas || 0, ''],
      ['Asistencia y Oferta', 'Inasistencias Registradas', reporte.inasistenciasRegistradas || 0, ''],
      ['Asistencia y Oferta', 'Recursos Publicados', reporte.totalRecursos || 0, ''],
      ['Asistencia y Oferta', 'Franjas Horarias Activas', reporte.totalHorarios || 0, ''],
    ];

    if (reporte.demandaPorMateria && reporte.demandaPorMateria.length > 0) {
      filas.push([]);
      filas.push(['DEMANDA POR MATERIA', 'TOTAL SOLICITUDES', 'FINALIZADAS', 'PENDIENTES', 'CARRERAS']);
      reporte.demandaPorMateria.forEach((item) => {
        filas.push([
          item.materia || 'Sin especificar',
          item.totalSolicitudes,
          item.finalizadas,
          item.pendientes,
          (item.carreras || []).join(' | '),
        ]);
      });
    }

    if (reporte.demandaPorTema && reporte.demandaPorTema.length > 0) {
      filas.push([]);
      filas.push(['DEMANDA POR TEMA (CONTENIDOS A FORTALECER)', 'MATERIA', 'TOTAL SOLICITUDES', 'FINALIZADAS', 'PENDIENTES']);
      reporte.demandaPorTema.forEach((item) => {
        filas.push([
          item.tema,
          item.materia,
          item.totalSolicitudes,
          item.finalizadas,
          item.pendientes,
        ]);
      });
    }

    if (reporte.demandaPorCarreraSemestre && reporte.demandaPorCarreraSemestre.length > 0) {
      filas.push([]);
      filas.push(['DEMANDA POR CARRERA Y SEMESTRE', 'SEMESTRE', 'TOTAL SOLICITUDES', 'MATERIAS PRINCIPALES']);
      reporte.demandaPorCarreraSemestre.forEach((item) => {
        filas.push([
          item.carrera,
          item.semestre ? `Semestre ${item.semestre}` : 'Sin semestre',
          item.totalSolicitudes,
          (item.materiasPrincipales || []).join(' | '),
        ]);
      });
    }

    const csvString =
      '\uFEFF' + filas.map((fila) => fila.map(escapeCsvCell).join(',')).join('\r\n');

    triggerFileDownload(csvString, `reporte-academico-${fechaArchivo}.csv`, 'text/csv;charset=utf-8;');
    setMensajeDescarga(`Reporte descargado en formato CSV (reporte-academico-${fechaArchivo}.csv).`);
    setTimeout(() => setMensajeDescarga(''), 3500);
  };

  const descargarReporteJSON = () => {
    if (!reporte) return;
    const fechaISO = reporte.fechaGeneracion || new Date().toISOString();
    const fechaArchivo = fechaISO.slice(0, 10);

    const payload = {
      titulo: 'Reporte Académico Institucional - Tutorías Pro',
      fechaGeneracion: fechaISO,
      filtros: reporte.filtros || {
        periodo: 'Global / Tiempo Real',
        carrera: carreraFiltro === 'todas' ? 'Todas' : carreraFiltro,
        semestre: semestreFiltro === 'todos' ? 'Todos' : semestreFiltro,
      },
      resultados: {
        usuarios: {
          totalUsuarios: reporte.totalUsuarios,
          totalEstudiantes: reporte.totalEstudiantes,
          totalProfesores: reporte.totalProfesores,
        },
        tutorias: {
          totalTutorias,
          finalizadas: reporte.tutoriasFinalizadas,
          porcentajeFinalizadas: pctFinalizadas,
          aceptadas: reporte.tutoriasAceptadas,
          porcentajeAceptadas: pctAceptadas,
          pendientes: reporte.tutoriasPendientes,
          porcentajePendientes: pctPendientes,
          aplazadas: reporte.tutoriasAplazadas || 0,
          canceladas: reporte.tutoriasCanceladas || 0,
          virtuales: reporte.tutoriasVirtuales || 0,
          presenciales: reporte.tutoriasPresenciales || 0,
          individuales: reporte.tutoriasIndividuales || 0,
          grupales: reporte.tutoriasGrupales || 0,
        },
        asistenciaYOferta: {
          asistenciasConfirmadas: reporte.asistenciasConfirmadas || 0,
          inasistenciasRegistradas: reporte.inasistenciasRegistradas || 0,
          totalRecursos: reporte.totalRecursos || 0,
          totalHorarios: reporte.totalHorarios || 0,
        },
        demandaPorMateria: reporte.demandaPorMateria || [],
        demandaPorTema: reporte.demandaPorTema || [],
        demandaPorCarreraSemestre: reporte.demandaPorCarreraSemestre || [],
      },
    };

    triggerFileDownload(
      JSON.stringify(payload, null, 2),
      `reporte-academico-${fechaArchivo}.json`,
      'application/json;charset=utf-8;'
    );
    setMensajeDescarga(`Reporte descargado en formato JSON (reporte-academico-${fechaArchivo}.json).`);
    setTimeout(() => setMensajeDescarga(''), 3500);
  };

  const maxSolicitudesMateria =
    reporte?.demandaPorMateria?.[0]?.totalSolicitudes || 1;
  const maxSolicitudesTema =
    reporte?.demandaPorTema?.[0]?.totalSolicitudes || 1;

  return (
    <div className="space-y-space-lg max-w-6xl mx-auto">
      <PageHeader
        eyebrow="04. Analítica Institucional"
        title="Reportes y Estadísticas Globales"
        description="Analiza la demanda de materias y temas por carrera y semestre, monitorea los KPIs operativos y descarga reportes completos."
        actions={
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <Badge variant={actualizando ? 'warning' : 'success'} dot={!actualizando} pulseDot={actualizando}>
              {actualizando ? 'Actualizando...' : 'Datos en Tiempo Real'}
            </Badge>
            <Button
              variant="primary"
              size="sm"
              onClick={descargarReporteCSV}
              className="flex-1 sm:flex-initial"
            >
              <Icon className="text-[16px]">download</Icon>
              <span>Descargar CSV</span>
            </Button>
            <Button
              variant="tonal"
              size="sm"
              onClick={descargarReporteJSON}
              className="flex-1 sm:flex-initial"
            >
              <Icon className="text-[16px]">data_object</Icon>
              <span>Descargar JSON</span>
            </Button>
          </div>
        }
      />

      {mensajeDescarga && (
        <CalloutBanner tone="success" title="Descarga completada">
          {mensajeDescarga}
        </CalloutBanner>
      )}

      {/* Filtros de Análisis por Carrera y Semestre (HU-22) */}
      <SurfaceCard tone="lowest" className="p-4 sm:p-space-md space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="font-label-md text-sm font-bold text-on-surface flex items-center gap-2">
              <Icon className="text-primary text-[18px]">filter_alt</Icon>
              <span>Segmentación de Demanda por Carrera y Semestre</span>
            </h2>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Filtra las solicitudes para identificar qué materias y temas concentran mayor demanda en cada programa y nivel.
            </p>
          </div>

          {hayFiltroActivo && (
            <Button
              variant="subtle"
              size="sm"
              onClick={() => aplicarFiltro('todas', 'todos')}
              className="self-start sm:self-auto"
            >
              <Icon className="text-[16px]">restart_alt</Icon>
              <span>Restablecer Filtros</span>
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormSelect
            id="filtro-reporte-carrera"
            label="Carrera Académica"
            icon="school"
            value={carreraFiltro}
            onChange={(e) => aplicarFiltro(e.target.value, semestreFiltro)}
          >
            <option value="todas">Todas las carreras</option>
            {(reporte?.carrerasDisponibles || []).map((car) => (
              <option key={car} value={car}>
                {car}
              </option>
            ))}
          </FormSelect>

          <FormSelect
            id="filtro-reporte-semestre"
            label="Semestre del Estudiante"
            icon="format_list_numbered"
            value={semestreFiltro}
            onChange={(e) => aplicarFiltro(carreraFiltro, e.target.value)}
          >
            <option value="todos">Todos los semestres</option>
            {(reporte?.semestresDisponibles || []).map((sem) => (
              <option key={sem} value={String(sem)}>
                Semestre {sem}
              </option>
            ))}
          </FormSelect>
        </div>

        {hayFiltroActivo && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="font-label-md text-[11px] uppercase tracking-wider text-outline font-semibold">
              Segmento activo:
            </span>
            {carreraFiltro !== 'todas' && (
              <Badge variant="primary" onRemove={() => aplicarFiltro('todas', semestreFiltro)}>
                Carrera: {carreraFiltro}
              </Badge>
            )}
            {semestreFiltro !== 'todos' && (
              <Badge variant="secondary" onRemove={() => aplicarFiltro(carreraFiltro, 'todos')}>
                Semestre: {semestreFiltro}
              </Badge>
            )}
          </div>
        )}
      </SurfaceCard>

      {/* KPI Metric Cards Canónicas (Sección 05 de code.html) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
        {/* Usuarios Registrados */}
        <SurfaceCard tone="lowest" className="p-4 sm:p-space-lg flex flex-col justify-between gap-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="font-label-md text-[12px] uppercase text-outline font-semibold tracking-wider block">
                Usuarios Registrados
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-headline-lg text-headline-lg font-bold text-on-surface">
                  {reporte?.totalUsuarios || 0}
                </span>
                <Badge variant="primary">Activos</Badge>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-primary-fixed flex items-center justify-center text-primary shrink-0">
              <Icon className="text-[26px]">group</Icon>
            </div>
          </div>

          <div className="p-space-sm rounded-lg bg-surface-container-low flex flex-wrap items-center justify-between gap-2 text-xs font-label-md">
            <span className="flex items-center gap-1.5 text-on-surface">
              <Icon className="text-[15px] text-primary">school</Icon>
              <span>Estudiantes: <strong>{reporte?.totalEstudiantes || 0}</strong></span>
            </span>
            <span className="flex items-center gap-1.5 text-on-surface">
              <Icon className="text-[15px] text-tertiary">psychology</Icon>
              <span>Profesores: <strong>{reporte?.totalProfesores || 0}</strong></span>
            </span>
          </div>
        </SurfaceCard>

        {/* Solicitudes Totales */}
        <SurfaceCard tone="lowest" className="p-4 sm:p-space-lg flex flex-col justify-between gap-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="font-label-md text-[12px] uppercase text-outline font-semibold tracking-wider block">
                {hayFiltroActivo ? 'Solicitudes del Segmento' : 'Solicitudes Totales'}
              </span>
              <div className="flex flex-wrap items-baseline gap-2 mt-1">
                <span className="font-headline-lg text-headline-lg font-bold text-on-surface">
                  {reporte?.totalTutorias || 0}
                </span>
                <Badge variant="warning" pulseDot>
                  {reporte?.tutoriasPendientes || 0} pendientes
                </Badge>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-tertiary-fixed flex items-center justify-center text-tertiary shrink-0">
              <Icon className="text-[26px]">pending_actions</Icon>
            </div>
          </div>

          <div className="p-space-sm rounded-lg bg-surface-container-low flex flex-wrap items-center justify-between gap-2 text-xs font-label-md text-on-surface-variant">
            <span>Pendientes por atender:</span>
            <strong className="text-tertiary font-bold">
              {reporte?.tutoriasPendientes || 0} solicitudes
            </strong>
          </div>
        </SurfaceCard>

        {/* Tutorías Completadas */}
        <SurfaceCard tone="lowest" className="p-4 sm:p-space-lg flex flex-col justify-between gap-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="font-label-md text-[12px] uppercase text-outline font-semibold tracking-wider block">
                Tutorías Completadas
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-headline-lg text-headline-lg font-bold text-on-surface">
                  {reporte?.tutoriasFinalizadas || 0}
                </span>
                <span className="inline-flex items-center gap-0.5 text-[12px] font-bold text-[#166534] bg-[#dcfce7] px-2 py-0.5 rounded-full">
                  <Icon className="text-[14px]">trending_up</Icon>
                  <span>{pctFinalizadas}%</span>
                </span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#dcfce7] flex items-center justify-center text-[#16a34a] shrink-0">
              <Icon className="text-[26px]">verified</Icon>
            </div>
          </div>

          <div className="p-space-sm rounded-lg bg-surface-container-low flex flex-wrap items-center justify-between gap-2 text-xs font-label-md text-on-surface-variant">
            <span>En curso (aceptadas):</span>
            <strong className="text-primary font-bold">
              {reporte?.tutoriasAceptadas || 0} sesiones
            </strong>
          </div>
        </SurfaceCard>
      </div>

      {/* Distribución Operativa de Sesiones */}
      <SurfaceCard tone="lowest" className="p-4 sm:p-space-lg space-y-space-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-surface-container">
          <div>
            <h2 className="font-label-md text-base font-bold text-on-surface flex items-center gap-2">
              <Icon className="text-primary text-[20px]">analytics</Icon>
              <span>Distribución de Estados de Tutorías</span>
            </h2>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Proporción de sesiones según su etapa dentro del flujo académico.
            </p>
          </div>
          <span className="font-mono text-xs text-outline">
            Total evaluadas: {totalTutorias}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
          <div className="p-space-md rounded-xl bg-surface-container-low space-y-2">
            <div className="flex justify-between items-center font-label-md text-xs">
              <span className="text-on-surface font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#16a34a]" />
                <span>Finalizadas</span>
              </span>
              <span className="font-bold text-[#166534]">
                {reporte?.tutoriasFinalizadas || 0} ({pctFinalizadas}%)
              </span>
            </div>
            <div className="w-full bg-surface-container-highest rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-[#16a34a] h-full rounded-full transition-all duration-500"
                style={{ width: `${pctFinalizadas}%` }}
              />
            </div>
          </div>

          <div className="p-space-md rounded-xl bg-surface-container-low space-y-2">
            <div className="flex justify-between items-center font-label-md text-xs">
              <span className="text-on-surface font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-primary" />
                <span>En Curso (Aceptadas)</span>
              </span>
              <span className="font-bold text-primary">
                {reporte?.tutoriasAceptadas || 0} ({pctAceptadas}%)
              </span>
            </div>
            <div className="w-full bg-surface-container-highest rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-primary h-full rounded-full transition-all duration-500"
                style={{ width: `${pctAceptadas}%` }}
              />
            </div>
          </div>

          <div className="p-space-md rounded-xl bg-surface-container-low space-y-2">
            <div className="flex justify-between items-center font-label-md text-xs">
              <span className="text-on-surface font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-tertiary" />
                <span>Pendientes de Revisión</span>
              </span>
              <span className="font-bold text-tertiary">
                {reporte?.tutoriasPendientes || 0} ({pctPendientes}%)
              </span>
            </div>
            <div className="w-full bg-surface-container-highest rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-tertiary h-full rounded-full transition-all duration-500"
                style={{ width: `${pctPendientes}%` }}
              />
            </div>
          </div>
        </div>
      </SurfaceCard>

      {/* HU-22: Análisis de Demanda por Materias y Temas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-md">
        {/* Card: Materias con Mayor Demanda */}
        <SurfaceCard tone="lowest" className="p-4 sm:p-space-lg space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-surface-container">
            <div>
              <h3 className="font-label-md text-base font-bold text-on-surface flex items-center gap-2">
                <Icon className="text-primary text-[20px]">leaderboard</Icon>
                <span>Materias con Mayor Demanda</span>
              </h3>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Asignaturas ordenadas por volumen de solicitudes recibidas.
              </p>
            </div>
            <Badge variant="neutral" className="self-start sm:self-auto shrink-0">
              {reporte?.demandaPorMateria?.length || 0} asignaturas
            </Badge>
          </div>

          {!reporte?.demandaPorMateria || reporte.demandaPorMateria.length === 0 ? (
            <p className="text-xs text-outline py-8 text-center">
              No hay solicitudes registradas para este segmento de carrera/semestre.
            </p>
          ) : (
            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {reporte.demandaPorMateria.map((item, idx) => {
                const anchoRelativo = Math.max(
                  8,
                  Math.round((item.totalSolicitudes / maxSolicitudesMateria) * 100)
                );
                return (
                  <div
                    key={`${item.materia}-${idx}`}
                    className="p-3 rounded-xl bg-surface-container-low space-y-2 text-xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-primary-fixed text-primary font-mono font-bold text-[11px] flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="font-label-md font-bold text-on-surface truncate">
                          {item.materia || 'Sin especificar'}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                        <Badge variant="primary">{item.totalSolicitudes} solicitudes</Badge>
                        <Badge variant="success">{item.finalizadas} fin.</Badge>
                        {item.pendientes > 0 && (
                          <Badge variant="warning">{item.pendientes} pend.</Badge>
                        )}
                      </div>
                    </div>

                    <div className="w-full bg-surface-container-highest rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-primary h-full rounded-full transition-all duration-500"
                        style={{ width: `${anchoRelativo}%` }}
                      />
                    </div>

                    {item.carreras && item.carreras.length > 0 && (
                      <p className="text-[11px] text-outline truncate">
                        Carreras: {item.carreras.join(', ')}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </SurfaceCard>

        {/* Card: Temas que Requieren Fortalecimiento */}
        <SurfaceCard tone="lowest" className="p-4 sm:p-space-lg space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-surface-container">
            <div>
              <h3 className="font-label-md text-base font-bold text-on-surface flex items-center gap-2">
                <Icon className="text-tertiary text-[20px]">topic</Icon>
                <span>Temas a Fortalecer</span>
              </h3>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Contenidos específicos con mayor recurrencia de consultas.
              </p>
            </div>
            <Badge variant="warning" className="self-start sm:self-auto shrink-0">
              {reporte?.demandaPorTema?.length || 0} temas
            </Badge>
          </div>

          {!reporte?.demandaPorTema || reporte.demandaPorTema.length === 0 ? (
            <p className="text-xs text-outline py-8 text-center">
              No hay temas registrados para este segmento de carrera/semestre.
            </p>
          ) : (
            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {reporte.demandaPorTema.map((item, idx) => {
                const anchoRelativo = Math.max(
                  8,
                  Math.round((item.totalSolicitudes / maxSolicitudesTema) * 100)
                );
                const esPrioritario = idx < 3 && item.totalSolicitudes >= 2;
                return (
                  <div
                    key={`${item.materia}-${item.tema}-${idx}`}
                    className="p-3 rounded-xl bg-surface-container-low space-y-2 text-xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1.5">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-label-md font-bold text-on-surface break-words">
                            {item.tema}
                          </span>
                          {esPrioritario && (
                            <Badge variant="tertiary">Alta demanda</Badge>
                          )}
                        </div>
                        <span className="text-[11px] text-primary font-medium block mt-0.5">
                          Materia: {item.materia}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <Badge variant="primary">{item.totalSolicitudes} solic.</Badge>
                        <Badge variant="neutral">{item.finalizadas} fin.</Badge>
                      </div>
                    </div>

                    <div className="w-full bg-surface-container-highest rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-tertiary h-full rounded-full transition-all duration-500"
                        style={{ width: `${anchoRelativo}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SurfaceCard>
      </div>

      {/* HU-22: Distribución por Carrera & Semestre + Detalle Operativo */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-space-md">
        <SurfaceCard tone="lowest" className="p-4 sm:p-space-lg lg:col-span-2 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-surface-container">
            <div>
              <h3 className="font-label-md text-base font-bold text-on-surface flex items-center gap-2">
                <Icon className="text-secondary text-[20px]">school</Icon>
                <span>Demanda según Carrera y Semestre</span>
              </h3>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Haz clic sobre cualquier bloque para filtrar automáticamente todo el tablero por ese grupo académico.
              </p>
            </div>
            <Badge variant="secondary" className="self-start sm:self-auto shrink-0">
              {reporte?.demandaPorCarreraSemestre?.length || 0} segmentos
            </Badge>
          </div>

          {!reporte?.demandaPorCarreraSemestre || reporte.demandaPorCarreraSemestre.length === 0 ? (
            <p className="text-xs text-outline py-8 text-center">
              Sin solicitudes para mostrar en esta segmentación.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
              {reporte.demandaPorCarreraSemestre.map((seg, idx) => {
                const tieneCarreraReal = seg.carrera !== 'Sin carrera registrada';
                const tieneSemestreReal =
                  typeof seg.semestre === 'number' && Number.isFinite(seg.semestre);

                return (
                  <button
                    key={`${seg.carrera}-${seg.semestre ?? 'none'}-${idx}`}
                    type="button"
                    onClick={() =>
                      aplicarFiltro(
                        tieneCarreraReal ? seg.carrera : 'todas',
                        tieneSemestreReal ? String(seg.semestre) : 'todos'
                      )
                    }
                    className="p-3 rounded-xl bg-surface-container-low hover:bg-primary-fixed/40 transition-colors text-left space-y-1.5 cursor-pointer group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="font-label-md text-xs font-bold text-on-surface group-hover:text-primary block truncate">
                          {seg.carrera}
                        </span>
                        <span className="text-[11px] font-mono text-outline block">
                          {tieneSemestreReal ? `Semestre ${seg.semestre}` : 'Semestre no especificado'}
                        </span>
                      </div>
                      <Badge variant="primary" className="shrink-0">
                        {seg.totalSolicitudes}
                      </Badge>
                    </div>

                    {seg.materiasPrincipales && seg.materiasPrincipales.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {seg.materiasPrincipales.slice(0, 3).map((mat, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded bg-surface-container-lowest text-[10px] font-label-md text-on-surface-variant truncate max-w-[150px]"
                          >
                            {mat}
                          </span>
                        ))}
                        {seg.materiasPrincipales.length > 3 && (
                          <span className="text-[10px] text-outline px-1">
                            +{seg.materiasPrincipales.length - 3} más
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </SurfaceCard>

        <SurfaceCard tone="lowest" className="p-4 sm:p-space-lg space-y-3">
          <h3 className="font-label-md text-base font-bold text-on-surface flex items-center gap-2 pb-2 border-b border-surface-container">
            <Icon className="text-primary text-[20px]">tune</Icon>
            <span>Detalle Operativo</span>
          </h3>
          <div className="space-y-2 text-xs font-label-md">
            <div className="p-2.5 rounded-lg bg-surface-container-low flex items-center justify-between">
              <span className="text-on-surface-variant">Modalidad Virtual / Presencial</span>
              <strong className="text-on-surface">
                {reporte?.tutoriasVirtuales || 0} / {reporte?.tutoriasPresenciales || 0}
              </strong>
            </div>
            <div className="p-2.5 rounded-lg bg-surface-container-low flex items-center justify-between">
              <span className="text-on-surface-variant">Tipo Individual / Grupal</span>
              <strong className="text-on-surface">
                {reporte?.tutoriasIndividuales || 0} / {reporte?.tutoriasGrupales || 0}
              </strong>
            </div>
            <div className="p-2.5 rounded-lg bg-surface-container-low flex items-center justify-between">
              <span className="text-on-surface-variant">Aplazadas / Canceladas</span>
              <strong className="text-on-surface">
                {reporte?.tutoriasAplazadas || 0} / {reporte?.tutoriasCanceladas || 0}
              </strong>
            </div>
            <div className="p-2.5 rounded-lg bg-surface-container-low flex items-center justify-between">
              <span className="text-on-surface-variant">Asistencias Confirmadas</span>
              <strong className="text-[#166534]">{reporte?.asistenciasConfirmadas || 0}</strong>
            </div>
            <div className="p-2.5 rounded-lg bg-surface-container-low flex items-center justify-between">
              <span className="text-on-surface-variant">Recursos / Franjas Horarias</span>
              <strong className="text-primary">
                {reporte?.totalRecursos || 0} / {reporte?.totalHorarios || 0}
              </strong>
            </div>
          </div>
        </SurfaceCard>
      </div>

      <CalloutBanner tone="info" title="Monitoreo Académico Institucional">
        Todas las tutorías finalizadas por el cuerpo docente publican automáticamente sus enlaces de
        material de apoyo en la Biblioteca Digital de su respectiva escuela.
      </CalloutBanner>
    </div>
  );
}
