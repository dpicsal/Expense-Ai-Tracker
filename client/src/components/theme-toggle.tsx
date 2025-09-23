import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/providers/theme-provider";
import { useIsMobile } from "@/hooks/use-mobile";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isMobile = useIsMobile();

  return (
    <Button
      size="icon"
      variant="ghost"
      onClick={toggleTheme}
      data-testid="button-theme-toggle"
      className={`relative overflow-hidden ${isMobile ? 'h-11 w-11' : ''}`}
    >
      <div className="relative">
        {theme === "light" ? (
          <Moon className="h-4 w-4 rotate-0 scale-100 transition-all" />
        ) : (
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all" />
        )}
      </div>
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}