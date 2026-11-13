'use client';

import { Icon } from '../../ui/Icon';
import { SurfaceCard } from '../../ui/SurfaceCard';
import { Badge } from '../../ui/Badge';
import { ReporteData } from './types';

interface MetricasDistribucionSectionProps {
  reporte: ReporteData | null;
  hayFiltroActivo: boolean;
  totalTutorias: number;
  pctFinalizadas: number;
  pctAceptadas: number;
  pctPendientes: number;
}

export function MetricasDistribucionSection({
  reporte,
  hayFiltroActivo,
  totalTutorias,
  pctFinalizadas,
  pctAceptadas,
  pctPendientes,
}: MetricasDistribucionSectionProps) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
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
    </>
  );
}

