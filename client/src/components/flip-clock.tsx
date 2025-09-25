import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface DigitDisplayProps {
  value: string;
  label?: string;
}

function DigitDisplay({ value, label }: DigitDisplayProps) {
  return (
    <div className="flex flex-col items-center space-y-2">
      {label && (
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {label}
        </span>
      )}
      <div className="relative">
        <div className="bg-background/50 backdrop-blur-sm border border-border/50 rounded-xl px-4 py-3 md:px-6 md:py-4 shadow-lg">
          <span className="text-6xl md:text-7xl font-light tabular-nums tracking-tight text-foreground">
            {value}
          </span>
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 rounded-xl pointer-events-none"></div>
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
    const updateTime = () => {
      setTime(new Date());
    };
    
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
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
    <div className={cn("flex flex-col items-center space-y-8", className)}>
      {showDate && (
        <div className="text-center">
          <div className="inline-flex items-center px-6 py-3 bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl shadow-lg">
            <p className="text-lg md:text-xl font-medium text-card-foreground">
              {formatDate(time)}
            </p>
          </div>
        </div>
      )}
      
      <div className="flex items-end justify-center gap-6 md:gap-8">
        <DigitDisplay value={hours} label="Hours" />
        
        <div className="flex flex-col items-center justify-center pb-8 space-y-3">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
        </div>
        
        <DigitDisplay value={minutes} label="Minutes" />
        
        <div className="flex flex-col items-center justify-center pb-8 space-y-3">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
        </div>
        
        <DigitDisplay value={seconds} label="Seconds" />
      </div>
      
      <div className="flex items-center justify-center">
        <div className="px-4 py-2 bg-primary/10 rounded-full border border-primary/20">
          <span className="text-sm font-semibold text-primary tracking-wider">
            {period}
          </span>
        </div>
      </div>
    </div>
  );
}