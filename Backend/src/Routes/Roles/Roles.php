<?php
use App\Controllers\RolesController; 

$router->get('/api/roles', [RolesController::class, 'getAllRoles']);
// $router->get('/api/roles/activos', [RolesController::class, 'getAllRoles']);
$router->get('/api/roles/{id}', [RolesController::class, 'getRolById']);
$router->post('/api/roles/crear', [RolesController::class, 'createRol']);
$router->put('/api/roles/actualizar/{id}', [RolesController::class, 'updateRol']);
$router->delete('/api/roles/eliminar/{id}',[RolesController::class, 'deleteRol']);

?>