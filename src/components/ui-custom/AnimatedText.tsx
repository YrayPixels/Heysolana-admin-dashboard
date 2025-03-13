
import { cn } from '@/lib/utils';
import React from 'react';

interface AnimatedTextProps {
  text?: string;
  children?: React.ReactNode;
  className?: string;
  gradient?: boolean;
  delay?: number;
}

const AnimatedText: React.FC<AnimatedTextProps> = ({ 
  text,
  children, 
  className,
  gradient = false,
  delay = 0
}) => {
  const content = text || children;
  
  return (
    <span 
      className={cn(
        'inline-block opacity-0 animate-fade-in',
        gradient && 'text-gradient-solana',
        className
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      {content}
    </span>
  );
};

export default AnimatedText;
