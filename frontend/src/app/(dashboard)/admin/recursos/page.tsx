'use client';

import { useCallback, useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import api from '../../../../lib/api';
import { Icon } from '../../../../components/ui/Icon';
import { PageHeader } from '../../../../components/ui/PageHeader';
import { SearchInput } from '../../../../components/ui/SearchInput';
import { FormInput, FormSelect } from '../../../../components/ui/FormField';
import { SurfaceCard } from '../../../../components/ui/SurfaceCard';
import { Badge } from '../../../../components/ui/Badge';
import { Button } from '../../../../components/ui/Button';
import { Modal } from '../../../../components/ui/Modal';
import { CalloutBanner } from '../../../../components/ui/CalloutBanner';

interface ProfesorInfo {
  _id: string;
  nombre: string;
  email: string;
  escuela?: string;
  carrera?: string;
}

interface RecursoItem {
  _id: string;
  titulo: string;
  escuela: string;
  materia: string;
  tema?: string;
  tipo?: 'video' | 'guia' | 'documento' | 'enlace';
  claseOrigen?: string;
  link: string;
  profesor?: ProfesorInfo;
  createdAt?: string;
  updatedAt?: string;
}

interface EscuelaCatalogo {
  _id: string;
  nombre: string;
  codigo: string;
}

function getInitials(name?: string): string {
  if (!name) return 'DOC';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
}

function formatFecha(fecha?: string): string {
  if (!fecha) return 'Fecha desconocida';
  const date = new Date(fecha);
  if (Number.isNaN(date.getTime())) return 'Fecha desconocida';
  return date.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function AdminRecursosPage() {
  const [recursos, setRecursos] = useState<RecursoItem[]>([]);
  const [escuelas, setEscuelas] = useState<EscuelaCatalogo[]>([]);
  const [cargando, setCargando] = useState(true);

  const [busqueda, setBusqueda] = useState('');
  const [escuelaFiltro, setEscuelaFiltro] = useState<string>('todas');
  const [origenFiltro, setOrigenFiltro] = useState<'todos' | 'clase' | 'manual'>('todos');
  const [mensajeFeedback, setMensajeFeedback] = useState('');

  // Estado Modal Edición / Revisión
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

  // Estado Modal Eliminación
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

  // Combinar escuelas del catálogo con las escuelas existentes en los recursos
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

      {/* Métricas Rápidas de Curaduría */}
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

      {/* Filtros por Escuela y Origen */}
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

      {/* Tabla Canónica (Desktop) + Tarjetas (Mobile) */}
      <SurfaceCard tone="lowest" className="overflow-hidden">
        {recursosFiltrados.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <Icon className="text-outline text-[36px]">folder_off</Icon>
            <p className="text-sm text-on-surface-variant">
              No se encontraron recursos publicados con los filtros seleccionados.
            </p>
          </div>
        ) : (
          <>
            {/* Vista Mobile: Tarjetas (< md) */}
            <div className="md:hidden divide-y divide-surface-container">
              {recursosFiltrados.map((r) => (
                <div
                  key={r._id}
                  className="p-4 space-y-3 hover:bg-surface-container-low/60 transition-colors"
                >
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant="neutral" pill={false} className="capitalize">
                      {r.tipo || 'enlace'}
                    </Badge>
                    <Badge variant="primary" pill={false}>
                      {r.escuela || 'General'}
                    </Badge>
                    {r.claseOrigen && (
                      <Badge variant="success" dot>
                        {r.claseOrigen}
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-1 min-w-0">
                    <h3 className="font-label-md text-sm font-bold text-on-surface break-words">
                      {r.titulo}
                    </h3>
                    <p className="text-xs text-primary font-semibold flex flex-wrap items-center gap-1">
                      <Icon className="text-[14px] shrink-0">menu_book</Icon>
                      <span>
                        {r.materia} {r.tema ? `• ${r.tema}` : ''}
                      </span>
                    </p>
                    <a
                      href={r.link}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-outline hover:text-primary underline break-all block font-mono"
                    >
                      {r.link}
                    </a>
                  </div>

                  <div className="p-2.5 rounded-lg bg-surface-container-low flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-bold text-[11px] flex items-center justify-center shrink-0">
                        {getInitials(r.profesor?.nombre)}
                      </div>
                      <div className="min-w-0">
                        <span className="block font-semibold text-on-surface truncate">
                          {r.profesor?.nombre || 'Docente no disponible'}
                        </span>
                        <span className="block text-[11px] text-outline truncate">
                          Publicado el {formatFecha(r.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <a
                      href={r.link}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-surface-container hover:bg-primary-fixed text-on-surface hover:text-primary font-label-md text-xs font-semibold transition-colors"
                    >
                      <Icon className="text-[16px]">open_in_new</Icon>
                      <span>Abrir</span>
                    </a>
                    <Button
                      variant="tonal"
                      size="sm"
                      onClick={() => abrirModalEditar(r)}
                      className="flex-1"
                    >
                      <Icon className="text-[16px]">edit</Icon>
                      <span>Editar</span>
                    </Button>
                    <button
                      type="button"
                      onClick={() => setRecursoAEliminar(r)}
                      aria-label={`Eliminar ${r.titulo}`}
                      className="p-2 rounded-lg bg-surface-container hover:bg-error-container text-outline hover:text-error inline-flex items-center justify-center transition-colors cursor-pointer shrink-0"
                    >
                      <Icon className="text-[18px]">delete</Icon>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Vista Desktop: Tabla Canónica (md+) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left font-body-md text-body-md">
                <thead>
                  <tr className="bg-surface-container-low text-outline font-label-md text-[11px] uppercase tracking-wider">
                    <th className="py-3.5 px-space-md font-semibold">Recurso &amp; Enlace</th>
                    <th className="py-3.5 px-space-md font-semibold">Escuela &amp; Asignatura</th>
                    <th className="py-3.5 px-space-md font-semibold">Docente Autor</th>
                    <th className="py-3.5 px-space-md font-semibold text-right">
                      Revisión &amp; Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="text-[13px]">
                  {recursosFiltrados.map((r, idx) => (
                    <tr
                      key={r._id}
                      className={`hover:bg-surface-container-low transition-colors group align-top ${
                        idx % 2 === 1 ? 'bg-surface-container-lowest/60' : ''
                      }`}
                    >
                      <td className="py-3.5 px-space-md max-w-xs">
                        <div className="space-y-1 min-w-0">
                          <span className="font-label-md font-bold text-on-surface block break-words">
                            {r.titulo}
                          </span>
                          <a
                            href={r.link}
                            target="_blank"
                            rel="noreferrer"
                            className="font-mono text-[11px] text-primary hover:underline truncate block"
                            title={r.link}
                          >
                            {r.link}
                          </a>
                          <span className="text-[11px] text-outline flex items-center gap-1">
                            <Icon className="text-[13px]">calendar_today</Icon>
                            <span>Publicado: {formatFecha(r.createdAt)}</span>
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-space-md">
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <Badge variant="neutral" pill={false} className="capitalize">
                              {r.tipo || 'enlace'}
                            </Badge>
                            <Badge variant="primary" pill={false}>
                              {r.escuela || 'General'}
                            </Badge>
                            {r.claseOrigen && (
                              <Badge variant="success" dot>
                                {r.claseOrigen}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs font-medium text-on-surface">
                            {r.materia}
                            {r.tema && (
                              <span className="text-on-surface-variant font-normal">
                                {' '}
                                • {r.tema}
                              </span>
                            )}
                          </p>
                        </div>
                      </td>

                      <td className="py-3.5 px-space-md">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-bold flex items-center justify-center text-[11px] shrink-0">
                            {getInitials(r.profesor?.nombre)}
                          </div>
                          <div className="min-w-0">
                            <span className="block font-semibold text-on-surface font-label-md text-xs truncate">
                              {r.profesor?.nombre || 'Docente no disponible'}
                            </span>
                            <span className="block text-outline text-[11px] truncate">
                              {r.profesor?.email || 'Sin correo'}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-space-md text-right">
                        <div className="flex items-center justify-end gap-1">
                          <a
                            href={r.link}
                            target="_blank"
                            rel="noreferrer"
                            className="w-8 h-8 rounded-lg hover:bg-surface-container flex items-center justify-center text-outline hover:text-primary transition-colors"
                            title="Verificar enlace en nueva pestaña"
                          >
                            <Icon className="text-[18px]">open_in_new</Icon>
                          </a>
                          <button
                            type="button"
                            onClick={() => abrirModalEditar(r)}
                            className="w-8 h-8 rounded-lg hover:bg-surface-container flex items-center justify-center text-outline hover:text-primary transition-colors cursor-pointer"
                            title="Revisar y Editar Recurso"
                          >
                            <Icon className="text-[18px]">edit</Icon>
                          </button>
                          <button
                            type="button"
                            onClick={() => setRecursoAEliminar(r)}
                            className="w-8 h-8 rounded-lg hover:bg-error-container flex items-center justify-center text-outline hover:text-error transition-colors cursor-pointer"
                            title="Eliminar Recurso"
                          >
                            <Icon className="text-[18px]">delete</Icon>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-4 sm:px-space-md py-3 bg-surface-container-low flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 font-label-md text-[12px] text-outline">
              <span>
                Mostrando {recursosFiltrados.length} de {recursos.length} recursos publicados
              </span>
              <span className="flex items-center gap-1">
                <Icon className="text-[15px] text-primary">verified</Icon>
                <span>Control de Pertinencia y Vigencia</span>
              </span>
            </div>
          </>
        )}
      </SurfaceCard>

      {/* Modal Canónico de Revisión y Edición */}
      <Modal
        open={Boolean(recursoEditando)}
        onClose={() => setRecursoEditando(null)}
        title="Revisar y Editar Recurso Académico"
        subtitle={
          recursoEditando
            ? `Publicado por ${recursoEditando.profesor?.nombre || 'Docente'} • ${formatFecha(
                recursoEditando.createdAt
              )}`
            : ''
        }
        icon="edit_document"
        tone="primary"
        maxWidthClassName="max-w-xl"
        footer={
          <>
            <Button variant="subtle" size="sm" onClick={() => setRecursoEditando(null)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form="form-admin-recurso"
              variant="primary"
              size="sm"
              loading={guardando}
            >
              <Icon className="text-[16px]">save</Icon>
              <span>Guardar Cambios</span>
            </Button>
          </>
        }
      >
        {errorForm && (
          <CalloutBanner tone="danger" title="Error de validación">
            {errorForm}
          </CalloutBanner>
        )}

        <form id="form-admin-recurso" onSubmit={guardarEdicion} className="space-y-3.5">
          <FormInput
            id="edit-recurso-titulo"
            label="Título del Recurso"
            icon="description"
            value={tituloForm}
            onChange={(e) => setTituloForm(e.target.value)}
            placeholder="Ej: Guía de Ejercicios Resueltos"
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormSelect
              id="edit-recurso-escuela"
              label="Escuela / Facultad"
              icon="domain"
              value={escuelaForm}
              onChange={(e) => setEscuelaForm(e.target.value)}
            >
              <option value="General">General</option>
              {nombresEscuelasDisponibles
                .filter((esc) => esc !== 'General')
                .map((esc) => (
                  <option key={esc} value={esc}>
                    {esc}
                  </option>
                ))}
            </FormSelect>

            <FormInput
              id="edit-recurso-materia"
              label="Materia / Asignatura"
              icon="menu_book"
              value={materiaForm}
              onChange={(e) => setMateriaForm(e.target.value)}
              placeholder="Ej: Cálculo Multivariable"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormInput
              id="edit-recurso-tema"
              label="Tema (Opcional)"
              icon="topic"
              value={temaForm}
              onChange={(e) => setTemaForm(e.target.value)}
              placeholder="Ej: Integrales Múltiples"
            />

            <FormSelect
              id="edit-recurso-tipo"
              label="Tipo de Recurso"
              icon="category"
              value={tipoForm}
              onChange={(e) =>
                setTipoForm(e.target.value as 'video' | 'guia' | 'documento' | 'enlace')
              }
            >
              <option value="video">Video</option>
              <option value="guia">Guía</option>
              <option value="documento">Documento</option>
              <option value="enlace">Enlace</option>
            </FormSelect>
          </div>

          <FormInput
            id="edit-recurso-origen"
            label="Etiqueta de Origen (Opcional)"
            icon="label"
            value={claseOrigenForm}
            onChange={(e) => setClaseOrigenForm(e.target.value)}
            placeholder="Ej: Clase: Cálculo - Integrales"
          />

          <div className="space-y-1.5">
            <FormInput
              id="edit-recurso-link"
              type="url"
              label="Enlace del Recurso (URL Vigente)"
              icon="link"
              value={linkForm}
              onChange={(e) => setLinkForm(e.target.value)}
              placeholder="https://..."
              required
            />
            {linkForm && (
              <a
                href={linkForm}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-label-md font-semibold text-primary hover:underline"
              >
                <Icon className="text-[14px]">open_in_new</Icon>
                <span>Probar enlace en una pestaña nueva antes de guardar</span>
              </a>
            )}
          </div>
        </form>
      </Modal>

      {/* Modal Canónico para Confirmar Eliminación */}
      <Modal
        open={Boolean(recursoAEliminar)}
        onClose={() => setRecursoAEliminar(null)}
        title="Confirmar Eliminación de Recurso"
        icon="warning"
        tone="danger"
        footer={
          <>
            <Button variant="subtle" size="sm" onClick={() => setRecursoAEliminar(null)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              size="sm"
              loading={eliminando}
              onClick={confirmarEliminacion}
            >
              Sí, Eliminar Recurso
            </Button>
          </>
        }
      >
        <p className="font-body-md text-sm text-on-surface leading-relaxed">
          ¿Estás seguro de que deseas retirar permanentemente el recurso{' '}
          <strong>{recursoAEliminar?.titulo}</strong> ({recursoAEliminar?.materia}) de la biblioteca
          digital?
        </p>
        <div className="p-space-sm rounded-lg bg-surface-container text-on-surface-variant font-label-md text-[12px] flex items-start gap-2">
          <Icon className="text-error text-[16px] shrink-0 mt-0.5">report</Icon>
          <span>
            Dejará de estar visible de inmediato para todos los estudiantes y docentes.
          </span>
        </div>
      </Modal>
    </div>
  );
}

