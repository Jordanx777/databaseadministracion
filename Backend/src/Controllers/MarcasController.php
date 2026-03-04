<?php

namespace App\Controllers;

use App\Models\MarcasModel;
use App\Helpers\ResponseHelper;

class MarcasController
{
    private $marcasModel;

    public function __construct()
    {
        $this->marcasModel = new MarcasModel();
    }

    public function getAllMarcas()
    {
        try {
            $marcas = $this->marcasModel->getAllMarcas();
            ResponseHelper::success($marcas, 'Marcas obtenidas exitosamente');
        } catch (\Exception $e) {
            ResponseHelper::error($e->getMessage(), 500);
        }
    }

    public function getMarcaById($id)
    {
        try {
            $marca = $this->marcasModel->getMarcaById($id);
            if ($marca) {
                ResponseHelper::success($marca, 'Marca obtenida exitosamente');
            } else {
                ResponseHelper::notFound('Marca no encontrada');
            }
        } catch (\Exception $e) {
            ResponseHelper::error($e->getMessage(), 500);
        }
    }

    public function createMarca()
    {
        try {
            $data = json_decode(file_get_contents('php://input'), true);
            $id = $this->marcasModel->createMarca($data);
            if ($id) {
                ResponseHelper::created(['id' => $id], 'Marca creada exitosamente');
            } else {
                ResponseHelper::error('No se pudo crear la marca');
            }
        } catch (\Exception $e) {
            ResponseHelper::error($e->getMessage(), 500);
        }
    }

    public function updateMarca(array $params)
    {
        try {
            $id = $params['id'] ?? NULL;

            $data = json_decode(file_get_contents('php://input'), true);

            $result = $this->marcasModel->updateMarca($id, $data);
            if ($result) {
                ResponseHelper::success(['id' => $id], 'Marca actualizada exitosamente');
            } else {
                ResponseHelper::error('No se pudo actualizar la marca');
            }
        } catch (\Exception $e) {
            ResponseHelper::error($e->getMessage(), 500);
        }
    }

    public function deleteMarca(array $params)
    {
        try {
            $id = $params['id'] ?? null;

            $result = $this->marcasModel->deleteMarca($id);
            if ($result) {
                ResponseHelper::success(['id' => $id], 'Marca eliminada exitosamente');
            } else {
                ResponseHelper::error('No se pudo eliminar la marca');
            }
        } catch (\Exception $e) {
            ResponseHelper::error($e->getMessage(), 500);
        }
    }
}
