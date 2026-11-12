'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '../../../lib/api';
import { AxiosError } from 'axios';

interface CarreraItem {
  id: string;
  nombre: string;
}

export default function RegistroPage() {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState<'estudiante' | 'profesor'>('estudiante');
  const [carrera, setCarrera] = useState('');
  const [semestre, setSemestre] = useState('');
  const [carreras, setCarreras] = useState<CarreraItem[]>([]);
  const [error, setError] = useState('');

  const router = useRouter();

  useEffect(() => {
    const cargarCarreras = async () => {
      try {
        const res = await api.get('/auth/carreras');
        if (Array.isArray(res.data)) {
          setCarreras(res.data);
        }
      } catch (err) {
        console.error('Error cargando carreras de la API:', err);
        setCarreras([
          { id: '1', nombre: 'Ingeniería de Software y computación' },
          { id: '2', nombre: 'Derecho' },
          { id: '3', nombre: 'Administración de Empresas' },
          { id: '4', nombre: 'Ingeniería Civil' },
          { id: '5', nombre: 'Contaduría Pública' },
        ]);
      }
    };
    cargarCarreras();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await api.post('/auth/registro', {
        nombre,
        email,
        password,
        rol,
        carrera,
        semestre: rol === 'estudiante' ? Number(semestre) : undefined,
      });

      router.push('/login');
    } catch (err) {
      const errorAxios = err as AxiosError<{ message: string }>;
      setError(errorAxios.response?.data?.message || 'Error al registrar usuario');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 py-12">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-md space-y-6">
        <h2 className="text-2xl font-bold text-center text-gray-800">Crear Cuenta</h2>

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nombre Completo</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Rol</label>
            <select
              value={rol}
              onChange={(e) => setRol(e.target.value as 'estudiante' | 'profesor')}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
            >
              <option value="estudiante">Estudiante</option>
              <option value="profesor">Profesor</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Carrera</label>
            <select
              value={carrera}
              onChange={(e) => setCarrera(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
              required
            >
              <option value="">-- Seleccionar Carrera --</option>
              {carreras.map((car) => (
                <option key={car.id} value={car.nombre}>
                  {car.nombre}
                </option>
              ))}
            </select>
          </div>

          {rol === 'estudiante' && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Semestre</label>
              <input
                type="number"
                min={1}
                max={12}
                value={semestre}
                onChange={(e) => setSemestre(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition font-medium"
          >
            Registrarse
          </button>
        </form>

        <p className="text-center text-sm text-gray-600">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="text-blue-600 hover:underline">
            Inicia Sesión
          </Link>
        </p>
      </div>
    </div>
  );
}