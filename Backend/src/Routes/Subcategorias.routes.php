<?php
use App\Controllers\SubcategoriasController;
$router->get('/api/subcategorias', [SubcategoriasController::class, 'getAllSubcategorias']);
?>