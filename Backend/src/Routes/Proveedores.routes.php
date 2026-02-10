<?php
use App\Controllers\ProveedoresController;
$router->get('/api/proveedores', [ProveedoresController::class, 'getAllProveedores']);
?>