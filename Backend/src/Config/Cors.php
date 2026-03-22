<?php
/*namespace App\Config;

class Cors {
    public static function handle(): void {

        if ($_ENV['APP_ENV'] === 'development') {
            $allowedOrigins = array_map('trim', explode(',', $_ENV['FRONTEND_URL'] ?? 'http://localhost:4200'));
        } else {
            echo "url del front".$_ENV['FRONTEND_URL'];
            $allowedOrigins = array_map('trim', explode(',', $_ENV['FRONTEND_URL'] ?? 'https://inventario-frontend.vercel.app'));
        }

        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';

        if (in_array($origin, $allowedOrigins)) {
            header("Access-Control-Allow-Origin: $origin");
        } else {
            // Fallback en desarrollo — evita bloqueo total
            if ($_ENV['APP_ENV'] === 'development') {
                header("Access-Control-Allow-Origin: $origin");
            }
        }

        header("Access-Control-Allow-Credentials: true");
        header("Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS");
        header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
        header("Access-Control-Max-Age: 3600");
    }
}*/
namespace App\Config;

class Cors {
    public static function handle(): void {
        
        $appEnv = $_ENV['APP_ENV'] ?? getenv('APP_ENV') ?? 'production';
        $frontendUrl = $_ENV['FRONTEND_URL'] ?? getenv('FRONTEND_URL') ?? '';

        $allowedOrigins = array_map('trim', explode(',', $frontendUrl));

        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';

        if (in_array($origin, $allowedOrigins)) {
            header("Access-Control-Allow-Origin: $origin");
        } elseif ($appEnv === 'development') {
            header("Access-Control-Allow-Origin: $origin");
        }

        header("Access-Control-Allow-Credentials: true");
        header("Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS");
        header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
        header("Access-Control-Max-Age: 3600");
    }
}