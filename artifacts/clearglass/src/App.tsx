import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { AppLayout } from "./components/layout/AppLayout";
import Dashboard from "./pages/dashboard";
import Transactions from "./pages/transactions";
import TransactionDetail from "./pages/transaction-detail";
import Alerts from "./pages/alerts";
import Models from "./pages/models";
import Synthetic from "./pages/synthetic";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/">
        <AppLayout><Dashboard /></AppLayout>
      </Route>
      <Route path="/transactions">
        <AppLayout><Transactions /></AppLayout>
      </Route>
      <Route path="/transactions/:id">
        {params => <AppLayout><TransactionDetail id={Number(params.id)} /></AppLayout>}
      </Route>
      <Route path="/alerts">
        <AppLayout><Alerts /></AppLayout>
      </Route>
      <Route path="/models">
        <AppLayout><Models /></AppLayout>
      </Route>
      <Route path="/synthetic">
        <AppLayout><Synthetic /></AppLayout>
      </Route>
      <Route>
        <AppLayout><NotFound /></AppLayout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
