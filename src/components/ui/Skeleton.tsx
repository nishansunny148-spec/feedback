import React from 'react';
import { cn } from '../../lib/cn';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className, ...props }) => {
  return <div className={cn('skeleton rounded-control', className)} {...props} />;
};
