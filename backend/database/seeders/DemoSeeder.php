<?php

namespace Database\Seeders;

use App\Models\Car;
use App\Models\CarFeature;
use App\Models\Company;
use App\Models\PlatformSetting;
use App\Models\Reservation;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DemoSeeder extends Seeder
{
    private const CITIES = ['Girne', 'Lefkoşa', 'Gazimağusa', 'İskele', 'Güzelyurt', 'Lefke', 'Karpaz', 'Bafra'];
    private const PICKUP_POINTS = [
        'Ercan Havalimanı', 'Larnaka Havalimanı transferi', 'Girne Limanı',
        'Gazimağusa merkez', 'Lefkoşa şube', 'İskele otel teslim',
    ];
    private const BRANDS = [
        'Toyota' => ['Corolla', 'Yaris', 'C-HR', 'RAV4'],
        'Volkswagen' => ['Polo', 'Golf', 'Passat', 'T-Roc'],
        'Renault' => ['Clio', 'Megane', 'Captur', 'Symbol'],
        'Ford' => ['Focus', 'Fiesta', 'Kuga', 'Tourneo'],
        'Hyundai' => ['i20', 'i30', 'Tucson', 'Kona'],
        'Mercedes-Benz' => ['A-Class', 'C-Class', 'E-Class', 'GLA'],
        'BMW' => ['1 Series', '3 Series', 'X1', 'X3'],
        'Tesla' => ['Model 3', 'Model Y'],
        'Fiat' => ['Egea', '500', 'Tipo'],
        'Peugeot' => ['208', '301', '2008', '3008'],
    ];
    private const CAR_FEATURES = [
        'AC', 'GPS', 'Bluetooth', 'USB', 'Cruise Control',
        'Parking Sensors', 'Backup Camera', 'Sunroof', 'Leather Seats', 'Apple CarPlay',
    ];

    public function run(): void
    {
        $this->seedSettings();
        $superadmin = $this->seedSuperadmin();
        $companies = $this->seedCompanies();
        $customers = $this->seedCustomers();
        $this->seedCars($companies);
        $this->seedReservations($customers);
    }

    private function seedSettings(): void
    {
        PlatformSetting::put('platform.commission_bps', 1200);
        PlatformSetting::put('platform.kdv_bps', 1800);
        PlatformSetting::put('platform.service_fee_kurus', 12000);
        PlatformSetting::put('platform.supported_currencies', ['TRY', 'USD', 'EUR', 'RUB']);
    }

    private function seedSuperadmin(): User
    {
        return User::query()->updateOrCreate(
            ['email' => 'admin@renarvo.com'],
            [
                'password_hash' => Hash::make('password'),
                'name' => 'Renarvo Admin',
                'role' => User::ROLE_SUPERADMIN,
                'status' => 'active',
                'locale' => 'tr',
                'email_verified_at' => now(),
            ],
        );
    }

    private function seedCompanies(): array
    {
        $names = [
            'Kyrenia Rent A Car', 'Mediterra Auto', 'Salamis Rentals', 'Karpaz Drive',
            'Bellapais Cars', 'Famagusta Wheels', 'Lefkoşa Oto Kiralama', 'Bafra Rent',
            'Girne Premium Rentals', 'Ercan Express', 'Olive Branch Rentals', 'Cyprus Coast Auto',
        ];
        $cities = ['Girne', 'Girne', 'Gazimağusa', 'Karpaz', 'Girne', 'Gazimağusa', 'Lefkoşa', 'Bafra', 'Girne', 'Lefkoşa', 'Lefke', 'İskele'];
        $founded = [2009, 2014, 2007, 2018, 2011, 2016, 2005, 2019, 2012, 2008, 2017, 2013];
        $colors = ['220 73% 49%', '187 70% 51%', '262 70% 55%', '340 75% 55%', '152 60% 45%', '38 92% 55%'];
        $descriptions = [
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

        $companies = [];

        foreach ($names as $i => $name) {
            $slug = Str::slug($name);
            $owner = User::query()->updateOrCreate(
                ['email' => "owner{$i}@" . str_replace([' ', "'"], '', strtolower(explode(' ', $name)[0])) . '.com'],
                [
                    'password_hash' => Hash::make('password'),
                    'name' => 'Owner ' . $name,
                    'phone' => '+90 533 ' . str_pad((string) (100 + $i * 11), 3, '0', STR_PAD_LEFT) . ' 12 34',
                    'role' => User::ROLE_COMPANY_OWNER,
                    'locale' => 'tr',
                    'email_verified_at' => now(),
                ]
            );

            $status = $i < 9 ? Company::STATUS_APPROVED : ($i < 11 ? Company::STATUS_PENDING : Company::STATUS_SUSPENDED);

            $company = Company::query()->updateOrCreate(
                ['slug' => $slug],
                [
                    'owner_user_id' => $owner->id,
                    'name' => $name,
                    'city' => $cities[$i],
                    'description' => $descriptions[$i],
                    'logo_color' => $colors[$i % count($colors)],
                    'phone' => $owner->phone,
                    'tax_number' => '600' . str_pad((string) ($i + 1), 7, '0', STR_PAD_LEFT),
                    'address' => $cities[$i] . ' merkez ofis',
                    'status' => $status,
                    'founded_year' => $founded[$i],
                    'commission_rate_bps' => 1200,
                    'rating_avg' => round(4.2 + (mt_rand(0, 70) / 100), 2),
                    'review_count' => 50 + (($i * 67) % 750),
                    'fleet_size' => 0,
                ]
            );

            $companies[] = $company;
        }

        // Make sure default owner email matches README
        User::query()->where('email', 'owner0@kyrenia.com')->update(['email' => 'owner@kyrenia.com']);

        return $companies;
    }

    private function seedCustomers(): array
    {
        $names = [
            'Mehmet Özkan', 'Ayşe Kaymak', 'Hasan Tellioğlu', 'Selin Mertkan', 'Cem Bayraktar',
            'Derya Sönmez', 'Ali Berkün', 'Zehra Arıkan', 'Hüseyin Gürkan', 'Ece Tatar',
            'James Whitcombe', 'Sophie Bennett', 'Ivan Petrov', 'Olga Sokolova', 'Hans Müller',
        ];

        $customers = [];
        foreach ($names as $i => $name) {
            $email = preg_replace('/[^a-z]+/', '.', strtolower($name)) . '@example.com';
            $customers[] = User::query()->updateOrCreate(
                ['email' => $email],
                [
                    'password_hash' => Hash::make('password'),
                    'name' => $name,
                    'phone' => '+90 5' . [33, 42, 48][$i % 3] . ' ' . (100 + ($i * 7) % 900) . ' ' . str_pad((string) (10 + ($i * 13) % 90), 2, '0', STR_PAD_LEFT) . ' ' . str_pad((string) (10 + ($i * 19) % 90), 2, '0', STR_PAD_LEFT),
                    'role' => User::ROLE_CUSTOMER,
                    'status' => $i === 13 ? 'banned' : 'active',
                    'locale' => $i >= 12 ? 'ru' : ($i >= 10 ? 'en' : 'tr'),
                    'email_verified_at' => now(),
                ]
            );
        }

        // demo customer matching README
        User::query()->updateOrCreate(
            ['email' => 'customer@example.com'],
            [
                'password_hash' => Hash::make('password'),
                'name' => 'Demo Customer',
                'phone' => '+90 533 100 00 00',
                'role' => User::ROLE_CUSTOMER,
                'status' => 'active',
                'locale' => 'tr',
                'email_verified_at' => now(),
            ]
        );

        return $customers;
    }

    private function seedCars(array $companies): void
    {
        $brands = array_keys(self::BRANDS);
        $count = 48;
        $companyFleetCount = [];

        for ($i = 0; $i < $count; $i++) {
            $brand = $brands[$i % count($brands)];
            $models = self::BRANDS[$brand];
            $model = $models[$i % count($models)];

            $cat = $brand === 'Tesla' ? 'electric'
                : (in_array($brand, ['Mercedes-Benz', 'BMW'], true) ? 'luxury'
                : (in_array($model, ['Tourneo', 'Symbol'], true) ? 'van'
                : (in_array($model, ['Tucson', 'Kuga', 'X1', 'X3', 'C-HR', 'RAV4', 'Captur', '2008', '3008', 'T-Roc', 'GLA', 'Kona'], true) ? 'suv'
                : ($i % 4 === 0 ? 'economy' : 'compact'))));

            $price = match ($cat) {
                'luxury' => 220000 + ($i * 3000) % 150000,
                'electric' => 180000 + ($i * 2500) % 80000,
                'suv' => 120000 + ($i * 2000) % 60000,
                'van' => 150000 + ($i * 3000) % 50000,
                default => 60000 + ($i * 1500) % 40000,
            };

            $companyId = $companies[$i % 9]->id;
            $companyFleetCount[$companyId] = ($companyFleetCount[$companyId] ?? 0) + 1;

            $car = Car::query()->create([
                'company_id' => $companyId,
                'brand' => $brand,
                'model' => $model,
                'year' => 2021 + ($i % 4),
                'category' => $cat,
                'transmission' => $i % 3 === 0 ? 'manual' : 'automatic',
                'fuel' => $brand === 'Tesla' ? 'electric' : ($i % 5 === 0 ? 'diesel' : ($i % 7 === 0 ? 'hybrid' : 'petrol')),
                'seats' => $cat === 'van' ? 7 : 5,
                'doors' => $cat === 'van' ? 5 : 4,
                'price_per_day' => $price,
                'weekly_price' => (int) ($price * 6.5),
                'city' => self::CITIES[$i % count(self::CITIES)],
                'deposit' => $cat === 'luxury' ? 800000 : 300000,
                'mileage_policy' => '250 km/day included, ₺2/km after',
                'instant_book' => $i % 3 !== 0,
                'status' => Car::STATUS_ACTIVE,
                'plate' => ['KB', 'LK', 'KAR', 'MR', 'KE', 'GE'][$i % 6] . ' ' . (100 + ($i * 17) % 900) . ' ' . chr(65 + ($i % 26)),
                'min_driver_age' => 21,
                'rating_avg' => round(4 + (mt_rand(0, 100) / 100), 2),
                'review_count' => 10 + (($i * 97) % 190),
                'image_seed' => (string) $i,
            ]);

            foreach ($this->pickFeatures($i) as $feature) {
                CarFeature::query()->create(['car_id' => $car->id, 'feature' => $feature]);
            }
        }

        foreach ($companyFleetCount as $cid => $size) {
            Company::query()->where('id', $cid)->update(['fleet_size' => $size]);
        }
    }

    private function pickFeatures(int $i): array
    {
        $features = [];
        foreach (self::CAR_FEATURES as $idx => $feature) {
            if (($i + $idx) % 3 !== 0) {
                $features[] = $feature;
                if (count($features) >= 6) {
                    break;
                }
            }
        }

        return $features;
    }

    private function seedReservations(array $customers): void
    {
        $statuses = [
            Reservation::STATUS_PENDING, Reservation::STATUS_CONFIRMED, Reservation::STATUS_ACTIVE,
            Reservation::STATUS_COMPLETED, Reservation::STATUS_CANCELLED,
        ];

        $cars = Car::query()->get();
        if ($cars->isEmpty() || empty($customers)) {
            return;
        }

        for ($i = 0; $i < 60; $i++) {
            $car = $cars[$i % $cars->count()];
            $customer = $customers[$i % count($customers)];
            $days = 1 + ($i % 10);
            $start = now()->subDays(120 - $i)->setTime(10, 0);
            $end = (clone $start)->addDays($days);
            $base = $car->price_per_day * $days;
            $service = (int) config('services.platform.service_fee_kurus');
            $tax = (int) round($base * (config('services.platform.kdv_bps') / 10000));
            $total = $base + $service + $tax;

            Reservation::query()->create([
                'code' => 'RNV-' . (10000 + $i),
                'car_id' => $car->id,
                'company_id' => $car->company_id,
                'customer_id' => $customer->id,
                'pickup_at' => $start,
                'return_at' => $end,
                'pickup_location' => self::PICKUP_POINTS[$i % count(self::PICKUP_POINTS)],
                'days' => $days,
                'base_price' => $base,
                'extras_price' => 0,
                'discount_amount' => 0,
                'service_fee' => $service,
                'tax_amount' => $tax,
                'total_price' => $total,
                'currency_snapshot' => 'TRY',
                'fx_rate_snapshot' => 1,
                'status' => $statuses[$i % count($statuses)],
                'flight_number' => $i % 4 === 0 ? 'TK1234' : null,
            ]);
        }
    }
}
