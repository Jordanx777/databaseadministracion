<?
use App\Controllers\UsuariosController;

$router->get('/api/usuarios',[UsuariosController::class ,'getAll']);
$router->get('/api/usuarios/{id}',[UsuariosController::class ,'getById']);
$router->post('/api/usuarios/crear',[UsuariosController::class ,'create']);
$router->put('/api/usuarios/actualizar/{id}',[UsuariosController::class ,'update']);
$router->put('/api/usuarios/cambiarrol/{id}',[UsuariosController::class ,'changeRol']);
$router->put('/api/usuarios/toggle/{id}',[UsuariosController::class ,'toggleActivo']);
$router->delete('/api/usuarios/eliminar/{id}',[UsuariosController::class ,'delete']);

?>