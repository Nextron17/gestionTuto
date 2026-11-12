import ProfesorSidebar from '../../../components/layout/ProfesorSidebar';

export default function ProfesorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <ProfesorSidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}