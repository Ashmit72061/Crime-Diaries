import { clsx } from 'clsx';
import { Loader2 } from 'lucide-react';

const variants = {
  primary: 'bg-[#cca43b] hover:bg-[#bca037] text-zinc-950 font-bold shadow-md shadow-amber-500/10',
  secondary: 'bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700',
  danger: 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/25',
  ghost: 'bg-transparent hover:bg-zinc-800 text-zinc-300',
  outline: 'bg-transparent border border-[#cca43b] text-[#cca43b] hover:bg-[#cca43b]/10',
};

const sizes = {
  sm: 'h-8 px-3 text-sm rounded-lg',
  md: 'h-10 px-4 text-sm rounded-xl',
  lg: 'h-12 px-6 text-base rounded-xl',
};

/**
 * Reusable Button component.
 *
 * @param {'primary'|'secondary'|'danger'|'ghost'|'outline'} variant
 * @param {'sm'|'md'|'lg'} size
 * @param {boolean} isLoading
 * @param {boolean} fullWidth
 */
export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  fullWidth = false,
  className = '',
  disabled,
  as: Component = 'button',
  ...props
}) => {
  return (
    <Component
      className={clsx(
        'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cca43b] focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className
      )}
      disabled={Component === 'button' ? (isLoading || disabled) : undefined}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </Component>
  );
};
