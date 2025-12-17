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

function Router() {
  const loadData = useStore((state) => state.loadData);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <Switch>
      <Route path="/" component={Dashboard}/>
      <Route path="/orders" component={Orders}/>
      <Route path="/billing" component={Billing}/>
      <Route path="/expenses" component={Expenses}/>
      <Route path="/bank" component={Bank}/>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
