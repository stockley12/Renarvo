import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Shield, Clock, BadgeCheck, RefreshCcw, MapPin, Loader2 } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { SearchWidget } from '@/components/public/SearchWidget';
import { CarCard } from '@/components/public/CarCard';
import { usePublicCars } from '@/lib/hooks/useCars';
import { useCategories, useCities } from '@/lib/hooks/usePublic';
import { categoryIcon, categoryName } from '@/lib/categories';

export default function Home() {
  const { t, i18n } = useTranslation();
  const lang = (i18n.language?.slice(0, 2) === 'ru' ? 'ru' : i18n.language?.slice(0, 2) === 'en' ? 'en' : 'tr') as 'tr' | 'en' | 'ru';

  const popularQ = usePublicCars({ limit: 8, sort: 'rating_desc' });
  const popular = popularQ.data?.data ?? [];

  const categoriesQ = useCategories();
  const categories = categoriesQ.data ?? [];

  const citiesQ = useCities();
  const popularCities = (citiesQ.data ?? []).slice(0, 6);

  const trust = [
    { icon: Shield, key: 'insurance' },
    { icon: Clock, key: 'support' },
    { icon: RefreshCcw, key: 'freeCancel' },
    { icon: BadgeCheck, key: 'verified' },
  ];

  const faqs = [
    { q: 'Do I need an international driving license?', a: 'No. A valid licence from your home country is accepted in North Cyprus for stays under 90 days.' },
    { q: 'Can I be picked up at Ercan Airport?', a: 'Yes. Most companies offer free pickup at Ercan. Larnaca pickup is usually available with a transfer fee.' },
    { q: 'Can I cancel for free?', a: 'Most bookings can be cancelled free of charge up to 48 hours before pickup.' },
    { q: 'What documents do I bring on pickup day?', a: 'Your passport, your driving licence, and a credit card in the driver\'s name for the deposit.' },
    { q: 'Is insurance included in the price?', a: 'Basic third-party insurance is always included. Full coverage (CDW + theft, no excess) is available as an extra at checkout.' },
  ];

  return (
    <div>
      {/* HERO */}
      <section className="relative bg-gradient-hero text-white overflow-hidden">
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, hsl(var(--brand-glow) / 0.4), transparent 50%), radial-gradient(circle at 80% 80%, hsl(var(--brand) / 0.4), transparent 50%)' }} />
        <div className="container relative pt-14 pb-10 md:pt-20 md:pb-14">
          <div className="max-w-3xl animate-fade-in">
            <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-extrabold leading-[1.05] mb-5">
              {t('home.heroTitle')}
            </h1>
            <p className="text-lg md:text-xl text-white/80 max-w-2xl">{t('home.heroSubtitle')}</p>
          </div>
        </div>
        <div className="container relative pb-10 md:pb-12">
          <SearchWidget />
        </div>
      </section>

      {/* CATEGORIES */}
      {categories.length > 0 && (
        <section className="container py-10">
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-6">{t('home.categories')}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {categories.map((cat) => {
              const Icon = (LucideIcons as any)[categoryIcon(cat.id)] ?? LucideIcons.Car;
              return (
                <Link key={cat.id} to={`/cars?category=${cat.id}`}
                  className="group flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border bg-card hover:border-primary hover:shadow-card transition-all">
                  <span className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                  </span>
                  <span className="text-sm font-semibold">{categoryName(cat.id, lang, cat.name)}</span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* TRUST */}
      <section className="container py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {trust.map(({ icon: Icon, key }) => (
            <Card key={key} className="p-5 flex items-start gap-3 border-border/60">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <div className="font-semibold text-sm">{t(`trust.${key}`)}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{t(`trust.${key}Desc`)}</div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* POPULAR CARS */}
      <section className="container py-10">
        <div className="flex items-end justify-between mb-6">
          <h2 className="font-display text-2xl md:text-3xl font-bold">{t('home.popularCars')}</h2>
          <Button asChild variant="ghost" size="sm">
            <Link to="/cars">{t('common.viewAll')} <ArrowRight className="ml-1 h-4 w-4" /></Link>
          </Button>
        </div>
        {popularQ.isLoading ? (
          <Card className="p-12 text-center text-muted-foreground flex flex-col items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading cars…
          </Card>
        ) : popular.length === 0 ? (
          <Card className="p-12 text-center">
            <h3 className="font-display font-semibold text-lg mb-2">No cars listed yet</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-5">
              Renarvo is brand new in your region. Companies are signing up — yours could be the first.
            </p>
            <Button asChild className="bg-gradient-brand text-white border-0">
              <Link to="/register-company">List your fleet</Link>
            </Button>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {popular.map((c) => <CarCard key={c.id} car={c} />)}
          </div>
        )}
      </section>

      {/* POPULAR DESTINATIONS */}
      {popularCities.length > 0 && (
        <section className="bg-muted/40 py-14 mt-10">
          <div className="container">
            <div className="flex items-end justify-between mb-6">
              <div>
                <h2 className="font-display text-2xl md:text-3xl font-bold">Popular pickup locations</h2>
                <p className="text-muted-foreground text-sm mt-1">Where most travellers collect their cars</p>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link to="/cars">{t('common.viewAll')} <ArrowRight className="ml-1 h-4 w-4" /></Link>
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {popularCities.map((city) => (
                <Link key={city} to={`/cars?city=${encodeURIComponent(city)}`}
                  className="group p-5 bg-card rounded-2xl border hover:shadow-card hover:border-primary transition-all">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div className="font-semibold text-sm">{city}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Browse availability</div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* HOW IT WORKS */}
      <section className="container py-16">
        <h2 className="font-display text-2xl md:text-3xl font-bold text-center mb-10">{t('home.howItWorksTitle')}</h2>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {[
            { step: 'Search', desc: 'Tell us where you land — Ercan, Larnaca or anywhere on the island — and your dates.' },
            { step: 'Book', desc: 'Compare local companies side-by-side and book in under a minute. No hidden fees.' },
            { step: 'Drive', desc: 'Meet the company at the agreed point, do a quick walk-around, and you\'re off.' },
          ].map(({ step, desc }, i) => (
            <div key={step} className="text-center p-6">
              <div className="h-14 w-14 rounded-2xl bg-gradient-brand text-white font-display font-bold text-2xl flex items-center justify-center mx-auto mb-4 shadow-elevated">
                {i + 1}
              </div>
              <h3 className="font-display font-bold text-xl mb-2">{step}</h3>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="container py-16">
        <h2 className="font-display text-2xl md:text-3xl font-bold text-center mb-8">{t('home.faq')}</h2>
        <div className="max-w-2xl mx-auto">
          <Accordion type="single" collapsible>
            {faqs.map((f, i) => (
              <AccordionItem key={i} value={`f${i}`}>
                <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="container py-12">
        <div className="rounded-3xl bg-gradient-hero text-white p-10 md:p-16 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, hsl(var(--brand-glow) / 0.5), transparent 50%)' }} />
          <div className="relative">
            <h2 className="font-display text-3xl md:text-5xl font-extrabold mb-3">{t('home.ctaTitle')}</h2>
            <p className="text-white/80 mb-6 max-w-2xl mx-auto">{t('home.ctaSubtitle')}</p>
            <Button asChild size="lg" className="bg-white text-navy hover:bg-white/90">
              <Link to="/register-company">{t('home.listFleet')} <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
