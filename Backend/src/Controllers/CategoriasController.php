<?php
namespace App\Controllers;
use App\Models\CategoriasModel;
use App\Helpers\ResponseHelper;

class CategoriasController {
    private $categoriasModel;

    public function __construct() {
        $this->categoriasModel = new CategoriasModel();
    }

    public function getAllCategorias() {
        try {
            $categorias = $this->categoriasModel->getAllCategorias();
            ResponseHelper::success($categorias, 'Categorías obtenidas exitosamente');
        } catch (\Exception $e) {
            ResponseHelper::error($e->getMessage(), 500);
        }
    }

    public function getCategoriaById($id) {
        try {
            $categoria = $this->categoriasModel->getCategoriaById($id);
            if ($categoria) {
                ResponseHelper::success($categoria, 'Categoría obtenida exitosamente');
            } else {
                ResponseHelper::notFound('Categoría no encontrada');
            }
        } catch (\Exception $e) {
            ResponseHelper::error($e->getMessage(), 500);
        }
    }

    public function createCategoria($data) {
        try {
            $id = $this->categoriasModel->createCategoria($data);
            if ($id) {
                ResponseHelper::created(['id' => $id], 'Categoría creada exitosamente');
            } else {
                ResponseHelper::error('No se pudo crear la categoría');
            }
        } catch (\Exception $e) {
            ResponseHelper::error($e->getMessage(), 500);
        }
    }

    public function updateCategoria($id, $data) {
        try {
            $result = $this->categoriasModel->updateCategoria($id, $data);
            if ($result) {
                ResponseHelper::success(['id' => $id], 'Categoría actualizada exitosamente');
            } else {
                ResponseHelper::error('No se pudo actualizar la categoría');
            }
        } catch (\Exception $e) {
            ResponseHelper::error($e->getMessage(), 500);
        }
    }

    public function deleteCategoria($id) {
        try {
            $result = $this->categoriasModel->deleteCategoria($id);
            if ($result) {
                ResponseHelper::success(['id' => $id], 'Categoría eliminada exitosamente');
            } else {
                ResponseHelper::error('No se pudo eliminar la categoría');
            }
        } catch (\Exception $e) {
            ResponseHelper::error($e->getMessage(), 500);
        }
    }
}