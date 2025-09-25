import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface FlipDigitProps {
  digit: string;
  label?: string;
}

function FlipDigit({ digit, label }: FlipDigitProps) {
  const [currentDigit, setCurrentDigit] = useState(digit);
  const [isFlipping, setIsFlipping] = useState(false);

  useEffect(() => {
    if (digit !== currentDigit) {
      setIsFlipping(true);
      const timer = setTimeout(() => {
        setCurrentDigit(digit);
        setIsFlipping(false);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [digit, currentDigit]);

  return (
    <div className="relative flex flex-col items-center">
      <div className="relative w-12 h-16 md:w-14 md:h-18 bg-card border border-border/20 rounded-md overflow-hidden shadow-lg">
        {/* Top half */}
        <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-card to-card/80 border-b border-border/10">
          <div
            className="absolute inset-0 flex items-center justify-center text-lg md:text-xl font-mono font-bold text-foreground transition-transform duration-150"
            style={{ 
              transformOrigin: "bottom",
              transform: isFlipping ? "rotateX(-90deg)" : "rotateX(0deg)"
            }}
          >
            {currentDigit}
          </div>
        </div>
        
        {/* Bottom half */}
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-card/60 to-card">
          <div className="absolute inset-0 flex items-center justify-center text-lg md:text-xl font-mono font-bold text-foreground">
            {currentDigit}
          </div>
        </div>

        {/* Flip animation overlay */}
        {isFlipping && (
          <div 
            className="absolute top-1/2 left-0 w-full h-1/2 bg-gradient-to-t from-card/80 to-card animate-flip z-10"
            style={{
              transformOrigin: "top",
              transform: "rotateX(90deg)",
              animation: "flipUp 0.15s ease-in-out"
            }}
          >
            <div 
              className="absolute inset-0 flex items-center justify-center text-lg md:text-xl font-mono font-bold text-foreground"
              style={{ transform: "rotateX(180deg)" }}
            >
              {digit}
            </div>
          </div>
        )}
      </div>
      
      {label && (
        <span className="mt-1 text-xs text-muted-foreground font-medium uppercase tracking-wide">
          {label}
        </span>
      )}
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
      // Get current time in UAE timezone
      const now = new Date();
      const uaeTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Dubai"}));
      setTime(uaeTime);
    };
    
    updateTime(); // Set initial time
    const timer = setInterval(updateTime, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTwoDigits = (num: number) => num.toString().padStart(2, '0');
  
  const hours = formatTwoDigits(time.getHours());
  const minutes = formatTwoDigits(time.getMinutes());
  const seconds = formatTwoDigits(time.getSeconds());
  
  const formatDate = (date: Date) => {
    // Format the passed-in UAE date consistently
    return date.toLocaleDateString('en-AE', {
      timeZone: 'Asia/Dubai',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isAM = time.getHours() < 12;

  return (
    <div className={cn("flex flex-col items-center space-y-3", className)}>
      {showDate && (
        <div className="text-center">
          <h2 className="text-base md:text-lg font-semibold text-foreground mb-1">UAE Time</h2>
          <p className="text-xs md:text-sm text-muted-foreground">
            {formatDate(time)}
          </p>
        </div>
      )}
      
      <div className="flex items-center space-x-1 md:space-x-2">
        <FlipDigit digit={hours[0]} />
        <FlipDigit digit={hours[1]} label="hours" />
        
        <div className="flex flex-col items-center justify-center h-16 md:h-18 space-y-1">
          <div className="w-1 h-1 bg-foreground rounded-full"></div>
          <div className="w-1 h-1 bg-foreground rounded-full"></div>
        </div>
        
        <FlipDigit digit={minutes[0]} />
        <FlipDigit digit={minutes[1]} label="minutes" />
        
        <div className="flex flex-col items-center justify-center h-16 md:h-18 space-y-1">
          <div className="w-1 h-1 bg-foreground rounded-full"></div>
          <div className="w-1 h-1 bg-foreground rounded-full"></div>
        </div>
        
        <FlipDigit digit={seconds[0]} />
        <FlipDigit digit={seconds[1]} label="seconds" />
        
        <div className="flex flex-col items-center justify-center ml-1 md:ml-2">
          <div className="text-sm md:text-base font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-md border border-primary/20">
            {isAM ? 'AM' : 'PM'}
          </div>
        </div>
      </div>
    </div>
  );
}