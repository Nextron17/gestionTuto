'use client';

import { useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import api from '../../../../lib/api';
import { Icon } from '../../../../components/ui/Icon';
import { PageHeader } from '../../../../components/ui/PageHeader';
import { SearchInput } from '../../../../components/ui/SearchInput';
import { SurfaceCard } from '../../../../components/ui/SurfaceCard';
import { Button } from '../../../../components/ui/Button';
import { Carrera, Escuela, Materia, Usuario } from '../../../../components/admin/usuarios/types';
import { TablaUsuariosAdmin } from '../../../../components/admin/usuarios/TablaUsuariosAdmin';
import { ModalesUsuarioAdmin } from '../../../../components/admin/usuarios/ModalesUsuarioAdmin';

export default function AdminUsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [escuelas, setEscuelas] = useState<Escuela[]>([]);
  const [carreras, setCarreras] = useState<Carrera[]>([]);
  const [materiasCatalogo, setMateriasCatalogo] = useState<Materia[]>([]);
  const [cargando, setCargando] = useState(true);

  const [busqueda, setBusqueda] = useState('');
  const [filtroRol, setFiltroRol] = useState<string>('todos');

  const [modalAbierto, setModalAbierto] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState<Usuario | null>(null);
  const [guardandoUsuario, setGuardandoUsuario] = useState(false);
  const [errorForm, setErrorForm] = useState('');

  const [usuarioAEliminar, setUsuarioAEliminar] = useState<Usuario | null>(null);
  const [eliminando, setEliminando] = useState(false);

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState<'estudiante' | 'profesor' | 'admin'>('estudiante');
  const [escuela, setEscuela] = useState('');
  const [carrera, setCarrera] = useState('');
  const [semestre, setSemestre] = useState('');
  const [materiasSeleccionadas, setMateriasSeleccionadas] = useState<string[]>([]);

  const cargarDatosAPI = async () => {
    try {
      const [resUsuarios, resCatalogo] = await Promise.all([
        api.get('/admin/usuarios'),
        api.get('/admin/catalogo'),
      ]);
      setUsuarios(resUsuarios.data);
      setEscuelas(resCatalogo.data.escuelas || []);
      setCarreras(resCatalogo.data.carreras || []);
      setMateriasCatalogo(resCatalogo.data.materias || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const cargarInicial = async () => {
      await cargarDatosAPI();
      setCargando(false);
    };
    cargarInicial();
  }, []);

  const abrirModalCrear = () => {
    setUsuarioEditando(null);
    setNombre('');
    setEmail('');
    setPassword('');
    setRol('estudiante');
    setEscuela('');
    setCarrera('');
    setSemestre('');
    setMateriasSeleccionadas([]);
    setErrorForm('');
    setModalAbierto(true);
  };

  const abrirModalEditar = (u: Usuario) => {
    if (u.rol === 'admin') return;
    setUsuarioEditando(u);
    setNombre(u.nombre);
    setEmail(u.email);
    setPassword('');
    setRol(u.rol);
    setEscuela(u.escuela || '');
    setCarrera(u.carrera || '');
    setSemestre(u.semestre ? String(u.semestre) : '');
    setMateriasSeleccionadas(u.materias || []);
    setErrorForm('');
    setModalAbierto(true);
  };

  const toggleMateria = (nombreMateria: string) => {
    setMateriasSeleccionadas((prev) =>
      prev.includes(nombreMateria)
        ? prev.filter((m) => m !== nombreMateria)
        : [...prev, nombreMateria]
    );
  };

  const guardarUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorForm('');
    setGuardandoUsuario(true);

    try {
      const payload = {
        nombre,
        email,
        password,
        rol,
        escuela: rol === 'profesor' ? escuela : undefined,
        carrera: rol === 'profesor' || rol === 'estudiante' ? carrera : undefined,
        semestre: rol === 'estudiante' && semestre ? Number(semestre) : undefined,
        materias: rol === 'profesor' ? materiasSeleccionadas : [],
      };

      if (usuarioEditando) {
        await api.put(`/admin/usuarios/${usuarioEditando._id}`, payload);
      } else {
        await api.post('/admin/usuarios', payload);
      }

      setModalAbierto(false);
      await cargarDatosAPI();
    } catch (err) {
      const errorAxios = err as AxiosError<{ message: string }>;
      setErrorForm(errorAxios.response?.data?.message || 'Error al guardar el usuario');
    } finally {
      setGuardandoUsuario(false);
    }
  };

  const cambiarRolRapido = async (id: string, nuevoRol: string) => {
    try {
      await api.patch(`/admin/usuarios/${id}/rol`, { rol: nuevoRol });
      await cargarDatosAPI();
    } catch (err) {
      console.error(err);
    }
  };

  const confirmarEliminarUsuario = async () => {
    if (!usuarioAEliminar) return;
    setEliminando(true);
    try {
      await api.delete(`/admin/usuarios/${usuarioAEliminar._id}`);
      setUsuarioAEliminar(null);
      await cargarDatosAPI();
    } catch (err) {
      console.error(err);
    } finally {
      setEliminando(false);
    }
  };

  const escuelaSeleccionadaObj = escuelas.find((e) => e.nombre === escuela);
  const carrerasFiltradas = escuelaSeleccionadaObj
    ? carreras.filter(
      (c) =>
        c.escuela?._id === escuelaSeleccionadaObj._id ||
        c.escuela?.nombre === escuelaSeleccionadaObj.nombre
    )
    : carreras;

  const carreraSeleccionadaObj = carreras.find((c) => c.nombre === carrera);
  const materiasFiltradas = carreraSeleccionadaObj
    ? materiasCatalogo.filter(
      (m) =>
        m.carrera?._id === carreraSeleccionadaObj._id ||
        m.carrera?.nombre === carreraSeleccionadaObj.nombre
    )
    : materiasCatalogo;

  const usuariosFiltrados = usuarios.filter((u) => {
    const okRol = filtroRol === 'todos' || u.rol === filtroRol;
    const q = busqueda.toLowerCase();
    if (!q) return okRol;
    const okTexto =
      u.nombre.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.carrera && u.carrera.toLowerCase().includes(q)) ||
      (u.escuela && u.escuela.toLowerCase().includes(q));
    return okRol && okTexto;
  });

  if (cargando) {
    return (
      <div className="max-w-6xl mx-auto py-8 text-sm text-on-surface-variant flex items-center gap-2">
        <Icon className="text-primary animate-pulse">hourglass_top</Icon>
        <span>Cargando directorio de usuarios...</span>
      </div>
    );
  }

  return (
    <div className="space-y-space-lg max-w-6xl mx-auto">
      <PageHeader
        eyebrow="01. Control de Acceso y Perfiles"
        title="Gestión de Usuarios"
        description="Crea cuentas institucionales y administra la asignación académica de docentes y estudiantes."
        actions={
          <Button variant="primary" onClick={abrirModalCrear} className="w-full sm:w-auto">
            <Icon className="text-[18px]">person_add</Icon>
            <span>Crear Usuario</span>
          </Button>
        }
      />

      <SurfaceCard tone="lowest" className="p-4 sm:p-space-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="w-full md:flex-1 md:max-w-md">
          <SearchInput
            placeholder="Buscar por nombre, correo, escuela o carrera..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            onClear={() => setBusqueda('')}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'todos', label: 'Todos', count: usuarios.length },
            {
              id: 'estudiante',
              label: 'Estudiantes',
              count: usuarios.filter((u) => u.rol === 'estudiante').length,
            },
            {
              id: 'profesor',
              label: 'Profesores',
              count: usuarios.filter((u) => u.rol === 'profesor').length,
            },
            {
              id: 'admin',
              label: 'Administradores',
              count: usuarios.filter((u) => u.rol === 'admin').length,
            },
          ].map((tab) => {
            const active = filtroRol === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFiltroRol(tab.id)}
                className={`px-3 py-1.5 rounded-full font-label-md text-[12px] font-semibold transition-all cursor-pointer active:scale-95 ${active
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface'
                  }`}
              >
                {tab.label} ({tab.count})
              </button>
            );
          })}
        </div>
      </SurfaceCard>

      <TablaUsuariosAdmin
        usuariosTotalCount={usuarios.length}
        usuariosFiltrados={usuariosFiltrados}
        cambiarRolRapido={cambiarRolRapido}
        abrirModalEditar={abrirModalEditar}
        setUsuarioAEliminar={setUsuarioAEliminar}
      />

      <ModalesUsuarioAdmin
        modalAbierto={modalAbierto}
        cerrarModalUsuario={() => setModalAbierto(false)}
        usuarioEditando={usuarioEditando}
        guardarUsuario={guardarUsuario}
        guardandoUsuario={guardandoUsuario}
        errorForm={errorForm}
        nombre={nombre}
        setNombre={setNombre}
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        rol={rol}
        setRol={setRol}
        escuela={escuela}
        setEscuela={setEscuela}
        carrera={carrera}
        setCarrera={setCarrera}
        semestre={semestre}
        setSemestre={setSemestre}
        escuelas={escuelas}
        carreras={carreras}
        carrerasFiltradas={carrerasFiltradas}
        materiasFiltradas={materiasFiltradas}
        materiasSeleccionadas={materiasSeleccionadas}
        toggleMateria={toggleMateria}
        usuarioAEliminar={usuarioAEliminar}
        cerrarModalEliminar={() => setUsuarioAEliminar(null)}
        confirmarEliminarUsuario={confirmarEliminarUsuario}
        eliminando={eliminando}
      />
    </div>
  );
}
