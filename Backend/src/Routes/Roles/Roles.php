<?php
use App\Controllers\RolesController; 

$router->get('/api/roles', [RolesController::class, 'index']);