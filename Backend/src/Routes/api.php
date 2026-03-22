<?php
use App\Controllers\ProductoController;
use App\Core\Router;  
use App\Config\Database;
$db = Database::connect();

// Ruta de prueba
$router->get('/api/health', function() {
    // hago una llamada a la tabla rol en base datos para verificar la conexion
    global $db;
    $stmt = $db->query("SELECT * FROM rol LIMIT 1");
    $result = $stmt->fetch();
    if ($result) {
        echo json_encode([
            'status' => 'ok',
            'message' => 'Backend PHP funcionando 🚀 y conexión a DB exitosa',
            'datos' => $result
        ]);
    } else {
        http_response_code(500);
        echo json_encode([
            'status' => 'error',
            'message' => 'Error de conexión a la base de datos'
        ]);
    }
});

$router->get('/api/debug', function() {
    $host = $_ENV['DB_HOST'] ?? getenv('DB_HOST') ?? 'NO ENCONTRADO';
    $frontendUrl = $_ENV['FRONTEND_URL'] ?? getenv('FRONTEND_URL') ?? 'NO ENCONTRADO';
    $appEnv = $_ENV['APP_ENV'] ?? getenv('APP_ENV') ?? 'NO ENCONTRADO';
    
    echo json_encode([
        'DB_HOST' => $host,
        'FRONTEND_URL' => $frontendUrl,
        'APP_ENV' => $appEnv,
        'origin_recibido' => $_SERVER['HTTP_ORIGIN'] ?? 'ninguno',
    ]);
});


// Luego haz push, espera el redeploy, y visita en el navegador:

// https://inventario-backend-wrir.onrender.com/api/debug


// Registra una ruta GET
// $router->get('/api/productos', [ProductoController::class, 'index']);

// // Registra una ruta con parámetro dinámico {id}
// $router->get('/api/productos/{id}', [ProductoController::class, 'show']);