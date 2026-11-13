'use client';

import { useState } from 'react';
import AdminSidebar from '../../../components/layout/AdminSidebar';
import { RoleTopbar } from '../../../components/layout/RoleTopbar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-surface text-on-surface overflow-x-hidden">
      <AdminSidebar
        mobileOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
      <div className="pl-0 lg:pl-64 flex flex-col min-h-screen min-w-0">
        <RoleTopbar
          roleLabel="Administrador"
          roleIcon="shield_person"
          roleVariant="high"
          subtitle="Consola de Administración — Tutorías Pro"
          onOpenMenu={() => setMobileMenuOpen(true)}
        />
        <main className="flex-1 pt-20 sm:pt-24 px-4 sm:px-6 lg:px-space-xl pb-10 min-w-0 w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
