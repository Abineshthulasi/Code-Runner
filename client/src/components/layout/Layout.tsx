import { Sidebar, MobileSidebar } from "./Sidebar";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      
      <main className="flex-1 md:ml-64 min-w-0 flex flex-col">
        <header className="h-16 border-b border-border flex items-center px-4 md:px-8 bg-card md:hidden">
          <MobileSidebar />
          <span className="ml-2 font-semibold md:hidden">Bobiz Atelier</span>
        </header>

        <div className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto w-full animate-in fade-in duration-500">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
