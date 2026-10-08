import React, { useState } from 'react';
import { cn } from '../../lib/cn';
import { LOGO_ALT, LOGO_SRC } from '../../lib/constants';

export interface BrandLogoProps {
  className?: string;
}

/**
 * Sfumato wordmark. Falls back to a text wordmark if the image file is missing,
 * so the layout never shows a broken-image icon.
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({ className }) => {
  const [failed, setFailed] = useState<boolean>(false);

  if (failed) {
    return (
      <span className={cn('inline-block font-bold lowercase tracking-tight text-fg text-2xl leading-none', className)}>
        sfumato
      </span>
    );
  }

  return (
    <img
      src={LOGO_SRC}
      alt={LOGO_ALT}
      onError={() => setFailed(true)}
      decoding="async"
      className={cn('brand-logo block h-auto object-contain select-none', className)}
      draggable={false}
    />
  );
};
