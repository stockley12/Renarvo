import { Link, useParams } from 'react-router-dom';
import { Star } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CarCard } from '@/components/public/CarCard';
import { cars, companies } from '@/mock/data';

export default function CompanyDetail() {
  const { slug } = useParams();
  const company = companies.find(c => c.slug === slug);
  if (!company) return <div className="container py-20 text-center">Company not found.</div>;
  const fleet = cars.filter(c => c.companyId === company.id);

  return (
    <div>
      <div className="bg-gradient-hero text-white">
        <div className="container py-12 flex items-center gap-5">
          <div className="h-20 w-20 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-elevated"
            style={{ background: `hsl(${company.logoColor})` }}>
            {company.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
          </div>
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-extrabold">{company.name}</h1>
            <p className="text-white/80 mt-1">{company.city} · Since {company.founded}</p>
            <div className="flex gap-2 mt-3">
              <Badge className="bg-white/15 text-white border-0 gap-1">
                <Star className="h-3 w-3 fill-warning text-warning" /> {company.rating.toFixed(1)}
              </Badge>
              <Badge className="bg-white/15 text-white border-0">{company.fleetSize} cars</Badge>
              <Badge className="bg-white/15 text-white border-0">{company.reviewCount} reviews</Badge>
            </div>
          </div>
        </div>
      </div>
      <div className="container py-10 grid lg:grid-cols-[280px_1fr] gap-8">
        <Card className="p-5 h-fit">
          <h3 className="font-semibold mb-2">About</h3>
          <p className="text-sm text-muted-foreground">{company.description}</p>
        </Card>
        <div>
          <h2 className="font-display text-2xl font-bold mb-5">Fleet ({fleet.length})</h2>
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {fleet.map(c => <CarCard key={c.id} car={c} />)}
          </div>
          {fleet.length === 0 && <Card className="p-10 text-center text-muted-foreground">No cars listed yet. <Link to="/cars" className="text-primary">Browse all</Link></Card>}
        </div>
      </div>
    </div>
  );
}
