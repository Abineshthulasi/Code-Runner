import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { useStore } from "@/lib/store";
import { useEffect } from "react";

import Dashboard from "@/pages/Dashboard";
import Orders from "@/pages/Orders";
import Billing from "@/pages/Billing";
import Expenses from "@/pages/Expenses";
import Bank from "@/pages/Bank";
import Reports from "@/pages/Reports";
import PrintBill from "@/pages/PrintBill";
import AuthPage from "@/pages/Auth";
import Users from "@/pages/Users";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

function ProtectedRoute({ component: Component, ...rest }: any) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  if (!user) {
    return <Route {...rest} component={AuthPage} />;
  }

  return <Route {...rest} component={Component} />;
}

function Router() {
  const loadData = useStore((state) => state.loadData);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <Switch>
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/orders" component={Orders} />
      <ProtectedRoute path="/billing" component={Billing} />
      <ProtectedRoute path="/expenses" component={Expenses} />
      <ProtectedRoute path="/bank" component={Bank} />
      <ProtectedRoute path="/reports" component={Reports} />
      <ProtectedRoute path="/users" component={Users} />
      <ProtectedRoute path="/print-bill/:id" component={PrintBill} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AuthProvider>
          <Router />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
