<?php
/**
 * Laravel front controller for /api/* routes.
 *
 * Lives at: public_html/_api.php (uploaded by deploy.sh).
 * The application code lives at /home/u273509288/renarvo/backend, OUTSIDE
 * the docroot (so .env, vendor, storage are not web-accessible).
 *
 * Apache .htaccess rewrites /api/(.*) to this script. Because this script is
 * at the docroot (not inside a subdirectory), Symfony's request introspection
 * sees BaseUrl="" and PathInfo="/api/v1/health", which lets Laravel match the
 * routes registered with the auto "api" prefix.
 */

use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

$base = '/home/u273509288/renarvo/backend';

if (file_exists($maintenance = $base.'/storage/framework/maintenance.php')) {
    require $maintenance;
}

require $base.'/vendor/autoload.php';

(require_once $base.'/bootstrap/app.php')
    ->handleRequest(Request::capture());
