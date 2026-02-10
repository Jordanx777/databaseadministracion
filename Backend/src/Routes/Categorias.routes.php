<?php
use App\Controllers\CategoriasController;

$router->get('/api/categorias', [CategoriasController::class, 'getAllCategorias']);
// $router->get('/api/categorias/{id}', [CategoriasController::class, 'getCategoriaById']);
// $router->post('/api/categorias', [CategoriasController::class, 'createCategoria']);
// $router->put('/api/categorias/{id}', [CategoriasController::class, 'updateCategoria']);
// $router->delete('/api/categorias/{id}', [CategoriasController::class, 'deleteCategoria']);
?>