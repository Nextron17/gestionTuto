'use client';

import { useEffect, useState } from 'react';
import api from '../../../../lib/api';
import { Icon } from '../../../../components/ui/Icon';
import { PageHeader } from '../../../../components/ui/PageHeader';
import { SearchInput } from '../../../../components/ui/SearchInput';
import { SurfaceCard } from '../../../../components/ui/SurfaceCard';
import { Badge } from '../../../../components/ui/Badge';

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

export default function RecursosEstudiantePage() {
  const [recursos, setRecursos] = useState<Recurso[]>([]);
  const [escuelas, setEscuelas] = useState<EscuelaItem[]>([]);
  const [miEscuela, setMiEscuela] = useState<string>('');
  const [escuelaSeleccionada, setEscuelaSeleccionada] = useState<string>('todas');
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);

  const cargarRecursos = async (escuelaFiltro: string) => {
    try {
      const query =
        escuelaFiltro && escuelaFiltro !== 'todas'
          ? `?escuela=${encodeURIComponent(escuelaFiltro)}`
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
        const escuelaUsuario: string = resEsc.data.miEscuela || '';

        setEscuelas(listaEscuelas);
        setMiEscuela(escuelaUsuario);

        if (escuelaUsuario) {
          setEscuelaSeleccionada(escuelaUsuario);
          await cargarRecursos(escuelaUsuario);
        } else {
          setEscuelaSeleccionada('todas');
          await cargarRecursos('todas');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setCargando(false);
      }
    };
    inicializar();
  }, []);

  const seleccionarEscuela = async (nombreEscuela: string) => {
    setEscuelaSeleccionada(nombreEscuela);
    await cargarRecursos(nombreEscuela);
  };

  const filtrados = recursos.filter(
    (r) =>
      r.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
      r.materia.toLowerCase().includes(busqueda.toLowerCase()) ||
      (r.tema && r.tema.toLowerCase().includes(busqueda.toLowerCase())) ||
      (r.claseOrigen && r.claseOrigen.toLowerCase().includes(busqueda.toLowerCase()))
  );

  if (cargando) {
    return (
      <div className="max-w-6xl mx-auto py-8 text-sm text-on-surface-variant flex items-center gap-2">
        <Icon className="text-primary animate-pulse">hourglass_top</Icon>
        <span>Cargando recursos de estudio por escuela...</span>
      </div>
    );
  }

  return (
    <div className="space-y-space-lg max-w-6xl mx-auto min-w-0">
      <PageHeader
        eyebrow="04. Biblioteca Digital"
        title="Recursos de Estudio por Escuela"
        description="Material de apoyo, guías y documentos compartidos por los docentes organizados por escuela académica."
        actions={
          <div className="w-full sm:w-80">
            <SearchInput
              placeholder="Buscar por materia, tema o título..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              onClear={() => setBusqueda('')}
            />
          </div>
        }
      />

      {/* Selector de Escuela con Chips Canónicos (Sección 04) */}
      <SurfaceCard tone="lowest" className="p-4 sm:p-space-md space-y-space-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-label-md text-[11px] font-semibold text-outline uppercase tracking-wider">
            Filtrar por Escuela o Facultad
          </span>
          {miEscuela && (
            <Badge variant="primary" className="max-w-full">
              <Icon className="text-[14px]">school</Icon>
              <span className="truncate">Tu escuela: {miEscuela}</span>
            </Badge>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => seleccionarEscuela('todas')}
            className={`px-3 sm:px-3.5 py-2 rounded-lg font-label-md text-[12px] font-semibold transition-all cursor-pointer active:scale-[0.98] ${
              escuelaSeleccionada === 'todas'
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
              onClick={() => seleccionarEscuela(esc.nombre)}
              className={`px-3 sm:px-3.5 py-2 rounded-lg font-label-md text-[12px] font-semibold transition-all cursor-pointer active:scale-[0.98] text-left ${
                escuelaSeleccionada === esc.nombre
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'bg-surface-container text-on-surface hover:bg-primary-fixed hover:text-primary'
              }`}
            >
              {esc.nombre}
            </button>
          ))}
        </div>
      </SurfaceCard>

      {/* Listado de Recursos */}
      <section className="space-y-space-md min-w-0">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
          <h2 className="text-lg sm:text-xl font-semibold text-on-surface flex items-center gap-2 min-w-0">
            <Icon className="text-primary text-[22px]">library_books</Icon>
            <span className="break-words">
              {escuelaSeleccionada === 'todas'
                ? 'Repositorio General • Todas las Escuelas'
                : `Repositorio • ${escuelaSeleccionada}`}
            </span>
          </h2>
          <Badge variant="neutral" className="self-start sm:self-auto">
            {filtrados.length} {filtrados.length === 1 ? 'documento' : 'documentos'}
          </Badge>
        </div>

        {filtrados.length === 0 ? (
          <SurfaceCard tone="lowest" className="p-8 sm:p-10 text-center space-y-2">
            <Icon className="text-outline text-[36px]">folder_off</Icon>
            <p className="text-sm text-on-surface-variant">
              No hay recursos disponibles para esta escuela con ese criterio.
            </p>
          </SurfaceCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-space-md">
            {filtrados.map((r) => (
              <SurfaceCard
                key={r._id}
                as="article"
                tone="lowest"
                interactive
                className="overflow-hidden flex flex-col justify-between"
              >
                <div className="p-4 sm:p-space-md space-y-2.5 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                      <Badge variant="primary" pill={false}>
                        {r.escuela || 'General'}
                      </Badge>
                      {r.claseOrigen && (
                        <Badge variant="success" dot>
                          {r.claseOrigen}
                        </Badge>
                      )}
                    </div>
                    <div className="w-9 h-9 rounded-lg bg-surface-container-low flex items-center justify-center text-primary shrink-0">
                      <Icon className="text-[20px]">folder</Icon>
                    </div>
                  </div>

                  <h3 className="font-label-md text-[15px] font-bold text-on-surface group-hover:text-primary transition-colors break-words">
                    {r.titulo}
                  </h3>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-on-surface-variant">
                    <span className="inline-flex items-center gap-1 font-medium text-primary break-words">
                      <Icon className="text-[15px]">menu_book</Icon>
                      <span>
                        {r.materia} {r.tema ? `• ${r.tema}` : ''}
                      </span>
                    </span>
                    {r.profesor?.nombre && (
                      <span className="inline-flex items-center gap-1">
                        <Icon className="text-[15px] text-outline">person</Icon>
                        <span>Por {r.profesor.nombre}</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="px-4 sm:px-space-md py-3 bg-surface-container-low flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 min-w-0">
                  <a
                    href={r.link}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-outline hover:text-primary truncate font-mono min-w-0"
                  >
                    {r.link}
                  </a>

                  <a
                    href={r.link}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 bg-primary hover:bg-primary-container text-on-primary font-label-md text-xs px-3.5 py-2 rounded-lg font-semibold shadow-sm active:scale-[0.98] transition-all shrink-0"
                  >
                    <Icon className="text-[16px]">download</Icon>
                    <span>Abrir Recurso</span>
                  </a>
                </div>
              </SurfaceCard>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
