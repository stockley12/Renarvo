import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Search, Star } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { usePublicCompanies } from '@/lib/hooks/usePublic';

export default function Companies() {
  const [q, setQ] = useState('');
  const debouncedQ = q.trim();
  const companiesQ = usePublicCompanies({ q: debouncedQ || undefined, limit: 48 });
  const list = companiesQ.data?.data ?? [];

  return (
    <div className="container py-10">
      <div className="max-w-2xl mb-8">
        <h1 className="font-display text-3xl md:text-4xl font-extrabold mb-2">Local rental companies</h1>
        <p className="text-muted-foreground mb-5">
          Licensed operators across North Cyprus — from Girne to Karpaz
        </p>
        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search companies..." className="pl-9 h-11" />
        </div>
      </div>

      {companiesQ.isLoading ? (
        <Card className="p-12 text-center text-muted-foreground flex flex-col items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading companies…
        </Card>
      ) : list.length === 0 ? (
        <Card className="p-12 text-center">
          <h3 className="font-display font-bold text-xl mb-2">No companies yet</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-5">
            Be the first rental company on Renarvo. Verification is fast and free.
          </p>
          <Button asChild className="bg-gradient-brand text-white border-0">
            <Link to="/register-company">Register your fleet</Link>
          </Button>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map((co) => (
            <Link key={co.id} to={`/companies/${co.slug}`}>
              <Card className="p-5 hover:shadow-card hover:border-primary transition-all">
                <div className="flex items-center gap-4">
                  <div
                    className="h-14 w-14 rounded-xl flex items-center justify-center text-white font-bold shrink-0"
                    style={{ background: co.logo_color ? `hsl(${co.logo_color})` : undefined }}
                  >
                    {co.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}
                  </div>
                  <div className="min-w-0">
                    <div className="font-display font-bold truncate">{co.name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {co.city}{co.founded_year ? ` · Since ${co.founded_year}` : ''}
                    </div>
                    <div className="inline-flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      {co.rating_avg > 0 && (
                        <>
                          <Star className="h-3 w-3 fill-warning text-warning" />
                          {Number(co.rating_avg).toFixed(1)} ({co.review_count}) ·{' '}
                        </>
                      )}
                      {co.fleet_size} cars
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
