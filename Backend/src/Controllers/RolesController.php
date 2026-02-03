<?php
namespace App\Controllers;

use App\Models\RolModel;

class RolesController {
    
    // GET /api/roles
    public function index(): void {
        try {
            $rolModel = new RolModel();
            $roles = $rolModel->getAllRoles();

            echo json_encode([
                'status' => 'success',
                'data' => $roles
            ]);
            
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode([
                'status' => 'error',
                'message' => 'Error al obtener los roles',
                'error' => $e->getMessage()
            ]);
        }
    }
    
    // GET /api/roles/{id} (Opcional)
    public function show(array $params): void {
        try {
            $id = $params['id'] ?? null;
            
            if (!$id) {
                http_response_code(400);
                echo json_encode([
                    'status' => 'error',
                    'message' => 'ID no proporcionado'
                ]);
                return;
            }
            
            $rolModel = new RolModel();
            $rol = $rolModel->getRolById($id);
            
            if ($rol) {
                echo json_encode([
                    'status' => 'success',
                    'data' => $rol
                ]);
            } else {
                http_response_code(404);
                echo json_encode([
                    'status' => 'error',
                    'message' => 'Rol no encontrado'
                ]);
            }
            
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode([
                'status' => 'error',
                'message' => 'Error al obtener el rol',
                'error' => $e->getMessage()
            ]);
        }
    }
}