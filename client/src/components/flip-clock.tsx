import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface DigitDisplayProps {
  value: string;
  label?: string;
}

function DigitDisplay({ value, label }: DigitDisplayProps) {
  return (
    <div className="flex flex-col items-center space-y-0.5">
      {label && (
        <span className="text-[8px] font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </span>
      )}
      <div className="relative">
        <div className="bg-background/50 backdrop-blur-sm border border-border/50 rounded-md px-2 py-1 shadow-sm">
          <span className="text-xl md:text-2xl font-light tabular-nums tracking-tight text-foreground">
            {value}
          </span>
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 rounded-md pointer-events-none"></div>
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
    <div className={cn("flex flex-col items-center space-y-2", className)}>
      {showDate && (
        <div className="text-center">
          <div className="inline-flex items-center px-3 py-1.5 bg-card/80 backdrop-blur-sm border border-border/50 rounded-lg shadow-sm">
            <p className="text-xs md:text-sm font-medium text-card-foreground">
              {formatDate(time)}
            </p>
          </div>
        </div>
      )}
      
      <div className="flex items-end justify-center gap-2 md:gap-3">
        <DigitDisplay value={hours} label="HH" />
        
        <div className="flex flex-col items-center justify-center pb-3 space-y-1">
          <div className="w-1 h-1 bg-primary rounded-full animate-pulse"></div>
          <div className="w-1 h-1 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
        </div>
        
        <DigitDisplay value={minutes} label="MM" />
        
        <div className="flex flex-col items-center justify-center pb-3 space-y-1">
          <div className="w-1 h-1 bg-primary rounded-full animate-pulse"></div>
          <div className="w-1 h-1 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
        </div>
        
        <DigitDisplay value={seconds} label="SS" />
      </div>
      
      <div className="flex items-center justify-center">
        <div className="px-2 py-1 bg-primary/10 rounded-md border border-primary/20">
          <span className="text-[10px] font-semibold text-primary tracking-wide">
            {period}
          </span>
        </div>
      </div>
    </div>
  );
}