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


// Registra una ruta GET
// $router->get('/api/productos', [ProductoController::class, 'index']);

// // Registra una ruta con parámetro dinámico {id}
// $router->get('/api/productos/{id}', [ProductoController::class, 'show']);