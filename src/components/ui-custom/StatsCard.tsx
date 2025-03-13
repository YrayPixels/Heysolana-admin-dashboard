
import React from 'react';
import GlassCard from './GlassCard';
import { cn } from '@/lib/utils';
import AnimatedText from './AnimatedText';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  className?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  } | string;
  description?: string;
  delay?: number;
}

const StatsCard: React.FC<StatsCardProps> = ({ 
  title, 
  value, 
  icon,
  className,
  trend,
  description,
  delay = 0
}) => {
  // Handle both legacy string trend and new object trend
  const trendObject = typeof trend === 'string' 
    ? { value: parseInt(trend.replace(/[^0-9]/g, '')), isPositive: trend.includes('+') } 
    : trend;
    
  return (
    <GlassCard 
      className={cn('flex flex-col h-32 justify-between overflow-hidden relative', className)}
      animateIn
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <h3 className="text-2xl font-semibold">
            <AnimatedText delay={delay}>{value}</AnimatedText>
          </h3>
          {trendObject && (
            <div className="flex items-center mt-1">
              <span className={trendObject.isPositive ? 'text-green-500' : 'text-red-500'}>
                {trendObject.isPositive ? '↑' : '↓'} {trendObject.value}%
              </span>
              {description && <span className="text-xs text-muted-foreground ml-1">{description}</span>}
            </div>
          )}
        </div>
        {icon && (
          <div className="h-8 w-8 flex items-center justify-center rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
        )}
      </div>
      <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-primary/5 rounded-full blur-xl"></div>
    </GlassCard>
  );
};

export default StatsCard;
