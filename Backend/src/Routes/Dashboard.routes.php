<?php

use App\Controllers\DashboardController;

$router->get('/api/dashboard', [DashboardController::class,'getDashboardCompleto']);
$router->get('/api/dashboard/resumen', [DashboardController::class,'getResumenGeneral']);
$router->get('/api/dashboard/ventas', [DashboardController::class,'getProductosMasVendidos']);
$router->get('/api/dashboard/productos-mas-vendidos', [DashboardController::class,'getProductosMasVendidos']);
