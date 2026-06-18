import { clsx } from 'clsx';

/**
 * Card component — glassmorphism-styled container.
 *
 * @param {'default'|'glass'|'bordered'} variant
 */
export const Card = ({
  children,
  variant = 'default',
  className = '',
  padding = true,
  ...props
}) => {
  const variants = {
    default: 'bg-zinc-900 border border-zinc-800',
    glass: 'bg-white/5 backdrop-blur-md border border-white/10',
    bordered: 'bg-transparent border border-zinc-700',
  };

  return (
    <div
      className={clsx(
        'rounded-2xl shadow-xl',
        variants[variant],
        padding && 'p-6',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
