import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, XCircle, Loader2, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useReservation } from '@/lib/hooks/useReservations';

const POLL_INTERVAL_MS = 2500;
const POLL_MAX_TRIES = 32; // ≈ 80 seconds

type Outcome = 'pending' | 'paid' | 'failed';

export default function PaymentResult() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const reservationId = params.get('reservation') ?? '';
  const branch = params.get('branch'); // 'ok' | 'fail' | null
  const orderId = params.get('order') ?? '';

  const [tries, setTries] = useState(0);
  const [outcome, setOutcome] = useState<Outcome>('pending');
  const enabled = reservationId !== '' && outcome === 'pending' && tries < POLL_MAX_TRIES;

  const reservationQ = useReservation(reservationId);

  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(() => {
      setTries((n) => n + 1);
      reservationQ.refetch();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [enabled, reservationQ]);

  useEffect(() => {
    const status = reservationQ.data?.payment_status;
    if (status === 'paid') setOutcome('paid');
    else if (status === 'failed' || status === 'cancelled') setOutcome('failed');
  }, [reservationQ.data?.payment_status]);

  // If TIKO redirected to /fail explicitly, surface failure even without paid status
  useEffect(() => {
    if (branch === 'fail' && outcome === 'pending' && tries > 8) {
      setOutcome('failed');
    }
  }, [branch, outcome, tries]);

  const headline = useMemo(() => {
    if (outcome === 'paid') return t('payment.result.success');
    if (outcome === 'failed') return t('payment.result.failed');
    return t('payment.result.pending');
  }, [outcome, t]);

  const description = useMemo(() => {
    if (outcome === 'paid') return t('payment.result.successDesc');
    if (outcome === 'failed') return t('payment.result.failedDesc');
    return t('payment.result.pendingDesc');
  }, [outcome, t]);

  return (
    <div className="container py-12 sm:py-16 max-w-xl">
      <Card className="p-6 sm:p-10 text-center">
        <div className="h-20 w-20 mx-auto rounded-full flex items-center justify-center mb-6 shadow-elevated bg-gradient-brand text-white">
          {outcome === 'paid' && <CheckCircle2 className="h-10 w-10" />}
          {outcome === 'failed' && <XCircle className="h-10 w-10" />}
          {outcome === 'pending' && <Loader2 className="h-10 w-10 animate-spin" />}
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold mb-2">{headline}</h1>
        <p className="text-muted-foreground mb-6 text-sm sm:text-base">{description}</p>

        {reservationQ.data?.code && (
          <div className="text-sm text-muted-foreground mb-6">
            <span className="font-mono font-bold text-foreground">{reservationQ.data.code}</span>
            {orderId && <span className="ml-2 text-xs">• {orderId}</span>}
          </div>
        )}

        {outcome === 'pending' && tries >= POLL_MAX_TRIES && (
          <div className="flex items-start gap-2 text-left text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg mb-4">
            <Clock className="h-4 w-4 mt-0.5 shrink-0" />
            <span>
              {t('payment.result.pendingDesc')} If this persists, please check &ldquo;My reservations&rdquo; in a few minutes.
            </span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-center gap-3">
          {outcome === 'failed' && reservationId && (
            <Button
              className="bg-gradient-brand text-white border-0"
              onClick={() => navigate(`/book/${reservationQ.data?.car_id ?? ''}`)}
            >
              {t('payment.result.tryAgain')}
            </Button>
          )}
          {reservationId && (
            <Button asChild variant="outline">
              <Link to={`/account/reservations`}>{t('payment.result.viewReservation')}</Link>
            </Button>
          )}
          <Button asChild variant="ghost">
            <Link to="/cars">{t('payment.result.backToCars')}</Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}
