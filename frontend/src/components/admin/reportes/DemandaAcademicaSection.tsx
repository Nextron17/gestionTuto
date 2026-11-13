'use client';

import { Icon } from '../../ui/Icon';
import { SurfaceCard } from '../../ui/SurfaceCard';
import { Badge } from '../../ui/Badge';
import { ReporteData } from './types';

interface DemandaAcademicaSectionProps {
  reporte: ReporteData | null;
  aplicarFiltro: (nuevaCarrera: string, nuevoSemestre: string) => void;
}

export function DemandaAcademicaSection({
  reporte,
  aplicarFiltro,
}: DemandaAcademicaSectionProps) {
  const maxSolicitudesMateria =
    reporte?.demandaPorMateria?.[0]?.totalSolicitudes || 1;
  const maxSolicitudesTema =
    reporte?.demandaPorTema?.[0]?.totalSolicitudes || 1;

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-md">
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
    </>
  );
}
