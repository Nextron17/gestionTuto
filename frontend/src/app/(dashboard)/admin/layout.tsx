import AdminSidebar from '../../../components/layout/AdminSidebar';
import { RoleTopbar } from '../../../components/layout/RoleTopbar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <AdminSidebar />
      <div className="pl-64 flex flex-col min-h-screen">
        <RoleTopbar
          roleLabel="Administrador"
          roleIcon="shield_person"
          roleVariant="high"
          subtitle="Consola de Administración Institucional — Tutorías Pro"
        />
        <main className="flex-1 pt-24 px-space-xl pb-space-xl">
          {children}
        </main>
      </div>
    </div>
  );
}
