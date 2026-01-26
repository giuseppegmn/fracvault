import React from 'react';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  progress: number;
  className?: string;
  showGlow?: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ 
  progress, 
  className,
  showGlow = true 
}) => {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div className={cn('relative h-2 rounded-full bg-muted overflow-hidden', className)}>
      <div
        className={cn(
          'absolute inset-y-0 left-0 rounded-full bg-primary transition-all duration-500 ease-out',
          showGlow && clampedProgress > 0 && 'progress-glow'
        )}
        style={{ width: `${clampedProgress}%` }}
      />
      {/* Animated shimmer effect for active progress */}
      {clampedProgress > 0 && clampedProgress < 100 && (
        <div
          className="absolute inset-y-0 left-0 rounded-full overflow-hidden"
          style={{ width: `${clampedProgress}%` }}
        >
          <div className="absolute inset-0 shimmer" />
        </div>
      )}
    </div>
  );
};

export default ProgressBar;
