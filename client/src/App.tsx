import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { useEffect, Suspense } from "react";
import { useAuth } from "@/hooks/use-auth";
import { ThemeProvider } from "@/context/ThemeContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { createLazyComponent, prefetchPage } from "@/lib/route-prefetch";

const Login = createLazyComponent("Login");
const Register = createLazyComponent("Register");
const ForgotPassword = createLazyComponent("ForgotPassword");
const ResetPassword = createLazyComponent("ResetPassword");
const Dashboard = createLazyComponent("Dashboard");
const Garage = createLazyComponent("Garage");
const MotorcycleDetails = createLazyComponent("MotorcycleDetails");
const Community = createLazyComponent("Community");
const TravelDiary = createLazyComponent("TravelDiary");
const Games = createLazyComponent("Games");
const Shop = createLazyComponent("Shop");
const Welcome = createLazyComponent("Welcome");

const ContentLoader = () => (
  <div className="w-full flex items-center justify-center py-20 animate-in fade-in duration-500">
    <div className="flex flex-col items-center gap-4">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground animate-pulse">Initializing Interface...</p>
    </div>
  </div>
);

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
      <Suspense fallback={<ContentLoader />}>
        <Component />
      </Suspense>
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

  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <Component />
    </Suspense>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login"><AuthRoute component={Login} /></Route>
      <Route path="/register"><AuthRoute component={Register} /></Route>
      <Route path="/forgot-password"><AuthRoute component={ForgotPassword} /></Route>
      <Route path="/reset-password"><AuthRoute component={ResetPassword} /></Route>
      <Route path="/welcome"><Welcome /></Route>

      <Route path="/"><ProtectedRoute component={Dashboard} /></Route>
      <Route path="/garage"><ProtectedRoute component={Garage} /></Route>
      <Route path="/garage/:id"><ProtectedRoute component={MotorcycleDetails} /></Route>
      <Route path="/community"><ProtectedRoute component={Community} /></Route>
      <Route path="/travel"><ProtectedRoute component={TravelDiary} /></Route>
      <Route path="/games" component={Games} />
      <Route path="/shop" component={Shop} />
      <Route path="/welcome" component={Welcome} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useEffect(() => {
    // Quietly prefetch main pages after the app has mounted
    const timer = setTimeout(() => {
      prefetchPage('Dashboard');
      prefetchPage('Garage');
      prefetchPage('Community');
      prefetchPage('TravelDiary');
      prefetchPage('Games');
      prefetchPage('Welcome');
    }, 2000); // 2 seconds delay to avoid competing with initial load
    return () => clearTimeout(timer);
  }, []);

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
