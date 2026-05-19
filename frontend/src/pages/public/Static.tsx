import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';

export function StaticPage({ title, body }: { title: string; body: string }) {
  return (
    <div className="container py-12 max-w-3xl">
      <h1 className="font-display text-3xl md:text-4xl font-extrabold mb-6">{title}</h1>
      <Card className="p-8 prose prose-sm max-w-none text-muted-foreground">
        <p>{body}</p>
      </Card>
    </div>
  );
}

export const About = () => {
  const { t } = useTranslation();
  return <StaticPage title={t('static.about.title')} body={t('static.about.body')} />;
};
export const HowItWorks = () => {
  const { t } = useTranslation();
  return <StaticPage title={t('static.howItWorks.title')} body={t('static.howItWorks.body')} />;
};
export const ForCompanies = () => {
  const { t } = useTranslation();
  return <StaticPage title={t('static.forCompanies.title')} body={t('static.forCompanies.body')} />;
};
export const Help = () => {
  const { t } = useTranslation();
  return <StaticPage title={t('static.help.title')} body={t('static.help.body')} />;
};
export const Contact = () => {
  const { t } = useTranslation();
  return <StaticPage title={t('static.contact.title')} body={t('static.contact.body')} />;
};
export const Terms = () => {
  const { t } = useTranslation();
  return <StaticPage title={t('static.terms.title')} body={t('static.terms.body')} />;
};
export const Privacy = () => {
  const { t } = useTranslation();
  return <StaticPage title={t('static.privacy.title')} body={t('static.privacy.body')} />;
};
