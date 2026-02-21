<?php
use App\Controllers\VentasController;

$router->post('/api/ventas', [VentasController::class, 'crear']);
$router->get('/api/ventas/completas', [VentasController::class, 'obtenerVentasCompletas']);
$router->get('/api/ventas/completas/{id}', [VentasController::class, 'obtenerVentaCompletaPorId']);
$router->put('/api/ventas/cancelar/{id}', [VentasController::class, 'cancelar']);

?>