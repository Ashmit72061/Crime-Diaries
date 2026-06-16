import { forwardRef } from 'react';
import { clsx } from 'clsx';

/**
 * Reusable Input component with label, error state, and helper text.
 */
export const Input = forwardRef(
  ({ label, error, helperText, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-zinc-300"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={clsx(
            'w-full h-10 px-3 rounded-xl bg-zinc-900 border text-zinc-100 text-sm placeholder:text-zinc-500 transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent',
            error
              ? 'border-red-500 focus:ring-red-500'
              : 'border-zinc-700 hover:border-zinc-600',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
        {helperText && !error && (
          <p className="text-xs text-zinc-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
