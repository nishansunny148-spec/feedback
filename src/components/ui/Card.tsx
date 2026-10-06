import { motion, type HTMLMotionProps } from 'framer-motion';
import React, { forwardRef } from 'react';
import { cn } from '../../lib/cn';

export interface CardProps extends HTMLMotionProps<'div'> {
  variant?: 'glass' | 'raised' | 'flat';
  children?: React.ReactNode;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'glass', children, ...props }, ref) => {
    const variants = {
      glass: 'glass rounded-card p-6',
      raised: 'bg-raised border border-line/10 rounded-card p-6 shadow-lift',
      flat: 'bg-card border border-line/5 rounded-card p-6',
    };

    return (
      <motion.div ref={ref} className={cn(variants[variant], className)} {...props}>
        {children}
      </motion.div>
    );
  },
);

Card.displayName = 'Card';
