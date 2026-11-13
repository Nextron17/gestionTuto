'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import api from '../../../../lib/api';
import { Icon } from '../../../../components/ui/Icon';
import { PageHeader } from '../../../../components/ui/PageHeader';
import { SearchInput } from '../../../../components/ui/SearchInput';
import { FormInput, FormSelect } from '../../../../components/ui/FormField';
import { SurfaceCard } from '../../../../components/ui/SurfaceCard';
import { Badge } from '../../../../components/ui/Badge';
import { Button } from '../../../../components/ui/Button';

interface EscuelaItem {
  _id: string;
  nombre: string;
  codigo: string;
}

interface Recurso {
  _id: string;
  titulo: string;
  escuela: string;
  materia: string;
  tema?: string;
  claseOrigen?: string;
  link: string;
  profesor?: {
    nombre: string;
  };
}

export default function RecursosProfesorPage() {
  const { user } = useAuth();
  const [recursos, setRecursos] = useState<Recurso[]>([]);
  const [escuelas, setEscuelas] = useState<EscuelaItem[]>([]);
  const [escuelaFiltro, setEscuelaFiltro] = useState<string>('todas');
  const [busqueda, setBusqueda] = useState('');

  const [titulo, setTitulo] = useState('');
  const [escuelaForm, setEscuelaForm] = useState('');
  const [materia, setMateria] = useState('');
  const [tema, setTema] = useState('');
  const [link, setLink] = useState('');
  const [publicando, setPublicando] = useState(false);
  const [cargando, setCargando] = useState(true);

  const cargarRecursos = async (escuelaSeleccionada: string) => {
    try {
      const query =
        escuelaSeleccionada && escuelaSeleccionada !== 'todas'
          ? `?escuela=${encodeURIComponent(escuelaSeleccionada)}`
          : '';
      const res = await api.get(`/recursos${query}`);
      setRecursos(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const inicializar = async () => {
      try {
        const resEsc = await api.get('/recursos/escuelas');
        const listaEscuelas: EscuelaItem[] = resEsc.data.escuelas || [];
        const miEscuela: string = resEsc.data.miEscuela || user?.escuela || '';

        setEscuelas(listaEscuelas);
        if (miEscuela) {
          setEscuelaForm(miEscuela);
          setEscuelaFiltro(miEscuela);
          await cargarRecursos(miEscuela);
        } else {
          await cargarRecursos('todas');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setCargando(false);
      }
    };
    inicializar();
  }, [user?.escuela]);

  const cambiarFiltroEscuela = async (nuevaEscuela: string) => {
    setEscuelaFiltro(nuevaEscuela);
    await cargarRecursos(nuevaEscuela);
  };

  const agregarRecurso = async (e: React.FormEvent) => {
    e.preventDefault();
    setPublicando(true);
    try {
      await api.post('/recursos', {
        titulo,
        escuela: escuelaForm,
        materia,
        tema,
        link,
      });
      setTitulo('');
      setMateria('');
      setTema('');
      setLink('');
      await cargarRecursos(escuelaFiltro);
    } catch (err) {
      console.error(err);
    } finally {
      setPublicando(false);
    }
  };

  const recursosFiltrados = recursos.filter((r) => {
    const q = busqueda.toLowerCase();
    if (!q) return true;
    return (
      r.titulo.toLowerCase().includes(q) ||
      r.materia.toLowerCase().includes(q) ||
      (r.tema && r.tema.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-space-lg max-w-6xl mx-auto">
      <PageHeader
        eyebrow="04. Biblioteca Docente"
        title="Recursos Académicos por Escuela"
        description="Publica material de estudio clasificado por escuela y consulta los documentos compartidos en tus clases."
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-space-md">
        <SurfaceCard tone="lowest" className="p-4 sm:p-space-lg space-y-space-md h-fit">
          <div>
            <h2 className="font-label-md text-base font-bold text-on-surface flex items-center gap-2">
              <Icon className="text-primary text-[20px]">upload_file</Icon>
              <span>Subir Nuevo Recurso</span>
            </h2>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Comparte enlaces a guías, libros o repositorios con tus estudiantes.
            </p>
          </div>

          <form onSubmit={agregarRecurso} className="space-y-3.5">
            <FormSelect
              id="recurso-escuela"
              label="Escuela"
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

            <FormInput
              id="recurso-titulo"
              label="Título del Material"
              icon="description"
              placeholder="Ej: Guía de Ejercicios Resueltos"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              required
            />

            <FormInput
              id="recurso-materia"
              label="Materia"
              icon="menu_book"
              placeholder="Ej: Cálculo Multivariable"
              value={materia}
              onChange={(e) => setMateria(e.target.value)}
              required
            />

            <FormInput
              id="recurso-tema"
              label="Tema (Opcional)"
              icon="topic"
              placeholder="Ej: Integrales Múltiples"
              value={tema}
              onChange={(e) => setTema(e.target.value)}
            />

            <FormInput
              id="recurso-link"
              type="url"
              label="Enlace (URL / Documento)"
              icon="link"
              placeholder="https://..."
              value={link}
              onChange={(e) => setLink(e.target.value)}
              required
            />

            <Button type="submit" variant="primary" fullWidth loading={publicando}>
              <Icon className="text-[18px]">add</Icon>
              <span>Publicar Recurso</span>
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

          {cargando ? (
            <div className="py-8 text-sm text-on-surface-variant flex items-center gap-2">
              <Icon className="text-primary animate-pulse">hourglass_top</Icon>
              <span>Cargando recursos...</span>
            </div>
          ) : recursosFiltrados.length === 0 ? (
            <div className="p-8 sm:p-10 rounded-xl bg-surface-container-low text-center space-y-2">
              <Icon className="text-outline text-[36px]">folder_off</Icon>
              <p className="text-sm text-on-surface-variant">
                No hay materiales publicados para esta escuela aún.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recursosFiltrados.map((r) => (
                <div
                  key={r._id}
                  className="p-3.5 sm:p-space-md bg-surface-container-low hover:bg-surface-container rounded-xl transition-colors flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3.5"
                >
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
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

                  <a
                    href={r.link}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 bg-primary hover:bg-primary-container text-on-primary font-label-md text-xs px-3.5 py-2.5 sm:py-2 rounded-lg font-semibold shadow-sm active:scale-[0.98] transition-all w-full sm:w-auto sm:self-center shrink-0"
                  >
                    <Icon className="text-[16px]">open_in_new</Icon>
                    <span>Abrir</span>
                  </a>
                </div>
              ))}
            </div>
          )}
        </SurfaceCard>
      </div>
    </div>
  );
}
