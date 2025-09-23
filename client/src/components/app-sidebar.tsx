import { Home, PlusCircle, PieChart, Tag, TrendingUp, Wallet, User, LogOut, Calendar } from "lucide-react";
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
];

const quickActions = [
  {
    title: "Add Expense",
    url: "/add",
    icon: PlusCircle,
    primary: true,
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
    <Sidebar className="border-r border-border/50">
      {/* Header with Branding */}
      <SidebarHeader className="p-6 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight">ExpenseTracker</h1>
            <p className="text-xs text-muted-foreground">Personal Finance</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-4 py-6 space-y-6">
        {/* Quick Stats Card */}
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-primary">This Month</span>
              <Calendar className="h-4 w-4 text-primary" />
            </div>
            <div className="text-2xl font-bold tabular-nums">${totalThisMonth.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {expenses.filter(e => new Date(e.date).getMonth() === new Date().getMonth()).length} transactions
            </p>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Quick Actions
          </SidebarGroupLabel>
          <SidebarGroupContent className="mt-3">
            <div className="space-y-2">
              {quickActions.map((item) => (
                <Button
                  key={item.title}
                  asChild
                  className="w-full justify-start h-11"
                  data-testid={`quick-${item.title.toLowerCase().replace(' ', '-')}`}
                >
                  <Link href={item.url}>
                    <item.icon className="h-4 w-4 mr-3" />
                    {item.title}
                  </Link>
                </Button>
              ))}
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator />

        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent className="mt-3">
            <SidebarMenu className="space-y-1">
              {mainMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={location === item.url}
                    className="h-11 px-3 rounded-lg hover:bg-accent/50 transition-colors group"
                    data-testid={`nav-${item.title.toLowerCase().replace(' ', '-')}`}
                  >
                    <Link href={item.url} className="flex items-center gap-3">
                      <item.icon className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{item.title}</div>
                        <div className="text-xs text-muted-foreground truncate">
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
      <SidebarFooter className="p-4 border-t border-border/50">
        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
              U
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm">Personal Account</div>
            <div className="text-xs text-muted-foreground">Free Plan</div>
          </div>
          <Button size="icon" variant="ghost" className="h-8 w-8">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}