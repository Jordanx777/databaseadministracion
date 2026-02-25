<?php
use App\Controllers\PagosController;


//  Listar pagos de una venta
$router->get('/api/pagos/venta/{id}', [PagosController::class,'listarPorVenta']);
// Obtener un pago por ID
$router->get('/api/pagos/{id}', [PagosController::class,'obtenerPorId']);

$router->post('/api/pagos/crear', [PagosController::class,'registrar']);
// Eliminar un pago (por si se registró mal)
$router->delete('/api/pagos/eliminar/{id}', [PagosController::class,'eliminar']);

?>