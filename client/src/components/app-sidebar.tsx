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
    <Sidebar className="border-r border-border/20 bg-sidebar/95 backdrop-blur-sm">
      {/* Header with Branding */}
      <SidebarHeader className="p-6 border-b border-border/20">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-semibold text-lg tracking-tight text-foreground">ExpenseTracker</h1>
            <p className="text-xs text-muted-foreground leading-tight">Personal Finance</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-5 py-6 space-y-8">
        {/* Quick Stats Card */}
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/15 shadow-sm hover:shadow-md transition-all duration-200">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-primary">This Month</span>
              <Calendar className="h-4 w-4 text-primary" />
            </div>
            <div className="text-2xl font-semibold tabular-nums text-foreground">{formatCurrency(totalThisMonth)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {expenses.filter(e => new Date(e.date).getMonth() === new Date().getMonth()).length} transactions
            </p>
          </CardContent>
        </Card>


        <Separator />

        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent className="mt-4">
            <SidebarMenu className="space-y-2">
              {mainMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={location === item.url}
                    className="min-h-11 px-4 py-3 rounded-lg hover:bg-accent/50 transition-all duration-200 group"
                    data-testid={`nav-${item.title.toLowerCase().replace(' ', '-')}`}
                  >
                    <Link href={item.url} className="flex items-center gap-4">
                      <item.icon className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-foreground">{item.title}</div>
                        <div className="text-xs text-muted-foreground truncate leading-tight">
                          {item.description}
                        </div>
                      </div>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Feature Badge */}
        <div className="flex items-center justify-center">
          <Badge variant="secondary" className="text-xs">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2" />
            All synced
          </Badge>
        </div>
      </SidebarContent>

      {/* Footer with User Profile */}
      <SidebarFooter className="p-5 border-t border-border/20">
        <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-all duration-200 cursor-pointer min-h-11">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
              U
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm">Personal Account</div>
            <div className="text-xs text-muted-foreground">Free Plan</div>
          </div>
          <Button size="icon" variant="ghost" className="h-9 w-9 rounded-lg">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}