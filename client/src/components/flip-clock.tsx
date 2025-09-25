import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface DigitDisplayProps {
  value: string;
  label?: string;
}

function DigitDisplay({ value }: DigitDisplayProps) {
  return (
    <span className="text-lg font-medium tabular-nums text-foreground">
      {value}
    </span>
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
    <div className={cn("", className)}>
      {showDate && (
        <div className="text-center mb-2">
          <p className="text-xs text-muted-foreground">
            {formatDate(time)}
          </p>
        </div>
      )}
      
      <div className="flex items-center justify-center gap-1">
        <DigitDisplay value={hours} />
        <span className="text-sm text-muted-foreground">:</span>
        <DigitDisplay value={minutes} />
        <span className="text-sm text-muted-foreground">:</span>
        <DigitDisplay value={seconds} />
        <span className="text-xs text-primary ml-1 font-medium">
          {period}
        </span>
      </div>
    </div>
  );
}