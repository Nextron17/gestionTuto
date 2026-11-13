'use client';

import { useEffect, useMemo, useState } from 'react';
import { AxiosError } from 'axios';
import { useAuth } from '../../../../context/AuthContext';
import api from '../../../../lib/api';
import { Icon } from '../../../../components/ui/Icon';
import { PageHeader } from '../../../../components/ui/PageHeader';
import { SearchInput } from '../../../../components/ui/SearchInput';
import { FormInput, FormSelect } from '../../../../components/ui/FormField';
import { SurfaceCard } from '../../../../components/ui/SurfaceCard';
import { Badge } from '../../../../components/ui/Badge';
import { Button } from '../../../../components/ui/Button';
import { CalloutBanner } from '../../../../components/ui/CalloutBanner';

type TipoRecurso = 'video' | 'guia' | 'documento' | 'enlace';

interface EscuelaItem {
  _id: string;
  nombre: string;
  codigo: string;
}

interface TemaCatalogo {
  _id: string;
  nombre: string;
  materia: string;
}

interface Recurso {
  _id: string;
  titulo: string;
  escuela: string;
  materia: string;
  tema?: string;
  tipo?: TipoRecurso;
  claseOrigen?: string;
  link: string;
  profesor?: {
    _id?: string;
    nombre: string;
  };
}

const TIPOS_RECURSO: {
  id: TipoRecurso;
  label: string;
  icon: string;
  badgeVariant: 'primary' | 'secondary' | 'neutral' | 'success';
}[] = [
  { id: 'video', label: 'Video', icon: 'play_circle', badgeVariant: 'primary' },
  { id: 'guia', label: 'Guía', icon: 'menu_book', badgeVariant: 'success' },
  { id: 'documento', label: 'Documento', icon: 'description', badgeVariant: 'secondary' },
  { id: 'enlace', label: 'Enlace', icon: 'link', badgeVariant: 'neutral' },
];

function getTipoMeta(tipo?: string) {
  return (
    TIPOS_RECURSO.find((t) => t.id === tipo) || {
      id: 'enlace' as TipoRecurso,
      label: 'Enlace',
      icon: 'link',
      badgeVariant: 'neutral' as const,
    }
  );
}

export default function RecursosProfesorPage() {
  const { user } = useAuth();
  const [recursos, setRecursos] = useState<Recurso[]>([]);
  const [escuelas, setEscuelas] = useState<EscuelaItem[]>([]);
  const [materiasCatalogo, setMateriasCatalogo] = useState<string[]>([]);
  const [temasCatalogo, setTemasCatalogo] = useState<TemaCatalogo[]>([]);

  const [escuelaFiltro, setEscuelaFiltro] = useState<string>('todas');
  const [materiaFiltro, setMateriaFiltro] = useState<string>('todas');
  const [temaFiltro, setTemaFiltro] = useState<string>('todos');
  const [tipoFiltro, setTipoFiltro] = useState<string>('todos');
  const [busqueda, setBusqueda] = useState('');

  // Campos del formulario HU-10
  const [escuelaForm, setEscuelaForm] = useState('');
  const [materiaSelect, setMateriaSelect] = useState('');
  const [otraMateria, setOtraMateria] = useState('');
  const [temaSelect, setTemaSelect] = useState('__otro__');
  const [otroTema, setOtroTema] = useState('');
  const [titulo, setTitulo] = useState('');
  const [tipo, setTipo] = useState<TipoRecurso>('guia');
  const [link, setLink] = useState('');

  const [publicando, setPublicando] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [feedback, setFeedback] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

  const cargarRecursos = async (escuelaSeleccionada: string) => {
    try {
      const query =
        escuelaSeleccionada && escuelaSeleccionada !== 'todas'
          ? `?escuela=${encodeURIComponent(escuelaSeleccionada)}`
          : '';
      const res = await api.get(`/recursos${query}`);
      setRecursos(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    let cancelado = false;

    const inicializar = async () => {
      try {
        const resEsc = await api.get('/recursos/escuelas');
        if (cancelado) return;

        const listaEscuelas: EscuelaItem[] = resEsc.data.escuelas || [];
        const miEscuela: string = resEsc.data.miEscuela || user?.escuela || '';
        const listaMaterias: string[] = resEsc.data.materias || [];
        const listaTemas: TemaCatalogo[] = resEsc.data.temas || [];

        setEscuelas(listaEscuelas);
        setMateriasCatalogo(listaMaterias);
        setTemasCatalogo(listaTemas);

        if (miEscuela) {
          setEscuelaForm(miEscuela);
          setEscuelaFiltro(miEscuela);
        }

        const primeraMateria = listaMaterias[0] || user?.materias?.[0] || '__otra__';
        setMateriaSelect(primeraMateria);
        const temasIniciales = listaTemas.filter((t) => t.materia === primeraMateria);
        setTemaSelect(temasIniciales[0]?.nombre || '__otro__');

        const query =
          miEscuela && miEscuela !== 'todas'
            ? `?escuela=${encodeURIComponent(miEscuela)}`
            : '';
        const resRec = await api.get(`/recursos${query}`);
        if (!cancelado) {
          setRecursos(resRec.data || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelado) {
          setCargando(false);
        }
      }
    };

    inicializar();
    return () => {
      cancelado = true;
    };
  }, [user?.escuela, user?.materias]);

  const materiaActualForm =
    materiaSelect === '__otra__' ? otraMateria.trim() : materiaSelect.trim();

  const temasDeMateriaForm = useMemo(() => {
    return temasCatalogo.filter(
      (t) => t.materia.toLowerCase() === materiaActualForm.toLowerCase()
    );
  }, [temasCatalogo, materiaActualForm]);

  const cambiarMateriaForm = (nuevaMat: string) => {
    setMateriaSelect(nuevaMat);
    const matLimpia = nuevaMat === '__otra__' ? '' : nuevaMat;
    const temasMat = temasCatalogo.filter(
      (t) => t.materia.toLowerCase() === matLimpia.toLowerCase()
    );
    setTemaSelect(temasMat[0]?.nombre || '__otro__');
    setOtroTema('');
  };

  const cambiarFiltroEscuela = async (nuevaEscuela: string) => {
    setEscuelaFiltro(nuevaEscuela);
    await cargarRecursos(nuevaEscuela);
  };

  const agregarRecurso = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const materiaFinal =
      materiaSelect === '__otra__' ? otraMateria.trim() : materiaSelect.trim();
    const temaFinal = temaSelect === '__otro__' ? otroTema.trim() : temaSelect.trim();

    if (!titulo.trim() || !materiaFinal || !temaFinal || !link.trim()) {
      setFeedback({
        tipo: 'error',
        texto: 'Todos los campos requeridos (título, materia, tema, tipo y URL) deben estar completos.',
      });
      return;
    }

    setPublicando(true);
    try {
      await api.post('/recursos', {
        titulo: titulo.trim(),
        escuela: escuelaForm,
        materia: materiaFinal,
        tema: temaFinal,
        tipo,
        link: link.trim(),
      });
      setTitulo('');
      setLink('');
      if (temaSelect === '__otro__') {
        setOtroTema('');
      }
      await cargarRecursos(escuelaFiltro);
      setFeedback({
        tipo: 'ok',
        texto: `Recurso "${titulo.trim()}" recomendado para ${materiaFinal} (${temaFinal}).`,
      });
    } catch (err) {
      const errorAxios = err as AxiosError<{ message?: string }>;
      setFeedback({
        tipo: 'error',
        texto: errorAxios.response?.data?.message || 'No se pudo publicar el recurso.',
      });
    } finally {
      setPublicando(false);
    }
  };

  const eliminarMiRecurso = async (recursoId: string) => {
    try {
      await api.delete(`/recursos/${recursoId}`);
      await cargarRecursos(escuelaFiltro);
      setFeedback({
        tipo: 'ok',
        texto: 'Recurso eliminado del repositorio.',
      });
    } catch (err) {
      console.error(err);
    }
  };

  const materiasEnLista = useMemo(() => {
    return Array.from(new Set(recursos.map((r) => r.materia).filter(Boolean))).sort((a, b) =>
      a.localeCompare(b)
    );
  }, [recursos]);

  const temasEnLista = useMemo(() => {
    return Array.from(
      new Set(
        recursos
          .filter((r) => materiaFiltro === 'todas' || r.materia === materiaFiltro)
          .map((r) => r.tema)
          .filter((tm): tm is string => Boolean(tm && tm.trim() !== ''))
      )
    ).sort((a, b) => a.localeCompare(b));
  }, [recursos, materiaFiltro]);

  const recursosFiltrados = recursos.filter((r) => {
    const okMat = materiaFiltro === 'todas' || r.materia === materiaFiltro;
    const okTema = temaFiltro === 'todos' || (r.tema || '') === temaFiltro;
    const okTipo = tipoFiltro === 'todos' || (r.tipo || 'enlace') === tipoFiltro;

    const q = busqueda.toLowerCase().trim();
    if (!q) return okMat && okTema && okTipo;

    const okTexto =
      r.titulo.toLowerCase().includes(q) ||
      r.materia.toLowerCase().includes(q) ||
      (r.tema && r.tema.toLowerCase().includes(q));

    return okMat && okTema && okTipo && okTexto;
  });

  return (
    <div className="space-y-space-lg max-w-6xl mx-auto">
      <PageHeader
        eyebrow="04. Biblioteca Docente"
        title="Recomendar Recursos Académicos"
        description="Agrega videos, guías, documentos o enlaces asociados a una materia y un tema para que los estudiantes se preparen antes de solicitar tutoría."
        actions={
          <div className="w-full sm:w-80">
            <SearchInput
              placeholder="Buscar material por título, materia o tema..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              onClear={() => setBusqueda('')}
            />
          </div>
        }
      />

      {/* Filtro rápido por Escuela */}
      <SurfaceCard tone="lowest" className="p-space-md space-y-space-sm">
        <span className="font-label-md text-[11px] font-semibold text-outline uppercase tracking-wider block">
          Filtrar por Escuela o Facultad
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => cambiarFiltroEscuela('todas')}
            className={`px-3.5 py-2 rounded-lg font-label-md text-[12px] font-semibold transition-all cursor-pointer active:scale-[0.98] ${
              escuelaFiltro === 'todas'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'bg-surface-container text-on-surface hover:bg-primary-fixed hover:text-primary'
            }`}
          >
            Todas las Escuelas
          </button>
          {escuelas.map((esc) => (
            <button
              key={esc._id}
              type="button"
              onClick={() => cambiarFiltroEscuela(esc.nombre)}
              className={`px-3.5 py-2 rounded-lg font-label-md text-[12px] font-semibold transition-all cursor-pointer active:scale-[0.98] ${
                escuelaFiltro === esc.nombre
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'bg-surface-container text-on-surface hover:bg-primary-fixed hover:text-primary'
              }`}
            >
              {esc.nombre}
            </button>
          ))}
        </div>
      </SurfaceCard>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-space-md items-start">
        <SurfaceCard tone="lowest" className="p-4 sm:p-space-lg space-y-space-md h-fit">
          <div>
            <h2 className="font-label-md text-base font-bold text-on-surface flex items-center gap-2">
              <Icon className="text-primary text-[20px]">upload_file</Icon>
              <span>Recomendar Nuevo Recurso</span>
            </h2>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Asocia cada recurso a una materia y tema con su título, tipo y URL.
            </p>
          </div>

          {feedback && (
            <CalloutBanner
              tone={feedback.tipo === 'ok' ? 'success' : 'danger'}
              title={feedback.tipo === 'ok' ? 'Recurso publicado' : 'No se pudo publicar'}
            >
              {feedback.texto}
            </CalloutBanner>
          )}

          <form onSubmit={agregarRecurso} className="space-y-3.5">
            <FormSelect
              id="recurso-escuela"
              label="Escuela *"
              icon="domain"
              value={escuelaForm}
              onChange={(e) => setEscuelaForm(e.target.value)}
              required
            >
              <option value="">-- Seleccionar Escuela --</option>
              {escuelas.map((esc) => (
                <option key={esc._id} value={esc.nombre}>
                  {esc.nombre}
                </option>
              ))}
            </FormSelect>

            <FormSelect
              id="recurso-materia"
              label="Materia / Asignatura *"
              icon="menu_book"
              value={materiaSelect}
              onChange={(e) => cambiarMateriaForm(e.target.value)}
              required
            >
              {materiasCatalogo.map((mat) => (
                <option key={mat} value={mat}>
                  {mat}
                </option>
              ))}
              <option value="__otra__">+ Otra materia (escribir manualmente)</option>
            </FormSelect>

            {materiaSelect === '__otra__' && (
              <FormInput
                id="recurso-otra-materia"
                label="Nombre de la Materia *"
                icon="edit_note"
                placeholder="Ej: Cálculo Multivariable"
                value={otraMateria}
                onChange={(e) => setOtraMateria(e.target.value)}
                required
              />
            )}

            <FormSelect
              id="recurso-tema"
              label="Tema Asociado *"
              icon="topic"
              value={temaSelect}
              onChange={(e) => setTemaSelect(e.target.value)}
              required
            >
              {temasDeMateriaForm.map((tm) => (
                <option key={tm._id} value={tm.nombre}>
                  {tm.nombre}
                </option>
              ))}
              <option value="__otro__">+ Escribir tema específico</option>
            </FormSelect>

            {temaSelect === '__otro__' && (
              <FormInput
                id="recurso-otro-tema"
                label="Nombre del Tema *"
                icon="topic"
                placeholder="Ej: Árboles AVL y Rotaciones"
                value={otroTema}
                onChange={(e) => setOtroTema(e.target.value)}
                required
              />
            )}

            <FormInput
              id="recurso-titulo"
              label="Título del Recurso *"
              icon="description"
              placeholder="Ej: Guía de Ejercicios Resueltos"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              required
            />

            <FormSelect
              id="recurso-tipo"
              label="Tipo de Recurso *"
              icon={getTipoMeta(tipo).icon}
              value={tipo}
              onChange={(e) => setTipo(e.target.value as TipoRecurso)}
              required
            >
              <option value="video">Video (clase / tutorial)</option>
              <option value="guia">Guía de estudio / taller</option>
              <option value="documento">Documento / PDF / libro</option>
              <option value="enlace">Enlace / herramienta interactiva</option>
            </FormSelect>

            <FormInput
              id="recurso-link"
              type="url"
              label="URL del Recurso *"
              icon="link"
              placeholder="https://..."
              value={link}
              onChange={(e) => setLink(e.target.value)}
              required
            />

            <Button type="submit" variant="primary" fullWidth loading={publicando}>
              <Icon className="text-[18px]">add</Icon>
              <span>Publicar Recurso Recomendado</span>
            </Button>
          </form>
        </SurfaceCard>

        <SurfaceCard tone="lowest" className="p-4 sm:p-space-lg lg:col-span-2 space-y-space-md">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 pb-2 border-b border-surface-container">
            <h2 className="font-label-md text-base font-bold text-on-surface flex items-center gap-2 min-w-0">
              <Icon className="text-primary text-[20px] shrink-0">library_books</Icon>
              <span className="truncate">
                {escuelaFiltro === 'todas'
                  ? 'Todos los Materiales Publicados'
                  : `Materiales • ${escuelaFiltro}`}
              </span>
            </h2>
            <Badge variant="neutral" className="self-start sm:self-auto shrink-0">
              {recursosFiltrados.length}{' '}
              {recursosFiltrados.length === 1 ? 'recurso' : 'recursos'}
            </Badge>
          </div>

          {/* Filtros por Materia, Tema y Tipo (HU-10) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <FormSelect
              id="filtro-recurso-materia"
              label="Materia"
              icon="menu_book"
              value={materiaFiltro}
              onChange={(e) => {
                setMateriaFiltro(e.target.value);
                setTemaFiltro('todos');
              }}
            >
              <option value="todas">Todas las materias</option>
              {materiasEnLista.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </FormSelect>

            <FormSelect
              id="filtro-recurso-tema"
              label="Tema"
              icon="topic"
              value={temaFiltro}
              onChange={(e) => setTemaFiltro(e.target.value)}
            >
              <option value="todos">Todos los temas</option>
              {temasEnLista.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </FormSelect>

            <FormSelect
              id="filtro-recurso-tipo"
              label="Tipo"
              icon="category"
              value={tipoFiltro}
              onChange={(e) => setTipoFiltro(e.target.value)}
            >
              <option value="todos">Todos los tipos</option>
              {TIPOS_RECURSO.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </FormSelect>
          </div>

          {cargando ? (
            <div className="py-8 text-sm text-on-surface-variant flex items-center gap-2">
              <Icon className="text-primary animate-pulse">hourglass_top</Icon>
              <span>Cargando recursos...</span>
            </div>
          ) : recursosFiltrados.length === 0 ? (
            <div className="p-8 sm:p-10 rounded-xl bg-surface-container-low text-center space-y-2">
              <Icon className="text-outline text-[36px]">folder_off</Icon>
              <p className="text-sm text-on-surface-variant">
                No hay materiales publicados con los filtros seleccionados.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recursosFiltrados.map((r) => {
                const meta = getTipoMeta(r.tipo);
                const esAutor = Boolean(user?.id && r.profesor?._id === user.id);
                return (
                  <div
                    key={r._id}
                    className="p-3.5 sm:p-space-md bg-surface-container-low hover:bg-surface-container rounded-xl transition-colors flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3.5"
                  >
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge variant={meta.badgeVariant} pill={false}>
                          <Icon className="text-[13px]">{meta.icon}</Icon>
                          <span>{meta.label}</span>
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
                      <h4 className="font-label-md text-sm font-bold text-on-surface break-words">
                        {r.titulo}
                      </h4>
                      <p className="text-xs text-primary font-semibold flex flex-wrap items-center gap-1">
                        <Icon className="text-[14px] shrink-0">menu_book</Icon>
                        <span className="break-words">
                          {r.materia} {r.tema ? `• ${r.tema}` : ''}{' '}
                          {r.profesor ? `• Por ${r.profesor.nombre}` : ''}
                        </span>
                      </p>
                      <a
                        href={r.link}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-outline hover:text-primary underline truncate block font-mono"
                      >
                        {r.link}
                      </a>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                      <a
                        href={r.link}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 bg-primary hover:bg-primary-container text-on-primary font-label-md text-xs px-3.5 py-2.5 sm:py-2 rounded-lg font-semibold shadow-sm active:scale-[0.98] transition-all"
                      >
                        <Icon className="text-[16px]">open_in_new</Icon>
                        <span>Abrir</span>
                      </a>
                      {esAutor && (
                        <button
                          type="button"
                          onClick={() => eliminarMiRecurso(r._id)}
                          className="w-9 h-9 rounded-lg bg-surface-container hover:bg-error-container text-outline hover:text-error flex items-center justify-center transition-colors cursor-pointer shrink-0"
                          title="Eliminar recurso publicado"
                          aria-label={`Eliminar ${r.titulo}`}
                        >
                          <Icon className="text-[18px]">delete</Icon>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SurfaceCard>
      </div>
    </div>
  );
}
