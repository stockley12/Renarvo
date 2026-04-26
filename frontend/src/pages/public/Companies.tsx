import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Star } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { companies } from '@/mock/data';

export default function Companies() {
  const [q, setQ] = useState('');
  const filtered = companies.filter(c => c.status === 'approved' && c.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="container py-10">
      <div className="max-w-2xl mb-8">
        <h1 className="font-display text-3xl md:text-4xl font-extrabold mb-2">Local rental companies</h1>
        <p className="text-muted-foreground mb-5">Licensed operators across North Cyprus — from Girne to Karpaz</p>
        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search companies..." className="pl-9 h-11" />
        </div>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(co => (
          <Link key={co.id} to={`/companies/${co.slug}`}>
            <Card className="p-5 hover:shadow-card hover:border-primary transition-all">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-xl flex items-center justify-center text-white font-bold shrink-0"
                  style={{ background: `hsl(${co.logoColor})` }}>
                  {co.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
                </div>
                <div className="min-w-0">
                  <div className="font-display font-bold truncate">{co.name}</div>
                  <div className="text-xs text-muted-foreground">{co.city} · Since {co.founded}</div>
                  <div className="inline-flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <Star className="h-3 w-3 fill-warning text-warning" />
                    {co.rating.toFixed(1)} ({co.reviewCount}) · {co.fleetSize} cars
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
