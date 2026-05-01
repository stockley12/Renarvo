import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MapPin, Calendar, Search, ArrowRightLeft, MapPinned, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useCities } from '@/lib/hooks/usePublic';

const FALLBACK_CITIES = ['Girne', 'Lefkoşa', 'Gazimağusa', 'İskele', 'Güzelyurt', 'Lefke', 'Karpaz', 'Bafra'];

export function SearchWidget({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const citiesQ = useCities();
  const cities = citiesQ.data && citiesQ.data.length > 0 ? citiesQ.data : FALLBACK_CITIES;

  const [pickup, setPickup] = useState(cities[0]);
  const [returnLoc, setReturnLoc] = useState(cities[0]);
  const [same, setSame] = useState(true);
  const [manualMode, setManualMode] = useState(false);
  const [manualAddress, setManualAddress] = useState('');
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);
  const [pickupDate, setPickupDate] = useState(today);
  const [returnDate, setReturnDate] = useState(tomorrow);

  useEffect(() => {
    if (citiesQ.data && citiesQ.data.length > 0 && !citiesQ.data.includes(pickup)) {
      setPickup(citiesQ.data[0]);
      if (same) setReturnLoc(citiesQ.data[0]);
    }
  }, [citiesQ.data, pickup, same]);

  const handleSearch = () => {
    const params = new URLSearchParams({ from: pickupDate, to: returnDate });
    if (manualMode && manualAddress.trim()) {
      params.set('address', manualAddress.trim());
    } else {
      params.set('city', pickup);
    }
    navigate(`/cars?${params.toString()}`);
  };

  return (
    <div className={`bg-card text-card-foreground rounded-2xl shadow-elevated border p-4 md:p-5 min-w-0 ${compact ? '' : 'max-w-5xl mx-auto'}`}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-4 text-sm">
        <div className="flex items-center gap-2">
          <Switch checked={same} onCheckedChange={setSame} id="same-place" />
          <Label htmlFor="same-place" className="cursor-pointer">{t('search.samePlace')}</Label>
        </div>
        <button
          type="button"
          onClick={() => setManualMode(!manualMode)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
        >
          {manualMode ? (
            <>
              <ChevronDown className="h-3.5 w-3.5" /> {t('search.useDropdown')}
            </>
          ) : (
            <>
              <MapPinned className="h-3.5 w-3.5" /> {t('search.manualAddress')}
            </>
          )}
        </button>
      </div>
      <div className="grid gap-3 items-end md:grid-cols-12 min-w-0">
        {manualMode ? (
          <div className="md:col-span-7 min-w-0">
            <Label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1.5">
              <MapPinned className="h-3.5 w-3.5" /> {t('search.pickup')}
            </Label>
            <Input
              type="text"
              value={manualAddress}
              onChange={(e) => setManualAddress(e.target.value)}
              placeholder={t('search.manualAddressPlaceholder')}
              className="h-11 min-w-0 max-w-full"
            />
          </div>
        ) : (
          <>
            <div className={`${same ? 'md:col-span-4' : 'md:col-span-3'} min-w-0`}>
              <Label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" /> {t('search.pickup')}
              </Label>
              <select
                value={pickup}
                onChange={(e) => { setPickup(e.target.value); if (same) setReturnLoc(e.target.value); }}
                className="w-full h-11 rounded-lg border border-input bg-background px-3 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring min-w-0"
              >
                {cities.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            {!same && (
              <div className="md:col-span-3 min-w-0">
                <Label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1.5">
                  <ArrowRightLeft className="h-3.5 w-3.5" /> {t('search.return')}
                </Label>
                <select
                  value={returnLoc}
                  onChange={(e) => setReturnLoc(e.target.value)}
                  className="w-full h-11 rounded-lg border border-input bg-background px-3 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring min-w-0"
                >
                  {cities.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            )}
          </>
        )}
        <div className={`${(manualMode || same) ? 'md:col-span-3' : 'md:col-span-2'} min-w-0`}>
          <Label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" /> {t('search.pickupDate')}
          </Label>
          <Input type="date" value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} className="h-11 min-w-0 max-w-full" />
        </div>
        <div className={`${(manualMode || same) ? 'md:col-span-3' : 'md:col-span-2'} min-w-0`}>
          <Label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" /> {t('search.returnDate')}
          </Label>
          <Input type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} className="h-11 min-w-0 max-w-full" />
        </div>
        <div className="md:col-span-2">
          <Button onClick={handleSearch} className="w-full h-11 bg-gradient-brand text-white border-0 hover:opacity-90 shadow-md">
            <Search className="h-4 w-4 mr-1.5" /> {t('search.search')}
          </Button>
        </div>
      </div>
    </div>
  );
}
