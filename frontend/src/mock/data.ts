// Mock data for Renarvo (frontend-only)

export type CarCategory = 'economy' | 'compact' | 'suv' | 'luxury' | 'van' | 'electric';
export type Transmission = 'manual' | 'automatic';
export type Fuel = 'petrol' | 'diesel' | 'hybrid' | 'electric';
export type CarStatus = 'active' | 'draft' | 'maintenance' | 'hidden';
export type CompanyStatus = 'pending' | 'approved' | 'suspended' | 'rejected';
export type ReservationStatus = 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';

export interface Company {
  id: string;
  slug: string;
  name: string;
  city: string;
  logoColor: string; // hsl token suffix
  rating: number;
  reviewCount: number;
  fleetSize: number;
  status: CompanyStatus;
  founded: number;
  description: string;
  joined: string;
}

export interface Car {
  id: string;
  companyId: string;
  brand: string;
  model: string;
  year: number;
  category: CarCategory;
  transmission: Transmission;
  fuel: Fuel;
  seats: number;
  doors: number;
  pricePerDay: number; // TRY
  city: string;
  rating: number;
  reviewCount: number;
  features: string[];
  image: string; // gradient seed
  status: CarStatus;
  plate: string;
  deposit: number;
  mileagePolicy: string;
  instantBook: boolean;
}

export interface Reservation {
  id: string;
  code: string;
  carId: string;
  companyId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  pickupDate: string;
  returnDate: string;
  pickupLocation: string;
  totalPrice: number;
  status: ReservationStatus;
  createdAt: string;
  days: number;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  totalBookings: number;
  totalSpent: number;
  lastBooking: string;
  status: 'active' | 'banned';
  joined: string;
}

// North Cyprus regions / cities
export const cities = ['Girne', 'Lefkoşa', 'Gazimağusa', 'İskele', 'Güzelyurt', 'Lefke', 'Karpaz', 'Bafra'];
export const pickupPoints = [
  'Ercan Havalimanı',
  'Larnaka Havalimanı transferi',
  'Girne Limanı',
  'Gazimağusa merkez',
  'Lefkoşa şube',
  'İskele otel teslim',
];
export const brands = ['Toyota', 'Volkswagen', 'Renault', 'Ford', 'Hyundai', 'Mercedes-Benz', 'BMW', 'Tesla', 'Fiat', 'Peugeot'];

export const categories: { id: CarCategory; nameTr: string; nameEn: string; nameRu: string; icon: string }[] = [
  { id: 'economy', nameTr: 'Ekonomik', nameEn: 'Economy', nameRu: 'Эконом', icon: 'Car' },
  { id: 'compact', nameTr: 'Kompakt', nameEn: 'Compact', nameRu: 'Компакт', icon: 'CarFront' },
  { id: 'suv', nameTr: 'SUV', nameEn: 'SUV', nameRu: 'Внедорожник', icon: 'Truck' },
  { id: 'luxury', nameTr: 'Lüks', nameEn: 'Luxury', nameRu: 'Премиум', icon: 'Gem' },
  { id: 'van', nameTr: 'Minivan', nameEn: 'Van', nameRu: 'Минивэн', icon: 'Bus' },
  { id: 'electric', nameTr: 'Elektrikli', nameEn: 'Electric', nameRu: 'Электро', icon: 'Zap' },
];

const companyNames = [
  'Kyrenia Rent A Car', 'Mediterra Auto', 'Salamis Rentals', 'Karpaz Drive',
  'Bellapais Cars', 'Famagusta Wheels', 'Lefkoşa Oto Kiralama', 'Bafra Rent',
  'Girne Premium Rentals', 'Ercan Express', 'Olive Branch Rentals', 'Cyprus Coast Auto',
];
const cityForCompany = ['Girne', 'Girne', 'Gazimağusa', 'Karpaz', 'Girne', 'Gazimağusa', 'Lefkoşa', 'Bafra', 'Girne', 'Lefkoşa', 'Lefke', 'İskele'];
const foundedYears = [2009, 2014, 2007, 2018, 2011, 2016, 2005, 2019, 2012, 2008, 2017, 2013];
const companyDescriptions = [
  'Family-run since 2009. We meet every customer at Ercan ourselves.',
  'Mediterranean-friendly fleet — automatic transmission, full tank, no surprises.',
  'Famagusta-based. Specialists in long-stay and weekly rentals.',
  'Karpaz peninsula 4×4 specialists. Insurance valid on unpaved roads.',
  'Boutique rentals near Bellapais village. English-speaking team.',
  'Daily airport transfers from Ercan and Larnaca, on request.',
  'Established 2005 — one of the oldest licensed agencies in Lefkoşa.',
  'Small fleet, big care. Free baby seat with every booking.',
  'Premium fleet — BMW, Mercedes, electric Tesla. Concierge delivery.',
  'Fast pickup at Ercan: keys in hand within 7 minutes of landing.',
  'Eco-conscious rentals. Hybrid and electric vehicles available.',
  'Coast-to-coast deliveries. Drop the car at your hotel anywhere on the island.',
];

export const companies: Company[] = companyNames.map((name, i) => ({
  id: `c${i + 1}`,
  slug: name.toLowerCase().replace(/[^a-z]+/g, '-').replace(/^-|-$/g, ''),
  name,
  city: cityForCompany[i],
  logoColor: ['220 73% 49%', '187 70% 51%', '262 70% 55%', '340 75% 55%', '152 60% 45%', '38 92% 55%'][i % 6],
  rating: Number((4.2 + Math.random() * 0.7).toFixed(1)),
  reviewCount: Math.floor(50 + Math.random() * 800),
  fleetSize: Math.floor(20 + Math.random() * 200),
  status: i < 9 ? 'approved' : i < 11 ? 'pending' : 'suspended',
  founded: foundedYears[i],
  description: companyDescriptions[i],
  joined: `2023-0${(i % 9) + 1}-1${i % 9}`,
}));

const carFeatures = ['AC', 'GPS', 'Bluetooth', 'USB', 'Cruise Control', 'Parking Sensors', 'Backup Camera', 'Sunroof', 'Leather Seats', 'Apple CarPlay'];
const models: Record<string, string[]> = {
  Toyota: ['Corolla', 'Yaris', 'C-HR', 'RAV4'],
  Volkswagen: ['Polo', 'Golf', 'Passat', 'T-Roc'],
  Renault: ['Clio', 'Megane', 'Captur', 'Symbol'],
  Ford: ['Focus', 'Fiesta', 'Kuga', 'Tourneo'],
  Hyundai: ['i20', 'i30', 'Tucson', 'Kona'],
  'Mercedes-Benz': ['A-Class', 'C-Class', 'E-Class', 'GLA'],
  BMW: ['1 Series', '3 Series', 'X1', 'X3'],
  Tesla: ['Model 3', 'Model Y'],
  Fiat: ['Egea', '500', 'Tipo'],
  Peugeot: ['208', '301', '2008', '3008'],
};

const carCount = 48;
export const cars: Car[] = Array.from({ length: carCount }).map((_, i) => {
  const brand = brands[i % brands.length];
  const model = models[brand][i % models[brand].length];
  const cat: CarCategory = brand === 'Tesla' ? 'electric'
    : brand === 'Mercedes-Benz' || brand === 'BMW' ? 'luxury'
    : ['Tourneo', 'Symbol'].includes(model) ? 'van'
    : ['Tucson', 'Kuga', 'X1', 'X3', 'C-HR', 'RAV4', 'Captur', '2008', '3008', 'T-Roc', 'GLA', 'Kona'].includes(model) ? 'suv'
    : i % 4 === 0 ? 'economy' : 'compact';
  return {
    id: `car${i + 1}`,
    companyId: companies[i % 9].id,
    brand, model,
    year: 2021 + (i % 4),
    category: cat,
    transmission: i % 3 === 0 ? 'manual' : 'automatic',
    fuel: brand === 'Tesla' ? 'electric' : i % 5 === 0 ? 'diesel' : i % 7 === 0 ? 'hybrid' : 'petrol',
    seats: cat === 'van' ? 7 : cat === 'suv' ? 5 : 5,
    doors: cat === 'van' ? 5 : 4,
    pricePerDay: cat === 'luxury' ? 2200 + (i * 30) % 1500 : cat === 'electric' ? 1800 + (i * 25) % 800 : cat === 'suv' ? 1200 + (i * 20) % 600 : cat === 'van' ? 1500 + (i * 30) % 500 : 600 + (i * 15) % 400,
    city: cities[i % cities.length],
    rating: 4 + Math.random(),
    reviewCount: Math.floor(10 + Math.random() * 200),
    features: carFeatures.filter((_, idx) => (i + idx) % 3 !== 0).slice(0, 6),
    image: `${i}`,
    status: 'active',
    plate: `${['KB','LK','KAR','MR','KE','GE'][i % 6]} ${100 + (i * 17) % 900} ${String.fromCharCode(65 + (i % 26))}`,
    deposit: cat === 'luxury' ? 8000 : 3000,
    mileagePolicy: '250 km/day included, ₺2/km after',
    instantBook: i % 3 !== 0,
  };
});

// Mix of local Cypriot Turkish names + tourists (UK, RU, DE — typical NC visitor mix)
const customerNames = [
  'Mehmet Özkan', 'Ayşe Kaymak', 'Hasan Tellioğlu', 'Selin Mertkan', 'Cem Bayraktar',
  'Derya Sönmez', 'Ali Berkün', 'Zehra Arıkan', 'Hüseyin Gürkan', 'Ece Tatar',
  'James Whitcombe', 'Sophie Bennett', 'Ivan Petrov', 'Olga Sokolova', 'Hans Müller',
];

export const customers: Customer[] = customerNames.map((name, i) => ({
  id: `u${i + 1}`,
  name,
  email: name.toLowerCase().replace(/[^a-z]+/g, '.') + '@example.com',
  // KKTC mobile prefix is +90 533 / 542 / 548
  phone: `+90 5${[33,42,48][i % 3]} ${100 + (i * 7) % 900} ${10 + (i * 13) % 90} ${10 + (i * 19) % 90}`,
  city: cities[i % cities.length],
  totalBookings: 1 + (i % 12),
  totalSpent: 1500 + (i * 350) % 25000,
  lastBooking: `2025-0${(i % 9) + 1}-1${i % 9}`,
  status: i === 13 ? 'banned' : 'active',
  joined: `2024-0${(i % 9) + 1}-0${(i % 9) + 1}`,
}));

const resStatuses: ReservationStatus[] = ['pending', 'confirmed', 'active', 'completed', 'cancelled'];
export const reservations: Reservation[] = Array.from({ length: 60 }).map((_, i) => {
  const car = cars[i % cars.length];
  const customer = customers[i % customers.length];
  const days = 1 + (i % 10);
  const start = new Date(2025, (i % 11), 1 + (i % 27));
  const end = new Date(start); end.setDate(end.getDate() + days);
  return {
    id: `r${i + 1}`,
    code: `RNV-${10000 + i}`,
    carId: car.id,
    companyId: car.companyId,
    customerName: customer.name,
    customerEmail: customer.email,
    customerPhone: customer.phone,
    pickupDate: start.toISOString(),
    returnDate: end.toISOString(),
    pickupLocation: pickupPoints[i % pickupPoints.length],
    totalPrice: car.pricePerDay * days,
    status: resStatuses[i % resStatuses.length],
    createdAt: new Date(start.getTime() - 7 * 86400000).toISOString(),
    days,
  };
});

// Stats helpers
export const monthlyRevenue = Array.from({ length: 12 }).map((_, i) => ({
  month: ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'][i],
  revenue: 80000 + Math.floor(Math.random() * 120000),
  bookings: 40 + Math.floor(Math.random() * 90),
}));

export const dailyBookings = Array.from({ length: 30 }).map((_, i) => ({
  day: i + 1,
  bookings: 5 + Math.floor(Math.random() * 25),
}));
