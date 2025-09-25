import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface FlipPanelProps {
  value: string;
  showAMPM?: boolean;
  isAM?: boolean;
}

function FlipPanel({ value, showAMPM = false, isAM = true }: FlipPanelProps) {
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
    <div className="relative">
      <div className="relative w-20 h-28 md:w-24 md:h-32 bg-gray-900 border border-gray-700 rounded-lg overflow-hidden shadow-xl">
        {/* Top half - shows current value */}
        <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-gray-900 to-gray-800 border-b border-gray-700/50 overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center text-xl md:text-2xl font-mono font-bold text-gray-100" style={{ top: '0px', height: '200%' }}>
            {currentValue}
          </div>
        </div>
        
        {/* Bottom half - shows next value during flip, current value when not flipping */}
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-gray-800 to-gray-900 overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center text-xl md:text-2xl font-mono font-bold text-gray-100" style={{ top: '-100%', height: '200%' }}>
            {isFlipping ? nextValue : currentValue}
          </div>
        </div>

        {/* AM/PM indicator in bottom left corner */}
        {showAMPM && (
          <div className="absolute bottom-1.5 left-1.5">
            <span className="text-xs font-bold text-gray-300 bg-gray-800/90 px-1.5 py-0.5 rounded-sm">
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

  return (
    <div className={cn("flex flex-col items-center space-y-4", className)}>
      {showDate && (
        <div className="text-center p-3 bg-primary/10 rounded-lg border border-primary/20">
          <p className="text-sm md:text-base font-medium text-primary bg-primary/5 px-3 py-1.5 rounded-md border border-primary/15">
            {formatDate(time)}
          </p>
        </div>
      )}
      
      <div className="flex items-center space-x-2 md:space-x-3">
        <FlipPanel value={hours} showAMPM={true} isAM={isAM} />
        <div className="flex flex-col items-center justify-center h-28 md:h-32 space-y-1">
          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
        </div>
        <FlipPanel value={minutes} />
        <div className="flex flex-col items-center justify-center h-28 md:h-32 space-y-1">
          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
        </div>
        <FlipPanel value={seconds} />
      </div>
    </div>
  );
}