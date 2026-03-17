import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { ThemeProvider } from "@/context/ThemeContext";

import { AppLayout } from "@/components/layout/AppLayout";

import { Login } from "@/pages/Login";
import { Register } from "@/pages/Register";
import { Dashboard } from "@/pages/Dashboard";
import { Garage } from "@/pages/Garage";
import { MotorcycleDetails } from "@/pages/MotorcycleDetails";
import { Community } from "@/pages/Community";
import { TravelDiary } from "@/pages/TravelDiary";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { data: user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) setLocation("/login");
  }, [user, isLoading, setLocation]);

  if (isLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  if (!user) return null;

  return (
    <AppLayout>
      <Component />
    </AppLayout>
  );
}

function AuthRoute({ component: Component }: { component: React.ComponentType }) {
  const { data: user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && user) setLocation("/");
  }, [user, isLoading, setLocation]);

  if (isLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  if (user) return null;

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/login"><AuthRoute component={Login} /></Route>
      <Route path="/register"><AuthRoute component={Register} /></Route>

      <Route path="/"><ProtectedRoute component={Dashboard} /></Route>
      <Route path="/garage"><ProtectedRoute component={Garage} /></Route>
      <Route path="/garage/:id"><ProtectedRoute component={MotorcycleDetails} /></Route>
      <Route path="/community"><ProtectedRoute component={Community} /></Route>
      <Route path="/travel"><ProtectedRoute component={TravelDiary} /></Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
