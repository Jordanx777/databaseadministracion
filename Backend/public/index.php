<?php 
require_once __DIR__ . '/../vendor/autoload.php';

use App\Core\Router;
use App\Config\Cors;

// Cargar variables de entorno
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->load();

// Configurar CORS
Cors::handle();

// Headers
header("Content-Type: application/json; charset=UTF-8");

// Manejo de preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    // Inicializar router
    $router = new Router();
    
    // Cargar rutas
    require_once __DIR__ . '/../src/Routes/api.php';
    require_once __DIR__ . '/../src/Routes/Roles/Roles.php';
    require_once __DIR__ . '/../src/Routes/Auth/Auth.php';
    require_once __DIR__ . '/../src/Routes/Categorias.routes.php';
    require_once __DIR__ . '/../src/Routes/Marcas.routes.php';
    require_once __DIR__ . '/../src/Routes/Subcategorias.routes.php';
    require_once __DIR__ . '/../src/Routes/Proveedores.routes.php';
    require_once __DIR__ . '/../src/Routes/Productos.routes.php';
    require_once __DIR__ . '/../src/Routes/Clientes.router.php';
    require_once __DIR__ . '/../src/Routes/Ventas.routes.php';
    
    // Ejecutar router
    $router->run();
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Error interno del servidor',
        'error' => $_ENV['APP_DEBUG'] === 'true' ? $e->getMessage() : null
    ]);
}