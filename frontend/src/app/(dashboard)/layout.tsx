'use client';

import { useAuth } from '../../context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }

    if (user && pathname === '/dashboard') {
      if (user.rol === 'admin') router.push('/admin/usuarios');
      else if (user.rol === 'profesor') router.push('/profesor/solicitudes');
      else if (user.rol === 'estudiante') router.push('/estudiante/buscar-tutorias');
    }
  }, [user, loading, pathname, router]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Cargando panel...</div>;
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}