<?php
namespace App\Controllers;
use App\Models\SubcategoriasModel;
use App\Helpers\ResponseHelper;

class SubcategoriasController {
    private $subcategoriasModel;

    public function __construct() {
        $this->subcategoriasModel = new SubcategoriasModel();
    }

    public function getAllSubcategorias() {
        try {
            $subcategorias = $this->subcategoriasModel->getAllSubcategorias();
            ResponseHelper::success($subcategorias, 'Subcategorías obtenidas exitosamente');
        } catch (\Exception $e) {
            ResponseHelper::error($e->getMessage(), 500);
        }
    }

    public function getSubcategoriaById($id) {
        try {
            $subcategoria = $this->subcategoriasModel->getSubcategoriaById($id);
            if ($subcategoria) {
                ResponseHelper::success($subcategoria, 'Subcategoría obtenida exitosamente');
            } else {
                ResponseHelper::notFound('Subcategoría no encontrada');
            }
        } catch (\Exception $e) {
            ResponseHelper::error($e->getMessage(), 500);
        }
    }

    public function createSubcategoria($data) {
        try {
            $id = $this->subcategoriasModel->createSubcategoria($data);
            if ($id) {
                ResponseHelper::created(['id' => $id], 'Subcategoría creada exitosamente');
            } else {
                ResponseHelper::error('No se pudo crear la subcategoría');
            }
        } catch (\Exception $e) {
            ResponseHelper::error($e->getMessage(), 500);
        }
    }

    public function updateSubcategoria($id, $data) {
        try {
            $result = $this->subcategoriasModel->updateSubcategoria($id, $data);
            if ($result) {
                ResponseHelper::success(['id' => $id], 'Subcategoría actualizada exitosamente');
            } else {
                ResponseHelper::error('No se pudo actualizar la subcategoría');
            }
        } catch (\Exception $e) {
            ResponseHelper::error($e->getMessage(), 500);
        }
    }
}