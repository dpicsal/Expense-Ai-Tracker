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
    <Sidebar className="bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800">
      {/* Minimal Header */}
      <SidebarHeader className="px-6 py-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-slate-900 dark:bg-white rounded-lg flex items-center justify-center">
            <Wallet className="w-4 h-4 text-white dark:text-slate-900" />
          </div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">Expense</h1>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-4 py-2">
        {/* Compact Stats */}
        <div className="mb-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4" data-testid="text-monthly-total">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">THIS MONTH</div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">{formatCurrency(totalThisMonth)}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {expenses.filter(e => new Date(e.date).getMonth() === new Date().getMonth()).length} expenses
          </div>
        </div>

        {/* Clean Navigation */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {mainMenuItems.map((item) => {
                const isActive = location === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isActive}
                      className={`h-12 px-3 rounded-xl font-medium transition-all duration-150 ${
                        isActive 
                          ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' 
                          : 'text-slate-600 dark:text-slate-400 hover-elevate'
                      }`}
                      data-testid={`nav-${item.title.toLowerCase().replace(' ', '-')}`}
                    >
                      <Link href={item.url} className="flex items-center gap-3 w-full">
                        <item.icon className="w-5 h-5 flex-shrink-0" />
                        <span className="truncate">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Simple Footer */}
      <SidebarFooter className="px-4 pb-4">
        <div className="flex items-center gap-3 p-2 rounded-xl hover-elevate transition-colors cursor-pointer" data-testid="card-account-summary">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white text-sm font-medium">
              U
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-slate-900 dark:text-white truncate">Personal</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Free</div>
          </div>
          <Button size="icon" variant="ghost" className="rounded-lg text-slate-500 dark:text-slate-400" data-testid="button-logout">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center justify-center mt-4">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
            Synced
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}