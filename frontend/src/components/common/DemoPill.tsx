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
      className="fixed bottom-4 right-4 z-50 inline-flex items-center gap-2 rounded-full bg-navy text-navy-foreground pl-2 pr-3 py-1.5 text-xs font-medium shadow-elevated hover:bg-navy/90 transition-colors border border-white/10"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse ml-1.5" aria-hidden />
      <span className="opacity-70">{t('demo.title')}:</span>
      <span className="font-semibold">{t(`demo.${role}`)}</span>
      <span className="opacity-50">·</span>
      <span className="opacity-80 inline-flex items-center gap-1">{t('demo.switch')} <ArrowRight className="h-3 w-3" /></span>
    </Link>
  );
}
