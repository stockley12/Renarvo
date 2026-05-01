import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, MessageCircle, Phone, Instagram, Facebook } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import { CurrencySwitcher } from '@/components/common/CurrencySwitcher';

const CONTACT = {
  whatsapp: '+90 548 856 47 80',
  whatsappHref: 'https://wa.me/905488564780',
  phone: '+90 548 856 47 80',
  phoneHref: 'tel:+905488564780',
  email: 'info@renarvo.com',
  instagramHandle: '@renarvo',
  instagramHref: 'https://instagram.com/renarvo',
  facebookHandle: 'Renarvo',
  facebookHref: 'https://facebook.com/renarvo',
};

export function PublicFooter() {
  const { t } = useTranslation();
  return (
    <footer className="border-t bg-muted/30 mt-20">
      <div className="container py-12 grid gap-10 md:grid-cols-5">
        <div className="md:col-span-2 space-y-3">
          <Logo />
          <p className="text-sm text-muted-foreground max-w-sm">{t('tagline')}</p>
          <div className="flex flex-wrap gap-3 pt-2">
            <a
              href={CONTACT.instagramHref}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t('footer.instagram')}
              className="h-9 w-9 rounded-lg border bg-background flex items-center justify-center text-foreground/70 hover:text-primary hover:border-primary transition-colors"
            >
              <Instagram className="h-4 w-4" />
            </a>
            <a
              href={CONTACT.facebookHref}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t('footer.facebook')}
              className="h-9 w-9 rounded-lg border bg-background flex items-center justify-center text-foreground/70 hover:text-primary hover:border-primary transition-colors"
            >
              <Facebook className="h-4 w-4" />
            </a>
            <a
              href={CONTACT.whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t('footer.whatsapp')}
              className="h-9 w-9 rounded-lg border bg-background flex items-center justify-center text-foreground/70 hover:text-success hover:border-success transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-3 text-sm">{t('footer.company')}</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/about" className="hover:text-primary">{t('footer.about')}</Link></li>
            <li><Link to="/for-companies" className="hover:text-primary">{t('nav.forCompanies')}</Link></li>
            <li><Link to="/how-it-works" className="hover:text-primary">{t('nav.howItWorks')}</Link></li>
            <li><Link to="/cars" className="hover:text-primary">{t('nav.cars')}</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-3 text-sm">{t('footer.contactSection')}</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <a href={CONTACT.whatsappHref} target="_blank" rel="noopener noreferrer"
                 className="inline-flex items-center gap-2 hover:text-primary">
                <MessageCircle className="h-3.5 w-3.5" /> {CONTACT.whatsapp}
              </a>
            </li>
            <li>
              <a href={CONTACT.phoneHref} className="inline-flex items-center gap-2 hover:text-primary">
                <Phone className="h-3.5 w-3.5" /> {CONTACT.phone}
              </a>
            </li>
            <li>
              <a href={`mailto:${CONTACT.email}`} className="inline-flex items-center gap-2 hover:text-primary">
                <Mail className="h-3.5 w-3.5" /> {CONTACT.email}
              </a>
            </li>
            <li>
              <Link to="/help" className="hover:text-primary">{t('nav.help')}</Link>
            </li>
            <li>
              <Link to="/contact" className="hover:text-primary">{t('footer.contact')}</Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-3 text-sm">{t('footer.legal')}</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/terms" className="hover:text-primary">{t('footer.terms')}</Link></li>
            <li><Link to="/privacy" className="hover:text-primary">{t('footer.privacy')}</Link></li>
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
