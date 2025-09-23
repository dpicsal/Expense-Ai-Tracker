import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/providers/theme-provider";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { useIsMobile } from "@/hooks/use-mobile";
import Dashboard from "@/pages/dashboard";
import AddExpense from "@/pages/add-expense";
import Analytics from "@/pages/analytics";
import Categories from "@/pages/categories";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/add" component={AddExpense} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/categories" component={Categories} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const isMobile = useIsMobile();
  
  // Responsive sidebar configuration
  const style = {
    "--sidebar-width": isMobile ? "16rem" : "18rem",
    "--sidebar-width-icon": isMobile ? "0rem" : "3.5rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider>
          <SidebarProvider 
            style={style as React.CSSProperties}
            defaultOpen={!isMobile}
          >
            <div className="flex h-screen w-full bg-background">
              <AppSidebar />
              <div className="flex flex-col flex-1 min-w-0">
                <header className={`flex items-center justify-between border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 ${isMobile ? 'p-3' : 'p-4'}`}>
                  <div className="flex items-center gap-3">
                    <SidebarTrigger 
                      data-testid="button-sidebar-toggle" 
                      className={`hover:bg-accent/50 ${isMobile ? 'h-11 w-11' : ''}`} 
                    />
                    {!isMobile && (
                      <div>
                        <h2 className="font-semibold text-lg">Welcome back</h2>
                        <p className="text-sm text-muted-foreground">Manage your expenses effectively</p>
                      </div>
                    )}
                    {isMobile && (
                      <div>
                        <h2 className="font-semibold text-base">ExpenseTracker</h2>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <ThemeToggle />
                  </div>
                </header>
                <main className="flex-1 overflow-auto bg-muted/30">
                  <div className={`container mx-auto max-w-7xl ${isMobile ? 'p-3' : 'p-6'}`}>
                    <Router />
                  </div>
                </main>
              </div>
            </div>
            <Toaster />
          </SidebarProvider>
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
