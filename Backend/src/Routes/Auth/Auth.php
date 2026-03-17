<?php
use App\Controllers\AuthController;
use App\Controllers\UsuariosController;

$router->post('/api/auth/register', [AuthController::class, 'register']);
$router->post('/api/auth/login', [AuthController::class, 'login']);
$router->post('/api/auth/logout', [AuthController::class, 'logout']);
$router->get('/api/auth/me', [AuthController::class, 'me']); // Obtener usuario actual

$router->post('/api/auth/change-password', [UsuariosController::class, 'changePassword']);

?>