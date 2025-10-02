import { Home, PlusCircle, PieChart, Tag, Wallet, Settings, Database } from "lucide-react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

const navigationItems = [
  {
    title: "Dashboard",
    icon: Home,
    href: "/",
    testId: "tab-dashboard"
  },
  {
    title: "Add",
    icon: PlusCircle,
    href: "/add",
    testId: "tab-add"
  },
  {
    title: "Analytics", 
    icon: PieChart,
    href: "/analytics",
    testId: "tab-analytics"
  },
  {
    title: "Categories",
    icon: Tag,
    href: "/categories",
    testId: "tab-categories"
  },
  {
    title: "Payments",
    icon: Wallet,
    href: "/payment-methods",
    testId: "tab-payment-methods"
  },
  {
    title: "Backup",
    icon: Database,
    href: "/backup-restore",
    testId: "tab-backup-restore"
  },
  {
    title: "Settings",
    icon: Settings,
    href: "/settings",
    testId: "tab-settings"
  }
];

export function BottomNavigation() {
  const [location] = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 ios-frosted-glass border-t border-border/40">
      <div className="safe-area-bottom">
        <div className="flex items-center justify-around gap-1 px-2 py-1.5">
          {navigationItems.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;
            
            return (
              <Link key={item.href} href={item.href} asChild>
                <button
                  className={cn(
                    "flex flex-col items-center justify-center min-w-0 flex-1 px-2 py-1.5 rounded-xl transition-all duration-200",
                    "min-h-[3.5rem]",
                    "active:scale-95 ios-transition",
                    isActive 
                      ? "bg-primary/15 text-primary" 
                      : "text-muted-foreground active:bg-muted/50",
                    item.title === "Add" && "hidden"
                  )}
                  data-testid={item.testId}
                >
                  <Icon 
                    className={cn(
                      "h-6 w-6 mb-0.5 transition-all duration-200",
                      isActive && "scale-110 drop-shadow-sm"
                    )} 
                  />
                  <span 
                    className={cn(
                      "text-[10px] font-medium leading-tight transition-all duration-200",
                      isActive && "font-semibold"
                    )}
                  >
                    {item.title}
                  </span>
                </button>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}