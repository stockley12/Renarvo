import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useApp, type Currency } from '@/store/app';

const currencies: Currency[] = ['TRY', 'USD', 'EUR', 'RUB'];

export function CurrencySwitcher() {
  const { currency, setCurrency } = useApp();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="text-xs font-semibold">
          {currency}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {currencies.map((c) => (
          <DropdownMenuItem key={c} onClick={() => setCurrency(c)}>
            <span className={currency === c ? 'font-semibold text-primary' : ''}>{c}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
