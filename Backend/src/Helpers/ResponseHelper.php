<?php
// App/Helpers/ResponseHelper.php
namespace App\Helpers;

class ResponseHelper {
    
    public static function success($data = null, string $message = 'Operación exitosa', int $statusCode = 200) {
        http_response_code($statusCode);
        header('Content-Type: application/json');
        echo json_encode([
            'success' => true,
            'message' => $message,
            'data' => $data
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    public static function error(string $message = 'Error en la operación', int $statusCode = 400, $errors = null) {
        http_response_code($statusCode);
        header('Content-Type: application/json');
        echo json_encode([
            'success' => false,
            'message' => $message,
            'errors' => $errors
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    public static function created($data = null, string $message = 'Recurso creado exitosamente') {
        self::success($data, $message, 201);
    }

    public static function notFound(string $message = 'Recurso no encontrado') {
        self::error($message, 404);
    }

    public static function unauthorized(string $message = 'No autorizado') {
        self::error($message, 401);
    }

    public static function serverError(string $message = 'Error interno del servidor') {
        self::error($message, 500);
    }
}