'use client';

import { useAuth } from '../../context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { Icon } from '../../components/ui/Icon';

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
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface text-on-surface-variant text-sm gap-2">
        <Icon className="text-primary animate-pulse">hourglass_top</Icon>
        <span>Cargando espacio de trabajo...</span>
      </div>
    );
  }

  return <>{children}</>;
}
