import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useApp } from '@/store/app';

export function DemoPill() {
  const { t } = useTranslation();
  const { role } = useApp();
  return (
    <Link
      to="/demo"
      aria-label={`${t('demo.title')} — ${t(`demo.${role}`)}`}
      className="fixed bottom-3 right-3 sm:bottom-4 sm:right-4 z-50 inline-flex items-center gap-2 rounded-full bg-navy text-navy-foreground pl-2 pr-3 py-1.5 text-[11px] sm:text-xs font-medium shadow-elevated hover:bg-navy/90 transition-colors border border-white/10 max-w-[calc(100vw-1.5rem)]"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse ml-1.5 shrink-0" aria-hidden />
      <span className="opacity-70 hidden sm:inline">{t('demo.title')}:</span>
      <span className="font-semibold truncate">{t(`demo.${role}`)}</span>
      <span className="opacity-50 hidden sm:inline">·</span>
      <span className="opacity-80 hidden sm:inline-flex items-center gap-1">{t('demo.switch')} <ArrowRight className="h-3 w-3" /></span>
    </Link>
  );
}
