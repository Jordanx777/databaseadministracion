<?php
// Backend/src/Controllers/SubcategoriasController.php

namespace App\Controllers;
use App\Models\SubcategoriasModel;
use App\Helpers\ResponseHelper;

class SubcategoriasController {
    private $subcategoriasModel;

    public function __construct() {
        $this->subcategoriasModel = new SubcategoriasModel();
    }

    /**
     * Obtener todas las subcategorías
     * GET /api/subcategorias
     */
    public function getAllSubcategorias() {
        try {
            $subcategorias = $this->subcategoriasModel->getAllSubcategorias();
            ResponseHelper::success($subcategorias, 'Subcategorías obtenidas exitosamente');
        } catch (\Exception $e) {
            ResponseHelper::error($e->getMessage(), 500);
        }
    }

    /**
     * Obtener subcategorías por ID de categoría
     * GET /api/subcategorias/categoria/{categoriaId}
     * ✅ CORREGIDO: Nombre del método más claro
     */
    public function getSubcategoriasPorCategoria(array $params) {
        try {
            $categoriaId = $params['categoriaId'] ?? null;
            
            error_log("ID de categoría recibido: " . $categoriaId);

            if (!$categoriaId) {
                ResponseHelper::error('ID de categoría no proporcionado', 400);
                return;
            }

            // ✅ CORREGIDO: Usar el método correcto
            $subcategorias = $this->subcategoriasModel->getSubcategoriasPorCategoria($categoriaId);
            
            error_log("Subcategorías encontradas: " . count($subcategorias));

            ResponseHelper::success($subcategorias, 'Subcategorías obtenidas exitosamente');
            
        } catch (\Exception $e) {
            ResponseHelper::error($e->getMessage(), 500);
        }
    }

    /**
     * Obtener una subcategoría por su ID
     * GET /api/subcategorias/{id}
     * ✅ NUEVO: Endpoint para obtener UNA subcategoría
     */
    public function getSubcategoriaById(array $params) {
        try {
            $id = $params['id'] ?? null;

            if (!$id) {
                ResponseHelper::error('ID no proporcionado', 400);
                return;
            }

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

    /**
     * Crear una nueva subcategoría
     * POST /api/subcategorias
     */
    public function createSubcategoria() {
        try {
            $data = json_decode(file_get_contents('php://input'), true);

            if (!isset($data['categoria_id']) || !isset($data['nombre'])) {
                ResponseHelper::error('Datos incompletos', 400);
                return;
            }

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

    /**
     * Actualizar una subcategoría
     * PUT /api/subcategorias/{id}
     */
    public function updateSubcategoria(array $params) {
        try {
            $id = $params['id'] ?? null;

            if (!$id) {
                ResponseHelper::error('ID no proporcionado', 400);
                return;
            }

            $data = json_decode(file_get_contents('php://input'), true);

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

    /**
     * Eliminar una subcategoría
     * DELETE /api/subcategorias/{id}
     */
    public function deleteSubcategoria(array $params) {
        try {
            $id = $params['id'] ?? null;

            if (!$id) {
                ResponseHelper::error('ID no proporcionado', 400);
                return;
            }

            $result = $this->subcategoriasModel->deleteSubcategoria($id);
            
            if ($result) {
                ResponseHelper::success(['id' => $id], 'Subcategoría eliminada exitosamente');
            } else {
                ResponseHelper::error('No se pudo eliminar la subcategoría');
            }
        } catch (\Exception $e) {
            ResponseHelper::error($e->getMessage(), 500);
        }
    }
}