<?php
use App\Controllers\ClientesController;

$router->get('/api/clientes', [ClientesController::class, 'getAllClientes']);
// $router->get('/api/clientes/{id}', [ClientesController::class, 'getClienteById']);
$router->post('/api/clientes/agregar', [ClientesController::class, 'createCliente']);
$router->get('/api/clientes/buscar', [ClientesController::class, 'searchClientes']);
$router->put('/api/clientes/actualizar/{id}', [ClientesController::class, 'updateCliente']);
$router->delete('/api/clientes/eliminar/{id}', [ClientesController::class, 'deleteCliente']);
// buscador por nombre de los clientes el enpoin http://localhost:8080/api/clientes/buscar?query= nombre

?>