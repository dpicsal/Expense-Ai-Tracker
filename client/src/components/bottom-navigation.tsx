import { Home, PlusCircle, PieChart, Tag } from "lucide-react";
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
  }
];

export function BottomNavigation() {
  const [location] = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border/20 supports-[backdrop-filter]:bg-background/80">
      <div className="safe-area-bottom">
        <div className="flex items-center justify-around gap-1 px-2 py-2">
          {navigationItems.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;
            
            return (
              <Link key={item.href} href={item.href} asChild>
                <button
                  className={cn(
                    "flex flex-col items-center justify-center min-w-0 flex-1 px-2 py-2 rounded-xl transition-all duration-200",
                    "min-h-[3.5rem]", // iOS standard 56px touch target for bottom tabs
                    "hover-elevate active-elevate-2", // Use proper elevation utilities
                    isActive 
                      ? "bg-primary/10 text-primary" 
                      : "text-muted-foreground"
                  )}
                  data-testid={item.testId}
                >
                  <Icon 
                    className={cn(
                      "h-6 w-6 mb-1 transition-transform duration-200",
                      isActive && "scale-110"
                    )} 
                  />
                  <span 
                    className={cn(
                      "text-xs font-medium leading-none transition-all duration-200",
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