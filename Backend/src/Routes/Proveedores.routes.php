<?php
use App\Controllers\ProveedoresController;

// GET - Obtener todos los proveedores
$router->get('/api/proveedores', [ProveedoresController::class, 'getAllProveedores']);

// GET - Obtener proveedor por ID
$router->get('/api/proveedores/{id}', [ProveedoresController::class, 'getProveedorById']);

// POST - Crear proveedor
$router->post('/api/proveedores', [ProveedoresController::class, 'crearProveedor']);

// PUT - Actualizar proveedor
$router->put('/api/proveedores/{id}', [ProveedoresController::class, 'updateProveedor']);

// DELETE - Eliminar proveedor
$router->delete('/api/proveedores/{id}', [ProveedoresController::class, 'deleteProveedor']);

// GET - Obtener proveedores activos
$router->get('/api/proveedores/activos', [ProveedoresController::class, 'getProveedoresActivos']);
?>