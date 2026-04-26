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

export const About = () => (
  <StaticPage
    title="About Renarvo"
    body="Renarvo connects travellers visiting North Cyprus with local, licensed rental companies — from family-run agencies in Girne to large fleets at Ercan Airport. We started in 2024 because booking a car in KKTC still meant phone calls, WhatsApp messages and price guessing. We changed that."
  />
);
export const HowItWorks = () => (
  <StaticPage
    title="How it works"
    body="Tell us where you're landing (Ercan, Larnaca or anywhere on the island), pick your dates, and compare cars from real local companies. Pay online or on pickup, cancel free up to 48 hours before. The company you book with — not Renarvo — hands you the keys."
  />
);
export const ForCompanies = () => (
  <StaticPage
    title="For rental companies"
    body="If you operate a rental fleet anywhere from Lefkoşa to Karpaz, list it on Renarvo. No setup fee. You only pay commission on confirmed bookings. We handle the website, payments, and multilingual customer support; you keep your fleet on the road."
  />
);
export const Help = () => (
  <StaticPage
    title="Help center"
    body="Need a hand with a booking, a refund, or a license question for KKTC? Search our knowledge base or message our team — we reply in Turkish, English and Russian."
  />
);
export const Contact = () => (
  <StaticPage
    title="Contact us"
    body="Renarvo Ltd · Girne, North Cyprus · hello@renarvo.com · +90 533 000 00 00. We reply within one business day."
  />
);
export const Terms = () => (
  <StaticPage
    title="Terms of service"
    body="By using Renarvo you agree to these terms. Bookings are contracts between you and the rental company you choose. Renarvo facilitates the booking and payment but is not the vehicle operator. Full text available on request."
  />
);
export const Privacy = () => (
  <StaticPage
    title="Privacy policy"
    body="We collect only what's needed to confirm your booking and we don't sell your data. Driver license details are shared with the rental company you book with, and nobody else. Full policy on request."
  />
);
