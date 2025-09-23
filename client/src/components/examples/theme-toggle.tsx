import { ThemeToggle } from '../theme-toggle';
import { ThemeProvider } from '@/providers/theme-provider';

export default function ThemeToggleExample() {
  return (
    <ThemeProvider>
      <div className="p-4">
        <ThemeToggle />
      </div>
    </ThemeProvider>
  );
}