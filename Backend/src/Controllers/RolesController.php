<?php
namespace App\Controllers;

use App\Models\RolesModel;
use App\Helpers\ResponseHelper;

class RolesController {


    private $rolesModel;

    public function __construct()
    {
        $this->rolesModel = new RolesModel();
    }

    public function getAllRoles()
    {
        try {
            $roles = $this->rolesModel->getAllRoles();
            ResponseHelper::success($roles, 'Roles obtenidos exitosamente');
        } catch (\Exception $e) {
            ResponseHelper::error($e->getMessage(), 500);
        }
    }

    public function getRolById(array $params)
    {
        try {
            $id  = $params['id'] ?? null;
            $rol = $this->rolesModel->getRolById((int) $id);
            if ($rol) {
                ResponseHelper::success($rol, 'Rol obtenido exitosamente');
            } else {
                ResponseHelper::notFound('Rol no encontrado');
            }
        } catch (\Exception $e) {
            ResponseHelper::error($e->getMessage(), 500);
        }
    }

    public function createRol()
    {
        try {
            $data = json_decode(file_get_contents('php://input'), true);
            $id   = $this->rolesModel->createRol($data);

            if ($id) {
                ResponseHelper::created(['id' => $id], 'Rol creado exitosamente');
            } else {
                ResponseHelper::error('No se pudo crear el rol');
            }
        } catch (\Exception $e) {
            ResponseHelper::error($e->getMessage(), 500);
        }
    }

    public function updateRol(array $params)
    {
        try {
            $id   = $params['id'] ?? null;
            $data = json_decode(file_get_contents('php://input'), true);

            $result = $this->rolesModel->updateRol((int) $id, $data);
            if ($result) {
                ResponseHelper::success(['id' => $id], 'Rol actualizado exitosamente');
            } else {
                ResponseHelper::error('No se pudo actualizar el rol');
            }
        } catch (\Exception $e) {
            ResponseHelper::error($e->getMessage(), 500);
        }
    }

    public function deleteRol(array $params)
    {
        try {
            $id     = $params['id'] ?? null;
            $result = $this->rolesModel->deleteRol((int) $id);

            if ($result) {
                ResponseHelper::success(['id' => $id], 'Rol eliminado exitosamente');
            } else {
                ResponseHelper::error('No se pudo eliminar el rol');
            }
        } catch (\Exception $e) {
            ResponseHelper::error($e->getMessage(), 500);
        }
    }
}
