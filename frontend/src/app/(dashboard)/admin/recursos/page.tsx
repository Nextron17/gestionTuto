'use client';

import { useCallback, useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import api from '../../../../lib/api';
import { Icon } from '../../../../components/ui/Icon';
import { PageHeader } from '../../../../components/ui/PageHeader';
import { SearchInput } from '../../../../components/ui/SearchInput';
import { FormSelect } from '../../../../components/ui/FormField';
import { SurfaceCard } from '../../../../components/ui/SurfaceCard';
import { CalloutBanner } from '../../../../components/ui/CalloutBanner';
import { EscuelaCatalogo, RecursoItem } from '../../../../components/admin/recursos/types';
import { TablaRecursosAdmin } from '../../../../components/admin/recursos/TablaRecursosAdmin';
import { ModalesRecursoAdmin } from '../../../../components/admin/recursos/ModalesRecursoAdmin';

export default function AdminRecursosPage() {
  const [recursos, setRecursos] = useState<RecursoItem[]>([]);
  const [escuelas, setEscuelas] = useState<EscuelaCatalogo[]>([]);
  const [cargando, setCargando] = useState(true);

  const [busqueda, setBusqueda] = useState('');
  const [escuelaFiltro, setEscuelaFiltro] = useState<string>('todas');
  const [origenFiltro, setOrigenFiltro] = useState<'todos' | 'clase' | 'manual'>('todos');
  const [mensajeFeedback, setMensajeFeedback] = useState('');

  const [recursoEditando, setRecursoEditando] = useState<RecursoItem | null>(null);
  const [tituloForm, setTituloForm] = useState('');
  const [escuelaForm, setEscuelaForm] = useState('');
  const [materiaForm, setMateriaForm] = useState('');
  const [temaForm, setTemaForm] = useState('');
  const [tipoForm, setTipoForm] = useState<'video' | 'guia' | 'documento' | 'enlace'>('enlace');
  const [claseOrigenForm, setClaseOrigenForm] = useState('');
  const [linkForm, setLinkForm] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState('');

  const [recursoAEliminar, setRecursoAEliminar] = useState<RecursoItem | null>(null);
  const [eliminando, setEliminando] = useState(false);

  const cargarDatosAPI = useCallback(async () => {
    try {
      const [resRecursos, resCatalogo] = await Promise.all([
        api.get('/admin/recursos'),
        api.get('/admin/catalogo'),
      ]);
      setRecursos(resRecursos.data || []);
      setEscuelas(resCatalogo.data?.escuelas || []);
    } catch (err) {
      console.error('Error al cargar recursos de administración:', err);
    }
  }, []);

  useEffect(() => {
    const inicializar = async () => {
      await cargarDatosAPI();
      setCargando(false);
    };
    inicializar();
  }, [cargarDatosAPI]);

  const mostrarFeedback = (msg: string) => {
    setMensajeFeedback(msg);
    setTimeout(() => setMensajeFeedback(''), 3500);
  };

  const abrirModalEditar = (recurso: RecursoItem) => {
    setRecursoEditando(recurso);
    setTituloForm(recurso.titulo || '');
    setEscuelaForm(recurso.escuela || 'General');
    setMateriaForm(recurso.materia || '');
    setTemaForm(recurso.tema || '');
    setTipoForm(recurso.tipo || 'enlace');
    setClaseOrigenForm(recurso.claseOrigen || '');
    setLinkForm(recurso.link || '');
    setErrorForm('');
  };

  const guardarEdicion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recursoEditando) return;
    setErrorForm('');
    setGuardando(true);

    try {
      await api.put(`/admin/recursos/${recursoEditando._id}`, {
        titulo: tituloForm,
        escuela: escuelaForm,
        materia: materiaForm,
        tema: temaForm,
        tipo: tipoForm,
        claseOrigen: claseOrigenForm,
        link: linkForm,
      });
      setRecursoEditando(null);
      await cargarDatosAPI();
      mostrarFeedback('Recurso académico actualizado y verificado correctamente.');
    } catch (err) {
      const axiosErr = err as AxiosError<{ message: string }>;
      setErrorForm(axiosErr.response?.data?.message || 'Error al actualizar el recurso.');
    } finally {
      setGuardando(false);
    }
  };

  const confirmarEliminacion = async () => {
    if (!recursoAEliminar) return;
    setEliminando(true);
    try {
      await api.delete(`/admin/recursos/${recursoAEliminar._id}`);
      const tituloEliminado = recursoAEliminar.titulo;
      setRecursoAEliminar(null);
      await cargarDatosAPI();
      mostrarFeedback(`El recurso "${tituloEliminado}" fue eliminado de la biblioteca.`);
    } catch (err) {
      console.error('Error al eliminar recurso:', err);
    } finally {
      setEliminando(false);
    }
  };

  const nombresEscuelasDisponibles = Array.from(
    new Set([
      ...escuelas.map((e) => e.nombre),
      ...recursos.map((r) => r.escuela).filter(Boolean),
    ])
  ).sort((a, b) => a.localeCompare(b));

  const recursosFiltrados = recursos.filter((r) => {
    const okEscuela = escuelaFiltro === 'todas' || r.escuela === escuelaFiltro;
    const esDeClase = Boolean(r.claseOrigen && r.claseOrigen.trim() !== '');
    const okOrigen =
      origenFiltro === 'todos' ||
      (origenFiltro === 'clase' && esDeClase) ||
      (origenFiltro === 'manual' && !esDeClase);

    const q = busqueda.toLowerCase().trim();
    if (!q) return okEscuela && okOrigen;

    const okTexto =
      r.titulo.toLowerCase().includes(q) ||
      r.materia.toLowerCase().includes(q) ||
      (r.tema && r.tema.toLowerCase().includes(q)) ||
      (r.escuela && r.escuela.toLowerCase().includes(q)) ||
      (r.claseOrigen && r.claseOrigen.toLowerCase().includes(q)) ||
      (r.profesor?.nombre && r.profesor.nombre.toLowerCase().includes(q)) ||
      (r.profesor?.email && r.profesor.email.toLowerCase().includes(q)) ||
      r.link.toLowerCase().includes(q);

    return okEscuela && okOrigen && okTexto;
  });

  const totalDeClase = recursos.filter(
    (r) => r.claseOrigen && r.claseOrigen.trim() !== ''
  ).length;
  const totalManuales = recursos.length - totalDeClase;

  if (cargando) {
    return (
      <div className="max-w-6xl mx-auto py-8 text-sm text-on-surface-variant flex items-center gap-2">
        <Icon className="text-primary animate-pulse">hourglass_top</Icon>
        <span>Cargando repositorio de recursos académicos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-space-lg max-w-6xl mx-auto">
      <PageHeader
        eyebrow="03. Curaduría de Contenidos"
        title="Administración de Recursos Académicos"
        description="Revisa, edita y retira los materiales publicados por los docentes para asegurar que todo el contenido recomendado sea pertinente y vigente."
        actions={
          <div className="w-full sm:w-80">
            <SearchInput
              placeholder="Buscar por título, materia, docente o URL..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              onClear={() => setBusqueda('')}
            />
          </div>
        }
      />

      {mensajeFeedback && (
        <CalloutBanner tone="success" title="Biblioteca actualizada">
          {mensajeFeedback}
        </CalloutBanner>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-md">
        <SurfaceCard tone="lowest" className="p-4 sm:p-space-md flex items-center justify-between gap-3">
          <div>
            <span className="font-label-md text-[11px] uppercase text-outline font-semibold tracking-wider block">
              Total Publicados
            </span>
            <span className="font-headline-lg text-2xl font-bold text-on-surface mt-1 block">
              {recursos.length}
            </span>
            <span className="text-on-surface-variant font-label-md text-[11px] mt-0.5 block">
              Activos en biblioteca digital
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-primary-fixed text-primary flex items-center justify-center shrink-0">
            <Icon className="text-[22px]">library_books</Icon>
          </div>
        </SurfaceCard>

        <SurfaceCard tone="lowest" className="p-4 sm:p-space-md flex items-center justify-between gap-3">
          <div>
            <span className="font-label-md text-[11px] uppercase text-outline font-semibold tracking-wider block">
              Desde Clases Finalizadas
            </span>
            <span className="font-headline-lg text-2xl font-bold text-on-surface mt-1 block">
              {totalDeClase}
            </span>
            <span className="text-on-surface-variant font-label-md text-[11px] mt-0.5 block">
              Materiales y grabaciones de sesión
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[#dcfce7] text-[#16a34a] flex items-center justify-center shrink-0">
            <Icon className="text-[22px]">cast_for_education</Icon>
          </div>
        </SurfaceCard>

        <SurfaceCard tone="lowest" className="p-4 sm:p-space-md flex items-center justify-between gap-3">
          <div>
            <span className="font-label-md text-[11px] uppercase text-outline font-semibold tracking-wider block">
              Publicación Directa
            </span>
            <span className="font-headline-lg text-2xl font-bold text-on-surface mt-1 block">
              {totalManuales}
            </span>
            <span className="text-on-surface-variant font-label-md text-[11px] mt-0.5 block">
              Guías y enlaces recomendados
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-secondary-fixed text-secondary flex items-center justify-center shrink-0">
            <Icon className="text-[22px]">upload_file</Icon>
          </div>
        </SurfaceCard>
      </div>

      <SurfaceCard tone="lowest" className="p-4 sm:p-space-md space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md items-end">
          <div className="md:col-span-2 space-y-1.5">
            <span className="font-label-md text-[11px] font-semibold text-outline uppercase tracking-wider block">
              Filtrar por Escuela o Facultad
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setEscuelaFiltro('todas')}
                className={`px-3 py-1.5 rounded-full font-label-md text-xs font-semibold transition-all cursor-pointer active:scale-95 ${
                  escuelaFiltro === 'todas'
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface'
                }`}
              >
                Todas ({recursos.length})
              </button>
              {nombresEscuelasDisponibles.map((nombreEsc) => {
                const count = recursos.filter((r) => r.escuela === nombreEsc).length;
                return (
                  <button
                    key={nombreEsc}
                    type="button"
                    onClick={() => setEscuelaFiltro(nombreEsc)}
                    className={`px-3 py-1.5 rounded-full font-label-md text-xs font-semibold transition-all cursor-pointer active:scale-95 ${
                      escuelaFiltro === nombreEsc
                        ? 'bg-primary text-on-primary shadow-xs'
                        : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface'
                    }`}
                  >
                    {nombreEsc} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          <FormSelect
            id="filtro-origen-admin"
            label="Origen del Recurso"
            icon="filter_list"
            value={origenFiltro}
            onChange={(e) => setOrigenFiltro(e.target.value as 'todos' | 'clase' | 'manual')}
          >
            <option value="todos">Todos los orígenes</option>
            <option value="clase">Desde clases finalizadas</option>
            <option value="manual">Publicación directa docente</option>
          </FormSelect>
        </div>
      </SurfaceCard>

      <TablaRecursosAdmin
        recursosTotalCount={recursos.length}
        recursosFiltrados={recursosFiltrados}
        abrirModalEditar={abrirModalEditar}
        setRecursoAEliminar={setRecursoAEliminar}
      />

      <ModalesRecursoAdmin
        recursoEditando={recursoEditando}
        cerrarModalEditar={() => setRecursoEditando(null)}
        guardarEdicion={guardarEdicion}
        guardando={guardando}
        errorForm={errorForm}
        tituloForm={tituloForm}
        setTituloForm={setTituloForm}
        escuelaForm={escuelaForm}
        setEscuelaForm={setEscuelaForm}
        nombresEscuelasDisponibles={nombresEscuelasDisponibles}
        materiaForm={materiaForm}
        setMateriaForm={setMateriaForm}
        temaForm={temaForm}
        setTemaForm={setTemaForm}
        tipoForm={tipoForm}
        setTipoForm={setTipoForm}
        claseOrigenForm={claseOrigenForm}
        setClaseOrigenForm={setClaseOrigenForm}
        linkForm={linkForm}
        setLinkForm={setLinkForm}
        recursoAEliminar={recursoAEliminar}
        cerrarModalEliminar={() => setRecursoAEliminar(null)}
        confirmarEliminacion={confirmarEliminacion}
        eliminando={eliminando}
      />
    </div>
  );
}
