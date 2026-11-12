import ProfesorSidebar from '../../../components/layout/ProfesorSidebar';
import { RoleTopbar } from '../../../components/layout/RoleTopbar';

export default function ProfesorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <ProfesorSidebar />
      <div className="pl-64 flex flex-col min-h-screen">
        <RoleTopbar
          roleLabel="Docente Tutor"
          roleIcon="psychology"
          roleVariant="tertiary"
          subtitle="Panel de Gestión Docente — Tutorías Pro"
        />
        <main className="flex-1 pt-24 px-space-xl pb-space-xl">
          {children}
        </main>
      </div>
    </div>
  );
}
