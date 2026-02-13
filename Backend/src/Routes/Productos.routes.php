<?php 
use App\Controllers\ProductosController;
// GET - Obtener todos los productos
$router->get('/api/productos', [ProductosController::class, 'getAllProductos']);
$router->post('/api/CrearProductos', [ProductosController::class, 'crearProducto']);
$router->get('/api/productos/{id}', [ProductosController::class, 'getProductoById']);
$router->put('/api/ActualizarProductos/{id}', [ProductosController::class, 'actualizarProducto']);
$router->delete('/api/deleteproductos/{id}', [ProductosController::class, 'deleteProducto']);
?>