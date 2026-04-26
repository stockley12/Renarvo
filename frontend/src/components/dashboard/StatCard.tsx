import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface Props {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  trend?: number;
  accent?: 'brand' | 'success' | 'warning' | 'navy';
}

export function StatCard({ label, value, hint, icon: Icon, trend, accent = 'brand' }: Props) {
  const accentMap = {
    brand: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/15 text-warning',
    navy: 'bg-navy/10 text-navy dark:text-navy-foreground',
  };
  return (
    <Card className="p-5 hover:shadow-card transition-shadow">
      <div className="flex items-start justify-between">
        <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center', accentMap[accent])}>
          <Icon className="h-5 w-5" />
        </div>
        {trend !== undefined && (
          <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full',
            trend >= 0 ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive')}>
            {trend >= 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <div className="mt-4">
        <div className="text-2xl font-display font-bold">{value}</div>
        <div className="text-sm text-muted-foreground mt-0.5">{label}</div>
        {hint && <div className="text-xs text-muted-foreground/70 mt-1">{hint}</div>}
      </div>
    </Card>
  );
}
