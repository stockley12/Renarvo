import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, ChevronRight, Building2, Upload, Car } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

const steps = [
  { icon: Building2, label: 'Company info' },
  { icon: Upload, label: 'Documents' },
  { icon: Car, label: 'Fleet' },
];

export default function RegisterCompany() {
  const [step, setStep] = useState(0);
  const { toast } = useToast();
  const navigate = useNavigate();

  const next = () => {
    if (step < 2) return setStep(step + 1);
    toast({ title: 'Application submitted!', description: 'Your company is pending approval. We\'ll email you within 24 hours.' });
    navigate('/');
  };

  return (
    <div className="container py-10 max-w-3xl">
      <h1 className="font-display text-3xl md:text-4xl font-extrabold mb-2">List your fleet on Renarvo</h1>
      <p className="text-muted-foreground mb-8">Join hundreds of trusted rental companies</p>

      <div className="flex items-center justify-between mb-8">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center gap-3 flex-1">
            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${i <= step ? 'bg-gradient-brand text-white' : 'bg-muted text-muted-foreground'}`}>
              {i < step ? <Check className="h-4 w-4" /> : <s.icon className="h-4 w-4" />}
            </div>
            <span className={`text-sm font-medium hidden sm:block ${i === step ? 'text-primary' : 'text-muted-foreground'}`}>{s.label}</span>
            {i < 2 && <ChevronRight className="h-4 w-4 text-muted-foreground/40" />}
          </div>
        ))}
      </div>

      <Card className="p-8">
        {step === 0 && (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div><Label>Company name</Label><Input placeholder="e.g. Kyrenia Rent A Car" /></div>
              <div><Label>Tax / VKN no.</Label><Input placeholder="1234567890" /></div>
              <div><Label>City</Label><Input placeholder="Girne" /></div>
              <div><Label>Phone</Label><Input placeholder="+90 533 ..." /></div>
              <div className="sm:col-span-2"><Label>Email</Label><Input type="email" placeholder="info@yourcompany.com" /></div>
              <div className="sm:col-span-2"><Label>Description</Label><Textarea rows={4} placeholder="Tell us about your company..." /></div>
            </div>
          </div>
        )}
        {step === 1 && (
          <div className="space-y-3">
            {['Trade registry', 'Tax certificate', 'Operating license', 'Insurance certificate'].map(d => (
              <div key={d} className="flex items-center justify-between p-4 border rounded-lg">
                <span className="text-sm font-medium">{d}</span>
                <Button variant="outline" size="sm"><Upload className="h-4 w-4 mr-1.5" /> Upload</Button>
              </div>
            ))}
          </div>
        )}
        {step === 2 && (
          <div className="space-y-4">
            <div><Label>Approximate fleet size</Label><Input type="number" placeholder="50" /></div>
            <div><Label>Main vehicle categories</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {['Economy', 'SUV', 'Luxury', 'Van', 'Electric'].map(c => (
                  <label key={c} className="px-3 py-2 border rounded-full text-sm cursor-pointer hover:bg-muted">{c}</label>
                ))}
              </div>
            </div>
            <div><Label>Years in business</Label><Input type="number" placeholder="10" /></div>
          </div>
        )}
        <div className="flex justify-between pt-6 mt-6 border-t">
          <Button variant="outline" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>Back</Button>
          <Button onClick={next} className="bg-gradient-brand text-white border-0">{step === 2 ? 'Submit application' : 'Continue'}</Button>
        </div>
      </Card>

      <p className="text-center text-sm text-muted-foreground mt-6">
        Already a partner? <Link to="/login" className="text-primary font-semibold">Log in</Link>
      </p>
    </div>
  );
}
