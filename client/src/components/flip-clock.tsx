import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface FlipPanelProps {
  value: string;
  showAMPM?: boolean;
  isAM?: boolean;
}

function FlipPanel({ value, showAMPM = false, isAM = true }: FlipPanelProps) {
  const [currentValue, setCurrentValue] = useState(value);
  const [isFlipping, setIsFlipping] = useState(false);

  useEffect(() => {
    if (value !== currentValue) {
      setIsFlipping(true);
      const timer = setTimeout(() => {
        setCurrentValue(value);
        setIsFlipping(false);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [value, currentValue]);

  return (
    <div className="relative">
      <div className="relative w-24 h-32 md:w-32 md:h-40 bg-gray-900 border border-gray-700 rounded-xl overflow-hidden shadow-2xl">
        {/* Top half */}
        <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-gray-900 to-gray-800 border-b border-gray-700/50">
          <div
            className="absolute inset-0 flex items-center justify-center text-4xl md:text-5xl font-mono font-bold text-gray-100 transition-transform duration-150"
            style={{ 
              transformOrigin: "bottom",
              transform: isFlipping ? "rotateX(-90deg)" : "rotateX(0deg)"
            }}
          >
            {currentValue}
          </div>
        </div>
        
        {/* Bottom half */}
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-gray-800 to-gray-900">
          <div className="absolute inset-0 flex items-center justify-center text-4xl md:text-5xl font-mono font-bold text-gray-100">
            {currentValue}
          </div>
        </div>

        {/* Flip animation overlay */}
        {isFlipping && (
          <div 
            className="absolute top-1/2 left-0 w-full h-1/2 bg-gradient-to-t from-gray-800 to-gray-900 animate-flip z-10"
            style={{
              transformOrigin: "top",
              transform: "rotateX(90deg)",
              animation: "flipUp 0.15s ease-in-out"
            }}
          >
            <div 
              className="absolute inset-0 flex items-center justify-center text-4xl md:text-5xl font-mono font-bold text-gray-100"
              style={{ transform: "rotateX(180deg)" }}
            >
              {value}
            </div>
          </div>
        )}

        {/* AM/PM indicator in bottom left corner */}
        {showAMPM && (
          <div className="absolute bottom-2 left-2">
            <span className="text-xs md:text-sm font-bold text-gray-300 bg-gray-800/80 px-1.5 py-0.5 rounded">
              {isAM ? 'AM' : 'PM'}
            </span>
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
  
  // Convert to 12-hour format
  const hour24 = time.getHours();
  const isAM = hour24 < 12;
  const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
  
  const hours = formatTwoDigits(hour12);
  const minutes = formatTwoDigits(time.getMinutes());
  
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

  return (
    <div className={cn("flex flex-col items-center space-y-4", className)}>
      {showDate && (
        <div className="text-center">
          <h2 className="text-base md:text-lg font-semibold text-foreground mb-1">UAE Time</h2>
          <p className="text-xs md:text-sm text-muted-foreground">
            {formatDate(time)}
          </p>
        </div>
      )}
      
      <div className="flex items-center space-x-3 md:space-x-4">
        <FlipPanel value={hours} showAMPM={true} isAM={isAM} />
        <FlipPanel value={minutes} />
      </div>
    </div>
  );
}