'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '../../../lib/api';
import { AxiosError } from 'axios';

export default function RegistroPage() {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState('estudiante');
  const [carrera, setCarrera] = useState('');
  const [semestre, setSemestre] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/auth/registro', {
        nombre,
        email,
        password,
        rol,
        carrera: rol === 'estudiante' ? carrera : undefined,
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
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Crear Cuenta</h2>
        
        {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
        
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
              onChange={(e) => setRol(e.target.value)} 
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="estudiante">Estudiante</option>
              <option value="profesor">Profesor</option>
            </select>
          </div>

          {rol === 'estudiante' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700">Carrera</label>
                <input 
                  type="text" 
                  value={carrera} 
                  onChange={(e) => setCarrera(e.target.value)} 
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Semestre</label>
                <input 
                  type="number" 
                  min="1"
                  max="10"
                  value={semestre} 
                  onChange={(e) => setSemestre(e.target.value)} 
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required 
                />
              </div>
            </>
          )}

          <button type="submit" className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition">
            Registrarse
          </button>
        </form>
        
        <p className="mt-4 text-center text-sm text-gray-600">
          ¿Ya tienes cuenta? <Link href="/login" className="text-blue-600 hover:underline">Inicia Sesión</Link>
        </p>
      </div>
    </div>
  );
}