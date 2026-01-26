import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface DeadlineTimerProps {
  deadline: number; // Unix timestamp in seconds
  compact?: boolean;
  onExpire?: () => void;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const DeadlineTimer: React.FC<DeadlineTimerProps> = ({ 
  deadline, 
  compact = false,
  onExpire 
}) => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = Math.floor(Date.now() / 1000);
      const difference = deadline - now;

      if (difference <= 0) {
        setIsExpired(true);
        onExpire?.();
        return null;
      }

      return {
        days: Math.floor(difference / (60 * 60 * 24)),
        hours: Math.floor((difference % (60 * 60 * 24)) / (60 * 60)),
        minutes: Math.floor((difference % (60 * 60)) / 60),
        seconds: difference % 60,
      };
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [deadline, onExpire]);

  if (isExpired) {
    return (
      <span className={cn(
        'text-destructive font-medium',
        compact ? 'text-xs' : 'text-sm'
      )}>
        Expired
      </span>
    );
  }

  if (!timeLeft) {
    return null;
  }

  if (compact) {
    // Compact format: "2d 5h" or "5h 30m" or "30m 15s"
    if (timeLeft.days > 0) {
      return <span>{timeLeft.days}d {timeLeft.hours}h</span>;
    }
    if (timeLeft.hours > 0) {
      return <span>{timeLeft.hours}h {timeLeft.minutes}m</span>;
    }
    return (
      <span className="text-warning">
        {timeLeft.minutes}m {timeLeft.seconds}s
      </span>
    );
  }

  // Full format with individual boxes
  const timeUnits = [
    { label: 'Days', value: timeLeft.days },
    { label: 'Hours', value: timeLeft.hours },
    { label: 'Min', value: timeLeft.minutes },
    { label: 'Sec', value: timeLeft.seconds },
  ];

  const isUrgent = timeLeft.days === 0 && timeLeft.hours < 6;

  return (
    <div className="flex gap-2">
      {timeUnits.map((unit) => (
        <div
          key={unit.label}
          className={cn(
            'flex flex-col items-center px-3 py-2 rounded-lg bg-card border border-border/50 min-w-[60px]',
            isUrgent && 'border-warning/50 bg-warning/5'
          )}
        >
          <span className={cn(
            'text-xl font-bold tabular-nums',
            isUrgent && 'text-warning'
          )}>
            {unit.value.toString().padStart(2, '0')}
          </span>
          <span className="text-xs text-muted-foreground">{unit.label}</span>
        </div>
      ))}
    </div>
  );
};

export default DeadlineTimer;
