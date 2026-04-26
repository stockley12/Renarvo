import { Car as CarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  seed: string | number;
  className?: string;
}

// Generates a unique gradient placeholder per car (no external images needed)
export function CarImage({ seed, className }: Props) {
  const n = typeof seed === 'string' ? seed.split('').reduce((a, c) => a + c.charCodeAt(0), 0) : seed;
  const h1 = (n * 37) % 360;
  const h2 = (h1 + 40) % 360;
  return (
    <div
      className={cn('relative w-full h-full overflow-hidden flex items-center justify-center', className)}
      style={{
        background: `linear-gradient(135deg, hsl(${h1} 60% 55%), hsl(${h2} 65% 45%))`,
      }}
    >
      <CarIcon className="w-1/3 h-1/3 text-white/80" strokeWidth={1.5} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
    </div>
  );
}
