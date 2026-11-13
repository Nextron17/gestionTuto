'use client';

import { useEffect, useState } from 'react';
import api from '../../../../lib/api';
import { Icon } from '../../../../components/ui/Icon';
import { PageHeader } from '../../../../components/ui/PageHeader';
import { SurfaceCard } from '../../../../components/ui/SurfaceCard';
import { Badge } from '../../../../components/ui/Badge';
import { Button } from '../../../../components/ui/Button';
import { CalloutBanner } from '../../../../components/ui/CalloutBanner';

interface DemandaMateria {
  materia: string;
  totalSolicitudes: number;
  finalizadas: number;
  pendientes: number;
}

interface ReporteData {
  fechaGeneracion?: string;
  filtros?: {
    periodo?: string;
  };
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
  const [mensajeDescarga, setMensajeDescarga] = useState('');

  useEffect(() => {
    const cargarReportes = async () => {
      try {
        const res = await api.get('/admin/reportes');
        setReporte(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setCargando(false);
      }
    };
    cargarReportes();
  }, []);

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

  const descargarReporteCSV = () => {
    if (!reporte) return;
    const fechaISO = reporte.fechaGeneracion || new Date().toISOString();
    const fechaLegible = new Date(fechaISO).toLocaleString('es-CO');
    const fechaArchivo = fechaISO.slice(0, 10);

    const filas: Array<Array<string | number>> = [
      ['REPORTE ACADÉMICO INSTITUCIONAL - TUTORÍAS PRO'],
      ['Fecha de Generación', fechaLegible],
      ['Filtros Aplicados', reporte.filtros?.periodo || 'Global / Tiempo Real'],
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
      filas.push(['DEMANDA POR MATERIA', 'TOTAL SOLICITUDES', 'FINALIZADAS', 'PENDIENTES']);
      reporte.demandaPorMateria.forEach((item) => {
        filas.push([
          item.materia || 'Sin especificar',
          item.totalSolicitudes,
          item.finalizadas,
          item.pendientes,
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
      filtros: reporte.filtros || { periodo: 'Global / Tiempo Real' },
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

  return (
    <div className="space-y-space-lg max-w-6xl mx-auto">
      <PageHeader
        eyebrow="03. Analítica Institucional"
        title="Reportes y Estadísticas Globales"
        description="Indicadores clave de rendimiento (KPIs), adopción de usuarios y estado operativo de las tutorías."
        actions={
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <Badge variant="success" dot>
              Datos en Tiempo Real
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
                Solicitudes Totales
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
            Total registradas: {totalTutorias}
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

      {/* Métricas Operativas Complementarias y Demanda por Materia */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-space-md">
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

        <SurfaceCard tone="lowest" className="p-4 sm:p-space-lg lg:col-span-2 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-surface-container">
            <h3 className="font-label-md text-base font-bold text-on-surface flex items-center gap-2">
              <Icon className="text-primary text-[20px]">leaderboard</Icon>
              <span>Demanda de Tutorías por Materia</span>
            </h3>
            <Badge variant="neutral">
              {reporte?.demandaPorMateria?.length || 0} asignaturas
            </Badge>
          </div>

          {!reporte?.demandaPorMateria || reporte.demandaPorMateria.length === 0 ? (
            <p className="text-xs text-outline py-6 text-center">
              Aún no hay solicitudes registradas para desglosar demanda por materia.
            </p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {reporte.demandaPorMateria.map((item, idx) => (
                <div
                  key={`${item.materia}-${idx}`}
                  className="p-3 rounded-xl bg-surface-container-low flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <span className="font-label-md font-bold text-on-surface truncate">
                    {item.materia || 'Sin especificar'}
                  </span>
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <Badge variant="primary">{item.totalSolicitudes} solicitudes</Badge>
                    <Badge variant="success">{item.finalizadas} finalizadas</Badge>
                    <Badge variant="warning">{item.pendientes} pendientes</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SurfaceCard>
      </div>

      <CalloutBanner tone="info" title="Monitoreo Académico Institucional">
        Todas las tutorías finalizadas por el cuerpo docente publican automáticamente sus enlaces de
        material de apoyo en la Biblioteca Digital de su respectiva escuela.
      </CalloutBanner>
    </div>
  );
}
