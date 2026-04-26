import { cn } from '@/lib/utils';
import iconUrl from '@/assets/renarvo-icon.png';
import wordmarkUrl from '@/assets/renarvo-wordmark.png';

interface LogoProps {
  className?: string;
  size?: number;
  showWordmark?: boolean;
  /**
   * 'auto'  — uses navy wordmark (for light surfaces)
   * 'light' — wordmark in white (for dark/hero surfaces)
   * 'dark'  — wordmark in navy
   * 'mark'  — only the square icon
   */
  variant?: 'auto' | 'light' | 'dark' | 'mark';
}

export function Logo({ className, size = 36, showWordmark = true, variant = 'auto' }: LogoProps) {
  // Mark-only.
  if (variant === 'mark' || !showWordmark) {
    return (
      <div className={cn('flex items-center', className)}>
        <img
          src={iconUrl}
          alt="Renarvo"
          style={{ width: size, height: size }}
          className="select-none"
          draggable={false}
        />
      </div>
    );
  }

  // 'auto' uses the navy wordmark in light mode and switches to icon + white text in dark mode.
  if (variant === 'auto') {
    return (
      <div className={cn('flex items-center', className)}>
        {/* Light mode: full navy wordmark image */}
        <img
          src={wordmarkUrl}
          alt="Renarvo"
          style={{ height: size }}
          className="w-auto select-none dark:hidden"
          draggable={false}
        />
        {/* Dark mode: icon + white wordmark text */}
        <div className="hidden dark:flex items-center gap-2.5">
          <img
            src={iconUrl}
            alt=""
            style={{ width: size, height: size }}
            className="select-none"
            draggable={false}
          />
          <span
            className="font-display font-extrabold tracking-tight leading-none text-white"
            style={{ fontSize: size * 0.6 }}
          >
            Renarvo
          </span>
        </div>
      </div>
    );
  }

  // Forced light (white text on dark hero) or dark (navy text on light).
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <img
        src={iconUrl}
        alt="Renarvo"
        style={{ width: size, height: size }}
        className="select-none"
        draggable={false}
      />
      <span
        className={cn(
          'font-display font-extrabold tracking-tight leading-none',
          variant === 'light' ? 'text-white' : 'text-foreground'
        )}
        style={{ fontSize: size * 0.6 }}
      >
        Renarvo
      </span>
    </div>
  );
}
