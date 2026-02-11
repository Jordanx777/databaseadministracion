<?php 
use App\Controllers\ProductosController;
// GET - Obtener todos los productos
$router->get('/api/productos', [ProductosController::class, 'getAllProductos']);
$router->post('/api/CrearProductos', [ProductosController::class, 'crearProducto']);
?>