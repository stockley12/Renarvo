import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Loader2, Star } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CarCard } from '@/components/public/CarCard';
import { usePublicCompany } from '@/lib/hooks/usePublic';
import { usePublicCars } from '@/lib/hooks/useCars';

export default function CompanyDetail() {
  const { slug } = useParams();
  const { t } = useTranslation();
  const companyQ = usePublicCompany(slug);
  const carsQ = usePublicCars({ company: slug, limit: 60 });

  if (companyQ.isLoading) {
    return (
      <div className="container py-20 text-center text-muted-foreground flex flex-col items-center gap-2">
        <Loader2 className="h-5 w-5 animate-spin" /> {t('common.loading')}
      </div>
    );
  }
  if (companyQ.isError || !companyQ.data) {
    return (
      <div className="container py-20 text-center">
        {t('companyDetail.notFound')} <Link to="/companies" className="text-primary">{t('companyDetail.browseCompanies')}</Link>
      </div>
    );
  }
  const company = companyQ.data;
  const fleet = (carsQ.data?.data ?? []).filter((c) => c.company_id === company.id);

  return (
    <div>
      <div className="bg-gradient-hero text-white">
        <div className="container py-12 flex items-center gap-5">
          <div
            className="h-20 w-20 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-elevated"
            style={{ background: company.logo_color ? `hsl(${company.logo_color})` : undefined }}
          >
            {company.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}
          </div>
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-extrabold">{company.name}</h1>
            <p className="text-white/80 mt-1">
              {company.city}{company.founded_year ? ` · ${t('companyDetail.since')} ${company.founded_year}` : ''}
            </p>
            <div className="flex gap-2 mt-3">
              {company.rating_avg > 0 && (
                <Badge className="bg-white/15 text-white border-0 gap-1">
                  <Star className="h-3 w-3 fill-warning text-warning" /> {Number(company.rating_avg).toFixed(1)}
                </Badge>
              )}
              <Badge className="bg-white/15 text-white border-0">{t('companyDetail.carsCount', { count: company.fleet_size })}</Badge>
              <Badge className="bg-white/15 text-white border-0">{t('companyDetail.reviewsCount', { count: company.review_count })}</Badge>
            </div>
          </div>
        </div>
      </div>
      <div className="container py-10 grid lg:grid-cols-[280px_1fr] gap-8">
        <Card className="p-5 h-fit">
          <h3 className="font-semibold mb-2">{t('companyDetail.about')}</h3>
          <p className="text-sm text-muted-foreground">
            {company.description || t('companyDetail.noDescription')}
          </p>
        </Card>
        <div>
          <h2 className="font-display text-2xl font-bold mb-5">{t('companyDetail.fleet')} ({fleet.length})</h2>
          {carsQ.isLoading ? (
            <Card className="p-10 text-center text-muted-foreground flex flex-col items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" /> {t('companyDetail.loadingFleet')}
            </Card>
          ) : fleet.length === 0 ? (
            <Card className="p-10 text-center text-muted-foreground">
              {t('companyDetail.noCars')} <Link to="/cars" className="text-primary">{t('companyDetail.browseAll')}</Link>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {fleet.map((c) => <CarCard key={c.id} car={c} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
