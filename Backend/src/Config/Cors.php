<?php
namespace App\Config;

class Cors {
    public static function handle(): void {
        if($_ENV['APP_ENV'] === 'development') {
            $allowedOrigins = explode(',', $_ENV['FRONTEND_URL'] ?? 'http://localhost:4200');
        } else {
                $allowedOrigins = explode(',', $_ENV['FRONTEND_URL'] ?? 'https://inventario-frontend.vercel.app');
            }

        // $allowedOrigins = explode(',', $_ENV['FRONTEND_URL'] ?? 'http://localhost:4200');
        
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
        
        if (in_array($origin, $allowedOrigins)) {
            header("Access-Control-Allow-Origin: $origin");
        }
        
        header("Access-Control-Allow-Credentials: true");
        header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
        header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
        header("Access-Control-Max-Age: 3600");
    }
}