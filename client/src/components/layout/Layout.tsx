import { Sidebar, MobileSidebar } from "./Sidebar";
import { useStore } from "@/lib/store";
import { AlertCircle } from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const isGuestMode = useStore((state) => state.isGuestMode);

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />

      <main className="flex-1 md:ml-64 min-w-0 flex flex-col">
        {isGuestMode && (
          <div className="bg-amber-100 border-b border-amber-200 px-4 py-2 flex items-center justify-center text-sm text-amber-800">
            <AlertCircle className="w-4 h-4 mr-2" />
            <span className="font-medium">Viewing in Guest Mode</span>
            <span className="hidden sm:inline ml-1">- Changes are temporary and will not be saved to the database.</span>
          </div>
        )}
        <header className="h-16 border-b border-border flex items-center px-4 md:px-8 bg-card md:hidden">
          <MobileSidebar />
          <span className="ml-2 font-semibold md:hidden">Bobiz</span>
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
