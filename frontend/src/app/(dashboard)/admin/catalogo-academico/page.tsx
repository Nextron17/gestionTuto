'use client';

import { useEffect, useState } from 'react';
import api from '../../../../lib/api';
import { Icon } from '../../../../components/ui/Icon';
import { PageHeader } from '../../../../components/ui/PageHeader';
import { SearchInput } from '../../../../components/ui/SearchInput';
import { FormInput, FormSelect } from '../../../../components/ui/FormField';
import { SurfaceCard } from '../../../../components/ui/SurfaceCard';
import { Badge } from '../../../../components/ui/Badge';
import { Button } from '../../../../components/ui/Button';

interface Escuela {
  _id: string;
  nombre: string;
  codigo: string;
}

interface Carrera {
  _id: string;
  nombre: string;
  codigo: string;
  escuela?: { _id: string; nombre: string };
}

interface Materia {
  _id: string;
  nombre: string;
  codigo: string;
  carrera?: { _id: string; nombre: string };
}

export default function CatalogoAcademicoPage() {
  const [escuelas, setEscuelas] = useState<Escuela[]>([]);
  const [carreras, setCarreras] = useState<Carrera[]>([]);
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');

  const [escuelaNombre, setEscuelaNombre] = useState('');
  const [escuelaCodigo, setEscuelaCodigo] = useState('');

  const [carreraNombre, setCarreraNombre] = useState('');
  const [carreraCodigo, setCarreraCodigo] = useState('');
  const [carreraEscuelaId, setCarreraEscuelaId] = useState('');

  const [materiaNombre, setMateriaNombre] = useState('');
  const [materiaCodigo, setMateriaCodigo] = useState('');
  const [materiaCarreraId, setMateriaCarreraId] = useState('');

  const cargarCatalogoAPI = async () => {
    try {
      const res = await api.get('/admin/catalogo');
      setEscuelas(res.data.escuelas || []);
      setCarreras(res.data.carreras || []);
      setMaterias(res.data.materias || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const cargarInicial = async () => {
      try {
        const res = await api.get('/admin/catalogo');
        setEscuelas(res.data.escuelas || []);
        setCarreras(res.data.carreras || []);
        setMaterias(res.data.materias || []);
      } catch (err) {
        console.error(err);
      } finally {
        setCargando(false);
      }
    };
    cargarInicial();
  }, []);

  const agregarEscuela = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/admin/escuelas', { nombre: escuelaNombre, codigo: escuelaCodigo });
      setEscuelaNombre('');
      setEscuelaCodigo('');
      await cargarCatalogoAPI();
    } catch (err) {
      console.error(err);
    }
  };

  const eliminarEscuela = async (id: string) => {
    try {
      await api.delete(`/admin/escuelas/${id}`);
      await cargarCatalogoAPI();
    } catch (err) {
      console.error(err);
    }
  };

  const agregarCarrera = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!carreraEscuelaId) return;
    try {
      await api.post('/admin/carreras', {
        nombre: carreraNombre,
        codigo: carreraCodigo,
        escuela: carreraEscuelaId,
      });
      setCarreraNombre('');
      setCarreraCodigo('');
      setCarreraEscuelaId('');
      await cargarCatalogoAPI();
    } catch (err) {
      console.error(err);
    }
  };

  const eliminarCarrera = async (id: string) => {
    try {
      await api.delete(`/admin/carreras/${id}`);
      await cargarCatalogoAPI();
    } catch (err) {
      console.error(err);
    }
  };

  const agregarMateria = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!materiaCarreraId) return;
    try {
      await api.post('/admin/materias', {
        nombre: materiaNombre,
        codigo: materiaCodigo,
        carrera: materiaCarreraId,
      });
      setMateriaNombre('');
      setMateriaCodigo('');
      setMateriaCarreraId('');
      await cargarCatalogoAPI();
    } catch (err) {
      console.error(err);
    }
  };

  const eliminarMateria = async (id: string) => {
    try {
      await api.delete(`/admin/materias/${id}`);
      await cargarCatalogoAPI();
    } catch (err) {
      console.error(err);
    }
  };

  if (cargando) {
    return (
      <div className="max-w-6xl mx-auto py-8 text-sm text-on-surface-variant flex items-center gap-2">
        <Icon className="text-primary animate-pulse">hourglass_top</Icon>
        <span>Cargando catálogo académico...</span>
      </div>
    );
  }

  const q = busqueda.toLowerCase();
  const escuelasMostrar = escuelas.filter(
    (e) => !q || e.nombre.toLowerCase().includes(q) || e.codigo.toLowerCase().includes(q)
  );
  const carrerasMostrar = carreras.filter(
    (c) =>
      !q ||
      c.nombre.toLowerCase().includes(q) ||
      c.codigo.toLowerCase().includes(q) ||
      (c.escuela?.nombre && c.escuela.nombre.toLowerCase().includes(q))
  );
  const materiasMostrar = materias.filter(
    (m) =>
      !q ||
      m.nombre.toLowerCase().includes(q) ||
      m.codigo.toLowerCase().includes(q) ||
      (m.carrera?.nombre && m.carrera.nombre.toLowerCase().includes(q))
  );

  return (
    <div className="space-y-space-lg max-w-6xl mx-auto">
      <PageHeader
        eyebrow="02. Estructura Institucional"
        title="Catálogo Académico"
        description="Administra las escuelas, carreras universitarias y asignaturas habilitadas en la plataforma."
        actions={
          <div className="w-full sm:w-80">
            <SearchInput
              placeholder="Filtrar escuelas, carreras o materias..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              onClear={() => setBusqueda('')}
            />
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-space-md">
        {/* Columna 1: Escuelas */}
        <SurfaceCard tone="lowest" className="p-4 sm:p-space-lg space-y-space-md flex flex-col">
          <div className="flex items-center justify-between pb-2 border-b border-surface-container">
            <h2 className="font-label-md text-base font-bold text-on-surface flex items-center gap-2">
              <Icon className="text-primary text-[20px]">domain</Icon>
              <span>Escuelas</span>
            </h2>
            <Badge variant="primary">{escuelas.length}</Badge>
          </div>

          <form onSubmit={agregarEscuela} className="space-y-3">
            <FormInput
              id="escuela-nombre"
              label="Nombre de la Escuela"
              icon="apartment"
              placeholder="Ej: Escuela de Ingeniería"
              value={escuelaNombre}
              onChange={(e) => setEscuelaNombre(e.target.value)}
              required
            />
            <FormInput
              id="escuela-codigo"
              label="Código Institucional"
              icon="tag"
              placeholder="Ej: ESC-ING"
              value={escuelaCodigo}
              onChange={(e) => setEscuelaCodigo(e.target.value)}
              required
            />
            <Button type="submit" variant="primary" size="sm" fullWidth>
              <Icon className="text-[16px]">add</Icon>
              <span>Añadir Escuela</span>
            </Button>
          </form>

          <div className="space-y-2 pt-3 border-t border-surface-container flex-1 overflow-y-auto max-h-96">
            {escuelasMostrar.length === 0 ? (
              <p className="text-xs text-outline text-center py-6">Sin escuelas registradas.</p>
            ) : (
              escuelasMostrar.map((esc) => (
                <div
                  key={esc._id}
                  className="flex justify-between items-center p-3 bg-surface-container-low hover:bg-surface-container rounded-xl transition-colors"
                >
                  <div className="min-w-0">
                    <span className="font-label-md text-xs font-bold text-on-surface block truncate">
                      {esc.nombre}
                    </span>
                    <span className="font-mono text-[11px] text-outline">{esc.codigo}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => eliminarEscuela(esc._id)}
                    aria-label={`Eliminar escuela ${esc.nombre}`}
                    className="w-8 h-8 rounded-lg hover:bg-error-container text-outline hover:text-error flex items-center justify-center transition-colors cursor-pointer shrink-0"
                  >
                    <Icon className="text-[16px]">delete</Icon>
                  </button>
                </div>
              ))
            )}
          </div>
        </SurfaceCard>

        {/* Columna 2: Carreras */}
        <SurfaceCard tone="lowest" className="p-4 sm:p-space-lg space-y-space-md flex flex-col">
          <div className="flex items-center justify-between pb-2 border-b border-surface-container">
            <h2 className="font-label-md text-base font-bold text-on-surface flex items-center gap-2">
              <Icon className="text-secondary text-[20px]">school</Icon>
              <span>Carreras</span>
            </h2>
            <Badge variant="secondary">{carreras.length}</Badge>
          </div>

          <form onSubmit={agregarCarrera} className="space-y-3">
            <FormSelect
              id="carrera-escuela"
              label="Escuela Perteneciente"
              icon="domain"
              value={carreraEscuelaId}
              onChange={(e) => setCarreraEscuelaId(e.target.value)}
              required
            >
              <option value="">Seleccionar Escuela...</option>
              {escuelas.map((esc) => (
                <option key={esc._id} value={esc._id}>
                  {esc.nombre}
                </option>
              ))}
            </FormSelect>
            <FormInput
              id="carrera-nombre"
              label="Nombre de la Carrera"
              icon="school"
              placeholder="Ej: Ingeniería de Sistemas"
              value={carreraNombre}
              onChange={(e) => setCarreraNombre(e.target.value)}
              required
            />
            <FormInput
              id="carrera-codigo"
              label="Código de Carrera"
              icon="tag"
              placeholder="Ej: ING-SIS"
              value={carreraCodigo}
              onChange={(e) => setCarreraCodigo(e.target.value)}
              required
            />
            <Button type="submit" variant="primary" size="sm" fullWidth>
              <Icon className="text-[16px]">add</Icon>
              <span>Añadir Carrera</span>
            </Button>
          </form>

          <div className="space-y-2 pt-3 border-t border-surface-container flex-1 overflow-y-auto max-h-96">
            {carrerasMostrar.length === 0 ? (
              <p className="text-xs text-outline text-center py-6">Sin carreras registradas.</p>
            ) : (
              carrerasMostrar.map((car) => (
                <div
                  key={car._id}
                  className="flex justify-between items-center p-3 bg-surface-container-low hover:bg-surface-container rounded-xl transition-colors"
                >
                  <div className="min-w-0">
                    <span className="font-label-md text-xs font-bold text-on-surface block truncate">
                      {car.nombre}
                    </span>
                    <span className="text-[11px] text-outline block truncate">
                      <span className="font-mono">{car.codigo}</span>{' '}
                      {car.escuela ? `• ${car.escuela.nombre}` : ''}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => eliminarCarrera(car._id)}
                    aria-label={`Eliminar carrera ${car.nombre}`}
                    className="w-8 h-8 rounded-lg hover:bg-error-container text-outline hover:text-error flex items-center justify-center transition-colors cursor-pointer shrink-0"
                  >
                    <Icon className="text-[16px]">delete</Icon>
                  </button>
                </div>
              ))
            )}
          </div>
        </SurfaceCard>

        {/* Columna 3: Materias */}
        <SurfaceCard tone="lowest" className="p-4 sm:p-space-lg space-y-space-md flex flex-col">
          <div className="flex items-center justify-between pb-2 border-b border-surface-container">
            <h2 className="font-label-md text-base font-bold text-on-surface flex items-center gap-2">
              <Icon className="text-[#16a34a] text-[20px]">menu_book</Icon>
              <span>Materias</span>
            </h2>
            <Badge variant="success">{materias.length}</Badge>
          </div>

          <form onSubmit={agregarMateria} className="space-y-3">
            <FormSelect
              id="materia-carrera"
              label="Carrera Asociada"
              icon="school"
              value={materiaCarreraId}
              onChange={(e) => setMateriaCarreraId(e.target.value)}
              required
            >
              <option value="">Seleccionar Carrera...</option>
              {carreras.map((car) => (
                <option key={car._id} value={car._id}>
                  {car.nombre}
                </option>
              ))}
            </FormSelect>
            <FormInput
              id="materia-nombre"
              label="Nombre de la Asignatura"
              icon="menu_book"
              placeholder="Ej: Estructuras de Datos"
              value={materiaNombre}
              onChange={(e) => setMateriaNombre(e.target.value)}
              required
            />
            <FormInput
              id="materia-codigo"
              label="Código de Materia"
              icon="tag"
              placeholder="Ej: MAT-101"
              value={materiaCodigo}
              onChange={(e) => setMateriaCodigo(e.target.value)}
              required
            />
            <Button type="submit" variant="primary" size="sm" fullWidth>
              <Icon className="text-[16px]">add</Icon>
              <span>Añadir Materia</span>
            </Button>
          </form>

          <div className="space-y-2 pt-3 border-t border-surface-container flex-1 overflow-y-auto max-h-96">
            {materiasMostrar.length === 0 ? (
              <p className="text-xs text-outline text-center py-6">Sin materias registradas.</p>
            ) : (
              materiasMostrar.map((mat) => (
                <div
                  key={mat._id}
                  className="flex justify-between items-center p-3 bg-surface-container-low hover:bg-surface-container rounded-xl transition-colors"
                >
                  <div className="min-w-0">
                    <span className="font-label-md text-xs font-bold text-on-surface block truncate">
                      {mat.nombre}
                    </span>
                    <span className="text-[11px] text-outline block truncate">
                      <span className="font-mono">{mat.codigo}</span>{' '}
                      {mat.carrera ? `• ${mat.carrera.nombre}` : ''}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => eliminarMateria(mat._id)}
                    aria-label={`Eliminar materia ${mat.nombre}`}
                    className="w-8 h-8 rounded-lg hover:bg-error-container text-outline hover:text-error flex items-center justify-center transition-colors cursor-pointer shrink-0"
                  >
                    <Icon className="text-[16px]">delete</Icon>
                  </button>
                </div>
              ))
            )}
          </div>
        </SurfaceCard>
      </div>
    </div>
  );
}
