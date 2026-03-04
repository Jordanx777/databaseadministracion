<?php
use App\Controllers\MarcasController;

$router->get('/api/marcas', [MarcasController::class, 'getAllMarcas']);
$router->get('/api/marcas/{id}', [MarcasController::class, 'getMarcaById']);
$router->post('/api/marcas/crear', [MarcasController::class, 'createMarca']);
$router->put('/api/marcas/actualizar/{id}', [MarcasController::class, 'updateMarca']);
$router->delete('/api/marcas/eliminar/{id}', [MarcasController::class, 'deleteMarca']);
?>