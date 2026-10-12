import React from 'react';
import { cn } from '../../lib/cn';
import { LOGO_ALT, LOGO_SRC } from '../../lib/constants';

export interface BrandLogoProps {
  className?: string;
  alt?: string;
  style?: React.CSSProperties;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ className, alt, style }) => {
  return (
    <img
      src={LOGO_SRC}
      alt={alt || LOGO_ALT}
      decoding="async"
      draggable={false}
      style={{
        width: 'clamp(200px, 60vw, 280px)',
        height: 'auto',
        objectFit: 'contain',
        margin: '0 auto',
        display: 'block',
        ...style,
      }}
      className={cn('brand-logo select-none p-0 border-0 outline-none shadow-none', className)}
    />
  );
};
