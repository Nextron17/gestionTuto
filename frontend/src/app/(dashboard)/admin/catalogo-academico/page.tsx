'use client';

import { useEffect, useState } from 'react';
import api from '../../../../lib/api';

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
    return <div className="text-gray-500">Cargando catálogo académico...</div>;
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Catálogo Académico</h1>
        <p className="text-sm text-gray-500">Administra escuelas, carreras y asignaturas de la institución</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border space-y-4">
          <h2 className="text-lg font-bold text-gray-800">Escuelas</h2>
          <form onSubmit={agregarEscuela} className="space-y-3">
            <input
              type="text"
              placeholder="Nombre de la escuela"
              value={escuelaNombre}
              onChange={(e) => setEscuelaNombre(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-purple-500"
              required
            />
            <input
              type="text"
              placeholder="Código (Ej: ESC-ING)"
              value={escuelaCodigo}
              onChange={(e) => setEscuelaCodigo(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-purple-500"
              required
            />
            <button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium py-2 rounded-lg transition"
            >
              + Añadir Escuela
            </button>
          </form>

          <div className="space-y-2 pt-2 border-t">
            {escuelas.length === 0 ? (
              <p className="text-xs text-gray-400">Sin escuelas registradas.</p>
            ) : (
              escuelas.map((esc) => (
                <div
                  key={esc._id}
                  className="flex justify-between items-center p-2.5 bg-gray-50 rounded-lg border text-xs"
                >
                  <div>
                    <span className="font-bold text-gray-800 block">{esc.nombre}</span>
                    <span className="text-gray-500">{esc.codigo}</span>
                  </div>
                  <button
                    onClick={() => eliminarEscuela(esc._id)}
                    className="text-red-600 hover:text-red-800 font-medium"
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border space-y-4">
          <h2 className="text-lg font-bold text-gray-800">Carreras</h2>
          <form onSubmit={agregarCarrera} className="space-y-3">
            <select
              value={carreraEscuelaId}
              onChange={(e) => setCarreraEscuelaId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-purple-500"
              required
            >
              <option value="">Seleccionar Escuela...</option>
              {escuelas.map((esc) => (
                <option key={esc._id} value={esc._id}>
                  {esc.nombre}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Nombre de la carrera"
              value={carreraNombre}
              onChange={(e) => setCarreraNombre(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-purple-500"
              required
            />
            <input
              type="text"
              placeholder="Código (Ej: ING-SIS)"
              value={carreraCodigo}
              onChange={(e) => setCarreraCodigo(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-purple-500"
              required
            />
            <button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium py-2 rounded-lg transition"
            >
              + Añadir Carrera
            </button>
          </form>

          <div className="space-y-2 pt-2 border-t">
            {carreras.length === 0 ? (
              <p className="text-xs text-gray-400">Sin carreras registradas.</p>
            ) : (
              carreras.map((car) => (
                <div
                  key={car._id}
                  className="flex justify-between items-center p-2.5 bg-gray-50 rounded-lg border text-xs"
                >
                  <div>
                    <span className="font-bold text-gray-800 block">{car.nombre}</span>
                    <span className="text-gray-500">
                      {car.codigo} {car.escuela ? `• ${car.escuela.nombre}` : ''}
                    </span>
                  </div>
                  <button
                    onClick={() => eliminarCarrera(car._id)}
                    className="text-red-600 hover:text-red-800 font-medium"
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border space-y-4">
          <h2 className="text-lg font-bold text-gray-800">Materias</h2>
          <form onSubmit={agregarMateria} className="space-y-3">
            <select
              value={materiaCarreraId}
              onChange={(e) => setMateriaCarreraId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-purple-500"
              required
            >
              <option value="">Seleccionar Carrera...</option>
              {carreras.map((car) => (
                <option key={car._id} value={car._id}>
                  {car.nombre}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Nombre de la materia"
              value={materiaNombre}
              onChange={(e) => setMateriaNombre(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-purple-500"
              required
            />
            <input
              type="text"
              placeholder="Código (Ej: MAT-101)"
              value={materiaCodigo}
              onChange={(e) => setMateriaCodigo(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-purple-500"
              required
            />
            <button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium py-2 rounded-lg transition"
            >
              + Añadir Materia
            </button>
          </form>

          <div className="space-y-2 pt-2 border-t">
            {materias.length === 0 ? (
              <p className="text-xs text-gray-400">Sin materias registradas.</p>
            ) : (
              materias.map((mat) => (
                <div
                  key={mat._id}
                  className="flex justify-between items-center p-2.5 bg-gray-50 rounded-lg border text-xs"
                >
                  <div>
                    <span className="font-bold text-gray-800 block">{mat.nombre}</span>
                    <span className="text-gray-500">
                      {mat.codigo} {mat.carrera ? `• ${mat.carrera.nombre}` : ''}
                    </span>
                  </div>
                  <button
                    onClick={() => eliminarMateria(mat._id)}
                    className="text-red-600 hover:text-red-800 font-medium"
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}