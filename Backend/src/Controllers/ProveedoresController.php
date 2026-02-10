<?php
namespace App\Controllers;
use App\Models\ProveedoresModel;
use App\Helpers\ResponseHelper;

class ProveedoresController {
    private $proveedoresModel;

    public function __construct() {
        $this->proveedoresModel = new ProveedoresModel();
    }

    public function getAllProveedores() {
        try {
            $proveedores = $this->proveedoresModel->getAllProveedores();
            ResponseHelper::success($proveedores, 'Proveedores obtenidos exitosamente');
        } catch (\Exception $e) {
            ResponseHelper::error($e->getMessage(), 500);
        }
    }

    public function getProveedorById($id) {
        try {
            $proveedor = $this->proveedoresModel->getProveedorById($id);
            if ($proveedor) {
                ResponseHelper::success($proveedor, 'Proveedor obtenido exitosamente');
            } else {
                ResponseHelper::notFound('Proveedor no encontrado');
            }
        } catch (\Exception $e) {
            ResponseHelper::error($e->getMessage(), 500);
        }
    }

    public function crearProveedor()
{
    try {
        $data = json_decode(file_get_contents('php://input'), true);

        if (empty($data)) {
            ResponseHelper::error('No se recibieron datos para crear el proveedor', 400);
            return;
        }

        $camposRequeridos = ['nombre', 'nit', 'correo'];
        foreach ($camposRequeridos as $campo) {
            if (empty($data[$campo])) {
                ResponseHelper::error("El campo '$campo' es obligatorio", 400);
                return;
            }
        }

        $id = $this->proveedoresModel->createProveedor($data);

        if ($id) {
            ResponseHelper::created(['id' => $id], 'Proveedor creado exitosamente');
        } else {
            ResponseHelper::error('No se pudo crear el proveedor');
        }

    } catch (\Exception $e) {
        ResponseHelper::error($e->getMessage(), 500);
    }
}


    public function updateProveedor($id, $data) {
        try {
            // Validar que se recibieron datos
            if (empty($data)) {
                ResponseHelper::error('No se recibieron datos para actualizar el proveedor', 400);
                return;
            }

            $result = $this->proveedoresModel->updateProveedor($id, $data);
            if ($result) {
                ResponseHelper::success(['id' => $id], 'Proveedor actualizado exitosamente');
            } else {
                ResponseHelper::error('No se pudo actualizar el proveedor');
            }
        } catch (\Exception $e) {
            ResponseHelper::error($e->getMessage(), 500);
        }
    }

    public function deleteProveedor($id) {
        try {
            $result = $this->proveedoresModel->deleteProveedor($id);
            if ($result) {
                ResponseHelper::success(['id' => $id], 'Proveedor eliminado exitosamente');
            } else {
                ResponseHelper::error('No se pudo eliminar el proveedor');
            }
        } catch (\Exception $e) {
            ResponseHelper::error($e->getMessage(), 500);
        }
    }

    public function getProveedoresActivos() {
        try {
            $proveedores = $this->proveedoresModel->getProveedoresActivos();
            ResponseHelper::success($proveedores, 'Proveedores activos obtenidos exitosamente');
        } catch (\Exception $e) {
            ResponseHelper::error($e->getMessage(), 500);
        }
    }
}
?>