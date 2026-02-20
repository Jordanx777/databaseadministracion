<?php
use App\Controllers\VentasController;

$router->post('/api/ventas', [VentasController::class, 'crear']);
$router->get('/api/ventas', [VentasController::class, 'obtenerTodas']);
$router->get('/api/ventas/{id}', [VentasController::class, 'obtenerPorId']);
$router->put('/api/ventas/{id}/cancelar', [VentasController::class, 'cancelar']);

?>