import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface FlipPanelProps {
  value: string;
}

function FlipPanel({ value }: FlipPanelProps) {
  const [currentValue, setCurrentValue] = useState(value);
  const [nextValue, setNextValue] = useState(value);
  const [isFlipping, setIsFlipping] = useState(false);

  useEffect(() => {
    if (value !== currentValue) {
      setNextValue(value);
      setIsFlipping(true);
      const timer = setTimeout(() => {
        setCurrentValue(value);
        setIsFlipping(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [value, currentValue]);

  return (
    <div className="relative perspective-1000 preserve-3d">
      <div className="relative aspect-[3/4] w-16 md:w-20 bg-gradient-to-b from-card to-muted/70 border border-card-border rounded-lg shadow-sm">
        {/* Top half - static background */}
        <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-card to-muted/70 rounded-t-lg overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl md:text-5xl font-mono font-semibold tabular-nums leading-none text-card-foreground">
              {currentValue}
            </span>
          </div>
        </div>
        
        {/* Bottom half - static background */}
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-muted/70 to-card rounded-b-lg overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl md:text-5xl font-mono font-semibold tabular-nums leading-none text-card-foreground" style={{ marginTop: '-100%' }}>
              {currentValue}
            </span>
          </div>
        </div>

        {/* Hinge line */}
        <div className="absolute top-1/2 left-0 w-full h-px bg-card-border/60 shadow-inner"></div>

        {/* Top flap - animates down on flip */}
        {isFlipping && (
          <div 
            className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-card to-muted/70 rounded-t-lg overflow-hidden will-change-transform animate-flip"
            style={{ transformOrigin: 'bottom' }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl md:text-5xl font-mono font-semibold tabular-nums leading-none text-card-foreground">
                {currentValue}
              </span>
            </div>
          </div>
        )}

        {/* Bottom flap - animates up on flip */}
        {isFlipping && (
          <div 
            className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-muted/70 to-card rounded-b-lg overflow-hidden will-change-transform animate-flip-up"
            style={{ transformOrigin: 'top' }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl md:text-5xl font-mono font-semibold tabular-nums leading-none text-card-foreground" style={{ marginTop: '-100%' }}>
                {nextValue}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface FlipClockProps {
  showDate?: boolean;
  className?: string;
}

export function FlipClock({ showDate = true, className }: FlipClockProps) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const updateTimeToNextSecond = () => {
      const now = new Date();
      
      // Use robust timezone formatting
      const formatter = new Intl.DateTimeFormat('en-AE', {
        hour: '2-digit',
        minute: '2-digit', 
        second: '2-digit',
        hour12: true,
        timeZone: 'Asia/Dubai'
      });
      
      setTime(now);
      
      // Schedule next update at the start of the next second
      const msUntilNextSecond = 1000 - now.getMilliseconds();
      setTimeout(() => {
        updateTimeToNextSecond();
        // Then use interval for subsequent updates
        const interval = setInterval(updateTimeToNextSecond, 1000);
        return () => clearInterval(interval);
      }, msUntilNextSecond);
    };
    
    updateTimeToNextSecond();
  }, []);

  // Use Intl.DateTimeFormat for robust time formatting
  const timeFormatter = new Intl.DateTimeFormat('en-AE', {
    hour: '2-digit',
    minute: '2-digit', 
    second: '2-digit',
    hour12: true,
    timeZone: 'Asia/Dubai'
  });
  
  const timeParts = timeFormatter.formatToParts(time);
  const hours = timeParts.find(part => part.type === 'hour')?.value || '00';
  const minutes = timeParts.find(part => part.type === 'minute')?.value || '00';
  const seconds = timeParts.find(part => part.type === 'second')?.value || '00';
  const period = timeParts.find(part => part.type === 'dayPeriod')?.value || 'AM';
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-AE', {
      timeZone: 'Asia/Dubai',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className={cn("flex flex-col items-center space-y-6", className)}>
      {showDate && (
        <div className="text-center p-3 bg-primary/10 rounded-lg border border-primary/20">
          <p className="text-sm md:text-base font-medium text-primary bg-primary/5 px-3 py-1.5 rounded-md border border-primary/15">
            {formatDate(time)}
          </p>
        </div>
      )}
      
      <div className="flex items-center gap-3 md:gap-4">
        <div className="relative">
          <FlipPanel value={hours} />
          <div className="absolute -top-6 -right-2">
            <span className="text-[10px] md:text-xs text-muted-foreground/70 font-medium">
              {period}
            </span>
          </div>
        </div>
        
        <span className="-mt-1 px-1 text-4xl md:text-5xl tabular-nums text-muted-foreground/70 font-mono">
          :
        </span>
        
        <FlipPanel value={minutes} />
        
        <span className="-mt-1 px-1 text-4xl md:text-5xl tabular-nums text-muted-foreground/70 font-mono">
          :
        </span>
        
        <FlipPanel value={seconds} />
      </div>
    </div>
  );
}