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
import {
  ReporteData,
  exportarReporteCSV,
  exportarReporteJSON,
} from '../../../../components/admin/reportes/types';
import { MetricasDistribucionSection } from '../../../../components/admin/reportes/MetricasDistribucionSection';
import { DemandaAcademicaSection } from '../../../../components/admin/reportes/DemandaAcademicaSection';

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
    const filename = exportarReporteCSV(reporte, pctFinalizadas, pctAceptadas, pctPendientes);
    setMensajeDescarga(`Reporte descargado en formato CSV (${filename}).`);
    setTimeout(() => setMensajeDescarga(''), 3500);
  };

  const descargarReporteJSON = () => {
    if (!reporte) return;
    const filename = exportarReporteJSON(
      reporte,
      carreraFiltro,
      semestreFiltro,
      pctFinalizadas,
      pctAceptadas,
      pctPendientes
    );
    setMensajeDescarga(`Reporte descargado en formato JSON (${filename}).`);
    setTimeout(() => setMensajeDescarga(''), 3500);
  };

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

      <MetricasDistribucionSection
        reporte={reporte}
        hayFiltroActivo={hayFiltroActivo}
        totalTutorias={totalTutorias}
        pctFinalizadas={pctFinalizadas}
        pctAceptadas={pctAceptadas}
        pctPendientes={pctPendientes}
      />

      <DemandaAcademicaSection
        reporte={reporte}
        aplicarFiltro={aplicarFiltro}
      />

      <CalloutBanner tone="info" title="Monitoreo Académico Institucional">
        Todas las tutorías finalizadas por el cuerpo docente publican automáticamente sus enlaces de
        material de apoyo en la Biblioteca Digital de su respectiva escuela.
      </CalloutBanner>
    </div>
  );
}
