<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Intervention\Image\ImageManager;

class ImageUploadService
{
    private const SIZES = [
        'thumb' => 320,
        'medium' => 800,
        'large' => 1600,
    ];

    public function storeCarImage(UploadedFile $file, int $carId): string
    {
        $relativeDir = "cars/{$carId}";
        $name = Str::uuid()->toString();

        $manager = ImageManager::gd();
        $original = $manager->read($file->getPathname());

        foreach (self::SIZES as $size => $width) {
            $resized = $original->scaleDown(width: $width);
            $bytes = (string) $resized->toWebp(quality: 82);
            Storage::disk('uploads')->put("{$relativeDir}/{$name}-{$size}.webp", $bytes);
        }

        return "{$relativeDir}/{$name}";
    }

    public function deleteCarImage(string $path): void
    {
        foreach (array_keys(self::SIZES) as $size) {
            Storage::disk('uploads')->delete("{$path}-{$size}.webp");
        }
    }

    public function storeCompanyDocument(UploadedFile $file, int $companyId): string
    {
        $name = Str::uuid()->toString();
        $ext = $file->getClientOriginalExtension() ?: 'pdf';
        $relativePath = "companies/{$companyId}/{$name}.{$ext}";
        Storage::disk('documents')->put($relativePath, file_get_contents($file->getPathname()));

        return $relativePath;
    }
}
