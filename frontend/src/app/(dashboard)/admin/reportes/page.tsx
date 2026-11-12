'use client';

import { useEffect, useState } from 'react';
import api from '../../../../lib/api';

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
    return <div className="text-gray-500">Generando métricas del sistema...</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Reportes y Estadísticas Globales</h1>
        <p className="text-sm text-gray-500">Resumen de actividad y uso del sistema de tutorías</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <span className="text-xs font-bold text-gray-400 uppercase">Usuarios Registrados</span>
          <p className="text-3xl font-extrabold text-gray-800 mt-2">{reporte?.totalUsuarios || 0}</p>
          <div className="mt-4 text-xs text-gray-500 flex justify-between border-t pt-2">
            <span>Estudiantes: {reporte?.totalEstudiantes || 0}</span>
            <span>Profesores: {reporte?.totalProfesores || 0}</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <span className="text-xs font-bold text-gray-400 uppercase">Solicitudes Totales</span>
          <p className="text-3xl font-extrabold text-purple-600 mt-2">{reporte?.totalTutorias || 0}</p>
          <p className="mt-4 text-xs text-gray-500 border-t pt-2">
            Pendientes por atender: {reporte?.tutoriasPendientes || 0}
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <span className="text-xs font-bold text-gray-400 uppercase">Tutorías Completadas</span>
          <p className="text-3xl font-extrabold text-emerald-600 mt-2">{reporte?.tutoriasFinalizadas || 0}</p>
          <p className="mt-4 text-xs text-gray-500 border-t pt-2">
            En curso (aceptadas): {reporte?.tutoriasAceptadas || 0}
          </p>
        </div>
      </div>
    </div>
  );
}