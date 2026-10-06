import { motion, type HTMLMotionProps } from 'framer-motion';
import React, { forwardRef } from 'react';
import { cn } from '../../lib/cn';

export interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      children,
      disabled,
      type = 'button',
      ...props
    },
    ref,
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-200 focus-ring rounded-control disabled:opacity-50 disabled:pointer-events-none select-none group cursor-pointer';

    const variants = {
      primary:
        'bg-accent text-accent-ink font-semibold shadow-md shadow-accent/20 hover:shadow-lg hover:shadow-accent/30 hover:brightness-105 active:scale-[0.98] border border-accent/40',
      secondary:
        'bg-raised text-fg border border-line/10 hover:bg-card hover:border-line/20 active:scale-[0.98]',
      outline:
        'bg-transparent text-fg border border-line/15 hover:bg-raised hover:border-line/30 active:scale-[0.98]',
      ghost: 'bg-transparent text-fg-2 hover:text-fg hover:bg-raised active:scale-[0.98]',
      danger: 'bg-danger text-danger-ink font-semibold shadow-md shadow-danger/20 hover:brightness-110 active:scale-[0.98]',
    };

    const sizes = {
      sm: 'h-9 px-3 text-xs gap-1.5',
      md: 'h-11 px-4 text-sm gap-2',
      lg: 'h-13 px-6 text-base gap-2.5 rounded-card',
      icon: 'h-11 w-11 p-0 text-sm',
    };

    return (
      <motion.button
        ref={ref}
        type={type}
        whileTap={{ scale: disabled || loading ? 1 : 0.97 }}
        disabled={disabled || loading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {loading ? (
          <svg className="w-4 h-4 animate-spin text-current" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          icon
        )}
        {children}
      </motion.button>
    );
  },
);

Button.displayName = 'Button';
