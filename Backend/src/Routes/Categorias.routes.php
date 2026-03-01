<?php
use App\Controllers\CategoriasController;

// Obtener todas las categorías
$router->get('/api/categorias', [CategoriasController::class, 'getAllCategorias']);
// Obtener una categoría por ID
$router->get('/api/categorias/{id}', [CategoriasController::class, 'getCategoriaById']);
// Crear categoría
$router->post('/api/categorias', [CategoriasController::class, 'createCategoria']);
// Actualizar categoría
$router->put('/api/categorias/{id}', [CategoriasController::class, 'updateCategoria']);
// Eliminar categoría
$router->delete('/api/categorias/{id}', [CategoriasController::class, 'deleteCategoria']);
?>