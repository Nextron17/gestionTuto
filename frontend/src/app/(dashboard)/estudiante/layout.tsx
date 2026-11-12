import { StudentSidebar } from '../../../components/layout/StudentSidebar';
import { StudentTopbar } from '../../../components/layout/StudentTopbar';

export default function EstudianteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <StudentSidebar />
      <div className="pl-64 flex flex-col min-h-screen">
        <StudentTopbar />
        <main className="flex-1 pt-24 px-space-xl pb-space-xl">
          {children}
        </main>
      </div>
    </div>
  );
}