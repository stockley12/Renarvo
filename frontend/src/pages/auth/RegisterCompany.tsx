import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Building2, KeyRound, Check } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { registerCompany as apiRegisterCompany, ApiClientError } from '@/lib/api';
import { useSession } from '@/store/session';

export default function RegisterCompany() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const setUser = useSession((s) => s.setUser);
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [submitting, setSubmitting] = useState(false);

  const [companyName, setCompanyName] = useState('');
  const [taxNo, setTaxNo] = useState('');
  const [city, setCity] = useState('Girne');
  const [phone, setPhone] = useState('');
  const [emailPublic, setEmailPublic] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');

  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');

  const stepsMeta = [
    { icon: Building2, key: 'step1' },
    { icon: KeyRound, key: 'step2' },
    { icon: Check, key: 'step3' },
  ] as const;

  function step1Valid() {
    return companyName.trim().length >= 2 && city.trim().length >= 2 && phone.trim().length >= 6;
  }
  function step2Valid() {
    return ownerName.trim().length >= 2 && /\S+@\S+\.\S+/.test(ownerEmail) && ownerPassword.length >= 8;
  }

  async function submit() {
    if (ownerPassword.length < 8) {
      toast.error(t('auth.registerCompany.passwordTooShort'));
      return;
    }
    setSubmitting(true);
    try {
      const data = await apiRegisterCompany({
        company_name: companyName.trim(),
        city: city.trim(),
        phone: phone.trim(),
        tax_number: taxNo.trim() || undefined,
        address: address.trim() || undefined,
        email_public: emailPublic.trim() || undefined,
        description: description.trim() || undefined,
        owner_name: ownerName.trim(),
        owner_email: ownerEmail.trim().toLowerCase(),
        owner_password: ownerPassword,
      });
      setUser(data.user);
      setStep(2);
      toast.success(t('auth.registerCompany.submitted'));
    } catch (err) {
      if (err instanceof ApiClientError) toast.error(err.message);
      else toast.error(t('auth.registerCompany.failed'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container py-10 max-w-3xl">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-3 -ml-2">
        <ArrowLeft className="h-4 w-4 mr-1" /> {t('auth.registerCompany.back')}
      </Button>
      <h1 className="font-display text-3xl md:text-4xl font-extrabold mb-2">{t('auth.registerCompany.title')}</h1>
      <p className="text-muted-foreground mb-8">{t('auth.registerCompany.subtitle')}</p>

      <div className="flex items-center justify-between mb-8 gap-2">
        {stepsMeta.map((s, i) => (
          <div key={s.key} className="flex items-center gap-3 flex-1">
            <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${i <= step ? 'bg-gradient-brand text-white' : 'bg-muted text-muted-foreground'}`}>
              {i < step ? <Check className="h-4 w-4" /> : <s.icon className="h-4 w-4" />}
            </div>
            <span className={`text-sm font-medium hidden sm:block ${i === step ? 'text-primary' : 'text-muted-foreground'}`}>{t(`auth.registerCompany.${s.key}`)}</span>
            {i < 2 && <div className="hidden sm:block flex-1 h-px bg-border" />}
          </div>
        ))}
      </div>

      <Card className="p-6 md:p-8">
        {step === 0 && (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Label>{t('auth.registerCompany.companyName')}</Label>
                <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder={t('auth.registerCompany.companyNamePh')} required />
              </div>
              <div>
                <Label>{t('auth.registerCompany.vkn')}</Label>
                <Input value={taxNo} onChange={(e) => setTaxNo(e.target.value)} placeholder={t('auth.registerCompany.vknPh')} />
              </div>
              <div>
                <Label>{t('auth.registerCompany.city')}</Label>
                <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder={t('auth.registerCompany.cityPh')} required />
              </div>
              <div>
                <Label>{t('auth.registerCompany.phone')}</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t('auth.registerCompany.phonePh')} required />
              </div>
              <div>
                <Label>{t('auth.registerCompany.emailPublic')}</Label>
                <Input type="email" value={emailPublic} onChange={(e) => setEmailPublic(e.target.value)} placeholder={t('auth.registerCompany.emailPublicPh')} />
              </div>
              <div className="sm:col-span-2">
                <Label>{t('auth.registerCompany.description')}</Label>
                <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t('auth.registerCompany.descriptionPh')} />
              </div>
            </div>
          </div>
        )}
        {step === 1 && (
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
              {t('auth.registerCompany.ownerSection')}
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>{t('auth.registerCompany.ownerName')}</Label>
                <Input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder={t('auth.registerCompany.ownerNamePh')} required autoComplete="name" />
              </div>
              <div>
                <Label>{t('auth.registerCompany.ownerEmail')}</Label>
                <Input type="email" value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} placeholder={t('auth.registerCompany.ownerEmailPh')} required autoComplete="email" />
              </div>
              <div className="sm:col-span-2">
                <Label>{t('auth.registerCompany.ownerPassword')}</Label>
                <Input type="password" value={ownerPassword} onChange={(e) => setOwnerPassword(e.target.value)} placeholder={t('auth.registerCompany.ownerPasswordPh')} required autoComplete="new-password" minLength={8} />
                <p className="text-xs text-muted-foreground mt-1.5">{t('auth.registerCompany.ownerPasswordHint')}</p>
              </div>
            </div>
          </div>
        )}
        {step === 2 && (
          <div className="text-center py-6">
            <div className="h-14 w-14 rounded-full bg-success/15 text-success flex items-center justify-center mx-auto mb-4">
              <Check className="h-6 w-6" />
            </div>
            <h2 className="font-display text-xl font-bold mb-2">{t('auth.registerCompany.submitted')}</h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">{t('auth.registerCompany.submittedDesc')}</p>
            <Button onClick={() => navigate('/dashboard')} className="bg-gradient-brand text-white border-0">
              {t('nav.dashboard')}
            </Button>
          </div>
        )}
        {step !== 2 && (
          <div className="flex justify-between pt-6 mt-6 border-t">
            <Button variant="outline" onClick={() => setStep(Math.max(0, step - 1) as 0 | 1)} disabled={step === 0}>
              {t('auth.registerCompany.back')}
            </Button>
            {step === 0 && (
              <Button
                onClick={() => setStep(1)}
                disabled={!step1Valid()}
                className="bg-gradient-brand text-white border-0"
              >
                {t('auth.registerCompany.continue')}
              </Button>
            )}
            {step === 1 && (
              <Button
                onClick={submit}
                disabled={!step2Valid() || submitting}
                className="bg-gradient-brand text-white border-0"
              >
                {submitting ? t('auth.registerCompany.submitting') : t('auth.registerCompany.submit')}
              </Button>
            )}
          </div>
        )}
      </Card>

      <p className="text-center text-sm text-muted-foreground mt-6">
        {t('auth.registerCompany.alreadyPartner')}{' '}
        <Link to="/login" className="text-primary font-semibold">{t('auth.registerCompany.logIn')}</Link>
      </p>
    </div>
  );
}
