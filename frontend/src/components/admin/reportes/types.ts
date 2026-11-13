export interface DemandaMateria {
  materia: string;
  totalSolicitudes: number;
  finalizadas: number;
  pendientes: number;
  carreras?: string[];
}

export interface DemandaTema {
  materia: string;
  tema: string;
  totalSolicitudes: number;
  finalizadas: number;
  pendientes: number;
}

export interface DemandaCarreraSemestre {
  carrera: string;
  semestre?: number | null;
  totalSolicitudes: number;
  materiasPrincipales?: string[];
}

export interface ReporteData {
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

export function escapeCsvCell(value: unknown): string {
  const str = String(value ?? '');
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function triggerFileDownload(content: string, filename: string, mimeType: string) {
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

export function exportarReporteCSV(
  reporte: ReporteData,
  pctFinalizadas: number,
  pctAceptadas: number,
  pctPendientes: number
): string {
  const totalTutorias = reporte.totalTutorias || 0;
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

  const filename = `reporte-academico-${fechaArchivo}.csv`;
  triggerFileDownload(csvString, filename, 'text/csv;charset=utf-8;');
  return filename;
}

export function exportarReporteJSON(
  reporte: ReporteData,
  carreraFiltro: string,
  semestreFiltro: string,
  pctFinalizadas: number,
  pctAceptadas: number,
  pctPendientes: number
): string {
  const totalTutorias = reporte.totalTutorias || 0;
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

  const filename = `reporte-academico-${fechaArchivo}.json`;
  triggerFileDownload(
    JSON.stringify(payload, null, 2),
    filename,
    'application/json;charset=utf-8;'
  );
  return filename;
}
