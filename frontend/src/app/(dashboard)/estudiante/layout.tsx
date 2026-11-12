import EstudianteSidebar from '../../../components/layout/EstudianteSidebar';

export default function EstudianteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <EstudianteSidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}