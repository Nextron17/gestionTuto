'use client';

import { useEffect, useMemo, useState } from 'react';
import { AxiosError } from 'axios';
import { useAuth } from '../../../../context/AuthContext';
import api from '../../../../lib/api';
import { PageHeader } from '../../../../components/ui/PageHeader';
import { SearchInput } from '../../../../components/ui/SearchInput';
import { SurfaceCard } from '../../../../components/ui/SurfaceCard';
import {
  EscuelaItem,
  Recurso,
  TemaCatalogo,
  TipoRecurso,
} from '../../../../components/profesor/recursos/types';
import { FormularioRecursoProfesor } from '../../../../components/profesor/recursos/FormularioRecursoProfesor';
import { ListaRecursosProfesor } from '../../../../components/profesor/recursos/ListaRecursosProfesor';

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

      <SurfaceCard tone="lowest" className="p-space-md space-y-space-sm">
        <span className="font-label-md text-[11px] font-semibold text-outline uppercase tracking-wider block">
          Filtrar por Escuela o Facultad
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => cambiarFiltroEscuela('todas')}
            className={`px-3.5 py-2 rounded-lg font-label-md text-[12px] font-semibold transition-all cursor-pointer active:scale-[0.98] ${escuelaFiltro === 'todas'
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
              className={`px-3.5 py-2 rounded-lg font-label-md text-[12px] font-semibold transition-all cursor-pointer active:scale-[0.98] ${escuelaFiltro === esc.nombre
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
        <FormularioRecursoProfesor
          feedback={feedback}
          agregarRecurso={agregarRecurso}
          escuelaForm={escuelaForm}
          setEscuelaForm={setEscuelaForm}
          escuelas={escuelas}
          materiaSelect={materiaSelect}
          cambiarMateriaForm={cambiarMateriaForm}
          materiasCatalogo={materiasCatalogo}
          otraMateria={otraMateria}
          setOtraMateria={setOtraMateria}
          temaSelect={temaSelect}
          setTemaSelect={setTemaSelect}
          temasDeMateriaForm={temasDeMateriaForm}
          otroTema={otroTema}
          setOtroTema={setOtroTema}
          titulo={titulo}
          setTitulo={setTitulo}
          tipo={tipo}
          setTipo={setTipo}
          link={link}
          setLink={setLink}
          publicando={publicando}
        />

        <ListaRecursosProfesor
          escuelaFiltro={escuelaFiltro}
          recursosFiltrados={recursosFiltrados}
          materiaFiltro={materiaFiltro}
          setMateriaFiltro={setMateriaFiltro}
          materiasEnLista={materiasEnLista}
          temaFiltro={temaFiltro}
          setTemaFiltro={setTemaFiltro}
          temasEnLista={temasEnLista}
          tipoFiltro={tipoFiltro}
          setTipoFiltro={setTipoFiltro}
          cargando={cargando}
          userId={user?.id}
          eliminarMiRecurso={eliminarMiRecurso}
        />
      </div>
    </div>
  );
}
