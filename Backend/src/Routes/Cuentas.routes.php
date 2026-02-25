<?php
use App\Controllers\CuentasController;

$router->get('/api/cuentas/por-cobrar', [CuentasController::class, 'listarCuentasPorCobrar']);
$router->get('/api/cuentas/activas', [CuentasController::class, 'listarCuentasActivas']);
$router->get('/api/cuentas/cliente/{clienteId}', [CuentasController::class, 'obtenerDeudaClienteRegistrado']);
$router->get('/api/cuentas/buscar', [CuentasController::class, 'buscarDeudaClienteOcasional']);
$router->get('/api/cuentas/historial/{clienteId}', [CuentasController::class, 'obtenerHistorialCliente']);
$router->get('/api/cuentas/historial/activos/{clienteId}', [CuentasController::class, 'obtenerHistorialClienteActivos']);
$router->get('/api/cuentas/resumen/{clienteId}', [CuentasController::class, 'obtenerResumenDeuda']);
?>