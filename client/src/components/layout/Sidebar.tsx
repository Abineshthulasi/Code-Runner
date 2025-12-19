import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  ShoppingBag,
  Receipt,
  Wallet,
  Building2,
  Menu,
  FileBarChart
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Users } from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/" },
  { label: "Orders", icon: ShoppingBag, href: "/orders" },
  { label: "Billing", icon: Receipt, href: "/billing" },
  { label: "Expenses", icon: Wallet, href: "/expenses" },
  // Bank, Reports and Users handled dynamically
];

export function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();

  const items = [...NAV_ITEMS];

  if (user?.role === 'admin' || user?.role === 'manager') {
    items.push({ label: "Bank", icon: Building2, href: "/bank" });
    items.push({ label: "Reports", icon: FileBarChart, href: "/reports" });
  }

  if (user?.role === 'admin') {
    items.push({ label: "Users", icon: Users, href: "/users" });
  }

  return (
    <div className="h-screen w-64 bg-sidebar border-r border-sidebar-border flex flex-col fixed left-0 top-0 hidden md:flex">
      <div className="p-6 border-b border-sidebar-border">
        <h1 className="text-xl font-bold font-sans tracking-tight text-sidebar-foreground">
          Bobiz
        </h1>
        <p className="text-xs text-muted-foreground mt-1">Boutique Management</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {items.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <a
                className={cn(
                  "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-md transition-colors",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </a>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <p className="text-xs text-center text-muted-foreground">
          © 2025 Bobiz Designer Studio
        </p>
      </div>
    </div>
  );
}

export function MobileSidebar() {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const { user } = useAuth();

  const items = [...NAV_ITEMS];

  if (user?.role === 'admin' || user?.role === 'manager') {
    items.push({ label: "Bank", icon: Building2, href: "/bank" });
    items.push({ label: "Reports", icon: FileBarChart, href: "/reports" });
  }

  if (user?.role === 'admin') {
    items.push({ label: "Users", icon: Users, href: "/users" });
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="w-6 h-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0 bg-sidebar">
        <div className="p-6 border-b border-sidebar-border">
          <h1 className="text-xl font-bold font-sans tracking-tight text-sidebar-foreground">
            Bobiz
          </h1>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {items.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>
              <a
                className={cn(
                  "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-md transition-colors",
                  location === item.href
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </a>
            </Link>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
