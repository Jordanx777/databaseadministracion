<?php
namespace App\Controllers;
use App\Models\CategoriasModel;
use App\Helpers\ResponseHelper;

class CategoriasController {
    private $categoriasModel;

    public function __construct() {
        $this->categoriasModel = new CategoriasModel();
    }

    /**
     * Obtener todas las categorías
     * GET /api/categorias
     */
    public function getAllCategorias() {
        try {
            $categorias = $this->categoriasModel->getAllCategorias();
            ResponseHelper::success($categorias, 'Categorías obtenidas exitosamente');
        } catch (\Exception $e) {
            ResponseHelper::error($e->getMessage(), 500);
        }
    }

    /**
     * Obtener una categoría por ID
     * GET /api/categorias/{id}
     * ✅ CORREGIDO: Recibir parámetros correctamente
     */
    public function getCategoriaById(array $params) {
        try {
            $id = $params['id'] ?? null;

            if (!$id) {
                ResponseHelper::error('ID no proporcionado', 400);
                return;
            }

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

    /**
     * Crear una nueva categoría
     * POST /api/categorias
     * ✅ CORREGIDO: Leer JSON del body
     */
    public function createCategoria() {
        try {
            $data = json_decode(file_get_contents('php://input'), true);

            if (!isset($data['nombre'])) {
                ResponseHelper::error('El nombre es obligatorio', 400);
                return;
            }

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

    /**
     * Actualizar una categoría
     * PUT /api/categorias/{id}
     * ✅ CORREGIDO: Recibir parámetros y leer JSON
     */
    public function updateCategoria(array $params) {
        try {
            $id = $params['id'] ?? null;

            if (!$id) {
                ResponseHelper::error('ID no proporcionado', 400);
                return;
            }

            $data = json_decode(file_get_contents('php://input'), true);

            if (empty($data)) {
                ResponseHelper::error('No se enviaron datos para actualizar', 400);
                return;
            }

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

    /**
     * Eliminar una categoría
     * DELETE /api/categorias/{id}
     * ✅ CORREGIDO: Recibir parámetros correctamente
     */
    public function deleteCategoria(array $params) {
        try {
            $id = $params['id'] ?? null;

            if (!$id) {
                ResponseHelper::error('ID no proporcionado', 400);
                return;
            }

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