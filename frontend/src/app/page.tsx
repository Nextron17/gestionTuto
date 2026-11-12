'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user) {
        if (user.rol === 'admin') router.push('/admin/usuarios');
        else if (user.rol === 'profesor') router.push('/profesor/solicitudes');
        else router.push('/estudiante/buscar-tutorias');
      } else {
        router.push('/login');
      }
    }
  }, [user, loading, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 text-gray-600">
      Redirigiendo...
    </div>
  );
}