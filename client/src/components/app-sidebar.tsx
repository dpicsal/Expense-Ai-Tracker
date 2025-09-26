import { Home, Tag, TrendingUp, Wallet, LogOut, Calendar, Settings } from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useExpenses } from "@/hooks/use-expenses";
import { formatCurrency } from "@/lib/utils";

const mainMenuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
    description: "Overview & recent expenses",
  },
  {
    title: "Analytics", 
    url: "/analytics",
    icon: TrendingUp,
    description: "Charts & insights",
  },
  {
    title: "Categories",
    url: "/categories", 
    icon: Tag,
    description: "Manage spending categories",
  },
  {
    title: "Payment Methods",
    url: "/payment-methods",
    icon: Wallet,
    description: "Manage payment methods & balances",
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
    description: "App preferences & category management",
  },
];


export function AppSidebar() {
  const [location] = useLocation();
  const { data: expenses = [] } = useExpenses();
  
  const totalThisMonth = expenses
    .filter(expense => {
      const expenseMonth = new Date(expense.date).getMonth();
      const currentMonth = new Date().getMonth();
      return expenseMonth === currentMonth;
    })
    .reduce((sum, expense) => sum + parseFloat(expense.amount), 0);

  return (
    <Sidebar className="border-r border-border/20 bg-sidebar">
      {/* Enhanced Header with Better Spacing */}
      <SidebarHeader className="p-6 border-b border-border/20">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-semibold text-lg tracking-tight text-foreground">ExpenseTracker</h1>
            <p className="text-xs text-muted-foreground leading-tight">Personal Finance Manager</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-5 py-6 space-y-8">
        {/* Refined Stats Card */}
        <Card className="bg-primary/5 border-primary/20 shadow-sm hover:shadow-md transition-all duration-200">
          <CardContent className="p-5">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <Calendar className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-medium text-primary">This Month</span>
              </div>
              <div className="w-2 h-2 bg-emerald-500 rounded-full" />
            </div>
            <div className="text-2xl font-semibold tabular-nums text-foreground">{formatCurrency(totalThisMonth)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {expenses.filter(e => new Date(e.date).getMonth() === new Date().getMonth()).length} transactions recorded
            </p>
          </CardContent>
        </Card>

        <Separator />

        {/* Improved Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2 mb-3">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {mainMenuItems.map((item) => {
                const isActive = location === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isActive}
                      className={`min-h-[3.5rem] px-3 py-3 rounded-xl transition-all duration-200 group ${
                        isActive 
                          ? 'bg-primary/10 border border-primary/20 shadow-sm' 
                          : 'hover-elevate active-elevate-2'
                      }`}
                      data-testid={`nav-${item.title.toLowerCase().replace(' ', '-')}`}
                    >
                      <Link href={item.url} className="flex items-center gap-3 w-full">
                        <div className={`p-2 rounded-lg transition-all duration-200 ${
                          isActive 
                            ? 'bg-primary/15' 
                            : 'bg-muted/50 group-hover:bg-primary/10'
                        }`}>
                          <item.icon className={`h-5 w-5 transition-colors duration-200 ${
                            isActive 
                              ? 'text-primary' 
                              : 'text-muted-foreground group-hover:text-primary'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`font-medium transition-colors duration-200 ${
                            isActive 
                              ? 'text-primary' 
                              : 'text-foreground group-hover:text-primary'
                          }`}>
                            {item.title}
                          </div>
                          <div className={`text-xs leading-tight transition-colors duration-200 ${
                            isActive 
                              ? 'text-primary/70' 
                              : 'text-muted-foreground group-hover:text-muted-foreground/90'
                          }`}>
                            {item.description}
                          </div>
                        </div>
                        {isActive && (
                          <div className="w-1 h-6 bg-primary rounded-full" />
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Refined Status Badge */}
        <div className="flex items-center justify-center">
          <Badge variant="secondary" className="text-xs bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800">
            <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2" />
            All synced
          </Badge>
        </div>
      </SidebarContent>

      {/* Cleaner Footer */}
      <SidebarFooter className="p-5 border-t border-border/20">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/30 shadow-sm hover-elevate transition-all duration-200 cursor-pointer group" data-testid="card-account-summary">
          <div className="relative">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                U
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-background rounded-full" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">
              Personal Account
            </div>
            <div className="text-xs text-muted-foreground">Free Plan</div>
          </div>
          <Button size="icon" variant="ghost" className="rounded-lg" data-testid="button-logout">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}