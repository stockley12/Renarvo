import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Logo } from '@/components/brand/Logo';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import { CurrencySwitcher } from '@/components/common/CurrencySwitcher';

export function PublicFooter() {
  const { t } = useTranslation();
  return (
    <footer className="border-t bg-muted/30 mt-20">
      <div className="container py-12 grid gap-10 md:grid-cols-4">
        <div className="space-y-3">
          <Logo />
          <p className="text-sm text-muted-foreground max-w-xs">{t('tagline')}</p>
        </div>
        <div>
          <h4 className="font-semibold mb-3 text-sm">{t('footer.company')}</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/about" className="hover:text-primary">About</Link></li>
            <li><Link to="/for-companies" className="hover:text-primary">{t('nav.forCompanies')}</Link></li>
            <li><Link to="/how-it-works" className="hover:text-primary">{t('nav.howItWorks')}</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-3 text-sm">{t('footer.support')}</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/help" className="hover:text-primary">{t('nav.help')}</Link></li>
            <li><Link to="/contact" className="hover:text-primary">Contact</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-3 text-sm">{t('footer.legal')}</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/terms" className="hover:text-primary">Terms</Link></li>
            <li><Link to="/privacy" className="hover:text-primary">Privacy</Link></li>
          </ul>
          <div className="flex gap-2 mt-4">
            <LanguageSwitcher />
            <CurrencySwitcher />
          </div>
        </div>
      </div>
      <div className="border-t py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Renarvo. {t('footer.rights')}
      </div>
    </footer>
  );
}
