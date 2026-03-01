<?php
use App\Controllers\SubcategoriasController;
// Rutas para subcategorías
$router->get('/api/subcategorias', [SubcategoriasController::class, 'getAllSubcategorias']);
//  Obtener subcategorías de una categoría específica
$router->get('/api/subcategorias/categoria/{categoriaId}', [SubcategoriasController::class, 'getSubcategoriasPorCategoria']);
// Obtener una subcategoría por su ID
$router->get('/api/subcategorias/{id}', [SubcategoriasController::class, 'getSubcategoriaById']);
$router->post('/api/subcategorias', [SubcategoriasController::class, 'createSubcategoria']);
$router->put('/api/subcategorias/{id}', [SubcategoriasController::class, 'updateSubcategoria']);
$router->delete('/api/subcategorias/{id}', [SubcategoriasController::class, 'deleteSubcategoria']);
?>