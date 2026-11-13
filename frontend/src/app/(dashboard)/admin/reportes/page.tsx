'use client';

import { useEffect, useState } from 'react';
import api from '../../../../lib/api';
import { Icon } from '../../../../components/ui/Icon';
import { PageHeader } from '../../../../components/ui/PageHeader';
import { SurfaceCard } from '../../../../components/ui/SurfaceCard';
import { Badge } from '../../../../components/ui/Badge';
import { CalloutBanner } from '../../../../components/ui/CalloutBanner';

interface ReporteData {
  totalUsuarios: number;
  totalEstudiantes: number;
  totalProfesores: number;
  totalTutorias: number;
  tutoriasPendientes: number;
  tutoriasAceptadas: number;
  tutoriasFinalizadas: number;
}

export default function AdminReportesPage() {
  const [reporte, setReporte] = useState<ReporteData | null>(null);
  const [cargando, setCargando] = useState(true);

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

  return (
    <div className="space-y-space-lg max-w-6xl mx-auto">
      <PageHeader
        eyebrow="03. Analítica Institucional"
        title="Reportes y Estadísticas Globales"
        description="Indicadores clave de rendimiento (KPIs), adopción de usuarios y estado operativo de las tutorías."
        actions={
          <Badge variant="success" dot>
            Datos en Tiempo Real
          </Badge>
        }
      />

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

      <CalloutBanner tone="info" title="Monitoreo Académico Institucional">
        Todas las tutorías finalizadas por el cuerpo docente publican automáticamente sus enlaces de
        material de apoyo en la Biblioteca Digital de su respectiva escuela.
      </CalloutBanner>
    </div>
  );
}
