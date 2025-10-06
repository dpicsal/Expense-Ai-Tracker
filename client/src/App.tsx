import { Switch, Route, Link, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/providers/theme-provider";
import { AppSidebar } from "@/components/app-sidebar";
import { BottomNavigation } from "@/components/bottom-navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { PaymentNotification } from "@/components/payment-notification";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";
import { PullToRefreshIndicator } from "@/components/pull-to-refresh-indicator";
import { useWebSocket } from "@/hooks/use-websocket";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Dashboard from "@/pages/dashboard";
import AddExpense from "@/pages/add-expense";
import Expenses from "@/pages/expenses";
import Analytics from "@/pages/analytics";
import Categories from "@/pages/categories";
import PaymentMethods from "@/pages/payment-methods";
import Settings from "@/pages/settings";
import BackupRestore from "@/pages/backup-restore";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/add" component={AddExpense} />
      <Route path="/expenses" component={Expenses} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/categories" component={Categories} />
      <Route path="/payment-methods" component={PaymentMethods} />
      <Route path="/backup-restore" component={BackupRestore} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function MobileApp() {
  const [location] = useLocation();
  const isMobile = useIsMobile();
  
  useWebSocket();
  
  const handleRefresh = async () => {
    await queryClient.invalidateQueries();
    await new Promise(resolve => setTimeout(resolve, 500));
  };

  const { pullDistance, isRefreshing } = usePullToRefresh({
    onRefresh: handleRefresh,
    enabled: isMobile,
  });

  return (
    <div className="flex flex-col h-screen w-full bg-background overflow-hidden">
      <PullToRefreshIndicator 
        pullDistance={pullDistance} 
        isRefreshing={isRefreshing} 
      />
      
      <header className="flex items-center justify-between gap-3 border-b border-border/40 ios-frosted-glass sticky top-0 z-40 px-4 py-3 safe-area-top min-h-[3.5rem]">
        <div className="min-w-0 flex items-center">
          <h1 className="font-semibold text-lg text-foreground truncate">ExpenseTracker</h1>
        </div>
        <div className="flex items-center gap-2">
          <PaymentNotification />
          <ThemeToggle />
        </div>
      </header>
      
      <main className="flex-1 overflow-auto bg-muted/30 overscroll-behavior-none">
        <div className="container mx-auto max-w-7xl px-3 py-4 pb-24">
          <Router />
        </div>
      </main>
      
      <BottomNavigation />
    </div>
  );
}

function DesktopApp() {
  const isMobile = useIsMobile();
  
  useWebSocket();
  
  const style = {
    "--sidebar-width": isMobile ? "18rem" : "20rem",
    "--sidebar-width-icon": isMobile ? "0rem" : "4rem",
  };

  return (
    <SidebarProvider 
      style={style as React.CSSProperties}
      defaultOpen={!isMobile}
    >
      <div className="flex h-screen w-full bg-background overflow-hidden">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex items-center justify-between gap-3 border-b border-border/20 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 transition-all duration-200 px-6 py-4 min-h-16">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <SidebarTrigger 
                data-testid="button-sidebar-toggle" 
                className="hover:bg-accent/50 transition-colors duration-200" 
              />
              <div className="flex flex-col">
                <h1 className="font-semibold text-xl text-foreground leading-tight">Welcome back</h1>
                <p className="text-sm text-muted-foreground leading-tight">Manage your expenses effectively</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <PaymentNotification />
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 overflow-auto bg-muted/20 ios-transition">
            <div className="container mx-auto max-w-7xl px-8 py-8">
              <Router />
            </div>
          </main>
        </div>
      </div>
      <Toaster />
    </SidebarProvider>
  );
}

function App() {
  const isMobile = useIsMobile();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider>
          {isMobile ? <MobileApp /> : <DesktopApp />}
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
