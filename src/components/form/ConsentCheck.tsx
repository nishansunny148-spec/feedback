import React from 'react';

export interface ConsentCheckProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
}

export const ConsentCheck: React.FC<ConsentCheckProps> = ({ checked, onChange, error }) => {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-start gap-3 cursor-pointer group select-none">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 w-4 h-4 rounded border-line/20 bg-raised text-accent focus:ring-accent focus:ring-offset-bg transition-colors"
          aria-invalid={Boolean(error)}
        />
        <span className="text-xs text-fg-2 group-hover:text-fg transition-colors leading-relaxed">
          I agree my voice note will be stored and used only for this project.
        </span>
      </label>

      {error && (
        <p className="text-xs text-danger font-medium ml-7" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};
