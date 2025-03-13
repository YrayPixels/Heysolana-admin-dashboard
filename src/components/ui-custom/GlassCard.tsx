
import { cn } from '@/lib/utils';
import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  animateIn?: boolean;
  style?: React.CSSProperties;
}

const GlassCard: React.FC<GlassCardProps> = ({ 
  children, 
  className,
  animateIn = false,
  style = {}
}) => {
  return (
    <div 
      className={cn(
        'glass-card p-6 transition-all duration-300 ease-in-out',
        animateIn && 'opacity-0 animate-fade-up',
        className
      )}
      style={style}
    >
      {children}
    </div>
  );
};

export default GlassCard;
