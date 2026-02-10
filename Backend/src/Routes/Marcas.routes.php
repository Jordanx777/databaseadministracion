<?php
use App\Controllers\MarcasController;

$router->get('/api/marcas', [MarcasController::class, 'getAllMarcas']);
// $router->get('/api/marcas/{id}', [MarcasController::class, 'getMarcaById']);
// $router->post('/api/marcas', [MarcasController::class, 'createMarca']);
// $router->put('/api/marcas/{id}', [MarcasController::class, 'updateMarca']);
// $router->delete('/api/marcas/{id}', [MarcasController::class, 'deleteMarca']);
?>